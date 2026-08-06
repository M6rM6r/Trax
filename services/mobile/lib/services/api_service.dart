import 'dart:async';
import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config/env.dart';

class ApiService {
  static String get baseUrl => Env.apiBaseUrl;
  static const Duration timeout = Duration(seconds: 20);

  String? _token;

  Future<String?> _getToken() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      try {
        _token = await user.getIdToken(true).timeout(const Duration(seconds: 15));
        final prefs = await SharedPreferences.getInstance();
        if (_token != null) await prefs.setString('auth_token', _token!);
      } catch (_) {}
    }
    if (_token != null && _token!.isNotEmpty) return _token;
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
        'Accept': 'application/json',
        if ((await _getToken()) != null && _token!.isNotEmpty)
          'Authorization': 'Bearer $_token',
      };

  Map<String, dynamic> _asMap(Object? value) {
    return value is Map<String, dynamic> ? value : <String, dynamic>{};
  }

  Future<Map<String, dynamic>> _request(
    String method,
    String endpoint, {
    Map<String, dynamic>? body,
  }) async {
    // Light single-flight: avoid stampeding identical concurrent GETs later if needed
    final headers = await _headers();
    final clean = endpoint.replaceFirst(RegExp(r'^/+'), '');
    final url = Uri.parse('$baseUrl/$clean');

    http.Response response;
    try {
      switch (method) {
        case 'GET':
          response = await http.get(url, headers: headers).timeout(timeout);
          break;
        case 'POST':
          response = await http
              .post(url, headers: headers, body: jsonEncode(body))
              .timeout(timeout);
          break;
        case 'PUT':
          response = await http
              .put(url, headers: headers, body: jsonEncode(body))
              .timeout(timeout);
          break;
        case 'DELETE':
          response = await http.delete(url, headers: headers).timeout(timeout);
          break;
        default:
          throw ArgumentError('Unsupported method: $method');
      }
    } on TimeoutException {
      throw ApiException('Request timed out', 408);
    }

    Map<String, dynamic> data = <String, dynamic>{};
    try {
      if (response.body.isNotEmpty) {
        data = _asMap(jsonDecode(response.body));
      }
    } catch (_) {}

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

  Future<Map<String, dynamic>> getProfile() => _request('GET', 'auth/me');

  Future<Map<String, dynamic>> checkIn({
    required double lat,
    required double lng,
    required int geofenceId,
    int? employeeId,
    int? batteryLevel,
  }) {
    final body = <String, dynamic>{
      'lat': lat,
      'lng': lng,
      'geofence_id': geofenceId,
    };
    if (employeeId != null) body['employee_id'] = employeeId;
    if (batteryLevel != null) body['battery_level'] = batteryLevel;
    return _request('POST', 'attendance/check-in', body: body);
  }

  Future<Map<String, dynamic>> checkOut({int? employeeId}) {
    final body = <String, dynamic>{};
    if (employeeId != null) body['employee_id'] = employeeId;
    return _request('POST', 'attendance/check-out', body: body);
  }

  Future<Map<String, dynamic>> getAttendanceHistory() =>
      _request('GET', 'attendance');

  Future<Map<String, dynamic>> getGeofences() => _request('GET', 'geofences');

  Future<Map<String, dynamic>> getDashboardStats() =>
      _request('GET', 'dashboard/stats');

  Future<Map<String, dynamic>> postLocation(Map<String, dynamic> body) =>
      _request('POST', 'tracking/location', body: body);
}

class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException(this.message, this.statusCode);

  @override
  String toString() => 'ApiException($statusCode): $message';
}

