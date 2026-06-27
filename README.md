# Digital Knowledge Platform (DKP)

A full-stack institutional knowledge management system built for universities and research organizations. DKP centralizes digital archives, library catalog management, research output repositories, and student project showcases into a single, role-based platform.

---

## Features

- **Digital Archive** — Upload files, metadata tagging, access tiers, version history, full-text search
- **Library Management** — Book catalog, issue/return workflow, automated fines, hold requests, wishlist
- **Research Repository** — Output records, citation export (BibTeX/APA/MLA), lab management
- **Student Project Showcase** — Submission, advisor review, public gallery
- **Community Features** — Threaded comments, reactions, events & seminars with RSVP
- **Notifications** — In-app feed with polling updates
- **Admin & Security** — Role-based access, audit logging, JWT auth, rate limiting

---

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- TanStack Query v5
- Zustand
- React Hook Form + Zod
- Axios
- react-hot-toast
- Lucide React
- Lottie

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL 16
- Elasticsearch 8.12
- MinIO (S3-compatible)
- Redis 7
- MailHog
- Winston
- node-cron
- bcryptjs + JWT
- Helmet + express-rate-limit
- Multer
- Zod

---

## Screenshots

*Add screenshots of your application here. You can place them in `public/screenshots/` and reference them like:*

```markdown
![Dashboard](public/screenshots/dashboard.png)
![Archive Search](public/screenshots/archive-search.png)
```

---

## Installation

### Prerequisites

- Node.js v20+
- Docker and Docker Compose

### 1. Clone the repository

```bash
git clone <repository-url>
cd Digital_Knowledge_platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start infrastructure services

```bash
npm run docker:up
```

### 4. Configure the backend

```bash
cd apps/backend
copy .env.example .env
```

### 5. Run database migrations

```bash
cd apps/backend
npm run db:migrate
```

### 6. (Optional) Seed demo data

```bash
cd apps/backend
npm run db:seed
```

### 7. Start the backend

```bash
npm run dev:backend
```

### 8. Start the frontend

```bash
npm run dev:frontend
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `4000` | API server port |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin |
| `DATABASE_URL` | `postgresql://dkp_user:dkp_password@localhost:5432/dkp_db` | PostgreSQL connection string |
| `JWT_SECRET` | — | **Change in production** |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `ELASTICSEARCH_URL` | `http://localhost:9200` | Elasticsearch endpoint |
| `S3_ENDPOINT` | `http://localhost:9000` | MinIO/S3 endpoint |
| `S3_ACCESS_KEY` | `dkp_minio_user` | MinIO access key |
| `S3_SECRET_KEY` | `dkp_minio_password` | MinIO secret key |
| `S3_BUCKET_NAME` | `dkp-files` | Storage bucket name |
| `SMTP_HOST` | `localhost` | SMTP server host |
| `SMTP_PORT` | `1025` | SMTP server port (MailHog) |
| `EMAIL_FROM` | `noreply@dkp.edu.bd` | Sender address |
| `FINE_RATE_PER_DAY` | `5` | Library fine rate in BDT |
| `LOAN_PERIOD_DAYS` | `14` | Default book loan period |
| `MAX_BORROW_LIMIT` | `5` | Max books per member |

### Frontend (`apps/frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | Backend API base URL |

---

## Usage

### Development Commands

| Command | Description |
|---|---|
| `npm run dev` / `npm run dev:web` | Start frontend only |
| `npm run dev:backend` | Start backend API only |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:api` | Start backend API only |
| `npm run dev:full` / `npm run dev:all` | Start both backend and frontend |
| `npm run build` | Build all workspaces |
| `npm run lint` | Run ESLint across all workspaces |
| `npm run test` | Run tests across all workspaces |
| `npm run docker:up` | Start all Docker services |
| `npm run docker:down` | Stop all Docker services |

### Demo Credentials

All demo users have password: `password123`

| Role | Email |
|---|---|
| Admin | `admin@dkp.edu.bd` |
| Librarian | `librarian@dkp.edu.bd` |
| Researcher | `researcher@dkp.edu.bd` |
| Student | `student@dkp.edu.bd` |

---

## API Endpoints

All endpoints are prefixed with `/api`. Authentication uses Bearer tokens in the `Authorization` header.

| Module | Base Path | Key Endpoints |
|---|---|---|
| Auth | `/api/auth` | `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me` |
| Archive | `/api/archive` | `GET /search`, `POST /upload`, `POST /bulk-upload`, `GET /:id`, `GET /:id/download`, `PATCH /:id/status`, `GET /:id/versions`, `POST /:id/access-request`, `GET /tags` |
| Library | `/api/library` | `GET /catalog`, `POST /catalog`, `GET /catalog/:id`, `POST /issue`, `POST /return`, `GET /holds`, `GET /wishlist`, `GET /fines`, `GET /dashboard`, `GET /member/:id/history` |
| Research | `/api/research` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `GET /:id/cite`, `GET /labs`, `POST /labs` |
| Showcase | `/api/showcase` | `GET /gallery`, `POST /submit`, `GET /:id`, `POST /:id/review`, `GET /pending` |
| Notifications | `/api/notifications` | `GET /`, `PATCH /:id/read`, `GET /announcements` |
| Comments | `/api/comments` | `GET /:entityType/:entityId`, `POST /`, `DELETE /:id` |
| Reactions | `/api/reactions` | `POST /`, `DELETE /`, `GET /:entityType/:entityId` |
| Events | `/api/events` | `GET /`, `POST /`, `GET /:id`, `POST /:id/rsvp`, `DELETE /:id/rsvp` |
| Admin | `/api/admin` | User management, role assignment |

Health check: `GET /health`

---

## Folder Structure

```
Digital_Knowledge_platform/
├── apps/
│   ├── backend/                  # Express API
│   │   ├── src/
│   │   │   ├── config/           # App config & logger
│   │   │   ├── db/               # Schema, migrations, seed, pool
│   │   │   │   └── migrations/   # Incremental SQL migrations
│   │   │   ├── jobs/             # Cron job scheduler
│   │   │   ├── middleware/       # Auth, audit, error, upload
│   │   │   ├── routes/           # Route handlers per module
│   │   │   ├── services/         # Elasticsearch, S3, email
│   │   │   └── server.ts         # App entry point
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── frontend/                 # Next.js 14 app
│       ├── public/               # Static assets & Lottie animations
│       ├── src/
│       │   └── app/              # App Router pages & components
│       ├── .env.local
│       └── package.json
│
├── packages/
│   └── shared/                   # Shared code between apps
│
├── scripts/                      # Build and dev scripts
│   └── dev-web.mjs
│
├── docker-compose.yml            # Infrastructure services
└── README.md
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.