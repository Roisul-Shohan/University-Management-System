# Northstar University Management System — Backend API

> **Production:** https://university-management-system-peach.vercel.app  
> **API Docs (Swagger):** https://university-management-system-peach.vercel.app/api-docs  
> **Frontend App:** https://university-management-system-fronte-five.vercel.app  
> **GitHub:** https://github.com/Roisul-Shohan/University-Management-System

---

## Overview

A production-grade RESTful API for university administration. Handles authentication, academic management, admissions, examinations, attendance, payments, and notifications with role-based access control (RBAC) for **Super Admins**, **Teachers**, and **Students**.

Built with **Express 5**, **TypeScript 5**, **Prisma ORM**, and **PostgreSQL**, deployed on **Vercel** with serverless functions.

---

## Key Features

### Authentication & Authorization
- JWT access (15 min) + refresh tokens (7 days) with httpOnly cookies
- bcrypt password hashing (12 rounds)
- Role-based access control: `SUPER_ADMIN` | `TEACHER` | `STUDENT`
- Email verification, password reset, forgot password flows

### Academic Management
- Departments, Programs (BSC/MSC/PHD), Courses, Prerequisites
- Course Offerings per semester with teacher assignment
- Student semester enrollment & course registration
- Academic periods (semesters, registration windows, exam periods)

### Admissions
- Multi-step application workflow
- Program-specific admission fees
- Status transitions: `PENDING` → `REVIEW` → `ACCEPTED/REJECTED`

### Examinations
- Exam creation with scheduling
- Question banks (MCQ, essay) with options
- Student exam attempts with auto-grading (MCQ) + manual grading
- Grade publishing & transcript generation

### Attendance
- Class session scheduling
- Student attendance tracking (present/absent/late/excused)
- Session-wise and course-wise reports

### Payments & Fees
- Semester fees, credit fees, admission fees
- bKash payment gateway integration
- Transaction tracking with status management
- Fee collection reports

### Notifications
- Real-time in-app notifications
- Unread count badge
- Mark-as-read, pagination

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 22+ (ESM) |
| Framework | Express 5 |
| Language | TypeScript 5 (NodeNext modules) |
| Database | PostgreSQL 15+ (Neon/Supabase/managed) |
| ORM | Prisma 7 |
| Auth | jsonwebtoken + bcryptjs |
| Validation | Zod 3 |
| Logging | Console (extensible to Winston/Pino) |
| Testing | Jest + Supertest |
| Deployment | Vercel (serverless) / Docker |

---

## Live Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | `university@gmail.com` | `aaaaaaaa` |
| **Teacher** | `roisul192@gmail.com` | `aaaaaa` |
| **Student** | `raychabegum@gmail.com` | `aaaaaa` |

---

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/Roisul-Shohan/University-Management-System.git
cd University-Management-System
npm install

# 2. Environment
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT secrets, etc.

# 3. Database
npx prisma generate
npx prisma migrate deploy
npm run db:seed   # creates super admin

# 4. Development
npm run dev       # http://localhost:5000
```

### Environment Variables (`.env`)

```bash
# Server
PORT=5000
NODE_ENV=development

# Database (required)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Auth (required - 32+ char secrets)
JWT_ACCESS_SECRET="your-super-secret-access-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
BCRYPT_SALT_ROUNDS=12

# Seed Admin (used by db:seed)
SEED_ADMIN_EMAIL="admin@university.edu"
SEED_ADMIN_PASSWORD="secure-password-here"

# Optional: Redis, SMTP, bKash, Resend
REDIS_HOST=
REDIS_PORT=
SMTP_USER=
BKASH_APP_KEY=
RESEND_API_KEY=
```

---

## API Reference

**Base URL:** `https://university-management-system-peach.vercel.app/api`  
**Interactive Swagger:** `/api-docs`

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login (sets httpOnly cookies) |
| GET | `/auth/me` | Bearer | Current user profile |
| POST | `/auth/refresh-token` | Cookie | Refresh access token |
| POST | `/auth/logout` | Cookie | Logout (clears cookies) |
| POST | `/auth/forgot-password` | Public | Request password reset |
| POST | `/auth/reset-password` | Public | Reset password |
| POST | `/auth/verify-email` | Public | Verify email |

