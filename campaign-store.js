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
    const db    = await openDB();
    const id    = generateShortId();
    const entry = { id, data, name: data.n || 'Campagne', createdAt: Date.now() };

    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).put(entry);
      req.onsuccess = () => resolve(id);
      req.onerror   = (e) => reject(e.target.error);
    });
  }

  /* ------------------------------------------------
     LOAD   → returns data object or null
  ------------------------------------------------ */
  async function load(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = (e) => resolve(e.target.result ? e.target.result.data : null);
      req.onerror   = (e) => reject(e.target.error);
    });
  }

  /* ------------------------------------------------
     LIST   → returns array of {id, name, createdAt}
  ------------------------------------------------ */
  async function list() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx      = db.transaction(STORE_NAME, 'readonly');
      const req     = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = (e) => resolve(
        e.target.result.map(({ id, name, createdAt }) => ({ id, name, createdAt }))
      );
      req.onerror   = (e) => reject(e.target.error);
    });
  }

  /* ------------------------------------------------
     REMOVE
  ------------------------------------------------ */
  async function remove(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).delete(id);
      req.onsuccess = () => resolve();
      req.onerror   = (e) => reject(e.target.error);
    });
  }

  /* ------------------------------------------------
     ENCODE / DECODE BASE64 (lien universel)
  ------------------------------------------------ */
  function encodeToBase64(data) {
    const json = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(json)));
  }

  function decodeFromBase64(b64) {
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json);
  }

  /* ------------------------------------------------
     PUBLIC API
  ------------------------------------------------ */
  return { save, load, list, remove, generateShortId, encodeToBase64, decodeFromBase64, openDB };
})();
