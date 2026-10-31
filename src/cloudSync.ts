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
  } catch (err) {
    console.warn('[CloudSync] Aviso al inicializar base de datos en nube:', err);
  } finally {
    isSeeding = false;
  }
}

/**
 * Limpia campos undefined para compatibilidad estricta con Firestore
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        clean[key] = sanitizeForFirestore(val);
      }
    }
    return clean;
  }
  return obj;
}

/**
 * Guarda o actualiza un pedido en Firestore (Nube Google Cloud / Netlify).
 * Esto alerta a todos los celulares, tablets y computadores en <500ms.
 */
export async function cloudSyncRequest(req: PaintRequest): Promise<boolean> {
  try {
    const clean = sanitizeForFirestore(req);
    await setDoc(doc(db, REQUESTS_COLL, req.id), clean, { merge: true });
    return true;
  } catch (err) {
    console.warn('[CloudSync] Error al guardar pedido en Firestore:', err);
    return false;
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
    const snap = await getDocs(collection(db, USERS_COLL));
    const list: UserProfile[] = [];
    snap.forEach((d) => {
      list.push(d.data() as UserProfile);
    });
    return list;
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
        // Ordenar por fecha o ID descendente
        items.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
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
        items.push(d.data());
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
