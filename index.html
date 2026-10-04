# Bilingual Service Portal (Bengali + English)

A bilingual (বাংলা / English) "all-in-one" service portal: a glassy 3D single-page frontend (vanilla JS/HTML/CSS) served by a **FastAPI + SQLite** backend. The admin panel controls everything on the site. The site name defaults to **JanaSeva Hub / জনসেবা হাব**, which is a placeholder you can change in the admin panel.

## Features
**Public site**
- **Hero:** a main image slider with crossfade, mouse parallax, 3D tilt, auto-slide every 5 s with a progress bar, dots, prev/next arrows, swipe and keyboard ← →. Clicking an image opens its link. A **side panel** shows the current slide's title, subtitle, link and YouTube help, and **side promo slides** appear below it.
- **Sections:** Government, Citizen, Private, Schemes, Latest News and YouTube Help (video cards), plus any new sections the admin creates. Each card has a bn/en title and description, an image (or an emoji tile), a badge (New/Hot/Trending), a main link button and a small red **▶ Help** button. That button opens the item's YouTube video in a modal player, or in a new tab if it isn't an embeddable video URL. Each section also has its own YouTube help button.
- Helplines (tap-to-call), Donate (QR + UPI ID with copy, `upi://` pay button, bank details, how-to video, donor record form) and Contact (phone, WhatsApp, email, address/map, team members with photos).
- Global search plus per-section search, a "Hot & Trending" strip, a news preview, animated stats (visitors/services/members) and a feedback/complaint form with star ratings.
- Language toggle covering every label and all content, light/dark theme, a live date/time clock, a moving "Important" notice ticker, a floating WhatsApp button and a fully responsive layout with a mobile drawer menu.
- User signup and login (name, mobile, email, password; login with mobile **or** email). Users get an ID such as `JS0001`, and the profile has a photo, DOB, father's and spouse's names and a completion meter.

**Admin panel** (⚙ in the header or footer). It has full control, with a bilingual UI:
- Dashboard: counts, plus a visitor counter control (±1, ±10, set exact).
- **Hero slides:** upload, replace and delete images; bn/en title, subtitle and button text; link; YouTube help; *main slider* vs *side promo*; cover/contain fit; show/hide; reorder with ▲▼. Changes go live immediately.
- Sections: create, edit and delete, set icon, type (cards/videos), bn/en titles and **section YouTube help URL**.
- Items: create, edit and delete in every section, filter by section, upload images, set badge, **per-item YouTube help URL** and reorder.
- Helplines (multiple numbers each, plus page title and YouTube link), contact people (with photos), Site & Branding (name, tagline, logo, ticker notice, footer, user-ID prefix), contact info, Donate (UPI, QR image, bank, video).
- Users (search, reset password, delete), feedback (view/delete), donors (list, total, delete).

## Project layout
```
portal_site/
├── app/
│   ├── main.py       # FastAPI app factory, all routes, static + uploads mounts
│   ├── db.py         # SQLite schema + tiny data-access helpers
│   ├── schemas.py    # Pydantic models + URL/image validation
│   ├── security.py   # PBKDF2 password hashing, JWT, login rate limiter
│   ├── seed.py       # bilingual demo content (seeded on first run)
│   └── config.py     # env / .env settings
├── static/
│   ├── index.html
│   ├── css/style.css
│   ├── js/i18n.js    # UI strings (bn/en)
│   ├── js/app.js     # public SPA (router, hero, cards, auth, profile…)
│   ├── js/admin.js   # admin panel
│   └── img/seed/     # original SVG artwork for the demo content
├── tests/            # pytest API tests
├── deploy/           # nginx.conf + systemd unit
├── tools/make_seed_images.py
├── data/             # SQLite DB + generated JWT secret (runtime)
├── uploads/          # uploaded images (runtime)
├── requirements.txt / requirements-dev.txt / .env.example / run.sh
```

