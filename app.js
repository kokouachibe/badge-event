/**
 * BadgeEvent – Core Application Logic
 * Handles photo upload, canvas rendering, frame selection, and download
 */

/* =============================================
   STATE MANAGEMENT
   ============================================= */
const state = {
  photo: null,          // HTMLImageElement of user photo
  frame: null,          // HTMLImageElement of selected frame
  zoom: 100,            // Photo zoom percentage
  posX: 0,              // Photo X offset
  posY: 0,              // Photo Y offset
  name: '',             // User name text
  showName: true,       // Whether to display name
  frameIndex: 0,        // Selected built-in frame index
  canvasReady: false,   // Whether canvas has been drawn
};

/* =============================================
   BUILT-IN FRAMES (generated as canvas-drawn frames)
   ============================================= */
const BUILT_IN_FRAMES = [
  {
    name: 'Bleu Royal',
    tag: 'Concert',
    colors: ['#2563eb', '#38bdf8'],
    pattern: 'royal',
  },
  {
    name: 'Nuit Électro',
    tag: 'Soirée',
    colors: ['#1d4ed8', '#06b6d4'],
    pattern: 'electro',
  },
  {
    name: 'Festival',
    tag: 'Festival',
    colors: ['#0ea5e9', '#818cf8'],
    pattern: 'festival',
  },
  {
    name: 'Sportif',
    tag: 'Sport',
    colors: ['#2563eb', '#0ea5e9'],
    pattern: 'sport',
  },
  {
    name: 'Gala',
    tag: 'Gala',
    colors: ['#38bdf8', '#1d4ed8'],
    pattern: 'gala',
  },
  {
    name: 'Culturel',
    tag: 'Culture',
    colors: ['#6366f1', '#06b6d4'],
    pattern: 'culture',
  },
];

/* =============================================
   INITIALIZATION
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initParticles();
  initFrames();
  initScrollReveal();
  animateStats();
});

/* =============================================
   NAVBAR
   ============================================= */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('open');
}

function scrollToGenerator() {
  document.getElementById('generator').scrollIntoView({ behavior: 'smooth' });
}

/* =============================================
   PARTICLES
   ============================================= */
function initParticles() {
  const container = document.getElementById('particles');
  const count = 40;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    p.style.left = `${Math.random() * 100}%`;
    p.style.width = `${Math.random() * 3 + 1}px`;
    p.style.height = p.style.width;
    p.style.animationDuration = `${Math.random() * 15 + 8}s`;
    p.style.animationDelay = `-${Math.random() * 15}s`;
    p.style.opacity = Math.random() * 0.6 + 0.1;
    p.style.background = Math.random() > 0.5
      ? 'rgba(37,99,235,0.9)'
      : Math.random() > 0.5
        ? 'rgba(56,189,248,0.9)'
        : 'rgba(255,255,255,0.5)';
    container.appendChild(p);
  }
}

/* =============================================
   STATS COUNTER ANIMATION
   ============================================= */
