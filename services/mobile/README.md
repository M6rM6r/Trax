# Trax Employee App — Flutter

Companion mobile app for employees to check in/out, view attendance history, and track location.

## Features

- **JWT Authentication** — Secure login with token persistence
- **GPS Check-in** — Geolocation-based attendance with accuracy display
- **Check-out** — Record departure time with worked hours calculation
- **History** — View past attendance records with status indicators
- **Profile** — View employee information
- **Background Location Tracking** — Continuous GPS tracking that persists while the app is in the background or after the app is killed (until explicitly toggled off)

## Setup

```bash
cd services/mobile
flutter pub get
flutter run
```

## Tech Stack

| Layer         | Technology                                                       |
| ------------- | ---------------------------------------------------------------- |
| Framework     | Flutter 3.22+                                                    |
| State         | Provider                                                         |
| HTTP          | http package                                                     |
| Location      | flutter_background_geolocation + geolocator + permission_handler |
| Storage       | shared_preferences                                               |
| Fonts         | google_fonts (Cairo)                                             |
| Notifications | flutter_local_notifications                                      |

## Background Location

The app uses `flutter_background_geolocation` to send location heartbeats to the backend even when the device is locked or the app is closed. Tracking is toggled manually from the home screen or automatically started on check-in and stopped on check-out. The tracking state is persisted, so it resumes after a device reboot or app restart.

### Required Platform Configuration

Platform directories (`android/` and `ios/`) are included in the repo and already configured for background location. Run `flutter pub get` and build normally.

#### Android (`android/app/src/main/AndroidManifest.xml`)

The following permissions and services are already added in the committed manifest:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.INTERNET" />
```

Also ensure `compileSdkVersion` and `targetSdkVersion` are at least 34 (handled by `flutter.compileSdkVersion` in `android/app/build.gradle.kts`).

#### iOS (`ios/Runner/Info.plist`)

The following location usage strings and background modes are already added:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Trax needs your location to record attendance and track work hours.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Trax needs your location in the background to keep your attendance status up to date.</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>Trax needs your location in the background to keep your attendance status up to date.</string>
<key>UIBackgroundModes</key>
<array>
  <string>location</string>
  <string>fetch</string>
  <string>processing</string>
</array>
```

In Xcode, enable **Background Modes → Location updates, Background fetch, Background processing** and add the **Always** location capability.

> **Note:** `flutter_background_geolocation` works on Android without a license. For iOS production builds, a plugin license is required from Transistor Software.

## Mock Credentials

| Email             | Password |
| ----------------- | -------- |
| employee@trax.com | 12345678 |