## Run locally
```bash
cd portal_site
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then edit: set ADMIN_PASSWORD (and JWT_SECRET)
uvicorn app.main:app --reload --port 8000
# open http://localhost:8000  → ⚙ Admin → username "admin" + your ADMIN_PASSWORD
```
The database (`data/portal.db`) is created and seeded with demo content on first start. To reset the demo, stop the server and delete `data/portal.db*`.

### Configuration (environment or `.env`)
| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | **Required** for admin login. If it's empty, admin login is disabled (HTTP 503). |
| `ADMIN_USERNAME` | Default `admin`. |
| `JWT_SECRET` | Token signing key. If unset, a random one is generated once and stored in `data/.jwt_secret` (chmod 600). |
| `PORTAL_DATA_DIR` / `PORTAL_UPLOAD_DIR` | Where the DB and uploads live (defaults `./data`, `./uploads`). |
| `MAX_UPLOAD_MB` | Upload size limit (default 5). |

No secrets are hardcoded.

## Tests
```bash
pip install -r requirements-dev.txt
python -m pytest tests -q
```
The tests cover public data, visits, feedback/donors, user signup/login/profile/photo upload, admin auth (env password, rate limit, role separation), hero slide upload/create/replace/reorder/hide/delete, upload validation, URL-injection rejection, section/item/helpline/contact CRUD, settings, visitor control, user management and persistence across restarts.

## Deploy on a VPS (Ubuntu, uvicorn + nginx)
```bash
# 1. system packages
sudo apt update && sudo apt install -y python3-venv nginx
sudo useradd --system --home /opt/portal_site --shell /usr/sbin/nologin portal

# 2. code
sudo mkdir -p /opt/portal_site && sudo unzip portal_site.zip -d /opt/   # or git clone / rsync
cd /opt/portal_site
sudo python3 -m venv .venv && sudo .venv/bin/pip install -r requirements.txt

# 3. secrets
sudo cp .env.example .env
sudo sed -i "s/^ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$(openssl rand -base64 18)/" .env
sudo sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$(openssl rand -hex 32)/" .env
sudo grep ADMIN_PASSWORD .env          # note your admin password
sudo chown -R portal:portal /opt/portal_site && sudo chmod 600 .env

# 4. systemd service
sudo cp deploy/portal.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now portal
sudo systemctl status portal           # app now listens on 127.0.0.1:8000

# 5. nginx reverse proxy (edit server_name first)
sudo cp deploy/nginx.conf /etc/nginx/sites-available/portal
sudo ln -s /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. HTTPS (recommended)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```
**Backups:** copy `data/portal.db` and the `uploads/` folder, for example with a nightly `sqlite3 data/portal.db ".backup backup.db"` cron job.
**Updates:** replace the code (keep `data/`, `uploads/` and `.env`), then run `sudo systemctl restart portal`.

## API overview
- Public: `GET /api/public/site`, `POST /api/public/visit`, `POST /api/feedback`, `POST /api/donors`
- Users: `POST /api/auth/signup`, `POST /api/auth/login`, `GET|PUT /api/auth/me`, `POST /api/auth/upload`
- Admin (Bearer JWT): `POST /api/admin/login`, `GET /api/admin/data`, `GET /api/admin/stats`, `PUT /api/admin/visits`, `PUT /api/admin/settings/{site|contact|donate|helplines_page}`, CRUD `/api/admin/{sections|items|slides|helplines|contacts}`, `POST /api/admin/reorder/{items|slides|helplines|contacts}`, `POST /api/admin/upload`, users/feedback/donors management.
- Interactive docs: `/api/docs`.

## Security notes
- Passwords are hashed with PBKDF2-SHA256 (260k rounds). Admin and user JWTs have separate roles.
- Login endpoints are rate-limited (10 failures per 10 min per IP).
- Uploads are verified as real PNG/JPEG/WEBP/GIF images with Pillow (SVG/HTML rejected), size-limited and stored under random names.
- All links and images are validated server-side (`javascript:` and similar schemes are rejected), and all content is HTML-escaped on render.
- Headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
