import json

from .db import Database

YT = "https://www.youtube.com/results?search_query="
IMG = "/static/img/seed/"

SITE = {
    "name_bn": "জনসেবা হাব",
    "name_en": "JanaSeva Hub",
    "tagline_bn": "সব সরকারি ও বেসরকারি পরিষেবা — এক জায়গায়",
    "tagline_en": "Every government & private service — in one place",
    "logo": IMG + "logo.svg",
    "notice_bn": "নতুন: স্কলারশিপ আবেদনের শেষ তারিখ ৩১ অক্টোবর • আধার-মোবাইল লিঙ্ক করুন • সাইবার প্রতারণা হলে ১৯৩০ নম্বরে কল করুন",
    "notice_en": "New: Scholarship applications close on 31 October • Link Aadhaar with mobile • Dial 1930 to report cyber fraud",
    "footer_bn": "এটি একটি তথ্য সহায়ক পোর্টাল। সরকারি কাজের জন্য সর্বদা অফিসিয়াল ওয়েবসাইট যাচাই করুন।",
    "footer_en": "This is an information & assistance portal. Always verify on the official website for government work.",
    "user_id_prefix": "JS",
}

CONTACT = {
    "phone": "+91 90000 00000",
    "whatsapp": "919000000000",
    "email": "help@example.org",
    "address_bn": "১২/এ, কলেজ স্ট্রিট, কলকাতা – ৭০০০৭৩, পশ্চিমবঙ্গ",
    "address_en": "12/A, College Street, Kolkata – 700073, West Bengal",
    "hours_bn": "সোম – শনি, সকাল ১০টা – সন্ধ্যা ৭টা",
    "hours_en": "Mon – Sat, 10 AM – 7 PM",
    "map_url": "https://maps.google.com/?q=College+Street+Kolkata",
    "facebook_url": "",
    "youtube_channel": "https://www.youtube.com/",
    "youtube_url": YT + "how+to+contact+online+service+centre",
}

DONATE = {
    "title_bn": "আমাদের পাশে থাকুন",
    "title_en": "Support Our Work",
    "desc_bn": "আপনার ছোট্ট অনুদান এই পোর্টালকে বিনামূল্যে সবার জন্য চালু রাখতে সাহায্য করে। UPI বা QR কোড স্ক্যান করে অনুদান দিন।",
    "desc_en": "Your small contribution keeps this portal free for everyone. Donate by UPI or by scanning the QR code.",
    "upi_id": "demo-portal@upi",
    "payee_name": "JanaSeva Hub (Demo)",
    "qr_image": IMG + "qr-demo.svg",
    "bank_bn": "ব্যাংক: ডেমো ব্যাংক • A/C: 000000000000 • IFSC: DEMO0000001",
    "bank_en": "Bank: Demo Bank • A/C: 000000000000 • IFSC: DEMO0000001",
    "youtube_url": YT + "how+to+pay+using+upi+qr+code",
}

HELPLINES_PAGE = {
    "title_bn": "জরুরি হেল্পলাইন",
    "title_en": "Emergency Helplines",
    "subtitle_bn": "এক ট্যাপে কল করুন — ২৪×৭ সহায়তা",
    "subtitle_en": "Tap to call — 24×7 assistance",
    "youtube_url": YT + "emergency+helpline+112+india",
}

SECTIONS = [
    ("gov", "সরকারি পরিষেবা", "Government Services", "আধার, প্যান, ভোটার, পাসপোর্ট ও আরও অনেক কিছু", "Aadhaar, PAN, Voter ID, Passport and more", "🏛️", "cards", YT + "government+online+services+india"),
    ("citizen", "নাগরিক পরিষেবা", "Citizen Services", "সার্টিফিকেট, বিল পেমেন্ট ও দৈনন্দিন কাজ", "Certificates, bill payments & everyday tasks", "👥", "cards", YT + "citizen+services+online"),
    ("private", "বেসরকারি পরিষেবা", "Private Services", "ব্যাংকিং, টিকিট, রিচার্জ ও কেনাকাটা", "Banking, tickets, recharge & shopping", "💼", "cards", YT + "online+banking+tutorial"),
    ("scheme", "সরকারি প্রকল্প", "Government Schemes", "যোগ্যতা দেখুন ও অনলাইনে আবেদন করুন", "Check eligibility and apply online", "📜", "cards", YT + "government+schemes+apply+online"),
    ("news", "সর্বশেষ খবর", "Latest News", "গুরুত্বপূর্ণ আপডেট ও বিজ্ঞপ্তি", "Important updates & notifications", "📰", "cards", ""),
    ("videos", "ইউটিউব সহায়তা", "YouTube Help", "ধাপে ধাপে ভিডিও গাইড", "Step-by-step video guides", "▶️", "videos", YT + "online+form+fill+up+tutorial"),
]

