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

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<void> logout() async {
    await _dio.post('/auth/logout');
  }

  Future<Map<String, dynamic>> getDashboardStats() async {
    final response = await _dio.get('/dashboard/stats');
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<List<dynamic>> getAttendanceHistory() async {
    final response = await _dio.get('/attendance');
    return response.data['data'] as List<dynamic>;
  }

  Future<Map<String, dynamic>> checkIn({
    required double lat,
    required double lng,
    int? batteryLevel,
  }) async {
    final response = await _dio.post('/attendance/check-in', data: {
      'lat': lat,
      'lng': lng,
      'battery_level': batteryLevel,
    });
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> checkOut({
    required double lat,
    required double lng,
  }) async {
    final response = await _dio.post('/attendance/check-out', data: {
      'lat': lat,
      'lng': lng,
    });
    return response.data['data'] as Map<String, dynamic>;
  }
}