function animateStats() {
  const statEls = document.querySelectorAll('.stat-number[data-target]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statEls.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 1500;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);

    if (target >= 10000) {
      el.textContent = current >= 1000
        ? `${(current / 1000).toFixed(0)}k+`
        : current;
    } else {
      el.textContent = current + (progress < 1 ? '' : target < 100 ? 's' : '+');
    }

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/* =============================================
   SCROLL REVEAL
   ============================================= */
function initScrollReveal() {
  const revealEls = document.querySelectorAll('.step-card, .faq-item, .showcase-card, .control-card');
  revealEls.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 4) * 0.1}s`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* =============================================
   FRAMES INITIALIZATION
   ============================================= */
function initFrames() {
  const framesGrid = document.getElementById('framesGrid');
  const showcaseGrid = document.getElementById('showcaseGrid');

  // Generate canvas-based frames
  BUILT_IN_FRAMES.forEach((frame, index) => {
    const frameCanvas = generateFrameCanvas(frame, 200);
    const dataURL = frameCanvas.toDataURL('image/png');

    // Add to control panel grid
    const div = document.createElement('div');
    div.className = `frame-option ${index === 0 ? 'active' : ''}`;
    div.dataset.index = index;
    div.innerHTML = `
      <img src="${dataURL}" alt="${frame.name}" />
      <span class="frame-option-label">${frame.name}</span>
    `;
    div.addEventListener('click', () => selectFrame(index, dataURL, div));
    framesGrid.appendChild(div);

    // Add to showcase grid
    const card = document.createElement('div');
    card.className = 'showcase-card reveal';
    card.innerHTML = `
      <div class="showcase-card-img">
        <img src="${dataURL}" alt="${frame.name}" />
        <div class="showcase-card-overlay">
          <button class="btn btn-primary" onclick="selectFrameFromShowcase(${index}, '${dataURL}')">
            Utiliser ce cadre
          </button>
        </div>
      </div>
      <div class="showcase-card-info">
        <div class="showcase-card-name">${frame.name}</div>
        <div class="showcase-card-tag">${frame.tag}</div>
      </div>
    `;
    showcaseGrid.appendChild(card);
  });

  // Load first frame by default
  loadFirstFrame();
}

function loadFirstFrame() {
  const firstFrame = BUILT_IN_FRAMES[0];
  const frameCanvas = generateFrameCanvas(firstFrame, 1000);
  const img = new Image();
  img.src = frameCanvas.toDataURL('image/png');
  img.onload = () => {
    state.frame = img;
    state.frameIndex = 0;
  };
}

function selectFrame(index, dataURL, clickedEl) {
  // Update UI
  document.querySelectorAll('.frame-option').forEach(el => el.classList.remove('active'));
  clickedEl.classList.add('active');

  // Load frame
  const frame = BUILT_IN_FRAMES[index];
  const frameCanvas = generateFrameCanvas(frame, 1000);
  const img = new Image();
  img.src = frameCanvas.toDataURL('image/png');
  img.onload = () => {
    state.frame = img;
    state.frameIndex = index;
    updateBadgePreview();
  };
}

function selectFrameFromShowcase(index, dataURL) {
  const frame = BUILT_IN_FRAMES[index];
  const frameCanvas = generateFrameCanvas(frame, 1000);
  const img = new Image();
  img.src = frameCanvas.toDataURL('image/png');
  img.onload = () => {
    state.frame = img;
    state.frameIndex = index;
    updateBadgePreview();
  };

  // Update frame selector
  document.querySelectorAll('.frame-option').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });

  // Scroll to generator
  scrollToGenerator();
  showToast('Cadre sélectionné !', 'Cadre appliqué à votre badge.');
}

/* =============================================
   FRAME CANVAS GENERATOR
   Creates beautiful event badge frames programmatically
   ============================================= */
function generateFrameCanvas(frame, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  // Clear
  ctx.clearRect(0, 0, size, size);

  const [c1, c2] = frame.colors;

  switch (frame.pattern) {
    case 'royal':
      drawRoyalFrame(ctx, cx, cy, r, c1, c2, frame.name, size);
      break;
    case 'electro':
      drawElectroFrame(ctx, cx, cy, r, c1, c2, frame.name, size);
      break;
    case 'festival':
      drawFestivalFrame(ctx, cx, cy, r, c1, c2, frame.name, size);
      break;
    case 'sport':
      drawSportFrame(ctx, cx, cy, r, c1, c2, frame.name, size);
      break;
    case 'gala':
      drawGalaFrame(ctx, cx, cy, r, c1, c2, frame.name, size);
      break;
    case 'culture':
      drawCultureFrame(ctx, cx, cy, r, c1, c2, frame.name, size);
      break;
  }

  return canvas;
}

function drawRoyalFrame(ctx, cx, cy, r, c1, c2, name, size) {
  const s = size;

  // Outer gradient background
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  bg.addColorStop(0, '#020c24');
  bg.addColorStop(1, '#010614');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Outer decorative ring
  for (let i = 0; i < 3; i++) {
    const ringR = r * (0.98 - i * 0.018);
    const grad = ctx.createLinearGradient(0, 0, s, s);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.strokeStyle = grad;
    ctx.lineWidth = s * (0.012 - i * 0.003);
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Star decorations
  const starPositions = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const sr = r * 0.88;
    starPositions.push({ x: cx + Math.cos(angle) * sr, y: cy + Math.sin(angle) * sr });
  }

  starPositions.forEach(({ x, y }) => {
    drawStar(ctx, x, y, s * 0.025, s * 0.012, 5, c1);
  });

  // Photo area clip (transparent circle in center)
  const photoR = r * 0.62;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, photoR, 0, Math.PI * 2);
  ctx.clip();
  ctx.clearRect(0, 0, s, s);
  ctx.restore();

  // Inner ring around photo area
  const innerGrad = ctx.createLinearGradient(0, 0, s, s);
  innerGrad.addColorStop(0, c1);
  innerGrad.addColorStop(0.5, c2);
  innerGrad.addColorStop(1, c1);
  ctx.strokeStyle = innerGrad;
  ctx.lineWidth = s * 0.015;
  ctx.beginPath();
  ctx.arc(cx, cy, photoR + s * 0.02, 0, Math.PI * 2);
  ctx.stroke();

  // Bottom banner
  const bannerHeight = s * 0.18;
  const bannerY = s * 0.75;
  const bannerGrad = ctx.createLinearGradient(0, bannerY, s, bannerY + bannerHeight);
  bannerGrad.addColorStop(0, hexToRgba(c1, 0.9));
  bannerGrad.addColorStop(1, hexToRgba(c2, 0.9));
  ctx.fillStyle = bannerGrad;

  // Curved banner
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.99, 0.05 * Math.PI, 0.95 * Math.PI);
  ctx.lineTo(cx - r * 0.99, cy);
  ctx.arc(cx, cy, r * 0.99, Math.PI, 0.05 * Math.PI, true);
  ctx.closePath();
  ctx.clip();

  ctx.beginPath();
  ctx.arc(cx, cy * 2.4, r * 1.2, 0, Math.PI * 2);
  ctx.fillStyle = bannerGrad;
  ctx.fill();
  ctx.restore();

  // Banner text
  const fontSize = s * 0.075;
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${fontSize}px Outfit, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText("J'Y SERAI ✓", cx, s * 0.875);
  ctx.shadowBlur = 0;

  // Event name below
  const subFontSize = s * 0.04;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `600 ${subFontSize}px Outfit, sans-serif`;
  ctx.fillText(name.toUpperCase(), cx, s * 0.93);
}

function drawElectroFrame(ctx, cx, cy, r, c1, c2, name, size) {
  const s = size;

  // Dark background
  const bg = ctx.createRadialGradient(cx, cy * 0.5, 0, cx, cy, r);
  bg.addColorStop(0, '#020c24');
  bg.addColorStop(1, '#01040f');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Neon rings
  [0.97, 0.94, 0.91].forEach((ratio, i) => {
    ctx.strokeStyle = i === 0 ? c1 : i === 1 ? c2 : `rgba(255,255,255,0.3)`;
    ctx.lineWidth = s * (0.008 - i * 0.002);
    ctx.shadowColor = i === 0 ? c1 : c2;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, r * ratio, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.shadowBlur = 0;

  // Dots pattern
  for (let a = 0; a < 360; a += 15) {
    const angle = (a * Math.PI) / 180;
    const dr = r * 0.85;
    const dx = cx + Math.cos(angle) * dr;
    const dy = cy + Math.sin(angle) * dr;
    ctx.fillStyle = a % 30 === 0 ? c1 : 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(dx, dy, s * 0.008, 0, Math.PI * 2);
    ctx.fill();
  }

  // Transparent photo circle
  const photoR = r * 0.6;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, photoR, 0, Math.PI * 2);
  ctx.clip();
  ctx.clearRect(0, 0, s, s);
  ctx.restore();

  // Neon inner ring
  ctx.shadowColor = c1;
  ctx.shadowBlur = 30;
  ctx.strokeStyle = c1;
  ctx.lineWidth = s * 0.012;
  ctx.beginPath();
  ctx.arc(cx, cy, photoR + s * 0.02, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Zigzag bottom section
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.98, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.clip();
  const bottomGrad = ctx.createLinearGradient(0, cy, 0, s);
  bottomGrad.addColorStop(0, hexToRgba(c1, 0.85));
  bottomGrad.addColorStop(1, hexToRgba(c2, 0.85));
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, cy, s, s);
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${s * 0.08}px Outfit, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = c1;
  ctx.shadowBlur = 15;
  ctx.fillText("J'Y SERAI ✓", cx, s * 0.87);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = `600 ${s * 0.038}px Outfit, sans-serif`;
  ctx.fillText(name.toUpperCase(), cx, s * 0.93);
}

function drawFestivalFrame(ctx, cx, cy, r, c1, c2, name, size) {
  const s = size;

  // Warm background
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  bg.addColorStop(0, '#020c24');
  bg.addColorStop(1, '#010814');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Confetti dots
  const confettiColors = [c1, c2, '#818cf8', '#06b6d4', '#38bdf8', '#ffffff'];
  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = r * (0.7 + Math.random() * 0.25);
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    ctx.fillStyle = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    ctx.fillRect(x - 3, y - 3, 6, 4);
  }

  // Main rings
  const grad = ctx.createLinearGradient(0, 0, s, s);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.strokeStyle = grad;
  ctx.lineWidth = s * 0.025;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.97, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = s * 0.008;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.93, 0, Math.PI * 2);
  ctx.stroke();

  // Stars
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const sr = r * 0.87;
    drawStar(ctx, cx + Math.cos(angle) * sr, cy + Math.sin(angle) * sr, s * 0.02, s * 0.01, 5, i % 3 === 0 ? c1 : c2);
  }

  // Photo area
  const photoR = r * 0.61;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, photoR, 0, Math.PI * 2);
  ctx.clip();
  ctx.clearRect(0, 0, s, s);
  ctx.restore();

  ctx.strokeStyle = c1;
  ctx.lineWidth = s * 0.018;
  ctx.shadowColor = c1;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(cx, cy, photoR + s * 0.022, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Bottom
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.98, 0, Math.PI);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.clip();
  const bGrad = ctx.createLinearGradient(0, cy, 0, s);
  bGrad.addColorStop(0, hexToRgba(c1, 0.9));
  bGrad.addColorStop(1, hexToRgba(c2, 0.9));
  ctx.fillStyle = bGrad;
  ctx.fillRect(0, cy, s, s);
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${s * 0.08}px Outfit, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("J'Y SERAI ✓", cx, s * 0.875);

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `600 ${s * 0.038}px Outfit, sans-serif`;
  ctx.fillText(name.toUpperCase(), cx, s * 0.935);
}

function drawSportFrame(ctx, cx, cy, r, c1, c2, name, size) {
  const s = size;
  drawSimpleFrame(ctx, cx, cy, r, c1, c2, name, s, '⚽ J\'Y SERAI ✓', '30 0 0 0 0 s s s 0 0');
}

function drawGalaFrame(ctx, cx, cy, r, c1, c2, name, size) {
  const s = size;
  drawSimpleFrame(ctx, cx, cy, r, c1, c2, name, s, '✨ J\'Y SERAI ✓', null);
}

function drawCultureFrame(ctx, cx, cy, r, c1, c2, name, size) {
  const s = size;
  drawSimpleFrame(ctx, cx, cy, r, c1, c2, name, s, '🎭 J\'Y SERAI ✓', null);
}

function drawSimpleFrame(ctx, cx, cy, r, c1, c2, name, s, label, extra) {
  // Background
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  bg.addColorStop(0, '#020c24');
  bg.addColorStop(1, '#010614');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Outer rings
  for (let i = 0; i < 3; i++) {
    const grad = ctx.createLinearGradient(0, 0, s, s);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.strokeStyle = grad;
    ctx.lineWidth = s * (0.016 - i * 0.004);
    ctx.beginPath();
    ctx.arc(cx, cy, r * (0.98 - i * 0.03), 0, Math.PI * 2);
    ctx.stroke();
  }

  // Dot decorations
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const dr = r * 0.88;
    ctx.fillStyle = i % 3 === 0 ? c1 : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * dr, cy + Math.sin(angle) * dr, s * 0.007, 0, Math.PI * 2);
    ctx.fill();
  }

  // Photo area
  const photoR = r * 0.62;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, photoR, 0, Math.PI * 2);
  ctx.clip();
  ctx.clearRect(0, 0, s, s);
  ctx.restore();

  ctx.strokeStyle = c1;
  ctx.lineWidth = s * 0.016;
  ctx.beginPath();
  ctx.arc(cx, cy, photoR + s * 0.02, 0, Math.PI * 2);
  ctx.stroke();

  // Bottom banner
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.99, 0, Math.PI);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.clip();
  const bGrad = ctx.createLinearGradient(0, cy, 0, s);
  bGrad.addColorStop(0, hexToRgba(c1, 0.92));
  bGrad.addColorStop(1, hexToRgba(c2, 0.92));
  ctx.fillStyle = bGrad;
  ctx.fillRect(0, cy, s, s);
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${s * 0.075}px Outfit, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label || "J'Y SERAI ✓", cx, s * 0.875);

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `600 ${s * 0.038}px Outfit, sans-serif`;
  ctx.fillText(name.toUpperCase(), cx, s * 0.935);
}

/* ===== Helper: Draw Star ===== */
function drawStar(ctx, x, y, outerR, innerR, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? outerR : innerR;
    if (i === 0) ctx.moveTo(x + Math.cos(angle) * rr, y + Math.sin(angle) * rr);
    else ctx.lineTo(x + Math.cos(angle) * rr, y + Math.sin(angle) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

/* ===== Helper: Hex to RGBA ===== */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* =============================================
   PHOTO UPLOAD
   ============================================= */
function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  loadPhotoFile(file);
}

function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    loadPhotoFile(file);
  }
}

function loadPhotoFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    showToast('Fichier trop volumineux', 'La taille maximale est de 10 Mo.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state.photo = img;
      // Show controls
      document.getElementById('photoControls').style.display = 'flex';
      document.getElementById('uploadZone').innerHTML = `
        <div class="upload-success">
          <div style="font-size:2.5rem">📸</div>
          <p style="font-weight:600;margin:0.5rem 0">Photo chargée !</p>
          <p style="font-size:0.8rem;color:var(--txt-muted)">${file.name}</p>
          <button class="btn btn-ghost btn-sm" style="margin-top:0.5rem" onclick="document.getElementById('photoInput').click()">
            Changer de photo
          </button>
        </div>
      `;
      updateBadgePreview();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* =============================================
   FRAME UPLOAD
   ============================================= */
function handleFrameUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state.frame = img;
      // Deselect built-in frames
      document.querySelectorAll('.frame-option').forEach(el => el.classList.remove('active'));
      updateBadgePreview();
      showToast('Cadre chargé !', 'Votre cadre personnalisé a été appliqué.');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* =============================================
   PHOTO ADJUSTMENTS
   ============================================= */
function updateZoom(value) {
  state.zoom = parseInt(value);
  document.getElementById('zoomValue').textContent = `${value}%`;
  updateBadgePreview();
}

function updatePosX(value) {
  state.posX = parseInt(value);
  document.getElementById('posXValue').textContent = value;
  updateBadgePreview();
}

function updatePosY(value) {
  state.posY = parseInt(value);
  document.getElementById('posYValue').textContent = value;
  updateBadgePreview();
}

function resetPhotoAdjustments() {
  state.zoom = 100;
  state.posX = 0;
  state.posY = 0;
  document.getElementById('zoomSlider').value = 100;
  document.getElementById('posXSlider').value = 0;
  document.getElementById('posYSlider').value = 0;
  document.getElementById('zoomValue').textContent = '100%';
  document.getElementById('posXValue').textContent = '0';
  document.getElementById('posYValue').textContent = '0';
  updateBadgePreview();
}

/* =============================================
   BADGE PREVIEW – Main Render Function
   ============================================= */
function updateBadgePreview() {
  state.name = document.getElementById('nameInput')?.value || '';
  state.showName = document.getElementById('showNameToggle')?.checked ?? true;

  if (!state.photo && !state.frame) return;

  const canvas = document.getElementById('badgeCanvas');
  const placeholder = document.getElementById('canvasPlaceholder');
  const ctx = canvas.getContext('2d');
  const size = 1000;

  // Show canvas
  canvas.style.display = 'block';
  placeholder.style.display = 'none';

  ctx.clearRect(0, 0, size, size);

  const frame = state.frame || BUILT_IN_FRAMES[0];

  // 1. Draw photo in circular area
  if (state.photo) {
    const photoR = size * 0.31; // radius of the photo circle in frame
    const photoCX = size / 2;
    const photoCY = size / 2 - size * 0.02;

    ctx.save();
    ctx.beginPath();
    ctx.arc(photoCX, photoCY, photoR, 0, Math.PI * 2);
    ctx.clip();

    // Scale & position photo
    const zoom = state.zoom / 100;
    const ph = state.photo;
    const minDim = Math.min(ph.width, ph.height);
    const scale = (photoR * 2 * zoom) / minDim;
    const imgW = ph.width * scale;
    const imgH = ph.height * scale;
    const imgX = photoCX - imgW / 2 + state.posX;
    const imgY = photoCY - imgH / 2 + state.posY;

    ctx.drawImage(ph, imgX, imgY, imgW, imgH);
    ctx.restore();
  }

  // 2. Draw frame overlay
  if (state.frame) {
    ctx.drawImage(state.frame, 0, 0, size, size);
  } else {
    // Draw default frame
    const frameCanvas = generateFrameCanvas(BUILT_IN_FRAMES[state.frameIndex], size);
    ctx.drawImage(frameCanvas, 0, 0, size, size);
  }

  // 3. Draw name text if enabled
  if (state.showName && state.name.trim()) {
    const nameFontSize = size * 0.055;
    ctx.save();

    // Text background pill
    ctx.font = `700 ${nameFontSize}px Outfit, sans-serif`;
    ctx.textAlign = 'center';
    const textWidth = ctx.measureText(state.name).width;
    const pillW = textWidth + size * 0.08;
    const pillH = nameFontSize * 1.5;
    const pillX = size / 2 - pillW / 2;
    const pillY = size * 0.02;

    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.name, size / 2, pillY + pillH / 2);
    ctx.restore();
  }

  // Enable download button
  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn.disabled = !state.photo;
  state.canvasReady = !!state.photo;

  if (state.photo) {
    document.getElementById('shareButtons').style.display = 'block';
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* =============================================
   DOWNLOAD
   ============================================= */
function downloadBadge() {
  if (!state.canvasReady) return;

  const canvas = document.getElementById('badgeCanvas');
  const link = document.createElement('a');

  // Generate filename
  const name = state.name ? state.name.replace(/\s+/g, '_') : 'badge';
  const frame = BUILT_IN_FRAMES[state.frameIndex]?.name.replace(/\s+/g, '_') || 'badge';
  link.download = `badge_${name}_${frame}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();

  showToast('Badge téléchargé ! 🎉', 'Votre badge a été sauvegardé avec succès.');

  // Animate button
  const btn = document.getElementById('downloadBtn');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = `<span>✓</span> Téléchargé !`;
  btn.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';
  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.style.background = '';
  }, 2500);
}

