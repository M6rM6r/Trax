import 'package:envied/envied.dart';

part 'env.g.dart';

@Envied(path: '.env')
abstract class Env {
  @EnviedField(varName: 'API_BASE_URL', defaultValue: 'http://localhost:8000/api')
  static const String apiBaseUrl = _Env.apiBaseUrl;

  @EnviedField(varName: 'AI_SERVICE_URL', defaultValue: 'http://localhost:8001')
  static const String aiServiceUrl = _Env.aiServiceUrl;

  @EnviedField(varName: 'WS_URL', defaultValue: 'ws://localhost:8080')
  static const String wsUrl = _Env.wsUrl;

  @EnviedField(varName: 'SENTRY_DSN', defaultValue: '')
  static const String sentryDsn = _Env.sentryDsn;

  @EnviedField(varName: 'APP_ENV', defaultValue: 'development')
  static const String appEnv = _Env.appEnv;

  @EnviedField(varName: 'APP_VERSION', defaultValue: '0.1.0')
  static const String appVersion = _Env.appVersion;
}
