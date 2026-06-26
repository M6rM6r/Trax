import "dart:convert";
import "package:sqflite/sqflite.dart";
import "package:path/path.dart";
import "package:connectivity_plus/connectivity_plus.dart";
import "package:http/http.dart" as http;

class OfflineSyncService {
  static final OfflineSyncService _instance = OfflineSyncService._internal();
  factory OfflineSyncService() => _instance;
  OfflineSyncService._internal();

  Database? _db;
  static const String _tableName = "pending_actions";
  static const String _baseUrl = "http://localhost:8000/api";

  Future<Database> get database async {
    _db ??= await _initDb();
    return _db!;
  }

  Future<Database> _initDb() async {
    final dbPath = await getDatabasesPath();
    return openDatabase(
      join(dbPath, "trax_offline.db"),
      version: 1,
      onCreate: (db, version) async {
        await db.execute("""
          CREATE TABLE $_tableName (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            endpoint TEXT NOT NULL,
            method TEXT NOT NULL,
            body TEXT NOT NULL,
            token TEXT,
            created_at TEXT NOT NULL,
            retry_count INTEGER DEFAULT 0
          )
        """);
      },
    );
  }

  Future<bool> isOnline() async {
    final result = await Connectivity().checkConnectivity();
    return result != ConnectivityResult.none;
  }

  Future<void> queueAction({
    required String endpoint,
    required String method,
    required Map<String, dynamic> body,
    String? token,
  }) async {
    final db = await database;
    await db.insert(_tableName, {
      "endpoint": endpoint,
      "method": method,
      "body": jsonEncode(body),
      "token": token,
      "created_at": DateTime.now().toIso8601String(),
      "retry_count": 0,
    });
  }

  Future<List<Map<String, dynamic>>> getPendingActions() async {
    final db = await database;
    return db.query(_tableName, orderBy: "created_at ASC");
  }

  Future<void> syncPendingActions() async {
    if (!await isOnline()) return;

    final actions = await getPendingActions();
    if (actions.isEmpty) return;

    for (final action in actions) {
      final success = await _sendAction(action);
      if (success) {
        await _deleteAction(action["id"]);
      } else {
        await _incrementRetry(action["id"]);
      }
    }
  }

  Future<bool> _sendAction(Map<String, dynamic> action) async {
    try {
      final url = Uri.parse("$_baseUrl/${action["endpoint"]}");
      final headers = {"Content-Type": "application/json", "Accept": "application/json"};
      if (action["token"] != null) {
        headers["Authorization"] = "Bearer ${action["token"]}";
      }

      final body = action["body"] as String;
      http.Response response;

      switch (action["method"]) {
        case "POST":
          response = await http.post(url, headers: headers, body: body);
          break;
        case "PUT":
          response = await http.put(url, headers: headers, body: body);
          break;
        case "DELETE":
          response = await http.delete(url, headers: headers);
          break;
        default:
          return false;
      }

      return response.statusCode < 400;
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
    final result = await db.rawQuery("SELECT COUNT(*) as count FROM $_tableName");
    return result.first["count"] as int;
  }

  Future<void> clearAll() async {
    final db = await database;
    await db.delete(_tableName);
  }
}
