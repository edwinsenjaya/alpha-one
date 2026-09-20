# Alpha One

Alpha One is a Next.js web application built with TypeScript, Tailwind CSS, and Firebase Firestore for managing stores, items, and invoices.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone git@github.com:edwinsenjaya/alpha-one.git
   cd alpha-one
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Ensure your Firebase configuration in `src/firebase/firebaseConfig.ts` is set up with valid credentials.

4. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

---

## 🔐 Login Instructions

To log into the application dashboard:

1. Open the application at `http://localhost:3000/login` (or navigate to `/login` from the homepage).
2. Enter the authorized user credentials:
   - **Email:** `edwinsenjaya7@gmail.com`
   - **Password:** `abcD1`
3. Click **Login** to access the dashboard.

> _Note: Credentials will be updated soon._

---

## 🛠️ Maintenance & Database Seed Scripts

You can use `tsx` scripts defined in `package.json` for database setup and seeding:

| Script Command          | Description                          |
| :---------------------- | :----------------------------------- |
| `npm run create:boss`   | Create an initial admin / boss user  |
| `npm run seed:items`    | Populate database with default items |
| `npm run seed:invoices` | Seed mock invoice records            |
| `npm run reset:stores`  | Reset store records                  |
| `npm run reset:all`     | Full database reset (`--full`)       |

---

## ⚙️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database / Auth:** Firebase Firestore & Firebase Auth
- **Script Runner:** `tsx`
