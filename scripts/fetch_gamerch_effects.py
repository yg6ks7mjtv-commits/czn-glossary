"""gamerch(chaoszeronightmare wiki)のキャラクターページから、カードごとの
「おすすめヒラメキ」表を直接HTTP取得し、BeautifulSoupでHTML構造から効果文
候補をそのまま（AI要約を経由せず）抜き出す補助ツール。

このスクリプトは effects-ja.json を自動更新しない。抽出結果は標準出力に
出すだけで、実際にどの行を採用するか（特に「初期」行は評価コメントと
1つの改行だけで区切られていることがあり、機械的な分割だけでは効果文と
評価文の境界を誤ることがある）は人が確認してから effects-ja.json に
反映すること。

使い方:
    python scripts/fetch_gamerch_effects.py <gamerchのページURL>

注意:
- 対象サイトへの負荷を避けるため、複数ページを連続取得する場合は
  呼び出し側で REQUEST_INTERVAL_SEC 以上の間隔を空けること。
- 「基本カード」「エゴスキル」等、表ではなく画像ギャラリーのみのセクションは
  何も出力しない（＝そのページに文章データが無いことを意味する。他の
  情報源で補うか、そのカードはeffects-ja.jsonに登録しないこと）。
"""

import sys
import time

import requests
from bs4 import BeautifulSoup

REQUEST_INTERVAL_SEC = 1.5
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)


def fetch_html(url):
    headers = {"User-Agent": USER_AGENT}
    r = requests.get(url, headers=headers, timeout=20)
    r.raise_for_status()
    return r.text


def parse_card_sections(html):
    """h3見出し(カード名) ごとに、その直後の「おすすめヒラメキ」表を解析する。
    戻り値: [(カード名, [(段階ラベル, 効果文候補), ...]), ...]
    表が無い（画像ギャラリーのみ等）セクションは空リストになる。
    """
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    results = []
    for h3 in soup.find_all("h3"):
        name = h3.get_text(strip=True)
        sib = h3.find_next_sibling()
        if sib is None:
            continue
        rows = []
        for td in sib.select("td.mu__table--col2"):
            contents = list(td.contents)
            hr_idx = None
            for i, c in enumerate(contents):
                if getattr(c, "name", None) == "hr":
                    hr_idx = i
                    break
            if hr_idx is None:
                continue
            label = "".join(
                c if isinstance(c, str) else c.get_text()
                for c in contents[:hr_idx]
            ).strip()
            after = contents[hr_idx + 1:]
            effect_parts = []
            for c in after:
                if getattr(c, "name", None) == "br":
                    break
                if isinstance(c, str):
                    t = c.strip()
                    if t:
                        effect_parts.append(t)
            effect_text = "".join(effect_parts)
            rows.append((label, effect_text))
        if rows:
            results.append((name, rows))
    return results


def main():
    if len(sys.argv) < 2:
        print("usage: python scripts/fetch_gamerch_effects.py <URL>")
        sys.exit(1)

    url = sys.argv[1]
    html = fetch_html(url)
    sections = parse_card_sections(html)

    if not sections:
        print("表形式のヒラメキ解説セクションが見つかりませんでした。")
        return

    for name, rows in sections:
        print(f"=== {name} ===")
        for label, effect in rows:
            note = ""
            # 「初期」行はページ側で効果文と評価コメントが単一の<br>だけで
            # 区切られていることがあり、機械的な分割だと効果文の後半
            # （評価コメント直前の実際の効果説明）を取りこぼす場合がある。
            if label == "初期":
                note = "  # 要目視確認: 評価コメントとの境界が曖昧なことがある"
            print(f"  {label!r}: {effect!r}{note}")
        print()


if __name__ == "__main__":
    main()
