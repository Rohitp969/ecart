# Ekart — MERN e-commerce store

A full-stack online store: product catalog with filters and search, cart, checkout with Razorpay **or Cash on Delivery**, order tracking, customer accounts, a help center, and an admin panel for products, orders, customers, messages and sales analytics.

**Stack:** React 19 · Vite · Tailwind CSS v4 · Redux Toolkit · React Router 7 · Node.js · Express 5 · MongoDB (Mongoose) · Cloudinary · Razorpay · Nodemailer (Gmail)

## Features

**Customers**
- Browse by category, search, filter (brand, price, rating, discount, stock), sort and paginate
- Cart with stock checks and free-delivery progress; checkout with saved addresses, online payment (UPI, cards, net banking, wallets) or Cash on Delivery
- My Account: orders (track, cancel before shipping, buy again), profile & photo, saved addresses with a default, newsletter setting, change password, delete account
- Signup with email verification, forgot password with a 6-digit emailed code
- Public order tracking by order ID + email, contact form, FAQs, shipping & returns, size guide, privacy policy and terms

**Admins** (`/dashboard`)
- Sales dashboard (revenue, orders, top products, categories, low stock)
- Products (create/edit with up to 5 images), orders (fulfilment status; COD orders become paid on delivery), customers, contact messages and newsletter subscribers (CSV export)

**Security**
- Order totals are always calculated on the server from current prices
- OTPs are stored hashed, limited to 5 attempts, and resends have a 60-second cooldown
- Password reset needs a one-time token issued after a correct OTP
- Login and reset don't reveal which emails have accounts
- Uploads accept images only, up to 5 MB each

## Project structure

```
ecart/
├── backend/        Express API (routes → controllers → Mongoose models)
│   ├── config/     Razorpay client, allowed frontend origins
│   ├── seed/       sample products (npm run seed)
│   └── .env.example
├── frontend/       React app (Vite)
│   ├── src/pages/  routes (store, auth, account, help, admin)
│   ├── src/components/, hooks/, lib/, redux/
│   └── .env.example
└── package.json    `npm run dev` starts both
```

## Getting started

Requirements: Node.js 20+, a MongoDB database (e.g. MongoDB Atlas), and accounts for Cloudinary and Razorpay (test mode is fine).

```bash
# 1. install
npm install                 # root (concurrently)
npm install --prefix backend
npm install --prefix frontend

# 2. configure
cp backend/.env.example backend/.env      # fill in the values
cp frontend/.env.example frontend/.env

# 3. (optional) add sample products
npm run seed --prefix backend

# 4. run backend + frontend together
npm run dev
```

Frontend: http://localhost:5173 · API: http://localhost:8000 (or your `PORT`)

### Environment variables

| backend/.env | What it's for |
|---|---|
| `PORT` | API port (default 3000; the frontend `.env` must point at it) |
| `MONGO_URI` | MongoDB connection string |
| `SECRET_KEY` | JWT signing secret (long random string) |
| `MAIL_USER`, `MAIL_PASS` | Gmail address + [App password](https://myaccount.google.com/apppasswords) that sends verification, OTP and support emails |
| `CLIENT_URL` | Frontend URL used in email links (optional; defaults to the site the request came from) |
| `CLOUD_NAME`, `API_KEY`, `API_SECRET` | Cloudinary |
| `RAZORPAY_KEY_ID`, `RAZORPAY_SECRET` | Razorpay |

| frontend/.env | What it's for |
|---|---|
| `VITE_API_URL` | Backend base URL, e.g. `http://localhost:8000` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay key id (same as the backend's) |

Without `MAIL_USER`/`MAIL_PASS` the API still runs in development: verification links and OTP codes are printed in the backend console instead of being emailed.

### Making an admin

Sign up normally, then set that user's `role` to `"admin"` in MongoDB. After that, admins can change other users' roles from **Admin → Users**.

## Deployment

- **Frontend (Vercel):** set the project root to `frontend`, add the two `VITE_*` variables. `frontend/vercel.json` rewrites all routes to `index.html` so deep links such as email verification links work.
- **Backend (Render/Railway/etc.):** root `backend`, start command `npm start`, add every variable from `backend/.env.example`, and set `CLIENT_URL` to the live frontend URL. Add the live frontend URL to `ALLOWED_ORIGINS` in `backend/config/clientUrl.js`.

Never commit `.env` files — only the `.env.example` templates are tracked.
