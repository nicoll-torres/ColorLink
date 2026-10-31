import React from 'react';
import { PaintRequest } from '../types';
import { ShieldCheck, CheckCircle2, FileText, LogoMark } from '../icons';

interface QualityCertificateModalProps {
  request: PaintRequest;
  onClose: () => void;
}

export const QualityCertificateModal: React.FC<QualityCertificateModalProps> = ({
  request,
  onClose,
}) => {
  const calc = request.technicalCalculation;
  const cert = request.qualityCertificate;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Encabezado del Certificado Oficial ColorLink */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white relative shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                <LogoMark className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-sky-300 font-bold block">
                  CERTIFICADO OFICIAL DE CALIDAD & GARANTÍA
                </span>
                <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">ColorLink Oficial</h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            >
              ×
            </button>
          </div>

          <div className="mt-3.5 pt-3 border-t border-white/15 flex items-center justify-between text-xs font-mono">
            <span>Certificado N°: <strong>{cert?.certificateId || 'GAR-PTC-99201'}</strong></span>
            <span className="bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded font-bold border border-amber-400/30">
              VIGENTE ({calc?.warrantyDurationYears || 5} AÑOS)
            </span>
          </div>
        </div>

        {/* Cuerpo del Certificado */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-3.5 text-xs text-slate-800">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="font-bold text-navy-900 uppercase font-mono text-[11px] mb-2">
              1. Datos del Titular y Proyecto
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Cliente / Titular:</span>
                <span className="font-semibold text-navy-900">{request.clientName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Ciudad:</span>
                <span className="font-semibold text-navy-900">{request.city}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Código Radicado:</span>
                <span className="font-mono font-bold text-teal-800">{request.requestCode}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tipo de Inmueble:</span>
                <span className="font-semibold">{request.projectType}</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="font-bold text-navy-900 uppercase font-mono text-[11px] mb-2">
              2. Especificación Técnica Aplicada
            </h3>
            <div className="space-y-1.5">
              <p><strong>Producto Certificado:</strong> {calc?.recommendedProduct.name} ({calc?.recommendedProduct.line})</p>
              <p><strong>Color / Referencia:</strong> {request.colorName}</p>
              <p><strong>Área Total Cubierta:</strong> {request.areaM2} m² ({calc?.handsNeeded} manos recomendadas)</p>
              <p><strong>Lote de Producción Planta:</strong> {request.inventoryAllocation?.batchNumber || 'LOTE-PTC-2026-VAL'}</p>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <h3 className="font-bold text-emerald-900 uppercase font-mono text-[11px] mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              3. Ensayos de Control de Calidad en Sustrato
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-lg border border-emerald-200">
                <span className="text-[10px] text-slate-500 block">Adherencia</span>
                <span className="font-bold text-emerald-800">{cert?.adhesionTest || 'Excelente'}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-emerald-200">
                <span className="text-[10px] text-slate-500 block">Humedad Sustrato</span>
                <span className="font-bold text-emerald-800">{cert?.substrateMoisture || 3.9}%</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-emerald-200">
                <span className="text-[10px] text-slate-500 block">Espesor Película</span>
                <span className="font-bold text-emerald-800">{cert?.dryFilmThicknessMils || 4.2} mils</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
            <span>Inspector: {cert?.inspectorName || 'Ing. Andrea Valencia Q.A.'}</span>
            <span>Vencimiento: {cert?.warrantyExpirationDate || '2031-08-30'}</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-secondary !py-2 !text-xs flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            Imprimir Certificado
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary !py-2 !text-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
