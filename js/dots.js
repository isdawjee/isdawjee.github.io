/* =========================================================================
   dots.js — the dot engine (no dependencies)
   Two pieces:
     DotField  every small dot visual on the page (one canvas each)
     Hero      the scroll engine at the top (one big canvas, ~7,000 dots)
   Point sets live in data/points.json as flat [x, y, v, x, y, v, …] arrays
   in a 1000×1000 box. v = 0..9 brightness (used only for "luminance" sets).
   All numbers below are the approved values from the design canvas.
   ========================================================================= */
(function (global) {
  'use strict';

  var REDUCE = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var LUM_SETS = { portrait: 1, portrait2: 1, portrait3: 1, bulbLit: 1 };   // dot size follows brightness

  /* ---------- shared pointer (hover repel) ---------- */
  var pointer = null;
  global.addEventListener('pointermove', function (e) { pointer = { x: e.clientX, y: e.clientY }; }, { passive: true });
  global.addEventListener('pointerout', function (e) { if (!e.relatedTarget) pointer = null; }, { passive: true });
  global.addEventListener('pointerup', function (e) { if (e.pointerType === 'touch') pointer = null; }, { passive: true });
  global.addEventListener('pointercancel', function () { pointer = null; }, { passive: true });

  /* ---------- point sets ---------- */
  var Points = { sets: null, meta: null, norms: {}, version: 0 };
  Points.load = function (url) {
    return fetch(url).then(function (r) { return r.json(); }).then(function (d) {
      Points.sets = d.sets; Points.meta = d.sectors; Points.norms = {}; Points.version++;
      return d;
    });
  };
  // Centre a set on its bounding box and scale so its longest side = 1.
  // For 'sectors', also tag each point with its nearest sector centre (for highlight).
  Points.norm = function (name) {
    if (Points.norms[name]) return Points.norms[name];
    var raw = Points.sets && Points.sets[name];
    if (!raw) return null;
    var M = raw.length / 3, minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, j;
    for (j = 0; j < M; j++) { var x0 = raw[j * 3], y0 = raw[j * 3 + 1]; if (x0 < minx) minx = x0; if (x0 > maxx) maxx = x0; if (y0 < miny) miny = y0; if (y0 > maxy) maxy = y0; }
    var span = Math.max(maxx - minx, maxy - miny) || 1, cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
    var x = new Float32Array(M), y = new Float32Array(M), v = new Float32Array(M), g = null;
    for (j = 0; j < M; j++) { x[j] = (raw[j * 3] - cx) / span; y[j] = (raw[j * 3 + 1] - cy) / span; v[j] = raw[j * 3 + 2]; }
    if (name === 'sectors' && Points.meta) {
      g = new Int8Array(M);
      for (j = 0; j < M; j++) {
        var best = 0, bd = 1e12;
        for (var s = 0; s < Points.meta.length; s++) { var dx = raw[j * 3] - Points.meta[s].x, dy = raw[j * 3 + 1] - Points.meta[s].y, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = s; } }
        g[j] = best;
      }
    }
    var o = { x: x, y: y, v: v, g: g, M: M, bw: (maxx - minx) / span || 1, bh: (maxy - miny) / span || 1 };
    Points.norms[name] = o;
    return o;
  };

  /* =======================================================================
     DotField
     Markup: <div class="dots" data-sets="a,b" data-ink="#CCFF33" data-tone="dark"
                  data-pad="0.86" data-period="2600"><canvas></canvas></div>
       data-sets   one name = a still shape; several = it cycles with a staggered morph
       data-ink    dot colour · data-tone dark|light (ground) · data-pad share of the box
       data-period ms per shape when cycling (default 2600)
     Runtime knobs (set from site.js): field.pin = index|-1 (hold a shape on hover),
       field.hl = sector index|-1 (+ data-hl-ink), field.onIndex = fn(i) on shape change.
     Behaviour:
       · builds N = 1.5 × (largest set) particles; extras sit on jittered copies
       · assembles from scatter the first time it is on screen; re-scatters after
         1.5 s off screen so it assembles again next time
       · spring 0.10/frame, wobble ±min(0.6, 0.45·r), repel radius clamp(36, 0.16·min(w,h), 80) px, push 9
       · faint dust: one dot per 2,600 px², 28% alpha, drifting ±3 px
     ======================================================================= */
  function DotField(el) {
    this.el = el;
    this.cv = el.querySelector('canvas');
    if (!this.cv) { this.cv = document.createElement('canvas'); this.cv.setAttribute('aria-hidden', 'true'); el.appendChild(this.cv); }
    this.pin = -1; this.hl = -1; this.onIndex = null;
    this.d = { seen: false, out: 0, pin: -1, gi: -1, D: -1 };
  }
  DotField.prototype.opt = function () {
    var a = this.el.dataset;
    return {
      spec: a.sets || '', ink: a.ink || '#CCFF33', tone: a.tone || 'dark',
      pad: +a.pad || 0.86, period: +a.period || 2600, hlInk: a.hlInk || '#FF6B4A'
    };
  };
  DotField.prototype.build = function (names, w, h, pad, tone, key) {
    var d = this.d;
    var norms = names.map(function (n) { return Points.norm(n); });
    var ok = norms.every(function (o) { return !!o; });
    var Mmax = 0; norms.forEach(function (o) { if (o && o.M > Mmax) Mmax = o.M; });
    var N = ok ? Math.round(Mmax * 1.5) : Math.max(200, Math.min(1400, Math.round(w * h / 140)));
    var cx = w / 2, cy = h / 2, base = Math.max(0.8, Math.min(1.5, Math.min(w, h) * 0.0026));
    var L = names.map(function (n, si) {
      var o = norms[si], tx = new Float32Array(N), ty = new Float32Array(N), tr = new Float32Array(N), k;
      if (!o) { for (k = 0; k < N; k++) { tx[k] = Math.random() * w; ty[k] = Math.random() * h; tr[k] = base * 0.55; } return { tx: tx, ty: ty, tr: tr }; }
      var sc = Math.min(w * pad / o.bw, h * pad / o.bh), lum = !!LUM_SETS[n];
      for (k = 0; k < N; k++) {
        var j = k % o.M, copy = k >= o.M, v = o.v[j];
        var px = cx + o.x[j] * sc, py = cy + o.y[j] * sc;
        if (copy) { var a = Math.random() * 6.283, rr = 0.8 + Math.random() * 2.6; px += Math.cos(a) * rr; py += Math.sin(a) * rr; }
        var rb = lum ? base * (tone === 'dark' ? 0.3 + 0.95 * v / 9 : 0.3 + 0.95 * (9 - v) / 9) : base;
        tx[k] = px; ty[k] = py; tr[k] = copy ? rb * 0.62 : rb;
      }
      return { tx: tx, ty: ty, tr: tr };
    });
    if (!d.xs || d.N !== N) {
      var xs = new Float32Array(N), ys = new Float32Array(N), st = new Float32Array(N);
      for (var q = 0; q < N; q++) {
        if (d.xs && q < d.N) { xs[q] = d.xs[q]; ys[q] = d.ys[q]; } else { xs[q] = Math.random() * w; ys[q] = Math.random() * h; }
        st[q] = Math.random();
      }
      d.xs = xs; d.ys = ys; d.st = st; d.ci = new Uint8Array(N);
    }
    for (var c = 0; c < N; c++) if (d.ci[c] >= names.length) d.ci[c] = 0;
    d.N = N; d.L = L;
    d.grp = null;
    if (names.length === 1 && norms[0] && norms[0].g) { d.grp = new Int8Array(N); for (var gq = 0; gq < N; gq++) d.grp[gq] = norms[0].g[gq % norms[0].M]; }
    var D = Math.round(w * h / 2600);
    if (!d.dx || d.D !== D || d.w !== w || d.h !== h) {
      d.dx = new Float32Array(D); d.dy = new Float32Array(D);
      for (var z = 0; z < D; z++) { d.dx[z] = Math.random() * w; d.dy[z] = Math.random() * h; }
    }
    d.D = D; d.w = w; d.h = h;
    d.rep = Math.max(36, Math.min(80, Math.min(w, h) * 0.16));
    d.wob = Math.min(0.6, base * 0.45);
    d.key = key;
  };
  DotField.prototype.draw = function (now) {
    var el = this.cv, d = this.d, o = this.opt();
    var names = o.spec.split(','), len = names.length, period = o.period;
    var pin = this.pin; if (!(pin >= 0 && pin < len)) pin = -1;
    if (d.pin >= 0 && pin < 0) d.t0 = now - d.pin * period - 1;        // un-hover: carry on from the held shape
    d.pin = pin;
    var gi = 0;
    if (len > 1) gi = pin >= 0 ? pin : (REDUCE || !d.t0 ? 0 : Math.floor((now - d.t0) / period) % len);
    if (gi !== d.gi) { d.gi = gi; d.chg = now; if (typeof this.onIndex === 'function') this.onIndex(gi); }
    var r = el.getBoundingClientRect(), vh = global.innerHeight;
    var vis = r.width > 0 && r.height > 0 && r.bottom > -40 && r.top < vh + 40;
    if (!vis) {
      if (d.seen) { if (!d.out) d.out = now; else if (now - d.out > 1500) { d.seen = false; d.scatter = true; } }
      return;
    }
    d.out = 0;
    var w = el.clientWidth, h = el.clientHeight;
    var dpr = Math.min(2, global.devicePixelRatio || 1);
    if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) { el.width = Math.round(w * dpr); el.height = Math.round(h * dpr); }
    var key = o.spec + '|' + w + 'x' + h + '|' + o.pad + '|' + o.tone + '|' + Points.version;
    if (d.key !== key) this.build(names, w, h, o.pad, o.tone, key);
    var N = d.N, xs = d.xs, ys = d.ys, st = d.st, ci = d.ci, L = d.L, q;
    if (!d.seen) {
      d.seen = true; if (!d.t0 || d.scatter) { d.t0 = now; d.chg = now; }
      if (d.scatter) { for (q = 0; q < N; q++) { xs[q] = Math.random() * w; ys[q] = Math.random() * h; } }
      d.scatter = false;
    }
    var ctx = el.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    var hl = this.hl, grp = d.grp, useHl = hl >= 0 && !!grp;
    var R = d.rep, R2 = R * R, m = null;
    if (pointer) { m = { x: pointer.x - r.left, y: pointer.y - r.top }; if (m.x < -R || m.y < -R || m.x > w + R || m.y > h + R) m = null; }
    var t = now / 1000, still = REDUCE, wob = d.wob, since = now - (d.chg || 0);
    // dust
    ctx.globalAlpha = 0.28; ctx.fillStyle = o.ink;
    for (q = 0; q < d.D; q++) {
      var ux = d.dx[q] + (still ? 0 : Math.sin(t * 0.4 + q) * 3), uy = d.dy[q] + (still ? 0 : Math.cos(t * 0.33 + q * 1.7) * 3);
      if (m) { var ex = ux - m.x, ey = uy - m.y, e2 = ex * ex + ey * ey; if (e2 < R2) { var ed = Math.sqrt(e2) || 1, ef = (R2 - e2) / R2 * 10; ux += ex / ed * ef; uy += ey / ed * ef; } }
      ctx.fillRect(ux - 0.6, uy - 0.6, 1.2, 1.2);
    }
    // shape
    ctx.globalAlpha = 1;
    for (q = 0; q < N; q++) {
      if (len > 1 && ci[q] !== d.gi && (still || since >= st[q] * 420)) ci[q] = d.gi;   // staggered hand-off, up to 420 ms
      var Lq = L[len > 1 ? ci[q] : 0];
      var gx = Lq.tx[q], gy = Lq.ty[q];
      if (!still) { gx += Math.sin(t * 1.3 + q) * wob; gy += Math.cos(t * 1.1 + q * 0.7) * wob; }
      var x = still ? gx : xs[q] + (gx - xs[q]) * 0.1, y = still ? gy : ys[q] + (gy - ys[q]) * 0.1;
      if (m) { var dx = x - m.x, dy = y - m.y, d2 = dx * dx + dy * dy; if (d2 < R2) { var dd = Math.sqrt(d2) || 1, fz = (R2 - d2) / R2 * 9; x += dx / dd * fz; y += dy / dd * fz; } }
      xs[q] = x; ys[q] = y;
      if (useHl && grp[q] === hl) continue;
      var rad = Lq.tr[q];
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // highlighted sector cluster, drawn on top, 1.6× size
    if (useHl) {
      ctx.fillStyle = o.hlInk;
      for (q = 0; q < N; q++) { if (grp[q] !== hl) continue; var rr2 = L[0].tr[q] * 1.6; ctx.fillRect(xs[q] - rr2, ys[q] - rr2, rr2 * 2, rr2 * 2); }
    }
  };

  /* =======================================================================
     Hero — the scroll engine
     · A tall section (steps−1)×60vh + 100vh with a sticky 100svh stage.
     · Scroll picks the step, but the picture never scrubs: when the step changes,
       every dot travels to the new shape in one timed morph (MORPH ms, smoothstep,
       per-dot stagger ek = clamp(e·1.5 − s·0.5)), starting from wherever it was
       heading, so a change of mind mid-morph never jumps.
     · When scrolling stops between two steps, the page glides to one: a nudge of
       more than NUDGE of a step in the direction you were going moves on one step.
     · While the visitor sits at the very top and is idle 4.5 s, it plays itself;
       each step stays up for its reading time (dwell, 4.8–8 s). The first scroll
       re-anchors the page to the step on screen.
     · Click the stage = next step; dot buttons jump to a step.
     · Dots: spring 0.12/frame, wobble ±0.6 px, repel radius √5000 ≈ 71 px, push 9.
     · Background and dot colours cross-fade with the morph.
     · Phones and portrait tablets: shape top-centre, caption below, and the ground
       colour fades in behind the caption so the dots never fight the text.
     ======================================================================= */
  var MORPH = 1100, SETTLE_IDLE = 180, NUDGE = 0.12;
  // Must match the CSS query in site.css: (max-width: 760px), (max-width: 1100px) and (orientation: portrait)
  function narrowStage(w, h) { return w <= 760 || (w <= 1100 && h >= w); }

  function Hero(o) {
    this.sec = o.section; this.cv = o.canvas; this.steps = o.steps; this.themes = o.themes; this.cap = o.caption || null;
    this.onStep = o.onStep || function () {};
    var N = this.N = 7000;
    this.xs = new Float32Array(N); this.ys = new Float32Array(N); this.stag = new Float32Array(N);
    this.fx = new Float32Array(N); this.fy = new Float32Array(N); this.fr = new Float32Array(N);   // where each dot set off from
    this.gx = new Float32Array(N); this.gy = new Float32Array(N); this.gr = new Float32Array(N);   // where it is heading now
    for (var i = 0; i < N; i++) {
      this.xs[i] = this.fx[i] = this.gx[i] = Math.random() * 1440; this.ys[i] = this.fy[i] = this.gy[i] = Math.random() * 900;
      this.fr[i] = this.gr[i] = 0.45; this.stag[i] = Math.random();
    }
    var th = this.themes[this.steps[0].theme];
    this.bg = th.bg.slice(); this.dot = th.dot.slice(); this.bgFrom = th.bg.slice(); this.dotFrom = th.dot.slice();
    this.cache = {}; this.cacheV = -1; this.capR = 0;
    this.step = 0; this.t0 = performance.now() - MORPH; this.shown = -1;
    this.lastInput = -1e9; this.lastScroll = -1e9; this.dir = 0; this.lastY = global.scrollY || 0;
    this.autoOn = false; this.ignoreScroll = false; this.touching = false; this.settle = null;
    this.sec.style.height = ((this.steps.length - 1) * 60 + 100) + 'vh';
    var self = this, cancel = function () { self.settle = null; };
    global.addEventListener('scroll', function () { self.handleScroll(); }, { passive: true });
    global.addEventListener('wheel', cancel, { passive: true });
    global.addEventListener('keydown', cancel);
    global.addEventListener('touchstart', function () { self.touching = true; self.settle = null; }, { passive: true });
    global.addEventListener('touchend', function () { self.touching = false; }, { passive: true });
    global.addEventListener('touchcancel', function () { self.touching = false; }, { passive: true });
  }
  Hero.prototype.geom = function () {
    var r = this.sec.getBoundingClientRect();
    return { top: r.top + (global.scrollY || 0), range: Math.max(1, this.sec.offsetHeight - global.innerHeight) };
  };
  Hero.prototype.handleScroll = function () {
    var y = global.scrollY || 0, now = performance.now();
    if (this.ignoreScroll) { this.ignoreScroll = false; this.lastY = y; return; }
    if (this.autoOn) {
      // the page was playing itself: jump the scroll position to the step on screen so nothing jumps visually
      var g = this.geom(), last = this.steps.length - 1;
      this.autoOn = false;
      var target = g.top + this.step * g.range / last + (y - this.lastY);
      this.lastY = target; this.ignoreScroll = true; global.scrollTo(0, target);
    } else {
      if (y !== this.lastY) this.dir = y > this.lastY ? 1 : -1;
      this.lastY = y;
    }
    this.lastScroll = now;
    if (!this.settle) this.lastInput = now;
  };
  // Start a morph to step k from wherever every dot is heading right now.
  Hero.prototype.go = function (k, now) {
    if (k === this.step) return;
    this.fx.set(this.gx); this.fy.set(this.gy); this.fr.set(this.gr);
    this.bgFrom = this.bg.slice(); this.dotFrom = this.dot.slice();
    this.step = k; this.t0 = now;
  };
  Hero.prototype.scrollToStep = function (k) {
    var g = this.geom(), last = this.steps.length - 1, now = performance.now();
    if (this.autoOn) { this.autoOn = false; this.ignoreScroll = true; global.scrollTo(0, g.top + this.step * g.range / last); }
    this.lastInput = now;
    this.go(k, now);
    var top = g.top + k * g.range / last;
    this.settle = { k: k, y: top, t: now };
    requestAnimationFrame(function () { global.scrollTo({ top: top, behavior: REDUCE ? 'auto' : 'smooth' }); });
  };
  Hero.prototype.next = function () {
    var n = this.step + 1;
    if (n > this.steps.length - 1) { var el = document.getElementById('sec-belief'); if (el) el.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' }); }
    else this.scrollToStep(n);
  };
  // How long a step stays up when the hero plays itself: its reading time.
  Hero.prototype.dwell = function (i) {
    var st = this.steps[i], words = [st.pre, st.em, st.post, st.note].join(' ').split(/\s+/).filter(Boolean).length;
    return Math.max(4800, Math.min(8000, 2000 + words * 280));
  };
  // Where a step's shape sits. Wide: beside the caption (st.r = [cx·w, cy·h, size·h]), kept clear of the
  // right edge and shrunk only when the room right of the caption is tight (landscape tablets).
  // Phones and portrait tablets: top-centre, the caption underneath.
  Hero.prototype.frame = function (st, w, h) {
    if (narrowStage(w, h)) return { size: Math.min(w * 0.88, h * 0.46), cx: w / 2, cy: h * 0.32 };
    var size = Math.min(st.r[2] * h, (w - (this.capR || w * 0.48)) * 1.05);
    return { size: size, cx: Math.min(st.r[0] * w, w - size / 2 - 24), cy: st.r[1] * h };
  };
  Hero.prototype.layout = function (i, w, h) {
    if (this.cacheV !== Points.version) { this.cache = {}; this.cacheV = Points.version; }
    var key = i + '|' + w + 'x' + h + '|' + Math.round(this.capR);
    if (this.cache[key]) return this.cache[key];
    var st = this.steps[i], light = this.themes[st.theme].dot[0] < 100, f = this.frame(st, w, h);
    var out = this.build(st.set, st, light, f.size, f.cx, f.cy, w, h);
    if (Points.sets) this.cache[key] = out;
    return out;
  };
  // Non-"fit" steps place the raw 1000-box set in a size×size square centred at (cx, cy);
  // "fit" steps centre the set on its own bounding box. Leftover dots become dust across the stage.
  Hero.prototype.build = function (name, st, light, size, cx, cy, w, h) {
    var N = this.N, tx = new Float32Array(N), ty = new Float32Array(N), tr = new Float32Array(N);
    var raw = Points.sets && Points.sets[name], M = raw ? raw.length / 3 : 0;
    var nm = st.fit ? Points.norm(name) : null, lum = !!st.lum;
    var s = size / 1000, ox = cx - size / 2, oy = cy - size / 2, limit = M * 2;
    for (var k = 0; k < N; k++) {
      if (M && k < limit) {
        var j = k % M, copy = k >= M, v = raw[j * 3 + 2], px, py;
        if (nm) { px = cx + nm.x[j] * size; py = cy + nm.y[j] * size; } else { px = ox + raw[j * 3] * s; py = oy + raw[j * 3 + 1] * s; }
        if (!copy) { tx[k] = px; ty[k] = py; tr[k] = lum ? (light ? 0.45 + 1.25 * (9 - v) / 9 : 0.45 + 1.25 * v / 9) : 1.25; }
        else { var a = Math.random() * 6.283, rr = 1 + Math.random() * 3.5; tx[k] = px + Math.cos(a) * rr; ty[k] = py + Math.sin(a) * rr; tr[k] = lum ? 0.35 : 0.9; }
      } else { tx[k] = Math.random() * w; ty[k] = Math.random() * h; tr[k] = 0.45; }
    }
    return { tx: tx, ty: ty, tr: tr };
  };
  Hero.prototype.draw = function (now) {
    var cv = this.cv, w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    var steps = this.steps, last = steps.length - 1;
    var cr = cv.getBoundingClientRect(), vis = cr.bottom > 0 && cr.top < global.innerHeight;
    var g = this.geom(), y = global.scrollY || 0;
    var sp = Math.max(0, Math.min(1, (y - g.top) / g.range)) * last;

    // 1 · which step: a glide in progress, autoplay, or the scroll position (with a little hysteresis)
    var S = this.step;
    if (this.settle) {
      S = this.settle.k;
      if (Math.abs(y - this.settle.y) < 2 || now - this.settle.t > 1500) this.settle = null;
    } else if (!this.autoOn && (sp > S + 0.55 || sp < S - 0.55)) S = Math.round(sp);
    // the visitor stopped between two steps: glide to one
    var inside = y > g.top + 1 && y < g.top + g.range - 1;
    if (!REDUCE && !this.autoOn && !this.settle && !this.touching && inside && now - this.lastScroll > SETTLE_IDLE) {
      var off = sp - S, k = S;
      if (Math.abs(off) > NUDGE && (off > 0) === (this.dir > 0)) k = S + (off > 0 ? 1 : -1);
      k = Math.max(0, Math.min(last, k));
      var ty = g.top + k * g.range / last;
      if (Math.abs(ty - y) > 1) { S = k; this.settle = { k: k, y: ty, t: now }; global.scrollTo({ top: ty, behavior: 'smooth' }); }
    }
    // 2 · autoplay: only at the very top, after 4.5 s idle, each step held for its reading time
    var atStart = (y - g.top) < g.range / last * 0.5;
    if (!REDUCE && vis && atStart && !this.settle && now - this.lastInput > 4500 && now - this.t0 > MORPH + this.dwell(this.step)) {
      S = this.step + 1 > last ? 0 : this.step + 1; this.autoOn = S !== 0;
    }
    if (S !== this.step) this.go(S, now);
    if (this.step !== this.shown) { this.shown = this.step; this.onStep(this.step); }
    if (!vis) return;

    // 3 · draw
    var dpr = Math.min(2, global.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var capBox = this.cap ? this.cap.getBoundingClientRect() : null;
    if (capBox) this.capR = capBox.right - cr.left;
    var B = this.layout(this.step, w, h), to = this.themes[steps[this.step].theme];
    var u = REDUCE ? 1 : Math.min(1, (now - this.t0) / MORPH), e = u * u * (3 - 2 * u), c;
    for (c = 0; c < 3; c++) { this.bg[c] = this.bgFrom[c] + (to.bg[c] - this.bgFrom[c]) * e; this.dot[c] = this.dotFrom[c] + (to.dot[c] - this.dotFrom[c]) * e; }
    var bg = Math.round(this.bg[0]) + ',' + Math.round(this.bg[1]) + ',' + Math.round(this.bg[2]);
    ctx.fillStyle = 'rgb(' + bg + ')';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgb(' + Math.round(this.dot[0]) + ',' + Math.round(this.dot[1]) + ',' + Math.round(this.dot[2]) + ')';
    var m = pointer ? { x: pointer.x - cr.left, y: pointer.y - cr.top } : null;
    var t = now / 1000, still = REDUCE, fx = this.fx, fy = this.fy, fr = this.fr;
    for (k = 0; k < this.N; k++) {
      var ek = Math.max(0, Math.min(1, e * 1.5 - this.stag[k] * 0.5));
      var gx = fx[k] + (B.tx[k] - fx[k]) * ek, gy = fy[k] + (B.ty[k] - fy[k]) * ek, r = fr[k] + (B.tr[k] - fr[k]) * ek;
      this.gx[k] = gx; this.gy[k] = gy; this.gr[k] = r;
      if (!still) { gx += Math.sin(t * 1.3 + k) * 0.6; gy += Math.cos(t * 1.1 + k * 0.7) * 0.6; }
      var x = still ? gx : this.xs[k] + (gx - this.xs[k]) * 0.12, yy = still ? gy : this.ys[k] + (gy - this.ys[k]) * 0.12;
      if (m) { var dx = x - m.x, dy = yy - m.y, d2 = dx * dx + dy * dy; if (d2 < 5000) { var d = Math.sqrt(d2) || 1, fz = (5000 - d2) / 5000 * 9; x += dx / d * fz; yy += dy / d * fz; } }
      this.xs[k] = x; this.ys[k] = yy;
      ctx.fillRect(x - r, yy - r, r * 2, r * 2);
    }
    // phones and portrait tablets: let the ground colour fade in behind the caption
    if (capBox && narrowStage(w, h)) {
      var top = capBox.top - cr.top, g0 = Math.max(0, top - 64);
      var grad = ctx.createLinearGradient(0, g0, 0, top + 12);
      grad.addColorStop(0, 'rgba(' + bg + ',0)'); grad.addColorStop(1, 'rgba(' + bg + ',0.88)');
      ctx.fillStyle = grad; ctx.fillRect(0, g0, w, h - g0);
    }
  };

  global.Dots = { Points: Points, DotField: DotField, Hero: Hero, REDUCE: REDUCE };
})(window);
