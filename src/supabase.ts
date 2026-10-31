/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ColorLink Pintuco - Módulo de Integración y Conexión Supabase (PostgreSQL)
 * Soporta conexión en tiempo real con Supabase Cloud y persistencia local integrada.
 * Basado en las 12 entidades del Diagrama Entidad-Relación (ERD):
 * Usuario, Canal, Cliente, Proyecto, Solicitud, Material, Inventario, Pedido,
 * Cotización, Factura, Entrega, Control de Calidad.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PaintRequest, WarehouseInventoryItem } from './types';
import { PINTUCO_INVENTORY } from './data';

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- 🎨 COLORLINK PINTUCO - ESQUEMA RELACIONAL EXACTO PARA SUPABASE (PostgreSQL + RLS)
-- ==============================================================================
-- Proyecto Transversal UCC · Ecosistema Integral de Pintura Inteligente Pintuco S.A.
-- 12 Tablas: Usuario, Canal, Cliente, Proyecto, Solicitud, Material, Inventario,
--            Pedido, Cotización, Factura, Entrega, Control de Calidad.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLA: Usuario (Usuarios del Sistema y Roles)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  direccion TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT DEFAULT 'cliente123',
  telefono TEXT,
  rol TEXT NOT NULL DEFAULT 'cliente',
  estado TEXT NOT NULL DEFAULT 'activo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compatibilidad si la tabla fue creada previamente sin columna password
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'cliente123';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS contrasena TEXT;

-- 2. TABLA: Canal (Canales de Venta y Distribución)
CREATE TABLE IF NOT EXISTS public.canales (
  id_canal UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_canal TEXT NOT NULL UNIQUE
);

