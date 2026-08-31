/**
 * LUMINOUS ARCHITECTURE — Interaction & Animation System
 * Vanilla JavaScript. No dependencies.
 *
 * Modules:
 *  1. Reduced-motion + touch detection
 *  2. Header scroll state
 *  3. Mobile navigation
 *  3b. Preloader
 *  4. Hero load-in reveal
 *  5. Spotlight cursor (hero + final CTA)
 *  6. Intersection-Observer scroll reveals (reveal-up, fill-line)
 *  7. Light-as-Material state switcher
 *  8. Lighting Experience (Object/Space) toggle
 *  9. Before/After compare slider
 *  10. Materials hover gallery (CSS-driven, JS only for touch fallback)
 *  11. Custom process progress line
 *  12. Services accordion
 *  13. Trust counters (count-up on view)
 *  14. Magnetic buttons
 */

(function () {
  'use strict';

  /* ---------- 1. Environment flags ---------- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------- 2. Header scroll state ---------- */
  const header = document.querySelector('[data-nav]');
  if (header) {
    const updateHeaderState = () => {
      if (window.scrollY > 40) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };
    updateHeaderState();
    window.addEventListener('scroll', updateHeaderState, { passive: true });
  }

  /* ---------- 3. Mobile navigation ---------- */
  const navToggle = document.querySelector('[data-nav-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');
  const navClose = document.querySelector('[data-nav-close]');

  if (navToggle && mobileNav) {
    const closeMobileNav = () => {
      navToggle.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('is-open');
      document.body.style.overflow = '';
      window.setTimeout(() => { mobileNav.hidden = true; }, 320);
    };

    const openMobileNav = () => {
      mobileNav.hidden = false;
      // Force layout so the browser registers the un-hidden state before
      // the class toggle, guaranteeing the opacity/transform transition runs.
      void mobileNav.offsetHeight;
      navToggle.setAttribute('aria-expanded', 'true');
      mobileNav.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };

    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMobileNav() : openMobileNav();
    });

    if (navClose) {
      navClose.addEventListener('click', closeMobileNav);
    }

    mobileNav.querySelectorAll('[data-mobile-nav-link]').forEach((link) => {
      link.addEventListener('click', closeMobileNav);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        closeMobileNav();
        navToggle.focus();
      }
    });
  }

  /* ---------- 3b. Preloader ----------
     Stays visible until the entire page has finished loading: all HTML,
     CSS, scripts, and every image on the page (not just window 'load',
     which is double-checked here against actual image decode state in
     case a cached image's load event fires before this script attaches).
     A safety timeout prevents an indefinite hang if a single asset stalls.
  ------------------------------------- */
  const preloader = document.getElementById('preloader');
  if (preloader) {
    const minDisplayMs = 900;
    const maxWaitMs = 8000;
    const startTime = performance.now();
    document.body.style.overflow = 'hidden';

    const hidePreloader = () => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, minDisplayMs - elapsed);
      window.setTimeout(() => {
        preloader.classList.add('is-hidden');
        document.body.style.overflow = '';
        preloader.addEventListener('transitionend', () => preloader.remove(), { once: true });
      }, remaining);
    };

    const waitForImages = () => new Promise((resolve) => {
      const images = Array.from(document.images);
      if (images.length === 0) { resolve(); return; }

      let pending = images.filter((img) => !(img.complete && img.naturalWidth !== 0)).length;
      if (pending === 0) { resolve(); return; }

      const onSettle = () => {
        pending -= 1;
        if (pending <= 0) resolve();
      };

      images.forEach((img) => {
        if (img.complete && img.naturalWidth !== 0) return;
        img.addEventListener('load', onSettle, { once: true });
        img.addEventListener('error', onSettle, { once: true });
      });
    });

    const pageFullyLoaded = new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });

    const safetyTimeout = new Promise((resolve) => {
      window.setTimeout(resolve, maxWaitMs);
    });

    Promise.race([
      Promise.all([pageFullyLoaded, waitForImages()]),
      safetyTimeout,
    ]).then(hidePreloader);
  }

  /* ---------- 4. Hero load-in reveal ---------- */
  const hero = document.querySelector('.hero');
  if (hero) {
    // Small delay lets the browser paint the initial (hidden) state first,
    // guaranteeing the CSS transition actually runs.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        hero.classList.add('is-loaded');
      });
    });
  }

  /* ---------- 5. Spotlight cursor ----------
     LIGHT REVEAL / SPOTLIGHT CURSOR animation.
     Trigger: pointermove within a spotlight zone.
     Uses CSS custom properties --cursor-x / --cursor-y, updated via rAF.
     GPU-friendly: only background-position of a radial-gradient layer changes;
     no layout properties are touched. Disabled entirely on touch devices.
  ---------------------------------------------- */
  if (!isTouchDevice) {
    const spotlightZones = document.querySelectorAll('[data-spotlight-zone], .final-cta');
    let pendingX = 50;
    let pendingY = 50;
    let rafScheduled = false;

    const applySpotlight = () => {
      rafScheduled = false;
      document.documentElement.style.setProperty('--cursor-x', pendingX + '%');
      document.documentElement.style.setProperty('--cursor-y', pendingY + '%');
    };

    const handlePointerMove = (zone) => (event) => {
      const rect = zone.getBoundingClientRect();
      pendingX = ((event.clientX - rect.left) / rect.width) * 100;
      pendingY = ((event.clientY - rect.top) / rect.height) * 100;
      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(applySpotlight);
      }
      const spot = zone.querySelector('[data-spotlight]');
      if (spot) spot.classList.add('is-active');
    };

    spotlightZones.forEach((zone) => {
      const spot = zone.querySelector('[data-spotlight]');
      zone.addEventListener('pointermove', handlePointerMove(zone));
      zone.addEventListener('pointerleave', () => {
        if (spot) spot.classList.remove('is-active');
      });
    });
  }

  /* ---------- 6. Intersection Observer scroll reveals ----------
     LIGHT REVEAL animation family.
     Trigger: IntersectionObserver, element enters viewport.
     Delay: staggered 0–100ms via inline transition-delay set per index.
     Duration: 1000–1600ms (defined in CSS via --duration-reveal).
     Easing: cubic-bezier(0.16, 1, 0.3, 1) (defined in CSS via --ease-architectural).
     Only transform + opacity are animated — GPU-composited properties only.
  ------------------------------------------------------------- */
  const revealTargets = document.querySelectorAll('.reveal-up');

  if (prefersReducedMotion) {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  } else if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            // Small staggered delay (0-100ms) for elements revealing together.
            const staggerIndex = Array.from(el.parentElement.children).indexOf(el);
            const delay = Math.min(staggerIndex * 60, 300);
            el.style.transitionDelay = delay + 'ms';
            el.classList.add('is-visible');
            revealObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- 7. Light-as-Material state switcher ----------
     MATERIAL MORPH animation.
     Trigger: click / Enter / Space on a state tab.
     Duration: 700-1000ms (--duration-morph), ease-out.
     Image, active class and description crossfade together.
  ------------------------------------------------------------ */
  const stateTabs = document.querySelectorAll('[data-state-tab]');
  const stateImages = document.querySelectorAll('[data-state-image]');
  const stateDescs = document.querySelectorAll('.light-states__desc');

  function setLightState(stateName) {
    stateTabs.forEach((tab) => {
      const isMatch = tab.dataset.stateTab === stateName;
      tab.classList.toggle('is-active', isMatch);
      tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
    stateImages.forEach((img) => {
      img.classList.toggle('is-active', img.dataset.stateImage === stateName);
    });
    stateDescs.forEach((desc) => {
      const isMatch = desc.id === `panel-${stateName}`;
      desc.classList.toggle('is-active', isMatch);
      desc.hidden = !isMatch;
    });
  }

  stateTabs.forEach((tab) => {
    tab.addEventListener('click', () => setLightState(tab.dataset.stateTab));
  });

  // Roving keyboard support across the tablist
  const lightStatesTablist = document.querySelector('.light-states__tabs');
  if (lightStatesTablist) {
    lightStatesTablist.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
      const tabs = Array.from(stateTabs);
      const currentIndex = tabs.findIndex((t) => t.classList.contains('is-active'));
      const nextIndex = e.key === 'ArrowRight'
        ? (currentIndex + 1) % tabs.length
        : (currentIndex - 1 + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      setLightState(tabs[nextIndex].dataset.stateTab);
      e.preventDefault();
    });
  }

  /* ---------- 8. Lighting Experience (Object/Space) toggle ---------- */
  const viewTabs = document.querySelectorAll('[data-view-tab]');
  const viewImages = document.querySelectorAll('[data-view-image]');

  viewTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.viewTab;
      viewTabs.forEach((t) => {
        const isMatch = t === tab;
        t.classList.toggle('is-active', isMatch);
        t.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });
      viewImages.forEach((img) => {
        img.classList.toggle('is-active', img.dataset.viewImage === view);
      });
    });
  });

  /* ---------- 9. Before/After compare slider ----------
     BEFORE / AFTER animation.
     Drag / keyboard-adjustable range input drives clip width, brightness,
     and shadow/ambient values simultaneously to simulate the room being lit.
  -------------------------------------------------------- */
  const compareStage = document.querySelector('[data-compare]');
  if (compareStage) {
    const slider = compareStage.querySelector('[data-compare-slider]');
    const beforeLayer = compareStage.querySelector('[data-compare-before]');
    const handle = compareStage.querySelector('[data-compare-handle]');
    const frame = compareStage.querySelector('.compare__frame');

    function updateCompare(value) {
      // value: 0 (all "without light") -> 100 (all "with light")
      const beforeWidth = 100 - value; // width of the "without light" layer
      beforeLayer.style.width = beforeWidth + '%';
      handle.style.left = beforeWidth + '%';

      // Simulate shadow/contrast/atmosphere shift as more "light" is revealed.
      const brightness = 0.72 + (value / 100) * 0.28; // 0.72 -> 1.0
      const saturate = 0.68 + (value / 100) * 0.32;
      beforeLayer.style.filter = `brightness(${brightness}) saturate(${saturate}) contrast(${0.9 + (value / 100) * 0.1})`;
    }

    // Keep the "before" image visually aligned with the full frame while clipped,
    // matching frame width so the crop reads as one continuous photograph.
    function syncBeforeImageWidth() {
      const w = frame.getBoundingClientRect().width;
      compareStage.style.setProperty('--compare-image-w', w + 'px');
    }

    syncBeforeImageWidth();
    window.addEventListener('resize', syncBeforeImageWidth, { passive: true });

    slider.addEventListener('input', (e) => updateCompare(Number(e.target.value)));
    updateCompare(Number(slider.value));
  }

  /* ---------- 10. Materials gallery — touch fallback ----------
     Desktop hover-expand is pure CSS (:hover on .materials__row).
     On touch devices, tap toggles an "expanded" state manually since
     there is no hover to key off.
  --------------------------------------------------------------- */
  if (isTouchDevice) {
    const materialItems = document.querySelectorAll('.materials__item');
    materialItems.forEach((item) => {
      item.addEventListener('click', () => {
        materialItems.forEach((other) => {
          if (other !== item) other.classList.remove('is-expanded-touch');
        });
        item.classList.toggle('is-expanded-touch');
      });
    });
  }

  /* ---------- 11. Custom process progress line ----------
     Fills as the section scrolls through the viewport, and marks each
     step "passed" once the scroll progress reaches its position.
  --------------------------------------------------------------------- */
  const progressTrack = document.querySelector('[data-progress-track]');
  const progressFill = document.querySelector('[data-progress-fill]');

  if (progressTrack && progressFill) {
    const steps = Array.from(progressTrack.querySelectorAll('.custom-process__step'));

    function updateProgress() {
      const rect = progressTrack.getBoundingClientRect();
      const viewportH = window.innerHeight;

      // Progress: 0 when track top hits viewport bottom, 1 when track bottom hits viewport top.
      const total = rect.height + viewportH;
      const traveled = viewportH - rect.top;
      let progress = traveled / total;
      progress = Math.max(0, Math.min(1, progress));

      progressFill.style.width = (progress * 100) + '%';

      const passedCount = Math.round(progress * steps.length);
      steps.forEach((step, i) => {
        step.classList.toggle('is-passed', i < passedCount);
      });
    }

    let progressRafId = null;
    function scheduleProgressUpdate() {
      if (progressRafId) return;
      progressRafId = requestAnimationFrame(() => {
        updateProgress();
        progressRafId = null;
      });
    }

    updateProgress();
    window.addEventListener('scroll', scheduleProgressUpdate, { passive: true });
    window.addEventListener('resize', scheduleProgressUpdate, { passive: true });
  }

  /* ---------- 12. Services accordion ---------- */
  const serviceTriggers = document.querySelectorAll('[data-service-trigger]');

  serviceTriggers.forEach((trigger) => {
    const panel = trigger.nextElementSibling;

    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';

      // Close all others (single-open accordion reads calmer on an editorial list)
      serviceTriggers.forEach((otherTrigger) => {
        if (otherTrigger !== trigger) {
          otherTrigger.setAttribute('aria-expanded', 'false');
          otherTrigger.nextElementSibling.style.maxHeight = null;
        }
      });

      if (isOpen) {
        trigger.setAttribute('aria-expanded', 'false');
        panel.style.maxHeight = null;
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  /* ---------- 13. Trust counters — count-up on view ---------- */
  const countTargets = document.querySelectorAll('[data-count-to]');

  function animateCount(el) {
    const target = parseInt(el.dataset.countTo, 10);
    const suffix = el.dataset.suffix || '';

    if (prefersReducedMotion) {
      el.textContent = target + suffix;
      return;
    }

    const duration = 1400;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = current + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  if (countTargets.length && 'IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    countTargets.forEach((el) => countObserver.observe(el));
  } else {
    countTargets.forEach((el) => animateCount(el));
  }

  /* ---------- 14. Magnetic buttons ----------
     MAGNETIC BUTTON animation.
     Max movement: 6-10px. Duration: 300ms. Easing: cubic-bezier(0.16,1,0.3,1).
     Disabled entirely on touch devices.
  --------------------------------------------------------------------- */
  if (!isTouchDevice && !prefersReducedMotion) {
    const magneticEls = document.querySelectorAll('[data-magnetic]');
    const MAX_MOVE = 8;

    magneticEls.forEach((el) => {
      el.style.transition = `transform 300ms cubic-bezier(0.16,1,0.3,1)`;

      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        const relY = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `translate(${relX * MAX_MOVE * 2}px, ${relY * MAX_MOVE * 2}px)`;
      });

      el.addEventListener('pointerleave', () => {
        el.style.transform = 'translate(0, 0)';
      });
    });
  }

  /* ---------- 15. Architectural parallax (subtle, large hero/showroom images) ----------
     Max offset: 20-40px. rAF-driven, transform only.
  --------------------------------------------------------------------------------- */
  if (!prefersReducedMotion) {
    const parallaxTargets = document.querySelectorAll('.hero__image, .showroom__scene img, .final-cta__scene img');
    let parallaxTicking = false;

    function updateParallax() {
      const viewportH = window.innerHeight;
      parallaxTargets.forEach((el) => {
        const rect = el.parentElement.getBoundingClientRect();
        const centerOffset = (rect.top + rect.height / 2) - viewportH / 2;
        const offset = Math.max(-30, Math.min(30, centerOffset * 0.04));
        el.style.transform = `translateY(${offset}px) scale(1.06)`;
      });
      parallaxTicking = false;
    }

    window.addEventListener('scroll', () => {
      if (!parallaxTicking) {
        parallaxTicking = true;
        requestAnimationFrame(updateParallax);
      }
    }, { passive: true });

    updateParallax();
  }

  /* ---------- 20. Detail / contact modal ---------- */
  const modals = document.querySelectorAll('[data-modal]');
  if (modals.length) {
    let lastFocused = null;

    function openModal(modal, trigger) {
      if (!modal) return;

      if (trigger && trigger.hasAttribute('data-detail-title')) {
        const titleEl = modal.querySelector('[data-modal-title]');
        const eyebrowEl = modal.querySelector('[data-modal-eyebrow]');
        const metaEl = modal.querySelector('[data-modal-meta]');
        const bodyEl = modal.querySelector('[data-modal-body]');
        const imageEl = modal.querySelector('[data-modal-image]');

        if (titleEl) titleEl.textContent = trigger.getAttribute('data-detail-title') || '';
        if (eyebrowEl) eyebrowEl.textContent = trigger.getAttribute('data-detail-eyebrow') || '';
        if (metaEl) metaEl.textContent = trigger.getAttribute('data-detail-meta') || '';
        if (bodyEl) bodyEl.textContent = trigger.getAttribute('data-detail-body') || '';

        const imageSrc = trigger.getAttribute('data-detail-image');
        if (imageEl) {
          if (imageSrc) {
            imageEl.src = imageSrc;
            imageEl.alt = trigger.getAttribute('data-detail-title') || '';
            imageEl.hidden = false;
          } else {
            imageEl.hidden = true;
            imageEl.removeAttribute('src');
          }
        }
      }

      lastFocused = document.activeElement;
      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add('is-open'));
      document.body.classList.add('modal-open');

      const closeBtn = modal.querySelector('.detail-modal__close');
      if (closeBtn) closeBtn.focus();
    }

    function closeModal(modal) {
      if (!modal) return;
      modal.classList.remove('is-open');
      document.body.classList.remove('modal-open');
      window.setTimeout(() => { modal.hidden = true; }, 220);
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    const LONG_PRESS_MS = 500;
    const LONG_PRESS_MOVE_TOLERANCE = 10;

    document.querySelectorAll('[data-open-modal]').forEach((trigger) => {
      // Карточки проектов открывают модалку только по долгому нажатию
      // (обычный тап/клик по карточке проекта ничего не открывает).
      if (trigger.classList.contains('project-card')) {
        let pressTimer = null;
        let longPressFired = false;
        let startX = 0;
        let startY = 0;

        const clearPressTimer = () => {
          if (pressTimer) {
            window.clearTimeout(pressTimer);
            pressTimer = null;
          }
        };

        const startPress = (x, y) => {
          longPressFired = false;
          startX = x;
          startY = y;
          clearPressTimer();
          pressTimer = window.setTimeout(() => {
            longPressFired = true;
            const modal = document.getElementById(trigger.getAttribute('data-open-modal'));
            openModal(modal, trigger);
          }, LONG_PRESS_MS);
        };

        const movePress = (x, y) => {
          if (!pressTimer) return;
          const dx = Math.abs(x - startX);
          const dy = Math.abs(y - startY);
          if (dx > LONG_PRESS_MOVE_TOLERANCE || dy > LONG_PRESS_MOVE_TOLERANCE) {
            clearPressTimer();
          }
        };

        trigger.addEventListener('pointerdown', (e) => {
          startPress(e.clientX, e.clientY);
        });
        trigger.addEventListener('pointermove', (e) => {
          movePress(e.clientX, e.clientY);
        });
        trigger.addEventListener('pointerup', clearPressTimer);
        trigger.addEventListener('pointercancel', clearPressTimer);
        trigger.addEventListener('pointerleave', clearPressTimer);

        // Блокируем обычный клик (короткий тап) — он не должен открывать модалку.
        // Долгое нажатие уже открыло модалку через pointerdown-таймер выше,
        // так что клик, идущий следом, просто ничего не делает.
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
        });

        // Блокируем системное контекстное меню на долгом тапе (мобильные браузеры)
        trigger.addEventListener('contextmenu', (e) => e.preventDefault());

        return;
      }

      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = document.getElementById(trigger.getAttribute('data-open-modal'));
        openModal(modal, trigger);
      });
    });

    modals.forEach((modal) => {
      modal.querySelectorAll('[data-modal-close]').forEach((closer) => {
        closer.addEventListener('click', () => closeModal(modal));
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      modals.forEach((modal) => {
        if (!modal.hidden) closeModal(modal);
      });
    });
  }

})();
