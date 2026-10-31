import { PintucoProduct, StepThreadItem, SurfaceType, TechnicalCalculation, PaintRequest, UserProfile, WarehouseInventoryItem } from './types';
import { OFFICIAL_IMAGES } from './productImages';
import { isSameCity } from './utils/cityUtils';

export const THREAD_STEPS: StepThreadItem[] = [
  {
    id: 1,
    phaseCode: 'PASO 01',
    label: '1. Necesidad del cliente',
    desc: 'Captura de área, superficie, entorno y color deseado.',
  },
  {
    id: 2,
    phaseCode: 'PASO 02',
    label: '2. Solución técnica',
    desc: 'Cálculo de m², manos, dilución y formulación Pintuco.',
  },
  {
    id: 3,
    phaseCode: 'PASO 03',
    label: '3. Abastecimiento',
    desc: 'Disponibilidad en bodegas Pintuco y cálculo de envases.',
  },
  {
    id: 4,
    phaseCode: 'PASO 04',
    label: '4. Servicio y despacho',
    desc: 'Logística de entrega y cuadrilla de aplicación certificada.',
  },
  {
    id: 5,
    phaseCode: 'PASO 05',
    label: '5. Calidad y garantía',
    desc: 'Inspección de película, ficha técnica y certificado.',
  },
];

export const PINTUCO_PRODUCTS: PintucoProduct[] = [
  {
    id: 'viniltex-biocuidado',
    name: 'Viniltex® BioCuidado',
    line: 'Hogar y Construcción',
    category: 'Pintura Acrílica Premium Interior',
    description: 'Pintura antibacterial tipo 1 premium con tecnología que elimina el 99.9% de bacterias y hongos. Ultra lavable y bajo olor.',
    coveragePerGalM2: 50, // 50 m²/gal a 1 mano -> ~25 m²/gal a 2 manos
    recommendedHands: 2,
    dilution: 'Hasta 25% con agua potable',
    dryingTouchHours: 1,
    dryingTotalHours: 4,
    warrantyYears: 5,
    finishType: 'Mate',
    recommendedPrimer: 'sellomax-7en1',
    ecoFriendly: true,
    vocGramsLiter: 18,
    pricePerGalon: 98000,
    availableSizes: ['1/4 Galón', '1 Galón', 'Cuñete (5 Gal)'],
  },
  {
    id: 'koraza-maxima-proteccion',
    name: 'Koraza® Máxima Protección',
    line: 'Hogar y Construcción',
    category: 'Pintura Exterior Fachadas',
    description: 'Pintura 100% acrílica para exteriores. Alta resistencia a rayos UV, intemperie, lluvia ácida y formación de algas.',
    coveragePerGalM2: 40,
    recommendedHands: 2,
    dilution: 'Hasta 20% con agua potable',
    dryingTouchHours: 2,
    dryingTotalHours: 6,
    warrantyYears: 7,
    finishType: 'Satinado',
    recommendedPrimer: 'sellomax-7en1',
    ecoFriendly: true,
    vocGramsLiter: 30,
    pricePerGalon: 135000,
    availableSizes: ['1 Galón', 'Cuñete (5 Gal)'],
  },
  {
    id: 'pintulux-3en1',
    name: 'Pintulux® Máxima Protección 3 en 1',
    line: 'Metales y Esmaltes',
    category: 'Esmalte Anticorrosivo',
    description: 'Transforma el óxido, sirve de anticorrosivo y brinda acabado brillante superior en una sola aplicación sobre metales ferrosos.',
    coveragePerGalM2: 38,
    recommendedHands: 2,
    dilution: '10% con Ajustador Pintuco 21219',
    dryingTouchHours: 3,
    dryingTotalHours: 12,
    warrantyYears: 5,
    finishType: 'Brillante',
    recommendedPrimer: 'wash-primer-pintuco',
    ecoFriendly: false,
    vocGramsLiter: 220,
    pricePerGalon: 112000,
    availableSizes: ['1/4 Galón', '1 Galón', 'Cuñete (5 Gal)'],
  },
  {
    id: 'epoxico-alto-trafico',
    name: 'Pintucoat® Epóxico Poliamida 500',
    line: 'Alta Protección / Industrial',
    category: 'Recubrimiento Epóxico para Pisos',
    description: 'Sistema epóxico bicomponente de alta resistencia química, mecánica y a la abrasión para pisos de concreto y áreas industriales.',
    coveragePerGalM2: 30,
    recommendedHands: 2,
    dilution: '10% con Disolvente Epóxico Pintuco 121.096',
    dryingTouchHours: 4,
    dryingTotalHours: 24,
    warrantyYears: 8,
    finishType: 'Brillante',
    recommendedPrimer: 'imprimante-epoxico',
    ecoFriendly: false,
    vocGramsLiter: 180,
    pricePerGalon: 195000,
    availableSizes: ['1 Galón', 'Cuñete (5 Gal)'],
  },
  {
    id: 'sellomax-7en1',
    name: 'Sellomax® 7 en 1 Imprimante',
    line: 'Preparación y Fondos',
    category: 'Sellador Acrílico Base Agua',
    description: 'Fijador y sellador de superficies porosas, neutraliza alcalinidad, promueve adherencia y unifica absorción ahorrando pintura.',
    coveragePerGalM2: 45,
    recommendedHands: 1,
    dilution: 'Listo para usar o hasta 10% agua',
    dryingTouchHours: 1,
    dryingTotalHours: 3,
    warrantyYears: 5,
    finishType: 'Mate',
    ecoFriendly: true,
    vocGramsLiter: 12,
    pricePerGalon: 68000,
    availableSizes: ['1 Galón', 'Cuñete (5 Gal)'],
  },
  {
    id: 'madera-barniz-poliuretano',
    name: 'Maderprotect® Barniz Poliuretano',
    line: 'Maderas',
    category: 'Barniz Protector Decorativo',
    description: 'Protección hidrófuga con filtro UV para maderas interiores y exteriores con acabado sedoso de alta dureza.',
    coveragePerGalM2: 35,
    recommendedHands: 3,
    dilution: '10% Thinner Fino Pintuco',
    dryingTouchHours: 2,
    dryingTotalHours: 8,
    warrantyYears: 4,
    finishType: 'Semibrillante',
    ecoFriendly: false,
    vocGramsLiter: 250,
    pricePerGalon: 128000,
    availableSizes: ['1/4 Galón', '1 Galón'],
  },
];

export const PINTUCO_WAREHOUSES = [
  {
    city: 'Medellín',
    name: 'Centro Logístico Principal - Planta Rionegro',
    address: 'Autopista Medellín-Bogotá Km 38',
    stockStatus: 'Alto (98% disponibilidad)',
    avgDispatchHours: 12,
  },
  {
    city: 'Bogotá D.C.',
    name: 'Centro de Distribución Siberia Cundinamarca',
    address: 'Parque Industrial San Diego Bodega 4',
    stockStatus: 'Alto (95% disponibilidad)',
    avgDispatchHours: 18,
  },
  {
    city: 'Cali',
    name: 'Hub Regional Suroccidente Acopi Yumbo',
    address: 'Calle 15 # 28-90 Yumbo',
    stockStatus: 'Medio (91% disponibilidad)',
    avgDispatchHours: 24,
  },
  {
    city: 'Barranquilla',
    name: 'Planta y Logística Caribe Galapa',
    address: 'Vía La Cordialidad Km 9',
    stockStatus: 'Alto (94% disponibilidad)',
    avgDispatchHours: 24,
  },
  {
    city: 'Bucaramanga',
    name: 'Centro Logístico Oriente Girón',
    address: 'Anillo Vial Chimita Bodega 12',
    stockStatus: 'Medio (89% disponibilidad)',
    avgDispatchHours: 36,
  },
];

