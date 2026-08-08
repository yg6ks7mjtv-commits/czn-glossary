# 作業ログ

このリポジトリでの作業を、完了のたびに追記する記録。事実（依頼内容・実施内容・件数・判定結果・未解決事項・コミットハッシュ）のみを記載し、感想・自己評価は書かない。

`effects-ja.json` の中身（効果文そのもの）は非公開データのため、このログにも書かない。件数や判定結果のような事実だけを記載する。

---

## 2026-08-07 13:27
- 依頼: 拡張機能のヒラメキ段階判定を、ローマ数字以外の表記（星・括弧付き固有名）にも対応させる
- 実施:
  - `stripLevelSuffix` に星（★の数）・括弧付き固有名の判定を追加
  - `extension/selectors.js` に `cardLevelNames` 対応表を新設
  - `glossary.json` のRenoaのカード名表記を修正
- 結果:
  - 星表記（Orlea「Softie」）: 汎用ロジックで対応、個別登録不要
  - 括弧付き固有名: 対応表に登録できたのは1キャラ・1カード・5段階（Nine「Hew」）
  - 括弧付き固有名で対応が取れなかったもの: 2キャラ・3カード（Hilde「Homing Arrow」2段階、Chizuru「Moonslash」1段階）
  - Renoaのカード名表記修正: 1件
- 未解決: Hilde「Homing Arrow」2段階、Chizuru「Moonslash」1段階の対応は未確定
- コミット: 8f9b1dc

## 2026-08-07 13:42
- 依頼: ブックマークレットを拡張機能と同じ方式に更新し、効果文の不足一覧（docs/coverage.md）を新規作成する
- 実施:
  - `docs/bookmarklet.js` を拡張機能と同じ確定セレクタ方式（`.chaos-card-inside`検出・カード名のレベル判定・カード内容域の監視）に全面書き換え
  - `docs/bookmarklet.html` の説明文を現状に合わせて更新
  - `docs/coverage.md` を新規作成（カード名とlevel番号のみ、効果文自体は非記載）
- 結果:
  - ブックマークレット: `extension/` 配下は無変更。ビルド時の不具合（行頭以外の`//`コメントが1行結合時に後続コードを丸ごとコメントアウトする）を1件発見・修正
  - 効果文不足一覧: 27キャラ・100カードに不足level（`source`が`gamerch`のみ、または未登録）を検出
- 未解決: なし
- コミット: 4c837d0

## 2026-08-07 13:54
- 依頼: worklog.mdへの追記に加え、作業ごとにdocs/log/フォルダへ個別ファイルも作成する運用にする（ファイル名は日時、上書きせず新規作成、内容はworklog.mdの1件分と同じ）
- 実施:
  - docs/log/ フォルダを新設し、既存のworklog.md 2件分を個別ファイルとしてバックフィル
  - 以後、作業完了ごとにworklog.mdへの追記とdocs/log/への個別ファイル作成を両方行う運用を開始
- 結果:
  - docs/log/2026-08-07-1327.md, docs/log/2026-08-07-1342.md の2ファイルを作成
- 未解決: なし
- コミット: 31a84e8

## 2026-08-07 14:16
- 依頼: glossary.jsonのunmatched 109件を、カード名の類似ではなく効果文中の数値・タグの突き合わせで解決する。まずHeidemarie・Tenebriaの2キャラで検証し、精度確認後に残りのキャラへ展開する
- 実施:
  - Prydwenのキャラページをcurlで直接取得し、カードごと・レベルごとのタグ・数値を抽出するスクリプトを作成（一時ファイル、リポジトリには未追加）
  - Tenebriaはunmatchedのカードが0件だったため、判断としてNineに差し替えて検証（guess1件の「All Eyes On You」はカードではなくデバフ用語のため対象外）
  - Heidemarie・Nineで検証後、精度を確認できたためaosnsデータのある他キャラ（Luke, Khalipe, Magna, Rin, Rei, Fei, Tiphera, Lucas）にも展開
  - 判定基準通り、1段階でも数値・タグが食い違うものはguess、全段階一致のみconfirmed、比較対象データが無いものはunmatchedのまま維持
- 結果:
  - confirmed化: 4件（Nine「会心の一撃」「逆転の刃」、Khalipe「威圧」、Lucas「S.S.S」。全段階で数値・タグが完全一致）
  - guess化: 6件（Heidemarie「一筋の光」「極光展開」、Luke「機会捕捉」「魔眼の乱舞」、Khalipe「再集結」、Rei「おやつの時間」。いずれも一部の段階で数値差異あり）
  - unmatchedのまま: 99件（うち、名前の類似から候補はあったが数値検証で不一致が大きく確認を見送ったもの1件: Rin「黒雲の心法」）
  - glossary.jsonのcoverage: confirmed 341→345 / guess 3→9 / unmatched 109→99
