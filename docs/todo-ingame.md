# ゲーム内確認が必要な語 (todo-ingame)

`glossary.json` でキャラ固有カード・固有バフとして登録したが、`site:prydwen.gg`
検索では英語名を特定できず `unmatched`（日本語のみ）のまま残っている語の一覧。

検索エンジンのインデックス漏れの可能性が高く、Prydwen に用語自体が存在しない
とは限らない。実際にゲーム内（または Prydwen ページの直接閲覧）で該当カード・
バフを確認できたら、`glossary.json` の対応エントリに `en` を追記し、
`confidence` を `confirmed` に変更した上で `python scripts/sync.py` を実行すること。

使い方: 上から順にチェックする必要はない。手元で確認できたものから
`glossary.json` を直接編集してよい。確認後はこのファイルから該当行を削除する。

## Luke（ルーク）

- [ ] **機会捕捉** — 固有カード。主導、シールドと弾丸に加算バフ付与。
  (source: https://gamerch.com/chaoszeronightmare/942020)
- [ ] **魔眼の乱舞** — 固有カード。使用済み弾丸カード数に応じてヒット数追加。
  (source: https://gamerch.com/chaoszeronightmare/942020)
- [ ] **必殺弾** — 固有カード。ハンドガン弾丸5枚使用で使用可能になる500%ダメージの必殺技。
  Prydwenでは「Unique」「Bullet」タグの組み合わせとしてのみ言及されており、
  固有の英語カード名が見当たらなかった。
  (source: https://gamerch.com/chaoszeronightmare/942020)

## Fei（フェイ）

- [ ] **炎舞舞曲** — 固有カード。消滅/唯一。コスト0で降臨数に応じて炎舞曲を手札に移動。
  (source: https://gamerch.com/chaoszeronightmare/995382)

## Adelheid（アーデルハイト）

- [ ] **童話の中のお友だち** — 固有カード。ワンちゃんまたはクマさんを選択して1枚生成。
  (source: https://gamerch.com/chaoszeronightmare/986739)
- [ ] **物語の真実** — 固有カード。防御依存ダメージ+被ダメ量アップ、対象敵へのダメージ加算100%バフ。
  (source: https://gamerch.com/chaoszeronightmare/986739)
- [ ] **夢の幸せ** — 固有バフ。祝福を付与または生成した数に応じて獲得。味方のダメージ量3%増加、最大10重複。
  (source: https://gamerch.com/chaoszeronightmare/986739)

## Heidemarie（ハイデマリ）

- [ ] **一筋の光** — 固有カード。1コストの単体攻撃。手札の連結数に応じて倍率が上がる。
  (source: https://gamerch.com/chaoszeronightmare/983591)
- [ ] **極光展開** — 固有カード。2コストで極光剣2枚生成。1ターンの間、極光剣に加算バフも入る。
  (source: https://gamerch.com/chaoszeronightmare/983591)
- [ ] **極光凝縮** — 固有カード。3回墓地へ移動させると極光解放に変化するカード。
  (source: https://gamerch.com/chaoszeronightmare/983591)

## Rita（リタ）

- [ ] **記録者** — 固有カード。使用したコストに応じて時間記録を獲得。ターン開始時に時間超越に変化。
  (source: https://gamerch.com/chaoszeronightmare/972157)
- [ ] **栄光の時間** — エゴスキル。EP5で時間超越6と次に使用する自分の攻撃に乗算バフを付与。
  (source: https://gamerch.com/chaoszeronightmare/972157)

## Tiphera（ティペラ）

- [ ] **調律** — 固有バフ候補。創造と破壊などの効果を2倍にする。Prydwenの英語版で
  「Attunement」はテネブレア/ハイデマリの文脈でのみ言及が見つかり、ティペラの
  調律に対応するか確認できなかったため、未対応のまま。
  (source: https://gamerch.com/chaoszeronightmare/966320)
- [ ] **図形：〇△□** — 2凸以降専用カード。3種図形効果が重複時に生成。治癒150%、
  ダメ30%増加、ドロー1の複合効果。
  (source: https://gamerch.com/chaoszeronightmare/966320)

## Chizuru（チズル）

- [ ] **拘束** — 黄昏の結束がターン開始時に付与する効果候補。Prydwenの説明では
  単純な「コスト減少」としてのみ言及されており、拘束という独立した英語
  キーワードが存在するか確認できなかった。既存の『結束』(Bind)とは別の
  日本語表記のため、混同しないよう別エントリとした。
  (source: https://gamerch.com/chaoszeronightmare/952183)
- [ ] **霊魂の保護** — 開始時基本シールドカード。Prydwenでは「Chizuru's basic
  shield」とだけ言及され、固有の英語カード名を特定できなかった。
  (source: https://gamerch.com/chaoszeronightmare/952183)

## Yuki（ユキ）

- [ ] **高速斬り** — 開始時基本攻撃カード。Prydwenの検索スニペットで『Flash
  Slash』と『Rapid Slash』の両方がユキの基本攻撃カードとして言及されており、
  どちらが高速斬りに対応するか一意に確定できなかった（`guess` として
  `en: "Flash Slash"` で暫定登録済み）。ゲーム内で実際のカード名を確認すること。
  (source: https://gamerch.com/chaoszeronightmare/949615)
- [ ] **盗み斬り** — 固有カード。コスト2全体攻撃。インスピレーション時にコスト減少。
  (source: https://gamerch.com/chaoszeronightmare/987128)
- [ ] **制圧準備** — 開始カード。ドロー効果とバフを提供。
  (source: https://gamerch.com/chaoszeronightmare/949615)

## Haru（ハル）

- [ ] **アンカー** — 開始時基本攻撃カード。
  (source: https://gamerch.com/chaoszeronightmare/946994)
- [ ] **パワーアンカー** — 開始時基本攻撃カード。
  (source: https://gamerch.com/chaoszeronightmare/946994)
- [ ] **アンカードロップ** — 開始時基本カード（防御・サポート機能）。
  (source: https://gamerch.com/chaoszeronightmare/946994)

## Veronica（ベロニカ）

- [x] ~~速射弾~~ — 2026-08-06、character 違いの en/ja 重複を許可するルール
  追加に伴い `confirmed`（`Rapid Fire`, character: Veronica）として解決済み。
- [ ] **金琥花の幻想** — 開始時基本カード（詳細効果はgamerch側に記載なし）。
  (source: https://gamerch.com/chaoszeronightmare/941895)
- [ ] **息抜き** — 固有カード。シールド付与と他キャラカードのドロー2枚。
  (source: https://gamerch.com/chaoszeronightmare/941895)
- [ ] **爆撃準備** — 固有カード。装填バフの最大数を4にする。
  (source: https://gamerch.com/chaoszeronightmare/941895)
- [ ] **狩りの時間** — 固有カード。全体貫通ダメージと装填最大まで得られる。
  (source: https://gamerch.com/chaoszeronightmare/941895)
- [ ] **超小型バリスタ** — バリスタの派生カード。スキルカード3枚使用で生成が追加される。
  (source: https://gamerch.com/chaoszeronightmare/941895)

## Khalipe（カリーペ）

- [ ] **威圧** — 固有カード。コスト2で高倍率のシールド付与と敵全体に強靭度ダメージ1。
  (source: https://gamerch.com/chaoszeronightmare/942021)
- [ ] **再集結** — 固有カード。シールド付与と最高コストカードを1枚ドロー。バルチャー射出をサーチ可能。
  (source: https://gamerch.com/chaoszeronightmare/942021)
- [ ] **全弾発射** — 固有カード（詳細不明）。
  (source: https://gamerch.com/chaoszeronightmare/942021)
- [ ] **決意のカリスマ** — エゴスキル。敵全体に防御依存ダメージを与え、バルチャー射出を1枚生成。
  効果の一致するPrydwen記述は見つかったが、スキル名自体の引用が得られなかった。
  (source: https://gamerch.com/chaoszeronightmare/942021)
- [ ] **ムチ打ち** — 開始時基本攻撃カード。
  (source: https://gamerch.com/chaoszeronightmare/942021)
- [ ] **ティールの誓い** — 開始時基本シールドカード。
  (source: https://gamerch.com/chaoszeronightmare/942021)

## Rin（リン）

- [ ] **守護** — 開始時基本シールドカード。Prydwenでは「Rin's basic shield is
  completely standard」とだけ言及され、固有の英語カード名を特定できなかった。
  (source: https://gamerch.com/chaoszeronightmare/942023)
- [ ] **黒雲の心法** — 固有カード。主導、1ターン黒雲態勢を保存。効果説明の一致は
  見つかったが（「retain Dark Mist Stance for 1 turn, +80% Damage Amount」）、
  カード名自体の引用が得られなかった。
  (source: https://gamerch.com/chaoszeronightmare/942023)
- [ ] **黒雲剣法** — 固有効果系統（黒雲態勢獲得カードから発動する効果系統の総称）。
  (source: https://gamerch.com/chaoszeronightmare/942023)

## Orlea（オルレア）

- [ ] **攻撃だ、みんな** — 開始時基本攻撃カード（2枚）。Prydwenでは「Orlea's
  Basic Attack Card isn't notable」とだけ言及され、固有の英語カード名を
  特定できなかった。
  (source: https://gamerch.com/chaoszeronightmare/942024)
- [ ] **光の治癒** — 開始時基本治癒カード（1枚）。
  (source: https://gamerch.com/chaoszeronightmare/942024)

## Mei Lin（メイリン）

- [ ] **昇龍脚** — メイン主力攻撃カード。効果説明の一致は見つかったが
  （「1-Cost Attack Card...applies 2 Ember stacks, Combo effect hits twice」）、
  カード名自体の引用が得られなかった。
  (source: https://gamerch.com/chaoszeronightmare/942025)
- [ ] **火龍驚天** — 固有カード（属性を無視できる弱点攻撃持ち+倍率300%）。
  Prydwenに『Flame Dragon's Sovereignty』という似た語があったが、そちらは
  「Ravaged対象へのクリティカル確定」という別の効果として言及されており、
  gamerchの説明（属性無視+300%）と一致しないため対応付けを見送った。
  同一カードの可能性はあるが要ゲーム内確認。
  (source: https://gamerch.com/chaoszeronightmare/942025)
- [ ] **火龍昇天** — エゴスキル（基本攻撃カードのヒット数1回追加を4回まで付与）。
  効果説明の一致は見つかったが（「costing 6 EP...doubles the hit count of
  her next 4 Basic Attacks」）、スキル名自体の引用が得られなかった。
  (source: https://gamerch.com/chaoszeronightmare/942025)
- [ ] **一撃** — 開始時基本攻撃カード（2枚）。
  (source: https://gamerch.com/chaoszeronightmare/942025)
- [ ] **火龍護身** — 開始時基本シールドカード（1枚）。
  (source: https://gamerch.com/chaoszeronightmare/942025)

## Narja（ナージャ）

- [ ] **捕食者の狩猟法** — エゴスキル（EP5で貪食10と単体に防御依存ダメージ、
  墓地に完全な食事があると捕食5も獲得）。
  (source: https://gamerch.com/chaoszeronightmare/957728)
- [ ] **NA：攻撃反応** — 開始時基本攻撃カード。
  (source: https://gamerch.com/chaoszeronightmare/957728)
- [ ] **NA：保護反応** — 開始時基本防御・治癒カード（2枚）。
  (source: https://gamerch.com/chaoszeronightmare/957728)

## Nine（ナイン）

- [ ] **会心の一撃** — 固有カード。防御依存ダメージ、手札の消滅カードを消滅しコストに応じてダメージ増加。
  (source: https://gamerch.com/chaoszeronightmare/958782)
- [ ] **逆転の刃** — 固有カード。シールド獲得時に刃研ぎを付与できる強化カード。
  (source: https://gamerch.com/chaoszeronightmare/958782)
- [ ] **隙突き** — エゴ発現限定カード。2凸以降に開幕から手札に入る。消滅2だが脆弱1と強靭度ダメージ1を付与。
  (source: https://gamerch.com/chaoszeronightmare/958782)
- [ ] **臨機応変** — 固有バフ。攻撃カード防御依存ダメージ量+50%、最大3重複。
  (source: https://gamerch.com/chaoszeronightmare/958782)
- [ ] **刀背受け** — 開始時基本シールドカード。
  (source: https://gamerch.com/chaoszeronightmare/958782)
