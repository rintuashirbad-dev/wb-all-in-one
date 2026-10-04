import hmac
import io
import json
import sqlite3
import uuid

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError

from .config import STATIC_DIR, Settings, get_settings
from .db import Database
from .schemas import (
    SETTING_FIELDS, AdminLoginIn, ContactIn, DonorIn, FeedbackIn, HelplineIn, ItemIn, LoginIn,
    PasswordResetIn, ProfileIn, ReorderIn, SectionIn, SignupIn, SlideIn, VisitsIn, clean_setting,
    normalize_mobile,
)
from .security import LoginLimiter, create_token, decode_token, hash_password, verify_password
from .seed import seed

IMAGE_FORMATS = {"PNG": "png", "JPEG": "jpg", "WEBP": "webp", "GIF": "gif"}
BOOL_FIELDS = {"active"}
REORDERABLE = {"items", "slides", "helplines", "contacts"}


def _row_out(row: dict) -> dict:
    for f in BOOL_FIELDS & row.keys():
        row[f] = bool(row[f])
    if "numbers" in row and isinstance(row["numbers"], str):
        row["numbers"] = json.loads(row["numbers"])
    return row


def _to_db(data: dict) -> dict:
    out = {}
    for k, v in data.items():
        if k == "numbers":
            v = json.dumps(v, ensure_ascii=False)
        elif isinstance(v, bool):
            v = int(v)
        out[k] = v
    return out


