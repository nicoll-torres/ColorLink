import React, { useState, useMemo } from 'react';
import { SurfaceType, PintucoProduct } from '../types';
import { PINTUCO_PRODUCTS, calculatePintucoSystem } from '../data';
import {
  Paintbrush,
  Layers,
  RotateCcw,
  Package,
  ShieldCheck,
  Droplet,
  Sparkles,
  ArrowRight,
  Sliders,
} from '../icons';

interface TechnicalCalculatorProps {
  onApplyCalculationToRequest?: (surface: SurfaceType, areaM2: number) => void;
  onClose: () => void;
}

export const TechnicalCalculator: React.FC<TechnicalCalculatorProps> = ({
  onApplyCalculationToRequest,
  onClose,
}) => {
  const [calculationMode, setCalculationMode] = useState<'area' | 'dimensions'>('dimensions');
  const [wallWidth, setWallWidth] = useState<number>(4);
  const [wallHeight, setWallHeight] = useState<number>(2.6);
  const [wallCount, setWallCount] = useState<number>(4);
  const [openingsAreaM2, setOpeningsAreaM2] = useState<number>(4); // puertas y ventanas a descontar
  const [directAreaM2, setDirectAreaM2] = useState<number>(80);
  const [surfaceType, setSurfaceType] = useState<SurfaceType>('mamposteria_interior');
  const [selectedProductId, setSelectedProductId] = useState<string>('viniltex-biocuidado');

  const computedArea = useMemo(() => {
    if (calculationMode === 'area') {
      return Math.max(1, directAreaM2 || 1);
    }
    const rawTotal = wallWidth * wallHeight * wallCount;
    const net = Math.max(1, rawTotal - openingsAreaM2);
    return Math.round(net * 10) / 10;
  }, [calculationMode, wallWidth, wallHeight, wallCount, openingsAreaM2, directAreaM2]);

  const calculation = useMemo(() => {
    return calculatePintucoSystem(surfaceType, computedArea);
  }, [surfaceType, computedArea]);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden my-auto" id="technical-calculator-modal">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4 shrink-0">
        <div>
          <span className="text-[11px] font-mono uppercase text-amber-700 font-bold block">
            MOTOR DE CÁLCULO TÉCNICO PINTUCO OFICIAL
          </span>
          <h2 className="text-xl font-bold text-slate-900 font-['Space_Grotesk']">
            Calculadora Técnica de Rendimiento & Cubicaje
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost text-xs text-slate-500 hover:text-slate-800 p-1 font-bold cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-y-auto pr-1">
        {/* Columna Izquierda: Parámetros */}
        <div className="lg:col-span-7 space-y-4">
          {/* Selector de modo de cálculo */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setCalculationMode('dimensions')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                calculationMode === 'dimensions'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Medir por Dimensiones (Ancho × Alto)
            </button>
            <button
              type="button"
              onClick={() => setCalculationMode('area')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                calculationMode === 'area'
                  ? 'bg-white text-navy-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ingresar Área Total (m²)
            </button>
          </div>

          {calculationMode === 'dimensions' ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Ancho pared (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={wallWidth}
                    onChange={(e) => setWallWidth(Number(e.target.value))}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Alto pared (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={wallHeight}
                    onChange={(e) => setWallHeight(Number(e.target.value))}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    # Paredes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={wallCount}
                    onChange={(e) => setWallCount(Number(e.target.value))}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Descuento por puertas y ventanas (m² a restar):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={openingsAreaM2}
                  onChange={(e) => setOpeningsAreaM2(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-between items-center text-xs font-mono border-t border-slate-200">
                <span className="text-slate-600">Área neta calculada:</span>
                <span className="font-bold text-teal-800 text-sm">{computedArea} m²</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Área Total a Cubrir (m²):
              </label>
              <input
                type="number"
                min="1"
                max="50000"
                value={directAreaM2}
                onChange={(e) => setDirectAreaM2(Number(e.target.value))}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white font-mono font-bold"
              />
            </div>
          )}

          {/* Tipo de Superficie */}
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1.5">
              Tipo de Sustrato / Superficie
            </label>
            <select
              value={surfaceType}
              onChange={(e) => setSurfaceType(e.target.value as SurfaceType)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-medium cursor-pointer"
            >
              <option value="mamposteria_interior">Pared Interior / Drywall (Viniltex BioCuidado)</option>
              <option value="fachada_exterior">Fachada Exterior Intemperie (Koraza Máxima Protección)</option>
              <option value="metal_ferroso">Metales Ferrosos / Rejas (Pintulux 3 en 1)</option>
              <option value="concreto_piso">Pisos Industriales / Bodegas (Pintucoat Epóxico 500)</option>
              <option value="madera">Maderas Interiores / Exteriores (Maderprotect)</option>
              <option value="humedad_salitre">Pared con Humedad / Salitre (Sellomax + Koraza)</option>
            </select>
          </div>
        </div>

        {/* Columna Derecha: Resultado del Cubicaje */}
        <div className="lg:col-span-5 bg-gradient-to-br from-navy-900 to-slate-900 text-white p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <span className="font-mono text-[11px] text-teal-300 font-bold uppercase">
                Resultado de Cubicaje
              </span>
              <span className="text-[11px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
                {computedArea} m² Netos
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <p className="text-slate-400 text-[11px]">Pintura sugerida:</p>
                <p className="font-bold text-teal-300 text-base">
                  {calculation.recommendedProduct.name}
                </p>
                <p className="text-slate-300 text-[11px]">
                  Rendimiento: {calculation.recommendedProduct.coveragePerGalM2} m²/gal · {calculation.handsNeeded} manos
                </p>
              </div>

              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <p className="text-slate-300 text-[11px]">Volumen comercial a despachar:</p>
                <p className="font-mono font-bold text-amber-300 text-lg">
                  {calculation.totalCuñetes > 0 && `${calculation.totalCuñetes} Cuñete(s) (5 gal) + `}
                  {calculation.remainderGalons} Galón(es)
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Total volumen: {calculation.totalGalons} galones
                </p>
              </div>

              {calculation.recommendedPrimerProduct && (
                <div className="p-2.5 bg-teal-950/40 rounded-lg border border-teal-500/30 text-[11px]">
                  <p className="text-teal-200 font-semibold">
                    Fondo Sellador Requerido:
                  </p>
                  <p className="text-slate-300">
                    {calculation.recommendedPrimerProduct.name} ({calculation.primerGalons} Gal)
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-white/15 flex items-center justify-between">
                <span className="text-slate-300">Costo total aprox:</span>
                <span className="font-mono text-base font-bold text-teal-300">
                  ${(calculation.estimatedMaterialCostCOP || 0).toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-white/15 flex gap-2">
            {onApplyCalculationToRequest && (
              <button
                type="button"
                id="btn-apply-calc-to-request"
                onClick={() => onApplyCalculationToRequest(surfaceType, computedArea)}
                className="w-full py-3.5 px-4 rounded-xl font-black text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
              >
                <span>🎨 Crear Nueva Pintura con este Cálculo ({computedArea} m²)</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
