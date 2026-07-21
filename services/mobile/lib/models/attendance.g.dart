// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'attendance.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AttendanceImpl _$$AttendanceImplFromJson(Map<String, dynamic> json) =>
    _$AttendanceImpl(
      id: (json['id'] as num).toInt(),
      employeeId: (json['employeeId'] as num).toInt(),
      date: DateTime.parse(json['date'] as String),
      checkInTime: json['checkInTime'] == null
          ? null
          : DateTime.parse(json['checkInTime'] as String),
      checkOutTime: json['checkOutTime'] == null
          ? null
          : DateTime.parse(json['checkOutTime'] as String),
      workedHours: (json['workedHours'] as num?)?.toDouble() ?? 0,
      status: json['status'] as String? ?? 'present',
      geofenceName: json['geofenceName'] as String?,
    );

Map<String, dynamic> _$$AttendanceImplToJson(_$AttendanceImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'employeeId': instance.employeeId,
      'date': instance.date.toIso8601String(),
      'checkInTime': instance.checkInTime?.toIso8601String(),
      'checkOutTime': instance.checkOutTime?.toIso8601String(),
      'workedHours': instance.workedHours,
      'status': instance.status,
      'geofenceName': instance.geofenceName,
    };

_$AttendanceSummaryImpl _$$AttendanceSummaryImplFromJson(
        Map<String, dynamic> json) =>
    _$AttendanceSummaryImpl(
      totalDays: (json['totalDays'] as num?)?.toInt() ?? 0,
      presentDays: (json['presentDays'] as num?)?.toInt() ?? 0,
      lateDays: (json['lateDays'] as num?)?.toInt() ?? 0,
      absentDays: (json['absentDays'] as num?)?.toInt() ?? 0,
      avgWorkedHours: (json['avgWorkedHours'] as num?)?.toDouble() ?? 0.0,
      onTimeRate: (json['onTimeRate'] as num?)?.toDouble() ?? 0.0,
    );

Map<String, dynamic> _$$AttendanceSummaryImplToJson(
        _$AttendanceSummaryImpl instance) =>
    <String, dynamic>{
      'totalDays': instance.totalDays,
      'presentDays': instance.presentDays,
      'lateDays': instance.lateDays,
      'absentDays': instance.absentDays,
      'avgWorkedHours': instance.avgWorkedHours,
      'onTimeRate': instance.onTimeRate,
    };