export function calculatePintucoSystem(
  surface: SurfaceType,
  areaM2: number,
  environment: string = 'interior'
): TechnicalCalculation {
  const safeArea = Math.max(1, areaM2 || 1);
  let recommendedProduct: PintucoProduct = PINTUCO_PRODUCTS[0];
  let primerProduct: PintucoProduct | undefined = PINTUCO_PRODUCTS[4]; // Sellomax
  let hands = 2;

  switch (surface) {
    case 'mamposteria_interior':
    case 'drywall_yeso':
      recommendedProduct = PINTUCO_PRODUCTS.find(p => p.id === 'viniltex-biocuidado') || PINTUCO_PRODUCTS[0];
      primerProduct = PINTUCO_PRODUCTS.find(p => p.id === 'sellomax-7en1');
      hands = 2;
      break;
    case 'fachada_exterior':
      recommendedProduct = PINTUCO_PRODUCTS.find(p => p.id === 'koraza-maxima-proteccion') || PINTUCO_PRODUCTS[1];
      primerProduct = PINTUCO_PRODUCTS.find(p => p.id === 'sellomax-7en1');
      hands = 2;
      break;
    case 'metal_ferroso':
      recommendedProduct = PINTUCO_PRODUCTS.find(p => p.id === 'pintulux-3en1') || PINTUCO_PRODUCTS[2];
      primerProduct = undefined;
      hands = 2;
      break;
    case 'concreto_piso':
      recommendedProduct = PINTUCO_PRODUCTS.find(p => p.id === 'epoxico-alto-trafico') || PINTUCO_PRODUCTS[3];
      primerProduct = undefined;
      hands = 2;
      break;
    case 'madera':
      recommendedProduct = PINTUCO_PRODUCTS.find(p => p.id === 'madera-barniz-poliuretano') || PINTUCO_PRODUCTS[5];
      primerProduct = undefined;
      hands = 3;
      break;
    case 'humedad_salitre':
      recommendedProduct = PINTUCO_PRODUCTS.find(p => p.id === 'koraza-maxima-proteccion') || PINTUCO_PRODUCTS[1];
      primerProduct = PINTUCO_PRODUCTS.find(p => p.id === 'sellomax-7en1');
      hands = 3;
      break;
    default:
      recommendedProduct = PINTUCO_PRODUCTS[0];
      hands = 2;
  }

  // Rendimiento práctico = rendimiento teórico * factor de eficiencia (0.85 para absorber rugosidad)
  const practicalCoverage = recommendedProduct.coveragePerGalM2 * 0.85;
  const totalAreaToCover = safeArea * hands;
  const rawGalons = totalAreaToCover / practicalCoverage;
  const totalGalons = Math.ceil(rawGalons * 10) / 10;

  const totalCuñetes = Math.floor(totalGalons / 5);
  const remainderGalons = Math.ceil(totalGalons % 5);

  const primerGalons = primerProduct ? Math.ceil((safeArea / (primerProduct.coveragePerGalM2 * 0.85)) * 10) / 10 : 0;

  const paintCost = (totalCuñetes * (recommendedProduct.pricePerGalon * 5 * 0.92)) + (remainderGalons * recommendedProduct.pricePerGalon);
  const estimatedMaterialCostCOP = Math.round(paintCost);

  // Insumos: Vacío por defecto en pedido de pintura (el cliente solo pide pintura, sin herramientas obligadas)
  const requiredSupplies: { name: string; quantity: number; unit: string }[] = [];

  const preparationAdvice = [
    'Verificar que la superficie esté completamente seca, limpia de polvo, grasa y pintura suelta.',
    primerProduct ? `Aplicar 1 mano uniforme de ${primerProduct.name} para sellar porosidad y maximizar adherencia.` : 'Desengrasar y lijar suavemente para generar perfil de anclaje.',
    `Respetar ${recommendedProduct.dryingTouchHours} hora(s) de secado entre manos y ${recommendedProduct.dryingTotalHours} horas para curado final.`,
  ];

  const applicationInstructions = [
    `Dilución recomendada: ${recommendedProduct.dilution}. Mezclar con espátula limpia en círculos.`,
    `Aplicar ${hands} manos cruzadas usando rodillo de felpa corta o equipo airless a 1800-2000 PSI.`,
    'Evitar aplicar bajo sol directo extremo o probabilidad de lluvia en las próximas 4 horas.',
  ];

  return {
    areaM2: safeArea,
    recommendedProduct,
    recommendedPrimerProduct: primerProduct,
    handsNeeded: hands,
    totalGalons,
    totalCuñetes,
    remainderGalons,
    primerGalons,
    requiredSupplies,
    estimatedMaterialCostCOP,
    preparationAdvice,
    applicationInstructions,
    warrantyDurationYears: recommendedProduct.warrantyYears,
  };
}

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'usr-adm-1',
    name: 'Ing. Carlos Restrepo (Director de Operaciones)',
    email: 'admin@pintuco.com',
    password: 'pintuco2026',
    role: 'administrador',
    company: 'Pintuco S.A. - Sede Principal',
    phone: '+57 300 882 1100',
    city: 'Medellín',
    badgeNumber: 'DIR-PTC-0042',
  },
  {
    id: 'usr-cli-1',
    name: 'Constructora Bolívar (Arq. Luisa Morales)',
    email: 'cliente@pintuco.com',
    password: 'pintuco2026',
    role: 'cliente',
    company: 'Constructora Bolívar S.A.',
    phone: '+57 312 458 9920',
    city: 'Medellín',
  },
  {
    id: 'usr-cli-bog',
    name: 'Constructora Capital Bogotá (Ing. David Mendoza)',
    email: 'clientebogota@pintuco.com',
    password: 'pintuco2026',
    role: 'cliente',
    company: 'Constructora Capital Bogotá S.A.S.',
    phone: '+57 310 892 4433',
    city: 'Bogotá D.C.',
  },
  {
    id: 'usr-emp-1',
    name: 'Javier Gómez (Líder de Bodega y Empaque)',
    email: 'empacador@pintuco.com',
    password: 'pintuco2026',
    role: 'empacador',
    company: 'CEDI Rionegro · Planta Pintuco',
    phone: '+57 314 620 7711',
    city: 'Medellín / Rionegro',
    badgeNumber: 'BOD-8812',
  },
  {
    id: 'usr-con-1',
    name: 'Wilson Cañas (Conductor Pintuco Express)',
    email: 'conductor@pintuco.com',
    password: 'pintuco2026',
    role: 'conductor',
    company: 'Flota Logística Pintuco',
    phone: '+57 311 754 9988',
    city: 'Medellín',
    vehiclePlate: 'WTL-582 (Camión NHR 3.5 Ton)',
    badgeNumber: 'LOG-TRK-109',
  },
];

export const INITIAL_REQUESTS: PaintRequest[] = [
  {
    id: 'req-001',
    requestCode: 'PTC-2026-8841',
    createdAt: '2026-08-30 08:30',
    clientName: 'Constructora Bolívar S.A.',
    clientEmail: 'cliente@pintuco.com',
    clientPhone: '+57 312 458 9920',
    deliveryAddress: 'Cra 43A # 18 Sur - 135, Torre 2 El Poblado, Medellín',
    city: 'Medellín',
    projectType: 'Comercial',
    surfaceType: 'fachada_exterior',
    environment: 'exterior',
    areaM2: 480,
    colorName: 'Blanco Lirio Silvestre 01',
    colorHex: '#f1f5f9',
    notes: 'Fachada principal edificio corporativo 4 niveles. Requiere alta resistencia a lluvia y hongos.',
    requiresApplicationService: true,
    status: 'abastecimiento',
    technicalCalculation: calculatePintucoSystem('fachada_exterior', 480, 'exterior'),
    inventoryAllocation: {
      warehouseCity: 'Medellín',
      warehouseName: 'Centro Logístico Principal - Planta Rionegro',
      batchNumber: 'LOTE-KOR-2026-B14',
      stockConfirmed: true,
      dispatchReadyDate: '2026-08-31',
    },
    packagingDetails: {
      packerId: 'usr-emp-1',
      packerName: 'Javier Gómez (CEDI Rionegro)',
      packedAt: '2026-08-30 10:15',
      batchCode: 'LOTE-KOR-2026-B14',
      checkedSupplies: [
        '5 Cuñetes Koraza® Máxima Protección (5 Gal)',
        '3 Galones Koraza® Máxima Protección',
      ],
      manualItems: [
        {
          id: 'item-001-c',
          description: 'Koraza® Máxima Protección (Color: Blanco Lirio Silvestre 01)',
          quantity: 5,
          unit: 'Cuñete (5 Gal)',
          notes: 'Lote de fábrica verificado',
          verified: true,
        },
        {
          id: 'item-001-g',
          description: 'Koraza® Máxima Protección (Color: Blanco Lirio Silvestre 01)',
          quantity: 3,
          unit: 'Galón (1 Gal)',
          notes: 'Galones individuales sellados',
          verified: true,
        },
      ],
      cuñetesPacked: 5,
      galonesPacked: 3,
      weightKg: 135.0,
      qualitySealAttached: true,
      qrInspectionCode: 'QR-PTC-99201-OK',
      status: 'empacado_listo',
      notes: 'Envases sellados herméticamente con precinto de seguridad Pintuco verificado.',
    },
    deliveryDetails: {
      driverId: 'usr-con-1',
      driverName: 'Wilson Cañas',
      driverPhone: '+57 311 754 9988',
      vehiclePlate: 'WTL-582',
      vehicleType: 'Camión NHR 3.5 Toneladas',
      currentLocation: 'Muelle 4 CEDI Rionegro - Listo para cargue',
      routeStatus: 'cargado_en_muelle',
      deliveryAddress: 'Cra 43A # 18 Sur - 135, El Poblado, Medellín',
      estimatedArrival: '14:30 Hoy',
    },
    serviceLogistics: {
      certifiedCrewAssigned: 'Cuadrilla Alfa - Pintores Maestros Pintuco',
      crewLead: 'Ing. Carlos Restrepo (Certificado #P-9021)',
      estimatedDeliveryDate: '2026-08-30',
      applicationStartDate: '2026-08-31',
      estimatedDays: 4,
      logisticsStatus: 'En alistamiento',
    },
    qualityCertificate: {
      certificateId: 'GAR-PTC-99124',
      inspectorName: 'Ing. Andrea Valencia Q.A.',
      adhesionTest: 'Excelente',
      substrateMoisture: 4.2,
      dryFilmThicknessMils: 4.8,
      warrantyIssuedDate: '2026-08-30',
      warrantyExpirationDate: '2033-08-30',
    },
    chatMessages: [
      {
        id: 'msg-seed-1',
        senderRole: 'conductor',
        senderName: 'Wilson Cañas (Conductor)',
        message: 'Hola Constructora Bolívar, te saluda Wilson Cañas. Tengo cargado tu pedido PTC-2026-8841 en el camión WTL-582. Salgo del CEDI hacia El Poblado.',
        timestamp: '11:20 AM',
        createdAtIso: '2026-08-30T11:20:00Z',
      },
      {
        id: 'msg-seed-2',
        senderRole: 'cliente',
        senderName: 'Constructora Bolívar S.A.',
        message: '¡Excelente Wilson! Te esperamos en la Cra 43A. El portero ya tiene la autorización de ingreso al parqueadero de carga.',
        timestamp: '11:24 AM',
        createdAtIso: '2026-08-30T11:24:00Z',
      },
    ],
  },
  {
    id: 'req-002',
    requestCode: 'PTC-2026-8842',
    createdAt: '2026-08-30 07:15',
    clientName: 'Clínica San Vicente de Paúl',
    clientEmail: 'infraestructura@sanvicente.org',
    clientPhone: '+57 300 671 2234',
    deliveryAddress: 'Calle 64 # 51D - 154, Bloque Quirófanos, Medellín',
    city: 'Medellín',
    projectType: 'Institucional',
    surfaceType: 'mamposteria_interior',
    environment: 'interior',
    areaM2: 240,
    colorName: 'Verde Quirófano & Blanco Higiene',
    colorHex: '#e6f4ea',
    notes: 'Pintura antibacterial con cero olor y rápido secado para pasillos de urgencias.',
    requiresApplicationService: true,
    status: 'servicio_despacho',
    technicalCalculation: calculatePintucoSystem('mamposteria_interior', 240, 'interior'),
    inventoryAllocation: {
      warehouseCity: 'Medellín',
      warehouseName: 'CEDI Rionegro Pintuco',
      batchNumber: 'LOTE-VTB-2026-BIO09',
      stockConfirmed: true,
      dispatchReadyDate: '2026-08-30',
    },
    packagingDetails: {
      packerId: 'usr-emp-1',
      packerName: 'Javier Gómez (CEDI Rionegro)',
      packedAt: '2026-08-30 08:45',
      batchCode: 'LOTE-VTB-2026-BIO09',
      checkedSupplies: [
        '2 Cuñetes Viniltex® BioCuidado (5 Gal)',
        '1 Galón Viniltex® BioCuidado',
      ],
      manualItems: [
        {
          id: 'item-002-c',
          description: 'Viniltex® BioCuidado (Color: Verde Quirófano & Blanco Higiene)',
          quantity: 2,
          unit: 'Cuñete (5 Gal)',
          notes: 'Grado hospitalario antibacterial',
          verified: true,
        },
        {
          id: 'item-002-g',
          description: 'Viniltex® BioCuidado (Color: Verde Quirófano & Blanco Higiene)',
          quantity: 1,
          unit: 'Galón (1 Gal)',
          notes: 'Envase sellado hermético',
          verified: true,
        },
      ],
      cuñetesPacked: 2,
      galonesPacked: 1,
      weightKg: 52.0,
      qualitySealAttached: true,
      qrInspectionCode: 'QR-PTC-BIO-882',
      status: 'empacado_listo',
    },
    deliveryDetails: {
      driverId: 'usr-con-1',
      driverName: 'Wilson Cañas',
      driverPhone: '+57 311 754 9988',
      vehiclePlate: 'WTL-582',
      vehicleType: 'Camión NHR 3.5 Toneladas',
      currentLocation: 'Autopista Norte Km 4 - En tránsito hacia la clínica',
      routeStatus: 'en_ruta',
      departedAt: '2026-08-30 10:30',
      estimatedArrival: '11:45 Hoy (Aproximándose)',
      deliveryAddress: 'Calle 64 # 51D - 154, Medellín',
      deliveryNotes: 'Ingreso por rampa de suministros médicos puerta 3.',
    },
    serviceLogistics: {
      certifiedCrewAssigned: 'Cuadrilla Hospitalaria Pintuco',
      crewLead: 'Téc. Mauricio Duarte',
      estimatedDeliveryDate: '2026-08-30',
      applicationStartDate: '2026-08-31',
      estimatedDays: 2,
      logisticsStatus: 'En ruta',
    },
    qualityCertificate: {
      certificateId: 'GAR-PTC-99125',
      inspectorName: 'Dra. Marcela Peña Q.A.',
      adhesionTest: 'Aprobado',
      substrateMoisture: 3.8,
      dryFilmThicknessMils: 3.5,
      warrantyIssuedDate: '2026-08-30',
      warrantyExpirationDate: '2031-08-30',
    },
  },
  {
    id: 'req-003',
    requestCode: 'PTC-2026-8843',
    createdAt: '2026-08-30 11:20',
    clientName: 'Industrias Metalmecánicas del Valle',
    clientEmail: 'produccion@metalvalle.co',
    clientPhone: '+57 318 901 3345',
    deliveryAddress: 'Zona Industrial Acopi, Carrera 32 # 14-80, Cali / Medellín',
    city: 'Medellín',
    projectType: 'Industrial',
    surfaceType: 'concreto_piso',
    environment: 'industrial',
    areaM2: 620,
    colorName: 'Gris Tráfico Industrial Epóxico',
    colorHex: '#64748b',
    notes: 'Piso de bodega de montacargas, requiere alta resistencia mecánica y a grasas.',
    requiresApplicationService: false,
    status: 'solicitud_recibida',
    technicalCalculation: calculatePintucoSystem('concreto_piso', 620, 'industrial'),
    inventoryAllocation: {
      warehouseCity: 'Medellín',
      warehouseName: 'Hub Regional CEDI Rionegro',
      batchNumber: 'LOTE-EPOX-500-Y2',
      stockConfirmed: true,
      dispatchReadyDate: '2026-09-01',
    },
  },
];

