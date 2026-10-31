import React, { useState, useEffect, useRef } from 'react';
import { PaintRequest, OrderChatMessage } from '../types';
import {
  Send,
  X,
  Phone,
  CheckCheck,
  Check,
  Truck,
  User,
  MapPin,
  Clock,
  Sparkles,
  Smile,
  ShieldCheck,
} from '../icons';

interface OrderChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PaintRequest;
  currentUserRole: 'conductor' | 'cliente' | 'administrador';
  currentUserName: string;
  onSendMessage: (requestId: string, messageText: string) => void;
}

export const OrderChatModal: React.FC<OrderChatModalProps> = ({
  isOpen,
  onClose,
  request,
  currentUserRole,
  currentUserName,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isDriver = currentUserRole === 'conductor';
  const isClient = currentUserRole === 'cliente';

  // Contact partner info
  const partnerName = isDriver
    ? request.clientName
    : (request.deliveryDetails?.driverName || 'Wilson Cañas (Conductor)');
  
  const partnerRoleLabel = isDriver
    ? 'Cliente · Destinatario de Entrega'
    : `Conductor Pintuco Express · Placa ${request.deliveryDetails?.vehiclePlate || 'WTL-582'}`;

  const partnerPhone = isDriver ? request.clientPhone : (request.deliveryDetails?.driverPhone || '+57 311 754 9988');

  // Messages list from request
  const messages: OrderChatMessage[] = request.chatMessages || [];

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized, messages.length]);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;
    onSendMessage(request.id, text);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick Chips
  const driverQuickChips = [
    '🚚 Ya voy en camino con tu pedido',
    '⏱️ Llego en aproximadamente 15 minutos',
    '📍 Ya me encuentro en la portería / acceso',
    '📦 Llevo los envases listos para descargar',
    '¿Me confirmas si hay alguien en obra para recibir?',
  ];

  const clientQuickChips = [
    '👍 Perfecto, quedo atento para recibir',
    '🚪 La entrada es por el muelle / puerta de carga',
    '👤 Ya autoricé tu ingreso en la portería',
    '⏱️ Ya baja el encargado de la obra con documento',
    '👌 Muchas gracias por el aviso',
  ];

  const activeChips = isDriver ? driverQuickChips : clientQuickChips;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ease-in-out ${
        isMinimized
          ? 'bottom-4 right-4 sm:right-6 w-80'
          : 'bottom-0 right-0 sm:bottom-4 sm:right-6 w-full sm:w-[420px] max-w-full'
      }`}
      role="dialog"
      aria-labelledby="mensajes-chat-title"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col h-[540px] max-h-[92vh] sm:max-h-[620px] transition-all">
        
        {/* Encabezado de Mensajería Pintuco */}
        <div className="bg-[#075E54] text-white px-3.5 py-3 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar con indicador En Línea */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#128C7E] border-2 border-white/30 flex items-center justify-center font-bold text-white shadow-xs">
                {isDriver ? <User className="w-5 h-5" /> : <Truck className="w-5 h-5 text-amber-300" />}
              </div>
              <span
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#25D366] border-2 border-[#075E54]"
                title="Conexión en tiempo real"
              />
            </div>

            {/* Datos del Interlocutor */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 id="mensajes-chat-title" className="text-sm font-bold text-white truncate leading-tight">
                  {partnerName}
                </h3>
              </div>
              <p className="text-[11px] text-emerald-200 truncate flex items-center gap-1">
                <span>{partnerRoleLabel}</span>
              </p>
              <div className="flex items-center gap-2 text-[10px] text-emerald-300/90 font-mono mt-0.5">
                <span className="font-bold text-amber-300">Orden: {request.requestCode}</span>
                <span>• Mensajes en vivo</span>
              </div>
            </div>
          </div>

          {/* Acciones de Cabecera */}
          <div className="flex items-center gap-1 text-white">
            {partnerPhone && (
              <a
                href={`tel:${partnerPhone}`}
                className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-white"
                title={`Llamar a ${partnerName}`}
              >
                <Phone className="w-4 h-4" />
              </a>
            )}

            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-white text-xs font-mono font-bold"
              title={isMinimized ? 'Maximizar chat' : 'Minimizar chat'}
            >
              {isMinimized ? '▢' : '—'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-red-500/80 rounded-lg transition-colors text-white"
              title="Cerrar ventana de mensajes"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Si está minimizado, solo muestra la cabecera */}
        {!isMinimized && (
          <>
            {/* Aviso de Trazabilidad y Seguridad */}
            <div className="bg-[#EFEAE2] border-b border-slate-200/80 px-3 py-1.5 flex items-center justify-between text-[10.5px] text-slate-700">
              <span className="flex items-center gap-1 truncate font-medium">
                <MapPin className="w-3 h-3 text-[#075E54] shrink-0" />
                <span className="truncate">
                  {request.deliveryAddress || `${request.city} - Obra Registrada`}
                </span>
              </span>
              <span className="font-mono text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded font-bold shrink-0">
                MENSAJES PINTUCO
              </span>
            </div>

            {/* Área de Mensajes con Fondo WhatsApp */}
            <div
              className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-[#E5DDD5] relative"
              style={{
                backgroundImage:
                  'radial-gradient(#cfc6bc 1px, transparent 1px), radial-gradient(#d8d0c6 1px, #efeae2 1px)',
                backgroundSize: '30px 30px',
                backgroundPosition: '0 0, 15px 15px',
              }}
            >
              {/* Etiqueta de Seguridad Cifrada */}
              <div className="flex justify-center my-1">
                <div className="bg-[#FFF4D4] border border-[#E9DFBA] text-slate-700 text-[10px] px-3 py-1 rounded-lg text-center max-w-[90%] shadow-2xs leading-tight flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#075E54] shrink-0" />
                  <span>
                    Canal directo y seguro para la entrega del pedido <strong>{request.requestCode}</strong>. Ambos participantes ven los mensajes al instante.
                  </span>
                </div>
              </div>

              {/* Separador de Fecha */}
              <div className="flex justify-center my-1.5">
                <span className="bg-white/80 text-slate-600 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full shadow-2xs">
                  HOY
                </span>
              </div>

              {/* Si no hay mensajes previos */}
              {messages.length === 0 && (
                <div className="text-center py-6 px-4 bg-white/70 backdrop-blur-xs rounded-xl border border-dashed border-slate-300 max-w-[85%] mx-auto">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                    <Truck className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    ¡Comienza la conversación de entrega!
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    {isDriver
                      ? 'Escribe al cliente para informarle sobre tu hora de llegada, novedades de tráfico o coordinar el descargue.'
                      : 'Puedes escribirle directamente a tu conductor asignado sobre detalles de acceso o quién recibe.'}
                  </p>
                </div>
              )}

              {/* Lista de Mensajes */}
              {messages.map((msg) => {
                const isMine =
                  msg.senderRole === currentUserRole ||
                  msg.senderName === currentUserName;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`relative max-w-[82%] px-3 py-2 rounded-2xl shadow-xs text-xs break-words ${
                        isMine
                          ? 'bg-[#D9FDD3] text-slate-900 rounded-tr-xs border border-[#C0ECC0]'
                          : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200'
                      }`}
                    >
                      {/* Remitente si no es mío */}
                      {!isMine && (
                        <div className="text-[10.5px] font-bold text-[#075E54] mb-0.5 flex items-center gap-1">
                          <span>{msg.senderName}</span>
                          <span className="text-[9px] font-normal text-slate-500">
                            ({msg.senderRole === 'conductor' ? 'Conductor' : 'Cliente'})
                          </span>
                        </div>
                      )}

                      {/* Texto del mensaje */}
                      <p className="whitespace-pre-wrap leading-relaxed text-[12.5px]">
                        {msg.message}
                      </p>

                      {/* Hora y Visto Doble Check */}
                      <div className="flex items-center justify-end gap-1 text-[9.5px] text-slate-500 font-mono mt-1">
                        <span>{msg.timestamp || 'Ahora'}</span>
                        {isMine && (
                          <span title="Entregado en tiempo real">
                            <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Respuestas Rápidas (Chips de WhatsApp) */}
            <div className="bg-[#F0F2F5] border-t border-slate-200 px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 font-mono pl-1">
                Atajos:
              </span>
              {activeChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(chip)}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-300 hover:border-emerald-400 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors shadow-2xs cursor-pointer shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Barra de Entrada de Texto Estilo WhatsApp */}
            <div className="bg-[#F0F2F5] px-3 py-2.5 border-t border-slate-200 flex items-center gap-2 shrink-0">
              <div className="flex-1 relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isDriver
                      ? 'Escribe al cliente (ej. Ya estoy en la portería)...'
                      : 'Escribe a tu conductor (ej. Ya bajo a recibir)...'
                  }
                  className="w-full bg-white text-slate-900 text-xs sm:text-sm pl-3 pr-8 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#075E54] focus:ring-1 focus:ring-[#075E54] transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setInputText((prev) => (prev ? `${prev} 👍` : '👍'))}
                  className="absolute right-2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                  title="Insertar emoji rápido"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>

              {/* Botón Circular Enviar de WhatsApp */}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                  inputText.trim()
                    ? 'bg-[#25D366] hover:bg-[#1ebd5b] text-white shadow-md scale-105 active:scale-95'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
                title="Enviar mensaje en tiempo real"
              >
                <Send className="w-4 h-4 translate-x-0.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
