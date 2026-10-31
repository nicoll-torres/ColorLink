// Local storage is a compatibility cache for the existing screens. The database
// is authoritative; only changed records/fields are sent, never entire lists.
const keys = {
  colorlink_paint_requests: 'orders',
  colorlink_clients: 'clients',
  colorlink_staff: 'staff',
  colorlink_pintuco_inventory_v4: 'inventory',
} as const;
import { cleanRecord, diffRecords, recordId, type Change } from './sharedSyncRecords';
const endpoint = '/.netlify/functions/shared-records';
const nativeSet = Storage.prototype.setItem;
const outboxKey = 'colorlink_sync_outbox';
let pending: Change[] = [];
try { pending = JSON.parse(localStorage.getItem(outboxKey) || '[]'); } catch {}
let hydrated = false;
function cachePending() { nativeSet.call(localStorage, outboxKey, JSON.stringify(pending)); }
let busy = false;
let applying = false;

function read(key: string): any[] {
  try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function status(ok: boolean) {
  window.dispatchEvent(new CustomEvent('colorlink-sync-status', { detail: ok }));
}
async function synchronize() {
  if (busy) return;
  busy = true;
  try {
    while (pending.length) {
      const batch = pending.slice(0, 100);
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ changes: batch }) });
      if (!response.ok) throw new Error('sync');
      pending.splice(0, batch.length);
      cachePending();
    }
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) throw new Error('sync');
    const rows = await response.json();
    // A write made while GET was in flight must not be overwritten by its snapshot.
    if (pending.length) return;
    applying = true;
    for (const [key, collection] of Object.entries(keys)) {
      const local = new Map(read(key).map(record => [recordId(record, collection), record]));
      const data = rows.filter((r: any) => r.collection === collection && !r.deleted)
        .map((r: any) => ({ ...local.get(r.recordId), ...r.data }));
      const value = JSON.stringify(data);
      if (localStorage.getItem(key) !== value) {
        nativeSet.call(localStorage, key, value);
        window.dispatchEvent(new CustomEvent('colorlink-shared-update', { detail: { key, data } }));
      }
    }
    hydrated = true;
    status(true);
  } catch { status(false); }
  finally { applying = false; busy = false; }
}
export function startSharedSync() {
  Storage.prototype.setItem = function(key, value) {
    const collection = keys[key as keyof typeof keys];
    const before = collection && this === localStorage ? read(key) : [];
    nativeSet.call(this, key, value);
    if (collection && this === localStorage && !applying) {
      pending.push(...diffRecords(collection, before, read(key)).map(change =>
        !hydrated && before.length === 0 ? { ...change, importOnly: true } : change));
      cachePending();
      void synchronize();
    }
  };
  // Import existing device data without allowing stale devices to overwrite cloud rows.
  for (const [key, collection] of Object.entries(keys)) {
    for (const record of read(key)) {
      const id = recordId(record, collection);
      if (id) pending.push({ collection, recordId: id, data: cleanRecord(record), importOnly: true });
    }
  }
  cachePending();
  void synchronize();
  window.setInterval(synchronize, 4000);
  window.addEventListener('focus', synchronize);
  window.addEventListener('online', synchronize);
}
