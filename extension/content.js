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
//      （ローマ数字除去後）を主な判定基準にしている
//   3. カード名末尾のローマ数字（I/II/III/IV/V）をヒラメキ段階(level 1-5)、
//      無ければ level 0 として扱い、effects-ja.json を
//      (character, ja_card, level) で引く。該当levelの効果文が手元データに
//      あれば、カード枠内の効果文要素（画像下部、コスト数字・カード名・種別
//      表示・Show Effectsを除いた最長のテキスト要素）の直後に、英語を消さず
//      日本語効果文を追記する
//   4. ブックマークレットと同じロジックで、カード以外のテキストの用語置換も
//      行う。ローマ数字が続く場合は「Sword Rain III(剣の雨 III)」のように
//      まとめて1つの用語として扱う
//   5. 起動時に画面右下へ簡易トーストを出し、動いているかを目視確認できるようにする。
//      「カード枠◯件 / 名前取得◯件 / ユニーク◯件 / 効果文◯件」の内訳を表示する。
//      カード枠は種別表示から検出を試みた件数、名前取得はそのうちカード名まで
//      特定できた件数、ユニークはベース名（ローマ数字を除いた名前、レベル違いは
//      1件にまとめる）の種類数。同名でもカード枠ごとに別カードとして処理し、
//      名前による集約・重複排除は一切行わない
//
// 実装上の注意:
//   - www.prydwen.gg への自動アクセスが403で拒否されるため、細部のセレクタは
//     見ないまま書いている。調整は selectors.js を編集すること。
//   - CZN_SELECTORS は selectors.js で定義され、このファイルより先に読み込まれる
//     （manifest.json の content_scripts.js の順序に依存）。

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
  function effectsKey(character, jaName, level) {
    return (character || '') + '|' + jaName + '|' + level;
  }

  function buildEffectsIndex(effects) {
    var idx = Object.create(null);
    effects.forEach(function (e) {
      if (!e || !e.ja_card || !e.effect) { return; }
      var level = typeof e.level === 'number' ? e.level : 0;
      if (e.character) {
        idx[effectsKey(e.character, e.ja_card, level)] = e.effect;
      }
      // character なし・またはフォールバック用に character 抜きキーも登録
      // （character が分かっている場面では上の複合キーが優先されるので実害は小さい）
      var fallbackKey = effectsKey(null, e.ja_card, level);
      if (!(fallbackKey in idx)) {
        idx[fallbackKey] = e.effect;
      }
    });
    return idx;
  }

  // level は完全一致のみ。該当レベルの効果文が無ければ null（他レベルへの
  // フォールバックはしない）。
  function lookupEffect(effectsIdx, jaName, character, level) {
    if (character) {
      var withChar = effectsKey(character, jaName, level);
      if (effectsIdx[withChar] !== undefined) { return effectsIdx[withChar]; }
    }
    var withoutChar = effectsKey(null, jaName, level);
    if (effectsIdx[withoutChar] !== undefined) { return effectsIdx[withoutChar]; }
    return null;
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
  function findGlossaryNameLeaf(scope, excludeRoot, knownEnNames) {
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.children.length > 0) { continue; } // 葉要素のみ
      if (excludeRoot && (node === excludeRoot || excludeRoot.contains(node))) { continue; }
      var text = (node.textContent || '').trim();
      if (!text || hasExcludedSuffix(text)) { continue; }
      if (knownEnNames.has(stripRomanLevel(text).base)) { return node; }
    }
    return null;
  }

  // 種別表示要素（"Attack"/"Skill"）から親を1階層ずつたどり、「カード名候補
  // （glossaryと完全一致、かつコロン終わりでない）を含む最小の祖先」を
  // カード枠として返す。それより外は探索しない。見つからなければ null。
  function findCardBox(typeLabelEl, knownEnNames) {
    var maxClimb = CZN_SELECTORS.maxAncestorClimb || 10;
    var el = typeLabelEl;
    for (var depth = 0; depth < maxClimb && el.parentElement; depth++) {
      el = el.parentElement;
      var nameEl = findGlossaryNameLeaf(el, typeLabelEl, knownEnNames);
      if (nameEl) {
        return { box: el, nameEl: nameEl };
      }
    }
    return null;
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

  // box 内で、コスト数字・カード名・種別表示・"Show Effects"・ローマ数字
  // バッジを除いた葉要素のうち、最もテキストが長いものを効果文の要素とみなす
  // （画像下部の効果文を想定）。日本語効果文はこの要素の直後（afterend）に
  // 挿入する。
  function findEffectTextEl(box, excludeEls) {
    var walker = document.createTreeWalker(box, NodeFilter.SHOW_ELEMENT);
    var node;
    var best = null;
    var bestLen = 0;
    while ((node = walker.nextNode())) {
      if (node.children.length > 0) { continue; }
      if (excludeEls.indexOf(node) !== -1) { continue; }
      var text = (node.textContent || '').trim();
      if (!text) { continue; }
      if (text === 'Attack' || text === 'Skill' || text === 'Show Effects') { continue; }
      if (/^[0-9]+$/.test(text)) { continue; } // コストの数字
      if (Object.prototype.hasOwnProperty.call(ROMAN_LEVELS, text)) { continue; } // レベル表記
      if (text.length > bestLen) { best = node; bestLen = text.length; }
    }
    return best;
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

    typeLabels.forEach(function (label) {
      var found = findCardBox(label, knownEnNames);
      if (!found) { log('card box (name + type label) not found for a label'); return; }

      var nameText = (found.nameEl.textContent || '').trim();
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
    return { candidates: candidates, attemptedCount: typeLabels.length };
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

      var nameText = (nameEl.textContent || '').trim();
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

    return { candidates: candidates, attemptedCount: containers.length };
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

  function insertEffects(candidates, effectsIdx, charName) {
    var inserted = 0;
    var diagnostics = [];

    candidates.forEach(function (c) {
      if (PROCESSED.has(c.block)) { return; }

      var effect = c.entry
        ? lookupEffect(effectsIdx, c.entry.ja, c.entry.character || charName, c.level)
        : null;

      if (diagnostics.length < 10) {
        diagnostics.push({
          rawNameText: c.rawNameText || c.nameText,
          nameText: c.nameText,
          entry: c.entry,
          level: c.level,
          effectFound: !!effect
        });
      }

      if (!c.entry) { PROCESSED.add(c.block); return; } // glossaryに無いカード名
      if (!effect) { PROCESSED.add(c.block); return; } // 該当levelの効果文が無い

      var excludeEls = [c.nameEl];
      if (c.typeLabelEl) { excludeEls.push(c.typeLabelEl); }
      if (c.levelBadgeEl) { excludeEls.push(c.levelBadgeEl); }
      var effectEl = findEffectTextEl(c.block, excludeEls);
      var target = effectEl || c.block; // 効果文要素が見つからなければ枠自体を対象に

      if (target.getAttribute('data-czn-effect') === '1') { PROCESSED.add(c.block); return; }

      var div = document.createElement('div');
      div.className = 'czn-effect-text-ja';
      div.textContent = effect;
      div.style.cssText =
        'margin-top:4px;padding-top:4px;border-top:1px dashed rgba(120,120,120,0.4);' +
        'white-space:pre-wrap;font-size:0.9em;color:inherit;';

      if (effectEl) {
        effectEl.insertAdjacentElement('afterend', div); // 効果文要素の直後に挿入
      } else {
        c.block.appendChild(div); // フォールバック: 枠の末尾に追加
      }
      target.setAttribute('data-czn-effect', '1');
      PROCESSED.add(c.block);
      inserted++;
      log('inserted effect for', c.nameText, 'level', c.level);
    });

    return { insertedCount: inserted, diagnostics: diagnostics, candidateCount: candidates.length };
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
            cls.indexOf('czn-effect-text-ja') !== -1) {
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
        span.style.cssText = 'background:rgb(255,240,150);border-radius:3px;padding:0 1px;';
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

  function run(entries, effects) {
    var charName = currentCharacter();
    log('character context:', charName);
    var ctx = buildContext(entries, charName);
    var effectsIdx = buildEffectsIndex(effects);

    var collected = collectCardCandidates(ctx);             // 1. カード名（原文）
    var candidates = collected.candidates;
    var insertResult = insertEffects(candidates, effectsIdx, charName); // 2. 効果文挿入
    var replacedCount = replaceTermsOnPage(ctx);             // 3. 用語置換

    // ユニーク件数はカード枠（box）単位ではなく、ベース名（ローマ数字除去後）
    // 単位で数える。同じ名前の複数レベル（Sword Rain I〜V 等）は1件として
    // まとめて数え、box ごとの処理そのものには一切影響しない（診断表示用）。
    var uniqueNames = new Set(candidates.map(function (c) { return c.baseName; }));

    return {
      ctx: ctx,
      insertedCount: insertResult.insertedCount,
      diagnostics: insertResult.diagnostics,
      attemptedCount: collected.attemptedCount, // カード枠: 種別表示から検出を試みた件数
      resolvedCount: insertResult.candidateCount, // 名前取得: カード名まで特定できた件数
      uniqueCount: uniqueNames.size, // ユニーク: ベース名（レベル違いをまとめた）の種類数
      replacedCount: replacedCount
    };
  }

  function formatToastMessage(result) {
    if (result.attemptedCount === 0 && result.replacedCount === 0) {
      return 'CZN: 対象が見つかりません';
    }

    var lines = ['CZN: カード枠' + result.attemptedCount + '件 / 名前取得' +
      result.resolvedCount + '件 / ユニーク' + result.uniqueCount + '件 / 効果文' +
      result.insertedCount + '件'];

    if (result.insertedCount === 0) {
      if (result.resolvedCount === 0) {
        lines.push('→ カード枠（カード名+種別表示の最小共通祖先）を検出できません');
      } else {
        result.diagnostics.forEach(function (d) {
          var jaPart = d.entry ? d.entry.ja : '日本語化NG';
          var effectPart = d.effectFound ? '効果文あり' : '効果文なし';
          lines.push('原文「' + d.rawNameText + '」→ ' + jaPart + ' / level ' + d.level +
            ' → ' + effectPart);
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

      // SPA的な後読みに対応する簡易 MutationObserver。連続発火を間引く。
      // ここでも「収集してから挿入」の順を守る（用語置換はここでは行わない。
      // 初回の replaceTermsOnPage 以降に増えたカードの原文はまだ置換されて
      // いないので、そのまま名前を読める）。
      var pending = false;
      var observer = new MutationObserver(function () {
        if (pending) { return; }
        pending = true;
        setTimeout(function () {
          pending = false;
          var freshEffectsIdx = buildEffectsIndex(effects);
          var freshCandidates = collectCardCandidates(ctx).candidates;
          insertEffects(freshCandidates, freshEffectsIdx, currentCharacter());
        }, 500);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }).catch(function (err) {
      console.error('[czn-ext] 初期化に失敗:', err);
      showStatusToast('CZN: 初期化に失敗しました');
    });
  });
})();
