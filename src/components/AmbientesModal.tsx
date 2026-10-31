import React from 'react';
import {
  X,
  Home,
  Building,
  ShieldCheck,
  Sparkles,
  Droplet,
  Truck,
  Layers,
  ArrowRight,
  CheckCircle2,
  Paintbrush,
} from '../icons';
import { SurfaceType } from '../types';

interface AmbientesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoomAndQuote?: (surface: SurfaceType, productName: string, colorTag: string) => void;
  onNavigateHomeAmbientes?: () => void;
}

interface RoomEnvironment {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  desc: string;
  productName: string;
  finish: string;
  specText: string;
  surface: SurfaceType;
  colorTag: string;
  colorHex: string;
  icon: React.ReactNode;
  imageUrl: string;
  features: string[];
}

const AMBIENTES_DATA: RoomEnvironment[] = [
  {
    id: 'sala',
    title: 'Sala & Estar',
    badge: 'INTERIORES',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
    desc: 'Áreas sociales de alto tránsito familiar donde la durabilidad, fácil lavado y la ausencia de olores fuertes son clave.',
    productName: 'Viniltex® Avanzada Bio-Cuidado',
    finish: 'Mate Sedoso · 2 Manos Recomendadas',
    specText: 'Fórmula antibacterial Bio-Pruf® que neutraliza 99.9% de hongos y bacterias en muros interiores.',
    surface: 'mamposteria_interior',
    colorTag: 'Brisa Marina & Neutros',
    colorHex: '#86DEB8',
    icon: <Building className="w-5 h-5 text-blue-600" />,
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=700&q=80',
    features: ['Cero olor al secar', 'Lavabilidad extrema clase 1', 'Protección antibacterial'],
  },
  {
    id: 'fachadas',
    title: 'Fachadas & Balcones',
    badge: 'EXTERIORES',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    desc: 'Protección elástica continua contra lluvia ácida, rayos UV intensos y choque térmico del clima colombiano.',
    productName: 'Koraza® 5 Años Protección Total',
    finish: 'Satinado Antialgas · 2 Manos',
    specText: 'Resina 100% acrílica que sella microfisuras y repele la acumulación de hollín y polución.',
    surface: 'fachada_exterior',
    colorTag: 'Arenas & Slate',
    colorHex: '#3D4B58',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=700&q=80',
    features: ['100% Acrílica elástica', 'Filtro UV contra decoloración', 'Garantía 5 años'],
  },
  {
    id: 'alcoba',
    title: 'Alcobas & Descanso',
    badge: 'CONFORT & PAZ',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    desc: 'Espacios de reposo que requieren pigmentos de absorción suave, bajo COV ecológico y cero reflejos luminosos.',
    productName: 'Viniltex® Seda Aterciopelada',
    finish: 'Seda Mate · 2 Manos',
    specText: 'Acabado terso al tacto, secado rápido y fórmula ecológica certificada sin metales pesados.',
    surface: 'drywall_yeso',
    colorTag: 'Caliza Serena & Neutros',
    colorHex: '#FCFBF6',
    icon: <Sparkles className="w-5 h-5 text-indigo-600" />,
    imageUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=700&q=80',
    features: ['Acabado terciopelo', 'Bajo COV ecológico', 'Dispersión suave de luz'],
  },
  {
    id: 'banos_cocinas',
    title: 'Cocinas & Baños',
    badge: 'ZONAS HÚMEDAS',
    badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-200',
    desc: 'Muros expuestos a vapor continuo de agua caliente, condensación y salpicaduras de grasa y alimentos.',
    productName: 'Viniltex® Baños & Cocinas Bio-Pruf®',
    finish: 'Semibrillante Lavable · 2 Manos',
    specText: 'Película ultra cerrada impermeable con fungicidas activos de máxima duración antihongos.',
    surface: 'humedad_salitre',
    colorTag: 'Brisa Caribeña & Aqua',
    colorHex: '#27CBD2',
    icon: <Droplet className="w-5 h-5 text-cyan-600" />,
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=700&q=80',
    features: ['Barrera antihongos Bio-Pruf®', 'Resiste grasa y vapores', 'Superficie lavable'],
  },
  {
    id: 'pisos',
    title: 'Pisos & Parqueaderos',
    badge: 'ALTO TRÁFICO',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    desc: 'Recubrimiento epóxico bicomponente de alta resistencia a la abrasión y tránsito de montacargas y vehículos.',
    productName: 'Pintucoat® Epóxico Poliamida 500',
    finish: 'Brillante Industrial · 2 Manos',
    specText: 'Resistencia mecánica a solventes, aceites automotrices, derrame químico y tránsito continuo.',
    surface: 'concreto_piso',
    colorTag: 'Gris Grafito Industrial',
    colorHex: '#3D4B58',
    icon: <Truck className="w-5 h-5 text-amber-600" />,
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=700&q=80',
    features: ['100% Sólidos epóxicos', 'Resiste tráfico vehicular', 'Acabado liso de fácil aseo'],
  },
  {
    id: 'metales',
    title: 'Metales & Portones',
    badge: 'ANTICORROSIVO',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-200',
    desc: 'Esmalte 3 en 1 de aplicación directa sobre hierro, rejas o aluminio sin requerir removedores agresivos.',
    productName: 'Pintulux® Máxima Protección 3 en 1',
    finish: 'Brillante Metálico · 2 Manos',
    specText: 'Transforma el óxido existente, actúa como fondo anticorrosivo y otorga brillo intemperie de alta dureza.',
    surface: 'metal_ferroso',
    colorTag: 'Azul Real & Ocre Silvestre',
    colorHex: '#082857',
    icon: <Layers className="w-5 h-5 text-rose-600" />,
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=700&q=80',
    features: ['3 en 1: Anticorrosivo + Esmalte', 'Aplica directo sobre óxido', 'Secado rápido'],
  },
];

