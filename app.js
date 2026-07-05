/**
 * BadgeEvent – Core Application Logic
 * Handles photo upload, canvas rendering, frame selection, download,
 * multiple texts, organizer settings, drag & drop, and auto-increment.
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
  nameColor: '#ffffff',
  nameSize: 55,
  nameFont: 'Arial Bold',
  nameX: 500,
  nameY: 850,
  texts: [],            // Array of custom text blocks
  frameIndex: 0,        // Selected built-in frame index
  canvasReady: false,   // Whether canvas has been drawn

  // Participant Campaign specifics
  isParticipantMode: false,
  campaignData: null,
  showNumber: false,
  numberPrefix: 'Participant N°',
  currentNumber: 1,
  numberX: 500,
  numberY: 910,
  numberSize: 45,
  numberColor: '#38bdf8',
  numberFont: 'Arial Bold'
};

const orgState = {
  eventName: '',
  description: '',
  startDate: '',
  endDate: '',
  venue: '',
  frame: null,
  frameBase64: '',
  frameBase64Original: '', // backup high resolution
  frameMode: 'built-in',
  frameKey: '',
  redirectUrl: '',
  collectEmail: false,
  whatsappReminder: false,
  showNameOnBadge: true,
  nameX: 500,
  nameY: 850,
  nameSize: 55,
  nameColor: '#ffffff',
  nameFont: 'Arial Bold',
  showNumberOnBadge: false,
  numberX: 500,
  numberY: 910,
  numberSize: 45,
  numberColor: '#38bdf8',
  numberFont: 'Arial Bold',
  numberPrefix: 'Participant N°',
  startNumber: 1
};

let activeDrag = null;    // drag state for badge generator canvas
let orgActiveDrag = null; // drag state for organizer canvas

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
  
  // Drag & drop setups
  initCanvasDrag();
  initOrgCanvasDrag();
  
  // Drag setup on participant overlay canvas
  initParticipantOverlayCanvasDrag();
  
  // Check if URL has query parameters for campaign
  checkUrlParameters();
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

function scrollToOrganizer() {
  document.getElementById('organizer').scrollIntoView({ behavior: 'smooth' });
}

/* =============================================
   PARTICLES
   ============================================= */
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
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
  if (!framesGrid || !showcaseGrid) return;

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
  const hasCampaign = window.location.hash.startsWith('#event=')
                   || window.location.hash.startsWith('#id=')
                   || window.location.hash.startsWith('#lid=');
  if (hasCampaign) return; // Skip loading default built-in frame if in campaign mode

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
  orgState.frameMode = 'built-in';
  orgState.frameKey = frame.pattern;
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
  orgState.frameMode = 'built-in';
  orgState.frameKey = frame.pattern;
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

  // Photo area (transparent circle in center)
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
  drawSimpleFrame(ctx, cx, cy, r, c1, c2, name, s, '⚽ J\'Y SERAI ✓', null);
}

function drawGalaFrame(ctx, cx, cy, r, c1, c2, name, size) {
  const s = size;
  drawSimpleFrame(ctx, cx, cy, r, c1, c2, name, s, '✨ J\'Y SERAI ✓', null);
}

function drawCultureFrame(ctx, cx, cy, r, c1, c2, name, size) {
  const s = size;
  drawSimpleFrame(ctx, cx, cy, r, c1, c2, name, s, '🎭 J\'Y SERAI ✓', null);
}

