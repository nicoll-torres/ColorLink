import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { PaintRequest, UserProfile, OrderChatMessage } from './types';
import { DEMO_USERS, INITIAL_REQUESTS } from './data';

// Inicializar instancia de Firestore apuntando a la base de datos oficial
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db: Firestore = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

const REQUESTS_COLL = 'colorlink_requests';
const USERS_COLL = 'colorlink_users';
const CLIENTS_COLL = 'colorlink_clients';

let isSeeding = false;

/**
 * Sembrar datos iniciales en Firestore si la nube está vacía
 * para que cualquier dispositivo nuevo que ingrese tenga las órdenes y usuarios demo.
 */
export async function seedCloudDatabaseIfEmpty(): Promise<void> {
  if (isSeeding) return;
  isSeeding = true;
  try {
    const reqSnap = await getDocs(collection(db, REQUESTS_COLL));
    if (reqSnap.empty) {
      console.info('[CloudSync] Sembrando solicitudes iniciales en Firestore...');
      for (const req of INITIAL_REQUESTS) {
        await setDoc(doc(db, REQUESTS_COLL, req.id), sanitizeForFirestore(req), { merge: true });
      }
    }

    const userSnap = await getDocs(collection(db, USERS_COLL));
    if (userSnap.empty) {
      console.info('[CloudSync] Sembrando usuarios demo en Firestore...');
      for (const u of DEMO_USERS) {
        await setDoc(doc(db, USERS_COLL, u.email.toLowerCase()), sanitizeForFirestore(u), { merge: true });
      }
    }

    const clientSnap = await getDocs(collection(db, CLIENTS_COLL));
    if (clientSnap.empty) {
      console.info('[CloudSync] Sembrando clientes demo en Firestore...');
      const clientsToSeed = [
        {
          id: 'cli-01',
          name: 'Constructora Bolívar S.A.',
          email: 'cliente@pintuco.com',
          phone: '3201122334',
          company: 'Constructora Bolívar S.A.',
          city: 'Bogotá D.C.',
          identification: '9005678901',
          address: 'Calle 98 #11-20, Bogotá D.C.',
          password: 'cliente123',
          createdAt: new Date().toISOString(),
          syncedToCloud: true,
        },
        {
          id: 'cli-02',
          name: 'Constructora Capital Bogotá',
          email: 'clientebogota@pintuco.com',
          phone: '3158899221',
          company: 'Constructora Capital Bogotá S.A.S.',
          city: 'Bogotá D.C.',
          identification: '9014432105',
          address: 'Av. Calle 26 # 69D-91, Torre 3',
          password: 'cliente123',
          createdAt: new Date().toISOString(),
          syncedToCloud: true,
        },
        {
          id: 'cli-03',
          name: 'Luisa Fernanda Gómez',
          email: 'luisa.gomez@gmail.com',
          phone: '3104567890',
          company: 'Residencia Particular Las Palmas',
          city: 'Medellín',
          identification: '1098765432',
          address: 'Av. Las Palmas Km 5, Medellín',
          password: 'cliente123',
          createdAt: new Date().toISOString(),
          syncedToCloud: true,
        },
      ];
      for (const c of clientsToSeed) {
        await setDoc(doc(db, CLIENTS_COLL, c.email.toLowerCase()), sanitizeForFirestore(c), { merge: true });
      }
    }
  } catch (err) {
    console.warn('[CloudSync] Aviso al inicializar base de datos en nube:', err);
  } finally {
    isSeeding = false;
  }
}

/**
 * Limpia campos undefined y funciones para compatibilidad estricta con Firestore
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined || typeof obj === 'function') return null;
  if (obj === null) return null;
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined && typeof val !== 'function') {
        clean[key] = sanitizeForFirestore(val);
      }
    }
    return clean;
  }
  return obj;
}

/**
 * Función robusta para calcular timestamp numérico para ordenar pedidos,
 * inmune a fechas con espacio ('2026-08-30 08:30') que devuelven NaN en Safari/iOS móvil.
 */
