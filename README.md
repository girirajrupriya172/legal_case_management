# Lexora - Legal Case Management System

Lexora is a production-level Software-as-a-Service (SaaS) Legal Case Management System designed for law firms. It optimizes legal workflows by centralizing client information, organizing legal matters, securing document storage, tracking billable time, and generating invoices.

---

## 🚀 Tech Stack

- **Frontend:** React (JavaScript SPA) + Vite (Build Tool & Development Server)
- **Backend:** FastAPI (Python ASGI web framework for high performance REST APIs)
- **Database:** MySQL (Relational Database Service)
- **ORM:** SQLAlchemy (Object-Relational Mapping layer)
- **Authentication:** JSON Web Tokens (JWT) with Role-Based Access Control (RBAC)
- **Version Control:** Git

---

## 📁 Folder Structure

```text
Legalcase_management/
├── backend/                   # FastAPI Backend Application
│   ├── app/                   # Main application package
│   │   ├── core/              # Security config, JWT authentication, settings parser
│   │   ├── crud/              # Database CRUD functions (decoupled from controllers)
│   │   ├── models/            # SQLAlchemy database models (MySQL schema representation)
│   │   ├── routers/           # FastAPI API routers (request handlers)
│   │   ├── schemas/           # Pydantic schemas (request/response validation)
│   │   ├── database.py        # Database connection configuration (Engine, SessionLocal)
│   │   ├── config.py          # App settings validation via pydantic-settings
│   │   └── main.py            # FastAPI main entrypoint and CORS configurations
│   ├── tests/                 # Automated pytest scripts
│   ├── .env.example           # Reference environment variables for local configuration
│   └── requirements.txt       # Python dependencies list
├── frontend/                  # React + Vite Frontend Application
│   ├── src/                   # React source files
│   │   ├── assets/            # Static files (images, icons)
│   │   ├── components/        # Reusable UI component modules
│   │   ├── pages/             # Layout viewpages (Dashboard, Cases, Billing, etc.)
│   │   ├── App.jsx            # Main app router wrapper
│   │   └── main.jsx           # Mounting React to DOM
│   ├── package.json           # Frontend dependency manifest
│   └── vite.config.js         # Vite configuration settings
└── .gitignore                 # Tells git which files/folders to ignore in version tracking
```

---

## ⚙️ Setup Instructions

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Python 3.10+](https://www.python.org/downloads/)
*   [Node.js v18+](https://nodejs.org/)
*   [MySQL Server](https://dev.mysql.com/downloads/installer/)

---

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
3. Install all dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template file and set up your local variables:
   ```bash
   cp .env.example .env
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend will be running at:* `http://127.0.0.1:8000`  
   *Interactive Swagger Documentation:* `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm modules:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will be running at:* `http://localhost:5173`

---

## ✨ Features

- **Role-Based Access Control (RBAC):** Separate capabilities for Admins, Attorneys, and Paralegals.
- **Client & Matter Management:** Centralized tracking of client contacts, court matter statuses, and timelines.
- **Document Management System (DMS):** File organization tied specifically to cases, with metadata tags.
- **Task & Calendar Coordination:** Track court hearings, filing dates, and task assignments with reminders.
- **Legal Billing & Invoicing:** Track billable hours and expenses, automatically generate invoices, and log payment statuses.

---

## 🗺️ Roadmap & Timeline

- [x] **Day 1:** System architecture design, directory structures, framework initialization, Git setup.
- [ ] **Days 2–5:** Database architecture, MySQL schema, SQLAlchemy migrations, and JWT Authentication.
- [ ] **Days 6–10:** Client/Matter CRUD APIs, dashboard design, and Google Stitch UI integrations.
- [ ] **Days 11–15:** Legal Document Uploads, calendar synchronization, and tasks allocation systems.
- [ ] **Days 16–18:** Billable hours logging, automated invoice generators, and PDF exports.
- [ ] **Days 19–20:** Testing (pytest + React testing), performance optimizations, and cloud deployment prep.
