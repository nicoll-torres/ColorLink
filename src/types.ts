export type ViewState = 
  | 'home'
  | 'login'
  | 'register'
  | 'request'
  | 'success'
  | 'transversal-ecosystem'
  | 'calculator';

export type UserRole = 'cliente' | 'administrador' | 'empacador' | 'conductor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  company?: string;
  role: UserRole;
  phone: string;
  city: string;
  address?: string;
  badgeNumber?: string;
  vehiclePlate?: string;
}

export type SurfaceType = 
  | 'mamposteria_interior'
  | 'fachada_exterior'
  | 'metal_ferroso'
  | 'madera'
  | 'concreto_piso'
  | 'drywall_yeso'
  | 'humedad_salitre';

export type EnvironmentType = 'interior' | 'exterior' | 'industrial' | 'alta_humedad' | 'marino';

export interface PintucoProduct {
  id: string;
  name: string;
  line: 'Hogar y Construcción' | 'Alta Protección / Industrial' | 'Maderas' | 'Metales y Esmaltes' | 'Preparación y Fondos';
  category: string;
  description: string;
  coveragePerGalM2: number; // Rendimiento teórico m² / gal a 1 mano
  recommendedHands: number;
  dilution: string; // ej. "20% agua" o "10% Thinner Pintuco"
  dryingTouchHours: number;
  dryingTotalHours: number;
  warrantyYears: number;
  recommendedPrimer?: string;
  finishType: 'Mate' | 'Satinado' | 'Semibrillante' | 'Brillante';
  ecoFriendly: boolean;
  vocGramsLiter: number;
  pricePerGalon: number;
  availableSizes: ('1/4 Galón' | '1 Galón' | 'Cuñete (5 Gal)')[];
}

export interface TechnicalCalculation {
  areaM2: number;
  recommendedProduct: PintucoProduct;
  recommendedPrimerProduct?: PintucoProduct;
  handsNeeded: number;
  totalGalons: number;
  totalCuñetes: number;
  remainderGalons: number;
  primerGalons: number;
  requiredSupplies: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  estimatedMaterialCostCOP: number;
  preparationAdvice: string[];
  applicationInstructions: string[];
  warrantyDurationYears: number;
}

export interface ManualPackedItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  notes?: string;
  verified: boolean;
}

export interface PackagingDetails {
  packerId?: string;
  packerName: string;
  packedAt?: string;
  batchCode: string;
  checkedSupplies: string[];
  cuñetesPacked: number;
  galonesPacked: number;
  cuartosPacked?: number;
  weightKg: number;
  qualitySealAttached: boolean;
  qrInspectionCode: string;
  status: 'pendiente' | 'en_proceso' | 'empacado_listo';
  notes?: string;
  manualItems?: ManualPackedItem[];
  handwrittenNotes?: string;
  packerSignature?: string;
}

export interface DeliveryDetails {
  driverId?: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  vehicleType: string;
  currentLocation?: string;
  routeStatus: 'pendiente_cargue' | 'cargado_en_muelle' | 'en_ruta' | 'en_destino' | 'entregado';
  departedAt?: string;
  estimatedArrival?: string;
  deliveredAt?: string;
  receivedByName?: string;
  receivedByDoc?: string;
  receiverSignature?: string;
  deliveryNotes?: string;
  deliveryAddress: string;
}

export interface OrderItem {
  id: string;
  sku: string;
  productName: string;
  category?: string;
  itemType: 'pintura' | 'material';
  colorName?: string;
  colorHex?: string;
  presentation?: 'cuñete' | 'galon' | 'cuarto' | 'unidad';
  quantity: number;
  unitPrice: number;
  totalCostCOP: number;
  warehouseCity?: string;
  warehouseName?: string;
  notes?: string;
}

