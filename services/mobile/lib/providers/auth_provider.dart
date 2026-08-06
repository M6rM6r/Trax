import "package:flutter/foundation.dart";
import "package:shared_preferences/shared_preferences.dart";
import "package:http/http.dart" as http;
import "package:firebase_messaging/firebase_messaging.dart";
import "package:firebase_auth/firebase_auth.dart";
import "dart:async";
import "dart:convert";
import "../config/env.dart";
import "../services/offline_sync_service.dart";
import "../services/background_tracking_service.dart";

class AuthProvider extends ChangeNotifier {
  String? _token;
  String? _userName;
  String? _userEmail;
  int? _userId;
  int? _employeeId;
  String? _companyName;
  int? _companyId;
  String? _role;
  bool _isLoading = false;
  String? _error;
  bool _restored = false;

  static const Duration _httpTimeout = Duration(seconds: 20);

  AuthProvider() {
    restoreSession();
  }

  String? get token => _token;
  String? get userName => _userName;
  String? get userEmail => _userEmail;
  int? get userId => _userId;
  int? get employeeId => _employeeId;
  String? get companyName => _companyName;
  int? get companyId => _companyId;
  String? get role => _role;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;
  bool get isRestored => _restored;
  String? get error => _error;

  static String get _baseUrl => Env.apiBaseUrl;

  Map<String, dynamic> _asMap(Object? value) {
    return value is Map<String, dynamic> ? value : <String, dynamic>{};
  }

  Future<bool> _applyLoginResponse(String idToken, http.Response response) async {
    Map<String, dynamic> data = <String, dynamic>{};
    try {
      if (response.body.isNotEmpty) {
        data = _asMap(jsonDecode(response.body));
      }
    } catch (_) {}

    final payload = _asMap(data["data"]);
    final user = _asMap(payload["user"]);
    final company = _asMap(payload["company"]);

    if (response.statusCode == 200 &&
        (data["success"] == true || data["success"] == null) &&
        user.isNotEmpty) {
      _token = idToken;
      _userName = user["name"]?.toString();
      _userEmail = user["email"]?.toString();
      _userId = (user["id"] as num?)?.toInt();
      _employeeId = (user["employee_id"] as num?)?.toInt() ??
          (user["employeeId"] as num?)?.toInt();
      _companyId = (user["company_id"] as num?)?.toInt() ??
          (user["companyId"] as num?)?.toInt() ??
          (company["id"] as num?)?.toInt();
      _companyName = company["name"]?.toString();
      _role = user["role"]?.toString() ?? payload["role"]?.toString();

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString("auth_token", _token!);
      if (_userName != null) await prefs.setString("user_name", _userName!);
      if (_userEmail != null) await prefs.setString("user_email", _userEmail!);
      if (_userId != null) await prefs.setInt("user_id", _userId!);
      if (_employeeId != null) await prefs.setInt("employee_id", _employeeId!);
      if (_companyId != null) await prefs.setInt("company_id", _companyId!);
      if (_companyName != null) {
        await prefs.setString("company_name", _companyName!);
      }
      if (_role != null) await prefs.setString("user_role", _role!);

      _isLoading = false;
      notifyListeners();

      unawaited(_syncFcmToken());
      unawaited(OfflineSyncService().syncPendingActions());
      return true;
    }

    _error = data["message"]?.toString() ?? "Login failed (${response.statusCode})";
    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final credential = await FirebaseAuth.instance
          .signInWithEmailAndPassword(email: email.trim(), password: password)
          .timeout(_httpTimeout);
      final idToken = await credential.user?.getIdToken();

      if (idToken == null) {
        _error = "Failed to get Firebase token";
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final response = await http
          .post(
            Uri.parse("$_baseUrl/auth/firebase"),
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: jsonEncode({"id_token": idToken}),
          )
          .timeout(_httpTimeout);

      return _applyLoginResponse(idToken, response);
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

  Future<void> _syncFcmToken() async {
    try {
      final fcmToken = await FirebaseMessaging.instance.getToken();
      if (fcmToken == null || _token == null || _employeeId == null) return;
      await http
          .post(
            Uri.parse("$_baseUrl/device/fcm"),
            headers: {
              "Authorization": "Bearer $_token",
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: jsonEncode({
              "employee_id": _employeeId,
              "fcm_token": fcmToken,
              "platform": defaultTargetPlatform.name.toLowerCase(),
            }),
          )
          .timeout(_httpTimeout);
    } catch (_) {}
  }

  Future<void> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString("auth_token");
    _userName = prefs.getString("user_name");
    _userEmail = prefs.getString("user_email");
    _userId = prefs.getInt("user_id");
    _employeeId = prefs.getInt("employee_id");
    _companyId = prefs.getInt("company_id");
    _companyName = prefs.getString("company_name");
    _role = prefs.getString("user_role");
    _restored = true;
    notifyListeners();

    // Soft refresh Firebase token if still signed in
    if (FirebaseAuth.instance.currentUser != null) {
      unawaited(refreshToken());
    }
  }

  Future<void> logout() async {
    try {
      await BackgroundTrackingService().stop();
    } catch (_) {}

    if (_token != null && _employeeId != null) {
      try {
        await http
            .delete(
              Uri.parse("$_baseUrl/device/fcm"),
              headers: {
                "Authorization": "Bearer $_token",
                "Content-Type": "application/json",
                "Accept": "application/json",
              },
              body: jsonEncode({"employee_id": _employeeId}),
            )
            .timeout(const Duration(seconds: 10));
      } catch (_) {}
    }

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
    notifyListeners();
  }
}
