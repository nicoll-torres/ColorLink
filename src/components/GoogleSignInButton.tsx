import React, { useState } from 'react';
import { googleSignIn, googleLogout } from '../googleAuth';
import { CheckCircle2, LogOut } from '../icons';

export interface GoogleSignInButtonProps {
  currentGoogleUser?: {
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
  } | null;
  onAuthSuccess?: (googleUser: any, token: string) => void;
  onLogout?: () => void;
  compact?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  currentGoogleUser,
  onAuthSuccess,
  onLogout,
  compact = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res && onAuthSuccess) {
        onAuthSuccess(res.user, res.accessToken);
      }
    } catch (err: any) {
      console.error('Error Google Sign In:', err);
      setError(err?.message || 'Error al conectar con Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await googleLogout();
      if (onLogout) onLogout();
    } catch (err) {
      console.error('Error Google Sign Out:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (currentGoogleUser?.email) {
    return (
      <div className="flex items-center gap-2 bg-emerald-50/90 border border-emerald-300 rounded-xl px-2.5 py-1.5 shadow-sm text-xs">
        {currentGoogleUser.photoURL ? (
          <img
            src={currentGoogleUser.photoURL}
            alt="Google Avatar"
            className="w-5 h-5 rounded-full object-cover border border-emerald-400"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
            G
          </div>
        )}
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Gmail Conectado
          </span>
          <span className="text-[11px] font-mono text-slate-800 truncate max-w-[130px]" title={currentGoogleUser.email}>
            {currentGoogleUser.email}
          </span>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isLoading}
          title="Desconectar cuenta de Google"
          className="ml-1 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isLoading}
        className={`relative inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-medium border border-slate-300 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm w-full'
        }`}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-slate-400 border-t-teal-600 rounded-full animate-spin" />
        ) : (
          <svg
            className="w-4 h-4 shrink-0"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
        )}
        <span className="font-semibold text-slate-700">
          {compact ? 'Conectar Gmail' : 'Conectar con Google / Gmail'}
        </span>
      </button>
      {error && <span className="text-[10px] text-red-600 mt-1">{error}</span>}
    </div>
  );
};
