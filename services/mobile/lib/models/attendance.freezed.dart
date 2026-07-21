// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'attendance.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Attendance _$AttendanceFromJson(Map<String, dynamic> json) {
  return _Attendance.fromJson(json);
}

/// @nodoc
mixin _$Attendance {
  int get id => throw _privateConstructorUsedError;
  int get employeeId => throw _privateConstructorUsedError;
  DateTime get date => throw _privateConstructorUsedError;
  DateTime? get checkInTime => throw _privateConstructorUsedError;
  DateTime? get checkOutTime => throw _privateConstructorUsedError;
  double get workedHours => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  String? get geofenceName => throw _privateConstructorUsedError;

  /// Serializes this Attendance to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Attendance
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AttendanceCopyWith<Attendance> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AttendanceCopyWith<$Res> {
  factory $AttendanceCopyWith(
          Attendance value, $Res Function(Attendance) then) =
      _$AttendanceCopyWithImpl<$Res, Attendance>;
  @useResult
  $Res call(
      {int id,
      int employeeId,
      DateTime date,
      DateTime? checkInTime,
      DateTime? checkOutTime,
      double workedHours,
      String status,
      String? geofenceName});
}

/// @nodoc
class _$AttendanceCopyWithImpl<$Res, $Val extends Attendance>
    implements $AttendanceCopyWith<$Res> {
  _$AttendanceCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Attendance
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? employeeId = null,
    Object? date = null,
    Object? checkInTime = freezed,
    Object? checkOutTime = freezed,
    Object? workedHours = null,
    Object? status = null,
    Object? geofenceName = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      employeeId: null == employeeId
          ? _value.employeeId
          : employeeId // ignore: cast_nullable_to_non_nullable
              as int,
      date: null == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as DateTime,
      checkInTime: freezed == checkInTime
          ? _value.checkInTime
          : checkInTime // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      checkOutTime: freezed == checkOutTime
          ? _value.checkOutTime
          : checkOutTime // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      workedHours: null == workedHours
          ? _value.workedHours
          : workedHours // ignore: cast_nullable_to_non_nullable
              as double,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      geofenceName: freezed == geofenceName
          ? _value.geofenceName
          : geofenceName // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AttendanceImplCopyWith<$Res>
    implements $AttendanceCopyWith<$Res> {
  factory _$$AttendanceImplCopyWith(
          _$AttendanceImpl value, $Res Function(_$AttendanceImpl) then) =
      __$$AttendanceImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int id,
      int employeeId,
      DateTime date,
      DateTime? checkInTime,
      DateTime? checkOutTime,
      double workedHours,
      String status,
      String? geofenceName});
}

/// @nodoc
class __$$AttendanceImplCopyWithImpl<$Res>
    extends _$AttendanceCopyWithImpl<$Res, _$AttendanceImpl>
    implements _$$AttendanceImplCopyWith<$Res> {
  __$$AttendanceImplCopyWithImpl(
      _$AttendanceImpl _value, $Res Function(_$AttendanceImpl) _then)
      : super(_value, _then);

  /// Create a copy of Attendance
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? employeeId = null,
    Object? date = null,
    Object? checkInTime = freezed,
    Object? checkOutTime = freezed,
    Object? workedHours = null,
    Object? status = null,
    Object? geofenceName = freezed,
  }) {
    return _then(_$AttendanceImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as int,
      employeeId: null == employeeId
          ? _value.employeeId
          : employeeId // ignore: cast_nullable_to_non_nullable
              as int,
      date: null == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as DateTime,
      checkInTime: freezed == checkInTime
          ? _value.checkInTime
          : checkInTime // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      checkOutTime: freezed == checkOutTime
          ? _value.checkOutTime
          : checkOutTime // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      workedHours: null == workedHours
          ? _value.workedHours
          : workedHours // ignore: cast_nullable_to_non_nullable
              as double,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      geofenceName: freezed == geofenceName
          ? _value.geofenceName
          : geofenceName // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AttendanceImpl implements _Attendance {
  const _$AttendanceImpl(
      {required this.id,
      required this.employeeId,
      required this.date,
      this.checkInTime,
      this.checkOutTime,
      this.workedHours = 0,
      this.status = 'present',
      this.geofenceName});

  factory _$AttendanceImpl.fromJson(Map<String, dynamic> json) =>
      _$$AttendanceImplFromJson(json);

  @override
  final int id;
  @override
  final int employeeId;
  @override
  final DateTime date;
  @override
  final DateTime? checkInTime;
  @override
  final DateTime? checkOutTime;
  @override
  @JsonKey()
  final double workedHours;
  @override
  @JsonKey()
  final String status;
  @override
  final String? geofenceName;

  @override
  String toString() {
    return 'Attendance(id: $id, employeeId: $employeeId, date: $date, checkInTime: $checkInTime, checkOutTime: $checkOutTime, workedHours: $workedHours, status: $status, geofenceName: $geofenceName)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AttendanceImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.employeeId, employeeId) ||
                other.employeeId == employeeId) &&
            (identical(other.date, date) || other.date == date) &&
            (identical(other.checkInTime, checkInTime) ||
                other.checkInTime == checkInTime) &&
            (identical(other.checkOutTime, checkOutTime) ||
                other.checkOutTime == checkOutTime) &&
            (identical(other.workedHours, workedHours) ||
                other.workedHours == workedHours) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.geofenceName, geofenceName) ||
                other.geofenceName == geofenceName));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, employeeId, date,
      checkInTime, checkOutTime, workedHours, status, geofenceName);

  /// Create a copy of Attendance
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AttendanceImplCopyWith<_$AttendanceImpl> get copyWith =>
      __$$AttendanceImplCopyWithImpl<_$AttendanceImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AttendanceImplToJson(
      this,
    );
  }
}

