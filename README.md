# Moza, Hand-Poured Candle Co.

A full-stack e-commerce site for the Moza handmade candle brand. The repo is a
monorepo containing a completely separate Express/MySQL backend API and a
vanilla HTML/CSS/JS frontend styled with a shadcn/ui-inspired design system.

```
Moza.website/
├── backend/     Express.js REST API (MySQL, JWT auth via HttpOnly cookies)
└── frontend/    Static HTML/CSS/JS storefront
```

## Backend Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your MySQL credentials and a
   strong JWT secret:
   ```bash
   cp .env.example .env
   ```

3. Create the database schema and seed the sample products (Lavender Calm,
   Vanilla Sunset, Cinnamon Spice):
   ```bash
   npm run db:init
   ```

4. Start the API server:
   ```bash
   npm start
   ```
   The API will be available at `http://localhost:5000/api`.

   For development with auto-restart on file changes:
   ```bash
   npm run dev
   ```

### API Overview

| Method | Endpoint              | Description                              | Auth |
|--------|-----------------------|-------------------------------------------|------|
| POST   | `/api/auth/register`  | Create a new account                       | No   |
| POST   | `/api/auth/login`     | Log in and receive a session cookie        | No   |
| POST   | `/api/auth/logout`    | Clear the session cookie                   | No   |
| GET    | `/api/auth/me`        | Get the currently logged-in user           | Yes  |
| GET    | `/api/products`       | List all products                          | No   |
| GET    | `/api/products/:id`   | Get a single product                       | No   |
| POST   | `/api/orders`         | Place an order (validates stock, deducts inventory transactionally) | Yes |

## Frontend Setup

The frontend is plain static HTML/CSS/JS — no build step required. Serve it
with any static file server, for example using the `live-server` npm package
or VS Code's "Live Server" extension:

```bash
cd frontend
npx live-server --port=5500
```

The frontend expects the backend API at `http://localhost:5000/api`
(configured in `frontend/js/api.js`) and the backend's `CLIENT_ORIGIN`
environment variable should match the URL the frontend is served from
(default `http://127.0.0.1:5500`) so cookies are accepted cross-origin.

### Pages

- `index.html` — Home page with hero section and product listing grid
- `product.html?id=<id>` — Product detail page with quantity selector
- `cart.html` — Shopping cart with quantity controls and order summary
- `login.html` / `register.html` — Authentication forms
- `checkout.html` — Order review, placement, and confirmation summary

## Tech Stack

- **Backend:** Express.js (ES Modules), MySQL via `mysql2/promise`, JWT auth
  in HttpOnly cookies, `bcryptjs` for password hashing.
- **Frontend:** Semantic HTML5, CSS custom properties (shadcn/ui-inspired
  design tokens), vanilla JavaScript ES modules, `localStorage`-backed cart.
