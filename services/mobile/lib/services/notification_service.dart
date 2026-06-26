import "package:flutter_local_notifications/flutter_local_notifications.dart";
import "package:firebase_messaging/firebase_messaging.dart";
import "package:firebase_core/firebase_core.dart";

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    await Firebase.initializeApp();

    const androidSettings = AndroidInitializationSettings("@mipmap/ic_launcher");
    const iosSettings = DarwinInitializationSettings();
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    await _requestPermissions();

    FirebaseMessaging.onMessage.listen(_onForegroundMessage);
    FirebaseMessaging.onBackgroundMessage(_backgroundHandler);
  }

  Future<void> _requestPermissions() async {
    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    final androidPlugin =
        _localNotifications.resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.requestNotificationsPermission();
  }

  void _onNotificationTap(NotificationResponse response) {
    // Handle notification tap — navigate to relevant screen
  }

  void _onForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification != null) {
      showLocalNotification(
        title: notification.title ?? "Trax",
        body: notification.body ?? "",
        payload: message.data.toString(),
      );
    }
  }

  Future<void> showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      "trax_channel",
      "Trax Notifications",
      channelDescription: "Attendance and tracking notifications",
      importance: Importance.high,
      priority: Priority.high,
    );
    const iosDetails = DarwinNotificationDetails();
    const details = NotificationDetails(android: androidDetails, iOS: iosDetails);

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: payload,
    );
  }

  Future<String?> getFCMToken() async {
    return await FirebaseMessaging.instance.getToken();
  }

  Future<void> subscribeToTopic(String topic) async {
    await FirebaseMessaging.instance.subscribeToTopic(topic);
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    await FirebaseMessaging.instance.unsubscribeFromTopic(topic);
  }
}

@pragma("vm:entry-point")
Future<void> _backgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // Handle background notification — store for later processing
}
