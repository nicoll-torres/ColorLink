import React, { useState } from 'react';
import { UserProfile, PaintRequest, WarehouseInventoryItem, SurfaceType } from '../types';
import { isPaintProduct, getProductImage } from '../data';
import {
  Sparkles,
  Sliders,
  Layers,
  MapPin,
  Building,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Droplet,
  Boxes,
  Database,
  ArrowRight,
  LogOut,
  User,
  Search,
  Check,
  Clock,
  Phone,
  Calendar,
  ExternalLink,
  Palette,
  Wrench,
  ShoppingCart,
  Ban,
  Tag,
  Plus,
  Minus,
  X,
  Mail,
  Eye,
  Bell,
  ShoppingBag,
} from '../icons';
import { MainNavbar } from './MainNavbar';

interface PintucoHomePageProps {
  currentUser: UserProfile | null;
  requests: PaintRequest[];
  inventory: WarehouseInventoryItem[];
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenTechnicalSheets?: () => void;
  onNavigateAmbientes?: () => void;
  emailUnreadCount?: number;
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onNavigateToPortal: () => void;
  onOpenCalculator: () => void;
  onOpenAiAssistant: () => void;
  onOpenSupabaseModal: () => void;
  onOpenEmailInbox?: () => void;
  onLogout: () => void;
  onSelectColorAndQuote?: (colorName: string, colorHex: string) => void;
  onSelectRoomAndQuote?: (surface: SurfaceType, productName: string, colorTag: string) => void;
  onSelectCalculationAndQuote?: (surface: SurfaceType, areaM2: number, productName: string) => void;
  onSelectCatalogItemAndBuy?: (
    item: WarehouseInventoryItem,
    options?: { colorName?: string; colorHex?: string; quantity?: number; presentation?: 'cuñete' | 'galon' | 'unidad' }
  ) => void;
  onSelectSpaceAndQuote?: (space: {
    id: string;
    title: string;
    tag: string;
    productName: string;
    surface: SurfaceType;
    colorName: string;
    colorHex: string;
    areaM2: number;
    finish?: string;
    desc?: string;
  }) => void;
}

interface ColorSwatch {
  name: string;
  hex: string;
  code: string;
  family: 'Brisa Marina' | 'Neutros Cálidos' | 'Verdes Botánicos' | 'Arenas & Lino' | 'Terracotas & Ocre';
  desc: string;
  recommendedFinish: string;
}

export interface FormulatedSpaceItem {
  id: string;
  title: string;
  tag: string;
  img: string;
  colorHex: string;
  colorName: string;
  productName: string;
  surface: SurfaceType;
  areaM2: number;
  finish: string;
  desc: string;
  estimatedGalonsText: string;
  priceEstimateCOP: number;
}

const COLOR_PALETTE: ColorSwatch[] = [
  {
    name: 'Brisa Caribeña',
    hex: '#27CBD2',
    code: 'CL-01 AQUA',
    family: 'Brisa Marina',
    desc: 'Aqua vibrante y luminoso que evoca la brisa de la costa y revitaliza los espacios sociales.',
    recommendedFinish: 'Satinado o Mate Suave',
  },
  {
    name: 'Menta Salvia',
    hex: '#86DEB8',
    code: 'CL-02 MINT',
    family: 'Brisa Marina',
    desc: 'Verde menta suave que aporta frescura, sensación de amplitud y serenidad mental.',
    recommendedFinish: 'Mate Sedoso',
  },
  {
    name: 'Azul Pizarra',
    hex: '#526C86',
    code: 'CL-03 SLATE',
    family: 'Brisa Marina',
    desc: 'Azul pizarra arquitectónico para muros de acento elegantes, estudios y fachadas.',
    recommendedFinish: 'Satinado Resistente',
  },
  {
    name: 'Mar Profundo',
    hex: '#2C3844',
    code: 'CL-04 NAVY',
    family: 'Brisa Marina',
    desc: 'Gris marengo profundo con matices marinos, ideal para carpintería, zócalos y contrastes.',
    recommendedFinish: 'Mate Aterciopelado',
  },
  {
    name: 'Luz de Arena',
    hex: '#FDF0B5',
    code: 'CL-05 SAND',
    family: 'Arenas & Lino',
    desc: 'Tono arena cálido y solar que amplifica la luminosidad natural en salas y pasillos.',
    recommendedFinish: 'Mate Sedoso',
  },
  {
    name: 'Lino Crudo',
    hex: '#F7F4EA',
    code: 'CL-06 LINEN',
    family: 'Arenas & Lino',
    desc: 'Neutral atemporal con matiz lino orgánico que armoniza con maderas y fibras naturales.',
    recommendedFinish: 'Mate Bajo Brillo',
  },
  {
    name: 'Blanco Caliza',
    hex: '#FCFBF6',
    code: 'CL-07 CHALK',
    family: 'Neutros Cálidos',
    desc: 'Blanco roto cálido sin reflejos azulados fríos, formulado para cielos y fondos amplios.',
    recommendedFinish: 'Mate Antirreflejo',
  },
  {
    name: 'Gris Basalto',
    hex: '#3D4B58',
    code: 'CL-08 BASALT',
    family: 'Neutros Cálidos',
    desc: 'Gris contemporáneo sobrio de alto contraste para herrería, puertas y detalles modernos.',
    recommendedFinish: 'Semibrillante o Mate',
  },
  {
    name: 'Verde Eucalipto',
    hex: '#70CCA7',
    code: 'CL-09 EUCALYPT',
    family: 'Verdes Botánicos',
    desc: 'Matiz botánico refrescante que integra el verdor de jardines y terrazas al interior.',
    recommendedFinish: 'Mate Sedoso',
  },
  {
    name: 'Verde Bosque Andino',
    hex: '#2F5C4B',
    code: 'CL-10 FOREST',
    family: 'Verdes Botánicos',
    desc: 'Verde bosque profundo inspirado en las cordilleras para rincones de lectura y bibliotecas.',
    recommendedFinish: 'Satinado Suave',
  },
  {
    name: 'Terracota Colonial',
    hex: '#C2674A',
    code: 'CL-11 TERRA',
    family: 'Terracotas & Ocre',
    desc: 'Tierra cocida cálida inspirada en la arquitectura artesanal de Barichara y Villa de Leyva.',
    recommendedFinish: 'Mate Texturado',
  },
  {
    name: 'Ocre Silvestre',
    hex: '#D4A24E',
    code: 'CL-12 OCHRE',
    family: 'Terracotas & Ocre',
    desc: 'Amarillo ocre natural que infunde energía cálida y personalidad en comedores y terrazas.',
    recommendedFinish: 'Satinado',
  },
];