- 未解決: Rin「黒雲の心法」は候補（Dark Mist Inner Art）はあるが数値の食い違いが大きく判定不能。Magna・Tenebriaはunmatchedカードが無く対象外。それ以外の24キャラはaosnsの数値データが無いため今回の方式では検証不能
- コミット: 5a0cdfc

## 2026-08-07 15:10
- 依頼: 神ヒラメキ等の追加行（.chaos-contentの基本効果以外の行）を日本語化する。全35キャラ分を収集し対訳表を作成、拡張機能・ブックマークレット両方に実装する。想定より種類が多い場合は実装前に停止して報告する
- 実施:
  - Prydwen全35キャラページ（curl取得済み・再利用）から、classに"divine"を含む要素（神ヒラメキボーナス行。"rules"のクラス制限表記・"epi"の別系統テキストとは別物と判明）のテキストを抽出・重複除去
  - 数値のみが異なる同型文を{N}変数としてテンプレート化し、docs/extra-lines.json（新規）を作成。既存glossary.jsonの確定語（Vulnerable=脆弱、Morale=士気、Resolve=決意、Initiation=開戦、Weakness Attack=弱点攻撃）と、effects-ja.json内で一貫して使われる基本語（Draw、AP）で翻訳できるものはconfidence:confirmedとした
  - 種類数が想定範囲内（9種類）だったため停止せず実装を継続。extension/content.js・docs/bookmarklet.jsそれぞれに、基本効果の書き換え（writeTarget/最初の子要素）とは別処理として、divine要素を対訳表と全文一致で照合し置き換える関数（insertDivineLines）を追加。confirmedのみをページに自動適用し、guessは対訳表に保持するのみで自動適用しない
- 結果:
  - 抽出件数: 63件（35キャラ延べ）/ ユニークなテンプレート種類: 9種類
  - 内訳: confirmed 8種類 / guess 1種類（「Treated as a Common Card / Draw {N} Common Card(s)」。Common Cardの訳語が辞書に無いため） / 未登録0件（全種類が翻訳または保留のいずれかに分類済み）
  - 参考: 同じ抽出方式で"rules"（クラス制限表記）8種類、"epi"（別系統テキスト）6種類も確認したが、今回の対象（神ヒラメキ）外のため対訳表には含めていない
- 未解決: guessの1種類（コモンカード関連）は根拠不十分のため今後の確認待ち。divine要素の書き換えにはSPA再描画時の再適用監視（MutationObserver）を付けていない（基本効果側にある仕組みだが、今回は要件になかったため未実装）
- コミット: 6ac08b8

## 2026-08-07 15:45
- 依頼: 【1】神ヒラメキ等の追加行にも、基本効果と同じ上書き監視（MutationObserverで英語に戻ったら書き直す）を追加する 【2】"Common Card"の日本語訳を調査する。ユーザーの仮説は Common/Rare/Legendary/Mythic Card = 一般/希少/伝説/神話カード。確認できればglossary.jsonにconfirmedで追加、確認できなければextra-lines.jsonのguessを維持する
- 実施:
  - 【1】extension/content.js・docs/bookmarklet.jsそれぞれに、基本効果側のwatchEffectScope/watchContentTargetと同じ設計のwatchDivineElementを追加。divine要素ごとに個別監視し、最大10回まで再書換
  - 【2】aosnsの「共用カード一覧」ページを確認したところ、一般/希少/伝説カード（#白/#青/#黄タグ）という3段階の分類は存在したが、これはPrydwenのCommon/Rare/Legendary/Mythic Cardとは別軸（共用カードプール内の希少度）で、神話に相当する4段階目も見つからず、ユーザーの仮説は確認できなかった
  - 代わりに、aosnsハイデマリページの神ヒラメキ表内「共用カードとして扱う　共用カードを1枚ドロー」が、Prydwenの本テンプレート（Treated as a Common Card/Draw 1 Common Card(s)）と数値・構造完全一致することを発見。同ページの潜在力5凸説明「【基本カード強化】【固有カード強化】【共用カード強化】…3増加」もPrydwen側「[Basic Card Upgrade], [Unique Card Upgrade], and [Common Card Upgrade]…by 3」と一致
- 結果:
  - Common Card = 共用カード、Unique Card = 固有カードの訳語を特定（Basic Card = 基本カードは既存confirmed語）
  - glossary.jsonにUnique Cardのみ新規confirmed追加（coverage: confirmed 345→346 / total 453→454）。Common Cardは既存confirmed語Neutral Card（同じ共用カード）とja重複になり sync.py の重複チェックに抵触するため未登録（訳語自体は確定）
  - docs/extra-lines.jsonの該当テンプレートをguess→confirmedへ昇格（コモンカードの音写から共用カードへ訳文修正）
  - Rare Card・Legendary Card・Mythic Cardの日本語対応は今回未確認（Legendary CardはPrydwen上に用例自体が無い）
