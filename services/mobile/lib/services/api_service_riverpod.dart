import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/env.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: Env.apiBaseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 15),
    sendTimeout: const Duration(seconds: 10),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) {
      final token = ref.read(authTokenProvider);
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      handler.next(options);
    },
    onError: (error, handler) {
      if (error.response?.statusCode == 401) {
        ref.read(authTokenProvider.notifier).state = null;
      }
      handler.next(error);
    },
  ));

  return dio;
});

final authTokenProvider = StateProvider<String?>((ref) => null);

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService(ref.read(dioProvider));
});

class ApiService {
  final Dio _dio;

  ApiService(this._dio);

  Map<String, dynamic> _asMap(Object? value) {
    return value is Map<String, dynamic> ? value : <String, dynamic>{};
  }

  List<dynamic> _asList(Object? value) {
    return value is List ? value : <dynamic>[];
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post<Map<String, dynamic>>('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return _asMap(_asMap(response.data)['data']);
  }

  Future<void> logout() async {
    await _dio.post<Map<String, dynamic>>('/auth/logout');
  }

  Future<Map<String, dynamic>> getDashboardStats() async {
    final response = await _dio.get<Map<String, dynamic>>('/dashboard/stats');
    return _asMap(_asMap(response.data)['data']);
  }

  Future<List<dynamic>> getAttendanceHistory() async {
    final response = await _dio.get<Map<String, dynamic>>('/attendance');
    return _asList(_asMap(response.data)['data']);
  }

  Future<Map<String, dynamic>> checkIn({
    required double lat,
    required double lng,
    int? batteryLevel,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>('/attendance/check-in', data: {
      'lat': lat,
      'lng': lng,
      'battery_level': batteryLevel,
    });
    return _asMap(_asMap(response.data)['data']);
  }

  Future<Map<String, dynamic>> checkOut({
    required double lat,
    required double lng,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>('/attendance/check-out', data: {
      'lat': lat,
      'lng': lng,
    });
    return _asMap(_asMap(response.data)['data']);
  }
}
