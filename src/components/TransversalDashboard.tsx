import React, { useState } from 'react';
import { PaintRequest, PintucoProduct } from '../types';
import { PINTUCO_PRODUCTS, PINTUCO_WAREHOUSES } from '../data';
import { InvoiceModal } from './InvoiceModal';
import {
  Layers,
  Paintbrush,
  Package,
  Truck,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Sliders,
  PlusCircle,
  FileText,
  Building,
  MapPin,
  Sparkles,
  Receipt,
} from '../icons';

interface TransversalDashboardProps {
  requests: PaintRequest[];
  onSelectRequest: (req: PaintRequest) => void;
  onCreateNewRequest: () => void;
  onNavigateToHome?: () => void;
  onOpenCalculator: () => void;
  onOpenAiAssistant: () => void;
  onOpenCertificate: (req: PaintRequest) => void;
  onOpenInvoice?: (req: PaintRequest) => void;
}

export const TransversalDashboard: React.FC<TransversalDashboardProps> = ({
  requests,
  onSelectRequest,
  onCreateNewRequest,
  onNavigateToHome,
  onOpenCalculator,
  onOpenAiAssistant,
  onOpenCertificate,
  onOpenInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'flujo' | 'tecnica' | 'abastecimiento' | 'servicio' | 'calidad'>('flujo');
  const [selectedReqId, setSelectedReqId] = useState<string>(requests[0]?.id || '');
  const [selectedInvoice, setSelectedInvoice] = useState<PaintRequest | null>(null);
  const [filterCity, setFilterCity] = useState<string>('todos');

  const selectedRequest = requests.find((r) => r.id === selectedReqId) || requests[0];

  const filteredRequests = requests.filter((r) => {
    if (filterCity !== 'todos' && r.city !== filterCity) return false;
    return true;
  });

  const getStatusBadge = (status: PaintRequest['status']) => {
    switch (status) {
      case 'solicitud_recibida':
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono">1. Necesidad</span>;
      case 'solucion_tecnica':
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px] font-mono">2. Sol. Técnica</span>;
      case 'abastecimiento':
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-mono">3. Abastecimiento</span>;
      case 'servicio_despacho':
        return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[11px] font-mono">4. Servicio / Ruta</span>;
      case 'calidad_garantia':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-mono">5. Calidad Aprobada</span>;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-2" id="transversal-dashboard-container">
      {/* Banner Superior: Contexto Institucional UCC & ColorLink */}
      <div className="bg-slate-900 text-white p-6 md:p-7 rounded-2xl shadow-xs mb-6 border border-slate-800 relative overflow-hidden">
        {/* Glow sutil institucional */}
        <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-[10px] uppercase tracking-wider bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded border border-blue-400/30 font-semibold">
                UNIVERSIDAD COOPERATIVA DE COLOMBIA · RETO ELECTIVA IV
              </span>
              <span className="text-xs text-slate-400 font-mono">Semestre 2026</span>
            </div>
            <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white mt-1 tracking-tight">
              ColorLink · Ecosistema Transversal 360°
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Plataforma integral que resuelve la fragmentación técnica, comercial y operativa: integrando requerimiento, formulación técnica, inventario en CEDI, servicio de despacho y garantía de calidad certificada.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateToHome && (
              <button
                type="button"
                onClick={onNavigateToHome}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-slate-700"
                id="btn-dash-back-home"
              >
                <span>← Catálogo & Inicio</span>
              </button>
            )}
            <button
              type="button"
              onClick={onCreateNewRequest}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-blue-500"
              id="btn-dash-new-request"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nueva Solicitud</span>
            </button>
            <button
              type="button"
              onClick={onOpenCalculator}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer shadow-2xs"
              id="btn-dash-calculator"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>Calculadora m²</span>
            </button>
          </div>
        </div>

        {/* 5 Pilares Interactivos - Selector de pestañas */}
        <div className="grid grid-cols-5 gap-2 mt-5 pt-4 border-t border-white/15 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('flujo')}
            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
              activeTab === 'flujo'
                ? 'bg-white/20 border-sky-300 shadow-xs ring-1 ring-sky-300'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className={`flex items-center gap-1.5 mb-1 ${activeTab === 'flujo' ? 'text-sky-300' : 'text-white/70'}`}>
              <Layers className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] font-bold uppercase">1. Necesidad</span>
            </div>
            <p className="text-xs font-semibold text-white truncate">Captura & Solicitudes</p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tecnica')}
            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
              activeTab === 'tecnica'
                ? 'bg-white/20 border-sky-300 shadow-xs ring-1 ring-sky-300'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className={`flex items-center gap-1.5 mb-1 ${activeTab === 'tecnica' ? 'text-sky-300' : 'text-white/70'}`}>
              <Paintbrush className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] font-bold uppercase">2. Sol. Técnica</span>
            </div>
            <p className="text-xs font-semibold text-white truncate">Cálculo & Fórmulas</p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('abastecimiento')}
            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
              activeTab === 'abastecimiento'
                ? 'bg-white/20 border-sky-300 shadow-xs ring-1 ring-sky-300'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className={`flex items-center gap-1.5 mb-1 ${activeTab === 'abastecimiento' ? 'text-sky-300' : 'text-white/70'}`}>
              <Package className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] font-bold uppercase">3. Abastecimiento</span>
            </div>
            <p className="text-xs font-semibold text-white truncate">Stock & Bodegas</p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('servicio')}
            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
              activeTab === 'servicio'
                ? 'bg-white/20 border-sky-300 shadow-xs ring-1 ring-sky-300'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className={`flex items-center gap-1.5 mb-1 ${activeTab === 'servicio' ? 'text-sky-300' : 'text-white/70'}`}>
              <Truck className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] font-bold uppercase">4. Servicio</span>
            </div>
            <p className="text-xs font-semibold text-white truncate">Ruta & Cuadrillas</p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calidad')}
            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
              activeTab === 'calidad'
                ? 'bg-white/20 border-sky-300 shadow-xs ring-1 ring-sky-300'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className={`flex items-center gap-1.5 mb-1 ${activeTab === 'calidad' ? 'text-sky-300' : 'text-white/70'}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] font-bold uppercase">5. Calidad</span>
            </div>
            <p className="text-xs font-semibold text-white truncate">Garantía Oficial ColorLink</p>
          </button>
        </div>
      </div>

      {/* Contenido Principal de la Pestaña Activa */}
      {activeTab === 'flujo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Listado de Solicitudes Recibidas (Pilar 1) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-navy-900 text-sm font-['Space_Grotesk']">
                  Bandeja de Proyectos Pintuco
                </h3>
                <p className="text-xs text-slate-500">Solicitudes activas multicanal</p>
              </div>

              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg p-1.5 font-mono text-slate-700 bg-slate-50"
              >
                <option value="todos">Todas las ciudades</option>
                <option value="Medellín">Medellín</option>
                <option value="Bogotá D.C.">Bogotá D.C.</option>
                <option value="Cali">Cali</option>
              </select>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
              {filteredRequests.map((req) => {
                const isSelected = req.id === selectedReqId;
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedReqId(req.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-teal-800">{req.requestCode}</span>
                      {getStatusBadge(req.status)}
                    </div>
                    <p className="text-xs font-bold text-navy-900 truncate">{req.clientName}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                      <span>{req.city} · {req.areaM2} m²</span>
                      <span className="text-teal-700 font-semibold">{req.projectType}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna Central y Derecha: Detalle de Integración de los 5 Pilares para la Solicitud Seleccionada */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            {selectedRequest ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200 mb-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-teal-700 font-bold">
                      Trazabilidad Integral del Proyecto
                    </span>
                    <h2 className="text-xl font-bold text-navy-900">{selectedRequest.requestCode} · {selectedRequest.clientName}</h2>
                    <p className="text-xs text-slate-500">
                      Registrado el {selectedRequest.createdAt} · Ciudad: {selectedRequest.city}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedRequest.qualityCertificate && (
                      <button
                        type="button"
                        onClick={() => onOpenCertificate(selectedRequest)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Certificado de Calidad
                      </button>
                    )}
                  </div>
                </div>

                {/* Pipeline Visual de 5 Fases Conectadas */}
                <div className="grid grid-cols-5 gap-2 mb-6">
                  <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200">
                    <span className="text-[10px] font-mono text-teal-800 font-bold block">1. NECESIDAD</span>
                    <p className="text-xs font-semibold text-navy-900 mt-0.5">{selectedRequest.surfaceType.replace('_', ' ')}</p>
                    <span className="text-[10px] text-slate-500 font-mono">{selectedRequest.areaM2} m²</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                    <span className="text-[10px] font-mono text-blue-800 font-bold block">2. TÉCNICA</span>
                    <p className="text-xs font-semibold text-navy-900 mt-0.5 truncate">{selectedRequest.technicalCalculation?.recommendedProduct.name}</p>
                    <span className="text-[10px] text-blue-700 font-mono font-bold">{selectedRequest.technicalCalculation?.totalGalons} Gal</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] font-mono text-amber-800 font-bold block">3. STOCK</span>
                    <p className="text-xs font-semibold text-navy-900 mt-0.5 truncate">{selectedRequest.inventoryAllocation?.warehouseCity}</p>
                    <span className="text-[10px] text-amber-700 font-mono font-bold">Lote Asignado</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                    <span className="text-[10px] font-mono text-purple-800 font-bold block">4. SERVICIO</span>
                    <p className="text-xs font-semibold text-navy-900 mt-0.5 truncate">
                      {selectedRequest.serviceLogistics ? 'Cuadrilla OK' : 'Solo Entrega'}
                    </p>
                    <span className="text-[10px] text-purple-700 font-mono font-bold">{selectedRequest.serviceLogistics?.logisticsStatus || 'Despachado'}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-mono text-emerald-800 font-bold block">5. CALIDAD</span>
                    <p className="text-xs font-semibold text-navy-900 mt-0.5 truncate">
                      {selectedRequest.technicalCalculation?.warrantyDurationYears} Años Gar.
                    </p>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">Q.A. Aprobado</span>
                  </div>
                </div>

                {/* Desglose de Especificación Técnica & Presupuesto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-bold text-navy-900 uppercase font-mono mb-2 flex items-center gap-1.5">
                      <Paintbrush className="w-3.5 h-3.5 text-teal-700" />
                      Especificación de Pintura & Acabado
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <p><strong className="text-slate-700">Producto:</strong> {selectedRequest.technicalCalculation?.recommendedProduct.name}</p>
                      <p><strong className="text-slate-700">Línea Pintuco:</strong> {selectedRequest.technicalCalculation?.recommendedProduct.line}</p>
                      <p><strong className="text-slate-700">Color Seleccionado:</strong> {selectedRequest.colorName}</p>
                      <p><strong className="text-slate-700">Manos Requeridas:</strong> {selectedRequest.technicalCalculation?.handsNeeded} manos ({selectedRequest.technicalCalculation?.recommendedProduct.finishType})</p>
                      <p><strong className="text-slate-700">Dilución:</strong> {selectedRequest.technicalCalculation?.recommendedProduct.dilution}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-bold text-navy-900 uppercase font-mono mb-2 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-teal-700" />
                      Inventario & Logística de Entrega
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <p><strong className="text-slate-700">Bodega Origen:</strong> {selectedRequest.inventoryAllocation?.warehouseName}</p>
                      <p><strong className="text-slate-700">Número de Lote:</strong> {selectedRequest.inventoryAllocation?.batchNumber}</p>
                      <p><strong className="text-slate-700">Envases Asignados:</strong> {selectedRequest.technicalCalculation?.totalCuñetes} Cuñetes + {selectedRequest.technicalCalculation?.remainderGalons} Galones</p>
                      <p><strong className="text-slate-700">Presupuesto Estimado:</strong> <span className="font-mono font-bold text-teal-800">${(selectedRequest.technicalCalculation?.estimatedMaterialCostCOP || 0).toLocaleString('es-CO')} COP</span></p>
                      {selectedRequest.serviceLogistics && (
                        <p><strong className="text-slate-700">Líder Cuadrilla:</strong> {selectedRequest.serviceLogistics.crewLead}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Instrucciones Técnicas y Preparación de Superficie */}
                <div className="mt-4 p-4 rounded-xl bg-teal-900/5 border border-teal-700/20">
                  <h4 className="text-xs font-bold text-teal-900 uppercase font-mono mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                    Protocolo de Aplicación & Preparación de Superficie
                  </h4>
                  <ul className="text-xs text-slate-700 space-y-1">
                    {selectedRequest.technicalCalculation?.preparationAdvice.map((advice, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-teal-700 font-bold">•</span>
                        <span>{advice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Seleccione una solicitud para ver su trazabilidad.</p>
            )}
          </div>
        </div>
      )}

      {/* Pestaña: Catálogo y Fichas Técnicas (Pilar 2) */}
      {activeTab === 'tecnica' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-navy-900 font-['Space_Grotesk']">
                Catálogo Técnico de Recubrimientos Pintuco
              </h2>
              <p className="text-xs text-slate-500">
                Fichas de rendimiento, tiempos de secado y normatividad técnica
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenCalculator}
              className="btn-primary !py-2 !text-xs"
            >
              Abrir Calculadora Técnica
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PINTUCO_PRODUCTS.map((prod) => (
              <div key={prod.id} className="p-4 rounded-xl border border-slate-200 hover:border-teal-600 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {prod.line}
                    </span>
                    <span className="text-[11px] font-bold text-teal-700 font-mono">
                      {prod.warrantyYears} años garantía
                    </span>
                  </div>
                  <h3 className="font-bold text-navy-900 text-sm">{prod.name}</h3>
                  <p className="text-[11px] text-slate-500 mb-2">{prod.category}</p>
                  <p className="text-xs text-slate-600 mb-3">{prod.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rendimiento:</span>
                    <span className="font-bold text-navy-900">{prod.coveragePerGalM2} m²/gal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Secado al tacto:</span>
                    <span>{prod.dryingTouchHours} hora(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Precio galón aprox:</span>
                    <span className="text-teal-800 font-bold">${(prod.pricePerGalon || 0).toLocaleString('es-CO')} COP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pestaña: Abastecimiento & Inventario (Pilar 3) */}
      {activeTab === 'abastecimiento' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-navy-900 font-['Space_Grotesk']">
              Red Nacional de Centros de Distribución Pintuco
            </h2>
            <p className="text-xs text-slate-500">
              Disponibilidad en tiempo real para despacho y cubicaje de pedidos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PINTUCO_WAREHOUSES.map((wh, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-navy-900 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-teal-700" />
                    {wh.city}
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    Operativo
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800">{wh.name}</p>
                <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {wh.address}
                </p>

                <div className="pt-2 border-t border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nivel de Stock:</span>
                    <span className="font-semibold text-teal-800">{wh.stockStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tiempo prom. despacho:</span>
                    <span className="font-mono">{wh.avgDispatchHours} horas</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pestaña: Servicio y Logística (Pilar 4) */}
      {activeTab === 'servicio' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-navy-900 font-['Space_Grotesk']">
              Gestión de Cuadrillas y Despacho en Ruta
            </h2>
            <p className="text-xs text-slate-500">
              Seguimiento operativo de entrega y pintores maestros certificados Pintuco
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h3 className="font-bold text-navy-900 text-sm mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-700" />
                Despachos Logísticos Activos
              </h3>
              <div className="space-y-2 text-xs">
                {requests.filter(r => r.serviceLogistics).map(r => (
                  <div key={r.id} className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex justify-between font-mono font-bold text-teal-800 mb-1">
                      <span>{r.requestCode}</span>
                      <span className="text-purple-700">{r.serviceLogistics?.logisticsStatus}</span>
                    </div>
                    <p className="text-slate-700 font-semibold">{r.clientName} ({r.city})</p>
                    <p className="text-slate-500 text-[11px]">Entrega programada: {r.serviceLogistics?.estimatedDeliveryDate}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h3 className="font-bold text-navy-900 text-sm mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                Cuadrillas Certificadas Pintuco
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <p className="font-bold text-navy-900">Cuadrilla Alfa - Pintores Maestros</p>
                  <p className="text-slate-600 text-[11px]">Líder: Ing. Carlos Restrepo (Certificado #P-9021)</p>
                  <p className="text-emerald-700 font-mono text-[11px] mt-1 font-semibold">● Asignada a Constructora Bolívar</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <p className="font-bold text-navy-900">Cuadrilla Hospitalaria Pintuco</p>
                  <p className="text-slate-600 text-[11px]">Líder: Téc. Mauricio Duarte (Acreditación Sanitaria)</p>
                  <p className="text-emerald-700 font-mono text-[11px] mt-1 font-semibold">● Asignada a Clínica San Vicente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pestaña: Calidad y Garantía (Pilar 5) */}
      {activeTab === 'calidad' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-navy-900 font-['Space_Grotesk']">
              Control de Calidad y Emisión de Garantías
            </h2>
            <p className="text-xs text-slate-500">
              Protocolos de ensayo de adherencia, espesores de película seca (mils) y certificados
            </p>
          </div>

          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    Certificado #{req.qualityCertificate?.certificateId || 'PENDIENTE'}
                  </span>
                  <h3 className="font-bold text-navy-900 text-sm mt-1">{req.clientName} ({req.city})</h3>
                  <p className="text-xs text-slate-600">
                    Sistema: {req.technicalCalculation?.recommendedProduct.name} ({req.technicalCalculation?.warrantyDurationYears} Años de Garantía)
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Humedad sustrato: {req.qualityCertificate?.substrateMoisture}% · Espesor película seca: {req.qualityCertificate?.dryFilmThicknessMils} mils
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenInvoice) onOpenInvoice(req);
                      else setSelectedInvoice(req);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Receipt className="w-3.5 h-3.5 text-teal-400" />
                    Factura PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenCertificate(req)}
                    className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Certificado Oficial
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Factura Electrónica en PDF */}
      {selectedInvoice && (
        <InvoiceModal
          request={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
