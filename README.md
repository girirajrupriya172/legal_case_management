# Lexora - Production-Ready Legal Case Management System

Lexora is a modern, production-ready Legal Case Management System (SaaS) built specifically for law firms, legal counsels, and attorneys. It streamlines end-to-end legal operations by centralizing client records, tracking court cases and hearings, securing document storage and inline previews, dispatching automated email notifications, and providing real-time dashboard analytics.

---

## 🚀 Features

- **Authentication & Security:** JWT access token + refresh token rotation, bcrypt password hashing, and email-based password resets via Gmail SMTP.
- **Client Management:** Comprehensive client profiles with contact history, active cases tracking, and search filtering.
- **Case File Tracking:** Automated case number generation (`LEX-YYYY-XXXX`), priority tagging, court details management, and detailed case timeline views.
- **Court Hearing Scheduling:** Chronological hearing calendars, judge assignments, courtroom details, and upcoming trial alerts.
- **Document Management System (DMS):** Secure multipart file uploads (PDFs, images, docs), inline browser document previews (`<iframe>`/`<img>`), and forced attachment downloads.
- **Global Search Engine:** Instant cross-entity wildcard search across clients, cases, and legal document attachments.
- **Real-Time Notification Hub:** In-app dropdown notification badge and background email notifications for case, hearing, and document events.
- **Executive Analytics Dashboard:** Key performance indicator (KPI) metric cards, upcoming calendar widgets, and activity feeds.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 (Single Page Application architecture)
- **Build Tool:** Vite
- **HTTP Client:** Axios (custom instance with JWT bearer interceptor & auto refresh queue)
- **Styling:** Vanilla CSS + Tailwind CSS v4 utilities with sleek dark mode aesthetics
- **Icons & Typography:** Material Symbols Outlined & Inter font

### Backend
- **Framework:** FastAPI (Python 3.10+ ASGI web service)
- **Server:** Uvicorn ASGI production server
- **Validation:** Pydantic & Pydantic-Settings
- **Authentication:** Python-Jose (JWT algorithm `HS256`) + Passlib/Bcrypt
- **Email Dispatcher:** Python `smtplib` + MIME email builder

### Database
- **Database Engine:** MySQL 8.0+
- **ORM Layer:** SQLAlchemy 2.0+ declarative models
- **Database Driver:** PyMySQL

---

## 📁 Folder Structure

```text
Legalcase_management/
├── backend/                        # FastAPI Backend Service
│   ├── app/                        # Application Source Code
│   │   ├── core/                   # Central Settings, Security & Email Utilities
│   │   │   ├── config.py           # Pydantic Settings Manager
│   │   │   ├── security.py         # Password Hashing & JWT Token Utilities
│   │   │   └── email.py            # SMTP Email Dispatcher
│   │   ├── crud/                   # Database Access Layer (CRUD Operations)
│   │   ├── models/                 # SQLAlchemy Database Schema Definitions
│   │   ├── routers/                # FastAPI Feature API Routers
│   │   ├── schemas/                # Pydantic Request/Response Validation Schemas
│   │   ├── services/               # Background Tasks & Notification Services
│   │   ├── database.py             # SQLAlchemy Engine & Session Configuration
│   │   ├── dependencies.py         # FastAPI DB & Auth Dependency Injectors
│   │   ├── main.py                 # FastAPI Application Entrypoint & CORS Config
│   │   └── seed.py                 # Initial Database Seed Generator
│   ├── uploads/                    # Physical Document Storage Directory
│   ├── .env                        # Local Environment Configuration (Ignored by Git)
│   ├── .env.example                # Environment Variable Template Blueprint
│   └── requirements.txt            # Backend Dependencies Manifest
├── frontend/                       # React + Vite Frontend Client
│   ├── src/                        # React Source Code
│   │   ├── assets/                 # SVGs and Images
│   │   ├── components/             # Reusable UI Components (Navbar, Header, Modals)
│   │   ├── pages/                  # Top-level Page Views (Dashboard, Cases, Clients, etc.)
│   │   ├── routes/                 # Protected App Router Wrapper
│   │   └── services/               # Axios API Service Wrappers
│   ├── .env                        # Local Client Environment (Ignored by Git)
│   ├── .env.example                # Client Environment Blueprint Template
│   ├── package.json                # Frontend Dependencies Manifest
│   └── vite.config.js              # Vite Build Configuration
└── README.md                       # Project Documentation
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Python:** `v3.10` or higher
- **Node.js:** `v18.0` or higher (with `npm`)
- **Database:** MySQL Server 8.0+ running on `localhost:3306`

---

### Backend Setup

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**
   Copy `.env.example` to create your local `.env` file:
   ```bash
   cp .env.example .env
   ```
   Update `DATABASE_URL` with your MySQL credentials:
   ```env
   DATABASE_URL="mysql+pymysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/legalcase_management"
   ```

5. **Database Initialization & Seeding:**
   Ensure MySQL is running and create the database schema if needed:
   ```sql
   CREATE DATABASE IF NOT EXISTS legalcase_management;
   ```
   *The database tables and initial seed data (admin account & sample records) will auto-generate on initial backend launch.*

6. **Run the Backend Server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend API will run at `http://localhost:8000`.

