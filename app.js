/* wobbles.lol — pointer parallax, the boing, and confetti. No dependencies. */
(() => {
  const root = document.documentElement;
  const stage = document.getElementById("stage");
  const boing = document.getElementById("boing");
  const name = document.getElementById("name");
  const confetti = document.getElementById("confetti");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const palette = ["#00bfe4", "#9b7fe6", "#b7e35f", "#f59ac0", "#ffffff", "#3b8be0"];
  const WOBWOB_MINT = null; // set on the operator's link, after on-chain verification; null = no bubble at all

  /* ---------- parallax: the stage tilts toward the pointer, layers slide by depth ---------- */
  let tx = 0, ty = 0, cx = 0, cy = 0, lastMove = 0, raf = 0;
  const setTarget = (x, y) => { tx = Math.max(-1, Math.min(1, x)); ty = Math.max(-1, Math.min(1, y)); lastMove = performance.now(); };
  window.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    setTarget(x * 0.9, y * 0.9);
  }, { passive: true });
  window.addEventListener("pointerleave", () => setTarget(0, 0));
  const tick = (now) => {
    // when the pointer rests for 3s, Wobbles looks around on his own
    if (now - lastMove > 3000) { const t = now / 1000; setTarget(Math.sin(t * .35) * .35, Math.cos(t * .27) * .22); lastMove = now - 3000; }
    cx += (tx - cx) * 0.075; cy += (ty - cy) * 0.075;
    root.style.setProperty("--rx", (cx * 7).toFixed(2) + "deg");
    root.style.setProperty("--ry", (-cy * 5.5).toFixed(2) + "deg");
    root.style.setProperty("--px", (cx * 11).toFixed(2));
    root.style.setProperty("--py", (cy * 8).toFixed(2));
    // the glints slide across the pupils toward the pointer
    root.style.setProperty("--gx", (cx * 34).toFixed(1));
    root.style.setProperty("--gy", (cy * 30).toFixed(1));
    springStep();
    raf = requestAnimationFrame(tick);
  };
  if (!reduce) raf = requestAnimationFrame(tick);

  /* ---------- grab him: a spring on the body layer; fling kicks the sidekicks ---------- */
  const bodyEl = document.getElementById("body");
  const piecesEls = [...document.querySelectorAll(".layer.piece")];
  const sp = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, held: false, lastX: 0, lastY: 0, lastT: 0 };
  const springStep = () => {
    if (sp.held) { sp.x += (sp.tx - sp.x) * 0.35; sp.y += (sp.ty - sp.y) * 0.35; }
    else {
      sp.vx += -sp.x * 0.085; sp.vy += -sp.y * 0.085; sp.vx *= 0.86; sp.vy *= 0.86; sp.x += sp.vx; sp.y += sp.vy;
      if (Math.abs(sp.x) < .05 && Math.abs(sp.y) < .05 && Math.abs(sp.vx) < .05 && Math.abs(sp.vy) < .05) { sp.x = sp.y = sp.vx = sp.vy = 0; }
    }
    bodyEl.style.setProperty("--dx", sp.x.toFixed(1) + "px");
    bodyEl.style.setProperty("--dy", sp.y.toFixed(1) + "px");
    bodyEl.style.setProperty("--dr", (sp.x * 0.045).toFixed(2) + "deg");
  };
  const kickPieces = (fx, fy) => {
    piecesEls.forEach((el, i) => {
      const r = stage.getBoundingClientRect();
      const ang = Math.atan2(fy, fx) + (Math.random() - .5) * 1.2;
      const mag = Math.min(60, 18 + Math.hypot(fx, fy) * 1.6) * (0.6 + Math.random() * .8);
      el.style.setProperty("--kx", (Math.cos(ang) * mag * r.width / 962).toFixed(1) + "px");
      el.style.setProperty("--ky", (Math.sin(ang) * mag * r.height / 912).toFixed(1) + "px");
      el.classList.remove("kick"); void el.offsetWidth; el.classList.add("kick");
    });
  };

  /* ---------- the boing ---------- */
  const wobble = (px, py) => {
    boing.classList.remove("go"); void boing.offsetWidth; boing.classList.add("go");
    [...name.children].forEach((s, i) => { s.classList.remove("jump"); void s.offsetWidth; setTimeout(() => s.classList.add("jump"), i * 45); });
    if (!reduce) burst(px, py);
  };
  /* ---------- the address bubble: only when you tap the big blue guy himself ---------- */
  const bubble = document.getElementById("bubble");
  let addr, copyHint, bubbleTimer = 0;
  const buildBubble = () => {            // nothing about the address exists in the page until he is tapped
    if (addr) return;
    bubble.innerHTML = '<span class="bubble-tag">$wobwob</span><code class="bubble-addr" id="addr"></code><span class="bubble-hint" id="copyHint"></span>';
    addr = document.getElementById("addr"); copyHint = document.getElementById("copyHint");
  };
  const onBody = (clientX, clientY) => {
    const r = stage.getBoundingClientRect();
    const x = (clientX - r.left) / r.width, y = (clientY - r.top) / r.height;
    const dx = (x - 0.50) / 0.27, dy = (y - 0.60) / 0.29;   // ellipse over his body
    return dx * dx + dy * dy <= 1;
  };
  const showBubble = () => {
    if (!WOBWOB_MINT) return;              // nothing to show until an address is wired
    buildBubble(); clearTimeout(bubbleTimer);
    bubble.classList.remove("out", "copied");
    if (WOBWOB_MINT) { addr.textContent = WOBWOB_MINT; addr.classList.remove("soon"); copyHint.textContent = "tap to copy"; }
    else { addr.textContent = "address coming soon"; addr.classList.add("soon"); copyHint.textContent = ""; }
    bubble.hidden = false; void bubble.offsetWidth;
    bubbleTimer = setTimeout(hideBubble, 12000);
  };
  const hideBubble = () => {
    if (bubble.hidden) return;
    bubble.classList.add("out");
    setTimeout(() => { bubble.hidden = true; bubble.classList.remove("out"); }, 280);
  };
  const copyAddr = async () => {
    if (!WOBWOB_MINT) return;
    try { await navigator.clipboard.writeText(WOBWOB_MINT); }
    catch { const t = document.createElement("textarea"); t.value = WOBWOB_MINT; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch {} t.remove(); }
    bubble.classList.add("copied"); copyHint.textContent = "copied";
    clearTimeout(bubbleTimer); bubbleTimer = setTimeout(hideBubble, 2200);
  };
  bubble.addEventListener("pointerdown", (e) => { e.stopPropagation(); e.preventDefault(); copyAddr(); });
  document.addEventListener("pointerdown", (e) => { if (!bubble.hidden && !bubble.contains(e.target) && !stage.contains(e.target)) hideBubble(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideBubble(); });
  /* ---------- a soft boing you can hear (muted with the pip; remembered) ---------- */
  const pip = document.getElementById("pip");
  let ac = null, soundOn = true;
  try { soundOn = localStorage.getItem("wob.sound") !== "off"; } catch {}
  const paintPip = () => { pip.setAttribute("aria-pressed", soundOn ? "true" : "false"); pip.setAttribute("aria-label", soundOn ? "Sound on" : "Sound off"); };
  paintPip();
  pip.addEventListener("pointerdown", (e) => e.stopPropagation());
  pip.addEventListener("click", (e) => { e.stopPropagation(); soundOn = !soundOn; try { localStorage.setItem("wob.sound", soundOn ? "on" : "off"); } catch {} paintPip(); if (soundOn) playBoing(1); });
  const playBoing = (pitch = 1) => {
    if (!soundOn) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      const t = ac.currentTime, g = ac.createGain(), o = ac.createOscillator(), o2 = ac.createOscillator();
      o.type = "sine"; o2.type = "triangle";
      o.frequency.setValueAtTime(440 * pitch, t); o.frequency.exponentialRampToValueAtTime(150 * pitch, t + .22);
      o2.frequency.setValueAtTime(880 * pitch, t); o2.frequency.exponentialRampToValueAtTime(220 * pitch, t + .12);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + .012); g.gain.exponentialRampToValueAtTime(0.0001, t + .3);
      o.connect(g); o2.connect(g); g.connect(ac.destination); o.start(t); o2.start(t); o.stop(t + .32); o2.stop(t + .32);
    } catch {}
  };

  /* ---------- taps, holds, drags and flings ---------- */
  let taps = 0, holdTimer = 0, dragging = false, moved = false, downX = 0, downY = 0, downT = 0, blushing = false;
  const startBlush = () => { blushing = true; bodyEl.classList.add("blushing"); playBoing(1.6); };
  const stopBlush = () => { if (!blushing) return; blushing = false; bodyEl.classList.remove("blushing"); };
  const party = () => {
    name.classList.remove("party"); void name.offsetWidth; name.classList.add("party");
    const r = stage.getBoundingClientRect();
    for (let i = 0; i < 3; i++) setTimeout(() => burst(r.left + r.width * (0.3 + 0.2 * i), r.top + r.height * 0.45), i * 120);
    kickPieces((Math.random() - .5) * 40, -30);
  };
  stage.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    downX = e.clientX; downY = e.clientY; downT = performance.now(); moved = false;
    sp.lastX = e.clientX; sp.lastY = e.clientY; sp.lastT = downT;
    const body = onBody(e.clientX, e.clientY);
    wobble(e.clientX, e.clientY); playBoing(1);
    if (body) {
      dragging = true; sp.held = true; stage.classList.add("grabbing");
      try { stage.setPointerCapture(e.pointerId); } catch {}
      clearTimeout(holdTimer); holdTimer = setTimeout(() => { if (!moved && sp.held) startBlush(); }, 520);
    }
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - downX, dy = e.clientY - downY;
    if (!moved && Math.hypot(dx, dy) > 6) { moved = true; clearTimeout(holdTimer); stopBlush(); hideBubble(); }
    if (!moved) return;
    const r = stage.getBoundingClientRect();
    const lim = r.width * 0.32;
    sp.tx = Math.max(-lim, Math.min(lim, dx)); sp.ty = Math.max(-lim * 0.8, Math.min(lim * 0.8, dy));
    const now = performance.now(), dt = Math.max(1, now - sp.lastT);
    sp.vx = (e.clientX - sp.lastX) / dt * 16; sp.vy = (e.clientY - sp.lastY) / dt * 16;
    sp.lastX = e.clientX; sp.lastY = e.clientY; sp.lastT = now;
  });
  const release = (e) => {
    clearTimeout(holdTimer);
    const wasHeld = sp.held;
    if (dragging) {
      dragging = false; sp.held = false; stage.classList.remove("grabbing");
      try { stage.releasePointerCapture(e.pointerId); } catch {}
      const speed = Math.hypot(sp.vx, sp.vy);
      if (moved && speed > 4.5) { kickPieces(sp.vx, sp.vy); playBoing(0.8); boing.classList.remove("go"); void boing.offsetWidth; boing.classList.add("go"); }
      if (!moved) { sp.vx = sp.vy = 0; }
    }
    if (blushing) { stopBlush(); return; }           // a long press is its own moment, not a tap
    if (wasHeld && !moved && performance.now() - downT < 520) {
      taps++;
      if (bubble.hidden) showBubble(); else hideBubble();
      if (taps % 7 === 0) party();
      if (taps % 20 === 0) { bodyEl.classList.remove("spin"); void bodyEl.offsetWidth; bodyEl.classList.add("spin"); playBoing(1.3); }
    }
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); const r = stage.getBoundingClientRect(); wobble(r.left + r.width / 2, r.top + r.height / 2); } });

  /* ---------- confetti: a handful of soft shapes with real gravity ---------- */
  const pieces = [];
  let animating = false;
  const burst = (x, y) => {
    const n = 16 + Math.floor(Math.random() * 6);
    for (let i = 0; i < n; i++) {
      const el = document.createElement("i");
      const kind = Math.random() < .55 ? "dot" : Math.random() < .6 ? "sq" : "ring";
      el.className = kind;
      const color = palette[Math.floor(Math.random() * palette.length)];
      el.style.background = color; el.style.color = color;
      const a = (-Math.PI / 2) + (Math.random() - .5) * Math.PI * 1.25;
      const v = 7 + Math.random() * 9;
      const s = .7 + Math.random() * .9;
      pieces.push({ el, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 360, vr: (Math.random() - .5) * 18, s, life: 1, born: performance.now() });
      confetti.appendChild(el);
    }
    if (!animating) { animating = true; requestAnimationFrame(step); }
  };
  const step = (now) => {
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.vy += .42; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      const age = (now - p.born) / 1000;
      p.life = age < .75 ? 1 : Math.max(0, 1 - (age - .75) / .5);
      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.r}deg) scale(${p.s * (0.6 + 0.4 * p.life)})`;
      p.el.style.opacity = p.life;
      if (p.life <= 0 || p.y > window.innerHeight + 40) { p.el.remove(); pieces.splice(i, 1); }
    }
    if (pieces.length) requestAnimationFrame(step); else animating = false;
  };

  /* ---------- after dark the sky dims and the stars come out ---------- */
  const q = new URLSearchParams(location.search);
  const hour = new Date().getHours();
  const night = q.has("night") ? true : q.has("day") ? false : (hour >= 20 || hour < 6);
  if (night) { document.body.classList.add("night"); const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", "#1a2b47"); }

  /* ---------- a welcome wobble once he has loaded ---------- */
  const hero = document.getElementById("hero");
  const hello = () => setTimeout(() => { boing.classList.add("go"); }, 650);
  if (hero.complete) hello(); else hero.addEventListener("load", hello, { once: true });
})();