export const PINTUCO_INVENTORY: WarehouseInventoryItem[] = [
  {
    id: 'inv-01',
    sku: 'PTC-VIN-500-BL',
    productId: 'viniltex-biocuidado',
    productName: 'Viniltex® BioCuidado Antibacterial - Blanco Lirio',
    category: 'Arquitectónica Interior',
    warehouseCity: 'Medellín',
    warehouseName: 'CEDI Rionegro - Bodega Central',
    cuñetesAvailable: 480,
    galonesAvailable: 1250,
    quartsAvailable: 340,
    totalLiters: 13950,
    minStockAlert: 100,
    batchCode: 'LOTE-VIN500-2026-08',
    expirationDate: '2028-08-30',
    status: 'optimo',
    lastUpdated: '2026-08-30 08:30',
    pricePerGalon: 98000,
    unitType: 'pintura',
    finish: 'Mate Sedoso',
    description: 'Pintura premium tipo 1 con tecnología BioCuidado antibacterial y antihongos. Máxima lavabilidad y pureza de color.',
    imageUrl: OFFICIAL_IMAGES.tarroPintura,
    availableColors: [
      { name: 'Blanco Lirio Silvestre 01', hex: '#F9FAFB' },
      { name: 'Menta Salvia', hex: '#86DEB8' },
      { name: 'Luz de Arena', hex: '#FDF0B5' },
      { name: 'Azul Pizarra', hex: '#526C86' },
      { name: 'Blanco Caliza', hex: '#FCFBF6' },
    ],
  },
  {
    id: 'inv-02',
    sku: 'PTC-KOR-EXT-BL',
    productId: 'koraza-maxima-proteccion',
    productName: 'Koraza® 5 Máxima Protección Exterior',
    category: 'Fachadas Exteriores',
    warehouseCity: 'Medellín',
    warehouseName: 'CEDI Rionegro - Bodega Central',
    cuñetesAvailable: 320,
    galonesAvailable: 890,
    quartsAvailable: 150,
    totalLiters: 9550,
    minStockAlert: 80,
    batchCode: 'LOTE-KORAZA-2026-B1',
    expirationDate: '2029-01-15',
    status: 'optimo',
    lastUpdated: '2026-08-30 09:15',
    pricePerGalon: 135000,
    unitType: 'pintura',
    finish: 'Mate Impermeable',
    description: 'Pintura elastomérica 100% acrílica para exteriores. Escudo hidrófugo contra lluvia torrencial, hongos y radiación solar.',
    imageUrl: OFFICIAL_IMAGES.tarroFachada,
    availableColors: [
      { name: 'Blanco Nieve Fachada', hex: '#FFFFFF' },
      { name: 'Azul Pizarra Fachada', hex: '#526C86' },
      { name: 'Gris Basalto Arquitectónico', hex: '#3D4B58' },
      { name: 'Terracota Colonial', hex: '#C2674A' },
      { name: 'Luz de Arena Exterior', hex: '#FDF0B5' },
    ],
  },
  {
    id: 'inv-03',
    sku: 'PTC-EPOX-500-GR',
    productId: 'epoxico-alto-trafico',
    productName: 'Pintucoat® Epóxico Poliamida 500 Alto Tráfico',
    category: 'Industrial y Pisos',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 110,
    galonesAvailable: 340,
    quartsAvailable: 80,
    totalLiters: 3260,
    minStockAlert: 50,
    batchCode: 'LOTE-EPOX-BOG-2026',
    expirationDate: '2028-11-20',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:00',
    pricePerGalon: 195000,
    unitType: 'pintura',
    finish: 'Brillante Industrial',
    description: 'Recubrimiento epóxico de dos componentes con alta resistencia química y mecánica para pisos de bodegas y parqueaderos.',
    imageUrl: OFFICIAL_IMAGES.tarroEsmalte,
    availableColors: [
      { name: 'Gris Grafito Industrial', hex: '#3D4B58' },
      { name: 'Verde Seguridad Epóxico', hex: '#2A7B54' },
      { name: 'Gris Máquina Claro', hex: '#9CA3AF' },
      { name: 'Azul Señalización', hex: '#1E40AF' },
    ],
  },
  {
    id: 'inv-04',
    sku: 'PTC-INTUX-400-GR',
    productId: 'pintulux-3en1',
    productName: 'Pintulux® 3 en 1 Anticorrosivo Metales',
    category: 'Metales y Esmaltes',
    warehouseCity: 'Cali',
    warehouseName: 'Hub Regional Acopi Yumbo',
    cuñetesAvailable: 110,
    galonesAvailable: 420,
    quartsAvailable: 280,
    totalLiters: 3880,
    minStockAlert: 60,
    batchCode: 'LOTE-PLUX-CAL-2026',
    expirationDate: '2028-06-10',
    status: 'optimo',
    lastUpdated: '2026-08-30 10:00',
    pricePerGalon: 112000,
    unitType: 'pintura',
    finish: 'Brillante Metálico',
    description: 'Esmalte anticorrosivo de aplicación directa al metal sin necesidad de removedor previo. Transforma el óxido y aporta brillo.',
    imageUrl: OFFICIAL_IMAGES.tarroEsmalte,
    availableColors: [
      { name: 'Negro Forja Satinado', hex: '#1F2937' },
      { name: 'Blanco Puro Brillante', hex: '#FFFFFF' },
      { name: 'Verde Metal Carrocería', hex: '#14532D' },
      { name: 'Gris Plata Metalizado', hex: '#6B7280' },
    ],
  },
  {
    id: 'inv-05',
    sku: 'PTC-SELL-7EN1-TR',
    productId: 'sellomax-7en1',
    productName: 'Sellomax® 7 en 1 Imprimante Acrílico',
    category: 'Preparación y Fondos',
    warehouseCity: 'Barranquilla',
    warehouseName: 'Planta Caribe Galapa',
    cuñetesAvailable: 190,
    galonesAvailable: 510,
    quartsAvailable: 90,
    totalLiters: 5630,
    minStockAlert: 70,
    batchCode: 'LOTE-SELLO-BAQ-2026',
    expirationDate: '2028-12-05',
    status: 'optimo',
    lastUpdated: '2026-08-30 08:00',
    pricePerGalon: 68000,
    unitType: 'pintura',
    finish: 'Mate Sellador',
    description: 'Fondo imprimante transparente acrílico de alta penetración que sella porosidades, fija polvillo y reduce consumo de pintura final.',
    imageUrl: OFFICIAL_IMAGES.tarroPintura,
    availableColors: [
      { name: 'Transparente Ámbar Claro', hex: '#FDF0B5' },
      { name: 'Blanco Translúcido Sellador', hex: '#F3F4F6' },
    ],
  },
  {
    id: 'inv-06',
    sku: 'PTC-MAD-BARN-POL',
    productId: 'madera-barniz-poliuretano',
    productName: 'Maderprotect® Barniz Poliuretano Filtro UV',
    category: 'Maderas y Acabados',
    warehouseCity: 'Bucaramanga',
    warehouseName: 'CEDI Oriente Girón',
    cuñetesAvailable: 12,
    galonesAvailable: 65,
    quartsAvailable: 120,
    totalLiters: 480,
    minStockAlert: 30,
    batchCode: 'LOTE-MAD-BUC-2026',
    expirationDate: '2027-09-18',
    status: 'critico',
    lastUpdated: '2026-08-30 11:10',
    pricePerGalon: 128000,
    unitType: 'pintura',
    finish: 'Brillante Natural',
    description: 'Barniz poliuretánico de poro abierto con absorbedores UV para puertas, decks, pérgolas y carpintería arquitectónica.',
    imageUrl: OFFICIAL_IMAGES.tarroGalon,
    availableColors: [
      { name: 'Teca Natural Brillante', hex: '#B45309' },
      { name: 'Caoba Intenso', hex: '#78350F' },
      { name: 'Roble Claro Seda', hex: '#D97706' },
    ],
  },
  {
    id: 'inv-07',
    sku: 'PTC-VIN-BANC-BIO',
    productId: 'viniltex-banos-cocinas',
    productName: 'Viniltex® Baños & Cocinas Bio-Pruf® Antibacterial',
    category: 'Zonas Húmedas y Vapor',
    warehouseCity: 'Medellín',
    warehouseName: 'CEDI Rionegro - Bodega Central',
    cuñetesAvailable: 85,
    galonesAvailable: 340,
    quartsAvailable: 95,
    totalLiters: 3100,
    minStockAlert: 40,
    batchCode: 'LOTE-BIOPRUF-2026',
    expirationDate: '2028-10-15',
    status: 'optimo',
    lastUpdated: '2026-08-30 09:30',
    pricePerGalon: 118000,
    unitType: 'pintura',
    finish: 'Semibrillante Lavable',
    description: 'Pintura con aditivo Bio-Pruf® de alta resistencia al vapor caliente, salpicaduras continuas, grasa y formación de moho.',
    imageUrl: OFFICIAL_IMAGES.tarroPintura,
    availableColors: [
      { name: 'Brisa Caribeña Aqua', hex: '#27CBD2' },
      { name: 'Blanco Puro Lavable', hex: '#FFFFFF' },
      { name: 'Menta Suave Cocina', hex: '#86DEB8' },
    ],
  },
  {
    id: 'inv-08',
    sku: 'PTC-TRF-VIAL-AM',
    productId: 'pintutrafico-vial',
    productName: 'Pintutráfico® Vial y Parqueaderos Base Solvente',
    category: 'Vial y Señalización',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 60,
    galonesAvailable: 210,
    quartsAvailable: 30,
    totalLiters: 2350,
    minStockAlert: 35,
    batchCode: 'LOTE-TRF-2026-AM',
    expirationDate: '2028-04-10',
    status: 'optimo',
    lastUpdated: '2026-08-30 08:45',
    pricePerGalon: 142000,
    unitType: 'pintura',
    finish: 'Mate Reflectivo',
    description: 'Pintura de secado ultrarrápido formulada para demarcación vial, pasos peatonales, señalización de parqueaderos y rampas.',
    imageUrl: OFFICIAL_IMAGES.tarroGalon,
    availableColors: [
      { name: 'Amarillo Tráfico Reglamentario', hex: '#EAB308' },
      { name: 'Blanco Señalización Vial', hex: '#FFFFFF' },
      { name: 'Azul Accesibilidad PMR', hex: '#2563EB' },
    ],
  },
  // Insumos y Herramientas Pintuco en Inventario
  {
    id: 'inv-art-01',
    sku: 'PTC-ART-ROD-FCH',
    productName: 'Rodillo Pintuco Fachada Texturizado 9"',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Medellín',
    warehouseName: 'CEDI Rionegro - Bodega Central',
    cuñetesAvailable: 0,
    galonesAvailable: 450, // Unidades
    quartsAvailable: 0,
    totalLiters: 450,
    minStockAlert: 50,
    batchCode: 'LOTE-ROD-2026-A1',
    expirationDate: '2030-01-01',
    status: 'optimo',
    lastUpdated: '2026-08-30 08:00',
    pricePerGalon: 28000,
    unitPrice: 28000,
    unitMeasure: 'Unidad',
    unitType: 'herramienta',
    description: 'Rodillo profesional con tubo termofusionado y felpa de microfibra de alta carga para muros rugosos, estuco y fachadas exteriores.',
    imageUrl: OFFICIAL_IMAGES.rodilloPintura,
  },
  {
    id: 'inv-art-02',
    sku: 'PTC-ART-BRO-AZU',
    productName: 'Brocha Pintuco Cerda Azul Suave 2 1/2"',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Medellín',
    warehouseName: 'CEDI Rionegro - Bodega Central',
    cuñetesAvailable: 0,
    galonesAvailable: 620, // Unidades
    quartsAvailable: 0,
    totalLiters: 620,
    minStockAlert: 80,
    batchCode: 'LOTE-BRO-2026-02',
    expirationDate: '2030-01-01',
    status: 'optimo',
    lastUpdated: '2026-08-30 08:00',
    pricePerGalon: 18500,
    unitPrice: 18500,
    unitMeasure: 'Unidad',
    unitType: 'herramienta',
    description: 'Brocha con cerdas cónicas azules que no dejan marcas ni desprenden pelos. Mango ergonómico antideslizante para recortes limpios.',
    imageUrl: OFFICIAL_IMAGES.brochaPintura,
  },
  {
    id: 'inv-art-03',
    sku: 'PTC-ART-CIN-MSK',
    productName: 'Cinta de Enmascarar Pintuco Azul 1" (40m)',
    category: 'Insumos y Protección',
    warehouseCity: 'Medellín',
    warehouseName: 'CEDI Rionegro - Bodega Central',
    cuñetesAvailable: 0,
    galonesAvailable: 890, // Rollos
    quartsAvailable: 0,
    totalLiters: 890,
    minStockAlert: 100,
    batchCode: 'LOTE-CIN-2026-B',
    expirationDate: '2029-06-01',
    status: 'optimo',
    lastUpdated: '2026-08-30 08:00',
    pricePerGalon: 9200,
    unitPrice: 9200,
    unitMeasure: 'Rollo 40m',
    unitType: 'insumo',
    description: 'Cinta crepé con adhesivo de remoción limpia hasta por 14 días sin dejar residuos en marcos, zócalos, vidrio ni estucos secos.',
    imageUrl: OFFICIAL_IMAGES.cintaPintor,
  },
  {
    id: 'inv-art-04',
    sku: 'PTC-ART-BAN-PRO',
    productName: 'Bandeja Plástica Reforzada para Pintura 9"',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Cali',
    warehouseName: 'Hub Regional Acopi Yumbo',
    cuñetesAvailable: 0,
    galonesAvailable: 380,
    quartsAvailable: 0,
    totalLiters: 380,
    minStockAlert: 45,
    batchCode: 'LOTE-BAN-2026-C',
    expirationDate: '2030-01-01',
    status: 'optimo',
    lastUpdated: '2026-08-30 09:00',
    pricePerGalon: 14500,
    unitPrice: 14500,
    unitMeasure: 'Unidad',
    unitType: 'herramienta',
    description: 'Bandeja con estrías decantadoras que escurren uniformemente el rodillo para evitar salpicaduras y lograr un reparto perfecto.',
    imageUrl: OFFICIAL_IMAGES.bandejaPintura,
  },
  {
    id: 'inv-art-05',
    sku: 'PTC-ART-ESP-3IN',
    productName: 'Espátula Flexible de Acero Inoxidable 3"',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 0,
    galonesAvailable: 290,
    quartsAvailable: 0,
    totalLiters: 290,
    minStockAlert: 30,
    batchCode: 'LOTE-ESP-2026-BOG',
    expirationDate: '2030-01-01',
    status: 'optimo',
    lastUpdated: '2026-08-30 08:20',
    pricePerGalon: 16800,
    unitPrice: 16800,
    unitMeasure: 'Unidad',
    unitType: 'herramienta',
    description: 'Hoja de acero templado inoxidable con flexibilidad controlada para aplicar masillas, estucos y resanar imperfecciones.',
    imageUrl: OFFICIAL_IMAGES.espatulaPintor,
  },
  {
    id: 'inv-art-06',
    sku: 'PTC-ART-THI-FIN',
    productName: 'Thinner Fino Pintuco 21051 (1 Galón)',
    category: 'Insumos y Protección',
    warehouseCity: 'Barranquilla',
    warehouseName: 'Planta Caribe Galapa',
    cuñetesAvailable: 40,
    galonesAvailable: 210,
    quartsAvailable: 60,
    totalLiters: 1100,
    minStockAlert: 35,
    batchCode: 'LOTE-THI-2026-BAQ',
    expirationDate: '2029-08-10',
    status: 'optimo',
    lastUpdated: '2026-08-30 09:10',
    pricePerGalon: 38000,
    unitPrice: 38000,
    unitMeasure: 'Galón',
    unitType: 'insumo',
    description: 'Solvente fino de alta pureza para dilución de esmaltes, lacas, barnices y lavado técnico de pistolas y brochas profesionales.',
    imageUrl: OFFICIAL_IMAGES.solventeThinner,
  },
  {
    id: 'inv-art-07',
    sku: 'PTC-ART-LIJ-SET',
    productName: 'Pliego de Lija de Agua Grano 120 / 220 Alta Duración',
    category: 'Insumos y Protección',
    warehouseCity: 'Medellín',
    warehouseName: 'CEDI Rionegro - Bodega Central',
    cuñetesAvailable: 0,
    galonesAvailable: 1200,
    quartsAvailable: 0,
    totalLiters: 1200,
    minStockAlert: 150,
    batchCode: 'LOTE-LIJ-2026-M1',
    expirationDate: '2030-01-01',
    status: 'optimo',
    lastUpdated: '2026-08-30 09:00',
    pricePerGalon: 3500,
    unitPrice: 3500,
    unitMeasure: 'Pliego',
    unitType: 'insumo',
    description: 'Lija de carburo de silicio con soporte de papel impermeable para desbaste fino de paredes, masillas y pulido antes de pintar.',
    imageUrl: OFFICIAL_IMAGES.lijaGrano,
  },
  {
    id: 'inv-art-08',
    sku: 'PTC-ART-PLS-4X5',
    productName: 'Plástico Protector Cubretodo 4x5m (20 m²) Calibre 2',
    category: 'Insumos y Protección',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 0,
    galonesAvailable: 750,
    quartsAvailable: 0,
    totalLiters: 750,
    minStockAlert: 100,
    batchCode: 'LOTE-PLS-2026-B2',
    expirationDate: '2030-01-01',
    status: 'optimo',
    lastUpdated: '2026-08-30 09:20',
    pricePerGalon: 12900,
    unitPrice: 12900,
    unitMeasure: 'Rollo 4x5m',
    unitType: 'insumo',
    description: 'Polietileno de alta resistencia para cubrir pisos, muebles, zócalos y artefactos durante trabajos de pintura y remodelación.',
    imageUrl: OFFICIAL_IMAGES.plasticoCubretodo,
  },
  {
    id: 'inv-art-09',
    sku: 'PTC-ART-MAS-RES',
    productName: 'Masilla Acrílica Resanadora Grietas y Fisuras 1 Galón',
    category: 'Preparación y Fondos',
    warehouseCity: 'Cali',
    warehouseName: 'Hub Regional Acopi Yumbo',
    cuñetesAvailable: 15,
    galonesAvailable: 180,
    quartsAvailable: 45,
    totalLiters: 950,
    minStockAlert: 25,
    batchCode: 'LOTE-MAS-2026-YUM',
    expirationDate: '2028-11-01',
    status: 'optimo',
    lastUpdated: '2026-08-30 08:40',
    pricePerGalon: 48500,
    unitPrice: 48500,
    unitMeasure: 'Galón',
    unitType: 'insumo',
    finish: 'Mate Lijable',
    description: 'Pasta acrílica elástica de rápido secado para rellenar orificios, microfisuras y juntas en mampostería y paneles de yeso.',
    imageUrl: OFFICIAL_IMAGES.masillaResanador,
  },
  {
    id: 'inv-art-10',
    sku: 'PTC-ART-ACR-50',
    productName: 'Acronal® 50 Adhesivo & Sellamuro Concentrado 1 Galón',
    category: 'Preparación y Fondos',
    warehouseCity: 'Medellín',
    warehouseName: 'CEDI Rionegro - Bodega Central',
    cuñetesAvailable: 40,
    galonesAvailable: 220,
    quartsAvailable: 30,
    totalLiters: 1120,
    minStockAlert: 30,
    batchCode: 'LOTE-ACR-2026-01',
    expirationDate: '2028-09-30',
    status: 'optimo',
    lastUpdated: '2026-08-30 09:10',
    pricePerGalon: 56000,
    unitPrice: 56000,
    unitMeasure: 'Galón',
    unitType: 'pintura',
    finish: 'Transparente Puente',
    description: 'Resina concentrada copolímero estireno-acrílica para mejorar adherencia en morteros, estucos y sellado de pañetes arenosos.',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=700&q=80',
    availableColors: [
      { name: 'Translúcido Fijo 00', hex: '#FAF9F6' },
    ],
  },
  {
    id: 'inv-art-11',
    sku: 'PTC-ART-BRO-EXT',
    productName: 'Brocha Profesional Fachadas 4" Cerda Monofilamento',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Barranquilla',
    warehouseName: 'Planta Caribe Galapa',
    cuñetesAvailable: 0,
    galonesAvailable: 310,
    quartsAvailable: 0,
    totalLiters: 310,
    minStockAlert: 40,
    batchCode: 'LOTE-BRO4-2026',
    expirationDate: '2030-01-01',
    status: 'optimo',
    lastUpdated: '2026-08-30 08:30',
    pricePerGalon: 24500,
    unitPrice: 24500,
    unitMeasure: 'Unidad',
    unitType: 'herramienta',
    description: 'Brocha ancha de alta capacidad de carga con mango de madera ergonómico barnizado para recubrir grandes superficies y muros rugosos.',
    imageUrl: 'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'inv-bog-01',
    sku: 'PTC-VIN-BOG-01',
    productId: 'viniltex-biocuidado',
    productName: 'Viniltex® Avanzado Antiviral & Antibacterial Tipo 1',
    category: 'Paredes y Muros Interiores',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 180,
    galonesAvailable: 520,
    quartsAvailable: 110,
    totalLiters: 5850,
    minStockAlert: 50,
    batchCode: 'LOTE-VIN-BOG-2026',
    expirationDate: '2029-05-20',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:00',
    pricePerGalon: 89900,
    unitType: 'pintura',
    finish: 'Mate Lavable',
    description: 'Pintura premium para interiores en Bogotá. Máxima lavabilidad y cobertura superior para clima frío y templado.',
    imageUrl: OFFICIAL_IMAGES.tarroPintura,
    availableColors: [
      { name: 'Blanco Lirio Silvestre 01', hex: '#FAF9F6' },
      { name: 'Almendra Cálida 12', hex: '#EED9C4' },
      { name: 'Gris Nevado Urbano 08', hex: '#D1D5DB' },
      { name: 'Arena Sabana 04', hex: '#E5DCC5' },
    ],
  },
  {
    id: 'inv-bog-02',
    sku: 'PTC-KOR-BOG-01',
    productId: 'koraza-5',
    productName: 'Koraza® 5 Máxima Protección Fachadas Exteriores',
    category: 'Fachadas y Exteriores',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 140,
    galonesAvailable: 380,
    quartsAvailable: 70,
    totalLiters: 4320,
    minStockAlert: 40,
    batchCode: 'LOTE-KOR-BOG-2026',
    expirationDate: '2029-04-10',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:00',
    pricePerGalon: 135000,
    unitType: 'pintura',
    finish: 'Mate Impermeable',
    description: 'Pintura elastomérica para fachadas en Bogotá y Cundinamarca. Alta repelencia al agua y protección UV.',
    imageUrl: OFFICIAL_IMAGES.tarroFachada,
    availableColors: [
      { name: 'Blanco Nieve Fachada', hex: '#FFFFFF' },
      { name: 'Gris Basalto Andino', hex: '#3D4B58' },
      { name: 'Terracota Sabana', hex: '#C2674A' },
    ],
  },
  {
    id: 'inv-bog-03',
    sku: 'PTC-ART-ROD-BOG',
    productName: 'Rodillo Profesional Microfibra Cero Goteo 9" CEDI Siberia',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 0,
    galonesAvailable: 450,
    quartsAvailable: 0,
    totalLiters: 450,
    minStockAlert: 50,
    batchCode: 'LOTE-ROD-BOG-2026',
    expirationDate: '2030-01-01',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:00',
    pricePerGalon: 32000,
    unitPrice: 32000,
    unitMeasure: 'Unidad',
    unitType: 'herramienta',
    description: 'Rodillo microfibra de alta retención para muros lisos y estucados en Bogotá.',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'inv-bog-04',
    sku: 'PTC-ART-BRO-BOG',
    productName: 'Brocha Profesional Pintuco Cerda Monofilamento 2.5"',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 0,
    galonesAvailable: 380,
    quartsAvailable: 0,
    totalLiters: 380,
    minStockAlert: 40,
    batchCode: 'LOTE-BRO-BOG-2026',
    expirationDate: '2030-01-01',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:00',
    pricePerGalon: 18500,
    unitPrice: 18500,
    unitMeasure: 'Unidad',
    unitType: 'herramienta',
    description: 'Brocha recortadora para remates y esquinas de excelente precisión en Bogotá.',
    imageUrl: 'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'inv-bog-05',
    sku: 'PTC-PLUX-BOG-01',
    productId: 'pintulux-3en1',
    productName: 'Pintulux® Máxima Protección 3 en 1 Anticorrosivo Brillante',
    category: 'Metales y Esmaltes',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 95,
    galonesAvailable: 340,
    quartsAvailable: 160,
    totalLiters: 3260,
    minStockAlert: 50,
    batchCode: 'LOTE-PLUX-BOG-2026',
    expirationDate: '2029-07-15',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 112000,
    unitType: 'pintura',
    finish: 'Brillante Anticorrosivo',
    description: 'Esmalte de aplicación directa sobre metal y óxido. Protege vigas, rejas, puertas y perfiles estructurales en el clima de la Sabana.',
    imageUrl: OFFICIAL_IMAGES.tarroEsmalte,
    availableColors: [
      { name: 'Negro Forja Satinado', hex: '#1F2937' },
      { name: 'Blanco Puro Brillante', hex: '#FFFFFF' },
      { name: 'Rojo Óxido / Bermellón', hex: '#B91C1C' },
      { name: 'Gris Plata Metalizado', hex: '#6B7280' },
      { name: 'Azul Señalización Eléctrico', hex: '#1D4ED8' },
    ],
  },
  {
    id: 'inv-bog-06',
    sku: 'PTC-SELL-BOG-01',
    productId: 'sellomax-7en1',
    productName: 'Sellomax® 7 en 1 Imprimante Acrílico Antihumedad',
    category: 'Preparación y Fondos',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 160,
    galonesAvailable: 420,
    quartsAvailable: 90,
    totalLiters: 5200,
    minStockAlert: 60,
    batchCode: 'LOTE-SELLO-BOG-2026',
    expirationDate: '2029-08-10',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 68000,
    unitType: 'pintura',
    finish: 'Mate Sellador',
    description: 'Sellador fijador penetrante para revoques, pañetes y muros porosos en Bogotá. Bloquea eflorescencias y optimiza el rendimiento.',
    imageUrl: OFFICIAL_IMAGES.tarroPintura,
    availableColors: [
      { name: 'Blanco Sellador Base', hex: '#FAF9F6' },
      { name: 'Translúcido Bloqueador', hex: '#F3F4F6' },
    ],
  },
  {
    id: 'inv-bog-07',
    sku: 'PTC-MAD-BOG-01',
    productId: 'madera-barniz-poliuretano',
    productName: 'Maderprotect® Barniz Poliuretano Filtro UV Triple Protección',
    category: 'Maderas y Enmaderados',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 40,
    galonesAvailable: 280,
    quartsAvailable: 110,
    totalLiters: 1980,
    minStockAlert: 35,
    batchCode: 'LOTE-MAD-BOG-2026',
    expirationDate: '2028-11-30',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 128000,
    unitType: 'pintura',
    finish: 'Semibrillante Noble',
    description: 'Barniz uretanado de alto brillo y resistencia a rayaduras y radiación UV solar para pérgolas, decks, puertas y vigas de madera vista.',
    imageUrl: OFFICIAL_IMAGES.tarroGalon,
    availableColors: [
      { name: 'Caoba Imperial Clásico', hex: '#632A22' },
      { name: 'Teca Sabana Andina', hex: '#8B5A2B' },
      { name: 'Nogal Oscuro Elegance', hex: '#3B2314' },
      { name: 'Natural Transparente Sedoso', hex: '#D2B48C' },
    ],
  },
  {
    id: 'inv-bog-08',
    sku: 'PTC-ACRILUX-BOG-01',
    productId: 'viniltex-acrilux',
    productName: 'Viniltex® Acrilux Esmalte al Agua Bajo Olor Satinado',
    category: 'Esmaltes y Acabados al Agua',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 110,
    galonesAvailable: 360,
    quartsAvailable: 95,
    totalLiters: 4120,
    minStockAlert: 45,
    batchCode: 'LOTE-ACR-BOG-2026',
    expirationDate: '2029-06-25',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 108000,
    unitType: 'pintura',
    finish: 'Satinado Sedoso',
    description: 'Esmalte base acuosa de secado en 45 minutos y cero olor a solvente. Ideal para zócalos, puertas, clínicas, oficinas y viviendas habitadas.',
    imageUrl: OFFICIAL_IMAGES.tarroEsmalte,
    availableColors: [
      { name: 'Blanco Nieve Acrilux', hex: '#FFFFFF' },
      { name: 'Gris Grafito Urbano', hex: '#374151' },
      { name: 'Verde Salvia Nórdico', hex: '#9CA3AF' },
      { name: 'Marfil Suave', hex: '#FEF9C3' },
    ],
  },
  {
    id: 'inv-bog-09',
    sku: 'PTC-TRAF-BOG-01',
    productId: 'pintura-trafico-vial',
    productName: 'Pintura de Tráfico Vial Acrílica Alta Resistencia Pintuco',
    category: 'Demarcación y Señalización Vial',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 170,
    galonesAvailable: 490,
    quartsAvailable: 40,
    totalLiters: 5800,
    minStockAlert: 60,
    batchCode: 'LOTE-TRAF-BOG-2026',
    expirationDate: '2029-03-15',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 124000,
    unitType: 'pintura',
    finish: 'Mate Antideslizante Refractario',
    description: 'Pintura de demarcación de parqueaderos, vías, bodegas y zonas de carga con rápido secado en 15 minutos y alta resistencia a llantas calientes.',
    imageUrl: OFFICIAL_IMAGES.tarroGalon,
    availableColors: [
      { name: 'Amarillo Señalización Vial MOP', hex: '#FACC15' },
      { name: 'Blanco Tráfico Reflectivo', hex: '#F8FAFC' },
      { name: 'Azul Discapacitados / Parqueo', hex: '#2563EB' },
      { name: 'Negro Contraste Vial', hex: '#111827' },
    ],
  },
  {
    id: 'inv-bog-10',
    sku: 'PTC-IMP-BOG-01',
    productId: 'koraza-impermeabilizante-techos',
    productName: 'Koraza® Impermeabilizante Fibrado Techos & Terrazas 7 Años',
    category: 'Impermeabilización y Cubiertas',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 140,
    galonesAvailable: 390,
    quartsAvailable: 60,
    totalLiters: 4850,
    minStockAlert: 50,
    batchCode: 'LOTE-IMP-BOG-2026',
    expirationDate: '2029-08-20',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 142000,
    unitType: 'pintura',
    finish: 'Membrana Elastomérica Fibrada',
    description: 'Recubrimiento elastomérico fibrado con microfibras de polipropileno incorporadas que puentean fisuras en losas de concreto, cubiertas y terrazas.',
    imageUrl: OFFICIAL_IMAGES.tarroFachada,
    availableColors: [
      { name: 'Rojo Teja Colonial Andino', hex: '#991B1B' },
      { name: 'Gris Niebla Refractario', hex: '#64748B' },
      { name: 'Blanco Aislante Térmico Solar', hex: '#F8FAFC' },
      { name: 'Verde Foresta Terraza', hex: '#166534' },
    ],
  },
  {
    id: 'inv-bog-11',
    sku: 'PTC-MASTIC-BOG-01',
    productId: 'pintucoat-mastic-altos-solidos',
    productName: 'Pintucoat® Epóxico Mastic de Altos Sólidos Barrera Química',
    category: 'Industrial y Pisos',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 85,
    galonesAvailable: 260,
    quartsAvailable: 45,
    totalLiters: 2790,
    minStockAlert: 40,
    batchCode: 'LOTE-MASTIC-BOG-2026',
    expirationDate: '2028-10-15',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 215000,
    unitType: 'pintura',
    finish: 'Semibrillante Barrera Química',
    description: 'Epóxico poliamina tolerante a superficies con preparación manual. Máxima resistencia a derrames químicos, ácidos, álcalis y ambientes salinos.',
    imageUrl: OFFICIAL_IMAGES.tarroEsmalte,
    availableColors: [
      { name: 'Gris Naval Estructural', hex: '#4B5563' },
      { name: 'Rojo Óxido Mastic', hex: '#7F1D1D' },
      { name: 'Aluminio Barrera Metálica', hex: '#9CA3AF' },
    ],
  },
  {
    id: 'inv-bog-12',
    sku: 'PTC-ESTUCO-BOG-01',
    productId: 'estuco-acrilico-exterior',
    productName: 'Estuco Profesional Acrílico Alta Resistencia Listo para Usar',
    category: 'Preparación y Fondos',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 190,
    galonesAvailable: 420,
    quartsAvailable: 0,
    totalLiters: 6050,
    minStockAlert: 60,
    batchCode: 'LOTE-EST-BOG-2026',
    expirationDate: '2028-12-01',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 48000,
    unitType: 'pintura',
    finish: 'Pasta Lisa Extrablanca',
    description: 'Masilla plástica acrílica lista para aplicar con llana metálica sobre revoques y mampostería. Fácil lijado y cero caleo.',
    imageUrl: OFFICIAL_IMAGES.masillaResanador,
    availableColors: [
      { name: 'Blanco Extraliso Estuco', hex: '#FFFFFF' },
    ],
  },
  {
    id: 'inv-bog-13',
    sku: 'PTC-MAT-BAN-BOG-01',
    productName: 'Bandeja Plástica Reforzada para Pintor 9" con Nervaduras Antideslizantes',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 0,
    galonesAvailable: 520,
    quartsAvailable: 0,
    totalLiters: 520,
    minStockAlert: 60,
    batchCode: 'LOTE-BAN-BOG-2026',
    expirationDate: '2032-01-01',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 14500,
    unitPrice: 14500,
    unitMeasure: 'Unidad',
    unitType: 'herramienta',
    description: 'Bandeja de polipropileno de alto impacto con zona de escurrido estriada para carga homogénea de rodillos de hasta 9 pulgadas.',
    imageUrl: OFFICIAL_IMAGES.bandejaPintura,
  },
  {
    id: 'inv-bog-14',
    sku: 'PTC-MAT-CIN-AZUL-BOG',
    productName: 'Cinta de Enmascarar Pintor Azul UV 24mm x 50m (Líneas Nítidas)',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 0,
    galonesAvailable: 680,
    quartsAvailable: 0,
    totalLiters: 680,
    minStockAlert: 80,
    batchCode: 'LOTE-CINAZ-BOG-2026',
    expirationDate: '2030-01-01',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 12900,
    unitPrice: 12900,
    unitMeasure: 'Rollo',
    unitType: 'insumo',
    description: 'Cinta azul de papel crepado resistente a rayos UV por 14 días. No deja residuos de pegante y garantiza bordes limpios y perfectos.',
    imageUrl: OFFICIAL_IMAGES.cintaPintor,
  },
  {
    id: 'inv-bog-15',
    sku: 'PTC-MAT-CIN-48-BOG',
    productName: 'Cinta de Enmascarar Uso General Crepe 48mm x 40m Pintuco',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 0,
    galonesAvailable: 590,
    quartsAvailable: 0,
    totalLiters: 590,
    minStockAlert: 60,
    batchCode: 'LOTE-CIN48-BOG-2026',
    expirationDate: '2030-01-01',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 9800,
    unitPrice: 9800,
    unitMeasure: 'Rollo',
    unitType: 'insumo',
    description: 'Cinta ancha para protección de marcos, rodapiés, vidrios y zócalos durante trabajos de pintura interior y exterior.',
    imageUrl: OFFICIAL_IMAGES.cintaPintor,
  },
  {
    id: 'inv-bog-16',
    sku: 'PTC-MAT-ESP-4-BOG',
    productName: 'Espátula Flexible Acero Inoxidable 4" Mango Bimaterial Ergonómico',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 0,
    galonesAvailable: 380,
    quartsAvailable: 0,
    totalLiters: 380,
    minStockAlert: 40,
    batchCode: 'LOTE-ESP4-BOG-2026',
    expirationDate: '2032-01-01',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 16500,
    unitPrice: 16500,
    unitMeasure: 'Unidad',
    unitType: 'herramienta',
    description: 'Hoja de acero inoxidable pulido espejo con flexión calibrada para resanar grietas, raspar pintura suelta y aplicar masilla.',
    imageUrl: OFFICIAL_IMAGES.espatulaPintor,
  },
  {
    id: 'inv-bog-17',
    sku: 'PTC-MAT-ESP-6-BOG',
    productName: 'Espátula Ancha Acero Templado 6" para Estucado y Acabados',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 0,
    galonesAvailable: 320,
    quartsAvailable: 0,
    totalLiters: 320,
    minStockAlert: 35,
    batchCode: 'LOTE-ESP6-BOG-2026',
    expirationDate: '2032-01-01',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 19800,
    unitPrice: 19800,
    unitMeasure: 'Unidad',
    unitType: 'herramienta',
    description: 'Espátula ancha para emparejar revoques, juntas de drywall y acabados lisos en paneles de yeso.',
    imageUrl: OFFICIAL_IMAGES.espatulaPintor,
  },
  {
    id: 'inv-bog-18',
    sku: 'PTC-MAT-LIJ-180-BOG',
    productName: 'Lija de Agua Grano 180 Pintuco Carburo de Silicio (Paquete x 10 Hojas)',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 0,
    galonesAvailable: 490,
    quartsAvailable: 0,
    totalLiters: 490,
    minStockAlert: 50,
    batchCode: 'LOTE-LIJ180-BOG-2026',
    expirationDate: '2030-01-01',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 11500,
    unitPrice: 11500,
    unitMeasure: 'Paquete x 10',
    unitType: 'insumo',
    description: 'Papel impermeable antidesgarro con grano de carburo de silicio para nivelado de estucos, imprimantes y pastas.',
    imageUrl: OFFICIAL_IMAGES.lijaGrano,
  },
  {
    id: 'inv-bog-19',
    sku: 'PTC-MAT-LIJ-240-BOG',
    productName: 'Lija de Agua Grano 240 / 320 Acabado Fino Esmaltes y Barnices (Paquete x 10)',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 0,
    galonesAvailable: 440,
    quartsAvailable: 0,
    totalLiters: 440,
    minStockAlert: 40,
    batchCode: 'LOTE-LIJ240-BOG-2026',
    expirationDate: '2030-01-01',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 12500,
    unitPrice: 12500,
    unitMeasure: 'Paquete x 10',
    unitType: 'insumo',
    description: 'Lija ultra fina especial para asentar barnices de poliuretano, pinturas epóxicas y esmaltes entre manos.',
    imageUrl: OFFICIAL_IMAGES.lijaGrano,
  },
  {
    id: 'inv-bog-20',
    sku: 'PTC-MAT-EXT-ALUM-BOG',
    productName: 'Extensión Telescópica de Aluminio Reforzado 2m a 4m para Rodillo',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 0,
    galonesAvailable: 240,
    quartsAvailable: 0,
    totalLiters: 240,
    minStockAlert: 30,
    batchCode: 'LOTE-EXT-BOG-2026',
    expirationDate: '2032-01-01',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 48900,
    unitPrice: 48900,
    unitMeasure: 'Unidad',
    unitType: 'herramienta',
    description: 'Pértiga telescópica liviana de alta rigidez con seguro de rosca y acople universal para pintar techos y fachadas sin andamio.',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'inv-bog-21',
    sku: 'PTC-MAT-PLA-20M-BOG',
    productName: 'Plástico Protector Cubretodo Calibre 2 Extra Resistente 4m x 5m (20 m²)',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 0,
    galonesAvailable: 850,
    quartsAvailable: 0,
    totalLiters: 850,
    minStockAlert: 100,
    batchCode: 'LOTE-PLA-BOG-2026',
    expirationDate: '2032-01-01',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 8500,
    unitPrice: 8500,
    unitMeasure: 'Unidad',
    unitType: 'insumo',
    description: 'Lámina de polietileno virgen para cubrir pisos, muebles, alfombras y maquinaria de salpicaduras y polvo.',
    imageUrl: OFFICIAL_IMAGES.plasticoCubretodo,
  },
  {
    id: 'inv-bog-22',
    sku: 'PTC-MAT-SEL-GRIET-BOG',
    productName: 'Sellador Elastomérico Grietas y Fisuras Pintable 300ml',
    category: 'Preparación y Fondos',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 0,
    galonesAvailable: 410,
    quartsAvailable: 0,
    totalLiters: 410,
    minStockAlert: 45,
    batchCode: 'LOTE-SELG-BOG-2026',
    expirationDate: '2028-10-01',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 22000,
    unitPrice: 22000,
    unitMeasure: 'Cartucho 300ml',
    unitType: 'insumo',
    description: 'Sellador acrílico con elongación del 300% para calafatear grietas dinámicas en fachadas, marcos de ventanas y juntas de dilatación.',
    imageUrl: OFFICIAL_IMAGES.masillaResanador,
  },
  {
    id: 'inv-bog-23',
    sku: 'PTC-MAT-THI-21219-BOG',
    productName: 'Ajustador / Disolvente Pintuco 21219 para Esmaltes y Pintulux 1 Galón',
    category: 'Preparación y Fondos',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 30,
    galonesAvailable: 310,
    quartsAvailable: 0,
    totalLiters: 460,
    minStockAlert: 35,
    batchCode: 'LOTE-THI-BOG-2026',
    expirationDate: '2029-12-01',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 38500,
    unitPrice: 38500,
    unitMeasure: 'Galón',
    unitType: 'insumo',
    description: 'Solvente aromático balanceado para dilución precisa de pinturas al aceite, esmaltes Pintulux y barnices sin opacar el brillo.',
    imageUrl: OFFICIAL_IMAGES.solventeThinner,
  },
  {
    id: 'inv-bog-24',
    sku: 'PTC-MAT-ROD-EPOX-BOG',
    productName: 'Rodillo Tubo Fenólico Resistente a Solventes 9" para Epóxicos y Tráfico',
    category: 'Herramientas y Aplicación',
    warehouseCity: 'Bogotá D.C.',
    warehouseName: 'CEDI Siberia Cundinamarca',
    cuñetesAvailable: 0,
    galonesAvailable: 360,
    quartsAvailable: 0,
    totalLiters: 360,
    minStockAlert: 40,
    batchCode: 'LOTE-RODEPOX-BOG-2026',
    expirationDate: '2032-01-01',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:30',
    pricePerGalon: 28500,
    unitPrice: 28500,
    unitMeasure: 'Unidad',
    unitType: 'herramienta',
    description: 'Rodillo con núcleo fenólico resistente a disolventes fuertes y epóxicos. No desprende felpa ni se deforma bajo solventes industriales.',
    imageUrl: OFFICIAL_IMAGES.rodilloPintura,
  },
  {
    id: 'inv-cal-01',
    sku: 'PTC-VIN-CAL-01',
    productId: 'viniltex-biocuidado',
    productName: 'Viniltex® Avanzado Antibacterial Tipo 1 CEDI Cali',
    category: 'Paredes y Muros Interiores',
    warehouseCity: 'Cali',
    warehouseName: 'Hub Regional Acopi Yumbo',
    cuñetesAvailable: 150,
    galonesAvailable: 430,
    quartsAvailable: 90,
    totalLiters: 4800,
    minStockAlert: 40,
    batchCode: 'LOTE-VIN-CAL-2026',
    expirationDate: '2029-06-15',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:00',
    pricePerGalon: 89900,
    unitType: 'pintura',
    finish: 'Mate Lavable',
    description: 'Pintura tipo 1 con tecnología antihongos para climas cálidos y húmedos del Valle del Cauca.',
    imageUrl: OFFICIAL_IMAGES.tarroPintura,
    availableColors: [
      { name: 'Blanco Lirio Silvestre 01', hex: '#FAF9F6' },
      { name: 'Marfil Tropical 03', hex: '#FFFDD0' },
    ],
  },
  {
    id: 'inv-cal-02',
    sku: 'PTC-KOR-CAL-01',
    productId: 'koraza-5',
    productName: 'Koraza® 5 Fachadas Exteriores CEDI Cali',
    category: 'Fachadas y Exteriores',
    warehouseCity: 'Cali',
    warehouseName: 'Hub Regional Acopi Yumbo',
    cuñetesAvailable: 120,
    galonesAvailable: 310,
    quartsAvailable: 60,
    totalLiters: 3600,
    minStockAlert: 35,
    batchCode: 'LOTE-KOR-CAL-2026',
    expirationDate: '2029-05-10',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:00',
    pricePerGalon: 135000,
    unitType: 'pintura',
    finish: 'Mate Impermeable',
    description: 'Protección para fachadas exteriores en Cali y el Valle del Cauca.',
    imageUrl: OFFICIAL_IMAGES.tarroFachada,
    availableColors: [
      { name: 'Blanco Nieve Fachada', hex: '#FFFFFF' },
      { name: 'Ocre Colonial', hex: '#CC7722' },
    ],
  },
  {
    id: 'inv-baq-01',
    sku: 'PTC-VIN-BAQ-01',
    productId: 'viniltex-biocuidado',
    productName: 'Viniltex® Avanzado Antibacterial Tipo 1 CEDI Barranquilla',
    category: 'Paredes y Muros Interiores',
    warehouseCity: 'Barranquilla',
    warehouseName: 'Planta Caribe Galapa',
    cuñetesAvailable: 130,
    galonesAvailable: 390,
    quartsAvailable: 80,
    totalLiters: 4250,
    minStockAlert: 35,
    batchCode: 'LOTE-VIN-BAQ-2026',
    expirationDate: '2029-06-10',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:00',
    pricePerGalon: 89900,
    unitType: 'pintura',
    finish: 'Mate Lavable',
    description: 'Pintura lavable formulada para resistir la salinidad y humedad del Caribe.',
    imageUrl: OFFICIAL_IMAGES.tarroPintura,
    availableColors: [
      { name: 'Blanco Lirio Silvestre 01', hex: '#FAF9F6' },
      { name: 'Arena Caribe 06', hex: '#E6D7B9' },
    ],
  },
  {
    id: 'inv-buc-01',
    sku: 'PTC-VIN-BUC-01',
    productId: 'viniltex-biocuidado',
    productName: 'Viniltex® Avanzado Antibacterial Tipo 1 CEDI Bucaramanga',
    category: 'Paredes y Muros Interiores',
    warehouseCity: 'Bucaramanga',
    warehouseName: 'CEDI Bucaramanga - Santander',
    cuñetesAvailable: 110,
    galonesAvailable: 320,
    quartsAvailable: 70,
    totalLiters: 3500,
    minStockAlert: 30,
    batchCode: 'LOTE-VIN-BUC-2026',
    expirationDate: '2029-06-05',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:00',
    pricePerGalon: 89900,
    unitType: 'pintura',
    finish: 'Mate Lavable',
    description: 'Pintura arquitectónica tipo 1 para muros interiores en Santander.',
    imageUrl: OFFICIAL_IMAGES.tarroPintura,
    availableColors: [
      { name: 'Blanco Lirio Silvestre 01', hex: '#FAF9F6' },
      { name: 'Gris Niebla 05', hex: '#E2E8F0' },
    ],
  },
  {
    id: 'inv-buc-02',
    sku: 'PTC-KOR-BUC-01',
    productId: 'koraza-5',
    productName: 'Koraza® 5 Fachadas CEDI Bucaramanga',
    category: 'Fachadas y Exteriores',
    warehouseCity: 'Bucaramanga',
    warehouseName: 'CEDI Bucaramanga - Santander',
    cuñetesAvailable: 95,
    galonesAvailable: 280,
    quartsAvailable: 50,
    totalLiters: 2950,
    minStockAlert: 25,
    batchCode: 'LOTE-KOR-BUC-2026',
    expirationDate: '2029-05-01',
    status: 'optimo',
    lastUpdated: '2026-09-01 08:00',
    pricePerGalon: 135000,
    unitType: 'pintura',
    finish: 'Mate Impermeable',
    description: 'Pintura exterior de alta durabilidad para Santander.',
    imageUrl: OFFICIAL_IMAGES.tarroFachada,
    availableColors: [
      { name: 'Blanco Nieve Fachada', hex: '#FFFFFF' },
      { name: 'Gris Pizarra Andino', hex: '#475569' },
    ],
  },
];

