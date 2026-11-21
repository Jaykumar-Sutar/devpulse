# 🚀 DevPulse | Enterprise Engineering Analytics & Task Tracker

**DevPulse** is a multi-tenant full-stack engineering dashboard and task-management platform built to streamline team workflows, task tracking, and engineering analytics. It demonstrates multi-tenant workspace scoping, role-based access control (`requireAdmin`), relational integrity with PostgreSQL transactions, URL query filter persistence, and automated unit testing.

---

## 🛠️ Tech Stack & Architecture

### **Frontend**
- **Framework:** Next.js (App Router, React, TypeScript)
- **Styling:** Tailwind CSS (Enterprise dark theme, neon glassmorphism gradients)
- **Notifications:** `sonner` (Real-time CRUD toast feedback)
- **Hosting:** Vercel

### **Backend**
- **Runtime & Framework:** Node.js, Express.js REST API
- **Middleware & Security:** CORS configuration, workspace header extraction (`x-workspace-id`), and `requireAdmin` role guard (`x-user-role`)
- **Testing:** Node.js built-in test runner (`node --test` via `npm test`)
- **Hosting:** Render

### **Database & Data Integrity**
- **Database:** Neon PostgreSQL (Cloud-hosted relational schema)
- **Driver:** `pg` (Node-PostgreSQL connection pooling)
- **Safety:** Transactional operations (`BEGIN`, `COMMIT`, `ROLLBACK`) for safe cascade deletions

---

## 🌟 Key Features & Architectural Highlights

### 1. Multi-Tenant Guest Session Isolation (No-Login Sandbox)
- **The Challenge:** Providing evaluators, recruiters, or different devices with independent testing sandboxes without requiring a full login flow.
- **The Solution:** Generates a workspace identifier stored in browser `localStorage` and sends it on requests via the `x-workspace-id` header. Express middleware resolves the workspace ID (falling back to `default-workspace` when absent) and scopes queries by `workspace_id`.

### 2. Role-Based Access Control (`requireAdmin`) & Unit Tests
- Protects destructive `DELETE` routes on the backend by checking `x-user-role` and returning `403` when the role is not `'admin'`, paired with UI role guards.
- Includes unit tests in `devpulse-backend/test/rbac.test.js` covering allowed admin requests, non-admin blocks, missing/empty/cased role edge cases, and workspace ID fallback behavior.

### 3. Reactive Cross-Column Filtering & URL Persistence
- Clicking a team member or project filters tasks dynamically and syncs active filters to URL query parameters so selections persist across refreshes.

### 4. Relational Data Integrity & Transactions
- Uses PostgreSQL relationships across `users`, `projects`, and `tasks` with explicit `BEGIN`/`COMMIT`/`ROLLBACK` transactions when deleting parent records and associated tasks.

---

## 📂 Project Structure

text
devpulse/
├── devpulse-frontend/       # Next.js App Router (UI, state, API integration)
│   ├── app/
│   │   └── page.tsx         # Main dashboard view with URL query sync
│   └── package.json
│
└── devpulse-backend/        # Express REST API Server
    ├── server.js            # Scoped CRUD routes, RBAC middleware, and pg pool
    ├── package.json         # Includes "test": "node --test"
    └── test/
        └── rbac.test.js     # Unit and edge-case tests for RBAC & workspace header
---

## 🌐 Live Production Links

- **Frontend Dashboard (Vercel):** [View Live App](https://devpulse-frontend-nu.vercel.app)
- **Backend API (Render):** [API Root Status](https://devpulse-5fvi.onrender.com)

---

## ⚙️ Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Jaykumar-Sutar/devpulse.git
   cd devpulse

1.Run the Backend:

Bash
cd devpulse-backend
npm install
npm start

2.Run the Frontend:

Bash
cd devpulse-frontend
npm install
npm run dev
