# MedBook — MR Catalog & Doctor Booking (Demo Prototype)

> **For the coding agent:** Build a working, deployable prototype from this spec. This is a **client demo due in 1–2 days**, so optimise for a clean, polished, end-to-end working flow over completeness. Do not build anything listed under "Out of Scope". When something is unspecified, choose the simplest reasonable option and note it in `README.md`.

---

## 1. Context

A pharma company's Medical Representatives (MRs) currently carry a **physical product catalog** when visiting doctors. The client wants a digital app where:

1. An MR logs in with **phone OTP**.
2. The MR **onboards doctors** in the field and captures the doctor's **photo with the phone camera**.
3. The MR shows the **digital product catalog** to the doctor.
4. The MR places a **booking (order)** for the doctor.
5. Orders appear in an **Admin Panel**, where the company tracks and **delivers** them.

Later phases (not now): inventory-system sync, real OTP, doctor approval, payments, native mobile apps.

**Platform:** Web app only, **mobile-first** (MR side is used on phones). Admin panel is desktop-first but should remain usable on tablets.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| UI components | shadcn/ui (or plain Tailwind if setup is slow), lucide-react icons |
| Routing | react-router-dom |
| Data fetching | TanStack Query + axios |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB (Atlas) via Mongoose |
| Image storage | Cloudinary (fallback: local `/uploads` folder if `CLOUDINARY_*` env vars are missing) |
| Auth | JWT (Bearer token), roles: `mr`, `admin` |
| Image compression | `browser-image-compression` on the client before upload |
| Deploy targets | Frontend → Vercel, Backend → Render |

Camera must work on phones, which requires **HTTPS** (deployed URL) or `localhost`.

---

## 3. Repository Structure

```
medbook/
├── client/                 # React app (MR app + Admin panel in one app)
│   ├── src/
│   │   ├── api/            # axios instance + API functions
│   │   ├── components/     # shared UI
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── catalog/
│   │   │   ├── doctors/
│   │   │   ├── cart/
│   │   │   ├── orders/
│   │   │   └── admin/
│   │   ├── layouts/        # MrLayout (bottom nav), AdminLayout (sidebar)
│   │   ├── routes/
│   │   └── main.tsx
│   └── .env.example
├── server/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/     # auth, role guard, error handler
│   │   ├── services/       # otp, upload
│   │   ├── seed/           # seed script + product data
│   │   └── index.ts
│   └── .env.example
└── README.md
```

---

## 4. Authentication: Mock OTP

- `POST /api/auth/send-otp` `{ phone }` checks that the user exists. It returns `{ success: true, message: "OTP sent" }`. **No SMS is sent.**
- `POST /api/auth/verify-otp` `{ phone, otp }` accepts **`123456`** as the valid OTP (configurable via `DEMO_OTP` env). It returns `{ token, user }`.
- Keep OTP logic inside `services/otp.service.ts` behind an interface, so a real provider (MSG91 or Firebase) can replace it later without changing routes.
- The UI must look real: phone input with a `+91` prefix, a 6-box OTP input, a 30-second "Resend OTP" timer, and a small hint on the login screen: *"Demo OTP: 123456"*.
- After login, users are routed by role: `mr` goes to `/app`, `admin` goes to `/admin`.
- Store the JWT in `localStorage`. Attach it with an axios interceptor. On a 401 response, log the user out.

Seeded users:
- MR: `9999900001` (Rahul Sharma), `9999900002` (Priya Verma)
- Admin: `9999900000` (Admin)

---

## 5. Data Models (Mongoose)

### User
```ts
{ name: string, phone: string (unique), role: 'mr' | 'admin',
  territory?: string, isActive: boolean, createdAt, updatedAt }
```

### Doctor
```ts
{ name: string, phone: string, specialty: string,
  registrationNo?: string,          // medical council reg. number
  clinicName: string, address: string, city: string,
  photoUrl: string,                 // captured via camera, required
  onboardedBy: ObjectId<User>,      // the MR
  status: 'active',                 // future: 'pending' | 'approved' | 'rejected'
  createdAt, updatedAt }
```

### Product
```ts
{ name: string, sku: string (unique),
  externalId?: string,              // id in future inventory system
  source: 'manual' | 'inventory',   // default 'manual'
  lastSyncedAt?: Date,
  category: string,                 // e.g. Antibiotic, Analgesic, Antacid, Vitamin, Cardiac, Diabetic, Dermatology
  composition: string,              // e.g. "Paracetamol 650mg"
  packSize: string,                 // e.g. "10 x 15 Tablets"
  form: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Cream' | 'Drops',
  mrp: number, price: number,       // price = PTR/PTD shown to doctor
  stock: number,
  imageUrl: string,
  description?: string,
  isActive: boolean, createdAt, updatedAt }
```
The `externalId`, `source` and `lastSyncedAt` fields exist **only for future inventory sync**. Do not build sync now.

