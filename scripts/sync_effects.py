#!/usr/bin/env python3
"""リポジトリ直下の effects-ja.json を extension/effects-ja.json へコピーする。

拡張機能はデベロッパーモードで extension/ フォルダを丸ごと読み込む前提で、
バンドルするファイルは extension/ の中になければならない。一方
effects-ja.json はリポジトリ直下で手編集する運用（README 参照）なので、
拡張に反映するにはこのコピーが必要になる。

どちらのファイルも .gitignore 済みで、コミットには含まれない。

effects-ja.json を編集したら実行すること:

    python3 scripts/sync_effects.py
"""
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "effects-ja.json"
DST = ROOT / "extension" / "effects-ja.json"


def main():
    if not SRC.exists():
        print(f"{SRC.relative_to(ROOT)} が無いのでスキップ（初回はまだ無くて正常）")
        return 0

    try:
        data = json.loads(SRC.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"{SRC.relative_to(ROOT)} が不正な JSON: {e}", file=sys.stderr)
        return 1

    if not isinstance(data, list):
        print(f"{SRC.relative_to(ROOT)} はトップレベルが配列である必要があります", file=sys.stderr)
        return 1

    DST.parent.mkdir(exist_ok=True)
    shutil.copyfile(SRC, DST)
    print(f"OK: {len(data)} 件 {SRC.relative_to(ROOT)} -> {DST.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
