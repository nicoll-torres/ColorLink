-- ==============================================================================
-- 🎨 COLORLINK PINTUCO - ESQUEMA RELACIONAL EXACTO PARA SUPABASE (PostgreSQL + RLS)
-- ==============================================================================
-- Proyecto Transversal UCC · Ecosistema Integral de Pintura Inteligente Pintuco S.A.
-- Basado fielmente en el Diagrama Entidad-Relación (ERD) suministrado:
-- 12 Tablas: Usuario, Canal, Cliente, Proyecto, Solicitud, Material, Inventario,
--            Pedido, Cotización, Factura, Entrega, Control de Calidad.
-- ==============================================================================

-- 1. HABILITAR EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA: Usuario (Usuarios del Sistema y Roles)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  direccion TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT DEFAULT 'cliente123',
  telefono TEXT,
  rol TEXT NOT NULL DEFAULT 'cliente', -- 'administrador', 'empacador', 'conductor', 'cliente'
  estado TEXT NOT NULL DEFAULT 'activo', -- 'activo', 'inactivo', 'suspendido'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar soporte de columna password en tablas ya creadas
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'cliente123';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS contrasena TEXT;

-- 3. TABLA: Canal (Canales de Venta y Distribución)
CREATE TABLE IF NOT EXISTS public.canales (
  id_canal UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_canal TEXT NOT NULL UNIQUE -- 'Directo Pintuco', 'Portal Web', 'Distribuidor Aliado', 'Constructor VIP'
);