### Core Modules (require authentication)
| Module | Base Path | Roles |
|--------|-----------|-------|
| Admissions | `/admissions` | STUDENT, SUPER_ADMIN, TEACHER |
| Academic Periods | `/api/academic-periods` | SUPER_ADMIN |
| Departments | `/api/departments` | SUPER_ADMIN |
| Programs | `/api/programs` | SUPER_ADMIN, TEACHER |
| Courses | `/api/courses` | SUPER_ADMIN, TEACHER |
| Course Offerings | `/api/course-offerings` | SUPER_ADMIN, TEACHER |
| Course Registrations | `/api/course-registrations` | STUDENT |
| Students | `/api/students` | SUPER_ADMIN, TEACHER |
| Teachers | `/api/teachers` | SUPER_ADMIN, TEACHER |
| Class Sessions | `/api/class-sessions` | SUPER_ADMIN, TEACHER, STUDENT |
| Attendance | `/api/attendance` | SUPER_ADMIN, TEACHER, STUDENT |
| Exams | `/api/exams` | SUPER_ADMIN, TEACHER, STUDENT |
| Exam Attempts | `/api/exam-attempts` | STUDENT |
| Exam Questions | `/api/exam-questions` | SUPER_ADMIN, TEACHER |
| Payments | `/api/payments` | STUDENT |
| Notifications | `/api/notifications` | All |
| Fees (semester/credit/admission) | `/api/*-fees` | SUPER_ADMIN, STUDENT |
| Student Semesters | `/api/student-semesters` | STUDENT |

### Response Envelope
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... },
  "meta": { "page": 1, "limit": 10, "total": 100 }
}
```

### Error Format
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

---

## Project Structure

```
src/
├── app.ts                 # Express setup, middleware, route registration
├── server.ts              # Entry point
├── config/index.ts        # Validated environment config
├── middlewares/
│   ├── auth.ts            # JWT verification + RBAC
│   ├── validateRequest.ts # Zod request validation
│   └── notFound.ts        # 404 handler
├── utils/
│   ├── jwt.ts             # Token create/verify helpers
│   ├── catchAsync.ts      # Async route wrapper
│   ├── sendResponse.ts    # Standardized responses
│   └── AppError.ts        # Custom error class
├── lib/prisma.ts          # Prisma singleton
├── modules/
│   └── <feature>/
│       ├── *.interface.ts # TypeScript types
│       ├── *.validation.ts# Zod schemas
│       ├── *.service.ts   # Business logic
│       ├── *.controller.ts# Request handlers
│       └── *.routes.ts    # Express router
├── generated/prisma/      # Prisma client types
└── worker.ts              # Background jobs (bullmq)
```

---

## Database Schema (Prisma)

Split by domain in `prisma/schema/`:
- `users.prisma` — Users, roles, status
- `academicPeriod.prisma` — Periods
- `department.prisma` — Departments
- `program.prisma` — Programs
- `course.prisma` — Courses, prerequisites
- `courseOffering.prisma` — Offerings, enrollments
- `exam.prisma` — Exams, questions, attempts
- `attendanceRecord.prisma` — Attendance
- `transaction.prisma` — Payments
- `admission.prisma` — Admissions
- `notification.prisma` — Notifications
- `studentSemester.prisma` — Enrollment

---

## Scripts

```bash
npm run dev          # tsx watch mode (dev)
npm run build        # tsc → dist/
npm start            # node dist/server.js (prod)
npm run lint         # Biome
npm run typecheck    # tsc --noEmit
npm run test         # Jest
npm run db:seed      # Seed super admin
npx prisma generate
npx prisma migrate dev --name <name>
npx prisma migrate deploy
npx prisma studio
```

---

## Deployment

### Vercel (Serverless)
```json
// vercel.json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "node",
  "functions": {
    "dist/server.js": { "maxDuration": 30 }
  }
}
```
Set all env vars in Vercel dashboard. Use pooled connection string for `DATABASE_URL` (PgBouncer).

### Docker
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY prisma ./prisma/
RUN npx prisma generate
COPY dist ./dist
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

### Traditional VM (PM2)
```bash
npm run build
pm2 start dist/server.js --name "university-api"
pm2 startup && pm2 save
```

---

## Security

- Helmet.js security headers
- CORS restricted to frontend origin
- httpOnly, Secure, SameSite=Lax cookies
- bcrypt 12-round password hashing
- Short-lived access + long-lived refresh tokens
- Role-based route protection
- Zod validation on all inputs
- Prisma prevents SQL injection

---

## API Documentation

**Swagger UI:** https://university-management-system-peach.vercel.app/api-docs  
**OpenAPI Spec:** https://university-management-system-peach.vercel.app/api-docs/json

---

## Contributing

1. Fork → feature branch: `git checkout -b feature/your-feature`
2. Conventional commits: `feat: add your feature`
3. Run checks: `npm run lint && npm run typecheck && npm test`
4. Push & open PR

---

## License

MIT — see [LICENSE](LICENSE) file.