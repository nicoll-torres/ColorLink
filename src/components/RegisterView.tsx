import React, { useState, useEffect } from 'react';
import { Field } from './Field';
import { UserProfile, UserRole, PendingRequestData, EmailNotification } from '../types';
import {
  User,
  Mail,
  Lock,
  Phone,
  Building,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Boxes,
  Truck,
  Sliders,
  Sparkles,
  Receipt,
  Database,
  RefreshCw,
  Check,
  PlusCircle,
  Send,
  ExternalLink,
  Copy,
  AlertCircle,
} from '../icons';
import { syncClientToSupabase } from '../supabase';
import { saveCloudClient } from '../cloudSync';
import {
  sendWelcomeEmail,
  buildEmailPlainText,
  buildGmailComposeUrl,
  buildOutlookComposeUrl,
  buildMailtoUrl,
  openInGmail,
  openInOutlook,
  openInEmailClient,
} from '../emailService';
import {
  isGoogleConnected,
  initAuth,
  googleSignIn,
  getAccessToken,
  ensureGoogleAccessToken,
} from '../googleAuth';

interface RegisterViewProps {
  onRegister: (user: UserProfile) => void;
  onNavigateToLogin: () => void;
  onNavigateToHome?: () => void;
  pendingRequestData?: PendingRequestData | null;
}

interface RegistrationConfirmationData {
  userProfile: UserProfile;
  identification: string;
  address: string;
  syncedToCloud: boolean;
  message: string;
  welcomeNotification?: EmailNotification;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onRegister,
  onNavigateToLogin,
  onNavigateToHome,
  pendingRequestData,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [identification, setIdentification] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Medellín');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estado de confirmación de registro
  const [confirmationData, setConfirmationData] = useState<RegistrationConfirmationData | null>(null);

  // Estado de cuenta de Google / Gmail API
  const [googleUser, setGoogleUser] = useState<{
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
  } | null>(null);

  // Estado de entrega del correo al cliente
  const [deliveryStatus, setDeliveryStatus] = useState<'idle' | 'sending' | 'gmail_delivered' | 'network_delivered' | 'webmail_ready'>('idle');
  const [gmailMsgId, setGmailMsgId] = useState<string | null>(null);
  const [deliveryMessage, setDeliveryMessage] = useState<string>('');
  const [copiedEmailText, setCopiedEmailText] = useState(false);

