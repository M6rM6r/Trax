import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "../providers/attendance_provider.dart";
import "../providers/auth_provider.dart";

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final auth = context.read<AuthProvider>();
      final attendance = context.read<AttendanceProvider>();
      if (auth.hasEmployeeProfile) {
        await attendance.fetchHistory(
          companyId: auth.companyId!,
          employeeId: auth.employeeId!,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final attendance = context.watch<AttendanceProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text("سجل الحضور")),
      body: attendance.isLoading
          ? const Center(child: CircularProgressIndicator())
          : attendance.records.isEmpty
              ? Center(
                  child: Text(attendance.error ?? "لا يوجد سجلات"),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: attendance.records.length,
                  itemBuilder: (ctx, i) {
                    final record = attendance.records[i];
                    final status = record["status"]?.toString() ?? "unknown";
                    final statusColor = status == "present" || status == "checked_out"
                        ? const Color(0xFF16A34A)
                        : status == "late"
                            ? const Color(0xFFF59E0B)
                            : const Color(0xFFDC2626);
                    final cin = record["checkInTime"] ?? record["check_in_time"] ?? "-";
                    final cout = record["checkOutTime"] ?? record["check_out_time"] ?? "-";

                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: statusColor.withValues(alpha: 0.1),
                          child: Icon(
                            status == "late"
                                ? Icons.schedule
                                : status == "checked_out" || status == "present"
                                    ? Icons.check
                                    : Icons.close,
                            color: statusColor,
                          ),
                        ),
                        title: Text(record["date"]?.toString() ?? ""),
                        subtitle: Text("دخول: $cin | انصراف: $cout"),
                        trailing: Text(
                          status,
                          style: TextStyle(
                            color: statusColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