/**
 * Mapeo de superficie a id de producto Pintuco
 */
export function getProductIdForSurface(surface: SurfaceType): string {
  switch (surface) {
    case 'mamposteria_interior':
    case 'drywall_yeso':
      return 'viniltex-biocuidado';
    case 'fachada_exterior':
    case 'humedad_salitre':
      return 'koraza-maxima-proteccion';
    case 'metal_ferroso':
      return 'pintulux-3en1';
    case 'concreto_piso':
      return 'epoxico-alto-trafico';
    case 'madera':
      return 'madera-barniz-poliuretano';
    default:
      return 'viniltex-biocuidado';
  }
}

/**
 * Consulta la disponibilidad de inventario para un producto o superficie
 */
export function checkInventoryStock(
  productIdOrSurface: string | SurfaceType,
  inventory: WarehouseInventoryItem[],
  preferredCity?: string
): {
  isAvailable: boolean;
  item?: WarehouseInventoryItem;
  matchingItems: WarehouseInventoryItem[];
  totalCuñetes: number;
  totalGalones: number;
  warehouseCity: string;
  warehouseName: string;
  status: 'optimo' | 'alerta_reposicion' | 'critico' | 'agotado';
  stockMessage: string;
} {
  // Resolver id de producto si se pasó un surface
  const productId = productIdOrSurface.includes('_')
    ? getProductIdForSurface(productIdOrSurface as SurfaceType)
    : productIdOrSurface;

  // Buscar todos los ítems en inventario que correspondan a este producto
  const matchingItems = inventory.filter((item) => {
    if (item.productId === productId) return true;
    if (item.id === productId || item.sku === productId) return true;
    // Búsqueda por similitud de nombre
    const prod = PINTUCO_PRODUCTS.find((p) => p.id === productId);
    if (prod && item.productName.toLowerCase().includes(prod.name.toLowerCase().split(' ')[0])) {
      return true;
    }
    return false;
  });

  if (matchingItems.length === 0) {
    return {
      isAvailable: false,
      matchingItems: [],
      totalCuñetes: 0,
      totalGalones: 0,
      warehouseCity: preferredCity || 'CEDI Central',
      warehouseName: 'Bodega Pintuco',
      status: 'agotado',
      stockMessage: 'Producto no registrado en inventario por el Administrador.',
    };
  }

  // Filtrar o priorizar la ciudad preferida si se especificó
  let targetItem = matchingItems.find(
    (item) => preferredCity && isSameCity(item.warehouseCity, preferredCity)
  );
  if (!targetItem) {
    targetItem = matchingItems[0];
  }

  // Sumar existencias totales
  const totalCuñetes = matchingItems.reduce((acc, i) => acc + (i.cuñetesAvailable || 0), 0);
  const totalGalones = matchingItems.reduce((acc, i) => acc + (i.galonesAvailable || 0), 0);

  // Un ítem está disponible si el stock total > 0 y no está marcado como agotado
  const isAvailable =
    (totalCuñetes > 0 || totalGalones > 0) &&
    targetItem.status !== 'agotado' &&
    (targetItem.cuñetesAvailable > 0 || targetItem.galonesAvailable > 0);

  let stockMessage = '';
  if (!isAvailable) {
    stockMessage = `AGOTADO: Sin existencias en CEDI ${targetItem.warehouseCity}. Pendiente de reposición.`;
  } else if (targetItem.status === 'critico') {
    stockMessage = `Stock crítico en ${targetItem.warehouseCity}: ${targetItem.cuñetesAvailable} Cuñetes / ${targetItem.galonesAvailable} Gal.`;
  } else {
    stockMessage = `Disponible en CEDI ${targetItem.warehouseCity}: ${targetItem.cuñetesAvailable} Cuñetes / ${targetItem.galonesAvailable} Gal.`;
  }

  return {
    isAvailable,
    item: targetItem,
    matchingItems,
    totalCuñetes,
    totalGalones,
    warehouseCity: targetItem.warehouseCity,
    warehouseName: targetItem.warehouseName,
    status: isAvailable ? targetItem.status : 'agotado',
    stockMessage,
  };
}