ITEMS = {
    "gov": [
        ("আধার পরিষেবা", "Aadhaar Services", "আধার ডাউনলোড, ঠিকানা আপডেট ও স্ট্যাটাস চেক করুন।", "Download e-Aadhaar, update address and check status.", "https://uidai.gov.in/", "🪪", IMG + "gov.svg", "hot"),
        ("প্যান কার্ড", "PAN Card", "নতুন প্যান আবেদন, সংশোধন ও ই-প্যান ডাউনলোড।", "Apply for new PAN, corrections and e-PAN download.", "https://www.incometax.gov.in/", "💳", "", ""),
        ("ভোটার পরিষেবা", "Voter Services", "ভোটার তালিকায় নাম খুঁজুন, নতুন ভোটার কার্ডের আবেদন।", "Search your name in the electoral roll, apply for voter ID.", "https://voters.eci.gov.in/", "🗳️", "", "new"),
        ("পাসপোর্ট সেবা", "Passport Seva", "পাসপোর্টের আবেদন ও অ্যাপয়েন্টমেন্ট বুক করুন।", "Apply for a passport and book an appointment.", "https://www.passportindia.gov.in/", "🛂", "", ""),
        ("ডিজিলকার", "DigiLocker", "আপনার সব নথি ডিজিটালি নিরাপদে রাখুন।", "Keep all your documents safe, digitally.", "https://www.digilocker.gov.in/", "📂", "", ""),
        ("ড্রাইভিং লাইসেন্স", "Driving Licence", "লার্নার ও স্থায়ী লাইসেন্সের আবেদন, নবীকরণ।", "Learner & permanent licence applications and renewal.", "https://parivahan.gov.in/", "🚗", "", ""),
    ],
    "citizen": [
        ("জন্ম ও মৃত্যু সার্টিফিকেট", "Birth & Death Certificate", "অনলাইনে নিবন্ধন ও সার্টিফিকেট ডাউনলোড।", "Online registration and certificate download.", "https://crsorgi.gov.in/", "📄", IMG + "citizen.svg", ""),
        ("রেশন কার্ড", "Ration Card", "রেশন কার্ডের স্ট্যাটাস ও তথ্য দেখুন।", "Check ration card status and details.", "https://nfsa.gov.in/", "🍚", "", ""),
        ("বিদ্যুৎ বিল", "Electricity Bill", "বিদ্যুৎ বিল দেখুন ও অনলাইনে পেমেন্ট করুন।", "View and pay your electricity bill online.", "https://www.bharatbillpay.com/", "💡", "", "trending"),
        ("সাইবার অভিযোগ", "Cyber Complaint", "অনলাইন প্রতারণার অভিযোগ জানান।", "Report online fraud and cyber crime.", "https://cybercrime.gov.in/", "🛡️", "", "hot"),
    ],
    "private": [
        ("রেল টিকিট", "Train Tickets", "ট্রেনের টিকিট বুক করুন ও PNR স্ট্যাটাস দেখুন।", "Book train tickets and check PNR status.", "https://www.irctc.co.in/", "🚆", IMG + "private.svg", ""),
        ("ইপিএফ ব্যালেন্স", "EPF Balance", "পিএফ পাসবুক ও ক্লেম স্ট্যাটাস দেখুন।", "View PF passbook and claim status.", "https://www.epfindia.gov.in/", "🏦", "", ""),
        ("মোবাইল রিচার্জ", "Mobile Recharge", "প্রিপেইড রিচার্জ ও পোস্টপেইড বিল পেমেন্ট।", "Prepaid recharge and postpaid bill payments.", "https://www.bharatbillpay.com/", "📱", "", ""),
        ("চাকরির খোঁজ", "Job Search", "সরকারি ও বেসরকারি চাকরির বিজ্ঞপ্তি।", "Government and private job notifications.", "https://www.ncs.gov.in/", "🧑‍💼", "", "new"),
    ],
    "scheme": [
        ("পিএম কিষাণ", "PM-KISAN", "কৃষকদের জন্য বার্ষিক আর্থিক সহায়তা — স্ট্যাটাস দেখুন।", "Annual income support for farmers — check status.", "https://pmkisan.gov.in/", "🌾", IMG + "scheme.svg", ""),
        ("আয়ুষ্মান ভারত", "Ayushman Bharat", "পরিবার প্রতি ৫ লক্ষ টাকা পর্যন্ত স্বাস্থ্য বিমা।", "Health cover up to ₹5 lakh per family.", "https://beneficiary.nha.gov.in/", "🏥", "", "hot"),
        ("জাতীয় স্কলারশিপ", "National Scholarship", "ছাত্রছাত্রীদের জন্য বৃত্তির অনলাইন আবেদন।", "Online scholarship applications for students.", "https://scholarships.gov.in/", "🎓", "", "new"),
        ("প্রধানমন্ত্রী আবাস যোজনা", "PM Awas Yojana", "পাকা বাড়ির জন্য সহায়তা — তালিকায় নাম দেখুন।", "Housing assistance — check the beneficiary list.", "https://pmaymis.gov.in/", "🏠", "", ""),
    ],
    "news": [
        ("স্কলারশিপ পোর্টাল খোলা হয়েছে", "Scholarship portal is now open", "২০২৬–২৭ শিক্ষাবর্ষের আবেদন শুরু, শেষ তারিখ ৩১ অক্টোবর।", "Applications for 2026–27 have started; last date 31 October.", "https://scholarships.gov.in/", "📢", IMG + "news.svg", "new"),
        ("আধার বিনামূল্যে আপডেট", "Free Aadhaar document update", "অনলাইনে নথি আপডেটের সুবিধা সীমিত সময়ের জন্য বিনামূল্যে।", "Online document update is free for a limited time.", "https://myaadhaar.uidai.gov.in/", "🆕", "", ""),
        ("সাইবার সচেতনতা মাস", "Cyber awareness month", "OTP কাউকে বলবেন না — প্রতারণা হলে ১৯৩০ ডায়াল করুন।", "Never share OTPs — dial 1930 if you are defrauded.", "https://cybercrime.gov.in/", "⚠️", "", ""),
    ],
    "videos": [
        ("আধারে মোবাইল নম্বর আপডেট", "Update mobile number in Aadhaar", "ধাপে ধাপে ভিডিও নির্দেশিকা।", "Step-by-step video walkthrough.", YT + "aadhaar+mobile+number+update", "🎬", IMG + "videos.svg", ""),
        ("অনলাইনে প্যান আবেদন", "Apply for PAN online", "ঘরে বসে প্যান কার্ডের আবেদন করুন।", "Apply for a PAN card from home.", YT + "apply+pan+card+online", "🎬", "", ""),
        ("স্কলারশিপ ফর্ম পূরণ", "Fill the scholarship form", "সাধারণ ভুল এড়িয়ে সঠিকভাবে ফর্ম পূরণ।", "Fill the form correctly and avoid common mistakes.", YT + "national+scholarship+portal+apply", "🎬", "", ""),
    ],
}

