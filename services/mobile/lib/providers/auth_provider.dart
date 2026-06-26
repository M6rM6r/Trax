import "package:flutter/foundation.dart";
import "package:shared_preferences/shared_preferences.dart";
import "package:http/http.dart" as http;
import "package:firebase_messaging/firebase_messaging.dart";
import "dart:async";
import "dart:convert";
import "../config/env.dart";

class AuthProvider extends ChangeNotifier {
  String? _token;
  String? _userName;
  String? _userEmail;
  int? _userId;
  String? _companyName;
  int? _companyId;
  bool _isLoading = false;
  String? _error;

  AuthProvider() {
    restoreSession();
  }

  String? get token => _token;
  String? get userName => _userName;
  String? get userEmail => _userEmail;
  int? get userId => _userId;
  String? get companyName => _companyName;
  int? get companyId => _companyId;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _token != null;
  String? get error => _error;

  static String get _baseUrl => Env.apiBaseUrl;

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse("$_baseUrl/auth/login"),
        headers: {"Content-Type": "application/json", "Accept": "application/json"},
        body: jsonEncode({"email": email, "password": password}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data["success"] == true) {
        _token = data["data"]["token"];
        _userName = data["data"]["user"]["name"];
        _userEmail = data["data"]["user"]["email"];
        _userId = data["data"]["user"]["id"];
        _companyId = data["data"]["user"]["company_id"] as int?;
        _companyName = data["data"]["company"]?["name"] as String?;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString("auth_token", _token!);
        await prefs.setString("user_name", _userName!);
        await prefs.setString("user_email", _userEmail!);
        await prefs.setInt("user_id", _userId!);
        if (_companyId != null) await prefs.setInt("company_id", _companyId!);
        if (_companyName != null) await prefs.setString("company_name", _companyName!);

        _isLoading = false;
        notifyListeners();

        unawaited(_syncFcmToken());
        return true;
      } else {
        _error = data["message"] ?? "Login failed";
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = "Connection error: $e";
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> _syncFcmToken() async {
    try {
      final fcmToken = await FirebaseMessaging.instance.getToken();
      if (fcmToken == null || _token == null || _userId == null) return;
      await http.post(
        Uri.parse("$_baseUrl/device/fcm"),
        headers: {
          "Authorization": "Bearer $_token",
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: jsonEncode({
          "employee_id": _userId,
          "fcm_token": fcmToken,
          "platform": "android",
        }),
      );
    } catch (_) {}
  }

  Future<void> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString("auth_token");
    _userName = prefs.getString("user_name");
    _userEmail = prefs.getString("user_email");
    _userId = prefs.getInt("user_id");
    _companyId = prefs.getInt("company_id");
    _companyName = prefs.getString("company_name");
    notifyListeners();
  }

  Future<void> logout() async {
    if (_token != null && _userId != null) {
      try {
        await http.delete(
          Uri.parse("$_baseUrl/device/fcm"),
          headers: {
            "Authorization": "Bearer $_token",
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: jsonEncode({"employee_id": _userId}),
        );
      } catch (_) {}
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    _token = null;
    _userName = null;
    _userEmail = null;
    _userId = null;
    notifyListeners();
  }
}
