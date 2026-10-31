import React, { useState } from 'react';
import {
  Calculator,
  Palette,
  Home,
  FileText,
  LogIn,
  ShoppingCart,
  User,
  LogOut,
  Bell,
  Database,
} from '../icons';
import { UserProfile } from '../types';

interface MainNavbarProps {
  currentUser: UserProfile | null;
  cartCount: number;
  activeSection?: string;
  onNavigateHome: () => void;
  onNavigateCatalog: () => void;
  onOpenCalculator: () => void;
  onNavigatePalettes: () => void;
  onOpenTechnicalSheets?: () => void;
  onNavigateAmbientes: () => void;
  onOpenCart: () => void;
  onNavigateLogin: () => void;
  onNavigatePortal: () => void;
  onLogout: () => void;
  onOpenSupabaseModal?: () => void;
  onOpenEmailInbox?: () => void;
  emailUnreadCount?: number;
}

export const MainNavbar: React.FC<MainNavbarProps> = ({
  currentUser,
  cartCount,
  activeSection = 'catalogo',
  onNavigateHome,
  onNavigateCatalog,
  onOpenCalculator,
  onNavigatePalettes,
  onOpenTechnicalSheets,
  onNavigateAmbientes,
  onOpenCart,
  onNavigateLogin,
  onNavigatePortal,
  onLogout,
  onOpenSupabaseModal,
  onOpenEmailInbox,
  emailUnreadCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md text-slate-800 shadow-xs border-b border-slate-200/90 transition-colors">
      <div className="max-w-[1520px] mx-auto px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 md:gap-8">
        
        {/* =========================================================
            ZONA 1 (IZQUIERDA): LOGO IDENTIDAD COLORLINK OFICIAL
            Paleta ColorLink: Azul Real Zafiro (#2563eb) & Slate Profundo
            ========================================================= */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer text-left transition-transform hover:scale-[1.01] shrink-0"
          title="ColorLink · Tienda Oficial de Recubrimientos & Pintura"
          id="btn-main-navbar-logo"
        >
          {/* Cuadrado azul real zafiro con bordes redondeados y letra C en blanco */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-xs flex items-center justify-center shrink-0">
            <span className="text-white font-black text-xl sm:text-2xl leading-none font-['Space_Grotesk']">
              C
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-900 font-extrabold text-lg sm:text-xl tracking-tight leading-none font-['Space_Grotesk']">
              COLORLINK
            </span>
            <span className="text-[10px] sm:text-[11px] text-blue-600 font-semibold tracking-normal mt-0.5 sm:mt-1 leading-none hidden xs:inline">
              Tienda Oficial de Recubrimientos & Pintura
            </span>
          </div>
        </button>

        {/* =========================================================
            ZONA 2 (CENTRO): ENLACES DE NAVEGACIÓN
            Estructura idéntica pero con la paleta limpia oficial ColorLink
            ========================================================= */}
        <nav
          className={`
            fixed md:static top-[57px] left-0 right-0 md:top-auto md:left-auto md:right-auto
            bg-white md:bg-transparent border-b md:border-b-0 border-slate-200 p-4 md:p-0
            flex flex-col md:flex-row items-start md:items-center gap-4 lg:gap-8 text-sm
            transition-all duration-200 z-40
            ${mobileMenuOpen ? 'flex shadow-xl' : 'hidden md:flex'}
          `}
          id="main-nav-links"
        >
          {/* 1. Tienda & Catálogo (con línea activa en Azul Real ColorLink) */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigateCatalog();
            }}
            className="group cursor-pointer py-1 relative text-left"
            id="nav-link-tienda-catalogo"
          >
            <span className="text-blue-600 font-bold text-sm tracking-tight inline-block pb-0.5 border-b-2 border-blue-600">
              Tienda & Catálogo
            </span>
          </button>

          {/* 2. Calculadora de Galones (con icono en azul ColorLink) */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenCalculator();
            }}
            className="flex items-center gap-2 text-slate-700 hover:text-blue-600 font-semibold text-sm transition-colors cursor-pointer py-1"
            id="nav-link-calculadora-galones"
            title="Calcular metros cuadrados y galones requeridos"
          >
            <Calculator className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Calculadora de Galones</span>
          </button>

          {/* 3. Paletas & Tendencias (con icono en celeste cerúleo) */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigatePalettes();
            }}
            className="flex items-center gap-2 text-slate-700 hover:text-blue-600 font-semibold text-sm transition-colors cursor-pointer py-1"
            id="nav-link-paletas-tendencias"
            title="Ver catálogo de colores y armonías arquitectónicas"
          >
            <Palette className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Paletas & Tendencias</span>
          </button>

          {/* 4. Ambientes (Muestra los ambientes arquitectónicos ColorLink) */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigateAmbientes();
            }}
            className="flex items-center gap-1.5 text-slate-700 hover:text-blue-600 font-semibold text-sm transition-colors cursor-pointer py-1"
            id="nav-link-ambientes"
            title="Ver ambientes arquitectónicos y soluciones técnicas Pintuco"
          >
            <Home className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Ambientes</span>
          </button>

          {/* Acceso a Supabase (solo administrador) */}
          {currentUser?.role === 'administrador' && onOpenSupabaseModal && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSupabaseModal();
              }}
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition-colors"
              title="Base de Datos Supabase (12 tablas ERD)"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Supabase DB</span>
            </button>
          )}
        </nav>

        {/* =========================================================
            ZONA 3 (DERECHA): BOTONES DE ACCIÓN COLORLINK
            [ Iniciar Sesión ]   [ 🛒 Mi Carrito (0) ]
            ========================================================= */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Notificaciones y Correos Oficiales (Disponible para personal administrativo y de logística) */}
          {currentUser && currentUser.role !== 'cliente' && onOpenEmailInbox && (
            <button
              type="button"
              onClick={onOpenEmailInbox}
              className={`relative p-2 rounded-full border transition-all cursor-pointer ${
                emailUnreadCount > 0
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/40'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
              title={`Notificaciones y Correos Oficiales al Buzón (${emailUnreadCount} sin leer)`}
              id="btn-navbar-email-inbox"
            >
              <Bell className="w-4 h-4" />
              {emailUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold font-mono flex items-center justify-center animate-pulse">
                  {emailUnreadCount}
                </span>
              )}
            </button>
          )}

          {/* Botón 1: Iniciar Sesión (o Mi Portal si ya está autenticado) */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onNavigatePortal}
                className="bg-blue-50 hover:bg-blue-100/90 border border-blue-200 text-blue-900 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                title={`Ir a tu portal (${currentUser.role})`}
                id="btn-navbar-portal"
              >
                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-[150px]">
                  {currentUser.role === 'cliente'
                    ? `Mi Portal (${currentUser.name.split(' ')[0]})`
                    : currentUser.role === 'administrador'
                    ? 'Panel Admin'
                    : currentUser.role === 'empacador'
                    ? 'CEDI Empaque'
                    : 'Despacho Flota'}
                </span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar sesión"
                id="btn-navbar-logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onNavigateLogin}
              className="bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200/90 text-slate-800 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              id="btn-navbar-login"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
              <span>Iniciar Sesión</span>
            </button>
          )}

          {/* Botón Carrito de Compras: Solo Icono/Imagen del Carrito con Contador */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-sm shadow-blue-500/25 transition-all cursor-pointer shrink-0"
            title={`Ver carrito de compras (${cartCount} productos)`}
            id="btn-navbar-cart"
            aria-label="Ver carrito de compras"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            {/* Contador Circular Blanco con texto Azul */}
            <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-white text-blue-700 text-[10px] font-mono font-bold flex items-center justify-center shadow-xs border border-blue-200">
              {cartCount}
            </span>
          </button>

          {/* Botón Hamburguesa para Móvil */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer"
            aria-label="Abrir menú"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
