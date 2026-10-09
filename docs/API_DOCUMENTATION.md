# API Documentation

Base URL: `http://localhost:5000/api` (set `VITE_API_URL` in the client). All bodies are JSON.

## Conventions
- **Auth:** `Authorization: Bearer <JWT>` on every route except `register`, `login` and `GET /health`.
- **Success:** `{ "success": true, ... }`. **Error:** `{ "success": false, "message": "..." }`.
- **Status codes:** 200 OK · 201 Created · 400 validation / invalid transition · 401 unauthenticated or expired token · 403 wrong role or not your resource · 404 not found · 409 conflict (duplicate, already taken) · 429 rate limited.
- **Validation:** Zod schemas; a validation failure returns 400 with all field messages joined (`"password: Password needs a digit"`).
- **Pagination** (admin lists, history, reviews): `?page=1&limit=10` (max 100). Responses add `{ total, page, limit, pages }`.
- **Roles:** `USER`, `MECHANIC`, `TOWING_PARTNER` (both = "partner"), `ADMIN`.

## Health
| Method | Path | Notes |
|---|---|---|
| GET | `/health` | `{ ok: true, time }` — use for uptime checks and to wake a sleeping free host |

## Auth
| Method | Path | Body / notes |
|---|---|---|
| POST | `/auth/register` | `{ name, email, phone, password, role }` — `role` is `USER` (default), `MECHANIC` or `TOWING_PARTNER`; `ADMIN` is rejected. Password ≥ 8 chars with upper, lower and digit; phone 10–13 digits. Partners get a `PENDING` profile. Returns `{ token, user, partnerProfile? }` |
| POST | `/auth/login` | `{ email, password }` → `{ token, user, partnerProfile? }`; 401 on bad credentials, 403 if deactivated |
| GET | `/auth/me` | Current user (+ `partnerProfile` with `verificationStatus`, `availability` for partners) |
| POST | `/auth/logout` | Stateless JWT: the client discards the token |

Register/login are rate limited (HTTP 429 when exceeded). JWT payload: `{ userId, role }`, expires in 7 days.

## Users
| GET/PUT | `/users/profile` | Any signed-in user. PUT accepts `name`, `phone`, `avatar` |

## Vehicles (USER only; always scoped to the caller)
| Method | Path | Body |
|---|---|---|
| GET | `/vehicles` | — (default vehicle first) |
| POST | `/vehicles` | `{ type, make, model, registrationNumber, year?, fuelType?, color?, isDefault? }` — `type`: `CAR, BIKE, SCOOTER, SUV, COMMERCIAL, OTHER`; the first vehicle becomes default |
| PUT | `/vehicles/:id` | any of the above (setting `isDefault` clears the others) |
| DELETE | `/vehicles/:id` | deleting the default promotes another vehicle |

## Services
| Method | Path | Access |
|---|---|---|
| GET | `/services` | Any user — active services only (`?all=true` as admin includes inactive) |
| POST | `/services` | Admin — `{ code, name, description?, basePrice, pricePerKm, estimatedDurationMin?, icon?, isActive? }` |
| PUT | `/services/:id` | Admin |
| DELETE | `/services/:id` | Admin — soft delete (sets `isActive: false`) so history keeps its reference |

`code` is one of `BREAKDOWN_REPAIR, TOWING, BATTERY_JUMPSTART, FLAT_TIRE, FUEL_DELIVERY`.

## Partners
| Method | Path | Access / notes |
|---|---|---|
| GET | `/partners/nearby?lat=&lng=&serviceType=` | USER/ADMIN. Verified, non-offline partners that offer the service and whose `serviceRadiusKm` covers the point. Sorted available-first, then nearest, then best rated. Each entry: `partnerId, name, avatar, verified, rating, reviews, jobsCompleted, availability, services, distanceKm, etaMinutes, pricing{baseCost,distanceKm,distanceCharge,total}`. Empty → `partners: []` |
| GET/PUT | `/partners/profile` | Partner. PUT: `experienceYears, services[], pricing[], serviceRadiusKm, address, governmentIdRef, licenseRef, location` (ID/licence fields are text placeholders) |
| PATCH | `/partners/availability` | Partner. `{ availability: AVAILABLE\|BUSY\|OFFLINE }` — a non-verified partner cannot go `AVAILABLE` (403) |
| PATCH | `/partners/location` | Partner. `{ latitude, longitude }` |
| GET | `/partners/dashboard` | Partner KPIs: today's jobs, active, completed, today's earnings, rating |
| GET | `/partners/earnings` | Partner earnings summary and completed jobs |
| GET | `/partners/:id` | Public partner profile |
| GET | `/partners/:id/reviews` | Paginated reviews |

## Service requests
**Pricing:** `estimatedCost = base price + distance × pricePerKm` (a partner may override the base price per service). Each request stores `pricing{ baseCost, distanceKm, distanceCharge, total }`. Payment status is `OFFLINE_PAYMENT` ("Pay at service") in Phase 1.

