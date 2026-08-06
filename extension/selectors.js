// prydwen.gg の実際のDOM構造の一部が判明したので、それに合わせた設定。
// カードの説明欄は空ではなく、Prydwenの英語の効果説明と「Show Effects」リンクが
// 入っている。そのため「空要素を探す」旧方式ではなく、"Show Effects" という
// テキストを手がかりに説明ブロックを特定する方式を既定にしている。
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
  // true: "Show Effects" マーカーを手がかりに説明ブロックとカード名を探す
  //       （現状の既定・推奨）。
  // false: 下の cardContainer / cardName / effectSlot セレクタだけで探す
  //        （正確なセレクタが判明してから切り替える用）。
  useMarkerStrategy: true,

  // 説明ブロックの中にある「Show Effects」リンク／ボタンの文字列。
  // 表記ゆれ（大文字小文字・空白）があれば候補を増やすこと。
  effectMarkerText: ['Show Effects'],

  // マーカー要素から何階層親をたどると「説明ブロック」（英語の効果文と
  // Show Effects を両方含む要素）に届くか。1階層で狭すぎる／広すぎる場合は
  // ここを増減する。日本語効果文はこの要素の最後の子として追加される。
  effectMarkerAncestorLevels: 2,

  // カード名を探すときに、見出しタグに加えて試す候補（class名の部分一致）。
  // 例のカード名（Sword Rain 等）が入っている要素の class が分かれば追加する。
  cardNameExtraSelectors: [
    '[class*="CardName"]',
    '[class*="card-name"]',
    '[class*="Title"]',
    '[class*="title"]'
  ],

  // ---- 以下は useMarkerStrategy: false のときだけ使う任意の速い経路 ----
  // 正確なセレクタが判明したらここに書く。空配列のままなら単にスキップされる。

  cardContainer: [],
  cardName: [],
  effectSlot: []
};