---

### Frontend Setup

1. **Navigate to the frontend folder:**
   ```bash
   cd ../frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Configure Frontend Environment Variables:**
   Copy `.env.example` to create `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_URL` points to your backend server:
   ```env
   VITE_API_URL=http://localhost:8000/api/v1
   ```

4. **Run the Frontend Development Server:**
   ```bash
   npm run dev
   ```
   The React client application will open at `http://localhost:5173`.

---

## 🔑 Environment Variables Overview

### Backend Environment Variables (`backend/.env`)

| Variable | Description | Default / Example Value |
| :--- | :--- | :--- |
| `PROJECT_NAME` | Name of the backend application | `"Lexora Legal Case Management System"` |
| `VERSION` | API Version | `"1.0.0"` |
| `ENVIRONMENT` | Deployment stage | `"development"` / `"production"` |
| `DEBUG` | FastAPI debug mode | `True` |
| `SECRET_KEY` | HMAC secret key for signing JWTs | `"SUPER_SECRET_KEY_FOR_JWT"` |
| `ALGORITHM` | Cryptographic algorithm | `"HS256"` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL in minutes | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL in days | `7` |
| `DATABASE_URL` | MySQL SQLAlchemy connection URL | `"mysql+pymysql://root:pass@localhost:3306/legalcase_management"` |
| `UPLOAD_DIR` | Directory path for document storage | `"uploads"` |
| `CORS_ORIGINS` | JSON list of allowed origin URLs | `'["http://localhost:5173"]'` |
| `MAIL_USERNAME` | SMTP Gmail username | `"your_gmail@gmail.com"` |
| `MAIL_PASSWORD` | SMTP 16-character App Password | `"your_app_password"` |
| `MAIL_SERVER` | SMTP host | `"smtp.gmail.com"` |
| `MAIL_PORT` | SMTP TLS port | `587` |

### Frontend Environment Variables (`frontend/.env`)

| Variable | Description | Default / Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base REST API endpoint URL | `http://localhost:8000/api/v1` |

---

## 📖 API Documentation

The backend service automatically generates interactive OpenAPI documentation:

- **Swagger UI Interactive Docs:** `http://localhost:8000/docs`
- **ReDoc Technical Schema:** `http://localhost:8000/redoc`
- **Raw OpenAPI JSON Spec:** `http://localhost:8000/api/v1/openapi.json`

---

## 📸 Screenshots Placeholder

> *Screenshots of the Lexora Legal platform:*

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        LEXORA DASHBOARD OVERVIEW                       │
│  [Total Cases: 24]   [Active Clients: 18]   [Upcoming Hearings: 5]    │
└────────────────────────────────────────────────────────────────────────┘
```

- **Dashboard:** Real-time KPI summary widgets and upcoming trial schedule.
- **Cases View:** Filterable list of legal cases with priority tags.
- **Case Detail Page:** Comprehensive matter timeline, client card, and document vault.
- **Document Vault:** Secure upload form and inline PDF/image preview modal.

---

## 🚀 Future Improvements

- **Role-Based Granular Permissions:** Custom permission scopes for Lead Attorneys, Associate Counsels, and Paralegals.
- **Automated Billing & Invoicing:** Billable time logs, invoice PDF export generation, and payment gateway integration.
- **Calendar Integrations:** Two-way sync with Google Calendar and Microsoft Outlook for hearing schedules.
- **Multi-Tenant Support:** Firm isolation for multi-branch legal organizations.

---

## 🛡️ Deployment Notes

1. **Production Web Server:** Run Uvicorn behind a Gunicorn process supervisor or Nginx reverse proxy with SSL (`https://`).
2. **Database Hardening:** Configure connection pooling and enforce TLS/SSL for MySQL production database connections.
3. **CORS Restrictions:** Restrict `CORS_ORIGINS` strictly to production frontend domains.
4. **Secret Key Management:** Generate strong 256-bit secret keys (`openssl rand -hex 32`) and inject via system secrets managers.
