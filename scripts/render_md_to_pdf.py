from __future__ import annotations

from pathlib import Path
from textwrap import wrap


def escape_pdf_text(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


DEFAULT_COLS = [
    ("Test Case ID", 9),
    ("Title", 22),
    ("Precondition", 20),
    ("Test Steps", 22),
    ("Expected Result", 24),
    ("Actual Result", 12),
    ("Status", 8),
]

MAPPING_COLS = [
    ("Test Case ID", 12),
    ("Route / Controller", 54),
    ("UI Page / Component", 40),
]


def wrap_cell(text: str, width: int):
    text = text.replace("<br />", "\n").replace("<br/>", "\n").replace("<br>", "\n")
    segments = text.split("\n")
    lines = []
    for seg in segments:
        seg = seg.strip()
        if not seg:
            lines.append("")
            continue
        lines.extend(
            wrap(
                seg,
                width=width,
                break_long_words=False,
                break_on_hyphens=False,
            )
        )
    return lines or [""]


def parse_row(line: str, cols):
    parts = [p.strip() for p in line.strip().strip("|").split("|")]
    if len(parts) < len(cols):
        parts += [""] * (len(cols) - len(parts))
    elif len(parts) > len(cols):
        parts = parts[: len(cols) - 1] + [" | ".join(parts[len(cols) - 1 :])]
    return parts


def format_table(rows, cols, header_names):
    sep = "+" + "+".join("-" * w for _, w in cols) + "+"
    header = "|" + "|".join(name.ljust(w)[:w] for name, w in cols) + "|"
    if header_names:
        header = "|" + "|".join(h.ljust(cols[i][1])[: cols[i][1]] for i, h in enumerate(header_names)) + "|"
    lines = [sep, header, sep]

    for row in rows:
        cell_lines = [wrap_cell(cell, width) for cell, (_, width) in zip(row, cols)]
        row_height = max(len(lineset) for lineset in cell_lines)
        for i in range(row_height):
            line = "|" + "|".join(
                (cell_lines[col][i] if i < len(cell_lines[col]) else "").ljust(cols[col][1])
                for col in range(len(cols))
            ) + "|"
            lines.append(line)
        lines.append(sep)

    return lines


def build_table_lines(md_lines):
    out = []
    i = 0
    while i < len(md_lines):
        line = md_lines[i].strip()

        if line.startswith("# "):
            out.append(line[2:])
            i += 1
            continue

        if line.startswith("Generated:"):
            out.append(line)
            out.append("")
            i += 1
            continue

        if line.startswith("## "):
            out.append(line[3:])
            out.append("")
            i += 1

            while i < len(md_lines) and not md_lines[i].strip().startswith("|"):
                if md_lines[i].strip() == "":
                    i += 1
                else:
                    out.append(md_lines[i].strip())
                    i += 1

            if i >= len(md_lines) or not md_lines[i].strip().startswith("|"):
                continue

            header_line = md_lines[i].strip()
            header_names = [p.strip() for p in header_line.strip("|").split("|")]
            cols = DEFAULT_COLS
            if header_names[:3] == [c[0] for c in MAPPING_COLS]:
                cols = MAPPING_COLS

            i += 1
            if i < len(md_lines) and md_lines[i].strip().startswith("|"):
                i += 1

            rows = []
            while i < len(md_lines) and md_lines[i].strip().startswith("|"):
                row = parse_row(md_lines[i], cols)
                rows.append(row)
                i += 1

            out.extend(format_table(rows, cols, header_names))
            out.append("")
            continue

        i += 1

    return out


def write_pdf(lines, out_path: Path):
    page_width = 792
    page_height = 612
    margin = 36
    font_size = 8
    leading = 10
    max_lines = int((page_height - (2 * margin)) / leading)
    pages = []
    for i in range(0, len(lines), max_lines):
        pages.append(lines[i : i + max_lines])

    objects = []

    def add_obj(obj_str: str) -> int:
        objects.append(obj_str)
        return len(objects)

    add_obj("<< /Type /Catalog /Pages 2 0 R >>")
    objects.append(None)
    font_obj_id = add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>")

    page_ids = []
    for page_lines in pages:
        content_lines = ["BT", f"/F1 {font_size} Tf", f"{margin} {page_height - margin} Td"]
        for line in page_lines:
            escaped = escape_pdf_text(line)
            content_lines.append(f"({escaped}) Tj")
            content_lines.append(f"0 -{leading} Td")
        content_lines.append("ET")
        content = "\n".join(content_lines)
        content_bytes = content.encode("latin1", errors="ignore")
        content_obj = f"<< /Length {len(content_bytes)} >>\nstream\n{content}\nendstream"
        content_obj_id = add_obj(content_obj)

        page_obj = (
            "<< /Type /Page /Parent 2 0 R "
            f"/MediaBox [0 0 {page_width} {page_height}] "
            f"/Contents {content_obj_id} 0 R "
            f"/Resources << /Font << /F1 {font_obj_id} 0 R >> >> >>"
        )
        page_obj_id = add_obj(page_obj)
        page_ids.append(page_obj_id)

    kids = " ".join([f"{pid} 0 R" for pid in page_ids])
    objects[1] = f"<< /Type /Pages /Kids [ {kids} ] /Count {len(page_ids)} >>"

    pdf_parts = []
    offsets = [0]
    byte_count = 0

    def append_bytes(s: str):
        nonlocal byte_count
        b = s.encode("latin1")
        pdf_parts.append(b)
        byte_count += len(b)

    append_bytes("%PDF-1.4\n")
    for i, obj in enumerate(objects, start=1):
        offsets.append(byte_count)
        append_bytes(f"{i} 0 obj\n")
        append_bytes(f"{obj}\n")
        append_bytes("endobj\n")

    xref_offset = byte_count
    append_bytes(f"xref\n0 {len(objects) + 1}\n")
    append_bytes("0000000000 65535 f \n")
    for off in offsets[1:]:
        append_bytes(f"{off:010d} 00000 n \n")

    append_bytes("trailer\n")
    append_bytes(f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n")
    append_bytes("startxref\n")
    append_bytes(f"{xref_offset}\n")
    append_bytes("%%EOF\n")

    out_path.write_bytes(b"".join(pdf_parts))


def main():
    md_path = Path("BlackBoxTestPlan_Pietyl_LPG.md")
    pdf_path = Path("BlackBoxTestPlan_Pietyl_LPG.pdf")
    md_lines = md_path.read_text(encoding="utf-8").splitlines()
    lines = build_table_lines(md_lines)
    write_pdf(lines, pdf_path)
    print(f"Wrote: {pdf_path}")


if __name__ == "__main__":
    main()