abstract class _Attendance implements Attendance {
  const factory _Attendance(
      {required final int id,
      required final int employeeId,
      required final DateTime date,
      final DateTime? checkInTime,
      final DateTime? checkOutTime,
      final double workedHours,
      final String status,
      final String? geofenceName}) = _$AttendanceImpl;

  factory _Attendance.fromJson(Map<String, dynamic> json) =
      _$AttendanceImpl.fromJson;

  @override
  int get id;
  @override
  int get employeeId;
  @override
  DateTime get date;
  @override
  DateTime? get checkInTime;
  @override
  DateTime? get checkOutTime;
  @override
  double get workedHours;
  @override
  String get status;
  @override
  String? get geofenceName;

  /// Create a copy of Attendance
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AttendanceImplCopyWith<_$AttendanceImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

AttendanceSummary _$AttendanceSummaryFromJson(Map<String, dynamic> json) {
  return _AttendanceSummary.fromJson(json);
}

/// @nodoc
mixin _$AttendanceSummary {
  int get totalDays => throw _privateConstructorUsedError;
  int get presentDays => throw _privateConstructorUsedError;
  int get lateDays => throw _privateConstructorUsedError;
  int get absentDays => throw _privateConstructorUsedError;
  double get avgWorkedHours => throw _privateConstructorUsedError;
  double get onTimeRate => throw _privateConstructorUsedError;

  /// Serializes this AttendanceSummary to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of AttendanceSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AttendanceSummaryCopyWith<AttendanceSummary> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AttendanceSummaryCopyWith<$Res> {
  factory $AttendanceSummaryCopyWith(
          AttendanceSummary value, $Res Function(AttendanceSummary) then) =
      _$AttendanceSummaryCopyWithImpl<$Res, AttendanceSummary>;
  @useResult
  $Res call(
      {int totalDays,
      int presentDays,
      int lateDays,
      int absentDays,
      double avgWorkedHours,
      double onTimeRate});
}

/// @nodoc
class _$AttendanceSummaryCopyWithImpl<$Res, $Val extends AttendanceSummary>
    implements $AttendanceSummaryCopyWith<$Res> {
  _$AttendanceSummaryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AttendanceSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? totalDays = null,
    Object? presentDays = null,
    Object? lateDays = null,
    Object? absentDays = null,
    Object? avgWorkedHours = null,
    Object? onTimeRate = null,
  }) {
    return _then(_value.copyWith(
      totalDays: null == totalDays
          ? _value.totalDays
          : totalDays // ignore: cast_nullable_to_non_nullable
              as int,
      presentDays: null == presentDays
          ? _value.presentDays
          : presentDays // ignore: cast_nullable_to_non_nullable
              as int,
      lateDays: null == lateDays
          ? _value.lateDays
          : lateDays // ignore: cast_nullable_to_non_nullable
              as int,
      absentDays: null == absentDays
          ? _value.absentDays
          : absentDays // ignore: cast_nullable_to_non_nullable
              as int,
      avgWorkedHours: null == avgWorkedHours
          ? _value.avgWorkedHours
          : avgWorkedHours // ignore: cast_nullable_to_non_nullable
              as double,
      onTimeRate: null == onTimeRate
          ? _value.onTimeRate
          : onTimeRate // ignore: cast_nullable_to_non_nullable
              as double,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AttendanceSummaryImplCopyWith<$Res>
    implements $AttendanceSummaryCopyWith<$Res> {
  factory _$$AttendanceSummaryImplCopyWith(_$AttendanceSummaryImpl value,
          $Res Function(_$AttendanceSummaryImpl) then) =
      __$$AttendanceSummaryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int totalDays,
      int presentDays,
      int lateDays,
      int absentDays,
      double avgWorkedHours,
      double onTimeRate});
}

/// @nodoc
class __$$AttendanceSummaryImplCopyWithImpl<$Res>
    extends _$AttendanceSummaryCopyWithImpl<$Res, _$AttendanceSummaryImpl>
    implements _$$AttendanceSummaryImplCopyWith<$Res> {
  __$$AttendanceSummaryImplCopyWithImpl(_$AttendanceSummaryImpl _value,
      $Res Function(_$AttendanceSummaryImpl) _then)
      : super(_value, _then);

  /// Create a copy of AttendanceSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? totalDays = null,
    Object? presentDays = null,
    Object? lateDays = null,
    Object? absentDays = null,
    Object? avgWorkedHours = null,
    Object? onTimeRate = null,
  }) {
    return _then(_$AttendanceSummaryImpl(
      totalDays: null == totalDays
          ? _value.totalDays
          : totalDays // ignore: cast_nullable_to_non_nullable
              as int,
      presentDays: null == presentDays
          ? _value.presentDays
          : presentDays // ignore: cast_nullable_to_non_nullable
              as int,
      lateDays: null == lateDays
          ? _value.lateDays
          : lateDays // ignore: cast_nullable_to_non_nullable
              as int,
      absentDays: null == absentDays
          ? _value.absentDays
          : absentDays // ignore: cast_nullable_to_non_nullable
              as int,
      avgWorkedHours: null == avgWorkedHours
          ? _value.avgWorkedHours
          : avgWorkedHours // ignore: cast_nullable_to_non_nullable
              as double,
      onTimeRate: null == onTimeRate
          ? _value.onTimeRate
          : onTimeRate // ignore: cast_nullable_to_non_nullable
              as double,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AttendanceSummaryImpl implements _AttendanceSummary {
  const _$AttendanceSummaryImpl(
      {this.totalDays = 0,
      this.presentDays = 0,
      this.lateDays = 0,
      this.absentDays = 0,
      this.avgWorkedHours = 0.0,
      this.onTimeRate = 0.0});

  factory _$AttendanceSummaryImpl.fromJson(Map<String, dynamic> json) =>
      _$$AttendanceSummaryImplFromJson(json);

  @override
  @JsonKey()
  final int totalDays;
  @override
  @JsonKey()
  final int presentDays;
  @override
  @JsonKey()
  final int lateDays;
  @override
  @JsonKey()
  final int absentDays;
  @override
  @JsonKey()
  final double avgWorkedHours;
  @override
  @JsonKey()
  final double onTimeRate;

  @override
  String toString() {
    return 'AttendanceSummary(totalDays: $totalDays, presentDays: $presentDays, lateDays: $lateDays, absentDays: $absentDays, avgWorkedHours: $avgWorkedHours, onTimeRate: $onTimeRate)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AttendanceSummaryImpl &&
            (identical(other.totalDays, totalDays) ||
                other.totalDays == totalDays) &&
            (identical(other.presentDays, presentDays) ||
                other.presentDays == presentDays) &&
            (identical(other.lateDays, lateDays) ||
                other.lateDays == lateDays) &&
            (identical(other.absentDays, absentDays) ||
                other.absentDays == absentDays) &&
            (identical(other.avgWorkedHours, avgWorkedHours) ||
                other.avgWorkedHours == avgWorkedHours) &&
            (identical(other.onTimeRate, onTimeRate) ||
                other.onTimeRate == onTimeRate));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, totalDays, presentDays, lateDays,
      absentDays, avgWorkedHours, onTimeRate);

  /// Create a copy of AttendanceSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AttendanceSummaryImplCopyWith<_$AttendanceSummaryImpl> get copyWith =>
      __$$AttendanceSummaryImplCopyWithImpl<_$AttendanceSummaryImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AttendanceSummaryImplToJson(
      this,
    );
  }
}

abstract class _AttendanceSummary implements AttendanceSummary {
  const factory _AttendanceSummary(
      {final int totalDays,
      final int presentDays,
      final int lateDays,
      final int absentDays,
      final double avgWorkedHours,
      final double onTimeRate}) = _$AttendanceSummaryImpl;

  factory _AttendanceSummary.fromJson(Map<String, dynamic> json) =
      _$AttendanceSummaryImpl.fromJson;

  @override
  int get totalDays;
  @override
  int get presentDays;
  @override
  int get lateDays;
  @override
  int get absentDays;
  @override
  double get avgWorkedHours;
  @override
  double get onTimeRate;

  /// Create a copy of AttendanceSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AttendanceSummaryImplCopyWith<_$AttendanceSummaryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
