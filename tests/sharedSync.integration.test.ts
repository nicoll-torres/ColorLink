import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { transformSync } from 'esbuild';

const source = readFileSync(new URL('../src/sharedSyncRecords.ts', import.meta.url), 'utf8') + '\n' +
  readFileSync(new URL('../src/sharedSync.ts', import.meta.url), 'utf8').replace(/^import .*sharedSyncRecords';$/m, '');
const code = transformSync(source, { loader: 'ts', format: 'iife', globalName: 'sync' }).code;
const settle = async () => { for (let i = 0; i < 30; i++) await new Promise(resolve => setImmediate(resolve)); };

test('two independent browser caches share changes, retain failed writes, and respect cloud deletions', async () => {
  const records = new Map<string, any>();
  let offline = false;
  const fetch = async (_url: string, options: any = {}) => {
    if (offline) throw new Error('offline');
    if (options.method === 'POST') {
      for (const change of JSON.parse(options.body).changes) {
        const key = change.collection + ':' + change.recordId;
        if (change.importOnly && records.has(key)) continue;
        records.set(key, { ...change, data: { ...records.get(key)?.data, ...change.data } });
      }
      return { ok: true };
    }
    return { ok: true, json: async () => structuredClone([...records.values()]) };
  };
  function device(initial: any[] = []) {
    class Storage {
      values = new Map<string, string>();
      getItem(key: string) { return this.values.get(key) ?? null; }
      setItem(key: string, value: string) { this.values.set(key, value); }
    }
    const localStorage = new Storage();
    localStorage.setItem('colorlink_paint_requests', JSON.stringify(initial));
    const events: any[] = [];
    let tick: () => void;
    const window = { setInterval: (fn: () => void) => { tick = fn; }, addEventListener() {}, dispatchEvent: (event: any) => events.push(event) };
    const context = vm.createContext({ Storage, localStorage, window, fetch, CustomEvent: class { constructor(public type: string, public options: any) {} } });
    vm.runInContext(code, context);
    context.sync.startSharedSync();
    return { localStorage, events, poll: () => tick(), orders: () => JSON.parse(localStorage.getItem('colorlink_paint_requests')!) };
  }
  const first = device([{ id: 'order', status: 'new' }]);
  await settle();
  const second = device();
  await settle();
  assert.equal(second.orders()[0].status, 'new');
  first.localStorage.setItem('colorlink_paint_requests', JSON.stringify([{ id: 'order', status: 'packed' }]));
  await settle();
  second.poll();
  await settle();
  assert.equal(second.orders()[0].status, 'packed');
  assert.ok(second.events.some(event => event.type === 'colorlink-shared-update'));
  const stale = device([{ id: 'order', status: 'new' }]);
  await settle();
  assert.equal(stale.orders()[0].status, 'packed');
  offline = true;
  first.localStorage.setItem('colorlink_paint_requests', JSON.stringify([{ id: 'order', status: 'delivered' }]));
  await settle();
  assert.ok(JSON.parse(first.localStorage.getItem('colorlink_sync_outbox')!).length);
  offline = false;
  first.poll();
  await settle();
  second.poll();
  await settle();
  assert.equal(second.orders()[0].status, 'delivered');
  first.localStorage.setItem('colorlink_paint_requests', '[]');
  await settle();
  const oldDevice = device([{ id: 'order', status: 'new' }]);
  await settle();
  assert.deepEqual(oldDevice.orders(), []);
});
