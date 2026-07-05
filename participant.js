/**
 * BadgeEvent – Participant Workspace Logic
 * Handles standalone loading, preview rendering, drag & drop, and download for campaign participants.
 */

/* =============================================
   STATE MANAGEMENT
   ============================================= */
const state = {
  frame: null,            // HTMLImageElement of campaign frame
  campaignData: null,     // JSON campaign metadata
  isParticipantMode: true,
  currentNumber: 1,       // Auto-incremented participant index
  
  // Custom numbers coordinates & styles
  showNumber: false,
  numberPrefix: 'Participant N°',
  numberX: 500,
  numberY: 910,
  numberSize: 45,
  numberColor: '#38bdf8',
  numberFont: 'Arial Bold',
  
  // Participant Name coordinates & styles
  nameX: 500,
  nameY: 850,
  nameColor: '#ffffff',
  nameSize: 55,
  nameFont: 'Arial Bold'
};

const pState = {
  photo: null,          // HTMLImageElement of user's photo
  zoom: 100,            // Zoom percentage
  posX: 0,              // Panning offset X
  posY: 0,              // Panning offset Y
  name: '',             // User name text
  email: '',            // User email text
  canvasReady: false
};

let pActiveDrag = null;  // Drag & drop state for text positioning and photo panning

/* =============================================
   INITIALIZATION
   ============================================= */
window.addEventListener('load', () => {
  checkUrlParameters();
  initParticipantOverlayCanvasDrag();
});

/* =============================================
   LOAD CAMPAIGN DATA (from Hash parameter)
   ============================================= */
function checkUrlParameters() {
  const hash = window.location.hash || '';
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;

  if (cleanHash.startsWith('event=')) {
    const eventB64 = cleanHash.slice('event='.length);
    if (!eventB64) return;
    try {
      const decoded = decodeURIComponent(eventB64);
      const data = CampaignStore.decodeCompactPayload(decoded);
      migrateEventToLocal(data);
      bootParticipantMode(data);
    } catch (e) {
      console.error('URL decoding failed:', e);
      showToast('Lien invalide', "Les paramètres de l'événement sont corrompus.", 'error');
    }
  } else if (cleanHash.startsWith('id=')) {
    const campaignId = hash.slice('#id='.length);
    if (!campaignId) return;
    fetchCampaignFromNpoint(campaignId);
  } else if (cleanHash.startsWith('lid=')) {
    const localId = cleanHash.slice('lid='.length);
    if (!localId) return;
    fetchCampaignFromLocal(localId);
  } else {
    // No campaign details: show basic guide
    document.getElementById('pEventName').textContent = "Aucune campagne chargée";
    document.getElementById('pEventDescription').textContent = "Veuillez ouvrir ce lien depuis un QR Code d'événement ou un lien d'invitation officiel.";
  }
}

async function fetchCampaignFromNpoint(id) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`https://api.npoint.io/${id}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    CampaignStore.save(data).catch(() => {}); // Save locally for future visits
    bootParticipantMode(data);
  } catch (error) {
    console.error('npoint.io load failed, falling back to local DB if available:', error.message);
    // Try reading IndexedDB as backup in case of network issue
    const localData = await CampaignStore.load(id).catch(() => null);
    if (localData) {
      bootParticipantMode(localData);
    } else {
      showToast('Erreur de connexion', 'Impossible de charger la campagne depuis le service en ligne.', 'error');
      document.getElementById('pEventName').textContent = "Campagne hors-ligne";
      document.getElementById('pEventDescription').textContent = "Impossible de récupérer les détails de la campagne. Vérifiez votre connexion Internet.";
    }
  }
}

async function fetchCampaignFromLocal(id) {
  try {
    const data = await CampaignStore.load(id);
    if (!data) throw new Error('Campaign not found in local store');
    bootParticipantMode(data);
  } catch (error) {
    console.error('IndexedDB load failed:', error.message);
    showToast('Campagne introuvable', 'Ce lien local ne fonctionne que sur le navigateur qui a créé la campagne.', 'error');
    document.getElementById('pEventName').textContent = "Campagne introuvable";
  }
}

async function migrateEventToLocal(data) {
  try {
    const localId = await CampaignStore.save(data);
    const newUrl = `${window.location.origin}${window.location.pathname}#lid=${localId}`;
    window.history.replaceState({}, '', newUrl);
  } catch (e) {
    console.warn('Migration IndexedDB échouée (non-bloquant) :', e.message);
  }
}

