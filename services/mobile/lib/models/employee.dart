import 'package:freezed_annotation/freezed_annotation.dart';

part 'employee.freezed.dart';
part 'employee.g.dart';

@freezed
class Employee with _$Employee {
  const factory Employee({
    required int id,
    required String name,
    required String email,
    String? phone,
    String? department,
    String? role,
    String? status,
    String? avatar,
    int? geofenceId,
    double? currentLat,
    double? currentLng,
    DateTime? lastSeen,
    int? batteryLevel,
  }) = _Employee;

  factory Employee.fromJson(Map<String, dynamic> json) => _$EmployeeFromJson(json);
}
