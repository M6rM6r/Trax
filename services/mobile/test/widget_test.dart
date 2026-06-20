import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:trax_employee/providers/auth_provider.dart';
import 'package:trax_employee/providers/attendance_provider.dart';
import 'package:trax_employee/providers/location_provider.dart';
import 'package:trax_employee/screens/login_screen.dart';

void main() {
  testWidgets('Login screen renders required elements', (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider(create: (_) => AttendanceProvider()),
          ChangeNotifierProvider(create: (_) => LocationProvider()),
        ],
        child: const MaterialApp(home: LoginScreen()),
      ),
    );

    await tester.pump();

    expect(find.byType(TextField), findsNWidgets(2));
    expect(find.byType(ElevatedButton), findsOneWidget);
  });
}
