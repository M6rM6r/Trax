import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_background_geolocation/flutter_background_geolocation.dart'
    as bg;
import 'package:shared_preferences/shared_preferences.dart';

/// Live map spine: `locations/{employeeId}` only — same docs as the web dashboard.
class BackgroundTrackingService {
  static final BackgroundTrackingService _instance =
      BackgroundTrackingService._internal();

  factory BackgroundTrackingService() => _instance;

  BackgroundTrackingService._internal();

  bool _initialized = false;
  bool _isRunning = false;
  String? _employeeName;
  String? _companyId;
  DateTime? _lastWriteAt;
  static const Duration _minWriteInterval = Duration(seconds: 8);

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
          title: 'Trax',
          text: 'Location tracking for attendance',
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

  Future<void> start({
    required String employeeId,
    String? employeeName,
    String? companyId,
  }) async {
    await initialize();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('tracking_employee_id', employeeId);
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

    final employeeId = prefs.getString('tracking_employee_id');
    if (employeeId != null && employeeId.isNotEmpty) {
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
      _employeeName = prefs.getString('tracking_employee_name');
      _companyId = prefs.getString('tracking_company_id');
    }
  }

  @pragma('vm:entry-point')
  Future<void> headlessLocationHandler(bg.HeadlessEvent headlessEvent) async {
    if (headlessEvent.name == bg.Event.LOCATION) {
      final location = headlessEvent.event as bg.Location;
      await _postLocationUpdate(location);
    }
  }

  void _onLocation(bg.Location location) {
    unawaited(_postLocationUpdate(location));
  }

  void _onLocationError(bg.LocationError error) {}

  void _onMotionChange(bg.Location location) {
    unawaited(_postLocationUpdate(location));
  }

  void _onProviderChange(bg.ProviderChangeEvent event) {}

  Future<void> _postLocationUpdate(bg.Location location) async {
    try {
      final now = DateTime.now();
      if (_lastWriteAt != null &&
          now.difference(_lastWriteAt!) < _minWriteInterval) {
        return;
      }
      _lastWriteAt = now;

      final prefs = await SharedPreferences.getInstance();
      var employeeId = prefs.getString('tracking_employee_id');
      if (employeeId == null || employeeId.isEmpty) {
        try {
          final legacy = prefs.getInt('tracking_employee_id');
          if (legacy != null) employeeId = legacy.toString();
        } catch (_) {}
      }
      if (employeeId == null || employeeId.isEmpty) return;

      await _updateFirestoreLocation(
        employeeId: employeeId,
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy,
        status: 'online',
      );
    } catch (_) {}
  }

  Future<void> _updateFirestoreLocation({
    required String employeeId,
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
      final employeeName =
          _employeeName ?? prefs.getString('tracking_employee_name') ?? '';

      final data = <String, dynamic>{
        'employeeId': employeeId,
        'name': employeeName,
        'status': status,
        'lastSeen': DateTime.now().toIso8601String(),
        'updatedAt': FieldValue.serverTimestamp(),
        'ownerUid': user.uid,
        'source': 'mobile',
      };
      if (companyId != null) data['company_id'] = companyId;
      if (lat != null) data['lat'] = lat;
      if (lng != null) data['lng'] = lng;
      if (accuracy != null) data['accuracy'] = accuracy;

      await FirebaseFirestore.instance
          .collection('locations')
          .doc(employeeId)
          .set(data, SetOptions(merge: true));
    } catch (_) {}
  }
}
