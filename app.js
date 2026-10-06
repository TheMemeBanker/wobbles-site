/* wobbles.lol — pointer parallax, the boing, and confetti. No dependencies. */
(() => {
  const root = document.documentElement;
  const stage = document.getElementById("stage");
  const boing = document.getElementById("boing");
  const name = document.getElementById("name");
  const confetti = document.getElementById("confetti");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const palette = ["#00bfe4", "#9b7fe6", "#b7e35f", "#f59ac0", "#ffffff", "#3b8be0"];
  const WOBWOB_MINT = "GKcJbtiozTKDX4wcmqAwn7dsDBziKBJpfRKDS9n5pump"; // set on the operator's link, after on-chain verification

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
    raf = requestAnimationFrame(tick);
  };
  if (!reduce) raf = requestAnimationFrame(tick);

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
  stage.addEventListener("pointerdown", (e) => {
    e.preventDefault(); wobble(e.clientX, e.clientY);
    if (onBody(e.clientX, e.clientY)) { if (bubble.hidden) showBubble(); else hideBubble(); }
  });
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

  /* ---------- a welcome wobble once he has loaded ---------- */
  const hero = document.getElementById("hero");
  const hello = () => setTimeout(() => { boing.classList.add("go"); }, 650);
  if (hero.complete) hello(); else hero.addEventListener("load", hello, { once: true });
})();
