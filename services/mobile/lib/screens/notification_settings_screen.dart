import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "../providers/theme_provider.dart";
import "../services/notification_service.dart";

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  bool _attendanceAlerts = true;
  bool _lateAlerts = true;
  bool _geofenceAlerts = false;
  bool _anomalyAlerts = true;
  bool _pushEnabled = true;

  Future<void> _toggleTopic(String topic, bool enabled) async {
    if (enabled) {
      await NotificationService().subscribeToTopic(topic);
    } else {
      await NotificationService().unsubscribeFromTopic(topic);
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);

    return Scaffold(
      appBar: AppBar(title: const Text("إعدادات الإشعارات")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildSectionHeader("تنبيهات الحضور"),
          _buildSwitchTile(
            icon: Icons.check_circle,
            title: "إشعارات الحضور",
            subtitle: "تنبيه عند تسجيل الحضور",
            value: _attendanceAlerts,
            onChanged: (v) {
              setState(() => _attendanceAlerts = v);
              _toggleTopic("attendance", v);
            },
          ),
          _buildSwitchTile(
            icon: Icons.access_time,
            title: "إشعارات التأخير",
            subtitle: "تنبيه عند التأخر عن الحضور",
            value: _lateAlerts,
            onChanged: (v) {
              setState(() => _lateAlerts = v);
              _toggleTopic("late", v);
            },
          ),
          const SizedBox(height: 16),
          _buildSectionHeader("تنبيهات الموقع"),
          _buildSwitchTile(
            icon: Icons.location_off,
            title: "الخروج من النطاق",
            subtitle: "تنبيه عند الخروج من النطاق الجغرافي",
            value: _geofenceAlerts,
            onChanged: (v) {
              setState(() => _geofenceAlerts = v);
              _toggleTopic("geofence", v);
            },
          ),
          _buildSwitchTile(
            icon: Icons.warning,
            title: "كشف الشذوذ",
            subtitle: "تنبيه عند اكتشاف سلوك غير طبيعي",
            value: _anomalyAlerts,
            onChanged: (v) {
              setState(() => _anomalyAlerts = v);
              _toggleTopic("anomaly", v);
            },
          ),
          const SizedBox(height: 16),
          _buildSectionHeader("إعدادات عامة"),
          _buildSwitchTile(
            icon: Icons.notifications,
            title: "إشعارات الدفع",
            subtitle: "تفعيل إشعارات الدفع على الجوال",
            value: _pushEnabled,
            onChanged: (v) => setState(() => _pushEnabled = v),
          ),
          const SizedBox(height: 24),
          // Dark mode quick toggle
          _buildSectionHeader("المظهر"),
          Card(
            child: ListTile(
              leading: Icon(
                themeProvider.isDark ? Icons.dark_mode : Icons.light_mode,
                color: const Color(0xFF3C7EE7),
              ),
              title: const Text("الوضع الداكن"),
              subtitle: Text(themeProvider.themeModeLabel),
              trailing: Switch(
                value: themeProvider.isDark,
                onChanged: (_) => themeProvider.toggleTheme(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Color(0xFF3C7EE7),
        ),
      ),
    );
  }

  Widget _buildSwitchTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Card(
      child: SwitchListTile(
        secondary: Icon(icon, color: const Color(0xFF3C7EE7)),
        title: Text(title),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
        value: value,
        onChanged: onChanged,
      ),
    );
  }
}