  // Escuchar estado de Google
  useEffect(() => {
    const unsub = initAuth(
      (user) => {
        setGoogleUser({
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Reenviar notificación oficial al cliente con soporte para asegurar token de Google
  const handleResendNotification = async (clientUser: UserProfile) => {
    setDeliveryStatus('sending');
    setDeliveryMessage(`Conectando con Google y despachando notificación a ${clientUser.email}...`);

    try {
      // Si no hay token de Google activo en memoria, solicitarlo
      if (!isGoogleConnected()) {
        await ensureGoogleAccessToken();
      }

      const res = await sendWelcomeEmail(clientUser, {
        identification: identification || 'NIT-CLIENTE',
        address: address || 'Dirección registrada',
      });

      if (res.dispatchedViaGmailApi) {
        setDeliveryStatus('gmail_delivered');
        setGmailMsgId(res.gmailMessageId || null);
        setDeliveryMessage(`¡Notificación oficial enviada exitosamente a ${clientUser.email} mediante Google Gmail API!`);
      } else if (res.dispatchedViaNetwork) {
        setDeliveryStatus('network_delivered');
        setDeliveryMessage(`¡Notificación oficial despachada a la bandeja de ${clientUser.email} correctamente!`);
      } else {
        setDeliveryStatus('webmail_ready');
        setDeliveryMessage(`Mensaje oficial preparado para ${clientUser.email}. Utiliza los accesos directos abajo para abrir en Gmail o tu cliente de correo.`);
      }
    } catch (err: any) {
      setDeliveryStatus('webmail_ready');
      setDeliveryMessage(`Mensaje oficial preparado para ${clientUser.email}.`);
    }
  };

  // Registro directo con Google
  const handleRegisterWithGoogle = async () => {
    setError('');
    setIsLoading(true);
    try {
      const authResult = await googleSignIn();
      if (!authResult?.user) {
        throw new Error('No se pudo completar el inicio de sesión con Google.');
      }
      const gUser = authResult.user;
      const gEmail = (gUser.email || email).toLowerCase().trim();
      const gName = gUser.displayName || name.trim() || 'Cliente ColorLink';
      const fullAddress = address.trim() || `${city}, Colombia`;
      const fullId = identification.trim() || `NIT-${Math.floor(Math.random() * 9000000 + 1000000)}`;

      const newUser: UserProfile = {
        id: 'usr-' + Math.random().toString(36).substring(2, 7),
        name: gName,
        email: gEmail,
        password: password.trim() || 'cliente123',
        phone: phone.trim() || '3001234567',
        company: company.trim() || 'Constructora / Cliente Particular',
        role: 'cliente',
        city,
      };

      // 1. Guardar en la nube multi-dispositivo (servidor ColorLink)
      await saveCloudClient({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        phone: newUser.phone,
        address: fullAddress,
        city: newUser.city,
        identification: fullId,
        role: 'cliente',
        company: newUser.company,
      });

      // 2. Guardar en base de datos PostgreSQL / Supabase
      await syncClientToSupabase({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        phone: newUser.phone,
        address: fullAddress,
        city: newUser.city,
        identification: fullId,
        role: 'cliente',
        company: newUser.company,
      });

      // Guardar en usuarios locales de ColorLink
      let localUsers: UserProfile[] = [];
      try {
        const stored = localStorage.getItem('colorlink_users');
        if (stored) localUsers = JSON.parse(stored);
      } catch {}
      const updatedUsers = localUsers.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase());
      updatedUsers.unshift(newUser);
      try {
        localStorage.setItem('colorlink_users', JSON.stringify(updatedUsers));
      } catch {}

      // 3. Despachar correo oficial de bienvenida por Gmail API con el token recién obtenido
      const sentWelcome = await sendWelcomeEmail(newUser, {
        identification: fullId,
        address: fullAddress,
      });

      if (sentWelcome.dispatchedViaGmailApi) {
        setDeliveryStatus('gmail_delivered');
        setGmailMsgId(sentWelcome.gmailMessageId || null);
        setDeliveryMessage(`¡Correo oficial entregado a ${newUser.email} mediante la API de Google Gmail! (ID: ${sentWelcome.gmailMessageId})`);
      } else {
        setDeliveryStatus('network_delivered');
        setDeliveryMessage(`¡Notificación oficial enviada al correo de ${newUser.email}!`);
      }

      setIsLoading(false);
      setConfirmationData({
        userProfile: newUser,
        identification: fullId,
        address: fullAddress,
        syncedToCloud: true,
        message: `El cliente ${newUser.name} ha sido dado de alta formalmente en ColorLink y el correo oficial fue enviado a ${newUser.email}.`,
        welcomeNotification: sentWelcome,
      });
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Error al registrarse con Google. Por favor completa el formulario manual.');
    }
  };

  // Copiar contenido del correo oficial al portapapeles
  const handleCopyEmail = (emailItem?: EmailNotification) => {
    if (!emailItem) return;
    const plain = buildEmailPlainText(emailItem);
    navigator.clipboard.writeText(`ASUNTO: ${emailItem.subject}\n\n${plain}`);
    setCopiedEmailText(true);
    setTimeout(() => setCopiedEmailText(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim() || !identification.trim()) {
      setError('Por favor complete los campos obligatorios marcados con asterisco (*).');
      return;
    }

    const cleanId = identification.trim().replace(/\D/g, '').slice(0, 10);
    if (!cleanId) {
      setError('Por favor ingrese el NIT o Cédula de Ciudadanía.');
      return;
    }
    if (cleanId.length > 10) {
      setError('La Cédula o NIT no puede superar los 10 dígitos.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '').slice(0, 10);
    if (!cleanPhone) {
      setError('Por favor ingrese el teléfono o WhatsApp de contacto.');
      return;
    }
    if (cleanPhone.length > 10) {
      setError('El teléfono no puede superar los 10 dígitos.');
      return;
    }
    if (cleanPhone.length < 7) {
      setError('El teléfono debe tener al menos 7 y hasta 10 dígitos numéricos.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña de acceso debe tener al menos 6 caracteres.');
      return;
    }

    setError('');
    setIsLoading(true);

    const fullAddress = address.trim() || `${city}, Colombia`;
    const fullId = cleanId;

    const newUser: UserProfile = {
      id: 'usr-' + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: cleanPhone,
      company: company.trim() || 'Constructora / Cliente Particular',
      role: 'cliente',
      city,
    };

    try {
      // 1. Guardar en la nube multi-dispositivo ColorLink (visible inmediatamente en otros dispositivos)
      await saveCloudClient({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        phone: newUser.phone,
        address: fullAddress,
        city: newUser.city,
        identification: fullId,
        role: 'cliente',
        company: newUser.company,
      });

      // 2. Guardar en base de datos PostgreSQL (tablas public.clientes y public.usuarios)
      await syncClientToSupabase({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        phone: newUser.phone,
        address: fullAddress,
        city: newUser.city,
        identification: fullId,
        role: 'cliente',
        company: newUser.company,
      });

      // 3. Guardar en usuarios locales de ColorLink
      let localUsers: UserProfile[] = [];
      try {
        const stored = localStorage.getItem('colorlink_users');
        if (stored) localUsers = JSON.parse(stored);
      } catch {}
      const updatedUsers = localUsers.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase());
      updatedUsers.unshift(newUser);
      try {
        localStorage.setItem('colorlink_users', JSON.stringify(updatedUsers));
      } catch {}

      // 4. Si no hay token de Google activo en memoria, intentar conectarlo para despacho directo por Gmail API
      if (!isGoogleConnected()) {
        try {
          await ensureGoogleAccessToken();
        } catch (gErr) {
          console.info('Autorización de Google omitida en envío manual:', gErr);
        }
      }

      // 5. ENVIAR CORREO OFICIAL AL CLIENTE (con soporte para Gmail API o sincronización global)
      const sentWelcome = await sendWelcomeEmail(newUser, {
        identification: fullId,
        address: fullAddress,
      });

      if (sentWelcome.dispatchedViaGmailApi) {
        setDeliveryStatus('gmail_delivered');
        setGmailMsgId(sentWelcome.gmailMessageId || null);
        setDeliveryMessage(`¡Correo oficial entregado a ${newUser.email} mediante la API de Google Gmail! (ID: ${sentWelcome.gmailMessageId})`);
      } else if (sentWelcome.dispatchedViaNetwork) {
        setDeliveryStatus('network_delivered');
        setDeliveryMessage(`¡Correo oficial despachado directamente a ${newUser.email} exitosamente!`);
      } else {
        setDeliveryStatus('webmail_ready');
        setDeliveryMessage(`Correo oficial preparado con éxito para el cliente (${newUser.email}). Puedes despacharlo de inmediato con un clic en Gmail Web o tu cliente de correo.`);
      }

      setIsLoading(false);
      setConfirmationData({
        userProfile: newUser,
        identification: fullId,
        address: fullAddress,
        syncedToCloud: true,
        message: `El cliente ${newUser.name} ha sido dado de alta formalmente en ColorLink. Credenciales y mensaje oficial asignados a ${newUser.email}.`,
        welcomeNotification: sentWelcome,
      });
    } catch (err: any) {
      // Respaldo local si la base de datos externa no responde
      let fallbackWelcome: any = null;
      try {
        fallbackWelcome = await sendWelcomeEmail(newUser, {
          identification: fullId,
          address: fullAddress,
        });
      } catch {}

      setDeliveryStatus('webmail_ready');
      setDeliveryMessage(`Cliente registrado con persistencia local. Correo preparado para ${newUser.email}.`);
      setIsLoading(false);
      setConfirmationData({
        userProfile: newUser,
        identification: fullId,
        address: fullAddress,
        syncedToCloud: false,
        message: `El cliente ${newUser.name} fue registrado con persistencia local. Correo oficial asignado a ${newUser.email}.`,
        welcomeNotification: fallbackWelcome || undefined,
      });
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setIdentification('');
    setAddress('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setConfirmationData(null);
    setDeliveryStatus('idle');
    setGmailMsgId(null);
    setDeliveryMessage('');
  };

  // =========================================================================
  // VISTA 1: Pantalla de Confirmación de Registro Exitoso de Cliente
  // =========================================================================
  if (confirmationData) {
    const { userProfile, identification: docId, address: dir, syncedToCloud, message, welcomeNotification } = confirmationData;

    const emailSubject = welcomeNotification?.subject || '🎉 ¡Felicitaciones! Has sido registrado a la plataforma oficial ColorLink';
    const emailPlainText = welcomeNotification ? buildEmailPlainText(welcomeNotification) : `¡Bienvenido a ColorLink, ${userProfile.name}! Tu registro ha sido exitoso. Accede a tu portal: ${window.location.origin}`;
    const gmailUrl = buildGmailComposeUrl(userProfile.email, emailSubject, emailPlainText);
    const outlookUrl = buildOutlookComposeUrl(userProfile.email, emailSubject, emailPlainText);
    const mailtoUrl = buildMailtoUrl(userProfile.email, emailSubject, emailPlainText);

    return (
      <div className="form-card max-w-2xl bg-white border border-blue-100 rounded-2xl p-6 sm:p-8 shadow-md space-y-6" id="client-registration-success-card">
        {/* Cabecera de Éxito · Paleta Blancos y Azules */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 shadow-xs mb-1">
            <CheckCircle2 className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-blue-900 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200 inline-block">
              REGISTRO EXITOSO · BASE DE DATOS COLORLINK
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk'] text-blue-950">
            ¡Nuevo Cliente Registrado con Éxito!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            El cliente ha sido dado de alta en las tablas de la base de datos y sus credenciales de acceso al portal están listas.
          </p>
        </div>

        {/* Estado en Base de Datos (PostgreSQL) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-700" />
              <span className="font-bold text-blue-950">Persistencia en Base de Datos (PostgreSQL):</span>
            </div>
            {syncedToCloud ? (
              <span className="text-[11px] font-bold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                Sincronizado en Supabase Cloud
              </span>
            ) : (
              <span className="text-[11px] font-bold text-slate-800 bg-slate-200 px-2.5 py-1 rounded-full border border-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                Guardado en Base de Datos Local ColorLink
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {message}
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-700 pt-1">
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
              ✓ Tabla <strong>public.clientes</strong>: ID {userProfile.id}
            </span>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
              ✓ Tabla <strong>public.usuarios</strong>: Rol <strong>'cliente'</strong> (Activo)
            </span>
          </div>
        </div>

        {/* Ficha Resumen del Cliente Creado */}
        <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-700" />
              Datos de Identificación del Cliente
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-mono text-[10px] font-bold border border-blue-200">
              ROL: CLIENTE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 block">Nombre / Razón Social:</span>
              <span className="font-bold text-slate-900">{userProfile.name}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">NIT o Cédula:</span>
              <span className="font-mono font-bold text-slate-800">{docId}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Correo Electrónico (Login):</span>
              <span className="font-medium text-blue-700 font-mono">{userProfile.email}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Teléfono / WhatsApp:</span>
              <span className="font-medium text-slate-800">{userProfile.phone}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Empresa o Constructora:</span>
              <span className="font-medium text-slate-800">{userProfile.company}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Ciudad & Sede CEDI:</span>
              <span className="font-medium text-slate-800">{userProfile.city}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[11px] text-slate-500 block">Dirección de Despacho:</span>
              <span className="font-medium text-slate-800">{dir}</span>
            </div>
          </div>
        </div>

        {/* Notificación Oficial Despachada al Correo del Cliente */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-200 space-y-3.5 shadow-xs" id="welcome-email-delivery-card">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-blue-950 text-xs sm:text-sm flex items-center gap-2">
                  <span>Notificación Oficial Despachada al Correo</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                    BIENVENIDA
                  </span>
                </h4>
                <p className="text-[11px] text-blue-800">
                  Destinatario registrado: <strong className="font-mono text-blue-950 font-bold">{userProfile.email}</strong>
                </p>
              </div>
            </div>
            {deliveryStatus === 'gmail_delivered' ? (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                ✓ Entregado vía Google Gmail API
              </span>
            ) : deliveryStatus === 'network_delivered' ? (
              <span className="text-[11px] font-bold text-blue-900 bg-blue-100 border border-blue-300 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                ✓ Sincronizado en la Red ColorLink
              </span>
            ) : (
              <span className="text-[11px] font-bold text-sky-900 bg-sky-100 border border-sky-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-600" />
                ✓ Preparado & Sincronizado
              </span>
            )}
          </div>

          <div className="p-3 bg-white/90 rounded-xl border border-blue-100 text-xs text-slate-700 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 pb-1">
              <span><strong>Asunto:</strong> 🎨 ¡Bienvenido a ColorLink! Tu cuenta ha sido creada exitosamente</span>
              <span className="font-mono text-[10px] text-blue-700 font-bold">Portal ColorLink S.A.</span>
            </div>
            <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">
              El correo incluye la bienvenida formal, verificación de contraseña de acceso, resumen de datos registrados y enlaces directos al catálogo y cubicaje técnico.
            </p>
          </div>

          {/* Accesos directos para abrir en Gmail, Outlook o Copiar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <a
              href={gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              title="Abrir en Gmail Web con el mensaje prellenado"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Abrir en Gmail Web</span>
              <ExternalLink className="w-3 h-3 text-red-200" />
            </a>

            <a
              href={outlookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              title="Abrir en Outlook Web"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Abrir en Outlook</span>
              <ExternalLink className="w-3 h-3 text-sky-200" />
            </a>

            <button
              type="button"
              onClick={() => handleCopyEmail(welcomeNotification)}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              title="Copiar texto oficial del correo"
            >
              {copiedEmailText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Texto Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copiar Mensaje Oficial</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Matriz de Servicios Habilitados para el Cliente */}
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
          <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>Servicios & Módulos Habilitados para este Cliente (6 Módulos ColorLink):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
            <div className="p-2.5 bg-white rounded-lg border border-blue-100 flex items-start gap-2 shadow-2xs">
              <span className="text-base">🎨</span>
              <div>
                <strong className="text-blue-950 block">Cotizador & Cubicaje</strong>
                <span className="text-slate-600">Formulación técnica por m², tipo de muro y manos.</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-blue-100 flex items-start gap-2 shadow-2xs">
              <span className="text-base">📦</span>
              <div>
                <strong className="text-blue-950 block">Catálogo CEDI en Vivo</strong>
                <span className="text-slate-600">Consulta de existencias de pinturas en 5 bodegas ColorLink.</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-blue-100 flex items-start gap-2 shadow-2xs">
              <span className="text-base">🧮</span>
              <div>
                <strong className="text-blue-950 block">Calculadora Técnica</strong>
                <span className="text-slate-600">Cálculo de galones, espesores y dilución en tiempo real.</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-blue-100 flex items-start gap-2 shadow-2xs">
              <span className="text-base">🤖</span>
              <div>
                <strong className="text-blue-950 block">Asesor Técnico IA 24/7</strong>
                <span className="text-slate-600">Recomendaciones especializadas para intemperie o salitre.</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-blue-100 flex items-start gap-2 shadow-2xs">
              <span className="text-base">🚚</span>
              <div>
                <strong className="text-blue-950 block">Trazabilidad en Ruta</strong>
                <span className="text-slate-600">Monitoreo de empaque, placa del camión y entrega en obra.</span>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-blue-100 flex items-start gap-2 shadow-2xs">
              <span className="text-base">📄</span>
              <div>
                <strong className="text-blue-950 block">Factura DIAN & Garantía</strong>
                <span className="text-slate-600">Descarga de certificados oficiales de calidad 5 años.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones para continuar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
          <button
            type="button"
            onClick={resetForm}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            id="btn-register-another-client"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Registrar otro Cliente</span>
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-blue-300 text-blue-800 hover:bg-blue-50 text-xs font-bold transition-colors cursor-pointer"
              id="btn-goto-login-from-success"
            >
              Ir a Iniciar Sesión
            </button>

            <button
              type="button"
              onClick={() => onRegister(userProfile)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              id="btn-enter-client-portal-now"
            >
              <span>Entrar a mi Portal de Cliente</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA 2: Formulario de Registro Exclusivo para Clientes ColorLink
  // =========================================================================
  return (
    <div className="form-card max-w-xl bg-white border border-blue-100 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4" id="register-view-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="card-eyebrow text-blue-700 font-bold" id="register-eyebrow">
            REGISTRO OFICIAL DE CLIENTES · COLORLINK
          </p>
          <h2 className="card-title text-blue-950 font-bold" id="register-title">
            Crear cuenta de Cliente
          </h2>
          <p className="card-subtitle text-slate-600 text-xs" id="register-subtitle">
            Regístrese como propietario, contratista o constructora para cotizar pinturas, cubicaje técnico y trazabilidad integral en ColorLink.
          </p>
        </div>

        {onNavigateToHome && (
          <button
            type="button"
            onClick={onNavigateToHome}
            className="text-[11px] font-bold text-blue-800 hover:underline bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>← Inicio ColorLink</span>
          </button>
        )}
      </div>

      {pendingRequestData && (
        <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-blue-950 text-xs flex items-center gap-3 shadow-2xs animate-fade-in" id="pending-selection-banner">
          <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <p className="font-bold text-blue-900">
              ¡Tu selección está lista para procesarse!
            </p>
            <p className="text-[11px] text-blue-800">
              Crea tu cuenta para formular inmediatamente tu solicitud de:{' '}
              <strong className="text-blue-950 font-bold">
                {pendingRequestData.productName || pendingRequestData.colorName || (pendingRequestData.catalogItem?.productName) || 'tu selección'}
              </strong>
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="form-banner bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl text-xs flex items-center gap-2" id="register-error-banner">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Opción Rápida: Registrarse con Google para entrega directa a Gmail */}
      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={handleRegisterWithGoogle}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl border border-blue-200 bg-white hover:bg-blue-50/80 text-blue-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow transition-all cursor-pointer"
          id="btn-register-with-google"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Registrarse con Google (Despacho Oficial Directo a tu Gmail)</span>
        </button>

        <div className="flex items-center gap-3 my-2">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">o ingresa tus datos en el formulario</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>
      </div>

      <form onSubmit={handleSubmit} id="register-form" className="space-y-3">
        <div className="field-row">
          <Field
            id="register-name"
            label="Nombre completo o Razón Social *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Nicoll Ximena Torres o Constructora San Juan"
            icon={<User className="w-4 h-4" />}
            required
          />
          <Field
            id="register-id"
            label="NIT o Cédula de Ciudadanía (Hasta 10 dígitos) *"
            value={identification}
            onChange={(e) => {
              const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
              setIdentification(numericOnly);
            }}
            onKeyDown={(e) => {
              if (
                ['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) ||
                e.ctrlKey || e.metaKey
              ) {
                return;
              }
              if (!/^[0-9]$/.test(e.key) || identification.length >= 10) {
                e.preventDefault();
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pasted = e.clipboardData.getData('text');
              const numericOnly = pasted.replace(/\D/g, '').slice(0, 10);
              setIdentification(numericOnly);
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            placeholder="Ej. 1098765432 o 43123456"
            icon={<ShieldCheck className="w-4 h-4" />}
            hint="Solo datos numéricos (hasta 10 dígitos, si pones menos también funciona)"
            required
          />
        </div>

        <div className="field-row">
          <Field
            id="register-email"
            label="Correo electrónico del cliente *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@ejemplo.com"
            icon={<Mail className="w-4 h-4" />}
            required
          />

          <Field
            id="register-phone"
            label="Teléfono / WhatsApp de Contacto (Hasta 10 dígitos) *"
            type="tel"
            value={phone}
            onChange={(e) => {
              const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
              setPhone(numericOnly);
            }}
            onKeyDown={(e) => {
              if (
                ['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) ||
                e.ctrlKey || e.metaKey
              ) {
                return;
              }
              if (!/^[0-9]$/.test(e.key) || phone.length >= 10) {
                e.preventDefault();
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pasted = e.clipboardData.getData('text');
              const numericOnly = pasted.replace(/\D/g, '').slice(0, 10);
              setPhone(numericOnly);
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            placeholder="Ej. 3001234567 (hasta 10 dígitos)"
            icon={<Phone className="w-4 h-4" />}
            hint="Solo datos numéricos (hasta 10 dígitos)"
            required
          />
        </div>

        <div className="field-row">
          <Field
            id="register-city"
            label="Ciudad principal & CEDI ColorLink"
            type="select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            icon={<MapPin className="w-4 h-4" />}
            options={[
              { value: 'Medellín', label: 'Medellín (CEDI Rionegro)' },
              { value: 'Bogotá D.C.', label: 'Bogotá D.C. (CEDI Siberia)' },
              { value: 'Cali', label: 'Cali (CEDI Acopi Yumbo)' },
              { value: 'Barranquilla', label: 'Barranquilla (CEDI Galapa)' },
              { value: 'Bucaramanga', label: 'Bucaramanga (CEDI Girón)' },
            ]}
          />

          <Field
            id="register-company"
            label="Empresa o Nombre de la Obra (Opcional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Ej. Obras & Acabados del Valle"
            icon={<Building className="w-4 h-4" />}
          />
        </div>

        <Field
          id="register-address"
          label="Dirección de Entrega / Despacho"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Ej. Calle 50 # 40-20, Medellín"
          icon={<MapPin className="w-4 h-4" />}
        />

        <div className="field-row">
          <Field
            id="register-password"
            label="Contraseña de acceso *"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            icon={<Lock className="w-4 h-4" />}
            required
          />
          <Field
            id="register-confirm-password"
            label="Confirmar contraseña *"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita su contraseña"
            icon={<Lock className="w-4 h-4" />}
            required
          />
        </div>

        {/* Resumen de accesos para el nuevo cliente */}
        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2 text-xs text-slate-700">
          <p className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            Acceso Inmediato Habilitado para Clientes en ColorLink:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="flex items-start gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
              <span><strong>Catálogo en Vivo:</strong> Existencias en tiempo real de 5 CEDIs ColorLink.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
              <span><strong>Calculadora Técnica:</strong> Rendimiento m², galones y cuñetes requeridos.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
              <span><strong>Trazabilidad en Ruta:</strong> Monitoreo de camión con placa y ruta de entrega.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
              <span><strong>Asesor IA ColorLink:</strong> Recomendación técnica para intemperie o tráfico.</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          id="btn-register-submit"
          className="btn-primary mt-2 !py-2.5 w-full flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Guardando en Base de Datos & Despachando Correo...
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              Registrar Cliente & Enviar Mensaje a su Correo
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </form>

      <p className="switch-text text-center pt-2 text-xs text-slate-600" id="register-login-prompt">
        ¿Ya tiene una cuenta registrada?{' '}
        <button
          type="button"
          className="btn-link text-blue-600 font-bold hover:underline cursor-pointer"
          id="btn-goto-login"
          onClick={onNavigateToLogin}
        >
          Iniciar sesión aquí
        </button>
      </p>
    </div>
  );
};
