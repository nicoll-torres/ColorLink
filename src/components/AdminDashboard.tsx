import React, { useState, useEffect } from 'react';
import { PaintRequest, UserProfile, WarehouseInventoryItem } from '../types';
import { PINTUCO_INVENTORY, PINTUCO_WAREHOUSES, isPaintProduct, getProductImage } from '../data';
import { InvoiceModal } from './InvoiceModal';
import {
  SUPABASE_SQL_SCHEMA,
  SUPABASE_RLS_FIX_SQL,
  DEFAULT_SUPABASE_URL,
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  syncPaintRequestToSupabase,
  syncAllRequestsToSupabase,
  syncClientToSupabase,
  updateClientInDatabase,
  fetchClientsFromSupabase,
  fetchTableFromSupabase,
  syncAllInventoryToSupabase,
  SupabaseConfig,
  DEFAULT_SUPABASE_KEY,
  normalizeSupabaseUrl,
} from '../supabase';
import {
  ShieldCheck,
  Building,
  Layers,
  Boxes,
  Truck,
  CheckCircle2,
  Sliders,
  Sparkles,
  Search,
  MapPin,
  Calendar,
  FileText,
  AlertTriangle,
  PlusCircle,
  Database,
  Copy,
  Check,
  Server,
  Warehouse,
  Scale,
  Lock,
  RefreshCw,
  Trash2,
  Receipt,
  Download,
  User,
  Mail,
  Phone,
  ExternalLink,
  Palette,
  Wrench,
  Paintbrush,
  Plus,
  Minus,
  Tag,
  Ban,
  ShoppingCart,
  UserCheck,
  UserPlus,
  Camera,
  Image,
  Edit3,
} from '../icons';

import { PAINT_IMAGE_PRESETS, MATERIAL_IMAGE_PRESETS } from '../productImages';
export { PAINT_IMAGE_PRESETS, MATERIAL_IMAGE_PRESETS };

export interface StaffMember {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  role: 'conductor' | 'empacador';
  cediCity: string;
  cediName: string;
  badgeNumber: string;
  vehiclePlate?: string;
  vehicleType?: string;
  licenseCategory?: string;
  shift?: string;
  status: 'activo' | 'en_ruta' | 'descanso';
  password?: string;
  createdAt: string;
}

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'stf-01',
    name: 'Wilson Cañas',
    document: '1.020.450.880',
    email: 'conductor@pintuco.com',
    phone: '+57 311 754 9988',
    role: 'conductor',
    cediCity: 'Medellín',
    cediName: 'CEDI Rionegro - Bodega Central',
    badgeNumber: 'LOG-TRK-109',
    vehiclePlate: 'WTL-582',
    vehicleType: 'Camión NHR 3.5 Ton',
    licenseCategory: 'C2',
    status: 'activo',
    createdAt: '2026-02-15T08:00:00.000Z',
  },
  {
    id: 'stf-02',
    name: 'Javier Gómez',
    document: '71.298.441',
    email: 'empacador@pintuco.com',
    phone: '+57 314 620 7711',
    role: 'empacador',
    cediCity: 'Medellín',
    cediName: 'CEDI Rionegro - Bodega Central',
    badgeNumber: 'BOD-8812',
    shift: 'Turno Mañana (06:00 - 14:00)',
    status: 'activo',
    createdAt: '2026-02-10T07:00:00.000Z',
  },
  {
    id: 'stf-03',
    name: 'Mauricio Restrepo',
    document: '80.192.334',
    email: 'mauricio.restrepo@pintuco.com',
    phone: '+57 320 889 1234',
    role: 'conductor',
    cediCity: 'Bogotá D.C.',
    cediName: 'CEDI Siberia Cundinamarca',
    badgeNumber: 'LOG-TRK-204',
    vehiclePlate: 'TSK-409',
    vehicleType: 'Turbo FTR 5 Ton',
    licenseCategory: 'C3',
    status: 'en_ruta',
    createdAt: '2026-02-20T08:30:00.000Z',
  },
  {
    id: 'stf-04',
    name: 'Patricia Morales',
    document: '66.890.112',
    email: 'patricia.morales@pintuco.com',
    phone: '+57 315 440 9981',
    role: 'empacador',
    cediCity: 'Cali',
    cediName: 'Hub Regional Acopi Yumbo',
    badgeNumber: 'BOD-9041',
    shift: 'Turno Tarde (14:00 - 22:00)',
    status: 'activo',
    createdAt: '2026-02-22T13:00:00.000Z',
  },
  {
    id: 'stf-05',
    name: 'Andrés Felipe Vélez',
    document: '1.045.678.901',
    email: 'andres.velez@pintuco.com',
    phone: '+57 301 223 4567',
    role: 'conductor',
    cediCity: 'Barranquilla',
    cediName: 'Planta Caribe Galapa',
    badgeNumber: 'LOG-TRK-315',
    vehiclePlate: 'SZL-112',
    vehicleType: 'Camión Liviano 3.5 Ton',
    licenseCategory: 'C2',
    status: 'activo',
    createdAt: '2026-03-01T08:00:00.000Z',
  },
  {
    id: 'stf-06',
    name: 'Diego Cadavid',
    document: '91.450.882',
    email: 'diego.cadavid@pintuco.com',
    phone: '+57 318 667 8901',
    role: 'empacador',
    cediCity: 'Bucaramanga',
    cediName: 'CEDI Oriente Girón',
    badgeNumber: 'BOD-7733',
    shift: 'Turno Mañana (06:00 - 14:00)',
    status: 'activo',
    createdAt: '2026-03-05T06:30:00.000Z',
  },
];

interface ColorVariant {
  name: string;
  hex: string;
}

const DEFAULT_PAINT_COLORS: ColorVariant[] = [
  { name: 'Blanco Lirio Silvestre 01', hex: '#F9FAFB' },
  { name: 'Gris Urbano Contemporáneo', hex: '#9CA3AF' },
  { name: 'Azul Pintuco Zafiro', hex: '#1E3A8A' },
  { name: 'Verde Eucalipto', hex: '#70CCA7' },
  { name: 'Terracota Colonial', hex: '#C86D51' },
];

const PRESET_QUICK_COLORS: ColorVariant[] = [
  { name: 'Blanco Nieve', hex: '#FFFFFF' },
  { name: 'Blanco Hueso', hex: '#F5F5F0' },
  { name: 'Gris Basalto', hex: '#374151' },
  { name: 'Gris Titanio', hex: '#4B5563' },
  { name: 'Marfil Suave', hex: '#FDFBF7' },
  { name: 'Azul Océano Profundo', hex: '#0F2B5C' },
  { name: 'Azul Zafiro Real', hex: '#1E40AF' },
  { name: 'Azul Horizonte Cielo', hex: '#0284C7' },
  { name: 'Verde Eucalipto Andino', hex: '#059669' },
  { name: 'Verde Olivo Suave', hex: '#65A30D' },
  { name: 'Terracota Colonial', hex: '#C2410C' },
  { name: 'Amarillo Trigo Solar', hex: '#F59E0B' },
  { name: 'Negro Grafito Intenso', hex: '#1F2937' },
  { name: 'Rosa Coral Amanecer', hex: '#F87171' },
];

