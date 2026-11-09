/* =========================================================================
   site.js — page wiring: hero copy, dot fields, filters, hovers, rail, progress
   Requires js/dots.js. All copy for the hero lives in HERO_STEPS below;
   everything else is plain HTML in index.html.
   ========================================================================= */
(function () {
  'use strict';
  var D = window.Dots;

  /* ---------- the hero: 13 steps ----------
     sets  : point set(s) to draw (several = cycle through them, 2.4 s each)
     theme : index into HERO_THEMES
     r     : [centre x as share of width, centre y as share of height, size as share of height]
     lum   : dot size follows brightness (portraits) · fit: centre each icon on its own box */
  var HERO_STEPS = [
    { sets: ['signature'], theme: 0, r: [0.66, 0.5, 0.82], kicker: 'Ismail Dawjee · Johannesburg', pre: '', em: 'Hello,', post: ' human.', note: 'that’s my signature, made of dots' },
    { sets: ['portrait'], theme: 0, r: [0.745, 0.56, 0.9], lum: true, kicker: '01 — Who', pre: 'I make ', em: 'useful', post: ' things and put them on the internet.', note: 'not always the best at it. always making the next one.' },
    { sets: ['business'], theme: 3, r: [0.72, 0.5, 0.62], kicker: '02 — What I believe', pre: 'The model, the money and the customer are ', em: 'one thing', post: '.', note: 'design from the model to the moment' },
    { sets: ['pixels'], theme: 0, r: [0.72, 0.5, 0.6], kicker: '2009 — Pixels', pre: 'It started with ', em: 'craft', post: ' in a small studio in Port Elizabeth.', note: 'I kern my lorem ipsum' },
    { sets: ['journeys'], theme: 0, r: [0.72, 0.5, 0.62], kicker: '2014 — Journeys · IBM', pre: 'I learned to see a customer as a ', em: 'whole day', post: ', not a screen.', note: 'Turkish Airlines, Etihad, Etisalat…' },
    { sets: ['products'], theme: 0, r: [0.72, 0.5, 0.6], kicker: '2017 — Products · Nedbank', pre: 'A bank account on a ', em: 'USSD menu', post: '. 1.4 million people.', note: '*120*002# — no smartphone needed' },
    { sets: ['platforms'], theme: 0, r: [0.72, 0.5, 0.64], kicker: '2020 — Platforms & operating models', pre: 'Then the systems around the product: a ', em: 'super-app', post: ' and a group operating model.', note: 'Avo: 500k+ users, 11k merchants' },
    { sets: ['business'], theme: 0, r: [0.72, 0.5, 0.64], kicker: '2022 — Business models', pre: 'I wrote the strategy. It became ', em: 'a company', post: '.', note: 'Immersion X → Synergi, Decoder' },
    { sets: ['bulbDraft'], theme: 1, r: [0.72, 0.5, 0.74], kicker: '03 — How I work', pre: '“Here’s my ', em: 'shitty', post: ' first draft.”', note: 'someone has to go first' },
    { sets: ['bulbLit'], theme: 1, r: [0.72, 0.5, 0.74], kicker: '03 — How I work', pre: 'Then the team gets precise: build, break, fix, ', em: 'test', post: '.', note: 'the red X still gives me a heart attack' },
    { sets: ['sectors'], theme: 0, r: [0.74, 0.5, 0.86], kicker: '04 — Depth & spread', pre: '49 organisations. 7 sectors. ', em: '15 countries', post: '.', note: 'each little cluster is a client' },
    { sets: ['family', 'kaaba', 'books', 'ball', 'devices', 'transformer'], fit: true, theme: 4, r: [0.73, 0.5, 0.6], kicker: '05 — Off the clock', pre: 'Husband, father of two. Proudly ', em: 'South African', post: '.', note: 'faith, family, books, Barça and AI' },
    { sets: ['signature'], theme: 2, r: [0.74, 0.5, 0.78], kicker: '06 — Let’s talk', pre: 'Let’s make something ', em: 'useful', post: '.', note: 'the long version starts below ↓' }
  ];
  // bg / dot are RGB; ink = caption text; accent = serif word + handwritten note + active dot
  var HERO_THEMES = [
    { bg: [14, 15, 12], dot: [204, 255, 51], ink: '#F1F0EA', accent: '#CCFF33' },   // 0 ink
    { bg: [241, 240, 234], dot: [14, 15, 12], ink: '#0E0F0C', accent: '#3D4BFF' },  // 1 bone
    { bg: [204, 255, 51], dot: [14, 15, 12], ink: '#0E0F0C', accent: '#0E0F0C' },   // 2 acid
    { bg: [61, 75, 255], dot: [204, 255, 51], ink: '#F1F0EA', accent: '#CCFF33' },  // 3 ultramarine
    { bg: [255, 107, 74], dot: [14, 15, 12], ink: '#0E0F0C', accent: '#0E0F0C' }    // 4 coral
  ];

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
    hero = new D.Hero({
      section: sec, canvas: stage.querySelector('canvas'), steps: HERO_STEPS, themes: HERO_THEMES,
      onStep: function (i) {
        var st = HERO_STEPS[i], th = HERO_THEMES[st.theme];
        cap.k.textContent = st.kicker; cap.pre.textContent = st.pre; cap.em.textContent = st.em; cap.post.textContent = st.post; cap.note.textContent = st.note;
        cap.count.textContent = pad2(i + 1) + ' / ' + pad2(HERO_STEPS.length);
        stage.style.setProperty('--h-ink', th.ink);
        stage.style.setProperty('--h-accent', th.accent);
        stage.style.setProperty('--h-soft', th.ink === '#0E0F0C' ? 'rgba(14,15,12,0.3)' : 'rgba(241,240,234,0.35)');
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
    if (ch !== chapter) { chapter = ch; railBtns.forEach(function (b, k) { b.classList.toggle('on', k === ch); if (k === ch) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); }); }
  }

  /* ---------- one animation loop for everything ---------- */
  function frame(now) {
    requestAnimationFrame(frame);
    hero.draw(now);
    for (var i = 0; i < fields.length; i++) fields[i].draw(now);
    chromeFrame();
  }

  function start() {
    initHero();
    initFields();
    initWork();
    initBulb();
    initClients();
    initLife();
    initChrome();
    D.Points.load('data/points.json').catch(function () { /* dots stay as drifting dust if the file is missing */ });
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
