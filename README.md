# カオスゼロナイトメア 英日用語対応表

Chaos Zero Nightmare の用語の英日対応表。状態異常・バフデバフを中心に、
戦闘システム用語・カード関連用語・キャラ固有用語を含む。

**検索ページ: https://yg6ks7mjtv-commits.github.io/czn-glossary/**
（GitHub Pages の設定後に有効。手順は下記「検索ページの公開」）

## ファイル

- `glossary.json` — **用語対応表本体。編集するのはここだけ。**
- `docs/index.html` — 検索ページ（外部ライブラリなしの単一 HTML）
- `docs/bookmarklet.js` — ブックマークレットの**実体**。編集するならここ
- `docs/bookmarklet.html` — ブックマークレットの配布ページ（コピーボタン + iPhone 登録手順）
- `docs/glossary.json` — 対応表の**自動生成コピー**。直接編集しないこと
- `scripts/sync.py` — 検証 + `docs/` へのコピー + ブックマークレットの組み立て
- `extension/` — prydwen.gg 用 Chrome 拡張（開発用・非公開）。詳細は下記
  「Chrome拡張（開発用）」参照
- `scripts/sync_effects.py` — 非公開の `effects-ja.json` を `extension/` へコピー
- `effects-ja.json`（リポジトリには含まれない） — 非公開データ。詳細は下記参照

`glossary.json` か `docs/bookmarklet.js` を編集したら必ず実行する:

```sh
python3 scripts/sync.py
```

このスクリプトは3つのことをする:

1. **検証** — 下記「判定基準」をコードで確認する。`confirmed` に Prydwen 以外の
   出典が紛れ込んだ場合などはここで落ちる
2. **コピー** — GitHub Pages は `docs/` 配下しか配信しないため、ルートの
   `glossary.json` を検索ページから直接読めない。コピーを作る
3. **組み立て** — `docs/bookmarklet.js` を `javascript:` の1行に畳んで
   `docs/bookmarklet.html` に埋め込む。改行なしの純 ASCII に変換し、
   `%` と `#` を URL エスケープする（Safari の URL 欄に貼るため）

## ブックマークレット

英語ページ上で実行すると、ページ内の用語を対応表の日本語に置き換える。
配布ページ: `docs/bookmarklet.html`（公開後は `/czn-glossary/bookmarklet.html`）。

- `confirmed` のみ使用。`guess` と `unmatched` は置換しない
- 長い語から先に置換する（`Retain Shield` が `Retain` より先）
- 単語境界を見るので `Marker` の中の `Mark` は置換しない。大文字小文字も区別する
- 一般名詞・一般的な英語表現としても成立する語は `Mark(標識)` のように英語を
  残す。対象は `docs/bookmarklet.js` の `KEEP_EN`。効果辞典由来の語（`Mark` /
  `Lead` / `Remove` / `Wave` / `Partner` / `Break` / `Save` / `Damage` /
  `Shield` / `Heal`）に加え、キャラ固有カード名のうち一般的な英語表現としても
  成立するもの（`Spotlight` / `Encore` / `Rhythm` / `Sound Check` /
  `Fan Service` / `Once Upon a Time` 等）を含む。完全一致のみで、
  `Critical Damage` のような複合語は通常どおり日本語だけに置き換える。
  キャラカード追加のたびに該当語がないか確認すること
- **同じ `en` が character 違いで複数登録され `ja` が食い違う場合、動的に
  英語併記になる**（例: `Rapid Fire` が Luke=連続撃発 / Veronica=速射弾）。
  ページ上のテキストだけではどちらのキャラのカードか判別できないため、
  `docs/bookmarklet.js` の `run()` が実行時に自動判定し、`KEEP_EN` の静的
  リストに手動で足す必要はない。表示される `ja` はどちらか一方（先に
  読み込まれた方）になるが、`title` 属性の元英語と併記されるので誤解はしにくい
- 置換箇所は薄い黄色になり、`title` 属性に元の英語が残る
- 元に戻す機能はなし（再読み込みで戻る）

**取得先URLに `docs/` は入らない。** Pages を `docs/` から配信すると `docs/`
がサイトのルートになるため、`docs/glossary.json` の公開URLは
`https://yg6ks7mjtv-commits.github.io/czn-glossary/glossary.json` になる。
他サイト上で実行するので、この絶対URLを埋め込んである。ユーザー名やリポジトリ名を
変えたら `docs/bookmarklet.js` の `SRC` を直すこと。

