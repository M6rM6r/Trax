import "package:flutter/foundation.dart";
import "package:http/http.dart" as http;
import "dart:async";
import "dart:convert";
import "dart:math" show asin, cos, pi, sin, sqrt;
import "../config/env.dart";
import "../services/offline_sync_service.dart";

class AttendanceProvider extends ChangeNotifier {
  List<Map<String, dynamic>> _records = [];
  bool _isLoading = false;
  bool _actionInFlight = false;
  String? _error;
  String? _todayStatus;
  DateTime? _geofenceCacheAt;
  List<Map<String, dynamic>> _geofenceCache = [];

  static const Duration _httpTimeout = Duration(seconds: 20);
  static const Duration _geofenceTtl = Duration(minutes: 5);
  static const double _maxGpsAgeSeconds = 30;

  List<Map<String, dynamic>> get records => List.unmodifiable(_records);
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get todayStatus => _todayStatus;

  static String get _baseUrl => Env.apiBaseUrl;

  Map<String, dynamic> _asMap(Object? value) {
    return value is Map<String, dynamic> ? value : <String, dynamic>{};
  }

  List<Map<String, dynamic>> _asMapList(Object? value) {
    if (value is! List) return <Map<String, dynamic>>[];
    return value
        .whereType<Map<Object?, Object?>>()
        .map((item) => item.map((k, v) => MapEntry(k.toString(), v)))
        .map((m) => Map<String, dynamic>.from(m))
        .toList();
  }

  Future<void> fetchHistory(String token) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http
          .get(
            Uri.parse("$_baseUrl/attendance"),
            headers: {
              "Authorization": "Bearer $token",
              "Accept": "application/json",
            },
          )
          .timeout(_httpTimeout);

