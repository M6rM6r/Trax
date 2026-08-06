import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import 'trax_time.dart';

/// Single source of truth for mobile attendance — same collections / doc ids as web.
class FirestoreAttendanceService {
  FirestoreAttendanceService({
    FirebaseFirestore? db,
    FirebaseAuth? auth,
  })  : _db = db ?? FirebaseFirestore.instance,
        _auth = auth ?? FirebaseAuth.instance;

  final FirebaseFirestore _db;
  final FirebaseAuth _auth;

  static const Duration _geofenceTtl = Duration(minutes: 5);
  List<Map<String, dynamic>> _geofenceCache = [];
  DateTime? _geofenceCacheAt;
  String? _geofenceCacheCompany;

  User get _user {
    final u = _auth.currentUser;
    if (u == null) throw StateError('NOT_SIGNED_IN');
    return u;
  }

  Future<List<Map<String, dynamic>>> fetchHistory({
    required String companyId,
    required String employeeId,
    int maxDocs = 60,
  }) async {
    final cid = companyId.trim();
    final eid = employeeId.trim();
    if (cid.isEmpty || eid.isEmpty) return [];

    QuerySnapshot<Map<String, dynamic>> snap;
    try {
      snap = await _db
          .collection('attendance')
          .where('company_id', isEqualTo: cid)
          .where('employeeId', isEqualTo: eid)
          .orderBy('date', descending: true)
          .limit(maxDocs)
          .get()
          .timeout(const Duration(seconds: 20));
    } catch (_) {
      // Missing composite index or rules: ownerUid fallback.
      snap = await _db
          .collection('attendance')
          .where('ownerUid', isEqualTo: _user.uid)
          .orderBy('date', descending: true)
          .limit(maxDocs)
          .get()
          .timeout(const Duration(seconds: 20));
    }

    return snap.docs.map((d) {
      final m = Map<String, dynamic>.from(d.data());
      m['id'] = d.id;
      return m;
    }).toList();
  }

  Future<String?> todayStatus({
    required String companyId,
    required String employeeId,
    String timeZone = TraxTime.defaultTimezone,
  }) async {
    final date = TraxTime.formatCompanyDate(DateTime.now(), timeZone: timeZone);
    final docId = TraxTime.attendanceDocId(companyId, employeeId, date);
    final snap = await _db.collection('attendance').doc(docId).get();
    if (!snap.exists) {
      // Soft probe by owner + date
      try {
        final q = await _db
            .collection('attendance')
            .where('ownerUid', isEqualTo: _user.uid)
            .where('date', isEqualTo: date)
            .limit(5)
            .get();
        for (final d in q.docs) {
          final data = d.data();
          if (data['checkOutTime'] != null) return 'checked_out';
          if (data['checkInTime'] != null) {
            return (data['status']?.toString().isNotEmpty == true)
                ? data['status'].toString()
                : 'present';
          }
        }
      } catch (_) {}
      return null;
    }
    final data = snap.data()!;
    if (data['checkOutTime'] != null) return 'checked_out';
    if (data['checkInTime'] != null) {
      return (data['status']?.toString().isNotEmpty == true)
          ? data['status'].toString()
          : 'present';
    }
    return null;
  }

  Future<Map<String, dynamic>?> loadEmployee(String employeeId) async {
    final snap = await _db.collection('employees').doc(employeeId).get();
    if (!snap.exists) return null;
    final data = Map<String, dynamic>.from(snap.data()!);
    data['id'] = snap.id;
    return data;
  }

  Future<Map<String, dynamic>?> loadGeofence(String geofenceId) async {
    final snap = await _db.collection('geofences').doc(geofenceId).get();
    if (!snap.exists) return null;
    final data = Map<String, dynamic>.from(snap.data()!);
    data['id'] = snap.id;
    return data;
  }

