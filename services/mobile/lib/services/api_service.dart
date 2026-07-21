import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/env.dart';

class ApiService {
  static String get baseUrl => Env.apiBaseUrl;

  String? _token;

  Future<String?> _getToken() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      _token = await user.getIdToken(true);
      final prefs = await SharedPreferences.getInstance();
      if (_token != null) await prefs.setString('auth_token', _token!);
    }
    if (_token != null) return _token;
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    return _token;
  }

  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  Future<Map<String, String>> _headers() async => {
        'Content-Type': 'application/json',
        if ((await _getToken()) != null) 'Authorization': 'Bearer $_token',
      };

  Map<String, dynamic> _asMap(Object? value) {
    return value is Map<String, dynamic> ? value : <String, dynamic>{};
  }

  Future<Map<String, dynamic>> _request(
    String method,
    String endpoint, {
    Map<String, dynamic>? body,
  }) async {
    final headers = await _headers();
    final url = Uri.parse('$baseUrl/$endpoint');

    http.Response response;
    switch (method) {
      case 'GET':
        response = await http.get(url, headers: headers);
        break;
      case 'POST':
        response = await http.post(url, headers: headers, body: jsonEncode(body));
        break;
      case 'PUT':
        response = await http.put(url, headers: headers, body: jsonEncode(body));
        break;
      case 'DELETE':
        response = await http.delete(url, headers: headers);
        break;
      default:
        throw ArgumentError('Unsupported method: $method');
    }

    final data = _asMap(jsonDecode(response.body));

    if (response.statusCode == 401) {
      await clearToken();
      throw ApiException('Unauthorized', 401);
    }

    if (response.statusCode >= 400) {
      throw ApiException(
        data['message']?.toString() ?? 'Request failed',
        response.statusCode,
      );
    }

    return data;
  }

  /// Mobile auth is handled by [AuthProvider]; this helper is kept for compatibility.
  Future<Map<String, dynamic>> getProfile() => _request('GET', 'auth/me');

  Future<Map<String, dynamic>> checkIn({
    required double lat,
    required double lng,
    required int geofenceId,
  }) =>
      _request('POST', 'attendance/check-in', body: {
        'lat': lat,
        'lng': lng,
        'geofence_id': geofenceId,
      });

  Future<Map<String, dynamic>> getAttendanceHistory() => _request('GET', 'attendance');

  Future<Map<String, dynamic>> getDashboardStats() => _request('GET', 'dashboard/stats');
}

class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException(this.message, this.statusCode);

  @override
  String toString() => 'ApiException($statusCode): $message';
}
