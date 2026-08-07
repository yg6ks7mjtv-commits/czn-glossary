// prydwen.gg の実際のカード構造（ユーザーが実画面で確認）に合わせた設定。
//
// 1枚のカードの実際のDOM構造（確認済み）:
//   <div class="chaos-card-inside">
//     <div class="left-border ..."></div>
//     <div class="chaos-image"><img alt="Sword Rain III"></div>   ← カード名はここ（alt属性）
//     <div class="chaos-header">...</div>                         ← カード名の表示先（コスト数字・種別表示も同居）
//     <div class="chaos-content">...</div>                        ← 効果文の探索範囲
//   </div>
//
// カード枠の特定方法（既定・useConfirmedStructure: true）:
//   confirmedCard（既定 .chaos-card-inside）を1枚のカードとする。カード名は
//   その中の img[alt] から取得し（表示用テキストの揺れやレイアウト変化に
//   依存しない）、ローマ数字（ヒラメキ段階）の判定もこの alt テキストに対して
//   行う。日本語名の表示先は confirmedHeader（既定 .chaos-header）内で
//   glossary名と一致する葉要素、効果文の書き換え範囲は confirmedContent
//   （既定 .chaos-content）に固定する（テキストノード単位の書き換え方式は
//   従来通り）。
//
// 旧方式（種別表示ベースの探索・useMarkerStrategy）は削除せず残してある。
// useConfirmedStructure: false にすれば、useMarkerStrategy の設定に従って
// 従来の探索経路にフォールバックする。
//
// デバッグ: content.js の CZN_DEBUG を true にすると、マッチ状況を
// console に出す。

var CZN_SELECTORS = {
  // true: 確定済みの .chaos-card-inside 構造から直接カードを検出する
  //       （現状の既定・推奨）。useMarkerStrategy の設定より優先される。
  // false: 下の useMarkerStrategy の設定に従う（旧方式へのフォールバック用。
  //        コードは削除していないので、確定セレクタが崩れた場合の保険として
  //        いつでも戻せる）。
  useConfirmedStructure: true,

  // 1枚のカードのコンテナ。
  confirmedCard: '.chaos-card-inside',
  // カード名の表示先（この中で glossary名と一致する葉要素を書き換える）。
  confirmedHeader: '.chaos-header',
  // 効果文の書き換え範囲（テキストノード方式で直接操作する）。
  confirmedContent: '.chaos-content',

  // 一部のキャラは、ヒラメキ段階をローマ数字ではなく括弧付きの固有名で区別する
  // （例: Nine「Hew (Ironclad)」「Hew (Extreme)」...）。この対応関係は
  // カードごとに異なり機械的に推測できないため、根拠（aosnsの効果文に
  // 埋め込まれた日本語の括弧名とPrydwenの英語括弧名の対応）を確認できた
  // ものだけをここに事前登録する。未登録の組み合わせは変換されず、
  // glossaryの英語名（括弧無し）と一致しないため処理対象外のまま
  // （無理に推測しないため。詳細はREADMEの該当項目参照）。
  //
  // 形式: { キャラ名(Prydwen表記): { カードのベース名: { 括弧内の語: level } } }
  //
  // 対応が取れなかったもの（未登録・要根拠確認）:
  //   - Hilde「Homing Arrow (Fracture)」「Homing Arrow (Grand)」
  //     クイバーロードが生成する専用カードで、aosns側に「カード評価」相当の
  //     レベル別効果文が存在しない（生成カードのため対象外セクション）。
  //   - Chizuru「Moonslash (Gen)」
  //     aosnsの「真月」は評価コメントのみでレベル別効果文が無い
  //     （段落形式、Hilde等と同じパターン）。
  cardLevelNames: {
    Nine: {
      Hew: {
        Ironclad: 1, // aosns効果文: 破砕(鉄甲)
        Extreme: 2,  // aosns効果文: 破砕(極強)
        Flash: 3,    // aosns効果文: 破砕(閃光)
        Massacre: 4, // aosns効果文: 破砕(根絶)
        Ambush: 5    // aosns効果文: 破砕(奇襲)
      }
    }
  },

  // ---- 以下は useConfirmedStructure: false のときだけ使う旧方式の設定 ----

  // true: 種別表示(Attack/Skill) + glossary名一致でカード枠とカード名を探す。
  // false: 下の cardContainer / cardName / effectSlot セレクタだけで探す
  //        （正確なセレクタが判明してから切り替える用）。
  useMarkerStrategy: true,

  // カードの種別表示として使われる文字列（完全一致）。
  typeLabelText: ['Attack', 'Skill'],

  // 種別表示から最大何階層まで親をたどって「カード名候補を含む最小の祖先」を
  // 探すか。カードグリッド全体まで無駄に登らないための上限。
  maxAncestorClimb: 10,

  // カード名で特定した「カード枠」から、さらに何階層まで親をたどって
  // 効果文の検索範囲を広げるか（上限）。実際に何階層登るかは階層数固定では
  // なく内容の増分（textContentがbox比+50文字以上になった時点）で決まる。
  // ただし2つ目の種別表示（Attack/Skill）を含む範囲までは広げない
  // （別カードの領域に踏み込まないため）。useConfirmedStructure: true の
  // ときは使われない（効果文の範囲は confirmedContent に固定されるため）。
  maxEffectSearchClimb: 10,

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
