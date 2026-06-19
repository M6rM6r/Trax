# Trax Employee App — Flutter

Companion mobile app for employees to check in/out, view attendance history, and track location.

## Features

- **JWT Authentication** — Secure login with token persistence
- **GPS Check-in** — Geolocation-based attendance with accuracy display
- **Check-out** — Record departure time with worked hours calculation
- **History** — View past attendance records with status indicators
- **Profile** — View employee information
- **Real-time Location** — Continuous location tracking with `geolocator`

## Setup

```bash
cd services/mobile
flutter pub get
flutter run
```

## Tech Stack

| Layer         | Technology                      |
| ------------- | ------------------------------- |
| Framework     | Flutter 3.22+                   |
| State         | Provider                        |
| HTTP          | http package                    |
| Location      | geolocator + permission_handler |
| Storage       | shared_preferences              |
| Fonts         | google_fonts (Cairo)            |
| Notifications | flutter_local_notifications     |

## Mock Credentials

| Email             | Password |
| ----------------- | -------- |
| employee@trax.com | 12345678 |
