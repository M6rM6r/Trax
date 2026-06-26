import 'package:freezed_annotation/freezed_annotation.dart';

part 'auth_state.freezed.dart';

@freezed
class AuthState with _$AuthState {
  const factory AuthState({
    @Default(false) bool isAuthenticated,
    @Default(false) bool isLoading,
    String? token,
    int? userId,
    String? userName,
    String? userEmail,
    String? role,
    String? errorMessage,
  }) = _AuthState;

  const AuthState._();

  bool get isBoss => role == 'boss' || role == 'admin';
  bool get isEmployee => role == 'employee';
}
