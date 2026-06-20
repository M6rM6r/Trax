import 'dart:convert';
import 'package:http/http' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8000/api',
  );

  String? _token;

  Future<String?> _getToken() async {
    if (_token != null) return _token;
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    return _token;
    }

  Future<void> _saveToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<Map<String, dynamic>> _request(
    String method,
    String endpoint, {
    Map<String, dynamic>? body,
  }) async {
    await _getToken();
    final url = Uri.parse('$baseUrl/$endpoint');

    http.Response response;
    switch (method) {
      case 'GET':
        response = await http.get(url, headers: _headers);
        break;
      case 'POST':
        response = await http.post(url, headers: _headers, body: jsonEncode(body));
        break;
      case 'PUT':
        response = await http.put(url, headers: _headers, body: jsonEncode(body));
        break;
      case 'DELETE':
        response = await http.delete(url, headers: _headers);
        break;
      default:
        throw ArgumentError('Unsupported method: $method');
    }

    final data = jsonDecode(response.body);

    if (response.statusCode == 401) {
      await clearToken();
      throw ApiException('Unauthorized', 401);
    }

    if (response.statusCode >= 400) {
      throw ApiException(
        data['message'] ?? 'Request failed',
        response.statusCode,
      );
    }

    return data;
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final data = await _request('POST', 'auth/login', body: {
      'email': email,
      'password': password,
    });
    if (data['data']?['token'] != null) {
      await _saveToken(data['data']['token']);
    }
    return data;
  }

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
