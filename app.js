/* Ателье M&C — скрипты страницы */
(() => {
  'use strict';

  /* ── Мобильное меню ────────────────────────────────────── */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('site-nav');

  const closeMenu = () => {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
  };

  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });

  nav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') closeMenu();
  });

  /* ── Тень у шапки при прокрутке ────────────────────────── */
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  /* ── Появление блоков при прокрутке ────────────────────── */
  const revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealables.forEach((el) => revealer.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('is-in'));
  }
  // страховка: что бы ни случилось с наблюдателем, через 1,5 с показываем всё
  setTimeout(() => revealables.forEach((el) => el.classList.add('is-in')), 1500);

  /* ── Подсветка активного пункта меню ───────────────────── */
  const links = [...nav.querySelectorAll('a')];
  const sections = links
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ── Ленивая загрузка виджетов Яндекса ─────────────────── */
  const mountEmbed = (box) => {
    if (box.dataset.mounted) return;
    box.dataset.mounted = '1';
    const frame = document.createElement('iframe');
    frame.src = box.dataset.embed;
    frame.title = box.dataset.embedTitle || 'Виджет';
    frame.height = box.dataset.embedHeight || '460';
    frame.loading = 'lazy';
    frame.setAttribute('allowfullscreen', '');
    box.replaceChildren(frame);
  };

  const embeds = document.querySelectorAll('.embed');
  const autoEmbeds = [];

  embeds.forEach((box) => {
    const btn = box.querySelector('[data-embed-load]');
    if (btn) btn.addEventListener('click', () => mountEmbed(box));
    if ('dataset' in box && box.hasAttribute('data-embed-auto')) autoEmbeds.push(box);
  });

  if (autoEmbeds.length) {
    if ('IntersectionObserver' in window) {
      const lazy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          mountEmbed(entry.target);
          lazy.unobserve(entry.target);
        });
      }, { rootMargin: '300px' });
      autoEmbeds.forEach((box) => lazy.observe(box));
    } else {
      autoEmbeds.forEach(mountEmbed);
    }
  }

  /* ── Лайтбокс галереи ──────────────────────────────────── */
  const shots = [...document.querySelectorAll('.shot')];
  const lb = document.getElementById('lightbox');
  const lbImg = lb.querySelector('.lb-img');
  const lbCaption = lb.querySelector('.lb-caption');
  const btnPrev = lb.querySelector('.lb-prev');
  const btnNext = lb.querySelector('.lb-next');
  const btnClose = lb.querySelector('.lb-close');

  let current = 0;
  let opener = null;

  const show = (i) => {
    current = (i + shots.length) % shots.length;
    const img = shots[current].querySelector('img');
    // в лайтбоксе показываем версию покрупнее, если она указана
    lbImg.src = shots[current].dataset.full || img.src;
    lbImg.alt = img.alt;
    lbCaption.textContent = `${img.alt} — ${current + 1} из ${shots.length}`;
  };

  const open = (i) => {
    opener = shots[i];
    show(i);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    btnClose.focus();
  };

  const close = () => {
    lb.hidden = true;
    lbImg.removeAttribute('src');
    document.body.style.overflow = '';
    if (opener) opener.focus();
  };

  shots.forEach((shot, i) => shot.addEventListener('click', () => open(i)));
  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', () => show(current - 1));
  btnNext.addEventListener('click', () => show(current + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });

  addEventListener('keydown', (e) => {
    if (!lb.hidden) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'Tab') {
        // держим фокус внутри окна просмотра
        const focusables = [btnClose, btnPrev, btnNext];
        const idx = focusables.indexOf(document.activeElement);
        e.preventDefault();
        const next = e.shiftKey ? idx - 1 : idx + 1;
        focusables[(next + focusables.length) % focusables.length].focus();
      }
      return;
    }
    if (e.key === 'Escape' && nav.classList.contains('is-open')) closeMenu();
  });

  /* ── Лёгкий параллакс фона в шапке ─────────────────────── */
  const heroImg = document.querySelector('.hero-media img');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroImg && !calm) {
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 900);
        heroImg.style.transform = `translate3d(0,${y * 0.18}px,0) scale(1.1)`;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ── Свайпы в лайтбоксе ────────────────────────────────── */
  let touchX = null;
  lb.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 45) show(dx > 0 ? current - 1 : current + 1);
    touchX = null;
  }, { passive: true });
})();
