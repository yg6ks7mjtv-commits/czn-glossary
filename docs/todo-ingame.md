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

## Renoa（レノア）

- [ ] **決死の一撃** — 固有カード。手札の鎮魂の弾丸を全て破棄してダメージ。保存効果付き。
  (source: https://gamerch.com/chaoszeronightmare/942026)
- [ ] **鎮魂の弾丸：終焉** — 2凸効果で生成される強化版弾丸。
  (source: https://gamerch.com/chaoszeronightmare/942026)
- [ ] **黒いトゲ** — カード（山札と墓地の鎮魂の弾丸を手札に移動させる単体攻撃）。
  (source: https://gamerch.com/chaoszeronightmare/942026)
- [ ] **殲滅射撃** — 開始時基本攻撃カード。
  (source: https://gamerch.com/chaoszeronightmare/942026)
- [ ] **黒い帳** — 開始時基本シールドカード。
  (source: https://gamerch.com/chaoszeronightmare/942026)
- [ ] **エゴスキル（無名）** — レノアのエゴスキル本体（手札と墓地にある鎮魂の弾丸を
  全て手札に持ってくる）。Prydwenでは『Requiem』という候補が見つかったが、
  gamerch側にスキル名の記載がなく ja が特定できないため未登録。ゲーム内で
  日本語名を確認したら、en=Requiem, character=Renoa で新規登録すること。
  (source: https://gamerch.com/chaoszeronightmare/942026)

## Hugo（ヒューゴ）

- [ ] **ナイフ投げ** — 開始時基本攻撃カード（2枚）。Prydwenでは「Hugo's Basic
  Attack」とだけ言及され、固有の英語カード名を特定できなかった。
  (source: https://gamerch.com/chaoszeronightmare/942027)
- [ ] **ナイフ投擲** — 固有カード。ランダムな敵に攻撃×3 + 対象数分の狩猟の開始獲得。
  (source: https://gamerch.com/chaoszeronightmare/942027)
- [ ] **早い解決方法** — 固有カード。コスト1で単体攻撃 + 狩猟の開始状態で攻撃カード1枚ドロー。
  (source: https://gamerch.com/chaoszeronightmare/942027)
- [ ] **万事屋のやり方** — 固有カード。狩猟の開始による追加攻撃のダメージ量が40%増加。
  Prydwenに『Fixer's Approach』という似た語があったが、効果説明（40%×2の
  別ダメージ）が一致しないため対応付けを見送った。
  (source: https://gamerch.com/chaoszeronightmare/942027)
- [ ] **最終解決手段** — エゴスキル。EP6で全体ダメージ + 狩猟の開始へのバフ（乗算30%）。
  (source: https://gamerch.com/chaoszeronightmare/942027)
- [ ] **万事屋の憤怒** — 固有バフ。ダメージ量+10%、最大4重複。
  (source: https://gamerch.com/chaoszeronightmare/942027)
- [ ] **狩猟の証** — 固有バフ。狩猟の開始効果でヒット時、士気2を獲得。
  (source: https://gamerch.com/chaoszeronightmare/942027)

## Kayron（カイロン）

- [ ] **虚無の残像** — 固有カード。コスト1の単体攻撃+虚無2枚生成が基本効果。
  (source: https://gamerch.com/chaoszeronightmare/942028)
- [ ] **無憾の鼓動** — 固有カード。虚無3枚生成して高倍率の単体攻撃を実行。
  (source: https://gamerch.com/chaoszeronightmare/942028)
- [ ] **無の亀裂** — エゴスキル。手札の虚無を消滅させてその枚数に応じてダメージ増加。
  3凸で墓地も消滅対象に。効果の一致するPrydwen記述は見つかったが
  （「exhausts all Futility cards in hand to increase damage by 80% per card
  exhausted」「E3...extends to graveyard」）、スキル名自体の引用が得られなかった。
  (source: https://gamerch.com/chaoszeronightmare/942028)
- [ ] **滅** — 開始時基本攻撃カード（2枚）。
  (source: https://gamerch.com/chaoszeronightmare/942028)
- [ ] **救** — 開始時基本回復カード。
  (source: https://gamerch.com/chaoszeronightmare/942028)

## Beryl（ベリル）

- [ ] **最大出力チャージ弾** — エゴスキル。EP5で全体攻撃するエゴスキル。
  追加効果なく全体攻撃のみ。効果の一致するPrydwen記述は見つかったが
  （「Ego skill costs 5 EP and does a large amount of AoE damage」）、
  スキル名自体の引用が得られなかった。
  (source: https://gamerch.com/chaoszeronightmare/942029)

## Maribell（マリベル）

- [ ] **猪突猛進** — 固有カード。防御依存攻撃+ダメージ依存シールド、反撃1付与。粉砕効果あり。
  (source: https://gamerch.com/chaoszeronightmare/942034)
- [ ] **マリベルシェルターMK.Ⅱ** — 固有カード。防御依存攻撃とダメージ分の固定シールド獲得。
  (source: https://gamerch.com/chaoszeronightmare/942034)
- [ ] **ウルブスドーム** — 固有カード。反撃2、クリスタライズ2と毎ターン反撃1獲得。
  (source: https://gamerch.com/chaoszeronightmare/942034)
- [ ] **あーそうなんだ** — 固有カード。シールドと反撃獲得、敵全体に弱体化を付与。
  (source: https://gamerch.com/chaoszeronightmare/942034)
- [ ] **シェルターストライク** — 固有カード。シールドに依存した固定ダメージを与える。
  (source: https://gamerch.com/chaoszeronightmare/942034)
- [ ] **アンブレイカブル** — エゴスキル。シールドを付与するエゴスキル。350%と高倍率。
  `Unbreakable` である可能性が高いが引用は得られず。
  (source: https://gamerch.com/chaoszeronightmare/942034)

## Owen（オーウェン）

- [ ] **打ち下ろし** — 開始時基本攻撃カード。
  (source: https://gamerch.com/chaoszeronightmare/942030)
- [ ] **武器防ぎ** — 開始時基本シールドカード。
  (source: https://gamerch.com/chaoszeronightmare/942030)
- [ ] **風乗り** — 固有カード。シールド付与と捨て札のウィンドチャージをサーチ。
  (source: https://gamerch.com/chaoszeronightmare/942030)
- [ ] **見破り2** — 固有バフ（ダイス効果として付与されるもの）。
  (source: https://gamerch.com/chaoszeronightmare/942030)
- [ ] **論理の喪失** — 固有バフ。クレジット減少時にストレス1増加。
  (source: https://gamerch.com/chaoszeronightmare/942030)

## Rei（レイ）

- [ ] **おやつの時間** — 固有カード。高い治癒量とドロー効果。使用時は消滅する使い切りカード。
  WebSearchの利用上限到達によりPrydwen側の確認ができなかった。
  (source: https://gamerch.com/chaoszeronightmare/942031)
- [ ] **最後の暗影** — エゴスキル。単体攻撃+AP1獲得できるスキル。EP4と低コスト。
  WebSearchの利用上限到達によりPrydwen側の確認ができなかった。
  (source: https://gamerch.com/chaoszeronightmare/942031)

## Selena（セレーナ）

- [ ] **緊急遮蔽** — 開始時基本シールドカード。
  (source: https://gamerch.com/chaoszeronightmare/942032)
- [ ] **目標捕捉** — 固有カード。単体ダメージと感応で標識を付与。ヒラメキで標識付与効果が強化される。
  (source: https://gamerch.com/chaoszeronightmare/942032)
- [ ] **ラストショット** — エゴスキル。単体ダメージと標識を付与。追加で標識を付与でき、
  アタッカー行動前に使用推奨。
  (source: https://gamerch.com/chaoszeronightmare/942032)

## Lucas（ルーカス）

- [ ] **防護焼夷弾** — 開始時基本シールドカード。
  (source: https://gamerch.com/chaoszeronightmare/942033)
- [ ] **S.S.S** — 固有カード。単体攻撃と弾丸バフを付与。単体攻撃は倍率も低く
  1ターン付与される弾丸バフが本体。英数字の略称のため検索で有効な結果が得られなかった。
  (source: https://gamerch.com/chaoszeronightmare/942033)
- [ ] **R.P.G-7** — 固有カード。弾丸カード消滅時、敵全体に固定ダメージを与える。
  英数字の略称のため検索で有効な結果が得られなかった。
  (source: https://gamerch.com/chaoszeronightmare/942033)

## Cassius（カシウス）

- [ ] **デストリック** — エゴスキル。クエストカード2枚生成、敵に1ターン士気-3を
  付与するエゴスキル。効果の一致するPrydwen記述は見つかったが
  （「decreases Morale of all enemies by 3 for 1 turn」）、スキル名自体の
  引用が得られなかった。
  (source: https://gamerch.com/chaoszeronightmare/942039)

## Nia（ニア）

- [ ] **ストローク** — 開始時基本攻撃カード。
  (source: https://gamerch.com/chaoszeronightmare/942038)
- [ ] **ソウルリーフ** — 固有カード。治癒と1ターン、カード破棄時にデシベル+弾力追加。
  Prydwenの検索結果に『Soul Rip』という類似語が見つかったが、AIによる要約自体が
  『Soul Leaf』との表記揺れを指摘しており、確証が得られなかった。
  (source: https://gamerch.com/chaoszeronightmare/942038)
- [ ] **理性攪乱** — パッシブ効果。戦闘終了時のHPが戦闘開始時より高い場合、ストレス1増加。
  (source: https://gamerch.com/chaoszeronightmare/942038)

## Mika（ミカ）

- [ ] **水の矢** — 開始時基本攻撃カード（1枚）。
  (source: https://gamerch.com/chaoszeronightmare/942037)
- [ ] **激流** — エゴスキル。消滅のついた水の根源を2枚生成、HP回復とAP2獲得を実行。
  効果の一致するPrydwen記述は見つかったが（「equivalent to gaining 2 AP
  immediately while also delivering some nice heals」）、スキル名自体の
  引用が得られなかった。
  (source: https://gamerch.com/chaoszeronightmare/942037)

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
