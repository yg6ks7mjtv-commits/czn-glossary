// CZN 用語対応表 拡張 — prydwen.gg (Chaos Zero Nightmare) 用コンテンツスクリプト。
// 開発用・非公開。ストアには出さず、デベロッパーモードのフォルダ読み込みで使う前提。
//
// やること:
//   1. glossary.json（公開URL）と effects-ja.json（拡張に同梱・非公開）を読む
//   2. 【既定・確定セレクタ方式】Prydwenの実際のDOM構造が判明したため、
//      .chaos-card-inside を1枚のカードとして直接検出する（種別表示から
//      推測で探索する旧方式は削除せず残してあり、selectors.js の
//      useConfirmedStructure を false にすれば無効化できる）。カード内の
//      img[alt] からカード名（ローマ数字付き）を取得し、glossary.json の
//      英語カード名と照合する。カード名の表示先は .chaos-header 内で
//      glossary名と一致する葉要素（ヘッダーにはコスト数字・種別表示も
//      同居するため、ヘッダー全体ではなく該当要素だけを特定して書き換える）。
//      見つからなければ無理に近い候補を採用せず、そのカードは処理対象外
//      （英語のまま）にする（誤った日本語や誤った効果文が表示されるより、
//      英語のまま残るほうが安全なため）
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
//      データにあれば、そのカード内の .chaos-content の直下の最初の子要素
//      （writeTarget）だけを書き換え対象にする（.chaos-content 直下は
//      子要素に分かれており、最初の子要素が基本効果、2つ目以降が神ヒラメキ
//      等の追加行のため、.chaos-content 全体を対象にすると追加行のテキスト
//      ごと消えてしまうことが分かった。子要素が1つしかなければ結果的に
//      従来通りの範囲になる。旧方式へのフォールバック時のみ、名前照合用の
//      box から内容の増分を基準に範囲を広げる findEffectSearchScope の
//      結果をそのまま使う）。
//      英語の効果文は1つの要素にまとまっておらず、複数のテキストノードに
//      分割されているため、「正しい1要素を選ぶ」方式は成立しない。代わりに
//      テキストノード単位で直接操作する: writeTarget内のテキストノードを
//      文書順に全て集め、カード名要素・種別表示・a/button要素の配下・
//      空白のみ・（旧方式のみ）コスト数字（親要素の内容が数字のみ）を
//      除いた残りのうち、最初の1つに日本語の効果文を入れ、2つ目以降は
//      空文字にする。要素の削除・非表示・スタイル変更は行わず、テキストの
//      中身だけを変える。元の英文（集めたテキストノードの連結）は
//      writeTarget の data-czn-orig 属性に退避する。writeTarget に
//      data-czn-done="1" を付けて二重処理を防ぐが、ページ側の再描画で
//      テキストノードだけが英語に作り直され、要素自体とその属性は残る
//      ことがあるため、属性だけで「処理済み」と判定せず、writeTarget の
//      現在のテキストに書き込んだはずの日本語が実際に含まれているかを
//      毎回確認する。含まれていなければ未処理として扱い、再度書き換える
//      （タイマーによる自発的な再試行はせず、MutationObserverによる
//      再スキャン、および writeTarget ごとに個別設置した MutationObserver
//      による自動修復に任せる。後者は書き込み直後にページ側が上書きする
//      ケース向けで、同一要素への書き直しは最大10回まで）。対象のテキスト
//      ノードが1つも見つからないカードや、日本語の効果文が無いカードには
//      何もしない（英語のまま残る）
//   4. ブックマークレットと同じロジックで、カード以外のテキストの用語置換も
//      行う。ローマ数字が続く場合は「Sword Rain III(剣の雨 III)」のように
//      まとめて1つの用語として扱う。書き換え済み（data-czn-done="1"）の
//      要素は対象から除外する。置換した箇所への背景ハイライトは付けない
//   5. 起動時に画面右下へ簡易トーストを出し、動いているかを目視確認できるようにする。
//      「◯件を置換 / カード枠◯件 / 名前取得◯件 / ユニーク◯件 / 効果文◯件 /
//      効果文データ◯件 / 名前特定スキップ◯件 / content検出◯件 / 再適用◯件」の
//      内訳を表示する。カード枠は検出を試みたカードの件数、名前取得はそのうち
//      カード名まで特定できた件数、ユニークはベース名（ローマ数字を除いた
//      名前、レベル違いは1件にまとめる）の種類数、効果文データは
//      effects-ja.json から読めた件数（ファイル全体の件数。実際に索引に
//      使われた件数は「(有効◯件)」として別途括弧内に示す）、名前特定スキップ
//      は無理に近い候補を採用せず処理対象外にした件数（別カードへの誤爆を
//      防ぐための安全装置が働いた件数）、content検出は .chaos-content が見つかったカードの
//      件数、再適用はページ側の再描画で英語に戻っているのを検知して再書換
//      した件数。同名でもカードごとに別カードとして処理し、名前による集約・
//      重複排除は一切行わない。スキップが1件以上あるときは、スキップした
//      カードの推定テキスト（診断専用、実際の照合には使わない）を最大5件
//      表示する。効果文を書き換えられたときは「原文 / level / (再適用) /
//      ノード数 / 親要素タグ名 / 書換前の連結英文先頭30文字 / 書換後の
//      scope先頭30文字」を最大10件表示する。照合（entry・effectの取得）まで
//      成功したのに実際の書き換え段階で失敗したカードがあれば（全体の挿入
//      件数が0件でなくても）、「挿入失敗: 原文 / level / 理由」を必ず表示
//      する（「効果文あり」なのに画面が変わらないという矛盾の原因をその場で
//      確認できるようにするため）。書き換え先が1つも見つからなかった場合は、
//      名前照合用のカード枠（box）自体のタグ名・クラス名・中のテキスト要素数・
//      textContent冒頭50文字に加えて、実際に探索範囲として採用した scope
//      （確定方式なら.chaos-content、旧方式ならboxから広げた要素。boxとは
//      別に表示する）のタグ名・クラス名・登った階層数・中のテキスト要素数・
//      textContent冒頭50文字も併せて出す（box が小さすぎるのか、scopeへの
//      拡大が機能していないのか、除外条件が厳しすぎるのかを切り分けるため）。
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
  var EXTRA_LINES_URL = 'https://yg6ks7mjtv-commits.github.io/czn-glossary/extra-lines.json';
  var SITE_LABELS_URL = 'https://yg6ks7mjtv-commits.github.io/czn-glossary/site-labels.json';
  var STORAGE_KEY = 'czn_enabled';
  var TRANSLATE_STORAGE_KEY = 'czn_translate_enabled'; // AI翻訳（実験的機能）のON/OFF。既定OFF
  var CZN_DEBUG = false; // true にすると console にマッチ状況を出す

  function log() {
    if (CZN_DEBUG) {
      console.log.apply(console, ['[czn-ext]'].concat(Array.prototype.slice.call(arguments)));
    }
  }

  // AI翻訳フェーズの診断専用。CZN_DEBUGの設定に関わらず必ずconsoleに出す
  // （トーストは他の描画に巻き込まれて消えることがあるため、こちらを
  // 主な確認手段にする）。既存のlog()やCZN_DEBUGの既定値・挙動は変更
  // しない。
  function logAlways() {
    console.log.apply(console, ['[czn-ext]'].concat(Array.prototype.slice.call(arguments)));
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

  // stripRomanLevel を拡張し、ローマ数字以外の2種類のヒラメキ段階表記にも
  // 対応する。
  //   1. 星（"Softie ★★" -> base "Softie", level 2）。末尾の★の数がlevel。
  //   2. 括弧付きの固有名（"Hew (Ironclad)" -> base "Hew", level 1）。
  //      カードごとに対応が異なり機械的に推測できないため、
  //      selectors.js の CARD_LEVEL_NAMES に事前登録された組み合わせだけを
  //      変換する。未登録なら（無理に推測せず）テキスト全体を base とし
  //      level 0 のまま返す。＝ glossaryの英語名と一致せず処理対象外になる。
  // 戻り値の suffixText は、カード名を日本語化する際に付け直す元の表記
  // （ローマ数字は別途 ROMAN_BY_LEVEL で日本語ローマ数字に変換するため
  // ここでは付与しない。星・括弧はそのまま流用する）。
  function stripLevelSuffix(text, characterName) {
    var romanParsed = stripRomanLevel(text);
    if (romanParsed.level > 0) {
      return { base: romanParsed.base, level: romanParsed.level, suffixType: 'roman', suffixText: null };
    }

    var starMatch = /^(.*) (★+)$/.exec(text);
    if (starMatch) {
      return { base: starMatch[1], level: starMatch[2].length, suffixType: 'star', suffixText: starMatch[2] };
    }

    var parenMatch = /^(.*) \(([^()]+)\)$/.exec(text);
    if (parenMatch) {
      var base = parenMatch[1];
      var name = parenMatch[2];
      var charMap = characterName && CZN_SELECTORS.cardLevelNames
        ? CZN_SELECTORS.cardLevelNames[characterName]
        : null;
      var cardMap = charMap ? charMap[base] : null;
      var level = cardMap && Object.prototype.hasOwnProperty.call(cardMap, name) ? cardMap[name] : 0;
      if (level > 0) {
        return { base: base, level: level, suffixType: 'paren', suffixText: '(' + name + ')' };
      }
    }

    return { base: text, level: 0, suffixType: 'none', suffixText: null };
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

  // 神ヒラメキ等の追加行（.chaos-content内でclassに"divine"を含む要素）の
  // 対訳表。glossary.json同様に公開URLから取得する（effects-ja.jsonと違い
  // 非公開データを含まないため）。ページへの自動適用は confidence:
  // "confirmed" のもののみとし、"guess" は対訳表としては保持するが
  // 適用しない（glossary.jsonのfetchGlossaryが confirmed のみを用語置換に
  // 使うのと同じ基準）。
  function fetchExtraLines() {
    return fetch(EXTRA_LINES_URL, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) { throw new Error('extra-lines.json HTTP ' + r.status); }
        return r.json();
      })
      .then(function (data) {
        return (data.entries || [])
          .filter(function (e) { return e.confidence === 'confirmed' && e.en && e.ja; })
          .map(function (e) { return { en: e.en, ja: e.ja, re: buildExtraLineMatcher(e.en) }; });
      })
      .catch(function (err) {
        log('extra-lines.json を読めなかった:', err.message);
        return [];
      });
  }

  // Prydwen独自の見出し・UIラベル（ゲーム用語ではない）の対訳表。
  // glossary.jsonには混ぜない方針のため別ファイルから取得する。
  function fetchSiteLabels() {
    return fetch(SITE_LABELS_URL, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) { throw new Error('site-labels.json HTTP ' + r.status); }
        return r.json();
      })
      .then(function (data) {
        var map = Object.create(null);
        (data.entries || []).forEach(function (e) {
          if (e.en && e.ja) { map[e.en] = e.ja; }
        });
        return map;
      })
      .catch(function (err) {
        log('site-labels.json を読めなかった:', err.message);
        return Object.create(null);
      });
  }

  function getEnabled() {
    return new Promise(function (resolve) {
      chrome.storage.local.get([STORAGE_KEY], function (result) {
        resolve(result[STORAGE_KEY] !== false); // 既定 ON
      });
    });
  }

  // AI翻訳（実験的機能）のON/OFF。表示崩れが起きたとき、翻訳が原因かどうかを
  // 切り分けられるようにするため、既定はOFF（既存ユーザーへの影響回避が
  // 目的ではない）。
  function getTranslateEnabled() {
    return new Promise(function (resolve) {
      chrome.storage.local.get([TRANSLATE_STORAGE_KEY], function (result) {
        resolve(result[TRANSLATE_STORAGE_KEY] === true); // 既定 OFF
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
  // gamerch由来のデータは内容を確認した結果、カードの効果文そのものではなく
  // 「基本形からの変化点の要約」であることが判明した（例: 剣の雨I の実際の
  // 効果文は「[連結/安息] ダメージ80%×2 感応：極光剣を2枚生成」だが、
  // gamerch由来のデータは「安息追加、生成数1枚増加」）。そのため
  // buildEffectsIndex で source:"gamerch" のエントリを一切索引に載せない
  // （＝常に「効果文なし」扱いとなり英語のまま残る）。データ自体は
  // effects-ja.json から削除していない。
  var SOURCE_PRIORITY = { ingame: 3, aosns: 2, gamerch: 1 };

  function effectSource(e) {
    if (e.source === 'ingame') { return 'ingame'; }
    if (e.source === 'aosns') { return 'aosns'; }
    return 'gamerch';
  }

  function setEffectIfAllowed(idx, key, value) {
    var existing = idx[key];
    if (existing && SOURCE_PRIORITY[existing.source] > SOURCE_PRIORITY[value.source]) { return; }
    idx[key] = value;
  }

  function buildEffectsIndex(effects) {
    var idx = Object.create(null);
    effects.forEach(function (e) {
      if (!e || !e.ja_card || !e.effect) { return; }
      var source = effectSource(e);
      if (source === 'gamerch') { return; } // 基本形からの変化点要約であり効果文そのものではないため除外
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
  function findGlossaryNameLeaf(scope, excludeRoot, knownEnNames, characterName) {
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
      if (text && !hasExcludedSuffix(text) && knownEnNames.has(stripLevelSuffix(text, characterName).base)) {
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

  // scope 内の「英語の効果文」は1つの要素にまとまっておらず、複数のテキスト
  // ノードに分割されていることが分かった（＝「正しい1要素を選ぶ」方式では
  // 原理的に解決できない）。そのため要素単位の選択はやめ、テキストノード単位
  // で直接操作する。scope内のテキストノードを文書順に全て集め、以下を除外:
  //   - カード名要素（nameEl）の配下
  //   - 種別表示（typeLabelEl）の配下
  //   - a / button 要素の配下（「Show Effects」の展開トグルを壊さないため）
  //   - 空白のみのテキストノード
  //   - excludeCostDigits が true のとき: 直近の親要素の textContent が
  //     数字のみ（コスト数字）のテキストノード。この判定はコスト数字が
  //     scope内に混在する旧方式（.chaos-headerを含む広い範囲）向けで、
  //     確定セレクタ方式の .chaos-content ではコスト数字は
  //     .chaos-header側にあり scope内に混在しないため false で呼ぶ
  //     （effect文中の太字数字（例:「by 1」の1）まで誤って除外してしまう
  //     ことが分かったため）。
  function collectEffectTextNodes(scope, nameEl, typeLabelEl, excludeCostDigits) {
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    var node;
    var nodes = [];

    while ((node = walker.nextNode())) {
      if (!node.nodeValue || !node.nodeValue.trim()) { continue; } // 空白のみ

      var excluded = false;
      var p = node.parentElement;
      while (p) {
        if (p === nameEl || p === typeLabelEl ||
            p.tagName === 'A' || p.tagName === 'BUTTON') {
          excluded = true;
          break;
        }
        if (p === scope) { break; }
        p = p.parentElement;
      }
      if (excluded) { continue; }

      if (excludeCostDigits) {
        var parentEl = node.parentElement;
        if (parentEl && /^[0-9]+$/.test((parentEl.textContent || '').trim())) {
          continue; // コスト数字
        }
      }

      nodes.push(node);
    }

    return nodes;
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

  // 【確定セレクタ方式・既定】Prydwenの実際のDOM構造が判明したため、種別表示
  // からの探索に代えて、確定したクラス名から直接カードを検出する。
  //   .chaos-card-inside … 1枚のカード
  //     img[alt]          … カード名（ローマ数字付き。level判定もここから）
  //     .chaos-header      … カード名の表示先（コスト数字・種別表示も同居する
  //                           ため、ヘッダー全体ではなく中の該当葉要素だけを
  //                           findGlossaryNameLeaf で特定して書き換える）
  //     .chaos-content     … 効果文の探索範囲に固定する（テキストノード方式は
  //                           従来通り collectEffectTextNodes を使う）
  // 種別表示ベースの探索（findCardBox等）は削除せず、selectors.js の
  // useConfirmedStructure を false にすれば無効化して従来経路に戻せる。
  function collectCardCandidatesByConfirmedStructure(ctx, characterName) {
    var knownEnNames = new Set(Object.keys(ctx.resolved));
    var cardSel = CZN_SELECTORS.confirmedCard || '.chaos-card-inside';
    var headerSel = CZN_SELECTORS.confirmedHeader || '.chaos-header';
    var contentSel = CZN_SELECTORS.confirmedContent || '.chaos-content';

    var cards = Array.prototype.slice.call(document.querySelectorAll(cardSel));
    log('confirmed card containers found:', cards.length);
    var candidates = [];
    var skippedCount = 0;
    var skippedNames = []; // 最大5件（診断用）
    var contentFoundCount = 0; // .chaos-content が見つかったカードの件数（診断用）
    var nameCounts = Object.create(null); // 同じ英語名（alt）が何件あったか（診断用）

    cards.forEach(function (cardEl) {
      var img = cardEl.querySelector('img[alt]');
      var rawNameText = img && img.alt ? img.alt.trim() : '';
      if (!rawNameText) {
        skippedCount++;
        if (skippedNames.length < 5) { skippedNames.push('(img altなし)'); }
        return;
      }

      nameCounts[rawNameText] = (nameCounts[rawNameText] || 0) + 1;

      var headerEl = cardEl.querySelector(headerSel);
      var contentEl = cardEl.querySelector(contentSel);
      if (contentEl) { contentFoundCount++; }

      var parsed = stripLevelSuffix(rawNameText, characterName);
      var entry = ctx.resolved[parsed.base] || null;

      if (!entry || !headerEl) {
        skippedCount++;
        if (skippedNames.length < 5) { skippedNames.push(rawNameText); }
        return;
      }

      // .chaos-header にはコスト数字・種別表示も同居するため、ヘッダー全体を
      // 書き換えるのではなく、glossary名と一致する葉要素だけを特定する。
      var nameEl = findGlossaryNameLeaf(headerEl, null, knownEnNames, characterName);
      if (!nameEl) {
        skippedCount++;
        if (skippedNames.length < 5) { skippedNames.push(rawNameText); }
        return;
      }

      candidates.push({
        block: cardEl, // 二重処理防止のキーはカード全体（.chaos-content単体は
                        // ページ側の再描画で作り直されることがあるため）
        nameEl: nameEl,
        typeLabelEl: null,
        levelBadgeEl: null,
        effectScope: contentEl || null, // 確定: 効果文の探索範囲を.chaos-contentに固定
        rawNameText: rawNameText,
        nameText: rawNameText,
        baseName: parsed.base,
        level: parsed.level,
        levelSuffixType: parsed.suffixType,
        levelSuffixText: parsed.suffixText,
        entry: entry
      });
    });

    var duplicateNames = Object.keys(nameCounts)
      .filter(function (n) { return nameCounts[n] > 1; })
      .map(function (n) { return n + '×' + nameCounts[n]; });

    return {
      candidates: candidates,
      attemptedCount: cards.length,
      skippedCount: skippedCount,
      skippedNames: skippedNames,
      typeLabels: [],
      contentFoundCount: contentFoundCount,
      duplicateNames: duplicateNames.slice(0, 10)
    };
  }

  function collectCardCandidates(ctx, characterName) {
    if (CZN_SELECTORS.useConfirmedStructure) {
      return collectCardCandidatesByConfirmedStructure(ctx, characterName);
    }
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

  // 書き込み直後の要素が、既存の間引き済み（500ms）全体再スキャンより先に
  // ページ側の再描画で上書きされ、日本語が失われることがあると分かった
  // （赤枠は正しい位置に出るが中身だけ英語に戻る）。そのため、書き込んだ
  // 要素（writeTarget。確定セレクタ方式では .chaos-content の最初の子要素）
  // ごとに個別の MutationObserver を設置し、中身から日本語（jaText）が
  // 消えていたら書き直す。自分自身の書き込みで
  // 再発火しないよう、書き直す前に監視を止め、書き直した後に再度監視する。
  // 同一要素への書き直しは最大 WATCH_MAX_RETRIES 回までとし、超えたら
  // 監視を解除する（無限ループ防止）。
  var WATCH_MAX_RETRIES = 10;
  var watchInstalledCount = 0;
  var watchAutoRewriteCount = 0;

  // 挿入した日本語効果文の可読性対策（案1）。カードごとに背景画像が異なり、
  // 種別ごとの文字色（.skill-with-coloring <Element> のCSSで青系等になる）が
  // 背景と衝突して読みづらくなることがあるため、文字色を白に固定した上で、
  // 半透明の暗い下地・角丸・軽いパディング・影を敷いて、どの背景画像の上でも
  // 一定のコントラストを確保する。インラインstyleで最優先度にして確実に
  // 上書きする。要素ごとに一度だけ適用すればよいため、書き換え・再書き換え
  // （watchEffectScopeでの自動修復時）の両方で呼ぶが、2回目以降は同じ値を
  // 上書きするだけで害はない。
  function applyReadableEffectStyle(el) {
    el.style.cssText += ';color:#fff !important;background:rgba(0,0,0,0.55);' +
      'border-radius:4px;padding:2px 5px;box-shadow:0 1px 3px rgba(0,0,0,0.6);' +
      'text-shadow:0 1px 2px rgba(0,0,0,0.8);';
    // Prydwen側が<b>/<u>タグに個別の色指定をしていることが実機で判明した
    // （例: rgb(24,122,176)という青系のハイライト色）。CSSの継承は子要素に
    // 直接かかるルールが無い場合のみ働くため、親のcolor（!important込み）
    // だけでは子には及ばない。子孫要素全てにも同じ白を直接指定して揃える。
    var descendants = el.querySelectorAll('*');
    for (var i = 0; i < descendants.length; i++) {
      descendants[i].style.setProperty('color', '#fff', 'important');
    }
  }

  function watchEffectScope(scope, c, jaText, excludeCostDigits) {
    var retries = 0;
    var mo = new MutationObserver(function () {
      var currentText = scope.textContent || '';
      if (currentText.indexOf(jaText) !== -1) { return; } // まだ正しい

      retries++;
      if (retries > WATCH_MAX_RETRIES) {
        mo.disconnect();
        return;
      }

      var freshNodes = collectEffectTextNodes(scope, c.nameEl, c.typeLabelEl, excludeCostDigits);
      if (freshNodes.length === 0) { return; } // 書き直す先が見つからない

      mo.disconnect(); // 自分の書き込みで再発火しないよう一時停止
      freshNodes[0].nodeValue = jaText;
      for (var ti = 1; ti < freshNodes.length; ti++) {
        freshNodes[ti].nodeValue = '';
      }
      applyReadableEffectStyle(scope);
      scope.setAttribute('data-czn-done', '1');
      mo.observe(scope, { childList: true, subtree: true, characterData: true });

      watchAutoRewriteCount++;
      log('overwrite detected, auto-rewrote effect text for', c.nameText, 'retry', retries);
      showStatusToast('CZN: 上書き検知→自動再書換「' + (c.rawNameText || c.nameText) +
        '」/ 監視' + watchInstalledCount + '件 / 自動再書換' + watchAutoRewriteCount + '件');
    });
    mo.observe(scope, { childList: true, subtree: true, characterData: true });
    watchInstalledCount++;
  }

  // .chaos-content の直下の子要素から、基本効果の要素をクラスで一意に
  // 判定する（p.tags の有無で位置がずれても影響を受けない）。神ヒラメキ
  // （"divine"）・クラス制限表記（"rules"）・別系統テキスト（"epi"）は
  // 除外する。見つからなければ null を返す（呼び出し側で children[0] に
  // フォールバックする）。
  function findBaseEffectElement(effectScope) {
    if (!effectScope.children) { return null; }
    for (var i = 0; i < effectScope.children.length; i++) {
      var el = effectScope.children[i];
      var cls = (el.className || '').toString().split(/\s+/);
      if (cls.indexOf('skill-with-coloring') !== -1 &&
          cls.indexOf('divine') === -1 && cls.indexOf('rules') === -1 && cls.indexOf('epi') === -1) {
        return el;
      }
    }
    return null;
  }

  // p.tags（.chaos-content内、[Lead]等の角括弧タグ一覧）が、挿入した日本語
  // 効果文（jaText）に完全に含まれている場合のみ、重複表示を避けるため
  // p.tags を非表示にする。1つでも対応する日本語表記が jaText に含まれて
  // いないタグがあれば、情報を失わないよう何もしない（英語のまま残す）。
  // effectScope が無い（旧方式フォールバック時）、p.tags が無い、
  // resolved が無い場合は何もしない。
  // 1つのタグ（角括弧の中身、例: "Lead"・"Exhaust 2"）が、挿入した日本語
  // 効果文（jaText）に含まれているかを判定する。まず完全一致でglossaryを
  // 引き、無ければ「基本語＋末尾の数字（重複・スタック数）」の形式
  // （例: "Exhaust 2" = Exhaust＋スタック数2。Magnaの氷河の鉄拳Vで実例あり）
  // とみなし、基本語だけをglossaryで引いた上で、数字をスペース有り・
  // 無しの両方の並びで探す（自前で登録した効果文には「消滅2」のように
  // スペース無しで数字を続ける慣習があるため）。
  function isTagCoveredInJaText(rawTag, jaText, resolved) {
    var entry = resolved[rawTag];
    if (entry && entry.ja && jaText.indexOf(entry.ja) !== -1) { return true; }

    var m = /^(.*?)\s+(\d+)$/.exec(rawTag);
    if (m) {
      var baseEntry = resolved[m[1]];
      if (baseEntry && baseEntry.ja) {
        var num = m[2];
        if (jaText.indexOf(baseEntry.ja + num) !== -1 || jaText.indexOf(baseEntry.ja + ' ' + num) !== -1) {
          return true;
        }
      }
    }
    return false;
  }

  function hideRedundantTagsLine(effectScope, jaText, resolved) {
    if (!effectScope || !effectScope.querySelector || !resolved) { return; }
    var tagsEl = effectScope.querySelector('p.tags');
    if (!tagsEl || tagsEl.style.display === 'none') { return; }
    var tagSpans = tagsEl.querySelectorAll('span.inline-name');
    if (tagSpans.length === 0) { return; }

    for (var i = 0; i < tagSpans.length; i++) {
      var raw = (tagSpans[i].textContent || '').trim().replace(/^\[+|\]+$/g, '').trim();
      if (!raw) { continue; }
      if (!isTagCoveredInJaText(raw, jaText, resolved)) {
        return; // 対応する日本語表記が確認できない、または効果文に含まれていない
      }
    }

    tagsEl.style.display = 'none';
    tagsEl.setAttribute('data-czn-tags-hidden', '1');
  }

  function insertEffects(candidates, effectsIdx, charName, allTypeLabels, resolved) {
    var inserted = 0;
    var diagnostics = [];
    var rewriteDetails = []; // 書き換えた要素の内訳（診断用）
    var rewriteFailures = []; // 効果文は見つかったのに書き換えに失敗した内訳（診断用）
    var maxExtraClimb = CZN_SELECTORS.maxEffectSearchClimb || 10;

    var reappliedCount = 0; // マーカーはあるが中身が英語に戻っていて再書換した件数
    var staleCount = 0; // document.contains が false で切り離しをスキップした件数

    candidates.forEach(function (c) {
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

      if (!c.entry) { return; } // glossaryに無いカード名

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
        // レベル表記がカード名要素自身に含まれていた場合（levelBadgeElを
        // 使っていない場合）のみ、日本語名にも同じレベル表記を付け直す。
        // ローマ数字由来なら日本語のローマ数字表記に、星・括弧付き固有名
        // 由来なら元の表記（★の数・(Ironclad)等）をそのまま流用する
        // （星や括弧付き固有名を無理にローマ数字表記へ変換しないため）。
        if (!c.levelBadgeEl && c.level > 0) {
          if (c.levelSuffixType === 'star' || c.levelSuffixType === 'paren') {
            jaName += ' ' + c.levelSuffixText;
          } else if (ROMAN_BY_LEVEL[c.level]) {
            jaName += ' ' + ROMAN_BY_LEVEL[c.level];
          }
        }
        c.nameEl.textContent = jaName;
        c.nameEl.setAttribute('data-czn-done', '1');
      }

      if (!effect) { return; } // 該当levelの効果文が無い

      // gamerch由来（非公式・自動収集の文言）には末尾に「※」を付けて、
      // 実機確認済み（ingame）の文言と一目で区別できるようにする。
      // incomplete（切り出しが不完全な可能性がある）には「(一部)」も付ける。
      // 両方を満たす場合は併記する。
      var jaText = effect.effect +
        (effect.source === 'gamerch' ? '※' : '') +
        (effect.incomplete ? '(一部)' : '');

      // p.tags（[Lead]等の角括弧タグ一覧）が存在し、かつそのタグ全てが
      // 挿入する日本語効果文（jaText）内にも含まれている場合に限り、
      // 重複表示を避けるためタグ行を隠す。1つでも含まれていないタグが
      // あれば何もしない（情報を失わないため）。書き換えが必要かの判定
      // （後述のreapplied確認）より前に毎回呼ぶことで、ページ側の再描画で
      // タグ行だけ再表示されるようなケースでも次のスキャンで復旧できる
      // ようにする（この判定自体は用語置換 replaceTermsOnPage より前に
      // 行われるため、初回はタグのテキストが原文（英語）のまま読める。
      // 2回目以降の呼び出しでは既に非表示化済みなら何もしない）。
      hideRedundantTagsLine(c.effectScope, jaText, resolved);

      // c.effectScope が確定していれば（確定セレクタ方式）そこに固定する。
      // 無ければ（旧方式へのフォールバック時）名前照合用の（狭い）カード枠
      // box から、内容の増分を基準に親をたどって範囲を広げる従来の方式を使う。
      var scopeResult;
      var effectScope;
      if (c.effectScope) {
        if (!document.contains(c.effectScope)) {
          // 保持していた参照は既に画面から切り離されている。ページ内に
          // 同名カードが複数存在する場合、カード名（img[alt]）を手がかりに
          // 取り直すと常に同じ（最初に見つかった）1枚に書き込んでしまい、
          // 画面に見えている別の1枚は英語のまま残る事故になる。そのため
          // 名前による取り直しはせず、この候補はスキップする。
          // querySelectorAllで得た .chaos-card-inside を1件ずつ個別に扱って
          // いる限り、次回の再スキャンで新しい要素として自然に処理される。
          staleCount++;
          return;
        }
        effectScope = c.effectScope;
        scopeResult = { scope: effectScope, climbedLevels: 0 };
      } else {
        scopeResult = findEffectSearchScope(c.block, allTypeLabels || [], maxExtraClimb);
        effectScope = scopeResult.scope;
      }

      // コスト数字除外は旧方式（.chaos-headerを含む広い範囲）向け。確定
      // セレクタ方式の .chaos-content にはコスト数字が混在しないため
      // 適用しない（効果文中の太字数字まで誤って除外していたため）。
      var excludeCostDigits = !c.effectScope;

      // .chaos-content の直下は子要素に分かれており、書き換え対象は基本効果
      // （神ヒラメキ等の追加行には触れない）だけに絞る必要がある。かつては
      // 「最初の子要素＝基本効果」という位置ベースの前提で children[0] を
      // 使っていたが、p.tags（[Linked]等の角括弧タグ一覧、例: Magnaの
      // 「氷の破片」）が存在するカードでは、この p.tags 自身が
      // .chaos-content の実際の children[0] になり、本当の基本効果は
      // children[1] にずれる（2026-08-08、実機で確認・再現）。position
      // ベースの前提が崩れるとこの p.tags に日本語を書き込んでしまい、
      // 本来の英語の効果文要素には一切触れないまま残る不具合になっていた
      // （タグの無いカードだけ偶然 children[0] が基本効果と一致するため、
      // 正しく見えていた）。
      //
      // 基本効果は class に "skill-with-coloring" を含み、かつ神ヒラメキ
      // （"divine"）・クラス制限表記（"rules"）・別系統テキスト（"epi"）の
      // いずれでもない要素として一意に判定できる（神ヒラメキ抽出
      // insertDivineLines の "divine" 判定と同じ考え方）ため、位置ではなく
      // クラスで探す。見つからない場合のみ、従来通り children[0] に
      // フォールバックする（旧方式のフォールバック時は effectScope
      // （box から広げた範囲）をそのまま使う）。
      var childCount = effectScope.children ? effectScope.children.length : 0;
      var writeTarget = effectScope;
      if (c.effectScope && childCount > 0) {
        var baseEffectEl = findBaseEffectElement(effectScope);
        writeTarget = baseEffectEl || effectScope.children[0];
      }

      // 「data-czn-done="1" が付いている＝処理済み」と属性だけで判定すると、
      // ページ側の再描画でテキストノードだけが英語に作り直され、要素自体
      // （と付けておいた属性）は残るケースを見逃す（＝英語のまま放置される）。
      // そのため、マーカーがあっても実際の現在のテキストに日本語の効果文が
      // 含まれているかを確認し、含まれていなければ「未処理」として扱って
      // 再度書き換える。タイマー等での自発的な再試行は行わず、この確認は
      // MutationObserver 経由の再スキャン時に自然に行われる。
      var reapplied = false;
      if (writeTarget.getAttribute('data-czn-done') === '1') {
        var currentText = writeTarget.textContent || '';
        if (currentText.indexOf(jaText) !== -1) {
          return; // 既に正しく反映されている
        }
        reapplied = true;
      }

      // 診断用: .chaos-content 直下の子要素の数と、最初の子要素（＝実際の
      // 書き換え対象 writeTarget）の書き換え前の先頭30文字を記録する。
      var firstChildHead = (writeTarget.textContent || '').trim().slice(0, 30);

      // 英語の効果文は1つの要素にまとまっておらず、複数のテキスト断片に
      // 分割されている（＝「正しい1要素」が存在しない）ことが判明したため、
      // 要素単位の選択・書き換えはやめ、テキストノード単位で直接操作する。
      // 対象は writeTarget（.chaos-content の最初の子要素）の中だけに限定する。
      var textNodes = collectEffectTextNodes(writeTarget, c.nameEl, c.typeLabelEl, excludeCostDigits);

      if (textNodes.length === 0) {
        // box（名前照合用の狭いカード枠）と、実際に書き換え対象とした scope
        // （writeTarget。確定方式なら.chaos-contentの最初の子要素、旧方式なら
        // boxから広げた要素）を別々に記録する。box が小さすぎるのか、scopeへの
        // 拡大が機能していないのか、除外条件が厳しすぎるのかを切り分けられる
        // ようにするため。
        rewriteFailures.push({
          rawNameText: c.rawNameText || c.nameText,
          level: c.level,
          reason: '対象のテキストノードが見つからない',
          boxTag: c.block.tagName,
          boxClass: (c.block.className || '').toString().slice(0, 40),
          boxTextLeafCount: countTextLeaves(c.block),
          boxTextHead: (c.block.textContent || '').trim().slice(0, 50),
          scopeTag: writeTarget.tagName,
          scopeClass: (writeTarget.className || '').toString().slice(0, 40),
          scopeClimbedLevels: scopeResult.climbedLevels,
          scopeTextLeafCount: countTextLeaves(writeTarget),
          scopeTextHead: (writeTarget.textContent || '').trim().slice(0, 50),
          childCount: childCount
        });
        return;
      }

      // 元の英文（集めたテキストノードの連結）を退避する。要素の削除・
      // 非表示は行わず、テキストの中身だけを変える（可読性対策の背景色・
      // 文字色だけは例外として明示的に適用する。下記 applyReadableEffectStyle
      // 参照）。
      var originalConcat = textNodes.map(function (n) { return n.nodeValue; }).join('');
      writeTarget.setAttribute('data-czn-orig', originalConcat);

      textNodes[0].nodeValue = jaText;
      for (var ti = 1; ti < textNodes.length; ti++) {
        textNodes[ti].nodeValue = '';
      }

      // カードの背景画像・種別ごとの文字色（青系等）と衝突して読みづらく
      // なる対策（案1）。文字色を白に固定し、半透明の暗い下地と影を敷く。
      applyReadableEffectStyle(writeTarget);

      writeTarget.setAttribute('data-czn-done', '1');

      // この writeTarget にはまだ監視を付けていなければ設置する
      // （reapply等で同じ要素へ複数回来ても二重に設置しないための目印）。
      // 監視・再書き換えの範囲も writeTarget（最初の子要素）の中だけに
      // 限定し、2つ目以降の子要素（追加行）には触れない。
      if (!writeTarget.hasAttribute('data-czn-watched')) {
        writeTarget.setAttribute('data-czn-watched', '1');
        watchEffectScope(writeTarget, c, jaText, excludeCostDigits);
      }

      if (reapplied) { reappliedCount++; }

      // 診断用: 集めたテキストノードの数・連結した英文の先頭30文字・
      // 日本語を入れたノードの親要素のタグ名・書き換え後のwriteTarget先頭
      // 30文字・再適用かどうか・.chaos-content直下の子要素の数・最初の
      // 子要素（writeTarget）の書き換え前の先頭30文字を記録しておく。
      rewriteDetails.push({
        rawNameText: c.rawNameText || c.nameText,
        level: c.level,
        nodeCount: textNodes.length,
        originalHead: originalConcat.trim().slice(0, 30),
        parentTag: textNodes[0].parentElement ? textNodes[0].parentElement.tagName : '(なし)',
        afterHead: (writeTarget.textContent || '').trim().slice(0, 30),
        reapplied: reapplied,
        childCount: childCount,
        firstChildHead: firstChildHead
      });

      inserted++;
      log('rewrote effect text for', c.nameText, 'level', c.level, reapplied ? '(reapplied)' : '');
    });

    diagnostics.sort(function (a, b) { return diagnosticScore(b) - diagnosticScore(a); });
    diagnostics = diagnostics.slice(0, 10);

    return {
      insertedCount: inserted,
      reappliedCount: reappliedCount,
      staleCount: staleCount,
      diagnostics: diagnostics,
      rewriteDetails: rewriteDetails.slice(0, 10),
      rewriteFailures: rewriteFailures.slice(0, 10),
      candidateCount: candidates.length
    };
  }

  // ---- 神ヒラメキ等の追加行の日本語化（基本効果の書き換えとは別処理） ----
  //
  // .chaos-content 直下には、基本効果（最初の子要素 = writeTarget、
  // insertEffects が担当）とは別に、classに"divine"を含む要素として
  // 神ヒラメキボーナス行が存在することがある（class="rules"のクラス制限
  // 表記や class="epi"の別系統テキストとは異なる）。これらはキャラ固有では
  // なく共通の定型文が少数（docs/extra-lines.json）のみのため、
  // effects-ja.json（非公開・キャラ固有）とは完全に独立した仕組みとして
  // ここで扱う。insertEffects の writeTarget（最初の子要素）には一切触れず、
  // c.effectScope（.chaos-content全体）から"divine"要素だけを別途探して
  // 処理する。

  // 空白の連続を1つに正規化し、句読点直前の空白を除去する。DOM抽出時の
  // 要素境界（<b>数値</b>等）に起因する空白の揺れを吸収するため
  // （docs/extra-lines.jsonの_readme参照）。改行は行の区切りとして保持する
  // （複数文からなるテンプレート用）。
  function normalizeExtraLineText(text) {
    return text.split('\n').map(function (line) {
      return line.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
    }).join('\n').trim();
  }

  // テンプレート文字列（{N}を数値プレースホルダとして含む）から、実際の
  // 数値を捕捉するための正規表現を作る。
  function buildExtraLineMatcher(enTemplate) {
    var escaped = rxEscape(normalizeExtraLineText(enTemplate));
    var pattern = escaped.replace(/\\\{N\\\}/g, '(\\d+(?:\\.\\d+)?%?)');
    return new RegExp('^' + pattern + '$');
  }

  // 要素の子ノードを順に読み、<br>を改行として扱う（textContentは<br>を
  // 無視して連結してしまうため、"Treated as a Common Card\nDraw {N}
  // Common Card(s)"のような複数文テンプレートが一致しなくなる）。
  function extractDivineText(el) {
    var parts = [];
    Array.prototype.forEach.call(el.childNodes, function (node) {
      if (node.nodeType === 3) {
        parts.push(node.nodeValue);
      } else if (node.nodeName === 'BR') {
        parts.push('\n');
      } else {
        parts.push(node.textContent || '');
      }
    });
    return parts.join('');
  }

  // 対訳表（confirmedのみ）と照合し、一致すれば{N}を実際の数値に置き換えた
  // 日本語文を返す。一致しなければnull（＝英語のまま残す。対訳表に無い
  // ものを推測で書き換えない）。
  function matchExtraLineTemplate(rawText, extraLines) {
    var normalized = normalizeExtraLineText(rawText);
    for (var i = 0; i < extraLines.length; i++) {
      var entry = extraLines[i];
      var m = entry.re.exec(normalized);
      if (m) {
        var ja = entry.ja;
        for (var j = 1; j < m.length; j++) {
          ja = ja.replace('{N}', m[j]);
        }
        return ja;
      }
    }
    return null;
  }

  // 基本効果側の watchEffectScope と同じ考え方。ページ側の再描画で
  // divine要素の中身だけ英語に戻ることがあるため、要素ごとに個別の
  // MutationObserver を設置し、jaTextが消えていたら書き直す。自分自身の
  // 書き込みで再発火しないよう、書き直す前に監視を止め、書き直した後に
  // 再度監視する。同一要素への書き直しは最大 DIVINE_WATCH_MAX_RETRIES 回
  // までとし、超えたら監視を解除する（無限ループ防止）。
  var DIVINE_WATCH_MAX_RETRIES = 10;
  function watchDivineElement(el, jaText) {
    var retries = 0;
    var mo = new MutationObserver(function () {
      var currentText = el.textContent || '';
      if (currentText.indexOf(jaText) !== -1) { return; } // まだ正しい

      retries++;
      if (retries > DIVINE_WATCH_MAX_RETRIES) {
        mo.disconnect();
        return;
      }

      mo.disconnect(); // 自分の書き込みで再発火しないよう一時停止
      el.textContent = jaText;
      el.setAttribute('data-czn-divine-done', '1');
      el.setAttribute('data-czn-divine-ja', jaText);
      mo.observe(el, { childList: true, subtree: true, characterData: true });

      log('overwrite detected, auto-rewrote divine line');
    });
    mo.observe(el, { childList: true, subtree: true, characterData: true });
  }

  // candidates（glossaryでカード名が解決できたもの）ごとに、
  // effectScope（.chaos-content全体）内の"divine"要素を探して日本語化する。
  // effects-ja.jsonの有無・内容とは無関係に、candidateさえあれば実行する
  // （神ヒラメキ行の対訳表は公開データであり、効果文データに依存しない）。
  function insertDivineLines(candidates, extraLines) {
    var inserted = 0;
    if (!extraLines || extraLines.length === 0) {
      return { insertedCount: 0 };
    }

    candidates.forEach(function (c) {
      if (!c.effectScope || !c.effectScope.querySelectorAll) { return; }
      var divineEls = c.effectScope.querySelectorAll('[class*="divine"]');
      for (var i = 0; i < divineEls.length; i++) {
        var el = divineEls[i];
        if (!document.contains(el)) { continue; }

        // マーカーはあっても、ページ側の再描画で中身だけ英語に戻っている
        // ことがあるため、属性だけでなく実際のテキストも確認する
        // （insertEffectsと同じ考え方）。
        if (el.getAttribute('data-czn-divine-done') === '1') {
          var storedJa = el.getAttribute('data-czn-divine-ja') || '';
          if (storedJa && (el.textContent || '').indexOf(storedJa) !== -1) { continue; }
        }

        var origText = el.getAttribute('data-czn-divine-orig');
        if (origText === null) {
          origText = extractDivineText(el);
          el.setAttribute('data-czn-divine-orig', origText);
        }

        var jaText = matchExtraLineTemplate(origText, extraLines);
        if (jaText === null) { continue; } // 対訳表に無い＝英語のまま残す

        el.textContent = jaText;
        el.setAttribute('data-czn-divine-done', '1');
        el.setAttribute('data-czn-divine-ja', jaText);
        inserted++;

        // まだ監視を付けていなければ設置する（reapply等で同じ要素へ複数回
        // 来ても二重に設置しないための目印）。
        if (!el.hasAttribute('data-czn-divine-watched')) {
          el.setAttribute('data-czn-divine-watched', '1');
          watchDivineElement(el, jaText);
        }
      }
    });

    return { insertedCount: inserted };
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
        var levelSuffix = ''; // " III" のように、先頭スペース込みで保持する（en側表示用）
        var jaSuffix = ''; // ja側に連結する分（ローマ数字はスペース込み、数字ラベルはスペース無し）
        // 直後にヒラメキ段階のローマ数字が単語境界付きで続いていれば、
        // まとめて1つの用語として扱う（例: "Sword Rain III"）。
        var romanMatch = /^ (I{1,3}|IV|V)(?![A-Za-z0-9])/.exec(text.slice(e));
        if (romanMatch) {
          levelSuffix = romanMatch[0];
          jaSuffix = romanMatch[0];
          e += romanMatch[0].length;
        } else {
          // "Potential 1"/"Potential 3-1"のような数字（ハイフン区切りの
          // 枝番含む）サフィックスは、ja側では直前のスペースを詰めて
          // そのまま連結する（"潜在力 1"ではなく"潜在力1"にするため。
          // en側の表示（title・英語併記）はスペースを保持する）。
          var numMatch = /^ (\d+(?:-\d+)?)(?![A-Za-z0-9])/.exec(text.slice(e));
          if (numMatch) {
            levelSuffix = numMatch[0];
            jaSuffix = numMatch[1];
            e += numMatch[0].length;
          }
        }
        re.lastIndex = e;

        if (frag === null) { frag = document.createDocumentFragment(); }
        if (s > last) { frag.appendChild(document.createTextNode(text.slice(last, s))); }
        var ja = ctx.resolved[en].ja + jaSuffix;
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

  // Prydwen独自の見出し・UIラベル（docs/site-labels.json、ゲーム用語では
  // ないためglossary.jsonとは別データ）をページに適用する。replaceTermsOnPage
  // と同じ考え方（collectTextNodesでテキストノード単位、単語境界判定、
  // 最長一致優先）だが、キャラ・ローマ数字段階・英語併記の概念が無いぶん
  // 単純にしている。見出し（例: "Introduction"）は
  // <div><svg/>見出しテキスト</div> のように、SVGアイコンと同じdiv内に
  // 裸のテキストノードとして置かれているが、collectTextNodesは
  // TreeWalker(SHOW_TEXT)でテキストノードを直接走査するため要素の入れ子
  // 構造に依存せず、この構造でも問題なく置換できる（AI翻訳のブロック
  // 収集で問題になったisInlineOnlyForTranslateのような要素単位の判定は
  // ここでは行わないため、SVGの有無に影響されない）。
  function replaceSiteLabelsOnPage(siteLabels) {
    var keys = Object.keys(siteLabels);
    if (keys.length === 0) { return 0; }
    // 大文字小文字を区別しない（CSSのtext-transform:uppercase等で見た目の
    // 表記がDOM上のテキストと異なることがあるため。実例: 見た目は
    // "[6 SELECTED]"でもDOM上は"[6 selected]"）。マッチしたキーをそのまま
    // siteLabels のキーとして引けなくなるため、小文字化したキーで引ける
    // ルックアップを別途用意する。
    var lowerLookup = Object.create(null);
    keys.forEach(function (k) { lowerLookup[k.toLowerCase()] = siteLabels[k]; });
    var alts = keys.sort(function (a, b) { return b.length - a.length; }).map(rxEscape);
    var re = new RegExp(alts.join('|'), 'gi');

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

        // "STATS (LEVEL 60)"のような数字サフィックスは、glossary側の
        // "Potential N"と同じ考え方でja側にスペース無しで連結する
        // （en側は元テキストをそのまま残すため特別な処理は不要）。
        var jaSuffix = '';
        var numMatch = /^ (\d+(?:-\d+)?)(?![A-Za-z0-9])/.exec(text.slice(e));
        if (numMatch) {
          jaSuffix = numMatch[1];
          e += numMatch[0].length;
        }

        // 直前が「半角スペース+(」なら全角「（」に、直後（数字サフィックス
        // 消費後）が「)」なら全角「）」に、それぞれ置き換える（日本語の
        // 文脈では全角括弧を使う慣習に合わせる。例:
        // "Stats (level 60)" -> "ステータス（レベル60）"）。
        var replaceStart = s;
        var openParen = '';
        if (text.slice(Math.max(0, s - 2), s) === ' (') {
          replaceStart = s - 2;
          openParen = '（';
        }
        var closeParen = '';
        if (text.charAt(e) === ')') {
          closeParen = '）';
          e += 1;
        }
        re.lastIndex = e; // 数字サフィックス・閉じ括弧の分だけ余分に消費した位置から次の検索を始める

        if (frag === null) { frag = document.createDocumentFragment(); }
        if (replaceStart > last) { frag.appendChild(document.createTextNode(text.slice(last, replaceStart))); }
        var span = document.createElement('span');
        span.className = REPLACED_CLS;
        span.textContent = openParen + lowerLookup[m[0].toLowerCase()] + jaSuffix + closeParen;
        span.title = m[0];
        frag.appendChild(span);
        last = e;
        count++;
      }
      if (frag !== null) {
        if (last < text.length) { frag.appendChild(document.createTextNode(text.slice(last))); }
        if (node.parentNode) { node.parentNode.replaceChild(frag, node); }
      }
    });
    log('replaced', count, 'site labels');
    return count;
  }

  // ---- 起動 ----
  //
  // 順序が重要: 1) カード名を原文のまま収集 → 2) 効果文を挿入 →
  // 3) そのあとで用語置換（テキストを書き換える）を実行する。
  // 用語置換を先にやると見出しが「Sword Rain(剣の雨)」のように化けて
  // glossary 照合に失敗するため、この順序を崩さないこと。
  //
  // 初回表示後もSPA側の再描画で挿入済みの効果文や用語置換のspanが消える
  // ことがある。カード枠（.chaos-card-inside）やカード名要素・効果文の
  // scope（.chaos-content）自体は同じ要素が使い回され、data-czn-done等の
  // 属性は残ったまま中のテキストノードだけが英語に作り直されることがある
  // ため、insertEffects側は属性の有無だけでなく実際のテキストに日本語が
  // 含まれているかを確認してから「処理済みか」を判定する（詳細は
  // insertEffects内のコメント）。replaceTermsOnPage側は czn-replaced
  // クラスの有無で判定しているため、差し替え後のテキストは単に「まだ置換
  // されていない新しいテキスト」として再度拾われる。そのため
  // MutationObserver からもこの3段階をまとめて再実行する。

  function processPage(ctx, effectsIdx, charName, extraLines) {
    var collected = collectCardCandidates(ctx, charName);   // 1. カード名（原文）
    var candidates = collected.candidates;
    var insertResult = insertEffects(candidates, effectsIdx, charName, collected.typeLabels, ctx.resolved); // 2. 効果文挿入
    var divineResult = insertDivineLines(candidates, extraLines || []); // 2b. 神ヒラメキ等の追加行（別処理）
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
      contentFoundCount: collected.contentFoundCount || 0, // .chaos-content が見つかったカードの件数
      reappliedCount: insertResult.reappliedCount || 0, // ページ側の再描画で英語に戻り、再書換した件数
      staleCount: insertResult.staleCount || 0, // document.contains が false でスキップした件数
      duplicateNames: collected.duplicateNames || [], // 同じ英語名(alt)が複数あったカード（最大10件）
      replacedCount: replacedCount,
      divineInsertedCount: divineResult.insertedCount // 神ヒラメキ等の追加行を日本語化した件数
    };
  }

  function run(entries, effects, extraLines) {
    var charName = currentCharacter();
    log('character context:', charName);
    var ctx = buildContext(entries, charName);
    var effectsIdx = buildEffectsIndex(effects);

    var result = processPage(ctx, effectsIdx, charName, extraLines);
    result.ctx = ctx;
    // effects-ja.json が読めているかの診断用。0件なら未配置か読み込み失敗
    // （拡張の web_accessible_resources 未設定などでブロックされている場合も
    // ここに現れる）。effectsCount はファイル全体の件数。indexedCount は
    // ja_card・effect を持つ（＝buildEffectsIndexが実際に索引に載せうる）
    // 件数。source:"gamerch" も含む（優先順位 ingame > aosns > gamerch で
    // 索引に載る）。保有キーも同じ条件で最大20件だけトーストに出す。
    result.effectsCount = effects.length;
    var usableEffects = effects.filter(function (e) {
      return e && e.ja_card && e.effect;
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
      result.skippedCount + '件 / content検出' + result.contentFoundCount +
      '件 / 再適用' + result.reappliedCount + '件 / 切り離しスキップ' +
      result.staleCount + '件 / 追加行' + result.divineInsertedCount + '件'];

    if (result.skippedCount > 0) {
      // 名前を特定できず処理対象外にしたカード（無理に近い候補を採用せず
      // 英語のまま残したもの）。別カードへの誤爆が起きていないか、
      // どのカードがスキップされているかをその場で確認できるようにする。
      result.skippedNames.forEach(function (t) {
        lines.push('スキップ: 「' + t + '」');
      });
    }

    if (result.duplicateNames && result.duplicateNames.length > 0) {
      // 同じ英語名（img[alt]）のカードがページ内に複数存在する件数
      // （例: Sword Rain III×4）。名前だけを手がかりに要素を特定すると
      // 常に同じ1枚に書き込んでしまう事故につながるため、その場で確認できる
      // ようにする。
      lines.push('重複名: ' + result.duplicateNames.join('、'));
    }

    if (result.insertedCount > 0) {
      // 取り違えていないかその場で確認できるよう、集めたテキストノードの
      // 数・書き換え前の連結英文の先頭30文字・日本語を入れたノードの
      // 親要素のタグ名・書き換え後のwriteTarget先頭30文字を出す。ページ側の
      // 再描画で英語に戻っていたのを検知して再書換した場合は「(再適用)」を
      // 付ける。.chaos-content直下の子要素の数と、最初の子要素
      // （writeTarget）の書き換え前の先頭30文字も併せて出す（2つ目以降の
      // 子要素＝追加行に触れていないか確認できるように）。
      result.rewriteDetails.forEach(function (d) {
        lines.push('書換: 原文「' + d.rawNameText + '」/ level ' + d.level +
          (d.reapplied ? '(再適用)' : '') +
          ' / ノード' + d.nodeCount + '件 / 親要素' + d.parentTag +
          ' / 書換前「' + d.originalHead + '」/ 書換後「' + d.afterHead + '」');
        lines.push('  子要素' + d.childCount + '件 / 最初の子要素「' + d.firstChildHead + '」');
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
        var childCountPart = f.childCount !== undefined ? (' / 子要素' + f.childCount + '件') : '';
        lines.push('挿入失敗: 原文「' + f.rawNameText + '」/ level ' + f.level +
          ' / ' + f.reason + boxPart + scopePart + childCountPart);
      });
    }

    if (result.insertedCount === 0) {
      if (result.resolvedCount === 0) {
        lines.push('→ カード枠（カード名+種別表示の最小共通祖先）を検出できません');
      } else {
        if (result.effectsIndexedCount === 0) {
          lines.push('→ 有効な効果文データが0件です（未配置・読み込み失敗の可能性）');
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

  // ---- 実験的機能: AI翻訳（Chrome内蔵 Translator API、Magnaのページのみ） ----
  //
  // 目的: 「拡張機能で用語を置換→そのあとGoogle翻訳」の順だと、置換した公式
  // 用語をGoogle翻訳が別の言い回しに書き換えてしまう。ここでは逆に「先に
  // このAPIで翻訳→あとから既存の用語置換（カード名・効果文・extra-lines）」
  // の順にすることで、公式用語が最後に上書きされる形にする。
  //
  // 適用範囲: カード名・効果文（.chaos-card-inside内、.chaos-header/
  // .chaos-content）は既存の精密な処理に完全に任せ、このAI翻訳では一切
  // 触れない（.chaos-card-inside配下は探索から除外）。対象はそれ以外の
  // 一般的な解説文（レビュー文・Potential説明等）のみ。
  //
  // 起動タイミング: 既存のカード検出・効果文挿入・監視設置（watchEffectScope /
  // watchDivineElement）はすべて run() の呼び出しを起点にしている。ここでは
  // run() の呼び出し自体を翻訳完了後まで遅らせるだけにとどめ、run() や
  // insertEffects / insertDivineLines / 監視設置ロジックには一切手を
  // 加えない。
  //
  // 実機検証で判明した制約（2026-08-08、Chrome 150で確認）:
  //   - Translator.create() は、モデル未ダウンロード（availability が
  //     "downloadable"/"downloading"）の状態では実際のユーザー操作
  //     （クリック等）が無いと NotAllowedError で失敗する。ページ読み込み
  //     時の自動実行では満たせないため、ページ内にボタンを出して
  //     クリックを起点にする。拡張機能のポップアップでのクリックは別
  //     ドキュメントのため、ここでのジェスチャーとしては使えない。
  //   - モデル取得済み（availability が "available"）なら、以後は
  //     ジェスチャー無しで create() が成功する（＝2回目以降は自動で動く）。
  //   - プレースホルダ（[[1]] 等）は翻訳後も壊れず残ることを実機で確認済み
  //     （数値のみ・記号直後・1文中に5個等、複数パターンで確認）。

  var TRANSLATE_SOURCE_LANG = 'en';
  var TRANSLATE_TARGET_LANG = 'ja';
  var TRANSLATE_INLINE_TAGS = { B: 1, I: 1, U: 1, STRONG: 1, EM: 1, SPAN: 1, BR: 1, SUP: 1, SUB: 1, SMALL: 1, MARK: 1, A: 1 };

  // キャラクター名（固有名詞）はTranslator APIに渡すと誤訳されうる（実例:
  // "Magna"→"マグナレ"）ため、glossary用語と同じプレースホルダ機構で保護
  // する。キャラクター名はglossary.json（Prydwenのゲーム用語）にもdocs/
  // site-labels.json（サイトのUIラベル）にも属さない固有名詞のため、ここに
  // 直接持つ。範囲は引き続きMagnaのページのみのため1件のみ登録している。
  var CHARACTER_JA_NAMES = { Magna: 'マグナ' };

  // 要素の中身が「インラインタグ（A含む）とテキストだけ」かどうか。
  // これがtrueの要素を1つの翻訳単位（ブロック）として扱う。falseなら
  // まだ内側にP/DIV/LI等の入れ子構造が残っているとみなし、さらに内側へ
  // 降りて探す。
  function isInlineOnlyForTranslate(el) {
    for (var i = 0; i < el.children.length; i++) {
      var c = el.children[i];
      if (!TRANSLATE_INLINE_TAGS[c.tagName]) { return false; }
      if (!isInlineOnlyForTranslate(c)) { return false; }
    }
    return true;
  }

  function hasLatinLetter(s) {
    return /[A-Za-z]/.test(s);
  }

  // 単語数がこれ未満のブロックは、原則Translator APIに渡さない（文脈の無い
  // 単独の単語・略語・表の見出しを誤訳させないため）。Magnaのページの実データ
  // （翻訳単位846件の単語数分布）で判断: 1〜5語が574件（68%）を占め、その
  // 中身は "DEF"/"ATK"/"HP"（STATS欄の見出し）、"Potential 1"、"基本カード
  // Proficiency"（Potential名。基本カードは既存確定語）、"CRIT Rate > CRIT
  // DMG"（比較式）、ナビゲーションメニュー項目、装備・カード名の一覧など、
  // 単語・略語・見出しの類がほとんどだった。6語以上になると急激に件数が
  // 減り（6〜7語は846件中8件のみ）、8語以上から一貫して文章（主語・動詞・
  // 句読点を伴う説明文）になる。この境目から6語未満を基本の「短い」基準とした。
  var TRANSLATE_MIN_WORDS = 6;

  // 語数だけでは「Increase Health by 1.6/8%.」（4語だが完結した文）のような
  // 短い文を、ラベル・見出しと区別できない。実データを確認したところ、
  // これらの短い文は例外なく英語の文末記号（.!?）で終わっており、一方で
  // ラベル・見出し・数値表記（"Last profile update*"、"15/Mar/2026"、
  // "Potential 5-2"、"Prydwen.gg"、"1.6/8%"の小数点等）は文末記号で終わって
  // いなかった。そのため、語数がTRANSLATE_MIN_WORDS未満でも、文末が
  // ".!?"（数値の小数点と紛らわしい「数字直後の.」を除く）であれば文と
  // みなしTranslator APIに渡す。実機でMagnaのページに適用し、新たに
  // 対象になったのは「Increase Health by 1.6/8%.」「Base performance of
  // the character.」「Removed in most Magna decks.」「Loading content...」の
  // 4種のみで、STATS欄のDEF/ATK/HP等は引き続き対象外のままであることを確認済み。
  function isTooShortForTranslate(text) {
    var words = text.split(/\s+/).filter(Boolean).length;
    if (words >= TRANSLATE_MIN_WORDS) { return false; }
    var trimmed = text.replace(/\s+$/, '');
    var lastChar = trimmed.charAt(trimmed.length - 1);
    if (lastChar === '.' || lastChar === '!' || lastChar === '?') {
      var beforeLast = trimmed.charAt(trimmed.length - 2);
      if (lastChar === '.' && /[0-9]/.test(beforeLast)) { return true; } // 小数点等、文末ではない
      return false; // 文末記号がある短い文 → 翻訳対象にする
    }
    return true;
  }

  // document.body（.chaos-card-inside配下とSCRIPT/STYLE等を除く）から、
  // 翻訳単位となる「まとまり」要素を再帰的に収集する。単語数が
  // TRANSLATE_MIN_WORDS未満の短いブロックはTranslator APIに渡さず収集
  // 対象から外す（これ以上細かい単位には分解しないため、ここで打ち切り、
  // 再帰もしない）。除いたブロックは元の英語のまま残り、run()内で従来通り
  // 実行される用語置換（replaceTermsOnPage、glossary.jsonベース）だけが
  // 適用される。数値のみ・記号のみ等アルファベットを含まないブロックは
  // hasLatinLetter でそもそも対象にしない（Translator APIには一切渡らない）。
  function collectTranslationBlocks(root, out) {
    var children = Array.prototype.slice.call(root.children);
    children.forEach(function (el) {
      if (SKIP_TAGS.test(el.tagName)) { return; }
      if (el.classList && el.classList.contains('chaos-card-inside')) { return; } // カード領域は既存処理に任せる
      if (el.hasAttribute('data-czn-translated')) { return; } // 処理済み
      var text = (el.textContent || '').trim();
      if (text && hasLatinLetter(text) && isInlineOnlyForTranslate(el)) {
        if (!isTooShortForTranslate(text)) {
          out.push(el);
        }
      } else {
        collectTranslationBlocks(el, out);
      }
    });
  }

  // 要素のDOMを歩いてテキストを取り出す。<a>はプレースホルダに置き換えて
  // href・表示文字列を退避する（翻訳後にリンクとして復元するため）。
  // <br>は改行に、その他の許可インラインタグ（B/I/U/STRONG/EM/SPAN/SUP/
  // SUB/SMALL/MARK）は中身のテキストだけを残す（強調は失われるが、ユーザー
  // の指示により許容する既知の制約）。
  function extractBlockTextWithPlaceholders(el, placeholders) {
    var parts = [];
    Array.prototype.forEach.call(el.childNodes, function (node) {
      if (node.nodeType === 3) {
        parts.push(node.nodeValue);
      } else if (node.nodeType === 1 && node.tagName === 'A') {
        var token = '[[' + (placeholders.length + 1) + ']]';
        placeholders.push({ token: token, kind: 'link', href: node.getAttribute('href'), text: node.textContent });
        parts.push(token);
      } else if (node.nodeType === 1 && node.tagName === 'BR') {
        parts.push('\n');
      } else if (node.nodeType === 1) {
        parts.push(extractBlockTextWithPlaceholders(node, placeholders));
      }
    });
    // タグの境界をまたいで単語が連結してしまうケース（例: Prydwen側の
    // 生HTML "<strong>Use the tabs</strong>to quickly switch..." のように、
    // 閉じタグ直後に空白なく後続テキストが続く記述ミスがあり、"tabsto"と
    // いう1語に見えてしまうことがある。実際に"Tabs"が翻訳されずに残る
    // 原因として実機で確認済み）を防ぐため、隣接パーツの境界が英数字同士に
    // なっている場合はスペースを1つ補う。DOM自体は書き換えないため、英語
    // 表示には影響しない（翻訳に渡すテキストだけの補正）。
    var joined = parts.length > 0 ? parts[0] : '';
    for (var i = 1; i < parts.length; i++) {
      var prev = joined;
      var next = parts[i];
      if (prev && next && isWordChar(prev.charAt(prev.length - 1)) && isWordChar(next.charAt(0))) {
        joined += ' ';
      }
      joined += next;
    }
    return joined;
  }

  // 既にAI翻訳より前の段階（用語置換の一部先行適用や、ページ側の再描画で
  // 混入した日本語等）で日本語になっている部分を、Translator APIにそのまま
  // 渡すとさらに誤訳されうる（実例: "ヴァンガード"→"ビュンジェード"のような
  // 再翻訳による崩れ）。ひらがな・カタカナ・漢字の連続をプレースホルダに
  // 置き換えて素通しし、翻訳後にそのまま復元する。
  var JAPANESE_RUN_RE = /[぀-ヿ㐀-鿿＀-￯]+/g;

  function substituteJapaneseRunPlaceholders(text, placeholders) {
    return text.replace(JAPANESE_RUN_RE, function (match) {
      var token = '[[' + (placeholders.length + 1) + ']]';
      placeholders.push({ token: token, kind: 'japanese', text: match });
      return token;
    });
  }

  // glossary.json の確定語（en）をプレースホルダに置き換える。翻訳後に
  // ここで退避した ja で復元することで、地の文中の用語も公式訳になる
  // （既存の replaceTermsOnPage と同じ単語境界判定を使う）。
  function substituteTermPlaceholders(text, resolved, placeholders) {
    var alts = Object.keys(resolved).sort(function (a, b) { return b.length - a.length; }).map(rxEscape);
    if (alts.length === 0) { return text; }
    var re = new RegExp(alts.join('|'), 'g');
    var result = '';
    var last = 0;
    var m;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      var s = m.index;
      var e = s + m[0].length;
      if (isWordChar(text.charAt(s - 1)) || isWordChar(text.charAt(e))) { re.lastIndex = e; continue; }
      var token = '[[' + (placeholders.length + 1) + ']]';
      placeholders.push({ token: token, kind: 'term', ja: resolved[m[0]].ja });
      result += text.slice(last, s) + token;
      last = e;
      re.lastIndex = e;
    }
    result += text.slice(last);
    return result;
  }

  // docs/site-labels.json の英語ラベル（en）をプレースホルダに置き換える。
  // glossary.json用のsubstituteTermPlaceholdersと役割は同じだが、こちらは
  // replaceSiteLabelsOnPageと同じくcase-insensitiveでマッチする。地の文中の
  // 一般語（例: "character"）はPrydwenのUIラベルとしての原表記
  // （"Character"）と大文字小文字が一致しないことが多いため（実機で
  // "5✦ character"という小文字表記を確認済み）。
  function substituteSiteLabelPlaceholders(text, siteLabels, placeholders) {
    var keys = Object.keys(siteLabels);
    if (keys.length === 0) { return text; }
    var lowerLookup = Object.create(null);
    keys.forEach(function (k) { lowerLookup[k.toLowerCase()] = siteLabels[k]; });
    var alts = keys.sort(function (a, b) { return b.length - a.length; }).map(rxEscape);
    var re = new RegExp(alts.join('|'), 'gi');
    var result = '';
    var last = 0;
    var m;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      var s = m.index;
      var e = s + m[0].length;
      if (isWordChar(text.charAt(s - 1)) || isWordChar(text.charAt(e))) { re.lastIndex = e; continue; }
      var token = '[[' + (placeholders.length + 1) + ']]';
      placeholders.push({ token: token, kind: 'term', ja: lowerLookup[m[0].toLowerCase()] });
      result += text.slice(last, s) + token;
      last = e;
      re.lastIndex = e;
    }
    result += text.slice(last);
    return result;
  }

  // 翻訳後の文字列に残ったプレースホルダ（[[N]]）を、リンク要素または
  // 公式用語のテキストに復元してDocumentFragmentを組み立てる。
  function restorePlaceholders(translatedText, placeholders) {
    var frag = document.createDocumentFragment();
    var byToken = Object.create(null);
    placeholders.forEach(function (p) { byToken[p.token] = p; });

    var tokenRe = /\[\[(\d+)\]\]/g;
    var last = 0;
    var m;
    while ((m = tokenRe.exec(translatedText)) !== null) {
      if (m.index > last) {
        frag.appendChild(document.createTextNode(translatedText.slice(last, m.index)));
      }
      var p = byToken[m[0]];
      if (p && p.kind === 'link') {
        var a = document.createElement('a');
        if (p.href) { a.setAttribute('href', p.href); }
        a.textContent = p.text;
        frag.appendChild(a);
      } else if (p && p.kind === 'term') {
        frag.appendChild(document.createTextNode(p.ja));
      } else if (p && p.kind === 'japanese') {
        frag.appendChild(document.createTextNode(p.text));
      } else {
        frag.appendChild(document.createTextNode(m[0])); // 対応が見つからない場合はそのまま残す
      }
      last = tokenRe.lastIndex;
    }
    if (last < translatedText.length) {
      frag.appendChild(document.createTextNode(translatedText.slice(last)));
    }
    return frag;
  }

  // 1ブロックを翻訳して書き換える。個別に失敗しても他のブロックへの
  // 処理は続ける（1箇所の失敗で全体を止めないため）。
  function translateOneBlock(el, translator, resolved, siteLabels) {
    var placeholders = [];
    var rawText = extractBlockTextWithPlaceholders(el, placeholders);
    // 既に日本語になっている部分（用語置換の先行適用等）→サイトラベル→
    // glossary用語の順に保護する。site-labels.jsonとglossary.jsonは登録
    // 対象が重ならない設計のため、この2つの処理順自体は結果に影響しない
    // （ページ全体を扱う既存のreplaceSiteLabelsOnPage→replaceTermsOnPageの
    // 順序に合わせているだけ）。
    var withJapaneseProtected = substituteJapaneseRunPlaceholders(rawText, placeholders);
    var withSiteLabelsProtected = siteLabels
      ? substituteSiteLabelPlaceholders(withJapaneseProtected, siteLabels, placeholders)
      : withJapaneseProtected;
    var withPlaceholders = substituteTermPlaceholders(withSiteLabelsProtected, resolved, placeholders);
    if (!withPlaceholders.trim()) { return Promise.resolve(false); }

    return translator.translate(withPlaceholders).then(function (translated) {
      var frag = restorePlaceholders(translated, placeholders);
      while (el.firstChild) { el.removeChild(el.firstChild); }
      el.appendChild(frag);
      el.setAttribute('data-czn-translated', '1');
      return true;
    }).catch(function (err) {
      log('block translation failed (skipped):', err.message);
      return false;
    });
  }

  // ブロックを1件ずつ順番に処理する（Translator APIの処理は元々
  // 逐次実行のため、並列化しても速くならない）。診断用にトーストへ出す
  // ため、成功件数も数えて返す。
  function translateBlocksSequentially(blocks, translator, resolved, siteLabels) {
    var i = 0;
    var succeeded = 0;
    function next() {
      if (i >= blocks.length) { return Promise.resolve({ attempted: blocks.length, succeeded: succeeded }); }
      var el = blocks[i++];
      return translateOneBlock(el, translator, resolved, siteLabels).then(function (ok) {
        if (ok) { succeeded++; }
        return next();
      });
    }
    return next();
  }

  // 今アクティブな（ユーザーが見ている）タブパネルに属するブロックを、
  // それ以外（非アクティブなタブパネル、および後述の理由でページ内に
  // 存在する複製DOM）より先に翻訳対象にする。逐次処理のAPIをドキュメント
  // の出現順そのままで処理すると、ページ下部のセクション（例:
  // デッキ解説）は先に何十件ものブロックを処理し終えるまで手が付かず、
  // 実機で最大15秒前後、日本語化されないまま英語で見えてしまうことを
  // 確認した（.tab-insideは5つのタブパネル全てが常にDOM上に存在し、
  // activeクラスの有無だけで表示/非表示を切り替えている既知の構造）。
  // .tab-insideに属さない要素（共通部分）とactiveなタブパネル内の要素を
  // 優先度0、それ以外を優先度1とし、安定ソートで同一優先度内の元の順序
  // は保つ。非アクティブなタブパネルも従来通りこの並べ替えの範囲内で
  // 翻訳され続けるため、タブを切り替えたときのために先読みしておくという
  // 既存の狙いは変えていない。
  function isInsideInactiveTab(el) {
    var tab = el.closest ? el.closest('.tab-inside') : null;
    return !!tab && !tab.classList.contains('active');
  }

  function prioritizeVisibleTabBlocks(blocks) {
    return blocks
      .map(function (el, i) { return { el: el, i: i }; })
      .sort(function (a, b) {
        var pa = isInsideInactiveTab(a.el) ? 1 : 0;
        var pb = isInsideInactiveTab(b.el) ? 1 : 0;
        if (pa !== pb) { return pa - pb; }
        return a.i - b.i;
      })
      .map(function (x) { return x.el; });
  }

  function translatePage(translator, resolved, siteLabels) {
    var blocks = [];
    collectTranslationBlocks(document.body, blocks);
    blocks = prioritizeVisibleTabBlocks(blocks);
    log('translation blocks found:', blocks.length);
    return translateBlocksSequentially(blocks, translator, resolved, siteLabels);
  }

  // AI翻訳のプレースホルダ保護に使うresolvedを組み立てる。既存の
  // buildContext(entries, charName).resolved（glossary.json由来）に、
  // キャラクター名（CHARACTER_JA_NAMES、固有名詞のため別扱い）を追加する。
  // buildContext自体は改変しない（既存の用語置換processPage側の呼び出しは
  // 元のbuildContextの戻り値をそのまま使い続ける）。
  function buildTranslationResolved(entries, charName) {
    var resolved = buildContext(entries, charName).resolved;
    var characterJa = CHARACTER_JA_NAMES[charName];
    if (characterJa && !resolved[charName]) {
      resolved = Object.assign(Object.create(null), resolved);
      resolved[charName] = { ja: characterJa, character: charName, ambiguous: false };
    }
    return resolved;
  }

  // モデル未ダウンロード時にページ内に出すボタン。実際のクリック（＝
  // ユーザージェスチャー）が無いと Translator.create() が
  // NotAllowedError で失敗するため、これを起点にする。ダウンロード完了
  // または失敗で必ず取り除く。Prydwenのレイアウトに影響しないよう
  // position:fixed の小さいバッジにする。
  function showTranslateDownloadButton() {
    var btn = document.createElement('button');
    btn.id = 'czn-translate-download-btn';
    btn.textContent = 'CZN: AI翻訳モデルを取得（クリックで開始）';
    btn.style.cssText =
      'position:fixed;left:12px;bottom:12px;z-index:2147483647;max-width:280px;' +
      'background:rgba(20,20,20,0.9);color:#fff;padding:8px 12px;' +
      'border:1px solid rgba(255,255,255,0.3);border-radius:6px;cursor:pointer;' +
      'font:12px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.3);';
    document.body.appendChild(btn);
    return btn;
  }

  function removeTranslateDownloadButton(btn) {
    if (btn && btn.parentNode) { btn.parentNode.removeChild(btn); }
  }

  // クリックを起点に Translator.create() を呼び、ダウンロード進捗を
  // ボタンの表示で示す。完了・失敗いずれの場合もボタンを消す。この
  // クリックで作られたtranslatorは今回のページには適用しない（今回の
  // run()はすでに翻訳無しで進んでいるため）。次回のページ読み込みからは
  // availabilityが"available"になり、ジェスチャー無しで自動翻訳される。
  function offerTranslatorDownload() {
    var btn = showTranslateDownloadButton();
    btn.addEventListener('click', function onClick() {
      btn.removeEventListener('click', onClick);
      btn.disabled = true;
      btn.textContent = 'CZN: AI翻訳モデルを取得中…';
      window.Translator.create({
        sourceLanguage: TRANSLATE_SOURCE_LANG,
        targetLanguage: TRANSLATE_TARGET_LANG,
        monitor: function (m) {
          m.addEventListener('downloadprogress', function (e) {
            btn.textContent = 'CZN: AI翻訳モデルを取得中… ' + Math.round(e.loaded * 100) + '%';
          });
        }
      }).then(function () {
        removeTranslateDownloadButton(btn);
        showStatusToast('CZN: AI翻訳モデルの取得が完了しました。次回のページ読み込みから有効になります');
      }).catch(function (err) {
        log('Translator.create (via button) failed:', err.message);
        removeTranslateDownloadButton(btn);
      });
    });
  }

  // 翻訳フェーズ全体のエントリポイント。{ translator, status } を返す。
  // translator が無い場合、呼び出し側は「翻訳スキップ→従来通り置換のみ」に
  // フォールバックする（拡張機能全体は止めない）。status はトーストで
  // 見える形にして、OFF・API無し・利用不可・失敗のどれで止まったのかを
  // DevToolsを開かずに確認できるようにするための診断用（元々サイレントに
  // nullを返すだけだったため、原因の切り分けができなかった）。
  function setupTranslation(charName) {
    if (charName !== 'Magna') { return Promise.resolve({ translator: null, status: 'not-magna' }); }
    return getTranslateEnabled().then(function (enabled) {
      if (!enabled) { return { translator: null, status: 'off' }; }
      if (typeof window.Translator === 'undefined') {
        log('Translator API is not available in this context');
        return { translator: null, status: 'no-api' };
      }
      return window.Translator.availability({ sourceLanguage: TRANSLATE_SOURCE_LANG, targetLanguage: TRANSLATE_TARGET_LANG })
        .then(function (avail) {
          if (avail === 'available') {
            return window.Translator.create({ sourceLanguage: TRANSLATE_SOURCE_LANG, targetLanguage: TRANSLATE_TARGET_LANG })
              .then(function (translator) { return { translator: translator, status: 'ready' }; });
          }
          if (avail === 'downloadable' || avail === 'downloading') {
            offerTranslatorDownload(); // 今回のページはブロックせず、ボタンだけ出す
            return { translator: null, status: 'downloadable' };
          }
          return { translator: null, status: 'unavailable:' + avail };
        });
    }).catch(function (err) {
      log('setupTranslation failed:', err.message);
      return { translator: null, status: 'error:' + err.message };
    });
  }

  getEnabled().then(function (enabled) {
    if (!enabled) { log('disabled via popup toggle'); return; }

    Promise.all([fetchGlossary(), fetchEffects(), fetchExtraLines(), fetchSiteLabels()]).then(function (results) {
      var entries = results[0];
      var effects = results[1];
      var extraLines = results[2];
      var siteLabels = results[3];
      var charName = currentCharacter();

      // サイト独自のUIラベル（docs/site-labels.json）はゲーム用語の翻訳・
      // 用語置換とは無関係の別レイヤーなので、AI翻訳フェーズより前に適用
      // する。これにより、"Loading content..."のようにサイトラベル側に
      // 訳語がある短い文はここで既に日本語化され、後段の翻訳対象ブロック
      // 収集では（アルファベットが残っていないため）自動的に対象外になる
      // （hasLatinLetterの既存判定がそのまま効くため、優先順位のための
      // 特別な分岐は追加していない）。範囲は引き続きMagnaのページのみ。
      if (charName === 'Magna') {
        replaceSiteLabelsOnPage(siteLabels);
      }

      // AI翻訳（実験的機能）は run() より前に完了させる。run() 自体が
      // カード検出・効果文挿入・監視設置（watchEffectScope /
      // watchDivineElement）・ページ全体監視の起点であり、run() の
      // 呼び出しを翻訳完了後まで遅らせるだけで、既存コードを一切変更
      // せずに「翻訳→監視開始」の順序を満たせる。翻訳が使えない・失敗
      // した場合は setupTranslation が null を返し、そのまま従来通り
      // 置換のみで進む。
      setupTranslation(charName).then(function (setup) {
        var translationPromise = setup.translator
          ? translatePage(setup.translator, buildTranslationResolved(entries, charName), siteLabels)
          : Promise.resolve(null);

        translationPromise.catch(function (err) {
          log('translation phase failed (falling back to replacement-only):', err.message);
          return null;
        }).then(function (translateResult) {
          var result = run(entries, effects, extraLines);
          var ctx = result.ctx;

          // AI翻訳フェーズの結果（status・処理件数）を診断用に出す。トースト
          // は他の描画に巻き込まれて消えることがあるため、consoleへの出力
          // （logAlways、CZN_DEBUGの設定に関わらず必ず出る）を主な確認手段
          // とし、トーストは補助として残す。
          var translateLine = 'CZN: AI翻訳 status=' + setup.status +
            (translateResult ? (' / 対象' + translateResult.attempted + '件 / 成功' + translateResult.succeeded + '件') : '');
          logAlways(translateLine);
          showStatusToast(translateLine + '\n' + formatToastMessage(result));

          // SPA的な再描画に対応する簡易 MutationObserver。連続発火を間引きつつ、
          // 収集→挿入→置換の3段階をまとめて再実行する（用語置換だけ除外すると、
          // 再描画で消えた置換結果が復活しないため）。
          //
          // AI翻訳（実験的機能）も同じ再スキャンに組み込む。POTENTIAL欄等、
          // document_idle時点でまだDOMに存在しないコンテンツ（Reactの
          // ハイドレーション遅延によるものと見られるが、hydrationエラー
          // #418との因果関係自体は未確認）が後から現れても、次の再スキャン
          // で拾えるようにするため。
          //   - 二重翻訳の防止: translatePage内のcollectTranslationBlocksは
          //     data-czn-translated属性を持つ要素を除外するため、毎回の
          //     再スキャンは「まだ翻訳していない新規ブロックだけ」を対象に
          //     する。同じブロックが繰り返し翻訳APIに渡ることはない
          //   - 「先に翻訳、あとから用語置換」の順序: 初回と全く同じ構造
          //     （毎回のrescanTranslationのthen内でprocessPage、つまり
          //     replaceTermsOnPageを呼ぶ）にすることで、再スキャンの
          //     どの回でもこの順序が保たれることを保証する
          //   - 多重実行の防止: pendingの解除をprocessPage完了後（翻訳が
          //     終わった後）に移し、翻訳中に次のタイマーが動き出さない
          //     ようにする
          //
          // 調査の過程で、docs/site-labels.jsonの適用（replaceSiteLabelsOnPage）
          // も同じ問題を抱えていることが分かった（初回のみの実行のため、
          // "Introduction"見出し等も後から現れた場合に取り残される。実機で
          // czn-replacedスパンが一切付いていないことを確認済み）。用語置換
          // より前に適用する既存の順序を保ったまま、こちらも同じ再スキャンに
          // 組み込む。
          var pending = false;
          function scheduleRescan() {
            if (pending) { return; }
            pending = true;
            setTimeout(function () {
              if (charName === 'Magna') {
                replaceSiteLabelsOnPage(siteLabels);
              }
              var freshEffectsIdx = buildEffectsIndex(effects);
              var rescanTranslation = setup.translator
                ? translatePage(setup.translator, buildTranslationResolved(entries, charName), siteLabels)
                : Promise.resolve(null);
              rescanTranslation.catch(function (err) {
                log('rescan translation failed (falling back to replacement-only):', err.message);
                return null;
              }).then(function () {
                processPage(ctx, freshEffectsIdx, currentCharacter(), extraLines);
                pending = false;
              });
            }, 500);
          }
          var observer = new MutationObserver(scheduleRescan);
          observer.observe(document.body, { childList: true, subtree: true });

          // MutationObserverはchildList/subtreeのみを監視しているため、
          // タブ切り替え（activeクラスの付け替えだけで子要素の追加削除を
          // 伴わない）では発火しない。タブをクリックした直後に
          // translatePage側の優先順位付け（prioritizeVisibleTabBlocks）を
          // 効かせるため、同じ再スキャンをタブクリックでも起動する。
          // Prydwen側の既存クリックハンドラ自体は変更せず、素通しの
          // バブリングリスナーを追加するだけ。
          if (charName === 'Magna') {
            document.body.addEventListener('click', function (ev) {
              if (ev.target.closest && ev.target.closest('.single-tab')) {
                scheduleRescan();
              }
            });
          }
        });
      });
    }).catch(function (err) {
      console.error('[czn-ext] 初期化に失敗:', err);
      showStatusToast('CZN: 初期化に失敗しました');
    });
  });
})();