- 未解決: Rare Card・Mythic Cardの日本語訳は未調査。Common Cardをglossary.jsonへ登録する場合、Neutral Cardとのja重複をどう扱うか（sync.pyの重複チェック仕様変更 or どちらか一方の削除）はユーザー判断待ち
- コミット: 43ff467

## 2026-08-07 16:10
- 依頼: 【1】sync.pyのja重複チェックを撤廃し、enの重複チェック（character区別）のみ残す 【2】Common Card = 共用カードをconfirmedでglossary.jsonに追加（Neutral Cardとの2表記併用をnoteに記録） 【3】Rare Card / Mythic Cardも調査し、確認できればconfirmed追加・できなければ未登録のまま
- 実施:
  - 【1】scripts/sync.pyのvalidate()を変更。ja重複チェックを削除し、en重複チェック（character が全エントリで異なる場合のみ許可）のみ残した。README.md・glossary.json meta.duplicate_policyも合わせて更新
  - 【2】Common Card = 共用カードをconfirmedで追加。根拠はUnique Cardと同じaosns/ハイデマリの潜在力5凸説明の突き合わせに加え、神ヒラメキ表の「共用カードとして扱う　共用カードを1枚ドロー」がPrydwenの本テンプレートと数値・構造完全一致する点
  - 【3】Prydwenの「starting Rare card」「Mythic Unique card」に対応する日本語表記をaosns（ハイデマリ・ナイン）で調査。潜在力5凸の説明は【基本カード強化】【固有カード強化】【共用カード強化】の3項目で固定・全キャラ共通（Rare/Mythicに相当する項目は無し）。「レアリティ」という語も存在したが、これはキャラ自身のガチャ星ランク（例: ハイデマリ=星5）であり、カードの等級とは無関係な別概念と判明。カード単位のRare/Mythicに対応する日本語表記は見つからなかった
- 結果:
  - glossary.jsonのcoverage: confirmed 346→347 / total 454→455（Common Card追加分）
  - sync.pyのバリデーション変更後もen重複チェックは正常に機能することを確認（テストケースで検証: en重複・character無しは引き続き検出、ja重複・character無しは許可されるようになった）
  - Rare Card・Mythic Cardは根拠不十分のため未登録のまま維持
- 未解決: なし
- コミット: 4ec2a10

## 2026-08-07 16:50
- 依頼: 「完全なキャラ」の定義（①全カードの効果文がingame/aosns由来で登録済み、②全カード名がglossary.jsonでconfirmed、③ヒラメキ段階が全て判定できる）で35キャラを集計し、3条件を満たすキャラがいれば報告、いなければ最も近い1キャラと不足内容を報告する。報告のみで修正はしない
- 実施:
  - Prydwen全35キャラページ（curl取得済み）を、拡張機能と同じ確定セレクタ＋stripLevelSuffix（ローマ数字/星/CARD_LEVEL_NAMES括弧）ロジックのPython移植で解析し、キャラごとに「カード名の集合」と「(カード, レベル)の集合」を再構築
  - glossary.jsonと突き合わせて②（confirmed外のカード名数）、selectors.jsのcardLevelNamesと突き合わせて③（括弧付き未解決レベル数）を判定
  - effects-ja.json（非公開データ、内容は見ずに件数のみ利用）と突き合わせて①（source が ingame/aosns の効果文が無いカード×レベルの数）を判定。同一カードがページ内に複数回出現するケース（デッキ例セクション等での再掲）は重複除去済み
  - 参考として docs/coverage.md も確認したが、aosnsの全35キャラ展開より前の状態のままで古く（docs/coverage.md自体はcommit 4c837d0時点のまま更新されていない）、今回の集計には使わず effects-ja.json を直接参照した
- 結果:
  - 3条件すべてを満たすキャラは0件（該当なし）
  - 最も近いキャラ: Magna（カード8種・レベル枠28件）。②confirmed外0件、③レベル未解決0件、①効果文未登録4件（Frozen Fist・Frost Shield・Storm of Bitter Cold・Absolute Zero、いずれもlevel 0＝ヒラメキ段階を持たない単一形態カードで、effects-ja.jsonに記録が一件も無い＝gamerchすら無い状態）
  - 2位以下（参考、①+②+③の合計が少ない順）: Tiphera（②3・①7）、Khalipe（②4・①11）、Tenebria（②0・①17）、Lucas（②4・①16）
- 未解決: docs/coverage.md が古いまま（aosns全35キャラ展開後に未更新）。Magnaの4件を含む効果文の追加作業はまだ未着手（今回は報告のみの依頼のため）
- コミット: (このworklog追記のみ。コード変更は無し)

