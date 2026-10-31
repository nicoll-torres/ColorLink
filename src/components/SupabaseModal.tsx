import React, { useState } from 'react';
import {
  SupabaseConfig,
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  syncAllRequestsToSupabase,
  DEFAULT_SUPABASE_KEY,
  DEFAULT_SUPABASE_URL,
  SUPABASE_SQL_SCHEMA,
  SUPABASE_RLS_FIX_SQL,
  normalizeSupabaseUrl,
} from '../supabase';
import { PaintRequest } from '../types';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Check,
  Server,
  Layers,
  X,
  Sparkles,
  ShieldAlert,
} from '../icons';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: PaintRequest[];
  onSyncComplete?: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  requests,
  onSyncComplete,
}) => {
  const [config, setConfig] = useState<SupabaseConfig>(getSupabaseConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    isRlsError?: boolean;
    rlsFixSql?: string;
    tablesFound?: string[];
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedRlsFix, setCopiedRlsFix] = useState(false);
  const [activeView, setActiveView] = useState<'conexion' | 'sql' | 'rls'>('conexion');

  if (!isOpen) return null;

  // Extraer el project id para enlace directo al SQL Editor
  const getProjectRef = (url: string) => {
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      return u.hostname.split('.')[0] || 'pxtskluzbcxydzqaigke';
    } catch {
      return 'pxtskluzbcxydzqaigke';
    }
  };

  const projectRef = getProjectRef(config.url || DEFAULT_SUPABASE_URL);
  const directSqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  const handleTestAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const normalizedUrl = normalizeSupabaseUrl(config.url || DEFAULT_SUPABASE_URL);
    const updatedConfig: SupabaseConfig = {
      ...config,
      url: normalizedUrl,
      anonKey: config.anonKey.trim() || DEFAULT_SUPABASE_KEY,
    };

    const result = await testSupabaseConnection(updatedConfig);
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      const saved = { ...updatedConfig, connected: true, lastSync: new Date().toLocaleTimeString() };
      saveSupabaseConfig(saved);
      setConfig(saved);
      if (onSyncComplete) onSyncComplete();
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await syncAllRequestsToSupabase(requests);
      setSyncStatus(res.message);
      setConfig(getSupabaseConfig());
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setSyncStatus(`Error al sincronizar: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCopyRlsFixSql = () => {
    navigator.clipboard.writeText(SUPABASE_RLS_FIX_SQL);
    setCopiedRlsFix(true);
    setTimeout(() => setCopiedRlsFix(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
      id="supabase-modal-backdrop"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        id="supabase-modal-card"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-blue-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-sky-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  Conexión a Supabase Cloud (PostgreSQL)
                </h3>
                {config.connected ? (
                  <span className="text-[10px] font-semibold bg-blue-500/20 text-sky-300 border border-blue-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    Conectado
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Configuración activa
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-200/80 font-mono">
                Ecosistema Transversal ColorLink · 12 Tablas Relacionales
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 pt-3 bg-slate-50 border-b border-slate-200 flex gap-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveView('conexion')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeView === 'conexion'
                ? 'border-teal-700 text-teal-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Configuración y Conexión</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('rls')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeView === 'rls'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-amber-700 hover:text-amber-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Desbloquear Guardado (RLS Fix)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('sql')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeView === 'sql'
                ? 'border-teal-700 text-teal-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Script SQL Completo (12 Tablas)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeView === 'conexion' ? (
            <>
              {/* Status Box */}
              {config.connected ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="flex-1 text-xs">
                    <p className="font-bold">Base de datos Supabase conectada con tu URL</p>
                    <p className="text-emerald-700 text-[11px] mt-0.5">
                      URL: <span className="font-mono font-semibold">{config.url}</span>
                    </p>
                    {config.lastSync && (
                      <p className="text-emerald-600 text-[10px] mt-0.5">
                        Última sincronización: {config.lastSync}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1 text-xs">
                    <p className="font-bold">Tu API Key ya está cargada en el sistema</p>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      URL: <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">{config.url || DEFAULT_SUPABASE_URL}</code>
                    </p>
                  </div>
                </div>
              )}

              {/* RLS Alert Banner if test failed due to RLS */}
              {testResult?.isRlsError && (
                <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs text-amber-900">
                        ⚠️ Row Level Security (RLS Error 42501) está bloqueando el guardado
                      </p>
                      <p className="text-[11px] text-amber-800 mt-1">
                        Tu proyecto responde perfectamente, pero las políticas de Supabase impiden que la API Key pública inserte registros. Se soluciona ejecutando un script de 3 líneas en tu SQL Editor.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleCopyRlsFixSql}
                        className="btn-primary !py-1.5 !px-3 !text-[11px] flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700"
                      >
                        {copiedRlsFix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedRlsFix ? '¡Script Copiado!' : 'Copiar Script de Desbloqueo RLS'}</span>
                      </button>
                      <a
                        href={directSqlEditorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary !py-1.5 !px-3 !text-[11px] flex items-center gap-1 text-teal-800"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir SQL Editor de Supabase</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleTestAndSave} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Supabase Project URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://tu-proyecto.supabase.co"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Proyecto actual: <span className="font-mono font-semibold text-slate-700">https://pxtskluzbcxydzqaigke.supabase.co</span>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Supabase Publishable / Anon Key
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> API Key provista cargada
                    </span>
                  </div>
                  <input
                    type="text"
                    value={config.anonKey}
                    onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  />
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, anonKey: DEFAULT_SUPABASE_KEY })}
                    className="text-[10px] text-teal-700 hover:underline mt-1 font-mono"
                  >
                    Restablecer a tu API Key: {DEFAULT_SUPABASE_KEY.slice(0, 20)}...
                  </button>
                </div>

                {/* Feedback result */}
                {testResult && !testResult.isRlsError && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-red-50 border-red-300 text-red-900'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold">{testResult.message}</p>
                      {testResult.tablesFound && (
                        <p className="text-[11px] mt-0.5 text-emerald-700">
                          Tablas operativas: {testResult.tablesFound.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {syncStatus && (
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{syncStatus}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleSyncAll}
                    disabled={!config.connected || isSyncing}
                    className={`btn-secondary !py-2 !px-3.5 !text-xs flex items-center justify-center gap-1.5 ${
                      !config.connected ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Enviar todas las órdenes y cotizaciones a las 12 tablas de Supabase"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-teal-700 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Sincronizando...' : `Sincronizar Pedidos (${requests.length})`}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isTesting || !config.url}
                    className="btn-primary !py-2 !px-4 !text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Probando Conexión y Permisos...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Probar y Conectar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : activeView === 'rls' ? (
            /* Tab: Desbloquear RLS */
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-slate-800 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-700" />
                      Solución: Desbloqueo de Guardado en Supabase (Error 42501)
                    </h4>
                    <p className="text-[11px] text-amber-800 mt-1">
                      Si al intentar guardar órdenes o clientes recibes error de permisos o no se guardan en la nube, es porque PostgreSQL tiene Row Level Security activo. Este script habilita la escritura pública con tu clave anónima.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyRlsFixSql}
                      className="btn-primary !py-1.5 !px-3 !text-xs flex items-center gap-1 bg-amber-600 hover:bg-amber-700 shadow-xs"
                    >
                      {copiedRlsFix ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Script</span>
                        </>
                      )}
                    </button>
                    <a
                      href={directSqlEditorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary !py-1.5 !px-2.5 !text-[11px] flex items-center justify-center gap-1 text-teal-800"
                    >
                      <span>Abrir SQL Editor</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-amber-200 text-[11px] text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Pasos en Supabase (tarda 10 segundos):</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Haz clic en <strong>Copiar Script</strong> arriba.</li>
                    <li>Abre el <strong>SQL Editor</strong> de Supabase con el enlace.</li>
                    <li>Pega el código y presiona el botón verde <strong>Run (▶)</strong>.</li>
                  </ol>
                </div>
              </div>

              <div className="relative">
                <pre className="p-3.5 bg-slate-900 text-amber-300 rounded-xl font-mono text-[11px] overflow-x-auto max-h-[320px] border border-slate-800 leading-relaxed select-all">
                  {SUPABASE_RLS_FIX_SQL}
                </pre>
              </div>
            </div>
          ) : (
            /* SQL Script Tab */
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 mb-0.5">
                    Esquema SQL de 12 Tablas Relacionales (ERD UCC)
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Copia y ejecuta este script en el <strong>SQL Editor</strong> de tu proyecto Supabase para crear las tablas con claves foráneas y datos iniciales de Pintuco.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="btn-primary !py-1.5 !px-3 !text-xs flex items-center gap-1 shadow-xs"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar SQL</span>
                      </>
                    )}
                  </button>
                  <a
                    href={directSqlEditorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary !py-1.5 !px-2.5 !text-[11px] flex items-center justify-center gap-1"
                  >
                    <span>Ir al SQL Editor</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="relative">
                <pre className="p-3.5 bg-slate-900 text-teal-300 rounded-xl font-mono text-[11px] overflow-x-auto max-h-[380px] border border-slate-800 leading-relaxed select-all">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-mono">
            {config.connected ? '🟢 Base de datos conectada' : '🟠 Conexión configurada'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