const ROOM_CATEGORIES = [
  {
    id: 'sala',
    title: 'Sala & Estar',
    badge: 'INTERIORES',
    desc: 'Áreas sociales de alto tránsito familiar donde la durabilidad, fácil lavado y la ausencia de olores fuertes son clave.',
    productName: 'Viniltex® Avanzada Bio-Cuidado',
    finish: 'Mate Sedoso · 2 Manos Recomendadas',
    specText: 'Fórmula antibacterial Bio-Pruf® que neutraliza 99.9% de hongos y bacterias.',
    surface: 'mamposteria_interior' as SurfaceType,
    icon: <Building className="w-5 h-5" />,
    colorTag: 'Brisa Marina & Neutros',
  },
  {
    id: 'fachadas',
    title: 'Fachadas & Balcones',
    badge: 'EXTERIORES',
    desc: 'Protección elástica continua contra lluvia ácida, rayos UV intensos y choque térmico del clima colombiano.',
    productName: 'Koraza® 5 Años Protección Total',
    finish: 'Satinado Antialgas · 2 Manos',
    specText: 'Resina 100% acrílica que sella microfisuras y repele la acumulación de hollín.',
    surface: 'fachada_exterior' as SurfaceType,
    icon: <ShieldCheck className="w-5 h-5" />,
    colorTag: 'Arenas & Slate',
  },
  {
    id: 'alcoba',
    title: 'Alcobas & Descanso',
    badge: 'CONFORT & PAZ',
    desc: 'Espacios de reposo que requieren pigmentos de absorción suave, bajo COV y cero reflejos luminosos.',
    productName: 'Viniltex® Seda Aterciopelada',
    finish: 'Seda Mate · 2 Manos',
    specText: 'Acabado terso al tacto, secado rápido y fórmula ecológica certificada.',
    surface: 'drywall_yeso' as SurfaceType,
    icon: <Sparkles className="w-5 h-5" />,
    colorTag: 'Menta & Caliza',
  },
  {
    id: 'banos_cocinas',
    title: 'Cocinas & Baños',
    badge: 'ZONAS HÚMEDAS',
    desc: 'Muros expuestos a vapor continuo de agua caliente, humedad por condensación y salpicaduras de grasa.',
    productName: 'Viniltex® Baños & Cocinas',
    finish: 'Semibrillante Lavable · 2 Manos',
    specText: 'Película ultra cerrada impermeable con fungicidas activos de larga duración.',
    surface: 'humedad_salitre' as SurfaceType,
    icon: <Droplet className="w-5 h-5" />,
    colorTag: 'Aqua & Blancos',
  },
  {
    id: 'pisos',
    title: 'Pisos & Parqueaderos',
    badge: 'ALTO TRÁFICO',
    desc: 'Recubrimiento epóxico bicomponente de alta resistencia a la abrasión y tránsito de llantas calientes.',
    productName: 'Pintucoat® Epóxico Poliamida 500',
    finish: 'Brillante Industrial · 2 Manos',
    specText: 'Resistencia mecánica a solventes, aceites automotrices y tráfico pesado.',
    surface: 'concreto_piso' as SurfaceType,
    icon: <Truck className="w-5 h-5" />,
    colorTag: 'Basalto & Pizarra',
  },
  {
    id: 'metales',
    title: 'Metales & Portones',
    badge: 'ANTICORROSIVO',
    desc: 'Esmalte 3 en 1 de aplicación directa sobre hierro o aluminio sin requerir removedores agresivos.',
    productName: 'Pintulux® Máxima Protección 3 en 1',
    finish: 'Brillante Metálico · 2 Manos',
    specText: 'Transforma el óxido existente, actúa de primer anticorrosivo y otorga brillo.',
    surface: 'metal_ferroso' as SurfaceType,
    icon: <Layers className="w-5 h-5" />,
    colorTag: 'Mar Profundo & Ocre',
  },
];

const MARQUEE_ITEMS: FormulatedSpaceItem[] = [
  {
    id: 'space-sala-brisa',
    title: 'Sala Abierta Brisa Marina',
    tag: 'SALA RESIDENCIAL',
    img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=85',
    colorHex: '#86DEB8',
    colorName: 'Menta Salvia',
    productName: 'Viniltex® Avanzado Antibacterial',
    surface: 'mamposteria_interior',
    areaM2: 65,
    finish: 'Mate Sedoso',
    desc: 'Formulación lavable de alta pureza con tecnología antibacterial de bajo olor para áreas sociales.',
    estimatedGalonsText: '1 Cuñete (5 Gal) + 1 Galón',
    priceEstimateCOP: 245000,
  },
  {
    id: 'space-fachada-rosales',
    title: 'Fachada Moderna Los Rosales',
    tag: 'EXTERIORES KORAZA®',
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=85',
    colorHex: '#526C86',
    colorName: 'Azul Pizarra',
    productName: 'Koraza® 5 Años Protección Total',
    surface: 'fachada_exterior',
    areaM2: 120,
    finish: 'Mate Impermeable',
    desc: 'Barrera elastomérica de máxima resistencia contra lluvias torrenciales, rayos UV y hongos de fachada.',
    estimatedGalonsText: '2 Cuñetes (10 Gal)',
    priceEstimateCOP: 480000,
  },
  {
    id: 'space-alcoba-caliza',
    title: 'Alcoba Serena Caliza',
    tag: 'DORMITORIO & CONFORT',
    img: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=85',
    colorHex: '#FCFBF6',
    colorName: 'Blanco Caliza',
    productName: 'Viniltex® Seda & Bio-Cuidado',
    surface: 'mamposteria_interior',
    areaM2: 45,
    finish: 'Satinado Confort',
    desc: 'Reflexión de luz suave y relajante diseñada para dormitorios principales y alcobas de descanso.',
    estimatedGalonsText: '4 Galones',
    priceEstimateCOP: 198000,
  },
  {
    id: 'space-cocina-comedor',
    title: 'Cocina & Comedor Contemporáneo',
    tag: 'BIO-PRUF® ANTIHONGOS',
    img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=85',
    colorHex: '#27CBD2',
    colorName: 'Brisa Caribeña',
    productName: 'Viniltex® Baños & Cocinas Bio-Pruf®',
    surface: 'humedad_salitre',
    areaM2: 50,
    finish: 'Semibrillante Lavable',
    desc: 'Formulación de alta densidad antimicrobiana resistente a grasa caliente, salpicaduras y vapores.',
    estimatedGalonsText: '1 Cuñete (5 Gal)',
    priceEstimateCOP: 225000,
  },
  {
    id: 'space-terraza-llanogrande',
    title: 'Terraza Campestre Llanogrande',
    tag: 'LUZ DE ARENA',
    img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=85',
    colorHex: '#FDF0B5',
    colorName: 'Luz de Arena',
    productName: 'Koraza® Máxima Protección Sol & Lluvia',
    surface: 'fachada_exterior',
    areaM2: 85,
    finish: 'Satinado Exterior',
    desc: 'Polímeros con filtro solar UV reforzado para terrazas exteriores, balcones y climas cambiantes.',
    estimatedGalonsText: '1 Cuñete (5 Gal) + 2 Galones',
    priceEstimateCOP: 360000,
  },
  {
    id: 'space-piso-logistico',
    title: 'Piso Epóxico Centro Logístico',
    tag: 'INDUSTRIAL 500',
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=85',
    colorHex: '#3D4B58',
    colorName: 'Gris Grafito Industrial',
    productName: 'Pintuepoxi® 500 Tráfico Pesado',
    surface: 'concreto_piso',
    areaM2: 150,
    finish: 'Brillante Industrial',
    desc: 'Sistema epóxico 100% sólidos para pisos de concreto con tráfico continuo de montacargas.',
    estimatedGalonsText: '3 Cuñetes Industriales',
    priceEstimateCOP: 790000,
  },
];

const REAL_PROJECTS = [
  {
    title: 'Edificio Residencial Altos del Poblado',
    city: 'Medellín, Antioquia',
    room: 'FACHADA EXTERIOR',
    product: 'Koraza® 5 Años Protección Total',
    colorName: 'Azul Pizarra & Caliza',
    colorHex: '#526C86',
    m2: '1,450 m²',
    review: '"El cálculo técnico de manos y la entrega directa en obra desde el CEDI Rionegro nos ahorró 3 días de cronograma sin desperdicios."',
    client: 'Constructora Hábitat Andino · Arq. Carolina M.',
    img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Casa Campestre San Antonio',
    city: 'Rionegro, Antioquia',
    room: 'INTERIORES COMPLETOS',
    product: 'Viniltex® Seda & Bio-Cuidado',
    colorName: 'Menta Salvia & Luz de Arena',
    colorHex: '#86DEB8',
    m2: '380 m²',
    review: '"La simulación del color en el mockup y la formulación técnica en cuñetes exactos fue idéntica al resultado en pared."',
    client: 'Familia Restrepo Gaviria',
    img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Restaurante & Terraza La Casona',
    city: 'Cali / San Antonio',
    room: 'ZONAS HÚMEDAS & PISOS',
    product: 'Pintuepoxi® 500 + Baños & Cocinas',
    colorName: 'Terracota Colonial',
    colorHex: '#C2674A',
    m2: '290 m²',
    review: '"Excelente resistencia a grasa y tráfico de servicio. La factura DIAN y la garantía certificada Pintuco nos dieron total respaldo."',
    client: 'Grupo Gastronómico del Valle',
    img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
  },
];

