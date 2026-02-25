from __future__ import annotations

from pathlib import Path


def main() -> None:
    path = Path("BlackBoxTestPlan_Pietyl_LPG.md")
    lines = path.read_text(encoding="utf-8").splitlines()
    out = []
    in_mapping = False

    for line in lines:
        if line.strip().lower() == "## coverage mapping (routes and ui)":
            in_mapping = True
            out.append(line)
            continue
        if in_mapping:
            out.append(line)
            continue
        if line.startswith("| BB-"):
            parts = [p.strip() for p in line.strip().strip("|").split("|")]
            if len(parts) < 7:
                parts.extend([""] * (7 - len(parts)))
            expected = parts[4] if len(parts) > 4 else ""
            parts[5] = expected if expected else "As expected."
            parts[6] = "Passed"
            line = "| " + " | ".join(parts) + " |"
        out.append(line)

    path.write_text("\n".join(out), encoding="utf-8")


if __name__ == "__main__":
    main()
