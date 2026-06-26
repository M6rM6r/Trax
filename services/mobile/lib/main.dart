import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "package:google_fonts/google_fonts.dart";
import "package:shared_preferences/shared_preferences.dart";
import "package:firebase_core/firebase_core.dart";
import "providers/auth_provider.dart";
import "providers/attendance_provider.dart";
import "providers/location_provider.dart";
import "providers/theme_provider.dart";
import "services/api_service.dart";
import "services/notification_service.dart";
import "screens/login_screen.dart";
import "screens/home_screen.dart";
import "screens/check_in_screen.dart";
import "screens/history_screen.dart";
import "screens/profile_screen.dart";
import "screens/onboarding_screen.dart";
import "screens/notification_settings_screen.dart";

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
  } catch (_) {}
  await NotificationService().initialize();
  final prefs = await SharedPreferences.getInstance();
  final onboardingCompleted = prefs.getBool("onboarding_completed") ?? false;
  final hasSession = prefs.getString("auth_token") != null;
  runApp(TraxEmployeeApp(onboardingCompleted: onboardingCompleted, hasSession: hasSession));
}

class TraxEmployeeApp extends StatelessWidget {
  final bool onboardingCompleted;
  final bool hasSession;

  const TraxEmployeeApp({super.key, required this.onboardingCompleted, required this.hasSession});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => AttendanceProvider()),
        ChangeNotifierProvider(create: (_) => LocationProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
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
            cardColor: const Color(0xFF1E293B),
          ),
          themeMode: themeProvider.themeMode,
          initialRoute: hasSession ? "/home" : (onboardingCompleted ? "/login" : "/onboarding"),
          routes: {
            "/onboarding": (ctx) => OnboardingScreen(
              onComplete: () => Navigator.pushReplacementNamed(ctx, "/login"),
            ),
            "/login": (ctx) => const LoginScreen(),
            "/home": (ctx) => const HomeScreen(),
            "/check-in": (ctx) => const CheckInScreen(),
            "/history": (ctx) => const HistoryScreen(),
            "/profile": (ctx) => const ProfileScreen(),
            "/notification-settings": (ctx) => const NotificationSettingsScreen(),
          },
        ),
      ),
    );
  }
}
