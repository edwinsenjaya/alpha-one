# Alpha One — Multi-Store Inventory & Invoice Management System

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase)

**Alpha One** is a high-performance, full-stack enterprise web application designed for multi-store inventory tracking, dynamic invoice creation, and sales statistics management. Built with modern web standards, it showcases clean architecture, type safety, server-side and real-time Firestore database queries, and dynamic multi-tenant scope filtering.

---

## ✨ Key Features & Technical Highlights

- 🏬 **Multi-Tenant / Store-Scoped Architecture:** Granular access control and real-time data filtering by `storeId` across users, items, and invoices.
- 🧾 **Dynamic Invoice Generator:** Real-time unit conversions (rolls, yards, colors) and pricing estimations with structured state management (`CreateInvoiceTable`).
- ⚡ **Real-Time Data Sync:** Live database listener integration using Firebase Firestore (`onSnapshot`).
- 📊 **Dashboard & Analytics:** Dynamic revenue tracking, invoice totals, and aggregated metrics per store.
- 🛡️ **Role-Based Access Control (RBAC):** Tiered permissions supporting Admin/Boss and store-specific operator roles.
- 🔧 **Automated Database Tooling:** Built-in TypeScript CLI scripts (`tsx`) for database seeding, store resets, and admin provisioning.

---

## 🔐 Recruiter & Demo Access

You can log directly into the live preview/local environment using the pre-configured demo account below:

| Portal              | Demo Email                | Password | Role Scope                       |
| :------------------ | :------------------------ | :------- | :------------------------------- |
| **Admin Dashboard** | `edwinsenjaya7@gmail.com` | `abcD1.` | System Boss / Multi-Store Access |

1. Navigate to `/login`
2. Enter the credentials above to explore the dashboard, inventory management, and invoice creation features.

---

## ⚙️ Tech Stack & Architecture

- **Frontend Framework:** Next.js 15 (App Router, Server & Client Components)
- **Language:** TypeScript 5 (Strict Mode, Custom Interfaces & DTOs)
- **Styling & UI:** Tailwind CSS v4, Heroicons, Modern Responsive Design
- **Backend & Database:** Firebase Firestore (NoSQL, Real-time Subscriptions, Security Rules)
- **Authentication:** Firebase Auth
- **Scripting & Utilities:** `tsx`, `date-fns`

---

## 🛠️ CLI & Maintenance Utilities

This repository includes CLI utilities for database operations, seeding mock data, and store resets:

```bash
# Create initial Admin/Boss User
npm run create:boss

# Populate database with default items & fabrics
npm run seed:items

# Generate mock invoices with random unit counts
npm run seed:invoices

# Reset stores or perform full database wipe
npm run reset:stores
npm run reset:all
```

---

## 🚀 Local Development Setup

1. **Clone the repository:**

   ```bash
   git clone git@github.com:edwinsenjaya/alpha-one.git
   cd alpha-one
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Ensure Firebase configuration keys are populated in `src/firebase/firebaseConfig.ts`.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.