SLIDES = [
    ("সব পরিষেবা, এক ঠিকানায়", "All services, one address", "সরকারি, বেসরকারি ও নাগরিক পরিষেবার সহজ গাইড — বাংলা ও ইংরেজিতে।", "A simple guide to government, private and citizen services — in Bengali & English.", IMG + "hero-1.svg", "#/section/gov", "পরিষেবা দেখুন", "Explore services"),
    ("প্রকল্পে আবেদন করুন সহজে", "Apply for schemes with ease", "যোগ্যতা, প্রয়োজনীয় নথি ও আবেদন লিঙ্ক — সব এক কার্ডে।", "Eligibility, documents and apply links — all on one card.", IMG + "hero-2.svg", "#/section/scheme", "প্রকল্প দেখুন", "View schemes"),
    ("ভিডিও দেখে শিখুন", "Learn by watching", "প্রতিটি পরিষেবার পাশে ইউটিউব হেল্প বাটন — ধাপে ধাপে নির্দেশিকা।", "A YouTube Help button beside every service — step-by-step guidance.", IMG + "hero-3.svg", "#/section/videos", "ভিডিও গাইড", "Video guides"),
]

SIDE_SLIDES = [
    ("হেল্পলাইন", "Helplines", "জরুরি নম্বর এক ট্যাপে", "Emergency numbers in one tap", IMG + "citizen.svg", "#/helplines", "কল করুন", "Call now"),
    ("সর্বশেষ খবর", "Latest News", "স্কলারশিপ ও নতুন বিজ্ঞপ্তি", "Scholarships & new notices", IMG + "news.svg", "#/section/news", "পড়ুন", "Read"),
]

CONTACTS = [
    ("রাহুল দাস", "Rahul Das", "হেল্পডেস্ক প্রধান", "Helpdesk Lead", "+91 90000 00001", "rahul@example.org"),
    ("সুমিতা ঘোষ", "Sumita Ghosh", "প্রকল্প সহায়তা", "Scheme Assistance", "+91 90000 00002", "sumita@example.org"),
]

