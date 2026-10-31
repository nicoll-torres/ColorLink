import React, { useState, useRef, useMemo } from 'react';
import { PaintRequest, UserProfile, OrderChatMessage } from '../types';
import { sendOrderInTransitEmail, sendOrderDeliveredEmail } from '../emailService';
import { getProductImage } from '../data';
import { isSameCity } from '../utils/cityUtils';
import { OrderChatModal } from './OrderChatModal';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Navigation,
  Compass,
  FileText,
  ShieldCheck,
  UserCheck,
  PenTool,
  RotateCcw,
  Search,
  Clock,
  Send,
  Boxes,
  ExternalLink,
  MessageSquare,
  Camera,
  Image,
  Lock,
  AlertTriangle,
} from '../icons';

interface DriverDashboardProps {
  currentUser: UserProfile;
  requests: PaintRequest[];
  onUpdateRequest: (updated: PaintRequest) => void;
  onOpenCertificate: (req: PaintRequest) => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  currentUser,
  requests,
  onUpdateRequest,
  onOpenCertificate,
}) => {
  // REGLA ESTRICTA: El conductor SOLO puede ver los pedidos de su misma Ciudad principal
  const driverCity = currentUser.city || 'Medellín';
  const cityRequests = useMemo(() => {
    return requests.filter(
      (r) => isSameCity(r.city, driverCity) || isSameCity(r.inventoryAllocation?.warehouseCity, driverCity)
    );
  }, [requests, driverCity]);

  const [selectedReqId, setSelectedReqId] = useState<string>(cityRequests[0]?.id || '');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | 'listos_muelle' | 'en_ruta' | 'entregados' | 'sin_empacar'>('todos');

  const selectedRequest = cityRequests.find((r) => r.id === selectedReqId) || cityRequests[0];
  const isSelectedPacked = selectedRequest?.packagingDetails?.status === 'empacado_listo';

  // Entrega / Firma Digital State
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [receiverName, setReceiverName] = useState(selectedRequest?.clientName || '');
  const [receiverDoc, setReceiverDoc] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [isUpdatingRoute, setIsUpdatingRoute] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deliveryProofPhoto, setDeliveryProofPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80'
  );

  // Canvas for signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Chat con el cliente (pequeño Wasap en tiempo real)
  const [chatReqId, setChatReqId] = useState<string | null>(null);

  const handleSendMessage = (requestId: string, messageText: string) => {
    const req = requests.find((r) => r.id === requestId) || selectedRequest;
    if (!req) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: OrderChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderRole: 'conductor',
      senderName: currentUser.name || 'Wilson Cañas (Conductor)',
      message: messageText,
      timestamp: timeStr,
      createdAtIso: now.toISOString(),
    };

    const updatedReq: PaintRequest = {
      ...req,
      chatMessages: [...(req.chatMessages || []), newMsg],
    };

    onUpdateRequest(updatedReq);
    try {
      window.dispatchEvent(
        new CustomEvent('colorlink-order-chat-updated', {
          detail: { requestId, message: newMsg, updatedRequest: updatedReq },
        })
      );
    } catch {}
  };

  React.useEffect(() => {
    if (selectedRequest) {
      setReceiverName(selectedRequest.clientName || '');
      setCustomLocation(selectedRequest.deliveryDetails?.currentLocation || '');
      setToastMessage(null);
    }
  }, [selectedReqId, selectedRequest]);

  const filteredRequests = cityRequests.filter((r) => {
    const matchesSearch =
      r.requestCode.toLowerCase().includes(search.toLowerCase()) ||
      r.clientName.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    const isPacked = r.packagingDetails?.status === 'empacado_listo';
    const routeStatus = r.deliveryDetails?.routeStatus || 'pendiente_cargue';
    if (filter === 'listos_muelle') return isPacked && (routeStatus === 'pendiente_cargue' || routeStatus === 'cargado_en_muelle');
    if (filter === 'en_ruta') return routeStatus === 'en_ruta' || routeStatus === 'en_destino';
    if (filter === 'entregados') return routeStatus === 'entregado';
    if (filter === 'sin_empacar') return !isPacked && routeStatus !== 'entregado';
    return true;
  });

  const handleStartRoute = () => {
    if (!selectedRequest) return;
    const isPacked = selectedRequest.packagingDetails?.status === 'empacado_listo';
    if (!isPacked) {
      setToastMessage('⚠️ Acción Bloqueada: El empacador aún no ha empacado este pedido. No puedes salir de bodega.');
      return;
    }

    setIsUpdatingRoute(true);
    setTimeout(() => {
      const now = new Date();
      const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} Hoy`;

      const updated: PaintRequest = {
        ...selectedRequest,
        status: 'servicio_despacho',
        serviceLogistics: {
          ...selectedRequest.serviceLogistics,
          logisticsStatus: 'En ruta',
          estimatedDeliveryDate: '2026-08-30',
          estimatedDays: 1,
        },
        deliveryDetails: {
          driverId: currentUser.id,
          driverName: currentUser.name,
          driverPhone: currentUser.phone,
          vehiclePlate: currentUser.vehiclePlate || 'WTL-582',
          vehicleType: 'Camión NHR 3.5 Toneladas',
          deliveryAddress: selectedRequest.deliveryAddress || `${selectedRequest.clientName}, ${selectedRequest.city}`,
          routeStatus: 'en_ruta',
          departedAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
          currentLocation: 'En ruta hacia el destino · GPS Activo',
          estimatedArrival: `${timeStr} (En tránsito)`,
        },
      };

      onUpdateRequest(updated);
      sendOrderInTransitEmail(updated).catch(console.error);
      setIsUpdatingRoute(false);
      setToastMessage('¡Ruta iniciada! El cliente ahora puede ver que su pedido está en camino (Correo enviado).');
    }, 400);
  };

  const handleUpdateLocation = () => {
    if (!selectedRequest || !customLocation) return;
    const isPacked = selectedRequest.packagingDetails?.status === 'empacado_listo';
    if (!isPacked) {
      setToastMessage('⚠️ GPS Inactivo: Este pedido no ha sido empacado por bodega.');
      return;
    }

    const updated: PaintRequest = {
      ...selectedRequest,
      deliveryDetails: {
        ...selectedRequest.deliveryDetails,
        driverId: currentUser.id,
        driverName: currentUser.name,
        driverPhone: currentUser.phone,
        vehiclePlate: currentUser.vehiclePlate || 'WTL-582',
        vehicleType: 'Camión NHR 3.5 Toneladas',
        deliveryAddress: selectedRequest.deliveryAddress || `${selectedRequest.clientName}, ${selectedRequest.city}`,
        routeStatus: selectedRequest.deliveryDetails?.routeStatus || 'en_ruta',
        currentLocation: customLocation,
      },
    };
    onUpdateRequest(updated);
    setToastMessage('Ubicación en vivo actualizada correctamente.');
  };

  // Canvas drawing handlers
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

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
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

  const handleConfirmDelivery = () => {
    if (!selectedRequest) return;
    if (!receiverName || !receiverDoc) {
      alert('Por favor ingrese el nombre y cédula/documento de quien recibe.');
      return;
    }

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updated: PaintRequest = {
      ...selectedRequest,
      status: 'calidad_garantia',
      serviceLogistics: {
        ...selectedRequest.serviceLogistics,
        logisticsStatus: 'Entregado',
        estimatedDeliveryDate: timeStr,
      },
      deliveryDetails: {
        ...selectedRequest.deliveryDetails,
        driverId: currentUser.id,
        driverName: currentUser.name,
        driverPhone: currentUser.phone,
        vehiclePlate: currentUser.vehiclePlate || 'WTL-582',
        vehicleType: 'Camión NHR 3.5 Toneladas',
        deliveryAddress: selectedRequest.deliveryAddress || `${selectedRequest.clientName}, ${selectedRequest.city}`,
        routeStatus: 'entregado',
        deliveredAt: timeStr,
        receivedByName: receiverName,
        receivedByDoc: receiverDoc,
        deliveryNotes: deliveryNotes || 'Entrega a satisfacción en obra/inmueble con material completo.',
        currentLocation: 'Entrega finalizada en sitio · Cliente conforme',
      },
      qualityCertificate: selectedRequest.qualityCertificate || {
        certificateId: `GAR-PTC-${Math.floor(Math.random() * 90000 + 10000)}`,
        inspectorName: 'Ing. Andrea Valencia Q.A.',
        adhesionTest: 'Excelente',
        substrateMoisture: 4.0,
        dryFilmThicknessMils: 4.5,
        warrantyIssuedDate: timeStr.split(' ')[0],
        warrantyExpirationDate: `${now.getFullYear() + (selectedRequest.technicalCalculation?.warrantyDurationYears || 5)}-08-30`,
      },
    };

    onUpdateRequest(updated);
    // Enviar correo oficial de entrega completada y garantía activada
    sendOrderDeliveredEmail(updated).catch(console.error);
    setShowDeliveryModal(false);
    setToastMessage('¡Entrega registrada y confirmada exitosamente! Certificado de Calidad enviado al correo del cliente.');
  };

  const isDelivered = selectedRequest?.deliveryDetails?.routeStatus === 'entregado';
  const isInRoute = selectedRequest?.deliveryDetails?.routeStatus === 'en_ruta';

  return (
    <div className="space-y-6" id="driver-dashboard-root">
      {/* Banner Principal del Conductor · Control de Flota & Despacho */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-7 shadow-xs border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/90 text-white flex items-center justify-center font-bold shadow-xs shrink-0 border border-emerald-400/30">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-semibold">
                  SEDE CEDI {driverCity.toUpperCase()} · FLOTA EXPRESS
                </span>
                <span className="text-xs text-slate-400 font-medium">· Hoja de Ruta & Georreferenciación</span>
              </div>
              <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white mt-1 tracking-tight">
                Hoja de Ruta y Entregas de Pintura · CEDI {driverCity}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/70 px-4 py-2 rounded-xl border border-slate-800 text-xs">
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-mono font-medium">Conductor en Turno:</span>
              <strong className="text-white text-sm">{currentUser.name}</strong>
              <span className="text-emerald-400 block text-[11px] font-mono">
                {currentUser.vehiclePlate || 'WTL-582 (Camión NHR)'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs relative z-10">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[10px] font-mono uppercase">Total Despachos {driverCity}:</span>
            <span className="text-lg font-bold font-mono text-white mt-0.5 block">{cityRequests.length} envíos</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-emerald-300 block text-[10px] font-mono uppercase">Listos para Cargar:</span>
            <span className="text-lg font-bold font-mono text-emerald-300 mt-0.5 block">
              {cityRequests.filter((r) => r.packagingDetails?.status === 'empacado_listo' && r.deliveryDetails?.routeStatus !== 'entregado' && r.deliveryDetails?.routeStatus !== 'en_ruta').length}
            </span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-blue-300 block text-[10px] font-mono uppercase">En Ruta Activa:</span>
            <span className="text-lg font-bold font-mono text-blue-200 mt-0.5 block">
              {cityRequests.filter((r) => r.deliveryDetails?.routeStatus === 'en_ruta').length}
            </span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-rose-300 block text-[10px] font-mono uppercase">Por Empacar:</span>
            <span className="text-lg font-bold font-mono text-rose-300 mt-0.5 block">
              {cityRequests.filter((r) => r.packagingDetails?.status !== 'empacado_listo').length}
            </span>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Grid Principal: Listado de Despachos vs Detalle de Ruta */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Cola de Despachos (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-navy-900 uppercase font-mono tracking-wider flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-700" />
                Rutas & Destinos
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {filteredRequests.length} de {cityRequests.length} en {driverCity}
              </span>
            </div>

            {/* Buscador & Filtros */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Buscar en ${driverCity} por código o cliente...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-5 gap-1">
                {(
                  [
                    { key: 'todos', label: 'Todos' },
                    { key: 'listos_muelle', label: 'Listos ✓' },
                    { key: 'en_ruta', label: 'En Ruta' },
                    { key: 'entregados', label: 'Entregados' },
                    { key: 'sin_empacar', label: 'Bloqueados 🔒' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`py-1 rounded-md text-[10px] font-medium transition-colors text-center truncate ${
                      filter === f.key
                        ? 'bg-emerald-800 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de tarjetas con fotos de productos */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredRequests.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <MapPin className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Sin despachos para {driverCity}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Solo puedes visualizar los pedidos correspondientes a tu sede principal de {driverCity}.
                  </p>
                </div>
              ) : (
                filteredRequests.map((req) => {
                const isSelected = req.id === selectedReqId;
                const routeSt = req.deliveryDetails?.routeStatus || 'pendiente_cargue';
                const isReqPacked = req.packagingDetails?.status === 'empacado_listo';
                const reqCalc = req.technicalCalculation;
                const prodImg = getProductImage({
                  productName: reqCalc?.recommendedProduct?.name || req.surfaceType,
                });

                const getStatusBadge = () => {
                  if (routeSt === 'entregado') {
                    return { label: '✓ Entregado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
                  }
                  if (routeSt === 'en_ruta') {
                    return { label: '🚚 En Ruta', color: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' };
                  }
                  if (isReqPacked) {
                    return { label: '📦 Listo en Muelle', color: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' };
                  }
                  return { label: '🔒 Sin Empacar', color: 'bg-amber-50 text-amber-800 border-amber-300 font-bold' };
                };

                const badge = getStatusBadge();

                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedReqId(req.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs">
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
                          <span className="font-mono text-xs font-bold text-teal-900">
                            {req.requestCode}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-900 truncate">
                          {req.clientName}
                        </p>

                        <p className="text-[11px] text-slate-600 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {req.deliveryAddress || `${req.city} - Obra Registrada`}
                        </p>

                        <div className="mt-1.5 pt-1 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500 font-mono">
                          <span>{req.city}</span>
                          <span className="font-semibold text-slate-700">
                            {reqCalc?.totalCuñetes || 1} Cuñetes + {reqCalc?.remainderGalons || 0} Gal
                          </span>
                        </div>

                        {/* Botón Directo de Comunicación Wasap en cada pedido */}
                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReqId(req.id);
                              setChatReqId(req.id);
                            }}
                            className="w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            title="Escribir al cliente en tiempo real"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>💬 Mensajes con Cliente</span>
                            {req.chatMessages && req.chatMessages.length > 0 && (
                              <span className="ml-1 px-1.5 py-0.2 bg-[#25D366] text-slate-950 text-[10px] font-mono font-bold rounded-full">
                                {req.chatMessages.length}
                              </span>
                            )}
                          </button>
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

        {/* Columna Derecha: Panel de Ruta Activa & Confirmación de Entrega (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedRequest ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
              {/* Tarjeta de Destino y Cliente */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-emerald-400 font-bold">
                        {selectedRequest.requestCode}
                      </span>
                      {isSelectedPacked ? (
                        <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                          ✓ EMPACADO EN MUELLE
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-300" />
                          BLOQUEADO (SIN EMPACAR)
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold font-['Space_Grotesk'] text-white mt-0.5">
                      {selectedRequest.clientName}
                    </h3>
                  </div>

                  {/* Acciones Rápidas con el Cliente */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Botón Principal: Mensajes en Tiempo Real */}
                    <button
                      type="button"
                      onClick={() => setChatReqId(selectedRequest.id)}
                      className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebd5b] text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md ring-1 ring-white/30 cursor-pointer"
                      title="Abrir mensajes en vivo con este cliente"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-950" />
                      <span>💬 Mensajes con Cliente</span>
                      {selectedRequest.chatMessages && selectedRequest.chatMessages.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 bg-slate-950 text-white text-[10px] font-mono font-bold rounded-full">
                          {selectedRequest.chatMessages.length}
                        </span>
                      )}
                    </button>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedRequest.deliveryAddress || selectedRequest.city + ', Colombia')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                      title="Abrir ubicación en Google Maps"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      GPS Maps
                    </a>

                    <a
                      href={`tel:${selectedRequest.clientPhone}`}
                      className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Llamar
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Dirección de Entrega:</span>
                    <span className="font-semibold text-slate-100 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {selectedRequest.deliveryAddress || 'Cra 43A # 18 Sur - 135, Medellín'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Contacto en Obra:</span>
                    <span className="font-semibold text-slate-100 block mt-0.5">
                      {selectedRequest.clientPhone} · {selectedRequest.city}
                    </span>
                  </div>
                </div>
              </div>

              {/* AVISO DE BLOQUEO SI EL EMPACADOR NO HA EMPACADO */}
              {!isSelectedPacked && (
                <div className="p-4 bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-xs font-mono uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Despacho Bloqueado: El Empacador aún no ha empacado el pedido</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Por protocolo de seguridad de transporte de Pintuco, <strong>el conductor no puede realizar ninguna acción</strong> (iniciar ruta, salir de bodega, reportar GPS ni entregar) hasta que el operario de bodega empaque y verifique las cantidades en muelle.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] font-mono text-amber-800">
                    <span>Estado actual: <strong>{selectedRequest.packagingDetails?.status === 'en_proceso' ? 'En alistamiento' : 'Sin empacar'}</strong></span>
                    <span>· Operario CEDI: <strong>{selectedRequest.packagingDetails?.packerName || 'Operario de Bodega CEDI'}</strong></span>
                  </div>
                </div>
              )}

              {/* Trazabilidad de Ruta & Estado GPS */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-700" />
                    Estado y Trazabilidad del Despacho
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    Vehículo: <strong>{currentUser.vehiclePlate || 'WTL-582'}</strong> (Camión NHR 3.5T)
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      disabled={!isSelectedPacked}
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      placeholder={!isSelectedPacked ? "GPS inactivo: Bloqueado hasta que el empacador aliste el pedido..." : "Ej. En tránsito por Autopista Sur llegando a obra..."}
                      className={`flex-1 px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-hidden ${
                        !isSelectedPacked ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300 focus:ring-1 focus:ring-emerald-500'
                      }`}
                    />
                    <button
                      type="button"
                      disabled={!isSelectedPacked}
                      onClick={handleUpdateLocation}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                        !isSelectedPacked ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-white cursor-pointer'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      Actualizar GPS
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ubicación actual reportada: <em>"{selectedRequest.deliveryDetails?.currentLocation || (isSelectedPacked ? 'En muelle CEDI Rionegro (Listo)' : 'En estación de empaque')}"</em>
                  </p>
                </div>
              </div>

              {/* Resumen Visual del Material que se transporta */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-amber-600" />
                    Carga Verificada a Bordo del Vehículo
                  </h4>
                  {isSelectedPacked ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                      Sello Precinto OK
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                      ⏳ Sin Empacar
                    </span>
                  )}
                </div>

                {!isSelectedPacked ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5 text-amber-900">
                    <span className="font-bold flex items-center gap-1.5 text-amber-950">
                      <Lock className="w-4 h-4 text-amber-700" />
                      Carga pendiente de entrega por el Empacador
                    </span>
                    <p className="text-[11px] text-amber-800">
                      El material aún no ha sido cargado en el vehículo {currentUser.vehiclePlate || 'WTL-582'}. El empacador en CEDI debe realizar el alistamiento, cubicaje y precintado de seguridad antes de poder subirlo al camión.
                    </p>
                  </div>
                ) : (
                  (() => {
                    const cargoImg = getProductImage({
                      productName: selectedRequest.technicalCalculation?.recommendedProduct?.name || selectedRequest.surfaceType,
                    });
                    const pkg = selectedRequest.packagingDetails;
                    return (
                      <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs">
                            <img
                              src={cargoImg}
                              alt="Carga Pintuco"
                              className="w-full h-full object-cover"
                            />
                            {selectedRequest.colorHex && (
                              <span
                                className="absolute bottom-1 right-1 w-4 h-4 rounded-full border border-white shadow-xs"
                                style={{ backgroundColor: selectedRequest.colorHex }}
                                title={selectedRequest.colorName}
                              />
                            )}
                          </div>

                          <div className="text-xs space-y-1 min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {selectedRequest.technicalCalculation?.recommendedProduct?.name || selectedRequest.catalogProductName || 'Pintura Pintuco Formulada'}
                            </p>
                            <p className="text-slate-600 font-mono text-[11px]">
                              Color: <strong>{selectedRequest.colorName}</strong> ({selectedRequest.colorHex})
                            </p>
                            <p className="text-amber-800 font-mono text-[11px] font-semibold">
                              Total Verificado: {(pkg?.cuñetesPacked || 0) > 0 ? `${pkg?.cuñetesPacked} Cuñete(s) (5 Gal)` : ''}{(pkg?.cuñetesPacked || 0) > 0 && (pkg?.galonesPacked || 0) > 0 ? ' + ' : ''}{(pkg?.galonesPacked || 0) > 0 || (pkg?.cuñetesPacked || 0) === 0 ? `${pkg?.galonesPacked || 0} Galón(es)` : ''}{(pkg?.cuartosPacked ?? 0) > 0 ? ` + ${pkg?.cuartosPacked} 1/4 Gal` : ''} · Peso: {pkg?.weightKg || 85} Kg
                            </p>
                            <p className="text-slate-500 text-[10px] font-mono">
                              Empacado por <strong>{pkg?.packerName || 'Operario CEDI'}</strong> · Lote <strong>{pkg?.batchCode || selectedRequest.inventoryAllocation?.batchNumber || 'LOTE-PTC-2026'}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Lista de ítems escritos a mano por el empacador */}
                        {pkg?.checkedSupplies && pkg.checkedSupplies.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 space-y-1">
                            <span className="text-[10.5px] font-mono text-slate-500 uppercase font-bold block">
                              Manifiesto e Ítems empacados en muelle (Verificados por Bodega):
                            </span>
                            <ul className="text-[11px] text-slate-700 space-y-0.5 max-h-36 overflow-y-auto pr-1">
                              {pkg.checkedSupplies.map((sup, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 font-mono">
                                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                  <span>{sup}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {pkg?.notes && (
                          <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                            Notas del empacador: "{pkg.notes}"
                          </p>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Botones de Control de la Ruta */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                {!isSelectedPacked ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      disabled
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-200 text-slate-500 cursor-not-allowed flex items-center gap-2 border border-slate-300"
                    >
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Despacho Bloqueado (Sin Empacar)</span>
                    </button>
                    <span className="text-xs text-amber-800 font-medium">
                      ⚠️ El conductor no puede salir hasta que el empacador marque "Empacado Listo".
                    </span>
                  </div>
                ) : !isInRoute && !isDelivered ? (
                  <button
                    type="button"
                    disabled={isUpdatingRoute}
                    onClick={handleStartRoute}
                    className="btn-primary !bg-blue-700 hover:!bg-blue-800 !py-2.5 !text-xs flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Iniciar Ruta / Salir de Bodega (Material Empacado ✓)</span>
                  </button>
                ) : isInRoute ? (
                  <button
                    type="button"
                    onClick={() => setShowDeliveryModal(true)}
                    className="btn-primary !bg-emerald-700 hover:!bg-emerald-800 !py-2.5 !text-xs flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>Registrar Entrega & Firma del Cliente</span>
                  </button>
                ) : isDelivered ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Entregado a {selectedRequest.deliveryDetails?.receivedByName || 'Cliente'} el {selectedRequest.deliveryDetails?.deliveredAt}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenCertificate(selectedRequest)}
                      className="btn-secondary !py-1.5 !text-xs flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                      Ver Certificado
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              Seleccione una orden de la lista para gestionar la ruta de entrega.
            </div>
          )}
        </div>
      </div>

      {/* Modal de Firma Digital y Confirmación de Entrega */}
      {showDeliveryModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-emerald-300">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-['Space_Grotesk']">
                    Confirmación y Firma de Entrega
                  </h3>
                  <span className="text-xs text-emerald-300 font-mono">
                    Orden {selectedRequest.requestCode} · Pintuco
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeliveryModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-navy-900 block font-mono uppercase text-[11px]">
                  Nombre de quien recibe en obra / domicilio:
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-navy-900 block font-mono uppercase text-[11px]">
                  Cédula / Documento de Identidad:
                </label>
                <input
                  type="text"
                  value={receiverDoc}
                  onChange={(e) => setReceiverDoc(e.target.value)}
                  placeholder="Ej. C.C. 1.020.450.880"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              {/* Evidencia Fotográfica de Entrega */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-navy-900 block font-mono uppercase text-[11px] flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-teal-600" />
                    Evidencia Fotográfica de Entrega en Obra:
                  </label>
                  <span className="text-[10px] text-teal-700 font-mono font-semibold">
                    Requerido para Garantía
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                    <img
                      src={deliveryProofPhoto}
                      alt="Foto de entrega"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[9px] font-mono px-1 rounded">
                      CEDI
                    </span>
                  </div>

                  <div className="flex-1 space-y-1.5 text-[11px]">
                    <p className="text-slate-600">
                      Fotografía del lote y cuñetes descargados en el predio del cliente.
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setDeliveryProofPhoto('https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80')}
                        className="px-2 py-0.5 bg-white border border-slate-300 hover:border-teal-500 rounded text-[10px] font-semibold text-slate-700 cursor-pointer"
                      >
                        📷 Cuñetes en Obra
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryProofPhoto('https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80')}
                        className="px-2 py-0.5 bg-white border border-slate-300 hover:border-teal-500 rounded text-[10px] font-semibold text-slate-700 cursor-pointer"
                      >
                        🏢 Recepción Fachada
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryProofPhoto('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80')}
                        className="px-2 py-0.5 bg-white border border-slate-300 hover:border-teal-500 rounded text-[10px] font-semibold text-slate-700 cursor-pointer"
                      >
                        🏭 Almacén Industrial
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-navy-900 block font-mono uppercase text-[11px]">
                    Firma Digital del Receptor (Dibuje con dedo o mouse):
                  </label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-[11px] text-red-600 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Limpiar firma
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 relative h-32 touch-none">
                  <canvas
                    ref={canvasRef}
                    width={450}
                    height={125}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full cursor-crosshair rounded-xl"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-mono">
                      ✍️ Firme aquí para constancia de entrega
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-navy-900 block font-mono uppercase text-[11px]">
                  Observaciones de Entrega:
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Ej. Material recibido completo y en perfecto estado."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeliveryModal(false)}
                className="btn-secondary !py-2 !text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelivery}
                className="btn-primary !bg-emerald-700 hover:!bg-emerald-800 !py-2 !text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar Entrega Oficial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Ventana de Chat Wasap en Tiempo Real con el Cliente */}
      {chatReqId && (() => {
        const chatReq = requests.find((r) => r.id === chatReqId) || selectedRequest;
        if (!chatReq) return null;
        return (
          <OrderChatModal
            isOpen={Boolean(chatReqId)}
            onClose={() => setChatReqId(null)}
            request={chatReq}
            currentUserRole="conductor"
            currentUserName={currentUser.name || 'Wilson Cañas (Conductor)'}
            onSendMessage={handleSendMessage}
          />
        );
      })()}
    </div>
  );
};
