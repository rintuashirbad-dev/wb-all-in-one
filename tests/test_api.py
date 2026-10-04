from conftest import ADMIN_PW, png_bytes

from app.config import Settings
from app.main import create_app
from fastapi.testclient import TestClient


def signup(client, mobile="9876543210", email="a@example.com"):
    return client.post("/api/auth/signup", json={"name": "Asha Roy", "mobile": mobile, "email": email, "password": "secret12"})


# ---------- public ----------
def test_index_and_static_served(client):
    r = client.get("/")
    assert r.status_code == 200 and "app.js" in r.text
    assert client.get("/static/js/app.js").status_code == 200
    assert r.headers["x-content-type-options"] == "nosniff"


def test_public_site_has_bilingual_seed(client):
    d = client.get("/api/public/site").json()
    assert d["site"]["name_bn"] and d["site"]["name_en"]
    keys = [s["key"] for s in d["sections"]]
    assert keys == ["gov", "citizen", "private", "scheme", "news", "videos"]
    assert all(i["title_bn"] and i["title_en"] for i in d["items"])
    assert any(i["youtube_url"] for i in d["items"])
    main = [s for s in d["slides"] if s["position"] == "main"]
    side = [s for s in d["slides"] if s["position"] == "side"]
    assert len(main) == 3 and len(side) == 2
    assert d["helplines"][0]["numbers"][0]["number"] == "112"
    assert d["contacts"] and d["donate"]["upi_id"]


def test_visit_counter_increments(client):
    a = client.post("/api/public/visit").json()["visits"]
    b = client.post("/api/public/visit").json()["visits"]
    assert b == a + 1


def test_feedback_and_donor_submission(client, admin_headers):
    assert client.post("/api/feedback", json={"kind": "complaint", "rating": 4, "message": "Good portal"}).status_code == 201
    assert client.post("/api/feedback", json={"rating": 0, "message": "x"}).status_code == 422
    assert client.post("/api/donors", json={"name": "Ravi", "amount": 101}).status_code == 201
    assert client.post("/api/donors", json={"name": "Ravi", "amount": -5}).status_code == 422
    fb = client.get("/api/admin/feedback", headers=admin_headers).json()
    assert fb[0]["kind"] == "complaint" and fb[0]["name"] == "Guest"
    donors = client.get("/api/admin/donors", headers=admin_headers).json()
    assert donors[0]["amount"] == 101
    assert client.get("/api/admin/stats", headers=admin_headers).json()["donations"] == 101


# ---------- user auth ----------
def test_signup_login_me_and_profile(client):
    r = signup(client)
    assert r.status_code == 201
    user = r.json()["user"]
    assert user["code"] == "JS0001" and "password_hash" not in user
    assert signup(client).status_code == 409
    assert signup(client, mobile="+91 98765 43211", email="b@example.com").json()["user"]["mobile"] == "9876543211"

    tok = client.post("/api/auth/login", json={"identifier": "9876543210", "password": "secret12"}).json()["token"]
    tok2 = client.post("/api/auth/login", json={"identifier": "A@example.com", "password": "secret12"}).json()["token"]
    assert tok and tok2
    h = {"Authorization": f"Bearer {tok}"}
    assert client.get("/api/auth/me", headers=h).json()["email"] == "a@example.com"
    p = client.put("/api/auth/me", headers=h, json={"dob": "1990-05-01", "father": "Bimal Roy"}).json()
    assert p["dob"] == "1990-05-01" and p["father"] == "Bimal Roy" and p["name"] == "Asha Roy"
    assert client.put("/api/auth/me", headers=h, json={"dob": "01/05/1990"}).status_code == 422
    assert client.put("/api/auth/me", headers=h, json={"photo": "javascript:alert(1)"}).status_code == 422