### Order
```ts
{ orderNo: string,                  // human readable, e.g. "ORD-1001" (auto-increment)
  doctor: ObjectId<Doctor>, mr: ObjectId<User>,
  items: [{ product: ObjectId<Product>, name: string, sku: string,
            price: number, qty: number, lineTotal: number }],  // snapshot at order time
  totalAmount: number, totalItems: number,
  notes?: string,
  status: 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled',
  statusHistory: [{ status, at: Date, by: ObjectId<User> }],
  createdAt, updatedAt }
```

---

## 6. REST API

All routes are prefixed with `/api`. All routes except auth require a JWT.

| Method | Route | Role | Purpose |
|---|---|---|---|
| POST | `/auth/send-otp` | public | mock OTP send |
| POST | `/auth/verify-otp` | public | returns JWT |
| GET | `/auth/me` | any | current user |
| GET | `/products?search=&category=&page=` | any | catalog list |
| GET | `/products/categories` | any | distinct categories |
| GET | `/products/:id` | any | product detail |
| POST/PUT/DELETE | `/products[/:id]` | admin | product CRUD (nice-to-have) |
| POST | `/uploads/image` | any | multipart upload, returns `{ url }` |
| GET | `/doctors?search=` | mr: own doctors; admin: all | list |
| POST | `/doctors` | mr | create doctor (photoUrl required) |
| GET | `/doctors/:id` | any | detail + that doctor's orders |
| POST | `/orders` | mr | place order (server recalculates prices/totals from DB) |
| GET | `/orders?status=&doctor=&mr=` | mr: own; admin: all | list |
| GET | `/orders/:id` | any | detail |
| PATCH | `/orders/:id/status` | admin | update status, push to statusHistory |
| GET | `/admin/stats` | admin | counts: today's orders, pending, delivered, total doctors, revenue |

Use one error format everywhere: `{ success: false, message }`. Validate inputs with `zod`.

---

## 7. MR App (mobile-first, `/app/*`)

Layout: top header with the app name and the MR's name. **Bottom navigation** has four items: Home, Catalog, Doctors, Orders. A floating cart badge appears when the cart is not empty.

### 7.1 Home `/app`
- Greeting: "Good morning, Rahul".
- Quick action buttons: **+ Onboard Doctor**, **Browse Catalog**, **New Order**.
- Stat cards: Doctors onboarded, Orders today, Pending orders.
- Recent 5 orders.

### 7.2 Catalog `/app/catalog`
- Search bar and horizontally scrollable category chips.
- Product grid with 2 columns on mobile. Each card shows the image, name, composition, pack size, price, and MRP (struck through).
- Tapping a card opens the **Product Detail** screen: large image, all fields, description, quantity stepper, and an **Add to Cart** button.
- The catalog must look like a **premium digital version of a physical catalog**, because this is what the MR shows to doctors. Use clean visuals and large images.

### 7.3 Doctors `/app/doctors`
- A searchable list. Each row shows a photo avatar, name, specialty, and clinic.
- Tapping a row opens the **Doctor Profile**: photo, details, an order history list, and a **New Order for this doctor** button.

### 7.4 Onboard Doctor `/app/doctors/new`
- Step 1, **Capture Photo**: show a large circular placeholder and a "Take Photo" button that uses `<input type="file" accept="image/*" capture="user">`. Show a preview with a "Retake" option. Compress the image to about 300KB and upload it to `/uploads/image`.
- Step 2, **Details form**: name*, phone*, specialty* (dropdown: General Physician, Cardiologist, Diabetologist, Pediatrician, Dermatologist, Gynecologist, Orthopedic, ENT, Other), registration no., clinic name*, address*, city*.
- Submit, show a success screen ("Dr. X onboarded"), then offer two actions: "Place Order" or "Back to Doctors".
- Do not allow submission without a photo.

### 7.5 Cart & Booking `/app/cart`
- If no doctor is selected yet, show a "Select Doctor" searchable picker at the top. The cart is tied to one doctor.
- Line items with quantity steppers and a remove button. The subtotal per line and the grand total update live.
- Optional notes field.
- **Place Order** shows a confirmation dialog, then a success screen with the order number. Clear the cart after success.
- Persist the cart in `localStorage` (Zustand with persist middleware is fine).

### 7.6 Orders `/app/orders`
- List of the MR's orders: order number, doctor, date, total, and a colored status badge.
- Order detail shows the items and a status timeline.

---

## 8. Admin Panel (desktop-first, `/admin/*`)

Layout: left sidebar with Dashboard, Orders, Doctors, Products, MRs. Top bar shows the admin name and a logout button.

### 8.1 Dashboard `/admin`
- Stat cards: Orders today, Pending, Dispatched, Delivered, Total doctors, Total order value.
- Table of the latest 10 orders.
- Poll for new orders every 10 seconds (TanStack Query `refetchInterval`). When a new order arrives, show a toast: "New order ORD-1007 from Dr. X". **This is the key moment in the demo**, so make sure it works.

### 8.2 Orders `/admin/orders`
- Table columns: Order number, Date/time, Doctor, MR, Items count, Total, Status.
- Filters: status tabs (All, Pending, Confirmed, Dispatched, Delivered) and a search box.
- The order detail drawer or page shows:
  - Doctor info with photo, clinic address, and phone (needed for delivery)
  - MR info
  - Items table
  - Status timeline
  - Action buttons: **Confirm → Dispatch → Mark Delivered**, plus a Cancel button
