// prydwen.gg の実際の DOM 構造を確認できていない状態で書いた設定ファイル。
// (www.prydwen.gg への自動アクセスが 403 で拒否されるため、開発中に直接
// 検証できなかった。ブラウザの devtools で実物を見て、ここを調整すること。)
//
// 使い方:
//   - 各リストは「上から順に試して、最初にヒットしたセレクタを使う」候補群。
//   - 実際の構造に合わせて増減・並べ替えしてよい。content.js 側は変更不要。
//   - cardContainer / cardName / effectSlot のどれもヒットしない場合は
//     content.js がフォールバック（テキスト一致・空要素探索）で動作するが、
//     精度は下がる。まずはここを実物に合わせて埋めるのが近道。
//
// デバッグ: content.js の CZN_DEBUG を true にすると、マッチ状況を
// console に出す。

var CZN_SELECTORS = {
  // カード1枚を表すコンテナ要素の候補。
  // 例: ページ全体のカードグリッドの中の1マス。
  cardContainer: [
    '[class*="CardContainer"]',
    '[class*="card-container"]',
    '[class*="Card_card"]',
    '[data-testid*="card"]',
    '.card'
  ],

  // カード名テキストが入っている要素（cardContainer の中を querySelector する）。
  // 見つからない場合、content.js は「既知の英語カード名と完全一致するテキストを持つ
  // 子孫要素」を総当たりで探すフォールバックに切り替える。
  cardName: [
    '[class*="CardName"]',
    '[class*="card-name"]',
    '[class*="Card_name"]',
    'h3',
    'h4'
  ],

  // 効果文を挿入する先。カード画像の下にある、本来は空白の説明欄を想定。
  // 見つからない場合、content.js は cardContainer 内でカード名より後にある
  // 「子要素を持たず、テキストも空」の要素を探すフォールバックに切り替える。
  effectSlot: [
    '[class*="CardDescription"]',
    '[class*="card-description"]',
    '[class*="Card_description"]',
    '[class*="CardEffect"]',
    '[class*="card-body"]'
  ]
};
