(function () {
// glossary.json の公開URL。他サイト上で実行するため絶対URLで参照する。
// GitHub Pages を docs/ から配信すると docs/ がサイトのルートになるので、
// 公開URLのパスに docs/ は入らない。
var SRC = 'https://yg6ks7mjtv-commits.github.io/czn-glossary/glossary.json';
var CLS = 'czn-replaced';
var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|SELECT|OPTION)$/;
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
    var span = document.createElement('span');
    span.className = CLS;
    span.textContent = map[m[0]];
    span.title = m[0];
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
      if (SKIP.test(p.nodeName) || cls.indexOf(CLS) !== -1) { ok = false; break; }
      p = p.parentNode;
    }
    if (ok) { nodes.push(n); }
  }
  return nodes;
}
function run(data) {
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
  pairs.forEach(function (e) {
    map[e.en] = e.ja;
    alts.push(rxEscape(e.en));
  });
  // 大文字小文字は区別する。Mark や Lead など普通の英単語との誤爆を減らすため
  var re = new RegExp(alts.join('|'), 'g');
  var state = { count: 0 };
  collectTextNodes().forEach(function (node) {
    if (node.parentNode) { replaceIn(node, re, map, state); }
  });
  toast(state.count + ' 件を置換しました');
}
if (!document.body) { return; }
fetch(SRC, { cache: 'no-store' }).then(function (r) {
  if (!r.ok) { throw new Error('HTTP ' + r.status); }
  return r.json();
}).then(run).catch(function (err) {
  toast('用語データを取得できませんでした: ' + err.message, true);
});
})();