## Chrome拡張（開発用・非公開）

`extension/` に prydwen.gg（Chaos Zero Nightmare セクションのみ）向けの
Chrome拡張がある。ブックマークレットと同じ用語置換に加えて、カード画像下部の
効果文の直後に日本語の効果文を追記する機能を持つ。**Chrome ウェブストアには
公開しない。** デベロッパーモードでフォルダを読み込んで使うローカル専用の拡張。

### 導入手順

1. `chrome://extensions` を開く
2. 右上の「デベロッパーモード」をONにする
3. 「パッケージ化されていない拡張機能を読み込む」を押し、`extension/` フォルダを選ぶ
4. `www.prydwen.gg/chaos-zero-nightmare/` 配下のページを開くと自動で動作する
5. 動作すると画面右下に3秒だけ「CZN: ◯件を置換 / カード枠◯件 / 名前取得◯件 /
   ユニーク◯件 / 効果文◯件 / 効果文データ◯件」というトーストが出る。
   何も処理できなかった場合は「CZN: 対象が見つかりません」と出る
   （検出条件やセレクタが実際のページに合っていない可能性が高い）。
   - 置換: カード以外も含めた用語置換の件数（ブックマークレットと同じ処理）
   - カード枠: 種別表示（`Attack`/`Skill`）から検出を試みた件数
   - 名前取得: そのうちカード名まで特定できた件数
   - ユニーク: ベース名（ローマ数字を除いた名前）の種類数。同じ名前の
     複数ヒラメキ段階（例: `Sword Rain I`〜`V`）は1件にまとめて数える
     （検出処理そのものはカード枠＝カード要素ごとに独立して行われ、同名でも
     集約・重複排除はしない）
   - 効果文データ: `extension/effects-ja.json` から実際に読み込めた件数。
     0件ならファイルが未配置か、読み込みに失敗している（マニフェストの
     `web_accessible_resources` 未設定などが原因になり得る）
   効果文が1件以上挿入できたときは、実際に挿入した「原文 / level /
   textContentの文字数 / outerHTMLの先頭100文字」の内訳を最大10件表示する。
   効果文データの件数と挿入件数が一致しない（重複挿入やlevel違いへの誤挿入が
   疑われる）ときに、その場で確認できる。
   効果文の挿入が0件のときは、検出できたカード名ごとに「日本語化できたか」
   「ヒラメキ段階(level)」「照合に使ったキー」「効果文が見つかったか」を
   最大10件まで表示する。あわせて、保有している効果文データのキー一覧
   （最大20件）も表示するので、探索キーと見比べて表記ゆれを確認できる。
   この10件は、効果文が見つかったもの・glossaryで日本語化できたもの・
   ヒラメキ段階が付いているものを優先して並べる（単純なDOM順のキャップだと
   手がかりの多いカードが表示から漏れてしまうため）
6. 拡張アイコンのポップアップに ON/OFF トグルがある。OFF にしても、その時点で
   既に置換済みの表示は元に戻らない（反映にはページの再読み込みが必要）

`extension/effects-ja.json`（効果文データ）を更新した場合は再読み込みが必要:

- リポジトリ直下の `effects-ja.json` を編集する
- `python3 scripts/sync_effects.py` を実行して `extension/effects-ja.json` に反映する
- `chrome://extensions` で対象拡張の再読み込みボタン（circular arrow）を押す

`effects-ja.json` は `.gitignore` 済みで、リポジトリ直下・`extension/` 配下の
どちらもコミットされない。**このファイルの中身（スキーマや収録データ）は
このREADMEには記載しない。**

### 仕組み

起動時に2つのデータを読む:

- `glossary.json` — 公開URL（`docs/` 配信）から取得。カード名の英日対応に使う
- `extension/effects-ja.json` — 拡張に同梱される非公開データ。カード名から
  効果文を引くのに使う

Prydwenのカード1枚は、左上のコスト数字・カード名（例: `Sword Rain III`）・
種別表示（`Attack` または `Skill`）・カード画像・画像下部に重なる効果文
（長いときだけ「Show Effects」リンク付き）という構成になっている。

処理の流れ:

