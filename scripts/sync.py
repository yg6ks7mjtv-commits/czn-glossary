#!/usr/bin/env python3
"""glossary.json を検証して docs/ にコピーする。

GitHub Pages は docs/ 配下しか配信しないため、ルートの glossary.json を
そのままでは docs/index.html から読めない。ここでコピーを作る。

glossary.json を編集したら必ず実行すること:

    python3 scripts/sync.py
"""
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "glossary.json"
DST = ROOT / "docs" / "glossary.json"

LEVELS = {"confirmed", "guess", "unmatched"}


def validate(data):
    """README の判定基準を機械的に確認する。違反を文字列のリストで返す。"""
    errors = []
    entries = data["entries"]

    for field in ("en", "ja"):
        seen = {}
        for i, e in enumerate(entries):
            v = e.get(field)
            if not v:
                continue
            if v in seen:
                errors.append(f"{field} が重複: {v!r} (#{seen[v]} と #{i})")
            seen[v] = i

    for i, e in enumerate(entries):
        tag = f"#{i} {e.get('ja') or e.get('en') or '???'}"
        conf = e.get("confidence")

        if conf not in LEVELS:
            errors.append(f"{tag}: 不正な confidence {conf!r}")
            continue
        if not e.get("source"):
            errors.append(f"{tag}: source が空")
        if not (e.get("en") or e.get("ja")):
            errors.append(f"{tag}: en と ja が両方空")

        if conf == "unmatched":
            # 片側だけが空であること
            if bool(e.get("en")) == bool(e.get("ja")):
                errors.append(f"{tag}: unmatched は en/ja のちょうど片方が空であること")
        else:
            if not (e.get("en") and e.get("ja")):
                errors.append(f"{tag}: {conf} は en/ja の両方が必要")

        if conf == "guess" and not e.get("note"):
            errors.append(f"{tag}: guess には根拠を note に書くこと")

        # 判定基準: confirmed の根拠は Prydwen のページに限る
        if conf == "confirmed" and "prydwen.gg" not in e.get("source", ""):
            errors.append(f"{tag}: confirmed の source が Prydwen ではない "
                          f"({e.get('source')!r})")

    counted = {lv: sum(1 for e in entries if e.get("confidence") == lv) for lv in LEVELS}
    counted["total"] = len(entries)
    counted["unmatched_ja_only"] = sum(
        1 for e in entries if e.get("confidence") == "unmatched" and not e.get("en"))
    counted["unmatched_en_only"] = sum(
        1 for e in entries if e.get("confidence") == "unmatched" and not e.get("ja"))
    for k, v in counted.items():
        recorded = data["meta"]["coverage"].get(k)
        if recorded != v:
            errors.append(f"meta.coverage.{k} が実数と不一致: 記載 {recorded} / 実数 {v}")

    return errors, counted


def main():
    data = json.loads(SRC.read_text(encoding="utf-8"))
    errors, counts = validate(data)
    if errors:
        print(f"検証に失敗しました ({len(errors)} 件):", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    DST.parent.mkdir(exist_ok=True)
    shutil.copyfile(SRC, DST)
    print(f"OK: {counts['total']} 件 "
          f"(confirmed {counts['confirmed']} / guess {counts['guess']} / "
          f"unmatched {counts['unmatched']})")
    print(f"  {SRC.relative_to(ROOT)} -> {DST.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
