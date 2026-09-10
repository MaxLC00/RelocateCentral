# Allerton — Repair Progress Portal

A MERN (MongoDB, Express, React, Node.js) web application for tracking repair
progress at the Allerton apartment building. It serves **residents**,
**stakeholders**, and **relocation teams**.

This first phase delivers the public-facing site and the **Resident Portal**:

- **Announcement Board** — building-wide updates (repairs, relocation, urgent notices), filterable by category, with pinned items first.
- **Contact Form** — residents send questions/concerns to the property team.
- **Unit Status Check** — enter a unit number to see repair stage, progress, estimated completion, and a timeline of updates.

> Stakeholder dashboards and relocation-team tools for *updating* progress are
> planned for a later phase. The data models and API already support them.

---

## Project structure

```
AllertonInfo/
├── package.json          # root scripts (run both apps together)
├── server/               # Express + Mongoose API
│   ├── server.js
│   ├── config/db.js
│   ├── models/           # Announcement, Unit, Contact
│   ├── controllers/
│   ├── routes/
│   └── seed.js           # sample announcements + units
└── client/               # React (Vite) front end
    └── src/
        ├── components/   # Navbar, Footer, AnnouncementBoard, StatusChecker, ContactForm
        └── pages/        # Home, ResidentPortal, Announcements, StatusCheck, Contact
```

---

## Prerequisites

- **Node.js 18+** (tested on Node 20)
- **MongoDB** — either:
  - a local install running on `mongodb://127.0.0.1:27017`, or
  - a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (set its
    connection string in `server/.env`).

---

## Setup

From the project root:

```bash
# 1. Install dependencies for root, server, and client
npm run install:all

# 2. Configure the server environment
#    server/.env already exists with sensible local defaults.
#    Edit MONGO_URI if you use MongoDB Atlas.

# 3. Load sample data (announcements + units)
npm run seed
```

---

## Running in development

Start the API and the React app together:

