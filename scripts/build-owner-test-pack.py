"""Build a portable, offline owner test pack from public synthetic-only instructions."""
from pathlib import Path
from html import escape
import re
import zipfile
import argparse

root = Path(__file__).resolve().parents[1] / "docs" / "owner-testing"
parser = argparse.ArgumentParser()
parser.add_argument("--output", default="/tmp/LedgerBot-Testing-Pack")
args = parser.parse_args()
output = Path(args.output)
output.parent.mkdir(parents=True, exist_ok=True)
files = ["START_HERE.md", "LAPTOP_TEST_GUIDE.md", "IPHONE_TEST_GUIDE.md", "OWNER_FINDINGS_TEMPLATE.md"]

def inline(line):
    line = escape(line)
    line = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", line)
    return re.sub(r"`([^`]+)`", r"<code>\1</code>", line)

parts = []
for index, filename in enumerate(files):
    lines = (root / filename).read_text().splitlines()
    ids = re.findall(r"^## ([LP]-[^ ]+)", "\n".join(lines), re.M)
    assert len(ids) == len(set(ids)), filename
    for section in re.split(r"^## ", "\n".join(lines), flags=re.M)[1:]:
        numbers = [int(n) for n in re.findall(r"^- Step (\d+)\.", section, re.M)]
        assert numbers == list(range(1, len(numbers) + 1)), section.splitlines()[0]
    toc = [f'<li><a href="#g{index}-{n}">{inline(line[3:])}</a></li>'
           for n, line in enumerate(lines) if line.startswith("## ")]
    body = []
    in_list = False
    in_table = False
    for n, line in enumerate(lines):
        if in_list and not line.startswith("- "):
            body.append("</ul>")
            in_list = False
        if in_table and not line.startswith("|"):
            body.append("</tbody></table>")
            in_table = False
        if not line.strip():
            continue
        if line.startswith("#"):
            match = re.match(r"(#+) (.*)", line)
            level = min(4, len(match[1]) + 1)
            body.append(f'<h{level} id="g{index}-{n}">{inline(match[2])}</h{level}>')
        elif line.startswith("- "):
            if not in_list:
                body.append("<ul>")
                in_list = True
            body.append("<li>" + inline(line[2:]) + "</li>")
        elif line.startswith("|"):
            cells = [c.strip() for c in line.strip("|").split("|")]
            if all(re.match(r"^[-: ]+$", c) for c in cells):
                continue
            if not in_table:
                body.append("<table><tbody>")
                in_table = True
            body.append("<tr>" + "".join("<td>" + inline(c) + "</td>" for c in cells) + "</tr>")
        else:
            body.append("<p>" + inline(line) + "</p>")
    if in_list:
        body.append("</ul>")
    if in_table:
        body.append("</tbody></table>")
    parts.append(f'<article id="book{index}"><a href="#top">Back to top</a>' +
                 ('<details><summary>Sections</summary><ul>' + "".join(toc) + '</ul></details>' if toc else '') + "\n".join(body) + "</article>")
page = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LedgerBot owner test books — November 12</title><style>
body{font:18px/1.65 system-ui,sans-serif;color:#192b3d;background:#f4f7fa;margin:0}main{max-width:1000px;margin:auto;padding:24px}h1,h2,h3{line-height:1.3}h3{margin-top:2.5em;border-top:2px solid #c7d6e0;padding-top:20px}nav{display:flex;flex-wrap:wrap;gap:12px}a{color:#075478}nav a,details{padding:12px;background:#e1edf3}article{background:white;padding:24px;margin:24px 0;border:1px solid #ccd8e2;border-radius:12px}li{margin:14px 0}code{background:#edf2f6}p,li,td{overflow-wrap:anywhere}table{border-collapse:collapse;width:100%}td{border:1px solid #bbcbd8;padding:8px}summary{cursor:pointer}@media print{body{background:white;font-size:11pt}main,article{padding:0;border:0}nav,details{display:none}h3{break-after:avoid}li{break-inside:avoid}article{break-before:page}}</style><main id="top"><h1>LedgerBot test books — November 12 update</h1><p>Offline instructions only. No login, tracking, external requests or automatic progress saving. Keep results privately in your findings file. Phone access still requires a supplied HTTPS candidate.</p><nav><a href="#book0">Start here</a><a href="#book1">Laptop</a><a href="#book2">iPhone</a><a href="#book3">Findings</a></nav>''' + "".join(parts) + "</main></html>"
output.with_suffix(".html").write_text(page)
with zipfile.ZipFile(output.with_suffix(".zip"), "w", zipfile.ZIP_DEFLATED) as pack:
    for filename in files:
        pack.write(root / filename, "LedgerBot-Testing-Pack/" + filename)
    pack.writestr("LedgerBot-Testing-Pack/index.html", page)
with zipfile.ZipFile(output.with_suffix(".zip")) as pack:
    assert pack.testzip() is None
    for filename in files:
        assert pack.read("LedgerBot-Testing-Pack/" + filename) == (root / filename).read_bytes()
print("Built and verified HTML and ZIP; section IDs and step numbering checked.")
