(function () {
// glossary.json の公開URL。他サイト上で実行するため絶対URLで参照する。
// GitHub Pages を docs/ から配信すると docs/ がサイトのルートになるので、
// 公開URLのパスに docs/ は入らない。
var SRC = 'https://yg6ks7mjtv-commits.github.io/czn-glossary/glossary.json';
var EXTRA_LINES_SRC = 'https://yg6ks7mjtv-commits.github.io/czn-glossary/extra-lines.json';
var CLS = 'czn-replaced';
var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|SELECT|OPTION)$/;
// 一般名詞としても使われる語。日本語だけに置き換えると、その置換が正しいのか
// 読み手が判断できなくなるので、Mark(標識) のように英語を残す。
// 完全一致だけが対象。Critical Damage のような複合語は用語であることが明らかなので
// 通常どおり日本語だけに置き換える。
var KEEP_EN = ['Mark', 'Lead', 'Remove', 'Wave', 'Partner',
               'Break', 'Save', 'Damage', 'Shield', 'Heal',
               // キャラ固有カード名のうち、一般的な英語表現としても成立する語。
               // 2026-08-06 のキャラカード追加作業で判定。迷ったものは残す側に倒した。
               'Sound Check', 'Fan Service', 'Spotlight', 'Call & Response',
               'Encore', 'Photo Time', 'Photo Card', 'Rhythm', 'Performance Buzz',
               'Rapid Fire', 'Handgun Bullet', 'Single Shot',
               'Ionization', 'Draw & Release', 'Big Game Ranger', 'Zero In',
               'Matrix Overlay', 'Multishot', 'Bowguard', 'Homing Arrow',
               'Descent', 'Melancholy', 'Night Rain', 'Solo Dance',
               'Once Upon a Time', 'Blessing', 'Protect Us', 'Garden of Secrets',
               'Gather Round', 'Happy Ending',
               'Sword Rain', 'Linked', 'Hero to All', 'Sword Flash', 'Sword Barrier',
               'Resonance', 'Repose', 'Heart Shaker', 'With All My Heart!',
               'Liberated Feelings', 'Radiant Smile', 'Heart Bullet',
               'Blooming Love', 'Disruption Fire', 'Protect Me',
               'Chronicle', 'Time Paradox', 'Time Acceleration', 'Rewind',
               'Archetype', 'Creation and Destruction', 'Event Horizon',
               'Barrier Deployment', 'Matter Disintegration',
               'Hew', 'Honed Edge', 'Fighting Spirit', 'Slash',
               // 2026-08-06 バッチ2（Sereniel〜Magna）分。同じ基準で判定。
               'Homing Laser', 'Afterglow', 'Plasma Missile', 'Shining Core',
               'Pulse Fire', 'Death Halo', 'Magnetic Field',
               "Will-O'-Wisp", 'Shadow of the Moon', 'Cursed Shackles', 'Bind',
               'Twilight',
               'Inspiration', 'Longsword Slash', 'Trickery Strike',
               'Freezing Blade', 'Flowing Parry',
               'Power Charge', 'Charge Energy', 'Quick Lift', 'Power Strike',
               'Ballista', 'Firing Preparation',
               'Absolute Protection', 'Upward Slash',
               'Counterattack', 'Absolute Zero', 'Frost Shield', 'Ice Wall',
               'Ice Fragment', 'Frozen Fist', 'Frost Charge',
               'Enhanced Counterattack', 'Crystallization',
               // 2026-08-06 バッチ3（Narja〜Tressa）分。同じ基準で判定。
               // Card / Curse / Joker / Rapier など単体でも高リスクな一般語を含む。
               'Mealtime', 'Defense System', 'Futility', 'Black Hole',
               'Launcher', 'Barrier', 'Guilty Pleasure', 'Wind Slash',
               'Dark Blade', 'Material Regeneration', 'Tactical Maneuver',
               'Machine Gun', 'Extended Magazine', 'Flamethrower', 'Flashbang',
               'Joker', 'Shuffle', 'Wild Card', 'Card', 'Mana Field',
               'Elasticity', 'Adagio', 'Rock & Roll', 'Tactical Analysis',
               'Whirlpool', 'Deluge', 'Rapier', 'Curse'];
var keepEn = Object.create(null);
KEEP_EN.forEach(function (w) { keepEn[w] = true; });
// 色は rgb() で書く。# はURLのフラグメント区切りなので javascript: URL 内で切れる。
var HL_STYLE = 'background:rgb(255,240,150);border-radius:3px;padding:0 1px;';
var TOAST_BASE = 'position:fixed;left:12px;right:12px;bottom:20px;z-index:2147483647;'
  + 'text-align:center;padding:10px 14px;border-radius:8px;'
  + 'font:14px/1.5 -apple-system,BlinkMacSystemFont,sans-serif;color:rgb(255,255,255);'
  + 'box-shadow:0 2px 12px rgba(0,0,0,0.35);background:';
function toast(msg, bad) {
  var d = document.createElement('div');
  d.textContent = msg;
  d.style.cssText = TOAST_BASE + (bad ? 'rgb(176,42,34)' : 'rgb(28,106,64)');
  document.body.appendChild(d);
  setTimeout(function () {
    if (d.parentNode) { d.parentNode.removeChild(d); }
  }, 4000);
}
// 用語に ( ) などが含まれるため、正規表現に入れる前にエスケープする
function rxEscape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
// charAt は範囲外で '' を返すので、文字列の端は自動的に非単語文字になる
function isWordChar(c) {
  return /[A-Za-z0-9]/.test(c);
}
function replaceIn(node, re, map, state) {
  var text = node.nodeValue;
  var frag = null;
  var last = 0;
  var m;
  re.lastIndex = 0;
  while ((m = re.exec(text)) !== null) {
    var s = m.index;
    var e = s + m[0].length;
    // 前後が英数字なら語の一部。Marker の Mark などを弾く
    if (isWordChar(text.charAt(s - 1)) || isWordChar(text.charAt(e))) { continue; }
    if (frag === null) { frag = document.createDocumentFragment(); }
    if (s > last) { frag.appendChild(document.createTextNode(text.slice(last, s))); }
    var en = m[0];
    var ja = map[en];
    var span = document.createElement('span');
    span.className = CLS;
    span.textContent = keepEn[en] ? en + '(' + ja + ')' : ja;
    span.title = en;
    span.style.cssText = HL_STYLE;
    frag.appendChild(span);
    last = e;
    state.count = state.count + 1;
  }
  if (frag !== null) {
    if (last < text.length) { frag.appendChild(document.createTextNode(text.slice(last))); }
    node.parentNode.replaceChild(frag, node);
  }
}
// 文書全体を対象にした用語置換。data-czn-done="1" が付いた要素の内側
// （カード名・カード内容域として個別処理済みの部分）は対象から除外する。
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
      if (SKIP.test(p.nodeName) || cls.indexOf(CLS) !== -1 ||
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
// 指定した1要素の内側だけを対象にした版。カード内容域（.chaos-content の
// 最初の子要素）に用語置換を適用するときに使う。
function collectTextNodesIn(root) {
  var nodes = [];
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  var n;
  while ((n = walker.nextNode()) !== null) {
    if (n.nodeValue === '') { continue; }
    var p = n.parentNode;
    var ok = true;
    while (p && p.nodeType === 1 && p !== root.parentNode) {
      var cls = p.className ? String(p.className) : '';
      if (SKIP.test(p.nodeName) || cls.indexOf(CLS) !== -1) { ok = false; break; }
      p = p.parentNode;
    }
    if (ok) { nodes.push(n); }
  }
  return nodes;
}
function replaceTermsIn(root, re, map, state) {
  collectTextNodesIn(root).forEach(function (node) {
    if (node.parentNode) { replaceIn(node, re, map, state); }
  });
}

// ---- カード名の検出とレベル判定 ----
// 拡張機能（extension/content.js）と同じ確定セレクタ方式。実際のDOM構造:
//   .chaos-card-inside … 1枚のカード
//     img[alt]          … カード名（レベル表記付き）
//     .chaos-header      … カード名の表示先（コスト数字・種別表示も同居）
//     .chaos-content     … カードの効果文（ブックマークレットは効果文の
//                           全文翻訳は行わない。非公開データが必要なため。
//                           用語単位の置換だけをこの中に適用する）

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

// ヒラメキ段階を表すカード名末尾のローマ数字。I〜Vの5段階のみ。
var ROMAN_LEVELS = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
var ROMAN_BY_LEVEL = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };
function stripRomanLevel(text) {
  var idx = text.lastIndexOf(' ');
  if (idx === -1) { return { base: text, level: 0 }; }
  var last = text.slice(idx + 1);
  if (Object.prototype.hasOwnProperty.call(ROMAN_LEVELS, last)) {
    return { base: text.slice(0, idx), level: ROMAN_LEVELS[last] };
  }
  return { base: text, level: 0 };
}

// カードごとのレベル別固有名対応表。extension/selectors.js の
// cardLevelNames と同じ内容。ブックマークレットは1ファイルで完結させる
// 必要があり別ファイルを参照できないため、ここに複製している。
// 片方を更新したらもう片方も合わせること。
// 対応が取れなかったもの（未登録・要根拠確認）:
//   - Hilde「Homing Arrow (Fracture)」「Homing Arrow (Grand)」
//   - Chizuru「Moonslash (Gen)」
var CARD_LEVEL_NAMES = {
  Nine: {
    Hew: { Ironclad: 1, Extreme: 2, Flash: 3, Massacre: 4, Ambush: 5 }
  }
};
// stripRomanLevel を拡張し、星（"Softie ★★" -> level 2）と、
// CARD_LEVEL_NAMES に事前登録された括弧付き固有名（"Hew (Ironclad)" ->
// level 1）にも対応する。未登録の括弧付き名（同名カードのキャラ識別用の
// 括弧等）はレベルとして扱わず、テキスト全体を base のまま level 0 で返す
// （無理に推測しないため。glossaryの英語名と一致せず処理対象外になる）。
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
    var charMap = characterName ? CARD_LEVEL_NAMES[characterName] : null;
    var cardMap = charMap ? charMap[base] : null;
    var level = cardMap && Object.prototype.hasOwnProperty.call(cardMap, name) ? cardMap[name] : 0;
    if (level > 0) {
      return { base: base, level: level, suffixType: 'paren', suffixText: '(' + name + ')' };
    }
  }
  return { base: text, level: 0, suffixType: 'none', suffixText: null };
}

