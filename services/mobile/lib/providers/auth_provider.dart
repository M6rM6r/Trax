import "package:cloud_firestore/cloud_firestore.dart";
import "package:firebase_auth/firebase_auth.dart";
import "package:flutter/foundation.dart";
import "package:shared_preferences/shared_preferences.dart";
import "dart:async";

import "../services/background_tracking_service.dart";
import "../services/device_presence_service.dart";
import "../services/offline_sync_service.dart";

/// Auth is Firebase-only. Profile comes from users/{uid} (+ employee link).
class AuthProvider extends ChangeNotifier {
  String? _token;
  String? _userName;
  String? _userEmail;
  String? _userId;
  String? _employeeId;
  String? _companyName;
  String? _companyId;
  String? _role;
  String? _assignedGeofenceId;
  bool _isLoading = false;
  String? _error;
  bool _restored = false;

  static const Duration _timeout = Duration(seconds: 20);

  AuthProvider() {
    restoreSession();
  }

  String? get token => _token;
  String? get userName => _userName;
  String? get userEmail => _userEmail;
  String? get userId => _userId;
  String? get employeeId => _employeeId;
  String? get companyName => _companyName;
  String? get companyId => _companyId;
  String? get role => _role;
  String? get assignedGeofenceId => _assignedGeofenceId;
  bool get isLoading => _isLoading;
  bool get isAuthenticated =>
      _token != null &&
      _token!.isNotEmpty &&
      FirebaseAuth.instance.currentUser != null;
  bool get isRestored => _restored;
  String? get error => _error;
  bool get hasEmployeeProfile =>
      _employeeId != null &&
      _employeeId!.isNotEmpty &&
      _companyId != null &&
      _companyId!.isNotEmpty;

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    if (_token != null) await prefs.setString("auth_token", _token!);
    if (_userName != null) await prefs.setString("user_name", _userName!);
    if (_userEmail != null) await prefs.setString("user_email", _userEmail!);
    if (_userId != null) await prefs.setString("user_id", _userId!);
    if (_employeeId != null) await prefs.setString("employee_id", _employeeId!);
    if (_companyId != null) await prefs.setString("company_id", _companyId!);
    if (_companyName != null) {
      await prefs.setString("company_name", _companyName!);
    }
    if (_role != null) await prefs.setString("user_role", _role!);
    if (_assignedGeofenceId != null) {
      await prefs.setString("assigned_geofence_id", _assignedGeofenceId!);
    }
  }

  Future<void> _hydrateFromFirestore(User user) async {
    final db = FirebaseFirestore.instance;
    final userRef = db.collection("users").doc(user.uid);
    final userSnap = await userRef.get().timeout(_timeout);
    Map<String, dynamic> profile = {};
    if (userSnap.exists) {
      profile = Map<String, dynamic>.from(userSnap.data() ?? {});
    }

    _userId = user.uid;
    _userEmail = user.email ?? profile["email"]?.toString();
    _userName = profile["name"]?.toString() ??
        user.displayName ??
        _userEmail?.split("@").first;
    _role = profile["role"]?.toString() ?? "employee";
    _companyId =
        profile["company_id"]?.toString() ?? profile["companyId"]?.toString();
    _employeeId =
        profile["employee_id"]?.toString() ?? profile["employeeId"]?.toString();
    _assignedGeofenceId = profile["assigned_geofence_id"]?.toString() ??
        profile["geofenceId"]?.toString();

    if (_employeeId == null || _employeeId!.isEmpty) {
      try {
        final byAuth = await db
            .collection("employees")
            .where("authUid", isEqualTo: user.uid)
            .limit(1)
            .get()
            .timeout(_timeout);
        if (byAuth.docs.isNotEmpty) {
          final d = byAuth.docs.first;
          _employeeId = d.id;
          final data = d.data();
          _companyId ??= data["company_id"]?.toString();
          _assignedGeofenceId ??= data["geofenceId"]?.toString() ??
              data["assigned_geofence_id"]?.toString();
          _userName ??= data["name"]?.toString();
          unawaited(userRef.set({
            "employee_id": _employeeId,
            if (_companyId != null) "company_id": _companyId,
            "role": _role ?? "employee",
            "email": _userEmail,
            "name": _userName,
          }, SetOptions(merge: true)));
        }
      } catch (_) {}
    } else {
      try {
        final emp = await db.collection("employees").doc(_employeeId).get();
        if (emp.exists) {
          final data = emp.data()!;
          _companyId ??= data["company_id"]?.toString();
          _assignedGeofenceId ??= data["geofenceId"]?.toString() ??
              data["assigned_geofence_id"]?.toString();
          _userName ??= data["name"]?.toString();
        }
      } catch (_) {}
    }

    if (_companyId != null && _companyId!.isNotEmpty) {
      try {
        final c = await db.collection("companies").doc(_companyId).get();
        if (c.exists) {
          _companyName = c.data()?["name"]?.toString() ?? _companyName;
        }
      } catch (_) {}
    }

    try {
      await userRef.set({
        "lastMobileSeenAt": FieldValue.serverTimestamp(),
        "email": _userEmail,
        if (_userName != null) "name": _userName,
        if (_companyId != null) "company_id": _companyId,
        if (_employeeId != null) "employee_id": _employeeId,
      }, SetOptions(merge: true));
    } catch (_) {}
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final credential = await FirebaseAuth.instance
          .signInWithEmailAndPassword(email: email.trim(), password: password)
          .timeout(_timeout);
      final user = credential.user;
      if (user == null) {
        _error = "Sign-in failed";
        _isLoading = false;
        notifyListeners();
        return false;
      }

      _token = await user.getIdToken();
      await _hydrateFromFirestore(user);
      await _persist();

      _isLoading = false;
      notifyListeners();

      unawaited(DevicePresenceService().syncFcmToken());
      unawaited(OfflineSyncService().syncPendingActions());
      return true;
    } on FirebaseAuthException catch (e) {
      _error = e.message ?? "Invalid email or password";
      _isLoading = false;
      notifyListeners();
      return false;
    } on TimeoutException {
      _error = "Login timed out. Check network.";
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = "Connection error: $e";
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<String?> refreshToken() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return _token;
    try {
      _token = await user.getIdToken(true).timeout(const Duration(seconds: 15));
      final prefs = await SharedPreferences.getInstance();
      if (_token != null) await prefs.setString("auth_token", _token!);
      return _token;
    } catch (_) {
      return _token;
    }
  }

  Future<String?> ensureToken() async {
    final refreshed = await refreshToken();
    if (refreshed != null && refreshed.isNotEmpty) return refreshed;
    return _token;
  }

  Future<void> refreshProfile() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    try {
      await _hydrateFromFirestore(user);
      await _persist();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString("auth_token");
    _userName = prefs.getString("user_name");
    _userEmail = prefs.getString("user_email");
    _userId = prefs.getString("user_id");
    _employeeId = prefs.getString("employee_id");
    if (_employeeId == null) {
      try {
        final legacy = prefs.getInt("employee_id");
        if (legacy != null) _employeeId = legacy.toString();
      } catch (_) {}
    }
    _companyId = prefs.getString("company_id");
    if (_companyId == null) {
      try {
        final legacy = prefs.getInt("company_id");
        if (legacy != null) _companyId = legacy.toString();
      } catch (_) {}
    }
    _companyName = prefs.getString("company_name");
    _role = prefs.getString("user_role");
    _assignedGeofenceId = prefs.getString("assigned_geofence_id");
    _restored = true;
    notifyListeners();

    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      unawaited(() async {
        try {
          await refreshToken();
          await _hydrateFromFirestore(user);
          await _persist();
          notifyListeners();
          unawaited(DevicePresenceService().syncFcmToken());
        } catch (_) {}
      }());
    }
  }

  Future<void> logout() async {
    try {
      await BackgroundTrackingService().stop();
    } catch (_) {}
    try {
      await DevicePresenceService().clearFcmToken();
    } catch (_) {}
    try {
      await FirebaseAuth.instance.signOut();
    } catch (_) {}

    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    _token = null;
    _userName = null;
    _userEmail = null;
    _userId = null;
    _employeeId = null;
    _companyId = null;
    _companyName = null;
    _role = null;
    _assignedGeofenceId = null;
    notifyListeners();
  }
}