      if (response.statusCode == 200) {
        final data = _asMap(jsonDecode(response.body));
        _records = _asMapList(data["data"]);
        _error = null;
        _inferTodayStatusFromRecords();
      } else if (response.statusCode == 401) {
        _error = "Session expired. Please sign in again.";
      } else {
        _error = "Failed to load history (${response.statusCode})";
      }
    } on TimeoutException {
      _error = "History request timed out";
    } catch (e) {
      _error = "Failed to load history: $e";
    }

    _isLoading = false;
    notifyListeners();
  }

  void _inferTodayStatusFromRecords() {
    if (_records.isEmpty) return;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    for (final r in _records) {
      final raw = r["date"]?.toString() ??
          r["check_in"]?.toString() ??
          r["checkIn"]?.toString() ??
          r["created_at"]?.toString();
      if (raw == null) continue;
      DateTime? dt;
      try {
        dt = DateTime.tryParse(raw);
      } catch (_) {}
      if (dt == null) continue;
      final d = DateTime(dt.year, dt.month, dt.day);
      if (d != today) continue;
      final status = r["status"]?.toString().toLowerCase();
      final hasOut = r["check_out"] != null ||
          r["checkOut"] != null ||
          status == "checked_out" ||
          status == "completed";
      if (hasOut) {
        _todayStatus = "checked_out";
      } else if (status == "late") {
        _todayStatus = "late";
      } else {
        _todayStatus = status == "present" || status == "on_time"
            ? "present"
            : (status ?? "present");
      }
      break;
    }
  }

  static double _haversineDistanceMeters(
    double lat1,
    double lng1,
    double lat2,
    double lng2,
  ) {
    const r = 6371000.0;
    final dLat = (lat2 - lat1) * pi / 180;
    final dLng = (lng2 - lng1) * pi / 180;
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * pi / 180) *
            cos(lat2 * pi / 180) *
            sin(dLng / 2) *
            sin(dLng / 2);
    return r * 2 * asin(sqrt(a));
  }

  Future<List<Map<String, dynamic>>> _loadGeofences(String token) async {
    final now = DateTime.now();
    if (_geofenceCache.isNotEmpty &&
        _geofenceCacheAt != null &&
        now.difference(_geofenceCacheAt!) < _geofenceTtl) {
      return _geofenceCache;
    }

    final response = await http
        .get(
          Uri.parse("$_baseUrl/geofences"),
          headers: {
            "Authorization": "Bearer $token",
            "Accept": "application/json",
          },
        )
        .timeout(_httpTimeout);

    if (response.statusCode != 200) return _geofenceCache;
    final data = _asMap(jsonDecode(response.body));
    _geofenceCache = _asMapList(data["data"]);
    _geofenceCacheAt = now;
    return _geofenceCache;
  }

  Future<int?> resolveNearestGeofence(
    String token,
    double lat,
    double lng,
  ) async {
    try {
      final geofences = await _loadGeofences(token);
      int? nearestId;
      double nearestDist = double.infinity;
      for (final g in geofences) {
        final gLat = (g["lat"] as num?)?.toDouble();
        final gLng = (g["lng"] as num?)?.toDouble();
        final radius = (g["radius"] as num?)?.toDouble();
        if (gLat == null || gLng == null || radius == null) continue;
        final dist = _haversineDistanceMeters(lat, lng, gLat, gLng);
        if (dist <= radius && dist < nearestDist) {
          nearestDist = dist;
          final id = g["id"];
          nearestId = id is int ? id : (id as num?)?.toInt();
        }
      }
      return nearestId;
    } catch (_) {
      return null;
    }
  }

  Future<bool> checkIn(
    String token,
    int employeeId,
    double lat,
    double lng,
    int? geofenceId, {
    int? batteryLevel,
    double? accuracy,
    DateTime? locationTimestamp,
  }) async {
    if (_actionInFlight) {
      _error = "Request already in progress";
      notifyListeners();
      return false;
    }
    if (employeeId <= 0) {
      _error = "Missing employee profile. Sign in again.";
      notifyListeners();
      return false;
    }
    if (locationTimestamp != null) {
      final age = DateTime.now().difference(locationTimestamp).inSeconds.abs();
      if (age > _maxGpsAgeSeconds) {
        _error = "Location is stale. Refresh GPS and try again.";
        notifyListeners();
        return false;
      }
    }
    if (accuracy != null && accuracy > 80) {
      _error = "GPS accuracy too low (±${accuracy.toStringAsFixed(0)}m). Move outdoors.";
      notifyListeners();
      return false;
    }

    _actionInFlight = true;
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final resolvedGeofenceId =
          geofenceId ?? await resolveNearestGeofence(token, lat, lng);

      if (resolvedGeofenceId == null) {
        _error =
            "لم يتم العثور على نطاق جغرافي قريب. تأكد من وجودك داخل نطاق العمل.";
        return false;
      }

      final body = <String, dynamic>{
        "employee_id": employeeId,
        "lat": lat,
        "lng": lng,
        "geofence_id": resolvedGeofenceId,
      };
      if (batteryLevel != null) body["battery_level"] = batteryLevel;
      if (accuracy != null) body["accuracy"] = accuracy;

      final offline = OfflineSyncService();
      if (!await offline.isOnline()) {
        await offline.queueAction(
          endpoint: "attendance/check-in",
          method: "POST",
          body: body,
          token: token,
          dedupeKey: "checkin-$employeeId",
        );
        _todayStatus = "present";
        _error = null;
        return true;
      }

      final response = await http
          .post(
            Uri.parse("$_baseUrl/attendance/check-in"),
            headers: {
              "Authorization": "Bearer $token",
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: jsonEncode(body),
          )
          .timeout(_httpTimeout);

      final data = _asMap(
        response.body.isNotEmpty ? jsonDecode(response.body) : null,
      );
      final payload = _asMap(data["data"]);

      if ((response.statusCode == 201 || response.statusCode == 200) &&
          (data["success"] == true || data["success"] == null)) {
        _todayStatus = payload["status"]?.toString() ?? "present";
        _error = null;
        return true;
      }

      final msg = data["message"]?.toString() ?? "";
      if (msg.toLowerCase().contains("already") || response.statusCode == 409) {
        _todayStatus = payload["status"]?.toString() ?? "present";
        _error = null;
        return true;
      }

      _error = msg.isNotEmpty ? msg : "Check-in failed (${response.statusCode})";
      return false;
    } on TimeoutException {
      _error = "Check-in timed out";
      return false;
    } catch (e) {
      // Network blip → queue for later
      try {
        await OfflineSyncService().queueAction(
          endpoint: "attendance/check-in",
          method: "POST",
          body: {
            "employee_id": employeeId,
            "lat": lat,
            "lng": lng,
            if (geofenceId != null) "geofence_id": geofenceId,
            if (batteryLevel != null) "battery_level": batteryLevel,
          },
          token: token,
          dedupeKey: "checkin-$employeeId",
        );
        _todayStatus = "present";
        _error = null;
        return true;
      } catch (_) {
        _error = "Connection error: $e";
        return false;
      }
    } finally {
      _actionInFlight = false;
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> checkOut(
    String token,
    int employeeId, {
    double? lat,
    double? lng,
  }) async {
    if (_actionInFlight) {
      _error = "Request already in progress";
      notifyListeners();
      return false;
    }
    if (employeeId <= 0) {
      _error = "Missing employee profile. Sign in again.";
      notifyListeners();
      return false;
    }

    _actionInFlight = true;
    _isLoading = true;
    _error = null;
    notifyListeners();

    final body = <String, dynamic>{"employee_id": employeeId};
    if (lat != null) body["lat"] = lat;
    if (lng != null) body["lng"] = lng;

    try {
      final offline = OfflineSyncService();
      if (!await offline.isOnline()) {
        await offline.queueAction(
          endpoint: "attendance/check-out",
          method: "POST",
          body: body,
          token: token,
          dedupeKey: "checkout-$employeeId",
        );
        _todayStatus = "checked_out";
        return true;
      }

      final response = await http
          .post(
            Uri.parse("$_baseUrl/attendance/check-out"),
            headers: {
              "Authorization": "Bearer $token",
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: jsonEncode(body),
          )
          .timeout(_httpTimeout);

      final data = _asMap(
        response.body.isNotEmpty ? jsonDecode(response.body) : null,
      );

      if (response.statusCode == 200 &&
          (data["success"] == true || data["success"] == null)) {
        _todayStatus = "checked_out";
        _error = null;
        return true;
      }

      final msg = data["message"]?.toString() ?? "";
      if (msg.toLowerCase().contains("already") ||
          msg.toLowerCase().contains("no open")) {
        _todayStatus = "checked_out";
        _error = null;
        return true;
      }

      _error = msg.isNotEmpty ? msg : "Check-out failed (${response.statusCode})";
      return false;
    } on TimeoutException {
      _error = "Check-out timed out";
      return false;
    } catch (e) {
      try {
        await OfflineSyncService().queueAction(
          endpoint: "attendance/check-out",
          method: "POST",
          body: body,
          token: token,
          dedupeKey: "checkout-$employeeId",
        );
        _todayStatus = "checked_out";
        return true;
      } catch (_) {
        _error = "Connection error: $e";
        return false;
      }
    } finally {
      _actionInFlight = false;
      _isLoading = false;
      notifyListeners();
    }
  }
}

