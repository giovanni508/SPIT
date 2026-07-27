/* =========================================================================
   Sales Process — comportamenti di pagina
   1. tema  2. menu mobile  3. rivelazione  4. simulatore  5. flusso animato
   ========================================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ── 1. TEMA ─────────────────────────────────────────────────────── */

  var root = document.documentElement;
  var toggle = document.getElementById("themeToggle");
  var storeKey = "sp-theme";

  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set) return set;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function paintToggle() {
    if (!toggle) return;
    var label = toggle.querySelector("[data-theme-label]");
    if (label) label.textContent = currentTheme() === "dark" ? "Chiaro" : "Scuro";
  }

  try {
    var saved = localStorage.getItem(storeKey);
    if (saved === "dark" || saved === "light") root.setAttribute("data-theme", saved);
  } catch (e) { /* storage non disponibile: si resta sulla preferenza di sistema */ }

  paintToggle();

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(storeKey, next); } catch (e) {}
      paintToggle();
      if (pipeline) pipeline.refreshColors();
    });
  }

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    paintToggle();
    if (pipeline) pipeline.refreshColors();
  });

  /* ── 2. MENU MOBILE ──────────────────────────────────────────────── */

  var burger = document.getElementById("burger");
  var mobileNav = document.getElementById("mobileNav");

  if (burger && mobileNav) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      if (!open) window.scrollTo({ top: 0, behavior: "auto" });
      burger.setAttribute("aria-expanded", String(!open));
      burger.setAttribute("aria-label", open ? "Apri il menu" : "Chiudi il menu");
      mobileNav.hidden = open;
      document.body.style.overflow = open ? "" : "hidden";
    });

    mobileNav.addEventListener("click", function (ev) {
      if (ev.target.closest("a")) {
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Apri il menu");
        mobileNav.hidden = true;
        document.body.style.overflow = "";
      }
    });
  }

  /* ── 3. RIVELAZIONE ALLO SCORRIMENTO ─────────────────────────────── */

  var revealTargets = document.querySelectorAll(
    ".band__head, .symptom, .shift, .dept, .step, .sim, .quote, .fit__col, .faq, .close__inner, .fact"
  );

  if (!reduceMotion.matches && "IntersectionObserver" in window) {
    Array.prototype.forEach.call(revealTargets, function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = (i % 4) * 70 + "ms";
    });

    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    Array.prototype.forEach.call(revealTargets, function (el) { revealObs.observe(el); });
  }

  /* ── 4. SIMULATORE ───────────────────────────────────────────────── */

  var euro = new Intl.NumberFormat("it-IT", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0
  });
  var num = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });

  var GAIN_APPT = 1.25;   // ipotesi: +25% appuntamenti utili grazie alla qualifica
  var GAIN_CLOSE = 8;     // ipotesi: +8 punti di chiusura grazie alla formazione

  var sim = {
    appt: document.getElementById("inAppt"),
    close: document.getElementById("inClose"),
    value: document.getElementById("inValue")
  };

  function renderSim() {
    if (!sim.appt || !sim.close || !sim.value) return;

    var appt = Number(sim.appt.value);
    var close = Number(sim.close.value);
    var value = Number(sim.value.value);

    document.getElementById("outAppt").textContent = num.format(appt);
    document.getElementById("outClose").textContent = close + "%";
    document.getElementById("outValue").textContent = euro.format(value);

    var nowCli = appt * (close / 100) * 12;
    var nowRev = nowCli * value;

    var newClose = Math.min(close + GAIN_CLOSE, 85);
    var newCli = appt * GAIN_APPT * (newClose / 100) * 12;
    var newRev = newCli * value;

    document.getElementById("outNow").textContent = euro.format(nowRev);
    document.getElementById("outNew").textContent = euro.format(newRev);
    document.getElementById("outNowCli").textContent = num.format(nowCli);
    document.getElementById("outNewCli").textContent = num.format(newCli);
    document.getElementById("outDelta").textContent = euro.format(newRev - nowRev);

    var top = Math.max(newRev, 1);
    document.getElementById("barNow").style.width = (nowRev / top) * 100 + "%";
    document.getElementById("barNew").style.width = "100%";
  }

  ["appt", "close", "value"].forEach(function (k) {
    if (sim[k]) sim[k].addEventListener("input", renderSim);
  });
  renderSim();

  /* ── 5. FLUSSO ANIMATO ───────────────────────────────────────────── */

  var pipeline = (function () {
    var canvas = document.getElementById("pipelineCanvas");
    if (!canvas || !canvas.getContext) return null;

    var ctx = canvas.getContext("2d");
    var box = canvas.parentElement;

    var W = 0, H = 0, dpr = 1;
    var colors = {};
    var particles = [];
    var counts = [0, 0, 0, 0];
    var painted = [-1, -1, -1, -1];
    var running = false;
    var rafId = null;
    var lastSpawn = 0;
    var lastTime = 0;

    /* tassi di passaggio: contatto → appuntamento → trattativa → cliente */
    var PASS = [0.46, 0.52, 0.34];
    var GATES = [0.28, 0.53, 0.78];

    var stageEls = Array.prototype.slice.call(document.querySelectorAll("[data-stage]"));

    function readColors() {
      var cs = getComputedStyle(document.documentElement);
      colors = {
        ink: cs.getPropertyValue("--ink").trim() || "#0e0d0c",
        dim: cs.getPropertyValue("--ink-dim").trim() || "#6b6560",
        line: cs.getPropertyValue("--line").trim() || "#e4e0db",
        accent: cs.getPropertyValue("--accent").trim() || "#ff5a00"
      };
    }

    function resize() {
      var width = box ? box.clientWidth : canvas.clientWidth;
      if (!width) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = width;
      H = Math.round(width * 0.66);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
      particles.push({
        x: -6,
        y: H * (0.16 + Math.random() * 0.68),
        vx: 95 + Math.random() * 55,
        vy: 0,
        stage: 0,
        alive: true,
        won: false,
        alpha: 1
      });
    }

    function drawGrid() {
      ctx.strokeStyle = colors.dim;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;

      /* filetti verticali: le soglie tra una fase e l'altra */
      for (var i = 0; i < GATES.length; i++) {
        var gx = Math.round(W * GATES[i]) + 0.5;
        ctx.beginPath();
        ctx.moveTo(gx, H * 0.08);
        ctx.lineTo(gx, H * 0.92);
        ctx.stroke();
      }

      /* imbuto: la sezione utile si restringe a ogni soglia */
      ctx.beginPath();
      var pts = [[0, 0.12], [GATES[0], 0.2], [GATES[1], 0.31], [GATES[2], 0.4], [1, 0.44]];
      pts.forEach(function (p, i) {
        var px = p[0] * W, py = p[1] * H;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      for (var j = pts.length - 1; j >= 0; j--) {
        ctx.lineTo(pts[j][0] * W, (1 - pts[j][1]) * H);
      }
      ctx.closePath();
      ctx.fillStyle = colors.dim;
      ctx.globalAlpha = 0.09;
      ctx.fill();
      ctx.globalAlpha = 0.45;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function stageBound(stage) {
      return stage < GATES.length ? W * GATES[stage] : Infinity;
    }

    function step(dt) {
      /* nuovi contatti in ingresso */
      lastSpawn += dt;
      var interval = 0.115;
      while (lastSpawn > interval) {
        lastSpawn -= interval;
        if (particles.length < 220) { spawn(); counts[0]++; }
      }

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];

        if (!p.alive) {
          p.vy += 130 * dt;
          p.y += p.vy * dt;
          p.x += p.vx * 0.35 * dt;
          p.alpha -= dt * 0.9;
          if (p.alpha <= 0 || p.y > H + 20) particles.splice(i, 1);
          continue;
        }

        var bound = stageBound(p.stage);
        var nx = p.x + p.vx * dt;

        if (nx >= bound) {
          if (Math.random() < PASS[p.stage]) {
            p.stage++;
            counts[p.stage]++;
            if (p.stage === 3) p.won = true;
            /* chi passa si ricompatta verso il centro dell'imbuto */
            p.y += (H / 2 - p.y) * 0.35;
            p.vx *= 1.06;
          } else {
            p.alive = false;
            p.vy = -10 + Math.random() * 20;
          }
        }

        p.x = nx;
        if (p.x > W + 12) particles.splice(i, 1);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      drawGrid();

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        ctx.globalAlpha = p.alive ? 1 : Math.max(p.alpha, 0);
        if (p.won) {
          ctx.fillStyle = colors.accent;
          ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        } else {
          ctx.fillStyle = colors.dim;
          ctx.fillRect(p.x - 2.25, p.y - 2.25, 4.5, 4.5);
        }
      }
      ctx.globalAlpha = 1;
    }

    function paintCounts() {
      for (var i = 0; i < stageEls.length; i++) {
        if (painted[i] !== counts[i]) {
          painted[i] = counts[i];
          stageEls[i].textContent = num.format(counts[i]);
        }
      }
    }

    function frame(time) {
      if (!running) return;
      var dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      step(dt);
      draw();
      paintCounts();
      rafId = requestAnimationFrame(frame);
    }

    function staticFrame() {
      /* versione ferma per chi ha ridotto le animazioni */
      ctx.clearRect(0, 0, W, H);
      drawGrid();
      var seeds = 150;
      for (var i = 0; i < seeds; i++) {
        var t = i / seeds;
        var x = t * W;
        var spread = (0.44 - 0.32 * t);
        var y = H * (0.5 + (Math.sin(i * 12.9898) * spread));
        var pass = t < 0.28 ? 1 : t < 0.53 ? 0.46 : t < 0.78 ? 0.24 : 0.08;
        if ((i % 100) / 100 > pass) continue;
        ctx.fillStyle = t > 0.78 ? colors.accent : colors.dim;
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
      counts = [1240, 570, 296, 101];
      paintCounts();
    }

    function start() {
      if (running) return;
      running = true;
      lastTime = performance.now();
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    /* il flusso parte già popolato: un imbuto vuoto non racconta niente */
    function warmUp() {
      for (var i = 0; i < 420; i++) step(1 / 60);
      draw();
      paintCounts();
    }

    readColors();
    resize();

    if (reduceMotion.matches) {
      staticFrame();
    } else if ("IntersectionObserver" in window) {
      warmUp();
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0.05 }).observe(canvas);
    } else {
      start();
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resize();
        if (reduceMotion.matches) staticFrame();
      }, 150);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (!reduceMotion.matches) start();
    });

    return {
      refreshColors: function () {
        readColors();
        if (reduceMotion.matches) staticFrame();
      }
    };
  })();

  /* ── anno corrente nel piè di pagina ─────────────────────────────── */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
