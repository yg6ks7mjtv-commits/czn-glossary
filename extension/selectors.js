// prydwen.gg の実際のDOM構造の一部が判明したので、それに合わせた設定。
//
// カード枠の特定方法（既定・useMarkerStrategy: true）:
//   「カード名」と「Show Effects」の両方を含む、最も小さい共通の祖先要素を
//   カード枠とみなす。カード名候補は glossary.json の英語名と完全一致する
//   ことを条件にする（グループ見出し「Starting Cards:」等の誤検出を防ぐため。
//   末尾がコロンの文字列は候補から除外する二重の対策も入れてある）。
//   マーカーから親を1階層ずつたどり、その階層の中に条件を満たすカード名候補が
//   現れた時点で探索を打ち切る＝それが最小の共通祖先＝カード枠。それより外は見ない。
//
// 使い方:
//   - useMarkerStrategy: true の間は effectMarkerText を使った検出が主経路になる。
//     cardContainer / cardName / effectSlot は「正確なセレクタが分かったら
//     ここに書けば、そちらを先に試す」ための任意の速い経路として残してある
//     （分からないうちは空配列のままでよい。中身が無ければ自動的にスキップされる）。
//   - 実際の構造に合わせて増減・調整してよい。content.js 側の変更は不要な設計。
//
// デバッグ: content.js の CZN_DEBUG を true にすると、マッチ状況を
// console に出す。

var CZN_SELECTORS = {
  // true: "Show Effects" マーカー + glossary名一致でカード枠とカード名を探す
  //       （現状の既定・推奨）。
  // false: 下の cardContainer / cardName / effectSlot セレクタだけで探す
  //        （正確なセレクタが判明してから切り替える用）。
  useMarkerStrategy: true,

  // 説明ブロックの中にある「Show Effects」リンク／ボタンの文字列。
  // 表記ゆれ（大文字小文字・空白）があれば候補を増やすこと。
  effectMarkerText: ['Show Effects'],

  // マーカーから最大何階層まで親をたどって「カード名候補を含む最小の祖先」を
  // 探すか。カードグリッド全体まで無駄に登らないための上限。
  maxAncestorClimb: 10,

  // カード名候補として扱わない文字列の条件。既定は「末尾がコロン」
  // （"Starting Cards:" 等のグループ見出し除け）。念のための保険で、
  // 実際は glossary.json の英語名と完全一致するかどうかが主な判定基準。
  nameExcludeSuffixes: [':'],

  // ---- 以下は useMarkerStrategy: false のときだけ使う任意の速い経路 ----
  // 正確なセレクタが判明したらここに書く。空配列のままなら単にスキップされる。

  cardContainer: [],
  cardName: [],
  effectSlot: []
};
