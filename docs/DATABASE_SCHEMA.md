# Database Schema (MongoDB / Mongoose)

Models live in `server/src/models`. All have `createdAt` / `updatedAt` (Mongoose timestamps).

```
User ─┬─< Vehicle
      ├─< ServiceRequest (as customer: userId)
      ├─< ServiceRequest (as partner: partnerId)
      ├─< Review (as author: userId, as subject: partnerId)
      ├─< Notification
      ├─< Complaint
      └─1 PartnerProfile      (partners only)
Service ─< ServiceRequest
ServiceRequest ─1 Review (unique per request)
ServiceRequest ─< Complaint
```

## User
`name`, `email` (unique, lowercase), `phone`, `password` (bcrypt hash, `select:false`, stripped from JSON), `role` (`USER | MECHANIC | TOWING_PARTNER | ADMIN`), `avatar`, `isActive`.
Indexes: unique `email`.

## Vehicle
`userId` → User, `type` (`CAR | BIKE | SCOOTER | SUV | COMMERCIAL | OTHER`), `make`, `model`, `registrationNumber` (uppercased), `year`, `fuelType` (`PETROL | DIESEL | CNG | ELECTRIC | HYBRID`), `color`, `isDefault`.
Indexes: `userId`.

## Service (catalogue)
`code` (unique: `BREAKDOWN_REPAIR | TOWING | BATTERY_JUMPSTART | FLAT_TIRE | FUEL_DELIVERY`), `name`, `description`, `basePrice`, `pricePerKm`, `estimatedDurationMin`, `icon`, `isActive`.

## PartnerProfile
`userId` → User (unique), `experienceYears`, `governmentIdRef` / `licenseRef` (text placeholders — no document storage in Phase 1), `address`, `services[]` (service codes), `pricing[{ serviceCode, basePrice }]` (optional per-service base price), `location` (GeoJSON `Point`, `[lng, lat]`), `serviceRadiusKm`, `availability` (`AVAILABLE | BUSY | OFFLINE`), `verificationStatus` (`PENDING | VERIFIED | REJECTED | SUSPENDED`), `verifiedAt`, `rejectionReason`, `ratingAverage`, `ratingCount`, `jobsCompleted`.
Indexes: **`2dsphere` on `location`**, `verificationStatus`, unique `userId`.
Only `VERIFIED` partners are returned by discovery and may accept requests.

## ServiceRequest
`userId`, `vehicleId`, `serviceId`, `partnerId` (assigned), `preferredPartnerId`, `notifiedPartners[]`, `rejectedBy[]`, `serviceType`, `issue`, `description`, `emergencyLevel` (`LOW | MEDIUM | HIGH`), `breakdownLocation{ address, latitude, longitude }`, `pricing{ baseCost, distanceKm, distanceCharge, total }`, `estimatedCost`, `finalCost`, `estimatedArrivalTime`, `actualArrivalTime`, `status`, `paymentStatus` (`PAYMENT_PENDING | OFFLINE_PAYMENT | PAID | REFUNDED`), `acceptedAt`, `startedAt`, `completedAt`, `cancelledAt`, `cancellationReason`, `rating`, `review`.
`status`: `PENDING | SEARCHING | ACCEPTED | ON_THE_WAY | ARRIVED | IN_PROGRESS | COMPLETED | CANCELLED`.
Indexes: `status`, `userId`, `partnerId`, `createdAt` (desc), compound `{partnerId,status}` and `{userId,status}`.

## Review
`requestId` → ServiceRequest (**unique** — one review per job), `userId`, `partnerId`, `rating` (1–5), `comment`. Index: `partnerId`.
Creating a review recomputes `PartnerProfile.ratingAverage` / `ratingCount` with an aggregation.

## Complaint
`userId`, `requestId`, `category` (`OVERCHARGING | DELAY | BEHAVIOUR | POOR_SERVICE | OTHER`), `description`, `priority` (`LOW | MEDIUM | HIGH`), `status` (`OPEN | UNDER_REVIEW | RESOLVED | REJECTED`), `attachments[]` (file-name placeholders), `adminNote`.
Indexes: `userId`, `status`, `createdAt`.

## Notification
`userId`, `type`, `title`, `message`, `data` (e.g. `{ requestId }`), `isRead`. Index: `{ userId, createdAt: -1 }`.

## Invoice
Not stored. The service summary is generated on demand from the `ServiceRequest` (`services/invoice.js`) as JSON or PDF, so it always reflects the stored request.