- Include a **Print / Delivery slip** button that uses `window.print()` with a print-friendly layout.

### 8.3 Doctors `/admin/doctors`
- Table with photo, name, specialty, clinic, city, onboarded-by MR, date, and order count. Clicking a row opens the detail view.

### 8.4 Products `/admin/products`
- Table with image, name, SKU, category, price, MRP, stock, and active status.
- **Nice-to-have, only if time permits:** add/edit form and CSV import.

### 8.5 MRs `/admin/mrs`
- Simple list: name, phone, territory, doctors onboarded, orders placed.

---

## 9. Seed Data (`npm run seed` in `/server`)

- 3 users (see section 4).
- **35–40 realistic Indian pharma products** across 7 or more categories. Use realistic generic compositions and invented brand names, for example "Paracip 650" (Paracetamol 650mg) and "Azitrex 500" (Azithromycin 500mg). **Do not use real brand names.** Price range is ₹30 to ₹600, and MRP is 15–25% higher than price.
- Product images: use placeholder images generated per form (tablet strip, syrup bottle, tube) with a consistent style, or placeholder URLs from `https://placehold.co/400x400?text=<Name>`. Keep `imageUrl` easy to replace later with real catalog photos.
- 6 doctors with placeholder avatar photos, spread across both MRs.
- 8 orders spread across all statuses and the last 7 days, so the dashboard looks populated.
- The seed script must be **idempotent**: it clears and reseeds the data.

---

## 10. UI / Design Guidelines

- Healthcare feel: primary color teal or medical blue (for example `#0E7C86` or `#2563EB`), white surfaces, soft gray background, rounded-xl cards, subtle shadows.
- Font: Inter.
- MR app: large touch targets (minimum 44px), bottom nav, sticky action buttons at the bottom of forms and cart.
- Status badge colors: pending is amber, confirmed is blue, dispatched is violet, delivered is green, cancelled is red.
- Indian currency formatting: `₹1,234.00` using `Intl.NumberFormat('en-IN')`.
- Every list needs loading skeletons, empty states, and error toasts (use sonner).
- App name in the UI: **"MedBook"**. Keep it in one config constant so it is easy to rename to the client's brand.
- Add a PWA manifest and icon so "Add to Home Screen" works. A service worker is optional.

---

## 11. Environment Variables

**server/.env.example**
```
PORT=5000
MONGODB_URI=
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
DEMO_OTP=123456
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**client/.env.example**
```
VITE_API_URL=http://localhost:5000/api
```

Configure CORS to allow `CLIENT_URL`.

---

## 12. Scripts & README

- Root `package.json` with `npm run dev`, which runs client and server concurrently.
- `server`: `dev` (tsx watch), `build`, `start`, `seed`.
- `client`: `dev` (with `--host` so it can be opened on a phone over LAN), `build`, `preview`.
- `README.md` must include:
  - Local setup steps
  - How to seed the database
  - Demo login numbers and OTP
  - Deploy steps for Vercel and Render
  - Note that camera capture needs HTTPS on phones (use the deployed URL or `ngrok`)

---

## 13. Build Order (follow this sequence)

1. Scaffold the monorepo, server with DB connection, and client with Tailwind, router, and layouts.
2. Models, seed script, and the mock OTP auth flow end-to-end.
3. Catalog: API and MR UI.
4. Doctor onboarding with camera capture and upload.
5. Cart and order placement.
6. MR orders list and detail.
7. Admin: dashboard with polling and toast, orders with status actions, doctors, products, MRs.
8. Polish: empty and loading states, print slip, PWA manifest, README.
9. Test the full demo script (section 14) on a mobile viewport.

---

## 14. Demo Script (Acceptance Criteria)

The prototype is **done** when all of these work on a deployed URL:

1. On a phone, the MR logs in with `9999900001` and OTP `123456`.
2. The MR browses the catalog, searches "para", filters by category, and opens a product detail.
3. The MR taps **Onboard Doctor**, takes a photo with the phone camera, fills in the form, and submits. The doctor appears in the list with the photo.
4. The MR places an order for that doctor with 3 products and receives an order number.
5. On a laptop, the admin (`9999900000`) sees the new order on the dashboard within about 10 seconds, with a toast notification.
6. The admin opens the order, sees the doctor's photo and address, and moves it through Confirm, Dispatch, and Delivered. The MR's order view reflects the new status.
7. The admin prints the delivery slip.
8. There are no console errors, and all screens are responsive at 375px width.

---

## 15. Out of Scope (do NOT build)

- Real SMS OTP
- Inventory system sync
- Doctor approval workflow
- Payments
- Notifications (push, SMS, email)
- Native apps
- Multi-tenant support
- Analytics beyond the basic stats
- Automated tests beyond a quick manual check

Keep the code structured so that each of these can be added later. In particular:
- The OTP service is behind an interface.
- Products carry `externalId` and `source`.
- Doctors carry `status`.
