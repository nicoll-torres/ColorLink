import React, { useState, useEffect } from 'react';
import { EmailNotification, UserProfile } from '../types';
import { Mail, CheckCircle2, ArrowRight, X, Sparkles, Package, Truck, ShieldCheck, Send, ExternalLink } from '../icons';
import { openInGmail } from '../emailService';

interface EmailToastProps {
  currentUser?: UserProfile | null;
  onOpenEmail: (email: EmailNotification) => void;
}

export const EmailToast: React.FC<EmailToastProps> = ({ currentUser, onOpenEmail }) => {
  const [activeToast, setActiveToast] = useState<EmailNotification | null>(null);

  useEffect(() => {
    const handleEmailSent = (e: Event) => {
      const customEvent = e as CustomEvent<EmailNotification>;
      if (customEvent.detail) {
        // SEGURIDAD & PRIVACIDAD:
        // Si hay usuario autenticado, solo mostrar si va dirigido a él (o si es admin)
        if (currentUser && currentUser.email && currentUser.role !== 'administrador') {
          const clientEmail = currentUser.email.toLowerCase().trim();
          const targetEmail = (customEvent.detail.toEmail || '').toLowerCase().trim();
          if (targetEmail !== clientEmail) {
            // El correo pertenece a otro cliente; descartar y no mostrar
            return;
          }
        }

        // Si no hay sesión iniciada pero es un correo de bienvenida recién despachado (registro nuevo), mostrarlo
        setActiveToast(customEvent.detail);

        // Auto ocultar después de 12 segundos si el usuario no interactúa
        const timer = setTimeout(() => {
          setActiveToast((current) => (current?.id === customEvent.detail.id ? null : current));
        }, 12000);

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('colorlink-email-sent', handleEmailSent);
    return () => {
      window.removeEventListener('colorlink-email-sent', handleEmailSent);
    };
  }, [currentUser]);

  if (!activeToast) return null;

  const getIcon = () => {
    switch (activeToast.category) {
      case 'bienvenida':
        return <Sparkles className="w-5 h-5 text-sky-400" />;
      case 'empaque':
        return <Package className="w-5 h-5 text-blue-300" />;
      case 'transporte':
        return <Truck className="w-5 h-5 text-blue-400" />;
      case 'entrega':
        return <ShieldCheck className="w-5 h-5 text-sky-400" />;
      default:
        return <Mail className="w-5 h-5 text-sky-300" />;
    }
  };

  return (
    <div
      className="fixed bottom-5 left-4 sm:left-6 z-50 max-w-md w-full bg-[#0a192f] text-white rounded-2xl p-4 shadow-2xl border border-blue-500/30 animate-fade-in flex flex-col gap-2.5 backdrop-blur-md"
      id="email-notification-toast"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600/30 flex items-center justify-center shrink-0 border border-blue-400/30">
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                CORREO ENVIADO A {activeToast.toEmail}
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            </div>
            <h4 className="text-xs font-bold text-white mt-1 leading-snug">
              {activeToast.subject}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveToast(null)}
          className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
          title="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed pl-1">
        {activeToast.previewText}
      </p>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 flex-wrap">
        <span className="text-[10px] text-slate-300 font-mono truncate max-w-[180px]">
          Para: <strong className="text-sky-300 font-bold">{activeToast.toEmail}</strong>
        </span>
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-sky-300 text-[10px] font-bold border border-blue-400/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-sky-400" />
            Enviado al correo
          </span>
          <button
            type="button"
            onClick={() => {
              openInGmail(activeToast);
            }}
            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
            title="Abrir este correo en Gmail Web pre-llenado"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Gmail</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenEmail(activeToast);
              setActiveToast(null);
            }}
            className="px-3 py-1 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <span>Ver Correo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
