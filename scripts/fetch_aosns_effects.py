"""nightmare.aosns.com のキャラクターページから、カードごとの
「カード評価」セクション内のヒラメキ評価（レベル別の効果文）を直接HTTP取得し、
BeautifulSoupでHTML構造からそのまま（AI要約を経由せず）抜き出す補助ツール。

このスクリプトは effects-ja.json を自動更新しない。抽出結果はJSON candidatesを
標準出力に出すだけで、実際にどの行を採用するかは人が確認してから
effects-ja.json に反映すること。

判明している注意点:
- 全キャラのページに「カード評価」セクションがあるとは限らない（古いページ
  ではこのセクション自体が存在せず、ヒラメキ別の文章データが無い）。
  その場合はそのキャラを skipped として報告し、何も出力しない。
- 「カード評価」セクション内の各カード（h3見出し）直後の div.level3 内に
  ある <li> 要素を、ヒラメキ I〜V の順（DOM順）として扱う。<li> が0件の
  カードはヒラメキ文章が無い（削除推奨カード等）とみなしスキップする。
  5件を超える場合は想定外の構造なので抽出せず警告する。
- <li> の中身はキャラによって「コストN\t種別\t効果文」（タブ区切り3列）と
  「効果文のみ」（タブなし1列）の2パターンがある。タブで分割した最後の
  要素を効果文として採用する（タブが無ければ全体をそのまま使う）。
- 基本形（ヒラメキ無し）のカードは、この「カード評価」セクションには
  文章データとして存在しない（画像・数値サマリのみのページが多い）。
  そのため level 0（無印）はこのスクリプトでは取得できない。

使い方:
    python scripts/fetch_aosns_effects.py <キャラ名(日本語, URLエンコード前)> [キャラ名2 ...]
    python scripts/fetch_aosns_effects.py --all   # 既知の35キャラ全員分

出力: 標準出力にJSON配列（1行1レコード、character/ja_card/level/effect/source）
"""

import json
import sys
import time
import urllib.parse

import requests
from bs4 import BeautifulSoup

REQUEST_INTERVAL_SEC = 1.5
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)
BASE_URL = "https://nightmare.aosns.com/%E3%82%AD%E3%83%A3%E3%83%A9%E4%B8%80%E8%A6%A7/"

# Prydwen側の英語キャラ名（glossary.json の character フィールドと同じ表記）
# -> aosns側のページ名（日本語）。glossary.json の character_progress.done
# （2026-08-06時点で全35キャラのカード名登録が完了している一覧）を元にした。
CHARACTER_MAP = {
    "Tenebria": "テネブレア",
    "Luke": "ルーク",
    "Hilde": "ヒルデ",
    "Fei": "フェイ",
    "Adelheid": "アーデルハイト",
    "Heidemarie": "ハイデマリ",
    "Diana": "ディアナ",
    "Rita": "リタ",
    "Tiphera": "ティペラ",
    "Nine": "ナイン",
    "Sereniel": "セレニエル",
    "Chizuru": "チズル",
    "Yuki": "ユキ",
    "Haru": "ハル",
    "Veronica": "ベロニカ",
    "Khalipe": "カリーペ",
    "Magna": "マグナ",
    "Rin": "リン",
    "Orlea": "オルレア",
    "Mei Lin": "メイリン",
    "Narja": "ナージャ",
    "Renoa": "レノア",
    "Hugo": "ヒューゴ",
    "Kayron": "カイロン",
    "Beryl": "ベリル",
    "Maribell": "マリベル",
    "Owen": "オーウェン",
    "Rei": "レイ",
    "Selena": "セレーナ",
    "Lucas": "ルーカス",
    "Cassius": "カシウス",
    "Nia": "ニア",
    "Mika": "ミカ",
    "Amir": "アミール",
    "Tressa": "トレサ",
}


def fetch_html(ja_name):
    url = BASE_URL + urllib.parse.quote(ja_name, safe="")
    headers = {"User-Agent": USER_AGENT}
    r = requests.get(url, headers=headers, timeout=20)
    r.raise_for_status()
    return r.text


