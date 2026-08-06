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
  bool _busy = false;
  final LocalAuthentication _localAuth = LocalAuthentication();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final location = Provider.of<LocationProvider>(context, listen: false);
      final attendance = Provider.of<AttendanceProvider>(context, listen: false);
      final auth = Provider.of<AuthProvider>(context, listen: false);

      final granted = await location.requestPermission();
      if (granted) await location.getCurrentLocation();

      final token = await auth.ensureToken();
      if (token != null && token.isNotEmpty) {
        await attendance.fetchHistory(token);
      }

      await OfflineSyncService().syncPendingActions();
      await _loadPendingCount();
    });
  }

  Future<bool> _authenticateBiometric() async {
    try {
      final canCheck = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      if (!canCheck && !isDeviceSupported) return true;
      return await _localAuth.authenticate(
        localizedReason: "تأكيد هويتك لتسجيل الحضور",
        options: const AuthenticationOptions(
          biometricOnly: false,
          stickyAuth: true,
        ),
      );
    } on PlatformException {
      return true;
    }
  }

  Future<int?> _getBatteryLevel() async {
    try {
      const channel = MethodChannel("com.trax.battery");
      return await channel.invokeMethod<int>("getBatteryLevel");
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
    await _loadPendingCount();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("تمت مزامنة البيانات المعلقة")),
      );
    }
  }

  Future<void> _confirmCheckOut(
    AttendanceProvider attendance,
    AuthProvider auth,
    LocationProvider location,
  ) async {
    if (_busy) return;
    final scaffold = ScaffoldMessenger.of(context);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("تأكيد الانصراف"),
        content: const Text("هل أنت متأكد من تسجيل الانصراف؟"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text("إلغاء"),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text("تأكيد"),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _busy = true);
    try {
      final token = await auth.ensureToken();
      final employeeId = auth.employeeId ?? 0;
      if (token == null || employeeId <= 0) {
        scaffold.showSnackBar(
          const SnackBar(content: Text("Session invalid. Sign in again.")),
        );
        return;
      }

      final success = await attendance.checkOut(
        token,
        employeeId,
        lat: location.lat,
        lng: location.lng,
      );
      if (!mounted) return;
      if (success) {
        await location.stopTracking();
        await OfflineSyncService().syncPendingActions();
        await _loadPendingCount();
        scaffold.showSnackBar(
          const SnackBar(content: Text("تم تسجيل الانصراف بنجاح")),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _doCheckIn(
    AuthProvider auth,
    AttendanceProvider attendance,
    LocationProvider location,
  ) async {
    if (_busy) return;
    setState(() => _busy = true);
    final scaffold = ScaffoldMessenger.of(context);

    try {
      final authenticated = await _authenticateBiometric();
      if (!authenticated || !mounted) return;

      // Fresh GPS before punch
      await location.getCurrentLocation(force: true);
      if (!mounted) return;
      if (location.lat == null || location.lng == null) {
        scaffold.showSnackBar(
          SnackBar(content: Text(location.error ?? "GPS unavailable")),
        );
        return;
      }
      if (!location.isFresh()) {
        scaffold.showSnackBar(
          const SnackBar(content: Text("GPS stale — refresh and try again")),
        );
        return;
      }

      final token = await auth.ensureToken();
      if (token == null || !mounted) return;
      final employeeId = auth.employeeId ?? 0;
      if (employeeId <= 0) {
        scaffold.showSnackBar(
          const SnackBar(content: Text("Missing employee profile")),
        );
        return;
      }

      final battery = await _getBatteryLevel();
      final success = await attendance.checkIn(
        token,
        employeeId,
        location.lat!,
        location.lng!,
        null,
        batteryLevel: battery,
        accuracy: location.accuracy,
        locationTimestamp: location.locationAt,
      );

      if (!mounted) return;
      if (success) {
        try {
          await location.startTracking(
            employeeId: employeeId,
            employeeName: auth.userName,
            companyId: auth.companyId?.toString(),
          );
        } catch (_) {}
        await OfflineSyncService().syncPendingActions();
        await _loadPendingCount();
        if (mounted) {
          scaffold.showSnackBar(
            const SnackBar(content: Text("تم تسجيل الحضور بنجاح")),
          );
        }
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final location = Provider.of<LocationProvider>(context);
    final attendance = Provider.of<AttendanceProvider>(context);
    final auth = Provider.of<AuthProvider>(context);
    final loading = attendance.isLoading || _busy;

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
                    const Icon(
                      Icons.location_on,
                      size: 48,
                      color: Color(0xFF3C7EE7),
                    ),
                    const SizedBox(height: 12),
                    if (location.lat != null && location.lng != null) ...[
                      Text("Latitude: ${location.lat!.toStringAsFixed(6)}"),
                      Text("Longitude: ${location.lng!.toStringAsFixed(6)}"),
                      Text(
                        "Accuracy: ±${location.accuracy?.toStringAsFixed(0) ?? "?"}m",
                      ),
                      if (location.locationAt != null)
                        Text(
                          location.isFresh()
                              ? "GPS fresh"
                              : "GPS aging — tap refresh",
                          style: TextStyle(
                            color: location.isFresh()
                                ? const Color(0xFF16A34A)
                                : const Color(0xFFF59E0B),
                            fontSize: 12,
                          ),
                        ),
                      TextButton.icon(
                        onPressed: loading
                            ? null
                            : () => location.getCurrentLocation(force: true),
                        icon: const Icon(Icons.my_location, size: 18),
                        label: const Text("تحديث الموقع"),
                      ),
                    ] else if (location.error != null) ...[
                      Text(
                        location.error!,
                        style: const TextStyle(color: Colors.red),
                        textAlign: TextAlign.center,
                      ),
                      TextButton(
                        onPressed: () => location.getCurrentLocation(force: true),
                        child: const Text("إعادة المحاولة"),
                      ),
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
            if (attendance.todayStatus == "present" ||
                attendance.todayStatus == "late") ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Icon(
                        attendance.todayStatus == "late"
                            ? Icons.access_time
                            : Icons.check_circle,
                        size: 48,
                        color: attendance.todayStatus == "late"
                            ? const Color(0xFFF59E0B)
                            : const Color(0xFF16A34A),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        attendance.todayStatus == "late"
                            ? "تم تسجيل الحضور (متأخر)"
                            : "تم تسجيل الحضور",
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton.tonalIcon(
                onPressed: loading
                    ? null
                    : () => _confirmCheckOut(attendance, auth, location),
                icon: const Icon(Icons.logout),
                label: loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(),
                      )
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
                      Text(
                        "تم تسجيل الانصراف",
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ] else ...[
              FilledButton.icon(
                onPressed: (location.lat == null || loading)
                    ? null
                    : () => _doCheckIn(auth, attendance, location),
                icon: loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white),
                      )
                    : const Icon(Icons.login),
                label: const Text("تسجيل الحضور الآن"),
              ),
            ],
            if (attendance.error != null) ...[
              const SizedBox(height: 16),
              Text(
                attendance.error!,
                style: const TextStyle(color: Colors.red),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
