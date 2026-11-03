// الحبر: تمسح على الاسم فينصبغ أحمر وتطلع الحروف بلون الورق، وبعدها الحبر يجف ويختفي
(() => {
  document.documentElement.classList.add('js');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;

  const hero = document.querySelector('.hero');
  const cv = hero.querySelector('.ink');
  const word = hero.querySelector('.word');
  const ctx = cv.getContext('2d');
  const ink = document.createElement('canvas');
  const ix = ink.getContext('2d');
  const INK = '#141210', PAPER = '#f2eee5', REDS = ['#b4321f', '#a62b18', '#c03822'];
  const WORD = word.textContent.trim();

  let W = 0, H = 0, font = '', tx = 0, ty = 0, tw = 0, scale = 1;
  let blobs = [], raf = 0, grainPat = null;

  if (coarse) hero.querySelector('.hint').lastChild.textContent = 'امسح بإصبعك على الاسم';

  // حبيبات خفيفة داخل الحبر عشان يبان مطبوع مو ملوّن بالكمبيوتر
  function makeGrain() {
    const g = document.createElement('canvas'); g.width = g.height = 96;
    const gc = g.getContext('2d'), d = gc.createImageData(96, 96);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.random();
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v > .5 ? 0 : 255;
      d.data[i + 3] = Math.random() * 38;
    }
    gc.putImageData(d, 0, 0);
    return ix.createPattern(g, 'repeat');
  }

  function layout() {
    const r = hero.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    for (const c of [cv, ink]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ix.setTransform(dpr, 0, 0, dpr, 0, 0);
    grainPat = makeGrain();
    const wr = word.getBoundingClientRect();
    font = `700 ${getComputedStyle(word).fontSize} Ruqaa, serif`;
    tx = wr.left - r.left + wr.width / 2;
    ty = wr.top - r.top + wr.height / 2;
    ctx.font = font; tw = ctx.measureText(WORD).width;
    scale = Math.max(.55, Math.min(1.5, Math.min(W, H) / 760));
    draw(performance.now());
  }

  function text(c, color) {
    c.save();
    c.font = font; c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = color; c.fillText(WORD, tx, ty);
    c.restore();
  }

  // بقعة حبر: حافة متموجة تكبر بسرعة ثم تجف وتختفي
  function blob(c, b, now) {
    const age = (now - b.t) / 1000;
    const hold = b.keep ? Infinity : 2.6;
    const life = age < hold ? 1 : Math.max(0, 1 - (age - hold) / 1.5);
    if (life <= 0) { b.dead = true; return; }
    const r = b.r * (reduced ? 1 : 1 - Math.exp(-age * 6)) * (.8 + .2 * life);
    const N = 30, pts = [];
    for (let i = 0; i < N; i++) {
      const a = i / N * Math.PI * 2;
      const k = 1 + .13 * Math.sin(3 * a + b.s) + .08 * Math.sin(5 * a + b.s * 2 + age * .5) + .045 * Math.sin(11 * a + b.s * 3);
      pts.push([b.x + Math.cos(a) * r * k, b.y + Math.sin(a) * r * k * b.q]);
    }
    c.globalAlpha = life; c.fillStyle = b.c;
    c.beginPath();
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    let m = mid(pts[N - 1], pts[0]); c.moveTo(m[0], m[1]);
    for (let i = 0; i < N; i++) { const p = pts[i], q = pts[(i + 1) % N], n = mid(p, q); c.quadraticCurveTo(p[0], p[1], n[0], n[1]); }
    c.fill();
    c.globalAlpha = 1;
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    text(ctx, INK);
    if (!blobs.length) return;
    ix.clearRect(0, 0, W, H);
    for (const b of blobs) blob(ix, b, now);
    ix.globalCompositeOperation = 'source-atop';
    ix.fillStyle = grainPat; ix.fillRect(0, 0, W, H);
    text(ix, PAPER);
    ix.globalCompositeOperation = 'source-over';
    ctx.drawImage(ink, 0, 0, W, H);
    blobs = blobs.filter(b => !b.dead);
  }

  function tick(now) {
    draw(now);
    raf = blobs.length ? requestAnimationFrame(tick) : 0;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  function drop(x, y, r, keep) {
    blobs.push({ x, y, r, t: performance.now(), s: Math.random() * 6.3, q: .8 + Math.random() * .35, c: REDS[(Math.random() * 3) | 0], keep });
    if (blobs.length > 260) blobs.splice(0, blobs.length - 260);
  }

  function splash(x, y, speed) {
    const big = (34 + Math.random() * 30) * scale * (speed > 30 ? .7 : 1);
    drop(x, y, big);
    if (Math.random() < .35) {
      const n = 1 + (Math.random() * 2 | 0);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.3, d = big * (1.1 + Math.random() * .9);
        drop(x + Math.cos(a) * d, y + Math.sin(a) * d, (4 + Math.random() * 8) * scale);
      }
    }
    kick();
  }

  // الرسم بالماوس أو الإصبع
  let lx = null, ly = null;
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (lx === null) { lx = x; ly = y; }
    const d = Math.hypot(x - lx, y - ly);
    if (d > 16 * scale) { splash(x, y, d); lx = x; ly = y; }
  });
  hero.addEventListener('pointerdown', e => {
    const r = hero.getBoundingClientRect();
    lx = e.clientX - r.left; ly = e.clientY - r.top;
    splash(lx, ly, 0); splash(lx + 10, ly + 6, 0);
  });
  hero.addEventListener('pointerleave', () => { lx = ly = null; });

  // أول ما تفتح الصفحة: ضربة حبر تمشي على الاسم من اليمين لليسار مثل الكتابة
  function intro() {
    if (reduced) {
      for (let i = 0; i <= 8; i++) drop(tx + tw / 2 - tw * i / 8, ty + Math.sin(i) * 20 * scale, 46 * scale, true);
      draw(performance.now());
      return;
    }
    const steps = 22;
    for (let i = 0; i <= steps; i++) {
      setTimeout(() => {
        const p = i / steps;
        splash(tx + tw / 2 - tw * p, ty + Math.sin(p * 7) * 28 * scale, 0);
      }, 500 + i * 55);
    }
  }

  const ready = document.fonts && document.fonts.load ? document.fonts.load('700 100px Ruqaa') : Promise.resolve();
  ready.then(() => { layout(); intro(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => layout()).observe(hero);
  else addEventListener('resize', layout);

  // الشريط العلوي يصير له خلفية بعد ما تنزل
  const bar = document.querySelector('.bar');
  const onScroll = () => bar.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // ===== الأدوات: سطر واحد مفتوح، وصورة تلحق الماوس
  const tools = [...document.querySelectorAll('.tool')];
  tools.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) tools.forEach(o => { if (o !== d) o.open = false; });
  }));
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target && target.tagName === 'DETAILS') { target.open = true; setTimeout(() => target.scrollIntoView({ block: 'start' }), 50); }

  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const peek = document.querySelector('.peek'), pimg = peek.querySelector('img');
    let mx = 0, my = 0, px = 0, py = 0, on = false, r2 = 0;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
    const loop = () => {
      const dx = mx - px;
      px += dx * .15; py += (my - py) * .15;
      const rot = Math.max(-14, Math.min(14, dx * .09));
      peek.style.transform = `translate(${px - 210}px, ${py - 150}px) rotate(${rot}deg)`;
      r2 = (on || Math.abs(dx) > .4) ? requestAnimationFrame(loop) : 0;
    };
    tools.forEach(d => {
      const s = d.querySelector('summary');
      s.addEventListener('pointerenter', () => {
        if (d.open) return;
        pimg.src = d.dataset.cover;
        if (!on) { px = mx; py = my; }
        on = true; peek.classList.add('on');
        if (!r2) r2 = requestAnimationFrame(loop);
      });
      s.addEventListener('pointerleave', () => { on = false; peek.classList.remove('on'); });
      s.addEventListener('click', () => { on = false; peek.classList.remove('on'); });
    });
  }

  // الأختام تنطبع لما توصلها
  const stamps = document.querySelectorAll('.stamp');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const i = [...stamps].indexOf(e.target);
      e.target.style.animationDelay = (i * .14) + 's';
      e.target.classList.add('in');
      io.unobserve(e.target);
    }), { threshold: .4 });
    stamps.forEach(s => io.observe(s));
  } else stamps.forEach(s => s.classList.add('in'));
})();
