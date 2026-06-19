import "package:flutter/foundation.dart";
import "package:http/http.dart" as http;
import "dart:convert";

class AttendanceProvider extends ChangeNotifier {
  List<Map<String, dynamic>> _records = [];
  bool _isLoading = false;
  String? _error;
  String? _todayStatus;

  List<Map<String, dynamic>> get records => _records;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get todayStatus => _todayStatus;

  static const String _baseUrl = "http://localhost:8000/api";

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

  Future<bool> checkIn(String token, double lat, double lng, int? geofenceId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse("$_baseUrl/attendance/check-in"),
        headers: {
          "Authorization": "Bearer $token",
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: jsonEncode({
          "employee_id": 1,
          "lat": lat,
          "lng": lng,
          "geofence_id": geofenceId,
        }),
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

  Future<bool> checkOut(String token) async {
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
        body: jsonEncode({"employee_id": 1}),
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
