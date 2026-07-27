import "package:flutter/foundation.dart";
import "package:geolocator/geolocator.dart";
import "package:permission_handler/permission_handler.dart";

import "../services/background_tracking_service.dart";

class LocationProvider extends ChangeNotifier {
  double? _lat;
  double? _lng;
  double? _accuracy;
  bool _isTracking = false;
  String? _error;

  double? get lat => _lat;
  double? get lng => _lng;
  double? get accuracy => _accuracy;
  bool get isTracking => _isTracking;
  String? get error => _error;

  Future<bool> requestPermission() async {
    final permission = await Permission.location.request();
    if (!permission.isGranted) return false;

    final backgroundPermission = await Permission.locationAlways.request();
    return backgroundPermission.isGranted;
  }

  Future<bool> getCurrentLocation() async {
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
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );

      _lat = position.latitude;
      _lng = position.longitude;
      _accuracy = position.accuracy;
      _error = null;
      notifyListeners();
      return true;
    } catch (e) {
      _error = "Failed to get location: $e";
      notifyListeners();
      return false;
    }
  }

  Future<void> startTracking({
    required int employeeId,
    String? employeeName,
    String? companyId,
  }) async {
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
    final service = BackgroundTrackingService();
    await service.stop();
    _isTracking = service.isRunning;
    notifyListeners();
  }

  void _listenToPositionUpdates() {
    Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen((Position position) {
      _lat = position.latitude;
      _lng = position.longitude;
      _accuracy = position.accuracy;
      notifyListeners();
    });
  }

  double distanceTo(double targetLat, double targetLng) {
    if (_lat == null || _lng == null) return double.infinity;
    return Geolocator.distanceBetween(_lat!, _lng!, targetLat, targetLng);
  }
}
