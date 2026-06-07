# DigitalCRM — Kiyim-kechak Ulgurji Savdo Tizimi

## Loyiha strukturasi
```
digitalWeb/
├── backend/
│   ├── src/
│   │   ├── config/       db.js, initDB.js
│   │   ├── controllers/  auth, user, customer, category, product, order, inventory, dashboard
│   │   ├── middleware/   auth.js, upload.js
│   │   └── routes/       index.js
│   │   └── server.js
│   ├── uploads/          (rasm fayllari)
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/   Layout, Sidebar, Header, Modal, Confirm, StatusBadge, Spinner
    │   ├── lib/          api.js, utils.js
    │   ├── pages/        Login, Dashboard, Customers, Products, Orders, OrderDetail, Inventory, Users
    │   ├── store/        auth.js (Zustand)
    │   └── App.jsx
    └── package.json
```

## Ishga tushirish

### 1. Backend
```bash
cd backend
npm install
# .env faylida DATABASE_URL ni to'ldiring
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### Login
- URL: http://localhost:5173
- Email: admin@crm.uz
- Parol: admin123

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/dashboard | Dashboard statistika |
| GET/POST | /api/customers | Mijozlar |
| GET/POST | /api/products | Mahsulotlar |
| GET/POST | /api/orders | Buyurtmalar |
| PATCH | /api/orders/:id/status | Status yangilash |
| GET | /api/inventory/logs | Ombor jurnali |
| POST | /api/inventory/in | Kirim |
| POST | /api/inventory/out | Chiqim |
| GET/POST | /api/users | Foydalanuvchilar (admin) |

## Rollar
- **admin** — to'liq ruxsat
- **manager** — yaratish, tahrirlash, buyurtma
- **warehouse** — faqat ombor kirim
