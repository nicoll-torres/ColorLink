import React, { useState } from 'react';
import { PaintRequest } from '../types';
import { InvoiceModal } from './InvoiceModal';
import { getSupabaseConfig } from '../supabase';
import {
  CheckCircle2,
  Package,
  Truck,
  ShieldCheck,
  FileText,
  ArrowRight,
  RotateCcw,
  Sliders,
  ExternalLink,
  Receipt,
  Download,
  Database,
  AlertTriangle,
} from '../icons';

interface SuccessViewProps {
  request: PaintRequest;
  onNewRequest: () => void;
  onViewTransversal: () => void;
  onOpenCertificateModal: () => void;
  onOpenInvoiceModal?: () => void;
  onOpenSupabaseModal?: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  request,
  onNewRequest,
  onViewTransversal,
  onOpenCertificateModal,
  onOpenInvoiceModal,
  onOpenSupabaseModal,
}) => {
  const [showInvoice, setShowInvoice] = useState(false);
  const calc = request.technicalCalculation;
  const supabaseCfg = getSupabaseConfig();

  return (
    <div className="form-card max-w-[540px] success-card" id="success-view-card">
      <div className="flex items-center gap-3 mb-3">
        <div className="success-icon" id="success-icon-badge">
          <CheckCircle2 className="w-8 h-8 text-teal-600" />
        </div>
        <div>
          <p className="card-eyebrow !mb-0 text-teal-700">SISTEMA INTEGRADO COLORLINK</p>
          <h2 className="card-title text-2xl !mb-0">¡Solución Técnica Generada!</h2>
        </div>
      </div>

      <p className="card-subtitle !mb-4">
        Su requerimiento ha sido procesado e integrado exitosamente a través de los 5 pilares del ecosistema Pintuco.
      </p>

      {/* Código de radicado */}
      <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl mb-3 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono text-teal-800 uppercase block font-semibold">
            Código de radicado Pintuco
          </span>
          <span className="font-mono font-bold text-navy-900 text-lg">{request.requestCode}</span>
        </div>
        <span className="text-xs font-mono bg-teal-700 text-white px-2.5 py-1 rounded-full font-medium">
          Estado: {request.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Estado de Persistencia en Base de Datos Supabase */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-navy-900">
            <Database className="w-4 h-4 text-teal-700" />
            <span>Base de Datos Supabase (PostgreSQL 12 Tablas)</span>
          </div>
          {onOpenSupabaseModal && (
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="text-[11px] text-teal-700 hover:text-teal-900 font-bold underline flex items-center gap-0.5"
            >
              <span>Ver Estado / SQL</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-600">
          Proyecto Conectado: <code className="text-teal-800 font-bold font-mono">pxtskluzbcxydzqaigke.supabase.co</code>
        </p>
        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span>Orden guardada y protegida localmente. Si tu proyecto Supabase tiene RLS activo (código 42501), recuerda ejecutar el </span>
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="text-amber-800 font-bold underline hover:text-amber-950"
            >
              script de desbloqueo RLS
            </button>
            <span> en tu SQL Editor para habilitar la sincronización directa en la nube.</span>
          </div>
        </div>
      </div>

      {/* Resumen de los 5 pilares integrados */}
      <div className="summary-box" id="success-summary-box">
        <h3 className="summary-title" id="summary-header">
          Desglose Integral de la Solución (Reto Pintuco)
        </h3>

        <dl>
          <div>
            <dt>1. Cliente & Ubicación:</dt>
            <dd>
              {request.clientName} · {request.city} ({request.projectType})
            </dd>
          </div>

          <div>
            <dt>2. Solución Técnica & Pintura:</dt>
            <dd className="text-teal-900 font-semibold">
              {calc?.recommendedProduct.name} ({calc?.handsNeeded} manos) · Acabado {calc?.recommendedProduct.finishType}
            </dd>
          </div>

          <div>
            <dt>3. Cubicaje de Materiales:</dt>
            <dd className="font-mono text-slate-800">
              {calc?.totalCuñetes ? `${calc.totalCuñetes} Cuñete(s) (5 gal) + ` : ''}
              {calc?.remainderGalons} Galón(es) para {request.areaM2} m²
              {calc?.recommendedPrimerProduct && (
                <span className="text-xs font-normal text-slate-600 block">
                  + {calc.primerGalons} Gal de {calc.recommendedPrimerProduct.name}
                </span>
              )}
            </dd>
          </div>

          <div>
            <dt>4. Abastecimiento & Inventario:</dt>
            <dd className="text-slate-800">
              {request.inventoryAllocation?.warehouseName} (Lote: {request.inventoryAllocation?.batchNumber})
            </dd>
          </div>

          {request.serviceLogistics && (
            <div>
              <dt>5. Servicio de Aplicación & Logística:</dt>
              <dd className="text-slate-800">
                {request.serviceLogistics.certifiedCrewAssigned} ({request.serviceLogistics.estimatedDays} días estimados)
              </dd>
            </div>
          )}

          <div>
            <dt>6. Garantía de Calidad Pintuco:</dt>
            <dd className="text-emerald-800 font-medium">
              Certificado Digital #{request.qualityCertificate?.certificateId} ({calc?.warrantyDurationYears} Años de Garantía)
            </dd>
          </div>
        </dl>
      </div>

      {/* Insumos adicionales sugeridos */}
      {calc && calc.requiredSupplies.length > 0 && (
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-xs font-bold text-navy-900 mb-1.5 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-teal-700" />
            Kit de Aplicación e Insumos Asignados:
          </p>
          <ul className="text-xs text-slate-700 grid grid-cols-2 gap-1 font-mono">
            {calc.requiredSupplies.slice(0, 4).map((item, idx) => (
              <li key={idx} className="truncate">
                • {item.quantity} {item.unit} {item.name.split(' ')[0]} {item.name.split(' ')[1]}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Acciones principales */}
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onNewRequest}
          className="btn-primary w-full !bg-teal-700 hover:!bg-teal-800 text-white flex items-center justify-center gap-2 shadow-xs"
          id="btn-goto-client-portal-tracking"
        >
          <Truck className="w-4 h-4 text-emerald-300" />
          <span>Ver Seguimiento en Vivo en Mi Portal de Cliente</span>
          <ArrowRight className="w-4 h-4 ml-auto" />
        </button>

        <button
          type="button"
          onClick={onNewRequest}
          className="btn-secondary w-full text-xs flex items-center justify-center gap-2 cursor-pointer"
          id="btn-view-another-quote"
        >
          <RotateCcw className="w-4 h-4 text-teal-700" />
          <span>Realizar Otra Cotización o Ver Catálogo</span>
          <ArrowRight className="w-4 h-4 ml-auto" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (onOpenInvoiceModal) onOpenInvoiceModal();
            else setShowInvoice(true);
          }}
          style={{ color: '#000000' }}
          className="w-full text-xs flex items-center justify-center gap-2 shadow-md py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black border-2 border-black cursor-pointer transition-all"
          id="btn-download-invoice-pdf"
        >
          <Receipt className="w-4 h-4 text-black" style={{ color: '#000000' }} />
          <span style={{ color: '#000000' }} className="text-black font-black">
            📄 Descargar Factura Electrónica (PDF)
          </span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenCertificateModal}
            className="btn-secondary text-xs flex items-center justify-center gap-1.5"
            id="btn-open-certificate-modal"
          >
            <FileText className="w-3.5 h-3.5 text-teal-700" />
            Ver Certificado & Ficha
          </button>

          <button
            type="button"
            onClick={onNewRequest}
            className="btn-secondary text-xs flex items-center justify-center gap-1.5"
            id="btn-new-request-again"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nueva Solicitud
          </button>
        </div>
      </div>

      {showInvoice && (
        <InvoiceModal
          request={request}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  );
};
