import React, { useState } from 'react';
import {
  FileText,
  Download,
  Search,
  CheckCircle2,
  ShieldCheck,
  Droplet,
  Layers,
  Sparkles,
  ExternalLink,
  Printer,
  Sliders,
  X,
  Palette,
} from '../icons';

export interface TechnicalSheetItem {
  id: string;
  code: string;
  productName: string;
  category: 'Arquitectónica' | 'Fachadas' | 'Esmaltes & Metales' | 'Industrial & Pisos' | 'Maderas' | 'Preparación';
  surface: string;
  coverageM2Galon: string;
  dryingTimeTouch: string;
  dryingTimeRepaint: string;
  dilutionRecommended: string;
  finish: string;
  solidsVolume: string;
  vocContent: string;
  warrantyYears: number;
  normaTecnica: string;
  description: string;
  highlights: string[];
}

export const PINTUCO_TECHNICAL_SHEETS: TechnicalSheetItem[] = [
  {
    id: 'ft-viniltex-biocuidado',
    code: 'FT-PTC-VIN-01',
    productName: 'Viniltex® Bio-Cuidado Antibacterial',
    category: 'Arquitectónica',
    surface: 'Paredes interiores de mampostería, pañete, yeso y drywall',
    coverageM2Galon: '45 - 50 m² / galón a 1 mano (22 - 25 m² a 2 manos)',
    dryingTimeTouch: '30 - 45 minutos (25°C / 60% HR)',
    dryingTimeRepaint: '2 a 3 horas entre manos',
    dilutionRecommended: 'Agua potable: 20% para 1ra mano, 15% para acabado',
    finish: 'Mate sedoso lavable de alta tersura',
    solidsVolume: '48% ± 2%',
    vocContent: '< 30 g/L (Ultra Bajo Olor y Cero Solventes Nocivos)',
    warrantyYears: 5,
    normaTecnica: 'NTC 1335 (Pinturas al Agua Tipo 1) & Certificado Icontec',
    description: 'Pintura vinil acrílica premium de máxima lavabilidad con tecnología de iones de plata que elimina el 99.9% de hongos, algas y bacterias en superficies interiores.',
    highlights: [
      'Elimina bacterias patógenas (E. Coli, Salmonella, S. Aureus)',
      'Máxima resistencia a más de 1.500 ciclos de lavado',
      'Ultra bajo olor que permite habitar el espacio el mismo día',
      'Certificación LEED V4 para construcciones sostenibles',
    ],
  },
  {
    id: 'ft-koraza-5anos',
    code: 'FT-PTC-KOR-02',
    productName: 'Koraza® 5 Años Protección Clima Extremo',
    category: 'Fachadas',
    surface: 'Fachadas exteriores, ladrillo a la vista, revoque y concreto',
    coverageM2Galon: '38 - 42 m² / galón a 1 mano (18 - 20 m² a 2 manos)',
    dryingTimeTouch: '60 minutos',
    dryingTimeRepaint: '3 a 4 horas',
    dilutionRecommended: 'Agua potable: 15% a 20% máximo',
    finish: 'Mate hidrófugo elasto-acrílico',
    solidsVolume: '52% ± 2%',
    vocContent: '< 45 g/L',
    warrantyYears: 5,
    normaTecnica: 'NTC 5828 (Pinturas para Fachadas Exteriores)',
    description: 'Pintura exterior 100% acrílica con resinas de alta elasticidad que puentean microfisuras de hasta 0.5 mm y repelen la lluvia ácida y rayos UV de climas tropicales.',
    highlights: [
      'Membrana hidrófuga que repele agua líquida pero permite respirar el muro',
      'Filtro solar UV que previene la decoloración por hasta 5 años',
      'Anti-hongos y anti-algas activo para fachadas sombreadas',
      'Puentea fisuras dinámicas causadas por dilatación térmica',
    ],
  },
  {
    id: 'ft-pintulux-3en1',
    code: 'FT-PTC-PLX-03',
    productName: 'Pintulux® 3 en 1 Anticorrosivo & Esmalte',
    category: 'Esmaltes & Metales',
    surface: 'Estructuras metálicas ferrosas, barandas, rejas, puertas y portones',
    coverageM2Galon: '35 - 40 m² / galón a 1 mano (18 - 20 m² a 2 manos)',
    dryingTimeTouch: '2 horas',
    dryingTimeRepaint: '6 a 8 horas',
    dilutionRecommended: 'Varsol o Thinner Pintuco: 10% a 15%',
    finish: 'Brillante o Semibrillante de alta dureza',
    solidsVolume: '50% ± 2%',
    vocContent: '< 380 g/L',
    warrantyYears: 3,
    normaTecnica: 'NTC 1650 (Esmaltes Alquídicos Anticorrosivos)',
    description: 'Sistema anticorrosivo que actúa como convertidor de óxido, anticorrosivo fosfatizante y acabado brillante en un solo producto, sin requerir wash-primer.',
    highlights: [
      'Aplica directo sobre metal oxidado firmemente adherido',
      'Película de alta dureza resistente a golpes y rayaduras',
      'Excelente nivelación y retención de brillo en exteriores',
      'Inhibe activamente el avance de corrosión catódica',
    ],
  },
  {
    id: 'ft-pintuepoxi-500',
    code: 'FT-PTC-EPX-04',
    productName: 'Pintuepoxi® 500 Pisos de Tráfico Pesado',
    category: 'Industrial & Pisos',
    surface: 'Pisos de concreto, bodegas, talleres, parqueaderos y laboratorios',
    coverageM2Galon: '28 - 32 m² / galón por kit a 12 mils húmedos',
    dryingTimeTouch: '4 horas',
    dryingTimeRepaint: '12 a 24 horas',
    dilutionRecommended: 'Ajustador Epóxico Ref. 21105: 10% a 15%',
    finish: 'Brillante industrial antipolvo',
    solidsVolume: '70% ± 2%',
    vocContent: '< 250 g/L',
    warrantyYears: 5,
    normaTecnica: 'ASTM D4060 (Abrasión Taber) & NTC 3964',
    description: 'Recubrimiento epóxico poliamida bicomponente formulado para resistir derrame de aceites, solventes, paso continuo de montacargas y limpieza aséptica severa.',
    highlights: [
      'Resistencia superior a abrasión y rodamiento de montacargas',
      'Sellado antipolvo total que facilita asepsia en plantas de alimentos',
      'Impermeabilidad total a grasas automotrices y líquidos industriales',
      'Curado químico de alta adhesión química al sustrato de hormigón',
    ],
  },
  {
    id: 'ft-sellomax-7en1',
    code: 'FT-PTC-SLX-05',
    productName: 'Sellomax® 7 en 1 Bloqueador de Humedad',
    category: 'Preparación',
    surface: 'Muros con humedad freática, sótanos, jardineras y salitre severo',
    coverageM2Galon: '25 - 30 m² / galón a 2 manos cruzadas',
    dryingTimeTouch: '1 hora',
    dryingTimeRepaint: '4 a 6 horas',
    dilutionRecommended: 'Uso puro sin diluir (máximo 5% de agua)',
    finish: 'Blanco mate impermeabilizante',
    solidsVolume: '55% ± 2%',
    vocContent: '< 30 g/L',
    warrantyYears: 3,
    normaTecnica: 'ASTM D7088 (Resistencia a Presión Hidrostática)',
    description: 'Imprimante acrílico impermeabilizante que penetra los poros del revoque y bloquea la ascensión capilar de agua y sales salinas antes de aplicar pintura de acabado.',
    highlights: [
      'Bloquea la salida de eflorescencias salinas y cal blanca',
      'Soporta presión hidrostática negativa de hasta 10 psi',
      'Prepara superficies pulverulentas consolidando el sustrato',
      'Compatible con cualquier pintura base agua o solvente Pintuco',
    ],
  },
  {
    id: 'ft-maderprotect-barniz',
    code: 'FT-PTC-MAD-06',
    productName: 'Maderprotect® Barniz Poliuretano Filtro UV',
    category: 'Maderas',
    surface: 'Decks exteriores, puertas macizas, pérgolas, ventanas y muebles',
    coverageM2Galon: '35 - 40 m² / galón a 1 mano (15 - 18 m² a 3 manos)',
    dryingTimeTouch: '2 horas',
    dryingTimeRepaint: '8 horas',
    dilutionRecommended: 'Varsol: 10% para 1ra mano de penetración, puras siguientes',
    finish: 'Brillante o Semibrillante cristalino con filtro UV',
    solidsVolume: '46% ± 2%',
    vocContent: '< 350 g/L',
    warrantyYears: 4,
    normaTecnica: 'NTC 2154 (Recubrimientos Transparentes para Madera)',
    description: 'Barniz con resinas poliuretano modificadas y doble filtro solar UVA/UVB que protegen la lignina natural de la madera contra la degradación solar y hongos.',
    highlights: [
      'Máxima elasticidad que acompaña las contracciones naturales de la viga',
      'Doble absorbente de radiación ultravioleta grado marino',
      'Realza las vetas naturales sin alterar el color de la madera noble',
      'Resistente al rocío matutino y salpicaduras de cloro en piscinas',
    ],
  },
];

