// prydwen.gg の実際のカード構造（ユーザーが実画面で確認）に合わせた設定。
//
// 1枚のカードの構成:
//   左上にコストの数字 / カード名（例: "Sword Rain III"） / 種別表示
//   （"Attack" または "Skill"） / カード画像 / 画像下部に重なる効果文 /
//   効果文が長いときだけ「Show Effects」リンク。
//
// カード枠の特定方法（既定・useMarkerStrategy: true）:
//   「Show Effects」は効果文が短いカードには存在しないため使わない。
//   代わりに「種別表示（Attack/Skill）」と「カード名」の両方を含む、最も
//   小さい共通の祖先要素をカード枠とみなす。種別表示は "Attack"/"Skill" の
//   どちらか2値しかなく、カードには必ず付いているため確実な足がかりになる。
//   カード名候補は glossary.json の英語名（ヒラメキ段階のローマ数字は除いた
//   ベース名）と完全一致することを条件にする。末尾がコロンの文字列
//   （"Starting Cards:" 等のグループ見出し）は候補から除外する。
//
// 使い方:
//   - useMarkerStrategy: true の間は typeLabelText を使った検出が主経路になる。
//     cardContainer / cardName / effectSlot は「正確なセレクタが分かったら
//     ここに書けば、そちらを先に試す」ための任意の速い経路として残してある
//     （分からないうちは空配列のままでよい。中身が無ければ自動的にスキップされる）。
//   - 実際の構造に合わせて増減・調整してよい。content.js 側の変更は不要な設計。
//
// デバッグ: content.js の CZN_DEBUG を true にすると、マッチ状況を
// console に出す。

var CZN_SELECTORS = {
  // true: 種別表示(Attack/Skill) + glossary名一致でカード枠とカード名を探す
  //       （現状の既定・推奨）。
  // false: 下の cardContainer / cardName / effectSlot セレクタだけで探す
  //        （正確なセレクタが判明してから切り替える用）。
  useMarkerStrategy: true,

  // カードの種別表示として使われる文字列（完全一致）。
  typeLabelText: ['Attack', 'Skill'],

  // 種別表示から最大何階層まで親をたどって「カード名候補を含む最小の祖先」を
  // 探すか。カードグリッド全体まで無駄に登らないための上限。
  maxAncestorClimb: 10,

  // カード名で特定した「カード枠」から、さらに何階層まで親をたどって
  // 効果文の検索範囲を広げるか。名前照合用の枠より広い範囲を許可することで、
  // カード枠が効果文の領域を含んでいない場合に対応する。ただし2つ目の
  // 種別表示（Attack/Skill）を含む範囲までは広げない（別カードの領域に
  // 踏み込まないため）。
  maxEffectSearchClimb: 3,

  // カード名候補として扱わない文字列の条件。既定は「末尾がコロン」
  // （"Starting Cards:" 等のグループ見出し除け）。念のための保険で、
  // 実際は glossary.json の英語名（ローマ数字除去後）と完全一致するかどうかが
  // 主な判定基準。
  nameExcludeSuffixes: [':'],

  // ---- 以下は useMarkerStrategy: false のときだけ使う任意の速い経路 ----
  // 正確なセレクタが判明したらここに書く。空配列のままなら単にスキップされる。

  cardContainer: [],
  cardName: [],
  effectSlot: []
};
