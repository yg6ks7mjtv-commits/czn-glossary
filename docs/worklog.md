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