export function parseDateForSort(req: PaintRequest): number {
  if (req.createdAt) {
    const raw = String(req.createdAt).trim();
    const isoLike = raw.includes(' ') && !raw.includes('T') ? raw.replace(' ', 'T') : raw;
    const t = new Date(isoLike).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  // Si id contiene timestamp tipo req-1741234567890
  if (req.id && req.id.startsWith('req-')) {
    const numPart = parseInt(req.id.replace('req-', ''), 10);
    if (!isNaN(numPart) && numPart > 1000000000) return numPart;
  }
  return 0;
}

/**
 * Guarda o actualiza un pedido en Firestore (Nube Google Cloud / Netlify).
 * Esto alerta a todos los celulares, tablets y computadores en <500ms.
 */
export async function cloudSyncRequest(req: PaintRequest): Promise<boolean> {
  if (!req || !req.id) return false;
  try {
    const clean = sanitizeForFirestore(req);
    await setDoc(doc(db, REQUESTS_COLL, req.id), clean, { merge: true });
    console.info(`[CloudSync] ✅ Pedido ${req.requestCode || req.id} guardado con éxito en Firestore nube.`);
    return true;
  } catch (err) {
    console.warn('[CloudSync] Error al guardar pedido en Firestore:', err);
    // Reintento rápido por si hubo reconexión de red móvil
    try {
      await new Promise((r) => setTimeout(r, 400));
      const clean = sanitizeForFirestore(req);
      await setDoc(doc(db, REQUESTS_COLL, req.id), clean, { merge: true });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Actualiza campos específicos de un pedido en la nube (estados, conductor, empaque).
 */
export async function cloudUpdateRequest(
  reqId: string,
  updates: Partial<PaintRequest>
): Promise<boolean> {
  try {
    const clean = sanitizeForFirestore(updates);
    const docRef = doc(db, REQUESTS_COLL, reqId);
    await updateDoc(docRef, clean);
    return true;
  } catch (err) {
    console.warn('[CloudSync] Error al actualizar pedido en Firestore:', err);
    // Si updateDoc falló porque no existía, intentar setDoc con merge
    try {
      await setDoc(doc(db, REQUESTS_COLL, reqId), sanitizeForFirestore(updates), { merge: true });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Envía un mensaje de chat entre cliente y conductor a la nube en tiempo real.
 */
export async function cloudSendChatMessage(
  reqId: string,
  message: OrderChatMessage
): Promise<boolean> {
  try {
    const docRef = doc(db, REQUESTS_COLL, reqId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentMessages = Array.isArray(data.chatMessages) ? data.chatMessages : [];
      const updatedMessages = [...currentMessages, sanitizeForFirestore(message)];
      await updateDoc(docRef, { chatMessages: updatedMessages });
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[CloudSync] Error al enviar chat en Firestore:', err);
    return false;
  }
}

/**
 * Registra un cliente o usuario en Firestore para que pueda iniciar sesión
 * y ser visible en cualquier dispositivo (celular o computador).
 */
export async function cloudSyncUser(userData: UserProfile & { identification?: string; address?: string }): Promise<boolean> {
  try {
    const cleanEmail = userData.email.toLowerCase().trim();
    const cleanUser = sanitizeForFirestore({
      ...userData,
      email: cleanEmail,
    });

    // Guardar en colección de usuarios (para login en cualquier celular/PC)
    await setDoc(doc(db, USERS_COLL, cleanEmail), cleanUser, { merge: true });

    // Guardar en colección de clientes (para que el administrador lo vea en su computador)
    const clientData = sanitizeForFirestore({
      id: userData.id || `cli-${Date.now()}`,
      name: userData.name,
      email: cleanEmail,
      phone: userData.phone || '',
      company: userData.company || 'Constructora / Cliente',
      city: userData.city || 'Medellín',
      identification: userData.identification || '',
      address: userData.address || '',
      password: userData.password,
      syncedToCloud: true,
      createdAt: new Date().toISOString(),
    });
    await setDoc(doc(db, CLIENTS_COLL, cleanEmail), clientData, { merge: true });

    return true;
  } catch (err) {
    console.warn('[CloudSync] Error al sincronizar usuario en Firestore:', err);
    return false;
  }
}

/**
 * Actualiza la contraseña de un usuario en Firestore cuando recupera su clave.
 */
export async function cloudResetPassword(email: string, newPasswordCode: string): Promise<boolean> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    await setDoc(doc(db, USERS_COLL, cleanEmail), { password: newPasswordCode }, { merge: true });
    await setDoc(doc(db, CLIENTS_COLL, cleanEmail), { password: newPasswordCode }, { merge: true });
    return true;
  } catch (err) {
    console.warn('[CloudSync] Error al restablecer contraseña en Firestore:', err);
    return false;
  }
}

/**
 * Obtiene todos los usuarios y clientes registrados en la nube de Firestore.
 */
export async function cloudFetchUsers(): Promise<UserProfile[]> {
  try {
    const usersMap = new Map<string, UserProfile>();

    // 1. Obtener de colección users
    try {
      const userSnap = await getDocs(collection(db, USERS_COLL));
      userSnap.forEach((d) => {
        const u = d.data() as UserProfile;
        if (u && u.email) {
          usersMap.set(u.email.toLowerCase(), u);
        }
      });
    } catch (e) {
      console.warn('[CloudSync] Error leyendo colección users:', e);
    }

    // 2. Obtener de colección clients
    try {
      const clientSnap = await getDocs(collection(db, CLIENTS_COLL));
      clientSnap.forEach((d) => {
        const c = d.data();
        if (c && c.email) {
          const email = c.email.toLowerCase();
          const existing = usersMap.get(email);
          usersMap.set(email, {
            id: c.id || existing?.id || `usr-${Date.now()}`,
            name: c.name || existing?.name || 'Cliente ColorLink',
            email: email,
            password: c.password || existing?.password || 'cliente123',
            phone: c.phone || existing?.phone || '',
            company: c.company || existing?.company || 'Constructora / Cliente',
            role: 'cliente',
            city: c.city || existing?.city || 'Medellín',
            address: c.address || (existing as any)?.address || '',
            identification: c.identification || (existing as any)?.identification || '',
          } as any);
        }
      });
    } catch (e) {
      console.warn('[CloudSync] Error leyendo colección clients:', e);
    }

    return Array.from(usersMap.values());
  } catch (err) {
    console.warn('[CloudSync] Error al consultar usuarios en Firestore:', err);
    return [];
  }
}

/**
 * Suscribe a todos los cambios en tiempo real de la colección de pedidos (requests).
 * Cuando cualquier celular crea un pedido, el computador del administrador,
 * el empacador y el conductor lo reciben instantáneamente a través de WebSockets de Google Cloud.
 */
export function cloudSubscribeRequests(
  callback: (requests: PaintRequest[]) => void
): () => void {
  // Asegurar que haya datos iniciales
  seedCloudDatabaseIfEmpty().catch(console.warn);

  const unsub = onSnapshot(
    collection(db, REQUESTS_COLL),
    (snapshot) => {
      const items: PaintRequest[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as PaintRequest);
      });

      if (items.length > 0) {
        // Ordenar por fecha o ID descendente usando parseDateForSort para compatibilidad universal con Safari e iOS
        items.sort((a, b) => parseDateForSort(b) - parseDateForSort(a));
        callback(items);
      }
    },
    (err) => {
      console.warn('[CloudSync] Error en escucha en tiempo real de pedidos:', err);
    }
  );

  return unsub;
}

/**
 * Suscribe a todos los cambios en tiempo real de la colección de clientes (clients).
 * Cuando un cliente nuevo se registra en su celular, el administrador lo ve de inmediato en su pantalla.
 */
export function cloudSubscribeClients(
  callback: (clients: any[]) => void
): () => void {
  const unsub = onSnapshot(
    collection(db, CLIENTS_COLL),
    (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((d) => {
        const c = d.data();
        if (c && (c.email || c.name || c.id)) {
          items.push(c);
        }
      });
      if (items.length > 0) {
        callback(items);
      }
    },
    (err) => {
      console.warn('[CloudSync] Error en escucha en tiempo real de clientes:', err);
    }
  );

  return unsub;
}

/**
 * Suscribe a todos los cambios en tiempo real de la colección de usuarios (users).
 * Garantiza que cuando un cliente nuevo se registra en un celular,
 * todos los computadores y dispositivos reciban su cuenta para login inmediato.
 */
export function cloudSubscribeUsers(
  callback: (users: UserProfile[]) => void
): () => void {
  const unsub = onSnapshot(
    collection(db, USERS_COLL),
    (snapshot) => {
      const items: UserProfile[] = [];
      snapshot.forEach((d) => {
        const u = d.data() as UserProfile;
        if (u && (u.email || u.id)) {
          items.push(u);
        }
      });
      if (items.length > 0) {
        callback(items);
      }
    },
    (err) => {
      console.warn('[CloudSync] Error en escucha en tiempo real de usuarios:', err);
    }
  );

  return unsub;
}