1. カード名を原文のまま収集する（用語置換より前に必ず終わらせる。順序を
   崩すと見出しが「Sword Rain(剣の雨)」のように化けて次のglossary照合が
   失敗するため）
2. カード名の末尾にヒラメキ段階のローマ数字（`I`/`II`/`III`/`IV`/`V`）が
   付いていれば切り離し、`level` 1〜5として扱う（無ければ `level` 0）。
   カード名要素自体にローマ数字が含まれていない場合は、カード枠内で
   ローマ数字だけを内容とする別要素（レベルバッジ）を探すフォールバックも行う
   （名前とヒラメキ段階の表示が別々の要素に分かれているレイアウト向け）。
   残ったベース名が `glossary.json` の英語カード名と完全一致し、かつ末尾が
   コロンでない（＝「Starting Cards:」のようなグループ見出しではない）
   ものだけをカード名候補として採用する
3. 種別表示（`Attack`/`Skill`）要素から親を1階層ずつたどり、上記の条件を
   満たすカード名候補が現れた時点で確定する（＝カード名と種別表示の両方を
   含む最小の共通祖先を「カード枠」とみなす。それより外は探索しない。
   「Show Effects」は効果文が短いカードに存在しないため目印にしない）。
   1階層で見つからず広く登った結果、同じ範囲に複数のカード名候補が入って
   しまうことがある（例: 一覧表示でカード名の列と種別表示の列が離れている
   場合）。その場合は最初に見つかった候補ではなく、種別表示からのDOM順の
   距離が最も近い候補を採用する（無関係な別カードの名前を誤って拾わない
   ようにするため）
4. `effects-ja.json` をそのカード名（日本語）・キャラ・levelの組で検索する。
   キャラ名は前後空白除去＋小文字化、levelは数値/文字列どちらでも同じ扱いに
   なるよう正規化してから比較する（URLスラッグ経由のキャラ名とJSON側の
   表記でケースが揃っていなくても一致するようにするため）。該当levelの
   効果文が見つかれば、box内でコスト数字・カード名・種別表示・
   「Show Effects」・ローマ数字バッジを除いた最長のテキスト要素（＝英語の
   効果文）の直後に、日本語効果文を追記する（見つからなければ box 自体の
   末尾に追加する）。box の外に出す方式（親要素やboxの兄弟として挿入）は
   実際に幅・高さ0で非表示になり表示に失敗したため採用していない。
   挿入のたびに、box の中に既存の効果文ブロックがあれば `querySelectorAll`
   で全て探して削除してから作り直すため、SPA側の再描画で同じboxが複数回
   処理されても複数のブロックが並ぶことはない。英語の効果文はどこにあっても
   消さずそのまま残す。該当levelの効果文が無ければ何もしない