export const PintucoHomePage: React.FC<PintucoHomePageProps> = ({
  currentUser,
  requests,
  inventory,
  cartCount = 0,
  onOpenCart,
  onOpenTechnicalSheets,
  onNavigateAmbientes,
  emailUnreadCount = 0,
  onNavigateToLogin,
  onNavigateToRegister,
  onNavigateToPortal,
  onOpenCalculator,
  onOpenAiAssistant,
  onOpenSupabaseModal,
  onOpenEmailInbox,
  onLogout,
  onSelectColorAndQuote,
  onSelectRoomAndQuote,
  onSelectCalculationAndQuote,
  onSelectCatalogItemAndBuy,
  onSelectSpaceAndQuote,
}) => {
  const [activeFamily, setActiveFamily] = useState<string>('Todos');
  const [selectedSwatch, setSelectedSwatch] = useState<ColorSwatch>(COLOR_PALETTE[0]);
  const [customColorInput, setCustomColorInput] = useState<string>('#27CBD2');

  // Estado para Espacios Reales Formulados (Agregar al Pedido y Modal Técnico)
  const [selectedSpaceModal, setSelectedSpaceModal] = useState<FormulatedSpaceItem | null>(null);
  const [spaceAddedToast, setSpaceAddedToast] = useState<string | null>(null);

  const handleSelectSpace = (space: FormulatedSpaceItem) => {
    setSpaceAddedToast(`¡Fórmula de "${space.title}" agregada a tu pedido!`);
    setTimeout(() => {
      setSpaceAddedToast(null);
      if (onSelectSpaceAndQuote) {
        onSelectSpaceAndQuote(space);
      } else if (onSelectRoomAndQuote) {
        onSelectRoomAndQuote(space.surface, space.productName, space.colorName);
      } else if (currentUser) {
        onNavigateToPortal();
      } else {
        onNavigateToRegister();
      }
    }, 400);
  };

  // Calculadora Rápida
  const [calcArea, setCalcArea] = useState<number>(65);
  const [calcSurface, setCalcSurface] = useState<SurfaceType>('mamposteria_interior');

  const filteredSwatches =
    activeFamily === 'Todos'
      ? COLOR_PALETTE
      : COLOR_PALETTE.filter((s) => s.family === activeFamily);

  // Cálculo Rápido de Rendimiento
  const computeQuickCalculation = () => {
    const area = Math.max(1, calcArea || 1);
    let coverage = 45;
    let productName = 'Viniltex® Avanzada';
    let unitPrice = 115000;

    if (calcSurface === 'fachada_exterior') {
      coverage = 40;
      productName = 'Koraza® 5 Años';
      unitPrice = 135000;
    } else if (calcSurface === 'concreto_piso') {
      coverage = 30;
      productName = 'Pintuepoxi® 500';
      unitPrice = 195000;
    } else if (calcSurface === 'metal_ferroso') {
      coverage = 38;
      productName = 'Pintulux® 3 en 1';
      unitPrice = 112000;
    }

    const practicalCoverage = coverage * 0.85;
    const totalAreaTwoHands = area * 2;
    const totalGalones = Math.ceil((totalAreaTwoHands / practicalCoverage) * 10) / 10;
    const cuñetes = Math.floor(totalGalones / 5);
    const galonesSueltos = Math.ceil(totalGalones % 5);
    const costoEstimado =
      cuñetes * (unitPrice * 5 * 0.92) + galonesSueltos * unitPrice;

    return {
      productName,
      totalGalones,
      cuñetes,
      galonesSueltos,
      costoEstimado: Math.round(costoEstimado),
    };
  };

  const quickCalc = computeQuickCalculation();

  // Estado para el Catálogo Oficial & Tienda de Pinturas en Vivo
  const [storeSearch, setStoreSearch] = useState('');
  const [storeCategory, setStoreCategory] = useState<string>('todos');
  const [storeWarehouseFilter, setStoreWarehouseFilter] = useState<string>('todos');
  const [storeModalItem, setStoreModalItem] = useState<WarehouseInventoryItem | null>(null);
  const [storeModalColor, setStoreModalColor] = useState<{ name: string; hex: string }>({
    name: 'Blanco Lirio Silvestre 01',
    hex: '#F1F5F9',
  });
  const [storeModalFormat, setStoreModalFormat] = useState<'galon' | 'cuñete'>('galon');
  const [storeModalQty, setStoreModalQty] = useState<number>(1);

  const filteredStoreInventory = inventory.filter((item) => {
    const isPaint = isPaintProduct(item);
    const matchesSearch =
      item.productName.toLowerCase().includes(storeSearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(storeSearch.toLowerCase()) ||
      item.warehouseCity.toLowerCase().includes(storeSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(storeSearch.toLowerCase());

    const matchesWarehouse =
      storeWarehouseFilter === 'todos' || item.warehouseCity.toLowerCase() === storeWarehouseFilter.toLowerCase();

    let matchesCategory = true;
    if (storeCategory === 'pinturas') {
      matchesCategory = isPaint;
    } else if (storeCategory === 'herramientas') {
      matchesCategory = !isPaint && (item.category.toLowerCase().includes('herramienta') || item.unitType === 'herramienta');
    } else if (storeCategory === 'insumos') {
      matchesCategory = !isPaint && (item.category.toLowerCase().includes('insumo') || item.category.toLowerCase().includes('proteccion') || item.unitType === 'insumo');
    } else if (storeCategory === 'disponibles') {
      const units = isPaint ? (item.cuñetesAvailable * 5 + item.galonesAvailable) : (item.unitsAvailable ?? item.galonesAvailable ?? 0);
      matchesCategory = units > 0 && item.status !== 'agotado';
    } else if (storeCategory !== 'todos') {
      matchesCategory = item.category.toLowerCase().includes(storeCategory.toLowerCase());
    }

    return matchesSearch && matchesWarehouse && matchesCategory;
  });

  const storePaintsCount = inventory.filter(i => isPaintProduct(i)).length;
  const storeToolsCount = inventory.filter(i => !isPaintProduct(i) && (i.category.toLowerCase().includes('herramienta') || i.unitType === 'herramienta')).length;
  const storeSuppliesCount = inventory.filter(i => !isPaintProduct(i) && !i.category.toLowerCase().includes('herramienta') && i.unitType !== 'herramienta').length;

  const handleOpenStoreModal = (item: WarehouseInventoryItem, color?: { name: string; hex: string }) => {
    setStoreModalItem(item);
    setStoreModalQty(1);
    setStoreModalFormat('galon');
    if (color) {
      setStoreModalColor(color);
    } else if (item.availableColors && item.availableColors.length > 0) {
      setStoreModalColor(item.availableColors[0]);
    } else {
      setStoreModalColor({ name: 'Blanco Lirio Silvestre 01', hex: '#F1F5F9' });
    }
  };

  const handleConfirmStoreModal = () => {
    if (!storeModalItem) return;
    if (onSelectCatalogItemAndBuy) {
      onSelectCatalogItemAndBuy(storeModalItem, {
        colorName: storeModalColor.name,
        colorHex: storeModalColor.hex,
        quantity: storeModalQty,
        presentation: storeModalFormat,
      });
    } else if (currentUser) {
      onNavigateToPortal();
    } else {
      onNavigateToRegister();
    }
    setStoreModalItem(null);
  };

  const handleApplySelectedColor = () => {
    if (onSelectColorAndQuote) {
      onSelectColorAndQuote(selectedSwatch.name, selectedSwatch.hex);
    } else {
      if (currentUser) {
        onNavigateToPortal();
      } else {
        onNavigateToRegister();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased">
      {/* ==========================================================
          NAVBAR COLORLINK OFICIAL · PLATAFORMA EMPRESARIAL
          ========================================================== */}
      {/* ==========================================================
          NAVBAR COLORLINK OFICIAL · DISEÑO EXACTO SEGÚN LA IMAGEN
          ========================================================== */}
      <MainNavbar
        currentUser={currentUser}
        cartCount={cartCount}
        activeSection="catalogo"
        onNavigateHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateCatalog={() => {
          const el = document.getElementById('catalogo');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
          else window.scrollTo({ top: 900, behavior: 'smooth' });
        }}
        onOpenCalculator={onOpenCalculator}
        onNavigatePalettes={() => {
          const el = document.getElementById('paleta-color');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenTechnicalSheets={() => {
          if (onOpenTechnicalSheets) onOpenTechnicalSheets();
        }}
        onNavigateAmbientes={() => {
          const el = document.getElementById('ambientes');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (onNavigateAmbientes) {
            onNavigateAmbientes();
          }
        }}
        onOpenCart={() => {
          if (onOpenCart) onOpenCart();
        }}
        onNavigateLogin={onNavigateToLogin}
        onNavigatePortal={onNavigateToPortal}
        onLogout={onLogout}
        onOpenSupabaseModal={onOpenSupabaseModal}
        onOpenEmailInbox={onOpenEmailInbox}
        emailUnreadCount={emailUnreadCount}
      />

      {/* ==========================================================
          HERO SECTION
          ========================================================== */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            <span>SISTEMA DE PINTURA INTELIGENTE & FORMULACIÓN TÉCNICA</span>
          </div>

          <h1 className="hero-title">
            El color perfecto para cada espacio, formulado con{' '}
            <span className="highlight-text">precisión técnica</span>
          </h1>

          <p className="hero-subtitle">
            ColorLink transforma tus ideas arquitectónicas en especificaciones exactas respaldadas por la ciencia de recubrimientos Pintuco. Rendimiento milimétrico de manos y galones, disponibilidad en CEDIs y despacho directo a pie de obra.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              onClick={currentUser ? onNavigateToPortal : onNavigateToRegister}
              className="btn-primary btn-lg"
            >
              <span>+ Formular mi Proyecto</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenCalculator}
              className="btn-secondary btn-lg"
            >
              <Sliders className="w-4 h-4 text-[#199ea5]" />
              <span>Calculadora de Pintura m²</span>
            </button>

          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-num">5 CEDIs</span>
              <span className="stat-label">Bogotá, Med, Cali, Bq, Bga</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num">100% Precisión</span>
              <span className="stat-label">Cálculo de manos y m²</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num">24-48h</span>
              <span className="stat-label">Despacho a pie de obra</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num">5 a 8 Años</span>
              <span className="stat-label">Garantía certificada</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================
          INFINITE MARQUEE DE ESPACIOS REALES FORMULADOS
          ========================================================== */}
      <section className="marquee-wrapper" id="espacios-reales">
        <div className="marquee-header-strip">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#199ea5] animate-ping" />
              <div className="badge-pill !mb-0 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#199ea5]" />
                <span className="font-bold tracking-wide">ESPACIOS REALES FORMULADOS CON COLORLINK</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#199ea5]/10 border border-[#199ea5]/25 text-[#199ea5] text-xs font-semibold shadow-2xs">
                <ShoppingCart className="w-3 h-3 text-[#199ea5]" />
                <span>Toca cualquier espacio para meterlo a tu pedido</span>
              </span>
            </div>
          </div>
          <span className="marquee-header-desc">
            Espacios reales con acabados fotográficos de alta fidelidad formulados con recubrimientos Pintuco®. Al tocar cualquiera de ellos, su fórmula química, color y cálculo de manos se agregarán automáticamente a tu pedido.
          </span>
        </div>

        <div className="marquee-container">
          <div className="marquee-fade-left" />
          <div className="marquee-fade-right" />

          <div className="marquee-track">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="marquee-card group"
                onClick={() => handleSelectSpace(item)}
                title={`Toca para agregar "${item.title}" a tu pedido`}
              >
                <img
                  src={item.img}
                  alt={item.title}
                  className="marquee-image"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />

                {/* Formulated Color Tag Floater */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-white text-[11px] font-medium shadow-md">
                  <span
                    className="w-2.5 h-2.5 rounded-full ring-1 ring-white/60 shadow-xs"
                    style={{ backgroundColor: item.colorHex }}
                  />
                  <span className="font-semibold text-white">{item.colorName}</span>
                </div>

                {/* Overlay with formulation details & Direct Order Button */}
                <div className="marquee-overlay">
                  <span className="marquee-tag">{item.tag}</span>
                  <h4 className="marquee-title group-hover:text-[#86deb8] transition-colors">{item.title}</h4>
                  
                  <div className="flex items-center gap-1.5 text-[11px] text-white/85 mt-0.5 mb-2 font-mono">
                    <span className="truncate max-w-[180px]">{item.productName}</span>
                    <span>·</span>
                    <span className="font-bold text-[#86deb8] whitespace-nowrap">{item.areaM2} m²</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSpace(item);
                      }}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-[#86deb8] hover:bg-[#70cca7] text-[#173b2d] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                      title="Agregar esta formulación a mi pedido"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>+ Agregar al Pedido</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSpaceModal(item);
                      }}
                      className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer border border-white/20"
                      title="Ver ficha técnica completa del espacio"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================================
          CATEGORÍAS DE AMBIENTE (SHOP BY ROOM)
          ========================================================== */}
      <section id="ambientes" className="section-block scroll-mt-24">
        <div className="section-header text-center">
          <div className="badge-pill">
            <Layers className="w-3.5 h-3.5 text-[#199ea5]" />
            <span>ESPECIFICACIONES SEGÚN EL ESPACIO</span>
          </div>
          <h2 className="section-title">Elige la solución técnica según tu ambiente</h2>
          <p className="section-subtitle">
            Cada área requiere una formulación química adaptada a su exposición: resistencia al sol, humedad por vapor, tránsito de personas o protección anticorrosiva.
          </p>
        </div>

        <div className="room-cards-grid">
          {ROOM_CATEGORIES.map((room) => (
            <div key={room.id} className="room-card">
              <div className="room-card-top">
                <div className="room-card-icon">{room.icon}</div>
                <span className="room-badge">{room.badge}</span>
              </div>

              <h3 className="room-card-title">{room.title}</h3>
              <p className="room-card-desc">{room.desc}</p>

              <div className="room-pintuco-spec">
                <span className="spec-label">Producto Recomendado:</span>
                <span className="spec-value">{room.productName}</span>
                <span className="spec-finish">{room.finish}</span>
                <p className="text-[11px] text-[#5a6d80] mt-1 italic leading-tight">
                  {room.specText}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-3 border-t border-[#e5e0d3]">
                <button
                  type="button"
                  className="btn-primary btn-sm flex-1 text-center justify-center cursor-pointer"
                  onClick={() => {
                    if (onSelectRoomAndQuote) {
                      onSelectRoomAndQuote(room.surface, room.productName, room.colorTag);
                    } else if (currentUser) {
                      onNavigateToPortal();
                    } else {
                      onNavigateToRegister();
                    }
                  }}
                  title="Agregar este ambiente a mi solicitud"
                >
                  <span>+ Agregar a Solicitud</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  className="btn-secondary btn-sm px-2.5 cursor-pointer"
                  title="Simular en la calculadora"
                  onClick={() => {
                    setCalcSurface(room.surface);
                    const el = document.getElementById('calculadora');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Sliders className="w-3.5 h-3.5 text-[#199ea5]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==========================================================
          COLOR PALETTE PICKER & LIVE ROOM PREVIEW
          ========================================================== */}
      <section id="paleta-color" className="section-block bg-[#f7f4ea] border-y border-[#e5e0d3]">
        <div className="section-header text-center">
          <div className="badge-pill !bg-[#fdf0b5]">
            <Sparkles className="w-3.5 h-3.5 text-[#199ea5]" />
            <span>SISTEMA DE COLOR BRISA MARINA</span>
          </div>
          <h2 className="section-title">Explora la paleta y visualiza en tiempo real</h2>
          <p className="section-subtitle">
            Selecciona tonos de la colección o experimenta con tu color personalizado. El simulador de pared refleja la interacción de la luz en tiempo real.
          </p>
        </div>

        {/* Filtros de Familias */}
        <div className="color-family-pills">
          {[
            'Todos',
            'Brisa Marina',
            'Arenas & Lino',
            'Neutros Cálidos',
            'Verdes Botánicos',
            'Terracotas & Ocre',
          ].map((fam) => (
            <button
              key={fam}
              type="button"
              onClick={() => setActiveFamily(fam)}
              className={`family-pill ${activeFamily === fam ? 'is-active' : ''}`}
            >
              {fam}
            </button>
          ))}
        </div>

        <div className="color-explorer-grid">
          {/* Panel Izquierdo: Swatches */}
          <div className="swatches-panel">
            <div className="swatches-grid">
              {filteredSwatches.map((swatch) => {
                const isSelected = selectedSwatch.hex === swatch.hex;
                return (
                  <button
                    key={swatch.name}
                    type="button"
                    onClick={() => setSelectedSwatch(swatch)}
                    className={`swatch-card ${isSelected ? 'is-selected' : ''}`}
                  >
                    <div
                      className="swatch-circle"
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {isSelected && (
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      )}
                    </div>
                    <span className="swatch-name">{swatch.name}</span>
                    <span className="swatch-code">{swatch.code}</span>
                  </button>
                );
              })}
            </div>

            {/* Selector de color personalizado */}
            <div className="custom-color-box">
              <div className="custom-color-info">
                <span className="custom-color-title">¿Tienes un código Hex o muestra?</span>
                <span className="custom-color-desc">
                  Ingresa cualquier tono para probarlo en el simulador arquitectónico
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColorInput}
                  onChange={(e) => {
                    const newHex = e.target.value;
                    setCustomColorInput(newHex);
                    setSelectedSwatch({
                      name: `Personalizado (${newHex.toUpperCase()})`,
                      hex: newHex,
                      code: 'CUSTOM-HEX',
                      family: 'Brisa Marina',
                      desc: 'Color formulado a la medida mediante sistema tintométrico computarizado Pintuco.',
                      recommendedFinish: 'Satinado o Mate',
                    });
                  }}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-[#e5e0d3] p-0.5 bg-white"
                  title="Elegir color libre"
                />
                <span className="font-mono text-xs font-bold text-[#3d4b58] uppercase">
                  {selectedSwatch.hex}
                </span>
              </div>
            </div>
          </div>

          {/* Panel Derecho: Mockup Interactivo de Habitación */}
          <div className="room-mockup-card">
            <div className="mockup-viewport">
              {/* Pared que cambia dinámicamente de color */}
              <div
                className="mockup-wall"
                style={{ backgroundColor: selectedSwatch.hex }}
              >
                <div className="wall-shadow" />
                {/* Cuadro en pared */}
                <div className="wall-artwork" />
              </div>

              {/* Piso de madera y silueta de mobiliario */}
              <div className="mockup-floor">
                <div className="floor-sofa">
                  <div className="w-32 h-10 bg-[#2c3844] rounded-t-xl flex items-center justify-center text-[10px] text-white/70 font-mono">
                    Mobiliario Minimal
                  </div>
                </div>
              </div>
            </div>

            {/* Detalle del color seleccionado */}
            <div className="selected-color-bar">
              <div className="selected-color-badge-group">
                <div
                  className="color-indicator-dot"
                  style={{ backgroundColor: selectedSwatch.hex }}
                />
                <div>
                  <h4 className="selected-color-name">{selectedSwatch.name}</h4>
                  <p className="selected-color-details">
                    Código: <strong className="font-mono text-[#3d4b58]">{selectedSwatch.hex}</strong> · Colección {selectedSwatch.family}
                  </p>
                </div>
              </div>

              <p className="selected-color-desc">{selectedSwatch.desc}</p>

              <div className="pt-2 border-t border-[#e5e0d3] flex items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="text-[10px] uppercase font-mono text-[#8496a7] block">
                    Acabado Óptimo:
                  </span>
                  <span className="font-bold text-[#3d4b58]">
                    {selectedSwatch.recommendedFinish}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleApplySelectedColor}
                  className="btn-primary btn-sm"
                >
                  <span>Aplicar a mi Cotización</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================
          CATÁLOGO OFICIAL & TIENDA EN VIVO PINTUCO
          ========================================================== */}
      <section id="catalogo" className="section-block bg-white border-b border-[#e5e0d3]">
        <div className="section-header text-center">
          <div className="badge-pill !bg-[#27cbd2]/15 !border-[#27cbd2]/30 !text-[#173b2d]">
            <Boxes className="w-3.5 h-3.5 text-[#199ea5]" />
            <span>CATÁLOGO OFICIAL PINTUCO · TIENDA & INVENTARIO CEDI</span>
          </div>
          <h2 className="section-title">Pinturas, Recubrimientos & Herramientas Disponibles</h2>
          <p className="section-subtitle">
            Todo lo que está en nuestro inventario CEDI está habilitado para compra directa. Explora colores, acabados técnicos y herramientas profesionales con despacho a pie de obra en 24-48h.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Barra de Filtros & Búsqueda */}
          <div className="bg-[#f7f4ea] border border-[#e5e0d3] rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8496a7] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder="Buscar pintura por nombre (ej. Viniltex, Koraza, Pintulux), SKU o bodega..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-[#e5e0d3] rounded-xl focus:ring-2 focus:ring-[#199ea5] focus:outline-hidden font-medium text-[#2c3844]"
                />
                {storeSearch && (
                  <button
                    type="button"
                    onClick={() => setStoreSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#8496a7] hover:text-[#2c3844] font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Selector CEDI */}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#199ea5] shrink-0 hidden sm:block" />
                <select
                  value={storeWarehouseFilter}
                  onChange={(e) => setStoreWarehouseFilter(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-semibold text-[#2c3844] bg-white border border-[#e5e0d3] rounded-xl focus:ring-2 focus:ring-[#199ea5] focus:outline-hidden cursor-pointer"
                  title="Filtrar por CEDI Bodega"
                >
                  <option value="todos">📍 Todas las Bodegas CEDI</option>
                  <option value="Medellín">CEDI Principal Rionegro / Medellín</option>
                  <option value="Bogotá D.C.">CEDI Siberia / Bogotá</option>
                  <option value="Cali">Hub Regional Acopi / Cali</option>
                  <option value="Barranquilla">Planta Caribe Galapa / Barranquilla</option>
                  <option value="Bucaramanga">CEDI Oriente Girón / Bucaramanga</option>
                </select>
              </div>
            </div>

            {/* Categorías en Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1 border-t border-[#e5e0d3]">
              <button
                type="button"
                onClick={() => setStoreCategory('todos')}
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  storeCategory === 'todos'
                    ? 'bg-[#2c3844] text-white border-[#2c3844] shadow-xs'
                    : 'bg-white text-[#5a6d80] border-[#e5e0d3] hover:border-[#8496a7]'
                }`}
              >
                Todos los Productos ({inventory.length})
              </button>

              <button
                type="button"
                onClick={() => setStoreCategory('pinturas')}
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  storeCategory === 'pinturas'
                    ? 'bg-[#199ea5] text-white border-[#199ea5] shadow-xs'
                    : 'bg-white text-[#5a6d80] border-[#e5e0d3] hover:border-[#8496a7]'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-[#27cbd2]" />
                <span>Pinturas & Esmaltes ({storePaintsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setStoreCategory('herramientas')}
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  storeCategory === 'herramientas'
                    ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                    : 'bg-white text-[#5a6d80] border-[#e5e0d3] hover:border-[#8496a7]'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-500" />
                <span>Herramientas & Brochas ({storeToolsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setStoreCategory('insumos')}
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  storeCategory === 'insumos'
                    ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                    : 'bg-white text-[#5a6d80] border-[#e5e0d3] hover:border-[#8496a7]'
                }`}
              >
                <Boxes className="w-3.5 h-3.5 text-indigo-500" />
                <span>Insumos & Protección ({storeSuppliesCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setStoreCategory('disponibles')}
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  storeCategory === 'disponibles'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-[#5a6d80] border-[#e5e0d3] hover:border-[#8496a7]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Disponibles en Bodega</span>
              </button>
            </div>
          </div>

          {/* Grilla de Productos */}
          {filteredStoreInventory.length === 0 ? (
            <div className="bg-[#f7f4ea] border border-[#e5e0d3] rounded-2xl p-10 text-center space-y-2">
              <Boxes className="w-10 h-10 text-[#8496a7] mx-auto" />
              <p className="text-sm font-bold text-[#2c3844]">No hay productos que coincidan con la búsqueda</p>
              <button
                type="button"
                onClick={() => {
                  setStoreSearch('');
                  setStoreCategory('todos');
                  setStoreWarehouseFilter('todos');
                }}
                className="btn-secondary btn-sm"
              >
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStoreInventory.map((item) => {
                const isPaint = isPaintProduct(item);
                const colors = item.availableColors && item.availableColors.length > 0 ? item.availableColors : [
                  { name: 'Blanco Lirio Silvestre 01', hex: '#F1F5F9' },
                  { name: 'Brisa Caribeña Aqua', hex: '#27CBD2' },
                  { name: 'Menta Salvia Suave', hex: '#86DEB8' },
                  { name: 'Azul Pizarra Moderno', hex: '#526C86' },
                  { name: 'Luz de Arena Cálida', hex: '#FDF0B5' },
                  { name: 'Gris Basalto Grafito', hex: '#3D4B58' },
                ];

                const cuñetes = item.cuñetesAvailable || 0;
                const galones = item.galonesAvailable || 0;
                const units = item.unitsAvailable ?? item.galonesAvailable ?? item.totalLiters ?? 0;
                const isAvailable = isPaint ? ((cuñetes > 0 || galones > 0) && item.status !== 'agotado') : (units > 0 && item.status !== 'agotado');
                const priceGalon = item.pricePerGalon || 115000;
                const priceCuñete = Math.round(priceGalon * 5 * 0.92);
                const unitPrice = item.unitPrice || item.pricePerGalon || 28000;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden group bg-white shadow-2xs ${
                      isAvailable ? 'border-[#e5e0d3] hover:border-[#199ea5] hover:shadow-md' : 'border-red-200 opacity-80'
                    }`}
                  >
                    <div>
                      {/* Imagen Real del Producto con Badges Flotantes */}
                      <div className="relative w-full h-44 overflow-hidden bg-slate-100 flex items-center justify-center">
                        <img
                          src={getProductImage(item)}
                          alt={item.productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-black/20 to-black/30" />

                        {/* Badges Flotantes */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          {isPaint ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono uppercase px-2.5 py-1 rounded-full bg-[#199ea5]/90 backdrop-blur-xs text-white shadow-xs border border-white/20">
                              <Palette className="w-3 h-3 text-[#86deb8]" />
                              Pintura Oficial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono uppercase px-2.5 py-1 rounded-full bg-amber-800/90 backdrop-blur-xs text-white shadow-xs border border-amber-400/30">
                              <Wrench className="w-3 h-3 text-amber-300" />
                              Herramienta / Insumo
                            </span>
                          )}
                        </div>

                        <span
                          className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-xs backdrop-blur-xs ${
                            isAvailable
                              ? item.status === 'critico'
                                ? 'bg-amber-600/90 text-white border-amber-300'
                                : 'bg-emerald-600/90 text-white border-emerald-300'
                              : 'bg-red-600/90 text-white border-red-300'
                          }`}
                        >
                          {isAvailable ? (item.status === 'critico' ? 'Stock Bajo' : 'Disponible CEDI') : 'Agotado'}
                        </span>

                        {/* Pie de Imagen con SKU y Ciudad CEDI */}
                        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px]">
                          <span className="font-mono bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] border border-white/20">
                            {item.sku}
                          </span>
                          <span className="flex items-center gap-1 text-slate-200 text-[10.5px] font-medium bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded">
                            <MapPin className="w-3 h-3 text-[#27cbd2]" />
                            {item.warehouseCity}
                          </span>
                        </div>
                      </div>

                      {/* Información del Producto */}
                      <div className="p-4 pb-2">
                        <h3 className="text-sm font-bold text-[#2c3844] leading-snug group-hover:text-[#199ea5] transition-colors line-clamp-2">
                          {item.productName}
                        </h3>
                        <p className="text-[11px] text-[#5a6d80] font-medium mt-1 flex items-center gap-1.5 flex-wrap">
                          <span>{item.category}</span>
                          {item.finish && (
                            <>
                              <span>·</span>
                              <span className="font-semibold text-[#199ea5] bg-[#199ea5]/10 px-1.5 py-0.5 rounded text-[10px] border border-[#199ea5]/20">
                                Acabado {item.finish}
                              </span>
                            </>
                          )}
                        </p>
                        {item.description && (
                          <p className="text-[11.5px] text-[#5a6d80] mt-1.5 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Colores si es pintura, o aviso de venta por unidad si es herramienta */}
                      {isPaint ? (
                        <div className="px-4 py-2 mx-4 rounded-xl bg-[#f7f4ea] border border-[#e5e0d3] space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#3d4b58] font-semibold flex items-center gap-1">
                              <Palette className="w-3 h-3 text-[#199ea5]" />
                              Paleta de Colores ({colors.length}):
                            </span>
                            <span className="text-[10px] text-[#199ea5] font-mono font-bold truncate max-w-[120px]">
                              {colors[0]?.name.split(' ')[0]}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {colors.slice(0, 6).map((c, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleOpenStoreModal(item, c)}
                                className="w-5 h-5 rounded-full border-2 border-white shadow-2xs hover:scale-125 transition-transform cursor-pointer relative group/dot"
                                style={{ backgroundColor: c.hex }}
                                title={`Seleccionar color ${c.name}`}
                              >
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/dot:block z-20 px-2 py-0.5 rounded bg-slate-900 text-white text-[9px] font-mono whitespace-nowrap shadow-md">
                                  {c.name}
                                </span>
                              </button>
                            ))}
                            {colors.length > 6 && (
                              <span className="text-[10px] text-[#8496a7] font-mono font-bold">
                                +{colors.length - 6} más
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 py-2 mx-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 flex items-center justify-between">
                          <span className="font-medium">Venta directa por unidad</span>
                          <span className="font-mono font-bold text-amber-800">Sin colores</span>
                        </div>
                      )}

                      {/* Existencias CEDI */}
                      <div className="px-4 py-2 text-xs flex items-center justify-between border-t border-[#e5e0d3]/60 mt-3 font-mono">
                        <span className="text-[11px] text-[#8496a7]">Existencias CEDI:</span>
                        {isPaint ? (
                          <span className={`font-bold ${isAvailable ? 'text-[#173b2d]' : 'text-red-600'}`}>
                            {isAvailable ? `${cuñetes} Cuñetes / ${galones} Gal` : '0 existencias'}
                          </span>
                        ) : (
                          <span className={`font-bold ${isAvailable ? 'text-amber-900' : 'text-red-600'}`}>
                            {isAvailable ? `${units} ${item.unitMeasure || 'Unidades'}` : '0 unidades'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Precios & Botón de Compra */}
                    <div className="p-4 pt-3 border-t border-[#e5e0d3] bg-[#f7f4ea]/40 space-y-2.5">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] text-[#8496a7] block">
                            {isPaint ? 'Precio Galón:' : 'Precio Unitario:'}
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-bold font-mono text-[#2c3844]">
                              ${isPaint ? priceGalon.toLocaleString('es-CO') : unitPrice.toLocaleString('es-CO')} COP
                            </span>
                            <span className="text-[10px] text-[#5a6d80]">
                              / {isPaint ? 'Gal' : item.unitMeasure || 'Ud'}
                            </span>
                          </div>
                        </div>

                        {isPaint && (
                          <div className="text-right">
                            <span className="text-[9.5px] text-[#8496a7] block">Cuñete 5 Gal:</span>
                            <span className="text-xs font-bold font-mono text-[#199ea5]">
                              ${priceCuñete.toLocaleString('es-CO')} COP
                            </span>
                          </div>
                        )}
                      </div>

                      {isAvailable ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenStoreModal(item)}
                            className="btn-primary text-xs !py-2 flex items-center justify-center gap-1.5 cursor-pointer"
                            id={`btn-store-buy-${item.sku}`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Comprar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (isPaint) {
                                setCalcSurface(item.category.toLowerCase().includes('fachada') ? 'fachada_exterior' : 'mamposteria_interior');
                                const el = document.getElementById('calculadora');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              } else {
                                handleOpenStoreModal(item);
                              }
                            }}
                            className="btn-secondary text-xs !py-2 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5 text-[#199ea5]" />
                            <span>Calcular m²</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-full py-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                          <Ban className="w-3.5 h-3.5 text-red-500" />
                          <span>Agotado en CEDI</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal de Pedido Rápido desde la Página de Inicio - Dimensión controlada y Pintuco styling */}
        {storeModalItem && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
              <div className="bg-gradient-to-r from-[#0F1E36] via-[#1E2E4B] to-[#0F1E36] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                    TIENDA OFICIAL PINTUCO · CEDI
                  </span>
                  <h3 className="text-base font-bold text-white leading-tight mt-0.5">
                    {storeModalItem.productName}
                  </h3>
                  <span className="text-xs text-slate-300 font-mono">SKU: {storeModalItem.sku}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStoreModalItem(null)}
                  className="text-white/70 hover:text-white text-lg font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Imagen del Producto en Modal - Compacta */}
              <div className="relative h-24 sm:h-28 w-full shrink-0 overflow-hidden bg-slate-100 border-b border-slate-200">
                <img
                  src={getProductImage(storeModalItem)}
                  alt={storeModalItem.productName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-white text-xs">
                  <span className="bg-black/60 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] font-mono border border-white/20">
                    CEDI {storeModalItem.warehouseCity}
                  </span>
                  <span className="text-amber-300 font-bold text-xs bg-slate-900/70 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-amber-400/30">
                    {storeModalItem.finish ? `Acabado ${storeModalItem.finish}` : storeModalItem.category}
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-3.5 flex-1 min-h-0 overflow-y-auto">
                {isPaintProduct(storeModalItem) ? (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center justify-between">
                        <span>Color de Pintura Seleccionado:</span>
                        <span className="text-amber-700 font-mono font-bold text-[11px] flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: storeModalColor.hex }} />
                          {storeModalColor.name}
                        </span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50">
                        {(storeModalItem.availableColors || [
                          { name: 'Blanco Lirio Silvestre 01', hex: '#F1F5F9' },
                          { name: 'Brisa Caribeña Aqua', hex: '#27CBD2' },
                          { name: 'Menta Salvia Suave', hex: '#86DEB8' },
                          { name: 'Azul Pizarra Moderno', hex: '#526C86' },
                        ]).map((c, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setStoreModalColor(c)}
                            className={`p-1.5 rounded-lg border text-left flex items-center gap-2 cursor-pointer ${
                              storeModalColor.name === c.name
                                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/20 font-bold'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full border shrink-0" style={{ backgroundColor: c.hex }} />
                            <span className="text-[11px] text-slate-800 truncate">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Presentación de Volumen:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setStoreModalFormat('galon')}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                            storeModalFormat === 'galon'
                              ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-400'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <span className="text-xs font-bold text-slate-900 block">Galón</span>
                          <span className="text-[11px] font-mono font-bold text-slate-900">
                            ${(storeModalItem.pricePerGalon || 115000).toLocaleString('es-CO')} COP
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStoreModalFormat('cuñete')}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer relative overflow-hidden ${
                            storeModalFormat === 'cuñete'
                              ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-400'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <span className="text-xs font-bold text-slate-900 block">Cuñete (5 Gal)</span>
                          <span className="text-[11px] font-mono font-bold text-slate-900">
                            ${Math.round((storeModalItem.pricePerGalon || 115000) * 5 * 0.92).toLocaleString('es-CO')} COP
                          </span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                    <span className="font-bold block">Venta Directa por Unidad</span>
                    <p className="text-[11px] text-amber-800">
                      Este artículo se despacha por unidad ({storeModalItem.unitMeasure || 'Pieza'}). No requiere formulación de color.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Cantidad:</span>
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setStoreModalQty(Math.max(1, storeModalQty - 1))}
                      className="px-3 py-1 font-bold hover:bg-slate-200"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 font-mono font-bold text-xs bg-white">{storeModalQty}</span>
                    <button
                      type="button"
                      onClick={() => setStoreModalQty(storeModalQty + 1)}
                      className="px-3 py-1 font-bold hover:bg-slate-200"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0F1E36] text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-300 block">Total Estimado COP:</span>
                    <span className="text-base font-bold font-mono text-amber-400">
                      ${(
                        (isPaintProduct(storeModalItem)
                          ? (storeModalFormat === 'cuñete' ? Math.round((storeModalItem.pricePerGalon || 115000) * 5 * 0.92) : (storeModalItem.pricePerGalon || 115000))
                          : (storeModalItem.unitPrice || storeModalItem.pricePerGalon || 28000)) * storeModalQty
                      ).toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-300">Bodega: {storeModalItem.warehouseCity}</span>
                </div>
              </div>

              <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setStoreModalItem(null)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStoreModal}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-slate-950" />
                  <span>Continuar con mi Pedido →</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Especificación y Agregado al Pedido de Espacio Formulado - Dimensión controlada */}
        {selectedSpaceModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
              {/* Header con imagen del espacio - Compacto */}
              <div className="relative h-32 sm:h-36 w-full shrink-0 overflow-hidden">
                <img
                  src={selectedSpaceModal.img}
                  alt={selectedSpaceModal.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F1E36] via-[#0F1E36]/40 to-transparent" />
                
                <button
                  type="button"
                  onClick={() => setSelectedSpaceModal(null)}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Cerrar modal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="absolute bottom-2.5 left-4 right-4 text-white">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold">
                      {selectedSpaceModal.tag}
                    </span>
                    <span className="text-xs text-amber-300 font-bold font-mono">
                      {selectedSpaceModal.areaM2} m² recomendados
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-['Space_Grotesk'] leading-tight">
                    {selectedSpaceModal.title}
                  </h3>
                </div>
              </div>

              {/* Contenido técnico del espacio - Scrollable */}
              <div className="p-4 sm:p-5 space-y-3 flex-1 min-h-0 overflow-y-auto">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedSpaceModal.desc}
                </p>

                {/* Especificaciones Técnicas */}
                <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Tono Formulado</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="w-3.5 h-3.5 rounded-full ring-1 ring-black/20 shadow-xs flex-shrink-0"
                        style={{ backgroundColor: selectedSpaceModal.colorHex }}
                      />
                      <span className="font-bold text-slate-900 truncate">{selectedSpaceModal.colorName}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 block mt-0.5">{selectedSpaceModal.colorHex}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Pintura Asignada</span>
                    <strong className="text-slate-900 block mt-1 leading-snug">{selectedSpaceModal.productName}</strong>
                    <span className="text-[10px] text-teal-700 font-semibold">{selectedSpaceModal.finish}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Desglose Sugerido</span>
                    <span className="font-bold text-slate-800 block mt-1">{selectedSpaceModal.estimatedGalonsText}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Presupuesto Aprox.</span>
                    <span className="font-bold font-mono text-amber-700 text-sm block mt-0.5">
                      ${selectedSpaceModal.priceEstimateCOP.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Al presionar <strong>Agregar al Pedido</strong>, se cargará automáticamente esta configuración técnica en tu orden.</span>
                </div>
              </div>

              {/* Botones de Acción - Pinned */}
              <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedSpaceModal(null)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const space = selectedSpaceModal;
                    setSelectedSpaceModal(null);
                    handleSelectSpace(space);
                  }}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4 text-slate-950" />
                  <span>🛒 Confirmar y Agregar al Pedido</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notificación Flotante */}
        {spaceAddedToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#173b2d] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#86deb8]/60 flex items-center gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-[#86deb8] text-[#173b2d] flex items-center justify-center font-bold">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#86deb8]">¡Espacio agregado!</p>
              <p className="text-xs text-white/95">{spaceAddedToast}</p>
            </div>
          </div>
        )}
      </section>

      {/* ==========================================================
          CALCULADORA RÁPIDA DE RENDIMIENTO & PRESUPUESTO
          ========================================================== */}
      <section id="calculadora" className="section-block">
        <div className="section-header text-center">
          <div className="badge-pill">
            <Sliders className="w-3.5 h-3.5 text-[#199ea5]" />
            <span>CÁLCULO TÉCNICO INMEDIATO</span>
          </div>
          <h2 className="section-title">Calcula cuánta pintura necesitas</h2>
          <p className="section-subtitle">
            Evita sobrantes costosos o falta de material. Nuestra fórmula considera la porosidad del sustrato y las manos técnicas recomendadas por Pintuco.
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-white border border-[#e5e0d3] rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#3d4b58] block mb-1.5">
                  Tipo de Superficie:
                </label>
                <div className="input-wrap">
                  <select
                    value={calcSurface}
                    onChange={(e) => setCalcSurface(e.target.value as SurfaceType)}
                    className="w-full text-xs font-semibold text-[#3d4b58]"
                  >
                    <option value="mamposteria_interior">Muros Interiores (Viniltex®)</option>
                    <option value="fachada_exterior">Fachadas Exteriores (Koraza®)</option>
                    <option value="concreto_piso">Pisos de Concreto (Pintuepoxi®)</option>
                    <option value="metal_ferroso">Metales y Rejas (Pintulux®)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#3d4b58] mb-1.5">
                  <span>Área a Pintar:</span>
                  <span className="font-mono text-[#199ea5] font-black text-sm">
                    {calcArea} m²
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={calcArea}
                  onChange={(e) => setCalcArea(Number(e.target.value))}
                  className="w-full accent-[#199ea5] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#8496a7] mt-1 font-mono">
                  <span>10 m² (1 Habitación)</span>
                  <span>150 m² (Apartamento)</span>
                  <span>500 m² (Obra)</span>
                </div>
              </div>

              <div className="p-3 bg-[#f7f4ea] rounded-xl border border-[#e5e0d3] text-xs space-y-1">
                <span className="text-[10px] font-mono text-[#8496a7] uppercase block">
                  Recomendación Técnica:
                </span>
                <p className="font-bold text-[#2c3844]">{quickCalc.productName}</p>
                <p className="text-[11px] text-[#5a6d80]">
                  Aplicar 2 manos con rodillo Pintuco antigota y dilución máxima del 15% con agua potable.
                </p>
              </div>
            </div>

            {/* Resultado Estimado */}
            <div className="bg-[#2c3844] text-white rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#86deb8] block mb-1">
                  Cubicaje Estimado (2 Manos)
                </span>
                <h4 className="text-xl font-bold font-['Space_Grotesk'] text-white">
                  {quickCalc.cuñetes > 0 && `${quickCalc.cuñetes} Cuñete(s) (5G)`}
                  {quickCalc.cuñetes > 0 && quickCalc.galonesSueltos > 0 && ' + '}
                  {quickCalc.galonesSueltos > 0 && `${quickCalc.galonesSueltos} Galón(es)`}
                  {quickCalc.cuñetes === 0 && quickCalc.galonesSueltos === 0 && '1 Galón'}
                </h4>
                <p className="text-xs text-white/70 mt-1">
                  Total volumen: <strong className="text-white font-mono">{quickCalc.totalGalones} Galones</strong> ({Math.round(quickCalc.totalGalones * 3.785)} Litros)
                </p>
              </div>

              <div className="pt-3 border-t border-white/15">
                <span className="text-[11px] text-white/70 block">
                  Presupuesto estimado de material:
                </span>
                <span className="text-2xl font-black text-[#86deb8] font-mono">
                  ${(quickCalc.costoEstimado || 0).toLocaleString('es-CO')} COP
                </span>
                <span className="text-[10px] text-white/50 block mt-0.5">
                  Precios oficiales vigentes con descuento por volumen
                </span>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectCalculationAndQuote) {
                      onSelectCalculationAndQuote(calcSurface, calcArea, quickCalc.productName);
                    } else if (currentUser) {
                      onNavigateToPortal();
                    } else {
                      onNavigateToRegister();
                    }
                  }}
                  className="btn-primary btn-block text-xs !py-2.5 cursor-pointer"
                  id="btn-calc-apply-quote"
                >
                  <span>+ Formular Proyecto con este Cálculo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={onOpenCalculator}
                  className="text-xs text-white/70 hover:text-white underline text-center"
                >
                  Abrir calculadora técnica con insumos y cuadrilla →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ==========================================================
          GALERÍA DE PROYECTOS REALES
          ========================================================== */}
      <section id="proyectos" className="section-block">
        <div className="section-header text-center">
          <div className="badge-pill">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#199ea5]" />
            <span>OBRAS & ARQUITECTURA EN COLOMBIA</span>
          </div>
          <h2 className="section-title">Transformando proyectos de toda escala</h2>
          <p className="section-subtitle">
            Desde residencias campestres hasta torres corporativas, ColorLink asegura formulaciones respaldadas por garantías escritas.
          </p>
        </div>

        <div className="projects-grid">
          {REAL_PROJECTS.map((proj, idx) => (
            <div key={idx} className="project-card">
              <div className="project-image-wrap">
                <img
                  src={proj.img}
                  alt={proj.title}
                  className="project-image"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <span className="project-city-badge">{proj.city}</span>
              </div>

              <div className="project-body">
                <span className="project-room-tag">{proj.room}</span>
                <h3 className="project-title">{proj.title}</h3>

                <div className="project-specs">
                  <div className="project-spec-item">
                    <span className="text-[#8496a7]">Sistema:</span>
                    <strong className="text-[#3d4b58]">{proj.product}</strong>
                  </div>
                  <div className="project-spec-item">
                    <span className="text-[#8496a7]">Color:</span>
                    <span className="project-color-applied">
                      <span
                        className="project-swatch-dot"
                        style={{ backgroundColor: proj.colorHex }}
                      />
                      <span>{proj.colorName}</span>
                    </span>
                  </div>
                  <div className="project-spec-item">
                    <span className="text-[#8496a7]">Área Total:</span>
                    <strong className="font-mono text-[#3d4b58]">{proj.m2}</strong>
                  </div>
                </div>

                <p className="project-review">{proj.review}</p>
                <p className="project-client">{proj.client}</p>

                <div className="mt-4 pt-3 border-t border-[#e5e0d3]">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectSpace({
                        id: `proj-${idx}`,
                        title: proj.title,
                        tag: proj.room,
                        img: proj.img,
                        colorHex: proj.colorHex,
                        colorName: proj.colorName,
                        productName: proj.product,
                        surface: proj.room.includes('EXTERIOR') || proj.room.includes('FACHADA') ? 'fachada_exterior' : proj.room.includes('PISO') ? 'concreto_piso' : 'mamposteria_interior',
                        areaM2: parseInt(proj.m2.replace(/\D/g, '')) || 120,
                        finish: 'Especificación Arquitectónica',
                        desc: proj.review,
                        estimatedGalonsText: 'Desglose técnico en CEDI',
                        priceEstimateCOP: 480000,
                      });
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#2c3844] hover:bg-[#199ea5] text-[#86deb8] hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Agregar formulación de este proyecto a mi pedido"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>+ Agregar Formulación de este Proyecto al Pedido</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Banner CTA Final */}
        <div className="project-cta-banner">
          <div>
            <h3 className="cta-banner-title">¿Listo para iniciar tu obra con ColorLink?</h3>
            <p className="cta-banner-desc">
              Crea tu requerimiento en minutos. Nuestro motor técnico generará el desglose exacto de cuñetes, insumos y coordinará el despacho desde el CEDI más cercano.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={currentUser ? onNavigateToPortal : onNavigateToRegister}
              className="btn-primary btn-lg whitespace-nowrap"
            >
              <span>+ Iniciar mi Cotización</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>
        </div>
      </section>

      {/* ==========================================================
          PORTAL FOOTER
          ========================================================== */}
      <footer className="portal-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="brand-mark small">
              <span className="font-bold text-sm font-['Space_Grotesk'] text-[#199ea5]">CL</span>
            </div>
            <div>
              <span className="footer-title">ColorLink</span>
              <p className="footer-desc">
                Sistema Integral de Pintura & Recubrimientos · Reto Transversal Pintuco · Electiva IV
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#5a6d80] flex-wrap">
            <a href="#ambientes" className="hover:text-[#199ea5]">
              Ambientes
            </a>
            <a href="#paleta-color" className="hover:text-[#199ea5]">
              Paleta Brisa Marina
            </a>
            <a href="#calculadora" className="hover:text-[#199ea5]">
              Calculadora m²
            </a>
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="hover:text-[#199ea5] font-mono font-bold"
            >
              Base de Datos Supabase
            </button>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="hover:text-[#199ea5] font-bold"
            >
              Acceso Funcionarios
            </button>
          </div>

          <p className="footer-copy">
            © 2026 ColorLink · Formulación técnica con tecnología Pintuco S.A.
          </p>
        </div>
      </footer>
    </div>
  );
};