  Future<List<Map<String, dynamic>>> loadCompanyGeofences(String companyId) async {
    final now = DateTime.now();
    if (_geofenceCache.isNotEmpty &&
        _geofenceCacheCompany == companyId &&
        _geofenceCacheAt != null &&
        now.difference(_geofenceCacheAt!) < _geofenceTtl) {
      return _geofenceCache;
    }

    final snap = await _db
        .collection('geofences')
        .where('company_id', isEqualTo: companyId)
        .get()
        .timeout(const Duration(seconds: 20));

    _geofenceCache = snap.docs.map((d) {
      final m = Map<String, dynamic>.from(d.data());
      m['id'] = d.id;
      return m;
    }).where((g) => g['active'] != false).toList();
    _geofenceCacheAt = now;
    _geofenceCacheCompany = companyId;
    return _geofenceCache;
  }

  String? resolveAssignedGeofenceId(Map<String, dynamic>? employee) {
    if (employee == null) return null;
    final a = employee['geofenceId'] ?? employee['assigned_geofence_id'];
    if (a == null) return null;
    final s = a.toString().trim();
    return s.isEmpty ? null : s;
  }

  double? _num(Object? v) {
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v);
    return null;
  }

  /// Check-in — mirrors web atomic transaction + assigned geofence rule.
  Future<Map<String, dynamic>> checkIn({
    required String companyId,
    required String employeeId,
    required String employeeName,
    required double lat,
    required double lng,
    double? accuracy,
    DateTime? at,
    String timeZone = TraxTime.defaultTimezone,
  }) async {
    final user = _user;
    final cid = companyId.trim();
    final eid = employeeId.trim();
    if (cid.isEmpty || eid.isEmpty) {
      throw StateError('MISSING_PROFILE');
    }

    final employee = await loadEmployee(eid);
    final assignedId = resolveAssignedGeofenceId(employee);
    if (assignedId == null) {
      throw StateError('EMPLOYEE_HAS_NO_ASSIGNED_GEOFENCE');
    }

    final geofence = await loadGeofence(assignedId);
    if (geofence == null || geofence['active'] == false) {
      throw StateError('ASSIGNED_GEOFENCE_NOT_FOUND_OR_INACTIVE');
    }
    final gCompany = geofence['company_id']?.toString();
    if (gCompany != null && gCompany.isNotEmpty && gCompany != cid) {
      throw StateError('ASSIGNED_GEOFENCE_NOT_FOUND_OR_INACTIVE');
    }

    final gLat = _num(geofence['lat'] ?? geofence['latitude'] ?? geofence['centerLat']);
    final gLng = _num(geofence['lng'] ?? geofence['longitude'] ?? geofence['centerLng']);
    final radius = _num(geofence['radius'] ?? geofence['radiusMeters']);
    if (gLat == null || gLng == null || radius == null) {
      throw StateError('ASSIGNED_GEOFENCE_NOT_FOUND_OR_INACTIVE');
    }

    final acc = accuracy ?? 0;
    if (!TraxTime.insideGeofence(
      lat: lat,
      lng: lng,
      centerLat: gLat,
      centerLng: gLng,
      radiusMeters: radius,
      accuracyMeters: acc,
    )) {
      throw StateError('OUTSIDE_GEOFENCE');
    }

    final now = at ?? DateTime.now();
    final date = TraxTime.formatCompanyDate(now, timeZone: timeZone);
    final checkInTime = TraxTime.formatCompanyTime(now, timeZone: timeZone);
    final docId = TraxTime.attendanceDocId(cid, eid, date);
    final ref = _db.collection('attendance').doc(docId);

    // Simple late heuristic: before 09:00 company time = present, else late.
    final minutes = int.parse(checkInTime.substring(0, 2)) * 60 +
        int.parse(checkInTime.substring(3, 5));
    const start = 9 * 60;
    final lateMinutes = minutes > start ? minutes - start : 0;
    final status = lateMinutes > 0 ? 'late' : 'present';

    final record = <String, dynamic>{
      'id': docId,
      'ownerUid': user.uid,
      'company_id': cid,
      'employeeId': eid,
      'employeeName': employeeName.isNotEmpty
          ? employeeName
          : (user.displayName ?? user.email ?? ''),
      'date': date,
      'checkInTime': checkInTime,
      'checkOutTime': null,
      'status': status,
      'checkInLat': lat,
      'checkInLng': lng,
      'checkOutLat': null,
      'checkOutLng': null,
      'geofenceId': assignedId,
      'geofenceName': geofence['name'],
      'lateMinutes': lateMinutes,
      'workedHours': 0,
      'checkOutStatus': null,
      'createdAt': FieldValue.serverTimestamp(),
      'source': 'mobile',
    };

    return _db.runTransaction((tx) async {
      final snap = await tx.get(ref);
      if (snap.exists) {
        final existing = snap.data()!;
        if (existing['checkOutTime'] != null) {
          throw StateError('ALREADY_CHECKED_OUT');
        }
        if (existing['checkInTime'] != null) {
          return Map<String, dynamic>.from(existing)..['id'] = snap.id;
        }
      }
      tx.set(ref, record);
      return Map<String, dynamic>.from(record)..remove('createdAt');
    }).timeout(const Duration(seconds: 25));
  }

  Future<Map<String, dynamic>> checkOut({
    required String companyId,
    required String employeeId,
    double? lat,
    double? lng,
    DateTime? at,
    String timeZone = TraxTime.defaultTimezone,
  }) async {
    final user = _user;
    final cid = companyId.trim();
    final eid = employeeId.trim();
    final now = at ?? DateTime.now();
    final today = TraxTime.formatCompanyDate(now, timeZone: timeZone);
    final checkOutTime = TraxTime.formatCompanyTime(now, timeZone: timeZone);

    DocumentReference<Map<String, dynamic>> target =
        _db.collection('attendance').doc(TraxTime.attendanceDocId(cid, eid, today));
    Map<String, dynamic>? current;

    final preferred = await target.get();
    if (preferred.exists) {
      current = preferred.data();
    }

    bool isOpen(Map<String, dynamic> d) =>
        d['checkInTime'] != null && d['checkOutTime'] == null;

    if (current == null || !isOpen(current)) {
      try {
        final byOwner = await _db
            .collection('attendance')
            .where('ownerUid', isEqualTo: user.uid)
            .where('date', isEqualTo: today)
            .limit(10)
            .get();
        for (final d in byOwner.docs) {
          final data = d.data();
          if (isOpen(data)) {
            target = d.reference;
            current = data;
            break;
          }
        }
      } catch (_) {}
    }

    if (current == null || current['checkInTime'] == null) {
      throw StateError('NO_OPEN_ATTENDANCE');
    }
    if (current['checkOutTime'] != null) {
      throw StateError('ALREADY_CHECKED_OUT');
    }

    final checkInTime = current['checkInTime'].toString();
    final worked = _workedHours(checkInTime, checkOutTime);

    return _db.runTransaction((tx) async {
      final fresh = await tx.get(target);
      if (!fresh.exists) throw StateError('NO_OPEN_ATTENDANCE');
      final data = fresh.data()!;
      if (data['checkInTime'] == null) throw StateError('NO_OPEN_ATTENDANCE');
      if (data['checkOutTime'] != null) throw StateError('ALREADY_CHECKED_OUT');

      final patch = <String, dynamic>{
        'checkOutTime': checkOutTime,
        'status': 'checked_out',
        'checkOutStatus': 'present',
        'workedHours': worked,
      };
      if (lat != null) patch['checkOutLat'] = lat;
      if (lng != null) patch['checkOutLng'] = lng;
      if (data['ownerUid'] == null || data['ownerUid'].toString().isEmpty) {
        patch['ownerUid'] = user.uid;
      }
      if (data['company_id'] == null) patch['company_id'] = cid;
      if (data['employeeId'] == null) patch['employeeId'] = eid;

      tx.update(target, patch);
      return {...data, ...patch, 'id': target.id};
    }).timeout(const Duration(seconds: 25));
  }

  double _workedHours(String checkInHhmm, String checkOutHhmm) {
    int mins(String t) {
      final p = t.split(':');
      if (p.length < 2) return 0;
      return (int.tryParse(p[0]) ?? 0) * 60 + (int.tryParse(p[1]) ?? 0);
    }

    var delta = mins(checkOutHhmm) - mins(checkInHhmm);
    if (delta < 0) delta += 24 * 60;
    return double.parse((delta / 60.0).toStringAsFixed(2));
  }
}
