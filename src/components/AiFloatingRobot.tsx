import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, HelpCircle, CheckCircle2 } from '../icons';

interface AiFloatingRobotProps {
  onOpenAdvisor: () => void;
  hasUnreadOrSuggestion?: boolean;
}

export const AiFloatingRobot: React.FC<AiFloatingRobotProps> = ({
  onOpenAdvisor,
}) => {
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [eyeBlink, setEyeBlink] = useState(false);

  // Efecto de parpadeo realista de los ojos del robot cada 4 segundos
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyeBlink(true);
      setTimeout(() => setEyeBlink(false), 220);
    }, 4200);
    return () => clearInterval(blinkInterval);
  }, []);

  // Ocultar la burbuja expandida tras 14 segundos para no estorbar, pero se muestra con hover
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasInteracted) {
        setBubbleVisible(false);
      }
    }, 14000);
    return () => clearTimeout(timer);
  }, [hasInteracted]);

  return (
    <aside 
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] flex flex-col items-end select-none pointer-events-auto"
      id="floating-ai-robot-advisor"
      aria-label="Asistente Virtual y Asesor Técnico Pintuco"
    >
      {/* Burbuja de Diálogo / Invitación Interactiva */}
      {(bubbleVisible || isHovered) && (
        <div 
          className="mb-2.5 max-w-[280px] sm:max-w-[320px] bg-white/95 backdrop-blur-md text-slate-800 rounded-2xl p-3.5 shadow-2xl border-2 border-blue-200/90 relative animate-in fade-in slide-in-from-bottom-2 duration-300"
          role="status"
        >
          {/* Botón para cerrar la burbuja */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setBubbleVisible(false);
              setHasInteracted(true);
            }}
            className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center text-[10px] font-bold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
            title="Ocultar globo de texto"
            aria-label="Cerrar mensaje del asesor"
          >
            ✕
          </button>

          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div className="text-left space-y-1.5 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Asesor Técnico Pintuco
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="En línea" />
                </div>
              </div>

              <p className="text-xs text-slate-700 font-medium leading-snug">
                ¡Hola! Soy tu asistente en pinturas. ¿Dudas con qué tipo de vinilo elegir, rendimiento o manos requeridas?
              </p>

              {/* Botoncitos de consultas rápidas */}
              <div className="flex flex-wrap gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setHasInteracted(true);
                    onOpenAdvisor();
                  }}
                  className="text-[10px] bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer border border-slate-200"
                >
                  📐 ¿Cuántos galones necesito?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasInteracted(true);
                    onOpenAdvisor();
                  }}
                  className="text-[10px] bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer border border-slate-200"
                >
                  🛡️ Vinilo Tipo 1 vs Tipo 2
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setHasInteracted(true);
                  onOpenAdvisor();
                }}
                className="w-full mt-1.5 py-1.5 px-3 rounded-lg bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <span>Abrir Asesor Completo</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Flecha inferior apuntando al robot */}
          <div className="absolute -bottom-2 right-7 w-4 h-4 bg-white border-b-2 border-r-2 border-blue-200/90 transform rotate-45" />
        </div>
      )}

      {/* Robot Personaje Interactivo */}
      <button
        type="button"
        onClick={() => {
          setHasInteracted(true);
          onOpenAdvisor();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-hidden group"
        title="Asesor Técnico Inteligente Pintuco · Toca para consultar"
        id="btn-floating-robot-trigger"
        aria-label="Abrir Asesor Técnico Inteligente Pintuco"
      >
        {/* Glow halo sutil azul zafiro / ámbar al hover */}
        <div className="absolute inset-0 rounded-full bg-blue-500/25 blur-lg group-hover:bg-amber-400/35 transition-all animate-pulse" />

        {/* Insignia 'EN VIVO' / Estado online */}
        <span className="absolute -top-1 -right-1 z-20 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white shadow-xs" />
        </span>

        {/* Contenedor Principal del Robot Flotante */}
        <div className="relative w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-2xl bg-gradient-to-b from-[#1E3A8A] via-[#1D4ED8] to-[#0B1329] border-2 border-blue-300 shadow-2xl flex flex-col items-center justify-center p-1.5 overflow-hidden group-hover:border-amber-400 transition-all duration-300">
          
          {/* Antena del Robot con LED parpadeante */}
          <div className="absolute top-0.5 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-md ring-2 ring-amber-300/60 animate-ping" />
            <div className="w-0.5 h-2 bg-blue-200 shadow-xs" />
          </div>

          {/* Cabeza / Pantalla Visor Digital Oled */}
          <div className="w-12 h-7 mt-1.5 rounded-lg bg-slate-950 border border-sky-400/80 flex items-center justify-around px-1.5 shadow-inner relative overflow-hidden">
            {/* Brillo de pantalla reflectiva diagonal */}
            <div className="absolute -top-3 left-0 right-0 h-6 bg-gradient-to-b from-sky-400/30 to-transparent pointer-events-none transform -skew-y-6" />
            
            {/* Ojos Digitales Expresivos (Animados con parpadeo) */}
            <div 
              className={`w-3 rounded-sm bg-sky-300 shadow-xs flex items-center justify-center transition-all duration-150 group-hover:bg-amber-300 ${
                eyeBlink ? 'h-0.5 bg-sky-200' : 'h-2.5'
              }`}
            >
              {!eyeBlink && <div className="w-1 h-1 bg-white rounded-xs" />}
            </div>
            <div 
              className={`w-3 rounded-sm bg-sky-300 shadow-xs flex items-center justify-center transition-all duration-150 group-hover:bg-amber-300 ${
                eyeBlink ? 'h-0.5 bg-sky-200' : 'h-2.5'
              }`}
            >
              {!eyeBlink && <div className="w-1 h-1 bg-white rounded-xs" />}
            </div>
          </div>

          {/* Pecho del Robot con Emblema Pintuco y Pintura */}
          <div className="w-10 h-5 mt-1 rounded-md bg-gradient-to-r from-blue-700 to-indigo-900 border border-blue-300/50 flex items-center justify-between px-1.5 shadow-inner">
            {/* Gotita de pintura Pintuco dorada */}
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-xs animate-pulse" />
            {/* Sigla Pintuco */}
            <span className="font-mono text-[7.5px] text-white font-black tracking-wider uppercase">
              PTC·IA
            </span>
            {/* Mini barra de estado LED */}
            <span className="w-1.5 h-1.5 rounded-xs bg-emerald-400 shadow-xs" />
          </div>

          {/* Mini brazos laterales del Robot con animación de saludo al hover */}
          <div className="absolute -left-1 bottom-3 w-1.5 h-3.5 rounded-full bg-blue-300 shadow-xs" />
          <div className="absolute -right-1 bottom-3 w-1.5 h-3.5 rounded-full bg-blue-300 shadow-xs transform origin-top group-hover:-rotate-45 transition-transform duration-300" />
        </div>

        {/* Etiqueta flotante inferior 'Asesor IA' */}
        <div className="absolute -bottom-2.5 bg-slate-900/95 text-white text-[9px] sm:text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-blue-400/60 shadow-lg whitespace-nowrap group-hover:bg-blue-700 transition-colors">
          Asesor IA
        </div>
      </button>
    </aside>
  );
};
