# -*- coding: utf-8 -*-
"""Generate Trax portfolio / Play Console store screenshots (demo data)."""
from __future__ import annotations

import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path("portfolio-screenshots")
PHONE = ROOT / "phone"
TABLET = ROOT / "tablet"
for p in (ROOT, PHONE, TABLET):
    p.mkdir(parents=True, exist_ok=True)

# Brand
BG_DARK = (12, 16, 24)
BG_CARD = (22, 30, 42)
BG_ELEV = (28, 38, 54)
TEAL = (41, 184, 166)
TEAL_DIM = (28, 120, 110)
TEAL_SOFT = (41, 184, 166, 40)
WHITE = (255, 255, 255)
MUTED = (148, 163, 184)
GREEN = (52, 211, 153)
AMBER = (251, 191, 36)
RED = (248, 113, 113)
BLUE = (96, 165, 250)
LINE = (40, 52, 72)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibri.ttf",
    ]
    if bold:
        candidates = [
            r"C:\Windows\Fonts\segoeuib.ttf",
            r"C:\Windows\Fonts\arialbd.ttf",
            r"C:\Windows\Fonts\calibrib.ttf",
        ] + candidates
    for c in candidates:
        if os.path.exists(c):
            try:
                return ImageFont.truetype(c, size)
            except OSError:
                pass
    return ImageFont.load_default()


def rr(draw: ImageDraw.ImageDraw, box, r: int, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def gradient_bg(w: int, h: int) -> Image.Image:
    img = Image.new("RGB", (w, h), BG_DARK)
    px = img.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        # deep navy -> slightly teal bottom
        r = int(10 + t * 8)
        g = int(14 + t * 22)
        b = int(22 + t * 28)
        for x in range(w):
            # subtle vignette
            cx, cy = w / 2, h / 2
            d = math.hypot(x - cx, y - cy) / math.hypot(cx, cy)
            f = 1 - 0.18 * d * d
            px[x, y] = (int(r * f), int(g * f), int(b * f))
    # soft teal glow top-right
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((w * 0.35, -h * 0.15, w * 1.15, h * 0.45), fill=(41, 184, 166, 35))
    gd.ellipse((-w * 0.3, h * 0.55, w * 0.45, h * 1.15), fill=(41, 120, 200, 28))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    return img


def status_bar(draw, w, y0=0, dark=True):
    c = WHITE if dark else (15, 23, 42)
    f = font(13, True)
    draw.text((22, y0 + 10), "9:41", fill=c, font=f)
    # signal / battery simple
    bx = w - 78
    draw.rounded_rectangle((bx, y0 + 14, bx + 22, y0 + 24), 3, outline=c, width=1)
    draw.rectangle((bx + 22, y0 + 17, bx + 25, y0 + 21), fill=c)
    draw.rounded_rectangle((bx + 2, y0 + 16, bx + 16, y0 + 22), 2, fill=TEAL)
    for i, h in enumerate((6, 9, 12, 15)):
        x = w - 100 - i * 6
        draw.rectangle((x, y0 + 26 - h, x + 3, y0 + 26), fill=c)


def draw_nav_icon(draw, kind, cx, cy, col):
    if kind == "home":
        draw.polygon(
            [
                (cx, cy - 9),
                (cx + 10, cy + 1),
                (cx + 6, cy + 1),
                (cx + 6, cy + 10),
                (cx - 6, cy + 10),
                (cx - 6, cy + 1),
                (cx - 10, cy + 1),
            ],
            fill=col,
        )
    elif kind == "check":
        draw.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), outline=col, width=2)
        draw.ellipse((cx - 4, cy - 4, cx + 4, cy + 4), fill=col)
    elif kind == "map":
        draw.polygon(
            [(cx, cy - 11), (cx + 9, cy + 2), (cx, cy + 11), (cx - 9, cy + 2)],
            outline=col,
            width=2,
        )
        draw.ellipse((cx - 3, cy - 2, cx + 3, cy + 4), fill=col)
    elif kind == "list":
        for dy in (-8, -1, 6):
            draw.rounded_rectangle((cx - 10, cy + dy, cx + 10, cy + dy + 4), 2, fill=col)
    else:
        for dx in (-8, 0, 8):
            draw.ellipse((cx + dx - 2, cy - 2, cx + dx + 2, cy + 2), fill=col)


