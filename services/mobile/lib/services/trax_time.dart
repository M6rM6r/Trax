import 'dart:math' as math;

/// Company-day helpers — mirror web lib/utils/companyDate.ts.
class TraxTime {
  TraxTime._();

  static const String defaultTimezone = 'Asia/Riyadh';

  static String formatCompanyDate(
    DateTime value, {
    String timeZone = defaultTimezone,
  }) {
    final local = _toZone(value.toUtc(), timeZone);
    final y = local.year.toString().padLeft(4, '0');
    final m = local.month.toString().padLeft(2, '0');
    final d = local.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  static String formatCompanyTime(
    DateTime value, {
    String timeZone = defaultTimezone,
  }) {
    final local = _toZone(value.toUtc(), timeZone);
    final h = local.hour.toString().padLeft(2, '0');
    final min = local.minute.toString().padLeft(2, '0');
    return '$h:$min';
  }

  static String attendanceDocId(
    String companyId,
    String employeeId,
    String dateYmd,
  ) {
    String safe(String s) => s.replaceAll(RegExp(r'[/\\]'), '_');
    return '${safe(companyId)}_${safe(employeeId)}_${safe(dateYmd)}';
  }

  static double haversineMeters(
    double lat1,
    double lng1,
    double lat2,
    double lng2,
  ) {
    const r = 6371000.0;
    final dLat = _rad(lat2 - lat1);
    final dLng = _rad(lng2 - lng1);
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_rad(lat1)) *
            math.cos(_rad(lat2)) *
            math.sin(dLng / 2) *
            math.sin(dLng / 2);
    return r * 2 * math.asin(math.sqrt(a.clamp(0.0, 1.0)));
  }

  static bool insideGeofence({
    required double lat,
    required double lng,
    required double centerLat,
    required double centerLng,
    required double radiusMeters,
    double accuracyMeters = 0,
  }) {
    final dist = haversineMeters(lat, lng, centerLat, centerLng);
    final budget = accuracyMeters.clamp(0, 50);
    return dist <= radiusMeters + budget;
  }

  static DateTime _toZone(DateTime utc, String timeZone) {
    return utc.add(Duration(hours: _offsetHours(timeZone)));
  }

  static int _offsetHours(String timeZone) {
    switch (timeZone) {
      case 'UTC':
        return 0;
      case 'Africa/Cairo':
        return 2;
      default:
        return 3; // Asia/Riyadh
    }
  }

  static double _rad(double d) => d * math.pi / 180.0;
}