-- 4. TABLA: cliente (Clientes y Constructoras Registradas)
CREATE TABLE IF NOT EXISTS public.clientes (
  id_cliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  n_identificacion TEXT NOT NULL UNIQUE, -- NIT o Cédula
  nombre TEXT NOT NULL,
  direccion TEXT,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLA: Proyecto (Obras y Proyectos Constructivos)
CREATE TABLE IF NOT EXISTS public.proyectos (
  id_proyecto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cliente UUID NOT NULL REFERENCES public.clientes(id_cliente) ON DELETE CASCADE,
  id_canal UUID REFERENCES public.canales(id_canal) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'en_ejecucion', -- 'planeacion', 'en_ejecucion', 'completado'
  presupuesto NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABLA: Inventario (Catálogo de Pinturas y Existencias en CEDIs)
CREATE TABLE IF NOT EXISTS public.inventario (
  id_material UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'Arquitectónica Interior', 'Fachadas', 'Industrial Epóxica', 'Esmaltes Metálicos'
  stock INTEGER NOT NULL DEFAULT 0, -- Cantidad disponible en cuñetes/unidades
  precio NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Precio unitario COP
  bodega_cedi TEXT DEFAULT 'CEDI Rionegro',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABLA: solicitud (Requerimientos Técnicos y de Pintura por Proyecto)
CREATE TABLE IF NOT EXISTS public.solicitudes (
  id_solicitud UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_proyecto UUID NOT NULL REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE,
  detalles TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'solicitud_recibida', -- 'solicitud_recibida', 'solucion_tecnica', 'abastecimiento', 'servicio_despacho', 'calidad_garantia'
  area_m2 NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tipo_superficie TEXT DEFAULT 'Concreto / Pañete',
  color TEXT DEFAULT 'Blanco Nieve',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABLA: Material (Materiales Formulados Asignados a la Solicitud y Empaque)
CREATE TABLE IF NOT EXISTS public.materiales (
  id_material UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_solicitud UUID NOT NULL REFERENCES public.solicitudes(id_solicitud) ON DELETE CASCADE,
  id_inventario UUID REFERENCES public.inventario(id_material) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  nom_empacador TEXT DEFAULT 'Javier Gómez (CEDI)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABLA: Factura (Declarada antes de Pedido para permitir FK cruzada si aplica)
CREATE TABLE IF NOT EXISTS public.facturas (
  id_factura UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cliente UUID REFERENCES public.clientes(id_cliente) ON DELETE SET NULL,
  descripcion TEXT,
  total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  fecha_emision DATE DEFAULT CURRENT_DATE,
  estado_pago TEXT DEFAULT 'pagada',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABLA: Pedido (Órdenes de Producción y Despacho)
CREATE TABLE IF NOT EXISTS public.pedidos (
  id_pedido UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_solicitud UUID NOT NULL REFERENCES public.solicitudes(id_solicitud) ON DELETE CASCADE,
  id_material UUID REFERENCES public.inventario(id_material) ON DELETE SET NULL,
  id_factura UUID REFERENCES public.facturas(id_factura) ON DELETE SET NULL,
  codigo_orden TEXT UNIQUE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'confirmado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TABLA: Cotización (Presupuestos Formales Asociados al Pedido)
CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id_cotizacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pedido UUID NOT NULL REFERENCES public.pedidos(id_pedido) ON DELETE CASCADE,
  fecha_cotiz DATE NOT NULL DEFAULT CURRENT_DATE,
  detalles TEXT,
  total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Actualizar relación en Facturas si viene de Cotización
ALTER TABLE public.facturas 
  ADD COLUMN IF NOT EXISTS id_cotizacion UUID REFERENCES public.cotizaciones(id_cotizacion) ON DELETE SET NULL;

-- 12. TABLA: Entrega (Despacho Logístico y Rutas en Tiempo Real)
CREATE TABLE IF NOT EXISTS public.entregas (
  id_entrega UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_proyecto UUID NOT NULL REFERENCES public.proyectos(id_proyecto) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'en_ruta', -- 'pendiente_cargue', 'en_ruta', 'en_destino', 'entregado'
  conductor_nombre TEXT DEFAULT 'Wilson Cañas',
  vehiculo_placa TEXT DEFAULT 'WTL-582',
  direccion_destino TEXT,
  firma_digital_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. TABLA: Control de calidad (Auditoría Técnica y Garantía Emitida)
CREATE TABLE IF NOT EXISTS public.control_de_calidad (
  id_calidad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_entrega UUID NOT NULL REFERENCES public.entregas(id_entrega) ON DELETE CASCADE,
  resultado TEXT NOT NULL DEFAULT 'Conforme - Adherencia Cruzada 100% y Espesor 4.2 mils',
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  inspector TEXT DEFAULT 'Ing. Carlos Restrepo (Q.A. Pintuco)',
  anios_garantia INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 14. ÍNDICES DE VELOCIDAD Y RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
CREATE INDEX IF NOT EXISTS idx_proyectos_cliente ON public.proyectos(id_cliente);
CREATE INDEX IF NOT EXISTS idx_solicitudes_proyecto ON public.solicitudes(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_pedidos_solicitud ON public.pedidos(id_solicitud);
CREATE INDEX IF NOT EXISTS idx_entregas_proyecto ON public.entregas(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_calidad_entrega ON public.control_de_calidad(id_entrega);

-- ==============================================================================
-- 15. SEGURIDAD ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- ==============================================================================
-- 15. PERMISOS DE ESCRITURA Y LECTURA (DESHABILITAR RLS PARA API KEY PÚBLICA)
-- ==============================================================================
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

-- ==============================================================================
-- 16. DATOS SEMILLA INICIALES (SEED DATA)
-- ==============================================================================
-- Usuarios
INSERT INTO public.usuarios (nombre, direccion, email, telefono, rol, estado) VALUES
  ('Ing. Carlos Restrepo', 'Cra 43A #1-50, Medellín', 'admin@pintuco.com', '3104567890', 'administrador', 'activo'),
  ('Javier Gómez', 'CEDI Rionegro Km 2', 'empacador@pintuco.com', '3129876543', 'empacador', 'activo'),
  ('Wilson Cañas', 'CEDI Siberia Muelle 4', 'conductor@pintuco.com', '3157654321', 'conductor', 'activo'),
  ('Constructora Bolívar S.A.', 'Calle 98 #11-20, Bogotá', 'cliente@pintuco.com', '3201122334', 'cliente', 'activo')
ON CONFLICT (email) DO NOTHING;

-- Canales
INSERT INTO public.canales (nombre_canal) VALUES
  ('Directo Pintuco S.A.'),
  ('Portal Web Transversal ColorLink'),
  ('Ferretería & Distribuidor Aliado'),
  ('Constructor VIP')
ON CONFLICT (nombre_canal) DO NOTHING;

-- Clientes
INSERT INTO public.clientes (n_identificacion, nombre, direccion, email, telefono) VALUES
  ('900.123.456-7', 'Constructora Bolívar S.A.', 'Calle 98 #11-20, Bogotá', 'cliente@pintuco.com', '3201122334')
ON CONFLICT (email) DO NOTHING;

-- Inventario de Pinturas
INSERT INTO public.inventario (sku, nombre, tipo, stock, precio, bodega_cedi) VALUES
  ('PTC-VIN-500', 'Viniltex® Avanzada Antibacterial Blanco Nieve', 'Arquitectónica Interior', 480, 245000, 'CEDI Rionegro'),
  ('PTC-KOR-EXT', 'Koraza® 5 Máxima Protección Exterior Blanco', 'Fachadas Exteriores', 320, 298000, 'CEDI Rionegro'),
  ('PTC-EPOX-500', 'Pintuepoxi® 500 Alto Tráfico Gris Perla', 'Industrial y Pisos', 45, 385000, 'CEDI Siberia Bogotá'),
  ('PTC-PLUX-3EN1', 'Pintulux® 3 en 1 Anticorrosivo Gris Metal', 'Metales y Esmaltes', 110, 185000, 'CEDI Acopi Cali'),
  ('PTC-SELL-7EN1', 'Sellomax® 7 en 1 Imprimante Acrílico', 'Preparación de Superficie', 190, 142000, 'CEDI Galapa Barranquilla')
ON CONFLICT (sku) DO NOTHING;
