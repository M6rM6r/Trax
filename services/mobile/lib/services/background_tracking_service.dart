import 'dart:convert';

import 'package:flutter_background_geolocation/flutter_background_geolocation.dart'
    as bg;
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/env.dart';

class BackgroundTrackingService {
  static final BackgroundTrackingService _instance =
      BackgroundTrackingService._internal();

  factory BackgroundTrackingService() => _instance;

  BackgroundTrackingService._internal();

  bool _initialized = false;
  bool _isRunning = false;
  String? _employeeName;
  String? _companyId;

  bool get isRunning => _isRunning;

  Future<void> initialize() async {
    if (_initialized) return;

    await bg.BackgroundGeolocation.ready(
      bg.Config(
        desiredAccuracy: bg.Config.DESIRED_ACCURACY_HIGH,
        distanceFilter: 10.0,
        stopOnTerminate: false,
        startOnBoot: false,
        enableHeadless: true,
        foregroundService: true,
        notification: bg.Notification(
          title: 'Trax موقع الموظف',
          text: 'يتم تتبع موقعك لأغراض الحضور والسلامة',
          channelName: 'Trax Location Tracking',
        ),
        debug: false,
        logLevel: bg.Config.LOG_LEVEL_OFF,
        url: null,
        autoSync: false,
      ),
    );

    bg.BackgroundGeolocation.onLocation(_onLocation, _onLocationError);
    bg.BackgroundGeolocation.onMotionChange(_onMotionChange);
    bg.BackgroundGeolocation.onProviderChange(_onProviderChange);

    _initialized = true;
  }

  Future<void> start({required int employeeId, String? employeeName, String? companyId}) async {
    await initialize();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('tracking_employee_id', employeeId);
    await prefs.setBool('tracking_enabled', true);
    if (employeeName != null) {
      await prefs.setString('tracking_employee_name', employeeName);
      _employeeName = employeeName;
    } else {
      _employeeName = prefs.getString('tracking_employee_name');
    }
    if (companyId != null) {
      await prefs.setString('tracking_company_id', companyId);
      _companyId = companyId;
    } else {
      _companyId = prefs.getString('tracking_company_id');
    }

    await bg.BackgroundGeolocation.start();
    _isRunning = true;
  }

  Future<void> stop() async {
    await bg.BackgroundGeolocation.stop();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('tracking_enabled', false);

    _isRunning = false;

    // Mark employee as offline in Firestore
    final employeeId = prefs.getInt('tracking_employee_id');
    if (employeeId != null) {
      await _updateFirestoreLocation(
        employeeId: employeeId,
        lat: null,
        lng: null,
        accuracy: null,
        status: 'offline',
      );
    }
  }

  Future<void> restoreStateIfNeeded() async {
    final prefs = await SharedPreferences.getInstance();
    final enabled = prefs.getBool('tracking_enabled') ?? false;
    if (enabled) {
      await initialize();
      await bg.BackgroundGeolocation.start();
      _isRunning = true;
    }
  }

  /// Called by the OS when the app is terminated on Android.
  @pragma('vm:entry-point')
  Future<void> headlessLocationHandler(bg.HeadlessEvent headlessEvent) async {
    if (headlessEvent.name == bg.Event.LOCATION) {
      final location = headlessEvent.event as bg.Location;
      await _postLocationUpdate(location);
    }
  }

  void _onLocation(bg.Location location) {
    _postLocationUpdate(location);
  }

  void _onLocationError(bg.LocationError error) {
    // Silently ignore transient GPS errors to avoid spam.
  }

  void _onMotionChange(bg.Location location) {
    _postLocationUpdate(location);
  }

  void _onProviderChange(bg.ProviderChangeEvent event) {
    // Could surface permission issues to the UI if needed.
  }

  Future<void> _postLocationUpdate(bg.Location location) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final employeeId = prefs.getInt('tracking_employee_id');

      if (employeeId == null) return;

      // Write directly to Firestore for real-time dashboard updates
      await _updateFirestoreLocation(
        employeeId: employeeId,
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy,
        status: 'online',
      );

      // Also send to Laravel API for server-side processing
      String? token = await _freshToken();
      if (token == null || token.isEmpty) {
        token = prefs.getString('auth_token');
      }
      if (token == null || token.isEmpty) return;

      final coords = location.coords;
      final body = jsonEncode(<String, dynamic>{
        'employee_id': employeeId,
        'lat': coords.latitude,
        'lng': coords.longitude,
        'accuracy': coords.accuracy,
        'timestamp': DateTime.now().toIso8601String(),
      });

      await http.post(
        Uri.parse('${Env.apiBaseUrl}/tracking/location'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
        body: body,
      );
    } catch (_) {
      // Offline tolerance: Firestore will sync when connectivity returns.
    }
  }

  Future<void> _updateFirestoreLocation({
    required int employeeId,
    double? lat,
    double? lng,
    double? accuracy,
    String status = 'online',
  }) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return;

      final prefs = await SharedPreferences.getInstance();
      final companyId = _companyId ?? prefs.getString('tracking_company_id');
      final employeeName = _employeeName ?? prefs.getString('tracking_employee_name') ?? '';

      final data = <String, dynamic>{
        'employeeId': employeeId.toString(),
        'name': employeeName,
        'status': status,
        'lastSeen': DateTime.now().toIso8601String(),
        'ownerUid': user.uid,
      };
      if (companyId != null) data['company_id'] = companyId;
      if (lat != null) data['lat'] = lat;
      if (lng != null) data['lng'] = lng;
      if (accuracy != null) data['accuracy'] = accuracy;

      await FirebaseFirestore.instance
          .collection('locations')
          .doc(employeeId.toString())
          .set(data, SetOptions(merge: true));
    } catch (_) {
      // Firestore write failed — non-critical, will retry on next location update
    }
  }

  /// Try to refresh the Firebase ID token from the current user.
  Future<String?> _freshToken() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return null;
    try {
      final token = await user.getIdToken(true);
      final prefs = await SharedPreferences.getInstance();
      if (token != null) await prefs.setString('auth_token', token);
      return token;
    } catch (_) {
      return null;
    }
  }
}
