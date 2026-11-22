#!/usr/bin/env python3
"""Render docs/index.html (EN) and docs/lt/index.html (LT) from src/page.html.j2 + src/strings.py."""
import os, sys, time
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, StrictUndefined
sys.path.insert(0, str(Path(__file__).parent))
import strings as S

root = Path(__file__).resolve().parent.parent
env = Environment(loader=FileSystemLoader(str(root / "src")), undefined=StrictUndefined, autoescape=True, trim_blocks=True, lstrip_blocks=True)
def faq_ld(g, faq):
    g["@graph"][-1]["mainEntity"] = [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]
    return g
env.filters["faq_ld"] = faq_ld
tpl = env.get_template("page.html.j2")
v = time.strftime("%Y%m%d%H%M")
common = dict(mail=S.MAIL, phone=S.PHONE, phone_href=S.PHONE_HREF, fb=S.FB, code=S.CODE, v=v)
for t, out, log, scan in ((S.EN, "docs/index.html", S.LOG, S.SCAN),
                          (S.LT, "docs/lt/index.html", [(y, S.LOG_LT.get(n, n)) for y, n in S.LOG], S.SCAN_LT)):
    p = root / out; p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(tpl.render(t=t, log=log, scan=scan, cities=S.CITIES[t['lang']], **common), encoding="utf-8")
    print("wrote", out)
