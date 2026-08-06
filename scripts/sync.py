#!/usr/bin/env python3
"""glossary.json を検証して docs/ にコピーし、ブックマークレットを組み立てる。

GitHub Pages は docs/ 配下しか配信しないため、ルートの glossary.json を
そのままでは docs/index.html から読めない。ここでコピーを作る。

あわせて docs/bookmarklet.js から javascript: の1行版を生成し、
docs/bookmarklet.html に埋め込む。ブックマークレットの実体は
bookmarklet.js だけなので、両者がずれることはない。

glossary.json か bookmarklet.js を編集したら必ず実行すること:

    python3 scripts/sync.py
"""
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "glossary.json"
DST = ROOT / "docs" / "glossary.json"
BM_SRC = ROOT / "docs" / "bookmarklet.js"
BM_PAGE = ROOT / "docs" / "bookmarklet.html"

LEVELS = {"confirmed", "guess", "unmatched"}


def validate(data):
    """README の判定基準を機械的に確認する。違反を文字列のリストで返す。"""
    errors = []
    entries = data["entries"]

    # en/ja の重複は、両方のエントリに character が付いていて値が異なる場合のみ許可する
    # （同名カードが複数キャラに存在するケース。例: Luke と Veronica の Rapid Fire）。
    for field in ("en", "ja"):
        groups = {}
        for i, e in enumerate(entries):
            v = e.get(field)
            if not v:
                continue
            groups.setdefault(v, []).append(i)
        for v, idxs in groups.items():
            if len(idxs) < 2:
                continue
            chars = [entries[i].get("character") for i in idxs]
            if all(chars) and len(set(chars)) == len(chars):
                continue
            idx_list = ", ".join(f"#{i}" for i in idxs)
            errors.append(f"{field} が重複: {v!r} ({idx_list})。"
                          f"character が全エントリで異なる場合のみ重複を許可")

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


def build_bookmarklet(source):
    """bookmarklet.js を javascript: の1行に畳む。

    貼り付け先は Safari の URL 欄なので、出力は改行なしの純 ASCII にする。
    - 行頭コメントは落とす（URL 内の // を壊さないよう行頭のものだけ）
    - 各行はセミコロン終端で書いてあるので空白1つで連結してよい
    - 日本語は \\uXXXX に逃がす
    - % と # は URL 上で意味を持つのでエスケープする
    """
    lines = []
    for line in source.splitlines():
        line = line.strip()
        if not line or line.startswith("//"):
            continue
        lines.append(line)
    code = " ".join(lines)

    code = code.encode("ascii", "backslashreplace").decode("ascii")

    escaped = {c: n for c, n in (("%", code.count("%")), ("#", code.count("#")))}
    code = code.replace("%", "%25").replace("#", "%23")

    return "javascript:" + code, escaped


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

    if BM_SRC.exists() and BM_PAGE.exists():
        bm, escaped = build_bookmarklet(BM_SRC.read_text(encoding="utf-8"))
        page = BM_PAGE.read_text(encoding="utf-8")
        new_line = "var BOOKMARKLET = " + json.dumps(bm) + ";"
        page, n = re.subn(r"^var BOOKMARKLET = .*;$", lambda _: new_line,
                          page, count=1, flags=re.M)
        if n != 1:
            print("bookmarklet.html に 'var BOOKMARKLET = ...;' の行が見つかりません",
                  file=sys.stderr)
            return 1
        BM_PAGE.write_text(page, encoding="utf-8")
        note = ", ".join(f"{c} を {v} 箇所エスケープ" for c, v in escaped.items() if v)
        print(f"  {BM_SRC.relative_to(ROOT)} -> {BM_PAGE.relative_to(ROOT)} "
              f"({len(bm):,} 文字{'; ' + note if note else ''})")

    return 0


if __name__ == "__main__":
    sys.exit(main())
