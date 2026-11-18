# 🚀 DevPulse | Enterprise Engineering Analytics & Task Tracker

**DevPulse** is a production-grade, multi-tenant full-stack engineering dashboard and task-management platform designed to streamline team workflows, task tracking, and engineering analytics. Built as a flagship software engineering project, it demonstrates real-world patterns including multi-tenant database scoping, secure backend middleware, relational integrity with PostgreSQL transactions, and state synchronization via URL query parameters.

---

## 🛠️ Tech Stack & Architecture

### **Frontend**
- **Framework:** Next.js (App Router, React, TypeScript)
- **Styling:** Tailwind CSS (Enterprise dark theme, neon glassmorphism gradients)
- **Notifications:** `sonner` (Real-time CRUD toast feedback)
- **Hosting:** Vercel

### **Backend**
- **Runtime & Framework:** Node.js, Express.js REST API
- **Middleware:** Custom CORS configuration and header extraction middleware (`x-workspace-id`)
- **Hosting:** Render

### **Database & Data Integrity**
- **Database:** Neon PostgreSQL (Cloud-hosted relational schema)
- **Driver:** `pg` (Node-PostgreSQL connection pooling)
- **Safety:** Transactional operations (`BEGIN`, `COMMIT`, `ROLLBACK`) for safe cascade deletions

---

## 🌟 Key Features & Architectural Highlights

### 1. Multi-Tenant Guest Session Isolation (No-Login Sandbox)
- **The Challenge:** Providing multiple evaluators, recruiters, or mobile devices with an independent testing environment without forcing them through a rigid authentication wall.
- **The Solution:** Implemented client-side workspace generation using `crypto.randomUUID()` stored in browser `localStorage`. Each HTTP request transmits this identifier via a custom `x-workspace-id` header. Express middleware intercepts this header and dynamically scopes all SQL queries (`WHERE workspace_id = $1`), ensuring complete data privacy and sandbox separation across different browsers or devices.

### 2. Reactive Cross-Column Filtering & URL Persistence
- Features interconnected UI cards for **Team Members** and **Projects**. Clicking a project or team member instantly filters the central task workflow.
- Synchronizes active filters directly to URL query parameters (`?user=X&project=Y`) via Next.js router hooks, allowing state survival across page refreshes and direct shareable link states.

### 3. Relational Data Integrity & Transactions
- Utilizes PostgreSQL foreign-key relationships across `users`, `projects`, and `tasks`.
- Leverages explicit database transactions (`BEGIN`/`COMMIT`/`ROLLBACK`) during cascade deletions (e.g., ensuring deleting a project or user cleanly purges associated task rows without leaving orphaned records).

---

## 📂 Project Structure

```text
devpulse/
├── devpulse-frontend/       # Next.js App Router (UI, state, API integration)
│   ├── app/
│   │   └── page.tsx         # Main dashboard view with URL query sync
│   └── package.json
│
└── devpulse-backend/        # Express REST API Server
    ├── server.js            # Scoped CRUD routes, middleware, and pg pool
    └── package.json
    ```
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