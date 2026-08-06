import "package:flutter/foundation.dart";
import "dart:async";

import "../services/firestore_attendance_service.dart";
import "../services/offline_sync_service.dart";

/// Attendance pipeline — Firestore first (same docs as web dashboard).
class AttendanceProvider extends ChangeNotifier {
  final FirestoreAttendanceService _fs = FirestoreAttendanceService();

  List<Map<String, dynamic>> _records = [];
  bool _isLoading = false;
  bool _actionInFlight = false;
  String? _error;
  String? _todayStatus;

  static const double _maxGpsAgeSeconds = 30;

  List<Map<String, dynamic>> get records => List.unmodifiable(_records);
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get todayStatus => _todayStatus;

  String _mapError(Object e) {
    final s = e.toString();
    if (s.contains("OUTSIDE_GEOFENCE")) {
      return "أنت خارج نطاق العمل المخصص";
    }
    if (s.contains("EMPLOYEE_HAS_NO_ASSIGNED_GEOFENCE")) {
      return "لم يُعيَّن لك موقع عمل. راجع الإدارة.";
    }
    if (s.contains("ASSIGNED_GEOFENCE")) {
      return "موقع العمل غير متاح. راجع الإدارة.";
    }
    if (s.contains("NO_OPEN_ATTENDANCE")) {
      return "لا يوجد حضور مفتوح للانصراف";
    }
    if (s.contains("ALREADY_CHECKED_OUT")) {
      return "تم الانصراف مسبقاً";
    }
    if (s.contains("NOT_SIGNED_IN") || s.contains("MISSING_PROFILE")) {
      return "الجلسة غير صالحة. سجّل الدخول مجدداً.";
    }
    if (s.contains("TimeoutException") || s.contains("timed out")) {
      return "انتهت مهلة الاتصال";
    }
    return s.replaceFirst("Bad state: ", "").replaceFirst("StateError: ", "");
  }

  Future<void> fetchHistory({
    required String companyId,
    required String employeeId,
  }) async {
    if (companyId.isEmpty || employeeId.isEmpty) return;
    _isLoading = true;
    notifyListeners();

    try {
      _records = await _fs.fetchHistory(
        companyId: companyId,
        employeeId: employeeId,
      );
      _error = null;
      _inferTodayStatusFromRecords();
      final live = await _fs.todayStatus(
        companyId: companyId,
        employeeId: employeeId,
      );
      if (live != null) _todayStatus = live;
    } catch (e) {
      _error = _mapError(e);
    }

    _isLoading = false;
    notifyListeners();
  }

  void _inferTodayStatusFromRecords() {
    if (_records.isEmpty) return;
    final now = DateTime.now();
    final today =
        "${now.year.toString().padLeft(4, '0')}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
    for (final r in _records) {
      final date = r["date"]?.toString();
      final isToday = date == null || date == today || date.startsWith(today);
      if (!isToday) continue;

      final hasOut = r["checkOutTime"] != null || r["check_out"] != null;
      if (hasOut) {
        _todayStatus = "checked_out";
      } else if (r["checkInTime"] != null || r["check_in"] != null) {
        final status = r["status"]?.toString().toLowerCase();
        _todayStatus = status == "late" ? "late" : (status ?? "present");
      }
      break;
    }
  }

