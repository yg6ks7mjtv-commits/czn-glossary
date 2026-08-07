// CZN 用語対応表 拡張 — prydwen.gg (Chaos Zero Nightmare) 用コンテンツスクリプト。
// 開発用・非公開。ストアには出さず、デベロッパーモードのフォルダ読み込みで使う前提。
//
// やること:
//   1. glossary.json（公開URL）と effects-ja.json（拡張に同梱・非公開）を読む
//   2. ページ上の種別表示（"Attack" または "Skill"、完全一致の2値）を目印に、
//      そこから親を1階層ずつたどり、「glossary.json の英語カード名（ヒラメキ
//      段階のローマ数字は除いたベース名）と完全一致する、末尾コロンでない
//      葉要素」が現れた時点でそこを「カード枠」として確定する（＝カード名と
//      種別表示の両方を含む最小の共通祖先）。それより外は探索しない。
//      "Show Effects" は効果文が短いカードには存在しないため目印にしない。
//      単純な固定階層数や見出しタグの総当たりだと、カードのグループ見出し
//      （「Starting Cards:」等）まで拾ってしまうため、glossary名との完全一致
//      （ローマ数字除去後）を主な判定基準にしている。
//      安全のための2つの歯止め:
//        - 登った祖先に自分以外の種別表示（Attack/Skill）が複数入って
//          しまった時点で、それは1枚のカードの枠を超えて複数カードを
//          またぐ共通祖先（グリッド全体等）なので、それ以上は登らず打ち切る
//          （＝別カードの名前を誤って拾うことを防ぐ）
//        - 名前を特定できなければ、無理に近い候補を採用せず null を返す。
//          そのカードは処理対象外（英語のまま）になる。誤った日本語や
//          誤った効果文が表示されるより、英語のまま残るほうが安全なため
//      候補が複数見つかったときは、種別表示からのDOM順の距離が最も近い
//      ものを優先する
//   3. カード名末尾のローマ数字（I/II/III/IV/V）をヒラメキ段階(level 1-5)、
//      無ければ level 0 として扱い、effects-ja.json を
//      (character, ja_card, level) で引く。character は大文字小文字・前後
//      空白を無視、level は数値/文字列どちらでも一致するよう正規化して比較
//      する。カード名は glossary が分かっていれば効果文の有無と無関係に
//      常に日本語のみに書き換える（用語置換の正規表現に頼らず、既に解決
//      済みの英日対応を直接書き込む。一部のカード名はglossary側が未確認の
//      英語表記のままのことがあり、通常の用語置換では置き換わらないため）。
//      元の英語は data-czn-orig-name 属性に退避し、次回のカード名解析
//      （stripRomanLevel）ではこちらを読む。該当levelの効果文が手元
//      データにあれば、カード枠内の「英語の効果文要素」そのものも書き換える。
//      効果文の探索範囲は、名前照合用の（狭い）カード枠 box とは別に扱う。
//      box から親を1階層ずつたどり、その要素の textContent が box の
//      textContent より50文字以上多くなった時点で、そこを探索範囲として
//      採用する（＝効果文相当のまとまった量のテキストが新たに含まれる
//      ようになったとみなす。box が単なるヘッダー部分だけで、効果文が
//      box とは全く別の場所にあるケースに対応するため。固定の階層数だけで
//      判断すると届かないことがあった）。最大 maxEffectSearchClimb（既定
//      10）階層まで許可。ただし2つ目の種別表示を含む階層に達したら、その
//      1つ手前で打ち切る（findCardBoxと同じ「複数カードをまたいだら打ち
//      切る」歯止め）。このサイト上では候補要素の getBoundingClientRect()
//      が画面上に表示されていても常に0x0を返すため、幅・高さの実測による
//      選択や書き換え後の検証・ロールバックはできない（過去のバージョンは
//      これに依存していたが機能しなかった）。そのためサイズに基づく判定は
//      全廃し、除外条件（カード名要素・書き換え済み・textContentが10文字
//      未満）を満たさない葉要素の中で textContent の文字数が最も多いものを
//      無条件で1つ採用する。採用できた要素には背景白・文字黒・角丸を付け、
//      white-space:normal・word-break:normal・writing-mode:horizontal-tb・
//      width:auto・min-width:0を強制してカード名側の省略表示CSSや縦書き
//      指定の影響を打ち消す。元の英語は title 属性に退避する（消さずに
//      保持するが表示はしない）。同じ効果文ブロック内に残る他の英語テキスト
//      （複数行に分かれている場合）は display:none で隠す（「Show Effects」
//      の展開トグルは除く）。それでも対象要素が見つからないカードや日本語
//      の効果文が無いカードには何もしない（英語のまま残る）
//   4. ブックマークレットと同じロジックで、カード以外のテキストの用語置換も
//      行う。ローマ数字が続く場合は「Sword Rain III(剣の雨 III)」のように
//      まとめて1つの用語として扱う。書き換え済み（data-czn-done="1"）の
//      要素は対象から除外する。置換した箇所への背景ハイライトは付けない
//   5. 起動時に画面右下へ簡易トーストを出し、動いているかを目視確認できるようにする。
//      「◯件を置換 / カード枠◯件 / 名前取得◯件 / ユニーク◯件 / 効果文◯件 /
//      効果文データ◯件 / 名前特定スキップ◯件」の内訳を表示する。カード枠は
//      種別表示から検出を試みた件数、名前取得はそのうちカード名まで特定できた
//      件数、ユニークはベース名（ローマ数字を除いた名前、レベル違いは1件に
//      まとめる）の種類数、効果文データは effects-ja.json から読めた件数
//      （ファイル全体の件数。source:"gamerch" は buildEffectsIndex で除外
//      されるため、実際に索引に使われた件数は「(有効◯件)」として別途
//      括弧内に示す）、名前特定スキップは無理に近い候補を採用せず処理対象外
//      にした件数（別カードへの誤爆を防ぐための安全装置が働いた件数）。
//      同名でもカード枠ごとに別カードとして処理し、名前による集約・
//      重複排除は一切行わない。スキップが1件以上あるときは、スキップした
//      カードの推定テキスト（診断専用、実際の照合には使わない）を最大5件
//      表示する。照合（entry・effectの取得）まで成功したのに実際の書き換え
//      段階で失敗したカードがあれば（全体の挿入件数が0件でなくても）、
//      「挿入失敗: 原文 / level / 理由」を必ず表示する（「効果文あり」なのに
//      画面が変わらないという矛盾の原因をその場で確認できるようにするため）。
//      試した候補があれば各候補の書き換え後の幅と高さも出す。書き換え先の
//      要素が1つも見つからなかった場合は、名前照合用のカード枠（box）自体の
//      タグ名・クラス名・中のテキスト要素数・textContent冒頭50文字に加えて、
//      実際に探索範囲として採用した scope（box から内容の増分を基準に
//      広げた後の要素。boxとは別に表示する）のタグ名・クラス名・登った
//      階層数・中のテキスト要素数・textContent冒頭50文字も併せて出す
//      （box が小さすぎるのか、scopeへの拡大が機能していないのか、除外
//      条件が厳しすぎるのかを切り分けるため）。
//      効果文が0件のときの内訳表示（最大10件）は、効果文が見つかったもの・
//      glossaryで日本語化できたもの・ヒラメキ段階が付いているものを優先して
//      並べ、実際に探索したキーと保有キー一覧（有効なもののみ）も表示する
//      （DOM順のキャップで手がかりの多いカードが漏れないようにするため、
//      また照合ミスの原因を切り分けやすくするため）。1件以上書き換えられた
//      ときは、書き換えた要素のタグ名・クラス名・試した候補数・採用された
//      候補の番目・各候補の書き換え後の幅と高さ（例: 1:120x300(失敗)、
//      2:340x40(採用)）も出す（対象を取り違えていないか、なぜその候補が
//      採用されたのか確認するため）
//   6. SPA側の再描画でDOMが差し替わっても追従できるよう、MutationObserver で
//      1〜4の全段階（カード名収集・効果文挿入・用語置換）をまとめて再実行する
//
// 実装上の注意:
//   - www.prydwen.gg への自動アクセスが403で拒否されるため、細部のセレクタは
//     見ないまま書いている。調整は selectors.js を編集すること。
//   - CZN_SELECTORS は selectors.js で定義され、このファイルより先に読み込まれる
//     （manifest.json の content_scripts.js の順序に依存）。
//   - effects-ja.json は content script から chrome.runtime.getURL() 経由で
//     fetch するため、manifest.json の web_accessible_resources に登録が
//     必要（無いとブロックされ、効果文データ0件として扱われる）。