function bootParticipantMode(data) {
  state.campaignData = data;

  // Set event details
  document.getElementById('pEventName').textContent = data.n;
  document.getElementById('pEventDescription').textContent = data.d || "Bienvenue sur la campagne de badge officielle !";
  
  // Venue
  if (data.v) {
    document.getElementById('pEventVenue').textContent = data.v;
    document.getElementById('pEventDateContainer').style.display = 'inline-flex';
    document.getElementById('pEventVenueContainer').style.display = 'inline-flex';
  }

  // Date
  if (data.s) {
    let dateStr = formatDate(data.s);
    if (data.e) dateStr += ` - ${formatDate(data.e)}`;
    document.getElementById('pEventDate').textContent = dateStr;
    document.getElementById('pEventDateContainer').style.display = 'inline-flex';
  }

  // Load participant counter
  const eventId = generateEventId(data.n);
  let counterVal = parseInt(localStorage.getItem(`counter_${eventId}`));
  if (isNaN(counterVal)) {
    counterVal = data.stn || 1;
    localStorage.setItem(`counter_${eventId}`, counterVal);
  }
  state.currentNumber = counterVal;
  document.getElementById('pEventStatsNumber').textContent = counterVal - 1;

  // Show/hide Name controls
  const nameCard = document.getElementById('pStepNameContainer');
  if (data.sn) {
    nameCard.style.display = 'block';
  } else {
    nameCard.style.display = 'none';
  }

  // Show/hide Email card
  const emailCard = document.getElementById('pStepEmailContainer');
  if (data.ce) {
    emailCard.style.display = 'block';
    document.getElementById('pEmailBadgeNum').textContent = data.sn ? '3' : '2';
  } else {
    emailCard.style.display = 'none';
  }

  // Setup styles
  state.showNumber = data.snb;
  state.numberPrefix = data.npx || 'Participant N°';
  state.numberX = data.numX !== undefined ? data.numX : 500;
  state.numberY = data.numY !== undefined ? data.numY : 910;
  state.numberColor = data.nuc || '#38bdf8';
  state.numberSize = data.nus || 45;
  state.numberFont = data.nuf || 'Arial Bold';

  if (data.nx !== undefined) state.nameX = data.nx;
  if (data.ny !== undefined) state.nameY = data.ny;
  if (data.nc !== undefined) state.nameColor = data.nc;
  if (data.ns !== undefined) state.nameSize = data.ns;
  if (data.nf !== undefined) state.nameFont = data.nf;

  // Frame photo load (check high-res local backup first!)
  const backupHighRes = localStorage.getItem(`camp_highres_${eventId}`);
  const frameImg = new Image();
  frameImg.onload = () => {
    state.frame = frameImg;
    updateParticipantPreview();
  };
  frameImg.src = backupHighRes || data.f;
}

function formatDate(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function generateEventId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
}

/* =============================================
   UPLOAD PHOTO
   ============================================= */
function handlePPhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  loadPPhotoFile(file);
}

function handlePDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}

function handlePDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

function handlePDrop(event) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    loadPPhotoFile(file);
  }
}

function loadPPhotoFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    showToast('Fichier trop volumineux', 'La taille maximale est de 10 Mo.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      pState.photo = img;
      document.getElementById('pPhotoControls').style.display = 'flex';
      document.getElementById('pUploadZone').innerHTML = `
        <div class="upload-success">
          <div style="font-size:2.5rem">📸</div>
          <p style="font-weight:600;margin:0.5rem 0">Photo chargée !</p>
          <p style="font-size:0.8rem;color:var(--txt-muted)">${file.name}</p>
          <button class="btn btn-ghost btn-sm" style="margin-top:0.5rem" onclick="document.getElementById('pPhotoInput').click()">
            Changer de photo
          </button>
        </div>
      `;
      updateParticipantPreview();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* =============================================
   IMAGE ADJUSTMENTS SLIDERS
   ============================================= */
function updatePZoom(value) {
  pState.zoom = parseInt(value);
  document.getElementById('pZoomValue').textContent = `${value}%`;
  updateParticipantPreview();
}

function updatePPosX(value) {
  pState.posX = parseInt(value);
  document.getElementById('pPosXValue').textContent = value;
  updateParticipantPreview();
}

function updatePPosY(value) {
  pState.posY = parseInt(value);
  document.getElementById('pPosYValue').textContent = value;
  updateParticipantPreview();
}

function resetPPhotoAdjustments() {
  pState.zoom = 100;
  pState.posX = 0;
  pState.posY = 0;
  document.getElementById('pZoomSlider').value = 100;
  document.getElementById('pPosXSlider').value = 0;
  document.getElementById('pPosYSlider').value = 0;
  document.getElementById('pZoomValue').textContent = '100%';
  document.getElementById('pPosXValue').textContent = '0';
  document.getElementById('pPosYValue').textContent = '0';
  updateParticipantPreview();
}

/* =============================================
   FORM VALIDATION
   ============================================= */
function validateParticipantForm() {
  const data = state.campaignData;
  if (!data) return false;
  
  let valid = true;

  if (data.ce) {
    const email = document.getElementById('pEmailInput').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    valid = emailRegex.test(email);
  }

  const btn = document.getElementById('pDownloadBtn');
  btn.disabled = !(pState.photo && valid);
  return valid;
}

/* =============================================
   PREVIEW RENDERING
   ============================================= */
function updateParticipantPreview() {
  pState.name = document.getElementById('pNameInput')?.value || '';
  
  if (!pState.photo && !state.frame) return;

  const canvas = document.getElementById('participantCanvas');
  const placeholder = document.getElementById('pCanvasPlaceholder');
  const ctx = canvas.getContext('2d');
  const size = 1000;

  canvas.style.display = 'block';
  placeholder.style.display = 'none';

  ctx.clearRect(0, 0, size, size);

  // 1. Draw user photo in background
  if (pState.photo) {
    const ph = pState.photo;
    const cx = size / 2;
    const cy = size / 2;

    ctx.save();
    const scaleX = size / ph.width;
    const scaleY = size / ph.height;
    const baseScale = Math.max(scaleX, scaleY);
    const zoom = pState.zoom / 100;
    const scale = baseScale * zoom;

    const imgW = ph.width * scale;
    const imgH = ph.height * scale;
    const imgX = cx - imgW / 2 + pState.posX;
    const imgY = cy - imgH / 2 + pState.posY;

    ctx.drawImage(ph, imgX, imgY, imgW, imgH);
    ctx.restore();
  }

  // 2. Draw campaign custom transparent frame on top
  if (state.frame) {
    const frame = state.frame;
    const scale = Math.min(size / frame.width, size / frame.height);
    const w = frame.width * scale;
    const h = frame.height * scale;
    const x = (size - w) / 2;
    const y = (size - h) / 2;
    ctx.drawImage(frame, x, y, w, h);
  }

  // 3. Draw participant name
  const data = state.campaignData;
  if (data && data.sn && pState.name.trim()) {
    ctx.save();
    ctx.fillStyle = data.nc || '#ffffff';
    let fontStyle = '';
    if (data.nf === 'Arial Bold') {
      fontStyle = `bold ${data.ns || 55}px Arial, sans-serif`;
    } else {
      fontStyle = `${data.ns || 55}px '${data.nf || 'Outfit'}', sans-serif`;
    }
    ctx.font = fontStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    const textX = (state.nameX / 1000) * size;
    const textY = (state.nameY / 1000) * size;
    
    ctx.fillText(pState.name, textX, textY);
    ctx.restore();
  }

  // 4. Draw participant auto-increment number
  if (data && data.snb) {
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

  validateParticipantForm();
  
  if (pState.photo) {
    document.getElementById('pShareButtons').style.display = 'block';
  }
}

/* =============================================
   CANVAS COORDINATES UTILITY
   ============================================= */
function getCanvasCoordinates(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  return { x, y };
}

/* =============================================
   DRAG AND DROP ON CANVAS (Panning / Placement)
   ============================================= */
function initParticipantOverlayCanvasDrag() {
  const canvas = document.getElementById('participantCanvas');
  if (!canvas) return;

  canvas.addEventListener('mousedown', startDrag);
  canvas.addEventListener('mousemove', drag);
  window.addEventListener('mouseup', endDrag);
  
  canvas.addEventListener('touchstart', startDrag, { passive: false });
  canvas.addEventListener('touchmove', drag, { passive: false });
  window.addEventListener('touchend', endDrag);
  
  function startDrag(e) {
    if (!pState.photo) return;
    const coords = getCanvasCoordinates(e, canvas);
    const data = state.campaignData;
    
    // Check if clicked near name text
    if (data && data.sn && pState.name.trim()) {
      if (Math.hypot(coords.x - state.nameX, coords.y - state.nameY) < 55) {
        e.preventDefault();
        pActiveDrag = { type: 'name' };
        return;
      }
    }
    
    // Check if clicked near number text
    if (data && data.snb) {
      if (Math.hypot(coords.x - state.numberX, coords.y - state.numberY) < 55) {
        e.preventDefault();
        pActiveDrag = { type: 'number' };
        return;
      }
    }
    
    // Else, pan user photo
    e.preventDefault();
    pActiveDrag = {
      type: 'photo',
      startX: coords.x,
      startY: coords.y,
      initialPosX: pState.posX,
      initialPosY: pState.posY
    };
  }
  
  function drag(e) {
    if (!pActiveDrag) return;
    e.preventDefault();
    const coords = getCanvasCoordinates(e, canvas);
    
    if (pActiveDrag.type === 'name') {
      state.nameX = Math.max(0, Math.min(1000, Math.round(coords.x)));
      state.nameY = Math.max(0, Math.min(1000, Math.round(coords.y)));
      updateParticipantPreview();
    } else if (pActiveDrag.type === 'number') {
      state.numberX = Math.max(0, Math.min(1000, Math.round(coords.x)));
      state.numberY = Math.max(0, Math.min(1000, Math.round(coords.y)));
      updateParticipantPreview();
    } else if (pActiveDrag.type === 'photo') {
      const dx = coords.x - pActiveDrag.startX;
      const dy = coords.y - pActiveDrag.startY;
      pState.posX = pActiveDrag.initialPosX + dx;
      pState.posY = pActiveDrag.initialPosY + dy;
      
      // Sync sliders UI
      const sliderX = document.getElementById('pPosXSlider');
      const sliderY = document.getElementById('pPosYSlider');
      if (sliderX && sliderY) {
        sliderX.value = pState.posX;
        sliderY.value = pState.posY;
        document.getElementById('pPosXValue').textContent = pState.posX;
        document.getElementById('pPosYValue').textContent = pState.posY;
      }
      
      updateParticipantPreview();
    }
  }
  
  function endDrag() {
    pActiveDrag = null;
  }
}

/* =============================================
   DOWNLOAD / TELECHARGEMENT
   ============================================= */
function downloadParticipantBadge() {
  const data = state.campaignData;
  if (!data || !pState.photo) return;
  
  const canvas = document.getElementById('participantCanvas');
  const link = document.createElement('a');
  
  const formattedName = pState.name ? pState.name.replace(/\s+/g, '_') : 'badge';
  const eventId = generateEventId(data.n);
  
  link.download = `badge_${data.n.replace(/\s+/g, '_')}_${formattedName}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
  
  showToast('Badge officiel téléchargé ! 🎉', 'Merci pour votre participation.');
  
  // Auto-increment participant number in local storage
  const nextNum = state.currentNumber + 1;
  localStorage.setItem(`counter_${eventId}`, nextNum);
  
  state.currentNumber = nextNum;
  document.getElementById('pEventStatsNumber').textContent = nextNum - 1;
  updateParticipantPreview();

  // Button micro-animation
  const btn = document.getElementById('pDownloadBtn');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = `<span>✓</span> Badge Téléchargé !`;
  btn.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';
  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.style.background = '';
  }, 2500);

  // Redirect if URL redirection is configured
  if (data.r) {
    showToast("Redirection...", "Vous allez être redirigé dans un instant.");
    setTimeout(() => {
      window.location.href = data.r;
    }, 2000);
  }
}

/* =============================================
   SHARE FUNCTIONS
   ============================================= */
function shareParticipantWhatsApp() {
  const text = encodeURIComponent(`Je participe à ${state.campaignData?.n || "l'événement"} ! Créez votre badge officiel ici 🎭 : ${window.location.href}`);
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

function shareParticipantFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function shareParticipantTwitter() {
  const text = encodeURIComponent(`Je participe à ${state.campaignData?.n || "l'événement"} ! Créez votre badge officiel 🎭 #JYSerai : ${window.location.href}`);
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

function togglePPreviewSize() {
  const container = document.getElementById('pCanvasContainer');
  const isLarge = container.style.maxWidth === '700px';
  container.style.maxWidth = isLarge ? '' : '700px';
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
