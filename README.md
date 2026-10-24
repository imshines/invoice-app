# Modern Billing, Inventory & Khata ERP

A vibe slop to satisfy my guilt which I had a long time. Built using Antigravity (Gemini flash 3.8)

A billing full-stack web application built with **Next.js 16 (App Router & Turbopack)**, **Hono Backend**, **PostgreSQL 18**, **Drizzle ORM**, and **Tailwind CSS**.

---

## 🚀 Key Modernizations & Features

| Capability             | Modern ERP                                                                 |
| :--------------------- | :------------------------------------------------------------------------- |
| **Framework**          | **Next.js 16.4.2** (Turbopack, App Router) + **Hono API**                  |
| **Database**           | **PostgreSQL 18** (ACID transactions, Drizzle ORM, strict types)           |
| **Invoice Storage**    | **Persistent Tax Invoices** with immutable JSONB customer/seller snapshots |
| **Inventory Tracking** | **Double-Entry Stock Ledger** (`stock_movements`) with low-stock alerts    |
| **Tax Compliance**     | **Indian GST Engine** (Automated CGST/SGST vs IGST split & HSN codes)      |
| **Payments**           | **Dynamic UPI QR Code** (0% MDR direct settlement) + Split payments        |
| **Customer Credit**    | **Customer Khata (Credit) Ledger** with outstanding balance tracking       |
| **Checkout UX**        | **High-Speed Counter POS** with barcode scanner support & hotkeys          |
| **Printing**           | **80mm Thermal Receipt** & **A4 Tax Invoice** Print Layouts                |
| **Docker Support**     | Full **`docker-compose.yml`** and multi-stage **`Dockerfile`**             |

---

## 🛠️ Architecture & Tech Stack

```
Frontend:   Next.js 16.4.2 (App Router, Turbopack, Tailwind CSS, Lucide Icons)
Backend:    Hono v4 (Mounted on /api/[[...route]], Hono RPC hc<AppType>)
Database:   PostgreSQL 18 (Localhost port 5433 or Docker container)
ORM:        Drizzle ORM with Drizzle Kit migrations
QR Engine:  qrcode (NPCI Bharat/UPI compliant payload generator)
Auth:       bcryptjs password hashing & role-based access control
```

---

## ⚡ Quick Start (Running Locally)

### 1. Prerequisites

- **Node.js**: v20+ (tested on Node v24.18)
- **Database**: PostgreSQL 18 running on port `5433` (or Docker Desktop)

### 2. Environment Setup

The project is preconfigured in `.env.local`:

```env
DATABASE_URL=postgresql://postgres:root@127.0.0.1:5433/invoice_db
AUTH_SECRET=f3b89a9c27d8e4125b0e8c312781498b7a42167d3e512401986421598214abc1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Migrations & Seed Sample Data

```bash
# Push database schema to PostgreSQL 18
npx drizzle-kit push

# Seed organization, sample products with stock, and Khata customers
npx tsx src/server/db/seed.ts
```

### 4. Start the Application

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🐳 Running with Docker

If you prefer containerized deployment with Docker:

```bash
docker compose up -d --build
```

This starts:

- The Next.js 16 + Hono Application on port `3000`
- PostgreSQL 18 on port `5434`
- Mailpit Email Inspector on port `8025`

---

## 📖 Navigation & Routes

- **Dashboard** (`/`): Real-time sales velocity, revenue, Khata receivables, and low-stock alerts.
- **Quick POS** (`/pos`): High-speed checkout counter with barcode scanner support, real-time gross profit margin calculator, dynamic UPI QR code generator, and instant receipt printing.
- **Sales Invoices** (`/invoices`): Audited list of finalized tax invoices, payment statuses, and printable invoice viewer.
- **Stock & Inventory** (`/products`): Catalog management, stock balance alerts, and inventory movement adjustments.
- **Customers & Khata** (`/customers`): Customer directory, credit limits, and Khata ledger statements.
- **Company Settings** (`/settings`): Business legal name, GSTIN, UPI VPA (for payment QR), and thermal receipt headers/footers.
