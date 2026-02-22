# PawSwap — Full Project Description (Single Source of Truth)

## 1. Project Overview

PawSwap is a campus-exclusive marketplace for Northeastern University students to resell school and dorm supplies. The platform simplifies move-in and move-out logistics with location-aware listings, secure NUID/email authentication, and peer-to-peer exchanges.

### Benefits

- **NEU students** — Easier move-in and move-out
- **Sustainability** — Recycle and reduce waste
- **Convenience** — Easier transportation of large items
- **Community** — Supports NUIN and other programs with frequent move cycles

### Future Scope

- Expand to other Northeastern campuses
- Scale to other colleges
- Partner with off-campus housing to promote supply purchases for NEU students

---

## 2. Tech Stack & Data Flow

| Piece | Technology |
|-------|------------|
| Frontend | React, Vite, port 5173 |
| Backend API | FastAPI (Python), port 8000 |
| Database | PostgreSQL (SQLite for local dev) |
| DB access | Python, SQLAlchemy |
| Auth | JWT (python-jose), bcrypt, NUID + Northeastern email verification |
| AI (listing assist) | Vision API for item detection, LLM for description/tags/pricing |
| Payments | Escrow, PayPal |

**Flow:** Frontend (React) → FastAPI → Python DB layer → Database

---

## 3. How the Project Ties Together

- **Frontend** (`my-app/`) — React + Vite. All UI, forms, and API calls. CORS must allow `http://localhost:5173`.
- **Backend** — FastAPI serves REST endpoints. No separate Flask app.
- **Database** — Python data layer (e.g. `db/` or `database/`) that FastAPI imports and calls.

---

## 4. API Design

### Auth (Vanessa)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create user (Northeastern email, NUID, password) |
| POST | `/auth/login` | Login (email, password) → JWT |
| POST | `/auth/refresh` | Refresh JWT |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |

### Users (Vanessa + Sam)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Current user profile |
| GET | `/users/:id` | User profile + selling products + purchase history |
| PATCH | `/users/me` | Update profile |

### Products (Nicole + Sam)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List products (filters: category, tags, location, college) |
| GET | `/products/:id` | Product detail |
| POST | `/products` | Create product (auth required) |
| PATCH | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |
| POST | `/products/ai-assist` | Upload image → AI returns description, tags, suggested price |

### Search (Nicole)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Search by tags, category, location, college (15+ filter params) |

### Messages (TBD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/messages` | List conversations for current user |
| GET | `/messages/:threadId` | Messages in thread |
| POST | `/messages` | Send message |

### Bundles (TBD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bundles` | List bundles |
| GET | `/bundles/:id` | Bundle detail |
| POST | `/bundles` | Create bundle (auth required) |

### Payments (TBD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/escrow` | Create escrow for purchase |
| POST | `/payments/paypal` | PayPal payment flow |

---

## 5. Data Contracts

### Auth

**Signup request:**
```json
{
  "email": "user@northeastern.edu",
  "nuid": "001234567",
  "password": "string"
}
```

**Login request:**
```json
{
  "email": "user@northeastern.edu",
  "password": "string"
}
```

**Login response:**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "user": { "id": "uuid", "email": "string", "nuid": "string" }
}
```

### Product

**Product (list item):**
```json
{
  "id": "uuid",
  "title": "string",
  "price": 29.99,
  "image_url": "string",
  "category": "dorm|clothing|textbook|it|misc",
  "tags": ["string"],
  "location": "string",
  "college": "string"
}
```

**Product (detail):**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "price": 29.99,
  "images": ["string"],
  "category": "string",
  "tags": ["string"],
  "location": "string",
  "college": "string",
  "seller": { "id": "uuid", "email": "string" }
}
```

### AI Assist Response

```json
{
  "description": "string",
  "tags": ["string"],
  "suggested_price": 29.99
}
```

---

## 6. Database Schema

### users

| Column | Type |
|--------|------|
| id | UUID PRIMARY KEY |
| email | VARCHAR(255) UNIQUE NOT NULL |
| nuid | VARCHAR(20) UNIQUE NOT NULL |
| password_hash | VARCHAR(255) NOT NULL |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

### products

