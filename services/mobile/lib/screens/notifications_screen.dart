import "package:flutter/material.dart";
import "package:provider/provider.dart";
import "package:intl/intl.dart";
import "../providers/notifications_provider.dart";
import "../providers/auth_provider.dart";

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) setState(() {});
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final notifications = Provider.of<NotificationsProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text("الإشعارات"),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: [
            const Tab(text: "الكل"),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text("غير المقروء"),
                  if (notifications.unreadCount > 0) ...[
                    const SizedBox(width: 6),
                    CircleAvatar(
                      radius: 10,
                      backgroundColor: Colors.white,
                      child: Text(
                        notifications.unreadCount > 99
                            ? "99+"
                            : notifications.unreadCount.toString(),
                        style: const TextStyle(
                          fontSize: 10,
                          color: Color(0xFF3C7EE7),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
        actions: [
          if (notifications.unreadCount > 0)
            TextButton(
              onPressed: () => notifications.markAllAsRead(),
              child: const Text(
                "تحديد الكل",
                style: TextStyle(color: Colors.white),
              ),
            ),
          IconButton(
            onPressed: () => _confirmClearAll(context, notifications),
            icon: const Icon(Icons.delete_outline, color: Colors.white),
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _NotificationList(notifications: notifications, onlyUnread: false, auth: auth),
          _NotificationList(notifications: notifications, onlyUnread: true, auth: auth),
        ],
      ),
    );
  }

  Future<void> _confirmClearAll(BuildContext context, NotificationsProvider notifications) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("مسح الإشعارات"),
        content: const Text("هل تريد مسح جميع الإشعارات؟"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text("إلغاء"),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text("مسح", style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirmed == true) await notifications.clearAll();
  }
}

class _NotificationList extends StatelessWidget {
  final NotificationsProvider notifications;
  final bool onlyUnread;
  final AuthProvider auth;

  const _NotificationList({
    required this.notifications,
    required this.onlyUnread,
    required this.auth,
  });

  @override
  Widget build(BuildContext context) {
    if (notifications.loading && notifications.allNotifications.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    final items = onlyUnread ? notifications.unreadNotifications : notifications.allNotifications;
    if (items.isEmpty) {
      return const Center(
        child: Text(
          "لا توجد إشعارات",
          style: TextStyle(color: Colors.grey, fontSize: 16),
        ),
      );
    }

    final grouped = _groupByDate(items);

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: grouped.length,
      itemBuilder: (context, index) {
        final group = grouped[index];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 8, bottom: 8),
              child: Text(
                group.label,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey,
                ),
              ),
            ),
            ...group.items.map((n) => _NotificationCard(
                  notification: n,
                  onTap: () => _handleTap(context, n),
                  onDelete: () => notifications.deleteNotification(n.id),
                  onMarkRead: () => notifications.markAsRead(n.id),
                )),
          ],
        );
      },
    );
  }

  List<_DateGroup> _groupByDate(List<AppNotification> items) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));

    final groups = <String, List<AppNotification>>{};
    for (final item in items) {
      final d = DateTime(item.timestamp.year, item.timestamp.month, item.timestamp.day);
      String label;
      if (d == today) {
        label = "اليوم";
      } else if (d == yesterday) {
        label = "أمس";
      } else {
        label = DateFormat("d MMMM yyyy", "ar").format(item.timestamp);
      }
      groups.putIfAbsent(label, () => []).add(item);
    }
    return groups.entries.map((e) => _DateGroup(label: e.key, items: e.value)).toList();
  }

  void _handleTap(BuildContext context, AppNotification n) {
    if (!n.read) {
      notifications.markAsRead(n.id);
    }
    if (n.type == "attendance") {
      Navigator.pushNamed(context, "/history");
    } else if (n.type == "reminder") {
      Navigator.pushNamed(context, "/check-in");
    }
  }
}

class _DateGroup {
  final String label;
  final List<AppNotification> items;

  _DateGroup({required this.label, required this.items});
}

class _NotificationCard extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onTap;
  final VoidCallback onDelete;
  final VoidCallback onMarkRead;

  const _NotificationCard({
    required this.notification,
    required this.onTap,
    required this.onDelete,
    required this.onMarkRead,
  });

  @override
  Widget build(BuildContext context) {
    final icon = _iconFor(notification.type);
    final color = _colorFor(notification.type);
    final location = notification.data?["geofenceName"] ??
        notification.data?["geofence"] ??
        notification.data?["location"];

    return Dismissible(
      key: ValueKey(notification.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: Colors.red,
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      onDismissed: (_) => onDelete(),
      child: Card(
        margin: const EdgeInsets.only(bottom: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              notification.title,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: notification.read ? Colors.grey : null,
                              ),
                            ),
                          ),
                          if (!notification.read)
                            GestureDetector(
                              onTap: onMarkRead,
                              child: Container(
                                width: 10,
                                height: 10,
                                margin: const EdgeInsetsDirectional.only(start: 6),
                                decoration: const BoxDecoration(
                                  color: Color(0xFF3C7EE7),
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        notification.message,
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey[700],
                        ),
                      ),
                      if (location != null && location.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.location_on, size: 14, color: Colors.grey),
                            const SizedBox(width: 4),
                            Text(
                              location,
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 8),
                      Text(
                        _timeAgo(notification.timestamp),
                        style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  IconData _iconFor(String type) {
    return switch (type) {
      "attendance" || "check_out" => Icons.check_circle,
      "late_arrival" => Icons.warning,
      "geofence_breach" => Icons.location_off,
      "reminder" => Icons.access_time_filled,
      "anomaly_detected" => Icons.notifications_active,
      _ => Icons.notifications,
    };
  }

  Color _colorFor(String type) {
    return switch (type) {
      "attendance" || "check_out" => const Color(0xFF16A34A),
      "late_arrival" => const Color(0xFFF59E0B),
      "geofence_breach" || "anomaly_detected" => const Color(0xFFEF4444),
      "reminder" => const Color(0xFF3C7EE7),
      _ => const Color(0xFF64748B),
    };
  }

  String _timeAgo(DateTime timestamp) {
    final now = DateTime.now();
    final diff = now.difference(timestamp);
    if (diff.inMinutes < 1) return "الآن";
    if (diff.inHours < 1) return "منذ ${diff.inMinutes} دقيقة";
    if (diff.inHours < 24) return "منذ ${diff.inHours} ساعة";
    return "منذ ${diff.inDays} يوم";
  }
}
