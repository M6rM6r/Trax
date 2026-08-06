import "package:flutter/foundation.dart";
import "package:geolocator/geolocator.dart";
import "package:permission_handler/permission_handler.dart";
import "dart:async";

import "../services/background_tracking_service.dart";

class LocationProvider extends ChangeNotifier {
  double? _lat;
  double? _lng;
  double? _accuracy;
  DateTime? _locationAt;
  bool _isTracking = false;
  String? _error;
  StreamSubscription<Position>? _positionSub;
  bool _getting = false;

  static const Duration _gpsTimeout = Duration(seconds: 15);

  double? get lat => _lat;
  double? get lng => _lng;
  double? get accuracy => _accuracy;
  DateTime? get locationAt => _locationAt;
  bool get isTracking => _isTracking;
  String? get error => _error;

  bool isFresh({Duration maxAge = const Duration(seconds: 30)}) {
    if (_locationAt == null || _lat == null || _lng == null) return false;
    return DateTime.now().difference(_locationAt!) <= maxAge;
  }

  Future<bool> requestPermission() async {
    final permission = await Permission.location.request();
    if (!permission.isGranted) return false;
    await Permission.locationAlways.request();
    return true;
  }

  Future<bool> getCurrentLocation({bool force = false}) async {
    if (_getting && !force) return _lat != null;
    _getting = true;
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _error = "Location services are disabled";
        notifyListeners();
        return false;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _error = "Location permission denied";
          notifyListeners();
          return false;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        _error = "Location permission permanently denied";
        notifyListeners();
        return false;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      ).timeout(_gpsTimeout);

      _lat = position.latitude;
      _lng = position.longitude;
      _accuracy = position.accuracy;
      _locationAt = position.timestamp;
      _error = null;
      notifyListeners();
      return true;
    } on TimeoutException {
      _error = "GPS timed out. Try again outdoors.";
      notifyListeners();
      return false;
    } catch (e) {
      _error = "Failed to get location: $e";
      notifyListeners();
      return false;
    } finally {
      _getting = false;
    }
  }

  Future<void> startTracking({
    required String employeeId,
    String? employeeName,
    String? companyId,
  }) async {
    if (employeeId.isEmpty) {
      _error = "Missing employee id for tracking";
      notifyListeners();
      return;
    }
    final service = BackgroundTrackingService();
    await service.start(
      employeeId: employeeId,
      employeeName: employeeName,
      companyId: companyId,
    );
    _isTracking = service.isRunning;

    if (_isTracking) {
      _error = null;
      _listenToPositionUpdates();
    }

    notifyListeners();
  }

  Future<void> stopTracking() async {
    await _positionSub?.cancel();
    _positionSub = null;
    final service = BackgroundTrackingService();
    await service.stop();
    _isTracking = service.isRunning;
    notifyListeners();
  }

  void _listenToPositionUpdates() {
    _positionSub?.cancel();
    _positionSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen((Position position) {
      _lat = position.latitude;
      _lng = position.longitude;
      _accuracy = position.accuracy;
      _locationAt = position.timestamp;
      notifyListeners();
    });
  }

  double distanceTo(double targetLat, double targetLng) {
    if (_lat == null || _lng == null) return double.infinity;
    return Geolocator.distanceBetween(_lat!, _lng!, targetLat, targetLng);
  }

  @override
  void dispose() {
    _positionSub?.cancel();
    super.dispose();
  }
}
