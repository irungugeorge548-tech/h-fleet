# H-Fleet

Bolt-style ride app with real map (Leaflet + OpenStreetMap).

## Run

### Backend (port 5002)
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

### Frontend (port 5175)
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5175

Login: `0712345678` / `password123`  
PIN: `1234`

**Note:** H-Pesa must be running on port 5000 for payments.