```bash
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:5000/api

The Vite dev server proxies `/api/*` to the Express server, so no extra CORS
configuration is needed during development.

You can also run them separately:

```bash
npm run server   # Express API with nodemon
npm run client   # Vite dev server
```

### Try it out

After seeding, check these unit numbers on the **Unit Status** page:
`1A` (completed), `3C` (in progress), `5B` (scheduled), `6D` (not started).

---

## API reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint                  | Description                                  |
| ------ | ------------------------- | -------------------------------------------- |
| GET    | `/health`                 | Service health check                         |
| GET    | `/announcements`          | List announcements (`?category=` to filter)  |
| GET    | `/announcements/:id`      | Get a single announcement                    |
| POST   | `/announcements`          | Create an announcement                       |
| GET    | `/units`                  | List all units (overview)                    |
| GET    | `/units/export`           | Download all units as a CSV (signed-in only) |
| GET    | `/units/:unitNumber`      | Get status for one unit (e.g. `/units/3C`)   |
| POST   | `/contacts`               | Submit a contact message                     |
| GET    | `/contacts`               | List submitted messages (management view)    |
| GET    | `/files`                  | List uploaded files (signed-in only)         |
| POST   | `/files`                  | Upload a JPEG/PDF/Excel file (Admin/Member)  |
| GET    | `/files/:id`              | Download a file (signed-in only)             |
| DELETE | `/files/:id`              | Delete a file (Admin/Member)                 |

---

## Environment variables

**`server/.env`**

| Variable        | Default                                  | Description                          |
| --------------- | ---------------------------------------- | ------------------------------------ |
| `PORT`          | `5000`                                   | API server port                     |
| `MONGO_URI`     | `mongodb://127.0.0.1:27017/allerton`     | MongoDB connection string           |
| `CLIENT_ORIGIN` | `http://localhost:5173`                  | Allowed CORS origin(s), comma-sep.  |

**`client/.env`** (optional)

| Variable            | Default            | Description                                        |
| ------------------- | ------------------ | -------------------------------------------------- |
| `VITE_API_BASE_URL` | _(empty)_          | API origin for production builds. Empty uses proxy.|

---

## User accounts & roles

The dashboard supports multiple logins with three roles:

| Action                          | Admin | Member | 3rd Party |
| ------------------------------- | :---: | :----: | :-------: |
| Post announcements              |   ✓   |   ✓    |     ✓     |
| Delete announcements            |   ✓   |   ✗    |     ✗     |
| View & update unit status/details |  ✓   |   ✓    |     ✓     |
| Download unit status spreadsheet  |  ✓   |   ✓    |     ✓     |
| View resident contact messages  |   ✓   |   ✓    |     ✗     |
| Update contact message status   |   ✓   |   ✓    |     ✗     |
| Upload / delete shared files     |  ✓   |   ✓    |     ✗     |
| Download shared files            |  ✓   |   ✓    |     ✓     |
| Manage users (add/remove)       |   ✓   |   ✗    |     ✗     |

Users are stored in MongoDB (passwords are bcrypt-hashed). The original
`TEAM_USERNAME` / `TEAM_PASSWORD_HASH` env credential still works and always acts
as an **Admin** — a bootstrap login so you can never lock yourself out.

### Adding users in bulk (seed script)

1. Copy `server/users.example.json` to `server/users.json` and fill in your users.
   This file is gitignored because it holds plaintext passwords.

```json
[
  { "username": "jsmith",  "password": "TempPass123!", "role": "Admin",     "displayName": "Jane Smith" },
  { "username": "mgarcia", "password": "TempPass456!", "role": "Member",    "displayName": "Miguel Garcia" },
  { "username": "acme",    "password": "TempPass789!", "role": "3rd Party", "displayName": "Acme Contracting" }
]
```

2. Point `server/.env`'s `MONGO_URI` at the target database (use the **production
   Atlas URI** to seed the live site), then run:

```bash
npm run seed:users
```

The script upserts by username, so it's safe to re-run: existing users are updated
(password/role reset), new users are created. It never deletes anyone.

### Seeding on Render (via Shell)

Because `server/users.json` is gitignored, it isn't deployed. Instead, pass the
list through an environment variable:

1. In the Render dashboard for the service, add an env var
   `SEED_USERS_JSON` whose value is the JSON array of users (same shape as above).
2. Open the service **Shell** and run:

```bash
npm run seed:users
```

3. **Delete the `SEED_USERS_JSON` env var** afterward so plaintext passwords don't
   linger in the service config.

The running service already has `MONGO_URI` and `JWT_SECRET` in its environment, so
no extra config is needed.

## Bulk-importing unit data from a spreadsheet

`server/importUnits.js` reads the Return & Lease-Up planning spreadsheet and
upserts unit records by unit number. It maps these columns:

| Spreadsheet column       | Unit field                  |
| ------------------------ | --------------------------- |
| Unit #                   | `unitNumber`                |
| Resident Name            | `residentName`              |
| Temp Destination         | `temporaryHousingLocation`  |
| Belongings Location + Storage or Unit # | `storageLocation` (joined) |
| Notes / Current Status   | `notes`                     |
| Updated Delivery Date    | `moveInDate`                |

It never touches `group`, `status`, `moveOutDate`, or the update timeline, so
existing phasing/status data is preserved.

```bash
# Preview what will change (writes nothing):
npm run import:units

# Apply it:
npm run import:units -- --commit

# Options:
#   --file "path/to/file.xlsx"   (default: the 8/26 planning file in the repo root)
#   --sheet "Sheet Name"          (default: "Rent Roll New Phasing")
```

Point `server/.env`'s `MONGO_URI` at the target database before running with
`--commit`. It's an upsert, so re-running is safe.

## Adding users after launch

Any **Admin** can also add or remove users from the **Users** tab in the dashboard
without a redeploy or script.

---

## Building for production

```bash
npm --prefix client run build   # outputs client/dist
npm --prefix server start       # serve the API
```

Serve `client/dist` from any static host and point `VITE_API_BASE_URL` at the
deployed API.

---

## Roadmap

- Authentication & roles (resident / stakeholder / relocation / admin)
- Stakeholder dashboard with building-wide progress
- Relocation-team tools to update unit status and post announcements
- Email notifications for contact submissions and status changes
