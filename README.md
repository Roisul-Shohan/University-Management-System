# Northstar University Management System - Backend API

RESTful API for the Northstar University Management System. Built with Express.js, TypeScript, Prisma ORM, and PostgreSQL.

## Features

- **Authentication**: JWT-based with access/refresh tokens, role-based access control
- **User Management**: Students, teachers, super admins
- **Academic Management**: Departments, programs, courses, course offerings, semesters
- **Admissions**: Student admission applications and review workflow
- **Registration**: Semester registration, course registration
- **Exams**: Exam creation, questions, attempts, grading
- **Attendance**: Session-based attendance tracking
- **Payments**: Fee management with bKash integration
- **Notifications**: System notifications with unread counts
- **Academic Periods**: Semesters, terms, registration periods

## Tech Stack

- **Runtime**: Node.js 22+ (ESM)
- **Framework**: Express.js 5
- **Language**: TypeScript 5 (NodeNext modules)
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: Zod
- **Logging**: Console (extendable to Winston/Pino)
- **Testing**: Jest (configured)

## Quick Start

```bash
# Clone and install
git clone https://github.com/your-org/university-management-system.git
cd university-management-system
npm install

# Environment setup
cp .env.example .env
# Edit .env with your configuration

# Database
npx prisma generate
npx prisma migrate deploy
npm run db:seed

# Development
npm run dev        # http://localhost:5000

# Production build
npm run build
npm start          # Runs dist/server.js
```

## Environment Variables

See `.env.example` for all options. Required variables:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | `development` or `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | 32+ char secret for access tokens |
| `JWT_REFRESH_SECRET` | 32+ char secret for refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL (e.g., `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (e.g., `7d`) |
| `BCRYPT_SALT_ROUNDS` | Password hash rounds (default: 12) |
| `SEED_ADMIN_EMAIL` | Initial admin email |
| `SEED_ADMIN_PASSWORD` | Initial admin password |

Optional: Redis, SMTP, bKash, Resend email

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (returns tokens + sets cookies) |
| GET | `/api/auth/me` | Get current user (requires auth) |
| POST | `/api/auth/refresh-token` | Refresh access token |
| POST | `/api/auth/logout` | Logout (clears cookies) |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/verify-email` | Verify email |

### Modules (all require authentication)
- `/api/admissions` - Admission applications
- `/api/academic-periods` - Academic periods
- `/api/departments` - Departments
- `/api/programs` - Academic programs
- `/api/courses` - Courses
- `/api/course-offerings` - Course offerings
- `/api/course-registrations` - Student course registration
- `/api/students` - Student management
- `/api/teachers` - Teacher management
- `/api/class-sessions` - Class sessions
- `/api/attendance` - Attendance records
- `/api/exams` - Exams
- `/api/exam-attempts` - Exam attempts
- `/api/exam-questions` - Exam questions
- `/api/payments` - Payments (bKash)
- `/api/notifications` - Notifications
- `/api/semester-fees` - Semester fees
- `/api/credit-fees` - Credit fees
- `/api/admission-fees` - Admission fees
- `/api/student-semesters` - Student semester enrollment

### Roles
- `SUPER_ADMIN`: Full access
- `TEACHER`: Courses, exams, attendance, students
- `STUDENT`: Own admissions, registration, exams, payments, attendance

## Project Structure

```
src/
├── app.ts                 # Express app, middleware, routes
├── server.ts              # Entry point
├── config/index.ts        # Validated env config
├── middlewares/
│   ├── auth.ts            # JWT auth + RBAC
│   ├── validateRequest.ts # Zod validation
│   └── notFound.ts        # 404 handler
├── utils/
│   ├── jwt.ts             # JWT helpers
│   ├── catchAsync.ts      # Async wrapper
│   ├── sendResponse.ts    # Standard responses
│   └── AppError.ts        # Custom errors
├── lib/prisma.ts          # Prisma client
├── modules/               # Feature modules
│   └── <module>/
│       ├── *.interface.ts # Types
│       ├── *.validation.ts# Zod schemas
│       ├── *.service.ts   # Business logic
│       ├── *.controller.ts# Request handlers
│       └── *.routes.ts    # Express router
└── generated/prisma/      # Prisma types
```

## Database

Prisma schema in `prisma/schema/` (split by domain):
- `users.prisma` - Users, roles, status
- `academicPeriod.prisma` - Periods
- `department.prisma` - Departments
- `program.prisma` - Programs
- `course.prisma` - Courses
- `courseOffering.prisma` - Offerings
- `courseEnrollment.prisma` - Enrollments
- `exam.prisma` - Exams, questions, attempts
- `attendenceRecord.prisma` - Attendance
- `transaction.prisma` - Payments
- `admission.prisma` - Admissions
- `notification.prisma` - Notifications
- `studentSemester.prisma` - Enrollment

## Scripts

```bash
npm run dev          # tsx watch mode
npm run build        # tsc -> dist/
npm start            # node dist/server.js
npm run lint         # Biome lint
npm run typecheck    # tsc --noEmit
npm run db:seed      # Seed super admin
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

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

Set all env vars in Vercel dashboard. Ensure `DATABASE_URL` uses connection pooling (PgBouncer) for serverless.

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

### Traditional VM/PM2
```bash
npm run build
pm2 start dist/server.js --name "university-api"
pm2 startup
pm2 save
```

## Security

- Helmet.js for security headers
- CORS restricted to frontend origin
- httpOnly, secure, SameSite cookies
- bcrypt password hashing (12 rounds)
- JWT with short-lived access + long-lived refresh tokens
- Role-based route protection
- Zod validation on all inputs

## License

MIT