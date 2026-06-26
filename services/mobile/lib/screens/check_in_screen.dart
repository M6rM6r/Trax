import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:provider/provider.dart";
import "package:local_auth/local_auth.dart";
import "../providers/auth_provider.dart";
import "../providers/attendance_provider.dart";
import "../providers/location_provider.dart";
import "../services/offline_sync_service.dart";

class CheckInScreen extends StatefulWidget {
  const CheckInScreen({super.key});

  @override
  State<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends State<CheckInScreen> {
  int _pendingCount = 0;
  final LocalAuthentication _localAuth = LocalAuthentication();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final location = Provider.of<LocationProvider>(context, listen: false);
      location.requestPermission().then((granted) {
        if (granted) location.getCurrentLocation();
      });
      _loadPendingCount();
    });
  }

  Future<bool> _authenticateBiometric() async {
    try {
      final canCheck = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      if (!canCheck && !isDeviceSupported) return true;
      return await _localAuth.authenticate(
        localizedReason: 'تأكيد هويتك لتسجيل الحضور',
        options: const AuthenticationOptions(biometricOnly: false, stickyAuth: true),
      );
    } on PlatformException {
      return true;
    }
  }

  Future<int?> _getBatteryLevel() async {
    try {
      const channel = MethodChannel('com.trax.battery');
      final level = await channel.invokeMethod<int>('getBatteryLevel');
      return level;
    } catch (_) {
      return null;
    }
  }

  Future<void> _loadPendingCount() async {
    final count = await OfflineSyncService().pendingCount();
    if (mounted) setState(() => _pendingCount = count);
  }

  Future<void> _syncPending() async {
    await OfflineSyncService().syncPendingActions();
    _loadPendingCount();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("تمت مزامنة البيانات المعلقة")),
      );
    }
  }

  Future<void> _confirmCheckOut(
    AttendanceProvider attendance,
    String token,
    int employeeId,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("تأكيد الانصراف"),
        content: const Text("هل أنت متأكد من تسجيل الانصراف؟"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("إلغاء")),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text("تأكيد")),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await attendance.checkOut(token, employeeId);
      if (success && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("تم تسجيل الانصراف بنجاح")),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final location = Provider.of<LocationProvider>(context);
    final attendance = Provider.of<AttendanceProvider>(context);
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(title: const Text("تسجيل الحضور")),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_pendingCount > 0) ...[
              Card(
                color: Theme.of(context).colorScheme.tertiaryContainer,
                child: ListTile(
                  leading: const Icon(Icons.sync_problem),
                  title: Text("$_pendingCount إجراء معلق"),
                  subtitle: const Text("اضغط للمزامنة"),
                  onTap: _syncPending,
                ),
              ),
              const SizedBox(height: 16),
            ],
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    const Icon(Icons.location_on, size: 48, color: Color(0xFF3C7EE7)),
                    const SizedBox(height: 12),
                    if (location.lat != null && location.lng != null) ...[
                      Text("Latitude: ${location.lat!.toStringAsFixed(6)}"),
                      Text("Longitude: ${location.lng!.toStringAsFixed(6)}"),
                      Text("Accuracy: ±${location.accuracy?.toStringAsFixed(0)}m"),
                    ] else if (location.error != null) ...[
                      Text(location.error!, style: const TextStyle(color: Colors.red), textAlign: TextAlign.center),
                    ] else ...[
                      const CircularProgressIndicator(),
                      const SizedBox(height: 8),
                      const Text("جاري تحديد الموقع..."),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            if (attendance.todayStatus == "present" || attendance.todayStatus == "late") ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Icon(
                        attendance.todayStatus == "late" ? Icons.access_time : Icons.check_circle,
                        size: 48,
                        color: attendance.todayStatus == "late" ? const Color(0xFFF59E0B) : const Color(0xFF16A34A),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        attendance.todayStatus == "late" ? "تم تسجيل الحضور (متأخر)" : "تم تسجيل الحضور",
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton.tonalIcon(
                onPressed: attendance.isLoading
                    ? null
                    : () => _confirmCheckOut(attendance, auth.token!, auth.userId ?? 0),
                icon: const Icon(Icons.logout),
                label: attendance.isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator())
                    : const Text("تسجيل الانصراف"),
              ),
            ] else if (attendance.todayStatus == "checked_out") ...[
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Icon(Icons.task_alt, size: 48, color: Color(0xFF64748B)),
                      SizedBox(height: 8),
                      Text("تم تسجيل الانصراف", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ] else ...[
              FilledButton.icon(
                onPressed: (location.lat == null || attendance.isLoading)
                    ? null
                    : () async {
                        final authenticated = await _authenticateBiometric();
                        if (!authenticated || !context.mounted) return;
                        final battery = await _getBatteryLevel();
                        final success = await attendance.checkIn(
                          auth.token!,
                          auth.userId ?? 0,
                          location.lat!,
                          location.lng!,
                          null,
                          batteryLevel: battery,
                        );
                        if (success && context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("تم تسجيل الحضور بنجاح")),
                          );
                        }
                      },
                icon: attendance.isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white))
                    : const Icon(Icons.login),
                label: const Text("تسجيل الحضور الآن"),
              ),
            ],
            if (attendance.error != null) ...[
              const SizedBox(height: 16),
              Text(attendance.error!, style: const TextStyle(color: Colors.red), textAlign: TextAlign.center),
            ],
          ],
        ),
      ),
    );
  }
}