export const AmbientesModal: React.FC<AmbientesModalProps> = ({
  isOpen,
  onClose,
  onSelectRoomAndQuote,
  onNavigateHomeAmbientes,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Encabezado en Azul Institucional ColorLink */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-blue-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-sky-300 font-bold bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">
                  ESPACIOS ARQUITECTÓNICOS COLORLINK
                </span>
                <span className="text-xs text-blue-200 hidden sm:inline">· 6 Ambientes Especializados Pintuco</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-['Space_Grotesk'] text-white mt-0.5">
                Nuestros Ambientes y Soluciones Técnicas
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido con Scroll de los 6 Ambientes */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 space-y-6">
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
            <div>
              <p className="font-bold text-blue-950 text-sm">
                ¿Qué tipo de espacio deseas pintar o intervenir?
              </p>
              <p className="text-slate-600 mt-0.5">
                Cada ambiente cuenta con una formulación de pintura específica diseñada para su desgaste y exposición ambiental.
              </p>
            </div>
            {onNavigateHomeAmbientes && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateHomeAmbientes();
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs whitespace-nowrap shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <span>Ver en Galería Interactiva</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Grilla de los 6 Ambientes Arquitectónicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {AMBIENTES_DATA.map((amb) => (
              <div
                key={amb.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Imagen del Ambiente con Badge */}
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={amb.imageUrl}
                    alt={amb.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border shadow-xs ${amb.badgeColor}`}>
                      {amb.badge}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg leading-tight font-['Space_Grotesk'] drop-shadow-xs">
                        {amb.title}
                      </h3>
                      <span className="text-[11px] text-sky-200 font-medium">
                        {amb.colorTag}
                      </span>
                    </div>

                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-xs shrink-0"
                      style={{ backgroundColor: amb.colorHex }}
                      title={`Color referencial: ${amb.colorTag}`}
                    />
                  </div>
                </div>

                {/* Detalles y Especificación Técnica del Ambiente */}
                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-4">
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {amb.desc}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                        <Paintbrush className="w-3.5 h-3.5 shrink-0" />
                        <span>{amb.productName}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 block">
                        {amb.finish}
                      </span>
                      <p className="text-[10.5px] text-slate-500 italic leading-snug">
                        {amb.specText}
                      </p>
                    </div>

                    {/* Chips de Características */}
                    <div className="space-y-1 pt-1">
                      {amb.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botón de Acción para este Ambiente */}
                  <div className="pt-2 border-t border-slate-100 mt-auto">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onSelectRoomAndQuote) {
                          onSelectRoomAndQuote(amb.surface, amb.productName, amb.colorTag);
                        } else if (onNavigateHomeAmbientes) {
                          onNavigateHomeAmbientes();
                        }
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Cotizar para {amb.title}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Todos los ambientes incluyen cálculo exacto de rendimiento y despacho directo desde el CEDI más cercano.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs ml-auto transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
