# H-Fleet

Ride app. Riders sign in with their H-Pesa account and pay for rides from their H-Pesa wallet.
Map: MapLibre with OpenFreeMap (OpenStreetMap data). Place search: Photon (OpenStreetMap data, Kenya only).

## Deploy
**Backend (Render, root `backend`)** Build: `npm install` - Start: `npm run start:prod`
Environment:
- `HPESA_API` = your H-Pesa backend address (for example https://h-pesa.onrender.com)
- `HFLEET_API_KEY` = the H-Fleet key from H-Pesa (the same value as `HFLEET_API_KEY` on the H-Pesa service)
- `CORS_ORIGINS` = your H-Fleet Vercel address
- `JWT_SECRET` is no longer used (H-Pesa issues the login token)

**Frontend (Vercel, root `frontend`)** Environment: `VITE_API_URL` = H-Fleet backend address, `VITE_HPESA_URL` = H-Pesa app address (optional, for the Top up button).

## Test
`cd backend && npm install && npm test` (offline, with a pretend H-Pesa). To test against a real H-Pesa: `HPESA_API=... HFLEET_API_KEY=... npm test`.

## Placeholders to review
Fare rates (`backend/src/lib/fare.js` and `frontend/src/lib/fare.js`, must match): base 80, KES 35 per km, minimum 150.
The driver shown after booking is a demo driver until the real driver side exists.


## Accounts (v4)
- H-Fleet has its **own** accounts (phone + password). Nothing is created in H-Pesa when you register here.
- Connecting an H-Pesa wallet is optional and can be done any time (Wallet screen). Rides are paid from the connected wallet with its PIN.
- H-Pesa can send people here pre-filled: `/login?register=1&name=..&phone=..&email=..` (no passwords or PINs).
- Render env for the backend: `HPESA_API`, `HFLEET_API_KEY`, `CORS_ORIGINS`, and now **`JWT_SECRET`** (any long random string).


## Database (v5)
This app now stores data in TiDB Cloud (MySQL-compatible) so accounts survive restarts and deploys. Set `DATABASE_URL` on Render (see backend/.env.example). The tables are created automatically on start (`prisma db push`).
