# MedBook: Doctor Onboarding (Demo, Phase 1)

A mobile-first web app where a Medical Representative (MR) logs in with a phone OTP, onboards doctors with a camera photo, and the admin panel shows every new doctor live.

**Phase 1 scope (this build):** MR login, doctor onboarding with photo, MR doctor list and profile, admin dashboard (live), admin doctors list and detail, and MR list.
**Deferred to later phases** (see `PROJECT_SPEC.md`): product catalog, cart and orders, order tracking, delivery slip.

## Demo logins

| Role | Phone | OTP |
|---|---|---|
| MR: Rahul Sharma | `9999900001` | `123456` |
| MR: Priya Verma | `9999900002` | `123456` |
| Admin | `9999900000` | `123456` |

No SMS is sent. The OTP is mocked behind `server/src/services/otp.service.ts` (`OtpProvider` interface), so MSG91 or Firebase can be plugged in later.

## Demo script

1. **Phone:** open the app, log in as `9999900001` with OTP `123456`.
2. Tap **Onboard** (the + button), then **Take Photo**. The camera opens. Capture the photo, then tap **Continue**.
3. Fill in the details and tap **Submit & Onboard**. The success screen appears, and the doctor shows in **Doctors** with the photo.
4. **Laptop:** log in as admin `9999900000`. Within about 10 seconds a toast pops up: *"New doctor: Dr. X, onboarded by Rahul Sharma"*. The doctor appears at the top of the dashboard.
5. Click the row to see the full photo, address, phone, and the MR who onboarded the doctor. **MRs** shows counts per MR, and clicking an MR filters the doctor list.

> **Tip:** run `npm run seed` before the demo to reset the data.
> **Render free tier sleeps after 15 minutes idle.** Open the app about 2 minutes before the demo so the API is awake.

## Local setup

Requirements: Node 20+ and MongoDB (local, Docker or Atlas).

```bash
# MongoDB via Docker (skip if using Atlas)
docker run -d --name medbook-mongo -p 27017:27017 -v medbook-mongo-data:/data/db mongo:7

npm run install:all                 # installs root, server, client
cp server/.env.example server/.env  # set JWT_SECRET (and MONGODB_URI if not local)
npm run seed                        # creates 3 users + 6 sample doctors (idempotent)
npm run dev                         # API on :5000, web on :5180
```

Open http://localhost:5180.

### Testing the camera on a real phone

Phone browsers only allow camera capture over **HTTPS** (or `localhost`). Options:
- Use the deployed Vercel URL (easiest), or
- `ngrok http 5180` and open the https URL on the phone. The Vite dev server proxies `/api` to the backend, so a single tunnel is enough.

Without a camera (for example on a laptop), the **Choose from gallery** option picks a file instead.

## Project structure

```
client/   React 18 + Vite + TS + Tailwind v4, TanStack Query, sonner, lucide
  src/api/             axios instance (JWT interceptor, 401 → logout) + endpoints
  src/features/auth/   login (phone + 6-box OTP + resend timer), auth context, role guard
  src/features/doctors onboarding (camera → compress ~300KB → upload → form), list, profile
  src/features/admin/  dashboard (10s polling + new-doctor toasts), doctors table + drawer, MRs
  src/layouts/         MrLayout (bottom nav), AdminLayout (sidebar)
  src/config.ts        APP_NAME: rename the brand here
server/   Express + TS + Mongoose + zod + JWT
  src/models/          User, Doctor (status field reserved for approval flow), Image
  src/services/        otp.service (mock provider), upload.service (Cloudinary or MongoDB)
  src/seed/seed.ts     npm run seed
```

### API

| Method | Route | Role |
|---|---|---|
| POST | `/api/auth/send-otp` · `/api/auth/verify-otp` | public |
| GET | `/api/auth/me` | any |
| POST | `/api/uploads/image` (multipart field `image`) → `{ url }` | any |
| GET | `/api/uploads/:id` | public (image bytes) |
| GET | `/api/doctors?search=&mr=&limit=` | MR: own only · admin: all |
| POST | `/api/doctors` | MR |
| GET | `/api/doctors/:id` | MR: own only · admin: any |
| GET | `/api/admin/stats` · `/api/admin/mrs` | admin |

Errors always look like `{ success: false, message }`.

## Deploy

### 1. Database: MongoDB Atlas
Create a free M0 cluster. Add a DB user. Under Network Access, allow `0.0.0.0/0` (needed for Render). Copy the connection string, e.g. `mongodb+srv://user:pass@cluster.xxx.mongodb.net/medbook`.

Seed it once from your machine:
```bash
cd server && MONGODB_URI="<atlas-uri>" JWT_SECRET=x npm run seed
```

### 2. API: Render
Push the repo to GitHub. Create a **Blueprint** on Render from `render.yaml` (or a Web Service with root `server`, build `npm install && npm run build`, start `npm start`). Set these env vars:
- `MONGODB_URI`: the Atlas URI
- `CLIENT_URL`: your Vercel URL, e.g. `https://medbook.vercel.app` (comma-separate multiple; `*.vercel.app` previews are allowed automatically)
- `CLOUDINARY_*`: optional, see below

### 3. Web: Vercel
Import the repo. Set **Root Directory** to `client` (framework: Vite). Add env var `VITE_API_URL=https://<your-render-service>.onrender.com/api`. Deploy. `vercel.json` already handles SPA routes.

## Decisions & notes

- **Photo storage:** if `CLOUDINARY_*` is set, photos go to Cloudinary. Otherwise they are stored **in MongoDB** and served from `/api/uploads/:id`. The spec suggested a local `/uploads` folder, but Render's disk is wiped on every restart, which would lose doctor photos mid-demo. Photos are compressed on the phone to about 300KB first.
- **Camera:** **Take Photo** opens an in-app live camera (`CameraCapture.tsx`, `getUserMedia`). The browser asks for camera permission, the **rear** camera opens by default (the MR photographs the doctor), and a switch-camera button and face guide are included. If permission is blocked, the screen explains how to allow it and offers "Open phone camera app" or "Choose from gallery". Where live camera isn't available (plain HTTP on a phone), it falls back to the phone's camera app (`<input capture>`).
- **Gallery:** **Choose from gallery** uses a file input without `capture`, restricted to image types, so phones open the photo picker / gallery.
- **Duplicate doctors:** a doctor's mobile number must be unique. The second attempt shows who already onboarded that doctor.
- **Live updates:** the admin panel polls every 10 seconds (TanStack Query `refetchInterval`). The new-doctor toast works on every admin page.
- **Seed photos** use `randomuser.me` placeholder portraits.
- **PWA:** manifest and icons are included, so "Add to Home Screen" works. There is no service worker yet.