def test_user_photo_upload_requires_login(client):
    files = {"file": ("me.png", png_bytes(), "image/png")}
    assert client.post("/api/auth/upload", files=files).status_code == 401
    tok = signup(client).json()["token"]
    r = client.post("/api/auth/upload", files=files, headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 201 and r.json()["url"].startswith("/uploads/")


def test_login_failures(client):
    signup(client)
    assert client.post("/api/auth/login", json={"identifier": "9876543210", "password": "wrong"}).status_code == 401
    assert client.post("/api/auth/login", json={"identifier": "nobody@x.com", "password": "secret12"}).status_code == 401
    assert signup(client, mobile="12345").status_code == 422
    assert signup(client, mobile="9000000001", email="bad-email").status_code == 422


def test_user_token_cannot_access_admin(client):
    tok = signup(client).json()["token"]
    assert client.get("/api/admin/data", headers={"Authorization": f"Bearer {tok}"}).status_code == 401


# ---------- admin auth ----------
def test_admin_login_rules(client):
    assert client.get("/api/admin/data").status_code == 401
    assert client.get("/api/admin/data", headers={"Authorization": "Bearer garbage"}).status_code == 401
    assert client.post("/api/admin/login", json={"username": "admin", "password": "nope"}).status_code == 401
    assert client.post("/api/admin/login", json={"username": "admin", "password": ADMIN_PW}).status_code == 200


def test_admin_login_disabled_without_env_password(tmp_path, monkeypatch):
    monkeypatch.setenv("PORTAL_DATA_DIR", str(tmp_path / "d"))
    monkeypatch.setenv("PORTAL_UPLOAD_DIR", str(tmp_path / "u"))
    monkeypatch.setenv("ADMIN_PASSWORD", "")
    c = TestClient(create_app(Settings()))
    assert c.post("/api/admin/login", json={"username": "admin", "password": "x"}).status_code == 503


def test_admin_login_rate_limited(client):
    for _ in range(10):
        client.post("/api/admin/login", json={"username": "admin", "password": "bad"})
    assert client.post("/api/admin/login", json={"username": "admin", "password": ADMIN_PW}).status_code == 429


# ---------- hero slides ----------
def test_hero_slide_upload_create_replace_reorder_delete(client, admin_headers):
    up = client.post("/api/admin/upload", headers=admin_headers, files={"file": ("hero.png", png_bytes(), "image/png")})
    assert up.status_code == 201
    url = up.json()["url"]
    assert client.get(url).status_code == 200

    body = {"image": url, "title_bn": "নতুন স্লাইড", "title_en": "New slide", "sub_en": "Sub", "link_url": "https://example.org", "position": "main", "sort_order": 0}
    s = client.post("/api/admin/slides", headers=admin_headers, json=body).json()
    assert s["image"] == url and s["active"] is True

    pub = client.get("/api/public/site").json()["slides"]
    assert any(x["id"] == s["id"] for x in pub)

    up2 = client.post("/api/admin/upload", headers=admin_headers, files={"file": ("h2.png", png_bytes((0, 0, 255)), "image/png")}).json()["url"]
    r = client.put(f"/api/admin/slides/{s['id']}", headers=admin_headers, json={"image": up2, "position": "side", "fit": "contain"}).json()
    assert r["image"] == up2 and r["position"] == "side" and r["fit"] == "contain" and r["title_en"] == "New slide"

    ids = [x["id"] for x in client.get("/api/admin/data", headers=admin_headers).json()["slides"]]
    rev = list(reversed(ids))
    assert client.post("/api/admin/reorder/slides", headers=admin_headers, json={"ids": rev}).status_code == 200
    assert [x["id"] for x in client.get("/api/public/site").json()["slides"]] == rev

    client.put(f"/api/admin/slides/{s['id']}", headers=admin_headers, json={"active": False})
    assert all(x["id"] != s["id"] for x in client.get("/api/public/site").json()["slides"])

    assert client.delete(f"/api/admin/slides/{s['id']}", headers=admin_headers).status_code == 200
    assert client.delete(f"/api/admin/slides/{s['id']}", headers=admin_headers).status_code == 404


def test_upload_rejects_non_images_and_large_files(client, admin_headers, monkeypatch):
    bad = client.post("/api/admin/upload", headers=admin_headers, files={"file": ("x.png", b"<svg onload=alert(1)>", "image/png")})
    assert bad.status_code == 415
    assert client.post("/api/admin/upload", files={"file": ("x.png", png_bytes(), "image/png")}).status_code == 401


def test_slide_rejects_unsafe_urls(client, admin_headers):
    r = client.post("/api/admin/slides", headers=admin_headers, json={"image": "javascript:alert(1)", "title_en": "x"})
    assert r.status_code == 422
    r = client.post("/api/admin/slides", headers=admin_headers, json={"link_url": "javascript:alert(1)", "title_en": "x"})
    assert r.status_code == 422


# ---------- sections & items ----------
def test_section_crud_and_youtube(client, admin_headers):
    r = client.post("/api/admin/sections", headers=admin_headers, json={"key": "jobs", "title_bn": "চাকরি", "title_en": "Jobs", "youtube_url": "https://youtu.be/abcdefghijk"})
    assert r.status_code == 201
    assert client.post("/api/admin/sections", headers=admin_headers, json={"key": "jobs", "title_en": "Dup"}).status_code == 409
    assert client.post("/api/admin/sections", headers=admin_headers, json={"key": "Bad Key", "title_en": "x"}).status_code == 422
    u = client.put("/api/admin/sections/gov", headers=admin_headers, json={"youtube_url": "https://www.youtube.com/watch?v=abcdefghijk"}).json()
    assert u["youtube_url"].endswith("abcdefghijk") and u["title_en"] == "Government Services"
    it = client.post("/api/admin/items", headers=admin_headers, json={"section_key": "jobs", "title_bn": "রেল চাকরি", "title_en": "Rail jobs"}).json()
    assert client.delete("/api/admin/sections/jobs", headers=admin_headers).status_code == 200
    assert all(i["id"] != it["id"] for i in client.get("/api/admin/data", headers=admin_headers).json()["items"])


def test_item_crud_with_youtube_help(client, admin_headers):
    body = {"section_key": "gov", "title_bn": "পরীক্ষা", "title_en": "Test", "desc_bn": "বিবরণ", "desc_en": "Desc",
            "link_url": "https://example.org", "youtube_url": "https://youtu.be/abcdefghijk", "badge": "hot"}
    it = client.post("/api/admin/items", headers=admin_headers, json=body).json()
    assert it["youtube_url"] == "https://youtu.be/abcdefghijk"
    assert client.post("/api/admin/items", headers=admin_headers, json={**body, "section_key": "nope"}).status_code == 422
    assert client.post("/api/admin/items", headers=admin_headers, json={"section_key": "gov"}).status_code == 422
    assert client.post("/api/admin/items", headers=admin_headers, json={**body, "badge": "weird"}).status_code == 422
    up = client.put(f"/api/admin/items/{it['id']}", headers=admin_headers, json={"title_en": "Changed", "youtube_url": ""}).json()
    assert up["title_en"] == "Changed" and up["youtube_url"] == "" and up["title_bn"] == "পরীক্ষা"
    assert client.put("/api/admin/items/99999", headers=admin_headers, json={"title_en": "x"}).status_code == 404
    assert client.delete(f"/api/admin/items/{it['id']}", headers=admin_headers).status_code == 200


# ---------- helplines, contacts, settings ----------
def test_helpline_and_contact_crud(client, admin_headers):
    h = client.post("/api/admin/helplines", headers=admin_headers, json={"title_bn": "গ্যাস", "title_en": "Gas", "numbers": [{"label_en": "LPG", "number": "1906"}]}).json()
    assert h["numbers"][0]["number"] == "1906"
    assert client.post("/api/admin/helplines", headers=admin_headers, json={"title_en": "x", "numbers": [{"number": "abc"}]}).status_code == 422
    assert client.put(f"/api/admin/helplines/{h['id']}", headers=admin_headers, json={"numbers": []}).json()["numbers"] == []
    c = client.post("/api/admin/contacts", headers=admin_headers, json={"name_en": "Ana", "phone": "+91 1"}).json()
    assert c["name_en"] == "Ana"
    assert client.delete(f"/api/admin/contacts/{c['id']}", headers=admin_headers).status_code == 200


def test_settings_update_and_validation(client, admin_headers):
    r = client.put("/api/admin/settings/site", headers=admin_headers, json={"name_en": "My Portal", "logo": "/uploads/x.png"})
    assert r.status_code == 200 and r.json()["name_bn"]
    assert client.get("/api/public/site").json()["site"]["name_en"] == "My Portal"
    assert client.put("/api/admin/settings/donate", headers=admin_headers, json={"upi_id": "me@upi", "qr_image": "/uploads/qr.png"}).json()["upi_id"] == "me@upi"
    assert client.put("/api/admin/settings/contact", headers=admin_headers, json={"whatsapp": "911234567890"}).status_code == 200
    assert client.put("/api/admin/settings/site", headers=admin_headers, json={"hacker": "x"}).status_code == 422
    assert client.put("/api/admin/settings/site", headers=admin_headers, json={"logo": "javascript:1"}).status_code == 422
    assert client.put("/api/admin/settings/stats", headers=admin_headers, json={"visits": "1"}).status_code == 404
    assert client.put("/api/admin/settings/site", json={"name_en": "x"}).status_code == 401


def test_visitor_control(client, admin_headers):
    assert client.put("/api/admin/visits", headers=admin_headers, json={"visits": 500}).json()["visits"] == 500
    assert client.get("/api/public/site").json()["stats"]["visits"] == 500
    assert client.put("/api/admin/visits", headers=admin_headers, json={"visits": -1}).status_code == 422


# ---------- users management ----------
def test_admin_manage_users(client, admin_headers):
    signup(client)
    signup(client, mobile="9123456789", email="z@example.com")
    users = client.get("/api/admin/users", headers=admin_headers).json()
    assert len(users) == 2 and "password_hash" not in users[0]
    assert len(client.get("/api/admin/users?q=z@ex", headers=admin_headers).json()) == 1
    uid = users[0]["id"]
    assert client.put(f"/api/admin/users/{uid}/password", headers=admin_headers, json={"password": "newpass1"}).status_code == 200
    ident = users[0]["mobile"]
    assert client.post("/api/auth/login", json={"identifier": ident, "password": "newpass1"}).status_code == 200
    assert client.delete(f"/api/admin/users/{uid}", headers=admin_headers).status_code == 200
    assert len(client.get("/api/admin/users", headers=admin_headers).json()) == 1
    assert client.delete(f"/api/admin/users/{uid}", headers=admin_headers).status_code == 404


def test_data_persists_across_restart(tmp_path, monkeypatch):
    monkeypatch.setenv("PORTAL_DATA_DIR", str(tmp_path / "d"))
    monkeypatch.setenv("PORTAL_UPLOAD_DIR", str(tmp_path / "u"))
    monkeypatch.setenv("ADMIN_PASSWORD", "pw")
    c1 = TestClient(create_app(Settings()))
    tok = c1.post("/api/admin/login", json={"username": "admin", "password": "pw"}).json()["token"]
    c1.put("/api/admin/settings/site", headers={"Authorization": f"Bearer {tok}"}, json={"name_en": "Persisted"})
    c2 = TestClient(create_app(Settings()))
    assert c2.get("/api/public/site").json()["site"]["name_en"] == "Persisted"
    # same persisted JWT secret -> old token still valid, and no re-seed duplicates
    assert c2.get("/api/admin/me", headers={"Authorization": f"Bearer {tok}"}).status_code == 200
    assert len(c2.get("/api/public/site").json()["sections"]) == 6
