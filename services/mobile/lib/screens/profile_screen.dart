import "package:flutter/material.dart";
import "dart:async";
import "package:provider/provider.dart";
import "../providers/auth_provider.dart";
import "../providers/theme_provider.dart";
import "../services/biometric_service.dart";

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _biometricAvailable = false;

  @override
  void initState() {
    super.initState();
    _checkBiometric();
  }

  Future<void> _checkBiometric() async {
    final available = await BiometricService().isAvailable();
    if (mounted) setState(() => _biometricAvailable = available);
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final themeProvider = Provider.of<ThemeProvider>(context);

    return Scaffold(
      appBar: AppBar(title: const Text("الملف الشخصي")),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const CircleAvatar(radius: 60, child: Icon(Icons.person, size: 60)),
            const SizedBox(height: 16),
            Text(auth.userName ?? "", style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(auth.userEmail ?? "", style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 32),
            const Card(
              child: ListTile(
                leading: Icon(Icons.badge),
                title: Text("المسمى الوظيفي"),
                subtitle: Text("موظف"),
              ),
            ),
            const Card(
              child: ListTile(
                leading: Icon(Icons.business),
                title: Text("القسم"),
                subtitle: Text("غير محدد"),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: ListTile(
                leading: Icon(themeProvider.isDark ? Icons.dark_mode : Icons.light_mode),
                title: const Text("المظهر"),
                subtitle: Text(themeProvider.themeModeLabel),
                trailing: DropdownButton<ThemeMode>(
                  value: themeProvider.themeMode,
                  items: const [
                    DropdownMenuItem(value: ThemeMode.light, child: Text("فاتح")),
                    DropdownMenuItem(value: ThemeMode.dark, child: Text("داكن")),
                    DropdownMenuItem(value: ThemeMode.system, child: Text("النظام")),
                  ],
                  onChanged: (mode) {
                    if (mode != null) themeProvider.setThemeMode(mode);
                  },
                ),
              ),
            ),
            if (_biometricAvailable) ...[
              const SizedBox(height: 8),
              Card(
                child: ListTile(
                  leading: const Icon(Icons.fingerprint),
                  title: const Text("المصادقة البيومترية"),
                  subtitle: const Text("استخدام البصمة لتسجيل الدخول"),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () async {
                    final success = await BiometricService().authenticate(
                      reason: "سجل الدخول باستخدام البصمة",
                    );
                    if (!success && context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("فشلت المصادقة البيومترية")),
                      );
                    }
                  },
                ),
              ),
            ],
            const Spacer(),
            TextButton(
              onPressed: () async {
                await auth.logout();
                if (context.mounted) {
                  unawaited(Navigator.pushReplacementNamed(context, "/login"));
                }
              },
              child: const Text("تسجيل الخروج", style: TextStyle(color: Colors.red)),
            ),
          ],
        ),
      ),
    );
  }
}