## 2026-08-07 17:00
- 依頼: docs/coverage.md が古い状態（aosns全35キャラ展開より前）との報告を受け、effects-ja.jsonの現在の内容から再生成する。条件は従来通り（未登録カード×levelの一覧、sourceがgamerchのみは未登録扱い、効果文そのものは書かない）
- 実施:
  - effects-ja.json（非公開データ、内容は見ず件数・source・levelのみ利用）を(character, ja_card)単位でグループ化し、各levelの最良source（ingame > aosns > gamerch）を判定してsourceがingame/aosns以外のlevelを一覧化するスクリプトで再生成
  - 生成結果を既存のdocs/coverage.mdと突き合わせたところ、内容が完全に一致（バイト単位で差分ゼロ、git add後もdiffなし）
- 結果:
  - 前回報告で「docs/coverage.mdはaosns全35キャラ展開より前のまま古い」と述べたのは誤りだった。実際にはeffects-ja.json側がこの直近の一連の作業（神ヒラメキ・Common Card調査等）で一度も変更されていないため、再生成しても既存のdocs/coverage.mdと完全に同一の内容になった
  - 再生成結果: 27キャラ・カード100件・不足level合計580件（gamerchのみ、または一部levelで未登録）。数値は既存ファイルと同一
  - docs/coverage.md自体に差分が無いため、コミットするコード変更は無し
- 未解決: なし（訂正のみ。effects-ja.jsonが更新されれば次回再生成時に反映される）
- コミット: (このworklog追記のみ。docs/coverage.mdへの実質変更は無し)

## 2026-08-07 17:20
- 依頼: マグナのカード効果文7件（ユーザーがゲーム画面から読み取ったもの）をlevel 0 / source:"ingame"で登録する。英語名対応はglossary.jsonのマグナconfirmed8種から引く。名前が一致しないものは登録せず報告。前回報告した不足4件（Frozen Fist/Frost Shield/Storm of Bitter Cold/Absolute Zero）が埋まったか確認
- 実施:
  - glossary.jsonのcharacter=Magna・confirmed8件（Frozen Fist=氷結の拳、Frost Shield=霜の盾、Storm of Bitter Cold=極寒の嵐、Frost Charge=アイスチャージ、Ice Wall=氷の壁、Glacial Iron Fist=氷河の鉄拳、Ice Fragment=氷の破片、Absolute Zero=絶対零度）と、渡された7件の日本語カード名を突き合わせ
  - 7件とも既存の確定語と1対1で一致し、曖昧な対応は無かった（ユーザーが懸念していた「霜の盾」/「氷の壁」、「氷結の拳」/「氷河の鉄拳」の混同は、いずれもglossary.json側で別々の日本語名として確定済みのため発生しなかった）
  - 7件をeffects-ja.json・extension/effects-ja.json（同一内容の2箇所）にlevel 0 / source:"ingame"で追加。カード固有の効果文のみを登録し、キーワード解説文（反撃・シールド・防御依存ダメージの説明）およびコスト・カード種別は含めていない
- 結果:
  - 7件を新規登録。うち3件（氷結の拳・霜の盾・極寒の嵐）は既存記録が0件だった新規追加、4件（アイスチャージ・氷の壁・氷河の鉄拳・氷の破片）は既存のaosns/gamerch記録に加えてingame記録を追加（優先順位ingame>aosns>gamerchにより索引上位に）
  - 名前不一致（保留対象）は0件
  - 前回報告の不足4件のうち3件（氷結の拳・霜の盾・極寒の嵐）が埋まった。残り1件が未解決: 絶対零度（Absolute Zero）は今回の7件に含まれておらず、記録は引き続き0件のまま
  - 参考: 今回追加した4件（アイスチャージ・氷の壁・氷河の鉄拳・氷の破片）のlevel 0について、既存のaosns記録と数値の食い違いを確認（例: 氷の壁はaosns「シールド180%」に対し実機は「シールド204%」、持続ターンも「1ターン」対「2ターン」で相違。氷の破片はクリスタライズ「2」対「3」で相違）。データ自体は削除せず両方を保持し、優先順位でingame側が索引に反映される
  - docs/coverage.mdを再確認したが、マグナの各カードは元々「一度も記録が無い」(絶対零度)か「今回で完全に埋まった」のいずれかで、coverage.mdの対象範囲（記録が一部でもあるカード）には該当せず、差分は発生しなかった
- 未解決: 絶対零度（Absolute Zero, level 0）の効果文が未登録のまま。これが埋まればMagnaは3条件すべてを満たす
- コミット: (effects-ja.jsonは非公開データのためコミット対象外。リポジトリ側の変更は無し)

