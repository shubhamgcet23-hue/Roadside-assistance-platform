# RoadsideAAA — Roadside Vehicle Assistance & Mechanic Booking Platform

> **Fast Help. Right Where You Are.**

An on-demand roadside assistance platform (MERN + Socket.IO) that connects stranded vehicle owners with nearby, verified mechanics and towing partners. Owners request help, compare partners by distance / rating / ETA / price, and track the job live on a map. Partners receive and accept requests in real time. Admins verify partners, manage the catalogue and monitor the platform with analytics computed from MongoDB.

## Contents
1. [Problem statement](#problem-statement) · 2. [Objectives](#objectives) · 3. [Features](#features) · 4. [Tech stack](#tech-stack) · 5. [Architecture](#architecture) · 6. [Folder structure](#folder-structure) · 7. [Quick start](#quick-start) · 8. [Environment variables](#environment-variables) · 9. [Seed data and demo credentials](#seed-data-and-demo-credentials) · 10. [Live demo script](#live-demo-script-5-minutes) · 11. [How real-time tracking works](#how-real-time-tracking-works) · 12. [Authentication](#authentication) · 13. [API overview](#api-overview) · 14. [Testing](#testing) · 15. [Deployment](#deployment) · 16. [Troubleshooting](#troubleshooting) · 17. [Future enhancements](#future-enhancements) · 18. [Screenshots](#screenshots)

Detailed docs live in [`docs/`](docs): [PRD](docs/PRD.md) · [System design](docs/SYSTEM_DESIGN.md) · [API reference](docs/API_DOCUMENTATION.md) · [Database schema](docs/DATABASE_SCHEMA.md) · [Deployment](docs/DEPLOYMENT.md).

## Problem statement
When a vehicle breaks down, owners have no quick, trustworthy way to find help nearby. They call around, cannot judge prices, cannot tell whether a mechanic is genuine, and have no idea when help will arrive. Mechanics and tow operators, meanwhile, lose business because stranded drivers cannot find them.

## Objectives
- Let an owner request help in a few taps, with minimal typing, on a phone.
- Show verified partners with distance, rating, ETA and a transparent price estimate **before** the owner commits.
- Give the owner a live status timeline and map for the whole job.
- Give partners a simple workflow: receive request → accept → on the way → arrived → in progress → complete.
- Give admins control: partner verification, user management, catalogue and pricing, complaints, analytics.

## Features
**Vehicle owner** — register/login · manage multiple vehicles (default vehicle) · 6-step request wizard (vehicle, service, location via GPS or manual address/map pin, details and urgency, estimate with nearby partners, confirm) · live status timeline and map · cancel · service history with detail view · service summary with PDF download · rate and review (one review per job) · raise complaints · notifications bell.

**Mechanic / towing partner** — registration with verification workflow (`PENDING → VERIFIED / REJECTED / SUSPENDED`) · profile, services, per-service base price, service radius · availability (`AVAILABLE / BUSY / OFFLINE`) · live incoming requests with countdown, accept/reject · active job with status buttons and navigation link · live GPS sharing **or** Demo Tracking Mode · job history and earnings.

**Admin** — dashboard KPIs and Recharts charts computed from MongoDB · verify / reject / suspend / reactivate partners · users (search, filter, activate/deactivate, history) · service requests monitor · service catalogue and pricing · complaints management · reports with date filter.

**Platform** — JWT auth with role-based access control · Socket.IO live events · persisted notifications · invalid status transitions blocked server-side · atomic accept (two partners cannot win one job) · Helmet, CORS allow-list, rate limiting, input validation (Zod), Mongo-operator sanitising · payment abstraction (offline payment in Phase 1; Stripe/Razorpay-ready).

## Tech stack
| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, React Hook Form + Zod, Recharts, Leaflet + OpenStreetMap, Lucide icons, Socket.IO client |
| Backend | Node.js, Express, MongoDB + Mongoose, Socket.IO, JWT, bcryptjs, Zod, Helmet, express-rate-limit, PDFKit |
| Tooling | ESLint, Prettier, Nodemon, dotenv, Vitest + Testing Library (client), Node test runner + Supertest + mongodb-memory-server (server) |

## Architecture
```
 Browser (React SPA)  ── REST (Axios, JWT) ──►  Express API  ──►  MongoDB (Atlas / local)
        ▲                                           │
        └──────── Socket.IO (JWT handshake) ◄───────┘   rooms: user:<id>, request:<id>
```
Controllers hold request handling, `services/` hold business logic (pricing, partner discovery, request lifecycle, tracking, invoices, payments), `middleware/` holds auth and error handling. See [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md).

## Folder structure
```
roadside-assistance-platform/
├── client/                 React + Vite app
│   └── src/ components · pages (public, user, partner, admin, shared) · layouts · hooks
│            services (API + socket + location) · context · routes · utils · types · test
├── server/
│   ├── src/ config · controllers · middleware · models · routes · services · sockets · utils · server.js
│   └── test/ unit · integration
├── docs/                   PRD, system design, API, schema, deployment
├── docker-compose.yml      local MongoDB
├── render.yaml             Render blueprint for the API
└── package.json            root scripts (install, dev, seed, test)
```

## Quick start
**Requirements:** Node.js 20+ (22 LTS recommended), npm, and a MongoDB (free [Atlas](https://www.mongodb.com/atlas) cluster **or** Docker for a local one).

```bash
# 1. open the folder in VS Code, then in its terminal:
npm install                    # installs the root, server and client packages

# 2. database: pick ONE
docker compose up -d           # local MongoDB  → MONGODB_URI=mongodb://127.0.0.1:27017/roadside_aaa
#    or paste your Atlas connection string into server/.env

# 3. configure
cp server/.env.example server/.env      # Windows PowerShell: copy server\.env.example server\.env
cp client/.env.example client/.env      # (client defaults already work locally)
#    edit server/.env: set MONGODB_URI and JWT_SECRET
#    generate a secret:  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. load demo data
npm run seed

# 5. run API (http://localhost:5000) and client (http://localhost:5173) together
npm run dev
```
Or run them separately: `cd server && npm run dev` and `cd client && npm run dev`.

## Environment variables
**`server/.env`** (see `server/.env.example`)

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | MongoDB connection string (**required**) |
| `JWT_SECRET` | Long random string used to sign tokens (**required**) |
| `CLIENT_URL` | Allowed browser origin(s), comma separated, no trailing slash |
| `NODE_ENV` | `development` or `production` |
| `AVG_SPEED_KMH` | Average speed used for ETA (default 30) |
| `OFFER_TIMEOUT_SECONDS` | How long a request stays open to partners (default 300) |
| `ENABLE_DEMO_TRACKING` | `false` disables Demo Tracking Mode on the server |
| `SEED_CENTER_LAT` / `SEED_CENTER_LNG` | Centre around which demo partners are generated |

**`client/.env`** — `VITE_API_URL` (include `/api`), `VITE_SOCKET_URL` (no `/api`), `VITE_DEMO_LAT` / `VITE_DEMO_LNG` (the "Use demo location" button; keep equal to the seed centre).

Secrets are never committed: `.env` files are git-ignored; only `.env.example` files are tracked.

## Seed data and demo credentials
`npm run seed` **wipes the database** and creates: 1 admin, 5 users, 8 mechanics, 3 towing partners (one partner `PENDING` and one `REJECTED` so the admin has something to verify), 5 services, 5 vehicles, 15 historical requests (12 completed, 3 cancelled), reviews, notifications and complaints.

> ⚠️ **Development / demo credentials only. Never use these in production.**

| Role | Email | Password |
|---|---|---|
| Vehicle owner | `user@roadsideaaa.com` | `User@123` |
| Mechanic | `mechanic@roadsideaaa.com` | `Mechanic@123` |
| Admin | `admin@roadsideaaa.com` | `Admin@123` |

Other seeded users: `user2…user5@roadsideaaa.com` (`User@123`), partners `mechanic2…`/`tow9…` style emails (`Mechanic@123`) — see `server/src/utils/seed.js`. Admin accounts cannot be created through the public registration form.

**Important:** partners are placed around Greater Noida by default. If you demo elsewhere, set `SEED_CENTER_LAT/LNG` (server) and `VITE_DEMO_LAT/LNG` (client) to your city and re-run `npm run seed`, otherwise "nearby partners" will be empty for your real location. The login page and location step have a **demo location** button that matches the seed centre.

## Live demo script (5 minutes)
Open three browser windows (or one normal + two private windows).
1. **Owner** (`user@roadsideaaa.com`): *Request Assistance* → pick vehicle → **Breakdown Repair** → *Use demo location* → continue → see nearby partners, ETA and price breakdown → *Send request*.
   (The seeded mechanics offer every service except Towing; to demo Towing log in as the towing partner `tow9@roadsideaaa.com` / `Mechanic@123` instead.)
2. **Mechanic** (`mechanic@roadsideaaa.com`): the request appears with a countdown → *Accept*. The mechanic must be set to *Available* (seeded as available).
3. **Owner** sees "Mechanic assigned" instantly. On the mechanic's **Active Job** page click **Run Demo Tracking Mode**: the marker moves toward the customer on the owner's tracking page (labelled *Demo Tracking Mode*), ETA updates and the status advances to *Arrived*. The mechanic then uses the status buttons: *Start service* → *Complete service*.
4. Owner gets a notification, views the **service summary / PDF**, and **rates** the partner.
5. **Admin** (`admin@roadsideaaa.com`): dashboard charts, verify the pending partner, complaints, reports.

## How real-time tracking works
1. After login the client opens one Socket.IO connection, sending the JWT in the handshake. The server verifies it and joins the socket to `user:<userId>` (personal notifications and new-request alerts).
2. On a request page the client emits `join-request`; the server checks the user is the owner, assigned partner or an admin, then joins room `request:<requestId>`.
3. **Status events** (`request-accepted`, `mechanic-on-the-way`, `mechanic-arrived`, `service-started`, `service-completed`, `request-cancelled`) are emitted by the server after the database update succeeds, so the UI never shows a state the database does not have.
4. **Production GPS:** the partner's browser uses `navigator.geolocation.watchPosition` and emits `location-update {requestId, latitude, longitude}` periodically. The server validates that the sender is the assigned partner of an active job, stores the position, computes distance and ETA with the Haversine formula, and broadcasts `location-updated` to the request room.
5. **Demo Tracking Mode:** for presentations without two physical devices, the mechanic's Active Job page has a **Run Demo Tracking Mode** button that starts a server-side simulation (`demo-tracking-start`; the server also allows the owner or an admin to start it). It moves a marker from a point ~2.8 km away toward the customer in 20 steps, broadcasts `location-updated` with `demo: true`, and advances status to `ARRIVED` (optionally through to `COMPLETED`). The UI labels it **"Demo Tracking Mode"** so it is never mistaken for real GPS. `ENABLE_DEMO_TRACKING=false` switches it off.
6. If the socket drops, Socket.IO reconnects automatically and the client re-joins the request room.

## Authentication
- Passwords are hashed with bcryptjs (12 rounds) and never returned by the API.
- `POST /api/auth/login` returns a JWT (`{ userId, role }`, 7-day expiry). The client sends it as `Authorization: Bearer <token>`.
- `protect` middleware validates the token and loads the user (deactivated accounts are rejected); `authorize(...roles)` enforces roles on every route.
- Roles: `USER`, `MECHANIC`, `TOWING_PARTNER`, `ADMIN`. Only the first three can self-register.
- Login/register are rate limited. A 401 on any call clears the session and shows "Session expired. Please login again."

## API overview
Full reference with request/response shapes: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md).

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` |
| Users | `GET/PUT /api/users/profile` |
| Vehicles | `GET/POST /api/vehicles` · `PUT/DELETE /api/vehicles/:id` |
| Services | `GET /api/services` · admin: `POST`, `PUT /:id`, `DELETE /:id` (deactivates) |
| Partners | `GET /api/partners/nearby` · `GET/PUT /api/partners/profile` · `PATCH /availability` · `PATCH /location` · `GET /dashboard` · `GET /earnings` · `GET /:id` · `GET /:id/reviews` |
| Requests | `POST/GET /api/requests` · `GET /active` · `GET /:id` · `PATCH /:id/accept|reject|status|cancel` · `GET /:id/invoice` · `GET /:id/invoice.pdf` |
| Reviews / complaints | `POST /api/reviews` · `POST/GET /api/complaints` · `PATCH /api/complaints/:id` (admin) |
| Notifications | `GET /api/notifications` · `PATCH /:id/read` · `PATCH /read-all` |
| Admin | `GET /api/admin/dashboard|users|partners|requests|complaints|reports` · `PATCH /admin/partners/:id/verify|reject|suspend|reactivate` · `PATCH /admin/users/:id/status` |

## Testing
```bash
npm test                 # server + client
npm run test:server      # unit + integration (integration downloads a mongod binary on first run)
npm --prefix server run test:unit
npm run test:client      # Vitest + Testing Library
```
- **Server unit:** request lifecycle transitions (including `COMPLETED → ON_THE_WAY` rejected), Haversine/ETA, pricing, pagination helpers.
- **Server integration** (in-memory MongoDB): auth, vehicle CRUD, request creation, partner verification, status updates, admin, sockets.
- **Client:** login form, service selection, the 6-step request wizard, dashboard rendering, protected routes.

## Deployment
Summary (details in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)): MongoDB Atlas → API on Render (`render.yaml`, root dir `server`) → client on Vercel/Netlify (root dir `client`; SPA rewrites included) → set the API's `CLIENT_URL` to the exact client URL → seed once against Atlas. Free Render instances sleep after inactivity; open `/api/health` a few minutes before a demo.

## Troubleshooting
| Symptom | Fix |
|---|---|
| `JWT_SECRET is not set` / `Could not connect to MongoDB` | Create `server/.env` from the example and fill `MONGODB_URI` and `JWT_SECRET` |
| Atlas connection times out | Add your IP (or `0.0.0.0/0` for deployment) under Atlas → Network Access |
| "No mechanics available nearby" | Location is outside the seeded area. Use the demo-location button, or re-seed with `SEED_CENTER_LAT/LNG` for your city. The mechanic account must be `AVAILABLE`, and a Towing request needs a towing partner |
| CORS error after deploying | `CLIENT_URL` must exactly equal the browser origin (no trailing slash) |
| Live updates do nothing | `VITE_SOCKET_URL` must point to the API origin (no `/api`) |
| Port in use | Change `PORT` in `server/.env` and `VITE_API_URL`/`VITE_SOCKET_URL` in `client/.env` |

## Future enhancements
Online payments (Stripe/Razorpay behind the existing payment abstraction) · real document uploads and KYC for partner verification · photo upload on requests · push/SMS/WhatsApp notifications · Google Maps/Mapbox for routing and traffic-aware ETA · surge/dynamic pricing · partner wallet and payouts · scheduled bookings · in-app chat/call masking · multi-language UI · mobile apps (React Native/PWA) · Redis adapter for horizontally scaled Socket.IO.

## Screenshots
_Add your screenshots here after running the app (landing, request wizard, tracking map, mechanic dashboard, admin analytics)._

| Landing | Request wizard | Live tracking |
|---|---|---|
| `docs/screenshots/landing.png` | `docs/screenshots/wizard.png` | `docs/screenshots/tracking.png` |

## License
Educational / internship project. Demo credentials and seed data are for development only.
