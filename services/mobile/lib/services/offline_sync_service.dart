import 'dart:async';
import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

import '../config/env.dart';

/// SQLite offline queue with single-flight sync, max retries, and Env base URL.
class OfflineSyncService {
  static final OfflineSyncService _instance = OfflineSyncService._internal();
  factory OfflineSyncService() => _instance;
  OfflineSyncService._internal();

  Database? _db;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;
  Future<void>? _syncInFlight;
  bool _started = false;

  static const String _tableName = "pending_actions";
  static const int _maxRetries = 8;
  static const Duration _httpTimeout = Duration(seconds: 20);

  static String get _baseUrl => Env.apiBaseUrl;

  Future<Database> get database async {
    _db ??= await _initDb();
    return _db!;
  }

  Future<Database> _initDb() async {
    final dbPath = await getDatabasesPath();
    return openDatabase(
      join(dbPath, "trax_offline.db"),
      version: 2,
      onCreate: (db, version) async {
        await db.execute("""
          CREATE TABLE $_tableName (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            endpoint TEXT NOT NULL,
            method TEXT NOT NULL,
            body TEXT NOT NULL,
            token TEXT,
            created_at TEXT NOT NULL,
            retry_count INTEGER DEFAULT 0,
            dedupe_key TEXT
          )
        """);
        await db.execute(
          "CREATE INDEX IF NOT EXISTS idx_pending_created ON $_tableName(created_at)",
        );
        await db.execute(
          "CREATE INDEX IF NOT EXISTS idx_pending_dedupe ON $_tableName(dedupe_key)",
        );
      },
      onUpgrade: (db, oldVersion, newVersion) async {
        if (oldVersion < 2) {
          try {
            await db.execute("ALTER TABLE $_tableName ADD COLUMN dedupe_key TEXT");
          } catch (_) {}
          await db.execute(
            "CREATE INDEX IF NOT EXISTS idx_pending_created ON $_tableName(created_at)",
          );
          await db.execute(
            "CREATE INDEX IF NOT EXISTS idx_pending_dedupe ON $_tableName(dedupe_key)",
          );
        }
      },
    );
  }

  /// Call once from app start: listen for reconnect and flush queue.
  Future<void> start() async {
    if (_started) return;
    _started = true;
    await database;
    _connectivitySub ??= Connectivity().onConnectivityChanged.listen((results) {
      final online = !results.contains(ConnectivityResult.none);
      if (online) {
        unawaited(syncPendingActions());
      }
    });
    if (await isOnline()) {
      unawaited(syncPendingActions());
    }
  }

  Future<void> dispose() async {
    await _connectivitySub?.cancel();
    _connectivitySub = null;
    _started = false;
  }

  Future<bool> isOnline() async {
    final result = await Connectivity().checkConnectivity();
    return !result.contains(ConnectivityResult.none);
  }

  Future<void> queueAction({
    required String endpoint,
    required String method,
    required Map<String, dynamic> body,
    String? token,
    String? dedupeKey,
  }) async {
    final db = await database;
    if (dedupeKey != null && dedupeKey.isNotEmpty) {
      await db.delete(
        _tableName,
        where: "dedupe_key = ?",
        whereArgs: [dedupeKey],
      );
    }
    await db.insert(_tableName, {
      "endpoint": endpoint,
      "method": method,
      "body": jsonEncode(body),
      "token": token,
      "created_at": DateTime.now().toIso8601String(),
      "retry_count": 0,
      "dedupe_key": dedupeKey,
    });
  }

  Future<List<Map<String, dynamic>>> getPendingActions() async {
    final db = await database;
    return db.query(_tableName, orderBy: "created_at ASC");
  }

  Future<void> syncPendingActions() {
    if (_syncInFlight != null) return _syncInFlight!;
    _syncInFlight = _syncPendingActionsImpl().whenComplete(() {
      _syncInFlight = null;
    });
    return _syncInFlight!;
  }

  Future<void> _syncPendingActionsImpl() async {
    if (!await isOnline()) return;

    final actions = await getPendingActions();
    if (actions.isEmpty) return;

    for (final action in actions) {
      final id = (action["id"] as num?)?.toInt();
      if (id == null) continue;

      final retries = (action["retry_count"] as num?)?.toInt() ?? 0;
      if (retries >= _maxRetries) {
        await _deleteAction(id);
        continue;
      }

      final success = await _sendAction(action);
      if (success) {
        await _deleteAction(id);
      } else {
        await _incrementRetry(id);
      }
    }
  }

  Future<bool> _sendAction(Map<String, dynamic> action) async {
    try {
      final endpoint = action["endpoint"]?.toString() ?? "";
      final path = endpoint.startsWith("http")
          ? endpoint
          : "$_baseUrl/${endpoint.replaceFirst(RegExp(r'^/+'), '')}";
      final url = Uri.parse(path);
      final headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };
      if (action["token"] != null && action["token"].toString().isNotEmpty) {
        headers["Authorization"] = "Bearer ${action["token"]}";
      }

      final body = action["body"] as String? ?? "{}";
      late http.Response response;

      switch (action["method"]?.toString().toUpperCase()) {
        case "POST":
          response = await http
              .post(url, headers: headers, body: body)
              .timeout(_httpTimeout);
          break;
        case "PUT":
          response = await http
              .put(url, headers: headers, body: body)
              .timeout(_httpTimeout);
          break;
        case "DELETE":
          response =
              await http.delete(url, headers: headers).timeout(_httpTimeout);
          break;
        default:
          return false;
      }

      // Idempotent success / already processed
      if (response.statusCode < 400) return true;
      if (response.statusCode == 409) return true;
      final lower = response.body.toLowerCase();
      if (lower.contains("already") || lower.contains("no open")) return true;
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<void> _deleteAction(int id) async {
    final db = await database;
    await db.delete(_tableName, where: "id = ?", whereArgs: [id]);
  }

  Future<void> _incrementRetry(int id) async {
    final db = await database;
    await db.rawUpdate(
      "UPDATE $_tableName SET retry_count = retry_count + 1 WHERE id = ?",
      [id],
    );
  }

  Future<int> pendingCount() async {
    final db = await database;
    final result =
        await db.rawQuery("SELECT COUNT(*) as count FROM $_tableName");
    return (result.first["count"] as num?)?.toInt() ?? 0;
  }

  Future<void> clearAll() async {
    final db = await database;
    await db.delete(_tableName);
  }
}
