export type Change = { collection: string; recordId: string; data: Record<string, any>; deleted?: boolean; importOnly?: boolean };
export function cleanRecord(value: any): any {
  if (Array.isArray(value)) return value.map(cleanRecord);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !/password|token|secret|anonkey|apikey/i.test(key))
    .map(([key, item]) => [key, cleanRecord(item)]));
}
export function recordId(record: any, collection: string): string {
  return String((collection === 'clients' || collection === 'staff') && record.email
    ? record.email.trim().toLowerCase() : record.id ?? record.sku ?? '');
}
export function diffRecords(collection: string, before: any[], after: any[]): Change[] {
  const old = new Map(before.map(r => [recordId(r, collection), cleanRecord(r)]));
  const next = new Set(after.map(r => recordId(r, collection)));
  const changes: Change[] = [];
  for (const record of after) {
    const id = recordId(record, collection);
    if (!id) continue;
    const data = cleanRecord(record);
    const previous = old.get(id);
    const patch = previous ? Object.fromEntries(Object.entries(data).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(previous[k]))) : data;
    if (Object.keys(patch).length) changes.push({ collection, recordId: id, data: patch });
  }
  for (const [id] of old) if (!next.has(id)) changes.push({ collection, recordId: id, data: {}, deleted: true });
  return changes;
}
