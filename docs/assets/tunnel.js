/* Aeromagija — wind-tunnel test section.
   Smoke tracers advected through the exact potential flow around a Joukowski wing
   section with Kutta circulation. Pointer height sets the angle of attack. */
(() => {
  "use strict";
  document.documentElement.classList.add("js");

  /* ---------- darkroom: photographs develop once ---------- */
  const plates = document.querySelectorAll(".develop");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) { e.target.classList.add("is-developed"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -18% 0px", threshold: 0.2 });
    plates.forEach((p) => io.observe(p));
  } else plates.forEach((p) => p.classList.add("is-developed"));

  /* ---------- tunnel ---------- */
  const hero = document.querySelector(".tunnel");
  const cv = document.querySelector(".tunnel__flow");
  if (!hero || !cv || !cv.getContext) return;
  const ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gA = document.querySelector("[data-aoa]");
  const gC = document.querySelector("[data-cl]");

  // complex helpers [re, im]
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const div = (a, b) => { const d = b[0] * b[0] + b[1] * b[1] || 1e-12; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const conj = (a) => [a[0], -a[1]];
  const expi = (t) => [Math.cos(t), Math.sin(t)];
  const csqrt = (a) => { const r = Math.hypot(a[0], a[1]); const re = Math.sqrt((r + a[0]) / 2); const im = Math.sign(a[1] || 1) * Math.sqrt(Math.max(0, (r - a[0]) / 2)); return [re, im]; };

  const MU = [-0.09, 0.1];
  const R = Math.hypot(1 - MU[0], MU[1]);
  const BETA = Math.atan2(MU[1], 1 - MU[0]);
  const ONE = [1, 0];

  const toZ = (zeta) => add(zeta, div(ONE, zeta));             // Joukowski map
  const toZeta = (z) => {                                       // inverse, outer branch
    const s = csqrt(sub(mul(z, z), [4, 0]));
    const a = [(z[0] + s[0]) / 2, (z[1] + s[1]) / 2];
    const b = [(z[0] - s[0]) / 2, (z[1] - s[1]) / 2];
    return Math.hypot(a[0] - MU[0], a[1] - MU[1]) >= Math.hypot(b[0] - MU[0], b[1] - MU[1]) ? a : b;
  };

  // airfoil outline (z-plane) and chord
  const foil = [];
  for (let i = 0; i <= 160; i++) { const t = (i / 160) * Math.PI * 2; foil.push(toZ(add(MU, [R * Math.cos(t), R * Math.sin(t)]))); }
  let xmin = Infinity, xmax = -Infinity;
  for (const p of foil) { xmin = Math.min(xmin, p[0]); xmax = Math.max(xmax, p[0]); }
  const CHORD = xmax - xmin, XMID = (xmin + xmax) / 2;

  let alpha = 6 * Math.PI / 180, alphaT = alpha, gamma = 0;
  let rot = expi(-alpha), irot = expi(alpha);
  const setCirc = () => { gamma = 4 * Math.PI * R * Math.sin(alpha + BETA); rot = expi(-alpha); irot = expi(alpha); };
  setCirc();

  // z-plane velocity (vector) at zeta, freestream U=1 at angle alpha
  const velZeta = (zeta) => {
    const d = sub(zeta, MU);
    const w = add(sub(expi(-alpha), div(mul([R * R, 0], expi(alpha)), mul(d, d))), div([0, gamma / (2 * Math.PI)], d));
    const fp = sub(ONE, div(ONE, mul(zeta, zeta)));
    const wz = div(w, fp);                 // complex velocity in z
    const V = conj(wz);                    // physical velocity vector
    let dz = div(V, fp);                   // d zeta / dt
    const m = Math.hypot(dz[0], dz[1]);
    if (m > 4) dz = [dz[0] / m * 4, dz[1] / m * 4];
    return { dz, speed: Math.hypot(V[0], V[1]) };
  };

  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, sc = 1, parts = [], N = 0, mobile = false;
  // display frame: rotate so the freestream is horizontal and the wing pitches nose-up
  const S2Z = (x, y) => add(mul([(x - cx) / sc, (cy - y) / sc], irot), [XMID, 0]);
  const Z2S = (z) => { const d = mul(sub(z, [XMID, 0]), rot); return [cx + d[0] * sc, cy - d[1] * sc]; };

  const spawn = (p, anywhere) => {
    for (let k = 0; k < 8; k++) {
      const x = anywhere ? Math.random() * W : -8 - Math.random() * 40;
      const y = Math.random() * H;
      const zeta = toZeta(S2Z(x, y));
      if (Math.hypot(zeta[0] - MU[0], zeta[1] - MU[1]) > R * 1.02) {
        p.z = zeta; const s = Z2S(toZ(zeta)); p.x = s[0]; p.y = s[1]; p.age = 0; p.life = 6 + Math.random() * 10; return;
      }
    }
  };

  const layout = () => {
    const r = hero.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mobile = W < 832;
    if (mobile) { sc = (W * 0.8) / CHORD; cx = W * 0.5; cy = H * 1.02; }
    else { sc = Math.min(W * 0.34, H * 0.8) / CHORD; cx = W * 0.5; cy = H * 1.02; }
    N = Math.min(900, Math.round((W * H) / (mobile ? 1700 : 1400)));
    parts = Array.from({ length: N }, () => { const p = {}; spawn(p, true); return p; });
    if (reduce) drawStatic();
  };

  const drawFoil = () => {
    // sting / strut to the tunnel floor at quarter chord
    if (!mobile) {
      const q = Z2S([xmin + CHORD * 0.28, -0.02]);
      ctx.strokeStyle = "rgba(205,214,216,.35)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0], H); ctx.stroke();
    }
    ctx.beginPath();
    foil.forEach((p, i) => { const s = Z2S(p); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); });
    ctx.closePath();
    ctx.fillStyle = "#2a3335"; ctx.fill();
    ctx.strokeStyle = "rgba(246,248,248,.92)"; ctx.lineWidth = 1.4; ctx.stroke();
    // chord line
    const a = Z2S([xmin, 0]), b = Z2S([xmax, 0]);
    ctx.setLineDash([3, 5]); ctx.strokeStyle = "rgba(246,248,248,.28)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(a[0] + 6, a[1]); ctx.lineTo(b[0] - 4, b[1]); ctx.stroke(); ctx.setLineDash([]);
  };

  const fmtGauge = () => {
    if (!gA) return;
    const deg = alpha * 180 / Math.PI;
    const cl = (8 * Math.PI * R * Math.sin(alpha + BETA)) / CHORD;
    gA.textContent = (deg >= 0 ? "" : "−") + Math.abs(deg).toFixed(1) + "°";
    gC.textContent = cl.toFixed(2);
  };

  const drawStatic = () => {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, "rgba(240,244,245,.12)"); g.addColorStop(1, "rgba(240,244,245,.12)");
    ctx.strokeStyle = mobile ? "rgba(240,244,245,.18)" : g; ctx.lineWidth = 1;
    const lines = mobile ? 26 : 44;
    for (let i = 0; i < lines; i++) {
      const y = (i + 0.5) * H / lines;
      let zeta = toZeta(S2Z(-10, y));
      if (Math.hypot(zeta[0] - MU[0], zeta[1] - MU[1]) < R * 1.02) continue;
      ctx.beginPath();
      let s = Z2S(toZ(zeta)); ctx.moveTo(s[0], s[1]);
      for (let k = 0; k < 900; k++) {
        const v = velZeta(zeta).dz;
        zeta = [zeta[0] + v[0] * 0.03, zeta[1] + v[1] * 0.03];
        s = Z2S(toZ(zeta)); ctx.lineTo(s[0], s[1]);
        if (s[0] > W + 10) break;
      }
      ctx.stroke();
    }
  };

  let running = false, last = 0, gaugeT = 0;
  const step = (t) => {
    if (!running) return;
    const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    // smooth angle of attack (critically damped feel)
    alpha += (alphaT - alpha) * (1 - Math.exp(-dt * 3.2)); setCirc();

    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.06)"; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";

    const k = dt * 2.6;
    ctx.lineWidth = 1; ctx.lineCap = "round";
    const paths = [new Path2D(), new Path2D(), new Path2D()];
    for (const p of parts) {
      const { dz } = velZeta(p.z);
      p.z = [p.z[0] + dz[0] * k, p.z[1] + dz[1] * k];
      p.age += dt;
      const s = Z2S(toZ(p.z));
      if (s[0] > W + 20 || s[1] < -40 || s[1] > H + 40 || p.age > p.life ||
          Math.hypot(p.z[0] - MU[0], p.z[1] - MU[1]) < R * 1.003) { spawn(p, false); continue; }
      const b = mobile ? (s[1] < 210 ? 2 : 0) : (s[0] < W * 0.46 ? 0 : s[0] < W * 0.58 ? 1 : 2);
      paths[b].moveTo(p.x, p.y); paths[b].lineTo(s[0], s[1]);
      p.x = s[0]; p.y = s[1];
    }
    const A = [0.13, 0.13, 0.13];
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(240,244,245,${A[i]})`; ctx.stroke(paths[i]); }

    requestAnimationFrame(step);
  };
  const start = () => { if (reduce || running) return; running = true; last = 0; requestAnimationFrame(step); };
  const stop = () => { running = false; };


  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 120); }, { passive: true });
  layout();
  if (!reduce) {
    new IntersectionObserver((es) => { es[0].isIntersecting && !document.hidden ? start() : stop(); }).observe(hero);
    document.addEventListener("visibilitychange", () => { document.hidden ? stop() : (hero.getBoundingClientRect().bottom > 0 && start()); });
  }
})();
/* In-page links: scroll by script too, so they work inside embedded previews. */
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute("href").length < 2) return;
  const el = document.getElementById(a.getAttribute("href").slice(1));
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  try { history.replaceState(null, "", a.getAttribute("href")); } catch (_) {}
});