interface AdminDashboardProps {
  currentUser: UserProfile;
  requests: PaintRequest[];
  inventoryList?: WarehouseInventoryItem[];
  onUpdateInventory?: (newList: WarehouseInventoryItem[]) => void;
  onUpdateRequest: (updated: PaintRequest) => void;
  onCreateNewRequest: () => void;
  onOpenCalculator: () => void;
  onOpenAiAssistant: () => void;
  onOpenCertificate: (req: PaintRequest) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  requests,
  inventoryList: propInventoryList,
  onUpdateInventory,
  onUpdateRequest,
  onCreateNewRequest,
  onOpenCalculator,
  onOpenAiAssistant,
  onOpenCertificate,
}) => {
  const [adminTab, setAdminTab] = useState<'ordenes' | 'inventario' | 'clientes' | 'operarios' | 'supabase'>('ordenes');
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedReqId, setSelectedReqId] = useState<string>(requests[0]?.id || '');
  const [selectedInvoice, setSelectedInvoice] = useState<PaintRequest | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Conductores & Empacadores (Gestión Operativa de Personal CEDI)
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    try {
      const stored = localStorage.getItem('colorlink_staff');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_STAFF;
  });
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<'todos' | 'conductor' | 'empacador'>('todos');
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    role: 'conductor' as 'conductor' | 'empacador',
    cediCity: 'Medellín',
    cediName: 'CEDI Rionegro - Bodega Central',
    badgeNumber: '',
    vehiclePlate: '',
    vehicleType: 'Camión NHR 3.5 Ton',
    licenseCategory: 'C2',
    shift: 'Turno Mañana (06:00 - 14:00)',
    password: 'pintuco2026',
  });

  // Clientes y Gestión de Cuentas (PostgreSQL public.clientes & public.usuarios)
  const [clientsList, setClientsList] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('colorlink_clients');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'cli-01',
        identification: '900.567.890-1',
        name: 'Constructora Bolívar S.A.',
        email: 'cliente@pintuco.com',
        phone: '3201122334',
        address: 'Calle 98 #11-20, Bogotá D.C.',
        company: 'Constructora Bolívar S.A.',
        city: 'Bogotá D.C.',
        syncedToSupabase: true,
        createdAt: '2026-03-01T10:00:00.000Z',
      },
      {
        id: 'cli-02',
        identification: '901.443.210-5',
        name: 'Inversiones & Diseños SAS',
        email: 'proyectos@inversionesdiseno.com',
        phone: '3145566778',
        address: 'Cra 43A # 18 Sur-35, El Poblado',
        company: 'Inversiones & Diseños SAS',
        city: 'Medellín',
        syncedToSupabase: true,
        createdAt: '2026-03-05T14:30:00.000Z',
      },
      {
        id: 'cli-03',
        identification: '1098765432',
        name: 'Luisa Fernanda Gómez',
        email: 'luisa.gomez@gmail.com',
        phone: '3104567890',
        address: 'Av. Las Palmas Km 5, Medellín',
        company: 'Residencia Particular Las Palmas',
        city: 'Medellín',
        syncedToSupabase: true,
        createdAt: '2026-03-10T09:15:00.000Z',
      },
    ];
  });
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [isSyncingClientMap, setIsSyncingClientMap] = useState<Record<string, boolean>>({});
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    identification: '',
    email: '',
    phone: '',
    address: '',
    city: 'Medellín',
    company: '',
  });

  // Estados para Edición de Clientes
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);

  // Estados para Edición de Operarios (Conductores & Empacadores)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);

  // Inventario en tiempo real (estado local con mutabilidad para el admin o prop compartida)
  const [localInventory, setLocalInventory] = useState<WarehouseInventoryItem[]>(propInventoryList || PINTUCO_INVENTORY);
  const inventoryList = propInventoryList || localInventory;
  const [invSearch, setInvSearch] = useState('');
  const [invWarehouseFilter, setInvWarehouseFilter] = useState('todos');
  const [invStatusFilter, setInvStatusFilter] = useState('todos');
  const [invTypeFilter, setInvTypeFilter] = useState<'todos' | 'pinturas' | 'materiales'>('todos');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isSyncingInventory, setIsSyncingInventory] = useState(false);

  // Formulario maestro de agregador de productos (Pintura vs Materiales/Herramientas)
  const [productTypeMode, setProductTypeMode] = useState<'pintura' | 'material'>('pintura');
  const [paintColors, setPaintColors] = useState<ColorVariant[]>(DEFAULT_PAINT_COLORS);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#1E40AF');

  const [newProductForm, setNewProductForm] = useState({
    productName: '',
    sku: '',
    // Configuración específica de Pinturas
    category: 'Arquitectónica',
    warehouseCity: 'Medellín',
    warehouseName: 'CEDI Principal Rionegro',
    cuñetesAvailable: 30,
    galonesAvailable: 50,
    pricePerGalon: 115000,
    surfaceType: 'concreto' as any,
    finish: 'Mate',
    coveragePerGalonM2: 45,
    imageUrl: '',
    // Configuración específica de Materiales / Insumos / Herramientas (Venta directa por unidad, sin colores)
    materialCategory: 'Herramientas y Aplicación',
    unitsAvailable: 120,
    unitPrice: 28000,
    unitMeasure: 'Unidad / Pieza',
    minStockAlert: 15,
    description: '',
  });

  const updateInventoryState = (newList: WarehouseInventoryItem[]) => {
    setLocalInventory(newList);
    if (onUpdateInventory) {
      onUpdateInventory(newList);
    }
  };

  // Estado para edición completa de productos existentes en inventario
  const [editingProduct, setEditingProduct] = useState<WarehouseInventoryItem | null>(null);

  // Estado para Recepción de Mercancía a Bodega / Entrada de Stock estilizada
  const [stockEntryProduct, setStockEntryProduct] = useState<WarehouseInventoryItem | null>(null);
  const [entryQty, setEntryQty] = useState<number>(50);
  const [entryUnit, setEntryUnit] = useState<'cuñetes' | 'galones'>('cuñetes');
  const [entryRemission, setEntryRemission] = useState<string>('');
  const [entryReceiver, setEntryReceiver] = useState<string>('Javier Gómez (Jefe de Bodega)');

  const handleConfirmStockEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockEntryProduct) return;
    const qty = Number(entryQty);
    if (!qty || qty <= 0) {
      setToast({ type: 'error', text: 'Por favor ingresa una cantidad adicional válida mayor a 0.' });
      return;
    }

    const isPaint = isPaintProduct(stockEntryProduct);
    const updated = inventoryList.map((i) => {
      if (i.id === stockEntryProduct.id) {
        if (isPaint) {
          let newCunetes = i.cuñetesAvailable || 0;
          let newGalones = i.galonesAvailable || 0;

          if (entryUnit === 'cuñetes') {
            newCunetes += qty;
          } else {
            newGalones += qty;
          }
          const newLiters = newCunetes * 18.9 + newGalones * 3.785;

          return {
            ...i,
            cuñetesAvailable: newCunetes,
            galonesAvailable: newGalones,
            totalLiters: Math.round(newLiters),
            status: 'optimo' as const,
            lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
          };
        } else {
          const currentUnits = i.unitsAvailable ?? i.galonesAvailable ?? 0;
          const newUnits = currentUnits + qty;
          return {
            ...i,
            unitsAvailable: newUnits,
            galonesAvailable: newUnits,
            totalLiters: newUnits,
            status: 'optimo' as const,
            lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
          };
        }
      }
      return i;
    });

    updateInventoryState(updated);
    const labelAdded = isPaint
      ? entryUnit === 'cuñetes'
        ? `${qty} Cuñetes (5 Gal)`
        : `${qty} Galones (1 Gal)`
      : `${qty} ${stockEntryProduct.unitMeasure || 'Unidades'}`;

    const remInfo = entryRemission.trim() ? ` · Remisión ${entryRemission.trim()}` : '';

    setToast({
      type: 'success',
      text: `✓ Entrada de bodega registrada: +${labelAdded} a "${stockEntryProduct.productName}" en sede ${stockEntryProduct.warehouseCity}${remInfo}. Guardado en base de datos.`,
    });
    setStockEntryProduct(null);
  };

  const handleSaveEditedProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.productName.trim() || !editingProduct.sku.trim()) {
      setToast({ type: 'error', text: 'El nombre y el SKU son obligatorios.' });
      return;
    }

    const isPaint = isPaintProduct(editingProduct);
    let totalLiters = editingProduct.totalLiters || 0;
    if (isPaint) {
      totalLiters = Math.round(
        (editingProduct.cuñetesAvailable || 0) * 18.9 + (editingProduct.galonesAvailable || 0) * 3.785
      );
    } else {
      totalLiters = editingProduct.unitsAvailable ?? editingProduct.galonesAvailable ?? 0;
    }

    const finalItem: WarehouseInventoryItem = {
      ...editingProduct,
      totalLiters,
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const updated = inventoryList.map((i) => (i.id === finalItem.id ? finalItem : i));
    updateInventoryState(updated);
    setEditingProduct(null);
    setToast({
      type: 'success',
      text: `Producto "${finalItem.productName}" modificado y guardado con éxito en la base de datos.`,
    });
  };

  // Supabase Config state & Live Testing
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSupabaseConfig());
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedRlsFix, setCopiedRlsFix] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connTestResult, setConnTestResult] = useState<{
    success: boolean;
    message: string;
    isRlsError?: boolean;
    rlsFixSql?: string;
  } | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // ERD & Tablas Explorer
  const [selectedErdTable, setSelectedErdTable] = useState<string>('proyectos');
  const [tableQueryData, setTableQueryData] = useState<any[]>([]);
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [supabaseSubTab, setSupabaseSubTab] = useState<'erd' | 'config' | 'tablas' | 'sql' | 'rls'>('erd');

  const selectedRequest = requests.find((r) => r.id === selectedReqId) || requests[0];

  // Métricas Globales
  const totalM2 = requests.reduce((acc, r) => acc + (r.areaM2 || 0), 0);
  const totalGalons = requests.reduce(
    (acc, r) => acc + (r.technicalCalculation?.totalGalons || 0),
    0
  );
  const inTransit = requests.filter(
    (r) => r.deliveryDetails?.routeStatus === 'en_ruta'
  ).length;
  const delivered = requests.filter(
    (r) => r.deliveryDetails?.routeStatus === 'entregado'
  ).length;

  // Métricas de Inventario (Diferenciación Pintura vs Materiales)
  const totalPinturasCount = inventoryList.filter((i) => isPaintProduct(i)).length;
  const totalMaterialesCount = inventoryList.filter((i) => !isPaintProduct(i)).length;
  const totalCunetesInStock = inventoryList.reduce((acc, i) => acc + (isPaintProduct(i) ? (i.cuñetesAvailable || 0) : 0), 0);
  const totalGalonesInStock = inventoryList.reduce((acc, i) => acc + (isPaintProduct(i) ? (i.galonesAvailable || 0) : 0), 0);
  const totalUnidadesMateriales = inventoryList.reduce((acc, i) => acc + (!isPaintProduct(i) ? (i.unitsAvailable ?? i.galonesAvailable ?? 0) : 0), 0);
  const totalLitersInStock = inventoryList.reduce((acc, i) => acc + (isPaintProduct(i) ? (i.totalLiters || 0) : 0), 0);
  const alertStockItems = inventoryList.filter((i) => i.status !== 'optimo').length;

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.requestCode.toLowerCase().includes(search.toLowerCase()) ||
      r.clientName.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedCity !== 'todos' && r.city !== selectedCity) return false;
    if (selectedStatus !== 'todos' && r.status !== selectedStatus) return false;
    return true;
  });

  const filteredInventory = inventoryList.filter((item) => {
    const isPaint = isPaintProduct(item);
    if (invTypeFilter === 'pinturas' && !isPaint) return false;
    if (invTypeFilter === 'materiales' && isPaint) return false;

    const matchesSearch =
      item.productName.toLowerCase().includes(invSearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(invSearch.toLowerCase()) ||
      item.warehouseCity.toLowerCase().includes(invSearch.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(invSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (invWarehouseFilter !== 'todos' && item.warehouseCity !== invWarehouseFilter) return false;
    if (invStatusFilter !== 'todos' && item.status !== invStatusFilter) return false;
    return true;
  });

  const handleApproveFormulation = async (req: PaintRequest) => {
    const updated: PaintRequest = {
      ...req,
      status: 'abastecimiento',
      inventoryAllocation: req.inventoryAllocation || {
        warehouseCity: req.city,
        warehouseName: `CEDI Principal Pintuco ${req.city}`,
        batchNumber: `LOTE-PTC-2026-B${Math.floor(Math.random() * 89 + 10)}`,
        stockConfirmed: true,
        dispatchReadyDate: '2026-08-31',
      },
    };
    onUpdateRequest(updated);
    setToast({ type: 'success', text: `Formulación de ${req.requestCode} aprobada y enviada a Bodega.` });
    
    // Intentar sincronización con Supabase en segundo plano
    syncPaintRequestToSupabase(updated);
  };

  const handleAdvanceToQuality = async (req: PaintRequest) => {
    const now = new Date();
    const updated: PaintRequest = {
      ...req,
      status: 'calidad_garantia',
      qualityCertificate: req.qualityCertificate || {
        certificateId: `GAR-PTC-${Math.floor(Math.random() * 90000 + 10000)}`,
        inspectorName: 'Ing. Carlos Restrepo (Director Q.A.)',
        adhesionTest: 'Excelente',
        substrateMoisture: 3.9,
        dryFilmThicknessMils: 4.2,
        warrantyIssuedDate: '2026-08-30',
        warrantyExpirationDate: `${now.getFullYear() + 5}-08-30`,
      },
    };
    onUpdateRequest(updated);
    setToast({ type: 'success', text: `Garantía oficial emitida para ${req.requestCode}.` });
    syncPaintRequestToSupabase(updated);
  };

  // Generador inteligente de SKU Pintuco
  const handleAutoGenerateSku = () => {
    const isPintura = productTypeMode === 'pintura';
    const prefix = isPintura ? 'PTC-PNT' : 'PTC-MAT';
    const rawCat = isPintura ? newProductForm.category : newProductForm.materialCategory;
    const catCode = (rawCat || 'GEN').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const rand = Math.floor(100 + Math.random() * 900);
    setNewProductForm((prev) => ({
      ...prev,
      sku: `${prefix}-${catCode}-${rand}`,
    }));
  };

  // Gestión de Colores de Pintura para Administrador
  const handleAddCustomColor = () => {
    if (!customColorName.trim()) {
      setToast({ type: 'error', text: 'Ingresa un nombre para el color (ej. Azul Colonial o Gris Humo).' });
      return;
    }
    if (paintColors.some((c) => c.name.toLowerCase() === customColorName.trim().toLowerCase())) {
      setToast({ type: 'error', text: 'Ese color ya se encuentra en la paleta de este producto.' });
      return;
    }
    setPaintColors((prev) => [...prev, { name: customColorName.trim(), hex: customColorHex }]);
    setCustomColorName('');
    setToast({ type: 'success', text: `Color "${customColorName.trim()}" agregado a la paleta.` });
  };

  const handleRemoveColor = (indexToRemove: number) => {
    if (paintColors.length <= 1) {
      setToast({ type: 'error', text: 'La pintura debe tener al menos un color disponible para los clientes.' });
      return;
    }
    setPaintColors((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleTogglePresetColor = (preset: ColorVariant) => {
    const exists = paintColors.some((c) => c.name.toLowerCase() === preset.name.toLowerCase());
    if (exists) {
      if (paintColors.length <= 1) {
        setToast({ type: 'error', text: 'La pintura debe tener al menos un color disponible.' });
        return;
      }
      setPaintColors((prev) => prev.filter((c) => c.name.toLowerCase() !== preset.name.toLowerCase()));
    } else {
      setPaintColors((prev) => [...prev, preset]);
      setToast({ type: 'success', text: `Color "${preset.name}" añadido a la paleta de este producto.` });
    }
  };

  const handleReplenishStock = (itemId: string, amount: number = 50) => {
    const updated = inventoryList.map((i) => {
      if (i.id === itemId) {
        const isPaint = isPaintProduct(i);
        if (isPaint) {
          const newCunetes = (i.cuñetesAvailable || 0) + amount;
          const newGalones = (i.galonesAvailable || 0) + amount * 2;
          const newLiters = newCunetes * 18.9 + newGalones * 3.785;
          return {
            ...i,
            cuñetesAvailable: newCunetes,
            galonesAvailable: newGalones,
            totalLiters: Math.round(newLiters),
            status: 'optimo' as const,
            lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
          };
        } else {
          // Reabastecimiento de materiales / herramientas (unidades)
          const currentUnits = i.unitsAvailable ?? i.galonesAvailable ?? 0;
          const newUnits = currentUnits + amount;
          return {
            ...i,
            unitsAvailable: newUnits,
            galonesAvailable: newUnits,
            totalLiters: newUnits,
            status: 'optimo' as const,
            lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
          };
        }
      }
      return i;
    });
    updateInventoryState(updated);
    setToast({ type: 'success', text: 'Reabastecimiento de bodega registrado con éxito. Los clientes ahora pueden pedir este producto.' });
  };

  const handleEmptyStock = (itemId: string) => {
    const updated = inventoryList.map((i) => {
      if (i.id === itemId) {
        return {
          ...i,
          cuñetesAvailable: 0,
          galonesAvailable: 0,
          unitsAvailable: 0,
          totalLiters: 0,
          status: 'agotado' as const,
          lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      }
      return i;
    });
    updateInventoryState(updated);
    setToast({ type: 'error', text: 'Producto marcado como AGOTADO (0 stock). El sistema bloqueará nuevas solicitudes de este producto hasta que sea reabastecido.' });
  };

  const handleDeleteProduct = (itemId: string) => {
    const updated = inventoryList.filter((i) => i.id !== itemId);
    updateInventoryState(updated);
    setToast({ type: 'info', text: 'Artículo eliminado del catálogo de inventario.' });
  };

  const handleCreateNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.productName.trim() || !newProductForm.sku.trim()) {
      setToast({ type: 'error', text: 'Por favor ingrese el nombre del producto y el código SKU.' });
      return;
    }

    const newId = `inv-${Date.now()}`;
    const isPintura = productTypeMode === 'pintura';

    let newItem: WarehouseInventoryItem;

    if (isPintura) {
      if (paintColors.length === 0) {
        setToast({ type: 'error', text: 'Por favor configure al menos un color disponible para esta pintura.' });
        return;
      }
      const cuñetes = Number(newProductForm.cuñetesAvailable) || 0;
      const galones = Number(newProductForm.galonesAvailable) || 0;
      const totalLiters = Math.round(cuñetes * 18.9 + galones * 3.785);
      const pricePerGalon = Number(newProductForm.pricePerGalon) || 115000;

      newItem = {
        id: newId,
        sku: newProductForm.sku.toUpperCase().trim(),
        productName: newProductForm.productName.trim(),
        category: newProductForm.category,
        unitType: 'pintura',
        imageUrl: newProductForm.imageUrl.trim() || PAINT_IMAGE_PRESETS[0].url,
        totalLiters: totalLiters,
        cuñetesAvailable: cuñetes,
        galonesAvailable: galones,
        quartsAvailable: 0,
        warehouseCity: newProductForm.warehouseCity,
        warehouseName: newProductForm.warehouseName,
        batchCode: `LOTE-PTC-${new Date().getFullYear()}-P${Math.floor(Math.random() * 89 + 10)}`,
        expirationDate: `${new Date().getFullYear() + 3}-12-31`,
        status: (cuñetes + galones > 10) ? 'optimo' : (cuñetes + galones > 0) ? 'critico' : 'agotado',
        minStockAlert: 10,
        pricePerGalon: pricePerGalon,
        surfaceTypeSupported: [newProductForm.surfaceType],
        availableColors: [...paintColors],
        finish: newProductForm.finish,
        description: newProductForm.description || `Pintura ${newProductForm.category} para superficies de ${newProductForm.surfaceType} con acabado ${newProductForm.finish}.`,
        lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
    } else {
      // MATERIALES / HERRAMIENTAS / INSUMOS: Venta exclusiva por unidad/pieza, SIN colores
      const units = Number(newProductForm.unitsAvailable) || 0;
      const unitPrice = Number(newProductForm.unitPrice) || 28000;
      const alertMin = Number(newProductForm.minStockAlert) || 15;

      newItem = {
        id: newId,
        sku: newProductForm.sku.toUpperCase().trim(),
        productName: newProductForm.productName.trim(),
        category: newProductForm.materialCategory,
        unitType: 'herramienta',
        imageUrl: newProductForm.imageUrl.trim() || MATERIAL_IMAGE_PRESETS[0].url,
        totalLiters: units, // compatibilidad numérica
        cuñetesAvailable: 0,
        galonesAvailable: units, // compatibilidad con stock
        unitsAvailable: units,
        quartsAvailable: 0,
        warehouseCity: newProductForm.warehouseCity,
        warehouseName: newProductForm.warehouseName,
        batchCode: `LOTE-MAT-${new Date().getFullYear()}-M${Math.floor(Math.random() * 89 + 10)}`,
        expirationDate: `${new Date().getFullYear() + 5}-12-31`,
        status: units > alertMin ? 'optimo' : units > 0 ? 'critico' : 'agotado',
        minStockAlert: alertMin,
        pricePerGalon: unitPrice, // compatibilidad de precio
        unitPrice: unitPrice,
        unitMeasure: newProductForm.unitMeasure,
        availableColors: [], // ¡MATERIALES NO TIENEN COLORES!
        description: newProductForm.description || `${newProductForm.productName} para aplicación técnica y complementos de pintura.`,
        lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
    }

    const updated = [newItem, ...inventoryList];
    updateInventoryState(updated);
    setIsAddProductModalOpen(false);

    // Resetear formulario a valores por defecto
    setNewProductForm({
      productName: '',
      sku: '',
      category: 'Arquitectónica',
      warehouseCity: 'Medellín',
      warehouseName: 'CEDI Principal Rionegro',
      cuñetesAvailable: 30,
      galonesAvailable: 50,
      pricePerGalon: 115000,
      surfaceType: 'concreto',
      finish: 'Mate',
      coveragePerGalonM2: 45,
      imageUrl: '',
      materialCategory: 'Herramientas y Aplicación',
      unitsAvailable: 120,
      unitPrice: 28000,
      unitMeasure: 'Unidad / Pieza',
      minStockAlert: 15,
      description: '',
    });
    setPaintColors(DEFAULT_PAINT_COLORS);

    setToast({
      type: 'success',
      text: isPintura
        ? `Pintura "${newItem.productName}" agregada exitosamente con imagen y ${newItem.availableColors?.length || 0} colores al inventario de ${newItem.warehouseCity}.`
        : `Material "${newItem.productName}" agregado exitosamente con imagen y ${newItem.unitsAvailable} ${newItem.unitMeasure} al inventario de ${newItem.warehouseCity}.`,
    });
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.name.trim() || !newStaffForm.email.trim()) {
      setToast({ type: 'error', text: 'Por favor ingrese el nombre y correo del operario.' });
      return;
    }

    const staffId = `stf-${Date.now()}`;
    const badge = newStaffForm.badgeNumber.trim() || 
      (newStaffForm.role === 'conductor' 
        ? `LOG-TRK-${Math.floor(100 + Math.random() * 900)}` 
        : `BOD-${Math.floor(1000 + Math.random() * 9000)}`);

    const newMember: StaffMember = {
      id: staffId,
      name: newStaffForm.name.trim(),
      document: newStaffForm.document.trim() || `CC-${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: newStaffForm.email.trim().toLowerCase(),
      phone: newStaffForm.phone.trim() || '+57 300 000 0000',
      role: newStaffForm.role,
      cediCity: newStaffForm.cediCity,
      cediName: newStaffForm.cediName,
      badgeNumber: badge,
      vehiclePlate: newStaffForm.role === 'conductor' 
        ? (newStaffForm.vehiclePlate.trim().toUpperCase() || 'WTL-' + Math.floor(100 + Math.random() * 900)) 
        : undefined,
      vehicleType: newStaffForm.role === 'conductor' ? newStaffForm.vehicleType : undefined,
      licenseCategory: newStaffForm.role === 'conductor' ? newStaffForm.licenseCategory : undefined,
      shift: newStaffForm.role === 'empacador' ? newStaffForm.shift : undefined,
      status: 'activo',
      createdAt: new Date().toISOString(),
    };

    const updated = [newMember, ...staffList];
    setStaffList(updated);
    try {
      localStorage.setItem('colorlink_staff', JSON.stringify(updated));
    } catch {}

    // Sincronizar en localStorage usuarios activos para LoginView
    try {
      const rawUsers = localStorage.getItem('colorlink_users');
      const currentUsers: UserProfile[] = rawUsers ? JSON.parse(rawUsers) : [];
      const newUserProfile: UserProfile = {
        id: staffId,
        name: newMember.name,
        email: newMember.email,
        password: newStaffForm.password || 'pintuco2026',
        phone: newMember.phone,
        role: newMember.role,
        company: `${newMember.cediName} · Pintuco S.A.`,
        city: newMember.cediCity,
        badgeNumber: newMember.badgeNumber,
        vehiclePlate: newMember.vehiclePlate,
      };
      const filtered = currentUsers.filter(u => u.email.toLowerCase() !== newMember.email.toLowerCase());
      localStorage.setItem('colorlink_users', JSON.stringify([newUserProfile, ...filtered]));
    } catch {}

    setIsAddStaffModalOpen(false);
    setToast({
      type: 'success',
      text: `¡${newMember.role === 'conductor' ? 'Conductor' : 'Empacador'} ${newMember.name} registrado con éxito! Credenciales listas para inicio de sesión.`,
    });

    setNewStaffForm({
      name: '',
      document: '',
      email: '',
      phone: '',
      role: 'conductor',
      cediCity: 'Medellín',
      cediName: 'CEDI Rionegro - Bodega Central',
      badgeNumber: '',
      vehiclePlate: '',
      vehicleType: 'Camión NHR 3.5 Ton',
      licenseCategory: 'C2',
      shift: 'Turno Mañana (06:00 - 14:00)',
      password: 'pintuco2026',
    });
  };

  const handleDeleteStaff = (staffId: string) => {
    const updated = staffList.filter((s) => s.id !== staffId);
    setStaffList(updated);
    try {
      localStorage.setItem('colorlink_staff', JSON.stringify(updated));
    } catch {}
    setToast({ type: 'info', text: 'Operario retirado de la nómina de transporte / empaque.' });
  };

  // Guardar edición de datos de cliente
  const handleSaveEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    setIsSavingClient(true);

    const sanitizedId = (editingClient.identification || '').replace(/\D/g, '');
    const sanitizedPhone = (editingClient.phone || '').replace(/\D/g, '');

    const updatedClient = {
      ...editingClient,
      identification: sanitizedId || editingClient.identification,
      phone: sanitizedPhone || editingClient.phone,
      updatedAt: new Date().toISOString(),
    };

    // 1. Guardar de forma persistente en la Base de Datos (Local y Supabase Cloud)
    let syncSuccess = false;
    try {
      const syncRes = await updateClientInDatabase({
        id: updatedClient.id,
        name: updatedClient.name,
        email: updatedClient.email,
        originalEmail: editingClient.originalEmail || editingClient.email,
        identification: updatedClient.identification,
        originalIdentification: editingClient.originalIdentification || editingClient.identification,
        phone: updatedClient.phone,
        company: updatedClient.company,
        city: updatedClient.city,
        address: updatedClient.address,
        password: updatedClient.password,
      });
      syncSuccess = syncRes.syncedToCloud;
    } catch (err: any) {
      console.error('Error al guardar cliente en base de datos:', err);
    }

    const finalClient = {
      ...updatedClient,
      syncedToSupabase: syncSuccess,
    };

    // 2. Actualizar estado de clientsList en el dashboard
    const updatedList = clientsList.map((c) => (c.id === editingClient.id ? finalClient : c));
    setClientsList(updatedList);
    try {
      localStorage.setItem('colorlink_clients', JSON.stringify(updatedList));
    } catch {}

    // 3. Sincronizar en colorlink_users para inicio de sesión inmediato
    try {
      const rawUsers = localStorage.getItem('colorlink_users');
      const usersList: UserProfile[] = rawUsers ? JSON.parse(rawUsers) : [];
      const userIdx = usersList.findIndex(
        (u) =>
          (editingClient.id && u.id === editingClient.id) ||
          u.email.toLowerCase() === (editingClient.originalEmail || editingClient.email).toLowerCase() ||
          u.email.toLowerCase() === updatedClient.email.toLowerCase()
      );
      const updatedUser: UserProfile = {
        id: editingClient.id,
        name: updatedClient.name,
        email: updatedClient.email,
        phone: updatedClient.phone,
        company: updatedClient.company,
        role: 'cliente',
        city: updatedClient.city,
        address: updatedClient.address,
        ...(updatedClient.password ? { password: updatedClient.password } : {}),
      };
      if (userIdx >= 0) {
        usersList[userIdx] = { ...usersList[userIdx], ...updatedUser };
      } else {
        usersList.push(updatedUser);
      }
      localStorage.setItem('colorlink_users', JSON.stringify(usersList));
    } catch {}

    // 4. Si el usuario actual en sesión es este cliente, refrescar sus datos
    if (currentUser && (currentUser.id === editingClient.id || currentUser.email.toLowerCase() === (editingClient.originalEmail || editingClient.email).toLowerCase())) {
      currentUser.name = updatedClient.name;
      currentUser.email = updatedClient.email;
      currentUser.city = updatedClient.city;
      currentUser.company = updatedClient.company;
      currentUser.phone = updatedClient.phone;
    }

    // 5. Si la pestaña de explorador de tablas de Supabase está activa, refrescar los datos
    if (adminTab === 'supabase' && supabaseSubTab === 'tablas') {
      handleLoadTableData(selectedErdTable);
    }

    setIsSavingClient(false);
    setIsEditClientModalOpen(false);
    setToast({
      type: 'success',
      text: syncSuccess
        ? `¡Datos del cliente "${updatedClient.name}" guardados y sincronizados con éxito en la base de datos (PostgreSQL/Supabase)!`
        : `¡Datos del cliente "${updatedClient.name}" guardados con éxito en la base de datos (public.clientes y public.usuarios)!`,
    });
    setEditingClient(null);
  };

  // Guardar edición de datos de personal operativo (Conductor o Empacador)
  const handleSaveEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    const sanitizedDoc = (editingStaff.document || '').replace(/\D/g, '');
    const sanitizedPhone = (editingStaff.phone || '').replace(/\D/g, '');

    const updatedMember: StaffMember = {
      ...editingStaff,
      document: sanitizedDoc || editingStaff.document,
      phone: sanitizedPhone || editingStaff.phone,
      vehiclePlate: editingStaff.role === 'conductor' ? editingStaff.vehiclePlate?.toUpperCase() : undefined,
      vehicleType: editingStaff.role === 'conductor' ? editingStaff.vehicleType : undefined,
      licenseCategory: editingStaff.role === 'conductor' ? editingStaff.licenseCategory : undefined,
      shift: editingStaff.role === 'empacador' ? editingStaff.shift : undefined,
    };

    const updatedStaffList = staffList.map((s) => (s.id === editingStaff.id ? updatedMember : s));
    setStaffList(updatedStaffList);
    try {
      localStorage.setItem('colorlink_staff', JSON.stringify(updatedStaffList));
    } catch {}

    // Sincronizar en colorlink_users para LoginView
    try {
      const rawUsers = localStorage.getItem('colorlink_users');
      const usersList: UserProfile[] = rawUsers ? JSON.parse(rawUsers) : [];
      const userIdx = usersList.findIndex((u) => u.email.toLowerCase() === updatedMember.email.toLowerCase() || u.id === updatedMember.id);
      const updatedUser: UserProfile = {
        id: updatedMember.id,
        name: updatedMember.name,
        email: updatedMember.email,
        password: updatedMember.password || 'pintuco2026',
        phone: updatedMember.phone,
        role: updatedMember.role,
        company: `${updatedMember.cediName} · Pintuco S.A.`,
        city: updatedMember.cediCity,
        badgeNumber: updatedMember.badgeNumber,
        vehiclePlate: updatedMember.vehiclePlate,
      };
      if (userIdx >= 0) {
        usersList[userIdx] = updatedUser;
      } else {
        usersList.push(updatedUser);
      }
      localStorage.setItem('colorlink_users', JSON.stringify(usersList));
    } catch {}

    setIsEditStaffModalOpen(false);
    setToast({
      type: 'success',
      text: `¡Datos del ${updatedMember.role === 'conductor' ? 'Conductor' : 'Empacador'} "${updatedMember.name}" actualizados correctamente!`,
    });
    setEditingStaff(null);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCopyRlsFixSql = () => {
    navigator.clipboard.writeText(SUPABASE_RLS_FIX_SQL);
    setCopiedRlsFix(true);
    setTimeout(() => setCopiedRlsFix(false), 2500);
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setConnTestResult(null);
    const result = await testSupabaseConnection(supabaseConfig);
    setIsTestingConn(false);
    setConnTestResult(result);
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = normalizeSupabaseUrl(supabaseConfig.url);
    const updated = {
      ...supabaseConfig,
      url: cleanUrl,
      anonKey: supabaseConfig.anonKey.trim() || DEFAULT_SUPABASE_KEY,
      connected: !!cleanUrl,
    };
    setSupabaseConfig(updated);
    saveSupabaseConfig(updated);
    setToast({ type: 'info', text: 'Configuración de Supabase guardada. Probando conexión...' });
    setIsTestingConn(true);
    setConnTestResult(null);
    const result = await testSupabaseConnection(updated);
    setIsTestingConn(false);
    setConnTestResult(result);
  };

  const handleSyncAllOrders = async () => {
    setIsSyncingAll(true);
    try {
      const res = await syncAllRequestsToSupabase(requests);
      setToast({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      setSupabaseConfig(getSupabaseConfig());
    } catch (err: any) {
      setToast({
        type: 'error',
        text: `Error al sincronizar: ${err?.message || 'Error desconocido'}`,
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Cargar clientes desde localStorage y Supabase (PostgreSQL public.clientes)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('colorlink_clients');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setClientsList(parsed);
        }
      }
    } catch {}

    fetchClientsFromSupabase().then((res) => {
      if (res.success && res.clients && res.clients.length > 0) {
        const mapped = res.clients.map((c: any) => ({
          id: c.id_cliente || c.id,
          identification: c.n_identificacion || c.identification,
          name: c.nombre || c.name,
          email: c.email,
          phone: c.telefono || c.phone,
          address: c.direccion || c.address,
          city: c.city || 'Medellín',
          company: c.company || c.nombre || c.name,
          syncedToSupabase: c.syncedToSupabase ?? true,
          createdAt: c.created_at || c.createdAt || new Date().toISOString(),
        }));
        setClientsList((prev) => {
          const combined = [...prev];
          for (const mc of mapped) {
            const idx = combined.findIndex((p) => p.email?.toLowerCase() === mc.email?.toLowerCase());
            if (idx >= 0) {
              combined[idx] = { ...combined[idx], ...mc };
            } else {
              combined.unshift(mc);
            }
          }
          return combined;
        });
      }
    });
  }, [adminTab, supabaseConfig.connected]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientForm.name.trim() || !newClientForm.email.trim() || !newClientForm.phone.trim()) {
      setToast({ type: 'error', text: 'Por favor complete los campos obligatorios: Nombre, Correo y Teléfono.' });
      return;
    }

    setIsCreatingClient(true);
    const newClientObj = {
      id: 'cli-' + Math.random().toString(36).substring(2, 7),
      identification: newClientForm.identification.trim() || `NIT-${Math.floor(Math.random() * 9000000 + 1000000)}`,
      name: newClientForm.name.trim(),
      email: newClientForm.email.trim().toLowerCase(),
      phone: newClientForm.phone.trim(),
      address: newClientForm.address.trim() || `${newClientForm.city}, Colombia`,
      city: newClientForm.city,
      company: newClientForm.company.trim() || newClientForm.name.trim(),
      createdAt: new Date().toISOString(),
      syncedToSupabase: false,
    };

    // 1. Guardar en Supabase Cloud (tablas clientes y usuarios)
    let syncNotice = '';
    try {
      const syncRes = await syncClientToSupabase({
        id: newClientObj.id,
        name: newClientObj.name,
        email: newClientObj.email,
        phone: newClientObj.phone,
        address: newClientObj.address,
        city: newClientObj.city,
        identification: newClientObj.identification,
        role: 'cliente',
        company: newClientObj.company,
        password: 'cliente123',
      });

      if (syncRes.success) {
        newClientObj.syncedToSupabase = true;
        syncNotice = ' ¡Guardado y sincronizado con éxito en Supabase Cloud!';
      } else {
        syncNotice = ` (${syncRes.message})`;
      }
    } catch (err: any) {
      syncNotice = ` (Nota Supabase: ${err.message})`;
    }

    // 2. Guardar en users para login
    try {
      const storedUsers = localStorage.getItem('colorlink_users');
      const usersList = storedUsers ? JSON.parse(storedUsers) : [];
      const userIdx = usersList.findIndex((u: any) => u.email?.toLowerCase() === newClientObj.email);
      const userRecord = {
        id: newClientObj.id,
        name: newClientObj.name,
        email: newClientObj.email,
        password: 'cliente123',
        phone: newClientObj.phone,
        company: newClientObj.company,
        role: 'cliente',
        city: newClientObj.city,
      };
      if (userIdx >= 0) {
        usersList[userIdx] = userRecord;
      } else {
        usersList.push(userRecord);
      }
      localStorage.setItem('colorlink_users', JSON.stringify(usersList));
    } catch (err) {
      console.error(err);
    }

    // 3. Guardar en lista de clientes
    const updatedList = [newClientObj, ...clientsList];
    setClientsList(updatedList);
    try {
      localStorage.setItem('colorlink_clients', JSON.stringify(updatedList));
    } catch {}

    setIsCreatingClient(false);
    setIsAddClientModalOpen(false);
    setNewClientForm({
      name: '',
      identification: '',
      email: '',
      phone: '',
      address: '',
      city: 'Medellín',
      company: '',
    });

    setToast({
      type: 'success',
      text: `Cliente "${newClientObj.name}" registrado correctamente.${syncNotice}`,
    });
  };

  const handleSyncSingleClient = async (cli: any) => {
    setIsSyncingClientMap((prev) => ({ ...prev, [cli.id]: true }));
    try {
      const res = await syncClientToSupabase({
        id: cli.id,
        name: cli.name,
        email: cli.email,
        phone: cli.phone,
        address: cli.address,
        city: cli.city || 'Medellín',
        identification: cli.identification,
        role: 'cliente',
        company: cli.company,
        password: cli.password || 'cliente123',
      });

      if (res.success) {
        setClientsList((prev) =>
          prev.map((c) => (c.id === cli.id ? { ...c, syncedToSupabase: true } : c))
        );
        setToast({
          type: 'success',
          text: `Cliente "${cli.name}" sincronizado con éxito en Supabase Cloud.`,
        });
      } else {
        setToast({
          type: 'error',
          text: `Error al sincronizar cliente: ${res.message}`,
        });
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        text: `Error de conexión: ${err.message}`,
      });
    } finally {
      setIsSyncingClientMap((prev) => ({ ...prev, [cli.id]: false }));
    }
  };

  const handleLoadTableData = async (tableName: string) => {
    setSelectedErdTable(tableName);
    setIsLoadingTable(true);
    const res = await fetchTableFromSupabase(tableName);
    setIsLoadingTable(false);
    if (res.success) {
      setTableQueryData(res.data);
    } else {
      // Si no hay Supabase online o error, armar vista desde los datos locales
      setTableQueryData(getLocalTablePreview(tableName));
    }
  };

  // Generador de datos relacionales locales para visualizar las 12 tablas
  const getLocalTablePreview = (tableName: string) => {
    switch (tableName) {
      case 'usuarios': {
        const storedUsers = localStorage.getItem('colorlink_users');
        let users: any[] = [];
        if (storedUsers) {
          try {
            users = JSON.parse(storedUsers);
          } catch {}
        }
        if (users && users.length > 0) {
          return users.map((u: any) => ({
            id_usuario: u.id,
            nombre: u.name,
            direccion: u.address ? `${u.address} (${u.city || 'Medellín'})` : `${u.city || 'Medellín'}, Colombia`,
            email: u.email,
            telefono: u.phone || '3000000000',
            rol: u.role || 'cliente',
            estado: 'activo',
          }));
        }
        return [
          { id_usuario: 'u1-admin', nombre: 'Ing. Carlos Restrepo', direccion: 'Cra 43A #1-50, Medellín', email: 'admin@pintuco.com', telefono: '3104567890', rol: 'administrador', estado: 'activo' },
          { id_usuario: 'u2-pack', nombre: 'Javier Gómez', direccion: 'CEDI Rionegro Km 2', email: 'empacador@pintuco.com', telefono: '3129876543', rol: 'empacador', estado: 'activo' },
          { id_usuario: 'u3-driv', nombre: 'Wilson Cañas', direccion: 'CEDI Siberia Muelle 4', email: 'conductor@pintuco.com', telefono: '3157654321', rol: 'conductor', estado: 'activo' },
          { id_usuario: 'u4-clie', nombre: 'Constructora Bolívar S.A.', direccion: 'Calle 98 #11-20, Bogotá', email: 'cliente@pintuco.com', telefono: '3201122334', rol: 'cliente', estado: 'activo' },
        ];
      }
      case 'canales':
        return [
          { id_canal: 'c1', nombre_canal: 'Directo Pintuco S.A.' },
          { id_canal: 'c2', nombre_canal: 'Portal Web Transversal ColorLink' },
          { id_canal: 'c3', nombre_canal: 'Ferretería & Distribuidor Aliado' },
          { id_canal: 'c4', nombre_canal: 'Constructor VIP' },
        ];
      case 'clientes': {
        const stored = localStorage.getItem('colorlink_clients');
        const list = stored ? JSON.parse(stored) : clientsList;
        return list.map((c: any, idx: number) => ({
          id_cliente: c.id || `cl-${idx + 1}`,
          n_identificacion: c.identification || `NIT-900.${idx + 1}23.456-7`,
          nombre: c.name,
          direccion: c.address
            ? (c.address.toLowerCase().includes((c.city || '').toLowerCase()) ? c.address : `${c.address} (${c.city || 'Medellín'})`)
            : `${c.city || 'Medellín'}, Colombia`,
          email: c.email,
          telefono: c.phone,
        }));
      }
      case 'proyectos':
        return requests.map((r, idx) => ({
          id_proyecto: `proj-${idx + 1}`,
          id_cliente: `cl-${idx + 1}`,
          id_canal: 'c2',
          descripcion: `Proyecto ${r.projectType} (${r.city})`,
          fecha: r.createdAt.split(' ')[0],
          estado: r.status === 'calidad_garantia' ? 'completado' : 'en_ejecucion',
          presupuesto: r.technicalCalculation?.estimatedMaterialCostCOP,
        }));
      case 'solicitudes':
        return requests.map((r, idx) => ({
          id_solicitud: `sol-${idx + 1}`,
          id_proyecto: `proj-${idx + 1}`,
          detalles: `Pintura ${r.colorName} para ${r.areaM2} m² (${r.surfaceType})`,
          fecha: r.createdAt.split(' ')[0],
          estado: r.status,
          area_m2: r.areaM2,
          tipo_superficie: r.surfaceType,
          color: r.colorName,
        }));
      case 'inventario':
        return inventoryList.map((i) => {
          const isPaint = isPaintProduct(i);
          const stock = isPaint
            ? ((i.cuñetesAvailable || 0) * 5 + (i.galonesAvailable || 0))
            : (i.unitsAvailable ?? i.galonesAvailable ?? 120);
          const unitPrice = i.unitPrice ?? i.pricePerGalon ?? 89900;
          return {
            id_material: i.id,
            sku: i.sku,
            nombre: i.productName,
            tipo: i.category,
            stock: `${stock} ${isPaint ? 'Galones' : 'Unidades'}`,
            precio_cop: unitPrice,
            bodega_cedi: `${i.warehouseCity} · ${i.warehouseName}`,
            estado: (i.status || 'optimo').toUpperCase(),
          };
        });
      case 'materiales': {
        const reqMats = requests.map((r, idx) => ({
          id_material: `mat-req-${idx + 1}`,
          solicitud_o_origen: `Orden ${r.requestCode}`,
          nombre: r.technicalCalculation?.recommendedProduct.name || 'Viniltex Avanzada',
          cantidad: `${(r.technicalCalculation?.totalCuñetes || 1) + (r.technicalCalculation?.remainderGalons || 0)} Cuñetes/Gal`,
          nom_empacador: r.packagingDetails?.packerName || 'Javier Gómez (CEDI)',
          ubicacion_cedi: r.city || 'Medellín',
        }));
        const toolsAndMaterials = inventoryList
          .filter((i) => !isPaintProduct(i) || i.unitType === 'herramienta' || i.unitType === 'insumo')
          .map((mat) => ({
            id_material: mat.id,
            solicitud_o_origen: `Stock CEDI ${mat.warehouseCity}`,
            nombre: mat.productName,
            cantidad: `${mat.unitsAvailable ?? mat.galonesAvailable ?? 150} Unidades`,
            nom_empacador: `Muelle CEDI ${mat.warehouseCity}`,
            ubicacion_cedi: mat.warehouseCity,
          }));
        return [...reqMats, ...toolsAndMaterials];
      }
      case 'pedidos':
        return requests.map((r, idx) => ({
          id_pedido: `ped-${idx + 1}`,
          id_solicitud: `sol-${idx + 1}`,
          codigo_orden: r.requestCode,
          estado: r.status,
        }));
      case 'cotizaciones':
        return requests.map((r, idx) => ({
          id_cotizacion: `cot-${idx + 1}`,
          id_pedido: `ped-${idx + 1}`,
          fecha_cotiz: r.createdAt.split(' ')[0],
          detalles: `${r.technicalCalculation?.handsNeeded} manos recomendadas`,
          total: r.technicalCalculation?.estimatedMaterialCostCOP,
        }));
      case 'facturas':
        return requests.map((r, idx) => ({
          id_factura: `fac-${idx + 1}`,
          id_cliente: `cl-${idx + 1}`,
          id_cotizacion: `cot-${idx + 1}`,
          descripcion: `Facturación Pintuco Orden ${r.requestCode}`,
          total: r.technicalCalculation?.estimatedMaterialCostCOP,
          estado_pago: 'pagada',
        }));
      case 'entregas':
        return requests.map((r, idx) => ({
          id_entrega: `ent-${idx + 1}`,
          id_proyecto: `proj-${idx + 1}`,
          fecha: r.createdAt.split(' ')[0],
          estado: r.deliveryDetails?.routeStatus || 'en_ruta',
          conductor_nombre: r.deliveryDetails?.driverName || 'Wilson Cañas',
          vehiculo_placa: r.deliveryDetails?.vehiclePlate || 'WTL-582',
        }));
      case 'control_de_calidad':
        return requests.map((r, idx) => ({
          id_calidad: `cal-${idx + 1}`,
          id_entrega: `ent-${idx + 1}`,
          resultado: r.qualityCertificate?.adhesionTest ? `Adherencia: ${r.qualityCertificate.adhesionTest}` : 'Conforme 100%',
          fecha: r.qualityCertificate?.warrantyIssuedDate || '2026-08-30',
          inspector: r.qualityCertificate?.inspectorName || 'Ing. Carlos Restrepo',
          anios_garantia: 5,
        }));
      default:
        return [];
    }
  };

  useEffect(() => {
    if (adminTab === 'supabase' && supabaseSubTab === 'tablas') {
      handleLoadTableData(selectedErdTable);
    }
  }, [adminTab, supabaseSubTab, selectedErdTable]);

  // Lista de las 12 tablas del ERD para el navegador visual
  const ERD_TABLES_INFO = [
    { id: 'usuarios', name: 'Usuario', pk: 'id_usuario', icon: '👤', desc: 'Usuarios del sistema, roles (Admin, Empacador, Conductor, Cliente) y estados de acceso.', cols: ['id_usuario (PK)', 'nombre', 'direccion', 'email', 'telefono', 'rol', 'estado'] },
    { id: 'canales', name: 'Canal', pk: 'id_canal', icon: '🌐', desc: 'Canales comerciales (Directo Pintuco, Portal Web, Distribuidor Aliado, Constructor VIP).', cols: ['id_canal (PK)', 'nombre_canal'] },
    { id: 'clientes', name: 'cliente', pk: 'id_cliente', icon: '🏢', desc: 'Clientes y constructoras registradas con NIT, contacto y dirección de obra.', cols: ['id_cliente (PK)', 'n_identificacion', 'nombre', 'direccion', 'email', 'telefono'] },
    { id: 'proyectos', name: 'Proyecto', pk: 'id_proyecto', icon: '🏗️', desc: 'Obras constructivas, fechas, presupuesto estimado y estado del proyecto.', cols: ['id_proyecto (PK)', 'id_cliente (FK)', 'id_canal (FK)', 'descripcion', 'fecha', 'estado', 'presupuesto'] },
    { id: 'solicitudes', name: 'solicitud', pk: 'id_solicitud', icon: '📝', desc: 'Requerimientos técnicos de pintura, m², color y tipo de superficie.', cols: ['id_solicitud (PK)', 'id_proyecto (FK)', 'detalles', 'fecha', 'estado', 'area_m2', 'tipo_superficie', 'color'] },
    { id: 'materiales', name: 'Material', pk: 'id_material', icon: '🎨', desc: 'Material formulado asignado a la solicitud con responsable de empaque en bodega.', cols: ['id_material (PK)', 'id_solicitud (FK)', 'id_inventario (FK)', 'nombre', 'cantidad', 'nom_empacador'] },
    { id: 'inventario', name: 'Inventario', pk: 'id_material', icon: '📦', desc: 'Catálogo de pinturas en CEDI, presentaciones, existencias en cuñetes y precios.', cols: ['id_material (PK)', 'sku', 'nombre', 'tipo', 'stock', 'precio', 'bodega_cedi'] },
    { id: 'pedidos', name: 'Pedido', pk: 'id_pedido', icon: '📋', desc: 'Órdenes de producción y despacho con código único y trazabilidad transversal.', cols: ['id_pedido (PK)', 'id_solicitud (FK)', 'id_material (FK)', 'id_factura (FK)', 'codigo_orden', 'estado'] },
    { id: 'cotizaciones', name: 'Cotización', pk: 'id_cotizacion', icon: '💰', desc: 'Presupuestos formales calculados con cubicaje de cuñetes, galones y costo COP.', cols: ['id_cotizacion (PK)', 'id_pedido (FK)', 'fecha_cotiz', 'detalles', 'total'] },
    { id: 'facturas', name: 'Factura', pk: 'id_factura', icon: '🧾', desc: 'Comprobantes fiscales y facturación asociada a la cotización y al cliente.', cols: ['id_factura (PK)', 'id_cliente (FK)', 'id_cotizacion (FK)', 'descripcion', 'total', 'fecha_emision', 'estado_pago'] },
    { id: 'entregas', name: 'Entrega', pk: 'id_entrega', icon: '🚚', desc: 'Despacho logístico en tiempo real con hoja de ruta, conductor y placa.', cols: ['id_entrega (PK)', 'id_proyecto (FK)', 'fecha', 'estado', 'conductor_nombre', 'vehiculo_placa', 'firma_digital_url'] },
    { id: 'control_de_calidad', name: 'Control de calidad', pk: 'id_calidad', icon: '🛡️', desc: 'Auditoría técnica, prueba de adherencia ASTM D3359 y certificado de garantía.', cols: ['id_calidad (PK)', 'id_entrega (FK)', 'resultado', 'fecha', 'inspector', 'anios_garantia'] },
  ];

  return (
    <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto space-y-6" id="admin-dashboard-root">
      {/* Banner Principal del Administrador · Centro de Control Logístico */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-7 shadow-xs border border-slate-800 relative overflow-hidden">
        {/* Glow sutil institucional */}
        <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/90 text-white flex items-center justify-center font-bold shadow-xs shrink-0 border border-blue-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-400/30 font-semibold">
                  PANEL DE CONTROL GENERAL · COLORLINK CEDI
                </span>
                <span className="text-xs text-slate-400 font-medium">· Administración Central</span>
              </div>
              <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white mt-1 tracking-tight">
                {currentUser.name}
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mt-0.5">
                Supervisión nacional de producción, inventario en tiempo real en CEDIs, personal logístico y base de datos relacional.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onCreateNewRequest}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer border border-blue-500"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nueva Solicitud</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddStaffModalOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700/80 text-slate-200 font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer shadow-2xs"
              title="Registrar nuevo Conductor o Empacador en la red operativa"
              id="btn-admin-add-staff-top"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-400" />
              <span>+ Personal Logístico</span>
            </button>
            <button
              type="button"
              onClick={onOpenCalculator}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700/80 text-slate-200 font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>Calculadora</span>
            </button>
          </div>
        </div>

        {/* Selector de Pestañas de Administración */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setAdminTab('ordenes')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                adminTab === 'ordenes'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Órdenes</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${adminTab === 'ordenes' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {requests.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('inventario')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                adminTab === 'inventario'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Inventario CEDIs</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${adminTab === 'inventario' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {inventoryList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('clientes')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                adminTab === 'clientes'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Clientes & Empresas</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${adminTab === 'clientes' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {clientsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('operarios')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                adminTab === 'operarios'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Personal Operativo</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${adminTab === 'operarios' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {staffList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('supabase')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                adminTab === 'supabase'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Base de Datos Supabase (12 Tablas)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {supabaseConfig.connected ? (
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Supabase Sincronizado
              </span>
            ) : (
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                Modo Local
              </span>
            )}
          </div>
        </div>

        {/* Métricas Ejecutivas Globales */}
        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs relative z-10">
          <div className="bg-white/10 p-3 rounded-xl border border-white/15 backdrop-blur-xs">
            <span className="text-[#86deb8] block text-[10px] uppercase font-mono font-bold">Solicitudes Totales:</span>
            <span className="text-xl font-bold font-['Space_Grotesk'] text-white">{requests.length} proyectos</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl border border-white/15 backdrop-blur-xs">
            <span className="text-[#86deb8] block text-[10px] uppercase font-mono font-bold">Área Formulada:</span>
            <span className="text-xl font-bold font-['Space_Grotesk'] text-[#27cbd2]">{(totalM2 || 0).toLocaleString()} m²</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl border border-white/15 backdrop-blur-xs">
            <span className="text-[#86deb8] block text-[10px] uppercase font-mono font-bold">Stock en Cuñetes:</span>
            <span className="text-xl font-bold font-['Space_Grotesk'] text-[#fdf0b5]">{totalCunetesInStock} cuñetes</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl border border-white/15 backdrop-blur-xs">
            <span className="text-[#86deb8] block text-[10px] uppercase font-mono font-bold">En Despacho / Ruta:</span>
            <span className="text-xl font-bold font-['Space_Grotesk'] text-white">{inTransit} despachos</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl border border-white/15 backdrop-blur-xs">
            <span className="text-[#86deb8] block text-[10px] uppercase font-mono font-bold">Obras con Garantía:</span>
            <span className="text-xl font-bold font-['Space_Grotesk'] text-[#86deb8]">{delivered} obras</span>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : toast.type === 'error'
              ? 'bg-red-50 border-red-300 text-red-900'
              : 'bg-blue-50 border-blue-300 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toast.text}</span>
          </div>
          <button type="button" onClick={() => setToast(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* PESTAÑA 1: GESTIÓN DE ÓRDENES */}
      {adminTab === 'ordenes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Tabla y Filtros */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-sm font-bold text-navy-900 uppercase font-mono tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Listado Central de Órdenes Pintuco
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  {filteredRequests.length} órdenes filtradas
                </span>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                <div className="relative sm:col-span-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por código, cliente o ciudad..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  <option value="todos">Todas las ciudades</option>
                  <option value="Medellín">Medellín</option>
                  <option value="Bogotá D.C.">Bogotá D.C.</option>
                  <option value="Cali">Cali</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="solicitud_recibida">1. Solicitud Recibida</option>
                  <option value="solucion_tecnica">2. Solución Técnica</option>
                  <option value="abastecimiento">3. En Bodega CEDI</option>
                  <option value="servicio_despacho">4. Despacho / Conductor</option>
                  <option value="calidad_garantia">5. Calidad & Garantía</option>
                </select>
              </div>

              {/* Lista interactiva */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredRequests.map((req) => {
                  const isSelected = req.id === selectedReqId;
                  const getStatusInfo = () => {
                    switch (req.status) {
                      case 'solicitud_recibida':
                        return { text: '1. Solicitud Recibida', color: 'bg-blue-50 text-blue-700 border-blue-200' };
                      case 'solucion_tecnica':
                        return { text: '2. Formulación Lista', color: 'bg-teal-50 text-teal-700 border-teal-200' };
                      case 'abastecimiento':
                        return { text: '3. En Bodega CEDI', color: 'bg-amber-50 text-amber-700 border-amber-200' };
                      case 'servicio_despacho':
                        return { text: '4. Conductor / Ruta', color: 'bg-purple-50 text-purple-700 border-purple-200' };
                      case 'calidad_garantia':
                        return { text: '5. Garantía Emitida', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
                    }
                  };

                  const st = getStatusInfo();
                  const reqCalc = req.technicalCalculation;
                  const prodImg = getProductImage({
                    productName: reqCalc?.recommendedProduct.name || req.surfaceType,
                  });

                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedReqId(req.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs">
                          <img
                            src={prodImg}
                            alt={req.clientName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {req.colorHex && (
                            <span
                              className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                              style={{ backgroundColor: req.colorHex }}
                              title={req.colorName}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-teal-900">
                                {req.requestCode}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {req.createdAt}
                              </span>
                            </div>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${st.color}`}>
                              {st.text}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900 truncate max-w-[240px]">
                              {req.clientName}
                            </p>
                            <span className="text-xs font-mono text-slate-600">
                              {req.city} · <strong>{req.areaM2} m²</strong>
                            </span>
                          </div>

                          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-100 pt-1">
                            <span className="truncate flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: req.colorHex || '#94a3b8' }} />
                              {reqCalc?.recommendedProduct.name || 'Pintuco'} ({req.colorName})
                            </span>
                            <span className="text-teal-800 font-mono font-semibold">
                              {reqCalc?.totalCuñetes || 1} Cuñ + {reqCalc?.remainderGalons || 0} Gal
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Panel de Control & Acciones de la Orden */}
          <div className="lg:col-span-5 space-y-4">
            {selectedRequest ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-purple-400 font-bold">
                      {selectedRequest.requestCode}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {selectedRequest.city}
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-['Space_Grotesk'] text-white">
                    {selectedRequest.clientName}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {selectedRequest.clientEmail} · {selectedRequest.clientPhone}
                  </p>
                </div>

                {/* Trazabilidad por Roles Conectados */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
                  <h4 className="font-bold text-navy-900 uppercase font-mono text-[11px] flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-amber-600" />
                    Responsables de Operación Asignados
                  </h4>

                  <div className="space-y-1.5">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-mono">1. EMPACADOR / CEDI:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedRequest.packagingDetails?.packerName || 'Javier Gómez (CEDI Rionegro)'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                        {selectedRequest.packagingDetails?.status === 'empacado_listo' ? 'Empacado ✓' : 'Pendiente'}
                      </span>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-mono">2. CONDUCTOR / TRANSPORTE:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedRequest.deliveryDetails?.driverName || 'Wilson Cañas (WTL-582)'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                        {selectedRequest.deliveryDetails?.routeStatus || 'En espera'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Solución Técnica y Formulación Pintuco */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-navy-900 uppercase font-mono text-[11px]">
                    Especificación de Material & Cubicaje
                  </h4>
                  <p>
                    <strong>Producto:</strong> {selectedRequest.technicalCalculation?.recommendedProduct.name}
                  </p>
                  <p>
                    <strong>Rendimiento & Manos:</strong> {selectedRequest.technicalCalculation?.handsNeeded} manos ({selectedRequest.areaM2} m² cubiertos)
                  </p>
                  <p>
                    <strong>Cubicaje:</strong> {selectedRequest.technicalCalculation?.totalCuñetes} Cuñetes (5 Gal) + {selectedRequest.technicalCalculation?.remainderGalons} Galones
                  </p>
                  <p>
                    <strong>Costo Estimado Material:</strong> ${(selectedRequest.technicalCalculation?.estimatedMaterialCostCOP || 0).toLocaleString('es-CO')} COP
                  </p>
                </div>

                {/* Botones de Acción Administrativa */}
                <div className="pt-2 space-y-2 border-t border-slate-200">
                  {selectedRequest.status === 'solicitud_recibida' && (
                    <button
                      type="button"
                      onClick={() => handleApproveFormulation(selectedRequest)}
                      className="w-full btn-primary !bg-teal-700 hover:!bg-teal-800 !py-2.5 !text-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Aprobar Formulación y Enviar a Bodega
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(selectedRequest)}
                    style={{ color: '#000000' }}
                    className="w-full py-2 px-3 text-xs flex items-center justify-center gap-1.5 shadow-md rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black border-2 border-black cursor-pointer transition-all"
                  >
                    <Receipt className="w-4 h-4 text-black" style={{ color: '#000000' }} />
                    <span style={{ color: '#000000' }} className="text-black font-black">
                      📄 Descargar Factura Electrónica (PDF)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenCertificate(selectedRequest)}
                    className="w-full btn-secondary !py-2 !text-xs flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    Ver / Emitir Certificado de Calidad & Garantía
                  </button>

                  {selectedRequest.status !== 'calidad_garantia' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceToQuality(selectedRequest)}
                      className="w-full py-1.5 text-xs text-purple-700 hover:underline font-medium text-center"
                    >
                      Avanzar estado a Garantía Oficial
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                Seleccione una orden para ver detalles administrativos.
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: INVENTARIO EN VIVO DE CEDIs & BODEGAS */}
      {adminTab === 'inventario' && (
        <div className="space-y-5" id="inventory-view-root">
          {/* Tarjetas de Resumen de Bodegas & Tipos de Producto */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono mb-1">
                <Warehouse className="w-4 h-4 text-teal-600" />
                <span>BODEGAS CEDI</span>
              </div>
              <p className="text-2xl font-bold text-navy-900 font-mono">5 CEDIs</p>
              <p className="text-[11px] text-slate-500 mt-1">Rionegro, Siberia, Yumbo, Galapa, Girón</p>
            </div>

            <div className="bg-white rounded-2xl border border-teal-200 bg-teal-50/20 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-teal-800 text-xs font-mono mb-1 font-semibold">
                <Paintbrush className="w-4 h-4 text-teal-700" />
                <span>PINTURAS & RECUBRIMIENTOS</span>
              </div>
              <p className="text-2xl font-bold text-teal-950 font-mono">{totalPinturasCount} Líneas</p>
              <p className="text-[11px] text-teal-800 mt-1 font-mono">
                {totalCunetesInStock} Cuñetes · {totalGalonesInStock} Gal (~{(totalLitersInStock || 0).toLocaleString()} L)
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/20 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-mono mb-1 font-semibold">
                <Wrench className="w-4 h-4 text-amber-700" />
                <span>MATERIALES & HERRAMIENTAS</span>
              </div>
              <p className="text-2xl font-bold text-amber-950 font-mono">{totalUnidadesMateriales} Unidades</p>
              <p className="text-[11px] text-amber-800 mt-1 font-mono">
                {totalMaterialesCount} Referencias · Venta por unidad (sin color)
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>ALERTAS DE STOCK</span>
              </div>
              <p className="text-2xl font-bold text-red-700 font-mono">{alertStockItems} Ítems</p>
              <p className="text-[11px] text-slate-500 mt-1">Bajo umbral mínimo o agotados</p>
            </div>
          </div>

          {/* Tabla de Inventario con Filtros */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            {/* Encabezado y Barra de Acciones de Inventario */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-300 font-bold">
                    CATÁLOGO MAESTRO CEDI PINTUCO
                  </span>
                  <span className="text-xs text-slate-500">· Exclusivo Administrador</span>
                </div>
                <h3 className="text-base font-bold font-['Space_Grotesk'] text-navy-900 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-amber-600" />
                  Control Maestro de Inventario: Pinturas (con Colores) y Materiales (por Unidad)
                </h3>
                <p className="text-xs text-slate-500">
                  Como Administrador, agregue nuevas pinturas con su carta de colores o agregue materiales/herramientas que se venden directamente por unidad sin colores.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={async () => {
                    setIsSyncingInventory(true);
                    const res = await syncAllInventoryToSupabase(inventoryList);
                    setIsSyncingInventory(false);
                    setToast({
                      type: res.success ? 'success' : 'error',
                      text: res.message,
                    });
                  }}
                  disabled={isSyncingInventory}
                  className="px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-900 transition-colors cursor-pointer shadow-2xs"
                  id="btn-admin-sync-inventory-db"
                  title="Guardar y registrar todo el inventario (incluyendo Bogotá) en la base de datos PostgreSQL / Supabase"
                >
                  <Database className={`w-3.5 h-3.5 text-teal-700 ${isSyncingInventory ? 'animate-spin' : ''}`} />
                  <span>{isSyncingInventory ? 'Guardando en BD...' : 'Guardar en Base de Datos'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProductTypeMode('pintura');
                    setIsAddProductModalOpen(true);
                  }}
                  className="btn-primary text-xs !py-2.5 !px-4 flex items-center gap-1.5 shadow-sm bg-teal-700 hover:bg-teal-800"
                  id="btn-admin-add-product"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Agregar Producto al Inventario</span>
                </button>
              </div>
            </div>

            {/* Pestañas de Filtro Rápido de Tipo */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3 pt-1">
              <button
                type="button"
                onClick={() => setInvTypeFilter('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  invTypeFilter === 'todos'
                    ? 'bg-navy-900 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todos los Artículos ({inventoryList.length})
              </button>
              <button
                type="button"
                onClick={() => setInvTypeFilter('pinturas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  invTypeFilter === 'pinturas'
                    ? 'bg-teal-700 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-teal-50 hover:text-teal-900'
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>Pinturas con Colores ({totalPinturasCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setInvTypeFilter('materiales')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  invTypeFilter === 'materiales'
                    ? 'bg-amber-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-amber-50 hover:text-amber-900'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Materiales por Unidad ({totalMaterialesCount})</span>
              </button>
            </div>

            {/* Filtros de Búsqueda y Bodega */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, SKU o categoría..."
                    value={invSearch}
                    onChange={(e) => setInvSearch(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>

                <select
                  value={invWarehouseFilter}
                  onChange={(e) => setInvWarehouseFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  <option value="todos">Todos los CEDIs</option>
                  <option value="Medellín">Medellín (Rionegro)</option>
                  <option value="Bogotá D.C.">Bogotá D.C. (Siberia)</option>
                  <option value="Cali">Cali (Acopi Yumbo)</option>
                  <option value="Barranquilla">Barranquilla (Galapa)</option>
                  <option value="Bucaramanga">Bucaramanga (Girón)</option>
                </select>

                <select
                  value={invStatusFilter}
                  onChange={(e) => setInvStatusFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="optimo">Óptimo</option>
                  <option value="critico">Crítico / Stock Bajo</option>
                  <option value="agotado">Agotado (0 Stock)</option>
                </select>
              </div>

              <span className="text-xs font-mono text-slate-500">
                Mostrando {filteredInventory.length} de {inventoryList.length} artículos
              </span>
            </div>

            {/* Tabla Detallada con separación clara Pintura vs Materiales */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-mono text-[11px]">
                    <th className="p-3">SKU / PRODUCTO & TIPO</th>
                    <th className="p-3">CEDI / BODEGA</th>
                    <th className="p-3">EXISTENCIAS / STOCK</th>
                    <th className="p-3">ESPECIFICACIONES / COLORES</th>
                    <th className="p-3">PRECIO & LOTE</th>
                    <th className="p-3 text-center">ESTADO</th>
                    <th className="p-3 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredInventory.map((item) => {
                    const isPaint = isPaintProduct(item);

                    const getStatusBadge = () => {
                      if (item.status === 'optimo') {
                        return <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">Óptimo</span>;
                      }
                      if (item.status === 'critico') {
                        return <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-bold">Stock Bajo</span>;
                      }
                      return <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-red-50 text-red-700 border border-red-200 font-bold">Agotado (0)</span>;
                    };

                    const colorsToShow = item.availableColors && item.availableColors.length > 0
                      ? item.availableColors
                      : DEFAULT_PAINT_COLORS;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs group/img">
                              <img
                                src={getProductImage(item)}
                                alt={item.productName}
                                className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                                loading="lazy"
                              />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 text-xs">{item.productName}</span>
                                {isPaint ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold shrink-0">
                                    <Paintbrush className="w-2.5 h-2.5" /> PINTURA
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold shrink-0">
                                    <Wrench className="w-2.5 h-2.5" /> MATERIAL / UNIDAD
                                  </span>
                                )}
                              </div>
                              <p className="font-mono text-[10px] text-slate-500">
                                SKU: <strong className="text-slate-700">{item.sku}</strong> · Línea: {item.category}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <p className="font-semibold text-slate-800">{item.warehouseName}</p>
                          <span className="text-[10px] text-slate-500 font-mono">{item.warehouseCity}</span>
                        </td>

                        {/* EXISTENCIAS / STOCK ADAPTATIVO */}
                        <td className="p-3">
                          {isPaint ? (
                            <div className="space-y-0.5 font-mono text-xs">
                              <p className="font-bold text-amber-900">
                                {item.cuñetesAvailable} Cuñetes <span className="text-[10px] font-normal text-slate-500">(5 Gal)</span>
                              </p>
                              <p className="text-slate-700 text-[11px]">
                                {item.galonesAvailable} Galones · ~{((item.totalLiters || 0)).toLocaleString()} L
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 font-mono font-bold text-teal-900 text-xs shadow-2xs">
                                {(item.unitsAvailable ?? item.galonesAvailable ?? 0)} {item.unitMeasure || 'Unidades / Piezas'}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                Venta directa por unidad
                              </span>
                            </div>
                          )}
                        </td>

                        {/* ESPECIFICACIONES / COLORES */}
                        <td className="p-3">
                          {isPaint ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 flex-wrap max-w-[170px]">
                                {colorsToShow.slice(0, 5).map((c, idx) => (
                                  <span
                                    key={idx}
                                    className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs inline-block shrink-0"
                                    style={{ backgroundColor: c.hex }}
                                    title={`${c.name} (${c.hex})`}
                                  />
                                ))}
                                {colorsToShow.length > 5 && (
                                  <span className="text-[10px] font-mono text-teal-800 font-bold bg-teal-50 px-1 rounded">
                                    +{colorsToShow.length - 5}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 block">
                                {colorsToShow.length} colores · Acabado {item.finish || 'Mate'}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-medium text-slate-600 italic flex items-center gap-1">
                                <Ban className="w-3 h-3 text-slate-400" />
                                Sin carta de color
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Presentación: {item.unitMeasure || 'Unidad'}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* PRECIO & LOTE */}
                        <td className="p-3 font-mono text-[11px]">
                          {isPaint ? (
                            <div>
                              <p className="text-navy-900 font-bold">
                                ${(item.pricePerGalon || 110000).toLocaleString('es-CO')}
                                <span className="text-[10px] text-slate-500 font-normal"> / Gal</span>
                              </p>
                              <span className="text-slate-400 text-[10px] block">{item.batchCode}</span>
                            </div>
                          ) : (
                            <div>
                              <p className="text-navy-900 font-bold">
                                ${((item.unitPrice || item.pricePerGalon || 28000)).toLocaleString('es-CO')}
                                <span className="text-[10px] text-slate-500 font-normal"> / Ud</span>
                              </p>
                              <span className="text-slate-400 text-[10px] block">{item.batchCode}</span>
                            </div>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          {getStatusBadge()}
                        </td>

                        {/* ACCIONES ESTILIZADAS: BOTÓN DE ENTRADA DESPLEGABLE + EDITAR + MICROACCIONES */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* BOTÓN PRINCIPAL ESTILIZADO: + ENTRADA DE STOCK */}
                            <button
                              type="button"
                              onClick={() => {
                                setStockEntryProduct(item);
                                setEntryQty(isPaint ? 50 : 25);
                                setEntryUnit('cuñetes');
                                setEntryRemission('');
                              }}
                              title={`Registrar entrada o llegada de mercancía a bodega para ${item.productName}`}
                              className="px-2.5 py-1.5 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-lg transition-all flex items-center gap-1.5 shadow-xs hover:shadow cursor-pointer active:scale-95 border border-teal-800"
                            >
                              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                              <span>+ Entrada</span>
                            </button>

                            {/* BOTÓN SECUNDARIO: EDITAR CATÁLOGO & PRODUCTO */}
                            <button
                              type="button"
                              onClick={() => setEditingProduct({ ...item })}
                              title="Editar especificaciones técnicas, precio, SKU y detalles"
                              className="px-2 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer hover:border-slate-400"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Editar</span>
                            </button>

                            {/* ACCIÓN RÁPIDA: AGOTAR STOCK */}
                            <button
                              type="button"
                              onClick={() => handleEmptyStock(item.id)}
                              title="Vaciar stock (0) para probar bloqueo comercial a clientes"
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-amber-200"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>

                            {/* ACCIÓN RÁPIDA: ELIMINAR */}
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(item.id)}
                              title="Eliminar producto del inventario"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA: GESTIÓN DE CLIENTES & ACCESOS (POSTGRESQL public.clientes & public.usuarios) */}
      {adminTab === 'clientes' && (
        <div className="space-y-5" id="clients-view-root">
          {/* Métricas de Clientes */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono mb-1">
                <Building className="w-4 h-4 text-blue-600" />
                <span>CLIENTES REGISTRADOS</span>
              </div>
              <p className="text-2xl font-bold text-navy-900 font-mono">{clientsList.length} Clientes</p>
              <p className="text-[11px] text-slate-500 mt-1">Constructoras, contratistas y propietarios</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono mb-1">
                <Database className="w-4 h-4 text-teal-600" />
                <span>GUARDADOS EN SUPABASE</span>
              </div>
              <p className="text-2xl font-bold text-teal-700 font-mono">
                {clientsList.filter((c) => c.syncedToSupabase).length} de {clientsList.length}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">En tablas public.clientes y public.usuarios</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono mb-1">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>PEDIDOS ASOCIADOS</span>
              </div>
              <p className="text-2xl font-bold text-purple-900 font-mono">{requests.length} Órdenes</p>
              <p className="text-[11px] text-slate-500 mt-1">En trazabilidad y entregas Pintuco</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>ACCESO A MÓDULOS</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700 font-mono">6 Módulos</p>
              <p className="text-[11px] text-slate-500 mt-1">Cotización, Catálogo, Calculadora, IA, Rastreo, DIAN</p>
            </div>
          </div>

          {/* Tabla de Clientes con Filtros */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 font-bold">
                    DIRECTORIO OFICIAL PINTUCO
                  </span>
                  <span className="text-xs text-slate-500">· Tablas clientes & usuarios de PostgreSQL</span>
                </div>
                <h3 className="text-base font-bold font-['Space_Grotesk'] text-navy-900 mt-1 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Directorio de Clientes, Permisos & Persistencia Supabase Cloud
                </h3>
                <p className="text-xs text-slate-500">
                  Crea clientes nuevos o visualiza a qué módulos tiene acceso cada cliente en el portal ColorLink. Todos los datos se sincronizan con Supabase Cloud.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddClientModalOpen(true)}
                  className="btn-primary text-xs !py-2 !px-4 flex items-center gap-1.5 shadow-xs bg-blue-700 hover:bg-blue-800"
                >
                  <PlusCircle className="w-4 h-4" />
                  + Crear Nuevo Cliente
                </button>
              </div>
            </div>

            {/* Barra de Búsqueda */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre, NIT, email o ciudad..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <span className="text-xs font-mono text-slate-500">
                Mostrando {clientsList.filter((c) =>
                  !clientSearch ||
                  c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                  c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                  c.identification?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                  c.company?.toLowerCase().includes(clientSearch.toLowerCase())
                ).length} de {clientsList.length} clientes
              </span>
            </div>

            {/* Tabla de Clientes */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-mono text-[11px]">
                    <th className="p-3">CLIENTE / EMPRESA</th>
                    <th className="p-3">NIT / DOCUMENTO</th>
                    <th className="p-3">CONTACTO (EMAIL & TEL)</th>
                    <th className="p-3">SEDE & DIRECCIÓN</th>
                    <th className="p-3 text-center">PERSISTENCIA SUPABASE</th>
                    <th className="p-3">A QUÉ TIENE ACCESO</th>
                    <th className="p-3 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientsList
                    .filter((c) =>
                      !clientSearch ||
                      c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                      c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                      c.identification?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                      c.company?.toLowerCase().includes(clientSearch.toLowerCase())
                    )
                    .map((cli) => {
                      const isSyncingThis = isSyncingClientMap[cli.id] || false;
                      return (
                        <tr key={cli.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-navy-900 text-xs">{cli.name}</div>
                            <div className="text-[11px] text-slate-500">{cli.company || 'Particular'}</div>
                          </td>

                          <td className="p-3 font-mono font-medium text-slate-700">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                              {cli.identification || 'N/A'}
                            </span>
                          </td>

                          <td className="p-3">
                            <div className="text-slate-800 font-medium flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[160px]">{cli.email}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{cli.phone}</span>
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="text-slate-800 font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{cli.city || 'Medellín'}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                              {cli.address || 'Colombia'}
                            </div>
                          </td>

                          <td className="p-3 text-center">
                            {cli.syncedToSupabase ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Supabase Cloud
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSyncSingleClient(cli)}
                                disabled={isSyncingThis}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
                              >
                                <RefreshCw className={`w-3 h-3 ${isSyncingThis ? 'animate-spin' : ''}`} />
                                {isSyncingThis ? 'Sincronizando...' : 'Enviar a Supabase'}
                              </button>
                            )}
                          </td>

                          <td className="p-3">
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                                🎨 Cotizaciones
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                📦 Catálogo CEDI
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                🧮 Calculadora
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                                🤖 Asesor IA
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                🚚 Trazabilidad
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                                📄 Factura & Garantía
                              </span>
                            </div>
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingClient({
                                    id: cli.id,
                                    name: cli.name || '',
                                    identification: cli.identification || '',
                                    originalIdentification: cli.identification || '',
                                    email: cli.email || '',
                                    originalEmail: cli.email || '',
                                    phone: cli.phone || '',
                                    company: cli.company || '',
                                    city: cli.city || 'Medellín',
                                    address: cli.address || '',
                                    password: cli.password || 'cliente123',
                                  });
                                  setIsEditClientModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-[11px] inline-flex items-center gap-1 border border-blue-200 transition-colors cursor-pointer"
                                title="Editar datos del cliente"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={onCreateNewRequest}
                                className="px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-medium text-[11px] inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              >
                                <PlusCircle className="w-3 h-3" />
                                <span>Crear Pedido</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Banner explicativo del mapeo con el ERD de Supabase */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-navy-900">
                <Database className="w-4 h-4 text-teal-700" />
                <span>Mapeo Relacional de Clientes en Supabase (PostgreSQL)</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Cada cliente se almacena como una tupla única en la tabla <code>public.clientes</code> con su documento de identidad (NIT o Cédula), y en la tabla <code>public.usuarios</code> con el rol <code>'cliente'</code> y estado <code>'activo'</code>, habilitando de inmediato su ingreso al portal de cotización, catálogo de inventario en CEDIs, trazabilidad en vivo de camiones y descarga de facturas DIAN.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA: GESTIÓN DE PERSONAL OPERATIVO (CONDUCTORES Y EMPACADORES) */}
      {adminTab === 'operarios' && (
        <div className="space-y-5" id="staff-view-root">
          {/* Métricas de Personal Operativo */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono mb-1">
                <UserCheck className="w-4 h-4 text-teal-600" />
                <span>TOTAL PERSONAL OPERATIVO</span>
              </div>
              <p className="text-2xl font-bold text-navy-900 font-mono">{staffList.length} Operarios</p>
              <p className="text-[11px] text-slate-500 mt-1">Conductores de flota y empacadores CEDI</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono mb-1">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>CONDUCTORES ACTIVOS</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700 font-mono">
                {staffList.filter((s) => s.role === 'conductor').length} Conductores
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Con camiones y placas asignadas en ruta</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono mb-1">
                <Boxes className="w-4 h-4 text-amber-600" />
                <span>EMPACADORES CEDI</span>
              </div>
              <p className="text-2xl font-bold text-amber-800 font-mono">
                {staffList.filter((s) => s.role === 'empacador').length} Empacadores
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Alistamiento en muelles de despacho</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono mb-1">
                <Warehouse className="w-4 h-4 text-blue-600" />
                <span>SEDES CEDI ACTIVAS</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 font-mono">5 Centros</p>
              <p className="text-[11px] text-slate-500 mt-1">Medellín, Bogotá, Cali, Barranquilla, B/manga</p>
            </div>
          </div>

          {/* Panel Principal de Personal */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                    PLANTILLA DE PERSONAL & NÓMINA OPERATIVA
                  </span>
                  <span className="text-xs text-slate-500">· Red Logística Nacional Pintuco</span>
                </div>
                <h3 className="text-base font-bold font-['Space_Grotesk'] text-navy-900 mt-1 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-teal-600" />
                  Gestión de Operarios: Conductores de Flota & Empacadores de Planta
                </h3>
                <p className="text-xs text-slate-500">
                  Como administrador puedes registrar nuevos operarios a los roles de Conductor o Empacador, asignar sus vehículos, turnos y credenciales de acceso para la aplicación móvil y de escritorio.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(true)}
                  className="btn-primary text-xs !py-2.5 !px-4 flex items-center gap-1.5 shadow-xs bg-teal-700 hover:bg-teal-800 cursor-pointer"
                  id="btn-admin-add-staff"
                >
                  <PlusCircle className="w-4 h-4" />
                  + Registrar Conductor / Empacador
                </button>
              </div>
            </div>

            {/* Barra de Filtros & Búsqueda */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStaffRoleFilter('todos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    staffRoleFilter === 'todos'
                      ? 'bg-navy-900 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Todos los Operarios ({staffList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffRoleFilter('conductor')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    staffRoleFilter === 'conductor'
                      ? 'bg-emerald-700 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  Conductores ({staffList.filter((s) => s.role === 'conductor').length})
                </button>
                <button
                  type="button"
                  onClick={() => setStaffRoleFilter('empacador')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    staffRoleFilter === 'empacador'
                      ? 'bg-amber-700 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  Empacadores ({staffList.filter((s) => s.role === 'empacador').length})
                </button>
              </div>

              <div className="relative w-full max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, placa, carnet, cédula..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Listado / Tabla de Operarios */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3">Operario / Identificación</th>
                    <th className="p-3">Rol & Cargo</th>
                    <th className="p-3">Asignación Operativa (Vehículo / Turno)</th>
                    <th className="p-3">Sede CEDI</th>
                    <th className="p-3">Contacto & Acceso</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffList
                    .filter((staff) => {
                      if (staffRoleFilter !== 'todos' && staff.role !== staffRoleFilter) return false;
                      if (!staffSearch.trim()) return true;
                      const q = staffSearch.toLowerCase();
                      return (
                        staff.name.toLowerCase().includes(q) ||
                        staff.document.toLowerCase().includes(q) ||
                        staff.email.toLowerCase().includes(q) ||
                        staff.badgeNumber.toLowerCase().includes(q) ||
                        (staff.vehiclePlate && staff.vehiclePlate.toLowerCase().includes(q)) ||
                        staff.cediCity.toLowerCase().includes(q)
                      );
                    })
                    .map((staff) => {
                      const isConductor = staff.role === 'conductor';
                      return (
                        <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                                  isConductor
                                    ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                                    : 'bg-amber-100 border-amber-300 text-amber-900'
                                }`}
                              >
                                {isConductor ? '🚚' : '📦'}
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-900 text-xs">{staff.name}</p>
                                <p className="font-mono text-[10px] text-slate-500">
                                  C.C. {staff.document} · Carnet: <strong className="text-slate-700">{staff.badgeNumber}</strong>
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            {isConductor ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                <Truck className="w-3 h-3 text-emerald-700" />
                                CONDUCTOR
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                                <Boxes className="w-3 h-3 text-amber-700" />
                                EMPACADOR
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            {isConductor ? (
                              <div className="space-y-0.5">
                                <p className="font-mono font-bold text-teal-900 text-xs">
                                  Placa: {staff.vehiclePlate || 'WTL-582'}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  {staff.vehicleType || 'Camión NHR 3.5 Ton'} · Licencia {staff.licenseCategory || 'C2'}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <p className="font-mono font-bold text-amber-900 text-xs">
                                  {staff.shift || 'Turno Mañana (06:00 - 14:00)'}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  Estación de pesaje y sellado precinto
                                </p>
                              </div>
                            )}
                          </td>

                          <td className="p-3">
                            <p className="font-semibold text-slate-800 text-xs">{staff.cediCity}</p>
                            <span className="text-[10px] text-slate-500 font-mono">{staff.cediName}</span>
                          </td>

                          <td className="p-3">
                            <div className="space-y-1">
                              <p className="text-slate-700 font-mono text-[11px] flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {staff.email}
                              </p>
                              <a
                                href={`tel:${staff.phone}`}
                                className="text-teal-700 hover:text-teal-900 font-mono text-[11px] flex items-center gap-1 hover:underline"
                              >
                                <Phone className="w-3 h-3 text-teal-600" />
                                {staff.phone}
                              </a>
                            </div>
                          </td>

                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Activo en Servicio
                            </span>
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStaff({
                                    ...staff,
                                    password: staff.password || 'pintuco2026',
                                  });
                                  setIsEditStaffModalOpen(true);
                                }}
                                className="px-2 py-1 text-[11px] rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold cursor-pointer border border-blue-200 inline-flex items-center gap-1"
                                title={`Editar datos de ${isConductor ? 'Conductor' : 'Empacador'}`}
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(`Email: ${staff.email} | Clave: ${staff.password || 'pintuco2026'}`);
                                  setToast({ type: 'success', text: `Credenciales de ${staff.name} copiadas al portapapeles.` });
                                }}
                                className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                                title="Copiar usuario y contraseña"
                              >
                                Copiar Acceso
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStaff(staff.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Retirar operario"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Nota Informativa sobre Perfiles y Roles */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-navy-900">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>Interconexión de Roles con el Ecosistema ColorLink Pintuco</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Al registrar un <strong>Conductor</strong> o <strong>Empacador</strong>, el usuario queda automáticamente facultado para iniciar sesión en el portal desde la pantalla de Login con su correo institucional y la clave establecida. Los empacadores acceden directamente al módulo de verificación de empaque y báscula CEDI, mientras que los conductores visualizan su hoja de ruta con GPS, chat con clientes y firma digital de entrega en obra.
              </p>
            </div>
          </div>
        </div>
      )}
      {adminTab === 'supabase' && (
        <div className="space-y-5" id="supabase-architecture-root">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-300 font-bold">
                    POSTGRESQL & SUPABASE CLOUD
                  </span>
                  <span className="text-xs text-slate-500">· 12 Entidades Relacionales</span>
                </div>
                <h3 className="text-xl font-bold font-['Space_Grotesk'] text-navy-900 mt-1">
                  Esquema Relacional ERD & Conexión Activa de Persistencia
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Estructurado según el diagrama relacional exacto (Usuario, Canal, Cliente, Proyecto, Solicitud, Material, Inventario, Pedido, Cotización, Factura, Entrega, Control de Calidad).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncAllOrders}
                  disabled={isSyncingAll}
                  className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>{isSyncingAll ? 'Sincronizando...' : 'Guardar y Sincronizar Todo'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4 text-teal-300" />
                      <span>¡SQL Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Script SQL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sub-navegación dentro de Supabase */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setSupabaseSubTab('erd')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  supabaseSubTab === 'erd'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                📊 Diagrama ERD (12 Tablas)
              </button>

              <button
                type="button"
                onClick={() => setSupabaseSubTab('tablas')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  supabaseSubTab === 'tablas'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🔍 Explorador de Registros
              </button>

              <button
                type="button"
                onClick={() => setSupabaseSubTab('config')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  supabaseSubTab === 'config'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ⚙️ Configuración & Conexión
              </button>

              <button
                type="button"
                onClick={() => setSupabaseSubTab('sql')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  supabaseSubTab === 'sql'
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                📜 Script SQL PostgreSQL
              </button>

              <button
                type="button"
                onClick={() => setSupabaseSubTab('rls')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  supabaseSubTab === 'rls'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                🛡️ Desbloquear RLS (Error 42501)
              </button>
            </div>

            {/* SUB-VISTA 1: DIAGRAMA ERD VISUAL (12 TABLAS) */}
            {supabaseSubTab === 'erd' && (
              <div className="space-y-4">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-teal-700" />
                    <span>
                      Arquitectura normalizada conforme al diagrama de entidades de la base de datos Pintuco.
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[11px]">12 Entidades Relacionadas</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {ERD_TABLES_INFO.map((tbl) => (
                    <div
                      key={tbl.id}
                      onClick={() => {
                        setSelectedErdTable(tbl.id);
                        setSupabaseSubTab('tablas');
                      }}
                      className="p-3.5 bg-slate-50 hover:bg-white hover:border-teal-500 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{tbl.icon}</span>
                          <h4 className="font-bold text-xs text-navy-900 font-mono group-hover:text-teal-700">
                            {tbl.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono font-semibold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                          PK: {tbl.pk}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 mb-2 line-clamp-2">
                        {tbl.desc}
                      </p>

                      <div className="border-t border-slate-200 pt-2 space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Columnas:</span>
                        <div className="flex flex-wrap gap-1">
                          {tbl.cols.slice(0, 4).map((c, i) => (
                            <span key={i} className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                              {c}
                            </span>
                          ))}
                          {tbl.cols.length > 4 && (
                            <span className="text-[10px] font-mono text-teal-700 font-bold self-center">
                              +{tbl.cols.length - 4} más
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-VISTA 2: EXPLORADOR DE REGISTROS DE LAS 12 TABLAS */}
            {supabaseSubTab === 'tablas' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700">Tabla a consultar:</label>
                    <select
                      value={selectedErdTable}
                      onChange={(e) => handleLoadTableData(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-bold text-navy-900"
                    >
                      {ERD_TABLES_INFO.map((tbl) => (
                        <option key={tbl.id} value={tbl.id}>
                          {tbl.icon} {tbl.name} ({tbl.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLoadTableData(selectedErdTable)}
                    disabled={isLoadingTable}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTable ? 'animate-spin' : ''}`} />
                    <span>Recargar Tabla</span>
                  </button>
                </div>

                {/* Tabla de registros */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-navy-900 uppercase">
                      Tabla: public.{selectedErdTable} ({tableQueryData.length} registros cargados)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {supabaseConfig.connected ? '🟢 Datos sincronizados con Supabase Cloud' : '🟠 Datos de persistencia local'}
                    </span>
                  </div>

                  {tableQueryData.length > 0 ? (
                    <div className="overflow-x-auto max-h-[380px]">
                      <table className="w-full text-left text-xs border-collapse font-mono">
                        <thead className="bg-slate-200 text-slate-700 sticky top-0">
                          <tr>
                            {Object.keys(tableQueryData[0]).map((key) => (
                              <th key={key} className="p-2.5 border-b border-slate-300 font-bold whitespace-nowrap">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {tableQueryData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-teal-50/50 transition-colors">
                              {Object.values(row).map((val: any, cIdx) => (
                                <td key={cIdx} className="p-2.5 text-[11px] text-slate-800 whitespace-nowrap">
                                  {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No hay registros disponibles en esta tabla.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-VISTA 3: CONFIGURACIÓN Y CONEXIÓN EN TIEMPO REAL */}
            {supabaseSubTab === 'config' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold font-mono text-navy-900 uppercase">
                      Credenciales de Conexión Supabase Cloud
                    </h4>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTestingConn}
                      className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTestingConn ? 'animate-spin' : ''}`} />
                      <span>{isTestingConn ? 'Probando...' : 'Probar Conexión en Vivo'}</span>
                    </button>
                  </div>

                  {connTestResult && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                        connTestResult.success
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-red-50 border-red-300 text-red-900'
                      }`}
                    >
                      {connTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                      <span>{connTestResult.message}</span>
                    </div>
                  )}

                  {connTestResult?.isRlsError && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-xs text-amber-900">
                            Bloqueo RLS (Código 42501) en Supabase
                          </p>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            La base de datos responde pero las políticas de seguridad impiden guardar. Ejecuta el script de desbloqueo en tu SQL Editor para resolverlo en 10 segundos.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCopyRlsFixSql}
                          className="btn-primary !py-1.5 !px-3 !text-[11px] bg-amber-600 hover:bg-amber-700"
                        >
                          {copiedRlsFix ? '✓ ¡Script Copiado!' : 'Copiar Script Desbloqueo RLS'}
                        </button>
                        <a
                          href="https://supabase.com/dashboard/project/pxtskluzbcxydzqaigke/sql/new"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary !py-1.5 !px-3 !text-[11px] text-teal-800 flex items-center gap-1"
                        >
                          <span>Abrir Supabase SQL Editor</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSaveSupabaseConfig} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Supabase Project URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://xyzcompany.supabase.co"
                        value={supabaseConfig.url}
                        onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Supabase Anon / Public Key
                        </label>
                        <button
                          type="button"
                          onClick={() => setSupabaseConfig({ ...supabaseConfig, anonKey: DEFAULT_SUPABASE_KEY })}
                          className="text-[10px] text-teal-700 hover:underline font-mono"
                        >
                          Usar API Key del Proyecto
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="sb_publishable_... o eyJhbGci..."
                        value={supabaseConfig.anonKey}
                        onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-between items-center pt-2">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {supabaseConfig.lastSync ? `Última sincronización: ${supabaseConfig.lastSync}` : 'Sin sincronizaciones previas'}
                      </span>
                      <button
                        type="submit"
                        className="btn-primary !py-2 !px-4 !text-xs !w-auto"
                      >
                        Guardar y Conectar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* SUB-VISTA 4: SCRIPT SQL POSTGRESQL */}
            {supabaseSubTab === 'sql' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-600">
                  <span>Archivo SQL: <code className="text-teal-800 font-bold">src/supabase_schema.sql</code></span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="text-teal-700 font-bold hover:underline"
                  >
                    {copiedSql ? '✓ ¡Copiado!' : 'Copiar todo el código'}
                  </button>
                </div>
                <div className="bg-slate-950 text-teal-300 font-mono text-[11px] p-4 rounded-xl max-h-[420px] overflow-y-auto border border-slate-800 leading-relaxed">
                  <pre>{SUPABASE_SQL_SCHEMA}</pre>
                </div>
              </div>
            )}

            {/* SUB-VISTA 5: SCRIPT DE DESBLOQUEO RLS (ERROR 42501) */}
            {supabaseSubTab === 'rls' && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold font-mono text-amber-950 uppercase flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Desbloqueo de Escritura en Supabase (Error RLS 42501)
                      </h4>
                      <p className="text-xs text-amber-800 mt-1">
                        Si las órdenes o clientes no se guardan en la nube, es porque PostgreSQL tiene Row Level Security activado. Ejecuta este script para deshabilitar RLS y otorgar permisos completos a la clave anónima.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyRlsFixSql}
                        className="btn-primary !py-1.5 !px-3 !text-xs bg-amber-600 hover:bg-amber-700"
                      >
                        {copiedRlsFix ? '✓ ¡Copiado!' : 'Copiar Script RLS'}
                      </button>
                      <a
                        href="https://supabase.com/dashboard/project/pxtskluzbcxydzqaigke/sql/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary !py-1.5 !px-3 !text-xs text-teal-800 flex items-center gap-1"
                      >
                        <span>Abrir SQL Editor</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-amber-200 text-xs text-slate-700">
                    <p className="font-bold text-slate-800 mb-1">Instrucciones (10 segundos):</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                      <li>Haz clic en <strong>Copiar Script RLS</strong>.</li>
                      <li>Haz clic en <strong>Abrir SQL Editor</strong> para ir directamente al editor de tu proyecto.</li>
                      <li>Pega el código en la pantalla y haz clic en el botón verde <strong>Run (▶)</strong>.</li>
                      <li>¡Listo! El guardado de órdenes y clientes en la nube quedará 100% habilitado.</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-slate-950 text-amber-300 font-mono text-[11px] p-4 rounded-xl max-h-[350px] overflow-y-auto border border-slate-800 leading-relaxed select-all">
                  <pre>{SUPABASE_RLS_FIX_SQL}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL MAESTRO: AGREGADOR DE PRODUCTOS AL INVENTARIO CEDI (ADMINISTRADOR)
          Soporte Separado: 🎨 Pinturas (con Colores & Empaques) vs 🛠️ Materiales (Venta x Unidad)
          ========================================================================= */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            {/* Encabezado del Modal */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-navy-900 via-slate-900 to-teal-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-teal-300 bg-white/10 px-2.5 py-0.5 rounded-full font-bold">
                    PORTAL ADMINISTRATIVO · INVENTARIO MAESTRO
                  </span>
                  <span className="text-[11px] text-slate-300 font-mono">CEDI Oficial Pintuco</span>
                </div>
                <h3 className="text-lg font-bold font-['Space_Grotesk'] text-white flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-amber-400" />
                  Agregador de Productos & Artículos al Inventario
                </h3>
                <p className="text-xs text-slate-300">
                  Configure existencias para la red nacional de distribución y habilite compras directas para clientes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold transition-colors cursor-pointer shrink-0"
                title="Cerrar ventana"
              >
                ✕
              </button>
            </div>

            {/* Selector de Tipo de Producto: Pintura vs Material / Insumo */}
            <div className="p-4 bg-slate-100/90 border-b border-slate-200">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 font-bold mb-2">
                1. Selecciona el Tipo de Producto a Crear:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setProductTypeMode('pintura')}
                  className={`p-3 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                    productTypeMode === 'pintura'
                      ? 'border-teal-600 bg-white shadow-xs ring-1 ring-teal-500'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 text-slate-600'
                  }`}
                  id="tab-create-paint"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    productTypeMode === 'pintura' ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <Paintbrush className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-navy-900 text-xs">Pintura & Recubrimiento</p>
                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                      Con carta de colores, acabado, cubicaje por m² y stock en Cuñetes (5G) / Galones.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProductTypeMode('material')}
                  className={`p-3 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                    productTypeMode === 'material'
                      ? 'border-amber-600 bg-white shadow-xs ring-1 ring-amber-500'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 text-slate-600'
                  }`}
                  id="tab-create-material"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    productTypeMode === 'material' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-navy-900 text-xs">Materiales & Herramientas</p>
                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                      Venta por unidad / pieza. <strong>Sin selección de color</strong>, con conteo unitario en bodega.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Formulario Dinámico */}
            <form onSubmit={handleCreateNewProduct} className="p-5 sm:p-6 space-y-4 text-xs max-h-[68vh] overflow-y-auto">
              {/* Notificación Contextual según Modo */}
              {productTypeMode === 'pintura' ? (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-950 flex items-start gap-2.5">
                  <Palette className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-teal-900 text-xs">
                      Configuración Oficial de Pintura Pintuco
                    </p>
                    <p className="text-[11px] text-teal-800 leading-relaxed mt-0.5">
                      Como administrador puedes asignar y personalizar la carta de colores que verán los clientes al momento de formular su proyecto de pintura.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 flex items-start gap-2.5">
                  <Boxes className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 text-xs">
                      Artículo Ferretero: Venta Exclusiva por Unidad (Sin Colores)
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                      Los materiales (rodillos, brochas, cintas, bandejas, espátulas) se venden y descuentan por unidad o pieza física. Los clientes solo eligen la cantidad que necesitan.
                    </p>
                  </div>
                </div>
              )}

              {/* DATOS GENERALES DEL ARTÍCULO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    {productTypeMode === 'pintura' ? 'Nombre Comercial de la Pintura *' : 'Nombre del Material / Herramienta *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      productTypeMode === 'pintura'
                        ? 'Ej: Viniltex® Advanced Blanco Nieve o Koraza® Fachadas'
                        : 'Ej: Rodillo Pintuco Profesional 9" o Brocha Cerda Azul 2 1/2"'
                    }
                    value={newProductForm.productName}
                    onChange={(e) => setNewProductForm({ ...newProductForm, productName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">
                      Código SKU / Referencia *
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateSku}
                      className="text-[10px] text-teal-800 hover:text-teal-950 font-bold underline cursor-pointer"
                    >
                      ⚡ Generar SKU
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={productTypeMode === 'pintura' ? 'PTC-PNT-ARQ-101' : 'PTC-MAT-HER-205'}
                    value={newProductForm.sku}
                    onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-teal-500 focus:outline-hidden uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Línea / Categoría del Producto
                  </label>
                  {productTypeMode === 'pintura' ? (
                    <select
                      value={newProductForm.category}
                      onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                    >
                      <option value="Arquitectónica">Arquitectónica (Interiores / Muros)</option>
                      <option value="Fachadas">Fachadas & Intemperie (Koraza)</option>
                      <option value="Industrial">Industrial & Epóxica (Pintucoat / Mastic)</option>
                      <option value="Metales">Metales & Esmaltes (Pintulux 3 en 1)</option>
                      <option value="Madera">Maderas & Barnices (Maderprotect)</option>
                      <option value="Impermeabilizantes">Impermeabilizantes & Salitre (Sellomax)</option>
                    </select>
                  ) : (
                    <select
                      value={newProductForm.materialCategory}
                      onChange={(e) => setNewProductForm({ ...newProductForm, materialCategory: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    >
                      <option value="Herramientas y Aplicación">Herramientas & Rodillos</option>
                      <option value="Brochas y Pinceles">Brochas & Pinceles</option>
                      <option value="Insumos y Protección">Insumos & Cintas de Enmascarar</option>
                      <option value="Abrasivos y Lijas">Abrasivos & Lijas</option>
                      <option value="Preparación de Superficie">Preparación de Superficie & Espátulas</option>
                      <option value="Bandejas y Mezcladores">Bandejas, Baldes & Mezcladores</option>
                      <option value="Solventes y Limpieza">Solventes, Thinner & Limpieza</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    CEDI / Ciudad de Bodega
                  </label>
                  <select
                    value={newProductForm.warehouseCity}
                    onChange={(e) => {
                      const city = e.target.value;
                      let whName = 'CEDI Principal Rionegro';
                      if (city === 'Bogotá D.C.') whName = 'CEDI Siberia Muelle 4';
                      if (city === 'Cali') whName = 'CEDI Acopi Yumbo';
                      if (city === 'Barranquilla') whName = 'CEDI Galapa';
                      if (city === 'Bucaramanga') whName = 'CEDI Girón';
                      setNewProductForm({ ...newProductForm, warehouseCity: city, warehouseName: whName });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="Medellín">Medellín (CEDI Rionegro)</option>
                    <option value="Bogotá D.C.">Bogotá D.C. (CEDI Siberia)</option>
                    <option value="Cali">Cali (CEDI Acopi Yumbo)</option>
                    <option value="Barranquilla">Barranquilla (CEDI Galapa)</option>
                    <option value="Bucaramanga">Bucaramanga (CEDI Girón)</option>
                  </select>
                </div>

                {productTypeMode === 'pintura' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Superficie Recomendada
                    </label>
                    <select
                      value={newProductForm.surfaceType}
                      onChange={(e) => setNewProductForm({ ...newProductForm, surfaceType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                    >
                      <option value="concreto">Concreto / Mampostería</option>
                      <option value="estuco">Estuco Tradicional / Yeso</option>
                      <option value="drywall">Drywall / Yeso Cartón</option>
                      <option value="ladrillo">Ladrillo a la Vista / Fachada</option>
                      <option value="madera">Madera / Carpintería</option>
                      <option value="metal">Metal / Estructura Metálica</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Unidad de Venta / Empaque
                    </label>
                    <select
                      value={newProductForm.unitMeasure}
                      onChange={(e) => setNewProductForm({ ...newProductForm, unitMeasure: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    >
                      <option value="Unidad / Pieza">Unidad / Pieza</option>
                      <option value="Rollo">Rollo</option>
                      <option value="Kit Completo">Kit Completo</option>
                      <option value="Caja x 12">Caja x 12</option>
                      <option value="Pliego">Pliego</option>
                    </select>
                  </div>
                )}
              </div>

              {/* ==========================================================
                  MODO A: GESTIÓN DE COLORES & EMPAQUES EXCLUSIVOS DE PINTURAS
                  ========================================================== */}
              {productTypeMode === 'pintura' && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  {/* SECCIÓN DE COLORES ADMINISTRADA POR EL ADMIN */}
                  <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-teal-700" />
                        <h4 className="font-bold text-navy-900 text-xs">
                          Carta de Colores Disponibles para esta Pintura
                        </h4>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200">
                        {paintColors.length} Colores Habilitados
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Los clientes podrán escoger cualquiera de estos colores al seleccionar esta pintura en su pedido.
                    </p>

                    {/* Chips de colores actuales */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {paintColors.map((color, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="font-medium text-slate-800 text-[11px]">{color.name}</span>
                          <span className="text-[9px] font-mono text-slate-400">({color.hex})</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(idx)}
                            className="text-slate-400 hover:text-red-600 font-bold ml-1 transition-colors cursor-pointer text-xs"
                            title="Quitar este color de la pintura"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Tonos Rápidos Oficiales Pintuco */}
                    <div className="pt-2 border-t border-slate-200/80">
                      <label className="block text-[10px] font-mono uppercase text-slate-500 font-bold mb-1.5">
                        Añadir tonos predefinidos del catálogo Pintuco:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_QUICK_COLORS.map((preset) => {
                          const isAlreadyAdded = paintColors.some(
                            (c) => c.name.toLowerCase() === preset.name.toLowerCase()
                          );
                          return (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => handleTogglePresetColor(preset)}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] transition-colors cursor-pointer ${
                                isAlreadyAdded
                                  ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                                style={{ backgroundColor: preset.hex }}
                              />
                              <span>{preset.name}</span>
                              <span>{isAlreadyAdded ? '✓' : '+'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Creador de Color Personalizado con Color Picker */}
                    <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                      <input
                        type="color"
                        value={customColorHex}
                        onChange={(e) => setCustomColorHex(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shadow-2xs shrink-0"
                        title="Selector de Color Hex"
                      />
                      <input
                        type="text"
                        placeholder="Nombre nuevo color (ej: Azul Caribe)"
                        value={customColorName}
                        onChange={(e) => setCustomColorName(e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg flex-1 min-w-[160px] focus:outline-hidden"
                      />
                      <span className="font-mono text-[11px] text-slate-500 font-bold px-1.5">
                        {customColorHex}
                      </span>
                      <button
                        type="button"
                        onClick={handleAddCustomColor}
                        className="px-3 py-1.5 bg-navy-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                      >
                        + Añadir a Paleta
                      </button>
                    </div>
                  </div>

                  {/* ACABADO & EXISTENCIAS DE PINTURA (CUÑETES & GALONES) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Acabado de la Pintura
                      </label>
                      <select
                        value={newProductForm.finish}
                        onChange={(e) => setNewProductForm({ ...newProductForm, finish: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      >
                        <option value="Mate">Mate (Sin brillo, interior)</option>
                        <option value="Satinado">Satinado (Sedoso lavable)</option>
                        <option value="Semibrillante">Semibrillante (Alta lavabilidad)</option>
                        <option value="Brillante">Brillante (Esmalte / Metal)</option>
                        <option value="Texturizado">Texturizado (Fachadas)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Stock: Cuñetes (5 Gal)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newProductForm.cuñetesAvailable}
                        onChange={(e) => setNewProductForm({ ...newProductForm, cuñetesAvailable: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Stock: Galones (1 Gal)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newProductForm.galonesAvailable}
                        onChange={(e) => setNewProductForm({ ...newProductForm, galonesAvailable: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Precio de Referencia por Galón ($ COP)
                      </label>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        value={newProductForm.pricePerGalon}
                        onChange={(e) => setNewProductForm({ ...newProductForm, pricePerGalon: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Litros Totales Calculados
                      </label>
                      <div className="px-3 py-2 bg-slate-100 rounded-xl font-mono font-bold text-slate-800 text-xs">
                        ~{Math.round((Number(newProductForm.cuñetesAvailable) || 0) * 18.9 + (Number(newProductForm.galonesAvailable) || 0) * 3.785)} L
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================================
                  MODO B: EXISTENCIAS & PRECIO EXCLUSIVO DE MATERIALES / INSUMOS
                  (Venta por unidad / pieza, SIN colores)
                  ========================================================== */}
              {productTypeMode === 'material' && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Stock Inicial Disponible *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="Ej. 120"
                        value={newProductForm.unitsAvailable}
                        onChange={(e) => setNewProductForm({ ...newProductForm, unitsAvailable: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-teal-900 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                        Conteo en {newProductForm.unitMeasure}
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Alerta Mínima de Stock
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newProductForm.minStockAlert}
                        onChange={(e) => setNewProductForm({ ...newProductForm, minStockAlert: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                        Avisar cuando queden menos de este umbral
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Precio Unitario de Venta ($ COP) *
                      </label>
                      <input
                        type="number"
                        min="500"
                        step="500"
                        required
                        placeholder="28000"
                        value={newProductForm.unitPrice}
                        onChange={(e) => setNewProductForm({ ...newProductForm, unitPrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-navy-900 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                        Precio por cada {newProductForm.unitMeasure}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Descripción Técnica & Uso Recomendado en Obra
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ej: Rodillo de felpa tejida 9 pulgadas con tubo de polipropileno de alta resistencia. Ideal para aplicación de vinilos y esmaltes en muros lisos o semirugosos."
                      value={newProductForm.description}
                      onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-hidden text-xs"
                    />
                  </div>
                </div>
              )}

              {/* SECCIÓN DE FOTOGRAFÍA DEL PRODUCTO (ADMIN PUEDE ELEGIR O INGRESAR URL / SUBIR ARCHIVO) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-teal-700" />
                    <h4 className="font-bold text-navy-900 text-xs">
                      Fotografía del Producto ({productTypeMode === 'pintura' ? 'Tarro de Pintura Oficial' : 'Foto del Material / Insumo'})
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">
                    {newProductForm.imageUrl ? '✓ Imagen Seleccionada' : 'Imagen por Defecto'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {/* Vista Previa de la Imagen */}
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-white border-2 border-slate-300 shadow-sm shrink-0 flex items-center justify-center group/preview">
                    <img
                      src={newProductForm.imageUrl || (productTypeMode === 'pintura' ? PAINT_IMAGE_PRESETS[0].url : MATERIAL_IMAGE_PRESETS[0].url)}
                      alt="Vista previa producto"
                      className="w-full h-full object-cover group-hover/preview:scale-110 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                      {productTypeMode === 'pintura' ? 'Tarro Pintura' : 'Material'}
                    </span>
                  </div>

                  <div className="flex-1 w-full space-y-3">
                    {/* Botones de acción: Subir Archivo local y URL */}
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-xl text-xs font-semibold text-teal-900 flex items-center gap-1.5 transition-colors shadow-2xs">
                        <Camera className="w-3.5 h-3.5 text-teal-700" />
                        <span>Subir Foto desde tu Equipo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setNewProductForm({ ...newProductForm, imageUrl: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {newProductForm.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setNewProductForm({ ...newProductForm, imageUrl: '' })}
                          className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors cursor-pointer"
                          title="Restablecer a imagen por defecto"
                        >
                          ✕ Quitar foto
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        O pegar URL web de la imagen:
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={newProductForm.imageUrl}
                        onChange={(e) => setNewProductForm({ ...newProductForm, imageUrl: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500 font-mono"
                      />
                    </div>

                    {/* Galería de presets oficiales con miniaturas visuales */}
                    <div>
                      <p className="text-[10px] font-mono uppercase text-slate-500 font-bold mb-1.5">
                        {productTypeMode === 'pintura'
                          ? 'O elegir de la galería de Tarros de Pintura Pintuco:'
                          : 'O elegir de la galería de Materiales & Insumos:'}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(productTypeMode === 'pintura' ? PAINT_IMAGE_PRESETS : MATERIAL_IMAGE_PRESETS).map((preset) => {
                          const isSelected = newProductForm.imageUrl === preset.url;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setNewProductForm({ ...newProductForm, imageUrl: preset.url })}
                              className={`p-1.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold ring-2 ring-teal-400/40 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <img
                                src={preset.url}
                                alt={preset.label}
                                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
                              />
                              <span className="text-[10px] leading-tight truncate font-medium">
                                {preset.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Guardar */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`btn-primary !py-2.5 !px-5 flex items-center gap-2 shadow-sm font-bold cursor-pointer ${
                    productTypeMode === 'pintura' ? 'bg-teal-700 hover:bg-teal-800' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                  id="btn-submit-save-product"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {productTypeMode === 'pintura'
                      ? `Guardar Pintura (${paintColors.length} Colores)`
                      : `Guardar Material (${newProductForm.unitsAvailable} ${newProductForm.unitMeasure})`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Crear y Registrar Cliente en Supabase Cloud */}
      {isAddClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-200">
            <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-900 to-navy-900 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full font-bold">
                  POSTGRESQL public.clientes & public.usuarios
                </span>
                <h3 className="text-lg font-bold font-['Space_Grotesk'] mt-1 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-300" />
                  Crear Nuevo Cliente & Asignar Accesos
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddClientModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-5 sm:p-6 space-y-4 text-xs flex-1 min-h-0 overflow-y-auto">
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-blue-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Accesos Habilitados Automáticamente para este Cliente:</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Al registrarse, el cliente podrá iniciar sesión con su correo y contraseña <code>cliente123</code> para cotizar pinturas, consultar inventario en CEDIs, usar la calculadora de galones/cuñetes, interactuar con el Asesor Técnico IA y descargar facturas electrónicas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nombre Completo o Razón Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Constructora Capital SAS o Carlos Alberto Pérez"
                    value={newClientForm.name}
                    onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NIT o Cédula (Documento) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 900.789.654-2 o 1032456789"
                    value={newClientForm.identification}
                    onChange={(e) => setNewClientForm({ ...newClientForm, identification: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Empresa / Constructora (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Obras Civiles Andinas"
                    value={newClientForm.company}
                    onChange={(e) => setNewClientForm({ ...newClientForm, company: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Correo Electrónico (Login) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contacto@empresa.com"
                    value={newClientForm.email}
                    onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Teléfono / Celular (WhatsApp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 310 123 4567"
                    value={newClientForm.phone}
                    onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ciudad de Operación
                  </label>
                  <select
                    value={newClientForm.city}
                    onChange={(e) => setNewClientForm({ ...newClientForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Medellín">Medellín (Antioquia)</option>
                    <option value="Bogotá D.C.">Bogotá D.C. (Cundinamarca)</option>
                    <option value="Cali">Cali (Valle del Cauca)</option>
                    <option value="Barranquilla">Barranquilla (Atlántico)</option>
                    <option value="Bucaramanga">Bucaramanga (Santander)</option>
                    <option value="Cartagena">Cartagena (Bolívar)</option>
                    <option value="Pereira">Pereira (Risaralda)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dirección de Entrega / Despacho
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Carrera 43A # 18 Sur-120"
                    value={newClientForm.address}
                    onChange={(e) => setNewClientForm({ ...newClientForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddClientModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClient}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2 shadow-md transition-all"
                >
                  {isCreatingClient ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Guardando en Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar Cliente en Supabase Cloud</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Registrar Personal: Conductor o Empacador */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-200">
            <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0F1E36] via-[#1E2E4B] to-[#0F1E36] text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-full font-bold">
                  NÓMINA & OPERACIONES CEDI PINTUCO
                </span>
                <h3 className="text-lg font-bold font-['Space_Grotesk'] mt-1 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-400" />
                  Registrar Personal: Conductor o Empacador
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-5 sm:p-6 space-y-4 text-xs flex-1 min-h-0 overflow-y-auto">
              {/* Selector de Rol: Conductor vs Empacador */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 text-[11px] font-mono uppercase">
                  1. Seleccionar Rol del Operario <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewStaffForm({ ...newStaffForm, role: 'conductor' })}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      newStaffForm.role === 'conductor'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400/30'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
                      🚚
                    </div>
                    <div>
                      <p className="font-bold text-xs">Conductor</p>
                      <p className="text-[10.5px] text-slate-500">Flota, GPS y entregas</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStaffForm({ ...newStaffForm, role: 'empacador' })}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      newStaffForm.role === 'empacador'
                        ? 'border-amber-600 bg-amber-50 text-amber-950 ring-2 ring-amber-400/30'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
                      📦
                    </div>
                    <div>
                      <p className="font-bold text-xs">Empacador</p>
                      <p className="text-[10.5px] text-slate-500">Envasado & bodega CEDI</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Información Personal y Credenciales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nombre Completo del Operario <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Wilson Orlando Cañas o Javier Darío Gómez"
                    value={newStaffForm.name}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cédula / Documento de Identidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="CC-10203040"
                    value={newStaffForm.document}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, document: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Teléfono Celular / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+57 315 765 4321"
                    value={newStaffForm.phone}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Correo Electrónico (Login de Acceso) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={newStaffForm.role === 'conductor' ? 'conductor2@pintuco.com' : 'empacador2@pintuco.com'}
                    value={newStaffForm.email}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contraseña de Acceso
                  </label>
                  <input
                    type="text"
                    placeholder="pintuco2026"
                    value={newStaffForm.password}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sede CEDI de Operación
                  </label>
                  <select
                    value={newStaffForm.cediCity}
                    onChange={(e) => {
                      const city = e.target.value;
                      let whName = 'CEDI Rionegro - Bodega Central';
                      if (city === 'Bogotá D.C.') whName = 'CEDI Siberia Muelle 4';
                      if (city === 'Cali') whName = 'Hub Regional Acopi Yumbo';
                      if (city === 'Barranquilla') whName = 'Planta Caribe Galapa';
                      if (city === 'Bucaramanga') whName = 'CEDI Oriente Girón';
                      setNewStaffForm({ ...newStaffForm, cediCity: city, cediName: whName });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="Medellín">Medellín (CEDI Rionegro)</option>
                    <option value="Bogotá D.C.">Bogotá D.C. (CEDI Siberia)</option>
                    <option value="Cali">Cali (CEDI Acopi Yumbo)</option>
                    <option value="Barranquilla">Barranquilla (CEDI Galapa)</option>
                    <option value="Bucaramanga">Bucaramanga (CEDI Girón)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Carnet / Código Interno
                  </label>
                  <input
                    type="text"
                    placeholder={newStaffForm.role === 'conductor' ? 'LOG-TRK-770' : 'BOD-8840'}
                    value={newStaffForm.badgeNumber}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, badgeNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Campos específicos según el Rol */}
              {newStaffForm.role === 'conductor' ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>Datos de Transporte & Flota Asignada</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Placa del Vehículo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="WTL-582"
                        value={newStaffForm.vehiclePlate}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, vehiclePlate: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-mono uppercase font-bold focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Tipo de Vehículo
                      </label>
                      <select
                        value={newStaffForm.vehicleType}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, vehicleType: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Camión NHR 3.5 Ton">Camión NHR 3.5 Ton</option>
                        <option value="Furgón NPR 5 Ton">Furgón NPR 5 Ton</option>
                        <option value="Turbo Hino 4.5 Ton">Turbo Hino 4.5 Ton</option>
                        <option value="Camioneta Estacas 2 Ton">Camioneta Estacas 2 Ton</option>
                        <option value="Van Reparto Express 1 Ton">Van Reparto Express 1 Ton</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Categoría Licencia
                      </label>
                      <select
                        value={newStaffForm.licenseCategory}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, licenseCategory: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-mono font-bold focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="C2">C2 (Camión Rígido)</option>
                        <option value="C3">C3 (Vehículo Articulado)</option>
                        <option value="C1">C1 (Automóviles/Vans)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <Boxes className="w-4 h-4 text-amber-700" />
                    <span>Turno & Asignación de Bodega CEDI</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Turno Operativo
                    </label>
                    <select
                      value={newStaffForm.shift}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, shift: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="Turno Mañana (06:00 - 14:00)">Turno Mañana (06:00 - 14:00)</option>
                      <option value="Turno Tarde (14:00 - 22:00)">Turno Tarde (14:00 - 22:00)</option>
                      <option value="Turno Noche (22:00 - 06:00)">Turno Noche (22:00 - 06:00)</option>
                      <option value="Turno Mixto Flexible">Turno Mixto Flexible</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Aviso de Creación de Credenciales */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-[11px] text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  Al registrarse, el usuario quedará activo en la plataforma y podrá iniciar sesión de inmediato con su correo y la contraseña configurada.
                </span>
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`btn-primary !py-2.5 !px-5 flex items-center gap-2 shadow-sm font-bold cursor-pointer ${
                    newStaffForm.role === 'conductor' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-amber-700 hover:bg-amber-800'
                  }`}
                  id="btn-submit-save-staff"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    Guardar y Habilitar Rol {newStaffForm.role === 'conductor' ? 'Conductor' : 'Empacador'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: EDITAR DATOS COMPLETOS DE CLIENTE (ADMINISTRADOR) */}
      {isEditClientModalOpen && editingClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-200">
            <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-navy-900 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full font-bold">
                  GESTIÓN ADMINISTRATIVA · CLIENTE
                </span>
                <h3 className="text-lg font-bold font-['Space_Grotesk'] mt-1 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-300" />
                  Editar Datos del Cliente
                </h3>
                <p className="text-xs text-blue-100/80 mt-0.5">
                  ID: <span className="font-mono">{editingClient.id}</span> · Modificación de credenciales, sede y contacto
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditClientModalOpen(false);
                  setEditingClient(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditClient} className="p-5 sm:p-6 space-y-4 text-xs flex-1 min-h-0 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nombre Completo o Razón Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingClient.name || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NIT o Cédula (Solo Números) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editingClient.identification || ''}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        identification: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Solo dígitos numéricos</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Empresa / Constructora
                  </label>
                  <input
                    type="text"
                    value={editingClient.company || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, company: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Correo Electrónico (Login) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editingClient.email || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Teléfono / Celular (Solo Números) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={15}
                    value={editingClient.phone || ''}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        phone: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Solo dígitos numéricos</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ciudad Principal & Sede CEDI <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingClient.city || 'Medellín'}
                    onChange={(e) => setEditingClient({ ...editingClient, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="Medellín">Medellín (Planta Rionegro)</option>
                    <option value="Bogotá D.C.">Bogotá D.C. (Siberia)</option>
                    <option value="Cali">Cali (Acopi Yumbo)</option>
                    <option value="Barranquilla">Barranquilla (Planta Caribe)</option>
                    <option value="Bucaramanga">Bucaramanga (Girón)</option>
                  </select>
                  <span className="text-[10px] text-blue-700 mt-0.5 block">
                    Determina qué inventario puede visualizar el cliente
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contraseña de Acceso
                  </label>
                  <input
                    type="text"
                    value={editingClient.password || 'cliente123'}
                    onChange={(e) => setEditingClient({ ...editingClient, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dirección de Despacho
                  </label>
                  <input
                    type="text"
                    value={editingClient.address || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditClientModalOpen(false);
                    setEditingClient(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingClient}
                  className="btn-primary !py-2.5 !px-5 flex items-center gap-2 shadow-sm font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSavingClient ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isSavingClient ? 'Guardando en Base de Datos...' : 'Guardar Cambios de Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR DATOS COMPLETOS DE OPERARIO (CONDUCTOR / EMPACADOR) */}
      {isEditStaffModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-200">
            <div
              className={`p-5 sm:p-6 text-white flex items-center justify-between shrink-0 ${
                editingStaff.role === 'conductor'
                  ? 'bg-gradient-to-r from-emerald-900 to-teal-950'
                  : 'bg-gradient-to-r from-amber-900 to-orange-950'
              }`}
            >
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-white/80 bg-white/10 px-2.5 py-0.5 rounded-full font-bold">
                  GESTIÓN ADMINISTRATIVA · {editingStaff.role === 'conductor' ? 'CONDUCTOR' : 'EMPACADOR'}
                </span>
                <h3 className="text-lg font-bold font-['Space_Grotesk'] mt-1 flex items-center gap-2">
                  {editingStaff.role === 'conductor' ? (
                    <Truck className="w-5 h-5 text-emerald-300" />
                  ) : (
                    <Boxes className="w-5 h-5 text-amber-300" />
                  )}
                  Editar Datos de {editingStaff.role === 'conductor' ? 'Conductor' : 'Empacador'}
                </h3>
                <p className="text-xs text-white/80 mt-0.5">
                  ID: <span className="font-mono">{editingStaff.id}</span> · Carnet: {editingStaff.badgeNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditStaffModalOpen(false);
                  setEditingStaff(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditStaff} className="p-5 sm:p-6 space-y-4 text-xs flex-1 min-h-0 overflow-y-auto">
              {/* Selector de Rol */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Rol Operativo <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingStaff({ ...editingStaff, role: 'conductor' })}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      editingStaff.role === 'conductor'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400/30 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="block font-bold">Conductor</span>
                      <span className="text-[10px] text-slate-500">Rutas, GPS y entrega</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingStaff({ ...editingStaff, role: 'empacador' })}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      editingStaff.role === 'empacador'
                        ? 'border-amber-600 bg-amber-50 text-amber-950 ring-2 ring-amber-400/30 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Boxes className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="block font-bold">Empacador</span>
                      <span className="text-[10px] text-slate-500">Alistamiento en muelle</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nombre Completo del Operario <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStaff.name || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cédula de Ciudadanía (Solo Números) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editingStaff.document || ''}
                    onChange={(e) =>
                      setEditingStaff({
                        ...editingStaff,
                        document: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Solo dígitos numéricos</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Carnet / Código Interno <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStaff.badgeNumber || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, badgeNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Correo Electrónico (Login) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editingStaff.email || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Teléfono Celular (Solo Números) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={15}
                    value={editingStaff.phone || ''}
                    onChange={(e) =>
                      setEditingStaff({
                        ...editingStaff,
                        phone: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Solo dígitos numéricos</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ciudad CEDI Principal <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingStaff.cediCity || 'Medellín'}
                    onChange={(e) => {
                      const cCity = e.target.value;
                      let whName = 'CEDI Rionegro - Bodega Central';
                      if (cCity === 'Bogotá D.C.') whName = 'CEDI Siberia Muelle 4';
                      if (cCity === 'Cali') whName = 'Hub Regional Acopi Yumbo';
                      if (cCity === 'Barranquilla') whName = 'Planta Caribe Galapa';
                      if (cCity === 'Bucaramanga') whName = 'CEDI Oriente Girón';
                      setEditingStaff({
                        ...editingStaff,
                        cediCity: cCity,
                        cediName: whName,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden bg-white"
                  >
                    <option value="Medellín">Medellín (Planta Rionegro)</option>
                    <option value="Bogotá D.C.">Bogotá D.C. (Siberia)</option>
                    <option value="Cali">Cali (Acopi Yumbo)</option>
                    <option value="Barranquilla">Barranquilla (Planta Caribe)</option>
                    <option value="Bucaramanga">Bucaramanga (Girón)</option>
                  </select>
                  <span className="text-[10px] text-teal-700 mt-0.5 block">
                    Define la ciudad de pedidos que podrá visualizar
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sede CEDI Asignada
                  </label>
                  <input
                    type="text"
                    value={editingStaff.cediName || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, cediName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estado Operativo
                  </label>
                  <select
                    value={editingStaff.status || 'activo'}
                    onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden bg-white"
                  >
                    <option value="activo">Activo en Servicio</option>
                    <option value="en_ruta">En Ruta de Entrega</option>
                    <option value="descanso">Descanso / Turno Finalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contraseña de Acceso
                  </label>
                  <input
                    type="text"
                    value={editingStaff.password || 'pintuco2026'}
                    onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Campos específicos de Conductor */}
              {editingStaff.role === 'conductor' && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>Datos de Transporte & Vehículo</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Placa del Vehículo
                      </label>
                      <input
                        type="text"
                        value={editingStaff.vehiclePlate || ''}
                        onChange={(e) => setEditingStaff({ ...editingStaff, vehiclePlate: e.target.value.toUpperCase() })}
                        placeholder="Ej: WTL-582"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-mono uppercase font-bold focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Tipo de Vehículo
                      </label>
                      <input
                        type="text"
                        value={editingStaff.vehicleType || ''}
                        onChange={(e) => setEditingStaff({ ...editingStaff, vehicleType: e.target.value })}
                        placeholder="Camión NHR 3.5 Ton"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Licencia de Conducción
                      </label>
                      <select
                        value={editingStaff.licenseCategory || 'C2'}
                        onChange={(e) => setEditingStaff({ ...editingStaff, licenseCategory: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-emerald-500 bg-white"
                      >
                        <option value="C2">C2 (Camión Rígido)</option>
                        <option value="C3">C3 (Vehículo Articulado)</option>
                        <option value="C1">C1 (Automóviles/Vans)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Campos específicos de Empacador */}
              {editingStaff.role === 'empacador' && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <Boxes className="w-4 h-4 text-amber-700" />
                    <span>Turno & Asignación de Bodega CEDI</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Turno Operativo
                    </label>
                    <select
                      value={editingStaff.shift || 'Turno Mañana (06:00 - 14:00)'}
                      onChange={(e) => setEditingStaff({ ...editingStaff, shift: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-amber-500 bg-white"
                    >
                      <option value="Turno Mañana (06:00 - 14:00)">Turno Mañana (06:00 - 14:00)</option>
                      <option value="Turno Tarde (14:00 - 22:00)">Turno Tarde (14:00 - 22:00)</option>
                      <option value="Turno Noche (22:00 - 06:00)">Turno Noche (22:00 - 06:00)</option>
                      <option value="Turno Mixto Flexible">Turno Mixto Flexible</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditStaffModalOpen(false);
                    setEditingStaff(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`btn-primary !py-2.5 !px-5 flex items-center gap-2 shadow-sm font-bold text-white rounded-xl cursor-pointer ${
                    editingStaff.role === 'conductor'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-amber-700 hover:bg-amber-800'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios de Operario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Desplegable Estilizado de Entrada de Mercancía / Recepción de Stock */}
      {stockEntryProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full my-6 overflow-hidden animate-scale-in flex flex-col max-h-[92vh]">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 border-b border-teal-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
                  <PlusCircle className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                    RECEPCIÓN DE MERCANCÍA · BODEGA CEDI PINTUCO
                  </span>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Registrar Entrada de Stock
                  </h3>
                  <span className="text-xs text-teal-200 font-mono">
                    Sede {stockEntryProduct.warehouseCity} · {stockEntryProduct.warehouseName}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStockEntryProduct(null)}
                className="text-white/70 hover:text-white text-lg font-bold p-1 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Ficha Resumen del Producto */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-2xs shrink-0">
                <img
                  src={getProductImage(stockEntryProduct)}
                  alt={stockEntryProduct.productName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {stockEntryProduct.productName}
                  </h4>
                  {isPaintProduct(stockEntryProduct) ? (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200 font-bold">
                      PINTURA
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-bold">
                      MATERIAL / INSUMO
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  SKU: <strong className="text-slate-800">{stockEntryProduct.sku}</strong> · Lote: {stockEntryProduct.batchCode}
                </p>
                <div className="flex items-center gap-2 pt-0.5 text-[11px] font-mono">
                  <span className="text-slate-600">Stock actual en bodega:</span>
                  {isPaintProduct(stockEntryProduct) ? (
                    <span className="font-bold text-amber-900 bg-amber-100/70 px-1.5 py-0.5 rounded">
                      {stockEntryProduct.cuñetesAvailable || 0} Cuñ · {stockEntryProduct.galonesAvailable || 0} Gal (~{(stockEntryProduct.totalLiters || 0).toLocaleString()} L)
                    </span>
                  ) : (
                    <span className="font-bold text-teal-900 bg-teal-100/70 px-1.5 py-0.5 rounded">
                      {(stockEntryProduct.unitsAvailable ?? stockEntryProduct.galonesAvailable ?? 0)} {stockEntryProduct.unitMeasure || 'Unidades'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Formulario de Entrada */}
            <form onSubmit={handleConfirmStockEntry} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Selector de Unidad (Solo si es Pintura) */}
              {isPaintProduct(stockEntryProduct) && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 block">
                    Presentación que llegó en el cargamento:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEntryUnit('cuñetes')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        entryUnit === 'cuñetes'
                          ? 'border-teal-700 bg-teal-50 text-teal-950 ring-2 ring-teal-600/30 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        entryUnit === 'cuñetes' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        5G
                      </div>
                      <div>
                        <span className="block font-bold">Cuñetes (5 Gal)</span>
                        <span className="text-[10px] text-slate-500 font-mono">18.9 Litros c/u</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEntryUnit('galones')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        entryUnit === 'galones'
                          ? 'border-teal-700 bg-teal-50 text-teal-950 ring-2 ring-teal-600/30 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        entryUnit === 'galones' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        1G
                      </div>
                      <div>
                        <span className="block font-bold">Galones (1 Gal)</span>
                        <span className="text-[10px] text-slate-500 font-mono">3.785 Litros c/u</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Cantidad Adicional a Mano con Stepper y Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    Cantidad adicional que ingresa a bodega:
                  </label>
                  <span className="text-[11px] font-mono text-slate-500 font-medium">
                    {isPaintProduct(stockEntryProduct)
                      ? (entryUnit === 'cuñetes' ? 'Unidades de Cuñete (5 Gal)' : 'Unidades de Galón (1 Gal)')
                      : (stockEntryProduct.unitMeasure || 'Unidades / Piezas')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryQty((prev) => Math.max(1, (Number(prev) || 0) - 10))}
                    className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center cursor-pointer border border-slate-300 transition-colors"
                  >
                    -
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      required
                      value={entryQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setEntryQty(isNaN(val) ? 0 : val);
                      }}
                      className="w-full h-11 px-3 text-center text-xl font-bold font-mono bg-slate-50 border-2 border-teal-600 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setEntryQty((prev) => (Number(prev) || 0) + 10)}
                    className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center cursor-pointer border border-slate-300 transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Chips rápidos de cantidad */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-mono text-slate-400 font-bold">Sumar rápido:</span>
                  {[5, 10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setEntryQty(amt)}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition-colors cursor-pointer ${
                        entryQty === amt
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEntryQty((prev) => (Number(prev) || 0) + 50)}
                    className="px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors cursor-pointer"
                  >
                    +50 más
                  </button>
                </div>
              </div>

              {/* Cálculo en Vivo y Proyección de Stock */}
              {(() => {
                const isPaint = isPaintProduct(stockEntryProduct);
                const addedNum = Number(entryQty) || 0;
                let projectedCunetes = stockEntryProduct.cuñetesAvailable || 0;
                let projectedGalones = stockEntryProduct.galonesAvailable || 0;
                let projectedUnits = (stockEntryProduct.unitsAvailable ?? stockEntryProduct.galonesAvailable ?? 0);
                let projectedLiters = 0;

                if (isPaint) {
                  if (entryUnit === 'cuñetes') {
                    projectedCunetes += addedNum;
                  } else {
                    projectedGalones += addedNum;
                  }
                  projectedLiters = Math.round(projectedCunetes * 18.9 + projectedGalones * 3.785);
                } else {
                  projectedUnits += addedNum;
                  projectedLiters = projectedUnits;
                }

                return (
                  <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-teal-950 font-mono text-xs">
                      <span className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-700" />
                        Proyección Resultante en Bodega:
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Estado: ÓPTIMO
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                      <div className="p-2.5 bg-white rounded-lg border border-teal-100">
                        <span className="text-[10px] text-slate-500 block">Stock Anterior:</span>
                        <p className="font-bold text-slate-800">
                          {isPaint
                            ? `${stockEntryProduct.cuñetesAvailable || 0} Cuñ / ${stockEntryProduct.galonesAvailable || 0} Gal`
                            : `${(stockEntryProduct.unitsAvailable ?? stockEntryProduct.galonesAvailable ?? 0)} ${stockEntryProduct.unitMeasure || 'Uds'}`}
                        </p>
                      </div>

                      <div className="p-2.5 bg-white rounded-lg border border-teal-200 shadow-2xs">
                        <span className="text-[10px] text-teal-700 font-bold block">Nuevo Stock Resultante:</span>
                        <p className="font-bold text-teal-950">
                          {isPaint
                            ? `${projectedCunetes} Cuñ / ${projectedGalones} Gal (~${projectedLiters.toLocaleString()} L)`
                            : `${projectedUnits} ${stockEntryProduct.unitMeasure || 'Uds'}`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Datos Opcionales de Remisión y Operario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nº de Guía / Remisión (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. REM-2026-0492"
                    value={entryRemission}
                    onChange={(e) => setEntryRemission(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Responsable de Recepción:
                  </label>
                  <input
                    type="text"
                    value={entryReceiver}
                    onChange={(e) => setEntryReceiver(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Footer de Acciones del Modal */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setStockEntryProduct(null)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer text-xs active:scale-95"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  <span>✓ Confirmar e Ingresar a Inventario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edición Completa de Producto de Inventario */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-6 overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 border-b border-teal-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                  <Edit3 className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                    MODIFICAR CATÁLOGO & STOCK · ADMINISTRADOR PINTUCO
                  </span>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Editar: {editingProduct.productName}
                  </h3>
                  <span className="text-xs text-slate-300 font-mono">
                    SKU: {editingProduct.sku} · Sede CEDI {editingProduct.warehouseCity}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-white/70 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formulario de Edición */}
            <form onSubmit={handleSaveEditedProduct} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Nombre Oficial */}
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-800 block mb-1">
                    Nombre Oficial del Producto:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.productName}
                    onChange={(e) => setEditingProduct({ ...editingProduct, productName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-teal-500 text-xs font-semibold"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1 font-mono">
                    Código SKU:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono text-xs font-bold"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Línea / Categoría:
                  </label>
                  <input
                    type="text"
                    value={editingProduct.category || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-xs"
                  />
                </div>

                {/* Ciudad CEDI */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Ciudad Principal CEDI:
                  </label>
                  <select
                    value={editingProduct.warehouseCity}
                    onChange={(e) => {
                      const newCity = e.target.value;
                      let defaultBodega = editingProduct.warehouseName;
                      if (newCity === 'Bogotá D.C.') defaultBodega = 'CEDI Siberia Cundinamarca';
                      if (newCity === 'Medellín') defaultBodega = 'CEDI Rionegro - Bodega Central';
                      if (newCity === 'Cali') defaultBodega = 'Hub Regional Suroccidente Acopi Yumbo';
                      if (newCity === 'Barranquilla') defaultBodega = 'Planta y Logística Caribe Galapa';
                      if (newCity === 'Bucaramanga') defaultBodega = 'Centro Logístico Oriente Girón';
                      setEditingProduct({
                        ...editingProduct,
                        warehouseCity: newCity,
                        warehouseName: defaultBodega,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs"
                  >
                    <option value="Bogotá D.C.">Bogotá D.C.</option>
                    <option value="Medellín">Medellín</option>
                    <option value="Cali">Cali</option>
                    <option value="Barranquilla">Barranquilla</option>
                    <option value="Bucaramanga">Bucaramanga</option>
                  </select>
                </div>

                {/* Nombre de Bodega */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Nombre Bodega / Planta:
                  </label>
                  <input
                    type="text"
                    value={editingProduct.warehouseName}
                    onChange={(e) => setEditingProduct({ ...editingProduct, warehouseName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* SECCIÓN ESPECÍFICA SEGÚN SEA PINTURA O MATERIAL */}
              <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-xl space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-900 block">
                  {isPaintProduct(editingProduct)
                    ? 'INVENTARIO DE PINTURA (CUÑETES DE 5 GAL & GALONES)'
                    : 'INVENTARIO DE MATERIAL / HERRAMIENTA / INSUMO (UNIDADES)'}
                </span>

                {isPaintProduct(editingProduct) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                    <div>
                      <label className="text-[11px] font-bold text-slate-800 block mb-1">
                        Cuñetes (5 Gal):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editingProduct.cuñetesAvailable ?? 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, cuñetesAvailable: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                        className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg font-bold text-amber-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-800 block mb-1">
                        Galones (1 Gal):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editingProduct.galonesAvailable ?? 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, galonesAvailable: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                        className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg font-bold text-teal-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-800 block mb-1">
                        Precio / Galón COP:
                      </label>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        value={editingProduct.pricePerGalon ?? 110000}
                        onChange={(e) => setEditingProduct({ ...editingProduct, pricePerGalon: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                        className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg font-bold text-slate-900 text-xs"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-bold text-slate-800 block mb-1 font-sans">
                        Acabado de la Pintura:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Mate Lavable, Satinado Sedoso, Brillante Impermeable..."
                        value={editingProduct.finish || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, finish: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                    <div>
                      <label className="text-[11px] font-bold text-slate-800 block mb-1">
                        Unidades Disponibles:
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editingProduct.unitsAvailable ?? editingProduct.galonesAvailable ?? 0}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setEditingProduct({
                            ...editingProduct,
                            unitsAvailable: val,
                            galonesAvailable: val,
                            totalLiters: val,
                          });
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg font-bold text-teal-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-800 block mb-1 font-sans">
                        Unidad de Medida:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Unidad, Rollo 50m, Paquete x 10, Cartucho 300ml..."
                        value={editingProduct.unitMeasure || 'Unidad'}
                        onChange={(e) => setEditingProduct({ ...editingProduct, unitMeasure: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-800 block mb-1">
                        Precio Unitario COP:
                      </label>
                      <input
                        type="number"
                        min="500"
                        step="500"
                        value={editingProduct.unitPrice ?? editingProduct.pricePerGalon ?? 28000}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setEditingProduct({
                            ...editingProduct,
                            unitPrice: val,
                            pricePerGalon: val,
                          });
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg font-bold text-slate-900 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN TRAZABILIDAD, LOTES & ESTADO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-bold text-slate-800 block mb-1 font-mono">
                    Lote de Fabricación:
                  </label>
                  <input
                    type="text"
                    value={editingProduct.batchCode || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, batchCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Fecha Vencimiento:
                  </label>
                  <input
                    type="text"
                    placeholder="AAAA-MM-DD"
                    value={editingProduct.expirationDate || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, expirationDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Estado Operativo:
                  </label>
                  <select
                    value={editingProduct.status}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-xs"
                  >
                    <option value="optimo">✓ Óptimo (Disponible)</option>
                    <option value="critico">⚠️ Stock Bajo / Crítico</option>
                    <option value="alerta_reposicion">⚡ Alerta de Reposición</option>
                    <option value="agotado">⛔ Agotado (Bloquear pedidos)</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="font-bold text-slate-800 block mb-1">
                    Descripción Técnica del Producto:
                  </label>
                  <textarea
                    rows={2}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="font-bold text-slate-800 block mb-1">
                    URL de Imagen del Producto:
                  </label>
                  <input
                    type="url"
                    value={editingProduct.imageUrl || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer text-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>💾 Guardar Cambios en Inventario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Factura Electrónica y Descarga PDF para Administrador */}
      {selectedInvoice && (
        <InvoiceModal
          request={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