  Future<bool> checkIn({
    required String companyId,
    required String employeeId,
    required String employeeName,
    required double lat,
    required double lng,
    int? batteryLevel,
    double? accuracy,
    DateTime? locationTimestamp,
  }) async {
    if (_actionInFlight) {
      _error = "Request already in progress";
      notifyListeners();
      return false;
    }
    if (companyId.isEmpty || employeeId.isEmpty) {
      _error = "Missing employee profile. Sign in again.";
      notifyListeners();
      return false;
    }
    if (locationTimestamp != null) {
      final age = DateTime.now().difference(locationTimestamp).inSeconds.abs();
      if (age > _maxGpsAgeSeconds) {
        _error = "Location is stale. Refresh GPS and try again.";
        notifyListeners();
        return false;
      }
    }
    if (accuracy != null && accuracy > 80) {
      _error =
          "GPS accuracy too low (±${accuracy.toStringAsFixed(0)}m). Move outdoors.";
      notifyListeners();
      return false;
    }

    _actionInFlight = true;
    _isLoading = true;
    _error = null;
    notifyListeners();

    final body = <String, dynamic>{
      "op": "check_in",
      "companyId": companyId,
      "employeeId": employeeId,
      "employeeName": employeeName,
      "lat": lat,
      "lng": lng,
      if (accuracy != null) "accuracy": accuracy,
      if (batteryLevel != null) "battery_level": batteryLevel,
      "at": DateTime.now().toIso8601String(),
    };

    try {
      final offline = OfflineSyncService();
      if (!await offline.isOnline()) {
        await offline.queueAction(
          endpoint: "fs://attendance/check-in",
          method: "FS",
          body: body,
          dedupeKey: "checkin-$employeeId",
        );
        _todayStatus = "present";
        _error = null;
        return true;
      }

      final result = await _fs.checkIn(
        companyId: companyId,
        employeeId: employeeId,
        employeeName: employeeName,
        lat: lat,
        lng: lng,
        accuracy: accuracy,
      );
      _todayStatus = result["status"]?.toString() ?? "present";
      _error = null;
      _records = [
        result,
        ..._records.where((r) => r["id"] != result["id"]),
      ];
      return true;
    } catch (e) {
      final msg = e.toString();
      if (msg.contains("ALREADY") && msg.contains("CHECK")) {
        if (msg.contains("OUT")) {
          _todayStatus = "checked_out";
        } else {
          _todayStatus = "present";
        }
        _error = null;
        return true;
      }
      if (_isNetworkish(e)) {
        try {
          await OfflineSyncService().queueAction(
            endpoint: "fs://attendance/check-in",
            method: "FS",
            body: body,
            dedupeKey: "checkin-$employeeId",
          );
          _todayStatus = "present";
          _error = null;
          return true;
        } catch (_) {}
      }
      _error = _mapError(e);
      return false;
    } finally {
      _actionInFlight = false;
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> checkOut({
    required String companyId,
    required String employeeId,
    double? lat,
    double? lng,
  }) async {
    if (_actionInFlight) {
      _error = "Request already in progress";
      notifyListeners();
      return false;
    }
    if (companyId.isEmpty || employeeId.isEmpty) {
      _error = "Missing employee profile. Sign in again.";
      notifyListeners();
      return false;
    }

    _actionInFlight = true;
    _isLoading = true;
    _error = null;
    notifyListeners();

    final body = <String, dynamic>{
      "op": "check_out",
      "companyId": companyId,
      "employeeId": employeeId,
      if (lat != null) "lat": lat,
      if (lng != null) "lng": lng,
      "at": DateTime.now().toIso8601String(),
    };

    try {
      final offline = OfflineSyncService();
      if (!await offline.isOnline()) {
        await offline.queueAction(
          endpoint: "fs://attendance/check-out",
          method: "FS",
          body: body,
          dedupeKey: "checkout-$employeeId",
        );
        _todayStatus = "checked_out";
        return true;
      }

      await _fs.checkOut(
        companyId: companyId,
        employeeId: employeeId,
        lat: lat,
        lng: lng,
      );
      _todayStatus = "checked_out";
      _error = null;
      return true;
    } catch (e) {
      final msg = e.toString();
      if (msg.contains("ALREADY_CHECKED_OUT") ||
          msg.contains("NO_OPEN_ATTENDANCE")) {
        _todayStatus = "checked_out";
        _error = null;
        return true;
      }
      if (_isNetworkish(e)) {
        try {
          await OfflineSyncService().queueAction(
            endpoint: "fs://attendance/check-out",
            method: "FS",
            body: body,
            dedupeKey: "checkout-$employeeId",
          );
          _todayStatus = "checked_out";
          _error = null;
          return true;
        } catch (_) {}
      }
      _error = _mapError(e);
      return false;
    } finally {
      _actionInFlight = false;
      _isLoading = false;
      notifyListeners();
    }
  }

  bool _isNetworkish(Object e) {
    final s = e.toString().toLowerCase();
    return s.contains("socket") ||
        s.contains("network") ||
        s.contains("timeout") ||
        s.contains("unavailable") ||
        s.contains("failed host");
  }
}
