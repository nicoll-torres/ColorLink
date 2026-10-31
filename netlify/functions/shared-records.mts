import { sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { sharedRecords } from '../../db/schema.js';

const collections = new Set(['orders', 'clients', 'staff', 'inventory']);
const headers = { 'Cache-Control': 'no-store' };
export default async (request: Request) => {
  try {
    if (request.method === 'GET') {
      const rows = await db.select().from(sharedRecords);
      return Response.json(rows, { headers });
    }
    if (request.method !== 'POST') return new Response(null, { status: 405 });
    if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) {
      return new Response(null, { status: 403 });
    }
    const body = await request.json();
    if (!Array.isArray(body.changes) || body.changes.length > 500) return new Response(null, { status: 400 });
    // Validate the entire batch before writing any records.
    for (const change of body.changes) {
      if (!collections.has(change.collection) || typeof change.recordId !== 'string' || change.recordId.length > 300 ||
        !change.data || typeof change.data !== 'object' || Array.isArray(change.data) ||
        /"(?:password|token|secret|anonKey|apiKey)"\s*:/i.test(JSON.stringify(change.data))) {
        return new Response(null, { status: 400 });
      }
    }
    await db.transaction(async (tx) => {
      for (const change of body.changes) {
        const values = {
          collection: change.collection, recordId: change.recordId,
          data: change.data, deleted: change.deleted === true,
        };
        const insert = tx.insert(sharedRecords).values(values);
        if (change.importOnly) {
          await insert.onConflictDoNothing();
        } else {
          await insert.onConflictDoUpdate({
            target: [sharedRecords.collection, sharedRecords.recordId],
            set: {
              data: sql`coalesce(${sharedRecords.data}, '{}'::jsonb) || ${JSON.stringify(change.data)}::jsonb`,
              deleted: values.deleted, updatedAt: new Date().toISOString(),
            },
          });
        }
      }
    });
    return Response.json({ success: true }, { headers });
  } catch {
    return Response.json({ error: 'No se pudo sincronizar con la base central.' }, { status: 503, headers });
  }
};