## 2026-08-07 17:35
- 依頼: マグナのエゴスキル「絶対零度」の効果文（ユーザーがゲーム画面から読み取ったもの）をlevel 0 / source:"ingame"で登録する。英語名はglossary.jsonのAbsolute Zero（Magna）から引く。これでマグナの不足4件が全て埋まったか確認
- 実施:
  - glossary.jsonでAbsolute Zero = 絶対零度（character: Magna、confirmed）を確認
  - effects-ja.json・extension/effects-ja.jsonに絶対零度をlevel 0 / source:"ingame"で追加（既存記録は0件だったため新規追加のみ、上書きなし）
  - 補足事項（コスト表記なし・エゴスキルという種別）について、effects-ja.jsonのスキーマにはそもそも種別・コストを記録するフィールドが存在しない（ja_card/character/level/effect/source/incompleteのみ）ため、既存データとの食い違いは発生しない旨を確認
  - 3条件（①効果文カバレッジ、②glossary名confirmed、③ヒラメキ段階判定）を再集計するスクリプトでMagnaを再確認
- 結果:
  - 絶対零度を新規登録。前回報告した不足4件（Frozen Fist・Frost Shield・Storm of Bitter Cold・Absolute Zero）が全て埋まった
  - Magnaが3条件すべてを満たす「完全な状態」になったことを確認（カード8種・レベル枠28件、名前confirmed外0件・レベル未解決0件・効果文未登録0件）。35キャラ中、3条件をすべて満たした最初のキャラ
  - docs/coverage.mdを再生成したが差分なし（絶対零度はcoverage.mdの対象範囲外だったカードのため）
- 未解決: なし
- コミット: (effects-ja.jsonは非公開データのためコミット対象外。リポジトリ側の変更は無し)

## 2026-08-07 17:50
- 依頼: マグナのエゴスキル「絶対零度」の登録状況を確認し、必要なら登録する。エゴスキルはヒラメキ段階変化せずlevel 0のみという前提（ユーザーがゲームで確認済み）。マグナの不足4件が埋まったか再確認。拡張機能がエゴスキルの効果文も拾える作りか確認（修正はしない）。前提をdocsにメモとして残す
- 実施:
  - effects-ja.json・extension/effects-ja.jsonで絶対零度（Magna）を確認したところ、level 0 / source: "ingame" で、渡された効果文と同一内容が既に登録済みだった（前回のやり取りで登録済みのため今回の新規登録は不要、上書きも発生せず）
  - 3条件の再集計スクリプトでMagnaを再確認。カード8種・レベル枠28件、名前confirmed外0件・レベル未解決0件・効果文未登録0件で、引き続き3条件すべてを満たす状態を維持
  - Prydwenのマグナページ（キャッシュ済みHTML）で「絶対零度（Absolute Zero）」の実際のDOM構造を確認。`.chaos-card-inside` > `.chaos-header`（`.info > p.type` が `<strong>Ego Skill</strong>` というテキストで、通常カードの `<img alt="Attack"/>` 等とは異なる点のみ差異） > `.chaos-content`（`.skill-with-coloring` に基本効果、神ヒラメキ相当のdivine要素は無し）という、通常カードと同一の構造だった（ページ内に2箇所出現、いずれも同一構造）
  - 拡張機能のカード検出（collectCardCandidatesByConfirmedStructure）・名前特定（findGlossaryNameLeaf）・効果文挿入（insertEffects）のロジックをコードレベルで追跡し、この構造であれば通常カードと同じ経路で問題なく検出・書き換えされることを確認（type要素の中身がAttack/Skillの画像であることを要求するロジックは無く、.chaos-header内の葉要素のうちglossary名と一致するものを探すだけのため、"Ego Skill"というテキストがあっても支障にならない）
  - README.mdに「エゴスキルはヒラメキ段階を持たずlevel 0のみ」の前提と、DOM構造・拡張機能の扱いについてのメモを追記（stripLevelSuffix・cardLevelNamesの説明の直後）
- 結果:
  - 絶対零度: 登録済み・level 0・source ingame・カードと同じデータ構造（effects-ja.jsonのスキーマ自体に種別の区別が無いため）。今回の新規登録は無し
  - マグナの不足4件はすべて埋まったまま。3条件すべて満たす状態を維持（残りは無し）
  - 拡張機能側のエゴスキル対応: コード追跡の範囲では通常カードと同じ経路で処理され、拾えていないという問題は見つからなかった（ライブブラウザでの実地確認はしていない。静的なDOM構造とコードロジックの突き合わせによる確認）
  - README.mdにエゴスキルのlevel 0固定という前提を追記
- 未解決: 拡張機能のエゴスキル対応について、ライブブラウザでの実地確認はまだ行っていない（コード追跡による確認のみ）
- コミット: 023df31

