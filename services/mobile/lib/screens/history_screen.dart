import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "../providers/attendance_provider.dart";

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final attendance = Provider.of<AttendanceProvider>(context);

    return Scaffold(
      appBar: AppBar(title: const Text("سجل الحضور")),
      body: attendance.isLoading
          ? const Center(child: CircularProgressIndicator())
          : attendance.records.isEmpty
              ? const Center(child: Text("لا يوجد سجلات"))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: attendance.records.length,
                  itemBuilder: (ctx, i) {
                    final record = attendance.records[i];
                    final status = record["status"]?.toString() ?? "unknown";
                    final statusColor = status == "present"
                        ? const Color(0xFF16A34A)
                        : status == "late"
                            ? const Color(0xFFF59E0B)
                            : const Color(0xFFDC2626);

                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: statusColor.withValues(alpha: 0.1),
                          child: Icon(
                            status == "present" ? Icons.check : status == "late" ? Icons.schedule : Icons.close,
                            color: statusColor,
                          ),
                        ),
                        title: Text(record["date"]?.toString() ?? ""),
                        subtitle: Text("دخول: ${record["check_in_time"] ?? "-"} | انصراف: ${record["check_out_time"] ?? "-"}"),
                        trailing: Text(
                          status,
                          style: TextStyle(color: statusColor, fontWeight: FontWeight.bold),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
