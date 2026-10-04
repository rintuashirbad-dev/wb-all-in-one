import re
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, Field, field_validator

URL_PREFIXES = ("http://", "https://", "/", "#", "tel:", "mailto:")
IMAGE_PREFIXES = ("/uploads/", "/static/", "http://", "https://")


def _clean_url(v: str, prefixes: tuple[str, ...]) -> str:
    v = (v or "").strip()
    if not v:
        return ""
    if re.search(r"[\s<>\"'`]", v) or not v.lower().startswith(prefixes):
        raise ValueError("invalid URL")
    return v


def _url(v: str) -> str:
    return _clean_url(v, URL_PREFIXES)


def _image(v: str) -> str:
    return _clean_url(v, IMAGE_PREFIXES)


Url = Annotated[str, Field(default="", max_length=1000), AfterValidator(_url)]
ImageUrl = Annotated[str, Field(default="", max_length=1000), AfterValidator(_image)]
Short = Annotated[str, Field(default="", max_length=200)]
Long = Annotated[str, Field(default="", max_length=4000)]
Icon = Annotated[str, Field(default="", max_length=16)]


class SectionIn(BaseModel):
    key: str = Field(default="", pattern=r"^[a-z0-9_-]{2,30}$")
    title_bn: Short = ""
    title_en: Short = ""
    subtitle_bn: Short = ""
    subtitle_en: Short = ""
    icon: Icon = ""
    kind: Literal["cards", "videos"] = "cards"
    youtube_url: Url = ""
    sort_order: int = 0
    active: bool = True


class ItemIn(BaseModel):
    section_key: str = Field(default="", max_length=30)
    title_bn: Short = ""
    title_en: Short = ""
    desc_bn: Long = ""
    desc_en: Long = ""
    image: ImageUrl = ""
    icon: Icon = ""
    link_url: Url = ""
    link_label_bn: Short = ""
    link_label_en: Short = ""
    youtube_url: Url = ""
    badge: Literal["", "new", "hot", "trending"] = ""
    sort_order: int = 0
    active: bool = True


class SlideIn(BaseModel):
    title_bn: Short = ""
    title_en: Short = ""
    sub_bn: Long = ""
    sub_en: Long = ""
    image: ImageUrl = ""
    link_url: Url = ""
    btn_bn: Short = ""
    btn_en: Short = ""
    youtube_url: Url = ""
    position: Literal["main", "side"] = "main"
    fit: Literal["cover", "contain"] = "cover"
    sort_order: int = 0
    active: bool = True


class HelplineNumber(BaseModel):
    label_bn: Short = ""
    label_en: Short = ""
    number: str = Field(pattern=r"^[0-9+\- ]{2,20}$")


class HelplineIn(BaseModel):
    title_bn: Short = ""
    title_en: Short = ""
    desc_bn: Long = ""
    desc_en: Long = ""
    icon: Icon = ""
    image: ImageUrl = ""
    numbers: list[HelplineNumber] = Field(default_factory=list, max_length=20)
    youtube_url: Url = ""
    sort_order: int = 0


class ContactIn(BaseModel):
    name_bn: Short = ""
    name_en: Short = ""
    role_bn: Short = ""
    role_en: Short = ""
    phone: str = Field(default="", max_length=30)
    email: str = Field(default="", max_length=120)
    photo: ImageUrl = ""
    sort_order: int = 0


class ReorderIn(BaseModel):
    ids: list[int] = Field(max_length=500)


SETTING_FIELDS: dict[str, dict[str, str]] = {
    "site": {
        "name_bn": "text", "name_en": "text", "tagline_bn": "text", "tagline_en": "text", "logo": "image",
        "notice_bn": "text", "notice_en": "text", "footer_bn": "text", "footer_en": "text", "user_id_prefix": "text",
    },
    "contact": {
        "phone": "text", "whatsapp": "text", "email": "text", "address_bn": "text", "address_en": "text",
        "hours_bn": "text", "hours_en": "text", "map_url": "url", "facebook_url": "url",
        "youtube_channel": "url", "youtube_url": "url",
    },
    "donate": {
        "title_bn": "text", "title_en": "text", "desc_bn": "text", "desc_en": "text", "upi_id": "text",
        "payee_name": "text", "qr_image": "image", "bank_bn": "text", "bank_en": "text", "youtube_url": "url",
    },
    "helplines_page": {
        "title_bn": "text", "title_en": "text", "subtitle_bn": "text", "subtitle_en": "text", "youtube_url": "url",
    },
}


def clean_setting(key: str, data: dict) -> dict:
    fields = SETTING_FIELDS[key]
    out: dict[str, str] = {}
    for name, value in data.items():
        if name not in fields:
            raise ValueError(f"unknown field '{name}'")
        if not isinstance(value, str) or len(value) > 4000:
            raise ValueError(f"field '{name}' must be a string up to 4000 chars")
        kind = fields[name]
        out[name] = _image(value) if kind == "image" else _url(value) if kind == "url" else value.strip()
    return out


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalize_mobile(v: str) -> str:
    digits = re.sub(r"\D", "", v or "")
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if not re.fullmatch(r"[6-9]\d{9}", digits):
        raise ValueError("mobile must be a valid 10-digit Indian number")
    return digits


class SignupIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    mobile: str
    email: str = Field(max_length=120)
    password: str = Field(min_length=6, max_length=128)

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        return v.strip()

    @field_validator("mobile")
    @classmethod
    def _mobile(cls, v: str) -> str:
        return normalize_mobile(v)

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError("invalid email")
        return v


class ProfileIn(BaseModel):
    name: str = Field(default="", min_length=2, max_length=80)
    dob: str = Field(default="", pattern=r"^(\d{4}-\d{2}-\d{2})?$")
    father: str = Field(default="", max_length=80)
    spouse: str = Field(default="", max_length=80)
    photo: ImageUrl = ""


class PasswordResetIn(BaseModel):
    password: str = Field(min_length=6, max_length=128)


class DonorIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    mobile: str = Field(default="", max_length=20)
    amount: float = Field(gt=0, le=10_000_000)
    note: str = Field(default="", max_length=500)


class VisitsIn(BaseModel):
    visits: int = Field(ge=0)


class LoginIn(BaseModel):
    identifier: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=1, max_length=128)


class AdminLoginIn(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=256)


class FeedbackIn(BaseModel):
    kind: Literal["feedback", "suggestion", "complaint"] = "feedback"
    rating: int = Field(ge=1, le=5)
    message: str = Field(min_length=2, max_length=2000)
    name: str = Field(default="", max_length=80)