## 2026-08-08 01:00
- 依頼: 拡張機能にChrome内蔵Translator APIを組み込み、「先に翻訳→あとから既存の用語置換」の順で実行する機能を追加する。対象はMagnaのページのみ。作業用ブランチを切り、監視処理の起動タイミング・粒度方針を実装前に報告し、分からない点は保留して報告すること
- 実施:
  - 作業用ブランチ feature/translator-api-magna を作成
  - 【事前調査1】既存のwatchEffectScope/watchDivineElement/ページ全体監視は、いずれもrun()の呼び出しを起点にしていることを確認。run()自体を翻訳完了後まで遅らせるだけで、既存コードを変更せずに「翻訳→監視開始」の順序を実現できると報告し了承を得た
  - 【事前調査2】実機（Chrome 150、Magnaのページ）でTranslator APIを直接検証。モデル未ダウンロード時はTranslator.create()が実際のユーザー操作（クリック）を要求し、拡張機能ポップアップでのクリックは別ドキュメントのため使えないこと、モデル取得済みなら以後ジェスチャー不要で自動実行できることを確認して報告
  - 【事前調査3】ブロック単位（インラインタグとテキストのみで構成される最小要素、再帰的に判定）での粒度方針を報告
  - ユーザーから「解説文中の英語用語がTranslator APIの訳語に化けてしまい、既存の用語置換が効かなくなる」との指摘を受け、リンク・用語をプレースホルダ（[[1]]等）に置き換えてから翻訳し、翻訳後に復元する方式の実現可否を実機で検証。5パターンの文（リンク含み・用語含み・複数プレースホルダ・文頭配置・句読点直後配置）でプレースホルダが翻訳後も壊れず残ることを確認（方式A採用）
  - Magnaのページで翻訳対象ブロックの総数とリンクを含むブロック数を実機で集計
  - 既存コード（collectEffectTextNodes・findGlossaryNameLeaf・collectTextNodes）が<b>タグ等を手がかりに用語を探していないか確認。テキストノード単位・テキスト内容の正規表現マッチのみで判定しており、タグへの依存は無いことを確認
  - extension/content.jsに新セクションを追加（既存コードは無変更）: ブロック収集（collectTranslationBlocks）、プレースホルダ生成・復元（extractBlockTextWithPlaceholders/substituteTermPlaceholders/restorePlaceholders）、ブロック単位の逐次翻訳（translateOneBlock/translateBlocksSequentially/translatePage）、モデル未取得時のページ内ボタン（showTranslateDownloadButton/offerTranslatorDownload）、フェーズ全体のエントリポイント（setupTranslation、Magna限定・トグルOFF・API無し・利用不可のいずれも null を返しフォールバック）
  - 初期化フロー（getEnabled().then(...)内）を、setupTranslation()→（成功時のみ）translatePage()→従来通りrun()、の順に変更。run()・insertEffects・insertDivineLines・監視設置ロジック自体は一切変更していない
  - popup.html/popup.jsに独立したチェックボックス「AI翻訳（実験的・Magnaのページのみ）」を追加（既定OFF、既存のトグルは無改変）
  - 実装したロジック（ブロック抽出・プレースホルダ生成・翻訳・復元）を実機のMagnaページ上で実際のTranslator APIを使ってエンドツーエンドで実行し、リンク（href込み）・用語（Counterattack→反撃、Vulnerable→脆弱）が正しく保持されることをスクリーンショット付きで確認
- 結果:
  - プレースホルダ方式は実機検証で問題なく機能（方式Aを採用）
  - Magnaのページの翻訳対象ブロック: 846件、うちリンクを含むもの8件（うち6件はナビゲーションメニューの単独リンク、解説文中のリンクは2件）
  - 既存の用語置換コードは<b>タグ等をヒントにしておらず、太字が消えても置換処理は影響を受けないことを確認
  - node --check・制御文字スキャン・sync.py すべて通過。glossary.json/effects-ja.json/docs/bookmarklet.jsは無変更
- 未解決: content scriptのisolated worldから実際にTranslatorへアクセスできるかは未検証（拡張機能を読み込んでの動作確認はユーザー側で実施予定）。ボタンクリックでモデル取得が完了しても、今回表示中のページには即座に反映されない（次回のページ読み込みから有効になる）仕様とした
- コミット: d11bad2