function drawSimpleFrame(ctx, cx, cy, r, c1, c2, name, s, label) {
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
   PHOTO ADJUSTMENTS (Participant General)
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
  state.nameColor = document.getElementById('nameColor')?.value || '#ffffff';
  state.nameSize = parseInt(document.getElementById('nameSize')?.value) || 55;
  state.nameFont = document.getElementById('nameFont')?.value || 'Arial Bold';

  if (!state.photo && !state.frame) return;

  const canvas = document.getElementById('badgeCanvas');
  const placeholder = document.getElementById('canvasPlaceholder');
  const ctx = canvas.getContext('2d');
  const size = 1000;

  // Show canvas
  canvas.style.display = 'block';
  placeholder.style.display = 'none';

  ctx.clearRect(0, 0, size, size);

  // 1. Draw photo in background (NO circular clip for custom/organizer frames!)
  if (state.photo) {
    const ph = state.photo;
    const cx = size / 2;
    const cy = size / 2;

    ctx.save();
    // Default cover scale calculation
    const scaleX = size / ph.width;
    const scaleY = size / ph.height;
    const baseScale = Math.max(scaleX, scaleY);
    const zoom = state.zoom / 100;
    const scale = baseScale * zoom;

    const imgW = ph.width * scale;
    const imgH = ph.height * scale;
    const imgX = cx - imgW / 2 + state.posX;
    const imgY = cy - imgH / 2 + state.posY;

    ctx.drawImage(ph, imgX, imgY, imgW, imgH);
    ctx.restore();
  }

  // 2. Draw frame overlay on top
  if (state.frame) {
    const frame = state.frame;
    // Adapt frame to workspace bounds preserving proportions
    const scale = Math.min(size / frame.width, size / frame.height);
    const w = frame.width * scale;
    const h = frame.height * scale;
    const x = (size - w) / 2;
    const y = (size - h) / 2;
    ctx.drawImage(frame, x, y, w, h);
  } else {
    // Draw built-in frame
    const frameCanvas = generateFrameCanvas(BUILT_IN_FRAMES[state.frameIndex], size);
    ctx.drawImage(frameCanvas, 0, 0, size, size);
  }

  // 3. Draw participant name
  if (state.showName && state.name.trim()) {
    ctx.save();
    ctx.fillStyle = state.nameColor;
    
    let fontStyle = '';
    if (state.nameFont === 'Arial Bold') {
      fontStyle = `bold ${state.nameSize}px Arial, sans-serif`;
    } else {
      fontStyle = `${state.nameSize}px '${state.nameFont}', sans-serif`;
    }
    ctx.font = fontStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text drop shadow
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    const textX = (state.nameX / 1000) * size;
    const textY = (state.nameY / 1000) * size;
    ctx.fillText(state.name, textX, textY);
    ctx.restore();
  }

  // 4. Draw auto-incremented participant number if visible
  if (state.showNumber) {
    ctx.save();
    ctx.fillStyle = state.numberColor || '#ffffff';
    let fontStyle = '';
    if (state.numberFont === 'Arial Bold') {
      fontStyle = `bold ${state.numberSize}px Arial, sans-serif`;
    } else {
      fontStyle = `${state.numberSize}px '${state.numberFont}', sans-serif`;
    }
    ctx.font = fontStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    const numText = `${state.numberPrefix}${state.currentNumber}`;
    const textX = (state.numberX / 1000) * size;
    const textY = (state.numberY / 1000) * size;
    ctx.fillText(numText, textX, textY);
    ctx.restore();
  }

  // 5. Draw multiple custom text blocks
  if (state.texts && state.texts.length > 0) {
    state.texts.forEach(t => {
      if (!t.text.trim()) return;
      ctx.save();
      ctx.fillStyle = t.color || '#ffffff';
      
      let fontStyle = '';
      if (t.font === 'Arial Bold') {
        fontStyle = `bold ${t.size}px Arial, sans-serif`;
      } else {
        fontStyle = `${t.size}px '${t.font}', sans-serif`;
      }
      ctx.font = fontStyle;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      const textX = (t.x / 1000) * size;
      const textY = (t.y / 1000) * size;
      ctx.fillText(t.text, textX, textY);
      ctx.restore();
    });
  }

  // Enable download button
  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.disabled = !state.photo;
  }
  state.canvasReady = !!state.photo;

  if (state.photo) {
    const sb = document.getElementById('shareButtons');
    if (sb) sb.style.display = 'block';
  }
}

