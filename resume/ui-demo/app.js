'use strict';
(() => {
  const translations = {
  "en": {
    "fullDetails": "Full details",
    "contact": "Contact details",
    "home": "Portfolio home",
    "skip": "Skip to content",
    "navigation": "Portfolio pages",
    "profile": "Profile",
    "internships": "Internship Projects",
    "work": "Personal Work",
    "explore": "Explore projects",
    "education": "Education",
    "experience": "Internship Experience",
    "skills": "Skills & Tools",
    "internshipEyebrow": "From context to delivery",
    "workEyebrow": "Ideas made tangible",
    "expandAll": "Expand all",
    "collapseAll": "Collapse all",
    "workCount": "Six spaces for making.",
    "prototypeNote": "Minghao (Jasper) Dai · Selected work",
    "backTop": "Back to top",
    "mediaEyebrow": "A CLOSER LOOK",
    "close": "Close",
    "previous": "Previous image",
    "next": "Next image",
    "viewDetails": "View project details",
    "previewMedia": "Preview media",
    "projectChanged": "Page changed",
    "languageChanged": "Language changed to English",
    "sections": "Sections on this page",
    "playVideo": "Play demo video",
    "watchDemo": "Watch demo video"
  },
  "zh": {
    "fullDetails": "完整信息",
    "contact": "联系方式",
    "home": "作品集首页",
    "skip": "跳到正文",
    "navigation": "简历页面",
    "profile": "个人信息",
    "internships": "实习项目",
    "work": "个人作品",
    "explore": "浏览实习项目",
    "education": "教育经历",
    "experience": "实习经历",
    "skills": "技能与工具",
    "internshipEyebrow": "从业务问题，到产品交付",
    "workEyebrow": "把自己的想法做出来",
    "expandAll": "全部展开",
    "collapseAll": "全部收起",
    "workCount": "六个作品，各有探索。",
    "prototypeNote": "代明昊 Jasper · 个人作品集",
    "backTop": "返回顶部",
    "mediaEyebrow": "再看近一点",
    "close": "关闭",
    "previous": "上一张",
    "next": "下一张",
    "viewDetails": "查看项目详情",
    "previewMedia": "预览媒体",
    "projectChanged": "已切换页面",
    "languageChanged": "已切换为中文",
    "sections": "本页章节",
    "playVideo": "播放演示视频",
    "watchDemo": "观看演示视频"
  }
};
  const params = new URLSearchParams(location.search);
  // Default language: ?lang=zh, otherwise the html element's data-language (the standalone Chinese file sets it to zh).
  let language = params.get('lang') === 'zh' || (!params.has('lang') && document.documentElement.dataset.language === 'zh') ? 'zh' : 'en';
  let activePage = ['profile','internships','work'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'profile';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const text = key => translations[language][key] || key;
  const pageNames = ['profile', 'internships', 'work'];
  const controllers = new Map();
  const dialog = document.querySelector('#media-dialog');
  const announcer = document.querySelector('#announcer');
  let pageAnimation;
  let galleryAnimation;
  let galleryProject = 0;
  let galleryFrame = 0;
  let galleryOpener;
  let progressFrame;
  let initialized = false;
  let rail = null;
  let railLabelTimer;
  let fitFrame;

  function animate(node, frames, options) {
    if (reducedMotion.matches || !node.animate) return null;
    return node.animate(frames, {duration: 300, easing: 'cubic-bezier(.22,1,.36,1)', ...options});
  }

  function announce(message) {
    announcer.textContent = message;
  }

  function updateIndicator() {
    const selected = document.querySelector(`.page-tab[data-tab="${activePage}"]`);
    const strip = document.querySelector('.page-tabs');
    const indicator = document.querySelector('.tab-indicator');
    indicator.style.width = `${selected.offsetWidth}px`;
    indicator.style.transform = `translateX(${selected.offsetLeft}px)`;
    // On narrow screens the strip scrolls horizontally; keep the selected tab in view without moving the page.
    if (strip.scrollWidth > strip.clientWidth + 1) {
      const left = selected.offsetLeft - 8;
      const right = selected.offsetLeft + selected.offsetWidth + 8;
      if (left < strip.scrollLeft) strip.scrollTo({left, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
      else if (right > strip.scrollLeft + strip.clientWidth) strip.scrollTo({left: right - strip.clientWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
    }
  }

  function updateProgress() {
    cancelAnimationFrame(progressFrame);
    progressFrame = requestAnimationFrame(() => {
      const available = document.documentElement.scrollHeight - innerHeight;
      const progress = available > 0 ? Math.min(1, Math.max(0, scrollY / available)) : 0;
      document.querySelector('.reading-progress span').style.transform = `scaleX(${progress})`;
      document.querySelector('.site-header').classList.toggle('is-scrolled', scrollY > 12);
      updateRail();
    });
  }

  // Profile card (fixed one-screen height on desktop): scale the right column's type and spacing up to 1.22×
  // until its two sections nearly fill the column, so leftover height becomes breathing room, not a hole.
  function fitProfile() {
    cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(() => {
      const records = document.querySelector('.profile-records');
      if (!records) return;
      records.style.removeProperty('--fit');
      if (activePage !== 'profile' || !matchMedia('(min-width: 1100px) and (min-height: 860px)').matches) return;
      const sections = [...records.children];
      const measure = () => sections.reduce((sum, node) => sum + node.getBoundingClientRect().height, 0)
        + parseFloat(getComputedStyle(records).rowGap || '0') * (sections.length - 1);
      const available = records.clientHeight;
      let scale = Math.min(1.22, available / measure());
      if (scale <= 1.02) return;
      for (let step = 0; step < 8; step++) {
        records.style.setProperty('--fit', scale.toFixed(3));
        if (measure() <= available - 6) return;
        scale -= 0.025;
        if (scale <= 1) { records.style.removeProperty('--fit'); return; }
      }
    });
  }

  function updateExpandAll() {
    const states = [...controllers.values()].filter(state => state.node.dataset.scope === 'internships');
    const allOpen = states.every(state => state.targetOpen);
    const button = document.querySelector('.expand-all');
    button.setAttribute('aria-expanded', String(allOpen));
    const copy = button.querySelector('[data-i18n]');
    copy.dataset.i18n = allOpen ? 'collapseAll' : 'expandAll';
    copy.textContent = text(copy.dataset.i18n);
    button.lastElementChild.textContent = allOpen ? '−' : '+';
  }

  function settleAccordion(state) {
    state.animation?.cancel();
    state.animation = null;
    state.node.open = state.targetOpen;
    state.node.style.overflow = '';
    state.node.style.height = '';
    state.node.dataset.expanded = String(state.targetOpen);
    state.summary.setAttribute('aria-expanded', String(state.targetOpen));
  }

  function toggleAccordion(state, nextOpen) {
    const {node, summary} = state;
    const from = node.getBoundingClientRect().height;
    state.animation?.cancel();
    state.animation = null;
    state.targetOpen = nextOpen;
    if (!nextOpen && node.querySelector('.accordion-body').contains(document.activeElement)) {
      summary.focus({preventScroll: true});
    }
    node.dataset.expanded = String(nextOpen);
    summary.setAttribute('aria-expanded', String(nextOpen));
    // Keep native details open during the height transition, then commit its final state.
    node.open = true;
    node.style.height = '';
    const to = nextOpen ? node.getBoundingClientRect().height : summary.getBoundingClientRect().height + 1;
    node.style.overflow = 'hidden';
    const animation = from > 0 ? animate(node, [{height: `${from}px`}, {height: `${to}px`}], {
      duration: nextOpen ? 380 : 280
    }) : null;
    state.animation = animation;
    if (animation) {
      animation.onfinish = () => {
        if (state.animation !== animation) return;
        settleAccordion(state);
        updateProgress();
      };
    } else {
      settleAccordion(state);
      updateProgress();
    }
    updateExpandAll();
  }

  function bindAccordions() {
    document.querySelectorAll('[data-accordion]').forEach(node => {
      const summary = node.querySelector('summary');
      const state = {node, summary, targetOpen: node.open, animation: null};
      controllers.set(node, state);
      summary.setAttribute('aria-expanded', String(node.open));
      node.dataset.expanded = String(node.open);
      summary.addEventListener('click', event => {
        event.preventDefault();
        toggleAccordion(state, !state.targetOpen);
      });
      // Sync native changes, including a browser find-in-page opening a details element.
      node.addEventListener('toggle', () => {
        if (state.animation) return;
        state.targetOpen = node.open;
        node.dataset.expanded = String(node.open);
        summary.setAttribute('aria-expanded', String(node.open));
        updateExpandAll();
        updateProgress();
      });
    });
    document.querySelector('.expand-all').addEventListener('click', () => {
      const states = [...controllers.values()].filter(state => state.node.dataset.scope === 'internships');
      const nextOpen = !states.every(state => state.targetOpen);
      states.forEach(state => toggleAccordion(state, nextOpen));
    });
  }

  function updateGallery() {
    const project = window.PORTFOLIO.media[galleryProject];
    const frame = project.frames[galleryFrame];
    document.querySelector('#media-title').textContent = window.PORTFOLIO.titles[galleryProject][language];
    document.querySelector('.media-index').textContent = `${String(galleryFrame + 1).padStart(2, '0')} / ${String(project.frames.length).padStart(2, '0')}`;
    document.querySelector('#media-caption').textContent = frame[language];
    const stage = document.querySelector('.media-stage');
    // Keep a playing video intact when only its caption changes language.
    if (stage.dataset.source !== frame.src) {
      stage.querySelector('video')?.pause();
      stage.replaceChildren();
      const media = document.createElement(frame.type === 'video' ? 'video' : 'img');
      media.src = document.body.dataset.assets + frame.src;
      stage.classList.remove('is-playing');
      if (frame.type === 'video') {
        media.controls = true;
        media.playsInline = true;
        media.preload = 'metadata';
        // The video's own first frame as poster, plus an explicit play button: a poster alone reads as a still photo.
        media.poster = document.body.dataset.assets + (frame.poster || project.cover);
        const play = document.createElement('button');
        play.type = 'button';
        play.className = 'media-play';
        play.dataset.i18nAria = 'playVideo';
        play.setAttribute('aria-label', text('playVideo'));
        play.innerHTML = '<span aria-hidden="true">▶</span>';
        play.addEventListener('click', () => media.play());
        media.addEventListener('play', () => stage.classList.add('is-playing'));
        media.addEventListener('pause', () => stage.classList.remove('is-playing'));
        media.addEventListener('ended', () => stage.classList.remove('is-playing'));
        media.setAttribute('aria-describedby', 'media-caption');
        stage.append(media, play);
      } else {
        media.alt = frame[language];
        media.setAttribute('aria-describedby', 'media-caption');
        stage.append(media);
      }
      stage.dataset.source = frame.src;
    }
    const media = stage.firstElementChild;
    if (media?.tagName === 'IMG') media.alt = frame[language];
    for (const button of document.querySelectorAll('.media-prev, .media-next')) button.disabled = project.frames.length < 2;
  }

  function openGallery(button) {
    galleryProject = Number(button.dataset.preview);
    galleryFrame = 0;
    galleryOpener = button;
    updateGallery();
    dialog.showModal();
    document.body.classList.add('no-scroll');
    galleryAnimation?.cancel();
    galleryAnimation = animate(dialog, [
      {opacity: 0, transform: 'translateY(16px) scale(.98)'},
      {opacity: 1, transform: 'translateY(0) scale(1)'}
    ], {duration: 340});
    dialog.querySelector('.close-dialog').focus({preventScroll: true});
  }

  function changeFrame(direction) {
    const total = window.PORTFOLIO.media[galleryProject].frames.length;
    if (total < 2) return;
    galleryFrame = (galleryFrame + direction + total) % total;
    updateGallery();
    galleryAnimation?.cancel();
    galleryAnimation = animate(document.querySelector('.media-stage').firstElementChild, [
      {opacity: .25, transform: `translateX(${direction * 12}px)`},
      {opacity: 1, transform: 'translateX(0)'}
    ], {duration: 240});
  }

  function applyLanguage() {
    // Settle ongoing height animations before translated text changes geometry.
    controllers.forEach(settleAccordion);
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.documentElement.dataset.language = language;
    document.title = window.PORTFOLIO.names[language] + (language === 'zh' ? ' — 个人作品集' : ' — Portfolio');
    document.querySelectorAll('[data-i18n]').forEach(node => {
      node.textContent = (node.dataset.prefix || '') + text(node.dataset.i18n) + (node.dataset.suffix || '');
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(node => {
      node.setAttribute('aria-label', text(node.dataset.i18nAria));
    });
    document.querySelectorAll('.language-switch button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    updateExpandAll();
    if (dialog.open) updateGallery();
    updateProfileDetailTitle();
    updateIndicator();
    updateProgress();
    fitProfile();
  }

  function showPage(page, {route = true, moveFocus = false, scroll = true} = {}) {
    if (!pageNames.includes(page)) return;
    const changed = activePage !== page || !initialized;
    const firstRun = !initialized;
    controllers.forEach(settleAccordion);
    pageAnimation?.cancel();
    activePage = page;
    document.body.dataset.page = page;
    document.querySelectorAll('.page-panel').forEach(panel => {
      panel.hidden = panel.id !== `page-${page}`;
    });
    document.querySelectorAll('[data-tab]').forEach(tab => {
      const selected = tab.dataset.tab === page;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    if (route && location.hash !== `#${page}`) {
      const url = new URL(location.href);
      url.hash = page;
      try { history.pushState(null, '', url); } catch (error) { /* file:// documents may refuse URL changes; navigation still works in-page */ }
    }
    if (changed) {
      if (scroll && !firstRun) window.scrollTo({top: 0, behavior: 'instant'});
      pageAnimation = animate(document.querySelector(`#page-${page}`), [
        {opacity: 0, transform: 'translateY(10px)'},
        {opacity: 1, transform: 'translateY(0)'}
      ], {duration: firstRun ? 440 : 320});
      if (!firstRun) announce(`${text('projectChanged')}: ${text(page)}`);
    }
    if (moveFocus) document.querySelector(`#tab-${page}`).focus({preventScroll: true});
    updateIndicator();
    updateProgress();
    if (page === 'profile') fitProfile();
    initialized = true;
  }

  // Internship page: a fixed rail of ticks (long = company, short = project). The marker follows the
  // reading line continuously; ticks near the marker stretch; the active tick briefly shows its label.
  function buildRail() {
    const panel = document.querySelector('#page-internships');
    const groups = [...panel.querySelectorAll('.project-group')];
    if (!groups.length) return;
    const nav = document.createElement('nav');
    nav.className = 'scroll-rail';
    nav.dataset.i18nAria = 'sections';
    nav.setAttribute('aria-label', text('sections'));
    nav.innerHTML = '<div class="rail-body"><div class="rail-axis" aria-hidden="true"><span class="rail-fill"></span><span class="rail-marker"></span></div><ol class="rail-ticks"></ol></div>';
    const list = nav.querySelector('.rail-ticks');
    const items = [];
    groups.forEach((group, index) => {
      const header = group.querySelector('.group-header');
      if (!header.id) header.id = `group-${index + 1}`;
      const parent = items.length;
      items.push({node: header, kind: 'group', parent: null, headings: header.querySelectorAll('h2'), prefix: ''});
      group.querySelectorAll('.project-accordion').forEach(details => {
        items.push({node: details, kind: 'item', parent, headings: details.querySelectorAll('.project-summary h3'),
          prefix: details.querySelector('.project-number')?.textContent.trim() || ''});
      });
    });
    items.forEach(item => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `rail-tick rail-tick--${item.kind}`;
      button.innerHTML = '<span class="rail-line" aria-hidden="true"></span>';
      const label = document.createElement('span');
      label.className = 'rail-label';
      // Both language variants are kept so the existing language toggle applies to the rail too.
      item.headings.forEach(heading => {
        const span = document.createElement('span');
        span.dataset.contentLanguage = heading.dataset.contentLanguage;
        span.lang = heading.lang;
        span.textContent = (item.prefix ? `${item.prefix} · ` : '') + heading.textContent.trim();
        label.append(span);
      });
      button.append(label);
      button.addEventListener('click', () => {
        const header = document.querySelector('.site-header').getBoundingClientRect().height;
        const top = item.node.getBoundingClientRect().top + scrollY - header - 20;
        // Keep the clicked tick active until the reader scrolls again (the page may be too short to bring it to the reading line).
        rail.pinned = rail.items.indexOf(item);
        window.scrollTo({top: Math.max(0, top), behavior: reducedMotion.matches ? 'instant' : 'smooth'});
      });
      li.append(button);
      list.append(li);
      item.button = button;
    });
    panel.append(nav);
    rail = {nav, body: nav.querySelector('.rail-body'), items, active: -1, pinned: -1};
    const unpin = () => { rail.pinned = -1; };
    window.addEventListener('wheel', unpin, {passive: true});
    window.addEventListener('touchmove', unpin, {passive: true});
    window.addEventListener('keydown', event => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) unpin(); });
  }

  function updateRail() {
    if (!rail || activePage !== 'internships' || !rail.nav.clientHeight) return;
    // Reading line: just below the sticky header, so the tick matches the heading the reader is looking at.
    const line = document.querySelector('.site-header').getBoundingClientRect().height + innerHeight * .18;
    const tops = rail.items.map(item => item.node.getBoundingClientRect().top - 28);
    let active = 0;
    tops.forEach((top, index) => { if (top <= line) active = index; });
    const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    if (atEnd) active = rail.items.length - 1;
    const pinned = rail.pinned >= 0;
    if (pinned) active = rail.pinned;
    const next = Math.min(active + 1, rail.items.length - 1);
    let fraction = 0;
    if (next !== active && !atEnd && !pinned) {
      const span = tops[next] - tops[active];
      fraction = span > 0 ? Math.min(1, Math.max(0, (line - tops[active]) / span)) : 0;
    }
    const centers = rail.items.map(item => item.button.offsetTop + item.button.offsetHeight / 2);
    const snap = reducedMotion.matches;
    const marker = snap ? centers[active] : centers[active] + (centers[next] - centers[active]) * fraction;
    rail.body.style.setProperty('--rail-marker', `${marker.toFixed(1)}px`);
    const parent = rail.items[active].parent;
    rail.items.forEach((item, index) => {
      const distance = Math.abs(centers[index] - marker);
      const magnify = snap ? 1 : 1 + .8 * Math.max(0, 1 - distance / 46);
      item.button.style.setProperty('--mag', magnify.toFixed(3));
      item.button.classList.toggle('is-active', index === active);
      item.button.classList.toggle('is-parent', index === parent);
      if (index === active) item.button.setAttribute('aria-current', 'true');
      else item.button.removeAttribute('aria-current');
    });
    if (active !== rail.active) {
      rail.items[rail.active]?.button.classList.remove('show-label');
      rail.active = active;
      const current = rail.items[active].button;
      current.classList.add('show-label');
      clearTimeout(railLabelTimer);
      railLabelTimer = setTimeout(() => current.classList.remove('show-label'), 1400);
    }
  }

  function bindPortraitTilt() {
    const mat = document.querySelector('[data-tilt]');
    const surface = document.querySelector('.portrait-composition');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    let frame;
    const reset = () => {
      cancelAnimationFrame(frame);
      mat.style.transform = '';
    };
    surface.addEventListener('pointermove', event => {
      if (reducedMotion.matches || !finePointer.matches || event.pointerType === 'touch') return;
      const bounds = surface.getBoundingClientRect();
      const x = Math.max(-.5, Math.min(.5, (event.clientX - bounds.left) / bounds.width - .5));
      const y = Math.max(-.5, Math.min(.5, (event.clientY - bounds.top) / bounds.height - .5));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        mat.style.transform = `rotate(3deg) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
      });
    });
    surface.addEventListener('pointerleave', reset);
    surface.addEventListener('pointercancel', reset);
    reducedMotion.addEventListener('change', reset);
  }

  const profileDialog = document.querySelector('#profile-dialog');
  let profileTarget = 'education';
  let profileOpener;
  let profileAnimation;
  let profileClosing = false;
  function updateProfileDetailTitle() {
    document.querySelector('#profile-detail-title').textContent = text(profileTarget);
  }
  document.querySelectorAll('[data-profile-detail]').forEach(button => {
    button.addEventListener('click', () => {
      profileTarget = button.dataset.profileDetail;
      profileOpener = button;
      updateProfileDetailTitle();
      profileDialog.querySelectorAll('[data-profile-panel]').forEach(panel => {
        panel.hidden = panel.dataset.profilePanel !== profileTarget;
      });
      profileDialog.showModal();
      profileDialog.scrollTop = 0;
      document.body.classList.add('no-scroll');
      profileAnimation?.cancel();
      profileAnimation = animate(profileDialog, [{opacity: 0, transform:'translateY(12px)'}, {opacity:1, transform:'translateY(0)'}]);
      profileDialog.querySelector('.close-profile').focus({preventScroll:true});
    });
  });
  function closeProfile() {
    if (!profileDialog.open || profileClosing) return;
    profileAnimation?.cancel();
    profileAnimation = animate(profileDialog, [{opacity:1, transform:'translateY(0)'}, {opacity:0, transform:'translateY(8px)'}], {duration:180});
    if (!profileAnimation) { profileDialog.close(); return; }
    profileClosing = true;
    profileAnimation.onfinish = profileAnimation.oncancel = () => {
      profileClosing = false;
      if (profileDialog.open) profileDialog.close();
    };
  }
  profileDialog.querySelector('.close-profile').addEventListener('click', closeProfile);
  profileDialog.addEventListener('cancel', event => { event.preventDefault(); closeProfile(); });
  profileDialog.addEventListener('click', event => {
    if (event.target !== profileDialog) return;
    const bounds = profileDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeProfile();
  });
  profileDialog.addEventListener('close', () => {
    profileAnimation?.cancel();
    document.body.classList.remove('no-scroll');
    profileOpener?.focus({preventScroll:true});
  });
  bindAccordions();
  buildRail();
  applyLanguage();
  showPage(activePage, {route: false, scroll: false});
  bindPortraitTilt();

  document.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', () => showPage(button.dataset.tab));
  });
  document.querySelector('.page-tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = pageNames.indexOf(activePage);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 :
      (current + (event.key === 'ArrowRight' ? 1 : -1) + pageNames.length) % pageNames.length;
    showPage(pageNames[next], {moveFocus: true});
  });
  document.querySelectorAll('[data-go]').forEach(button => {
    button.addEventListener('click', () => showPage(button.dataset.go, {moveFocus: true}));
  });
  document.querySelectorAll('.wordmark').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      showPage('profile', {moveFocus: true});
      window.scrollTo({top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
    });
  });
  document.querySelectorAll('.language-switch button').forEach(button => {
    button.addEventListener('click', () => {
      if (language === button.dataset.language) return;
      language = button.dataset.language;
      applyLanguage();
      const url = new URL(location.href);
      if (language === 'zh') url.searchParams.set('lang', 'zh');
      else url.searchParams.delete('lang');
      try { history.replaceState(null, '', url); } catch (error) { /* see pushState note */ }
      announce(text('languageChanged'));
    });
  });
  // pushState navigations are rendered above; back / forward navigations come here.
  window.addEventListener('popstate', () => {
    language = new URLSearchParams(location.search).get('lang') === 'zh' ? 'zh' : 'en';
    applyLanguage();
    showPage(pageNames.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'profile', {route: false, moveFocus: true});
  });
  window.addEventListener('hashchange', () => {
    const page = location.hash.slice(1);
    if (pageNames.includes(page) && page !== activePage) showPage(page, {route: false, moveFocus: true});
  });
  document.querySelectorAll('[data-preview]').forEach(button => {
    button.addEventListener('click', () => openGallery(button));
  });
  let closing = false;
  function closeDialog() {
    if (!dialog.open || closing) return;
    galleryAnimation?.cancel();
    const out = animate(dialog, [
      {opacity: 1, transform: 'translateY(0) scale(1)'},
      {opacity: 0, transform: 'translateY(10px) scale(.985)'}
    ], {duration: 200, easing: 'cubic-bezier(.4,0,.6,1)'});
    if (!out) { dialog.close(); return; }
    closing = true;
    out.onfinish = out.oncancel = () => { closing = false; if (dialog.open) dialog.close(); };
  }
  document.querySelector('.close-dialog').addEventListener('click', closeDialog);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog();
  });
  dialog.addEventListener('close', () => {
    galleryAnimation?.cancel();
    dialog.querySelector('video')?.pause();
    document.body.classList.remove('no-scroll');
    galleryOpener?.focus({preventScroll: true});
  });
  dialog.addEventListener('keydown', event => {
    if (event.target.closest('video')) return;
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    changeFrame(event.key === 'ArrowRight' ? 1 : -1);
  });
  document.querySelector('.media-prev').addEventListener('click', () => changeFrame(-1));
  document.querySelector('.media-next').addEventListener('click', () => changeFrame(1));
  document.querySelector('.back-top').addEventListener('click', () => {
    window.scrollTo({top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
  });
  let printStates = [];
  window.addEventListener('beforeprint', () => {
    controllers.forEach(settleAccordion);
    printStates = [...document.querySelectorAll('details')].map(node => [node, node.open]);
    printStates.forEach(([node]) => { node.open = true; });
  });
  window.addEventListener('afterprint', () => {
    printStates.forEach(([node, open]) => { node.open = open; });
    printStates = [];
    updateProgress();
  });
  // Serif metrics settle after font loading; realign the indicator once fonts are in.
  document.fonts?.ready.then(() => { updateIndicator(); fitProfile(); });
  window.addEventListener('scroll', updateProgress, {passive: true});
  window.addEventListener('resize', () => {
    controllers.forEach(settleAccordion);
    updateIndicator();
    updateProgress();
    fitProfile();
  });
  if ('ResizeObserver' in window) {
    new ResizeObserver(updateProgress).observe(document.querySelector('main'));
    const header = document.querySelector('.site-header');
    new ResizeObserver(() => {
      document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
    }).observe(header);
  }
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    pageAnimation?.cancel();
    galleryAnimation?.cancel();
    profileAnimation?.cancel();
    controllers.forEach(settleAccordion);
  });
})();