## 2026-08-08 02:30
- 依頼: 【A】(最優先) Magnaのページで、日本語の効果文とPrydwenの元の英文が同時に表示される不具合を、git履歴から原因を特定した上で修正する（対症療法禁止）。【B】STATS欄のDEF/ATK等、短いラベルがTranslator APIで誤訳される問題を一般ルールとして修正し、Magnaのページ上で翻訳後も英語のまま残る箇所を全て洗い出して報告する。作業用ブランチを切り、Aが完了してからBに着手すること
- 実施:
  - 作業用ブランチ fix/base-effect-target-and-short-labels を作成
  - 【A】git log -- extension/content.js の全履歴を確認し、commit dde1676（「Scope effect-text writes to .chaos-content's first child only」）で導入された `writeTarget = effectScope.children[0]` が原因と特定。p.tags（[Lead]等の角括弧タグ一覧）を持つカードでは、p.tags自身が.chaos-contentの実際のchildren[0]になり、本当の基本効果div（英語）はchildren[1]にずれる。位置ベースの前提が崩れると、日本語効果文がp.tagsに書き込まれ、本来の英語の効果文divには一切触れないまま残っていた。Magnaの実機ページで氷の破片・極寒の嵐等について、この構造（p.tagsがchildren[0]）を直接確認して原因を裏付けた
  - 修正: 位置ではなくクラスで基本効果要素を判定するfindBaseEffectElement()を追加（class="skill-with-coloring"を含み、"divine"/"rules"/"epi"のいずれも含まない要素。神ヒラメキ抽出のinsertDivineLinesと同じクラス判定方式）。見つからない場合のみ従来のchildren[0]にフォールバック。実機でタグ無しカード（変化なし）・タグ有りカード（修正後の対象が正しい英語effect divに変わることを確認）の両方を検証
  - 【B】Magnaの実機ページで翻訳対象ブロック846件の単語数分布を採取。1〜5語が574件（68%）を占め、中身はSTATS欄のDEF/ATK/HP、Potentialの種別ラベル、ナビゲーションメニュー、装備・カード名等の見出し・略語・固有名詞がほとんど。6〜7語は846件中8件のみと急減し、8語以上から一貫して文章になることを確認し、6語未満を閾値としてTranslator APIに渡さないよう変更（TRANSLATE_MIN_WORDS=6）
  - 閾値未満のブロックは収集対象から完全に除外（これ以上細かい単位が無いため再帰もしない）。除外されたブロックはrun()内の既存replaceTermsOnPage（用語置換）にそのまま委ねられる設計とし、新たな「glossary専用処理」は実装していない（既存コードの再利用で足りるため）
  - 数値のみのブロック（423等）がTranslator APIに渡っていないか実機で確認。既存のhasLatinLetterフィルタで最初から対象外になっていることを確認（コード変更不要）
  - 見出し（INTRODUCTION、UPDATE TRACKER、STATS、GALLERY、STARTING CARDS等）が英語のまま残る理由を調査。`<div><svg/>見出しテキスト</div>`という構造で、見出しテキストがSVGアイコンと同じdiv内の裸のテキストノードになっており、翻訳ブロック収集のisInlineOnly判定がSVG子要素で失敗し再帰してしまうため収集されないことを確認。ただし、この見出しテキストは既存のreplaceTermsOnPage（ページ全体を独立して走査）が元々別途処理しており、今回の収集漏れとは無関係にglossary.json未登録（データ側の欠落）が本当の理由であることを確認。今回はglossary.json変更が指示範囲外のため、SVG収集漏れ自体の修正は見送り、報告のみとした
  - Magnaのページ上で翻訳後も英語のまま残る箇所を洗い出し、要求された形式（英語表記／場所／glossaryにあるか／日本語）で一覧化
- 結果:
  - 【A】原因特定: commit dde1676で導入されたchildren[0]位置ベースの前提が、p.tagsを持つカードで崩れることが原因（退行ではなく、当初から潜在していた条件付きの不具合。タグの無いカードだけ偶然正しく見えていた）
  - 【A】修正確認: タグ無しカード（Frozen Fist等）は挙動不変、タグ有りカード（Ice Fragment、Storm of Bitter Cold等）は正しい英語effect divを対象にするよう修正されたことを実機で確認
  - 【B】翻訳対象ブロックが846件→272件に減少（短い574件を除外）。DEF/ATK/423が対象から外れたことを実機で確認
  - 短いブロックのうちglossary.jsonに一致するもの32件、一致しないもの166件（完全に英語のまま残る）。`.content-header`見出し21件はうち19件が一致なし
  - node --check・制御文字スキャン・sync.py すべて通過。glossary.json/effects-ja.json/docs/bookmarklet.jsは無変更
- 未解決: 見出しのSVG子要素による収集漏れ自体は未修正（今回の見た目には影響しないため見送り）。洗い出した166件+見出し19件のglossary未登録語は、ユーザー側でゲーム画面を確認の上、正しい日本語を追加登録する予定
- コミット: 63f7e4b（A）、836a045（B）

