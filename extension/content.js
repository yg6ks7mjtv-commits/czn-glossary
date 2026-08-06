// CZN 用語対応表 拡張 — prydwen.gg (Chaos Zero Nightmare) 用コンテンツスクリプト。
// 開発用・非公開。ストアには出さず、デベロッパーモードのフォルダ読み込みで使う前提。
//
// やること:
//   1. glossary.json（公開URL）と effects-ja.json（拡張に同梱・非公開）を読む
//   2. ページ上の「Show Effects」を含む説明ブロックを検出し、近くの見出し要素
//      からカード名(英語)を取得、glossary.json で日本語に変換
//   3. 効果文が手元データにあれば、英語の説明文を残したまま、その下に追記する
//      （説明欄はもともと空ではなく、Prydwenの英語説明とShow Effectsリンクが
//      入っている。空要素を探す旧方式は使っていない）
//   4. ブックマークレットと同じロジックで、カード以外のテキストの用語置換も行う
//   5. 起動時に画面右下へ簡易トーストを出し、動いているかを目視確認できるようにする
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

  function buildEffectsIndex(effects) {
    // key: character + ' ' + ja_card 、character不明時は ' ' + ja_card
    var idx = Object.create(null);
    effects.forEach(function (e) {
      if (!e || !e.ja_card || !e.effect) { return; }
      if (e.character) {
        idx[e.character + ' ' + e.ja_card] = e.effect;
      }
      // character なし・またはフォールバック用に ja_card 単独キーも登録
      // （同名カードが character 違いで複数あると上書きされるが、
      //   character が分かっている場面では上の複合キーが優先されるので実害は小さい）
      if (!((' ' + e.ja_card) in idx)) {
        idx[' ' + e.ja_card] = e.effect;
      }
    });
    return idx;
  }

  function lookupEffect(effectsIdx, jaName, character) {
    if (character && effectsIdx[character + ' ' + jaName] !== undefined) {
      return effectsIdx[character + ' ' + jaName];
    }
    if (effectsIdx[' ' + jaName] !== undefined) {
      return effectsIdx[' ' + jaName];
    }
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

  var HEADING_SELECTOR = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    .concat((typeof CZN_SELECTORS !== 'undefined' && CZN_SELECTORS.cardNameExtraSelectors) || [])
    .join(',');

  // block より前（DOM順で手前）にある見出し要素のうち、最も近いものを探す。
  // 親をたどりながら探索範囲を広げていく（見出しはカード名として block の
  // 近くにあるはずなので、狭い範囲から確認する）。
  function findNearestHeading(block) {
    var scope = block;
    for (var depth = 0; depth < 6 && scope; depth++) {
      var candidates;
      try {
        candidates = scope.querySelectorAll(HEADING_SELECTOR);
      } catch (err) {
        candidates = [];
      }
      var best = null;
      candidates.forEach(function (h) {
        if (h === block || block.contains(h)) { return; } // block自身やその子は除外
        var pos = h.compareDocumentPosition(block);
        // eslint-disable-next-line no-bitwise
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
          best = h; // querySelectorAll は文書順なので、最後に見つかったものが最も近い
        }
      });
      if (best) { return best; }
      scope = scope.parentElement;
    }
    return null;
  }

  // "Show Effects" 等のマーカー文字列を含む要素（葉要素優先）を全ページから探す。
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

  // マーカー要素から指定階層だけ親をたどり、説明ブロック（英語効果文 + マーカーを
  // 両方含む要素）を返す。
  function ancestorLevels(el, levels) {
    var cur = el;
    for (var i = 0; i < levels; i++) {
      if (!cur.parentElement) { break; }
      cur = cur.parentElement;
    }
    return cur;
  }

  // ---- フェーズ1: カード名の収集（原文のまま。ここでは一切DOMを書き換えない） ----
  //
  // 用語置換より前にこのフェーズを完全に終わらせることで、見出しが
  // 「Sword Rain(剣の雨)」のような置換後テキストに化けた状態で glossary を
  // 引いてしまう事故を防ぐ。挿入・置換のどちらもまだ行っていない状態で、
  // block（説明ブロック）・nameEl（見出し）・nameText（原文）・entry（glossary
  // 照合結果、無ければ null）だけを集める。

  function collectCardCandidatesByMarker(ctx) {
    var markers = findMarkerElements(CZN_SELECTORS.effectMarkerText || ['Show Effects']);
    log('marker elements found:', markers.length);
    var candidates = [];

    markers.forEach(function (marker) {
      var block = ancestorLevels(marker, CZN_SELECTORS.effectMarkerAncestorLevels || 2);
      if (!block) { return; }

      var nameEl = findNearestHeading(block);
      if (!nameEl) { log('heading not found near marker'); return; }

      var nameText = (nameEl.textContent || '').trim();
      candidates.push({ block: block, nameEl: nameEl, nameText: nameText, entry: ctx.resolved[nameText] || null });
    });

    return candidates;
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
      candidates.push({ block: slot, nameEl: nameEl, nameText: nameText, entry: ctx.resolved[nameText] || null });
    });

    return candidates;
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
  // 最大3件まで持つ。

  function insertEffects(candidates, effectsIdx, charName) {
    var inserted = 0;
    var diagnostics = [];

    candidates.forEach(function (c) {
      if (PROCESSED.has(c.block)) { return; }

      var effect = c.entry ? lookupEffect(effectsIdx, c.entry.ja, c.entry.character || charName) : null;

      if (diagnostics.length < 3) {
        diagnostics.push({ nameText: c.nameText, entry: c.entry, effectFound: !!effect });
      }

      if (!c.entry) { PROCESSED.add(c.block); return; } // glossaryに無いカード名
      if (!effect) { PROCESSED.add(c.block); return; } // 効果文が無いカードには何もしない
      if (c.block.getAttribute('data-czn-effect') === '1') { PROCESSED.add(c.block); return; }

      // 英語の説明文・Show Effects リンクは残したまま、その下に追記する。
      var div = document.createElement('div');
      div.className = 'czn-effect-text-ja';
      div.textContent = effect;
      div.style.cssText =
        'margin-top:4px;padding-top:4px;border-top:1px dashed rgba(120,120,120,0.4);' +
        'white-space:pre-wrap;font-size:0.9em;color:inherit;';
      c.block.appendChild(div);
      c.block.setAttribute('data-czn-effect', '1');
      PROCESSED.add(c.block);
      inserted++;
      log('inserted effect for', c.nameText);
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
        if (frag === null) { frag = document.createDocumentFragment(); }
        if (s > last) { frag.appendChild(document.createTextNode(text.slice(last, s))); }
        var en = m[0];
        var ja = ctx.resolved[en].ja;
        var span = document.createElement('span');
        span.className = REPLACED_CLS;
        span.textContent = keepEn[en] ? en + '(' + ja + ')' : ja;
        span.title = en;
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

    var candidates = collectCardCandidates(ctx);           // 1. カード名（原文）
    var insertResult = insertEffects(candidates, effectsIdx, charName); // 2. 効果文挿入
    var replacedCount = replaceTermsOnPage(ctx);            // 3. 用語置換

    return {
      ctx: ctx,
      insertedCount: insertResult.insertedCount,
      diagnostics: insertResult.diagnostics,
      candidateCount: insertResult.candidateCount,
      replacedCount: replacedCount
    };
  }

  function formatToastMessage(result) {
    if (result.candidateCount === 0 && result.replacedCount === 0) {
      return 'CZN: 対象が見つかりません';
    }

    var lines = ['CZN: ' + result.replacedCount + '件を置換 / ' +
      result.insertedCount + '件の効果文を挿入'];

    if (result.insertedCount === 0) {
      if (result.candidateCount === 0) {
        lines.push('→ カード（Show Effectsを含む説明ブロック）を検出できません');
      } else if (result.diagnostics.length === 0) {
        lines.push('→ ブロックは見つかったが近くの見出しを特定できません');
      } else {
        result.diagnostics.forEach(function (d) {
          var jaPart = d.entry ? '日本語化OK「' + d.entry.ja + '」' : '日本語化NG';
          var effectPart = d.effectFound ? '効果文あり' : '効果文なし';
          lines.push('検出名「' + d.nameText + '」→ ' + jaPart + ' → ' + effectPart);
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
          var freshCandidates = collectCardCandidates(ctx);
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
