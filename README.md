<<<<<<< HEAD
# Business Manager — React Native + Backend + Database

A starter full-stack app to manage Hotels, Hostels, Homes and Companies from one account.

## Stack
- Mobile: Expo React Native, React Navigation, Axios, AsyncStorage
- API: Node.js, Express, JWT authentication, bcrypt
- Database: PostgreSQL + Prisma ORM
- Currency: INR (₹)

## Features included
- Sign up / login with JWT
- Business/property types: HOTEL, HOSTEL, HOME, COMPANY
- Create and list multiple businesses
- Dashboard totals: income, expenses, balance
- Add income and expense transactions against a business
- Transaction history
- Backend validation and ownership checks

> This is a runnable MVP foundation. It does not yet include room/bed inventory, reservations, payroll, invoices, tax filing, bank integrations, or production deployment hardening.

## Requirements
- Node.js 20+
- PostgreSQL 15+
- Expo Go on Android, or Android Studio emulator

## 1. Configure database and start backend

```bash
cd backend
copy .env.example .env
```

Edit `backend/.env` and set your PostgreSQL connection string and a long JWT secret.

Example:
`DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/business_manager?schema=public"`

Create the database in PostgreSQL:
```sql
CREATE DATABASE business_manager;
```

Then run:
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

API runs at `http://localhost:4000`.

### Physical phone (Android or iPhone)
Set `EXPO_PUBLIC_API_URL` to your computer's current LAN address before starting Expo, for example in PowerShell:

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.3:4000/api"
npm start
```

The mobile app defaults to `http://192.168.1.3:4000/api`; replace that address in `mobile/src/api.js` or set `EXPO_PUBLIC_API_URL` if your computer's address is different. Find the current address with `ipconfig`. The phone and computer must be connected to the same Wi-Fi network. Allow inbound TCP port 4000 through Windows Firewall if prompted.
The backend listens on all network interfaces so a phone on the LAN can reach it. Use this HTTP setup for trusted local development only; production deployments should use HTTPS.

### Android emulator
`10.0.2.2` points to your host computer, so the default API URL works.

## 2. Start mobile app

Open a second terminal:
```bash
cd mobile
npm install
npx expo start
```
Scan QR code using Expo Go. For an emulator press `a`.

## API overview
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/businesses`
- `POST /api/businesses`
- `GET /api/dashboard/:businessId`
- `GET /api/transactions?businessId=...`
- `POST /api/transactions`

All business and transaction endpoints require `Authorization: Bearer <token>`.

## Important before real-world use
Use HTTPS in production, rotate secrets, add backups, audit logs, rate limiting, automated tests, and role/permission management. Do not use this MVP as the sole accounting/tax record system without professional review.
=======
# Business-management
>>>>>>> 8f911ed7dbf8c1f0a97fea12ea8952f742103b7d
