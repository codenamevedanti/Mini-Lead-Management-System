# Mini Lead Management System

A scalable full-stack Lead Management System built for managers and agents to efficiently manage customer leads. The system provides secure JWT-based authentication, role-based authorization, automated lead assignment, activity logging, and a modern frontend dashboard.

---

## 🔗 Repository Structure

```
Mini-Lead-Management-System/
├── Backend/          → Node.js + Express + PostgreSQL API
├── Frontend/         → React + Vite + Bootstrap 5 UI
└── README.md
```

---

## 🛠️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Node.js, Express.js                 |
| Database  | PostgreSQL 18                       |
| Auth      | JWT (jsonwebtoken), bcryptjs        |
| Frontend  | React 18, Vite, Bootstrap 5, Axios  |
| Routing   | React Router v6                     |
| 3rd Party | RandomUser.me API (enrichment)      |

---

## ⚙️ Environment Configuration

Create a `.env` file inside the `Backend/` folder :

```env
# Server
PORT=5000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lead_management
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT
JWT_SECRET=your_long_random_secret_key
JWT_EXPIRES_IN=7d

# Third-party Enrichment API (free, no key needed)
ENRICHMENT_API_URL=https://randomuser.me/api

# CORS
CLIENT_URL=http://localhost:5173

---

## 🗄️ Database Setup

### Prerequisites
- PostgreSQL installed and running
- psql or pgAdmin available

### Step 1 — Create the database

```bash
# Using psql
psql -U postgres -c "CREATE DATABASE lead_management;"

# OR using pgAdmin
# Right-click Databases → Create → Database → name: lead_management
```

### Step 2 — Run the migration

```bash
cd Backend
npm run migrate
```

This creates all tables, ENUMs, indexes, triggers, and seeds the assignment state row.

---

## 🚀 Setup Instructions

### Backend

```bash
# 1. Navigate to backend
cd Backend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Fill in your DB credentials and JWT secret

# 4. Run database migration
npm run migrate

# 5. Start the server
npm run dev        # Development (nodemon)
npm start          # Production
```

Backend runs on → **http://localhost:5000**

Test with:
```
GET http://localhost:5000/health
```

---

### Frontend

```bash
# 1. Navigate to frontend
cd Frontend/Frontrnd

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Frontend runs on → **http://localhost:5173**

> Make sure backend is running before starting the frontend.

---

## 📡 API Documentation

Base URL: `http://localhost:5000/api`

### Authentication

| Method | Endpoint          | Auth | Description              |
|--------|-------------------|------|--------------------------|
| POST   | `/auth/register`  | ✗    | Register a new user      |
| POST   | `/auth/login`     | ✗    | Login and receive JWT    |
| GET    | `/auth/me`        | ✅   | Get current user profile |
| POST   | `/auth/logout`    | ✅   | Logout (client-side)     |

**Register Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "secret123",
  "role": "manager"
}
```

**Login Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": "uuid", "name": "Jane", "role": "manager" }
  }
}
```

---

### Leads

| Method | Endpoint       | Roles              | Description                  |
|--------|----------------|--------------------|------------------------------|
| GET    | `/leads`       | All                | List leads (paginated)       |
| GET    | `/leads/:id`   | All                | Get single lead              |
| POST   | `/leads`       | Admin, Manager     | Create lead (auto-assigns)   |
| PUT    | `/leads/:id`   | Admin, Manager     | Update lead                  |
| DELETE | `/leads/:id`   | Admin, Manager     | Delete lead                  |

**Query Parameters for GET /leads:**

| Param      | Type   | Description                        |
|------------|--------|------------------------------------|
| `page`     | number | Page number (default: 1)           |
| `limit`    | number | Items per page (default: 10)       |
| `search`   | string | Search by name or email            |
| `status`   | string | Filter by status (new, won, etc.)  |
| `source`   | string | Filter by source (website, etc.)   |
| `sortBy`   | string | Sort field (created_at, name, etc.)|
| `sortOrder`| string | ASC or DESC                        |