/* =============================================
   SHARE FUNCTIONS
   ============================================= */
function shareWhatsApp() {
  const text = encodeURIComponent("Je participe à l'événement ! Créez votre badge sur BadgeEvent 🎭");
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

function shareFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function shareTwitter() {
  const text = encodeURIComponent("Je participe à l'événement ! Créez votre badge sur BadgeEvent 🎭 #JYSerai #BadgeEvent");
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

/* =============================================
   PREVIEW SIZE TOGGLE
   ============================================= */
let previewLarge = false;
function togglePreviewSize() {
  previewLarge = !previewLarge;
  const container = document.getElementById('canvasContainer');
  if (previewLarge) {
    container.style.maxWidth = '700px';
  } else {
    container.style.maxWidth = '';
  }
}

/* =============================================
   FAQ ACCORDION
   ============================================= */
function toggleFaq(button) {
  const item = button.parentElement;
  const isOpen = item.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));

  // Open clicked if it was closed
  if (!isOpen) {
    item.classList.add('open');
  }
}

/* =============================================
   TOAST NOTIFICATIONS
   ============================================= */
function showToast(title, message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMsg = document.getElementById('toastMsg');

  toastTitle.textContent = title;
  toastMsg.textContent = message;

  if (type === 'error') {
    toast.style.background = 'rgba(239, 68, 68, 0.15)';
    toast.style.borderColor = 'rgba(239, 68, 68, 0.4)';
  } else {
    toast.style.background = 'rgba(16, 185, 129, 0.15)';
    toast.style.borderColor = 'rgba(16, 185, 129, 0.4)';
  }

  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

/* =============================================
   ON LOAD – draw preview with frame only
   ============================================= */
window.addEventListener('load', () => {
  // Auto-trigger initial preview with just the frame
  setTimeout(() => {
    const frame = BUILT_IN_FRAMES[0];
    const fc = generateFrameCanvas(frame, 1000);
    const img = new Image();
    img.onload = () => {
      state.frame = img;
      // Show placeholder still - only update when user uploads photo
    };
    img.src = fc.toDataURL('image/png');
  }, 300);
});
