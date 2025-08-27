document.addEventListener('DOMContentLoaded', () => {
  // Suppression complète du bouton burger (pas créé, pas ajouté)

  const navMenu = document.querySelector('.nav-menu');

  // Du coup, plus de toggle burger, donc on retire aussi cet eventListener

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"], .nav-menu a, .btn').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#') || href.endsWith('.html') === false) {
      a.addEventListener('click', (e) => {
        if (href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // keep default for external or page links
        }
      });
    }
  });

  // Active link on scroll (simple)
  const navLinks = Array.from(document.querySelectorAll('.nav-menu a'));
  const sections = navLinks.map(l => {
    const href = l.getAttribute('href');
    return href && href.startsWith('#') ? document.querySelector(href) : null;
  });

  window.addEventListener('scroll', throttle(() => {
    const y = window.scrollY + 120;
    let found = -1;
    sections.forEach((s, i) => {
      if (!s) return;
      if (s.offsetTop <= y) found = i;
    });
    navLinks.forEach((link, i) => link.classList.toggle('active', i === found));
  }, 200));

  // Stat counter using IntersectionObserver & requestAnimationFrame for smooth increments
  const statEls = document.querySelectorAll('.stat-number');
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (!el.dataset.animated) {
          animateNumber(el, parseInt(el.getAttribute('data-target') || '0'), 1400);
          el.dataset.animated = '1';
        }
      }
    });
  }, { threshold: 0.5 });

  statEls.forEach(el => io.observe(el));

  // small helper functions
  function animateNumber(el, target, duration = 1000) {
    const start = 0;
    const startTime = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.floor(start + (target - start) * eased);
      el.textContent = current.toLocaleString('fr-FR');
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString('fr-FR');
    };
    requestAnimationFrame(step);
  }

  function throttle(fn, wait = 100){
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= wait) { last = now; fn.apply(this,args); }
    };
  }

  // Respect prefers-reduced-motion: stop animations if set
  const pr = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (pr && pr.matches) {
    document.querySelectorAll('.floating-card').forEach(n => n.style.animation = 'none');
  }

});
