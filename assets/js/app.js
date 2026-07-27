/* =========================================================================
   Sales Process — comportamenti di pagina
   1. avvio  2. testata  3. menu  4. comparse  5. marquee  6. video
   ========================================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var root = document.documentElement;

  /* ── 1. AVVIO: sblocca la sequenza di apertura dell'hero ─────────── */

  requestAnimationFrame(function () {
    requestAnimationFrame(function () { root.classList.add("is-ready"); });
  });

  /* ── 2. TESTATA: fondo pieno appena si lascia l'hero ─────────────── */

  var head = document.getElementById("head");

  if (head && "IntersectionObserver" in window) {
    var sentinel = document.createElement("div");
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:90vh;pointer-events:none;";
    document.body.prepend(sentinel);

    new IntersectionObserver(function (entries) {
      head.classList.toggle("is-stuck", !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(sentinel);
  }

  /* ── 3. MENU A TUTTO SCHERMO ─────────────────────────────────────── */

  var menuBtn = document.getElementById("menuBtn");
  var menu = document.getElementById("menu");

  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    document.body.classList.toggle("is-locked", open);
    if (open) {
      var first = menu.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    } else {
      menuBtn.focus({ preventScroll: true });
    }
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", function (ev) {
      if (ev.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") setMenu(false);
    });
  }

  /* ── 4. COMPARSE ALLO SCORRIMENTO ────────────────────────────────── */

  var risers = document.querySelectorAll(
    ".dept__head, .row, .goal__inner, .voices__head, .voice, .method__inner, .team__inner, .foot__pitch, .foot__col, .clients__lab"
  );

  if (!reduce.matches && "IntersectionObserver" in window) {
    Array.prototype.forEach.call(risers, function (el, i) {
      el.classList.add("rise");
      el.style.transitionDelay = (i % 3) * 90 + "ms";
    });

    var riseObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        riseObs.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.06 });

    Array.prototype.forEach.call(risers, function (el) { riseObs.observe(el); });
  }

  /* ── 5. MARQUEE: duplica i loghi per uno scorrimento continuo ────── */

  var track = document.getElementById("marqueeTrack");

  if (track && !reduce.matches) {
    var copy = track.cloneNode(true);
    Array.prototype.forEach.call(copy.children, function (img) {
      img.setAttribute("aria-hidden", "true");
    });
    while (copy.firstChild) track.appendChild(copy.firstChild);
  }

  /* ── 6. VIDEO: parte solo quando serve, si ferma quando esce ─────── */

  function govern(video, autoplay) {
    if (!video) return;

    if (reduce.matches) {
      video.removeAttribute("autoplay");
      video.pause();
      return;
    }

    if (!("IntersectionObserver" in window)) {
      if (autoplay) video.play().catch(function () {});
      return;
    }

    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        if (video.preload === "none") video.preload = "auto";
        video.play().catch(function () {});
      } else {
        video.pause();
      }
    }, { threshold: 0.15 }).observe(video);
  }

  govern(document.getElementById("heroVideo"), true);
  govern(document.getElementById("methodVideo"), false);

  document.addEventListener("visibilitychange", function () {
    document.querySelectorAll("video").forEach(function (v) {
      if (document.hidden) v.pause();
    });
  });

  /* ── anno nel piè di pagina ──────────────────────────────────────── */

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