def bottom_nav(draw, w, h, active=0):
    bar_h = 72
    y = h - bar_h
    rr(draw, (0, y, w, h), 0, fill=(16, 22, 34))
    draw.line((0, y, w, y), fill=LINE, width=1)
    items = [
        ("Home", "home"),
        ("Check-in", "check"),
        ("Map", "map"),
        ("Attendance", "list"),
        ("More", "more"),
    ]
    slot = w / len(items)
    for i, (label, kind) in enumerate(items):
        cx = slot * i + slot / 2
        col = TEAL if i == active else MUTED
        draw_nav_icon(draw, kind, cx, y + 22, col)
        tw = draw.textlength(label, font=font(11))
        draw.text((cx - tw / 2, y + 42), label, fill=col, font=font(11))


def card(draw, box, r=18):
    rr(draw, box, r, fill=BG_CARD, outline=LINE, width=1)


def pill(draw, x, y, text, bg, fg=WHITE):
    f = font(12, True)
    tw = draw.textlength(text, font=f)
    rr(draw, (x, y, x + tw + 18, y + 24), 12, fill=bg)
    draw.text((x + 9, y + 4), text, fill=fg, font=f)
    return tw + 18


def header(draw, w, title, subtitle=None, y=54):
    draw.text((22, y), title, fill=WHITE, font=font(26, True))
    if subtitle:
        draw.text((22, y + 36), subtitle, fill=MUTED, font=font(14))


