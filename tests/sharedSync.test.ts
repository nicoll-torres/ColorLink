import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanRecord, diffRecords, recordId } from '../src/sharedSyncRecords';

test('only sends changed records and fields, preserving unrelated remote changes', () => {
  const old = [{ id: 'one', status: 'new', city: 'Bogota' }, { id: 'two', status: 'new' }];
  const next = [{ ...old[0], status: 'packed' }, old[1]];
  assert.deepEqual(diffRecords('orders', old, next), [
    { collection: 'orders', recordId: 'one', data: { status: 'packed' } },
  ]);
});
test('uses normalized account identifiers across devices', () => {
  assert.equal(recordId({ id: 'different-id', email: ' Person@Example.com ' }, 'clients'), 'person@example.com');
});
test('propagates deletion of the last record', () => {
  assert.deepEqual(diffRecords('staff', [{ id: 'one' }], []), [
    { collection: 'staff', recordId: 'one', data: {}, deleted: true },
  ]);
});
test('omits credentials recursively from shared data', () => {
  assert.deepEqual(cleanRecord({ name: 'Person', password: 'placeholder', nested: { token: 'placeholder', status: 'new' } }),
    { name: 'Person', nested: { status: 'new' } });
});
test('unchanged snapshots do not generate writes', () => {
  assert.deepEqual(diffRecords('orders', [{ id: 'one' }], [{ id: 'one' }]), []);
});