| Method | Path | Access / notes |
|---|---|---|
| POST | `/requests` | USER. `{ vehicleId, serviceType, emergencyLevel?, issue?, description?, preferredPartnerId?, location{ latitude, longitude, address? } }`. 409 if the user already has an active request or the chosen partner is unavailable; 404 `No mechanics available nearby.` Creates the request as `SEARCHING` and notifies available matching partners. → `201 { request, notified }` |
| GET | `/requests` | Role-aware list. USER: own; partner: assigned jobs, or `?scope=open` for incoming requests; ADMIN: all. Filters: `status`, pagination |
| GET | `/requests/active` | The caller's current active request (or `null`) |
| GET | `/requests/:id` | Owner, assigned partner, admin (or a partner seeing an open request) |
| PATCH | `/requests/:id/accept` | Partner. Atomic: only one partner wins; 409 if no longer available / expired |
| PATCH | `/requests/:id/reject` | Partner. Removes this partner from the offer |
| PATCH | `/requests/:id/status` | Assigned, verified partner. `{ status, finalCost? }` where status ∈ `ON_THE_WAY, ARRIVED, IN_PROGRESS, COMPLETED`. Invalid jump → 400 `Cannot change status from X to Y` |
| PATCH | `/requests/:id/cancel` | USER (own) or ADMIN. `{ reason? }`. Allowed until `IN_PROGRESS`; otherwise 400 |
| GET | `/requests/:id/invoice` | Service summary JSON |
| GET | `/requests/:id/invoice.pdf` | Service summary as PDF ("Payment status: Offline / Pay at service") |

**Lifecycle** (enforced server-side; see `server/src/utils/lifecycle.js`):
```
PENDING → SEARCHING → ACCEPTED → ON_THE_WAY → ARRIVED → IN_PROGRESS → COMPLETED
   any state before IN_PROGRESS ──────────────► CANCELLED      (COMPLETED / CANCELLED are final)
```
Open requests expire after `OFFER_TIMEOUT_SECONDS` if nobody accepts and are cancelled with a notification.

## Reviews
| POST | `/reviews` | USER. `{ requestId, rating (1–5), comment? }`. Only for your own `COMPLETED` request; 409 if already reviewed. Recomputes the partner's `ratingAverage` / `ratingCount` |

## Complaints
| Method | Path | Notes |
|---|---|---|
| POST | `/complaints` | USER. `{ requestId, category, description (≥10 chars), priority?, attachments? }`; category ∈ `OVERCHARGING, DELAY, BEHAVIOUR, POOR_SERVICE, OTHER` (attachments are file-name placeholders) |
| GET | `/complaints` | USER: own; ADMIN: all (`?status=`) |
| PATCH | `/complaints/:id` | Admin. `{ status?, priority?, adminNote? }`; status ∈ `OPEN, UNDER_REVIEW, RESOLVED, REJECTED`. The complainant is notified |

## Notifications
| GET | `/notifications` | Own notifications (paginated) with unread count |
| PATCH | `/notifications/:id/read` · `/notifications/read-all` | Mark read |

## Admin (all require `ADMIN`)
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/dashboard` | `kpis` (users, partners, verified/pending partners, total/active/completed/cancelled requests, total revenue, average rating, average response and completion minutes, partner acceptance rate) and `charts` (requests over time, completed vs cancelled, category distribution, revenue trend, partner performance). All aggregated from MongoDB |
| GET | `/admin/users` | `?role=&active=&q=` + pagination |
| GET | `/admin/users/:id` | User, service history, partner profile |
| PATCH | `/admin/users/:id/status` | `{ isActive }` — activate / deactivate |
| GET | `/admin/partners` | `?status=PENDING\|VERIFIED\|REJECTED\|SUSPENDED&role=&q=` + pagination |
| GET | `/admin/partners/:id` | Profile and job history |
| PATCH | `/admin/partners/:id/verify` · `/reject` · `/suspend` · `/reactivate` | Updates `verificationStatus` immediately and notifies the partner (reject accepts a reason) |
| GET | `/admin/requests` | `?status=A,B&active=true` + pagination |
| GET | `/admin/complaints` | Same as `/complaints` for admins |
| GET | `/admin/reports?from=YYYY-MM-DD&to=YYYY-MM-DD` | Default last 30 days. `summary` (totals, cancellation rate, revenue estimate, pipeline, average rating), `daily`, `weekly`, `monthly` series, `mostRequested`, `partnerCompletion` |

## Socket.IO
Connect with `io(SOCKET_URL, { auth: { token } })`. Invalid or missing tokens are rejected at the handshake.

**Rooms:** `user:<userId>` (joined automatically) and `request:<requestId>` (joined with `join-request`).

**Client → server** (all support an acknowledgement callback `{ ok, message? }`)
| Event | Payload | Rule |
|---|---|---|
| `join-request` | `requestId` | owner, assigned partner or admin only |
| `leave-request` | `requestId` | |
| `location-update` | `{ requestId, latitude, longitude }` | assigned partner of a job in `ACCEPTED/ON_THE_WAY/ARRIVED/IN_PROGRESS` |
| `demo-tracking-start` | `{ requestId, autoComplete? }` | owner / partner / admin, request must be `ACCEPTED` or `ON_THE_WAY`; disabled when `ENABLE_DEMO_TRACKING=false` |
| `demo-tracking-stop` | `{ requestId }` | |

**Server → client**
| Event | Sent to | Payload |
|---|---|---|
| `request-created` | owner | `{ requestId, status }` |
| `service-request-created` | notified partners | `{ requestId, serviceType, distanceKm, estimatedEarnings, location, ... }` |
| `request-taken` | other notified partners | `{ requestId }` — someone else accepted |
| `request-accepted`, `mechanic-on-the-way`, `mechanic-arrived`, `service-started`, `service-completed` | owner + request room | `{ requestId, status }` |
| `request-rejected` | owner + request room | `{ requestId, partnerId }` |
| `request-cancelled` | owner, partner, request room | `{ requestId, status }` |
| `location-updated` | request room | `{ requestId, mechanicId, latitude, longitude, distanceKm, etaMinutes, demo, at }` |
| `demo-tracking-started` / `demo-tracking-stopped` | request room | `{ requestId }` |
| `notification` | the user | persisted notification document |
