# カオスゼロナイトメア 英日用語対応表

Chaos Zero Nightmare の状態異常・バフ・デバフ用語の英日対応表。

## ファイル

- `glossary.json` — 用語対応表本体

## スキーマ

```json
{
  "en": "Morale",
  "ja": "士気",
  "confidence": "confirmed",
  "source": "確認したURL",
  "note": "任意。guess の場合は根拠を必ず記載"
}
```

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
| `confirmed` | 45 |
| `guess` | 1 |
| `unmatched` | 13 （日本語のみ 8 / 英語のみ 5） |
| **合計** | **59** |

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
- **キャラ固有用語 3 件**（`出撃` / `大亀裂` / `ダブルタップ`）—
  [Hilde のキャラページ](https://www.prydwen.gg/chaos-zero-nightmare/characters/hilde)
  で確認。
- **英語のみ 5 件**（`Streak` / `Find the Gap` / `Piercing Damage` /
  `Manifest Ego` / `Potential`）— Prydwen 側の表記のみ判明。対応する日本語が未特定。

この作業を行ったセッションでは egress ポリシーにより `gamerch.com` および
`www.prydwen.gg` への接続が拒否され（CONNECT に 403）、出典ページを直接読んだ
検証は行っていない。**`confirmed` の根拠はすべてユーザーによる確認。**

## 既知の欠落

- **日本語一覧は 2026/04/14 時点のもので、シーズン4以降の用語を網羅していない。**
  `点火` のみ `guess` で暫定登録。最新シーズンの用語を追う場合は
  出典ページを再取得して差分を追加すること。
- **英語表記が未特定の 8 件** — 日本語側のみ確認済み。
  - `気絶` / `挑発` / `隠蔽` / `毒` / `氷結` / `妄想` / `クリスタライズ` —
    いずれも敵が付与する状態異常系で、用語辞典に未収載。
  - `欲望カード` — Prydwen での使用を確認できず。Game8 では `Desire Cards`
    と表記されているが、**他サイトの訳語は採用しない**（上記「判定基準」）
    ため空欄のまま。Prydwen 側の表記が判明したら復帰させる。
- **日本語表記が未特定の 5 件** — `Streak` / `Find the Gap` /
  `Piercing Damage` / `Manifest Ego` / `Potential`。出典ページを個別に
  特定できていないため `source` はサイトルートを指している。
- **`点火` は `guess`** — カードタグ `[Ignition]` としての存在は確認済みだが、
  効果説明の突き合わせが未了。ゲーム内で要確認。
- 収録語は日本語一覧 48 件と一致しない。一覧外の用語（`ストレス`、
  キャラ固有用語、英語のみの用語）を含み、`欲望カード` のように一覧に
  無いものもあるため。

## 修正履歴

- `不屈` の英語は `Indomitability` ではなく **`Fortitude`**（用語辞典で確認）。
- `クリスタライズ` を `confirmed`（`Crystallize`）から `unmatched` に降格。
- `欲望カード` を `confirmed`（`Desire Card`）から `unmatched` に降格。
  Prydwen での使用が未確認のため。

## 残作業

1. 英語表記が未特定の 8 件を、用語辞典以外のページ（敵情報ページ、
   カード関連ガイド等）で特定する
2. 日本語表記が未特定の 5 件を日本語側ソースで特定し、あわせて
   `source` を実際の出典ページに絞り込む
3. `点火` の効果説明を突き合わせ、`guess` から `confirmed` に上げる
4. シーズン4以降の用語を日本語ページから追加する

いずれも、Prydwen のページで実際に使われていることを確認していないものを
`confirmed` にしないこと。
