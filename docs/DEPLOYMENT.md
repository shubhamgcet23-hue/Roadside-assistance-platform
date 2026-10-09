# Deployment Guide

Order matters: **database → API → client → connect them**. Budget a full day for your first deploy.

## 0. Before you start
- Push the project to GitHub (the root `.gitignore` already excludes `.env` and `node_modules`).
- Generate a production secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

## 1. MongoDB Atlas
1. Create a free cluster and a **database user** (username + password; avoid special characters or URL-encode them).
2. **Network Access → Add IP address → `0.0.0.0/0`** (Render's outbound IPs change).
3. **Connect → Drivers** and copy the string; add the database name:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/roadside_aaa?retryWrites=true&w=majority`

## 2. API on Render (or Railway)
**Using the blueprint:** Render → New → Blueprint → select the repo (`render.yaml` is at the root).
**Manually:** New → Web Service → connect repo →
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Environment variables:
| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | your Atlas string |
| `JWT_SECRET` | the generated secret |
| `CLIENT_URL` | your client URL once known (exact origin, no trailing slash). Comma-separate to allow several (e.g. production + preview) |
| `SEED_CENTER_LAT` / `SEED_CENTER_LNG` | where you will demo |

Render supports WebSockets, so Socket.IO works on the same service. After it deploys, open `https://<api>.onrender.com/api/health` — you should see `{"ok":true,...}`.

**Seed the production database once** (from your laptop, pointing at Atlas):
```bash
cd server
# Windows PowerShell:  $env:MONGODB_URI="<atlas uri>"; $env:JWT_SECRET="x"; npm run seed
MONGODB_URI="<atlas uri>" JWT_SECRET=x npm run seed
```
`npm run seed` **deletes all existing data**. The seed creates well-known demo passwords, so for any public deployment either change them or remove the demo accounts afterwards.

## 3. Client on Vercel (or Netlify)
**Vercel:** New Project → import repo → Root Directory `client` → Framework Preset **Vite** (build `npm run build`, output `dist`).
**Netlify:** Base directory `client`; `client/netlify.toml` and `client/public/_redirects` provide the build command, publish dir and SPA rewrite.

Environment variables (set **before** the build, they are baked in at build time):
| Key | Value |
|---|---|
| `VITE_API_URL` | `https://<api>.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://<api>.onrender.com` |
| `VITE_DEMO_LAT` / `VITE_DEMO_LNG` | same as the seed centre |

`client/vercel.json` rewrites all paths to `index.html` so refreshing `/app/...` works.

## 4. Connect the two
1. Copy the final client URL (e.g. `https://roadsideaaa.vercel.app`).
2. In Render set `CLIENT_URL` to exactly that origin → the service redeploys.
3. Log in with the demo accounts and run the demo script from the README on the **live** URLs.

## 5. Production checklist
- [ ] `JWT_SECRET` is long, random and only set in the host dashboard.
- [ ] `.env` files are not committed (`git ls-files | grep .env` shows only `.env.example`).
- [ ] CORS: `CLIENT_URL` matches the deployed client exactly.
- [ ] Atlas network access and database user are correct.
- [ ] Demo accounts removed or passwords changed for any public launch.
- [ ] Browser geolocation requires **HTTPS** — Vercel/Netlify provide it.
- [ ] Free Render instances sleep: hit `/api/health` a few minutes before presenting.

## 6. Troubleshooting
| Symptom | Cause / fix |
|---|---|
| Browser console: CORS error | `CLIENT_URL` differs from the page origin (http vs https, trailing slash, preview URL) |
| Login works locally but not live | Client built without `VITE_API_URL`; set it and redeploy the client |
| Live updates / tracking never arrive | `VITE_SOCKET_URL` wrong (must be the API origin, no `/api`) |
| `Could not connect to MongoDB` in Render logs | Atlas IP allow-list, wrong password, or missing DB name in the URI |
| 404 on page refresh | SPA rewrite missing: confirm `vercel.json` / `_redirects` is deployed |
| "No mechanics available nearby" on the live site | Seed centre differs from your location; set `SEED_CENTER_*`, re-seed, and use the demo-location button |
| First request after idle is very slow | Free-tier cold start (can take ~30–60 s) |