/* =============================================
   DOWNLOAD / TELECHARGEMENT
   ============================================= */
function downloadBadge() {
  if (!state.canvasReady) return;

  const canvas = document.getElementById('badgeCanvas');
  const link = document.createElement('a');

  // Generate filename
  const name = state.name ? state.name.replace(/\s+/g, '_') : 'badge';
  const frameName = BUILT_IN_FRAMES[state.frameIndex]?.name.replace(/\s+/g, '_') || 'badge';
  link.download = `badge_${name}_${frameName}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();

  showToast('Badge téléchargé ! 🎉', 'Votre badge a été sauvegardé avec succès.');

  // Animate button
  const btn = document.getElementById('downloadBtn');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = `<span>✓</span> Téléchargé !`;
  btn.style.background = 'linear-gradient(135deg, #2563eb, #06b6d4)';
  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.style.background = '';
  }, 2500);
}

/* =============================================
   CUSTOM TEXTS MANAGEMENT (Générateur)
   ============================================= */
function addCustomText() {
  const newText = {
    id: Date.now(),
    text: 'Nouveau texte',
    color: '#ffffff',
    size: 40,
    font: 'Arial Bold',
    x: 500,
    y: 500
  };
  state.texts.push(newText);
  updateCustomTextsUI();
  updateBadgePreview();
}

function updateCustomTextsUI() {
  const container = document.getElementById('customTextsList');
  if (!container) return;
  
  container.innerHTML = '';
  
  state.texts.forEach((t) => {
    const item = document.createElement('div');
    item.className = 'custom-text-item';
    item.innerHTML = `
      <div class="custom-text-item-header">
        <span class="custom-text-title">Texte personnalisé</span>
        <button class="btn-delete-text" onclick="deleteCustomText(${t.id})">Supprimer</button>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <input type="text" class="form-input" value="${t.text}" oninput="editCustomText(${t.id}, 'text', this.value)" placeholder="Contenu du texte..." />
      </div>
      <div class="custom-text-controls-grid">
        <div class="form-group" style="margin-bottom:0;">
          <span style="font-size:0.75rem; color:var(--txt-secondary);">Couleur</span>
          <input type="color" class="form-input" value="${t.color}" onchange="editCustomText(${t.id}, 'color', this.value)" style="height:38px; padding:2px;" />
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <span style="font-size:0.75rem; color:var(--txt-secondary);">Taille (px)</span>
          <input type="number" class="form-input" value="${t.size}" min="10" max="150" oninput="editCustomText(${t.id}, 'size', parseInt(this.value) || 30)" />
        </div>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <span style="font-size:0.75rem; color:var(--txt-secondary);">Police</span>
        <select class="form-input" onchange="editCustomText(${t.id}, 'font', this.value)">
          <option value="Arial Bold" ${t.font === 'Arial Bold' ? 'selected' : ''}>Arial Bold</option>
          <option value="Poppins" ${t.font === 'Poppins' ? 'selected' : ''}>Poppins</option>
          <option value="Montserrat" ${t.font === 'Montserrat' ? 'selected' : ''}>Montserrat</option>
          <option value="Roboto" ${t.font === 'Roboto' ? 'selected' : ''}>Roboto</option>
          <option value="Anton" ${t.font === 'Anton' ? 'selected' : ''}>Anton</option>
          <option value="Oswald" ${t.font === 'Oswald' ? 'selected' : ''}>Oswald</option>
        </select>
      </div>
    `;
    container.appendChild(item);
  });
}

function editCustomText(id, field, value) {
  const t = state.texts.find(text => text.id === id);
  if (t) {
    t[field] = value;
    updateBadgePreview();
  }
}

function deleteCustomText(id) {
  state.texts = state.texts.filter(t => t.id !== id);
  updateCustomTextsUI();
  updateBadgePreview();
}

/* =============================================
   DRAG AND DROP ON GENERATOR CANVAS
   ============================================= */
function getCanvasCoordinates(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  return { x, y };
}

function initCanvasDrag() {
  const canvas = document.getElementById('badgeCanvas');
  if (!canvas) return;
  
  canvas.addEventListener('mousedown', startDrag);
  canvas.addEventListener('mousemove', drag);
  window.addEventListener('mouseup', endDrag);
  
  canvas.addEventListener('touchstart', startDrag, { passive: false });
  canvas.addEventListener('touchmove', drag, { passive: false });
  window.addEventListener('touchend', endDrag);
  
  function startDrag(e) {
    if (!state.photo && !state.frame) return;
    const coords = getCanvasCoordinates(e, canvas);
    
    // 1. Check if clicked near custom texts
    for (let i = state.texts.length - 1; i >= 0; i--) {
      const t = state.texts[i];
      if (Math.hypot(coords.x - t.x, coords.y - t.y) < 50) {
        e.preventDefault();
        activeDrag = { type: 'customText', id: t.id };
        return;
      }
    }
    
    // 2. Check if clicked near name text (if visible)
    if (state.showName && state.name.trim()) {
      if (Math.hypot(coords.x - state.nameX, coords.y - state.nameY) < 55) {
        e.preventDefault();
        activeDrag = { type: 'name' };
        return;
      }
    }
    
    // 3. Check if clicked near number text (if visible)
    if (state.showNumber) {
      if (Math.hypot(coords.x - state.numberX, coords.y - state.numberY) < 50) {
        e.preventDefault();
        activeDrag = { type: 'number' };
        return;
      }
    }
    
    // 4. Else, drag photo to pan
    if (state.photo) {
      e.preventDefault();
      activeDrag = {
        type: 'photo',
        startX: coords.x,
        startY: coords.y,
        initialPosX: state.posX,
        initialPosY: state.posY
      };
    }
  }
  
  function drag(e) {
    if (!activeDrag) return;
    e.preventDefault();
    const coords = getCanvasCoordinates(e, canvas);
    
    if (activeDrag.type === 'customText') {
      const t = state.texts.find(text => text.id === activeDrag.id);
      if (t) {
        t.x = Math.max(0, Math.min(1000, Math.round(coords.x)));
        t.y = Math.max(0, Math.min(1000, Math.round(coords.y)));
        updateBadgePreview();
      }
    } else if (activeDrag.type === 'name') {
      state.nameX = Math.max(0, Math.min(1000, Math.round(coords.x)));
      state.nameY = Math.max(0, Math.min(1000, Math.round(coords.y)));
      updateBadgePreview();
    } else if (activeDrag.type === 'number') {
      state.numberX = Math.max(0, Math.min(1000, Math.round(coords.x)));
      state.numberY = Math.max(0, Math.min(1000, Math.round(coords.y)));
      updateBadgePreview();
    } else if (activeDrag.type === 'photo') {
      const dx = coords.x - activeDrag.startX;
      const dy = coords.y - activeDrag.startY;
      state.posX = activeDrag.initialPosX + dx;
      state.posY = activeDrag.initialPosY + dy;
      
      // Sync sliders
      const sliderX = document.getElementById('posXSlider');
      const sliderY = document.getElementById('posYSlider');
      if (sliderX && sliderY) {
        sliderX.value = state.posX;
        sliderY.value = state.posY;
        document.getElementById('posXValue').textContent = state.posX;
        document.getElementById('posYValue').textContent = state.posY;
      }
      
      updateBadgePreview();
    }
  }
  
  function endDrag() {
    activeDrag = null;
  }
}

/* =============================================
   ORGANIZER PREVIEW & CAMPAIGN LOGIC
   ============================================= */
function toggleOrgNameOptions() {
  const showName = document.getElementById('orgShowNameOnBadge').checked;
  document.getElementById('orgNameStyleOptions').style.display = showName ? 'block' : 'none';
}

function toggleOrgNumberOptions() {
  const showNum = document.getElementById('orgShowNumberOnBadge').checked;
  document.getElementById('orgNumberStyleOptions').style.display = showNum ? 'block' : 'none';
}

function handleOrgDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}

function handleOrgDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

function handleOrgDrop(event) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file && file.type === 'image/png') {
    loadOrgFrameFile(file);
  } else {
    showToast("Erreur", "Le cadre doit être une image PNG.", "error");
  }
}

function handleOrgFrameUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  loadOrgFrameFile(file);
}

function loadOrgFrameFile(file) {
  if (file.type !== 'image/png') {
    showToast("Erreur", "Le cadre doit être une image PNG avec fond transparent.", "error");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast("Erreur", "Fichier trop volumineux (Max 10 Mo).", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      orgState.frame = img;
      orgState.frameBase64Original = e.target.result;
      orgState.frameMode = 'custom';
      orgState.frameKey = '';
      
      // 1) Comprimer en JPEG pour le fallback URL (petit, mais sans transparence)
      compressFrameForURL(img, (jpegBase64) => {
        orgState.frameBase64 = jpegBase64;
        
        // 2) Comprimer en PNG pour le stockage en ligne (plus grand, MAIS transparent)
        compressFrameAsPNG(img, (pngBase64) => {
          orgState.frameBase64PNG = pngBase64;
          document.getElementById('generateCampaignBtn').disabled = false;
          
          // Show success in upload zone
          document.getElementById('orgUploadZone').innerHTML = `
            <div class="upload-success">
              <div style="font-size:2.5rem">🖼️</div>
              <p style="font-weight:600;margin:0.5rem 0">Cadre chargé !</p>
              <p style="font-size:0.8rem;color:var(--txt-muted)">Dimensions: ${img.width}x${img.height}px</p>
              <button class="btn btn-ghost btn-sm" style="margin-top:0.5rem" onclick="document.getElementById('orgFrameInput').click()">
                Changer de cadre
              </button>
            </div>
          `;
          
          updateOrgPreview();
        });
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function compressFrameForURL(img, callback) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Taille plus petite et encodage plus compact pour garder l’URL compatible
  // sur les navigateurs mobiles Android qui sont plus sensibles aux URLs longues.
  const size = 140;
  canvas.width = size;
  canvas.height = size;
  
  const scale = Math.min(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  
  ctx.drawImage(img, x, y, w, h);
  callback(canvas.toDataURL('image/webp', 0.60));
}

/**
 * Compresse le cadre en PNG (TRANSPARENT) pour le stockage en ligne (npoint.io).
 * PNG préserve le canal alpha — essentiel pour que le cadre s’affiche correctement
 * en superposition sur la photo du participant, quel que soit son appareil.
 */
function compressFrameAsPNG(img, callback) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // 350x350 PNG : bon compromis qualité / taille pour npoint.io
  // Un PNG badge typique à 350px ≈ 40-80 Ko en base64
  const size = 350;
  canvas.width = size;
  canvas.height = size;
  
  // Laisser le fond transparent (ne PAS remplir de couleur)
  ctx.clearRect(0, 0, size, size);
  
  const scale = Math.min(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const ox = (size - w) / 2;
  const oy = (size - h) / 2;
  
  ctx.drawImage(img, ox, oy, w, h);
  callback(canvas.toDataURL('image/png')); // PNG = transparence préservée
}

function drawCheckerboard(ctx, size) {
  const sq = 25;
  for (let y = 0; y < size; y += sq) {
    for (let x = 0; x < size; x += sq) {
      ctx.fillStyle = ((x / sq) + (y / sq)) % 2 === 0 ? '#0b1329' : '#050a17';
      ctx.fillRect(x, y, sq, sq);
    }
  }
}

function updateOrgPreview() {
  orgState.eventName = document.getElementById('orgEventName').value.trim();
  orgState.showNameOnBadge = document.getElementById('orgShowNameOnBadge').checked;
  orgState.nameColor = document.getElementById('orgNameColor').value;
  orgState.nameSize = parseInt(document.getElementById('orgNameSize').value) || 55;
  orgState.nameFont = document.getElementById('orgNameFont').value;
  
  orgState.showNumberOnBadge = document.getElementById('orgShowNumberOnBadge').checked;
  orgState.numberPrefix = document.getElementById('orgNumberPrefix').value;
  orgState.startNumber = parseInt(document.getElementById('orgStartNumber').value) || 1;
  orgState.numberColor = document.getElementById('orgNumberColor').value;
  orgState.numberSize = parseInt(document.getElementById('orgNumberSize').value) || 45;
  orgState.numberFont = document.getElementById('orgNumberFont').value;

  const canvas = document.getElementById('orgFrameCanvas');
  const placeholder = document.getElementById('orgCanvasPlaceholder');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 1000;

  if (!orgState.frame) {
    canvas.style.display = 'none';
    placeholder.style.display = 'block';
    return;
  }

  canvas.style.display = 'block';
  placeholder.style.display = 'none';

  ctx.clearRect(0, 0, size, size);

  // 1. Draw Checkerboard background to show transparency
  drawCheckerboard(ctx, size);

  // 2. Draw Frame preserving proportions
  if (orgState.frame) {
    const scale = Math.min(size / orgState.frame.width, size / orgState.frame.height);
    const w = orgState.frame.width * scale;
    const h = orgState.frame.height * scale;
    const x = (size - w) / 2;
    const y = (size - h) / 2;
    ctx.drawImage(orgState.frame, x, y, w, h);
  }

  // 3. Draw participant name placeholder
  if (orgState.showNameOnBadge) {
    ctx.save();
    ctx.fillStyle = orgState.nameColor;
    let fontStyle = '';
    if (orgState.nameFont === 'Arial Bold') {
      fontStyle = `bold ${orgState.nameSize}px Arial, sans-serif`;
    } else {
      fontStyle = `${orgState.nameSize}px '${orgState.nameFont}', sans-serif`;
    }
    ctx.font = fontStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 8;
    ctx.fillText("[ Nom du Participant ]", orgState.nameX, orgState.nameY);
    
    // Draw visual dashed border box for drag handle
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    const textWidth = ctx.measureText("[ Nom du Participant ]").width;
    ctx.strokeRect(orgState.nameX - textWidth/2 - 15, orgState.nameY - orgState.nameSize/2 - 15, textWidth + 30, orgState.nameSize + 30);
    ctx.restore();
  }

  // 4. Draw participant number placeholder
  if (orgState.showNumberOnBadge) {
    ctx.save();
    ctx.fillStyle = orgState.numberColor;
    let fontStyle = '';
    if (orgState.numberFont === 'Arial Bold') {
      fontStyle = `bold ${orgState.numberSize}px Arial, sans-serif`;
    } else {
      fontStyle = `${orgState.numberSize}px '${orgState.numberFont}', sans-serif`;
    }
    ctx.font = fontStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 8;
    
    const sampleText = `[ ${orgState.numberPrefix}${orgState.startNumber} ]`;
    ctx.fillText(sampleText, orgState.numberX, orgState.numberY);
    
    // Draw visual dashed border box for drag handle
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    const textWidth = ctx.measureText(sampleText).width;
    ctx.strokeRect(orgState.numberX - textWidth/2 - 15, orgState.numberY - orgState.numberSize/2 - 15, textWidth + 30, orgState.numberSize + 30);
    ctx.restore();
  }
}

/* =============================================
   DRAG AND DROP ON ORGANIZER CANVAS
   ============================================= */
function initOrgCanvasDrag() {
  const canvas = document.getElementById('orgFrameCanvas');
  if (!canvas) return;

  canvas.addEventListener('mousedown', startOrgDrag);
  canvas.addEventListener('mousemove', orgDrag);
  window.addEventListener('mouseup', endOrgDrag);
  
  canvas.addEventListener('touchstart', startOrgDrag, { passive: false });
  canvas.addEventListener('touchmove', orgDrag, { passive: false });
  window.addEventListener('touchend', endOrgDrag);
  
  function startOrgDrag(e) {
    if (!orgState.frame) return;
    const coords = getCanvasCoordinates(e, canvas);
    
    // Check if clicked near name placeholder
    if (orgState.showNameOnBadge) {
      if (Math.hypot(coords.x - orgState.nameX, coords.y - orgState.nameY) < 70) {
        e.preventDefault();
        orgActiveDrag = { type: 'name' };
        return;
      }
    }
    
    // Check if clicked near number placeholder
    if (orgState.showNumberOnBadge) {
      if (Math.hypot(coords.x - orgState.numberX, coords.y - orgState.numberY) < 70) {
        e.preventDefault();
        orgActiveDrag = { type: 'number' };
        return;
      }
    }
  }
  
  function orgDrag(e) {
    if (!orgActiveDrag) return;
    e.preventDefault();
    const coords = getCanvasCoordinates(e, canvas);
    
    if (orgActiveDrag.type === 'name') {
      orgState.nameX = Math.max(0, Math.min(1000, Math.round(coords.x)));
      orgState.nameY = Math.max(0, Math.min(1000, Math.round(coords.y)));
      updateOrgPreview();
    } else if (orgActiveDrag.type === 'number') {
      orgState.numberX = Math.max(0, Math.min(1000, Math.round(coords.x)));
      orgState.numberY = Math.max(0, Math.min(1000, Math.round(coords.y)));
      updateOrgPreview();
    }
  }
  
  function endOrgDrag() {
    orgActiveDrag = null;
  }
}

/**
 * Construit l'URL absolue menant à participant.html en conservant le bon chemin d'accès.
 */
function getParticipantPageUrl(hashValue) {
  let path = window.location.pathname;
  if (path.endsWith('index.html')) {
    path = path.slice(0, -10); // Retirer index.html
  }
  if (!path.endsWith('/')) {
    path += '/';
  }
  return `${window.location.origin}${path}participant.html${hashValue}`;
}

function buildCampaignFramePayload() {
  if (orgState.frameMode === 'built-in' && orgState.frameKey) {
    return `builtin:${orgState.frameKey}`;
  }
  if (orgState.frameBase64) {
    return `custom:${orgState.frameBase64}`;
  }
  return '';
}

async function generateCampaignLink() {
  orgState.eventName = document.getElementById('orgEventName').value.trim();
  orgState.description = document.getElementById('orgDescription').value.trim();
  orgState.startDate = document.getElementById('orgStartDate').value;
  orgState.endDate = document.getElementById('orgEndDate').value;
  orgState.venue = document.getElementById('orgVenue').value.trim();
  orgState.redirectUrl = document.getElementById('orgRedirectUrl').value.trim();
  orgState.collectEmail = document.getElementById('orgCollectEmail').checked;
  orgState.whatsappReminder = document.getElementById('orgWhatsappReminder').checked;
  orgState.showNameOnBadge = document.getElementById('orgShowNameOnBadge').checked;
  
  orgState.showNumberOnBadge = document.getElementById('orgShowNumberOnBadge').checked;
  orgState.numberPrefix = document.getElementById('orgNumberPrefix').value;
  orgState.startNumber = parseInt(document.getElementById('orgStartNumber').value) || 1;
  orgState.numberColor = document.getElementById('orgNumberColor').value;
  orgState.numberSize = parseInt(document.getElementById('orgNumberSize').value) || 45;
  orgState.numberFont = document.getElementById('orgNumberFont').value;
  // nameColor / nameSize / nameFont
  orgState.nameColor = document.getElementById('orgNameColor').value;
  orgState.nameSize = parseInt(document.getElementById('orgNameSize').value) || 55;
  orgState.nameFont = document.getElementById('orgNameFont').value;
  // Note : orgState.numberX, orgState.numberY, orgState.nameX, orgState.nameY
  // sont mis à jour par le drag & drop — on les lit directement depuis orgState.

  if (!orgState.eventName) {
    showToast("Erreur", "Le nom de l'événement est requis.", "error");
    return;
  }
  if (!orgState.frameBase64) {
    showToast("Erreur", "Veuillez charger un cadre de badge.", "error");
    return;
  }

  const btn = document.getElementById('generateCampaignBtn');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span>⏳</span> Génération du lien court...`;

  const campaignData = {
    n: orgState.eventName,
    d: orgState.description,
    s: orgState.startDate,
    e: orgState.endDate,
    v: orgState.venue,
    r: orgState.redirectUrl,
    ce: orgState.collectEmail,
    wr: orgState.whatsappReminder,
    sn: orgState.showNameOnBadge,
    nx: orgState.nameX,
    ny: orgState.nameY,
    nc: orgState.nameColor,
    ns: orgState.nameSize,
    nf: orgState.nameFont,
    snb: orgState.showNumberOnBadge,
    npx: orgState.numberPrefix,
    stn: orgState.startNumber,
    nuc: orgState.numberColor,
    nus: orgState.numberSize,
    nuf: orgState.numberFont,
    numX: orgState.numberX,
    numY: orgState.numberY,
    f: buildCampaignFramePayload()
  };

  try {
    btn.innerHTML = `<span>⏳</span> Préparation du lien participant...`;

    const compactPayload = CampaignStore.encodeCompactPayload(campaignData);
    const linkHash = `#event=${encodeURIComponent(compactPayload)}`;
    const link = getParticipantPageUrl(linkHash);
    const linkType = 'base64';

    // Afficher le lien principal
    document.getElementById('generatedLinkInput').value = link;
    document.getElementById('campaignLinkResult').style.display = 'block';

    // Afficher la bannière d'info selon le type
    const infoBanner = document.getElementById('linkTypeBanner');
    if (infoBanner) {
      if (linkType === 'local') {
        infoBanner.innerHTML = `<span class="link-type-badge link-type-local">✅ Lien participant généré</span> Le lien universel est prêt à être partagé avec vos participants.`;
      } else {
        infoBanner.innerHTML = `<span class="link-type-badge link-type-base64">🔗 Lien universel</span> Ce lien fonctionne sur tous les appareils, même sans stockage local.`;
      }
      infoBanner.style.display = 'flex';
    }

    showToast(
      "Campagne créée ! 🚀",
      "Lien universel prêt à être partagé."
    );

  } catch (error) {
    console.error('Génération de campagne ratée :', error);
    showToast('Erreur', 'Impossible de générer le lien de campagne.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

function copyCampaignLink() {
  const input = document.getElementById('generatedLinkInput');
  input.select();
  document.execCommand('copy');
  showToast("Copié !", "Lien copié dans le presse-papiers.");
}

function testParticipantLink() {
  const link = document.getElementById('generatedLinkInput').value;
  if (link) {
    window.open(link, '_blank');
  }
}

function generateEventId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
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
    toast.style.background = 'rgba(37, 99, 235, 0.15)';
    toast.style.borderColor = 'rgba(56, 189, 248, 0.45)';
  }

  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

/* =============================================
   ON LOAD – draw preview with frame only
   ============================================= */
window.addEventListener('load', () => {
  const hasCampaign = window.location.hash.startsWith('#event=')
                   || window.location.hash.startsWith('#id=')
                   || window.location.hash.startsWith('#lid=');
  if (hasCampaign) return; // Skip default initial preview loading if in campaign mode

  // Auto-trigger initial preview with just the frame
  setTimeout(() => {
    const frame = BUILT_IN_FRAMES[0];
    const fc = generateFrameCanvas(frame, 1000);
    const img = new Image();
    img.onload = () => {
      state.frame = img;
    };
    img.src = fc.toDataURL('image/png');
  }, 300);
});
