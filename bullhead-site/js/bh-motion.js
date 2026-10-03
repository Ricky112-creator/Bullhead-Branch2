/* Bullhead motion kit. Carousel: native scroll-snap + dots/arrows/keys. Walk: sticky section that changes place as you scroll. */
(function () {
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function raf(fn) { var w = false; return function () { if (w) return; w = true; requestAnimationFrame(function () { w = false; fn(); }); }; }

  /* ----- carousels ----- */
  Array.prototype.forEach.call(document.querySelectorAll('.bh-car'), function (car) {
    var track = car.querySelector('.bh-car__track'), slides = Array.prototype.slice.call(track.children);
    var dotsBox = car.querySelector('.bh-car__dots'), prev = car.querySelector('[data-prev]'), next = car.querySelector('[data-next]');
    if (!slides.length) return;
    var dots = slides.map(function (_, n) {
      var b = document.createElement('button'); b.type = 'button';
      b.setAttribute('aria-label', 'Photo ' + (n + 1) + ' of ' + slides.length);
      b.addEventListener('click', function () { to(n); });
      dotsBox.appendChild(b); return b;
    });
    var cur = 0;
    function to(n) {
      n = Math.max(0, Math.min(slides.length - 1, n));
      var s = slides[n], left = s.offsetLeft - (track.clientWidth - s.clientWidth) / 2;
      track.scrollTo({ left: left, behavior: still ? 'auto' : 'smooth' });
    }
    var sync = raf(function () {
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0, d = 1e9;
      slides.forEach(function (s, n) { var dd = Math.abs(s.offsetLeft + s.clientWidth / 2 - mid); if (dd < d) { d = dd; best = n; } });
      cur = best;
      dots.forEach(function (b, n) { if (n === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      if (prev) prev.disabled = cur === 0;
      if (next) next.disabled = cur === slides.length - 1;
    });
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    if (prev) prev.addEventListener('click', function () { to(cur - 1); });
    if (next) next.addEventListener('click', function () { to(cur + 1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); to(cur + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); to(cur - 1); }
    });
    sync();
  });

  /* ----- walk in: the photo and the card change together as the section scrolls ----- */
  var walk = document.querySelector('.bh-walk');
  if (!walk || still) return;
  var run = walk.querySelector('.bh-walk__runway'), frame = walk.querySelector('.bh-walk__frame');
  var stops = Array.prototype.slice.call(walk.querySelectorAll('.bh-walk__stop'));
  var dots = Array.prototype.slice.call(walk.querySelectorAll('.bh-walk__dots li'));
  if (!run || !frame || !stops.length) return;
  /* each card carries its own photo; when the section goes live the photos move into the shared frame */
  var pics = stops.map(function (s) { var p = s.querySelector('.bh-walk__pic'); if (p) frame.appendChild(p); return p; });
  walk.classList.add('is-live');
  var on = false, last = 0;
  stops[0].classList.add('is-on'); if (pics[0]) pics[0].classList.add('is-on'); if (dots[0]) dots[0].classList.add('is-on');
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  var tick = raf(draw);
  function draw() {
    if (!on) return;
    var r = run.getBoundingClientRect(), vh = window.innerHeight || 800;
    var p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
    var act = clamp(Math.floor(p * stops.length), 0, stops.length - 1);
    if (act === last) return;
    last = act;
    stops.forEach(function (s, n) { s.classList.toggle('is-on', n === act); });
    pics.forEach(function (q, n) { if (q) q.classList.toggle('is-on', n === act); });
    dots.forEach(function (d, n) { d.classList.toggle('is-on', n === act); });
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) tick(); }, { rootMargin: '20% 0px' }).observe(run); else on = true;
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick);
  tick();
})();
