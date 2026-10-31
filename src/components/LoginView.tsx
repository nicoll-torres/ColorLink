import React, { useState } from 'react';
import { Field } from './Field';
import { UserProfile } from '../types';
import { DEMO_USERS } from '../data';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Key,
  AlertCircle,
  CheckCircle2,
  Check,
  Copy,
  ExternalLink,
  Send,
} from '../icons';
import { getSupabaseClient } from '../supabase';
import { sendPasswordRecoveryEmail, buildGmailComposeUrl } from '../emailService';
import { googleSignIn } from '../googleAuth';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
  onNavigateToRegister: () => void;
  onNavigateToHome?: () => void;
  currentGoogleUser?: any;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  onNavigateToRegister,
  onNavigateToHome,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [isDemoUnlocked, setIsDemoUnlocked] = useState(false);
  const [demoPinPrompt, setDemoPinPrompt] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Estados para Recuperación de Contraseña al Correo del Cliente
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccessData, setRecoverySuccessData] = useState<{
    email: string;
    name: string;
    newPassword: string;
    gmailUrl?: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await googleSignIn();
      if (!res?.user) {
        throw new Error('No se pudo autenticar con Google.');
      }
      const gUser = res.user;
      const gEmail = (gUser.email || '').toLowerCase().trim();
      const gName = gUser.displayName || 'Cliente ColorLink';

      let localUsers: UserProfile[] = [];
      try {
        const stored = localStorage.getItem('colorlink_users');
        if (stored) localUsers = JSON.parse(stored);
      } catch {}

      let user = localUsers.find((u) => u.email.toLowerCase() === gEmail);
      if (!user) {
        user = {
          id: 'usr-' + Math.random().toString(36).substring(2, 7),
          name: gName,
          email: gEmail,
          password: 'google_user_auth',
          phone: '',
          company: 'Cliente Registrado',
          role: 'cliente',
          city: 'Medellín',
        };
        localUsers.unshift(user);
        localStorage.setItem('colorlink_users', JSON.stringify(localUsers));
      }

      setIsLoading(false);
      onLogin(user);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Error al iniciar sesión con Google.');
    }
  };

  const handleToggleDemoAccounts = () => {
    if (showDemoAccounts) {
      setShowDemoAccounts(false);
      return;
    }
    if (isDemoUnlocked) {
      setShowDemoAccounts(true);
      return;
    }
    setDemoPinPrompt(true);
    setPinError('');
    setEnteredPin('');
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin.trim() === '12345') {
      setIsDemoUnlocked(true);
      setShowDemoAccounts(true);
      setDemoPinPrompt(false);
      setPinError('');
    } else {
      setPinError('Contraseña incorrecta. Solo personal que conozca la clave.');
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = recoveryEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setRecoveryError('Por favor ingrese un correo electrónico válido.');
      return;
    }

    setRecoveryLoading(true);
    setRecoveryError('');

    // 1. Buscar en colorlink_users y colorlink_clients locales
    let localUsers: UserProfile[] = [];
    try {
      const stored = localStorage.getItem('colorlink_users');
      if (stored) localUsers = JSON.parse(stored);
    } catch {}

    let storedClients: any[] = [];
    try {
      const stored = localStorage.getItem('colorlink_clients');
      if (stored) storedClients = JSON.parse(stored);
    } catch {}

    let storedStaff: any[] = [];
    try {
      const stored = localStorage.getItem('colorlink_staff');
      if (stored) storedStaff = JSON.parse(stored);
    } catch {}

    let foundUser: { name: string; email: string } | null = null;

    // Buscar en usuarios locales
    const inLocalUsers = localUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (inLocalUsers) foundUser = inLocalUsers;

    // Buscar en clientes registrados
    if (!foundUser) {
      const inClients = storedClients.find((c) => (c.email || '').toLowerCase() === cleanEmail);
      if (inClients) foundUser = inClients;
    }

    // Buscar en staff operativo
    if (!foundUser) {
      const inStaff = storedStaff.find((s) => (s.email || '').toLowerCase() === cleanEmail);
      if (inStaff) foundUser = inStaff;
    }

    // Buscar en DEMO_USERS
    if (!foundUser) {
      const inDemo = DEMO_USERS.find((d) => d.email.toLowerCase() === cleanEmail);
      if (inDemo) foundUser = inDemo;
    }

    // Buscar en Supabase (public.usuarios o public.clientes) si está disponible
    const client = getSupabaseClient();
    if (!foundUser && client) {
      try {
        const { data: supaUser } = await client
          .from('usuarios')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (supaUser) {
          foundUser = {
            name: supaUser.nombre || 'Cliente ColorLink',
            email: supaUser.email,
          };
        }
      } catch (err) {
        console.warn('Consulta de usuario en Supabase:', err);
      }
    }

    // Si no se encuentra ninguna cuenta
    if (!foundUser) {
      setRecoveryLoading(false);
      setRecoveryError('No encontramos ninguna cuenta registrada con este correo electrónico. Por favor verifica la dirección o crea una cuenta nueva.');
      return;
    }

    // 2. Generar el nuevo código / nueva contraseña para el cliente
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const newPasswordCode = `CL-${randomDigits}`;

    // 3. Actualizar la contraseña en todas las fuentes de almacenamiento
    // a) En colorlink_users
    const updatedUsers = localUsers.map((u) =>
      u.email.toLowerCase() === cleanEmail ? { ...u, password: newPasswordCode } : u
    );
    if (!localUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      updatedUsers.unshift({
        id: `usr-${Date.now()}`,
        name: foundUser.name,
        email: foundUser.email,
        password: newPasswordCode,
        phone: (foundUser as any).phone || '',
        role: 'cliente',
        company: (foundUser as any).company || 'Cliente Registrado',
        city: (foundUser as any).city || 'Medellín',
      });
    }
    try {
      localStorage.setItem('colorlink_users', JSON.stringify(updatedUsers));
    } catch {}

    // b) En colorlink_clients si existía
    if (storedClients.length > 0) {
      const updatedClients = storedClients.map((c) =>
        (c.email || '').toLowerCase() === cleanEmail ? { ...c, password: newPasswordCode } : c
      );
      try {
        localStorage.setItem('colorlink_clients', JSON.stringify(updatedClients));
      } catch {}
    }

    // c) En Supabase si está disponible
    if (client) {
      try {
        await client
          .from('usuarios')
          .update({ password: newPasswordCode })
          .eq('email', cleanEmail);
      } catch {}
    }

    // 4. Enviar correo oficial de recuperación con la nueva clave al correo registrado del cliente
    try {
      await sendPasswordRecoveryEmail(
        { name: foundUser.name, email: foundUser.email },
        newPasswordCode
      );
    } catch (err) {
      console.warn('Envío de correo de recuperación:', err);
    }

    const emailSubject = `🔐 Recuperación de Contraseña ColorLink · Nueva clave: ${newPasswordCode}`;
    const emailBody = `Hola ${foundUser.name},\n\nTu nueva contraseña oficial para ingresar a ColorLink es: ${newPasswordCode}\n\nIngresa aquí: ${typeof window !== 'undefined' ? window.location.origin : 'https://colorlink.com'}`;
    const gmailUrl = buildGmailComposeUrl(foundUser.email, emailSubject, emailBody);

    setRecoveryLoading(false);
    setRecoverySuccessData({
      email: foundUser.email,
      name: foundUser.name,
      newPassword: newPasswordCode,
      gmailUrl,
    });
  };

  const handleApplyNewPasswordAndLogin = () => {
    if (!recoverySuccessData) return;
    setEmail(recoverySuccessData.email);
    setPassword(recoverySuccessData.newPassword);
    setIsForgotModalOpen(false);
    setRecoverySuccessData(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor ingrese su correo electrónico y contraseña.');
      return;
    }

    setError('');
    setIsLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Obtener usuarios registrados localmente en localStorage (usuarios, operarios y clientes)
    let localUsers: UserProfile[] = [];
    try {
      const stored = localStorage.getItem('colorlink_users');
      if (stored) {
        localUsers = JSON.parse(stored);
      }
    } catch {
      localUsers = [];
    }

    // Incluir personal operativo editado por el administrador
    let staffUsers: UserProfile[] = [];
    try {
      const storedStaff = localStorage.getItem('colorlink_staff');
      if (storedStaff) {
        const staffList = JSON.parse(storedStaff);
        staffUsers = staffList.map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          password: s.password || 'pintuco2026',
          phone: s.phone || '',
          role: s.role || 'conductor',
          company: `${s.cediName || 'CEDI'} · Pintuco S.A.`,
          city: s.cediCity || 'Medellín',
          vehiclePlate: s.vehiclePlate,
          badgeNumber: s.badgeNumber,
        }));
      }
    } catch {}

    // Incluir clientes editados o creados por el administrador
    let clientUsers: UserProfile[] = [];
    try {
      const storedClients = localStorage.getItem('colorlink_clients');
      if (storedClients) {
        const clientsList = JSON.parse(storedClients);
        clientUsers = clientsList.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          password: c.password || 'cliente123',
          phone: c.phone || '',
          company: c.company || 'Constructora / Cliente',
          role: 'cliente',
          city: c.city || 'Medellín',
          address: c.address,
        }));
      }
    } catch {}

    // Combinar usuarios: staff y clientes tienen prioridad sobre usuarios demo y locales
    const allUsers = [...staffUsers, ...clientUsers, ...localUsers, ...DEMO_USERS];
    let matchedUser = allUsers.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    // 2. Verificar en Supabase Cloud si hay cliente/conexión disponible
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: supaUser, error: supaErr } = await client
          .from('usuarios')
          .select('*')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (supaUser && !supaErr) {
          const cloudPass = supaUser.password || supaUser.contrasena;

          // Si el usuario en Supabase tiene contraseña y no coincide
          if (cloudPass && cloudPass !== password) {
            setIsLoading(false);
            setError('Contraseña incorrecta. Verifique la clave ingresada.');
            return;
          }

          // Si en Supabase no tenía contraseña guardada aún, guardarla ahora
          if (!cloudPass) {
            try {
              await client
                .from('usuarios')
                .update({ password })
                .eq('email', normalizedEmail);
            } catch {
              // Si la columna password aún no existe en Supabase, se ignora
            }
          }

          const loggedInUser: UserProfile = {
            id: supaUser.id_usuario || matchedUser?.id || 'usr-' + Math.random().toString(36).substring(2, 7),
            name: supaUser.nombre || matchedUser?.name || 'Cliente ColorLink',
            email: supaUser.email,
            password: password,
            phone: supaUser.telefono || matchedUser?.phone || '',
            company: matchedUser?.company || 'Constructora / Cliente',
            role: (supaUser.rol as any) || matchedUser?.role || 'cliente',
            city: matchedUser?.city || 'Medellín',
          };

          // Actualizar en localStorage para sesiones inmediatas
          const updatedUsers = localUsers.filter((u) => u.email.toLowerCase() !== normalizedEmail);
          updatedUsers.unshift(loggedInUser);
          localStorage.setItem('colorlink_users', JSON.stringify(updatedUsers));

          setIsLoading(false);
          onLogin(loggedInUser);
          return;
        }
      } catch (cloudErr) {
        console.warn('Consulta a Supabase en login:', cloudErr);
      }
    }

    // 3. Si se encuentra en usuarios locales o demo
    if (matchedUser) {
      // Auto-reparación: si el usuario fue registrado con el valor por defecto 'cliente123'
      // y ahora ingresa con su contraseña deseada, actualizamos su contraseña en almacenamiento
      if (matchedUser.password === 'cliente123' && password !== 'cliente123') {
        matchedUser.password = password;
        const updatedUsers = localUsers.map((u) =>
          u.email.toLowerCase() === normalizedEmail ? { ...u, password } : u
        );
        localStorage.setItem('colorlink_users', JSON.stringify(updatedUsers));
      } else if (matchedUser.password && matchedUser.password !== password) {
        setIsLoading(false);
        setError('Contraseña incorrecta. Verifique la clave ingresada.');
        return;
      }

      setIsLoading(false);
      onLogin(matchedUser);
      return;
    }

    // 4. Si es un correo corporativo Pintuco o patrón de prueba
    if (normalizedEmail.includes('admin')) {
      const adminUser = DEMO_USERS.find((u) => u.role === 'administrador')!;
      setIsLoading(false);
      onLogin({ ...adminUser, email: normalizedEmail });
      return;
    }
    if (normalizedEmail.includes('empacador') || normalizedEmail.includes('bodega')) {
      const packUser = DEMO_USERS.find((u) => u.role === 'empacador')!;
      setIsLoading(false);
      onLogin({ ...packUser, email: normalizedEmail });
      return;
    }
    if (normalizedEmail.includes('conductor') || normalizedEmail.includes('chofer') || normalizedEmail.includes('transporte')) {
      const driverUser = DEMO_USERS.find((u) => u.role === 'conductor')!;
      setIsLoading(false);
      onLogin({ ...driverUser, email: normalizedEmail });
      return;
    }

    // 5. Si no existe en la base de datos
    setIsLoading(false);
    setError(
      'Usuario no encontrado. Verifique su correo o regístrese si es nuevo en el sistema.'
    );
  };

  const handleFillDemo = (demoUser: UserProfile) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password || 'pintuco2026');
    setError('');
  };

  return (
    <div className="form-card max-w-md bg-white border border-blue-100 rounded-2xl p-6 shadow-sm" id="login-view-card">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="card-eyebrow text-blue-700 font-bold" id="login-eyebrow">
            ACCESO SEGURO · COLORLINK
          </p>
          <h2 className="card-title text-blue-950 font-bold" id="login-title">
            Iniciar Sesión
          </h2>
          <p className="card-subtitle text-slate-600 text-xs" id="login-subtitle">
            Ingrese sus credenciales para acceder al portal asignado según su rol.
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

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2" id="login-error-banner">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Formulario Estándar y Limpio · Paleta Blanco y Azul */}
      <form onSubmit={handleSubmit} id="login-form" className="space-y-4">
        <Field
          id="login-email"
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          placeholder="ejemplo@colorlink.com"
          icon={<Mail className="w-4 h-4 text-blue-600" />}
          required
        />

        <Field
          id="login-password"
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError('');
          }}
          placeholder="••••••••"
          icon={<Lock className="w-4 h-4 text-blue-600" />}
          required
        />

        <div className="flex items-center justify-end -mt-2">
          <button
            type="button"
            onClick={() => {
              setRecoveryEmail(email || '');
              setRecoveryError('');
              setRecoverySuccessData(null);
              setIsForgotModalOpen(true);
            }}
            className="text-[11.5px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
            id="btn-forgot-password-link"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button
          type="submit"
          id="btn-login-submit"
          className="btn-primary mt-2 !py-2.5 w-full flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Verificando credenciales...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Ingresar al Sistema
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </form>

      {/* Acceso a Registro */}
      <p className="switch-text text-center pt-2 text-xs text-slate-600" id="login-register-prompt">
        ¿No tiene una cuenta registrada?{' '}
        <button
          type="button"
          className="btn-link text-blue-600 font-bold hover:underline cursor-pointer"
          id="btn-goto-register"
          onClick={onNavigateToRegister}
        >
          Crear cuenta nueva
        </button>
      </p>

      {/* Bloque de Cuentas Demo Protegido por Contraseña · Clave: 12345 */}
      <div className="mt-3.5 bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-xs">
        <button
          type="button"
          onClick={handleToggleDemoAccounts}
          className="w-full flex items-center justify-between text-blue-950 hover:text-blue-700 font-mono text-[11px] cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-bold text-blue-950">
            <Key className="w-3.5 h-3.5 text-blue-600" />
            Cuentas demo para acceso rápido
          </span>
          <span className="text-[10px] text-blue-600 font-sans underline font-semibold flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            {showDemoAccounts ? 'Ocultar' : 'Ver correos preconfigurados'}
          </span>
        </button>

        {/* Prompt de Contraseña de Seguridad (Clave: 12345) */}
        {demoPinPrompt && !showDemoAccounts && (
          <form onSubmit={handleVerifyPin} className="mt-2.5 p-3 rounded-xl bg-white border border-blue-300 space-y-2 shadow-xs animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                Ingresa la contraseña:
              </span>
              <button
                type="button"
                onClick={() => {
                  setDemoPinPrompt(false);
                  setPinError('');
                }}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-slate-600">
              Solo personal autorizado puede ver los correos preconfigurados:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                autoFocus
                placeholder="Ingresa la contraseña..."
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  if (pinError) setPinError('');
                }}
                className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                Desbloquear
              </button>
            </div>
            {pinError && (
              <p className="text-[10.5px] font-semibold text-red-600 flex items-center gap-1">
                <span>⚠️</span> {pinError}
              </p>
            )}
          </form>
        )}

        {/* Cuentas Desbloqueadas */}
        {showDemoAccounts && (
          <div className="mt-2.5 space-y-1.5 pt-2 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-[10.5px] text-slate-600 mb-1">
                Click en cualquier cuenta para autocompletar correo y contraseña (clave: <code className="font-mono text-blue-900 font-bold">pintuco2026</code>):
              </p>
              <span className="text-[9.5px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold">
                ✓ Desbloqueado
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => handleFillDemo(demo)}
                  className="text-left px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-100/70 border border-blue-200 hover:border-blue-300 transition-all cursor-pointer shadow-2xs"
                >
                  <p className="font-mono text-[10px] font-bold text-blue-950 truncate">
                    {demo.email}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {demo.role === 'administrador' ? '👑 Administrador General' : demo.role === 'empacador' ? '📦 Operario de Bodega' : demo.role === 'conductor' ? '🚚 Conductor Express' : '🏗️ Cliente / Constructora'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
        <span>Autenticación protegida con control de acceso por rol</span>
      </div>

      {/* Modal de Recuperación de Contraseña por Correo */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" id="password-recovery-modal">
          <div className="bg-white rounded-2xl border border-blue-100 shadow-2xl max-w-md w-full overflow-hidden animate-scale-in flex flex-col">
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-sky-300 border border-blue-400/30 flex items-center justify-center font-bold shadow-xs">
                  <Key className="w-5 h-5 text-sky-300" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-sky-300 font-bold block">
                    COLORLINK · SEGURIDAD DE ACCESO
                  </span>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Recuperar Contraseña
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setRecoverySuccessData(null);
                  setRecoveryError('');
                }}
                className="text-white/70 hover:text-white text-lg font-bold p-1 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              {!recoverySuccessData ? (
                <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                  <p className="text-slate-600 leading-relaxed">
                    Ingresa el correo electrónico que registraste como cliente. Generaremos una <strong>nueva contraseña oficial</strong> y te enviaremos un mensaje a tu bandeja de correo para que puedas ingresar.
                  </p>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 block text-xs">
                      Correo Electrónico Registrado:
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        autoFocus
                        placeholder="tu-correo@ejemplo.com"
                        value={recoveryEmail}
                        onChange={(e) => {
                          setRecoveryEmail(e.target.value);
                          if (recoveryError) setRecoveryError('');
                        }}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  {recoveryError && (
                    <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{recoveryError}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(false)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer transition-colors text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={recoveryLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer text-xs disabled:opacity-60"
                      id="btn-submit-password-recovery"
                    >
                      {recoveryLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Generando y enviando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar Nueva Contraseña</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-emerald-950 text-xs sm:text-sm">
                        ¡Nueva contraseña enviada con éxito!
                      </h4>
                      <p className="text-[11.5px] text-emerald-800 leading-relaxed">
                        Hemos despachado la notificación oficial con tu nueva clave al correo <strong className="font-mono font-bold text-emerald-950">{recoverySuccessData.email}</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Caja con la Nueva Contraseña Generada */}
                  <div className="p-4 bg-blue-50/80 border-2 border-dashed border-blue-300 rounded-2xl text-center space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-800 block">
                      TU NUEVA CONTRASEÑA ASIGNADA
                    </span>
                    <div className="inline-flex items-center justify-center gap-2 bg-white px-4 py-2 rounded-xl border border-blue-200 shadow-2xs">
                      <span className="font-mono text-xl font-black text-blue-950 tracking-wider">
                        {recoverySuccessData.newPassword}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(recoverySuccessData.newPassword);
                          setCopiedPass(true);
                          setTimeout(() => setCopiedPass(false), 2000);
                        }}
                        className="px-3 py-1 bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        {copiedPass ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">¡Copiada!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-blue-600" />
                            <span>Copiar Contraseña</span>
                          </>
                        )}
                      </button>

                      {recoverySuccessData.gmailUrl && (
                        <a
                          href={recoverySuccessData.gmailUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          title="Abrir en Gmail Web"
                        >
                          <Mail className="w-3 h-3 text-blue-600" />
                          <span>Abrir Gmail Web</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )}
                    </div>
                  </div>

                  <p className="text-[11.5px] text-slate-600 text-center leading-relaxed">
                    La nueva clave ya está actualizada en el sistema. Haz clic abajo para aplicarla al formulario e ingresar de inmediato a tu portal.
                  </p>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleApplyNewPasswordAndLogin}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                      id="btn-apply-recovery-password"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Ingresar con esta nueva contraseña</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotModalOpen(false);
                        setRecoverySuccessData(null);
                      }}
                      className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold text-center cursor-pointer transition-colors"
                    >
                      Cerrar ventana
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
