"""nightmare.aosns.com のキャラクターページから、カードごとのレベル別
（ヒラメキ I〜V、および分かる場合は無印/level0）効果文を直接HTTP取得し、
BeautifulSoupでHTML構造からそのまま（AI要約を経由せず）抜き出す補助ツール。

このスクリプトは effects-ja.json を自動更新しない。抽出結果はJSON candidatesを
標準出力に出すだけで、実際にどの行を採用するかは人が確認してから
effects-ja.json に反映すること。

判明している注意点（ページごとに構造が異なる。community wikiのため編集時期に
よってテンプレートが違う）:

1. 「カード評価」h2セクション（li形式）
   各カード（h3見出し）直後の div.level3 内にある <li> 要素を、ヒラメキ I〜V の
   順（DOM順）として扱う。<li> が0件のカードはヒラメキ文章が無い（評価コメント
   のみ、または削除推奨カード等）とみなしスキップする。5件を超える場合は
   想定外の構造なので抽出せず警告する。<li>の中身は「コストN\\t種別\\t効果文」
   （タブ区切り3列）と「効果文のみ」（タブなし1列）の2パターンがあるため、
   タブ区切りの最後の要素を効果文として採用する。
   **この形式には無印（level0）の効果文が含まれない。**

2. 「ひらめきあり4種」/「ヒラメキあり4種」h2セクション（表形式）
   ひらがな/カタカナ表記の揺れが確認済み。各カードのdiv.level3内に、
   thead「コスト|種類|効果」を持つ<table>があり、以下の構造になっている:
     行1: 無印（level0）
     区切り行（全セルth。「ひらめき効果」の結合セル、または
       「コスト|種類|ヒラメキ効果」の3列見出しの再掲）
     行2-6: ヒラメキI〜V（5行）
     [2つ目の区切り行「隠しヒラメキ」+ 可変数の行 … これは神ヒラメキ的な
      ボーナス組み合わせであり、I〜Vのレベル別効果ではないため抽出しない]
   区切り行が1つしか無い場合（隠しヒラメキ節が無いキャラ）は、区切り行の
   後ろの行を末尾まで読み、5行きっかりならヒラメキI〜Vとして採用する。
   行数が想定と食い違う場合は警告のみ出し、抽出しない（安全側）。
   セル内の<sup>脚注番号</sup>は効果文に混入しないよう除去する。

   **この形式は「カード評価」形式より情報量が多い（無印を含む）が、
   全キャラがこの形式を持つわけではない。**

3. どちらの節も存在しない、または存在してもプレーンな段落コメントのみ
   （効果文ではなく採用可否等の評価コメント）のキャラは、何も抽出しない
   （そのキャラは0件として報告するのみ）。

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
CARD_EVAL_HEADER = "カード評価"
TABLE_SECTION_KEYWORDS = ("ひらめきあり4種", "ヒラメキあり4種")
NON_CARD_H3 = {"生成カード", "生成弾丸カード5種", "生成可能カード"}

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


def find_section_header(soup, keyword):
    """h1/h2のうちtextにkeywordを含む最初のものを返す（表記揺れ対応のため
    id完全一致ではなく部分一致で探す）。"""
    for h in soup.find_all(["h1", "h2"]):
        if keyword in h.get_text():
            return h
    return None


def cards_under_header(header):
    """headerと同じ見出しレベルの次の見出しが現れるまでのh3（カード名）を
    DOM順に集める。"""
    level = header.name
    h3s = []
    for tag in header.find_all_next():
        if tag.name == level:
            break
        if tag.name == "h3":
            h3s.append(tag)
    return h3s


# ---- 1. 「カード評価」li形式 ----

def extract_li_effect_text(li):
    """<li>の中身から効果文だけを取り出す。「コストN\\t種別\\t効果文」形式と
    「効果文のみ」形式のどちらにも対応するため、タブ区切りの最後の要素を使う。"""
    text = li.get_text(separator="\t", strip=True)
    parts = [p for p in text.split("\t") if p != ""]
    return parts[-1] if parts else ""


def parse_li_cards(soup):
    header = find_section_header(soup, CARD_EVAL_HEADER)
    if header is None:
        return [], False

    cards = []
    for h3 in cards_under_header(header):
        name = h3.get_text(strip=True)
        if name in NON_CARD_H3:
            continue
        sib = h3.find_next_sibling("div", class_="level3")
        if sib is None:
            continue
        lis = sib.find_all("li")
        if len(lis) == 0:
            continue  # ヒラメキ文章なし（評価コメントのみ・削除推奨カード等）
        if len(lis) > 5:
            cards.append({"ja_card": name, "base": None, "levels": None,
                           "warning": f"li件数が{len(lis)}件で想定外（5件以下のはず）"})
            continue
        levels = [extract_li_effect_text(li) for li in lis]
        cards.append({"ja_card": name, "base": None, "levels": levels})

    return cards, True


# ---- 2. 「ひらめきあり4種」表形式 ----

def cell_text(cell):
    """<sup>脚注番号</sup>を除去してからテキストを取り出す。"""
    cell_copy = BeautifulSoup(str(cell), "html.parser")
    for sup in cell_copy.find_all("sup"):
        sup.decompose()
    return cell_copy.get_text(strip=True)


def find_effect_table(sib):
    for t in sib.find_all("div", class_="table"):
        thead = t.find("thead")
        if thead and "効果" in thead.get_text():
            return t.find("table")
    return None


def parse_effect_table(table):
    """行1=無印、区切り行、行2-6=ヒラメキI-V、[区切り行+隠しヒラメキ(捨てる)]
    という構造を解析する。行数が想定と違えば base=None, levels=None を返す。
    """
    rows = table.find_all("tr")
    base = None
    levels = None
    warning = None
    state = "before_base"
    buf = []
    divider_count = 0

    for i, row in enumerate(rows):
        cells = row.find_all(["td", "th"])
        is_divider = len(cells) > 0 and all(c.name == "th" for c in cells)
        if i == 0:
            continue  # メインヘッダ行（コスト|種類|効果）
        if is_divider:
            divider_count += 1
            if divider_count == 1:
                if len(buf) == 1:
                    base = cell_text(buf[0].find_all(["td", "th"])[-1])
                else:
                    warning = f"無印行が{len(buf)}件で想定外（1件のはず）"
                buf = []
                state = "collecting_levels"
            elif divider_count == 2:
                if len(buf) == 5:
                    levels = [cell_text(r.find_all(["td", "th"])[-1]) for r in buf]
                else:
                    warning = f"ヒラメキ行が{len(buf)}件で想定外（5件のはず、区切り2到達時点）"
                buf = []
                state = "ignore_hidden"
            continue
        if state == "collecting_levels" or state == "before_base":
            buf.append(row)
        # state == "ignore_hidden" の行（隠しヒラメキ）は捨てる

    if divider_count == 1 and state == "collecting_levels":
        if len(buf) == 5:
            levels = [cell_text(r.find_all(["td", "th"])[-1]) for r in buf]
        else:
            warning = f"ヒラメキ行が{len(buf)}件で想定外（5件のはず、末尾到達時点）"
    if divider_count == 0:
        warning = "区切り行が1つも無い（想定外の構造）"

    return base, levels, warning


def parse_table_cards(soup):
    header = None
    for kw in TABLE_SECTION_KEYWORDS:
        header = find_section_header(soup, kw)
        if header is not None:
            break
    if header is None:
        return [], False

    cards = []
    for h3 in cards_under_header(header):
        name = h3.get_text(strip=True)
        if name in NON_CARD_H3:
            continue
        sib = h3.find_next_sibling("div", class_="level3")
        if sib is None:
            continue
        table = find_effect_table(sib)
        if table is None:
            continue  # 画像のみ等、効果文テーブルが無い
        base, levels, warning = parse_effect_table(table)
        if warning:
            cards.append({"ja_card": name, "base": None, "levels": None,
                           "warning": warning})
        else:
            cards.append({"ja_card": name, "base": base, "levels": levels})

    return cards, True


def fetch_character(en_name, ja_name):
    html = fetch_html(ja_name)
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    li_cards, li_found = parse_li_cards(soup)
    table_cards, table_found = parse_table_cards(soup)

    # 経験上、1キャラのページはどちらか一方の形式にしか対応データを持たない。
    # 情報量が多い（無印を含む）表形式を優先し、無ければli形式を使う。
    if any(c.get("levels") for c in table_cards):
        cards = table_cards
        section_found = table_found
        source_format = "table"
    else:
        cards = li_cards
        section_found = li_found
        source_format = "li"

    records = []
    warnings = []
    for c in cards:
        if c.get("levels") is None:
            warnings.append(f"{en_name}/{c['ja_card']}: {c.get('warning', '不明なエラー')}")
            continue
        if c.get("base") is not None:
            records.append({
                "character": en_name, "ja_card": c["ja_card"], "level": 0,
                "effect": c["base"], "source": "aosns",
            })
        for i, effect in enumerate(c["levels"]):
            records.append({
                "character": en_name, "ja_card": c["ja_card"], "level": i + 1,
                "effect": effect, "source": "aosns",
            })

    return {
        "character": en_name,
        "ja_name": ja_name,
        "section_found": section_found,
        "format": source_format,
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
                "format": None, "card_count": 0, "record_count": 0, "records": [],
                "warnings": [f"取得エラー: {exc}"],
            }
        results.append(result)
        print(
            f"[{i + 1}/{len(targets)}] {en_name}({ja_name}): "
            f"format={result['format']} card={result['card_count']} "
            f"record={result['record_count']} warning={len(result['warnings'])}",
            file=sys.stderr,
        )

    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
