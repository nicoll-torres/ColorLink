import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PaintRequest } from '../types';
import {
  Download,
  Printer,
  Receipt,
  FileText,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Copy,
  Check,
  Building,
  QrCode,
  LogoMark,
  AlertCircle,
  X,
} from '../icons';

interface InvoiceModalProps {
  request: PaintRequest;
  onClose: () => void;
}

// Convertidor de números a palabras en pesos colombianos
function numberToSpanishPesos(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'CERO PESOS M/CTE';

  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const tens = [
    '',
    'DIEZ',
    'VEINTE',
    'TREINTA',
    'CUARENTA',
    'CINCUENTA',
    'SESENTA',
    'SETENTA',
    'OCHENTA',
    'NOVENTA',
  ];
  const teens = [
    'DIEZ',
    'ONCE',
    'DOCE',
    'TRECE',
    'CATORCE',
    'QUINCE',
    'DIECISÉIS',
    'DIECISIETE',
    'DIECIOCHO',
    'DIECINUEVE',
  ];
  const hundreds = [
    '',
    'CIENTO',
    'DOSCIENTOS',
    'TRESCIENTOS',
    'CUATROCIENTOS',
    'QUINIENTOS',
    'SEISCIENTOS',
    'SETECIENTOS',
    'OCHOCIENTOS',
    'NOVECIENTOS',
  ];

  function convertGroup(n: number): string {
    let output = '';
    if (n === 100) return 'CIEN';
    if (n >= 100) {
      output += hundreds[Math.floor(n / 100)] + ' ';
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      output += teens[n - 10] + ' ';
      return output.trim();
    }
    if (n >= 20) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      if (ten === 2 && unit > 0) {
        output += 'VEINTI' + units[unit] + ' ';
        return output.trim();
      }
      output += tens[ten];
      if (unit > 0) output += ' Y ' + units[unit];
      output += ' ';
      return output.trim();
    }
    if (n > 0) {
      output += units[n] + ' ';
    }
    return output.trim();
  }

  let millions = Math.floor(rounded / 1000000);
  let thousands = Math.floor((rounded % 1000000) / 1000);
  let remainder = rounded % 1000;

  let result = '';

  if (millions > 0) {
    if (millions === 1) {
      result += 'UN MILLÓN ';
    } else {
      result += convertGroup(millions) + ' MILLONES ';
    }
  }

  if (thousands > 0) {
    if (thousands === 1) {
      result += 'MIL ';
    } else {
      result += convertGroup(thousands) + ' MIL ';
    }
  }

  if (remainder > 0) {
    result += convertGroup(remainder) + ' ';
  }

  return `${result.trim()} PESOS M/CTE`;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ request, onClose }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedCufe, setCopiedCufe] = useState(false);
  const invoicePrintRef = useRef<HTMLDivElement>(null);

  const calc = request.technicalCalculation;
  const rawSubtotal = request.items && request.items.length > 0
    ? request.items.reduce((sum, it) => sum + (it.totalCostCOP || 0), 0)
    : (calc?.estimatedMaterialCostCOP || 1850000);
  
  // Si requiere servicio de cuadrilla, calculamos costo de aplicación
  const applicationCost = request.requiresApplicationService
    ? Math.round(request.areaM2 * 14500)
    : 0;

  const totalBeforeTax = Math.round(rawSubtotal + applicationCost);
  const taxIVA = Math.round(totalBeforeTax * 0.19);
  const grandTotal = totalBeforeTax + taxIVA;

  // Generar datos fiscales estándar DIAN Pintuco
  const invoiceNum = request.requestCode
    ? `FAC-${request.requestCode.replace('PTC-', 'PTC-2026-')}`
    : `FAC-PTC-2026-${Math.floor(Math.random() * 89999 + 10000)}`;

  const issueDate = request.createdAt ? request.createdAt.split(' ')[0] : '2026-08-30';
  const cufeHash = `fe83a92b${request.id || '9021'}c7104b3a9852df8302194857bca710928374615243bc9102847591028374a621`;

  // Construir lista de artículos facturados
  const invoiceItems = request.items && request.items.length > 0
    ? request.items.map((it) => ({
        sku: (it.sku || 'PTC-ITEM').toUpperCase(),
        description: `${it.productName}${it.colorName && it.colorName !== 'N/A' && !it.colorName.includes('Material') ? ` - Color: ${it.colorName}` : ''}`,
        quantity: it.quantity,
        unit: it.presentation === 'cuñete' ? 'Cuñete (5 Gal)' : it.presentation === 'galon' ? 'Galón (3.785 L)' : it.presentation === 'cuarto' ? '1/4 Galón' : 'Unidad',
        unitPrice: it.unitPrice,
        total: it.totalCostCOP,
      }))
    : [
        {
          sku: calc?.recommendedProduct.id.toUpperCase() || 'PTC-KOR-EXT-01',
          description: `${calc?.recommendedProduct.name || 'Pintura Pintuco Alta Gama'} - Color: ${request.colorName} (Línea ${calc?.recommendedProduct.line || 'Arquitectónica'})`,
          quantity: calc?.totalCuñetes || 3,
          unit: 'Cuñete (5 Gal)',
          unitPrice: (calc?.recommendedProduct.pricePerGalon || 115000) * 4.6,
          total: ((calc?.recommendedProduct.pricePerGalon || 115000) * 4.6) * (calc?.totalCuñetes || 3),
        },
      ];

  if (!request.items && calc?.remainderGalons && calc.remainderGalons > 0) {
    invoiceItems.push({
      sku: `${calc.recommendedProduct.id.toUpperCase()}-GAL`,
      description: `${calc.recommendedProduct.name} - Galón Fraccionado de Ajuste`,
      quantity: calc.remainderGalons,
      unit: 'Galón (3.785 L)',
      unitPrice: calc.recommendedProduct.pricePerGalon,
      total: calc.recommendedProduct.pricePerGalon * calc.remainderGalons,
    });
  }

  // Solo si es material comprado directamente o si el cliente expresamente lo incluyó
  if (request.orderItemType === 'material' && calc?.recommendedPrimerProduct && calc.primerGalons && calc.primerGalons > 0) {
    invoiceItems.push({
      sku: 'PTC-SELL-7EN1',
      description: `${calc.recommendedPrimerProduct.name} - Imprimante Sellador`,
      quantity: calc.primerGalons,
      unit: 'Galón',
      unitPrice: calc.recommendedPrimerProduct.pricePerGalon || 68000,
      total: (calc.recommendedPrimerProduct.pricePerGalon || 68000) * calc.primerGalons,
    });
  }

  if (request.requiresApplicationService) {
    invoiceItems.push({
      sku: 'SRV-APL-CERT-01',
      description: `Servicio de Cuadrilla de Aplicación Certificada Pintuco (${request.areaM2} m² con preparación de superficie y garantía técnica)`,
      quantity: request.areaM2,
      unit: 'Metro Cuadrado (m²)',
      unitPrice: 14500,
      total: applicationCost,
    });
  }

  // Descarga en PDF
  const handleDownloadPdf = async () => {
    if (!invoicePrintRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = invoicePrintRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Factura_Pintuco_${request.requestCode || 'PTC-2026'}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF de factura:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyCufe = () => {
    navigator.clipboard.writeText(cufeHash);
    setCopiedCufe(true);
    setTimeout(() => setCopiedCufe(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="bg-white w-full max-w-2xl md:max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Barra Superior de Acciones - Estilo ColorLink Oficial */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-sky-300 font-bold block">
                FACTURA ELECTRÓNICA DE VENTA DIAN · COLORLINK OFICIAL
              </span>
              <h2 className="text-sm font-bold font-['Space_Grotesk'] text-white">
                {invoiceNum} · {request.clientName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              style={{ color: '#000000' }}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-black rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md border-2 border-black disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-black" style={{ color: '#000000' }} />
              <span style={{ color: '#000000' }} className="text-black font-black">
                {isGeneratingPdf ? 'Generando PDF...' : 'Descargar Factura PDF'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors hidden sm:flex cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-lg font-bold transition-colors ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenedor Imprimible y Convertidor a PDF */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 bg-slate-100/70">
          <div
            ref={invoicePrintRef}
            style={{ color: '#000000' }}
            className="bg-white p-5 sm:p-7 rounded-xl border-2 border-black shadow-xs space-y-5 text-black font-sans"
          >
            {/* Encabezado Corporativo ColorLink */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-black pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <LogoMark className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-black tracking-tight font-['Space_Grotesk']">
                      COLORLINK S.A.S.
                    </h1>
                    <span className="text-[11px] font-mono text-black font-bold block">
                      NIT: 890.900.123-1 · IVA Régimen Común · Gran Contribuyente
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-black font-semibold space-y-0.5 pt-1">
                  <p>Gran Contribuyente · Autorretenedor Res. 008920</p>
                  <p>Sede Principal: Centro Empresarial Tecnológico, Rionegro, Antioquia</p>
                  <p>Línea Nacional: 01 8000 111 247 · soporte@colorlink.co</p>
                </div>
              </div>

              <div className="text-right space-y-1 bg-white p-3 rounded-xl border-2 border-black min-w-[240px]">
                <span className="text-[11px] font-mono uppercase font-black text-black block">
                  FACTURA ELECTRÓNICA DE VENTA
                </span>
                <p className="text-lg font-black font-mono text-black">{invoiceNum}</p>
                <div className="text-[11px] font-mono text-black font-bold space-y-0.5 pt-1 border-t border-black">
                  <p><strong>Fecha Emisión:</strong> {issueDate} 08:30 COT</p>
                  <p><strong>Fecha Vencimiento:</strong> {issueDate} (Contado / Inmediato)</p>
                  <p><strong>Radicado ColorLink:</strong> {request.requestCode}</p>
                </div>
              </div>
            </div>

            {/* Bloque de Información del Cliente & Proyecto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border-2 border-black">
              <div className="space-y-1 text-black">
                <span className="text-[11px] font-mono uppercase font-black text-black block">
                  DATOS FISCALES DEL ADQUIRENTE / CLIENTE
                </span>
                <p className="text-sm font-black text-black">{request.clientName}</p>
                <p className="font-mono font-bold text-black">NIT / CC: {request.invoiceDetails?.clientNit || '900.123.456-7'}</p>
                <p className="font-semibold text-black">Dirección: {request.deliveryAddress || `${request.city}, Colombia`}</p>
                <p className="font-semibold text-black">Ciudad: {request.city} · Tel: {request.clientPhone}</p>
                <p className="font-semibold text-black">Email: {request.clientEmail}</p>
              </div>

              <div className="space-y-1 sm:border-l-2 sm:border-black sm:pl-4 text-black">
                <span className="text-[11px] font-mono uppercase font-black text-black block">
                  CONDICIONES COMERCIALES & ENTREGA
                </span>
                <p className="font-semibold text-black"><strong>Tipo de Obra:</strong> Proyecto {request.projectType}</p>
                <p className="font-semibold text-black"><strong>Superficie:</strong> {request.surfaceType.toUpperCase()}</p>
                <p className="font-semibold text-black"><strong>Forma de Pago:</strong> Transferencia Bancaria Bancolombia / PSE</p>
                <p className="font-semibold text-black">
                  <strong>Estado de Pago:</strong>{' '}
                  <span className="px-2 py-0.5 rounded border border-black bg-emerald-100 text-black font-black font-mono text-[10px]">
                    PAGADA · APROBADA
                  </span>
                </p>
                <p className="font-semibold text-black"><strong>Bodega CEDI Despacho:</strong> {request.inventoryAllocation?.warehouseCity || request.city} (Muelle Central)</p>
              </div>
            </div>

            {/* Tabla de Artículos Facturados */}
            <div className="overflow-x-auto border-2 border-black rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-200 font-mono text-[11px] uppercase text-black font-black border-b-2 border-black">
                  <tr>
                    <th className="p-2.5 text-black">CÓDIGO / SKU</th>
                    <th className="p-2.5 text-black">DESCRIPCIÓN DEL PRODUCTO / SERVICIO</th>
                    <th className="p-2.5 text-center text-black">CANT.</th>
                    <th className="p-2.5 text-center text-black">UNIDAD</th>
                    <th className="p-2.5 text-right text-black">VALOR UNIT.</th>
                    <th className="p-2.5 text-right text-black">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-black font-sans text-black">
                  {invoiceItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-100">
                      <td className="p-2.5 font-mono text-[11px] font-black text-black">{item.sku}</td>
                      <td className="p-2.5 text-black font-bold">{item.description}</td>
                      <td className="p-2.5 text-center font-mono font-black text-black">{item.quantity}</td>
                      <td className="p-2.5 text-center text-black font-semibold">{item.unit}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-black">${Math.round(item.unitPrice).toLocaleString('es-CO')}</td>
                      <td className="p-2.5 text-right font-mono font-black text-black">
                        ${Math.round(item.total).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Desglose de Totales e Impuestos DIAN */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              <div className="sm:col-span-7 p-3.5 bg-white border-2 border-black rounded-xl space-y-2 text-xs text-black">
                <div>
                  <span className="text-[11px] font-mono uppercase text-black font-black block">
                    VALOR TOTAL EN LETRAS:
                  </span>
                  <p className="font-black text-black uppercase text-xs leading-tight mt-0.5">
                    {numberToSpanishPesos(grandTotal)}
                  </p>
                </div>

                <div className="pt-2 border-t border-black text-[11px] text-black font-semibold space-y-1">
                  <p><strong>Resolución DIAN:</strong> N° 1876400019283 del 2026-01-15 (Prefijo FAC Rango 0001 a 999999).</p>
                  <p>Esta factura electrónica de venta es un título valor según el Artículo 774 del Código de Comercio.</p>
                  <p className="flex items-center gap-1 text-black font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                    Incluye Garantía de Fábrica ColorLink S.A.S. ({calc?.warrantyDurationYears || 5} Años).
                  </p>
                </div>
              </div>

              {/* Caja de totales con alto contraste en texto negro puro */}
              <div className="sm:col-span-5 bg-white border-2 border-black text-black p-4 rounded-xl space-y-2 text-xs font-mono shadow-xs">
                <div className="flex items-center justify-between text-black font-bold">
                  <span>Subtotal Gravable:</span>
                  <span>${totalBeforeTax.toLocaleString('es-CO')} COP</span>
                </div>
                <div className="flex items-center justify-between text-black font-bold">
                  <span>IVA (19% Discriminado):</span>
                  <span>${taxIVA.toLocaleString('es-CO')} COP</span>
                </div>
                <div className="flex items-center justify-between text-black font-bold">
                  <span>Retenciones:</span>
                  <span>$0 COP</span>
                </div>
                <div className="pt-2 border-t-2 border-black flex items-center justify-between text-sm font-black text-black">
                  <span>TOTAL A PAGAR:</span>
                  <span className="text-base font-black">${grandTotal.toLocaleString('es-CO')} COP</span>
                </div>
              </div>
            </div>

            {/* Código CUFE & Validación Electrónica */}
            <div className="p-3 bg-white border-2 border-black rounded-xl flex items-center justify-between gap-3 text-xs text-black">
              <div className="space-y-0.5 overflow-hidden">
                <span className="text-[11px] font-mono uppercase text-black font-black block">
                  CUFE (Código Único de Factura Electrónica):
                </span>
                <p className="font-mono text-[10px] text-black font-bold truncate max-w-[500px]">
                  {cufeHash}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyCufe}
                className="px-2.5 py-1 text-[11px] font-mono font-bold bg-slate-100 hover:bg-slate-200 text-black border border-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                {copiedCufe ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                {copiedCufe ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            {/* Firmas de Conformidad */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t-2 border-black text-center text-xs text-black">
              <div className="space-y-1">
                <div className="h-10 border-b-2 border-dashed border-black flex items-end justify-center pb-1">
                  <span className="font-mono text-[11px] text-black font-black">Firma Digital ColorLink (Certificada)</span>
                </div>
                <p className="font-black text-black">COLORLINK S.A.S. - Emisor</p>
                <p className="text-[11px] text-black font-semibold">Representante Comercial & Facturación</p>
              </div>

              <div className="space-y-1">
                <div className="h-10 border-b-2 border-dashed border-black flex items-end justify-center pb-1">
                  <span className="font-mono text-[11px] text-black font-black">{request.clientName}</span>
                </div>
                <p className="font-black text-black">Aceptación Adquirente / Cliente</p>
                <p className="text-[11px] text-black font-semibold">Recibido a Satisfacción Electrónica</p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Documento válido para deducción tributaria DIAN y reclamo de garantía técnica.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              style={{ color: '#000000' }}
              className="py-2.5 px-4 text-xs flex items-center gap-2 shadow-md rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black border-2 border-black cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-black" style={{ color: '#000000' }} />
              <span style={{ color: '#000000' }} className="text-black font-black">
                {isGeneratingPdf ? 'Generando PDF...' : 'Descargar Factura PDF'}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary !py-2 !px-4 !text-xs"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
