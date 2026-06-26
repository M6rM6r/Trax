import "package:flutter/foundation.dart";
import "package:http/http.dart" as http;
import "dart:convert";
import "dart:math" show asin, cos, pi, sin, sqrt;
import "../config/env.dart";

class AttendanceProvider extends ChangeNotifier {
  List<Map<String, dynamic>> _records = [];
  bool _isLoading = false;
  String? _error;
  String? _todayStatus;

  List<Map<String, dynamic>> get records => _records;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get todayStatus => _todayStatus;

  static String get _baseUrl => Env.apiBaseUrl;

  Future<void> fetchHistory(String token) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.get(
        Uri.parse("$_baseUrl/attendance"),
        headers: {
          "Authorization": "Bearer $token",
          "Accept": "application/json",
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _records = List<Map<String, dynamic>>.from(data["data"] ?? []);
        _error = null;
      }
    } catch (e) {
      _error = "Failed to load history: $e";
    }

    _isLoading = false;
    notifyListeners();
  }

  static double _haversineDistanceMeters(
    double lat1, double lng1, double lat2, double lng2,
  ) {
    const r = 6371000.0;
    final dLat = (lat2 - lat1) * pi / 180;
    final dLng = (lng2 - lng1) * pi / 180;
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * pi / 180) * cos(lat2 * pi / 180) *
        sin(dLng / 2) * sin(dLng / 2);
    return r * 2 * asin(sqrt(a));
  }

  Future<int?> resolveNearestGeofence(String token, double lat, double lng) async {
    try {
      final response = await http.get(
        Uri.parse("$_baseUrl/geofences"),
        headers: {"Authorization": "Bearer $token", "Accept": "application/json"},
      );
      if (response.statusCode != 200) return null;
      final data = jsonDecode(response.body);
      final geofences = List<Map<String, dynamic>>.from(data["data"] ?? []);

      int? nearestId;
      double nearestDist = double.infinity;
      for (final g in geofences) {
        final gLat = (g["lat"] as num).toDouble();
        final gLng = (g["lng"] as num).toDouble();
        final radius = (g["radius"] as num).toDouble();
        final dist = _haversineDistanceMeters(lat, lng, gLat, gLng);
        if (dist <= radius && dist < nearestDist) {
          nearestDist = dist;
          nearestId = g["id"] as int?;
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
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final resolvedGeofenceId = geofenceId ?? await resolveNearestGeofence(token, lat, lng);

    if (resolvedGeofenceId == null) {
      _error = "لم يتم العثور على نطاق جغرافي قريب. تأكد من وجودك داخل نطاق العمل.";
      _isLoading = false;
      notifyListeners();
      return false;
    }

    try {
      final body = <String, dynamic>{
        "employee_id": employeeId,
        "lat": lat,
        "lng": lng,
        "geofence_id": resolvedGeofenceId,
      };
      if (batteryLevel != null) body["battery_level"] = batteryLevel;

      final response = await http.post(
        Uri.parse("$_baseUrl/attendance/check-in"),
        headers: {
          "Authorization": "Bearer $token",
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: jsonEncode(body),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 201 && data["success"] == true) {
        _todayStatus = data["data"]["status"];
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = data["message"] ?? "Check-in failed";
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = "Connection error: $e";
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> checkOut(String token, int employeeId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse("$_baseUrl/attendance/check-out"),
        headers: {
          "Authorization": "Bearer $token",
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: jsonEncode({"employee_id": employeeId}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data["success"] == true) {
        _todayStatus = "checked_out";
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = data["message"] ?? "Check-out failed";
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = "Connection error: $e";
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
