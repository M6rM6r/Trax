import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "package:google_fonts/google_fonts.dart";
import "providers/auth_provider.dart";
import "providers/attendance_provider.dart";
import "providers/location_provider.dart";
import "services/api_service.dart";
import "screens/login_screen.dart";
import "screens/home_screen.dart";
import "screens/check_in_screen.dart";
import "screens/history_screen.dart";
import "screens/profile_screen.dart";

void main() {
  runApp(const TraxEmployeeApp());
}

class TraxEmployeeApp extends StatelessWidget {
  const TraxEmployeeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => AttendanceProvider()),
        ChangeNotifierProvider(create: (_) => LocationProvider()),
        Provider(create: (_) => ApiService()),
      ],
      child: MaterialApp(
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
        themeMode: ThemeMode.system,
        initialRoute: "/login",
        routes: {
          "/login": (ctx) => const LoginScreen(),
          "/home": (ctx) => const HomeScreen(),
          "/check-in": (ctx) => const CheckInScreen(),
          "/history": (ctx) => const HistoryScreen(),
          "/profile": (ctx) => const ProfileScreen(),
        },
      ),
    );
  }
}
