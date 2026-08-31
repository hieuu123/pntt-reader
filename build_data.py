from pathlib import Path
import argparse, json, re, shutil

def scalar(v):
    v = v.strip()
    try: return json.loads(v)
    except: return v.strip('"').strip("'")

def parse_md(path):
    text = path.read_text(encoding="utf-8")
    chapter, title, body = int(path.stem), f"Chương {int(path.stem)}", text

    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.S)
    if m:
        fm, body = m.group(1), text[m.end():]
        c = re.search(r"^chapter:\s*(\d+)\s*$", fm, re.M)
        t = re.search(r"^title:\s*(.+)$", fm, re.M)
        if c: chapter = int(c.group(1))
        if t: title = scalar(t.group(1))

    h = re.match(r"\s*#\s+(.+?)\s*\n+", body)
    if h:
        if title == f"Chương {chapter}": title = h.group(1).strip()
        body = body[h.end():]

    return {"chapter": chapter, "title": title, "content": body.strip()}

def build(src, dst):
    files = sorted(
        [p for p in src.glob("*.md") if p.stem.isdigit()],
        key=lambda p: int(p.stem)
    )
    if not files:
        raise RuntimeError(f"Không có .md trong {src}")

    dst.mkdir(parents=True, exist_ok=True)
    toc = []

    for i, path in enumerate(files, 1):
        d = parse_md(path)
        (dst / f"{d['chapter']:04d}.json").write_text(
            json.dumps(d, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8"
        )
        toc.append({"chapter": d["chapter"], "title": d["title"]})

        if i % 200 == 0:
            print(f"  {i}/{len(files)}")

    return len(files), toc

def main():
    a = argparse.ArgumentParser()
    a.add_argument("--part1", type=Path, default=Path("pntt_output/chapters"))
    a.add_argument("--part2", type=Path, default=Path("pntt_part2_output/chapters"))
    a.add_argument("--web", type=Path, default=Path("pntt-reader"))
    x = a.parse_args()

    data = x.web / "data"
    for d in [data / "part1", data / "part2"]:
        if d.exists(): shutil.rmtree(d)

    print("Build Part 1...")
    n1, toc1 = build(x.part1, data / "part1")

    print("Build Part 2...")
    n2, toc2 = build(x.part2, data / "part2")

    index = {
        "title": "Phàm Nhân Tu Tiên",
        "parts": [
            {"id": "part1", "name": "Phần 1 - Phàm Nhân Tu Tiên", "chapters": n1},
            {"id": "part2", "name": "Phần 2 - Tiên Giới Thiên", "chapters": n2}
        ]
    }

    (data / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (data / "toc-part1.json").write_text(
        json.dumps(toc1, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    (data / "toc-part2.json").write_text(
        json.dumps(toc2, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )

    print(f"DONE: Part 1={n1}, Part 2={n2}")

if __name__ == "__main__":
    main()