function hasExcludedSuffix(text) {
  return text.charAt(text.length - 1) === ':';
}

// scope 内の葉要素で、（レベル表記を除いたベース名が）knownEnNames と
// 完全一致するものを探す。複数見つかったときは、DOM順の走査位置が
// excludeRoot に最も近い候補を優先する。
function findGlossaryNameLeaf(scope, excludeRoot, knownEnNames, characterName) {
  var walker = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT);
  var node;
  var index = 0;
  var excludeIndex = -1;
  var matches = [];
  while ((node = walker.nextNode())) {
    if (node === excludeRoot) { excludeIndex = index; }
    if (node.children.length > 0) { index++; continue; }
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

// en -> { ja, character } の解決表を作る。character が分かっていれば
// そのキャラのエントリを優先する（同名カードが複数キャラに存在する場合の
// 取り違え防止。例: Rapid Fire = Luke「速射弾」/ Veronica「連続撃発」）。
function buildResolved(pairs, charName) {
  var byEn = Object.create(null);
  pairs.forEach(function (e) {
    if (!byEn[e.en]) { byEn[e.en] = []; }
    byEn[e.en].push(e);
  });
  var resolved = Object.create(null);
  Object.keys(byEn).forEach(function (en) {
    var candidates = byEn[en];
    var chosen = null;
    if (charName) {
      chosen = candidates.filter(function (c) { return c.character === charName; })[0];
    }
    if (!chosen) { chosen = candidates[0]; }
    resolved[en] = { ja: chosen.ja, character: chosen.character || null };
  });
  return resolved;
}

// .chaos-card-inside ごとにカード名を検出し、日本語のみで書き換える
// （英語併記はしない。この点が一般の用語置換と異なる。すでにキャラと
// カード名が確定しているため、英語を残す必要が無い）。
// 戻り値: 各カードの { cardEl, contentEl }（内容域の用語置換に使う）と、
// 検出・書き換えの件数。
function collectAndRewriteCardNames(resolved, characterName) {
  var knownEnNames = new Set(Object.keys(resolved));
  var cards = Array.prototype.slice.call(document.querySelectorAll('.chaos-card-inside'));
  var cardInfos = [];
  var detectedCount = 0;
  var rewrittenCount = 0;

  cards.forEach(function (cardEl) {
    var contentEl = cardEl.querySelector('.chaos-content');
    cardInfos.push({ cardEl: cardEl, contentEl: contentEl });

    var img = cardEl.querySelector('img[alt]');
    var rawNameText = img && img.alt ? img.alt.trim() : '';
    if (!rawNameText) { return; }

    var parsed = stripLevelSuffix(rawNameText, characterName);
    var entry = resolved[parsed.base] || null;
    var headerEl = cardEl.querySelector('.chaos-header');
    if (!entry || !headerEl) { return; }
    detectedCount++;

    var nameEl = findGlossaryNameLeaf(headerEl, null, knownEnNames, characterName);
    if (!nameEl) { return; }
    if (nameEl.getAttribute('data-czn-done') === '1') { return; }

    if (!nameEl.hasAttribute('data-czn-orig-name')) {
      nameEl.setAttribute('data-czn-orig-name', (nameEl.textContent || '').trim());
    }
    var jaName = entry.ja;
    if (parsed.level > 0) {
      if (parsed.suffixType === 'star' || parsed.suffixType === 'paren') {
        jaName += ' ' + parsed.suffixText;
      } else if (ROMAN_BY_LEVEL[parsed.level]) {
        jaName += ' ' + ROMAN_BY_LEVEL[parsed.level];
      }
    }
    nameEl.textContent = jaName;
    nameEl.setAttribute('data-czn-done', '1');
    rewrittenCount++;
  });

  return {
    cardInfos: cardInfos,
    attemptedCount: cards.length,
    detectedCount: detectedCount,
    rewrittenCount: rewrittenCount
  };
}

// ---- カード内容域（.chaos-content の最初の子要素）への用語置換 ----
// .chaos-content 直下は子要素に分かれており、最初の子要素が基本効果、
// 2つ目以降は神ヒラメキ等の追加行（拡張機能での調査で判明済み）。用語置換も
// 最初の子要素だけを対象にし、2つ目以降には触れない。
//
// ページ側の再描画でこの中の置換結果が失われることがあるため、書き換えた
// 要素ごとに個別の MutationObserver を設置し、置換の跡（.czn-replaced の
// span）が消えていたら書き直す（拡張機能の watchEffectScope と同じ設計）。
// 自分の書き込みで再発火しないよう、書き直す前に監視を止め、書き直した後に
// 再度監視する。同一要素への書き直しは最大 WATCH_MAX_RETRIES 回まで。
var WATCH_MAX_RETRIES = 10;
function watchContentTarget(target, re, map) {
  var retries = 0;
  var mo = new MutationObserver(function () {
    // 置換済みの跡（.czn-replaced のspan）がまだ残っているなら何もしない
    if (target.querySelector('.' + CLS)) { return; }
    retries++;
    if (retries > WATCH_MAX_RETRIES) { mo.disconnect(); return; }
    mo.disconnect();
    var state = { count: 0 };
    replaceTermsIn(target, re, map, state);
    mo.observe(target, { childList: true, subtree: true, characterData: true });
  });
  mo.observe(target, { childList: true, subtree: true, characterData: true });
}

function processContentAreas(cardInfos, re, map) {
  var count = 0;
  cardInfos.forEach(function (info) {
    var contentEl = info.contentEl;
    if (!contentEl) { return; }
    var target = (contentEl.children && contentEl.children.length > 0)
      ? contentEl.children[0] : contentEl;
    if (target.getAttribute('data-czn-done') === '1') { return; }

    var state = { count: 0 };
    replaceTermsIn(target, re, map, state);
    target.setAttribute('data-czn-done', '1');
    count += state.count;
    if (state.count > 0) { watchContentTarget(target, re, map); }
  });
  return count;
}

// ---- 神ヒラメキ等の追加行の日本語化（用語置換・カード名書き換えとは別処理） ----
// .chaos-content 直下には、基本効果（最初の子要素。processContentAreas が
// 用語単位で扱う）とは別に、classに"divine"を含む要素として神ヒラメキ
// ボーナス行が存在することがある。これらはキャラ固有ではなく共通の定型文が
// 少数（docs/extra-lines.json）だけなので、全文をそのまま対訳表と照合して
// 置き換える（用語の部分置換ではなく全文一致）。
function normalizeExtraLineText(text) {
  return text.split('\n').map(function (line) {
    return line.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
  }).join('\n').trim();
}
function buildExtraLineMatcher(enTemplate) {
  var escaped = rxEscape(normalizeExtraLineText(enTemplate));
  var pattern = escaped.replace(/\\\{N\\\}/g, '(\\d+(?:\\.\\d+)?%?)');
  return new RegExp('^' + pattern + '$');
}
// <br>を改行として扱う（textContentは<br>を無視して連結してしまうため）。
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
// confirmed のみを対象にする（用語置換のconfirmedのみ基準と同じ）
function buildExtraLineList(data) {
  return (data.entries || [])
    .filter(function (e) { return e.confidence === 'confirmed' && e.en && e.ja; })
    .map(function (e) { return { en: e.en, ja: e.ja, re: buildExtraLineMatcher(e.en) }; });
}
function insertDivineLines(cardInfos, extraLines) {
  var inserted = 0;
  if (!extraLines || extraLines.length === 0) { return 0; }
  cardInfos.forEach(function (info) {
    var contentEl = info.contentEl;
    if (!contentEl || !contentEl.querySelectorAll) { return; }
    var divineEls = contentEl.querySelectorAll('[class*="divine"]');
    for (var i = 0; i < divineEls.length; i++) {
      var el = divineEls[i];
      if (!document.body.contains(el)) { continue; }
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
      if (jaText === null) { continue; }
      el.textContent = jaText;
      el.setAttribute('data-czn-divine-done', '1');
      el.setAttribute('data-czn-divine-ja', jaText);
      inserted++;
    }
  });
  return inserted;
}

function run(data, showToast, extraLines) {
  // confirmed だけを使う。guess と unmatched は無視する
  var pairs = (data.entries || []).filter(function (e) {
    return e.confidence === 'confirmed' && e.en && e.ja;
  });
  // 長い語を先に並べる。正規表現の | は先に書いた枝を優先するので、
  // Retain Shield が Retain より先に一致する
  pairs.sort(function (a, b) { return b.en.length - a.en.length; });
  if (pairs.length === 0) { toast('confirmed の用語が見つかりませんでした', true); return; }
  var map = Object.create(null);
  var alts = [];
  // 同じ en が character 違いで複数登録され ja が食い違う場合、どちらの ja かは
  // ページ上の文脈からは判別できない。誤った日本語だけを表示しないよう、
  // そのような en は動的に keepEn 扱いにする（表示は最初に出てきた ja を使う）。
  var jaByEn = Object.create(null);
  pairs.forEach(function (e) {
    if (!jaByEn[e.en]) { jaByEn[e.en] = Object.create(null); }
    jaByEn[e.en][e.ja] = true;
  });
  Object.keys(jaByEn).forEach(function (en) {
    if (Object.keys(jaByEn[en]).length > 1) { keepEn[en] = true; }
  });
  pairs.forEach(function (e) {
    if (e.en in map) { return; }
    map[e.en] = e.ja;
    alts.push(rxEscape(e.en));
  });
  // 大文字小文字は区別する。Mark や Lead など普通の英単語との誤爆を減らすため
  var re = new RegExp(alts.join('|'), 'g');

  var charName = currentCharacter();
  var resolved = buildResolved(pairs, charName);
  var cardResult = collectAndRewriteCardNames(resolved, charName);
  var divineCount = insertDivineLines(cardResult.cardInfos, extraLines || []);
  var contentCount = processContentAreas(cardResult.cardInfos, re, map);

  var state = { count: 0 };
  collectTextNodes().forEach(function (node) {
    if (node.parentNode) { replaceIn(node, re, map, state); }
  });

  // トーストは初回タップ時だけ出す。以後のMutationObserverによる
  // 再スキャンは画面のちらつき防止のため無言で行う。
  if (showToast) {
    var total = state.count + contentCount;
    toast(total + ' 件を置換しました（カード名' + cardResult.rewrittenCount + '件 / 追加行' + divineCount + '件）');
  }
}

if (!document.body) { return; }
var fetchGlossaryData = fetch(SRC, { cache: 'no-store' }).then(function (r) {
  if (!r.ok) { throw new Error('HTTP ' + r.status); }
  return r.json();
});
// extra-lines.json の取得失敗は致命的にせず、空リストにフォールバックする
// （神ヒラメキ行の日本語化だけが無効になり、用語置換・カード名は通常通り動く）。
var fetchExtraLinesData = fetch(EXTRA_LINES_SRC, { cache: 'no-store' }).then(function (r) {
  if (!r.ok) { throw new Error('HTTP ' + r.status); }
  return r.json();
}).catch(function () {
  return { entries: [] };
});
Promise.all([fetchGlossaryData, fetchExtraLinesData]).then(function (results) {
  var data = results[0];
  var extraLines = buildExtraLineList(results[1]);
  run(data, true, extraLines);
  // SPA側の再描画でDOMが差し替わっても追従できるよう、以後も監視する
  // （拡張機能と同じ設計。連続発火を間引きつつ再実行する）。
  var pending = false;
  var observer = new MutationObserver(function () {
    if (pending) { return; }
    pending = true;
    setTimeout(function () {
      pending = false;
      run(data, false, extraLines);
    }, 500);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}).catch(function (err) {
  toast('用語データを取得できませんでした: ' + err.message, true);
});
})();
