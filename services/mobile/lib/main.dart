import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:provider/provider.dart";
import "package:google_fonts/google_fonts.dart";
import "package:shared_preferences/shared_preferences.dart";
import "package:firebase_core/firebase_core.dart";
import "firebase_options.dart";
import "providers/auth_provider.dart";
import "providers/attendance_provider.dart";
import "providers/location_provider.dart";
import "providers/theme_provider.dart";
import "providers/notifications_provider.dart";
import "package:flutter_background_geolocation/flutter_background_geolocation.dart" as bg;

import "services/api_service.dart";
import "services/background_tracking_service.dart";
import "services/notification_service.dart";
import "services/offline_sync_service.dart";
import "screens/login_screen.dart";
import "screens/home_screen.dart";
import "screens/check_in_screen.dart";
import "screens/history_screen.dart";
import "screens/profile_screen.dart";
import "screens/onboarding_screen.dart";
import "screens/notification_settings_screen.dart";
import "screens/notifications_screen.dart";

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setEnabledSystemUIMode(
    SystemUiMode.edgeToEdge,
    overlays: SystemUiOverlay.values,
  );
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarBrightness: Brightness.dark,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarDividerColor: Colors.transparent,
    systemNavigationBarIconBrightness: Brightness.light,
  ));
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  } catch (_) {}
  await NotificationService().initialize();
  try {
    await OfflineSyncService().start();
  } catch (_) {}
  final prefs = await SharedPreferences.getInstance();
  final hasSession = prefs.getString("auth_token") != null;

  // Resume background tracking if it was active before the app was killed.
  // Errors here are non-fatal (e.g., plugin unavailable in widget tests).
  try {
    await BackgroundTrackingService().restoreStateIfNeeded();
    await bg.BackgroundGeolocation.registerHeadlessTask(
      BackgroundTrackingService().headlessLocationHandler,
    );
  } catch (_) {}

  runApp(TraxEmployeeApp(hasSession: hasSession));
}

class TraxEmployeeApp extends StatelessWidget {
  final bool hasSession;

  const TraxEmployeeApp({super.key, required this.hasSession});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => AttendanceProvider()),
        ChangeNotifierProvider(create: (_) => LocationProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => NotificationsProvider()),
        Provider(create: (_) => ApiService()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) => MaterialApp(
          title: "Trax",
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF3C7EE7),
              brightness: Brightness.light,
            ),
            useMaterial3: true,
            textTheme: GoogleFonts.cairoTextTheme(),
            appBarTheme: const AppBarTheme(
              centerTitle: true,
              backgroundColor: Color(0xFF3C7EE7),
              foregroundColor: Colors.white,
            ),
            scaffoldBackgroundColor: Colors.white,
            canvasColor: Colors.white,
          ),
          darkTheme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF3C7EE7),
              brightness: Brightness.dark,
            ),
            useMaterial3: true,
            textTheme: GoogleFonts.cairoTextTheme(ThemeData.dark().textTheme),
            appBarTheme: AppBarTheme(
              centerTitle: true,
              backgroundColor: Colors.grey[900],
              foregroundColor: Colors.white,
            ),
            scaffoldBackgroundColor: const Color(0xFF0F172A),
            canvasColor: const Color(0xFF0F172A),
            cardColor: const Color(0xFF1E293B),
          ),
          themeMode: themeProvider.themeMode,
          builder: (context, child) => AnnotatedRegion<SystemUiOverlayStyle>(
            value: const SystemUiOverlayStyle(
              statusBarColor: Colors.transparent,
              statusBarBrightness: Brightness.dark,
              statusBarIconBrightness: Brightness.light,
              systemNavigationBarColor: Colors.transparent,
              systemNavigationBarIconBrightness: Brightness.light,
            ),
            child: child!,
          ),
          initialRoute: hasSession ? "/home" : "/login",
          routes: {
            "/onboarding": (ctx) => OnboardingScreen(
              onComplete: () => Navigator.pushReplacementNamed(ctx, "/login"),
            ),
            "/login": (ctx) => const LoginScreen(),
            "/home": (ctx) => const HomeScreen(),
            "/check-in": (ctx) => const CheckInScreen(),
            "/history": (ctx) => const HistoryScreen(),
            "/profile": (ctx) => const ProfileScreen(),
            "/notifications": (ctx) => const NotificationsScreen(),
            "/notification-settings": (ctx) => const NotificationSettingsScreen(),
          },
        ),
      ),
    );
  }
}