| Column | Type |
|--------|------|
| id | UUID PRIMARY KEY |
| seller_id | UUID FK → users |
| title | VARCHAR(255) |
| description | TEXT |
| price | DECIMAL(10,2) |
| category | VARCHAR(50) |
| tags | JSONB / TEXT[] |
| location | VARCHAR(255) |
| college | VARCHAR(255) |
| images | JSONB |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

### messages (simplified)

| Column | Type |
|--------|------|
| id | UUID PRIMARY KEY |
| thread_id | UUID |
| sender_id | UUID FK → users |
| recipient_id | UUID FK → users |
| body | TEXT |
| created_at | TIMESTAMP |

### bundles

| Column | Type |
|--------|------|
| id | UUID PRIMARY KEY |
| seller_id | UUID FK → users |
| title | VARCHAR(255) |
| description | TEXT |
| price | DECIMAL(10,2) |
| product_ids | JSONB (array of UUIDs) |
| created_at | TIMESTAMP |

### transactions (for payments)

| Column | Type |
|--------|------|
| id | UUID PRIMARY KEY |
| buyer_id | UUID FK → users |
| seller_id | UUID FK → users |
| product_id | UUID FK → products |
| amount | DECIMAL(10,2) |
| status | VARCHAR(50) |
| created_at | TIMESTAMP |

---

## 7. Frontend Routes & Page Requirements

| Route | Page | Data Needed | Owner |
|-------|------|-------------|-------|
| `/` | Landing | — | Rahul |
| `/login` | Login | POST /auth/login | Vanessa |
| `/signup` | Signup | POST /auth/signup | Vanessa |
| `/app` | Main marketplace | GET /products, GET /search | Rahul, Nicole |
| `/app/user/:id` | Individual user page | GET /users/:id | Sam |
| `/app/product/:id` | Product detail | GET /products/:id | Sam |
| `/app/upload` | Upload product | POST /products, POST /products/ai-assist | Sam, Nicole |
| `/app/messages` | Messages | GET /messages | TBD |
| `/app/bundles` | Bundles | GET /bundles | TBD |

**UI requirements:**

- **Main selling page:** 3–4 column grid, sidebar with category filters (Dorm, Clothing, Textbook, IT, Miscellaneous), search by tags
- **Image hover:** Hover over product image shows description
- **Categories:** Dorm (Furniture, Bedding), Clothing (NEU merch, Puffer), Textbook, IT, Miscellaneous

---

## 8. Roles and Responsibilities

### Vanessa Wang — Security & Auth

| | |
|---|------|
| **Owns** | Login, signup, password reset, user creation, NUID/email verification, JWT, route protection, CORS |
| **Needs from others** | User schema, product schema (for user's products) |
| **Delivers to others** | Auth endpoints, JWT validation middleware |
| **Can work by** | Stubbing product list; building auth against schema |

### Nicole Stekol — Search & Navigation

| | |
|---|------|
| **Owns** | Search engine, 15+ filters, tab/category switching, query logic |
| **Needs from others** | Product schema, auth (for protected routes) |
| **Delivers to others** | GET /products, GET /search with filter params |
| **Can work by** | Stubbing auth; building search against product schema |

### Samantha Loomis — User & Product Pages

| | |
|---|------|
| **Owns** | Individual user page, product detail page, purchase history, product cards, upload form |
| **Needs from others** | Auth, product API, user API |
| **Delivers to others** | Frontend components and pages |
| **Can work by** | Using mock API responses; building against data contracts |

### Rahul Mavadia — Layout & Navigation

| | |
|---|------|
| **Owns** | General layout, tabs, sidebar, main directory, responsive grid (3–4 columns) |
| **Needs from others** | Route structure, product list shape |
| **Delivers to others** | Layout components, navigation, grid structure |
| **Can work by** | Using mock product data; building layout against route contracts |

---

## 9. Environment Variables

```
# Backend
DATABASE_URL=postgresql://...
SECRET_KEY=...
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend
VITE_API_URL=http://localhost:8000

# AI (for listing assist)
OPENAI_API_KEY=...  # or equivalent
```

---

## 10. Key Metrics

- 15+ filters for products
- Categories: Dorm, Clothing, Textbook, IT, Miscellaneous
- Location-aware (building-level from campus map)
- AI: description, tags, pricing from image upload

---

## 11. Notes

- Name change possibility under consideration
- Partnership opportunities with off-campus housing providers
