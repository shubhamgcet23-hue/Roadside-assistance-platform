# Product Requirements Document — RoadsideAAA

## 1. Problem
Drivers stranded by a breakdown cannot quickly find trustworthy help nearby, cannot compare prices, and do not know when help will arrive. Independent mechanics and tow operators have no channel to reach stranded drivers.

## 2. Target users
| User | Needs |
|---|---|
| **Vehicle owner** (car, bike, scooter, SUV, commercial) | Fast help with minimal typing on a phone, verified partners, price before committing, live tracking |
| **Mechanic / towing partner** | Steady nearby jobs, simple accept-and-update workflow, transparent earnings |
| **Platform admin** | Quality control (verification), oversight of live jobs, complaints handling, performance and revenue visibility |

## 3. User stories
**Owner**
- As an owner I can register, add my vehicles and set a default so a request takes a few taps.
- As an owner I can request a service (repair, towing, jump-start, flat tyre, fuel), share my location by GPS or by typing/pinning it, and see nearby verified partners with distance, rating, ETA and estimated price before I confirm.
- As an owner I can watch status change in real time and see the partner approach on a map.
- As an owner I can cancel before work starts, see my history and a service summary (PDF), rate the partner once, and file a complaint.

**Partner**
- As a partner I can register, complete my profile (services, prices, radius, ID/licence placeholders) and wait for verification.
- As a verified partner I can go available, receive nearby requests in real time, accept or reject, and move the job through on-the-way → arrived → in-progress → complete.
- As a partner I can share live GPS and view earnings and job history.

**Admin**
- As an admin I can verify, reject, suspend or reactivate partners, activate/deactivate users, manage the service catalogue and pricing, monitor all requests, resolve complaints, and view analytics and reports for a date range.

## 4. Functional requirements
1. Role-based authentication (`USER`, `MECHANIC`, `TOWING_PARTNER`, `ADMIN`); admin not publicly registrable.
2. Vehicle CRUD with default vehicle.
3. Six-step request wizard (vehicle, service, location, details/urgency, estimate with nearby partners, confirm).
4. Partner discovery: verified, not offline, offers the service, within service radius; sorted by availability, distance, rating; Haversine distance and ETA.
5. Transparent pricing: `base + distance × price/km`, labelled as an estimate.
6. Real-time request delivery to partners and status updates to the owner (Socket.IO); persisted notifications.
7. Enforced request lifecycle with atomic acceptance and blocked invalid transitions.
8. Live partner location with Demo Tracking Mode for presentations (clearly labelled).
9. Service history, service summary / PDF, one review per completed job, complaints.
10. Admin dashboard with analytics from real data, partner/user/service/request/complaint management, reports with date filter.
11. Payment abstraction; Phase 1 = offline payment only.

## 5. Non-functional requirements
- **Security:** hashed passwords, JWT, RBAC, validation, Mongo operator sanitising, Helmet, CORS allow-list, rate limiting, no secrets in source.
- **Usability:** mobile-first, large touch targets, minimal typing, errors always shown (toasts + inline), loading skeletons and meaningful empty states.
- **Performance:** indexed queries, paginated lists, lazy-loaded routes/maps.
- **Portability:** runs locally with Node + MongoDB; deployable to Vercel/Netlify, Render/Railway/AWS and MongoDB Atlas.
- **Maintainability:** layered backend, reusable UI components, automated tests.
- **Accessibility:** labelled form controls, roles/aria on dynamic UI, keyboard-operable controls.

## 6. KPIs (computed in the admin dashboard from MongoDB)
Total / active / completed / cancelled requests · average response time · average completion time · partner acceptance rate · average customer rating · total estimated revenue · verified-partner count.

## 7. Assumptions
- Users grant location access or type an address (OpenStreetMap/Nominatim geocoding).
- Partners are individually verified by an admin before receiving jobs.
- Prices are estimates; the final price is confirmed by the partner on completion and paid offline.
- A single region/currency (INR) in Phase 1.

## 8. Constraints
- No online payments, SMS/email delivery, or real document/photo storage in Phase 1 (ID, licence and photo fields are placeholders).
- OpenStreetMap tiles and Nominatim are used for free; their usage policies limit heavy production use.
- Free hosting tiers sleep after inactivity.

## 9. Future enhancements
Online payments (Stripe/Razorpay) · KYC document upload and review · photo upload with requests · push/SMS/WhatsApp notifications · Google Maps/Mapbox routing and traffic-aware ETA · dynamic pricing · partner wallet/payouts · scheduled bookings · in-app chat · multi-language · mobile apps · Redis adapter for scaled sockets.