**Create Lead Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1 555 000 0000",
  "source": "website",
  "status": "new",
  "notes": "Interested in enterprise plan"
}
```

---

### Users

| Method | Endpoint        | Roles           | Description       |
|--------|-----------------|-----------------|-------------------|
| GET    | `/users`        | Admin           | List all users    |
| GET    | `/users/agents` | Admin, Manager  | List all agents   |

---

### Activity Logs

| Method | Endpoint  | Roles           | Description          |
|--------|-----------|-----------------|----------------------|
| GET    | `/logs`   | Admin, Manager  | Get activity logs    |

**Query Parameters:**

| Param        | Description                  |
|--------------|------------------------------|
| `entityId`   | Filter by lead/user ID       |
| `entityType` | Filter by 'lead' or 'user'   |
| `actorId`    | Filter by user who did action|
| `page`       | Page number                  |
| `limit`      | Items per page               |

---

## 🗃️ Database Design

### Tables

**users**
- Stores all system users with hashed passwords and role enum
- Indexed on: `email`, `role`

**leads**
- Core entity. Linked to users via `assigned_to` and `created_by` foreign keys
- Indexed on: `status`, `source`, `assigned_to`, `created_at DESC`
- GIN index for full-text search on `name + email`

**activity_logs**
- Tracks all important events: lead created, updated, assigned, status changed
- `meta` column is JSONB for flexible extra data
- Indexed on: `entity_type + entity_id`, `actor_id`, `created_at DESC`

**assignment_state**
- Single-row table tracking last assigned agent for round-robin logic
- Locked with `SELECT FOR UPDATE` during assignment for concurrency safety

### ENUMs
- `user_role`: admin, manager, agent
- `lead_status`: new, contacted, qualified, proposal, negotiation, won, lost
- `lead_source`: website, referral, cold_call, email, social_media, event, other
- `activity_action`: lead_created, lead_updated, lead_assigned, status_changed, lead_deleted, user_login, user_registered

---

## 🔄 Lead Auto-Assignment Logic

When a manager creates a lead:

1. Fetch all active agents from DB
2. Count current leads assigned to each agent
3. Find the agent(s) with the **minimum** lead count (least-loaded)
4. Among tied agents, apply **round-robin** using `SELECT FOR UPDATE` on `assignment_state` table
5. Assign the lead to the selected agent

This hybrid approach ensures:
- ✅ Fair distribution (no agent overloaded)
- ✅ Concurrency-safe (DB-level lock prevents duplicate assignment)
- ✅ No Redis dependency required

---

## 🏗️ Architecture

```
Request → Rate Limiter → Auth Middleware → Role Check → Controller → Service → DB Query → Response
```

### Backend Folder Structure
```
Backend/src/
├── config/db.js           # PostgreSQL connection pool
├── db/
│   ├── migrations/        # SQL migration files
│   └── queries/           # Raw SQL query functions
├── middleware/            # auth, roleCheck, errorHandler, rateLimiter
├── routes/                # auth, leads, users, logs
├── controllers/           # thin request handlers
├── services/              # business logic
│   ├── assignment.service.js   # least-loaded + round-robin
│   └── enrichment.service.js   # RandomUser.me API
└── utils/                 # response helpers, validators
```

### Frontend Folder Structure
```
Frontend/src/
├── context/AuthContext.jsx    # JWT auth state
├── services/api.js            # Axios + API endpoints
├── components/                # Navbar, ProtectedRoute, Spinner, Pagination
└── pages/                     # Login, Dashboard, LeadList, LeadForm, LeadDetail
```

---

## 🤔 Assumptions Made

1. **Email is unique per user** — no two accounts share the same email
2. **Auto-assignment is mandatory** — every lead created by a manager is auto-assigned; manual override is only available to admins
3. **Agents cannot create leads** — only admins and managers can create/edit/delete leads
4. **JWT logout is client-side** — token is removed from localStorage; no server-side blocklist
5. **Enrichment data is supplementary** — RandomUser.me returns random data for demo purposes; in production this would be replaced with a real enrichment API like Clearbit
6. **PostgreSQL is local** — Supabase or similar can be used as a free cloud alternative

---

## ⚖️ Tradeoffs Considered

| Decision | Chosen | Alternative | Reason |
|----------|--------|-------------|--------|
| Assignment concurrency | PostgreSQL FOR UPDATE | Redis atomic counter | Avoids extra infrastructure dependency |
| JWT logout | Client-side only | Redis blocklist | Simpler; acceptable for assessment scope |
| Enrichment | Fire-and-forget async | Synchronous blocking | Keeps response time fast regardless of 3rd party latency |
| State management | React Context API | Redux / Zustand | Sufficient for this scope; less boilerplate |
| Migrations | Single SQL file | db-migrate / Flyway | Simpler for assessment; production would use a proper tool |
| Session storage | Stateless JWT | Server sessions | Horizontally scalable — any node can verify |


# AI Usage Disclosure

### AI Tools Used

**Claude (Anthropic)** — used occasionally during development.

---

### Usage

AI was used to look up syntax and generate small code snippets, similar to how a developer uses documentation or Stack Overflow. All core logic, architecture decisions, database design, and debugging were done manually.

### What Was Done Manually
- Project architecture and folder structure decisions
- Database schema design, relationships, and index selection
- Lead auto-assignment algorithm design
- JWT authentication flow and role-based access logic
- Debugging and resolving setup issues (PostgreSQL, environment config, module errors)
- API design and endpoint structure
AI was a reference tool. All engineering decisions and implementations reflect independent understanding.

## 📎 Additional Deliverables
| ER Diagram |
<img width="1348" height="934" alt="image" src="https://github.com/user-attachments/assets/e40e3854-0c9c-4146-97a4-7964755267fc" />