def create_app(settings: Settings | None = None) -> FastAPI:
    cfg = settings or get_settings()
    db = Database(cfg.db_path)
    if db.init():
        seed(db)
    limiter = LoginLimiter()

    app = FastAPI(title="Bilingual Service Portal", docs_url="/api/docs", openapi_url="/api/openapi.json")
    app.state.db = db
    app.state.cfg = cfg

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        resp = await call_next(request)
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        return resp

    def _bearer(request: Request) -> dict | None:
        auth = request.headers.get("authorization", "")
        if not auth.lower().startswith("bearer "):
            return None
        return decode_token(cfg.jwt_secret, auth[7:].strip())

    def require_admin(request: Request) -> dict:
        claims = _bearer(request)
        if not claims or claims.get("role") != "admin":
            raise HTTPException(401, "Admin login required")
        return claims

    def optional_user(request: Request) -> dict | None:
        claims = _bearer(request)
        if not claims or claims.get("role") != "user":
            return None
        return db.get_row("users", "id", int(claims["sub"]))

    def require_user(user: dict | None = Depends(optional_user)) -> dict:
        if not user:
            raise HTTPException(401, "Login required")
        return user

    def user_public(u: dict) -> dict:
        prefix = db.get_setting("site").get("user_id_prefix") or "U"
        return {
            "id": u["id"], "code": f"{prefix}{u['id']:04d}", "name": u["name"], "mobile": u["mobile"],
            "email": u["email"], "dob": u["dob"], "father": u["father"], "spouse": u["spouse"],
            "photo": u["photo"], "created_at": u["created_at"],
        }

    async def save_image(file: UploadFile) -> str:
        raw = await file.read(cfg.max_upload_bytes + 1)
        if len(raw) > cfg.max_upload_bytes:
            raise HTTPException(413, f"File too large (max {cfg.max_upload_bytes // (1024 * 1024)} MB)")
        try:
            with Image.open(io.BytesIO(raw)) as im:
                fmt = im.format
                im.verify()
        except (UnidentifiedImageError, OSError, SyntaxError):
            raise HTTPException(415, "Only PNG, JPG, WEBP or GIF images are allowed")
        if fmt not in IMAGE_FORMATS:
            raise HTTPException(415, "Only PNG, JPG, WEBP or GIF images are allowed")
        name = f"{uuid.uuid4().hex}.{IMAGE_FORMATS[fmt]}"
        (cfg.upload_dir / name).write_bytes(raw)
        return f"/uploads/{name}"

    def client_key(request: Request, scope: str) -> str:
        fwd = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        return f"{scope}:{fwd or (request.client.host if request.client else 'unknown')}"

    # ---------- public ----------
    @app.get("/api/health")
    def health():
        return {"ok": True}

    @app.get("/api/public/site")
    def public_site():
        s = db.all_settings()
        sections = [_row_out(r) for r in db.list_rows("sections", "active=1", order="sort_order, key")]
        keys = {x["key"] for x in sections}
        items = [_row_out(r) for r in db.list_rows("items", "active=1") if r["section_key"] in keys]
        return {
            "site": s.get("site", {}), "contact": s.get("contact", {}), "donate": s.get("donate", {}),
            "helplines_page": s.get("helplines_page", {}),
            "sections": sections, "items": items,
            "slides": [_row_out(r) for r in db.list_rows("slides", "active=1")],
            "helplines": [_row_out(r) for r in db.list_rows("helplines")],
            "contacts": db.list_rows("contacts"),
            "stats": {
                "visits": int(s.get("stats", {}).get("visits", 0)),
                "users": db.count("users"), "items": len(items),
            },
        }

    @app.post("/api/public/visit")
    def visit():
        return {"visits": db.increment_visits()}

    @app.post("/api/feedback", status_code=201)
    def feedback(body: FeedbackIn, user: dict | None = Depends(optional_user)):
        fid = db.insert("feedback", {
            "user_id": user["id"] if user else None,
            "name": (user["name"] if user else body.name.strip()) or "Guest",
            "kind": body.kind, "rating": body.rating, "message": body.message.strip(),
        })
        return {"id": fid}

    @app.post("/api/donors", status_code=201)
    def donor(body: DonorIn):
        did = db.insert("donors", {
            "name": body.name.strip(), "mobile": body.mobile.strip(), "amount": body.amount, "note": body.note.strip(),
        })
        return {"id": did}

    # ---------- user auth ----------
    @app.post("/api/auth/signup", status_code=201)
    def signup(body: SignupIn):
        try:
            uid = db.insert("users", {
                "name": body.name, "mobile": body.mobile, "email": body.email,
                "password_hash": hash_password(body.password),
            })
        except sqlite3.IntegrityError:
            raise HTTPException(409, "Mobile or email already registered")
        user = db.get_row("users", "id", uid)
        return {"token": create_token(cfg.jwt_secret, str(uid), "user", 24 * 30), "user": user_public(user)}

    @app.post("/api/auth/login")
    def login(body: LoginIn, request: Request):
        key = client_key(request, "user")
        if limiter.blocked(key):
            raise HTTPException(429, "Too many attempts. Try again later.")
        ident = body.identifier.strip().lower()
        user = None
        if "@" in ident:
            user = db.get_row("users", "email", ident)
        else:
            try:
                user = db.get_row("users", "mobile", normalize_mobile(ident))
            except ValueError:
                user = None
        if not user or not verify_password(body.password, user["password_hash"]):
            limiter.fail(key)
            raise HTTPException(401, "Invalid mobile/email or password")
        limiter.reset(key)
        return {"token": create_token(cfg.jwt_secret, str(user["id"]), "user", 24 * 30), "user": user_public(user)}

    @app.get("/api/auth/me")
    def me(user: dict = Depends(require_user)):
        return user_public(user)

    @app.put("/api/auth/me")
    def update_me(body: ProfileIn, user: dict = Depends(require_user)):
        data = body.model_dump(exclude_unset=True)
        if "name" in data:
            data["name"] = data["name"].strip()
        db.update("users", "id", user["id"], data)
        return user_public(db.get_row("users", "id", user["id"]))

    @app.post("/api/auth/upload", status_code=201)
    async def user_upload(file: UploadFile = File(...), user: dict = Depends(require_user)):
        return {"url": await save_image(file)}

    # ---------- admin auth ----------
    @app.post("/api/admin/login")
    def admin_login(body: AdminLoginIn, request: Request):
        if not cfg.admin_password:
            raise HTTPException(503, "ADMIN_PASSWORD is not configured on the server")
        key = client_key(request, "admin")
        if limiter.blocked(key):
            raise HTTPException(429, "Too many attempts. Try again later.")
        ok_user = hmac.compare_digest(body.username.encode(), cfg.admin_username.encode())
        ok_pw = hmac.compare_digest(body.password.encode(), cfg.admin_password.encode())
        if not (ok_user and ok_pw):
            limiter.fail(key)
            raise HTTPException(401, "Invalid admin credentials")
        limiter.reset(key)
        return {"token": create_token(cfg.jwt_secret, cfg.admin_username, "admin", 12)}

    admin = [Depends(require_admin)]

    @app.get("/api/admin/me", dependencies=admin)
    def admin_me():
        return {"username": cfg.admin_username}

    @app.get("/api/admin/data", dependencies=admin)
    def admin_data():
        s = db.all_settings()
        return {
            "settings": {k: s.get(k, {}) for k in SETTING_FIELDS},
            "sections": [_row_out(r) for r in db.list_rows("sections", order="sort_order, key")],
            "items": [_row_out(r) for r in db.list_rows("items")],
            "slides": [_row_out(r) for r in db.list_rows("slides")],
            "helplines": [_row_out(r) for r in db.list_rows("helplines")],
            "contacts": db.list_rows("contacts"),
        }

    @app.get("/api/admin/stats", dependencies=admin)
    def admin_stats():
        donors = db.list_rows("donors", order="id")
        return {
            "visits": int(db.get_setting("stats").get("visits", 0)),
            "users": db.count("users"), "items": db.count("items"), "slides": db.count("slides"),
            "feedback": db.count("feedback"), "sections": db.count("sections"),
            "donors": len(donors), "donations": round(sum(d["amount"] for d in donors), 2),
        }

    @app.put("/api/admin/visits", dependencies=admin)
    def set_visits(body: VisitsIn):
        db.set_setting("stats", {**db.get_setting("stats"), "visits": body.visits})
        return {"visits": body.visits}

    @app.post("/api/admin/reorder/{table}", dependencies=admin)
    def reorder(table: str, body: ReorderIn):
        if table not in REORDERABLE:
            raise HTTPException(404, "Not reorderable")
        db.reorder(table, body.ids)
        return {"ok": True}

    @app.post("/api/admin/reorder-sections", dependencies=admin)
    def reorder_sections(keys: list[str]):
        for order, key in enumerate(keys):
            db.update("sections", "key", key, {"sort_order": order})
        return {"ok": True}

    @app.put("/api/admin/settings/{key}", dependencies=admin)
    def update_setting(key: str, body: dict):
        if key not in SETTING_FIELDS:
            raise HTTPException(404, "Unknown settings group")
        try:
            clean = clean_setting(key, body)
        except ValueError as e:
            raise HTTPException(422, str(e))
        merged = {**db.get_setting(key), **clean}
        db.set_setting(key, merged)
        return merged

    # sections
    @app.post("/api/admin/sections", status_code=201, dependencies=admin)
    def create_section(body: SectionIn):
        if not body.key:
            raise HTTPException(422, "key is required")
        if not (body.title_bn or body.title_en):
            raise HTTPException(422, "title is required")
        try:
            db.insert("sections", _to_db(body.model_dump()))
        except sqlite3.IntegrityError:
            raise HTTPException(409, "Section key already exists")
        return _row_out(db.get_row("sections", "key", body.key))

    @app.put("/api/admin/sections/{key}", dependencies=admin)
    def update_section(key: str, body: SectionIn):
        data = body.model_dump(exclude_unset=True)
        data.pop("key", None)
        if not db.update("sections", "key", key, _to_db(data)):
            raise HTTPException(404, "Section not found")
        return _row_out(db.get_row("sections", "key", key))

    @app.delete("/api/admin/sections/{key}", dependencies=admin)
    def delete_section(key: str):
        if not db.delete("sections", "key", key):
            raise HTTPException(404, "Section not found")
        return {"ok": True}

    # generic CRUD for items / slides / helplines
    def crud(path: str, table: str, model: type, validate=None):
        def create(body: model):
            data = body.model_dump()
            if validate:
                validate(data)
            new_id = db.insert(table, _to_db(data))
            return _row_out(db.get_row(table, "id", new_id))

        def update(row_id: int, body: model):
            data = body.model_dump(exclude_unset=True)
            if validate:
                validate(data, partial=True)
            if not db.update(table, "id", row_id, _to_db(data)):
                raise HTTPException(404, "Not found")
            return _row_out(db.get_row(table, "id", row_id))

        def remove(row_id: int):
            if not db.delete(table, "id", row_id):
                raise HTTPException(404, "Not found")
            return {"ok": True}

        app.post(f"/api/admin/{path}", status_code=201, dependencies=admin)(create)
        app.put(f"/api/admin/{path}/{{row_id}}", dependencies=admin)(update)
        app.delete(f"/api/admin/{path}/{{row_id}}", dependencies=admin)(remove)

    def validate_item(data: dict, partial: bool = False):
        if not partial or "section_key" in data:
            if not db.get_row("sections", "key", data.get("section_key", "")):
                raise HTTPException(422, "Unknown section_key")
        if not partial and not (data.get("title_bn") or data.get("title_en")):
            raise HTTPException(422, "title is required")

    crud("items", "items", ItemIn, validate_item)
    crud("slides", "slides", SlideIn)
    crud("helplines", "helplines", HelplineIn)
    crud("contacts", "contacts", ContactIn)

    # users & feedback
    @app.get("/api/admin/users", dependencies=admin)
    def list_users(q: str = ""):
        rows = db.list_rows("users", order="id DESC")
        q = q.strip().lower()
        out = [user_public(u) for u in rows]
        if q:
            out = [u for u in out if q in f"{u['code']} {u['name']} {u['mobile']} {u['email']}".lower()]
        return out

    @app.put("/api/admin/users/{user_id}/password", dependencies=admin)
    def reset_user_password(user_id: int, body: PasswordResetIn):
        if not db.update("users", "id", user_id, {"password_hash": hash_password(body.password)}):
            raise HTTPException(404, "User not found")
        return {"ok": True}

    @app.delete("/api/admin/users/{user_id}", dependencies=admin)
    def delete_user(user_id: int):
        if not db.delete("users", "id", user_id):
            raise HTTPException(404, "User not found")
        return {"ok": True}

    @app.get("/api/admin/feedback", dependencies=admin)
    def list_feedback():
        return db.list_rows("feedback", order="id DESC")

    @app.delete("/api/admin/feedback/{fid}", dependencies=admin)
    def delete_feedback(fid: int):
        if not db.delete("feedback", "id", fid):
            raise HTTPException(404, "Not found")
        return {"ok": True}

    @app.get("/api/admin/donors", dependencies=admin)
    def list_donors():
        return db.list_rows("donors", order="id DESC")

    @app.delete("/api/admin/donors/{did}", dependencies=admin)
    def delete_donor(did: int):
        if not db.delete("donors", "id", did):
            raise HTTPException(404, "Not found")
        return {"ok": True}

    @app.post("/api/admin/upload", status_code=201, dependencies=admin)
    async def upload(file: UploadFile = File(...)):
        return {"url": await save_image(file)}

    # ---------- frontend ----------
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    app.mount("/uploads", StaticFiles(directory=cfg.upload_dir), name="uploads")

    @app.get("/", include_in_schema=False)
    def index():
        return FileResponse(STATIC_DIR / "index.html", headers={"Cache-Control": "no-cache"})

    return app


app = create_app()
