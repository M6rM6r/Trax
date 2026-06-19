import "package:flutter/foundation.dart";
import "package:shared_preferences/shared_preferences.dart";
import "package:http/http.dart" as http;
import "dart:convert";

class AuthProvider extends ChangeNotifier {
  String? _token;
  String? _userName;
  String? _userEmail;
  int? _userId;
  bool _isLoading = false;
  String? _error;

  String? get token => _token;
  String? get userName => _userName;
  String? get userEmail => _userEmail;
  int? get userId => _userId;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _token != null;
  String? get error => _error;

  static const String _baseUrl = "http://localhost:8000/api";

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

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString("auth_token", _token!);
        await prefs.setString("user_name", _userName!);
        await prefs.setString("user_email", _userEmail!);
        await prefs.setInt("user_id", _userId!);

        _isLoading = false;
        notifyListeners();
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

  Future<void> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString("auth_token");
    _userName = prefs.getString("user_name");
    _userEmail = prefs.getString("user_email");
    _userId = prefs.getInt("user_id");
    notifyListeners();
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    _token = null;
    _userName = null;
    _userEmail = null;
    _userId = null;
    notifyListeners();
  }
}
