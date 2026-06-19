# Trax — Boss/Employee Tracking System

## Overview

Trax is a real-time employee tracking and attendance management system built with Next.js 14, featuring geofence-based check-in, live map tracking, and comprehensive attendance analytics.

## Tech Stack

| Layer      | Technology                   |
| ---------- | ---------------------------- |
| Framework  | Next.js 14 (App Router)      |
| Language   | TypeScript (strict)          |
| Styling    | TailwindCSS + Radix UI       |
| State      | Zustand                      |
| Maps       | OpenLayers                   |
| Charts     | Recharts                     |
| Forms      | Formik + Yup                 |
| i18n       | next-intl (ar/en)            |
| Testing    | Jest + React Testing Library |
| Linting    | ESLint (strict) + Prettier   |
| Git Hooks  | Husky + lint-staged          |
| Validation | Zod (env schema)             |

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env.local

# Start dev server
npm run dev

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format

# Production build
npm run build
```

## Project Structure

```
Trax/
├── app/
│   └── [locale]/
│       ├── (Auth)/login/         # Role-based login
│       ├── page.tsx              # Dashboard
│       ├── employees/            # Employee management
│       ├── live-map/             # OpenLayers live tracking
│       ├── attendance/           # Attendance records + reports
│       ├── geofences/            # Geofence management
│       ├── check-in/             # Employee self check-in
│       └── settings/             # Security + notification settings
├── components/
│   ├── shared/                   # Shared UI components
│   ├── ui/                       # Radix-based primitives
│   └── Sidebar/                  # Navigation
├── lib/
│   ├── config/                   # Env, constants, feature flags, logger
│   ├── services/                 # API service layer
│   ├── types/                    # TypeScript type definitions
│   ├── mockData/                 # Mock data for development
│   └── utils.ts                  # Utility functions
├── stores/                       # Zustand stores
├── hooks/                        # Custom React hooks
└── __tests__/                    # Jest test suites
```

## Features

- **Dashboard** — Real-time attendance overview with charts
- **Employee Management** — CRUD operations, active/inactive tracking
- **Live Map** — OpenLayers map with employee markers and geofence circles
- **Attendance** — Daily records with late/absent tracking
- **Attendance Reports** — Analytics with on-time rate, avg late minutes
- **Geofences** — Work location management with configurable radius
- **Check-in** — Browser geolocation-based sign-in with distance validation
- **Role-based Auth** — Boss (full access) vs Employee (check-in only)

## Mock Credentials

| Role     | Email             | Password |
| -------- | ----------------- | -------- |
| Boss     | boss@trax.com     | 12345678 |
| Employee | employee@trax.com | 12345678 |

## Scripts

| Command                 | Description              |
| ----------------------- | ------------------------ |
| `npm run dev`           | Start dev server         |
| `npm run build`         | Production build         |
| `npm run lint`          | Run ESLint               |
| `npm run lint:fix`      | Auto-fix lint issues     |
| `npm run format`        | Format with Prettier     |
| `npm run type-check`    | TypeScript type checking |
| `npm test`              | Run Jest tests           |
| `npm run test:watch`    | Watch mode tests         |
| `npm run test:coverage` | Coverage report          |

## License

Private — All rights reserved.
