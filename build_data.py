from pathlib import Path
import argparse
import json
import re
import shutil


# ============================================================
# PARSE MARKDOWN
# ============================================================

def scalar(value):
    value = value.strip()

    try:
        return json.loads(value)
    except Exception:
        return value.strip('"').strip("'")


def parse_md(path):
    text = path.read_text(
        encoding="utf-8"
    )

    chapter = int(path.stem)

    title = f"Chương {chapter}"

    body = text

    # --------------------------------------------------------
    # YAML frontmatter
    # --------------------------------------------------------

    match = re.match(
        r"^---\s*\n(.*?)\n---\s*\n",
        text,
        re.S
    )

    if match:
        frontmatter = match.group(1)

        body = text[
            match.end():
        ]

        chapter_match = re.search(
            r"^chapter:\s*(\d+)\s*$",
            frontmatter,
            re.M
        )

        title_match = re.search(
            r"^title:\s*(.+)$",
            frontmatter,
            re.M
        )

        if chapter_match:
            chapter = int(
                chapter_match.group(1)
            )

        if title_match:
            title = scalar(
                title_match.group(1)
            )

    # --------------------------------------------------------
    # Remove Markdown H1
    # --------------------------------------------------------

    heading_match = re.match(
        r"\s*#\s+(.+?)\s*\n+",
        body
    )

    if heading_match:
        if title == f"Chương {chapter}":
            title = heading_match.group(
                1
            ).strip()

        body = body[
            heading_match.end():
        ]

    content = body.strip()

    if not content:
        raise RuntimeError(
            f"Content rỗng: {path}"
        )

    return {
        "chapter": chapter,
        "title": title,
        "content": content,
    }


# ============================================================
# BUILD ONE PART
# ============================================================

def build_part(
    src_dir,
    dst_dir
):
    if not src_dir.exists():
        raise FileNotFoundError(
            f"Không tìm thấy: {src_dir}"
        )

    files = sorted(
        [
            p
            for p in src_dir.glob("*.md")
            if p.stem.isdigit()
        ],
        key=lambda p: int(p.stem)
    )

    if not files:
        raise RuntimeError(
            f"Không có file .md trong {src_dir}"
        )

    dst_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    toc = []

    chapter_numbers = []

    for index, path in enumerate(
        files,
        start=1
    ):
        data = parse_md(
            path
        )

        chapter = data[
            "chapter"
        ]

        output_file = (
            dst_dir
            / f"{chapter:04d}.json"
        )

        output_file.write_text(
            json.dumps(
                data,
                ensure_ascii=False,
                separators=(",", ":")
            ),
            encoding="utf-8"
        )

        # ----------------------------------------------------
        # TOC only needs chapter + title
        # ----------------------------------------------------

        toc.append({
            "chapter": chapter,
            "title": data["title"],
        })

        chapter_numbers.append(
            chapter
        )

        if index % 200 == 0:
            print(
                f"  {index}/{len(files)}"
            )

    # --------------------------------------------------------
    # Validate missing chapters
    # --------------------------------------------------------

    chapter_numbers.sort()

    existing = set(
        chapter_numbers
    )

    missing = [
        n
        for n in range(
            chapter_numbers[0],
            chapter_numbers[-1] + 1
        )
        if n not in existing
    ]

    if missing:
        print()
        print(
            f"WARNING: thiếu {len(missing)} chương"
        )
        print(
            missing[:100]
        )

    toc.sort(
        key=lambda x: x["chapter"]
    )

    return len(files), toc


# ============================================================
# MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--part1",
        type=Path,
        default=Path(
            "pntt_output/chapters"
        )
    )

    parser.add_argument(
        "--part2",
        type=Path,
        default=Path(
            "pntt_part2_output/chapters"
        )
    )

    parser.add_argument(
        "--web",
        type=Path,
        default=Path(
            "pntt-reader"
        )
    )

    args = parser.parse_args()

    data_dir = (
        args.web
        / "data"
    )

    part1_dir = (
        data_dir
        / "part1"
    )

    part2_dir = (
        data_dir
        / "part2"
    )

    # --------------------------------------------------------
    # Clear old generated chapter data
    # --------------------------------------------------------

    for directory in [
        part1_dir,
        part2_dir
    ]:
        if directory.exists():
            shutil.rmtree(
                directory
            )

    # --------------------------------------------------------
    # PART 1
    # --------------------------------------------------------

    print()
    print("Build Part 1...")

    count1, toc1 = build_part(
        args.part1,
        part1_dir
    )

    # --------------------------------------------------------
    # PART 2
    # --------------------------------------------------------

    print()
    print("Build Part 2...")

    count2, toc2 = build_part(
        args.part2,
        part2_dir
    )

    # --------------------------------------------------------
    # INDEX
    # --------------------------------------------------------

    data_dir.mkdir(
        parents=True,
        exist_ok=True
    )

    index = {
        "title": "Phàm Nhân Tu Tiên",

        "parts": [
            {
                "id": "part1",
                "name": (
                    "Phần 1 - "
                    "Phàm Nhân Tu Tiên"
                ),
                "chapters": count1
            },
            {
                "id": "part2",
                "name": (
                    "Phần 2 - "
                    "Tiên Giới Thiên"
                ),
                "chapters": count2
            }
        ]
    }

    (
        data_dir
        / "index.json"
    ).write_text(
        json.dumps(
            index,
            ensure_ascii=False,
            indent=2
        ),
        encoding="utf-8"
    )

    # --------------------------------------------------------
    # TOC
    # --------------------------------------------------------

    (
        data_dir
        / "toc-part1.json"
    ).write_text(
        json.dumps(
            toc1,
            ensure_ascii=False,
            separators=(",", ":")
        ),
        encoding="utf-8"
    )

    (
        data_dir
        / "toc-part2.json"
    ).write_text(
        json.dumps(
            toc2,
            ensure_ascii=False,
            separators=(",", ":")
        ),
        encoding="utf-8"
    )

    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("DONE")
    print("=" * 60)

    print(
        f"Part 1: {count1} chương"
    )

    print(
        f"Part 2: {count2} chương"
    )

    print()
    print(
        "Created:"
    )

    print(
        "data/toc-part1.json"
    )

    print(
        "data/toc-part2.json"
    )


if __name__ == "__main__":
    main()
