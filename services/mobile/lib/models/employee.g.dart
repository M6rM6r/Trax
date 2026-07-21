// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'employee.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$EmployeeImpl _$$EmployeeImplFromJson(Map<String, dynamic> json) =>
    _$EmployeeImpl(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      department: json['department'] as String?,
      role: json['role'] as String?,
      status: json['status'] as String?,
      avatar: json['avatar'] as String?,
      geofenceId: (json['geofenceId'] as num?)?.toInt(),
      currentLat: (json['currentLat'] as num?)?.toDouble(),
      currentLng: (json['currentLng'] as num?)?.toDouble(),
      lastSeen: json['lastSeen'] == null
          ? null
          : DateTime.parse(json['lastSeen'] as String),
      batteryLevel: (json['batteryLevel'] as num?)?.toInt(),
    );

Map<String, dynamic> _$$EmployeeImplToJson(_$EmployeeImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'email': instance.email,
      'phone': instance.phone,
      'department': instance.department,
      'role': instance.role,
      'status': instance.status,
      'avatar': instance.avatar,
      'geofenceId': instance.geofenceId,
      'currentLat': instance.currentLat,
      'currentLng': instance.currentLng,
      'lastSeen': instance.lastSeen?.toIso8601String(),
      'batteryLevel': instance.batteryLevel,
    };