/**
 * Determina si un producto corresponde a Pintura (requiere selección de color y cálculo de volumen)
 * o si es un Material / Insumo / Herramienta (requiere selección de cantidad directa).
 */
export function isPaintProduct(item?: {
  productName?: string;
  name?: string;
  category?: string;
  unitType?: string;
  sku?: string;
}): boolean {
  if (!item) return true; // Por defecto pintura
  if (item.unitType === 'pintura') return true;
  if (item.unitType === 'herramienta' || item.unitType === 'insumo') return false;

  const text = `${item.sku || ''} ${item.productName || ''} ${item.name || ''} ${item.category || ''}`.toLowerCase();

  if (
    text.includes('rodillo') ||
    text.includes('brocha') ||
    text.includes('cinta') ||
    text.includes('lija') ||
    text.includes('bandeja') ||
    text.includes('espatula') ||
    text.includes('espátula') ||
    text.includes('herramienta') ||
    text.includes('insumo')
  ) {
    return false;
  }

  return true;
}

/**
 * Obtiene la imagen de alta calidad para cualquier producto de inventario o insumo
 */
export function getProductImage(item?: {
  imageUrl?: string;
  productName?: string;
  name?: string;
  category?: string;
  unitType?: string;
  sku?: string;
}): string {
  if (item?.imageUrl) return item.imageUrl;

  const text = `${item?.sku || ''} ${item?.productName || ''} ${item?.name || ''} ${item?.category || ''}`.toLowerCase();

  // 1. MATERIALES / HERRAMIENTAS / INSUMOS:
  if (text.includes('rodillo')) {
    return OFFICIAL_IMAGES.rodilloPintura;
  }
  if (text.includes('brocha')) {
    return OFFICIAL_IMAGES.brochaPintura;
  }
  if (text.includes('cinta')) {
    return OFFICIAL_IMAGES.cintaPintor;
  }
  if (text.includes('bandeja')) {
    return OFFICIAL_IMAGES.bandejaPintura;
  }
  if (text.includes('espatula') || text.includes('espátula')) {
    return OFFICIAL_IMAGES.espatulaPintor;
  }
  if (text.includes('lija')) {
    return OFFICIAL_IMAGES.lijaGrano;
  }
  if (text.includes('plastico') || text.includes('plástico') || text.includes('cubretodo')) {
    return OFFICIAL_IMAGES.plasticoCubretodo;
  }
  if (text.includes('masilla') || text.includes('resanador') || text.includes('resanar')) {
    return OFFICIAL_IMAGES.masillaResanador;
  }
  if (text.includes('thinner') || text.includes('solvente')) {
    return OFFICIAL_IMAGES.solventeThinner;
  }

  // 2. PINTURAS (TARROS DE PINTURA / CUÑETES):
  if (text.includes('koraza') || text.includes('fachada') || text.includes('intemperie')) {
    return OFFICIAL_IMAGES.tarroFachada;
  }
  if (text.includes('epox') || text.includes('pintucoat') || text.includes('piso') || text.includes('mastic') || text.includes('pintulux') || text.includes('metal') || text.includes('esmalte') || text.includes('anticorrosivo')) {
    return OFFICIAL_IMAGES.tarroEsmalte;
  }
  if (text.includes('madera') || text.includes('barniz') || text.includes('maderprotect') || text.includes('trafico') || text.includes('tráfico') || text.includes('vial') || text.includes('galon')) {
    return OFFICIAL_IMAGES.tarroGalon;
  }

  // Tarro de pintura oficial por defecto para cualquier pintura
  return OFFICIAL_IMAGES.tarroPintura;
}

