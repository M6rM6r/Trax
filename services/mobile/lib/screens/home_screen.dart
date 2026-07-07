import "package:flutter/material.dart";
import "dart:async";
import "package:provider/provider.dart";
import "../providers/auth_provider.dart";
import "../providers/attendance_provider.dart";

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final attendance = Provider.of<AttendanceProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Trax"),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await auth.logout();
              if (context.mounted) {
                unawaited(Navigator.pushReplacementNamed(context, "/login"));
              }
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    const CircleAvatar(radius: 40, child: Icon(Icons.person, size: 40)),
                    const SizedBox(height: 12),
                    Text(auth.userName ?? "", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    Text(auth.userEmail ?? "", style: const TextStyle(color: Colors.grey)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            _buildActionCard(
              context,
              icon: Icons.location_on,
              title: "تسجيل الحضور",
              subtitle: "سجل دخولك باستخدام الموقع",
              color: const Color(0xFF16A34A),
              onTap: () => Navigator.pushNamed(context, "/check-in"),
            ),
            const SizedBox(height: 12),
            _buildActionCard(
              context,
              icon: Icons.history,
              title: "سجل الحضور",
              subtitle: "عرض سجل الحضور والانصراف",
              color: const Color(0xFF3C7EE7),
              onTap: () async {
                await attendance.fetchHistory(auth.token!);
                if (context.mounted) {
                  unawaited(Navigator.pushNamed(context, "/history"));
                }
              },
            ),
            const SizedBox(height: 12),
            _buildActionCard(
              context,
              icon: Icons.person_outline,
              title: "الملف الشخصي",
              subtitle: "عرض وتعديل بياناتك",
              color: const Color(0xFFF59E0B),
              onTap: () => Navigator.pushNamed(context, "/profile"),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: color),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