HELPLINES = [
    ("জরুরি পরিষেবা", "Emergency", "পুলিশ, দমকল, অ্যাম্বুলেন্স — একটি নম্বর", "Police, fire, ambulance — one number", "🚨", [("জাতীয় জরুরি নম্বর", "National Emergency", "112"), ("পুলিশ", "Police", "100"), ("দমকল", "Fire", "101"), ("অ্যাম্বুলেন্স", "Ambulance", "108")]),
    ("নারী ও শিশু", "Women & Child", "নারী ও শিশু সুরক্ষা সহায়তা", "Women and child protection support", "👩‍👧", [("মহিলা হেল্পলাইন", "Women Helpline", "181"), ("চাইল্ড হেল্পলাইন", "Child Helpline", "1098")]),
    ("কৃষক", "Farmers", "কৃষি ও কৃষক সংক্রান্ত সহায়তা", "Agriculture and farmer support", "🌾", [("কিষাণ কল সেন্টার", "Kisan Call Centre", "1800-180-1551")]),
    ("প্রবীণ নাগরিক", "Senior Citizens", "প্রবীণদের জন্য সহায়তা পরিষেবা", "Support services for senior citizens", "🧓", [("এল্ডারলাইন", "Elderline", "14567")]),
    ("সাইবার ক্রাইম", "Cyber Crime", "অনলাইন আর্থিক প্রতারণা রিপোর্ট করুন", "Report online financial fraud", "🛡️", [("সাইবার হেল্পলাইন", "Cyber Helpline", "1930")]),
    ("স্বাস্থ্য ও মানসিক সুস্থতা", "Health & Wellbeing", "স্বাস্থ্য ও মানসিক স্বাস্থ্য পরামর্শ", "Health and mental health counselling", "🩺", [("টেলি-মানস", "Tele-MANAS", "14416"), ("স্বাস্থ্য হেল্পলাইন", "Health Helpline", "104")]),
    ("ছাত্রছাত্রী", "Students", "শিক্ষা ও র‍্যাগিং-বিরোধী সহায়তা", "Education and anti-ragging support", "🎓", [("অ্যান্টি-র‍্যাগিং", "Anti-Ragging", "1800-180-5522")]),
    ("রেল যাত্রী", "Rail Passengers", "রেল যাত্রা সংক্রান্ত অভিযোগ ও তথ্য", "Railway enquiries and complaints", "🚆", [("রেল মদদ", "Rail Madad", "139")]),
]


def seed(db: Database) -> None:
    db.set_setting("site", SITE)
    db.set_setting("contact", CONTACT)
    db.set_setting("donate", DONATE)
    db.set_setting("helplines_page", HELPLINES_PAGE)
    db.set_setting("stats", {"visits": 0})
    for order, (key, tbn, ten, sbn, sen, icon, kind, yt) in enumerate(SECTIONS):
        db.insert("sections", {
            "key": key, "title_bn": tbn, "title_en": ten, "subtitle_bn": sbn, "subtitle_en": sen,
            "icon": icon, "kind": kind, "youtube_url": yt, "sort_order": order,
        })
    for key, rows in ITEMS.items():
        for order, (tbn, ten, dbn, den, url, icon, image, badge) in enumerate(rows):
            is_video = key == "videos"
            db.insert("items", {
                "section_key": key, "title_bn": tbn, "title_en": ten, "desc_bn": dbn, "desc_en": den,
                "link_url": url, "icon": icon, "image": image, "badge": badge, "sort_order": order,
                "link_label_bn": "ভিডিও দেখুন" if is_video else ("বিস্তারিত" if key == "news" else "ওয়েবসাইট খুলুন"),
                "link_label_en": "Watch video" if is_video else ("Read more" if key == "news" else "Open website"),
                "youtube_url": "" if is_video or key == "news" else YT + ten.replace(" ", "+").replace("&", "") + "+online+process",
            })
    for order, (tbn, ten, sbn, sen, image, link, bbn, ben) in enumerate(SLIDES):
        db.insert("slides", {
            "title_bn": tbn, "title_en": ten, "sub_bn": sbn, "sub_en": sen, "image": image,
            "link_url": link, "btn_bn": bbn, "btn_en": ben, "sort_order": order,
        })
    for order, (tbn, ten, sbn, sen, image, link, bbn, ben) in enumerate(SIDE_SLIDES):
        db.insert("slides", {
            "title_bn": tbn, "title_en": ten, "sub_bn": sbn, "sub_en": sen, "image": image, "position": "side",
            "link_url": link, "btn_bn": bbn, "btn_en": ben, "sort_order": order,
        })
    for order, (nbn, nen, rbn, ren, phone, email) in enumerate(CONTACTS):
        db.insert("contacts", {
            "name_bn": nbn, "name_en": nen, "role_bn": rbn, "role_en": ren, "phone": phone, "email": email,
            "sort_order": order,
        })
    for order, (tbn, ten, dbn, den, icon, nums) in enumerate(HELPLINES):
        db.insert("helplines", {
            "title_bn": tbn, "title_en": ten, "desc_bn": dbn, "desc_en": den, "icon": icon, "sort_order": order,
            "numbers": json.dumps([{"label_bn": a, "label_en": b, "number": n} for a, b, n in nums], ensure_ascii=False),
            "youtube_url": "",
        })
