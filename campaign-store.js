/**
 * BadgeEvent – CampaignStore
 * Gestion locale des campagnes via IndexedDB.
 * Utilisé comme fallback si npoint.io est indisponible.
 *
 * API :
 *   CampaignStore.save(data)         → Promise<shortId>
 *   CampaignStore.load(id)           → Promise<data | null>
 *   CampaignStore.list()             → Promise<[{id, name, createdAt}]>
 *   CampaignStore.remove(id)         → Promise<void>
 *   CampaignStore.generateShortId()  → string (8 chars)
 */

const CampaignStore = (() => {
  const DB_NAME    = 'BadgeEventDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'campaigns';
  const STORAGE_PREFIX = 'badgeevent_campaign_';

  let _db = null;

  /* ------------------------------------------------
     OPEN / INIT
  ------------------------------------------------ */
  function openDB() {
    return new Promise((resolve, reject) => {
      if (_db) { resolve(_db); return; }

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      req.onsuccess  = (e) => { _db = e.target.result; resolve(_db); };
      req.onerror    = (e) => reject(e.target.error);
    });
  }

  /* ------------------------------------------------
     SHORT ID GENERATOR  (8 chars alphanumeric)
  ------------------------------------------------ */
  function generateShortId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    const arr = new Uint8Array(8);
    crypto.getRandomValues(arr);
    arr.forEach(b => { id += chars[b % chars.length]; });
    return id;
  }

  /* ------------------------------------------------
     SAVE   → returns shortId
  ------------------------------------------------ */
  async function save(data) {
    const id = generateShortId();
    const entry = { id, data, name: data.n || 'Campagne', createdAt: Date.now() };

    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).put(entry);
        req.onsuccess = () => resolve(id);
        req.onerror   = (e) => reject(e.target.error);
      });
    } catch (error) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${id}`, JSON.stringify(entry));
        return id;
      } catch (storageError) {
        throw storageError || error;
      }
    }
  }

  /* ------------------------------------------------
     LOAD   → returns data object or null
  ------------------------------------------------ */
  async function load(id) {
    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = (e) => resolve(e.target.result ? e.target.result.data : null);
        req.onerror   = (e) => reject(e.target.error);
      });
    } catch (error) {
      try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        return entry?.data || null;
      } catch (storageError) {
        console.warn('Impossible de charger la campagne depuis le stockage local :', storageError);
        return null;
      }
    }
  }

  /* ------------------------------------------------
     LIST   → returns array of {id, name, createdAt}
  ------------------------------------------------ */
  async function list() {
    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx      = db.transaction(STORE_NAME, 'readonly');
        const req     = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = (e) => resolve(
          e.target.result.map(({ id, name, createdAt }) => ({ id, name, createdAt }))
        );
        req.onerror   = (e) => reject(e.target.error);
      });
    } catch (error) {
      const campaigns = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
        try {
          const entry = JSON.parse(localStorage.getItem(key));
          campaigns.push({ id: entry.id, name: entry.name || 'Campagne', createdAt: entry.createdAt || 0 });
        } catch (e) {
          // ignore invalid entries
        }
      }
      return campaigns.sort((a, b) => b.createdAt - a.createdAt);
    }
  }

  /* ------------------------------------------------
     REMOVE
  ------------------------------------------------ */
  async function remove(id) {
    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).delete(id);
        req.onsuccess = () => resolve();
        req.onerror   = (e) => reject(e.target.error);
      });
    } catch (error) {
      localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
    }
  }

  /* ------------------------------------------------
     ENCODE / DECODE BASE64 (lien universel)
  ------------------------------------------------ */
  function encodeToBase64(data) {
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function encodeToBase64UrlSafe(data) {
    return encodeToBase64(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  function encodeCompactPayload(data) {
    const json = JSON.stringify(data);
    const lz = (typeof window !== 'undefined' && window.LZString)
      || (typeof globalThis !== 'undefined' && globalThis.LZString);

    if (lz && typeof lz.compressToEncodedURIComponent === 'function') {
      return lz.compressToEncodedURIComponent(json);
    }

    return encodeToBase64UrlSafe(data);
  }

  function decodeFromBase64(b64) {
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  }

  function decodeFromBase64UrlSafe(b64) {
    let normalized = (b64 || '').trim();
    if (!normalized) throw new Error('Empty payload');
    normalized = normalized.replace(/-/g, '+').replace(/_/g, '/');
    const pad = normalized.length % 4;
    if (pad) {
      normalized += '='.repeat(4 - pad);
    }
    return decodeFromBase64(normalized);
  }

  function decodeCompactPayload(payload) {
    const lz = (typeof window !== 'undefined' && window.LZString)
      || (typeof globalThis !== 'undefined' && globalThis.LZString);

    if (lz && typeof lz.decompressFromEncodedURIComponent === 'function') {
      try {
        const json = lz.decompressFromEncodedURIComponent(payload);
        if (json) {
          return JSON.parse(json);
        }
      } catch (error) {
        // Fall back to base64 decoding below.
      }
    }

    return decodeFromBase64UrlSafe(payload);
  }

  /* ------------------------------------------------
     PUBLIC API
  ------------------------------------------------ */
  return { save, load, list, remove, generateShortId, encodeToBase64, encodeToBase64UrlSafe, encodeCompactPayload, decodeFromBase64, decodeFromBase64UrlSafe, decodeCompactPayload, openDB };
})();
