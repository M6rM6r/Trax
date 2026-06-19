import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "../providers/auth_provider.dart";
import "../providers/attendance_provider.dart";
import "../providers/location_provider.dart";

class CheckInScreen extends StatefulWidget {
  const CheckInScreen({super.key});

  @override
  State<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends State<CheckInScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final location = Provider.of<LocationProvider>(context, listen: false);
      location.requestPermission().then((granted) {
        if (granted) location.getCurrentLocation();
      });
    });
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
            if (attendance.todayStatus == "present") ...[
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Icon(Icons.check_circle, size: 48, color: Color(0xFF16A34A)),
                      SizedBox(height: 8),
                      Text("تم تسجيل الحضور", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton.tonal(
                onPressed: attendance.isLoading
                    ? null
                    : () async {
                        await attendance.checkOut(auth.token!);
                      },
                child: const Text("تسجيل الانصراف"),
              ),
            ] else ...[
              FilledButton(
                onPressed: (location.lat == null || attendance.isLoading)
                    ? null
                    : () async {
                        final success = await attendance.checkIn(
                          auth.token!,
                          location.lat!,
                          location.lng!,
                          null,
                        );
                        if (success && context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("تم تسجيل الحضور بنجاح")),
                          );
                        }
                      },
                child: attendance.isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white))
                    : const Text("تسجيل الحضور الآن"),
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
