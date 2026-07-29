/* =========================================================================
   Sales Process — comportamenti di pagina
   1. testata  2. menu  3. marquee  4. video
   Le comparse e l'apertura sono in CSS: nessuna visibilita' dipende dal JS.
   ========================================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ── 1. TESTATA: fondo pieno appena si lascia l'hero ─────────────── */

  var head = document.getElementById("head");

  if (head && "IntersectionObserver" in window) {
    /* la testata diventa piena dopo pochi pixel: sopra l'hero il logo
       finirebbe a sovrapporsi al testo che gli scorre sotto */
    var sentinella = document.createElement("div");
    sentinella.setAttribute("aria-hidden", "true");
    sentinella.style.cssText = "position:absolute;top:0;left:0;width:1px;height:110px;pointer-events:none;";
    document.body.prepend(sentinella);

    new IntersectionObserver(function (entries) {
      head.classList.toggle("is-stuck", !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(sentinella);
  }

  /* ── 2. MENU A TUTTO SCHERMO ─────────────────────────────────────── */

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

  /* ── 3. MARQUEE: duplica i loghi per uno scorrimento continuo ────── */

  var track = document.getElementById("marqueeTrack");

  if (track && !reduce.matches) {
    var copy = track.cloneNode(true);
    Array.prototype.forEach.call(copy.children, function (img) {
      img.setAttribute("aria-hidden", "true");
    });
    while (copy.firstChild) track.appendChild(copy.firstChild);
  }

  /* ── 4. VIDEO: parte solo quando serve, si ferma quando esce ─────── */

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

  document.querySelectorAll("video").forEach(function (v) {
    govern(v, v.hasAttribute("autoplay"));
  });

  document.addEventListener("visibilitychange", function () {
    document.querySelectorAll("video").forEach(function (v) {
      if (document.hidden) v.pause();
    });
  });

  /* ── anno nel piè di pagina ──────────────────────────────────────── */

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
