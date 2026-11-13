/* =========================================================================
   site.js — page wiring: hero copy, dot fields, filters, hovers, rail, progress
   Requires js/dots.js. All copy for the hero lives in HERO_STEPS below;
   everything else is plain HTML in index.html.
   ========================================================================= */
(function () {
  'use strict';
  var D = window.Dots;

  /* ---------- the hero: 14 steps, one shape each ----------
     set   : the point set to draw
     theme : index into HERO_THEMES
     r     : [centre x as share of width, centre y as share of height, size as share of height]
     lum   : dot size follows brightness (portraits) · fit: centre the set on its own box
     clusters, blob : draw every `clusters` points as one solid disc of radius `blob` (1000-box units):
                      the 47 clients on the Reach step · rs: dot size × rs (bolder data dots) */
  /* One voice for all 14 steps:
       kicker   "Label · detail" (career steps: "Year · Theme · Organisation")
       headline one sentence, 4–10 words, one serif-italic turn, ends with a full stop
       note     a lower-case handwritten aside, 4–7 words, no full stop: the proof or the wink */
  var HERO_STEPS = [
    { set: 'signature', theme: 0, r: [0.66, 0.5, 0.82], kicker: 'Hello · Johannesburg', pre: '', em: 'Hello,', post: ' human.', note: 'that’s my signature, connecting the dots' },
    { set: 'portrait', theme: 0, r: [0.745, 0.56, 0.9], lum: true, kicker: 'Who · Ismail Dawjee', pre: 'I make ', em: 'useful', post: ' things and put them on the internet.', note: 'not always the best, always iterating' },
    { set: 'business', theme: 3, r: [0.72, 0.5, 0.62], kicker: 'Belief · One thing', pre: 'Model, revenue and customer are ', em: 'one thing', post: '.', note: 'design from the model to the moment' },
    { set: 'pixels', theme: 0, r: [0.72, 0.5, 0.6], kicker: '2009 · Pixels · Design@Bay', pre: 'It started with ', em: 'craft', post: ' in a small studio.', note: 'I kern my lorem ipsum' },
    { set: 'journeys', theme: 0, r: [0.72, 0.5, 0.62], kicker: '2014 · Journeys · IBM', pre: 'I learned to see the ', em: 'person', post: ' beyond the screen.', note: 'Turkish Airlines, Etihad, Etisalat' },
    { set: 'products', theme: 0, r: [0.72, 0.5, 0.6], kicker: '2017 · Products · Nedbank', pre: 'A bank account on USSD, for ', em: 'the masses', post: '.', note: '*120*002#, no smartphone needed' },
    { set: 'platforms', theme: 0, r: [0.72, 0.5, 0.64], kicker: '2020 · Platforms · Nedbank', pre: 'Then I designed the ', em: 'systems', post: ' around the product.', note: 'Avo: 200k+ users, 5k merchants' },
    { set: 'venn3', theme: 0, r: [0.72, 0.5, 0.64], kicker: '2022 · Value-led · Immersion', pre: 'From a resourcing model to a ', em: 'value-led', post: ' one.', note: 'experience design, engineering, growth' },
    { set: 'business', theme: 0, r: [0.72, 0.5, 0.64], kicker: '2025 · Products & AI · Immersion X', pre: 'I wrote the strategy. It became ', em: 'a company', post: '.', note: 'Synergi and Synergi Decoder' },
    { set: 'bulbDraft', theme: 1, r: [0.72, 0.5, 0.74], kicker: 'Process · The draft', pre: '“Here’s my ', em: 'shitty', post: ' first draft.”', note: 'someone has to go first' },
    { set: 'bulbLit', theme: 1, r: [0.72, 0.5, 0.74], kicker: 'Process · The work', pre: 'Then we build, break, fix and ', em: 'test', post: '.', note: 'big things start somewhere small' },
    { set: 'sectors', clusters: 26, blob: 17, rs: 1.5, theme: 0, r: [0.74, 0.5, 0.86], kicker: 'Reach · Depth & spread', pre: '47 organisations, 7 sectors, ', em: '10+ countries', post: '.', note: 'each little cluster is a client' },
    { set: 'family', fit: true, theme: 4, r: [0.73, 0.5, 0.6], kicker: 'Life · Off the clock', pre: 'Husband, father of two, proudly ', em: 'South African', post: '.', note: 'faith, family, books, Barça and AI' },
    { set: 'talk', theme: 2, r: [0.72, 0.5, 0.66], kicker: 'Talk · LinkedIn', pre: 'Let’s make something ', em: 'useful', post: '.', note: 'the long version starts below ↓' }
  ];
  // bg / dot are RGB; ink = caption text; accent = serif word + handwritten note + active dot
  var HERO_THEMES = [
    { bg: [14, 15, 12], dot: [204, 255, 51], ink: '#F1F0EA', accent: '#CCFF33' },   // 0 ink
    { bg: [241, 240, 234], dot: [14, 15, 12], ink: '#0E0F0C', accent: '#3D4BFF' },  // 1 bone
    { bg: [204, 255, 51], dot: [14, 15, 12], ink: '#0E0F0C', accent: '#0E0F0C' },   // 2 acid
    { bg: [61, 75, 255], dot: [204, 255, 51], ink: '#F1F0EA', accent: '#CCFF33' },  // 3 ultramarine
    { bg: [255, 107, 74], dot: [14, 15, 12], ink: '#0E0F0C', accent: '#0E0F0C' }    // 4 coral
  ];

  /* ---------- MONO: the black-and-white look (live) ----------
     On when <html> has class="mono" (index.html). The page is pure black and white; every dot
     visual rests in black or white and warms to acid, ultramarine or coral (mixed) while it moves.
     Hero grounds become black or white. Remove the class to get the colour site back. */
  var ACID = [204, 255, 51], ULTRA = [61, 75, 255], CORAL = [255, 107, 74], BLACK = [0, 0, 0], WHITE = [255, 255, 255];
  var HERO_THEMES_MONO = [
    { bg: BLACK, dot: WHITE, hot: 'mix', ink: '#FFFFFF', accent: '#CCFF33', note: '#FF6B4A' },    // 0 ink   → black
    { bg: WHITE, dot: BLACK, hot: 'mix', ink: '#000000', accent: '#3D4BFF', note: '#3D4BFF' },   // 1 bone  → white
    { bg: WHITE, dot: BLACK, hot: 'mix', ink: '#000000', accent: '#3D4BFF', note: '#3D4BFF' },   // 2 acid  → white
    { bg: WHITE, dot: BLACK, hot: 'mix', ink: '#000000', accent: '#3D4BFF', note: '#3D4BFF' },   // 3 ultra → white
    { bg: BLACK, dot: WHITE, hot: 'mix', ink: '#FFFFFF', accent: '#CCFF33', note: '#FF6B4A' }    // 4 coral → black
  ];
  var HERO_THEMES_COLOUR = HERO_THEMES.map(function (t) { return { bg: t.bg.slice(), dot: t.dot.slice(), hot: null, ink: t.ink, accent: t.accent, note: t.accent }; });
  // every dot field in mono: [selector, resting dot colour, ground, colours it warms to when it moves: all three]
  var MONO_DOTS = [
    ['#sec-belief .dots', '#000000', 'light', 'mix'],
    ['#sec-story .dots', '#FFFFFF', 'dark', 'mix'],
    ['.card[data-cat="Products"] .dots', '#FFFFFF', 'dark', 'mix'],
    ['.card[data-cat="Journeys"] .dots', '#FFFFFF', 'dark', 'mix'],
    ['.card[data-cat="Systems"] .dots', '#FFFFFF', 'dark', 'mix'],
    ['.card[data-cat="Ventures"] .dots', '#FFFFFF', 'dark', 'mix'],
    ['.bulb .dots', '#FFFFFF', 'dark', 'mix'],
    ['.clients-side .dots', '#000000', 'light', 'mix'],
    ['.now-head .dots', '#FFFFFF', 'dark', 'mix'],
    ['.prod .dots', '#000000', 'light', 'mix'],
    ['#sec-life .dots', '#000000', 'light', 'mix'],
    ['#sec-contact .dots', '#FFFFFF', 'dark', 'mix']
  ];
  var mode = 'colour', applyStep = function () {};
  function setMode(m) {
    mode = m === 'mono' ? 'mono' : 'colour';
    document.documentElement.classList.toggle('mono', mode === 'mono');
    var src = mode === 'mono' ? HERO_THEMES_MONO : HERO_THEMES_COLOUR;
    HERO_THEMES.forEach(function (t, k) { t.bg = src[k].bg.slice(); t.dot = src[k].dot.slice(); t.hot = src[k].hot || null; t.ink = src[k].ink; t.accent = src[k].accent; t.note = src[k].note; });
    MONO_DOTS.forEach(function (row) {
      Array.prototype.forEach.call(document.querySelectorAll(row[0]), function (el) {
        if (!el.hasAttribute('data-colour-ink')) { el.setAttribute('data-colour-ink', el.getAttribute('data-ink')); el.setAttribute('data-colour-tone', el.getAttribute('data-tone')); }
        el.setAttribute('data-ink', mode === 'mono' ? row[1] : el.getAttribute('data-colour-ink'));
        el.setAttribute('data-tone', mode === 'mono' ? row[2] : el.getAttribute('data-colour-tone'));
        if (mode === 'mono') el.setAttribute('data-hot', row[3]); else el.removeAttribute('data-hot');
      });
    });
    var hl = document.querySelector('.clients-side .dots');
    if (hl) hl.setAttribute('data-hl-ink', '#FF6B4A');
    if (hero) {   // cross-fade the hero's ground and dots in place, without moving a dot
      hero.fx.set(hero.gx); hero.fy.set(hero.gy); hero.fr.set(hero.gr);
      hero.bgFrom = hero.bg.slice(); hero.dotFrom = hero.dot.slice(); hero.t0 = performance.now();
      applyStep();
    }
  }

  var fields = [];
  var hero = null;
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

  function initHero() {
    var sec = document.getElementById('sec-hello');
    var stage = sec.querySelector('.stage');
    var cap = {
      k: sec.querySelector('.hk'), pre: sec.querySelector('.hp'), em: sec.querySelector('.he'),
      post: sec.querySelector('.hq'), note: sec.querySelector('.hn'), count: sec.querySelector('.hero-count')
    };
    var dotWrap = sec.querySelector('.hero-dots');
    var btns = HERO_STEPS.map(function (st, k) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', 'Go to ' + st.kicker);
      b.addEventListener('click', function (e) { e.stopPropagation(); hero.scrollToStep(k); });
      dotWrap.insertBefore(b, cap.count);
      return b;
    });
    var capEl = sec.querySelector('.hero-cap'), swapT = 0, filled = false;
    if (window.matchMedia('(hover: none)').matches) sec.querySelector('.hint').textContent = 'swipe to play · tap to step · it also plays on its own';
    hero = new D.Hero({
      section: sec, canvas: stage.querySelector('canvas'), caption: capEl, steps: HERO_STEPS, themes: HERO_THEMES,
      onStep: function (i) {
        var st = HERO_STEPS[i];
        var fill = function () { cap.k.textContent = st.kicker; cap.pre.textContent = st.pre; cap.em.textContent = st.em; cap.post.textContent = st.post; cap.note.textContent = st.note; capEl.classList.remove('swap'); };
        // the caption fades out, changes, fades back in while the dots travel
        clearTimeout(swapT);
        if (D.REDUCE || !filled) { filled = true; fill(); } else { capEl.classList.add('swap'); swapT = setTimeout(fill, 220); }
        cap.count.textContent = pad2(i + 1) + ' / ' + pad2(HERO_STEPS.length);
        applyStep = function () {
          var t = HERO_THEMES[HERO_STEPS[i].theme], dark = t.ink === '#0E0F0C' || t.ink === '#000000';
          stage.style.setProperty('--h-ink', t.ink);
          stage.style.setProperty('--h-accent', t.accent);
          stage.style.setProperty('--h-note', t.note || t.accent);
          stage.style.setProperty('--h-soft', dark ? 'rgba(14,15,12,0.3)' : 'rgba(241,240,234,0.35)');
        };
        applyStep();
        btns.forEach(function (b, k) { b.classList.toggle('on', k === i); });
      }
    });
    stage.addEventListener('click', function () { hero.next(); });
    sec.querySelector('.skip').addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      document.getElementById('sec-belief').scrollIntoView({ behavior: D.REDUCE ? 'auto' : 'smooth' });
    });
  }

  function initFields() {
    Array.prototype.forEach.call(document.querySelectorAll('.dots[data-sets]'), function (el) {
      var f = new D.DotField(el);
      el.__field = f;
      fields.push(f);
    });
  }

  /* ---------- 04 projects: filter chips + middle-column stagger ---------- */
  function initWork() {
    var chips = document.querySelectorAll('.chip');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
    var grid = document.querySelector('.cards');
    var filter = 'All';
    function stagger() {
      var cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
      var k = 0;
      cards.forEach(function (c) {
        if (c.hidden) { c.classList.remove('offset'); return; }
        c.classList.toggle('offset', cols === 3 && k % 3 === 1);
        k++;
      });
    }
    Array.prototype.forEach.call(chips, function (ch) {
      ch.addEventListener('click', function () {
        filter = ch.getAttribute('data-filter');
        Array.prototype.forEach.call(chips, function (c) { c.setAttribute('aria-pressed', c === ch ? 'true' : 'false'); });
        cards.forEach(function (c) { c.hidden = !(filter === 'All' || c.getAttribute('data-cat') === filter); });
        stagger();
      });
    });
    window.addEventListener('resize', stagger);
    stagger();
  }

  /* ---------- 05 process: one bulb, rough ↔ lit, hover switches it on ---------- */
  function initBulb() {
    var fig = document.querySelector('.bulb'); if (!fig) return;
    var f = fig.querySelector('.dots').__field, label = fig.querySelector('.label');
    var idx = 0, hover = false;
    function paint() { label.textContent = (hover || idx === 1) ? 'v1.0 · the idea, working' : 'v0.1 · the idea, roughly'; }
    f.onIndex = function (i) { idx = i; paint(); };
    fig.addEventListener('pointerenter', function () { hover = true; f.pin = 1; paint(); });
    fig.addEventListener('pointerleave', function () { hover = false; f.pin = -1; paint(); });
  }

  /* ---------- 06 clients: hover a sector (legend row or any logo) ---------- */
  function initClients() {
    var side = document.querySelector('.clients-side'); if (!side) return;
    var f = side.querySelector('.dots').__field;
    var rows = Array.prototype.slice.call(document.querySelectorAll('.legend li'));
    var logos = document.querySelector('.logos');
    var tiles = Array.prototype.slice.call(logos.querySelectorAll('.logo'));
    function set(k) {
      f.hl = k;
      rows.forEach(function (r, i) { r.classList.toggle('on', i === k); });
      logos.classList.toggle('dim', k >= 0);
      tiles.forEach(function (t) { t.classList.toggle('hl', +t.getAttribute('data-sec') === k); });
    }
    rows.forEach(function (r, i) {
      r.addEventListener('pointerenter', function () { set(i); });
      r.addEventListener('pointerleave', function () { set(-1); });
    });
    tiles.forEach(function (t) {
      var k = +t.getAttribute('data-sec');
      t.addEventListener('pointerenter', function () { set(k); });
      t.addEventListener('pointerleave', function () { set(-1); });
    });
  }

  /* ---------- 08 life: icons cycle, the matching line lights up; hover a line to hold it ---------- */
  function initLife() {
    var sec = document.getElementById('sec-life'); if (!sec) return;
    var f = sec.querySelector('.dots').__field;
    var items = Array.prototype.slice.call(sec.querySelectorAll('.life-list li'));
    f.onIndex = function (i) { items.forEach(function (li, k) { li.classList.toggle('on', k === i); }); };
    items.forEach(function (li, k) {
      li.addEventListener('pointerenter', function () { f.pin = k; });
      li.addEventListener('pointerleave', function () { f.pin = -1; });
    });
  }

  /* ---------- facts lines break only at the dots: each "a · b · c" item stays on one line ---------- */
  function keepItemsTogether() {
    Array.prototype.forEach.call(document.querySelectorAll('.chapter .meta, .card .role, .co .role'), function (el) {
      if (el.children.length || el.textContent.indexOf(' · ') < 0) return;
      var parts = el.textContent.split(' · ');
      el.textContent = '';
      parts.forEach(function (p, i) {
        if (i) el.appendChild(document.createTextNode(' · '));
        var s = document.createElement('span'); s.className = 'nb'; s.textContent = p; el.appendChild(s);
      });
    });
  }

  /* ---------- chapter menu: tablets, phones and any touch screen (the rail needs hover) ---------- */
  var menuLinks = [];
  function initMenu() {
    var btn = document.querySelector('.menu-btn'), menu = document.getElementById('menu'); if (!btn || !menu) return;
    var behind = document.querySelectorAll('main, footer, .cta, .rail');
    menuLinks = Array.prototype.slice.call(menu.querySelectorAll('.menu-list a'));
    var isOpen = function () { return btn.getAttribute('aria-expanded') === 'true'; };
    function set(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close chapters' : 'Chapters');
      document.documentElement.classList.toggle('menu-open', open);
      Array.prototype.forEach.call(behind, function (el) { el.inert = open; });
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(function () { menu.classList.add('on'); });
        (menuLinks[Math.max(0, chapter)] || menuLinks[0]).focus({ preventScroll: true });
      } else {
        menu.classList.remove('on');
        setTimeout(function () { if (!isOpen()) menu.hidden = true; }, D.REDUCE ? 0 : 320);
      }
    }
    btn.addEventListener('click', function () { set(!isOpen()); });
    menuLinks.forEach(function (a, k) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); set(false); btn.focus({ preventScroll: true });
        secs[k].scrollIntoView({ behavior: D.REDUCE ? 'auto' : 'smooth' });
      });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) { set(false); btn.focus(); } });
  }

  /* ---------- page chrome: progress bar + chapter rail ---------- */
  var IDS = ['sec-hello', 'sec-belief', 'sec-story', 'sec-work', 'sec-process', 'sec-clients', 'sec-now', 'sec-life', 'sec-contact'];
  var secs, railBtns, bar, chapter = -1;
  function initChrome() {
    secs = IDS.map(function (id) { return document.getElementById(id); });
    railBtns = Array.prototype.slice.call(document.querySelectorAll('.rail button'));
    bar = document.querySelector('.bar > div');
    railBtns.forEach(function (b, k) {
      b.addEventListener('click', function () { secs[k].scrollIntoView({ behavior: D.REDUCE ? 'auto' : 'smooth' }); });
    });
  }
  function chromeFrame() {
    var h = window.innerHeight, maxS = (document.documentElement.scrollHeight - h) || 1;
    bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, (window.scrollY || 0) / maxS)) + ')';
    var ch = 0, vc = h * 0.5;
    for (var s = 0; s < secs.length; s++) { if (secs[s].getBoundingClientRect().top <= vc) ch = s; }
    if (ch !== chapter) {
      chapter = ch;
      var mark = function (list) { list.forEach(function (b, k) { b.classList.toggle('on', k === ch); if (k === ch) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); }); };
      mark(railBtns); mark(menuLinks);
    }
  }

  /* ---------- one animation loop for everything ---------- */
  function frame(now) {
    requestAnimationFrame(frame);
    hero.draw(now);
    for (var i = 0; i < fields.length; i++) fields[i].draw(now);
    chromeFrame();
  }

  function start() {
    setMode(document.documentElement.classList.contains('mono') ? 'mono' : 'colour');   // before anything draws: no colour flash
    initHero();
    initFields();
    initWork();
    initBulb();
    initClients();
    initLife();
    initChrome();
    initMenu();
    keepItemsTogether();
    D.Points.load('data/points.json').catch(function () { /* dots stay as drifting dust if the file is missing */ });
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
