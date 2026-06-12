// home-floating-background.js — canvas floating Lucide icons for home page background
(function initHomeFloatingBackground() {
  const MAX_PARTICLES = 25;
  const REPEL_RADIUS = 120;
  const SINK_RADIUS = 200;
  const ROTATION_SPEED = 0.03;
  const VIEWBOX_SIZE = 24;

  let canvas = null;
  let ctx = null;
  let animationFrameId = null;
  let iconThemes = null;
  let particles = [];
  let appearance = { backgroundMode: 'none', iconTheme: 'mixed' };
  let mouseX = -9999;
  let mouseY = -9999;
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let isDocumentVisible = !document.hidden;

  /**
   * Shuffles array in place (Fisher–Yates).
   * @param {Array} items - Mutable array
   * @returns {Array}
   */
  function shuffleArray(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }
    return items;
  }

  /**
   * Loads icon path data from static JSON asset.
   * @returns {Promise<object>}
   */
  async function loadIconThemes() {
    if (iconThemes) {
      return iconThemes;
    }
    const response = await fetch('/assets/home-icon-themes.json');
    if (!response.ok) {
      throw new Error('home-icon-themes.json not found');
    }
    iconThemes = await response.json();
    return iconThemes;
  }

  /**
   * Picks icon definitions for the active theme.
   * @returns {Array<{ name: string, paths: string[] }>}
   */
  function pickIconsForTheme() {
    if (!iconThemes) {
      return [];
    }
    const themeKeys = ['nature', 'technology', 'tools', 'vehicles'];
    if (appearance.iconTheme === 'mixed') {
      const merged = themeKeys.flatMap((key) => iconThemes[key] || []);
      return shuffleArray([...merged]).slice(0, MAX_PARTICLES);
    }
    return (iconThemes[appearance.iconTheme] || []).slice(0, MAX_PARTICLES);
  }

  /**
   * Resizes canvas to device pixels.
   */
  function resizeCanvas() {
    if (!canvas || !ctx) {
      return;
    }
    const pixelRatio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  /**
   * Creates floating particles from icon definitions.
   */
  function createParticles() {
    const icons = pickIconsForTheme();
    particles = icons.map((icon, index) => ({
      paths: icon.paths,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      baseX: 0,
      baseY: 0,
      driftPhase: Math.random() * Math.PI * 2,
      driftSpeed: 0.004 + Math.random() * 0.003,
      driftAmplitude: 18 + Math.random() * 22,
      rotation: Math.random() * Math.PI * 2,
      size: 28 + Math.random() * 20,
      opacityBase: 0.06 + (index % 5) * 0.008,
      sinkProgress: 0,
      sinkVelocity: 0,
    }));
    for (const particle of particles) {
      particle.baseX = particle.x;
      particle.baseY = particle.y;
    }
  }

  /**
   * Returns stroke opacity for current theme.
   * @param {object} particle - Particle state
   * @returns {number}
   */
  function getParticleOpacity(particle) {
    const isDark = document.body.classList.contains('dark');
    const minOpacity = isDark ? 0.02 : 0.06;
    const maxOpacity = isDark ? 0.04 : 0.1;
    const base = minOpacity + (particle.opacityBase % 1) * (maxOpacity - minOpacity);
    return base * (1 - particle.sinkProgress);
  }

  /**
   * Draws one icon particle on canvas.
   * @param {object} particle - Particle state
   */
  function drawParticle(particle) {
    const opacity = getParticleOpacity(particle);
    if (opacity <= 0.001) {
      return;
    }
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    const scale = particle.size / VIEWBOX_SIZE;
    ctx.scale(scale, scale);
    ctx.translate(-VIEWBOX_SIZE / 2, -VIEWBOX_SIZE / 2);
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = document.body.classList.contains('dark') ? '#94a3b8' : '#475569';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const pathData of particle.paths) {
      ctx.stroke(new Path2D(pathData));
    }
    ctx.restore();
  }

  /**
   * Updates particle positions with drift, repulsion, and sink animation.
   */
  function updateParticles() {
    const time = performance.now() * 0.001;
    for (const particle of particles) {
      const driftX = Math.sin(time * particle.driftSpeed * 60 + particle.driftPhase) * particle.driftAmplitude;
      const driftY = Math.cos(time * particle.driftSpeed * 45 + particle.driftPhase) * particle.driftAmplitude * 0.6;
      let targetX = particle.baseX + driftX;
      let targetY = particle.baseY + driftY;

      const dx = particle.x - mouseX;
      const dy = particle.y - mouseY;
      const distance = Math.hypot(dx, dy);
      if (distance < REPEL_RADIUS && distance > 0.1) {
        const force = (REPEL_RADIUS - distance) / REPEL_RADIUS;
        targetX += (dx / distance) * force * 36;
        targetY += (dy / distance) * force * 36;
      }

      particle.x += (targetX - particle.x) * 0.08;
      particle.y += (targetY - particle.y) * 0.08;
      particle.rotation += ROTATION_SPEED;

      if (particle.sinkVelocity > 0 || particle.sinkProgress > 0) {
        particle.sinkVelocity += 0.02;
        particle.sinkProgress = Math.min(1, particle.sinkProgress + particle.sinkVelocity);
        particle.size *= 0.985;
      }

      if (particle.x < -40) {
        particle.x = window.innerWidth + 40;
        particle.baseX = particle.x;
      }
      if (particle.x > window.innerWidth + 40) {
        particle.x = -40;
        particle.baseX = particle.x;
      }
      if (particle.y < -40) {
        particle.y = window.innerHeight + 40;
        particle.baseY = particle.y;
      }
      if (particle.y > window.innerHeight + 40) {
        particle.y = -40;
        particle.baseY = particle.y;
      }
    }
  }

  /**
   * Main animation frame callback.
   */
  function tick() {
    if (!ctx || !canvas || !isDocumentVisible) {
      animationFrameId = null;
      return;
    }
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    updateParticles();
    for (const particle of particles) {
      drawParticle(particle);
    }
    animationFrameId = window.requestAnimationFrame(tick);
  }

  /**
   * Stops animation loop and clears canvas.
   */
  function stopEngine() {
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    particles = [];
    if (ctx && canvas) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  /**
   * Starts or restarts the floating background when enabled.
   */
  async function startEngine() {
    stopEngine();
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || appearance.backgroundMode !== 'floating-icons' || !canvas || !ctx) {
      return;
    }
    try {
      await loadIconThemes();
    } catch {
      return;
    }
    resizeCanvas();
    createParticles();
    if (!animationFrameId) {
      animationFrameId = window.requestAnimationFrame(tick);
    }
  }

  function onMouseMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
  }

  function onBackgroundClick(event) {
    if (appearance.backgroundMode !== 'floating-icons') {
      return;
    }
    if (event.target.closest('.card, .breadcrumb-list, .admin-menu, button, a, input, select, textarea')) {
      return;
    }
    for (const particle of particles) {
      const distance = Math.hypot(particle.x - event.clientX, particle.y - event.clientY);
      if (distance < SINK_RADIUS) {
        particle.sinkVelocity = 0.03 + (SINK_RADIUS - distance) / SINK_RADIUS * 0.04;
      }
    }
  }

  function onVisibilityChange() {
    isDocumentVisible = !document.hidden;
    if (!isDocumentVisible) {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      return;
    }
    if (appearance.backgroundMode === 'floating-icons' && !reducedMotion) {
      animationFrameId = window.requestAnimationFrame(tick);
    }
  }

  window.HomeFloatingBackground = {
    init() {
      canvas = document.getElementById('homeFloatingCanvas');
      if (!canvas) {
        return;
      }
      ctx = canvas.getContext('2d');
      window.addEventListener('resize', resizeCanvas);
      document.addEventListener('mousemove', onMouseMove, { passive: true });
      document.addEventListener('click', onBackgroundClick);
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
        void startEngine();
      });
    },

    updateAppearance(nextAppearance) {
      appearance = {
        backgroundMode: nextAppearance?.backgroundMode || 'none',
        iconTheme: nextAppearance?.iconTheme || 'mixed',
      };
      void startEngine();
    },

    updateTheme() {
      // Opacity recalculated each frame from body.dark
    },

    destroy() {
      stopEngine();
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('click', onBackgroundClick);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    },
  };
})();