export interface PaintRequest {
  id: string;
  requestCode: string;
  createdAt: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  deliveryAddress?: string;
  city: string;
  projectType: 'Residencial' | 'Comercial' | 'Industrial' | 'Institucional';
  surfaceType: SurfaceType;
  environment: EnvironmentType;
  areaM2: number;
  colorName: string;
  colorHex?: string;
  orderItemType?: 'pintura' | 'material';
  materialQuantity?: number;
  catalogSku?: string;
  catalogProductName?: string;
  catalogUnitPrice?: number;
  notes?: string;
  requiresApplicationService: boolean;
  status: 'solicitud_recibida' | 'solucion_tecnica' | 'abastecimiento' | 'servicio_despacho' | 'calidad_garantia';
  technicalCalculation?: TechnicalCalculation;
  items?: OrderItem[];
  inventoryAllocation?: {
    warehouseCity: string;
    warehouseName: string;
    batchNumber: string;
    stockConfirmed: boolean;
    dispatchReadyDate: string;
  };
  packagingDetails?: PackagingDetails;
  deliveryDetails?: DeliveryDetails;
  serviceLogistics?: {
    certifiedCrewAssigned?: string;
    crewLead?: string;
    estimatedDeliveryDate: string;
    applicationStartDate?: string;
    estimatedDays: number;
    logisticsStatus: 'En bodega' | 'En alistamiento' | 'En ruta' | 'Entregado' | 'En aplicación';
  };
  qualityCertificate?: {
    certificateId: string;
    inspectorName: string;
    adhesionTest: 'Aprobado' | 'Excelente' | 'Pendiente';
    substrateMoisture: number; // % humedad
    dryFilmThicknessMils: number;
    warrantyIssuedDate: string;
    warrantyExpirationDate: string;
  };
  invoiceDetails?: InvoiceDetails;
  chatMessages?: OrderChatMessage[];
}

export interface OrderChatMessage {
  id: string;
  senderRole: 'conductor' | 'cliente' | 'administrador';
  senderName: string;
  message: string;
  timestamp: string;
  createdAtIso?: string;
  isReadByOther?: boolean;
}

export interface InvoiceItem {
  sku: string;
  description: string;
  quantity: number;
  unit: string;
  unitPriceCOP: number;
  totalCOP: number;
}

export interface InvoiceDetails {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  dianResolution: string;
  cufe: string;
  qrCodeUrl?: string;
  clientNit?: string;
  clientCompanyName?: string;
  paymentMethod: string;
  paymentStatus: 'PAGADA' | 'PENDIENTE' | 'CRÉDITO_30_DÍAS';
  items: InvoiceItem[];
  subtotalCOP: number;
  taxIva19COP: number;
  totalCOP: number;
}

export interface StepThreadItem {
  id: number;
  phaseCode: string;
  label: string;
  desc: string;
}

export interface WarehouseInventoryItem {
  id: string;
  sku: string;
  productName: string;
  productId?: string;
  category: string;
  warehouseCity: string;
  warehouseName: string;
  cuñetesAvailable: number;
  galonesAvailable: number;
  quartsAvailable: number;
  totalLiters: number;
  minStockAlert: number;
  batchCode: string;
  expirationDate: string;
  status: 'optimo' | 'alerta_reposicion' | 'critico' | 'agotado';
  lastUpdated: string;
  pricePerGalon?: number;
  unitType?: 'pintura' | 'herramienta' | 'insumo';
  surfaceTypeSupported?: SurfaceType[];
  unitsAvailable?: number;
  unitPrice?: number;
  unitMeasure?: string;
  availableColors?: Array<{ name: string; hex: string }>;
  finish?: string;
  description?: string;
  imageUrl?: string;
}

export interface PendingRequestData {
  surfaceType?: SurfaceType;
  areaM2?: number;
  colorName?: string;
  colorHex?: string;
  roomTitle?: string;
  productName?: string;
  finish?: string;
  notes?: string;
  catalogItem?: WarehouseInventoryItem;
  orderItemType?: 'pintura' | 'material';
  materialQuantity?: number;
}

export interface EmailNotification {
  id: string;
  toEmail: string;
  toName: string;
  fromEmail?: string;
  fromName?: string;
  subject: string;
  previewText?: string;
  sentAt: string;
  read: boolean;
  category: 'bienvenida' | 'cotizacion' | 'empaque' | 'despacho' | 'entrega' | 'general' | 'alerta' | string;
  requestCode?: string;
  htmlContent: string;
  plainText?: string;
  metadata?: Record<string, any>;
  hasAttachments?: boolean;
  dispatchedViaGmailApi?: boolean;
  dispatchedViaNetwork?: boolean;
  gmailMessageId?: string;
  networkDeliveryStatus?: string;
}



