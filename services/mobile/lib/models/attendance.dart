import 'package:freezed_annotation/freezed_annotation.dart';

part 'attendance.freezed.dart';
part 'attendance.g.dart';

@freezed
class Attendance with _$Attendance {
  const factory Attendance({
    required int id,
    required int employeeId,
    required DateTime date,
    DateTime? checkInTime,
    DateTime? checkOutTime,
    @Default(0) double workedHours,
    @Default('present') String status,
    String? geofenceName,
  }) = _Attendance;

  factory Attendance.fromJson(Map<String, dynamic> json) => _$AttendanceFromJson(json);
}

@freezed
class AttendanceSummary with _$AttendanceSummary {
  const factory AttendanceSummary({
    @Default(0) int totalDays,
    @Default(0) int presentDays,
    @Default(0) int lateDays,
    @Default(0) int absentDays,
    @Default(0.0) double avgWorkedHours,
    @Default(0.0) double onTimeRate,
  }) = _AttendanceSummary;

  factory AttendanceSummary.fromJson(Map<String, dynamic> json) => _$AttendanceSummaryFromJson(json);
}
