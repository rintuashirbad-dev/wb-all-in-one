import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sections (
    key TEXT PRIMARY KEY,
    title_bn TEXT NOT NULL DEFAULT '',
    title_en TEXT NOT NULL DEFAULT '',
    subtitle_bn TEXT NOT NULL DEFAULT '',
    subtitle_en TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT '',
    kind TEXT NOT NULL DEFAULT 'cards',
    youtube_url TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_key TEXT NOT NULL REFERENCES sections(key) ON DELETE CASCADE ON UPDATE CASCADE,
    title_bn TEXT NOT NULL DEFAULT '',
    title_en TEXT NOT NULL DEFAULT '',
    desc_bn TEXT NOT NULL DEFAULT '',
    desc_en TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT '',
    link_url TEXT NOT NULL DEFAULT '',
    link_label_bn TEXT NOT NULL DEFAULT '',
    link_label_en TEXT NOT NULL DEFAULT '',
    youtube_url TEXT NOT NULL DEFAULT '',
    badge TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_bn TEXT NOT NULL DEFAULT '',
    title_en TEXT NOT NULL DEFAULT '',
    sub_bn TEXT NOT NULL DEFAULT '',
    sub_en TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    link_url TEXT NOT NULL DEFAULT '',
    btn_bn TEXT NOT NULL DEFAULT '',
    btn_en TEXT NOT NULL DEFAULT '',
    youtube_url TEXT NOT NULL DEFAULT '',
    position TEXT NOT NULL DEFAULT 'main',
    fit TEXT NOT NULL DEFAULT 'cover',
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS helplines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_bn TEXT NOT NULL DEFAULT '',
    title_en TEXT NOT NULL DEFAULT '',
    desc_bn TEXT NOT NULL DEFAULT '',
    desc_en TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    numbers TEXT NOT NULL DEFAULT '[]',
    youtube_url TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    dob TEXT NOT NULL DEFAULT '',
    father TEXT NOT NULL DEFAULT '',
    spouse TEXT NOT NULL DEFAULT '',
    photo TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL DEFAULT '',
    kind TEXT NOT NULL DEFAULT 'feedback',
    rating INTEGER NOT NULL DEFAULT 0,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_bn TEXT NOT NULL DEFAULT '',
    name_en TEXT NOT NULL DEFAULT '',
    role_bn TEXT NOT NULL DEFAULT '',
    role_en TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    photo TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS donors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL DEFAULT '',
    amount REAL NOT NULL DEFAULT 0,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"""

class Database:
    def __init__(self, path: Path) -> None:
        self.path = str(path)

    @contextmanager
    def conn(self):
        con = sqlite3.connect(self.path)
        con.row_factory = sqlite3.Row
        con.execute("PRAGMA foreign_keys = ON")
        try:
            yield con
            con.commit()
        finally:
            con.close()

    def init(self) -> bool:
        """Create schema. Returns True if the database was empty (needs seeding)."""
        with self.conn() as con:
            con.executescript(SCHEMA)
            con.execute("PRAGMA journal_mode = WAL")
            empty = con.execute("SELECT COUNT(*) FROM settings").fetchone()[0] == 0
        return empty

    def get_setting(self, key: str) -> dict:
        with self.conn() as con:
            row = con.execute("SELECT value FROM settings WHERE key=?", (key,)).fetchone()
        return json.loads(row["value"]) if row else {}

    def all_settings(self) -> dict:
        with self.conn() as con:
            rows = con.execute("SELECT key, value FROM settings").fetchall()
        return {r["key"]: json.loads(r["value"]) for r in rows}

    def set_setting(self, key: str, value: dict) -> None:
        with self.conn() as con:
            con.execute(
                "INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                (key, json.dumps(value, ensure_ascii=False)),
            )

    def list_rows(self, table: str, where: str = "", params: tuple = (), order: str = "sort_order, id") -> list[dict]:
        sql = f"SELECT * FROM {table}"
        if where:
            sql += f" WHERE {where}"
        sql += f" ORDER BY {order}"
        with self.conn() as con:
            return [dict(r) for r in con.execute(sql, params).fetchall()]

    def get_row(self, table: str, pk: str, value) -> dict | None:
        with self.conn() as con:
            row = con.execute(f"SELECT * FROM {table} WHERE {pk}=?", (value,)).fetchone()
        return dict(row) if row else None

    def insert(self, table: str, data: dict) -> int:
        cols = ", ".join(data)
        marks = ", ".join("?" for _ in data)
        with self.conn() as con:
            cur = con.execute(f"INSERT INTO {table} ({cols}) VALUES ({marks})", tuple(data.values()))
            return cur.lastrowid

    def update(self, table: str, pk: str, value, data: dict) -> bool:
        if not data:
            return self.get_row(table, pk, value) is not None
        sets = ", ".join(f"{k}=?" for k in data)
        with self.conn() as con:
            cur = con.execute(f"UPDATE {table} SET {sets} WHERE {pk}=?", (*data.values(), value))
            return cur.rowcount > 0

    def delete(self, table: str, pk: str, value) -> bool:
        with self.conn() as con:
            cur = con.execute(f"DELETE FROM {table} WHERE {pk}=?", (value,))
            return cur.rowcount > 0

    def count(self, table: str, where: str = "", params: tuple = ()) -> int:
        sql = f"SELECT COUNT(*) FROM {table}" + (f" WHERE {where}" if where else "")
        with self.conn() as con:
            return con.execute(sql, params).fetchone()[0]

    def reorder(self, table: str, ids: list[int]) -> None:
        with self.conn() as con:
            for order, row_id in enumerate(ids):
                con.execute(f"UPDATE {table} SET sort_order=? WHERE id=?", (order, row_id))

    def increment_visits(self) -> int:
        with self.conn() as con:
            row = con.execute("SELECT value FROM settings WHERE key='stats'").fetchone()
            stats = json.loads(row["value"]) if row else {}
            stats["visits"] = int(stats.get("visits", 0)) + 1
            con.execute(
                "INSERT INTO settings(key, value) VALUES('stats', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                (json.dumps(stats),),
            )
        return stats["visits"]
