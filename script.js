window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('loader-hidden');
      document.body.classList.add('loaded');
      setTimeout(() => { preloader.style.display = 'none'; }, 500);
    }, 900);
  } else {
    document.body.classList.add('loaded');
  }
});

(function initHeroDepthText() {
  const MAX_LAYERS = 64;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const getTransform = (rotateX, rotateY) => `rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg)`;
  const getLayerColor = (faceColor, depthColor, index, total) => {
    const progress = total <= 1 ? 1 : index / total;
    const eased = progress * progress;
    const faceMix = Math.round((1 - eased) * 40 + 10);
    return `color-mix(in srgb, ${faceColor} ${faceMix}%, ${depthColor})`;
  };

  const boot = () => {
    const root = document.getElementById('hero-depth-text');
    const stage = document.getElementById('hero-depth-stage');
    const face = stage?.querySelector('.depth-text__face');
    if (!root || !stage || !face) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const safeLayers = clamp(isMobile ? 12 : 28, 2, MAX_LAYERS);
    const safeDepth = isMobile ? 1.15 : 2.1;
    const safeTilt = isMobile ? 7 : 7.5;
    const safeSmoothing = isMobile ? 0.06 : 0.14;
    const safeOrbitSpeed = 0.1;
    const faceColor = '#f8fafc';
    const depthColor = '#009739';
    const baseRotation = { x: -safeTilt * 0.32, y: safeTilt * 0.42 };

    root.style.setProperty('--depth-text-perspective', '900px');
    const stages = root.querySelectorAll('.depth-text__stage');
    stages.forEach((inner) => {
      const paneFace = inner.querySelector('.depth-text__face');
      if (!paneFace) return;
      const label = paneFace.textContent.trim();
      inner.querySelectorAll('.depth-text__layer').forEach((el) => el.remove());
      const frag = document.createDocumentFragment();
      for (let layerIndex = 0; layerIndex < safeLayers; layerIndex += 1) {
        const index = safeLayers - layerIndex;
        const layer = document.createElement('span');
        layer.className = 'depth-text__layer';
        layer.setAttribute('aria-hidden', 'true');
        layer.textContent = label;
        layer.style.color = getLayerColor(faceColor, depthColor, index, safeLayers);
        layer.style.transform = `translateZ(${-index * safeDepth}px)`;
        frag.appendChild(layer);
      }
      inner.insertBefore(frag, paneFace);
    });
    const applyTilt = (value) => {
      stages.forEach((inner) => { inner.style.transform = value; });
    };

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const canTrackPointer = finePointer && !reducedMotion;

    const subtitle = document.getElementById('hero-subtitle');
    const swoosh = document.querySelector('.pl-swoosh');
    const namePane = document.getElementById('zip-name');
    const numberPane = document.getElementById('zip-number');
    const setSubtitle = (showingName) => {
      root.setAttribute('aria-label', showingName ? 'ALEX MADUREIRA' : '22777');
      if (subtitle) subtitle.textContent = showingName ? 'DEPUTADO' : 'ALEX MADUREIRA · DEPUTADO';
    };

    if (reducedMotion || !namePane || !numberPane || !swoosh) {
      applyTilt(getTransform(baseRotation.x, baseRotation.y));
      return;
    }

    let frameId = 0;
    let activePointer = false;
    const startTime = performance.now();
    const current = { ...baseRotation };
    const target = { ...baseRotation };

    const handlePointerMove = (event) => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      activePointer = true;
      const x = clamp((event.clientX - (rect.left + rect.width / 2)) / (rect.width * 0.8), -1, 1);
      const y = clamp((event.clientY - (rect.top + rect.height / 2)) / (rect.height * 0.8), -1, 1);
      target.x = baseRotation.x - y * safeTilt;
      target.y = baseRotation.y + x * safeTilt;
    };

    const handlePointerLeave = () => {
      activePointer = false;
      target.x = baseRotation.x;
      target.y = baseRotation.y;
    };

    if (canTrackPointer) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerleave', handlePointerLeave);
      window.addEventListener('blur', handlePointerLeave);
    }

    const tick = (now) => {
      if (!canTrackPointer || !activePointer) {
        const elapsed = (now - startTime) / 1000;
        const orbit = elapsed * safeOrbitSpeed * Math.PI * 2;
        const tilt = isMobile ? safeTilt : 12;
        const lookDown = Math.sin(orbit);
        const lookSide = Math.sin(orbit - Math.PI / 2);
        target.x = lookDown * tilt;
        target.y = lookSide * tilt * 0.85;
      }

      current.x += (target.x - current.x) * safeSmoothing;
      current.y += (target.y - current.y) * safeSmoothing;
      applyTilt(getTransform(current.x, current.y));
      frameId = requestAnimationFrame(tick);
    };

    applyTilt(getTransform(current.x, current.y));
    frameId = requestAnimationFrame(tick);

    let alive = true;
    window.addEventListener('pagehide', () => {
      alive = false;
      cancelAnimationFrame(frameId);
    }, { once: true });

    const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const ZIP_MS = 1850;
    const zipEase = 'cubic-bezier(0.45, 0.02, 0.2, 1)';

    const runZip = async (from, to, logoClass) => {
      namePane.style.visibility = 'visible';
      numberPane.style.visibility = 'visible';
      stage.style.setProperty('--zip', from);
      stage.classList.add('is-zipping');
      swoosh.classList.remove('is-go-right', 'is-go-left');
      void swoosh.offsetWidth;
      swoosh.classList.add(logoClass);
      const anim = stage.animate(
        [{ '--zip': from }, { '--zip': to }],
        { duration: ZIP_MS, easing: zipEase, fill: 'forwards' }
      );
      const subtitleTimer = wait(ZIP_MS * 0.46).then(() => {
        if (alive) setSubtitle(to === '0%');
      });
      await Promise.all([anim.finished.catch(() => {}), subtitleTimer]);
      if (!alive) return;
      if (to === '100%') namePane.style.visibility = 'hidden';
      else numberPane.style.visibility = 'hidden';
      stage.classList.remove('is-zipping');
      anim.cancel();
      swoosh.classList.remove(logoClass);
    };

    const cycleIdentity = async () => {
      setSubtitle(true);
      while (alive) {
        await wait(3400);
        if (!alive) return;
        await runZip('0%', '100%', 'is-go-right');
        if (!alive) return;
        await wait(4000);
        if (!alive) return;
        await runZip('100%', '0%', 'is-go-left');
      }
    };
    cycleIdentity();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

const navMenu = document.getElementById('navMenu');
const menuIcon = document.querySelector('.menu-toggle i');

function toggleMenu() {
  navMenu.classList.toggle('active');
  const open = navMenu.classList.contains('active');
  document.querySelector('.navbar')?.classList.toggle('menu-open', open);
  document.body.classList.toggle('no-scroll', open);
  if (open) {
    menuIcon.classList.remove('fa-bars');
    menuIcon.classList.add('fa-times');
  } else {
    menuIcon.classList.remove('fa-times');
    menuIcon.classList.add('fa-bars');
  }
}

function closeMenu() {
  navMenu.classList.remove('active');
  document.querySelector('.navbar')?.classList.remove('menu-open');
  document.body.classList.remove('no-scroll');
  menuIcon.classList.remove('fa-times');
  menuIcon.classList.add('fa-bars');
}

(function bindNavbarScroll() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  let lastY = window.scrollY;
  const darkHeader = document.querySelector('.hero');
  const update = () => {
    const y = window.scrollY;
    const menuOpen = navMenu?.classList.contains('active');
    const headerEnd = darkHeader ? darkHeader.offsetTop + darkHeader.offsetHeight : 80;
    const onLight = y > headerEnd - 72;
    nav.classList.toggle('nav-on-light', onLight);
    nav.classList.toggle('nav-hidden', !menuOpen && y > lastY && y > 90);
    lastY = y;
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

document.addEventListener('DOMContentLoaded', () => {
  const heroVideoContainer = document.querySelector('.video-background');
  if (heroVideoContainer) {
    window.addEventListener('scroll', () => {
      if (window.scrollY < window.innerHeight) {
        heroVideoContainer.style.transform = `translateY(${window.scrollY * 0.3}px)`;
      }
    });
  }

  const heroVideos = [
    'assets/paiva.mp4',
    'assets/paulinho.mp4',
    'assets/gm.mp4',
    'assets/lipi.mp4',
    'assets/cbzinho.mp4',
    'assets/nath.mp4',
    'assets/lemos.mp4',
    'assets/j9.mp4',
    'assets/GPDAZL.mp4',
    'assets/blk.mp4',
    'assets/MARCHI.mp4'
  ];
  const video1 = document.getElementById('bg-video-1');
  const video2 = document.getElementById('bg-video-2');
  if (video1 && video2 && heroVideos.length > 0) {
    let currentVideoIndex = 0;
    let nextVideoIndex = 1;
    video1.muted = true;
    video2.muted = true;
    video1.removeAttribute('autoplay');
    video2.removeAttribute('autoplay');
    video1.setAttribute('playsinline', '');
    video2.setAttribute('playsinline', '');

    video1.src = heroVideos[currentVideoIndex];
    video1.load();
    video1.play().catch((e) => console.warn('Play bloqueado:', e));
    video1.classList.add('active');

    video2.src = heroVideos[nextVideoIndex];
    video2.load();

    const handleVideoEnd = (activeVid, hiddenVid) => {
      hiddenVid.play().then(() => {
        activeVid.classList.remove('active');
        hiddenVid.classList.add('active');
        activeVid.pause();
        activeVid.currentTime = 0;
        currentVideoIndex = nextVideoIndex;
        nextVideoIndex = (nextVideoIndex + 1) % heroVideos.length;
        setTimeout(() => {
          activeVid.src = heroVideos[nextVideoIndex];
          activeVid.load();
        }, 300);
      }).catch((err) => console.error('Erro no corte de vídeo:', err));
    };

    video1.addEventListener('ended', () => handleVideoEnd(video1, video2));
    video2.addEventListener('ended', () => handleVideoEnd(video2, video1));
  }
});
