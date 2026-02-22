# PawSwap — Campus Resource Resale Platform

We are building a Northeastern University–exclusive marketplace that turns campus move-in and move-out logistics into a trusted peer-to-peer resale experience. Users sign up with their Northeastern email and NUID. Sellers upload items (dorm furniture, bedding, NEU merch, textbooks, IT gear, etc.) with photos, descriptions, and tags. The system supports location-aware listings (building-level filters from campus map), 15+ filters, and an AI feature that detects uploaded objects and auto-generates descriptions, tags, and suggested pricing. Buyers browse by category, search by tags, and message sellers to negotiate. Bundles let sellers create packages (e.g., Freshman Dorm Essential: fridge, microwave, storage). Payments flow through escrow and PayPal.

**Features:** Northeastern email + NUID authentication; location-based listings; category pages (Dorm, Clothing, Textbook, Miscellaneous); AI item detection and listing assist; bundle creation; messaging; escrow/PayPal payments; image hover descriptions; 3–4 column grid with sidebar filters.

**Vibe:** "Facebook Marketplace for NEU" — campus-focused, trusted, sustainable, peer-to-peer.

---

## How the project ties together

- **Frontend** — Built in **`my-app/`**. React (Vite), port **5173**. Routes: `/`, `/login`, `/signup`, `/app` (main marketplace), `/app/user/:id` (individual user page), `/app/product/:id`, `/app/upload`, `/app/messages`, `/app/bundles`. Calls the backend API. Backend CORS must allow `http://localhost:5173`.
- **Backend API** — **FastAPI** (Python), port **8000**. One FastAPI app serving all REST endpoints (auth, users, products, search, messages, bundles, payments).
- **Database** — **PostgreSQL** (or SQLite for dev). Access via **Python** using SQLAlchemy or similar. Flow: FastAPI → Python DB layer → Database.

**Explicit stack:**

| Piece | Technology |
|-------|------------|
| Frontend | React, Vite, port 5173 (in `my-app/`) |
| Backend API | **FastAPI** (Python), port 8000 |
| Database | **PostgreSQL** (SQLite for local dev) |
| DB access | **Python**, SQLAlchemy or async equivalent |
| Auth | JWT, bcrypt, NUID + Northeastern email verification |
| AI (listing assist) | Vision API for item detection, LLM for description/tags/pricing |
| Payments | Escrow, PayPal integration |

---

## Working without blocking each other

All **data shapes, API contracts, database schema, and page requirements** are in **`PROJECT_DESC.md`**. Use it as the single source of truth. Each role can build against those contracts and stub what others provide until they're ready.

---

## Roles at a glance

| Role | Owns | Full details |
|------|------|--------------|
| **Vanessa Wang — Security & Auth** | Login, signup, password reset, user creation, NUID/email verification, JWT, route protection | PROJECT_DESC.md |
| **Nicole Stekol — Search & Navigation** | Search engine, filters (15+), tab/category switching, query logic | PROJECT_DESC.md |
| **Samantha Loomis — User & Product Pages** | Individual user page, product detail page, purchase history, product cards | PROJECT_DESC.md |
| **Rahul Mavadia — Layout & Navigation** | General layout, tabs, sidebar, main directory, responsive grid (3–4 columns) | PROJECT_DESC.md |

---

## Full brief (single source of truth)

**Everything is in `PROJECT_DESC.md`:**

- Project overview, tech stack, data flow
- **How the project ties together** (Frontend → FastAPI → DB)
- **Working without blocking** (contracts in one doc; stub others)
- **API design** (all endpoints)
- **Data contracts** (request/response shapes for auth, products, search, messages, bundles)
- **Database schema** — tables (users, products, messages, bundles, transactions), column types
- **Frontend** — routes and data each page expects (so backend can match)
- **Roles and responsibilities** — each role: Owns, Needs from others, Delivers to others
- Environment variables, timeline, key metrics

Read **`PROJECT_DESC.md`** first before making changes.

---

## Getting Started

```bash
# Frontend
cd my-app
npm install
npm run dev
# → http://localhost:5173

# Backend (when ready)
# uvicorn main:app --reload --port 8000
```
