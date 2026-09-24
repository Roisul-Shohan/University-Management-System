# University Management System

A production-oriented REST API for managing university operations across admissions, academics, student services, faculty workflows, notifications, and payments.

[![Live API](https://img.shields.io/badge/live%20API-online-2ea44f?style=flat-square)](https://university-management-system-peach.vercel.app/)
[![API reference](https://img.shields.io/badge/API%20docs-Postman-ff6c37?style=flat-square)](https://documenter.getpostman.com/view/49986455/2sBYB2q74U)

## Links

- **Live deployment:** https://university-management-system-peach.vercel.app/
- **Interactive API documentation:** https://documenter.getpostman.com/view/49986455/2sBYB2q74U
- **API base URL:** `https://university-management-system-peach.vercel.app/api`

The Postman documentation is the canonical reference for request schemas, query parameters, example payloads, and example responses. This README provides the service overview and a quick endpoint index.

## Features

- Email-verified registration, login, refresh tokens, logout, and password recovery
- Role-based access control for `STUDENT`, `TEACHER`, and `SUPER_ADMIN`
- User profiles and account-status administration
- Departments, programs, courses, curriculum courses, and academic periods
- Student profiles, semesters, admissions, and teacher applications
- Admission, semester, credit, and course-registration fee management
- bKash payment initiation, execution, callbacks, and transaction status
- In-app notifications with unread counts and read state management
- Redis-backed BullMQ processing for academic-period notifications and email delivery
- PostgreSQL persistence through Prisma ORM

## Technology stack

| Layer          | Technology                                               |
| -------------- | -------------------------------------------------------- |
| Runtime        | Node.js, TypeScript, ECMAScript modules                  |
| HTTP API       | Express 5                                                |
| Validation     | Zod                                                      |
| Database       | PostgreSQL with Prisma 7 and `@prisma/adapter-pg`        |
| Authentication | JWT with HTTP cookies or `Authorization: Bearer <token>` |
| Queueing       | BullMQ with Redis                                        |
| Email          | Nodemailer / Resend-compatible configuration             |
| Payments       | bKash tokenized sandbox integration                      |
| Formatting     | Biome                                                    |

## Architecture

The service uses a modular Express structure. Each domain keeps its routes, controller, validation, and data-access concerns together under `src/modules`.

```text
src/
├── app.ts                 # Express application and route registration
├── server.ts              # Database, mail, Redis, and HTTP server startup
├── worker.ts              # BullMQ notification worker
├── config/                # Environment-backed configuration
├── middlewares/           # Auth, validation, error handling, and status policies
├── modules/               # Feature modules and route handlers
├── queues/                # BullMQ queue definitions
├── lib/                   # Prisma, Redis, mail, and payment clients
└── utils/                 # JWT, email, response, and seed utilities
```

## Prerequisites

- Node.js 20 or newer recommended
- npm
- PostgreSQL database
- Redis instance
- SMTP or email provider credentials
- bKash credentials for payment functionality

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local `.env` file from the variable reference below. Never commit real credentials.

3. Generate the Prisma client:

   ```bash
   npm run prisma:generate
   ```

4. Apply development migrations:

   ```bash
   npm run prisma:migrate
   ```

5. Start the API in watch mode:

   ```bash
   npm run dev
   ```

6. In a second process, start the notification worker when queue processing is required:

   ```bash
   npm run worker
   ```

The local API is available at `http://localhost:5000` by default. Its health-style root response is available at `GET /`.

## Environment variables

Create `.env` in the project root. Values are intentionally not included in this documentation.

| Variable                 | Purpose                                           |
| ------------------------ | ------------------------------------------------- |
| `PORT`                   | HTTP port, typically `5000`                       |
| `NODE_ENV`               | Runtime environment                               |
| `DATABASE_URL`           | PostgreSQL connection string                      |
| `JWT_ACCESS_SECRET`      | Access-token signing secret                       |
| `JWT_ACCESS_EXPIRES_IN`  | Access-token lifetime, for example `15m`          |
| `JWT_REFRESH_SECRET`     | Refresh-token signing secret                      |
| `JWT_REFRESH_EXPIRES_IN` | Refresh-token lifetime, for example `7d`          |
| `BCRYPT_SALT_ROUNDS`     | Optional password-hashing cost                    |
| `REDIS_USER`             | Redis username                                    |
| `REDIS_PASSWORD`         | Redis password                                    |
| `REDIS_HOST`             | Redis hostname                                    |
| `REDIS_PORT`             | Redis port                                        |
| `SEED_ADMIN_EMAIL`       | Seed administrator email                          |
| `SEED_ADMIN_PASSWORD`    | Seed administrator password                       |
| `SMTP_USER`              | SMTP account username                             |
| `SMTP_PASSWORD`          | SMTP account password                             |
| `EMAIL_SENDER`           | Sender address used by mail delivery              |
| `EMAIL_FROM`             | Provider-specific sender address, when applicable |
| `RESEND_API_KEY`         | Resend provider key, when applicable              |
| `BKASH_BASE_URL`         | bKash API base URL                                |
| `BKASH_USERNAME`         | bKash API username                                |
| `BKASH_PASSWORD`         | bKash API password                                |
| `BKASH_APP_KEY`          | bKash application key                             |
| `BKASH_APP_SECRET`       | bKash application secret                          |
| `BKASH_CALLBACK_URL`     | Public callback URL for bKash payments            |

For local bKash testing, use sandbox credentials and a callback URL reachable by the payment provider. Production credentials and secrets must be stored in the deployment platform's secret manager.

## API conventions

### Authentication

Authenticated routes accept either of the following:

- An `accessToken` cookie issued by the authentication flow
- `Authorization: Bearer <access-token>`

Access is additionally restricted by role where indicated. Accounts must be active; inactive accounts receive `403 Forbidden`.

### Standard response shape

Successful responses follow this general structure:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Human-readable result message.",
  "data": {}
}
```

Validation, authentication, authorization, and not-found failures are handled by the global error middleware and return an appropriate HTTP status with a descriptive message.

## API reference and endpoint index

All paths below are relative to `/api`. For complete schemas and examples, open the [Postman API documentation](https://documenter.getpostman.com/view/49986455/2sBYB2q74U).

### Auth — `/auth`

| Method | Endpoint           | Access                  |
| ------ | ------------------ | ----------------------- |
| `POST` | `/register`        | Public                  |
| `POST` | `/verify-email`    | Public                  |
| `POST` | `/login`           | Public                  |
| `GET`  | `/me`              | Authenticated user      |
| `POST` | `/refresh-token`   | Refresh flow            |
| `POST` | `/logout`          | Authenticated/session   |
| `POST` | `/forgot-password` | Public                  |
| `POST` | `/reset-password`  | Public with reset token |

### Users — `/users`

| Method  | Endpoint      | Access                   |
| ------- | ------------- | ------------------------ |
| `GET`   | `/`           | `SUPER_ADMIN`            |
| `GET`   | `/:id`        | `SUPER_ADMIN`            |
| `PATCH` | `/me`         | Authenticated user       |
| `PATCH` | `/:id/status` | `SUPER_ADMIN`, `TEACHER` |

### Academic periods — `/academic-periods`

| Method  | Endpoint      | Access        |
| ------- | ------------- | ------------- |
| `POST`  | `/`           | `SUPER_ADMIN` |
| `GET`   | `/`           | `SUPER_ADMIN` |
| `GET`   | `/current`    | Public        |
| `GET`   | `/:id`        | `SUPER_ADMIN` |
| `PATCH` | `/:id`        | `SUPER_ADMIN` |
| `PATCH` | `/:id/status` | `SUPER_ADMIN` |

### Notifications — `/notifications`

| Method  | Endpoint        | Access             |
| ------- | --------------- | ------------------ |
| `GET`   | `/`             | Authenticated user |
| `GET`   | `/unread-count` | Authenticated user |
| `GET`   | `/:id`          | Authenticated user |
| `PATCH` | `/:id/read`     | Authenticated user |
| `PATCH` | `/read-all`     | Authenticated user |

### Departments and programs

| Resource    | Method                    | Endpoint                           | Access                   |
| ----------- | ------------------------- | ---------------------------------- | ------------------------ |
| Departments | `POST`                    | `/departments`                     | `SUPER_ADMIN`            |
| Departments | `GET`                     | `/departments`, `/departments/:id` | Authenticated user       |
| Departments | `PATCH`, `DELETE`         | `/departments/:id`                 | `SUPER_ADMIN`            |
| Programs    | `GET`                     | `/programs`, `/programs/:id`       | Authenticated user       |
| Programs    | `POST`, `PATCH`, `DELETE` | `/programs`, `/programs/:id`       | `TEACHER`, `SUPER_ADMIN` |

### Students, admissions, and teachers

| Resource   | Method  | Endpoint                                                                  | Access                                                  |
| ---------- | ------- | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| Students   | `GET`   | `/students/me`                                                            | `STUDENT`                                               |
| Students   | `GET`   | `/students`, `/students/:studentId`                                       | `SUPER_ADMIN`                                           |
| Admissions | `POST`  | `/admissions`                                                             | `STUDENT`                                               |
| Admissions | `GET`   | `/admissions/my`                                                          | `STUDENT`                                               |
| Admissions | `GET`   | `/admissions`, `/admissions/:admissionId`                                 | `TEACHER`, `SUPER_ADMIN` (detail also allows `STUDENT`) |
| Admissions | `PATCH` | `/admissions/:admissionId/approve`, `/admissions/:admissionId/reject`     | `TEACHER`, `SUPER_ADMIN`                                |
| Teachers   | `POST`  | `/teachers/apply`                                                         | `TEACHER`                                               |
| Teachers   | `GET`   | `/teachers/applications/me`, `/teachers/me`                               | `TEACHER`                                               |
| Teachers   | `GET`   | `/teachers`                                                               | `SUPER_ADMIN`                                           |
| Teachers   | `GET`   | `/teachers/applications`                                                  | `TEACHER`, `SUPER_ADMIN`                                |
| Teachers   | `GET`   | `/teachers/:id`                                                           | `SUPER_ADMIN`                                           |
| Teachers   | `PATCH` | `/teachers/:id/admin-status`                                              | `SUPER_ADMIN`                                           |
| Teachers   | `PATCH` | `/teachers/applications/:id/approve`, `/teachers/applications/:id/reject` | `TEACHER`, `SUPER_ADMIN`                                |

### Courses and registration

| Resource                  | Method                    | Endpoint                                                             | Access                   |
| ------------------------- | ------------------------- | -------------------------------------------------------------------- | ------------------------ |
| Courses                   | `GET`                     | `/courses`, `/courses/:id`                                           | Authenticated user       |
| Courses                   | `POST`, `PATCH`, `DELETE` | `/courses`, `/courses/:id`                                           | `TEACHER`, `SUPER_ADMIN` |
| Course offerings          | `GET`                     | `/course-offerings`, `/course-offerings/:id`                         | Authenticated user       |
| Course offerings          | `POST`, `PATCH`, `DELETE` | `/course-offerings`, `/course-offerings/:id`                         | `TEACHER`, `SUPER_ADMIN` |
| Class sessions            | `GET`                     | `/class-sessions`, `/class-sessions/:id`                              | Authenticated user       |
| Class sessions            | `POST`, `PATCH`, `DELETE` | `/class-sessions`, `/class-sessions/:id`                              | `TEACHER`, `SUPER_ADMIN` |
| Attendance                | `GET`                     | `/attendance/sessions/:id`                                            | Authenticated user       |
| Attendance                | `POST`                    | `/attendance/sessions`, `/attendance/sessions/:id/mark`               | `TEACHER` / `STUDENT`    |
| Attendance                | `PATCH`                   | `/attendance/sessions/:id/close`, `/attendance/sessions/:sessionId/records/:recordId` | `TEACHER`, `SUPER_ADMIN` |
| Curriculum courses        | `GET`                     | `/curriculum-courses`, `/curriculum-courses/:id`                     | Authenticated user       |
| Curriculum courses        | `POST`, `PATCH`, `DELETE` | `/curriculum-courses`, `/curriculum-courses/:id`                     | `TEACHER`, `SUPER_ADMIN` |
| Course registration       | `GET`                     | `/course-registrations/:studentSemesterId/offerings`                 | `STUDENT`                |
| Course registration       | `POST`                    | `/course-registrations/:studentSemesterId/courses`                   | `STUDENT`                |
| Course registration       | `DELETE`                  | `/course-registrations/:studentSemesterId/courses/:courseOfferingId` | `STUDENT`                |
| Student semester payments | `POST`                    | `/student-semesters/:studentSemesterId/payment/initiate`             | `STUDENT`                |
| Course payments           | `POST`                    | `/student-semesters/:studentSemesterId/course-payment/initiate`      | `STUDENT`                |

### Fees and payments

| Resource                 | Method                   | Endpoint                           | Access                    |
| ------------------------ | ------------------------ | ---------------------------------- | ------------------------- |
| Admission fees           | `POST`, `GET`            | `/admission-fees`                  | `SUPER_ADMIN`             |
| Admission fees           | `GET`, `PATCH`, `DELETE` | `/admission-fees/:id`              | `SUPER_ADMIN`             |
| Semester fees            | `POST`, `GET`            | `/semester-fees`                   | `SUPER_ADMIN`             |
| Semester fees            | `PATCH`, `DELETE`        | `/semester-fees/:id`               | `SUPER_ADMIN`             |
| Credit fees              | `POST`, `GET`            | `/credit-fees`                     | `SUPER_ADMIN`             |
| Credit fees              | `PATCH`, `DELETE`        | `/credit-fees/:id`                 | `SUPER_ADMIN`             |
| Course registration fees | `POST`, `GET`            | `/course-registration-fees`        | `SUPER_ADMIN`             |
| Course registration fees | `PATCH`, `DELETE`        | `/course-registration-fees/:id`    | `SUPER_ADMIN`             |
| Admission payment        | `POST`                   | `/payments/admission/:admissionId` | `STUDENT`                 |
| bKash payment            | `POST`                   | `/payments/bkash/execute`          | `STUDENT`                 |
| bKash callback           | `GET`                    | `/payments/bkash/callback`         | Payment provider callback |
| Payment status           | `GET`                    | `/payments/:transactionId/status`  | `STUDENT`                 |

## Development commands

| Command                   | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Start the API with TypeScript watch mode |
| `npm run build`           | Compile TypeScript to `dist/`            |
| `npm start`               | Run the compiled server                  |
| `npm run worker`          | Start the BullMQ notification worker     |
| `npm run prisma:generate` | Generate the Prisma client               |
| `npm run prisma:migrate`  | Create/apply a development migration     |
| `npm run prisma:studio`   | Open Prisma Studio                       |
| `npm run format`          | Format `src/` with Biome                 |

## Deployment notes

- Configure all environment variables in the hosting provider; do not commit `.env` files.
- Run Prisma client generation as part of the build pipeline.
- Use a managed PostgreSQL database with SSL enabled in production.
- Run the API and BullMQ worker as separate processes where background notifications are enabled.
- Configure the bKash callback URL to point to the deployed API and verify webhook/payment status handling.
- Restrict CORS origins before exposing the service to production clients.
- Use HTTPS and rotate JWT, database, Redis, SMTP, email-provider, and payment credentials regularly.

## Security notice

The repository must contain only placeholders or local-development values in `.env.example`; secrets, access tokens, database URLs, SMTP passwords, and payment credentials must never be committed. If credentials have been shared publicly or committed accidentally, revoke and rotate them immediately, then rewrite repository history if necessary.

## License

This project currently uses the ISC license declared in `package.json`.
