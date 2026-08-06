import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:local_auth/local_auth.dart";
import "package:provider/provider.dart";

import "../providers/attendance_provider.dart";
import "../providers/auth_provider.dart";
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

      if (auth.hasEmployeeProfile) {
        await attendance.fetchHistory(
          companyId: auth.companyId!,
          employeeId: auth.employeeId!,
        );
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
        localizedReason: "Confirm identity for attendance",
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
        const SnackBar(content: Text("Synced pending actions")),
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
        title: const Text("Confirm check-out"),
        content: const Text("Check out now?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text("Cancel"),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text("Confirm"),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _busy = true);
    try {
      await auth.ensureToken();
      if (!auth.hasEmployeeProfile) {
        scaffold.showSnackBar(
          const SnackBar(content: Text("Session invalid. Sign in again.")),
        );
        return;
      }

      final success = await attendance.checkOut(
        companyId: auth.companyId!,
        employeeId: auth.employeeId!,
        lat: location.lat,
        lng: location.lng,
      );
      if (!mounted) return;
      if (success) {
        await location.stopTracking();
        await OfflineSyncService().syncPendingActions();
        await _loadPendingCount();
        scaffold.showSnackBar(const SnackBar(content: Text("Checked out")));
      } else if (attendance.error != null) {
        scaffold.showSnackBar(SnackBar(content: Text(attendance.error!)));
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

      await auth.ensureToken();
      if (!mounted) return;
      if (!auth.hasEmployeeProfile) {
        scaffold.showSnackBar(
          const SnackBar(content: Text("Missing employee profile")),
        );
        return;
      }

      final battery = await _getBatteryLevel();
      final success = await attendance.checkIn(
        companyId: auth.companyId!,
        employeeId: auth.employeeId!,
        employeeName: auth.userName ?? "",
        lat: location.lat!,
        lng: location.lng!,
        batteryLevel: battery,
        accuracy: location.accuracy,
        locationTimestamp: location.locationAt,
      );

      if (!mounted) return;
      if (success) {
        try {
          await location.startTracking(
            employeeId: auth.employeeId!,
            employeeName: auth.userName,
            companyId: auth.companyId,
          );
        } catch (_) {}
        await OfflineSyncService().syncPendingActions();
        await _loadPendingCount();
        scaffold.showSnackBar(const SnackBar(content: Text("Checked in")));
      } else if (attendance.error != null) {
        scaffold.showSnackBar(SnackBar(content: Text(attendance.error!)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer3<AuthProvider, AttendanceProvider, LocationProvider>(
      builder: (context, auth, attendance, location, _) {
        final status = attendance.todayStatus;
        final checkedIn =
            status != null && status != "checked_out" && status.isNotEmpty;
        final checkedOut = status == "checked_out";

        return Scaffold(
          appBar: AppBar(
            title: const Text("Attendance"),
            actions: [
              if (_pendingCount > 0)
                TextButton.icon(
                  onPressed: _syncPending,
                  icon: const Icon(Icons.sync, color: Colors.white),
                  label: Text(
                    "$_pendingCount",
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
            ],
          ),
          body: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          auth.userName ?? "—",
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          auth.companyName ?? auth.companyId ?? "",
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          location.lat != null
                              ? "GPS ±${(location.accuracy ?? 0).toStringAsFixed(0)}m"
                              : (location.error ?? "Locating…"),
                        ),
                        if (status != null) ...[
                          const SizedBox(height: 8),
                          Chip(label: Text(status)),
                        ],
                      ],
                    ),
                  ),
                ),
                const Spacer(),
                if (_busy || attendance.isLoading)
                  const Center(child: CircularProgressIndicator())
                else ...[
                  if (!checkedIn || checkedOut)
                    FilledButton.icon(
                      onPressed: () => _doCheckIn(auth, attendance, location),
                      icon: const Icon(Icons.login),
                      label: const Padding(
                        padding: EdgeInsets.symmetric(vertical: 14),
                        child: Text("Check in", style: TextStyle(fontSize: 18)),
                      ),
                    ),
                  if (checkedIn && !checkedOut) ...[
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: () =>
                          _confirmCheckOut(attendance, auth, location),
                      icon: const Icon(Icons.logout),
                      label: const Padding(
                        padding: EdgeInsets.symmetric(vertical: 14),
                        child:
                            Text("Check out", style: TextStyle(fontSize: 18)),
                      ),
                    ),
                  ],
                ],
                const SizedBox(height: 24),
              ],
            ),
          ),
        );
      },
    );
  }
}
