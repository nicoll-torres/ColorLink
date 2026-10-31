import React, { useState, useEffect } from 'react';
import { EmailNotification, UserProfile } from '../types';
import {
  getAllEmails,
  getEmailsForUser,
  markEmailAsRead,
  deleteEmail,
  sendEmail,
} from '../emailService';
import {
  Mail,
  MailOpen,
  Inbox,
  X,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Package,
  Truck,
  ShieldCheck,
  Sparkles,
  Clock,
  ArrowRight,
  Send,
} from '../icons';

interface EmailInboxModalProps {
  currentUser?: UserProfile | null;
  onClose: () => void;
  initialSelectedEmailId?: string;
}

export const EmailInboxModal: React.FC<EmailInboxModalProps> = ({
  currentUser,
  onClose,
  initialSelectedEmailId,
}) => {
  const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(initialSelectedEmailId || null);
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [copied, setCopied] = useState(false);

  const loadEmails = () => {
    // SEGURIDAD & AISLAMIENTO:
    // Si no hay usuario registrado o email, la bandeja está vacía para proteger la privacidad
    if (!currentUser || !currentUser.email) {
      setEmails([]);
      return;
    }

    // Si es admin, puede auditar; si es cliente registrado, ve ÚNICAMENTE sus propios correos
    const list = currentUser.role === 'administrador'
      ? getAllEmails()
      : getEmailsForUser(currentUser.email);

    // Doble verificación estricta: asegurar que ningún correo de otro cliente esté presente
    const secureList = currentUser.role === 'administrador'
      ? list
      : list.filter((e) => (e.toEmail || '').toLowerCase().trim() === currentUser.email.toLowerCase().trim());

    setEmails(secureList);

    // Si había un correo seleccionado inicial, validar que pertenezca al usuario
    if (initialSelectedEmailId) {
      const exists = secureList.some((e) => e.id === initialSelectedEmailId);
      if (exists) {
        setSelectedEmailId(initialSelectedEmailId);
        markEmailAsRead(initialSelectedEmailId);
        return;
      }
    }

    if (!selectedEmailId && secureList.length > 0) {
      setSelectedEmailId(secureList[0].id);
      markEmailAsRead(secureList[0].id);
    }
  };

  useEffect(() => {
    loadEmails();

    const handleEmailSent = () => {
      loadEmails();
    };

    window.addEventListener('colorlink-email-sent', handleEmailSent);
    return () => {
      window.removeEventListener('colorlink-email-sent', handleEmailSent);
    };
  }, [currentUser]);

  const selectedEmail = emails.find((e) => e.id === selectedEmailId) || (emails.length > 0 ? emails[0] : null);

  const handleSelect = (email: EmailNotification) => {
    setSelectedEmailId(email.id);
    if (!email.read) {
      markEmailAsRead(email.id);
      setEmails((prev) => prev.map((item) => (item.id === email.id ? { ...item, read: true } : item)));
    }
  };

  const handleDelete = (id: string) => {
    deleteEmail(id);
    const updated = emails.filter((e) => e.id !== id);
    setEmails(updated);
    if (selectedEmailId === id) {
      setSelectedEmailId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleCopyBody = () => {
    if (!selectedEmail) return;
    navigator.clipboard.writeText(selectedEmail.previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredEmails = emails.filter((e) => {
    if (filterCategory === 'todos') return true;
    return e.category === filterCategory;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'bienvenida':
        return { label: 'Bienvenida', bg: 'bg-sky-50 text-blue-900 border-sky-200', icon: <Sparkles className="w-3 h-3 text-sky-600" /> };
      case 'empaque':
        return { label: 'Empacado', bg: 'bg-blue-50 text-blue-900 border-blue-200', icon: <Package className="w-3 h-3 text-blue-600" /> };
      case 'transporte':
        return { label: 'En Transporte', bg: 'bg-blue-100 text-blue-900 border-blue-300', icon: <Truck className="w-3 h-3 text-blue-700" /> };
      case 'entrega':
        return { label: 'Entregado', bg: 'bg-sky-100 text-sky-950 border-sky-300', icon: <ShieldCheck className="w-3 h-3 text-blue-600" /> };
      case 'orden_creada':
        return { label: 'Orden Creada', bg: 'bg-indigo-50 text-indigo-900 border-indigo-200', icon: <Clock className="w-3 h-3 text-indigo-600" /> };
      default:
        return { label: 'Notificación', bg: 'bg-slate-100 text-slate-800 border-slate-300', icon: <Mail className="w-3 h-3 text-slate-600" /> };
    }
  };

  const unreadCount = emails.filter((e) => !e.read).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in" id="email-inbox-modal-backdrop">
      <div className="bg-white rounded-2xl border border-blue-100 shadow-2xl w-full max-w-5xl h-[88vh] max-h-[820px] flex flex-col overflow-hidden">
        {/* Cabecera del Buzón de Correo */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white flex items-center justify-between gap-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-sky-300 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold font-['Space_Grotesk'] text-white">
                  {currentUser?.role === 'administrador'
                    ? 'Auditoría Central de Notificaciones'
                    : 'Mis Notificaciones y Mensajes al Correo'}
                </h2>
                {currentUser?.email && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-sky-200 border border-blue-400/40 text-[10px] font-mono">
                    🔒 Bandeja privada: {currentUser.email}
                  </span>
                )}
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-sky-400 text-blue-950 font-bold font-mono text-[10px] animate-pulse">
                    {unreadCount} sin leer
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 truncate max-w-xl">
                {currentUser?.role === 'administrador'
                  ? 'Registro oficial de auditoría de notificaciones enviadas · ColorLink'
                  : `Solo tú (${currentUser?.name || 'Cliente'}) puedes ver tus notificaciones de pedidos, bienvenida y trazabilidad.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar buzón"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtros de Categoría */}
        <div className="p-2 sm:px-4 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {[
            { id: 'todos', label: 'Todos los Correos', count: emails.length },
            { id: 'bienvenida', label: '🎉 Bienvenida', count: emails.filter(e => e.category === 'bienvenida').length },
            { id: 'empaque', label: '📦 Empaque CEDI', count: emails.filter(e => e.category === 'empaque').length },
            { id: 'transporte', label: '🚚 En Transporte', count: emails.filter(e => e.category === 'transporte').length },
            { id: 'entrega', label: '✅ Entregados', count: emails.filter(e => e.category === 'entrega').length },
            { id: 'orden_creada', label: '📋 Nuevas Órdenes', count: emails.filter(e => e.category === 'orden_creada').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                filterCategory === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                filterCategory === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Contenedor Principal de Dos Columnas: Lista + Visor */}
        <div className="flex-1 flex overflow-hidden">
          {/* Columna Izquierda: Lista de Correos */}
          <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-white shrink-0 overflow-y-auto">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2 m-auto">
                <Mail className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No hay notificaciones en esta sección</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  {currentUser?.role === 'cliente'
                    ? `Las notificaciones exclusivas para tu cuenta (${currentUser?.email}) aparecerán aquí al registrarte o cuando tus pedidos avancen.`
                    : 'Las notificaciones se generarán automáticamente al registrar un cliente o avanzar pedidos.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredEmails.map((email) => {
                  const isSelected = selectedEmail?.id === email.id;
                  const badge = getCategoryBadge(email.category);

                  return (
                    <div
                      key={email.id}
                      onClick={() => handleSelect(email)}
                      className={`p-3.5 text-left cursor-pointer transition-colors relative flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-blue-50/80 border-l-4 border-l-blue-600'
                          : email.read
                          ? 'hover:bg-slate-50 bg-white'
                          : 'bg-blue-50/30 font-semibold hover:bg-blue-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          {!email.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="No leído" />
                          )}
                          <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${badge.bg}`}>
                            {badge.icon}
                            {badge.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {email.sentAt.split(' ')[1]?.substring(0, 5) || ''}
                        </span>
                      </div>

                      <h4 className={`text-xs text-slate-900 leading-snug line-clamp-1 ${!email.read ? 'font-bold text-blue-950' : 'font-medium'}`}>
                        {email.subject}
                      </h4>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {email.previewText}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                        <span className="truncate max-w-[170px]">Para: {email.toEmail}</span>
                        {email.requestCode && (
                          <span className="font-bold text-blue-700 bg-blue-50 px-1 rounded border border-blue-200">
                            {email.requestCode}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Columna Derecha: Visor de Correo Completo */}
          <div className="flex-1 bg-slate-100/60 overflow-y-auto flex flex-col">
            {selectedEmail ? (
              <div className="p-4 sm:p-6 space-y-4 flex-1">
                {/* Barra de Acciones del Correo */}
                <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MailOpen className="w-4 h-4 text-blue-600" />
                      <span>Mensaje Enviado por ColorLink</span>
                    </span>
                    <span className="text-[11px] text-slate-400">· {selectedEmail.sentAt}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={async () => {
                        await sendEmail({
                          toEmail: selectedEmail.toEmail,
                          toName: selectedEmail.toName,
                          subject: selectedEmail.subject,
                          previewText: selectedEmail.previewText,
                          htmlContent: selectedEmail.htmlContent,
                          category: selectedEmail.category,
                          requestCode: selectedEmail.requestCode,
                        });
                        setCopied(false);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title={`Reenviar este correo oficial al cliente (${selectedEmail.toEmail})`}
                    >
                      <Send className="w-3.5 h-3.5 text-white" />
                      <span>Reenviar a {selectedEmail.toEmail}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyBody}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Copiar texto del correo"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(selectedEmail.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs border border-red-200 transition-colors cursor-pointer"
                      title="Eliminar este correo de la bandeja"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Encabezado del Mensaje */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-slate-100">
                    <span className="text-slate-500 font-mono text-[11px]">De:</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      ColorLink &lt;notificaciones@colorlink.com&gt;
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-slate-100">
                    <span className="text-slate-500 font-mono text-[11px]">Para:</span>
                    <span className="font-bold text-blue-900 font-mono">
                      {selectedEmail.toName} &lt;{selectedEmail.toEmail}&gt;
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-slate-500 font-mono text-[11px]">Asunto:</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedEmail.subject}</span>
                  </div>
                </div>

                {/* Contenido HTML Renderizado */}
                <div className="bg-white rounded-2xl border border-slate-200 p-2 sm:p-4 shadow-xs">
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                    className="email-html-body"
                  />
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2 m-auto">
                <Inbox className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Selecciona un correo para leerlo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
