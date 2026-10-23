# Rahmat-e-Kainat Seerah Quiz

Website for the Al-Kitab International Academy Seerah Quiz Competition 2026–27.

- `frontend` — React and Tailwind CSS
- `backend` — Node.js and Express

## Run locally

Install Node.js 20 or newer. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI` to your MongoDB Atlas connection string. For a MongoDB running on this computer, use `mongodb://127.0.0.1:27017/alkitab-quiz`.

```bash
cd backend
npm install
npm run dev
```

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Academy office

Open http://localhost:5173/admin

- Username: `admin`
- Password: `AlKitab@2026`

Change this password before the site is published. From the office panel you can accept or reject registrations, change that decision later, delete a candidate, issue roll numbers, set admit-card venues, publish results, download Excel, and edit prizes, dates, syllabus, announcements, bank details, and contact information.

Candidate CNIC, address, phone, and photograph are not shown on the public pages. An admit card opens only when the registration number and mobile number match, and only after the registration is accepted.

A person can register only once. CNIC and B-Form are one field. The same number, mobile, or email is rejected on a second attempt.

The separate admin app should be built from `ADMIN_FRONTEND_README.md`. Do not add that admin UI inside `frontend`.

## Deploy

The database is MongoDB. Registrations, messages, site text, and payment/photo files are stored there.

- **Database:** MongoDB Atlas. Put the connection string in `MONGODB_URI`.
- **API:** Render or Railway. Set the service root to `backend`, the start command to `npm start`, and add `MONGODB_URI`, `MONGODB_DB`, and `CORS_ORIGINS` as environment variables. Do not rely on the server disk for photos or receipts.
- **Public website and admin website:** two Cloudflare Pages projects. Point both at this API.

Passport photos and receipts are saved in the MongoDB `files` collection, so a host restart does not delete them.
