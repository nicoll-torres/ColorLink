import { pgTable, text, jsonb, boolean, timestamp, primaryKey, index } from "drizzle-orm/pg-core";

// Registros compartidos entre todos los dispositivos (pedidos, clientes,
// usuarios, conductores/empacadores e inventario). Cada fila es un registro
// identificado por su colección y su id dentro de la app.
export const sharedRecords = pgTable(
  "shared_records",
  {
    collection: text().notNull(),
    recordId: text("record_id").notNull(),
    data: jsonb(),
    deleted: boolean().notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.collection, t.recordId] }),
    index("shared_records_updated_at_idx").on(t.updatedAt),
  ]
);