def extract_effect_text(li):
    """<li>の中身から効果文だけを取り出す。「コストN\\t種別\\t効果文」形式と
    「効果文のみ」形式のどちらにも対応するため、タブ区切りの最後の要素を使う。"""
    text = li.get_text(separator="\t", strip=True)
    parts = [p for p in text.split("\t") if p != ""]
    return parts[-1] if parts else ""


def parse_card_evaluation_section(html):
    """「カード評価」h2セクション内の各カード（h3）から、ヒラメキ別の効果文を
    抽出する。戻り値: (cards, section_found)
      cards: [{"ja_card": str, "levels": [str, ...]}, ...]
             levels はDOM順（ヒラメキI, II, III...のはずだが未検証）の効果文リスト
      section_found: 「カード評価」h2が見つかったかどうか
    """
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    h2 = soup.find("h2", id="カード評価")
    if h2 is None:
        return [], False

    h3s = []
    for tag in h2.find_all_next():
        if tag.name == "h2":
            break
        if tag.name == "h3":
            h3s.append(tag)

    cards = []
    for h3 in h3s:
        name = h3.get_text(strip=True)
        if name == "生成カード":
            continue  # 生成専用カードのサブセクション。ヒラメキ評価の対象外
        sib = h3.find_next_sibling("div", class_="level3")
        if sib is None:
            continue
        lis = sib.find_all("li")
        if len(lis) == 0:
            continue  # ヒラメキ文章なし（基本形のみ等）
        if len(lis) > 5:
            cards.append({"ja_card": name, "levels": None,
                           "warning": f"li件数が{len(lis)}件で想定外（5件以下のはず）"})
            continue
        levels = [extract_effect_text(li) for li in lis]
        cards.append({"ja_card": name, "levels": levels})

    return cards, True


def fetch_character(en_name, ja_name):
    html = fetch_html(ja_name)
    cards, section_found = parse_card_evaluation_section(html)

    records = []
    warnings = []
    for c in cards:
        if c.get("levels") is None:
            warnings.append(f"{en_name}/{c['ja_card']}: {c['warning']}")
            continue
        for i, effect in enumerate(c["levels"]):
            records.append({
                "character": en_name,
                "ja_card": c["ja_card"],
                "level": i + 1,
                "effect": effect,
                "source": "aosns",
            })

    return {
        "character": en_name,
        "ja_name": ja_name,
        "section_found": section_found,
        "card_count": len(cards),
        "record_count": len(records),
        "records": records,
        "warnings": warnings,
    }


def main():
    if len(sys.argv) < 2:
        print("usage: python scripts/fetch_aosns_effects.py <キャラ名...> | --all")
        sys.exit(1)

    if sys.argv[1] == "--all":
        targets = list(CHARACTER_MAP.items())
    else:
        targets = []
        for name in sys.argv[1:]:
            if name not in CHARACTER_MAP:
                print(f"未知のキャラ名: {name}", file=sys.stderr)
                sys.exit(1)
            targets.append((name, CHARACTER_MAP[name]))

    results = []
    for i, (en_name, ja_name) in enumerate(targets):
        if i > 0:
            time.sleep(REQUEST_INTERVAL_SEC)
        try:
            result = fetch_character(en_name, ja_name)
        except Exception as exc:  # noqa: BLE001 -- 取得失敗はキャラ単位で記録して続行する
            result = {
                "character": en_name, "ja_name": ja_name, "section_found": False,
                "card_count": 0, "record_count": 0, "records": [],
                "warnings": [f"取得エラー: {exc}"],
            }
        results.append(result)
        print(
            f"[{i + 1}/{len(targets)}] {en_name}({ja_name}): "
            f"section={'あり' if result['section_found'] else 'なし'} "
            f"card={result['card_count']} record={result['record_count']} "
            f"warning={len(result['warnings'])}",
            file=sys.stderr,
        )

    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