interface TechnicalSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCalculator?: () => void;
  onSelectProductForQuote?: (productName: string) => void;
}

export const TechnicalSheetsModal: React.FC<TechnicalSheetsModalProps> = ({
  isOpen,
  onClose,
  onOpenCalculator,
  onSelectProductForQuote,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [activeSheet, setActiveSheet] = useState<TechnicalSheetItem>(PINTUCO_TECHNICAL_SHEETS[0]);

  if (!isOpen) return null;

  const filteredSheets = PINTUCO_TECHNICAL_SHEETS.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.surface.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'todos' || item.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Encabezado en Azul Institucional ColorLink */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-blue-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-sky-300 font-bold bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">
                  CENTRO DE DOCUMENTACIÓN TÉCNICA
                </span>
                <span className="text-xs text-blue-200 hidden sm:inline">· Laboratorio Pintuco Colombia</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-['Space_Grotesk'] text-white mt-0.5">
                Fichas Técnicas Oficiales de Pinturas & Recubrimientos
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-100 hover:text-white transition-colors cursor-pointer border border-blue-700/50 hidden sm:flex items-center gap-1.5 text-xs font-semibold"
              title="Imprimir o guardar ficha técnica en PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Buscador & Selector de Categoría */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre de producto (ej. Viniltex, Koraza, Pintulux) o código..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {['todos', 'Arquitectónica', 'Fachadas', 'Esmaltes & Metales', 'Industrial & Pisos', 'Preparación'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-[#082857] text-white shadow-2xs'
                    : 'bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                }`}
              >
                {cat === 'todos' ? 'Todas las Líneas' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido en 2 Columnas: Lista de Fichas (Izq) + Vista Detallada de la Ficha (Der) */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Columna Izquierda: Lista de Fichas Técnicas */}
          <div className="md:col-span-5 overflow-y-auto p-3 sm:p-4 space-y-2 bg-slate-50/50">
            <span className="text-[11px] font-mono text-slate-500 uppercase font-semibold block px-1">
              {filteredSheets.length} Fichas Técnicas Disponibles
            </span>

            {filteredSheets.map((sheet) => {
              const isSelected = activeSheet.id === sheet.id;
              return (
                <div
                  key={sheet.id}
                  onClick={() => setActiveSheet(sheet)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-white border-blue-600 shadow-xs ring-1 ring-blue-600/30'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.2 rounded border border-blue-200">
                      {sheet.code}
                    </span>
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.2 rounded border border-amber-200">
                      Garantía {sheet.warrantyYears} Años
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {sheet.productName}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {sheet.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Columna Derecha: Ficha Técnica Oficial Desplegada */}
          <div className="md:col-span-7 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white print:p-0">
            {/* Header del Producto Activo */}
            <div className="border-b border-slate-200 pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  {activeSheet.code} · Norma: {activeSheet.normaTecnica}
                </span>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  ✓ Certificación Vigente Icontec
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-['Space_Grotesk'] mt-1">
                {activeSheet.productName}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {activeSheet.description}
              </p>
            </div>

            {/* Cuadrícula de Parámetros de Laboratorio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">
                  Rendimiento Teórico:
                </span>
                <strong className="text-slate-900 font-mono text-[11.5px] mt-0.5 block">
                  {activeSheet.coverageM2Galon}
                </strong>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">
                  Secado al Tacto / Entre Manos:
                </span>
                <strong className="text-slate-900 text-[11.5px] mt-0.5 block">
                  {activeSheet.dryingTimeTouch} · Repinte: {activeSheet.dryingTimeRepaint}
                </strong>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">
                  Dilución Recomendada:
                </span>
                <strong className="text-slate-900 text-[11.5px] mt-0.5 block">
                  {activeSheet.dilutionRecommended}
                </strong>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">
                  Sólidos por Volumen & Acabado:
                </span>
                <strong className="text-slate-900 text-[11.5px] mt-0.5 block">
                  {activeSheet.solidsVolume} · {activeSheet.finish}
                </strong>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 sm:col-span-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">
                  Sustratos y Superficies Recomendadas:
                </span>
                <strong className="text-slate-900 text-[11.5px] mt-0.5 block">
                  {activeSheet.surface}
                </strong>
              </div>
            </div>

            {/* Ventajas & Especificaciones de Aplicación */}
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2 text-xs">
              <span className="font-bold text-blue-950 font-mono text-[11px] uppercase block">
                Propiedades Destacadas de la Ficha Técnica:
              </span>
              <ul className="space-y-1.5 text-slate-700">
                {activeSheet.highlights.map((h, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botones de Acción: Cotizar / Calcular con esta Pintura */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200">
              <span className="text-[11px] font-mono text-slate-500">
                Garantía Certificada Pintuco: <strong>{activeSheet.warrantyYears} Años Oficiales</strong>
              </span>

              <div className="flex items-center gap-2">
                {onOpenCalculator && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCalculator();
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    <span>Calcular m²</span>
                  </button>
                )}

                {onSelectProductForQuote && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectProductForQuote(activeSheet.productName);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-[#082857] hover:bg-blue-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Cotizar este Producto</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
