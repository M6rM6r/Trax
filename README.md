# 🚗 Zeem Dashboard

<div align="center">

![Zeem Logo](public/images/placeholder.png)

**Professional Dashboard for Transportation and Logistics Management**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.18-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Build Status](https://img.shields.io/badge/Build-Passing-success)](https://github.com/zeem/dashboard)

[Live Demo](https://dashboard.zeem.sa) • [Documentation](docs/) • [Contributing Guide](CONTRIBUTING.md)

</div>

---

## 📋 Overview

**Zeem Dashboard** is a comprehensive control panel for transportation and logistics services management including:

- 🚖 **Driver Management** - Taxi, light transport, towing, fontas
- 👥 **Customer Management** - Profiles, wallets, trips
- 📱 **App Management** - Notifications, banners, pages
- 🛠️ **Service Management** - Fuel, tires, transport, towing
- 🔐 **Advanced Security** - Two-factor authentication (2FA) via SMS and authenticator apps
- 📊 **Analytics & Reports** - Comprehensive statistics and dashboards
- ⚙️ **Settings Management** - Roles, permissions, categories

---

## ✨ Latest Features

### 🔐 Two-Factor Authentication (2FA) System

- **SMS Verification** - Verification via text messages
- **Authenticator App** - Support for Google Authenticator, Microsoft Authenticator
- **QR Code Generation** - Automatic QR code generation
- **Secret Key Backup** - Backup for secret keys

### 🎨 Advanced User Interface

- 📱 **Responsive Design** - Responsive design for all devices
- 🌙 **Dark/Light Mode** - Support for dark and light modes
- 🌍 **Multi-language** - Support for Arabic and English
- ♿ **Accessibility** - Accessibility for everyone

### ⚡ Optimized Performance

- 🚀 **Server Components** - Server components for better performance
- 📦 **Code Splitting** - Automatic code splitting
- 🖼️ **Image Optimization** - Image optimization with Sharp
- 🗄️ **Lazy Loading** - Progressive data loading

---

## 🛠️ Tech Stack

### Frontend Framework

```json
{
  "framework": "Next.js 14.2.18",
  "runtime": "App Router",
  "language": "TypeScript 5.0+",
  "styling": "Tailwind CSS 3.4.1"
}
```

### UI Components & Libraries

```json
{
  "ui-library": "Radix UI",
  "components": "Shadcn/ui",
  "forms": "Formik + Yup",
  "tables": "TanStack Table",
  "charts": "Embla Carousel",
  "icons": "Lucide React",
  "rich-text": "TipTap Editor"
}
```

### Security & Authentication

```json
{
  "2fa-sms": "Custom SMS Component",
  "2fa-app": "QR Code + TOTP",
  "qr-generation": "qrcode.react",
  "otp-input": "input-otp"
}
```

### Development Tools

```json
{
  "package-manager": "npm",
  "linting": "ESLint + TypeScript",
  "formatting": "Prettier",
  "image-optimization": "Sharp",
  "svg-processing": "@svgr/webpack"
}
```

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/zeem/dashboard.git
cd dashboard
```

2. **Install dependencies:**

```bash
npm install
```

3. **Setup environment variables:**

```bash
cp .env.example .env.local
# Edit .env.local and add required values
```

4. **Run development server:**

```bash
npm run dev
```

5. **Open browser:**

```
http://localhost:3000
```

---

## 📁 Project Structure

```
zeem-dashboard/
├── 📁 app/                          # App Router (Next.js 14)
│   ├── 📁 [locale]/                 # Multi-language support
│   │   ├── 📁 (Auth)/               # Authentication group
│   │   ├── 📁 settings/             # System settings
│   │   │   └── 📁 securitySettings/ # Security settings (2FA)
│   │   ├── 📁 drivers/              # Driver management
│   │   ├── 📁 customers/            # Customer management
│   │   ├── 📁 services/             # Service management
│   │   └── 📁 apps/                 # App management
│   ├── 📄 layout.tsx               # Main layout
│   └── 📄 globals.css              # Global styles
│
├── 📁 components/                   # Reusable React components
│   ├── 📁 shared/                   # Shared components
│   │   ├── 📁 AuthenticatorDialog/  # 🆕 2FA component - Authenticator app
│   │   ├── 📁 SMSVerificationDialog/# 🆕 2FA component - SMS
│   │   ├── 📁 CustomDialog/         # Custom dialogs
│   │   ├── 📁 DataTable/            # Data tables
│   │   └── 📁 form/                 # Form components
│   ├── 📁 ui/                       # Basic UI components (Shadcn)
│   └── 📁 Sidebar/                  # Sidebar
│
├── 📁 lib/                          # Libraries and utilities
│   ├── 📁 types/                    # TypeScript definitions
│   ├── 📄 fetcher.ts               # HTTP client
│   ├── 📄 utils.ts                 # Helper functions
│   └── 📄 toastUtils.tsx           # Toast notifications
│
├── 📁 hooks/                        # Custom React Hooks
├── 📁 i18n/                         # Internationalization
├── 📁 messages/                     # Translation files
├── 📁 public/                       # Static files
│   ├── 📁 images/                   # Images
│   └── 📁 SVG/                      # SVG files
│
├── 📄 package.json                 # Project dependencies
├── 📄 next.config.mjs              # Next.js configuration
├── 📄 tailwind.config.ts           # Tailwind configuration
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 middleware.ts               # Next.js Middleware
│
└── 📄 README.md                   # This file
```

---

## 🔐 New Security Components

### 1. SMSVerificationDialog

📍 `components/shared/SMSVerificationDialog/index.tsx`

```typescript
// Usage example
import SMSVerificationDialog from "@/components/shared/SMSVerificationDialog";

<SMSVerificationDialog
  onConfirm={() => console.log("Verification successful")}
/>;
```

**Features:**

- Mobile number input with automatic formatting
- Send OTP code (6 digits)
- Countdown timer (30 seconds)
- Resend code
- Code verification

### 2. AuthenticatorDialog

📍 `components/shared/AuthenticatorDialog/index.tsx`

```typescript
// Usage example
import AuthenticatorDialog from "@/components/shared/AuthenticatorDialog";

<AuthenticatorDialog
  secretKey="JBSW-Y3DP-EHPK-3PXP"
  qrCodeValue="otpauth://totp/ZeemApp:user@example.com?secret=..."
  onConfirm={() => console.log("Verification successful")}
/>;
```

**Features:**

- Display QR Code for scanning
- Copy secret key
- Download QR Code image
- Verify generated code
- Support for Google Authenticator and Microsoft Authenticator

---

## 📜 Available NPM Commands

```bash
# Development
npm run dev          # Run development server
npm run build        # Build project for production
npm run start        # Run built project
npm run lint         # Check code with ESLint

# Additional Scripts
npm run type-check   # Check TypeScript types
npm run format       # Format code with Prettier
npm run analyze      # Analyze bundle size
```

---

## 🔧 Environment Configuration

### `.env.local` file (required):

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.zeem.sa
API_SECRET_KEY=your-secret-key

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# 2FA Settings
SMS_PROVIDER_API_KEY=your-sms-api-key
TOTP_ISSUER=ZeemApp

# Image Optimization
NEXT_PUBLIC_IMAGE_DOMAIN=images.zeem.sa

# Analytics
GOOGLE_ANALYTICS_ID=GA-XXXXXX
```

---

## 🧪 Testing

```bash
# Run tests
npm run test

# Coverage tests
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Test Types:

- **Unit Tests** - Individual component testing
- **Integration Tests** - Component integration testing
- **E2E Tests** - End-to-end user testing

---

## 🚢 Deployment & Production

### 1. Build the project:

```bash
npm run build
```

### 2. Test build locally:

```bash
npm run start
```

### 3. Deploy to Vercel:

```bash
npm install -g vercel
vercel deploy
```

### 4. Deploy to custom server:

```bash
# Docker
docker build -t zeem-dashboard .
docker run -p 3000:3000 zeem-dashboard

# PM2
pm2 start npm --name "zeem-dashboard" -- start
```

---

## 📊 Performance Monitoring

### Key Metrics:

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.5s

### Tools Used:

- **Lighthouse** - Performance analysis
- **Core Web Vitals** - User metrics
- **Bundle Analyzer** - File size analysis

---

## 🤝 Contributing & Development

### Contribution Guidelines:

1. **Fork the project**
2. **Create a new branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Develop and test:**
   ```bash
   npm run dev
   npm run test
   npm run lint
   ```
4. **Commit changes:**
   ```bash
   git commit -m "Add: amazing new feature"
   ```
5. **Push to branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open Pull Request**

### Code Standards:

- **TypeScript** for all new files
- **ESLint** without warnings
- **Prettier** for code formatting
- **Commit Conventions** - Use Conventional Commits

---

## 📚 Available Documentation

| File                                             | Description                 | Size |
| ------------------------------------------------ | --------------------------- | ---- |
| [SETUP_SUMMARY.md](SETUP_SUMMARY.md)             | Comprehensive setup guide   | 6.4K |
| [IMPROVEMENTS_REPORT.md](IMPROVEMENTS_REPORT.md) | Applied improvements report | 4.1K |
| [FINAL_STATUS.txt](FINAL_STATUS.txt)             | Final project status        | 11K  |
| [CONTRIBUTING.md](CONTRIBUTING.md)               | Contribution guide          | -    |
| [API_DOCS.md](docs/API_DOCS.md)                  | API documentation           | -    |

---

## 🐛 Bug Reports

If you encounter an issue, please:

1. **Check [existing Issues](https://github.com/zeem/dashboard/issues)**
2. **Create new Issue** with:
   - Clear problem description
   - Reproduction steps
   - Environment used
   - Screenshots (if possible)

---

## 📞 Support & Contact

- 📧 **Email:** [support@zeem.sa](mailto:support@zeem.sa)
- 💬 **Discord:** [Zeem Community](https://discord.gg/zeem)
- 🐛 **Issues:** [GitHub Issues](https://github.com/zeem/dashboard/issues)
- 📖 **Documentation:** [docs.zeem.sa](https://docs.zeem.sa)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🎯 Roadmap

### Next Release (v2.0.0):

- [ ] **Real-time Notifications** - Live notifications
- [ ] **Advanced Analytics** - Advanced analytics
- [ ] **Mobile App Integration** - Mobile app integration
- [ ] **Multi-tenant Support** - Multi-organization support
- [ ] **AI-powered Insights** - AI-powered insights

### Continuous Improvements:

- [ ] Improve page loading performance
- [ ] Expand language support
- [ ] Improve accessibility
- [ ] Add more tests

---

<div align="center">

**Built with ❤️ by Zeem Team**

**🌟 If you like this project, don't forget to give it a star!**

[⬆️ Back to top](#-zeem-dashboard)

</div>

---

**Last Updated:** October 26, 2025 • **Version:** v1.0.0 • **Status:** Production Ready
