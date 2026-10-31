import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Inicializar la app de Firebase una sola vez
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Scope oficial para envío de correos con Gmail:
provider.addScope('https://www.googleapis.com/auth/gmail.send');
// Opcional: asegurar que solicite la cuenta correcta
provider.setCustomParameters({
  prompt: 'select_account',
});

// Guardado del token de acceso en memoria (NUNCA en localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Observador de estado de autenticación
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // El usuario está logueado en Firebase pero el access token en memoria expiró o no está cargado
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Iniciar sesión con Google para obtener credencial y token con permisos de Gmail
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se recibió el token de acceso de Google con permisos de Gmail.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Obtener el token de acceso en memoria
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Asegurar token de acceso: si no está en memoria, invocar googleSignIn
export const ensureGoogleAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const res = await googleSignIn();
    return res?.accessToken || null;
  } catch (err) {
    console.warn('Autorización de Google no completada:', err);
    return null;
  }
};

// Verificar sincrónicamente si hay token de Google activo
export const isGoogleConnected = (): boolean => {
  return Boolean(cachedAccessToken && auth.currentUser);
};

// Establecer manualmente el token en memoria si se renovó
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

// Cerrar sesión
export const googleLogout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Error al cerrar sesión de Google:', err);
  } finally {
    cachedAccessToken = null;
  }
};
