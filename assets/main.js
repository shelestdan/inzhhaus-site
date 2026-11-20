// ИНЖХАУС: анимации и поведение. Без JS всё содержимое видно и работает.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Фон шапки постепенно набирает плотность на первых 240 пикселях прокрутки.
const head = document.querySelector('.head');
let lastY = scrollY;
const onScroll = () => {
  const y = scrollY;
  head.style.setProperty('--head-opacity', Math.min(1, Math.max(0, y / 240)));
  head.classList.toggle('is-hidden', y > 400 && y > lastY && !document.querySelector('.drawer.is-open'));
  lastY = y;
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Меню-шторка
const drawer = document.querySelector('.drawer');
const burger = document.querySelector('.burger');
const closeBtn = drawer.querySelector('.burger');
drawer.querySelectorAll('nav li a').forEach((a, i) => a.style.setProperty('--i', i));
const setMenu = (open) => {
  drawer.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
  closeBtn.setAttribute('aria-expanded', String(open));
  drawer.toggleAttribute('inert', !open);
  document.body.style.overflow = open ? 'hidden' : '';
  (open ? closeBtn : burger).focus();
};
drawer.setAttribute('inert', '');
burger.addEventListener('click', () => setMenu(true));
closeBtn.addEventListener('click', () => setMenu(false));
drawer.querySelector('.drawer__shade').addEventListener('click', () => setMenu(false));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) setMenu(false); });

// Заголовки по словам
document.querySelectorAll('[data-split]').forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
});

// Появление при прокрутке + счётчики
const count = (el) => {
  const to = +el.dataset.count;
  if (reduce) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 1600;
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    e.target.querySelectorAll('[data-count]').forEach(count);
    io.unobserve(e.target);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('[data-split], [data-reveal]').forEach((el) => io.observe(el));

// Первый экран: параллакс фона и уход текста
const heroImg = document.querySelector('.hero__bg');
const heroInner = document.querySelector('.hero__inner');
if (heroImg && !reduce) {
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.min(scrollY, innerHeight);
      heroImg.style.transform = `translateY(${y * 0.3}px)`;
      heroInner.style.transform = `translateY(${y * 0.15}px)`;
      heroInner.style.opacity = String(1 - y / (innerHeight * 0.8));
      ticking = false;
    });
  }, { passive: true });
}

// Ленты: дублируем содержимое для бесконечной прокрутки
document.querySelectorAll('.marquee__track, .belt__track').forEach((t) => {
  if (reduce) return;
  t.innerHTML += t.innerHTML.replace(/<(span|div|img)/g, '<$1 aria-hidden="true"').replace(/alt="[^"]*"/g, 'alt=""');
});

// Раскрытие строки объекта
document.querySelectorAll('.obj__btn').forEach((b) => b.addEventListener('click', () => {
  const open = b.getAttribute('aria-expanded') !== 'true';
  b.setAttribute('aria-expanded', open);
  b.closest('.obj').classList.toggle('is-open', open);
}));

// «Обсудить похожий объект»: подставляет объект в заявку
document.querySelectorAll('[data-like]').forEach((a) => a.addEventListener('click', () => {
  const msg = document.querySelector('#f-msg');
  const sys = (a.closest('.obj').dataset.sys || '').split(' ').filter(Boolean).join(', ');
  if (msg) msg.value = `Похожий объект: ${a.dataset.like}` + (sys ? `. Системы: ${sys}` : '') + '. ';
  setTimeout(() => msg && msg.focus({ preventScroll: true }), 600);
}));

// Заявка: без JS форма уходит обычным POST на send.php
document.querySelectorAll('form[data-ajax]').forEach((form) => {
  const status = form.querySelector('.form__status');
  const phone = form.querySelector('[name="phone"]');
  const btn = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = phone.value.replace(/\D/g, '').length >= 10;
    phone.setAttribute('aria-invalid', String(!ok));
    if (!ok) { status.textContent = 'Укажите телефон полностью, например +7 999 123-45-67.'; phone.focus(); return; }
    btn.setAttribute('aria-busy', 'true'); btn.disabled = true;
    status.textContent = 'Отправляем…';
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then((r) => r.json().then((j) => r.ok && j.ok))
      .then((ok2) => {
        status.textContent = ok2 ? 'Заявка отправлена. Перезвоним в рабочее время.' : 'Не получилось отправить. Позвоните нам или попробуйте ещё раз.';
        if (ok2) form.reset();
      })
      .catch(() => { status.textContent = 'Не получилось отправить. Позвоните нам или попробуйте ещё раз.'; })
      .finally(() => { btn.removeAttribute('aria-busy'); btn.disabled = false; });
  });
});
const sent = new URLSearchParams(location.search).get('sent');
if (sent !== null) {
  const s = document.querySelector('.form__status');
  if (s) s.textContent = sent === '1' ? 'Заявка отправлена. Перезвоним в рабочее время.' : 'Не получилось отправить. Позвоните нам.';
}
document.querySelectorAll('[data-year]').forEach((n) => { n.textContent = new Date().getFullYear(); });
