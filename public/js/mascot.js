/* =========================================================
   lil' help — the legs.
   A ghost with only its legs visible. They live wherever the
   product used to show a status ring: the presence bar, the
   cursor companion, the menu-bar mark.
   ========================================================= */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  /* Two closed paths: a narrow column swelling into a rounded shoe.
     Drawn white-filled with an ink outline so they read at 20px. */
  var LEG_L = 'M44 24 L44 74 C44 82 40 84 34 86 C24 90 16 97 20 103 ' +
              'C24 108 38 108 48 107 C54 106 57 103 57 97 L57 24 Z';
  var LEG_R = 'M76 24 L76 74 C76 82 80 84 86 86 C96 90 104 97 100 103 ' +
              'C96 108 82 108 72 107 C66 106 63 103 63 97 L63 24 Z';

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  /**
   * Build one mascot. Stroke width scales with the rendered size so the
   * outline stays visible at 20px and doesn't go fat at 200px.
   */
  function build(size) {
    var stroke = size < 28 ? 6 : size < 60 ? 4.6 : 3.4;

    var svg = el('svg', {
      viewBox: '0 0 120 120',
      class: 'legs',
      'aria-hidden': 'true',
      focusable: 'false'
    });
    svg.style.display = 'block';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.overflow = 'visible';

    svg.appendChild(el('ellipse', { class: 'legs-shadow', cx: 60, cy: 111, rx: 34, ry: 4.5 }));

    // motion marks — speed lines, wiggle, pop
    var speed = el('g', { class: 'legs-mark mk-speed' });
    ['M22 52 H4', 'M26 64 H10', 'M20 76 H6'].forEach(function (d) {
      speed.appendChild(el('path', { d: d }));
    });
    svg.appendChild(speed);

    var wiggle = el('g', { class: 'legs-mark mk-wiggle' });
    ['M20 66 c4 -5 8 5 12 0', 'M88 66 c4 -5 8 5 12 0'].forEach(function (d) {
      wiggle.appendChild(el('path', { d: d }));
    });
    svg.appendChild(wiggle);

    var pop = el('g', { class: 'legs-mark mk-pop' });
    ['M24 42 L16 33', 'M18 58 L7 56', 'M96 42 L104 33', 'M102 58 L113 56'].forEach(function (d) {
      pop.appendChild(el('path', { d: d }));
    });
    svg.appendChild(pop);

    // glyphs — ? for thinking, ... for stuck, ! for high stakes
    var q = el('g', { class: 'legs-glyph gl-q' });
    var qt = el('text', { x: 94, y: 36, 'font-size': 34, 'font-weight': 700 });
    qt.setAttribute('font-family', 'Bricolage Grotesque, Helvetica, sans-serif');
    qt.textContent = '?';
    q.appendChild(qt);
    svg.appendChild(q);

    var dots = el('g', { class: 'legs-glyph gl-dots' });
    [46, 60, 74].forEach(function (cx) {
      dots.appendChild(el('circle', { cx: cx, cy: 16, r: 3.6 }));
    });
    svg.appendChild(dots);

    var bang = el('g', { class: 'legs-glyph gl-bang' });
    bang.appendChild(el('rect', { x: 56.4, y: 2, width: 7.2, height: 18, rx: 3.6 }));
    bang.appendChild(el('circle', { cx: 60, cy: 26.5, r: 3.8 }));
    svg.appendChild(bang);

    var body = el('g', { class: 'legs-body' });
    [['legs-l', LEG_L], ['legs-r', LEG_R]].forEach(function (pair) {
      var g = el('g', { class: pair[0] });
      g.appendChild(el('path', { class: 'legs-path', d: pair[1], 'stroke-width': stroke }));
      body.appendChild(g);
    });
    svg.appendChild(body);

    return svg;
  }

  /** Fill every [data-legs] element that hasn't been rendered yet. */
  function renderAll(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll('[data-legs]');
    Array.prototype.forEach.call(nodes, function (node) {
      if (node.dataset.legsReady === '1') return;
      var size = node.clientWidth || parseInt(node.dataset.px, 10) || 24;
      node.innerHTML = '';
      node.appendChild(build(size));
      node.dataset.legsReady = '1';
    });
  }

  global.LilLegs = { render: renderAll, build: build };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { renderAll(); });
  } else {
    renderAll();
  }
})(window);