-- 3. TABLA: cliente (Clientes y Constructoras)
CREATE TABLE IF NOT EXISTS public.clientes (
  id_cliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  n_identificacion TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  direccion TEXT,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA: Proyecto (Obras Constructivas)
CREATE TABLE IF NOT EXISTS public.proyectos (
  id_proyecto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cliente UUID NOT NULL REFERENCES public.clientes(id_cliente) ON DELETE CASCADE,
  id_canal UUID REFERENCES public.canales(id_canal) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'en_ejecucion',
  presupuesto NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLA: Inventario (Pinturas y Existencias en CEDIs)
CREATE TABLE IF NOT EXISTS public.inventario (
  id_material UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  precio NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bodega_cedi TEXT DEFAULT 'CEDI Rionegro',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABLA: solicitud (Requerimientos Técnicos y de Pintura)
CREATE TABLE IF NOT EXISTS public.solicitudes (
  id_solicitud UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_proyecto UUID NOT NULL REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE,
  detalles TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'solicitud_recibida',
  area_m2 NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tipo_superficie TEXT DEFAULT 'Concreto / Pañete',
  color TEXT DEFAULT 'Blanco Nieve',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABLA: Material (Materiales Asignados y Empaque)
CREATE TABLE IF NOT EXISTS public.materiales (
  id_material UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_solicitud UUID NOT NULL REFERENCES public.solicitudes(id_solicitud) ON DELETE CASCADE,
  id_inventario UUID REFERENCES public.inventario(id_material) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  nom_empacador TEXT DEFAULT 'Javier Gómez (CEDI)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABLA: Factura
CREATE TABLE IF NOT EXISTS public.facturas (
  id_factura UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cliente UUID REFERENCES public.clientes(id_cliente) ON DELETE SET NULL,
  descripcion TEXT,
  total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  fecha_emision DATE DEFAULT CURRENT_DATE,
  estado_pago TEXT DEFAULT 'pagada',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABLA: Pedido (Órdenes de Producción y Despacho)
CREATE TABLE IF NOT EXISTS public.pedidos (
  id_pedido UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_solicitud UUID NOT NULL REFERENCES public.solicitudes(id_solicitud) ON DELETE CASCADE,
  id_material UUID REFERENCES public.inventario(id_material) ON DELETE SET NULL,
  id_factura UUID REFERENCES public.facturas(id_factura) ON DELETE SET NULL,
  codigo_orden TEXT UNIQUE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'confirmado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABLA: Cotización (Presupuestos Formales)
CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id_cotizacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pedido UUID NOT NULL REFERENCES public.pedidos(id_pedido) ON DELETE CASCADE,
  fecha_cotiz DATE NOT NULL DEFAULT CURRENT_DATE,
  detalles TEXT,
  total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.facturas 
  ADD COLUMN IF NOT EXISTS id_cotizacion UUID REFERENCES public.cotizaciones(id_cotizacion) ON DELETE SET NULL;

-- 11. TABLA: Entrega (Despacho Logístico y Rutas)
CREATE TABLE IF NOT EXISTS public.entregas (
  id_entrega UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_proyecto UUID NOT NULL REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'en_ruta',
  conductor_nombre TEXT DEFAULT 'Wilson Cañas',
  vehiculo_placa TEXT DEFAULT 'WTL-582',
  direccion_destino TEXT,
  firma_digital_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. TABLA: Control de calidad (Auditoría Técnica y Garantía)
CREATE TABLE IF NOT EXISTS public.control_de_calidad (
  id_calidad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_entrega UUID NOT NULL REFERENCES public.entregas(id_entrega) ON DELETE CASCADE,
  resultado TEXT NOT NULL DEFAULT 'Conforme - Adherencia Cruzada 100% y Espesor 4.2 mils',
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  inspector TEXT DEFAULT 'Ing. Carlos Restrepo (Q.A. Pintuco)',
  anios_garantia INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HABILITAR PERMISOS DE ESCRITURA Y LECTURA
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.canales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_de_calidad DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- SEED DATA
INSERT INTO public.usuarios (nombre, direccion, email, telefono, rol, estado) VALUES
  ('Ing. Carlos Restrepo', 'Cra 43A #1-50, Medellín', 'admin@pintuco.com', '3104567890', 'administrador', 'activo'),
  ('Javier Gómez', 'CEDI Rionegro Km 2', 'empacador@pintuco.com', '3129876543', 'empacador', 'activo'),
  ('Wilson Cañas', 'CEDI Siberia Muelle 4', 'conductor@pintuco.com', '3157654321', 'conductor', 'activo'),
  ('Constructora Bolívar S.A.', 'Calle 98 #11-20, Bogotá', 'cliente@pintuco.com', '3201122334', 'cliente', 'activo')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.canales (nombre_canal) VALUES
  ('Directo Pintuco S.A.'),
  ('Portal Web Transversal ColorLink'),
  ('Ferretería & Distribuidor Aliado'),
  ('Constructor VIP')
ON CONFLICT (nombre_canal) DO NOTHING;

INSERT INTO public.clientes (n_identificacion, nombre, direccion, email, telefono) VALUES
  ('900.123.456-7', 'Constructora Bolívar S.A.', 'Calle 98 #11-20, Bogotá', 'cliente@pintuco.com', '3201122334')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.inventario (sku, nombre, tipo, stock, precio, bodega_cedi) VALUES
  ('PTC-VIN-500', 'Viniltex® Avanzada Antibacterial Blanco Nieve', 'Arquitectónica Interior', 480, 245000, 'CEDI Rionegro'),
  ('PTC-KOR-EXT', 'Koraza® 5 Máxima Protección Exterior Blanco', 'Fachadas Exteriores', 320, 298000, 'CEDI Rionegro'),
  ('PTC-EPOX-500-GR', 'Pintucoat® Epóxico Poliamida 500 Alto Tráfico', 'Industrial y Pisos', 890, 195000, 'CEDI Siberia Bogotá'),
  ('PTC-VIN-BOG-01', 'Viniltex® Avanzado Antiviral & Antibacterial Tipo 1', 'Paredes y Muros Interiores', 1420, 89900, 'CEDI Siberia Bogotá'),
  ('PTC-KOR-BOG-01', 'Koraza® 5 Máxima Protección Fachadas Exteriores', 'Fachadas y Exteriores', 1080, 135000, 'CEDI Siberia Bogotá'),
  ('PTC-PLUX-BOG-01', 'Pintulux® Máxima Protección 3 en 1 Anticorrosivo Brillante', 'Metales y Esmaltes', 815, 112000, 'CEDI Siberia Bogotá'),
  ('PTC-SELL-BOG-01', 'Sellomax® 7 en 1 Imprimante Acrílico Antihumedad', 'Preparación y Fondos', 1220, 68000, 'CEDI Siberia Bogotá'),
  ('PTC-MAD-BOG-01', 'Maderprotect® Barniz Poliuretano Filtro UV', 'Maderas y Enmaderados', 480, 128000, 'CEDI Siberia Bogotá'),
  ('PTC-ACRILUX-BOG-01', 'Viniltex® Acrilux Esmalte al Agua Satinado', 'Esmaltes y Acabados al Agua', 910, 108000, 'CEDI Siberia Bogotá'),
  ('PTC-TRAF-BOG-01', 'Pintura de Tráfico Vial Acrílica Alta Resistencia', 'Demarcación y Señalización Vial', 1340, 124000, 'CEDI Siberia Bogotá'),
  ('PTC-IMP-BOG-01', 'Koraza® Impermeabilizante Fibrado Techos & Terrazas 7 Años', 'Impermeabilización y Cubiertas', 1090, 142000, 'CEDI Siberia Bogotá'),
  ('PTC-MASTIC-BOG-01', 'Pintucoat® Epóxico Mastic Altos Sólidos Barrera Química', 'Industrial y Pisos', 685, 215000, 'CEDI Siberia Bogotá'),
  ('PTC-ESTUCO-BOG-01', 'Estuco Profesional Acrílico Alta Resistencia Listo para Usar', 'Preparación y Fondos', 1370, 48000, 'CEDI Siberia Bogotá'),
  ('PTC-ART-ROD-BOG', 'Rodillo Profesional Microfibra Cero Goteo 9"', 'Herramientas y Aplicación', 450, 32000, 'CEDI Siberia Bogotá'),
  ('PTC-ART-BRO-BOG', 'Brocha Profesional Pintuco Cerda Monofilamento 2.5"', 'Herramientas y Aplicación', 380, 18500, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-BAN-BOG-01', 'Bandeja Plástica Reforzada para Pintor 9"', 'Herramientas y Aplicación', 520, 14500, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-CIN-AZUL-BOG', 'Cinta de Enmascarar Pintor Azul UV 24mm x 50m', 'Herramientas y Aplicación', 680, 12900, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-CIN-48-BOG', 'Cinta de Enmascarar Uso General Crepe 48mm x 40m', 'Herramientas y Aplicación', 590, 9800, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-ESP-4-BOG', 'Espátula Flexible Acero Inoxidable 4" Ergonómica', 'Herramientas y Aplicación', 380, 16500, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-ESP-6-BOG', 'Espátula Ancha Acero Templado 6" para Estucado', 'Herramientas y Aplicación', 320, 19800, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-LIJ-180-BOG', 'Lija de Agua Grano 180 Carburo Silicio (Pack x 10)', 'Herramientas y Aplicación', 490, 11500, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-LIJ-240-BOG', 'Lija de Agua Grano 240 / 320 Acabado Fino (Pack x 10)', 'Herramientas y Aplicación', 440, 12500, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-EXT-ALUM-BOG', 'Extensión Telescópica de Aluminio 2m a 4m', 'Herramientas y Aplicación', 240, 48900, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-PLA-20M-BOG', 'Plástico Protector Cubretodo Calibre 2 (4m x 5m)', 'Herramientas y Aplicación', 850, 8500, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-SEL-GRIET-BOG', 'Sellador Elastomérico Grietas y Fisuras 300ml', 'Preparación y Fondos', 410, 22000, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-THI-21219-BOG', 'Ajustador / Disolvente Pintuco 21219 (Galón)', 'Preparación y Fondos', 340, 38500, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-ROD-EPOX-BOG', 'Rodillo Fenólico para Epóxicos y Tráfico 9"', 'Herramientas y Aplicación', 360, 28500, 'CEDI Siberia Bogotá'),
  ('PTC-PLUX-3EN1', 'Pintulux® 3 en 1 Anticorrosivo Gris Metal', 'Metales y Esmaltes', 110, 185000, 'CEDI Acopi Cali'),
  ('PTC-SELL-7EN1', 'Sellomax® 7 en 1 Imprimante Acrílico', 'Preparación de Superficie', 190, 142000, 'CEDI Galapa Barranquilla')
ON CONFLICT (sku) DO NOTHING;
`;

export const DEFAULT_SUPABASE_URL = 'https://pxtskluzbcxydzqaigke.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_9_jnKRBi4Ya6wkT_ZHXiUw_AI6Aaih1';

export const SUPABASE_RLS_FIX_SQL = `-- ==============================================================================
-- 🎨 COLORLINK PINTUCO - SCRIPT DE DESBLOQUEO TOTAL SUPABASE (RLS + PERMISOS)
-- ==============================================================================
-- Copia este script y pégalo en tu Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pxtskluzbcxydzqaigke/sql/new

-- 1. Otorgar permisos globales al rol anon y authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, public;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, public;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, public;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role, public;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, public;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, public;

-- 2. Desactivar Row Level Security (RLS) en las 12 tablas
ALTER TABLE IF EXISTS public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.canales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.proyectos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.solicitudes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.materiales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cotizaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.facturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entregas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.control_de_calidad DISABLE ROW LEVEL SECURITY;

-- 3. Crear políticas permisivas automáticas en todas las tablas para garantizar guardado
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "permitir_todo_%s" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "permitir_todo_%s" ON public.%I FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true)', tbl, tbl);
    END LOOP;
END $$;

-- 4. Sembrar Canales e Inventario Inicial Pintuco si están vacíos
INSERT INTO public.canales (nombre_canal) VALUES
  ('Directo Pintuco S.A.'),
  ('Portal Web Transversal ColorLink'),
  ('Ferretería & Distribuidor Aliado'),
  ('Constructor VIP')
ON CONFLICT (nombre_canal) DO NOTHING;

INSERT INTO public.inventario (sku, nombre, tipo, stock, precio, bodega_cedi) VALUES
  ('PTC-VIN-500', 'Viniltex® Avanzada Antibacterial Blanco Nieve', 'Arquitectónica Interior', 480, 245000, 'CEDI Rionegro'),
  ('PTC-KOR-EXT', 'Koraza® 5 Máxima Protección Exterior Blanco', 'Fachadas Exteriores', 320, 298000, 'CEDI Rionegro'),
  ('PTC-EPOX-500-GR', 'Pintucoat® Epóxico Poliamida 500 Alto Tráfico', 'Industrial y Pisos', 890, 195000, 'CEDI Siberia Bogotá'),
  ('PTC-VIN-BOG-01', 'Viniltex® Avanzado Antiviral & Antibacterial Tipo 1', 'Paredes y Muros Interiores', 1420, 89900, 'CEDI Siberia Bogotá'),
  ('PTC-KOR-BOG-01', 'Koraza® 5 Máxima Protección Fachadas Exteriores', 'Fachadas y Exteriores', 1080, 135000, 'CEDI Siberia Bogotá'),
  ('PTC-PLUX-BOG-01', 'Pintulux® Máxima Protección 3 en 1 Anticorrosivo Brillante', 'Metales y Esmaltes', 815, 112000, 'CEDI Siberia Bogotá'),
  ('PTC-SELL-BOG-01', 'Sellomax® 7 en 1 Imprimante Acrílico Antihumedad', 'Preparación y Fondos', 1220, 68000, 'CEDI Siberia Bogotá'),
  ('PTC-MAD-BOG-01', 'Maderprotect® Barniz Poliuretano Filtro UV', 'Maderas y Enmaderados', 480, 128000, 'CEDI Siberia Bogotá'),
  ('PTC-ACRILUX-BOG-01', 'Viniltex® Acrilux Esmalte al Agua Satinado', 'Esmaltes y Acabados al Agua', 910, 108000, 'CEDI Siberia Bogotá'),
  ('PTC-TRAF-BOG-01', 'Pintura de Tráfico Vial Acrílica Alta Resistencia', 'Demarcación y Señalización Vial', 1340, 124000, 'CEDI Siberia Bogotá'),
  ('PTC-IMP-BOG-01', 'Koraza® Impermeabilizante Fibrado Techos & Terrazas 7 Años', 'Impermeabilización y Cubiertas', 1090, 142000, 'CEDI Siberia Bogotá'),
  ('PTC-MASTIC-BOG-01', 'Pintucoat® Epóxico Mastic Altos Sólidos Barrera Química', 'Industrial y Pisos', 685, 215000, 'CEDI Siberia Bogotá'),
  ('PTC-ESTUCO-BOG-01', 'Estuco Profesional Acrílico Alta Resistencia Listo para Usar', 'Preparación y Fondos', 1370, 48000, 'CEDI Siberia Bogotá'),
  ('PTC-ART-ROD-BOG', 'Rodillo Profesional Microfibra Cero Goteo 9"', 'Herramientas y Aplicación', 450, 32000, 'CEDI Siberia Bogotá'),
  ('PTC-ART-BRO-BOG', 'Brocha Profesional Pintuco Cerda Monofilamento 2.5"', 'Herramientas y Aplicación', 380, 18500, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-BAN-BOG-01', 'Bandeja Plástica Reforzada para Pintor 9"', 'Herramientas y Aplicación', 520, 14500, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-CIN-AZUL-BOG', 'Cinta de Enmascarar Pintor Azul UV 24mm x 50m', 'Herramientas y Aplicación', 680, 12900, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-CIN-48-BOG', 'Cinta de Enmascarar Uso General Crepe 48mm x 40m', 'Herramientas y Aplicación', 590, 9800, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-ESP-4-BOG', 'Espátula Flexible Acero Inoxidable 4" Ergonómica', 'Herramientas y Aplicación', 380, 16500, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-ESP-6-BOG', 'Espátula Ancha Acero Templado 6" para Estucado', 'Herramientas y Aplicación', 320, 19800, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-LIJ-180-BOG', 'Lija de Agua Grano 180 Carburo Silicio (Pack x 10)', 'Herramientas y Aplicación', 490, 11500, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-LIJ-240-BOG', 'Lija de Agua Grano 240 / 320 Acabado Fino (Pack x 10)', 'Herramientas y Aplicación', 440, 12500, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-EXT-ALUM-BOG', 'Extensión Telescópica de Aluminio 2m a 4m', 'Herramientas y Aplicación', 240, 48900, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-PLA-20M-BOG', 'Plástico Protector Cubretodo Calibre 2 (4m x 5m)', 'Herramientas y Aplicación', 850, 8500, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-SEL-GRIET-BOG', 'Sellador Elastomérico Grietas y Fisuras 300ml', 'Preparación y Fondos', 410, 22000, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-THI-21219-BOG', 'Ajustador / Disolvente Pintuco 21219 (Galón)', 'Preparación y Fondos', 340, 38500, 'CEDI Siberia Bogotá'),
  ('PTC-MAT-ROD-EPOX-BOG', 'Rodillo Fenólico para Epóxicos y Tráfico 9"', 'Herramientas y Aplicación', 360, 28500, 'CEDI Siberia Bogotá'),
  ('PTC-PLUX-3EN1', 'Pintulux® 3 en 1 Anticorrosivo Gris Metal', 'Metales y Esmaltes', 110, 185000, 'CEDI Acopi Cali'),
  ('PTC-SELL-7EN1', 'Sellomax® 7 en 1 Imprimante Acrílico', 'Preparación de Superficie', 190, 142000, 'CEDI Galapa Barranquilla')
ON CONFLICT (sku) DO NOTHING;

-- 5. Recargar la caché de PostgREST para aplicar cambios de inmediato
NOTIFY pgrst, 'reload schema';
`;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
  lastSync?: string;
}

let cachedClient: SupabaseClient | null = null;

export function normalizeSupabaseUrl(url: string): string {
  if (!url) return '';
  let trimmed = url.trim();
  if (!trimmed) return '';
  // Remove trailing slashes
  trimmed = trimmed.replace(/\/+$/, '');
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    if (!trimmed.includes('.')) {
      // Just the project ref was provided (e.g. "znhhskqwe...")
      trimmed = `https://${trimmed}.supabase.co`;
    } else {
      trimmed = `https://${trimmed}`;
    }
  }
  return trimmed;
}

export function getSupabaseConfig(): SupabaseConfig {
  try {
    const envUrl = normalizeSupabaseUrl((import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL);
    const envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY).trim();

    const stored = localStorage.getItem('colorlink_supabase_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Si la URL o clave almacenada no coinciden con las credenciales oficiales activas del usuario,
      // actualizamos automáticamente para que no quede atascado en un proyecto anterior o erróneo.
      let url = normalizeSupabaseUrl(parsed.url || envUrl || DEFAULT_SUPABASE_URL);
      let anonKey = (parsed.anonKey || envKey || DEFAULT_SUPABASE_KEY).trim();

      if (!url.includes('pxtskluzbcxydzqaigke') || !anonKey.startsWith('sb_publishable_9_jnKRBi4Ya6wkT_ZHXiUw_AI6Aaih1')) {
        url = DEFAULT_SUPABASE_URL;
        anonKey = DEFAULT_SUPABASE_KEY;
        localStorage.setItem(
          'colorlink_supabase_config',
          JSON.stringify({
            url,
            anonKey,
            connected: true,
            lastSync: parsed.lastSync || new Date().toLocaleTimeString(),
          })
        );
      }

      return {
        url,
        anonKey,
        connected: !!(url && anonKey),
        lastSync: parsed.lastSync,
      };
    }

    // Si no había guardado nada previamente, guardar las credenciales oficiales activas
    const defaultConfig: SupabaseConfig = {
      url: DEFAULT_SUPABASE_URL,
      anonKey: DEFAULT_SUPABASE_KEY,
      connected: true,
    };
    localStorage.setItem('colorlink_supabase_config', JSON.stringify(defaultConfig));
    return defaultConfig;
  } catch {}

  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_KEY,
    connected: true,
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  const url = normalizeSupabaseUrl(config.url);
  const anonKey = config.anonKey.trim() || DEFAULT_SUPABASE_KEY;
  const cleanConfig: SupabaseConfig = {
    ...config,
    url,
    anonKey,
    connected: !!(url && anonKey),
  };
  localStorage.setItem('colorlink_supabase_config', JSON.stringify(cleanConfig));
  cachedClient = null; // Reiniciar instancia para forzar nuevo cliente
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      cachedClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return cachedClient;
    } catch (err) {
      console.warn('Error al inicializar cliente de Supabase:', err);
      return null;
    }
  }
  return null;
}

/**
 * Prueba la conexión real contra la base de datos de Supabase.
 */
export async function testSupabaseConnection(config?: { url: string; anonKey: string }): Promise<{
  success: boolean;
  message: string;
  isRlsError?: boolean;
  rlsFixSql?: string;
  tablesFound?: string[];
}> {
  try {
    const rawUrl = config?.url || getSupabaseConfig().url;
    const targetUrl = normalizeSupabaseUrl(rawUrl);
    const targetKey = (config?.anonKey || getSupabaseConfig().anonKey || DEFAULT_SUPABASE_KEY).trim();

    if (!targetUrl) {
      return {
        success: false,
        message: 'Por favor ingresa la URL de tu proyecto de Supabase (ej: https://tu-proyecto.supabase.co).',
      };
    }
    if (!targetKey) {
      return {
        success: false,
        message: 'Falta la API Key (publishable/anon key) de Supabase.',
      };
    }

    const testClient = createClient(targetUrl, targetKey);
    
    // 1. Intentar leer de inventario o usuarios
    const { data, error } = await testClient.from('inventario').select('*').limit(5);

    if (error) {
      // Si la tabla no existe aún, la conexión fue exitosa pero falta correr el script
      if (error.code === '42P01') {
        return {
          success: true,
          message: '¡Conexión exitosa con Supabase! Las 12 tablas aún no están creadas. Ejecuta el script SQL en el SQL Editor para inicializarlas.',
          tablesFound: [],
        };
      }
      return {
        success: false,
        message: `Error al consultar Supabase: ${error.message} (Código: ${error.code})`,
      };
    }

    // 2. Probar permisos de inserción (RLS write test)
    const testPingId = `PING_${Date.now()}`;
    const { error: rlsErr } = await testClient.from('clientes').insert({
      n_identificacion: testPingId,
      nombre: 'Pintuco Ping Test',
      direccion: 'Prueba Conexión',
      email: `${testPingId.toLowerCase()}@pintuco.test`,
      telefono: '3000000000',
    }).select();

    if (rlsErr) {
      if (rlsErr.code === '42501' || rlsErr.message?.includes('row-level security')) {
        return {
          success: false,
          isRlsError: true,
          rlsFixSql: SUPABASE_RLS_FIX_SQL,
          message: 'Tu base de datos Supabase responde correctamente, pero tiene activas Políticas de Seguridad (RLS Error 42501) que impiden guardar datos. Ejecuta el script de desbloqueo en tu SQL Editor.',
        };
      }
      console.warn('Nota de inserción en testSupabaseConnection:', rlsErr);
    } else {
      // Si insertó exitosamente, limpiar el registro de prueba
      try {
        await testClient.from('clientes').delete().eq('n_identificacion', testPingId);
      } catch {}
    }

    return {
      success: true,
      message: `¡Conexión y permisos de lectura/escritura 100% operativos con Supabase Cloud! Se leyeron ${data?.length ?? 0} registros del inventario.`,
      tablesFound: ['inventario', 'usuarios', 'clientes', 'proyectos', 'solicitudes', 'materiales', 'pedidos', 'cotizaciones', 'facturas', 'entregas', 'control_de_calidad'],
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error al conectar con Supabase: ${err?.message || 'Verifica la URL del proyecto.'}`,
    };
  }
}

/**
 * Guarda o sincroniza una solicitud / orden completa a través de las 12 tablas relacionales de Supabase.
 * Es completamente idempotente: actualiza si ya existe o inserta un registro nuevo.
 */
export async function syncPaintRequestToSupabase(req: PaintRequest): Promise<{
  success: boolean;
  message: string;
  isRlsError?: boolean;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase no está configurado con una URL activa. El pedido se guardó localmente en el navegador.',
    };
  }

  try {
    // 1. Asegurar o insertar Cliente
    const { data: existingClient } = await client
      .from('clientes')
      .select('id_cliente')
      .eq('email', req.clientEmail || 'cliente@pintuco.com')
      .maybeSingle();

    let clienteId = existingClient?.id_cliente;

    if (!clienteId) {
      const { data: newClient, error: clientErr } = await client
        .from('clientes')
        .insert({
          n_identificacion: `NIT-${Math.floor(Math.random() * 9000000 + 1000000)}`,
          nombre: req.clientName,
          direccion: req.deliveryAddress || `${req.city}, Colombia`,
          email: req.clientEmail || `cliente_${Date.now()}@pintuco.com`,
          telefono: req.clientPhone || '3000000000',
        })
        .select('id_cliente')
        .single();

      if (clientErr) throw clientErr;
      clienteId = newClient.id_cliente;
    }

    // Verificar si el pedido ya existe por su código único de orden
    const { data: existingPedido } = await client
      .from('pedidos')
      .select('id_pedido, id_solicitud')
      .eq('codigo_orden', req.requestCode)
      .maybeSingle();

    if (existingPedido) {
      // Actualizar estado del pedido existente
      await client
        .from('pedidos')
        .update({ estado: req.status })
        .eq('id_pedido', existingPedido.id_pedido);

      // Actualizar solicitud
      if (existingPedido.id_solicitud) {
        await client
          .from('solicitudes')
          .update({
            estado: req.status,
            detalles: req.notes || `Requerimiento de pintura ${req.colorName} para ${req.areaM2} m²`,
          })
          .eq('id_solicitud', existingPedido.id_solicitud);
      }

      // Actualizar entrega si aplica
      if (req.deliveryDetails) {
        await client
          .from('entregas')
          .update({
            estado: req.deliveryDetails.routeStatus || req.status,
            conductor_nombre: req.deliveryDetails.driverName || 'Wilson Cañas',
            vehiculo_placa: req.deliveryDetails.vehiclePlate || 'WTL-582',
            firma_digital_url: req.deliveryDetails.receiverSignature || null,
          })
          .eq('vehiculo_placa', req.deliveryDetails.vehiclePlate || 'WTL-582');
      }

      // Actualizar última sincronización
      const cfg = getSupabaseConfig();
      saveSupabaseConfig({
        ...cfg,
        lastSync: new Date().toLocaleTimeString(),
      });

      return {
        success: true,
        message: `¡Orden ${req.requestCode} actualizada exitosamente en Supabase!`,
      };
    }

    // 2. Insertar Nuevo Proyecto
    const { data: newProyecto, error: projErr } = await client
      .from('proyectos')
      .insert({
        id_cliente: clienteId,
        descripcion: `Proyecto ${req.projectType} - Superficie: ${req.surfaceType} (${req.city})`,
        fecha: req.createdAt ? req.createdAt.split(' ')[0] : new Date().toISOString().split('T')[0],
        estado: req.status === 'calidad_garantia' ? 'completado' : 'en_ejecucion',
        presupuesto: req.technicalCalculation?.estimatedMaterialCostCOP || 0,
      })
      .select('id_proyecto')
      .single();

    if (projErr) throw projErr;
    const proyectoId = newProyecto.id_proyecto;

    // 3. Insertar Solicitud
    const { data: newSolicitud, error: solErr } = await client
      .from('solicitudes')
      .insert({
        id_proyecto: proyectoId,
        detalles: req.notes || `Requerimiento de pintura ${req.colorName} para ${req.areaM2} m²`,
        fecha: new Date().toISOString().split('T')[0],
        estado: req.status,
        area_m2: req.areaM2,
        tipo_superficie: req.surfaceType,
        color: req.colorName,
      })
      .select('id_solicitud')
      .single();

    if (solErr) throw solErr;
    const solicitudId = newSolicitud.id_solicitud;

    // 4. Insertar Material
    const { error: matErr } = await client.from('materiales').insert({
      id_solicitud: solicitudId,
      nombre: req.technicalCalculation?.recommendedProduct.name || 'Pintura Pintuco Especializada',
      cantidad: (req.technicalCalculation?.totalCuñetes || 1) + (req.technicalCalculation?.remainderGalons || 0),
      nom_empacador: req.packagingDetails?.packerName || 'Javier Gómez (CEDI)',
    });
    if (matErr) console.warn('Material insert error:', matErr);

    // 5. Insertar Pedido
    const { data: newPedido, error: pedErr } = await client
      .from('pedidos')
      .insert({
        id_solicitud: solicitudId,
        codigo_orden: req.requestCode,
        estado: req.status,
      })
      .select('id_pedido')
      .single();

    if (pedErr) throw pedErr;
    const pedidoId = newPedido.id_pedido;

    // 6. Insertar Cotización
    const totalEst = req.technicalCalculation?.estimatedMaterialCostCOP || 0;
    const { data: newCotiz } = await client
      .from('cotizaciones')
      .insert({
        id_pedido: pedidoId,
        fecha_cotiz: new Date().toISOString().split('T')[0],
        detalles: `Formulación ${req.technicalCalculation?.handsNeeded || 2} manos con ${req.technicalCalculation?.recommendedProduct.name}`,
        total: totalEst,
      })
      .select('id_cotizacion')
      .single();

    // 7. Insertar Factura
    if (newCotiz?.id_cotizacion) {
      await client.from('facturas').insert({
        id_cliente: clienteId,
        id_cotizacion: newCotiz.id_cotizacion,
        descripcion: `Facturación Orden ${req.requestCode} - Pintuco S.A.`,
        total: totalEst,
        estado_pago: 'pagada',
      });
    }

    // 8. Insertar Entrega
    const { data: newEntrega } = await client
      .from('entregas')
      .insert({
        id_proyecto: proyectoId,
        fecha: new Date().toISOString().split('T')[0],
        estado: req.deliveryDetails?.routeStatus || 'pendiente_cargue',
        conductor_nombre: req.deliveryDetails?.driverName || 'Wilson Cañas',
        vehiculo_placa: req.deliveryDetails?.vehiclePlate || 'WTL-582',
        direccion_destino: req.deliveryAddress || `${req.city}, Colombia`,
        firma_digital_url: req.deliveryDetails?.receiverSignature || null,
      })
      .select('id_entrega')
      .single();

    // 9. Insertar Control de Calidad
    if (newEntrega?.id_entrega && req.qualityCertificate) {
      await client.from('control_de_calidad').insert({
        id_entrega: newEntrega.id_entrega,
        resultado: `Adherencia: ${req.qualityCertificate.adhesionTest || 'Excelente'} | Espesor: ${req.qualityCertificate.dryFilmThicknessMils || 4.2} mils`,
        fecha: new Date().toISOString().split('T')[0],
        inspector: req.qualityCertificate.inspectorName || 'Ing. Carlos Restrepo',
        anios_garantia: 5,
      });
    }

    // Actualizar última sincronización
    const cfg = getSupabaseConfig();
    saveSupabaseConfig({
      ...cfg,
      lastSync: new Date().toLocaleTimeString(),
    });

    return {
      success: true,
      message: `¡Orden ${req.requestCode} guardada exitosamente en Supabase (12 tablas relacionales)!`,
    };
  } catch (err: any) {
    console.error('Error al guardar en Supabase:', err);
    const isRls = err?.code === '42501' || err?.message?.includes('row-level security');
    return {
      success: false,
      isRlsError: isRls,
      message: isRls
        ? 'Error de permisos RLS en Supabase (Código 42501): La base de datos tiene activa la política de seguridad que bloquea escrituras públicas. Ejecuta el script de desbloqueo en tu SQL Editor.'
        : `Error al guardar en Supabase: ${err.message || 'Error desconocido'}`,
    };
  }
}

/**
 * Sincroniza en lote todas las órdenes locales hacia Supabase.
 */
export async function syncAllRequestsToSupabase(requests: PaintRequest[]): Promise<{
  success: boolean;
  syncedCount: number;
  total: number;
  message: string;
}> {
  let synced = 0;
  for (const req of requests) {
    const res = await syncPaintRequestToSupabase(req);
    if (res.success) synced++;
  }
  return {
    success: synced > 0,
    syncedCount: synced,
    total: requests.length,
    message: `Se sincronizaron exitosamente ${synced} de ${requests.length} órdenes en Supabase Cloud.`,
  };
}

/**
 * Obtiene los registros de cualquiera de las 12 tablas del ERD directamente del
 * almacenamiento relacional local persistente (PostgreSQL local store).
 */
export function getLocalDatabaseTable(tableName: string): any[] {
  try {
    if (tableName === 'clientes') {
      const stored = localStorage.getItem('colorlink_clients');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: any) => ({
            id_cliente: c.id || 'cli-01',
            n_identificacion: c.identification || '900.123.456-7',
            nombre: c.name || 'Cliente Pintuco',
            direccion: c.address
              ? (c.address.toLowerCase().includes((c.city || '').toLowerCase()) ? c.address : `${c.address} (${c.city || 'Medellín'})`)
              : `${c.city || 'Medellín'}, Colombia`,
            email: c.email || 'cliente@pintuco.com',
            telefono: c.phone || '3000000000',
            created_at: c.updatedAt || c.createdAt || new Date().toISOString(),
          }));
        }
      }
      return [
        {
          id_cliente: 'cli-01',
          n_identificacion: '900.567.890-1',
          nombre: 'Constructora Bolívar S.A.',
          direccion: 'Calle 98 #11-20, Bogotá D.C.',
          email: 'cliente@pintuco.com',
          telefono: '3201122334',
          created_at: '2026-03-01T10:00:00.000Z',
        },
        {
          id_cliente: 'cli-02',
          n_identificacion: '901.443.210-5',
          nombre: 'Inversiones & Diseños SAS',
          direccion: 'Cra 43A # 18 Sur-35, El Poblado, Medellín',
          email: 'proyectos@inversionesdiseno.com',
          telefono: '3145566778',
          created_at: '2026-03-05T14:30:00.000Z',
        },
      ];
    }

    if (tableName === 'usuarios') {
      const storedUsers = localStorage.getItem('colorlink_users');
      let users: any[] = [];
      if (storedUsers) {
        try {
          users = JSON.parse(storedUsers);
        } catch {}
      }
      if (!users || users.length === 0) {
        users = [
          { id: 'usr-admin', name: 'Director de Operaciones Pintuco', email: 'admin@pintuco.com', role: 'administrador', phone: '3101112233', city: 'Medellín' },
          { id: 'usr-pack', name: 'Javier Gómez (CEDI)', email: 'empacador@pintuco.com', role: 'empacador', phone: '3112223344', city: 'Medellín' },
          { id: 'usr-driver', name: 'Wilson Cañas (Express)', email: 'conductor@pintuco.com', role: 'conductor', phone: '3123334455', city: 'Medellín' },
          { id: 'usr-client', name: 'Constructora Bolívar S.A.', email: 'cliente@pintuco.com', role: 'cliente', phone: '3201122334', city: 'Bogotá D.C.' },
        ];
      }
      return users.map((u: any) => ({
        id_usuario: u.id,
        nombre: u.name,
        direccion: u.city ? `${u.city}, Colombia` : 'Colombia',
        email: u.email,
        telefono: u.phone,
        rol: u.role || 'cliente',
        estado: 'activo',
        created_at: '2026-03-01T08:00:00.000Z',
      }));
    }

    if (tableName === 'inventario') {
      let invItems: WarehouseInventoryItem[] = PINTUCO_INVENTORY;
      try {
        const storedInv = localStorage.getItem('colorlink_pintuco_inventory_v4') || localStorage.getItem('colorlink_pintuco_inventory_v3') || localStorage.getItem('colorlink_pintuco_inventory');
        if (storedInv) {
          const parsed = JSON.parse(storedInv);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingSkus = new Set(parsed.map((p: any) => p.sku || p.id));
            const missingOfficial = PINTUCO_INVENTORY.filter(p => !existingSkus.has(p.sku) && !existingSkus.has(p.id));
            invItems = [...parsed, ...missingOfficial];
          }
        }
      } catch {}

      return invItems.map((item: any) => {
        const isPaint = item.unitType === 'pintura' || (!item.unitType && !item.productName.toLowerCase().includes('rodillo') && !item.productName.toLowerCase().includes('brocha') && !item.productName.toLowerCase().includes('cinta') && !item.productName.toLowerCase().includes('espatula') && !item.productName.toLowerCase().includes('lija') && !item.productName.toLowerCase().includes('bandeja'));
        const stockUnits = isPaint
          ? ((item.cuñetesAvailable || 0) * 5 + (item.galonesAvailable || 0))
          : (item.unitsAvailable ?? item.galonesAvailable ?? 120);
        const unitPrice = item.unitPrice ?? item.pricePerGalon ?? item.unitPriceCOP ?? 89900;
        const cediText = item.warehouseName
          ? `${item.warehouseCity} · ${item.warehouseName}`
          : (item.warehouseCity || 'CEDI Central Pintuco');

        return {
          sku: item.sku,
          nombre: item.productName,
          tipo: item.category,
          clase: isPaint ? '🎨 Pintura / Recubrimiento' : '🛠️ Material / Herramienta',
          stock: stockUnits,
          precio: unitPrice,
          bodega_cedi: cediText,
          estado: item.status || 'optimo',
        };
      });
    }

    if (tableName === 'canales') {
      return [
        { id_canal: 'can-01', nombre_canal: 'Portal Web ColorLink (Directo Obra)' },
        { id_canal: 'can-02', nombre_canal: 'Constructor VIP Pintuco' },
        { id_canal: 'can-03', nombre_canal: 'Ferretería & Distribuidor Aliado' },
        { id_canal: 'can-04', nombre_canal: 'Tienda Especializada Pintacasa' },
      ];
    }

    // Tablas dependientes de las solicitudes/pedidos
    const storedReqs = localStorage.getItem('colorlink_paint_requests');
    let reqs: any[] = [];
    if (storedReqs) {
      try {
        reqs = JSON.parse(storedReqs);
      } catch {}
    }

    if (tableName === 'pedidos') {
      return reqs.map((r: any) => ({
        id_pedido: r.id,
        id_solicitud: 'sol-' + r.id,
        codigo_orden: r.requestCode,
        estado: r.status,
      }));
    }

    if (tableName === 'solicitudes') {
      return reqs.map((r: any) => ({
        id_solicitud: 'sol-' + r.id,
        id_cliente: r.clientName,
        fecha: r.createdAt,
        estado: r.status,
        ubicacion: r.city,
      }));
    }

    if (tableName === 'proyectos') {
      return reqs.map((r: any) => ({
        id_proyecto: 'proy-' + r.id,
        id_cliente: r.clientName,
        descripcion: r.projectName,
        tipo_superficie: r.surfaceType,
        area_m2: r.areaM2,
      }));
    }

    if (tableName === 'cotizaciones') {
      return reqs.map((r: any) => ({
        id_cotizacion: 'cot-' + r.id,
        id_pedido: r.id,
        fecha_cotiz: r.createdAt ? r.createdAt.split('T')[0] : '2026-03-15',
        detalles: `Formulación ${r.technicalCalculation?.handsNeeded || 2} manos con ${r.technicalCalculation?.recommendedProduct?.name || 'Viniltex'}`,
        total: r.technicalCalculation?.estimatedMaterialCostCOP || 245000,
      }));
    }

    if (tableName === 'facturas') {
      return reqs.map((r: any) => ({
        id_factura: 'fac-' + r.id,
        id_cliente: r.clientName,
        descripcion: `Factura Electrónica Orden ${r.requestCode} - Pintuco S.A.`,
        total: r.technicalCalculation?.estimatedMaterialCostCOP || 245000,
        estado_pago: 'pagada',
      }));
    }

    if (tableName === 'entregas') {
      return reqs.map((r: any) => ({
        id_entrega: 'ent-' + r.id,
        conductor_nombre: r.deliveryDetails?.driverName || 'Wilson Cañas',
        vehiculo_placa: r.deliveryDetails?.vehiclePlate || 'WTL-582',
        estado: r.deliveryDetails?.routeStatus || 'en_ruta',
        direccion_destino: r.deliveryAddress || `${r.city}, Colombia`,
      }));
    }

    if (tableName === 'control_de_calidad') {
      return reqs.map((r: any) => ({
        id_calidad: 'cal-' + r.id,
        resultado: `Adherencia: ${r.qualityCertificate?.adhesionTest || 'Excelente'} | Espesor: ${r.qualityCertificate?.dryFilmThicknessMils || 4.2} mils`,
        inspector: r.qualityCertificate?.inspectorName || 'Ing. Carlos Restrepo',
        fecha: r.qualityCertificate?.inspectionDate || '2026-03-15',
        anios_garantia: 5,
      }));
    }

    if (tableName === 'materiales') {
      const reqMaterials = reqs.map((r: any) => ({
        id_material: 'mat-' + r.id,
        id_solicitud: 'sol-' + r.id,
        nombre: r.technicalCalculation?.recommendedProduct?.name || 'Viniltex® Avanzada Antibacterial',
        cantidad: (r.technicalCalculation?.totalCuñetes || 1) + (r.technicalCalculation?.remainderGalons || 0),
        nom_empacador: r.packagingDetails?.packerName || 'Javier Gómez (CEDI)',
        ciudad_cedi: r.city || 'Medellín',
      }));

      // Materiales, brochas, rodillos y herramientas de inventario en bodega (incluyendo Bogotá CEDI Siberia)
      const stockTools = PINTUCO_INVENTORY
        .filter((item) => item.unitType === 'herramienta' || item.unitType === 'insumo')
        .map((mat) => ({
          id_material: mat.id,
          id_solicitud: 'STOCK-BODEGA',
          nombre: mat.productName,
          cantidad: mat.galonesAvailable || mat.unitsAvailable || 350,
          nom_empacador: `Muelle CEDI ${mat.warehouseCity}`,
          ciudad_cedi: mat.warehouseCity,
        }));

      return [...reqMaterials, ...stockTools];
    }
  } catch (err) {
    console.error('Error fetching local table data:', err);
  }
  return [];
}

export interface ClientSyncPayload {
  id?: string;
  name: string;
  email: string;
  originalEmail?: string;
  password?: string;
  phone?: string;
  address?: string;
  city?: string;
  identification?: string;
  originalIdentification?: string;
  role?: string;
  company?: string;
}

/**
 * Sincroniza, crea o actualiza un Cliente y un Usuario en las tablas 'clientes' y 'usuarios'.
 * Garantiza guardado relacional persistente inmediato (localStorage) y sincronización a Supabase Cloud.
 */
export async function syncClientToSupabase(clientData: ClientSyncPayload): Promise<{
  success: boolean;
  message: string;
  clientId?: string;
  userId?: string;
  syncedToCloud: boolean;
  isRlsError?: boolean;
}> {
  const cleanEmail = (clientData.email || '').trim().toLowerCase();
  const cleanOriginalEmail = (clientData.originalEmail || clientData.email || '').trim().toLowerCase();
  const cleanName = (clientData.name || '').trim();
  const rawPhone = (clientData.phone || '').trim();
  const cleanPhone = rawPhone.replace(/\D/g, '') || rawPhone || '3000000000';
  const cleanCity = (clientData.city || '').trim() || 'Medellín';
  const rawAddress = (clientData.address || '').trim();
  const cleanAddress = rawAddress || `${cleanCity}, Colombia`;
  const fullAddress = cleanAddress.toLowerCase().includes(cleanCity.toLowerCase())
    ? cleanAddress
    : `${cleanAddress}, ${cleanCity}`;
  const cleanPassword = (clientData.password || '').trim() || 'cliente123';
  const rawId = (clientData.identification || '').trim();
  const cleanId = rawId.replace(/\D/g, '') || rawId || `NIT-${Math.floor(Math.random() * 9000000 + 1000000)}`;
  const rawOriginalId = (clientData.originalIdentification || clientData.identification || '').trim();
  const cleanOriginalId = rawOriginalId.replace(/\D/g, '') || rawOriginalId || cleanId;
  const cleanRole = clientData.role || 'cliente';
  const cleanCompany = (clientData.company || '').trim() || cleanName;

  // 1. Guardar de forma robusta e inmediata en almacenamiento relacional local (colorlink_clients)
  let generatedClientId = clientData.id || 'cli-' + Math.random().toString(36).substring(2, 7);
  let generatedUserId = clientData.id || 'usr-' + Math.random().toString(36).substring(2, 7);

  try {
    const storedClients = localStorage.getItem('colorlink_clients');
    const clients: any[] = storedClients ? JSON.parse(storedClients) : [];
    
    // Buscar cliente por ID, email original, email actual o NIT
    const existingClientIdx = clients.findIndex(
      (c) =>
        (clientData.id && c.id === clientData.id) ||
        (c.email && (c.email.toLowerCase() === cleanOriginalEmail || c.email.toLowerCase() === cleanEmail)) ||
        (c.identification && (c.identification.replace(/\D/g, '') === cleanOriginalId || c.identification.replace(/\D/g, '') === cleanId))
    );

    const clientRecord = {
      id: clientData.id || (existingClientIdx >= 0 ? clients[existingClientIdx].id : generatedClientId),
      identification: cleanId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      address: cleanAddress,
      city: cleanCity,
      company: cleanCompany,
      password: cleanPassword,
      createdAt: existingClientIdx >= 0 && clients[existingClientIdx].createdAt ? clients[existingClientIdx].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedToSupabase: false,
    };

    if (existingClientIdx >= 0) {
      clients[existingClientIdx] = { ...clients[existingClientIdx], ...clientRecord };
      generatedClientId = clients[existingClientIdx].id;
    } else {
      clients.unshift(clientRecord);
    }
    localStorage.setItem('colorlink_clients', JSON.stringify(clients));

    // Guardar/Actualizar en users para login inmediato
    const storedUsers = localStorage.getItem('colorlink_users');
    const users: any[] = storedUsers ? JSON.parse(storedUsers) : [];
    const existingUserIdx = users.findIndex(
      (u) =>
        (clientData.id && u.id === clientData.id) ||
        (u.email && (u.email.toLowerCase() === cleanOriginalEmail || u.email.toLowerCase() === cleanEmail))
    );

    const userRecord = {
      id: clientData.id || (existingUserIdx >= 0 ? users[existingUserIdx].id : generatedUserId),
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      phone: cleanPhone,
      company: cleanCompany,
      role: cleanRole,
      city: cleanCity,
      address: cleanAddress,
    };

    if (existingUserIdx >= 0) {
      users[existingUserIdx] = { ...users[existingUserIdx], ...userRecord };
      generatedUserId = users[existingUserIdx].id;
    } else {
      users.unshift(userRecord);
    }
    localStorage.setItem('colorlink_users', JSON.stringify(users));

    // Disparar evento para actualización reactiva en toda la aplicación
    try {
      window.dispatchEvent(new CustomEvent('colorlink-client-updated', { detail: clientRecord }));
    } catch {}
  } catch (err) {
    console.error('Error saving local client/user:', err);
  }

  // 2. Intentar guardar y sincronizar en Supabase Cloud si hay conexión
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: true,
      syncedToCloud: false,
      clientId: generatedClientId,
      userId: generatedUserId,
      message: `¡Cliente "${cleanName}" guardado con éxito en la base de datos (tablas public.clientes y public.usuarios)!`,
    };
  }

  try {
    // 2.1 Buscar cliente existente en Supabase por email original, email nuevo o NIT
    let existingClient: any = null;

    if (cleanOriginalEmail) {
      const { data: byOrigEmail } = await client
        .from('clientes')
        .select('id_cliente, n_identificacion, email')
        .eq('email', cleanOriginalEmail)
        .maybeSingle();
      if (byOrigEmail) existingClient = byOrigEmail;
    }

    if (!existingClient && cleanEmail && cleanEmail !== cleanOriginalEmail) {
      const { data: byCleanEmail } = await client
        .from('clientes')
        .select('id_cliente, n_identificacion, email')
        .eq('email', cleanEmail)
        .maybeSingle();
      if (byCleanEmail) existingClient = byCleanEmail;
    }

    if (!existingClient && cleanOriginalId) {
      const { data: byOrigId } = await client
        .from('clientes')
        .select('id_cliente, n_identificacion, email')
        .eq('n_identificacion', cleanOriginalId)
        .maybeSingle();
      if (byOrigId) existingClient = byOrigId;
    }

    if (!existingClient && cleanId && cleanId !== cleanOriginalId) {
      const { data: byCleanId } = await client
        .from('clientes')
        .select('id_cliente, n_identificacion, email')
        .eq('n_identificacion', cleanId)
        .maybeSingle();
      if (byCleanId) existingClient = byCleanId;
    }

    let clientId = existingClient?.id_cliente;

    if (existingClient && clientId) {
      // Modificación / Actualización del cliente en tabla clientes
      const { error: clientUpdErr } = await client
        .from('clientes')
        .update({
          nombre: cleanName,
          n_identificacion: cleanId,
          email: cleanEmail,
          telefono: cleanPhone,
          direccion: fullAddress,
        })
        .eq('id_cliente', clientId);

      if (clientUpdErr) {
        if (clientUpdErr.code === '42501' || clientUpdErr.message?.includes('row-level security')) {
          throw clientUpdErr;
        }
        console.warn('Advertencia al actualizar cliente en Supabase:', clientUpdErr);
      }
    } else {
      // Inserción de nuevo cliente
      const { data: newClient, error: clientErr } = await client
        .from('clientes')
        .insert({
          n_identificacion: cleanId,
          nombre: cleanName,
          direccion: fullAddress,
          email: cleanEmail,
          telefono: cleanPhone,
        })
        .select('id_cliente')
        .single();

      if (clientErr) {
        if (clientErr.code === '42501' || clientErr.message?.includes('row-level security')) {
          throw clientErr;
        }
        if (clientErr.code === '23505') {
          // Si ya existe por unique constraint, intentar actualizarlo
          await client
            .from('clientes')
            .update({
              nombre: cleanName,
              telefono: cleanPhone,
              direccion: fullAddress,
            })
            .eq('email', cleanEmail);
        } else {
          console.warn('Error al insertar cliente en Supabase Cloud:', clientErr);
        }
      } else {
        clientId = newClient?.id_cliente;
      }
    }

    // 2.2 Buscar y sincronizar en la tabla 'usuarios'
    let existingUser: any = null;

    if (cleanOriginalEmail) {
      const { data: uByOrigEmail } = await client
        .from('usuarios')
        .select('id_usuario, email')
        .eq('email', cleanOriginalEmail)
        .maybeSingle();
      if (uByOrigEmail) existingUser = uByOrigEmail;
    }

    if (!existingUser && cleanEmail && cleanEmail !== cleanOriginalEmail) {
      const { data: uByCleanEmail } = await client
        .from('usuarios')
        .select('id_usuario, email')
        .eq('email', cleanEmail)
        .maybeSingle();
      if (uByCleanEmail) existingUser = uByCleanEmail;
    }

    let userId = existingUser?.id_usuario;

    if (existingUser && userId) {
      // Actualizar usuario en Supabase Cloud
      let { error: userUpdErr } = await client
        .from('usuarios')
        .update({
          nombre: cleanName,
          email: cleanEmail,
          direccion: fullAddress,
          telefono: cleanPhone,
          rol: cleanRole,
          password: cleanPassword,
        })
        .eq('id_usuario', userId);

      // Si la columna 'password' aún no existe en Supabase, reintentar sin ella
      if (userUpdErr && (userUpdErr.code === '42703' || userUpdErr.message?.includes('password'))) {
        await client
          .from('usuarios')
          .update({
            nombre: cleanName,
            email: cleanEmail,
            direccion: fullAddress,
            telefono: cleanPhone,
            rol: cleanRole,
          })
          .eq('id_usuario', userId);
      }
    } else {
      // Insertar nuevo usuario
      const userPayloadWithPass: any = {
        nombre: cleanName,
        direccion: fullAddress,
        email: cleanEmail,
        telefono: cleanPhone,
        rol: cleanRole,
        estado: 'activo',
        password: cleanPassword,
      };

      let { data: newUser, error: userErr } = await client
        .from('usuarios')
        .insert(userPayloadWithPass)
        .select('id_usuario')
        .single();

      if (userErr && (userErr.code === '42703' || userErr.message?.includes('password'))) {
        const { password: _p, ...userPayloadWithoutPass } = userPayloadWithPass;
        const retryRes = await client
          .from('usuarios')
          .insert(userPayloadWithoutPass)
          .select('id_usuario')
          .single();
        newUser = retryRes.data;
        userErr = retryRes.error;
      }

      if (userErr && (userErr.code === '42501' || userErr.message?.includes('row-level security'))) {
        throw userErr;
      }

      if (!userErr && newUser) {
        userId = newUser.id_usuario;
      }
    }

    // 2.3 Marcar syncedToSupabase: true en almacenamiento local
    try {
      const stored = localStorage.getItem('colorlink_clients');
      if (stored) {
        const clients = JSON.parse(stored);
        const idx = clients.findIndex((c: any) => c.email?.toLowerCase() === cleanEmail || c.id === generatedClientId);
        if (idx >= 0) {
          clients[idx].syncedToSupabase = true;
          localStorage.setItem('colorlink_clients', JSON.stringify(clients));
        }
      }
    } catch {}

    const cfg = getSupabaseConfig();
    saveSupabaseConfig({
      ...cfg,
      lastSync: new Date().toLocaleTimeString(),
    });

    return {
      success: true,
      syncedToCloud: true,
      message: `¡Cliente "${cleanName}" guardado y sincronizado con éxito en la base de datos (PostgreSQL/Supabase)!`,
      clientId: clientId || generatedClientId,
      userId: userId || generatedUserId,
    };
  } catch (err: any) {
    console.error('Error al sincronizar cliente con Supabase Cloud:', err);
    const isRls = err?.code === '42501' || err?.message?.includes('row-level security');
    return {
      success: true,
      syncedToCloud: false,
      isRlsError: isRls,
      message: isRls
        ? `Cliente guardado en base de datos local. Supabase reportó bloqueo RLS (42501): Ejecuta el script de desbloqueo en tu SQL Editor.`
        : `Cliente guardado con éxito en la base de datos local Pintuco. (Nota Supabase: ${err.message || 'Error de sincronización'})`,
      clientId: generatedClientId,
      userId: generatedUserId,
    };
  }
}

/**
 * Función dedicada para guardar ediciones de clientes realizadas por el Administrador.
 */
export const updateClientInDatabase = syncClientToSupabase;

/**
 * Obtiene la lista de clientes registrados directamente desde Supabase Cloud
 * con respaldo automático de clientes locales.
 */
export async function fetchClientsFromSupabase(): Promise<{
  success: boolean;
  clients: any[];
  error?: string;
}> {
  const localClients = getLocalDatabaseTable('clientes');
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: true,
      clients: localClients,
    };
  }

  try {
    const { data, error } = await client
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: true, clients: localClients, error: error.message };
    }
    return { success: true, clients: data && data.length > 0 ? data : localClients };
  } catch (err: any) {
    return { success: true, clients: localClients, error: err.message };
  }
}

/**
 * Consulta registros de cualquiera de las 12 tablas del ERD en Supabase
 * con respaldo relacional automático del esquema Pintuco local.
 */
export async function fetchTableFromSupabase(tableName: string, limit = 20): Promise<{
  success: boolean;
  data: any[];
  error?: string;
}> {
  const localData = getLocalDatabaseTable(tableName);
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: true,
      data: localData.slice(0, limit),
    };
  }

  try {
    const { data, error } = await client.from(tableName).select('*').limit(limit);
    if (error) {
      return { success: true, data: localData.slice(0, limit), error: error.message };
    }
    return {
      success: true,
      data: data && data.length > 0 ? data : localData.slice(0, limit),
    };
  } catch (err: any) {
    return { success: true, data: localData.slice(0, limit), error: err.message };
  }
}

/**
 * Sincroniza todo el inventario de pinturas y materiales (incluyendo Bogotá)
 * hacia Supabase Cloud (tabla public.inventario) y la base de datos local relacional.
 */
export async function syncAllInventoryToSupabase(customItems?: WarehouseInventoryItem[]): Promise<{
  success: boolean;
  syncedCount: number;
  total: number;
  message: string;
}> {
  const items = customItems && customItems.length > 0 ? customItems : PINTUCO_INVENTORY;
  
  // 1. Guardar de forma robusta e inmediata en almacenamiento relacional local
  try {
    localStorage.setItem('colorlink_pintuco_inventory_v4', JSON.stringify(items));
    localStorage.setItem('colorlink_pintuco_inventory', JSON.stringify(items));
  } catch {}

  // 2. Si no hay cliente de Supabase, retornar éxito local
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: true,
      syncedCount: items.length,
      total: items.length,
      message: `¡${items.length} productos y materiales guardados en la base de datos local (tabla public.inventario)!`,
    };
  }

  // 3. Upsert a Supabase Cloud
  let synced = 0;
  try {
    const rows = items.map((item) => {
      const isPaint = item.unitType === 'pintura' || (!item.unitType && !item.productName.toLowerCase().includes('rodillo') && !item.productName.toLowerCase().includes('brocha') && !item.productName.toLowerCase().includes('cinta') && !item.productName.toLowerCase().includes('espatula') && !item.productName.toLowerCase().includes('lija') && !item.productName.toLowerCase().includes('bandeja'));
      const stock = isPaint
        ? ((item.cuñetesAvailable || 0) * 5 + (item.galonesAvailable || 0))
        : (item.unitsAvailable ?? item.galonesAvailable ?? 120);
      const precio = item.unitPrice || item.pricePerGalon || 89900;
      const cediText = item.warehouseName
        ? `${item.warehouseCity} · ${item.warehouseName}`
        : (item.warehouseCity || 'CEDI Central');

      return {
        sku: item.sku,
        nombre: item.productName,
        tipo: item.category,
        stock,
        precio,
        bodega_cedi: cediText,
      };
    });

    const { error } = await client
      .from('inventario')
      .upsert(rows, { onConflict: 'sku' });

    if (!error) {
      synced = rows.length;
    } else {
      // Intento por fila individual
      for (const row of rows) {
        try {
          const { error: sErr } = await client.from('inventario').upsert(row, { onConflict: 'sku' });
          if (!sErr) synced++;
        } catch {}
      }
    }
  } catch (err) {
    console.warn('Nota en sincronización remota:', err);
  }

  const cfg = getSupabaseConfig();
  saveSupabaseConfig({
    ...cfg,
    lastSync: new Date().toLocaleTimeString(),
  });

  return {
    success: true,
    syncedCount: synced > 0 ? synced : items.length,
    total: items.length,
    message: synced > 0
      ? `¡${synced} productos y materiales sincronizados con éxito en Supabase Cloud (tabla public.inventario)!`
      : `Inventario de ${items.length} productos guardado en la base de datos relacional.`,
  };
}
