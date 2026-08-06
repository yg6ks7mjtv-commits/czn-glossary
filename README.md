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
| `confirmed` | 英語ページと日本語ページの**効果説明文を突き合わせて一致を確認**したもの |
| `guess` | 説明文の一致は未確認。語感・見た目・文脈からの推測。`note` に根拠を必ず書く |
| `unmatched` | 日本語側のみ確認。対応する英語用語が特定できていない（`en` は空欄） |

**推測を `confirmed` にしないこと。** 説明文の一致を自分で確認していないものは、
どれだけもっともらしくても `guess` 止まりにする。

## 出典

- 英語: https://www.prydwen.gg/chaos-zero-nightmare/
- 日本語: https://gamerch.com/chaoszeronightmare/947128 （状態異常・バフデバフ一覧）

## 現在の状態: 未完成

収録済みは 12 件のみ。日本語側の用語の全件抽出と、Prydwen との突き合わせは**未実施**。

理由: この作業を行ったセッションの実行環境では egress ポリシーにより
`gamerch.com` および `www.prydwen.gg` への接続が拒否され（CONNECT に 403）、
どちらの出典ページも取得できなかった。許可されていたのは GitHub と
パッケージレジストリのみ。

収録済み 12 件はユーザーから事前確認済みとして提供されたもので、
`source` は URL ではなく `user-verified` としてある。出典ページに
アクセスできる環境で再検証し、実際に確認した URL に置き換えること。

### 残作業

1. 日本語ページから状態異常・バフデバフ用語を全件抽出する
2. Prydwen の各ページを読み、効果の説明文が一致する英語用語を対応させる
3. 一致を確認できたものを `confirmed`、推測は `guess` + `note`、
   見つからないものは `en` 空欄で `unmatched` として追記する
