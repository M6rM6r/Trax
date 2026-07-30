import "package:flutter/foundation.dart";
import "package:cloud_firestore/cloud_firestore.dart";
import "package:shared_preferences/shared_preferences.dart";
import "dart:async";

class AppNotification {
  final String id;
  final String type;
  final String title;
  final String message;
  final DateTime timestamp;
  final bool read;
  final String? employeeId;
  final String? employeeName;
  final Map<String, String>? data;
  final String priority;

  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.timestamp,
    this.read = false,
    this.employeeId,
    this.employeeName,
    this.data,
    this.priority = "normal",
  });

  AppNotification copyWith({bool? read}) {
    return AppNotification(
      id: id,
      type: type,
      title: title,
      message: message,
      timestamp: timestamp,
      read: read ?? this.read,
      employeeId: employeeId,
      employeeName: employeeName,
      data: data,
      priority: priority,
    );
  }
}

class NotificationsProvider extends ChangeNotifier {
  List<AppNotification> _notifications = [];
  bool _loading = false;
  String? _companyId;
  String? _userId;
  String? _employeeId;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _companySub;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _allSub;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _employeeSub;

  List<AppNotification> get allNotifications => List.unmodifiable(_notifications);

  List<AppNotification> get unreadNotifications =>
      _notifications.where((n) => !n.read).toList();

  int get unreadCount => _notifications.where((n) => !n.read).length;

  bool get loading => _loading;

  void start({
    required String? companyId,
    required String? userId,
    required String? employeeId,
  }) {
    if (_companyId == companyId && _userId == userId && _employeeId == employeeId) return;

    stop();
    _companyId = companyId;
    _userId = userId;
    _employeeId = employeeId;

    if (companyId == null || userId == null || companyId.isEmpty || userId.isEmpty) {
      _notifications = [];
      _loading = false;
      notifyListeners();
      return;
    }

    _loading = true;
    notifyListeners();

    final db = FirebaseFirestore.instance;

    _companySub = db
        .collection("notifications")
        .where("company_id", isEqualTo: companyId)
        .where("target_role", isEqualTo: "employee")
        .orderBy("created_at", descending: true)
        .limit(100)
        .snapshots()
        .listen(_onSnapshot, onError: _onError);

    _allSub = db
        .collection("notifications")
        .where("company_id", isEqualTo: companyId)
        .where("target_role", isEqualTo: "all")
        .orderBy("created_at", descending: true)
        .limit(100)
        .snapshots()
        .listen(_onSnapshot, onError: _onError);
  }

  void _onSnapshot(QuerySnapshot<Map<String, dynamic>> snapshot) {
    final updated = <String, AppNotification>{};
    for (final existing in _notifications) {
      updated[existing.id] = existing;
    }

    for (final change in snapshot.docChanges) {
      final doc = change.doc;
      final data = doc.data() ?? {};
      final id = doc.id;

      if (change.type == DocumentChangeType.removed) {
        updated.remove(id);
        continue;
      }

      final readBy = (data["read_by"] as List<dynamic>?)?.cast<String>() ?? [];
      final employeeIdField = data["employee_id"] as String?;

      // Filter employee-specific notifications by the logged-in employee.
      if (data["target_role"] == "employee" && employeeIdField != null && employeeIdField.isNotEmpty) {
        if (employeeIdField != (_employeeId ?? "")) {
          updated.remove(id);
          continue;
        }
      }

      final createdAt = data["created_at"] as Timestamp?;
      updated[id] = AppNotification(
        id: id,
        type: data["type"] as String? ?? "system",
        title: data["title"] as String? ?? "",
        message: data["message"] as String? ?? "",
        timestamp: createdAt?.toDate() ?? DateTime.now(),
        read: readBy.contains(_userId),
        employeeId: employeeIdField,
        employeeName: data["employee_name"] as String?,
        data: (data["data"] as Map<String, dynamic>?)?.cast<String, String>(),
        priority: data["priority"] as String? ?? "normal",
      );
    }

    _notifications = updated.values.toList()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
    _loading = false;
    notifyListeners();
  }

  void _onError(Object error) {
    debugPrint("[notifications] Firestore error: $error");
    _loading = false;
    notifyListeners();
  }

  void stop() {
    _companySub?.cancel();
    _allSub?.cancel();
    _employeeSub?.cancel();
    _companySub = null;
    _allSub = null;
    _employeeSub = null;
  }

  Future<void> markAsRead(String id) async {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index == -1) return;
    final userId = _userId;
    if (userId == null || userId.isEmpty) return;

    _notifications[index] = _notifications[index].copyWith(read: true);
    notifyListeners();

    try {
      await FirebaseFirestore.instance.collection("notifications").doc(id).update({
        "read_by": FieldValue.arrayUnion([userId]),
      });
    } catch (e) {
      debugPrint("[notifications] markAsRead failed: $e");
    }
  }

  Future<void> markAllAsRead() async {
    final userId = _userId;
    if (userId == null || userId.isEmpty) return;

    _notifications = _notifications.map((n) => n.copyWith(read: true)).toList();
    notifyListeners();

    final futures = _notifications
        .where((n) => !n.id.startsWith("local_"))
        .map((n) => FirebaseFirestore.instance.collection("notifications").doc(n.id).update({
              "read_by": FieldValue.arrayUnion([userId]),
            }));
    try {
      await Future.wait(futures, eagerError: false);
    } catch (e) {
      debugPrint("[notifications] markAllAsRead failed: $e");
    }
  }

  Future<void> deleteNotification(String id) async {
    _notifications = _notifications.where((n) => n.id != id).toList();
    notifyListeners();

    if (id.startsWith("local_")) return;
    try {
      await FirebaseFirestore.instance.collection("notifications").doc(id).delete();
    } catch (e) {
      debugPrint("[notifications] delete failed: $e");
    }
  }

  Future<void> clearAll() async {
    final saved = _notifications.where((n) => n.id.startsWith("local_")).toList();
    _notifications = saved;
    notifyListeners();

    try {
      final toDelete = _notifications
          .where((n) => !n.id.startsWith("local_"))
          .map((n) => FirebaseFirestore.instance.collection("notifications").doc(n.id).delete());
      await Future.wait(toDelete, eagerError: false);
    } catch (e) {
      debugPrint("[notifications] clearAll failed: $e");
    }
  }

  void addLocalNotification({
    required String id,
    required String type,
    required String title,
    required String message,
    Map<String, String>? data,
  }) {
    _notifications = [
      AppNotification(
        id: id,
        type: type,
        title: title,
        message: message,
        timestamp: DateTime.now(),
        read: false,
        data: data,
      ),
      ..._notifications,
    ].where((n) => _notifications.every((o) => o.id != n.id || o == n)).toList()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
    notifyListeners();

    // Persist local-only notifications so the unread badge survives restarts.
    _persistLocal();
  }

  Future<void> _persistLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final local = _notifications
          .where((n) => n.id.startsWith("local_"))
          .map((n) => {
                "id": n.id,
                "type": n.type,
                "title": n.title,
                "message": n.message,
                "timestamp": n.timestamp.toIso8601String(),
                "read": n.read,
                "data": n.data,
              })
          .toList();
      // Keep a small window to avoid unbounded growth.
      await prefs.setString("local_notifications", local.take(20).toString());
    } catch (_) {}
  }
}
