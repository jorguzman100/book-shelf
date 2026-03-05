# 📚 Memphis Shelf

### Full-stack bookstore app for browsing, carting, and tracking your purchases

Memphis Shelf (The Good Reader) is a Node.js + Express web app where users can sign up, browse a seeded catalog by category, add books to a cart, and confirm purchases. It is built as a server-rendered experience with Handlebars views and a MySQL backend, with account sessions handled through Passport.

---

## ✨ Features

| | Feature | What It Does |
|---|---|---|
| 🔐 | Session-Based Auth | Sign up, log in, and keep user sessions with Passport + express-session. |
| 📚 | Category Browsing | Browse books by category and open full book details in a modal. |
| 🛒 | Cart Flow | Add books directly from browse results into a persistent user cart. |
| ✅ | Checkout Action | Convert cart items into purchases with a single confirm action. |
| 🧾 | Purchase History | View prior purchases with title, price, and formatted purchase date. |
| 🛡️ | Security Middleware | Includes CSRF protection, auth checks, rate limiting, and security headers. |

---

<p align="center">
  <img
    src="./client/public/images/book-shelf.webp"
    alt="Memphis Shelf application screenshot"
    width="520"
    style="border-radius: 12px; box-shadow: 0 10px 28px rgba(16, 24, 40, 0.18); object-position: top;"
  />
</p>

---

## 🛠️ Tech Stack

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![Handlebars](https://img.shields.io/badge/Handlebars-000000?style=flat-square&logo=handlebarsdotjs&logoColor=FF7A00)
![jQuery](https://img.shields.io/badge/jQuery-0769AD?style=flat-square&logo=jquery&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap%204-7952B3?style=flat-square&logo=bootstrap&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Passport](https://img.shields.io/badge/Passport-34E27A?style=flat-square&logo=passport&logoColor=black)

---

## 🧩 Project Snapshot

- Server entrypoint: `backend/server/server.js` (Express app + Handlebars rendering + static client assets).
- Main API groups: `/api/login`, `/api/signup`, `/api/user_data`, `/api/books`, `/api/shoppingcarts`, `/api/purchases`.
- Auth & security: Passport local strategy, session cookies, CSRF token verification, per-route auth middleware, and basic login/signup rate limiting.
- Frontend pages: `/` (signup), `/login`, `/home`, `/browse`, `/cart`.
- Startup tooling: `npm run db:setup` bootstraps DB/user; startup auto-seeds books from `backend/database/books.sql` if the catalog table is empty.

---

## 🚀 Live Demo

No public deployment yet. You can run it locally 😉.

To explore other projects:

[![Visit Portfolio](https://img.shields.io/badge/Visit%20My%20Portfolio-jorgeguzman.dev-22c55e?style=for-the-badge)](https://portfolio.jorgeguzman.dev/)


---

## 💻 Run it locally

Prerequisites:

- Node.js and npm
- MySQL server running locally
- `mysql` CLI available in your `PATH` (used by `npm run db:setup`)

```bash
git clone https://github.com/jorguzman100/book-shelf.git
cd book-shelf
npm install
cp .env.example .env
npm run dev
```

`npm run dev` runs `db:setup` first, then starts the server in watch mode.

Book seed data is loaded automatically on first startup if the `Books` table is empty.

Local URLs:

- App + API: `http://localhost:8090`
- Health check: `http://localhost:8090/healthz`

<details>
<summary>🔑 Required environment variables</summary>

```env
# .env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=good_reader_db
DB_USER=good_reader_app
DB_PASSWORD=your_app_db_password
SESSION_SECRET=your_long_random_session_secret

# Optional
PORT=8090
NODE_ENV=development
SEQUELIZE_LOGGING=false
```
</details>

---

## 🤝 Contributors

- **Jorge Guzman**  ·  [@jorguzman100](https://github.com/jorguzman100)


