# System Design

## 1. Overview
```
React SPA (Vite) ── REST/Axios + JWT ──► Express API ──► MongoDB
       ▲                                     │
       └────── Socket.IO (JWT handshake) ◄───┘
```
A single Node process serves REST and Socket.IO. The SPA is static and can be hosted on any CDN.

## 2. Frontend architecture (`client/src`)
- **Routing:** React Router with role-aware `ProtectedRoute` / `GuestRoute`. Separate layouts: public, and an app shell (sidebar on desktop, bottom navigation on mobile) for user / partner / admin areas. Admin pages and maps are lazy loaded.
- **State:** React context for auth, toasts and the shared socket connection; data fetching through a small `useFetch` hook (loading / error / silent reload). No global store is needed.
- **API layer:** `services/*.js` wraps Axios (one instance, JWT interceptor, centralised error message mapping, global 401 → "Session expired" handling). Pages never call Axios directly.
- **Real time:** `RealtimeContext` owns one socket; `useRequestLive` joins a request room and triggers silent reloads on status events.
- **Location:** `services/location.js` isolates geolocation, geocoding (Nominatim) and watch-position, so Google Maps/Mapbox can replace OpenStreetMap later. Leaflet is wrapped in `MapView` / `LazyMap`.
- **UI system:** Tailwind tokens + reusable components (Button, Card, Modal, Input/Select, Badge, Avatar, Table, StatsCard, StatusTimeline, ServiceCard, PartnerCard, Toast, Loading/Empty/Error states). Mobile-first, large touch targets, sticky primary actions.
- **Forms:** React Hook Form + Zod resolvers.

## 3. Backend architecture (`server/src`)
- `routes/` declare endpoints and attach `protect` / `authorize(roles)`.
- `controllers/` validate input (Zod) and call services; thin.
- `services/` hold business logic: `requestService` (create/accept/reject/advance/cancel/expire), `partnerService` (discovery), `pricing`, `tracking` (live + demo), `notify`, `invoice`, `payment` (provider abstraction).
- `utils/lifecycle.js` is the single source of truth for status transitions; `utils/location.js` has `calculateDistance` (Haversine) and `calculateETA`.
- `middleware/` auth, error handler (centralised, consistent `{ success:false, message }`).
- Security: Helmet, CORS allow-list from `CLIENT_URL`, rate limits (stricter on auth), JSON body limit, `express-mongo-sanitize`, Zod validation, bcrypt (12 rounds), secrets only from environment.

## 4. Database architecture
MongoDB with Mongoose. References (not embedding) between User, Vehicle, PartnerProfile, ServiceRequest, Review, Complaint and Notification (see `DATABASE_SCHEMA.md`). Pricing is copied onto the request at creation so later catalogue changes never alter history. Indexes: unique email; `2dsphere` on partner location; request `status`, `userId`, `partnerId`, `createdAt`. Admin analytics use aggregation pipelines over real data — no hard-coded numbers.

## 5. Authentication and authorisation
Login returns a signed JWT (`userId`, `role`, 7 days). Every request re-loads the user, so deactivating an account takes effect immediately. RBAC is enforced in route middleware **and** ownership is checked in services (an owner can only read their own requests; only the assigned partner can advance a job). Socket connections use the same JWT in the handshake.

## 6. Socket.IO design
- Rooms: `user:<id>` and `request:<id>`; membership is checked before joining a request room.
- Events are emitted by the server **after** the database write succeeds.
- Client events are acknowledged (`{ ok, message }`).
- Scaling note: one process keeps rooms in memory. For multiple instances add the Socket.IO Redis adapter.

## 7. Location tracking
Production: the partner's device streams `location-update`; the server validates sender and job state, stores the position, computes distance and ETA, and broadcasts `location-updated`. Demo: a server-side simulation produces the same event with `demo: true`, and the UI labels it "Demo Tracking Mode". Distance uses Haversine; ETA = distance / `AVG_SPEED_KMH`.

## 8. Request lifecycle
```
User submits ─► SEARCHING ─► available matching partners notified (service-request-created)
   partner accepts (atomic findOneAndUpdate on status=SEARCHING) ─► ACCEPTED   ── others get request-taken
   ─► ON_THE_WAY ─► ARRIVED ─► IN_PROGRESS ─► COMPLETED ─► user rates partner (once)
   Cancel allowed before IN_PROGRESS · unaccepted requests expire after OFFER_TIMEOUT_SECONDS
```
Invalid transitions (e.g. `COMPLETED → ON_THE_WAY`) return 400. Each transition writes timestamps, creates a persisted notification, and emits the Socket.IO event.

## 9. Payments (future-ready)
`services/payment.js` defines a provider interface; Phase 1 uses an offline provider (`OFFLINE_PAYMENT`, "Pay at service"). A Stripe/Razorpay provider can implement the same interface without touching controllers.

## 10. Performance
Indexes above; paginated admin/history lists; lean aggregation queries for analytics; lazy-loaded routes and maps; memoised derived values in the wizard; one shared socket per tab.
