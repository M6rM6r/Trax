# Trax Backend API — Laravel 11

REST API for employee tracking, attendance management, and geofence operations.

## Endpoints

| Method              | Path                           | Description                       |
| ------------------- | ------------------------------ | --------------------------------- |
| POST                | `/api/auth/login`              | Login with JWT                    |
| POST                | `/api/auth/logout`             | Logout                            |
| GET                 | `/api/auth/me`                 | Current user                      |
| POST                | `/api/auth/refresh`            | Refresh token                     |
| GET                 | `/api/dashboard/stats`         | Dashboard statistics              |
| GET/POST/PUT/DELETE | `/api/employees`               | Employee CRUD                     |
| GET                 | `/api/employees/inactive/list` | Inactive employees                |
| GET                 | `/api/attendance`              | Attendance records                |
| GET                 | `/api/attendance/reports`      | Reports with stats                |
| POST                | `/api/attendance/check-in`     | Employee check-in                 |
| POST                | `/api/attendance/check-out`    | Employee check-out                |
| GET/POST/PUT/DELETE | `/api/geofences`               | Geofence CRUD                     |
| POST                | `/api/geofences/check-inside`  | Check if point is inside geofence |

## Setup

```bash
cd services/api
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate
php artisan db:seed
php artisan serve --port 8000
```

## Architecture

- **JWT Auth** via `tymon/jwt-auth`
- **Eloquent Models** — User, Employee, Geofence, Attendance
- **Haversine Distance** — Geofence proximity calculation in pure PHP
- **Role-based middleware** — boss/employee/manager/supervisor