def phone_frame(inner: Image.Image) -> Image.Image:
    iw, ih = inner.size
    pad = 18
    bezel = 14
    outer_w = iw + (pad + bezel) * 2
    outer_h = ih + (pad + bezel) * 2 + 8
    canvas = Image.new("RGBA", (outer_w, outer_h), (0, 0, 0, 0))
    # soft shadow
    shadow = Image.new("RGBA", (outer_w, outer_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((pad - 4, pad + 10, outer_w - pad + 4, outer_h - pad + 14), 48, fill=(0, 0, 0, 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    canvas = Image.alpha_composite(canvas, shadow)
    d = ImageDraw.Draw(canvas)
    # device body
    d.rounded_rectangle((pad, pad, outer_w - pad, outer_h - pad), 44, fill=(8, 10, 14), outline=(50, 60, 75), width=2)
    # screen
    screen_box = (pad + bezel, pad + bezel, outer_w - pad - bezel, outer_h - pad - bezel)
    d.rounded_rectangle(screen_box, 34, fill=(0, 0, 0))
    # paste inner with rounded mask
    mask = Image.new("L", (iw, ih), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, iw, ih), 28, fill=255)
    canvas.paste(inner, (pad + bezel, pad + bezel), mask)
    # notch / dynamic island
    cx = outer_w // 2
    d.rounded_rectangle((cx - 48, pad + bezel + 10, cx + 48, pad + bezel + 28), 12, fill=(5, 6, 8))
    return canvas


def tablet_frame(inner: Image.Image) -> Image.Image:
    iw, ih = inner.size
    pad, bezel = 22, 16
    outer_w = iw + (pad + bezel) * 2
    outer_h = ih + (pad + bezel) * 2
    canvas = Image.new("RGBA", (outer_w, outer_h), (0, 0, 0, 0))
    shadow = Image.new("RGBA", (outer_w, outer_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((pad, pad + 12, outer_w - pad, outer_h - pad + 16), 36, fill=(0, 0, 0, 80))
    shadow = shadow.filter(ImageFilter.GaussianBlur(20))
    canvas = Image.alpha_composite(canvas, shadow)
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle((pad, pad, outer_w - pad, outer_h - pad), 28, fill=(10, 12, 16), outline=(55, 65, 80), width=2)
    mask = Image.new("L", (iw, ih), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, iw, ih), 18, fill=255)
    canvas.paste(inner, (pad + bezel, pad + bezel), mask)
    return canvas


def logo_mark(draw, x, y, size=28):
    rr(draw, (x, y, x + size, y + size), 8, fill=TEAL)
    draw.text((x + 5, y + 3), "T", fill=BG_DARK, font=font(size - 8, True))


# ---------- Screens ----------

def screen_login(w=390, h=844):
    img = gradient_bg(w, h)
    d = ImageDraw.Draw(img, "RGBA")
    status_bar(d, w)
    # logo block
    logo_mark(d, w // 2 - 28, 120, 56)
    d.text((w // 2 - 42, 190), "Trax", fill=WHITE, font=font(36, True))
    d.text((w // 2 - 118, 238), "Smart Attendance System", fill=MUTED, font=font(15))
    # card
    card(d, (24, 300, w - 24, 620), 22)
    d.text((44, 328), "Welcome back", fill=WHITE, font=font(22, True))
    d.text((44, 360), "Sign in to manage your team", fill=MUTED, font=font(13))
    # fields
    for label, val, yy in [
        ("Email", "sara@demo-corp.sa", 400),
        ("Password", "••••••••••", 480),
    ]:
        d.text((44, yy), label, fill=MUTED, font=font(12))
        rr(d, (44, yy + 22, w - 44, yy + 62), 12, fill=BG_ELEV, outline=LINE)
        d.text((58, yy + 34), val, fill=WHITE, font=font(15))
    rr(d, (44, 580, w - 44, 632), 14, fill=TEAL)
    d.text((w // 2 - 36, 594), "Sign In", fill=BG_DARK, font=font(17, True))
    d.text((w // 2 - 90, 660), "Demo company · Riyadh TZ", fill=MUTED, font=font(12))
    return img


def screen_dashboard(w=390, h=844):
    img = gradient_bg(w, h)
    d = ImageDraw.Draw(img, "RGBA")
    status_bar(d, w)
    logo_mark(d, 22, 52, 32)
    d.text((64, 56), "Trax", fill=WHITE, font=font(20, True))
    d.text((64, 78), "Demo Corp · Today", fill=MUTED, font=font(12))
    # bell
    rr(d, (w - 54, 54, w - 22, 86), 10, fill=BG_CARD, outline=LINE)
    d.text((w - 44, 60), "🔔", fill=WHITE, font=font(14))
    d.ellipse((w - 30, 54, w - 20, 64), fill=RED)

    header(d, w, "Dashboard", "Real-time team attendance", 104)

    # KPI row
    kpis = [
        ("Present", "24", GREEN),
        ("Late", "3", AMBER),
        ("Absent", "2", RED),
        ("Out", "5", BLUE),
    ]
    gap = 10
    card_w = (w - 44 - gap * 3) // 4
    x0 = 22
    for i, (lab, val, col) in enumerate(kpis):
        x = x0 + i * (card_w + gap)
        card(d, (x, 180, x + card_w, 270), 14)
        d.text((x + 10, 192), lab, fill=MUTED, font=font(11))
        d.text((x + 10, 218), val, fill=col, font=font(24, True))

    # chart card
    card(d, (22, 290, w - 22, 470), 18)
    d.text((40, 308), "Today overview", fill=WHITE, font=font(16, True))
    # simple bars
    bars = [(0.75, TEAL), (0.45, AMBER), (0.2, RED), (0.55, BLUE), (0.9, TEAL), (0.6, TEAL), (0.35, AMBER)]
    bx = 48
    base = 430
    for i, (hgt, col) in enumerate(bars):
        bh = int(90 * hgt)
        rr(d, (bx + i * 44, base - bh, bx + i * 44 + 26, base), 6, fill=col)

    # activity
    card(d, (22, 490, w - 22, 740), 18)
    d.text((40, 508), "Live activity", fill=WHITE, font=font(16, True))
    rows = [
        ("Omar Al-Harbi", "Checked in · HQ", "08:02", GREEN),
        ("Noura Saeed", "Late · Branch 2", "08:41", AMBER),
        ("Khalid M.", "Checked out", "17:05", BLUE),
        ("Lina Faris", "Checked in · HQ", "07:58", GREEN),
    ]
    yy = 548
    for name, meta, t, col in rows:
        d.ellipse((40, yy, 68, yy + 28), fill=TEAL_DIM)
        d.text((46, yy + 4), name[0], fill=WHITE, font=font(14, True))
        d.text((80, yy), name, fill=WHITE, font=font(14, True))
        d.text((80, yy + 18), meta, fill=MUTED, font=font(11))
        d.text((w - 78, yy + 6), t, fill=col, font=font(12, True))
        yy += 46

    bottom_nav(d, w, h, 0)
    return img


def screen_checkin(w=390, h=844):
    img = gradient_bg(w, h)
    d = ImageDraw.Draw(img, "RGBA")
    status_bar(d, w)
    header(d, w, "Check In", "Inside assigned workplace", 54)

    # map mock
    card(d, (22, 130, w - 22, 420), 20)
    # faux map tiles
    for i in range(6):
        for j in range(5):
            shade = 30 + (i + j) % 3 * 8
            d.rectangle(
                (34 + i * 54, 146 + j * 48, 34 + i * 54 + 52, 146 + j * 48 + 46),
                fill=(shade, shade + 10, shade + 18),
            )
    # geofence circle
    cx, cy, r = w // 2, 275, 78
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=TEAL, width=3)
    d.ellipse((cx - r + 8, cy - r + 8, cx + r - 8, cy + r - 8), fill=(41, 184, 166, 35))
    # pin
    d.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), fill=TEAL)
    d.ellipse((cx - 4, cy - 4, cx + 4, cy + 4), fill=WHITE)
    d.text((40, 390), "HQ Riyadh · Geofence OK", fill=GREEN, font=font(13, True))

    # status card
    card(d, (22, 440, w - 22, 560), 16)
    d.text((40, 458), "Shift", fill=MUTED, font=font(12))
    d.text((40, 480), "08:00 – 17:00  ·  30m grace", fill=WHITE, font=font(15, True))
    d.text((40, 512), "GPS accuracy  8 m", fill=MUTED, font=font(12))
    pill(d, w - 120, 470, "On site", (16, 80, 60), GREEN)

    # CTA
    rr(d, (22, 580, w - 22, 648), 18, fill=TEAL)
    d.text((w // 2 - 70, 600), "Confirm Check-In", fill=BG_DARK, font=font(18, True))
    d.text((w // 2 - 100, 670), "Time will use company timezone", fill=MUTED, font=font(12))

    bottom_nav(d, w, h, 1)
    return img


def screen_attendance(w=390, h=844):
    img = gradient_bg(w, h)
    d = ImageDraw.Draw(img, "RGBA")
    status_bar(d, w)
    header(d, w, "Attendance", "Most recent activity first", 54)

    # filters
    for i, lab in enumerate(["Today", "Week", "Month"]):
        x = 22 + i * 90
        bg = TEAL if i == 0 else BG_CARD
        fg = BG_DARK if i == 0 else MUTED
        rr(d, (x, 130, x + 80, 162), 12, fill=bg, outline=LINE)
        tw = d.textlength(lab, font=font(13, True))
        d.text((x + 40 - tw / 2, 138), lab, fill=fg, font=font(13, True))

    rows = [
        ("Omar Al-Harbi", "08:02 → 17:04", "Present", GREEN, "HQ"),
        ("Noura Saeed", "08:41 → —", "Late", AMBER, "Branch 2"),
        ("Khalid M.", "07:55 → 16:50", "Checked out", BLUE, "HQ"),
        ("Lina Faris", "07:58 → 17:10", "Present", GREEN, "HQ"),
        ("Yousef R.", "—", "Absent", RED, "—"),
        ("Maha A.", "09:05 → —", "Late", AMBER, "Warehouse"),
    ]
    y = 184
    for name, times, st, col, loc in rows:
        card(d, (22, y, w - 22, y + 88), 16)
        d.ellipse((38, y + 22, 74, y + 58), fill=TEAL_DIM)
        d.text((48, y + 30), name[0], fill=WHITE, font=font(16, True))
        d.text((90, y + 18), name, fill=WHITE, font=font(15, True))
        d.text((90, y + 42), times, fill=MUTED, font=font(12))
        d.text((90, y + 62), loc, fill=MUTED, font=font(11))
        pill(d, w - 130, y + 30, st, (col[0] // 5, col[1] // 5, col[2] // 5) if False else BG_ELEV, col)
        # fix pill colors manually
        y += 98

    bottom_nav(d, w, h, 3)
    return img


def screen_live_map(w=390, h=844):
    img = gradient_bg(w, h)
    d = ImageDraw.Draw(img, "RGBA")
    status_bar(d, w)
    header(d, w, "Live Map", "Team presence after check-in", 54)

    card(d, (16, 120, w - 16, h - 100), 22)
    # map grid
    for i in range(8):
        for j in range(10):
            shade = 26 + (i * 3 + j) % 4 * 6
            d.rectangle(
                (28 + i * 44, 136 + j * 56, 28 + i * 44 + 42, 136 + j * 56 + 54),
                fill=(shade, shade + 12, shade + 20),
            )
    # roads
    d.line((40, 200, w - 40, 520), fill=(70, 90, 110), width=4)
    d.line((80, 140, 300, 700), fill=(60, 80, 100), width=3)

    # geofences
    for cx, cy, r, lab in [(120, 280, 55, "HQ"), (270, 420, 48, "B2")]:
        d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=TEAL, width=2)
        d.ellipse((cx - r + 6, cy - r + 6, cx + r - 6, cy + r - 6), fill=(41, 184, 166, 30))
        d.text((cx - 12, cy - 8), lab, fill=TEAL, font=font(12, True))

    # employees
    pins = [(140, 270, "O"), (110, 300, "L"), (260, 400, "N"), (280, 440, "M")]
    for x, y, ch in pins:
        d.ellipse((x - 14, y - 14, x + 14, y + 14), fill=TEAL)
        d.text((x - 5, y - 8), ch, fill=BG_DARK, font=font(12, True))

    # floating sheet
    rr(d, (36, h - 250, w - 36, h - 110), 18, fill=(18, 26, 38, 240), outline=LINE)
    d.text((56, h - 232), "4 active on map", fill=WHITE, font=font(15, True))
    d.text((56, h - 208), "Updated just now · Demo data", fill=MUTED, font=font(12))
    pill(d, 56, h - 175, "Inside geofence", BG_ELEV, GREEN)
    pill(d, 190, h - 175, "Live", BG_ELEV, TEAL)

    bottom_nav(d, w, h, 2)
    return img


def screen_employees(w=390, h=844):
    img = gradient_bg(w, h)
    d = ImageDraw.Draw(img, "RGBA")
    status_bar(d, w)
    header(d, w, "Employees", "34 team members", 54)
    # search
    rr(d, (22, 128, w - 22, 168), 14, fill=BG_CARD, outline=LINE)
    d.text((40, 140), "⌕  Search employees…", fill=MUTED, font=font(14))

    people = [
        ("Omar Al-Harbi", "Field · HQ", "Active", GREEN),
        ("Noura Saeed", "Sales · Branch 2", "Late today", AMBER),
        ("Khalid M.", "Ops · HQ", "Checked out", BLUE),
        ("Lina Faris", "HR · HQ", "Active", GREEN),
        ("Yousef R.", "Warehouse", "Not in", MUTED),
        ("Maha A.", "Delivery", "Active", GREEN),
    ]
    y = 188
    for name, role, st, col in people:
        card(d, (22, y, w - 22, y + 84), 16)
        d.ellipse((40, y + 20, 84, y + 64), fill=TEAL_DIM)
        d.text((52, y + 32), name.split()[0][0] + name.split()[-1][0], fill=WHITE, font=font(14, True))
        d.text((100, y + 22), name, fill=WHITE, font=font(15, True))
        d.text((100, y + 46), role, fill=MUTED, font=font(12))
        d.text((w - 120, y + 34), st, fill=col, font=font(12, True))
        y += 96

    # FAB
    d.ellipse((w - 78, h - 150, w - 28, h - 100), fill=TEAL)
    d.text((w - 60, h - 138), "+", fill=BG_DARK, font=font(28, True))
    bottom_nav(d, w, h, 4)
    return img


def screen_notifications(w=390, h=844):
    img = gradient_bg(w, h)
    d = ImageDraw.Draw(img, "RGBA")
    status_bar(d, w)
    header(d, w, "Notifications", "Smart alerts · no noise", 54)

    notes = [
        ("Late arrival", "Noura checked in at 08:41 (late)", "2m", AMBER),
        ("Check-out", "Khalid checked out at 17:05", "12m", BLUE),
        ("On time", "Omar checked in at 08:02", "1h", GREEN),
        ("Missing check-in", "2 employees still not in", "1h", RED),
        ("Geofence", "Maha entered Warehouse zone", "2h", TEAL),
    ]
    y = 130
    for title, body, when, col in notes:
        card(d, (22, y, w - 22, y + 100), 16)
        d.ellipse((40, y + 28, 72, y + 60), fill=BG_ELEV)
        d.ellipse((50, y + 38, 62, y + 50), fill=col)
        d.text((88, y + 22), title, fill=WHITE, font=font(15, True))
        d.text((88, y + 48), body, fill=MUTED, font=font(12))
        d.text((w - 58, y + 24), when, fill=MUTED, font=font(11))
        y += 112
    bottom_nav(d, w, h, 0)
    return img


def screen_tablet_dashboard(w=1200, h=800):
    img = gradient_bg(w, h)
    d = ImageDraw.Draw(img, "RGBA")
    # sidebar
    rr(d, (0, 0, 240, h), 0, fill=(14, 20, 30))
    logo_mark(d, 28, 28, 36)
    d.text((76, 34), "Trax", fill=WHITE, font=font(22, True))
    d.text((76, 60), "Demo Corp", fill=MUTED, font=font(12))
    nav = ["Dashboard", "Employees", "Live Map", "Attendance", "Geofences", "Settings"]
    for i, n in enumerate(nav):
        y = 120 + i * 52
        if i == 0:
            rr(d, (16, y - 8, 224, y + 36), 12, fill=(41, 184, 166, 40))
            d.text((36, y), n, fill=TEAL, font=font(15, True))
        else:
            d.text((36, y), n, fill=MUTED, font=font(15))

    d.text((280, 36), "Operations overview", fill=WHITE, font=font(28, True))
    d.text((280, 76), "Asia/Riyadh · Demo data for portfolio", fill=MUTED, font=font(14))

    # KPI wide
    labels = [("Present", "24", GREEN), ("Late", "3", AMBER), ("Absent", "2", RED), ("Checked out", "5", BLUE), ("Geofences", "4", TEAL)]
    for i, (lab, val, col) in enumerate(labels):
        x = 280 + i * 175
        card(d, (x, 120, x + 160, 220), 16)
        d.text((x + 18, 140), lab, fill=MUTED, font=font(13))
        d.text((x + 18, 168), val, fill=col, font=font(32, True))

    card(d, (280, 250, 780, 740), 18)
    d.text((304, 272), "Attendance trend (demo week)", fill=WHITE, font=font(16, True))
    pts = [(340, 620), (400, 520), (460, 540), (520, 400), (580, 360), (640, 420), (700, 300)]
    for a, b in zip(pts, pts[1:]):
        d.line([a, b], fill=TEAL, width=4)
    for x, y in pts:
        d.ellipse((x - 6, y - 6, x + 6, y + 6), fill=TEAL)

    card(d, (800, 250, 1160, 740), 18)
    d.text((824, 272), "Who's in now", fill=WHITE, font=font(16, True))
    people = ["Omar · HQ", "Lina · HQ", "Noura · B2", "Maha · WH", "Sami · HQ"]
    yy = 320
    for p in people:
        d.ellipse((824, yy, 856, yy + 32), fill=TEAL_DIM)
        d.text((870, yy + 6), p, fill=WHITE, font=font(14))
        pill(d, 1040, yy + 4, "In", BG_ELEV, GREEN)
        yy += 70
    return img


def screen_feature_banner(w=1080, h=1920, title="Smart Check-In", subtitle="Geofence-verified presence", screen_fn=screen_checkin):
    """Play Console phone screenshot with marketing header."""
    canvas = Image.new("RGB", (w, h), BG_DARK)
    # gradient
    base = gradient_bg(w, h)
    canvas.paste(base, (0, 0))
    d = ImageDraw.Draw(canvas)
    d.text((72, 120), "TRAX", fill=TEAL, font=font(28, True))
    d.text((72, 180), title, fill=WHITE, font=font(52, True))
    # wrap subtitle
    d.text((72, 260), subtitle, fill=MUTED, font=font(24))

    phone = screen_fn(390, 844)
    framed = phone_frame(phone)
    # scale framed phone
    max_h = 1400
    scale = max_h / framed.height
    nw, nh = int(framed.width * scale), int(framed.height * scale)
    framed = framed.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (w - nw) // 2
    y = h - nh - 80
    canvas.paste(framed, (x, y), framed if framed.mode == "RGBA" else None)
    return canvas


def save(img: Image.Image, path: Path):
    if img.mode == "RGBA":
        bg = Image.new("RGB", img.size, (20, 24, 32))
        bg.paste(img, mask=img.split()[-1])
        img = bg
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)
    print("wrote", path, img.size)


def main():
    # Raw phone UI (good for portfolio grids)
    phones = {
        "01-login": screen_login,
        "02-dashboard": screen_dashboard,
        "03-check-in": screen_checkin,
        "04-attendance": screen_attendance,
        "05-live-map": screen_live_map,
        "06-employees": screen_employees,
        "07-notifications": screen_notifications,
    }
    for name, fn in phones.items():
        ui = fn()
        save(ui, PHONE / f"{name}.png")
        save(phone_frame(ui), PHONE / f"{name}-framed.png")

    # Tablet
    tab = screen_tablet_dashboard()
    save(tab, TABLET / "01-dashboard.png")
    save(tablet_frame(tab), TABLET / "01-dashboard-framed.png")

    # Play Console style (1080x1920)
    play = ROOT / "play-console"
    play.mkdir(exist_ok=True)
    banners = [
        ("01-check-in", "Smart Check-In", "Geofence-verified. Company timezone.", screen_checkin),
        ("02-dashboard", "Live Dashboard", "Present · Late · Absent at a glance.", screen_dashboard),
        ("03-attendance", "Attendance Log", "Sorted by latest activity.", screen_attendance),
        ("04-map", "Live Map", "See who is on site after check-in.", screen_live_map),
        ("05-team", "Team Roster", "Manage employees in seconds.", screen_employees),
        ("06-alerts", "Smart Alerts", "Late & checkout — no empty noise.", screen_notifications),
        ("07-login", "Secure Access", "Company · Employee · MasterMind.", screen_login),
    ]
    for key, title, sub, fn in banners:
        save(screen_feature_banner(1080, 1920, title, sub, fn), play / f"{key}.png")

    # Also 1080x1920 plain device (no big marketing text) for alternate upload
    plain = ROOT / "play-console-device"
    plain.mkdir(exist_ok=True)
    for key, fn in [
        ("01-login", screen_login),
        ("02-dashboard", screen_dashboard),
        ("03-check-in", screen_checkin),
        ("04-attendance", screen_attendance),
        ("05-map", screen_live_map),
        ("06-employees", screen_employees),
        ("07-notifications", screen_notifications),
    ]:
        ui = fn(390, 844)
        framed = phone_frame(ui)
        # fit into 1080x1920 with padding
        canvas = gradient_bg(1080, 1920)
        scale = min(980 / framed.width, 1700 / framed.height)
        nw, nh = int(framed.width * scale), int(framed.height * scale)
        fr = framed.resize((nw, nh), Image.Resampling.LANCZOS)
        canvas_rgba = canvas.convert("RGBA")
        canvas_rgba.paste(fr, ((1080 - nw) // 2, (1920 - nh) // 2), fr)
        save(canvas_rgba, plain / f"{key}.png")

    print("DONE", ROOT.resolve())


if __name__ == "__main__":
    main()
