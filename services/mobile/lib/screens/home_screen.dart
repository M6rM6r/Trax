import "package:flutter/material.dart";
import "dart:async";
import "package:provider/provider.dart";
import "../providers/auth_provider.dart";
import "../providers/attendance_provider.dart";
import "../providers/location_provider.dart";
import "../providers/notifications_provider.dart";
import "../widgets/notification_initializer.dart";

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final attendance = Provider.of<AttendanceProvider>(context);
    final location = Provider.of<LocationProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Trax"),
        actions: [
          _NotificationBell(),
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
            const NotificationInitializer(),
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
                final token = await auth.ensureToken();
                if (token == null) return;
                await attendance.fetchHistory(token);
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
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: (location.isTracking ? const Color(0xFF16A34A) : const Color(0xFF64748B))
                        .withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    location.isTracking ? Icons.gps_fixed : Icons.gps_off,
                    color: location.isTracking ? const Color(0xFF16A34A) : const Color(0xFF64748B),
                  ),
                ),
                title: Text(
                  location.isTracking ? "تتبع الموقع مفعّل" : "تتبع الموقع متوقف",
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: Text(
                  location.isTracking
                      ? "يتم إرسال موقعك في الخلفية حتى إغلاق التطبيق"
                      : "اضغط لتفعيل التتبع المستمر في الخلفية",
                ),
                trailing: Switch(
                  value: location.isTracking,
                  onChanged: (value) async {
                    final employeeId = auth.employeeId ?? 0;
                    if (employeeId == 0) return;

                    if (value) {
                      final granted = await location.requestPermission();
                      if (!granted) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("يلزم إذن الموقع في الخلفية")),
                          );
                        }
                        return;
                      }
                      await location.startTracking(employeeId: employeeId);
                    } else {
                      await location.stopTracking();
                    }
                  },
                ),
              ),
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

class _NotificationBell extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final notifications = Provider.of<NotificationsProvider>(context);

    return IconButton(
      icon: Stack(
        alignment: AlignmentDirectional.topEnd,
        children: [
          const Icon(Icons.notifications_outlined),
          if (notifications.unreadCount > 0)
            Positioned(
              top: 0,
              end: 0,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  notifications.unreadCount > 9 ? "9+" : notifications.unreadCount.toString(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
        ],
      ),
      onPressed: () => Navigator.pushNamed(context, "/notifications"),
    );
  }
}
