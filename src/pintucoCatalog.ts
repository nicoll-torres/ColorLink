import { PintucoProduct, SurfaceType, TechnicalCalculation } from './types';

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
