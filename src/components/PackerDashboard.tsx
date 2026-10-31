import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PaintRequest, UserProfile, ManualPackedItem } from '../types';
import { sendOrderPackedEmail } from '../emailService';
import { getProductImage } from '../data';
import { isSameCity } from '../utils/cityUtils';
import {
  Boxes,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Scale,
  ShieldCheck,
  Clock,
  MapPin,
  FileText,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Palette,
  Truck,
  Eye,
  Check,
  Plus,
  Trash2,
  Edit3,
  Minus,
  RotateCcw,
  PenTool,
  Lock,
} from '../icons';

interface PackerDashboardProps {
  currentUser: UserProfile;
  requests: PaintRequest[];
  onUpdateRequest: (updated: PaintRequest) => void;
  onOpenCalculator: () => void;
}

export const PackerDashboard: React.FC<PackerDashboardProps> = ({
  currentUser,
  requests,
  onUpdateRequest,
  onOpenCalculator,
}) => {
  // REGLA ESTRICTA: El empacador SOLO puede ver los pedidos de su misma Ciudad principal
  const packerCity = currentUser.city || 'Medellín';
  const cityRequests = useMemo(() => {
    return requests.filter(
      (r) => isSameCity(r.city, packerCity) || isSameCity(r.inventoryAllocation?.warehouseCity, packerCity)
    );
  }, [requests, packerCity]);

  const [selectedReqId, setSelectedReqId] = useState<string>(cityRequests[0]?.id || '');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | 'pendientes' | 'empacados'>('todos');

  const selectedRequest = cityRequests.find((r) => r.id === selectedReqId) || cityRequests[0];

  // Helper que obtiene los ítems de pintura que el cliente ordenó originalmente (CERO insumos extra)
  const getOrderedPaintItems = (req: PaintRequest): ManualPackedItem[] => {
    // Si el cliente hizo un pedido con múltiples productos diferentes
    if (req.items && req.items.length > 0) {
      return req.items.map((it, idx) => {
        const isPaint = it.itemType === 'pintura';
        const colorTxt = it.colorName && !it.colorName.includes('Material') && it.colorName !== 'N/A' ? ` (Color: ${it.colorName})` : '';
        let unitTxt = 'Unidad';
        if (it.presentation === 'cuñete') unitTxt = 'Cuñete (5 Gal)';
        else if (it.presentation === 'galon') unitTxt = 'Galón (1 Gal)';
        else if (it.presentation === 'cuarto') unitTxt = '1/4 Galón';

        return {
          id: `item-${req.id || Date.now()}-${idx}`,
          description: `${it.productName}${colorTxt}`,
          quantity: it.quantity,
          unit: unitTxt,
          notes: isPaint
            ? `Lote ${req.inventoryAllocation?.batchNumber || 'LOTE-PTC-2026-B14'}`
            : 'Ítem solicitado por el cliente en su pedido',
          verified: true,
        };
      });
    }

    if (req.orderItemType === 'material') {
      return [
        {
          id: `mat-${req.id || Date.now()}-1`,
          description: req.catalogProductName || 'Insumo de Catálogo',
          quantity: req.materialQuantity || 1,
          unit: 'Unidad',
          notes: 'Material solicitado por el cliente',
          verified: true,
        },
      ];
    }

    const calc = req.technicalCalculation;
    const paintName = req.catalogProductName || calc?.recommendedProduct?.name || 'Pintura Pintuco';
    const colorTxt = req.colorName ? ` (Color: ${req.colorName})` : '';

    const reqCuñetes = calc?.totalCuñetes || 0;
    const reqGalones = calc?.remainderGalons || (reqCuñetes === 0 ? calc?.totalGalons || 5 : 0);

    const items: ManualPackedItem[] = [];

    if (reqCuñetes > 0) {
      items.push({
        id: `paint-${req.id || Date.now()}-c`,
        description: `${paintName}${colorTxt}`,
        quantity: reqCuñetes,
        unit: 'Cuñete (5 Gal)',
        notes: `Lote ${req.inventoryAllocation?.batchNumber || 'LOTE-PTC-2026-B14'}`,
        verified: true,
      });
    }

    if (reqGalones > 0) {
      items.push({
        id: `paint-${req.id || Date.now()}-g`,
        description: `${paintName}${colorTxt}`,
        quantity: reqGalones,
        unit: 'Galón (1 Gal)',
        notes: 'Envases sellados individuales',
        verified: true,
      });
    }

    if (items.length === 0) {
      items.push({
        id: `paint-${req.id || Date.now()}-base`,
        description: `${paintName}${colorTxt}`,
        quantity: calc?.totalGalons || 5,
        unit: 'Galón (1 Gal)',
        notes: 'Envases sellados de fábrica',
        verified: true,
      });
    }

    return items;
  };

  // Helper que inicializa los ítems en el terminal:
  // Si la orden ya fue empacada previamente, carga lo digitado por el empacador.
  // Si la orden está PENDIENTE DE EMPAQUE, arranca VACÍA para que el empacador REAL digite cada envase que empaca.
  const generateInitialManualItems = (req: PaintRequest): ManualPackedItem[] => {
    if (req.packagingDetails?.status === 'empacado_listo' && req.packagingDetails?.manualItems && req.packagingDetails.manualItems.length > 0) {
      if (req.items && req.items.length > 0) {
        return [...req.packagingDetails.manualItems];
      }
      const isUnwanted = (txt: string) => {
        const l = (txt || '').toLowerCase();
        return (
          l.includes('sellomax') ||
          l.includes('imprimante') ||
          l.includes('rodillo') ||
          l.includes('brocha') ||
          l.includes('bandeja') ||
          l.includes('cinta') ||
          l.includes('plástico') ||
          l.includes('plastico')
        );
      };
      const cleaned = req.packagingDetails.manualItems.filter((i) => !isUnwanted(i.description));
      if (cleaned.length > 0) return cleaned;
    }

    // Para una orden pendiente por empacar, NO METEMOS ítems por defecto:
    // El terminal arranca vacío para que el operario digite a mano lo que empaca
    return [];
  };

  // State: Cantidades exactas de pintura digitadas
  const [cuñetesCount, setCuñetesCount] = useState<number>(0);
  const [galonesCount, setGalonesCount] = useState<number>(0);
  const [cuartosCount, setCuartosCount] = useState<number>(0);
  const [batchCode, setBatchCode] = useState<string>('LOTE-PTC-2026-B14');
  const [colorVerified, setColorVerified] = useState<string>('');

  // State: Lista de ítems digitados en el terminal
  const [manualItems, setManualItems] = useState<ManualPackedItem[]>([]);
  const [weightKg, setWeightKg] = useState<number>(85);
  const [sealAttached, setSealAttached] = useState<boolean>(true);
  const [packerNotes, setPackerNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // State: Barra de digitación en vivo (como terminal de empaque real)
  const [digitizeText, setDigitizeText] = useState<string>('');
  const [digitizeQty, setDigitizeQty] = useState<number>(1);
  const [digitizeUnit, setDigitizeUnit] = useState<string>('Cuñete (5 Gal)');
  const [digitizeNote, setDigitizeNote] = useState<string>('');

  // Canvas para firma manual del empacador
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Sincronizar estado cuando cambia la orden seleccionada
  useEffect(() => {
    if (selectedRequest) {
      const initialItems = generateInitialManualItems(selectedRequest);
      setManualItems(initialItems);

      const pkg = selectedRequest.packagingDetails;
      const calc = selectedRequest.technicalCalculation;
      const isAlreadyPacked = pkg?.status === 'empacado_listo';

      const cCount = isAlreadyPacked ? (pkg?.cuñetesPacked ?? 0) : 0;
      const gCount = isAlreadyPacked ? (pkg?.galonesPacked ?? 0) : 0;
      const qCount = isAlreadyPacked ? (pkg?.cuartosPacked ?? 0) : 0;

      setCuñetesCount(cCount);
      setGalonesCount(gCount);
      setCuartosCount(qCount);
      setBatchCode(pkg?.batchCode || selectedRequest.inventoryAllocation?.batchNumber || 'LOTE-PTC-2026-B14');
      setColorVerified(selectedRequest.colorName || 'Estándar');

      // Preparar barra de digitación con la pintura pedida por el cliente
      const paintName = selectedRequest.catalogProductName || calc?.recommendedProduct?.name || 'Pintura Pintuco';
      const colorTxt = selectedRequest.colorName ? ` (Color: ${selectedRequest.colorName})` : '';
      setDigitizeText(`${paintName}${colorTxt}`);

      const reqCuñetes = calc?.totalCuñetes || 0;
      const reqGalones = calc?.remainderGalons || 0;
      if (reqCuñetes > 0) {
        setDigitizeQty(reqCuñetes);
        setDigitizeUnit('Cuñete (5 Gal)');
      } else if (reqGalones > 0) {
        setDigitizeQty(reqGalones);
        setDigitizeUnit('Galón (1 Gal)');
      } else {
        setDigitizeQty(1);
        setDigitizeUnit('Galón (1 Gal)');
      }
      setDigitizeNote('Lote de producción verificado');

      setWeightKg(pkg?.weightKg || (isAlreadyPacked ? 85 : 0));
      setSealAttached(pkg?.qualitySealAttached ?? true);
      setPackerNotes(pkg?.notes || pkg?.handwrittenNotes || '');
      setActionSuccess(null);
      setValidationError(null);
      setHasSignature(!!pkg?.packerSignature);

      // Redibujar firma si existe
      if (pkg?.packerSignature && canvasRef.current) {
        const img = new window.Image();
        img.src = pkg.packerSignature;
        img.onload = () => {
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(img, 0, 0);
          }
        };
      } else if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [selectedReqId, selectedRequest]);

  // Actualizar automáticamente los contadores de cuñetes, galones y peso según lo digitado
  const syncCountsFromItems = (items: ManualPackedItem[]) => {
    let cuñetes = 0;
    let galones = 0;
    let cuartos = 0;

    items.forEach((item) => {
      const u = (item.unit || '').toLowerCase();
      if (u.includes('cuñete')) {
        cuñetes += item.quantity;
      } else if (u.includes('1/4') || u.includes('cuarto')) {
        cuartos += item.quantity;
      } else if (u.includes('galón') || u.includes('galon')) {
        galones += item.quantity;
      }
    });

    setCuñetesCount(cuñetes);
    setGalonesCount(galones);
    setCuartosCount(cuartos);
    setWeightKg(Math.max(15, cuñetes * 24 + galones * 5 + cuartos * 1.5 + 5));
  };

  // Handler para digitar un ítem en el terminal (como en bodega real)
  const handleDigitizeItem = () => {
    if (!digitizeText.trim()) return;

    const newItem: ManualPackedItem = {
      id: `digitized-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      description: digitizeText.trim(),
      quantity: Number(digitizeQty) || 1,
      unit: digitizeUnit,
      notes: digitizeNote.trim() || 'Digitado en estación CEDI',
      verified: true,
    };

    const nextItems = [...manualItems, newItem];
    setManualItems(nextItems);
    syncCountsFromItems(nextItems);
    setValidationError(null);

    // Preparar el siguiente ítem sugerido si faltan galones
    const calc = selectedRequest?.technicalCalculation;
    const reqGalones = calc?.remainderGalons || 0;
    const paintName = selectedRequest?.catalogProductName || calc?.recommendedProduct?.name || 'Pintura Pintuco';
    const colorTxt = selectedRequest?.colorName ? ` (Color: ${selectedRequest?.colorName})` : '';

    if (digitizeUnit.includes('Cuñete') && reqGalones > 0) {
      setDigitizeText(`${paintName}${colorTxt}`);
      setDigitizeQty(reqGalones);
      setDigitizeUnit('Galón (1 Gal)');
      setDigitizeNote('Envases individuales');
    } else {
      setDigitizeNote('');
    }
  };

  // Atajos del terminal para agilizar digitación en bodega
  const handleQuickDigitizeCuñetes = () => {
    if (!selectedRequest) return;
    const calc = selectedRequest.technicalCalculation;
    const reqCuñetes = calc?.totalCuñetes || 1;
    const paintName = selectedRequest.catalogProductName || calc?.recommendedProduct?.name || 'Pintura Pintuco';
    const colorTxt = selectedRequest.colorName ? ` (Color: ${selectedRequest.colorName})` : '';

    const newItem: ManualPackedItem = {
      id: `digitized-c-${Date.now()}`,
      description: `${paintName}${colorTxt}`,
      quantity: reqCuñetes,
      unit: 'Cuñete (5 Gal)',
      notes: `Lote ${batchCode} - Cuñetes sellados`,
      verified: true,
    };
    const nextItems = [...manualItems, newItem];
    setManualItems(nextItems);
    syncCountsFromItems(nextItems);
    setValidationError(null);
  };

  const handleQuickDigitizeGalones = () => {
    if (!selectedRequest) return;
    const calc = selectedRequest.technicalCalculation;
    const reqGalones = calc?.remainderGalons || (calc?.totalCuñetes ? 1 : calc?.totalGalons || 5);
    const paintName = selectedRequest.catalogProductName || calc?.recommendedProduct?.name || 'Pintura Pintuco';
    const colorTxt = selectedRequest.colorName ? ` (Color: ${selectedRequest.colorName})` : '';

    const newItem: ManualPackedItem = {
      id: `digitized-g-${Date.now()}`,
      description: `${paintName}${colorTxt}`,
      quantity: reqGalones,
      unit: 'Galón (1 Gal)',
      notes: 'Galones sellados individuales',
      verified: true,
    };
    const nextItems = [...manualItems, newItem];
    setManualItems(nextItems);
    syncCountsFromItems(nextItems);
    setValidationError(null);
  };

  // Atajo: digitar automáticamente TODO lo que el cliente pidió
  const handleQuickDigitizeAllOrdered = () => {
    if (!selectedRequest) return;
    const items = getOrderedPaintItems(selectedRequest);
    setManualItems(items);
    syncCountsFromItems(items);
    setValidationError(null);
  };

  const handleUpdateItem = (id: string, field: keyof ManualPackedItem, value: any) => {
    setManualItems((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, [field]: value } : item));
      syncCountsFromItems(next);
      return next;
    });
  };

  const handleDeleteItem = (id: string) => {
    setManualItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      syncCountsFromItems(next);
      return next;
    });
  };

  const handleToggleVerified = (id: string) => {
    setManualItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, verified: !item.verified } : item))
    );
  };

  const handleClearAllItems = () => {
    setManualItems([]);
    setCuñetesCount(0);
    setGalonesCount(0);
    setCuartosCount(0);
    setWeightKg(0);
  };

  // Canvas drawing handlers for packer signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const filteredRequests = cityRequests.filter((r) => {
    const matchesSearch =
      r.requestCode.toLowerCase().includes(search.toLowerCase()) ||
      r.clientName.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    const isPacked = r.packagingDetails?.status === 'empacado_listo';
    if (filter === 'pendientes') return !isPacked;
    if (filter === 'empacados') return isPacked;
    return true;
  });

  const verifiedItemsCount = manualItems.filter((i) => i.verified).length;
  const totalItemsCount = manualItems.length;

  const handleCompletePacking = () => {
    if (!selectedRequest) return;

    if (manualItems.length === 0) {
      setValidationError('⚠️ El paquete no contiene envases. Digite en el terminal la pintura que está empacando antes de habilitar el despacho al conductor.');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Formatear la lista de insumos digitada a mano
      const formattedSupplies = manualItems.map(
        (i) => `${i.quantity} ${i.unit} - ${i.description}${i.notes ? ` [${i.notes}]` : ''}`
      );

      // Obtener firma en DataURL si existe
      let signatureDataUrl: string | undefined = selectedRequest.packagingDetails?.packerSignature;
      if (canvasRef.current && hasSignature) {
        try {
          signatureDataUrl = canvasRef.current.toDataURL('image/png');
        } catch (e) {
          console.error('Error exportando firma del empacador:', e);
        }
      }

      const updated: PaintRequest = {
        ...selectedRequest,
        status: selectedRequest.status === 'solicitud_recibida' ? 'abastecimiento' : selectedRequest.status,
        packagingDetails: {
          packerId: currentUser.id,
          packerName: currentUser.name,
          packedAt: timeStr,
          batchCode: batchCode || `LOTE-PTC-${now.getFullYear()}-B${Math.floor(Math.random() * 90 + 10)}`,
          checkedSupplies: formattedSupplies,
          manualItems: manualItems,
          cuñetesPacked: Number(cuñetesCount) || 0,
          galonesPacked: Number(galonesCount) || 0,
          cuartosPacked: Number(cuartosCount) || 0,
          weightKg: Number(weightKg) || 85,
          qualitySealAttached: sealAttached,
          qrInspectionCode: `QR-PTC-PACK-${selectedRequest.requestCode}`,
          status: 'empacado_listo',
          notes: packerNotes || 'Alistamiento verificado y digitado en terminal CEDI. Embalaje listo para despacho.',
          handwrittenNotes: packerNotes,
          packerSignature: signatureDataUrl,
        },
        deliveryDetails: {
          driverId: selectedRequest.deliveryDetails?.driverId || 'usr-con-1',
          driverName: selectedRequest.deliveryDetails?.driverName || 'Wilson Cañas',
          driverPhone: selectedRequest.deliveryDetails?.driverPhone || '+57 311 754 9988',
          vehiclePlate: selectedRequest.deliveryDetails?.vehiclePlate || 'WTL-582',
          vehicleType: selectedRequest.deliveryDetails?.vehicleType || 'Camión NHR 3.5 Toneladas',
          routeStatus: 'cargado_en_muelle',
          deliveryAddress: selectedRequest.deliveryAddress || `${selectedRequest.clientName}, ${selectedRequest.city}`,
          currentLocation: 'Muelle de Cargue CEDI Rionegro · Pedido empacado y listo para que el conductor inicie ruta',
        },
      };

      onUpdateRequest(updated);
      sendOrderPackedEmail(updated).catch(console.error);
      setIsSubmitting(false);
      setActionSuccess('¡Pedido empacado y sellado exitosamente! La orden quedó registrada con lo digitado y el Conductor fue desbloqueado en muelle.');
    }, 450);
  };

  // Información del pedido original para la tarjeta de resumen
  const calc = selectedRequest?.technicalCalculation;
  const originalPaintName = selectedRequest?.catalogProductName || calc?.recommendedProduct?.name || 'Pintura Pintuco';
  const originalColor = selectedRequest?.colorName || 'Formulación Pintuco';

  return (
    <div className="space-y-6" id="packer-dashboard-root">
      {/* Encabezado del Sistema de Empacador · Terminal CEDI */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-7 shadow-xs border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/90 text-slate-950 flex items-center justify-center font-bold shadow-xs shrink-0 border border-amber-300/40">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30 font-semibold">
                  SEDE CEDI {packerCity.toUpperCase()} · TERMINAL DE ALISTAMIENTO
                </span>
                <span className="text-xs text-slate-400 font-medium">· Verificación en Tiempo Real</span>
              </div>
              <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white mt-1 tracking-tight">
                Control de Alistamiento & Digitación · CEDI {packerCity}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/70 px-4 py-2 rounded-xl border border-slate-800 text-xs">
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-mono font-medium">Operario en Turno:</span>
              <strong className="text-white text-sm">{currentUser.name}</strong>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-xs">
              {currentUser.badgeNumber || 'CEDI'}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs relative z-10">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-mono uppercase">Total Órdenes {packerCity}:</span>
            <span className="text-lg font-bold font-mono text-white mt-0.5 block">{cityRequests.length} envíos</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-amber-300 block text-[10px] font-mono uppercase">Por Empacar:</span>
            <span className="text-lg font-bold font-mono text-amber-200 mt-0.5 block">
              {cityRequests.filter((r) => r.packagingDetails?.status !== 'empacado_listo').length}
            </span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-emerald-300 block text-[10px] font-mono uppercase">Listos en Muelle:</span>
            <span className="text-lg font-bold font-mono text-emerald-300 mt-0.5 block">
              {cityRequests.filter((r) => r.packagingDetails?.status === 'empacado_listo').length}
            </span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px] font-mono uppercase">Herramientas:</span>
              <span className="font-semibold text-white">Calculadora m²</span>
            </div>
            <button
              type="button"
              onClick={onOpenCalculator}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer border border-slate-700"
            >
              Abrir
            </button>
          </div>
        </div>
      </div>

      {/* Grid Principal: Cola de Pedidos a la Izquierda, Terminal del Empacador a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Cola de Pedidos (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-navy-900 uppercase font-mono tracking-wider flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-600" />
                Órdenes para Alistamiento
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {filteredRequests.length} de {cityRequests.length} en {packerCity}
              </span>
            </div>

            {/* Buscador y Filtro */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar código, cliente o ciudad..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-1">
                {(['todos', 'pendientes', 'empacados'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      filter === f
                        ? 'bg-amber-700 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f === 'todos' ? 'Todos' : f === 'pendientes' ? 'Por Empacar' : 'Empacados'}
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de tarjetas de órdenes */}
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                  <Boxes className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Sin órdenes para la sede {packerCity}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Como empacador de {packerCity}, únicamente visualizas los pedidos con origen o destino en tu ciudad principal.
                  </p>
                </div>
              ) : (
                filteredRequests.map((req) => {
                  const isSelected = req.id === selectedReqId;
                  const isPacked = req.packagingDetails?.status === 'empacado_listo';
                  const reqCalc = req.technicalCalculation;
                  const prodImg = getProductImage({
                    productName: reqCalc?.recommendedProduct?.name || req.surfaceType,
                  });

                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedReqId(req.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img
                            src={prodImg}
                            alt={req.clientName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {req.colorHex && (
                            <span
                              className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                              style={{ backgroundColor: req.colorHex }}
                              title={req.colorName}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs font-bold text-teal-800">
                              {req.requestCode}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                                isPacked
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {isPacked ? '✓ Empacado' : '⏳ Por Empacar'}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-900 truncate">
                            {req.clientName}
                          </p>

                          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600 font-mono">
                            <span>{req.city}</span>
                            <span className="text-amber-800 font-bold truncate">
                              {req.orderItemType === 'material'
                                ? `${req.materialQuantity || 1} Unidades`
                                : `${req.packagingDetails?.cuñetesPacked ?? (reqCalc?.totalCuñetes || 0)} C + ${req.packagingDetails?.galonesPacked ?? (reqCalc?.remainderGalons || 5)} Gal`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Terminal de Digitación en Vivo (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedRequest ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
              {/* Encabezado de la Orden */}
              <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-amber-400 font-bold">
                      {selectedRequest.requestCode}
                    </span>
                    <span className="text-xs text-slate-400">· Destino: {selectedRequest.city}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        selectedRequest.packagingDetails?.status === 'empacado_listo'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {selectedRequest.packagingDetails?.status === 'empacado_listo'
                        ? 'EMPACADO Y LISTO EN MUELLE'
                        : 'PENDIENTE DE EMPAQUE (CONDUCTOR BLOQUEADO)'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-['Space_Grotesk'] text-white mt-1">
                    {selectedRequest.clientName}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Dirección de entrega: {selectedRequest.deliveryAddress || 'Cra 43A # 18 Sur - 135, Medellín'}
                  </p>
                </div>

                <div className="text-right font-mono text-xs space-y-1">
                  <span className="text-slate-400 block text-[10px]">LOTE DE PRODUCCIÓN:</span>
                  <input
                    type="text"
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    placeholder="LOTE-PTC-2026-B14"
                    className="text-amber-300 font-bold bg-white/10 px-2.5 py-1 rounded border border-white/20 text-xs font-mono text-right focus:outline-hidden focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              {actionSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{actionSuccess}</span>
                </div>
              )}

              {/* TARJETA 1: LO QUE EL CLIENTE REALMENTE PIDIÓ (CLARIDAD ABSOLUTA) */}
              <div className="p-4 bg-emerald-950 text-white rounded-xl border border-emerald-800 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2">
                  <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {selectedRequest.items && selectedRequest.items.length > 0
                      ? `Pedido Oficial del Cliente (${selectedRequest.items.length} Productos Solicitados)`
                      : 'Pedido Original Real del Cliente (Sin Insumos Extra)'}
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-800/60 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700">
                    {selectedRequest.items && selectedRequest.items.length > 0
                      ? 'ORDEN MULTI-ÍTEM'
                      : selectedRequest.orderItemType === 'material'
                      ? 'ORDEN DE MATERIAL'
                      : 'ORDEN DE PINTURA ÚNICAMENTE'}
                  </span>
                </div>

                {selectedRequest.items && selectedRequest.items.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {selectedRequest.items.map((it, idx) => (
                        <div key={idx} className="bg-black/30 p-2 rounded-lg border border-emerald-800/60 text-xs">
                          <span className="text-slate-400 block text-[9.5px] uppercase font-mono truncate">{it.sku || `Ítem #${idx + 1}`}</span>
                          <strong className="text-white text-xs block truncate mt-0.5">{it.productName}</strong>
                          <div className="flex items-center justify-between mt-1 text-[11px] font-mono text-emerald-300">
                            <span>Cant: <strong>{it.quantity} {it.presentation || 'und'}</strong></span>
                            {it.colorName && it.colorName !== 'N/A' && !it.colorName.includes('Material') && (
                              <span className="text-amber-300 truncate max-w-[100px]">{it.colorName}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[11px] text-emerald-300/80 bg-emerald-900/40 p-2 rounded-lg border border-emerald-800/50 flex items-center gap-2">
                      <span className="text-amber-300 font-bold">ℹ️ NOTA PARA EL EMPACADOR:</span>
                      <span>Este pedido contiene <strong>{selectedRequest.items.length} productos diferentes</strong> solicitados por el cliente. Digite o agregue con los botones de atajo cada envase que va alistando.</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div className="bg-black/30 p-2.5 rounded-lg border border-emerald-800/60">
                        <span className="text-slate-400 block text-[10px] uppercase font-mono">Producto Comprado:</span>
                        <strong className="text-white text-sm block mt-0.5 truncate">{originalPaintName}</strong>
                      </div>

                      <div className="bg-black/30 p-2.5 rounded-lg border border-emerald-800/60">
                        <span className="text-slate-400 block text-[10px] uppercase font-mono">Color Formulado:</span>
                        <strong className="text-amber-300 text-sm block mt-0.5 truncate">{originalColor}</strong>
                      </div>

                      <div className="bg-black/30 p-2.5 rounded-lg border border-emerald-800/60">
                        <span className="text-slate-400 block text-[10px] uppercase font-mono">Volumen Solicitado:</span>
                        <strong className="text-emerald-300 text-sm block mt-0.5 font-mono">
                          {selectedRequest.orderItemType === 'material'
                            ? `${selectedRequest.materialQuantity || 1} Unidad(es)`
                            : `${(selectedRequest.technicalCalculation?.totalCuñetes || 0) > 0 ? `${selectedRequest.technicalCalculation?.totalCuñetes} Cuñete(s) (5 Gal)` : ''}${(selectedRequest.technicalCalculation?.totalCuñetes || 0) > 0 && (selectedRequest.technicalCalculation?.remainderGalons || 0) > 0 ? ' + ' : ''}${(selectedRequest.technicalCalculation?.remainderGalons || (selectedRequest.technicalCalculation?.totalCuñetes ? 0 : selectedRequest.technicalCalculation?.totalGalons || 5)) > 0 ? `${selectedRequest.technicalCalculation?.remainderGalons || (selectedRequest.technicalCalculation?.totalCuñetes ? 0 : selectedRequest.technicalCalculation?.totalGalons || 5)} Galón(es)` : ''}`}
                        </strong>
                      </div>
                    </div>

                    <div className="text-[11px] text-emerald-300/80 bg-emerald-900/40 p-2 rounded-lg border border-emerald-800/50 flex items-center gap-2">
                      <span className="text-amber-300 font-bold">ℹ️ NOTA PARA EL EMPACADOR:</span>
                      <span>Este pedido del cliente <strong>solo contiene pintura</strong>. No solicitó rodillos, brochas, sellador ni herramientas. Digite en el terminal los envases de pintura que va alistando.</span>
                    </div>
                  </>
                )}
              </div>

              {validationError && (
                <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* TERMINAL DE DIGITACIÓN EN VIVO (COMO TERMINAL REAL DE EMPAQUE) */}
              <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-700 shadow-md space-y-3 font-mono">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5" />
                      Terminal de Digitación de Empaque (CEDI Rionegro)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Digite el producto y presione Enter o agregue con los botones
                  </span>
                </div>

                {/* Formulario de digitación directa */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleDigitizeItem();
                  }}
                  className="space-y-2 pt-1"
                >
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={digitizeText}
                        onChange={(e) => setDigitizeText(e.target.value)}
                        placeholder={`Digitar pintura... ej. ${originalPaintName}`}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-400 font-sans"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">Cant:</span>
                        <input
                          type="number"
                          min="1"
                          value={digitizeQty}
                          onChange={(e) => setDigitizeQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 px-2 py-2 bg-slate-800 border border-slate-600 rounded-lg text-xs font-bold text-center text-white focus:outline-hidden focus:ring-1 focus:ring-amber-400"
                        />
                      </div>

                      <select
                        value={digitizeUnit}
                        onChange={(e) => setDigitizeUnit(e.target.value)}
                        className="px-2.5 py-2 bg-slate-800 border border-slate-600 rounded-lg text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-400 cursor-pointer"
                      >
                        <option value="Cuñete (5 Gal)">Cuñete (5 Gal)</option>
                        <option value="Galón (1 Gal)">Galón (1 Gal)</option>
                        <option value="1/4 Galón">1/4 Galón</option>
                        <option value="Unidad">Unidad (und)</option>
                        <option value="Litros">Litros</option>
                      </select>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Digitar Ítem ↵</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-slate-400 text-[10px]">Atajos de Bodega:</span>
                      {selectedRequest.items && selectedRequest.items.length > 0 ? (
                        <>
                          {selectedRequest.items.map((it, idx) => {
                            const isPaint = it.itemType === 'pintura';
                            const colorTxt = it.colorName && !it.colorName.includes('Material') && it.colorName !== 'N/A' ? ` (Color: ${it.colorName})` : '';
                            let unitTxt = 'Unidad';
                            if (it.presentation === 'cuñete') unitTxt = 'Cuñete (5 Gal)';
                            else if (it.presentation === 'galon') unitTxt = 'Galón (1 Gal)';
                            else if (it.presentation === 'cuarto') unitTxt = '1/4 Galón';

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  const newItem: ManualPackedItem = {
                                    id: `manual-${Date.now()}-${idx}`,
                                    description: `${it.productName}${colorTxt}`,
                                    quantity: it.quantity,
                                    unit: unitTxt,
                                    notes: isPaint
                                      ? `Lote ${selectedRequest.inventoryAllocation?.batchNumber || 'LOTE-PTC-2026-B14'}`
                                      : 'Ítem verificado del pedido',
                                    verified: true,
                                  };
                                  setManualItems((prev) => [...prev, newItem]);
                                  setValidationError('');
                                }}
                                className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded border border-amber-700 cursor-pointer font-bold text-[10.5px]"
                              >
                                + {it.quantity} {it.presentation || 'und'} {it.productName.split(' ')[0]}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={handleQuickDigitizeAllOrdered}
                            className="px-2.5 py-1 bg-teal-800 hover:bg-teal-700 text-teal-200 rounded border border-teal-600 cursor-pointer font-bold text-[10.5px]"
                          >
                            ⚡ Digitar los {selectedRequest.items.length} Ítems
                          </button>
                        </>
                      ) : (
                        <>
                          {(selectedRequest.technicalCalculation?.totalCuñetes || 0) > 0 && (
                            <button
                              type="button"
                              onClick={handleQuickDigitizeCuñetes}
                              className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded border border-amber-700 cursor-pointer font-bold text-[10.5px]"
                            >
                              + {selectedRequest.technicalCalculation?.totalCuñetes} Cuñete(s)
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleQuickDigitizeGalones}
                            className="px-2.5 py-1 bg-blue-900/60 hover:bg-blue-800 text-blue-200 rounded border border-blue-700 cursor-pointer font-bold text-[10.5px]"
                          >
                            + Galón(es)
                          </button>
                          <button
                            type="button"
                            onClick={handleQuickDigitizeAllOrdered}
                            className="px-2.5 py-1 bg-teal-800 hover:bg-teal-700 text-teal-200 rounded border border-teal-600 cursor-pointer font-bold text-[10.5px]"
                          >
                            ⚡ Digitar Todo el Pedido ({originalPaintName})
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={handleClearAllItems}
                        className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-200 rounded border border-red-800 cursor-pointer text-[10.5px]"
                      >
                        🗑️ Limpiar
                      </button>
                    </div>

                    <span className="text-slate-400 text-[10px]">
                      {manualItems.length} ítem(s) digitados
                    </span>
                  </div>
                </form>
              </div>

              {/* LISTA DE ÍTEMS DIGITADOS EN EL PAQUETE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-amber-600" />
                    Ítems Digitados y Empacados en la Orden ({verifiedItemsCount} de {totalItemsCount} listos)
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    Solo lo que realmente se empacó
                  </span>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {manualItems.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-xs space-y-2">
                      <PenTool className="w-6 h-6 mx-auto text-slate-400" />
                      <p className="font-bold text-slate-700">El terminal no tiene envases digitados aún.</p>
                      <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                        Este pedido original solo contiene pintura. Vaya digitando arriba cada envase colocado en la estiba de despacho o use el atajo rápido.
                      </p>
                      <button
                        type="button"
                        onClick={handleQuickDigitizeAllOrdered}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                      >
                        ⚡ Digitar Pintura Pedida por el Cliente
                      </button>
                    </div>
                  ) : (
                    manualItems.map((item) => {
                      const itemImg = getProductImage({ productName: item.description });

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                            item.verified
                              ? 'bg-emerald-50/70 border-emerald-300'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleVerified(item.id)}
                              className="text-slate-500 hover:text-emerald-700 cursor-pointer shrink-0"
                              title={item.verified ? 'Marcar como pendiente' : 'Marcar como empacado'}
                            >
                              {item.verified ? (
                                <CheckSquare className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-400" />
                              )}
                            </button>

                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                              <img
                                src={itemImg}
                                alt={item.description}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                className="w-full px-2.5 py-1 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                              />
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] font-mono text-slate-500 uppercase">Cant:</span>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                                }
                                className="w-16 px-2 py-1 text-xs font-mono font-bold text-center text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                              />
                            </div>

                            <div className="w-28 shrink-0">
                              <select
                                value={item.unit}
                                onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                              >
                                <option value="Galón (1 Gal)">Galón (1 Gal)</option>
                                <option value="Cuñete (5 Gal)">Cuñete (5 Gal)</option>
                                <option value="1/4 Galón">1/4 Galón</option>
                                <option value="Unidad">Unidad (und)</option>
                                <option value="Litros">Litros</option>
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Eliminar ítem"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 pl-8">
                            <span className="text-[10px] font-mono text-slate-500 shrink-0">Detalle / Lote:</span>
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'notes', e.target.value)}
                              placeholder="Ej. Tapa hermética asegurada, formulación conforme..."
                              className="flex-1 px-2 py-0.5 text-[11px] bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                            />
                            <span
                              className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                item.verified
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {item.verified ? '✓ EMPACADO' : 'PENDIENTE'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SECCIÓN 3: Báscula, Precinto Holográfico y Firma a Mano */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-navy-900 font-mono uppercase flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-amber-600" />
                      Peso Total en Báscula (Kg)
                    </label>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                      Calibrada Hoy
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono font-bold text-slate-900"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-bold">
                      KG
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Báscula Muelle 2 CEDI Central Rionegro.
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-navy-900 font-mono uppercase flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      Precinto Holográfico Pintuco
                    </label>
                    <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-bold">
                      ISO 9001
                    </span>
                  </div>
                  <div
                    onClick={() => setSealAttached(!sealAttached)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      sealAttached
                        ? 'bg-teal-50 border-teal-300 text-teal-950 font-semibold'
                        : 'bg-white border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-teal-700" />
                      <span>{sealAttached ? '✓ Sello Precintado Adherido' : 'Precinto Pendiente'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-teal-800 bg-teal-100/70 px-1.5 py-0.5 rounded">
                      QR-PTC-PACK
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Garantiza inviolabilidad de la tapa del envase.
                  </span>
                </div>
              </div>

              {/* SECCIÓN 4: Manifiesto Escrito a Mano y Firma del Empacador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy-900 font-mono uppercase flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-600" />
                    Manifiesto Escrito a Mano / Novedades de Empaque:
                  </label>
                  <textarea
                    rows={4}
                    value={packerNotes}
                    onChange={(e) => setPackerNotes(e.target.value)}
                    placeholder="Escriba a mano cualquier observación relevante del empaque..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-navy-900 font-mono uppercase flex items-center gap-1.5">
                      <PenTool className="w-4 h-4 text-blue-700" />
                      Firma y Rúbrica Manual del Empacador:
                    </label>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[11px] text-slate-500 hover:text-red-600 underline cursor-pointer"
                    >
                      Limpiar Firma
                    </button>
                  </div>
                  <div className="border border-slate-300 rounded-xl bg-white overflow-hidden relative">
                    <canvas
                      ref={canvasRef}
                      width={380}
                      height={90}
                      className="w-full h-[90px] cursor-crosshair touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    {!hasSignature && (
                      <span className="absolute inset-0 flex items-center justify-center text-slate-400 text-[11px] pointer-events-none font-mono">
                        ✍️ Dibuje su firma aquí con el mouse o dedo
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Firma de responsabilidad del operario {currentUser.name}.
                  </span>
                </div>
              </div>

              {/* Botón de Acción Final: Guardar Empaque y Habilitar al Conductor */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
                <div className="text-xs text-slate-500 font-mono">
                  {selectedRequest.packagingDetails?.status === 'empacado_listo' ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Empacado el {selectedRequest.packagingDetails.packedAt} por {selectedRequest.packagingDetails.packerName}
                    </span>
                  ) : (
                    <span className="text-amber-800 flex items-center gap-1 font-semibold">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Conductor bloqueado hasta que usted guarde el empaque
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCompletePacking}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isSubmitting ? (
                    <span>Guardando en sistema...</span>
                  ) : (
                    <>
                      <PackageCheck className="w-4 h-4" />
                      <span>
                        {selectedRequest.packagingDetails?.status === 'empacado_listo'
                          ? 'Actualizar Manifiesto y Empaque'
                          : 'Marcar Empacado & Desbloquear al Conductor'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              Seleccione una orden de la lista para iniciar el proceso de empaque.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