5. 最後に、カード名以外のテキストの用語置換をブックマークレットと同じ
   アルゴリズム・同じ辞書（`glossary.json`）で行う。ローマ数字が続く場合は
   「Sword Rain III(剣の雨 III)」のようにまとめて1つの用語として置換する。
   ただし手順3で特定したカード名見出し要素の中だけは英語併記をせず、
   日本語のみにする（見出しは横幅が限られており、併記すると
   「Sword Rain III(剣の...」のように途中で切れてしまうため。本文側は
   従来どおり併記する）
6. SPA側の再描画でDOMが差し替わっても追従できるよう、`MutationObserver` で
   1〜5の全段階（カード名収集・効果文挿入・用語置換）をまとめて再実行する。
   用語置換だけを除外すると、再描画で消えた置換結果（例: `[Linked]` の
   日本語化）が復活しないため

### 実装上の注意（重要）

**`www.prydwen.gg` への自動アクセスが403で拒否される環境で書いたため、
実際のカード要素のHTML構造の細部（クラス名など）は見ないまま書いている。**
カードの構成要素（コスト・名前・種別表示・画像・効果文・Show Effects）は
分かっているので、それを手がかりに検出する設計にした。

- 既定の検出方式（`extension/selectors.js` の `useMarkerStrategy: true`）は、
  固定の階層数や見出しタグの総当たりではなく、**種別表示と
  glossary名との完全一致（ローマ数字除去後）**をカード名の判定基準にして
  いる。これにより「Starting Cards:」等のグループ見出しを誤ってカード名と
  して拾う事故を防いでいる
- 種別表示の文字列・たどる最大階層数（`maxAncestorClimb`）はすべて
  `extension/selectors.js` に切り出してある。実際のページで devtools を
  見ながらここを調整すること（`content.js` 側の変更は基本的に不要な設計）
- 正確なCSSセレクタが判明したら、`selectors.js` の `useMarkerStrategy` を
  `false` にして `cardContainer` / `cardName` / `effectSlot` を埋めれば、
  種別表示方式ではなくセレクタ直指定の経路に切り替えられる
- `content.js` 冒頭の `CZN_DEBUG` を `true` にすると、マッチ状況を
  console に出力する
- `extension/effects-ja.json` は content script から `chrome.runtime.getURL()`
  経由で `fetch` しているため、`manifest.json` の `web_accessible_resources`
  に登録していないとブロックされ、効果文データが常に0件（取得失敗）扱いに
  なる。読み込めているかはトーストの「効果文データ◯件」で確認できる

一発では動かない前提で作ってあるので、画面右下のトースト表示（カード枠の
検出件数・名前取得件数・ユニーク件数・効果文の挿入件数、0件時は検出名
ごとの診断を最大10件）と `CZN_DEBUG` を見ながら `selectors.js` を
育てていくこと。カードはカード枠（DOM要素）ごとに独立して処理するため、
同じ名前のカードが複数枚（ヒラメキ段階違い）あっても集約・重複排除はしない。

### キャラ名の対応

URLの `/characters/<slug>` からキャラ名を判定し、`glossary.json` の
`character` フィールドと突き合わせている（対応表は `content.js` の
`SLUG_TO_CHARACTER`）。同じ英語カード名が複数キャラに存在する場合
（例: `Rapid Fire`）、キャラページ上ではURLから分かるキャラ名を優先する。
キャラページ以外（デッキビルダー等）ではキャラを特定できないため、
ブックマークレットと同じ「英語併記」の扱いになる。

## スキーマ

```json
{
  "en": "Morale",
  "ja": "士気",
  "confidence": "confirmed",
  "source": "確認したURL",
  "note": "任意。guess の場合は根拠を必ず記載",
  "character": "任意。キャラ固有のカード名・固有バフの場合のみキャラ名（Prydwen の英語表記）。共通用語には付与しない"
}
```

`character` は 2026-08-06 にキャラ固有カード追加作業のため新設。既存の共通用語エントリには遡って付与していない。

**`en` / `ja` は原則ユニークだが、`character` が全エントリで異なる場合のみ
重複を許可する**（`scripts/sync.py` の `validate()` が機械的にチェック）。
同名カードが複数キャラに存在するケース向け。`character` が空のエントリ
（共通用語）を含む重複は許可されない。

### confidence の値

| 値 | 意味 |
|---|---|
| `confirmed` | **Prydwen のページで実際に使われている語**であることを確認したもの |
| `guess` | 確認は未了。語感・見た目・文脈からの推測。`note` に根拠を必ず書く |
| `unmatched` | 片側のみ確認。対応語が特定できていない |

`unmatched` は双方向に使う。`en` が空欄なら日本語側のみ確認、`ja` が空欄なら
英語側のみ確認。**両方が空になることはない。**

`confirmed` と `guess` は `en` / `ja` の両方が埋まっている必要がある。

## 判定基準

**`confirmed` の条件は「Prydwen のページで実際に使われている語であること」。
他サイトの訳語は根拠として採用しない。**

理由: サイト間で訳語が異なるため。

| 日本語 | 他サイト | Prydwen |
|---|---|---|
| 不屈 | Indomitability | **Fortitude** |
| ヒラメキ | Flash of Insight | **Epiphany** |

他サイトの訳語をそのまま採用すると、この対応表は Prydwen を読むときの
参照として機能しなくなる。他サイトで見つけた語は `guess` 止まりとし、
`note` に出どころを書く。

**Prydwen のページを直接取得できない場合、検索スニペット経由での確認も可。**
セッションの egress ポリシーにより `www.prydwen.gg` への直接フェッチが
拒否されることがある。その場合、検索エンジン経由でページ本文を引用する
スニペット（例: `site:prydwen.gg` 検索でヒットする引用テキスト）で語の
実在と効果説明を確認してもよい。ただし直接ページを読んだ確認ではないため、
`meta.provenance` にその旨（アクセス方法・確認したクエリの傾向）を記録すること。

**推測を `confirmed` にしないこと。** 自分で確認していないものは、
どれだけもっともらしくても `confirmed` にしない。

## 出典

- 英語: https://www.prydwen.gg/chaos-zero-nightmare/
  - [用語辞典](https://www.prydwen.gg/chaos-zero-nightmare/guides/effects-dictionary) — 効果用語
  - [Combat Explained](https://www.prydwen.gg/chaos-zero-nightmare/guides/combat-explained) — 戦闘システム用語
- 日本語: https://gamerch.com/chaoszeronightmare/947128 （状態異常・バフデバフ一覧）

## 現在の状態: 未完成

| confidence | 件数 |
|---|---|
| `confirmed` | 340 |
| `guess` | 3 |
| `unmatched` | 109 （日本語のみ 104 / 英語のみ 5） |
| **合計** | **452** |

### キャラ固有カード追加の進捗

全35キャラのカード名・固有バフの追加が完了（2026-08-06）。
Prydwen の該当キャラページと gamerch の該当キャラページを突き合わせ、
効果説明が一致する語のみ `confirmed` として `glossary.json` の
`meta.character_progress` に進捗を記録している。ゲーム内確認が必要な語は
`docs/todo-ingame.md` にチェックリストとして集約している（104件）。

- 完了（35/35）: Tenebria, Luke, Hilde, Fei, Adelheid, Heidemarie,
  Diana, Rita, Tiphera, Nine, Narja, Sereniel, Chizuru, Yuki, Haru, Veronica,
  Khalipe, Magna, Rin, Orlea, Mei Lin, Renoa, Hugo, Kayron, Beryl, Maribell,
  Owen, Rei, Selena, Lucas, Cassius, Nia, Mika, Amir, Tressa

日本語一覧 48 件のうち 41 件は Prydwen の用語辞典と突き合わせ済み。
残り 7 件は辞典に未収載のため未解決。これに一覧外の用語（戦闘システム用語、
キャラ固有用語、英語側のみ判明した用語）を個別に追加している。

### データの出どころ

- **日本語 48 件** — ユーザーが gamerch の状態異常・バフデバフ一覧
  （**2026/04/14 時点**）から転記して提供したもの。
- **英語対応 41 件** — ユーザーが Prydwen の用語辞典の効果説明文と
  突き合わせて確認し、提供したもの。
- **`ストレス`** — 効果ではなく戦闘システムのため用語辞典には未収載。
  Combat Explained ガイド本文で `Stress` / `Mental Breakdown` として
  使われていることを確認済み。
- **用語辞典から追加 4 件** — `基本カード` / `戦闘員` / `墓地` / `強靭度`。
- **キャラ固有用語 15 件** —
  [Hilde のキャラページ](https://www.prydwen.gg/chaos-zero-nightmare/characters/hilde)
  で確認（`出撃` / `大亀裂` / `ダブルタップ` / `ヒラメキ` / `感応発動` ほか）。
- **サイト共通 2 件** — `共用カード` / `パートナー`。
- **英語のみ 4 件**（`Streak` / `Find the Gap` / `Piercing Damage` /
  `Potential`）— Prydwen 側の表記のみ判明。対応する日本語が未特定。

`ヒラメキ` は日本語側の「状態異常・バフデバフ一覧」に無いが、これはカテゴリが
異なるだけで、Prydwen の各キャラページで `Epiphany Cards` として常用されている
ため判定基準を満たす。

この作業を行ったセッションでは egress ポリシーにより `gamerch.com` および
`www.prydwen.gg` への接続が拒否され（CONNECT に 403）、出典ページを直接読んだ
検証は行っていない。**`confirmed` の根拠はすべてユーザーによる確認。**

## 既知の欠落

- **日本語一覧は 2026/04/14 時点のもので、シーズン4以降の用語を網羅していない。**
  `点火` のみ `guess` で暫定登録。最新シーズンの用語を追う場合は
  出典ページを再取得して差分を追加すること。
- **英語表記が未特定の 7 件** — 日本語側のみ確認済み。
  - `気絶` / `挑発` / `隠蔽` / `毒` / `氷結` / `妄想` —
    いずれも敵が付与する状態異常系で、用語辞典に未収載。
    （`氷結` はマグナのキャラページで彼女自身が敵に付与する `Freeze` の用例が
    見つかったが、向きが逆で同一語か未確定のため保留）
  - `欲望カード` — Prydwen での使用を確認できず。Game8 では `Desire Cards`
    と表記されているが、**他サイトの訳語は採用しない**（上記「判定基準」）
    ため空欄のまま。Prydwen 側の表記が判明したら復帰させる。
- **日本語表記が未特定の 4 件** — `Streak` / `Find the Gap` /
  `Piercing Damage` / `Potential`。出典ページを個別に特定できていないため
  `source` はサイトルートを指している。
- **キャラ固有バフは網羅していない。** 収録済みのものは Hilde のページ由来。
  他のキャラページを順に当たって拾う必要がある。
- **`点火` は `guess`** — ヒルデのページの `Plasma Rain IV` に `[Ignition]` タグ
  として存在することは確認済みだが、日本語の点火との効果説明の突き合わせが未了。
- 収録語は日本語一覧 48 件と一致しない。一覧外の用語（`ストレス`、
  キャラ固有用語、英語のみの用語）を含み、`欲望カード` のように一覧に
  無いものもあるため。

## 修正履歴

- `不屈` の英語は `Indomitability` ではなく **`Fortitude`**（用語辞典で確認）。
- `クリスタライズ` を `confirmed`（`Crystallize`）から `unmatched` に降格。
- `欲望カード` を `confirmed`（`Desire Card`）から `unmatched` に降格。
  Prydwen での使用が未確認のため。
- `クリスタライズ` を `unmatched` から `confirmed`（`Crystallization`）に復帰
  （2026-08-06）。効果辞典には未収載だが、マグナのキャラページで実際の使用と
  効果説明の一致を確認できたため。判定基準は「Prydwen のページで実際に
  使われている語」であり効果辞典限定ではない。

## 検索ページの公開（GitHub Pages）

`docs/index.html` を GitHub Pages で公開する手順。

1. GitHub でこのリポジトリを開く
2. **Settings** → 左サイドバーの **Pages**
3. **Build and deployment** の **Source** で **Deploy from a branch** を選ぶ
4. **Branch** で公開したいブランチ（`main` など）を選び、
   隣のフォルダ選択で **`/docs`** を選ぶ
5. **Save**

1〜2 分で `https://<ユーザー名>.github.io/czn-glossary/` に公開される。
URL は Pages 設定画面の上部にも表示される。

### 注意

- **公開範囲** — Public リポジトリなら誰でも閲覧できる。Private の場合、
  Pages の公開は GitHub の有料プランが必要。
- **`/docs` を選ぶこと** — `/(root)` を選ぶと `docs/index.html` が
  トップページにならない。
- **`docs/glossary.json` が必要** — Pages は `docs/` 配下しか配信しないため、
  ルートの `glossary.json` は検索ページから読めない。`scripts/sync.py` が
  作るコピーをコミットに含めること。含め忘れると、ページは表示されるが
  「glossary.json を読み込めませんでした」と出る。
- **反映されないとき** — Pages はビルドに数分かかることがある。
  Actions タブの `pages build and deployment` の完了を待つ。
  それでも古い内容が出る場合はブラウザのキャッシュを疑う。

### ローカルで確認する

`file://` で直接開くとブラウザの制限で `glossary.json` を読み込めない。
簡易サーバー経由で開くこと:

```sh
python3 scripts/sync.py
python3 -m http.server 8000
# http://localhost:8000/docs/
```

## 残作業

1. 英語表記が未特定の 7 件を、用語辞典以外のページ（敵情報ページ、
   カード関連ガイド等）で特定する
2. 日本語表記が未特定の 4 件を日本語側ソースで特定し、あわせて
   `source` を実際の出典ページに絞り込む
3. `点火` の効果説明を突き合わせ、`guess` から `confirmed` に上げる
4. `高速斬り`（ユキ）を `Flash Slash` か `Rapid Slash` か確定させる
5. シーズン4以降の用語を日本語ページから追加する
6. `docs/todo-ingame.md` の104件（全キャラのカード名・固有バフのうち
   片側のみ確認できたもの）をゲーム内で確認し、確定できたものから
   `glossary.json` へ反映する

いずれも、Prydwen のページで実際に使われていることを確認していないものを
`confirmed` にしないこと。
