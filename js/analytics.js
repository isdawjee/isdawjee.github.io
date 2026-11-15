/* =========================================================================
   analytics.js — Google Analytics 4, only after the visitor says "ok".
   Consent: a slim bar on first visit ("no thanks" / "ok"), remembered in
   localStorage. Nothing loads from Google and no cookie is set until "ok".
   The footer button "Analytics settings" brings the bar back to change it.

   Events (Reports → Engagement → Events in GA):
     section_view    a chapter crosses the middle of the screen (once per visit) · section
     hero_step       a hero step is shown for the first time · step, step_label
     project_filter  a filter chip is clicked · filter
     linkedin_click  any LinkedIn link · link_location (cta / menu / contact / footer)
   Anything that happens before "ok" on the same page is held in memory and
   sent once the visitor agrees; on "no thanks" it is dropped.
   ========================================================================= */
(function () {
  'use strict';
  var GA_ID = 'G-C83NPJ2SJS';
  var KEY = 'analytics-consent';   // 'yes' | 'no'

  function getChoice() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setChoice(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode: ask again next visit */ } }

  /* ---------- Google tag: loaded only on consent ---------- */
  var loaded = false, held = [];
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function load() {
    window['ga-disable-' + GA_ID] = false;
    if (loaded) return;
    loaded = true;
    gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
    gtag('js', new Date());
    gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    held.forEach(function (ev) { gtag('event', ev[0], ev[1]); });
    held = [];
  }

  function stop() {
    window['ga-disable-' + GA_ID] = true;
    held = [];
    // remove the GA cookies this site set (_ga, _ga_XXXX)
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name.indexOf('_ga') === 0) {
        document.cookie = name + '=; Max-Age=0; path=/';
        document.cookie = name + '=; Max-Age=0; path=/; domain=' + location.hostname;
      }
    });
  }

  function track(name, params) {
    var choice = getChoice();
    if (loaded && choice === 'yes') gtag('event', name, params || {});
    else if (choice !== 'no' && held.length < 60) held.push([name, params || {}]);
  }

  /* ---------- the consent bar ---------- */
  var bar = null;
  function showBar() {
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'consent';
      bar.setAttribute('role', 'region');
      bar.setAttribute('aria-label', 'Analytics choice');
      bar.innerHTML =
        '<p class="consent-t">I count visits to see what’s useful. <span class="nb">Google Analytics, no ads.</span></p>' +
        '<div class="consent-b">' +
          '<button type="button" class="consent-no">no thanks</button>' +
          '<button type="button" class="consent-ok btn">ok</button>' +
        '</div>';
      bar.querySelector('.consent-ok').addEventListener('click', function () { setChoice('yes'); hideBar(); load(); });
      bar.querySelector('.consent-no').addEventListener('click', function () { setChoice('no'); hideBar(); stop(); });
      document.body.appendChild(bar);
    }
    bar.hidden = false;
    requestAnimationFrame(function () { bar.classList.add('on'); });
  }
  function hideBar() {
    if (!bar) return;
    bar.classList.remove('on');
    setTimeout(function () { if (!bar.classList.contains('on')) bar.hidden = true; }, 300);
  }

  /* ---------- what people look at ---------- */
  function initEvents() {
    // chapters: once each, when the section crosses the middle of the screen
    var seen = {};
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var id = en.target.id;
          if (!en.isIntersecting || seen[id]) return;
          seen[id] = true;
          track('section_view', { section: id.replace('sec-', '') });
        });
      }, { rootMargin: '-50% 0px -50% 0px' });
      Array.prototype.forEach.call(document.querySelectorAll('main > section[id], footer[id]'), function (el) { io.observe(el); });
    }

    // hero steps: site.js writes the kicker into .hk and "03 / 14" into .hero-count on every step
    // only while the hero is on screen: scrolling past it also moves it to the last step
    var heroSec = document.getElementById('sec-hello');
    var hk = document.querySelector('#sec-hello .hk'), count = document.querySelector('#sec-hello .hero-count');
    if (heroSec && hk && count && 'MutationObserver' in window) {
      var steps = {};
      new MutationObserver(function () {
        var n = parseInt(count.textContent, 10), r = heroSec.getBoundingClientRect();
        if (!n || steps[n] || r.bottom < window.innerHeight * 0.5) return;
        steps[n] = true;
        track('hero_step', { step: n, step_label: hk.textContent });
      }).observe(hk, { childList: true, characterData: true, subtree: true });
    }

    document.addEventListener('click', function (e) {
      var chip = e.target.closest && e.target.closest('.chip');
      if (chip) track('project_filter', { filter: chip.getAttribute('data-filter') });
      var a = e.target.closest && e.target.closest('a[href*="linkedin.com"]');
      if (a) {
        var where = a.classList.contains('cta') ? 'cta' : a.closest('#menu') ? 'menu' : a.closest('.elsewhere') ? 'footer' : a.closest('.contact') ? 'contact' : 'page';
        track('linkedin_click', { link_location: where });
      }
    }, true);
  }

  /* ---------- start ---------- */
  var choice = getChoice();
  if (choice === 'yes') load();
  else if (choice !== 'no') showBar();
  initEvents();
  Array.prototype.forEach.call(document.querySelectorAll('.consent-open'), function (b) {
    b.addEventListener('click', showBar);
  });
})();