(function () {
  'use strict';

  var GLOSSARY_URL = 'https://yg6ks7mjtv-commits.github.io/czn-glossary/glossary.json';
  var STORAGE_KEY = 'czn_enabled';
  var CZN_DEBUG = false; // true にすると console にマッチ状況を出す

  function log() {
    if (CZN_DEBUG) {
      console.log.apply(console, ['[czn-ext]'].concat(Array.prototype.slice.call(arguments)));
    }
  }

  // ブックマークレット (docs/bookmarklet.js) と同じ判定基準。
  // KEEP_EN を編集したら、docs/bookmarklet.js 側の KEEP_EN も合わせて更新すること。
  var KEEP_EN_STATIC = [
    'Mark', 'Lead', 'Remove', 'Wave', 'Partner', 'Break', 'Save', 'Damage',
    'Shield', 'Heal', 'Sound Check', 'Fan Service', 'Spotlight',
    'Call & Response', 'Encore', 'Photo Time', 'Photo Card', 'Rhythm',
    'Performance Buzz', 'Rapid Fire', 'Handgun Bullet', 'Single Shot',
    'Ionization', 'Draw & Release', 'Big Game Ranger', 'Zero In',
    'Matrix Overlay', 'Multishot', 'Bowguard', 'Homing Arrow', 'Descent',
    'Melancholy', 'Night Rain', 'Solo Dance', 'Once Upon a Time', 'Blessing',
    'Protect Us', 'Garden of Secrets', 'Gather Round', 'Happy Ending',
    'Sword Rain', 'Linked', 'Hero to All', 'Sword Flash', 'Sword Barrier',
    'Resonance', 'Repose', 'Heart Shaker', "With All My Heart!",
    'Liberated Feelings', 'Radiant Smile', 'Heart Bullet', 'Blooming Love',
    'Disruption Fire', 'Protect Me', 'Chronicle', 'Time Paradox',
    'Time Acceleration', 'Rewind', 'Archetype', 'Creation and Destruction',
    'Event Horizon', 'Barrier Deployment', 'Matter Disintegration', 'Hew',
    'Honed Edge', 'Fighting Spirit', 'Slash', 'Homing Laser', 'Afterglow',
    'Plasma Missile', 'Shining Core', 'Pulse Fire', 'Death Halo',
    'Magnetic Field', "Will-O'-Wisp", 'Shadow of the Moon', 'Cursed Shackles',
    'Bind', 'Twilight', 'Inspiration', 'Longsword Slash', 'Trickery Strike',
    'Freezing Blade', 'Flowing Parry', 'Power Charge', 'Charge Energy',
    'Quick Lift', 'Power Strike', 'Ballista', 'Firing Preparation',
    'Absolute Protection', 'Upward Slash', 'Counterattack', 'Absolute Zero',
    'Frost Shield', 'Ice Wall', 'Ice Fragment', 'Frozen Fist', 'Frost Charge',
    'Enhanced Counterattack', 'Crystallization', 'Mealtime', 'Defense System',
    'Futility', 'Black Hole', 'Launcher', 'Barrier', 'Guilty Pleasure',
    'Wind Slash', 'Dark Blade', 'Material Regeneration', 'Tactical Maneuver',
    'Machine Gun', 'Extended Magazine', 'Flamethrower', 'Flashbang', 'Joker',
    'Shuffle', 'Wild Card', 'Card', 'Mana Field', 'Elasticity', 'Adagio',
    'Rock & Roll', 'Tactical Analysis', 'Whirlpool', 'Deluge', 'Rapier',
    'Curse'
  ];

  // URL の /characters/<slug> からキャラ名（glossary.json の character 値）を推定する。
  var SLUG_TO_CHARACTER = {
    'tenebria': 'Tenebria', 'luke': 'Luke', 'hilde': 'Hilde', 'fei': 'Fei',
    'adelheid': 'Adelheid', 'heidemarie': 'Heidemarie', 'diana': 'Diana',
    'rita': 'Rita', 'tiphera': 'Tiphera', 'nine': 'Nine', 'narja': 'Narja',
    'sereniel': 'Sereniel', 'chizuru': 'Chizuru', 'yuki': 'Yuki',
    'haru': 'Haru', 'veronica': 'Veronica', 'khalipe': 'Khalipe',
    'magna': 'Magna', 'rin': 'Rin', 'orlea': 'Orlea', 'mei-lin': 'Mei Lin',
    'renoa': 'Renoa', 'hugo': 'Hugo', 'kayron': 'Kayron', 'beryl': 'Beryl',
    'maribell': 'Maribell', 'owen': 'Owen', 'rei': 'Rei', 'selena': 'Selena',
    'lucas': 'Lucas', 'cassius': 'Cassius', 'nia': 'Nia', 'mika': 'Mika',
    'amir': 'Amir', 'tressa': 'Tressa'
  };

  function currentCharacter() {
    var m = /\/chaos-zero-nightmare\/characters\/([^/]+)/.exec(location.pathname);
    if (!m) { return null; }
    return SLUG_TO_CHARACTER[m[1]] || null;
  }

  function rxEscape(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function isWordChar(c) {
    return /[A-Za-z0-9]/.test(c);
  }

  // ヒラメキ段階を表すカード名末尾のローマ数字。I〜Vの5段階のみ（それ以外の
  // 大文字語を誤って数字扱いしないよう、この5つの完全一致だけを対象にする）。
  var ROMAN_LEVELS = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
  var ROMAN_BY_LEVEL = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };

  // "Sword Rain III" -> { base: "Sword Rain", level: 3 }
  // "Sword Rain"     -> { base: "Sword Rain", level: 0 }
  function stripRomanLevel(text) {
    var idx = text.lastIndexOf(' ');
    if (idx === -1) { return { base: text, level: 0 }; }
    var last = text.slice(idx + 1);
    if (Object.prototype.hasOwnProperty.call(ROMAN_LEVELS, last)) {
      return { base: text.slice(0, idx), level: ROMAN_LEVELS[last] };
    }
    return { base: text, level: 0 };
  }

  // カード名要素の原文を読む。日本語に書き換え済み（data-czn-orig-name
  // 属性を保持している）なら、書き換え前に退避しておいた原文（英語）を
  // 返す。書き換え後の textContent（日本語）をそのまま読むと、次の
  // MutationObserver再実行時に stripRomanLevel / glossary照合が壊れる
  // ため。
  function readNameText(nameEl) {
    var orig = nameEl.getAttribute('data-czn-orig-name');
    if (orig !== null) { return orig; }
    return (nameEl.textContent || '').trim();
  }

  // ---- データ読み込み ----

  function fetchGlossary() {
    return fetch(GLOSSARY_URL, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) { throw new Error('glossary.json HTTP ' + r.status); }
        return r.json();
      })
      .then(function (data) {
        return (data.entries || []).filter(function (e) {
          return e.confidence === 'confirmed' && e.en && e.ja;
        });
      });
  }

  function fetchEffects() {
    var url = chrome.runtime.getURL('effects-ja.json');
    return fetch(url)
      .then(function (r) {
        if (!r.ok) { throw new Error('effects-ja.json HTTP ' + r.status); }
        return r.json();
      })
      .catch(function (err) {
        log('effects-ja.json を読めなかった（未配置なら正常）:', err.message);
        return [];
      });
  }

  function getEnabled() {
    return new Promise(function (resolve) {
      chrome.storage.local.get([STORAGE_KEY], function (result) {
        resolve(result[STORAGE_KEY] !== false); // 既定 ON
      });
    });
  }

  // ---- 用語コンテキストの構築 ----

  // entries: confirmed のみの配列。character 込みで en -> 候補一覧を作る。
  function buildContext(entries, charName) {
    var byEn = Object.create(null); // en -> [entry, ...]
    entries.forEach(function (e) {
      if (!byEn[e.en]) { byEn[e.en] = []; }
      byEn[e.en].push(e);
    });

    // 表示に使う en->ja の最終マップ。character が分かればそれを優先。
    // 同じ en に character 違いで複数の ja がある場合、character 不明なら
    // 最初に見つかったものを使いつつ ambiguous 扱いにする（英語併記）。
    var resolved = Object.create(null); // en -> { ja, character, ambiguous }
    Object.keys(byEn).forEach(function (en) {
      var candidates = byEn[en];
      var distinctJa = {};
      candidates.forEach(function (c) { distinctJa[c.ja] = true; });
      var ambiguous = Object.keys(distinctJa).length > 1;

      var chosen = null;
      if (charName) {
        chosen = candidates.filter(function (c) { return c.character === charName; })[0];
      }
      if (!chosen) { chosen = candidates[0]; }

      resolved[en] = { ja: chosen.ja, character: chosen.character || null, ambiguous: ambiguous };
    });

    return { byEn: byEn, resolved: resolved };
  }

  // ---- 画面右下の動作確認トースト ----

  function showStatusToast(message) {
    var el = document.createElement('div');
    el.textContent = message;
    el.style.cssText =
      'position:fixed;right:12px;bottom:12px;z-index:2147483647;max-width:340px;' +
      'background:rgba(20,20,20,0.85);color:#fff;padding:6px 10px;' +
      'border-radius:6px;font:12px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;' +
      'white-space:pre-line;box-shadow:0 2px 8px rgba(0,0,0,0.3);pointer-events:none;';
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) { el.parentNode.removeChild(el); }
    }, 3000);
  }

  // ---- 4. カード名 -> 効果文 挿入 ----

  var PROCESSED = new WeakSet(); // 挿入済みの説明ブロック

  // effects-ja.json は { ja_card, character, level, effect } の配列。
  // 同じ ja_card + character で level（ヒラメキ段階、0=無印）違いを複数持てる。
  //
  // 照合は緩めに行う（URLスラッグ由来の character は小文字、JSON側は
  // "Heidemarie" のように大文字始まりなど、表記ゆれがあり得るため）:
  //   - character: 前後空白除去 + 小文字化してから比較
  //   - ja_card: 前後空白除去してから比較
  //   - level: 数値・文字列どちらでも同じキーになるよう数値に正規化
  function normText(s) {
    return (s === null || s === undefined ? '' : String(s)).trim();
  }

  function normChar(s) {
    return normText(s).toLowerCase();
  }

  function normLevel(l) {
    var n = typeof l === 'string' ? parseInt(l, 10) : l;
    return typeof n === 'number' && !isNaN(n) ? n : 0;
  }

  function effectsKey(character, jaName, level) {
    return normChar(character) + '|' + normText(jaName) + '|' + normLevel(level);
  }

  // source は "ingame"（実機で確認した文言）「aosns"（nightmare.aosns.com
  // から取得した文言）「gamerch"（gamerchから自動収集した文言）のいずれか。
  //
  // 【緊急】gamerch由来の828件について、無関係な別カードの効果文を誤って
  // 表示してしまうケースが見つかったため、信頼性を再評価するまで
  // buildEffectsIndex で source:"gamerch" のエントリを一切索引に載せない
  // （＝常に「効果文なし」扱いとなり英語のまま残る。誤った効果文を出す
  // ほうが英語のまま残すより有害なため）。
  function effectSource(e) {
    if (e.source === 'ingame') { return 'ingame'; }
    if (e.source === 'aosns') { return 'aosns'; }
    return 'gamerch';
  }

  function setEffectIfAllowed(idx, key, value) {
    var existing = idx[key];
    if (existing && existing.source === 'ingame' && value.source !== 'ingame') { return; }
    idx[key] = value;
  }

  function buildEffectsIndex(effects) {
    var idx = Object.create(null);
    effects.forEach(function (e) {
      if (!e || !e.ja_card || !e.effect) { return; }
      var source = effectSource(e);
      if (source === 'gamerch') { return; } // 信頼性の問題により一時停止中
      var level = normLevel(e.level);
      // incomplete: 自動収集時に「評価コメントとの境界が曖昧で、安全側
      // （先頭の一文だけ）に切り出した」ことを示すフラグ。末尾の効果節を
      // 取りこぼしている可能性がある（ingameで上書きされれば解消する）。
      var value = { effect: e.effect, source: source, incomplete: e.incomplete === true };
      if (e.character) {
        setEffectIfAllowed(idx, effectsKey(e.character, e.ja_card, level), value);
      }
      // character なし・またはフォールバック用に character 抜きキーも登録
      // （character が分かっている場面では上の複合キーが優先されるので実害は小さい）
      setEffectIfAllowed(idx, effectsKey(null, e.ja_card, level), value);
    });
    return idx;
  }

  // level は完全一致のみ。該当レベルの効果文が無ければ null（他レベルへの
  // フォールバックはしない）。戻り値は { effect, source } または null。
  function lookupEffect(effectsIdx, jaName, character, level) {
    if (character) {
      var withChar = effectsKey(character, jaName, level);
      if (effectsIdx[withChar] !== undefined) { return effectsIdx[withChar]; }
    }
    var withoutChar = effectsKey(null, jaName, level);
    if (effectsIdx[withoutChar] !== undefined) { return effectsIdx[withoutChar]; }
    return null;
  }

  // 診断表示用。実際の照合は正規化したキー（effectsKey）で行うが、トースト上
  // では元の表記のまま「ja_card | character | level」の形で見せる。
  function displayKey(jaName, character, level) {
    return jaName + ' | ' + (character || '(無)') + ' | ' + level;
  }

  function queryAny(root, selectors) {
    for (var i = 0; i < selectors.length; i++) {
      try {
        var el = root.querySelector(selectors[i]);
        if (el) { return el; }
      } catch (err) { /* 不正なセレクタは無視して次を試す */ }
    }
    return null;
  }

  function queryAllAny(root, selectors) {
    var found = new Set();
    selectors.forEach(function (sel) {
      try {
        root.querySelectorAll(sel).forEach(function (el) { found.add(el); });
      } catch (err) { /* 不正なセレクタは無視 */ }
    });
    return Array.from(found);
  }

  // 種別表示（"Attack"/"Skill"）等、指定した文字列と一致する要素（葉要素優先）を
  // 全ページから探す。
  function findMarkerElements(markerTexts) {
    var exact = [];
    var partial = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.children.length > 0) { continue; } // 葉要素のみ
      var text = (node.textContent || '').trim();
      if (!text) { continue; }
      for (var i = 0; i < markerTexts.length; i++) {
        if (text === markerTexts[i]) { exact.push(node); break; }
        if (text.indexOf(markerTexts[i]) !== -1) { partial.push(node); break; }
      }
    }
    return exact.length > 0 ? exact : partial;
  }

  function hasExcludedSuffix(text) {
    var suffixes = CZN_SELECTORS.nameExcludeSuffixes || [':'];
    for (var i = 0; i < suffixes.length; i++) {
      if (text.charAt(text.length - 1) === suffixes[i]) { return true; }
    }
    return false;
  }

  // scope 内の葉要素で、末尾がコロン等でなく、かつ（ヒラメキ段階のローマ数字を
  // 除いたベース名が）knownEnNames（glossary.json の英語カード名一覧）と
  // 完全一致するものを探す。「Starting Cards:」のようなグループ見出しは、
  // コロン除外・glossary不一致の両方で弾かれる。excludeRoot（種別表示要素自身）
  // の内側は見ない。
  //
  // scope 内に複数の候補が見つかることがある（例: 効果文中に別カード名への
  // 言及がある場合）。単純に「最初に見つかった候補」を採用すると、
  // excludeRoot（種別表示要素）から実際には遠い、無関係な候補を拾って
  // しまうことがあるため、DOM順の走査位置が excludeRoot に最も近い候補を
  // 優先する。
  function findGlossaryNameLeaf(scope, excludeRoot, knownEnNames) {
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT);
    var node;
    var index = 0;
    var excludeIndex = -1;
    var matches = []; // { node, index }
    while ((node = walker.nextNode())) {
      if (node === excludeRoot) { excludeIndex = index; }
      if (node.children.length > 0) { index++; continue; } // 葉要素のみ
      if (excludeRoot && (node === excludeRoot || excludeRoot.contains(node))) { index++; continue; }
      var text = (node.textContent || '').trim();
      if (text && !hasExcludedSuffix(text) && knownEnNames.has(stripRomanLevel(text).base)) {
        matches.push({ node: node, index: index });
      }
      index++;
    }
    if (matches.length === 0) { return null; }
    if (matches.length === 1 || excludeIndex === -1) { return matches[0].node; }
    matches.sort(function (a, b) {
      return Math.abs(a.index - excludeIndex) - Math.abs(b.index - excludeIndex);
    });
    return matches[0].node;
  }

  // 種別表示要素（"Attack"/"Skill"）から親を1階層ずつたどり、「カード名候補
  // （glossaryと完全一致、かつコロン終わりでない）を含む最小の祖先」を
  // カード枠として返す。それより外は探索しない。
  //
  // 重要: 登った先の祖先要素に、自分以外の種別表示（Attack/Skill）が
  // 複数含まれてしまった時点で、それはもう「1枚のカードの枠」を超えて
  // 複数カードをまたぐ共通の祖先（カードグリッド全体等）になっている。
  // そこから見つかる「既知の名前」は無関係な別カードのものである危険が
  // 高いため、これ以上は登らずに探索を打ち切る（＝そのカードは名前を
  // 特定できないものとして null を返し、呼び出し側で処理対象外にする）。
  // 見つからなければ、無理に候補を採用せず null を返す。
  function findCardBox(typeLabelEl, knownEnNames, allTypeLabels) {
    var maxClimb = CZN_SELECTORS.maxAncestorClimb || 10;
    var el = typeLabelEl;
    for (var depth = 0; depth < maxClimb && el.parentElement; depth++) {
      el = el.parentElement;

      var labelsInScope = 0;
      for (var i = 0; i < allTypeLabels.length; i++) {
        if (el.contains(allTypeLabels[i])) {
          labelsInScope++;
          if (labelsInScope > 1) { break; }
        }
      }
      if (labelsInScope > 1) { break; } // 複数カードをまたいだので打ち切る

      var nameEl = findGlossaryNameLeaf(el, typeLabelEl, knownEnNames);
      if (nameEl) {
        return { box: el, nameEl: nameEl };
      }
    }
    return null;
  }

  // findCardBox が失敗したときの診断表示用。実際の照合には使わない
  // （既知のカード名かどうかを問わず、種別表示の近くにある何らかの
  // テキストを best-effort で拾うだけ）。
  function guessNearbyTextForDiagnostics(typeLabelEl) {
    var el = typeLabelEl.parentElement;
    for (var depth = 0; depth < 3 && el; depth++) {
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT);
      var node;
      while ((node = walker.nextNode())) {
        if (node.children.length > 0) { continue; }
        if (node === typeLabelEl) { continue; }
        var text = (node.textContent || '').trim();
        if (text && text !== 'Attack' && text !== 'Skill' && !/^[0-9]+$/.test(text)) {
          return text;
        }
      }
      el = el.parentElement;
    }
    return '(不明)';
  }

  // box 内で、カード名要素そのものとは別に、ローマ数字（I/II/III/IV/V）
  // だけを内容とする葉要素を探す。カード名にローマ数字が含まれていない
  // （stripRomanLevel が level 0 を返した）場合のフォールバックで、
  // 名前とヒラメキ段階の表示が別要素に分かれているレイアウトに対応する。
  function findLevelBadge(box, excludeEls) {
    var walker = document.createTreeWalker(box, NodeFilter.SHOW_ELEMENT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.children.length > 0) { continue; }
      if (excludeEls.indexOf(node) !== -1) { continue; }
      var text = (node.textContent || '').trim();
      if (Object.prototype.hasOwnProperty.call(ROMAN_LEVELS, text)) { return node; }
    }
    return null;
  }

  // scope 内で、カード画像下部にある「英語の効果文」の要素を選ぶ。
  // このサイト上では getBoundingClientRect() が候補要素に対して常に
  // 0x0 を返すことが判明し（画面上には表示されているにもかかわらず）、
  // 実測による幅・高さ検証が機能しないため、サイズに基づく判定は全廃した。
  // 代わりに、除外条件を満たさない葉要素の中で textContent の文字数が
  // 最も多いものを1つ選ぶ（効果文は他のUI文言より明らかに長いため）。
  // 除外するのはカード名要素（c.nameEl）・既に書き換え済み
  // （data-czn-done="1"）・textContentが10文字未満の3種類のみ。
  function selectEffectTextElement(scope, nameEl) {
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT);
    var node;
    var best = null;
    var bestLen = 0;

    while ((node = walker.nextNode())) {
      if (node.children.length > 0) { continue; } // 葉要素のみ
      if (node === nameEl) { continue; }
      if (node.getAttribute('data-czn-done') === '1') { continue; }
      var text = (node.textContent || '').trim();
      if (text.length < 10) { continue; }
      if (text.length > bestLen) {
        best = node;
        bestLen = text.length;
      }
    }

    return best;
  }

  // 名前照合用の（狭い）カード枠 box から、内容の増分を基準に効果文の探索
  // 範囲を広げる。階層数だけで判断すると、box がカード名＋種別表示だけの
  // ヘッダー部分で、効果文が全く別の場所にあるケースに対応できないため
  // （box が固定の階層数では届かないほど遠いことがある）。box から親を
  // 1階層ずつたどり、その要素の textContent が box の textContent より
  // 50文字以上多くなった時点で、そこを探索範囲として採用する（＝効果文
  // 相当のまとまった量のテキストが新たに含まれるようになったとみなす）。
  // 最大 maxClimb 階層まで許可。2つ目の種別表示（Attack/Skill）を含む
  // 階層に達したら、別カードの領域に踏み込んだとみなし、その1つ手前
  // （登る前）の要素で打ち切る（findCardBoxの「複数カードをまたいだら
  // 打ち切る」と同じ考え方）。内容の増分条件を満たさないまま maxClimb に
  // 達した場合は、そこまでで登れた最も広い（安全な）要素を返す。
  function findEffectSearchScope(box, allTypeLabels, maxClimb) {
    var boxTextLen = (box.textContent || '').length;
    var el = box;
    var climbed = 0;
    for (var depth = 0; depth < maxClimb && el.parentElement; depth++) {
      var next = el.parentElement;

      var labelsInScope = 0;
      for (var i = 0; i < allTypeLabels.length; i++) {
        if (next.contains(allTypeLabels[i])) {
          labelsInScope++;
          if (labelsInScope > 1) { break; }
        }
      }
      if (labelsInScope > 1) { break; } // 別カードの種別表示を含んだので1つ手前で打ち切る

      el = next;
      climbed = depth + 1;
      var elTextLen = (el.textContent || '').length;
      if (elTextLen >= boxTextLen + 50) { break; } // 内容が十分増えたのでここで採用
    }
    return { scope: el, climbedLevels: climbed };
  }

  // scope内で、テキストを持つ葉要素の数を数える。診断用（box が小さすぎて
  // 中身が無いのか、テキストはあるが除外条件で弾かれているのかを
  // 切り分けるため）。
  function countTextLeaves(scope) {
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT);
    var node;
    var count = 0;
    while ((node = walker.nextNode())) {
      if (node.children.length > 0) { continue; } // 葉要素のみ
      if ((node.textContent || '').trim()) { count++; }
    }
    return count;
  }

  // effectEl の直近の親要素の中に残っている、他の英語テキスト（effectEl
  // 自身とその子孫は除く）を display:none で隠す。日本語の効果文を実際に
  // 適用できたカードに限って呼ぶ（適用できなかったカードは英語のまま
  // 残すため、この関数自体を呼ばない）。excludeEls（カード名・種別表示・
  // レベルバッジ）は誤って隠さないよう対象から外す。「Show Effects」は
  // 展開トグルの機能を持つことがあるため、テキストとして隠さない。
  function hideSiblingEffectText(effectEl, excludeEls) {
    var parent = effectEl.parentElement;
    if (!parent) { return; }
    var walker = document.createTreeWalker(parent, NodeFilter.SHOW_ELEMENT);
    var node;
    while ((node = walker.nextNode())) {
      if (node === effectEl || effectEl.contains(node)) { continue; }
      if (excludeEls.indexOf(node) !== -1) { continue; }
      if (node.children.length > 0) { continue; } // 葉要素のみ
      var text = (node.textContent || '').trim();
      if (!text) { continue; }
      if (text.indexOf('Show Effects') !== -1) { continue; }
      node.style.display = 'none';
    }
  }

  // ---- フェーズ1: カード名の収集（原文のまま。ここでは一切DOMを書き換えない） ----
  //
  // 用語置換より前にこのフェーズを完全に終わらせることで、見出しが
  // 「Sword Rain(剣の雨)」のような置換後テキストに化けた状態で glossary を
  // 引いてしまう事故を防ぐ。挿入・置換のどちらもまだ行っていない状態で、
  // block（説明ブロック）・nameEl（見出し）・nameText（原文）・entry（glossary
  // 照合結果、無ければ null）だけを集める。

  function collectCardCandidatesByMarker(ctx) {
    var typeLabels = findMarkerElements(CZN_SELECTORS.typeLabelText || ['Attack', 'Skill']);
    log('type label elements found:', typeLabels.length);
    var knownEnNames = new Set(Object.keys(ctx.resolved));
    var candidates = [];
    var skippedCount = 0;
    var skippedNames = []; // 名前を特定できずスキップしたカードの診断用（最大5件）

    typeLabels.forEach(function (label) {
      var found = findCardBox(label, knownEnNames, typeLabels);
      if (!found) {
        log('card box (name + type label) not found for a label');
        skippedCount++;
        if (skippedNames.length < 5) {
          skippedNames.push(guessNearbyTextForDiagnostics(label));
        }
        return;
      }

      var nameText = readNameText(found.nameEl);
      var parsed = stripRomanLevel(nameText);
      var level = parsed.level;
      var levelBadgeEl = null;

      // カード名自体にローマ数字が含まれていなければ（level 0 のままなら）、
      // 名前とは別要素になっているレベル表示（"III" だけの葉要素）を探す。
      if (level === 0) {
        levelBadgeEl = findLevelBadge(found.box, [found.nameEl, label]);
        if (levelBadgeEl) {
          level = ROMAN_LEVELS[(levelBadgeEl.textContent || '').trim()];
        }
      }

      candidates.push({
        block: found.box,
        nameEl: found.nameEl,
        typeLabelEl: label,
        levelBadgeEl: levelBadgeEl,
        rawNameText: nameText,
        nameText: nameText,
        baseName: parsed.base,
        level: level,
        entry: ctx.resolved[parsed.base] || null
      });
    });

    // attemptedCount: 種別表示(Attack/Skill)が見つかった件数（＝カード枠の
    // 試行件数）。candidates.length はそのうちカード名まで特定できた件数。
    // 同名カード（例: Sword Rain I〜V）も1件ずつ別の candidate として積む
    // （box ごとに処理するため、名前で集約・重複排除はしない）。
    // skippedCount/skippedNames: 名前を特定できず処理対象外にしたカード
    // （無理に近い候補を採用せず null を返した結果、英語のまま残るカード）。
    return {
      candidates: candidates,
      attemptedCount: typeLabels.length,
      skippedCount: skippedCount,
      skippedNames: skippedNames,
      typeLabels: typeLabels // 効果文の探索範囲を広げる際、他カードとの境界判定に使う
    };
  }

  // useMarkerStrategy: false のときだけ使う、セレクタ直指定の経路。
  // 正確な cardContainer / cardName / effectSlot が selectors.js に
  // 書かれている前提（空配列なら何も見つからず 0 件になる）。
  function collectCardCandidatesBySelectors(ctx) {
    var containers = queryAllAny(document.body, CZN_SELECTORS.cardContainer);
    log('card containers found:', containers.length);
    var candidates = [];

    containers.forEach(function (container) {
      var nameEl = queryAny(container, CZN_SELECTORS.cardName);
      if (!nameEl) { return; }
      var slot = queryAny(container, CZN_SELECTORS.effectSlot);
      if (!slot) { return; }

      var nameText = readNameText(nameEl);
      var parsed = stripRomanLevel(nameText);
      var level = parsed.level;
      var levelBadgeEl = null;
      if (level === 0) {
        levelBadgeEl = findLevelBadge(container, [nameEl]);
        if (levelBadgeEl) {
          level = ROMAN_LEVELS[(levelBadgeEl.textContent || '').trim()];
        }
      }

      candidates.push({
        block: slot,
        nameEl: nameEl,
        typeLabelEl: null,
        levelBadgeEl: levelBadgeEl,
        rawNameText: nameText,
        nameText: nameText,
        baseName: parsed.base,
        level: level,
        entry: ctx.resolved[parsed.base] || null
      });
    });

    return {
      candidates: candidates,
      attemptedCount: containers.length,
      skippedCount: 0,
      skippedNames: [],
      typeLabels: []
    };
  }

  function collectCardCandidates(ctx) {
    return CZN_SELECTORS.useMarkerStrategy === false
      ? collectCardCandidatesBySelectors(ctx)
      : collectCardCandidatesByMarker(ctx);
  }

  // ---- フェーズ2: 効果文の挿入 ----
  //
  // 戻り値の diagnostics は「効果文0件」のときにトーストで理由を出すための
  // デバッグ情報（検出名 / glossaryで日本語化できたか / 効果文が見つかったか）。
  // 最大10件まで持つ。candidates は box ごとに独立しているため、同名カード
  // （Sword Rain I〜V 等）も集約せずそれぞれ別行として積む。

  // diagnostics の並び順: 効果文が見つかったもの > glossaryで日本語化できた
  // もの > ヒラメキ段階（level）が付いているもの、の優先度で並べ替えてから
  // 先頭10件を残す。全滅（効果文0件）のときでも、glossary照合済み・非0
  // レベルのカード（＝手がかりの多いカード。例: Sword Rain III）が単純な
  // DOM順のキャップで埋もれて表示から漏れないようにするための優先度。
  function diagnosticScore(d) {
    var s = 0;
    if (d.effectFound) { s += 4; }
    if (d.entry) { s += 2; }
    if (d.level !== 0) { s += 1; }
    return s;
  }

  function insertEffects(candidates, effectsIdx, charName, allTypeLabels) {
    var inserted = 0;
    var diagnostics = [];
    var rewriteDetails = []; // 書き換えた要素の内訳（診断用）
    var rewriteFailures = []; // 効果文は見つかったのに書き換えに失敗した内訳（診断用）
    var maxExtraClimb = CZN_SELECTORS.maxEffectSearchClimb || 10;

    candidates.forEach(function (c) {
      if (PROCESSED.has(c.block)) { return; }

      var lookupChar = c.entry ? (c.entry.character || charName) : null;
      var effect = c.entry
        ? lookupEffect(effectsIdx, c.entry.ja, lookupChar, c.level)
        : null;

      diagnostics.push({
        rawNameText: c.rawNameText || c.nameText,
        nameText: c.nameText,
        entry: c.entry,
        level: c.level,
        effectFound: !!effect,
        triedKeyDisplay: c.entry ? displayKey(c.entry.ja, lookupChar, c.level) : null
      });

      if (!c.entry) { PROCESSED.add(c.block); return; } // glossaryに無いカード名

      var excludeEls = [c.nameEl];
      if (c.typeLabelEl) { excludeEls.push(c.typeLabelEl); }
      if (c.levelBadgeEl) { excludeEls.push(c.levelBadgeEl); }

      // カード名は glossary が分かっていれば効果文の有無とは無関係に常に
      // 日本語のみにする。用語置換の正規表現マッチに依存せず、既に解決済みの
      // c.entry.ja を直接書き込むことで確実に反映する（一部のカード名は
      // glossary側が未確認の英語表記のままのことがあり、通常の用語置換
      // フェーズでは置き換わらないため）。
      if (c.nameEl.getAttribute('data-czn-done') !== '1') {
        if (!c.nameEl.hasAttribute('data-czn-orig-name')) {
          c.nameEl.setAttribute('data-czn-orig-name', (c.nameEl.textContent || '').trim());
        }
        var jaName = c.entry.ja;
        // ローマ数字がカード名要素自身に含まれていた場合（levelBadgeElを
        // 使っていない場合）のみ、日本語名にも同じローマ数字を付け直す。
        if (!c.levelBadgeEl && c.level > 0 && ROMAN_BY_LEVEL[c.level]) {
          jaName += ' ' + ROMAN_BY_LEVEL[c.level];
        }
        c.nameEl.textContent = jaName;
        c.nameEl.setAttribute('data-czn-done', '1');
      }

      if (!effect) { PROCESSED.add(c.block); return; } // 該当levelの効果文が無い

      // gamerch由来（非公式・自動収集の文言）には末尾に「※」を付けて、
      // 実機確認済み（ingame）の文言と一目で区別できるようにする。
      // incomplete（切り出しが不完全な可能性がある）には「(一部)」も付ける。
      // 両方を満たす場合は併記する。
      var jaText = effect.effect +
        (effect.source === 'gamerch' ? '※' : '') +
        (effect.incomplete ? '(一部)' : '');

      // 名前照合用の（狭い）カード枠 box とは別に、効果文の探索範囲は
      // 内容の増分を基準にそこから親をたどって広げる（box が単なるヘッダー
      // 部分で、効果文が全く別の場所にあることがあるため）。ただし2つ目の
      // 種別表示を含む範囲までは広げない。
      var scopeResult = findEffectSearchScope(c.block, allTypeLabels || [], maxExtraClimb);
      var effectScope = scopeResult.scope;

      // このサイト上では getBoundingClientRect() が候補要素に対して常に
      // 0x0 を返すことが判明し（画面上には表示されているにもかかわらず）、
      // 幅・高さの実測による選択・検証は機能しない。そのためサイズに基づく
      // 判定は全廃し、textContent の文字数が最も多い葉要素を無条件で採用する
      // 方式にした（書き換え後の再測定・ロールバックも行わない）。
      var effectEl = selectEffectTextElement(effectScope, c.nameEl);

      if (!effectEl) {
        // box（名前照合用の狭いカード枠）と、探索範囲として実際に採用した
        // scope（内容の増分で広げた後の要素）を別々に記録する。box が
        // 小さすぎるのか、scopeへの拡大が機能していないのか、除外条件が
        // 厳しすぎるのかを切り分けられるようにするため。
        rewriteFailures.push({
          rawNameText: c.rawNameText || c.nameText,
          level: c.level,
          reason: '条件を満たす候補が見つからない（10文字以上のテキスト要素なし）',
          boxTag: c.block.tagName,
          boxClass: (c.block.className || '').toString().slice(0, 40),
          boxTextLeafCount: countTextLeaves(c.block),
          boxTextHead: (c.block.textContent || '').trim().slice(0, 50),
          scopeTag: effectScope.tagName,
          scopeClass: (effectScope.className || '').toString().slice(0, 40),
          scopeClimbedLevels: scopeResult.climbedLevels,
          scopeTextLeafCount: countTextLeaves(effectScope),
          scopeTextHead: (effectScope.textContent || '').trim().slice(0, 50)
        });
        PROCESSED.add(c.block);
        return;
      }

      var originalText = effectEl.textContent;
      effectEl.title = originalText; // 元の英語をtitle属性に退避
      effectEl.textContent = jaText;
      // 縦書き・折り返し崩れを防ぐためのスタイル強制（サイズ判定は行わない
      // が、レイアウト崩れ自体を防ぐためこれらは引き続き適用する）。
      effectEl.style.cssText = effectEl.style.cssText +
        ';background:#fff;color:#111;padding:4px 6px;border-radius:4px;' +
        'white-space:normal;text-overflow:clip;overflow:visible;max-width:none;' +
        'writing-mode:horizontal-tb;word-break:normal;width:auto;min-width:0;';
      effectEl.setAttribute('data-czn-done', '1');

      // 診断用: 書き換え先のタグ名・クラス名と、書き換え前のテキスト先頭
      // 30文字を記録しておく（対象を取り違えていないかトーストで
      // 確認できるようにするため）。
      rewriteDetails.push({
        rawNameText: c.rawNameText || c.nameText,
        level: c.level,
        targetTag: effectEl.tagName,
        targetClass: (effectEl.className || '').toString().slice(0, 40),
        originalTextHead: originalText.trim().slice(0, 30)
      });

      // 効果文ブロック内に、書き換えた要素以外の英語テキストが残っている
      // ことがある（複数行・複数要素に分かれている場合）。日本語の効果文を
      // 適用できたカードに限り、それらも隠す。カード名・種別表示・レベル
      // バッジは巻き込まないよう除外する。
      hideSiblingEffectText(effectEl, excludeEls);

      PROCESSED.add(c.block);
      inserted++;
      log('rewrote effect text for', c.nameText, 'level', c.level);
    });

    diagnostics.sort(function (a, b) { return diagnosticScore(b) - diagnosticScore(a); });
    diagnostics = diagnostics.slice(0, 10);

    return {
      insertedCount: inserted,
      diagnostics: diagnostics,
      rewriteDetails: rewriteDetails.slice(0, 10),
      rewriteFailures: rewriteFailures.slice(0, 10),
      candidateCount: candidates.length
    };
  }

  // ---- 3/6. 用語置換（ブックマークレットと同じアルゴリズム） ----

  var REPLACED_CLS = 'czn-replaced';
  var SKIP_TAGS = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|SELECT|OPTION)$/;

  function collectTextNodes() {
    var nodes = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode()) !== null) {
      if (n.nodeValue === '') { continue; }
      var p = n.parentNode;
      var ok = true;
      while (p && p.nodeType === 1) {
        var cls = p.className ? String(p.className) : '';
        if (SKIP_TAGS.test(p.nodeName) || cls.indexOf(REPLACED_CLS) !== -1 ||
            p.getAttribute('data-czn-done') === '1') {
          ok = false;
          break;
        }
        p = p.parentNode;
      }
      if (ok) { nodes.push(n); }
    }
    return nodes;
  }

  function replaceTermsOnPage(ctx) {
    var keepEn = Object.create(null);
    KEEP_EN_STATIC.forEach(function (w) { keepEn[w] = true; });
    // 同じ en に character 違いで複数の ja がある場合も英語併記にする
    Object.keys(ctx.resolved).forEach(function (en) {
      if (ctx.resolved[en].ambiguous) { keepEn[en] = true; }
    });

    var alts = Object.keys(ctx.resolved)
      .sort(function (a, b) { return b.length - a.length; })
      .map(rxEscape);
    if (alts.length === 0) { return; }
    var re = new RegExp(alts.join('|'), 'g');

    var count = 0;
    collectTextNodes().forEach(function (node) {
      var text = node.nodeValue;
      var frag = null;
      var last = 0;
      var m;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) {
        var s = m.index;
        var e = s + m[0].length;
        if (isWordChar(text.charAt(s - 1)) || isWordChar(text.charAt(e))) { continue; }

        var en = m[0];
        var levelSuffix = ''; // " III" のように、先頭スペース込みで保持する
        // 直後にヒラメキ段階のローマ数字が単語境界付きで続いていれば、
        // まとめて1つの用語として扱う（例: "Sword Rain III"）。
        var romanMatch = /^ (I{1,3}|IV|V)(?![A-Za-z0-9])/.exec(text.slice(e));
        if (romanMatch) {
          levelSuffix = romanMatch[0];
          e += romanMatch[0].length;
        }
        re.lastIndex = e;

        if (frag === null) { frag = document.createDocumentFragment(); }
        if (s > last) { frag.appendChild(document.createTextNode(text.slice(last, s))); }
        var ja = ctx.resolved[en].ja + levelSuffix;
        var span = document.createElement('span');
        span.className = REPLACED_CLS;
        span.textContent = keepEn[en] ? en + levelSuffix + '(' + ja + ')' : ja;
        span.title = en + levelSuffix;
        frag.appendChild(span);
        last = e;
        count++;
      }
      if (frag !== null) {
        if (last < text.length) { frag.appendChild(document.createTextNode(text.slice(last))); }
        if (node.parentNode) { node.parentNode.replaceChild(frag, node); }
      }
    });
    log('replaced', count, 'terms');
    return count;
  }

  // ---- 起動 ----
  //
  // 順序が重要: 1) カード名を原文のまま収集 → 2) 効果文を挿入 →
  // 3) そのあとで用語置換（テキストを書き換える）を実行する。
  // 用語置換を先にやると見出しが「Sword Rain(剣の雨)」のように化けて
  // glossary 照合に失敗するため、この順序を崩さないこと。
  //
  // 初回表示後もSPA側の再描画でDOMが丸ごと差し替えられ、挿入済みの効果文や
  // 用語置換のspanが消えることがある（PROCESSEDはWeakSetなのでboxごと
  // 差し替えられれば自然に「未処理」扱いに戻り、replaceTermsOnPage側も
  // czn-replaced クラスの有無で判定しているため、差し替え後のテキストは
  // 単に「まだ置換されていない新しいテキスト」として再度拾われる）。そのため
  // MutationObserver からもこの3段階をまとめて再実行する。

  function processPage(ctx, effectsIdx, charName) {
    var collected = collectCardCandidates(ctx);             // 1. カード名（原文）
    var candidates = collected.candidates;
    var insertResult = insertEffects(candidates, effectsIdx, charName, collected.typeLabels); // 2. 効果文挿入
    var replacedCount = replaceTermsOnPage(ctx);             // 3. 用語置換

    // ユニーク件数はカード枠（box）単位ではなく、ベース名（ローマ数字除去後）
    // 単位で数える。同じ名前の複数レベル（Sword Rain I〜V 等）は1件として
    // まとめて数え、box ごとの処理そのものには一切影響しない（診断表示用）。
    var uniqueNames = new Set(candidates.map(function (c) { return c.baseName; }));

    return {
      insertedCount: insertResult.insertedCount,
      diagnostics: insertResult.diagnostics,
      rewriteDetails: insertResult.rewriteDetails,
      rewriteFailures: insertResult.rewriteFailures,
      attemptedCount: collected.attemptedCount, // カード枠: 種別表示から検出を試みた件数
      resolvedCount: insertResult.candidateCount, // 名前取得: カード名まで特定できた件数
      uniqueCount: uniqueNames.size, // ユニーク: ベース名（レベル違いをまとめた）の種類数
      skippedCount: collected.skippedCount, // 名前を特定できず処理対象外にした件数
      skippedNames: collected.skippedNames, // そのうち最大5件の診断用テキスト
      replacedCount: replacedCount
    };
  }

  function run(entries, effects) {
    var charName = currentCharacter();
    log('character context:', charName);
    var ctx = buildContext(entries, charName);
    var effectsIdx = buildEffectsIndex(effects);

    var result = processPage(ctx, effectsIdx, charName);
    result.ctx = ctx;
    // effects-ja.json が読めているかの診断用。0件なら未配置か読み込み失敗
    // （拡張の web_accessible_resources 未設定などでブロックされている場合も
    // ここに現れる）。effectsCount はファイル全体の件数（source:"gamerch" も
    // 含む）。indexedCount は実際に索引に載り、照合に使われる件数
    // （buildEffectsIndex が source:"gamerch" を除外するため、両者は現在
    // 一致しない）。保有キーも indexedCount 側（実際に使われるキー）だけを
    // 元の表記のまま最大20件だけトーストに出す。
    result.effectsCount = effects.length;
    var usableEffects = effects.filter(function (e) {
      return e && e.ja_card && e.effect && effectSource(e) !== 'gamerch';
    });
    result.effectsIndexedCount = usableEffects.length;
    result.effectsSummary = usableEffects.slice(0, 20).map(function (e) {
      return displayKey(e.ja_card, e.character, normLevel(e.level));
    });
    return result;
  }

  function formatToastMessage(result) {
    if (result.attemptedCount === 0 && result.replacedCount === 0) {
      return 'CZN: 対象が見つかりません';
    }

    var lines = ['CZN: ' + result.replacedCount + '件を置換 / カード枠' +
      result.attemptedCount + '件 / 名前取得' + result.resolvedCount +
      '件 / ユニーク' + result.uniqueCount + '件 / 効果文' +
      result.insertedCount + '件 / 効果文データ' + result.effectsCount +
      '件(有効' + result.effectsIndexedCount + '件) / 名前特定スキップ' +
      result.skippedCount + '件'];

    if (result.skippedCount > 0) {
      // 名前を特定できず処理対象外にしたカード（無理に近い候補を採用せず
      // 英語のまま残したもの）。別カードへの誤爆が起きていないか、
      // どのカードがスキップされているかをその場で確認できるようにする。
      result.skippedNames.forEach(function (t) {
        lines.push('スキップ: 「' + t + '」');
      });
    }

    if (result.insertedCount > 0) {
      // 書き換え先を間違えていないか（カード名要素等を誤って書き換えて
      // いないか）その場で確認できるよう、書き換えた要素のタグ名・
      // クラス名と、書き換え前のテキスト先頭30文字を出す。
      result.rewriteDetails.forEach(function (d) {
        lines.push('書換: 原文「' + d.rawNameText + '」/ level ' + d.level +
          ' / ' + d.targetTag + (d.targetClass ? '.' + d.targetClass : '') +
          ' / 書換前「' + d.originalTextHead + '」');
      });
    }

    if (result.rewriteFailures && result.rewriteFailures.length > 0) {
      // 照合（entry・effectの取得）までは成功しているのに、実際の書き換え
      // 段階で失敗したカード。「効果文あり」なのに画面が変わらないという
      // 矛盾の原因をここで直接確認できるようにする。box情報（名前照合用の
      // 狭いカード枠）、scope情報（内容の増分で広げた後の実際の探索範囲。
      // boxとは別に表示し、範囲拡大が機能しているか切り分けられるように
      // する）を併せて出す。
      result.rewriteFailures.forEach(function (f) {
        var boxPart = f.boxTag
          ? (' / box:' + f.boxTag + (f.boxClass ? '.' + f.boxClass : '') +
             ' 中のテキスト要素' + f.boxTextLeafCount + '件' +
             ' / box冒頭「' + f.boxTextHead + '」')
          : '';
        var scopePart = f.scopeTag
          ? (' / scope(' + f.scopeClimbedLevels + '階層):' + f.scopeTag +
             (f.scopeClass ? '.' + f.scopeClass : '') +
             ' 中のテキスト要素' + f.scopeTextLeafCount + '件' +
             ' / scope冒頭「' + f.scopeTextHead + '」')
          : '';
        lines.push('挿入失敗: 原文「' + f.rawNameText + '」/ level ' + f.level +
          ' / ' + f.reason + boxPart + scopePart);
      });
    }

    if (result.insertedCount === 0) {
      if (result.resolvedCount === 0) {
        lines.push('→ カード枠（カード名+種別表示の最小共通祖先）を検出できません');
      } else {
        if (result.effectsIndexedCount === 0) {
          lines.push('→ 有効な効果文データが0件です（未配置・読み込み失敗、または' +
            '全件がsource:"gamerch"で除外されている可能性）');
        } else {
          lines.push('保有キー(有効' + result.effectsIndexedCount + '件): ' +
            result.effectsSummary.join('、'));
        }
        result.diagnostics.forEach(function (d) {
          var jaPart = d.entry ? d.entry.ja : '日本語化NG';
          var effectPart = d.effectFound ? '効果文あり' : '効果文なし';
          var keyPart = d.triedKeyDisplay ? ' → 探索キー「' + d.triedKeyDisplay + '」' : '';
          lines.push('原文「' + d.rawNameText + '」→ ' + jaPart + ' / level ' + d.level +
            keyPart + ' → ' + effectPart);
        });
      }
    }

    return lines.join('\n');
  }

  getEnabled().then(function (enabled) {
    if (!enabled) { log('disabled via popup toggle'); return; }

    Promise.all([fetchGlossary(), fetchEffects()]).then(function (results) {
      var entries = results[0];
      var effects = results[1];
      var result = run(entries, effects);
      var ctx = result.ctx;

      showStatusToast(formatToastMessage(result));

      // SPA的な再描画に対応する簡易 MutationObserver。連続発火を間引きつつ、
      // 収集→挿入→置換の3段階をまとめて再実行する（用語置換だけ除外すると、
      // 再描画で消えた置換結果が復活しないため）。
      var pending = false;
      var observer = new MutationObserver(function () {
        if (pending) { return; }
        pending = true;
        setTimeout(function () {
          pending = false;
          var freshEffectsIdx = buildEffectsIndex(effects);
          processPage(ctx, freshEffectsIdx, currentCharacter());
        }, 500);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }).catch(function (err) {
      console.error('[czn-ext] 初期化に失敗:', err);
      showStatusToast('CZN: 初期化に失敗しました');
    });
  });
})();
