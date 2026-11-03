// الرف: كل كتاب زر يفتح أداته تحت الرف (وبدون جافاسكربت تظهر كل الأدوات تحت بعض)
(() => {
  document.documentElement.classList.add('js');
  const spines = [...document.querySelectorAll('.spine')];
  const tools = spines.map(s => document.getElementById(s.hash.slice(1)));

  spines.forEach((s, i) => {
    s.setAttribute('role', 'tab');
    s.setAttribute('aria-controls', tools[i].id);
    tools[i].setAttribute('role', 'tabpanel');
  });

  function show(i, focus) {
    spines.forEach((s, j) => {
      const on = i === j;
      s.setAttribute('aria-selected', on);
      s.tabIndex = on ? 0 : -1;
      tools[j].classList.toggle('on', on);
    });
    if (focus) spines[i].focus();
  }

  spines.forEach((s, i) => {
    s.addEventListener('click', e => {
      e.preventDefault();
      show(i);
      history.replaceState(null, '', s.hash);
    });
    // الأسهم بين الكتب: الرف من اليمين لليسار، فالسهم الأيسر هو التالي
    s.addEventListener('keydown', e => {
      const n = spines.length;
      let to = null;
      if (e.key === 'ArrowLeft') to = (i + 1) % n;
      else if (e.key === 'ArrowRight') to = (i - 1 + n) % n;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = n - 1;
      if (to === null) return;
      e.preventDefault();
      show(to, true);
      history.replaceState(null, '', spines[to].hash);
    });
  });

  const fromHash = spines.findIndex(s => s.hash === location.hash);
  show(fromHash < 0 ? 0 : fromHash);
})();