## 2026-08-08 15:00
- 依頼: 5件を順に対応。【A】効果文の上に出るタグ行（[Lead(主導)]等）の重複を、原因特定の上で情報を失わない形で解消。【B】効果文の可読性向上（一案を実装して報告、判断は保留）。【C】6語未満除外により短い「文」まで英語のまま残る問題を、語数だけでなく文かラベルかを区別できる条件で修正しつつSTATS欄が再翻訳されないことを確認。【D】aosnsからステータス・潜在力・凸・装備種別・サブステ優先度・役割の日本語をconfirmedでglossary.jsonに追加、装備名は件数のみ報告。【E】Prydwen独自のUIラベル対応表（ユーザー提供）をdocs/site-labels.json（新規）に格納しglossary.jsonとは分離、SVGアイコン構造の見出しでも置換が効くことを確認
- 実施:
  - 作業用ブランチ fix/tag-dup-contrast-glossary-labels を作成
  - 【A】p.tagsが表示される原因を特定: p.tagsはページ全体の用語置換（replaceTermsOnPage、既存・無改変）が独立して処理する要素で、insertEffectsが書き込むwriteTargetとは別物。氷の破片等、自前で登録した効果文（ingame/aosns由来）は角括弧タグを常に効果文の先頭に埋め込む慣習になっており、Magnaの該当9件（カード×レベル）全てで内容が一致することを実機で確認。hideRedundantTagsLine()を追加し、p.tagsの各タグに対応する日本語がjaTextに含まれている場合のみp.tagsを非表示化。1件（氷河の鉄拳V、タグ表記"Exhaust 2"）は単純な辞書引きでは一致せず非表示にならないことを確認・報告（情報は失われない、安全側の挙動）
  - 【B】案1として、白文字＋半透明の暗い下地＋角丸＋影のスタイルをapplyReadableEffectStyle()として実装し、初回書き込み・監視による再書き換えの両方に適用。実機で氷結の拳・霜の盾・氷の破片の3枚に適用したスクリーンショットで、いずれの背景画像に対しても可読性が改善することを確認（判断待ち）
  - 【C】語数閾値（6語未満）に加え、文末が「.」「!」「?」で終わるものは語数によらず翻訳対象にする条件を追加（小数点由来の「.」は直前が数字なら除外）。Magnaの実データで、この条件により新たに翻訳対象になったのは4種類の短い文のみで、STATS欄のDEF/ATK/HP等は引き続き除外されたままであることを実機で確認
  - 【D】aosns（マグナ）のページを取得し、要求された用語を調査。ステータス表（Lv1/10/30/50/60）でATK=攻撃力・DEF=防御力を確認。凸性能5凸の説明でUpgrade=強化を再確認（Common/Unique Card登録時と同じ根拠）。潜在力表（メモリーの欠片装備枠）でProficiency=熟練を確認。装備一覧テーブルでWeapon=武器・Armor=防具・Trinket=装飾を確認。メモリーの欠片2piece効果表（否定/理想/渇望/想像の4行）で、各行の対象ステータスがPrydwenのIdeal/Desire/Imaginationの割り当てと完全一致することを確認しIdeal=理想・Desire=渇望・Imagination=想像とした。地の文でHealer=ヒーラー・Support=サポートを確認（UIラベルとしての厳密な用例ではなく地の文での言及である旨をnoteに明記）。HP・DPSは英語表記のままで対応する日本語が無いことを確認（登録せず）。Adaptation・Base・E0〜E6・凸段階の6種の記憶名（Sleeping/Awakening/Vivid/Inner/Complete/Liberated Memory）はいずれも該当箇所が見つからず未登録。装備名は32件（武器4・防具14・装飾14）がaosnsに掲載されていることを件数のみ確認し、名前の突合・登録は行っていない
  - 【E】ユーザー提供の対応表をそのままdocs/site-labels.json（新規、45件）に格納。glossary.jsonには混ぜていない。既存のreplaceTermsOnPageと同じ仕組み（collectTextNodesによるテキストノード単位の走査）を再利用したreplaceSiteLabelsOnPage()を追加。前回報告した「見出しが<div><svg/>テキスト</div>という構造で判定を妨げる」問題は、AI翻訳のブロック収集（要素単位の判定）固有の問題であり、テキストノード単位で走査するこの仕組みには影響しないことを実機で確認（"Introduction"→"はじめに"、"Stats (level 60)"→"ステータス (level 60)"が問題なく置換された）。適用範囲はMagnaのページのみ、AI翻訳フェーズより前に一度だけ実行し、完全に日本語化されたブロックは既存のhasLatinLetter判定で自然に翻訳対象から外れる設計とした
- 結果:
  - node --check・制御文字スキャン・sync.pyすべて通過。effects-ja.json・docs/bookmarklet.jsは無変更
  - glossary.jsonのcoverage: confirmed 347→361 / total 455→469（14件追加）
  - docs/site-labels.json新規作成（45件、confidence/noteフィールドなし、ユーザー提供のまま）
- 未解決: 【A】氷河の鉄拳Vの"Exhaust 2"タグは非表示にならないまま。【B】可読性スタイルの採用可否はユーザー判断待ち。【D】装備名32件の日本語対応は未着手（量を見て判断とのことで保留）
- コミット: e4b0704（A/B/C/E）、97980ca（D）
