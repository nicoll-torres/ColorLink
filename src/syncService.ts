import { PaintRequest, UserProfile, OrderChatMessage } from './types';

export interface SharedSyncState {
  requests: PaintRequest[];
  users: UserProfile[];
  clients: any[];
  version: number;
  lastUpdated: string;
}

let lastKnownVersion = 0;

/**
 * Obtiene el estado consolidado de la nube (pedidos, clientes y usuarios)
 * disponible para todos los dispositivos conectados.
 */
export async function fetchServerState(): Promise<SharedSyncState | null> {
  try {
    const res = await fetch('/api/sync/state', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.requests)) {
      lastKnownVersion = data.version || 0;
      return data;
    }
    return null;
  } catch (err) {
    console.warn('[SyncService] Error al consultar estado compartido:', err);
    return null;
  }
}

/**
 * Registra o actualiza una orden de pedido en el servidor central
 * para que aparezca instantáneamente en todos los celulares, tablets y computadores.
 */
export async function syncRequestToServer(request: PaintRequest): Promise<boolean> {
  try {
    const res = await fetch('/api/sync/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.version) {
      lastKnownVersion = data.version;
    }
    return true;
  } catch (err) {
    console.warn('[SyncService] Error al sincronizar pedido con servidor central:', err);
    return false;
  }
}

/**
 * Actualiza campos específicos de un pedido (estados de entrega, empaque, conductor o chat)
 */
export async function updateRequestOnServer(
  requestId: string,
  updates: Partial<PaintRequest>
): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/requests/${encodeURIComponent(requestId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.version) {
      lastKnownVersion = data.version;
    }
    return true;
  } catch (err) {
    console.warn('[SyncService] Error al actualizar pedido en servidor central:', err);
    return false;
  }
}

/**
 * Envía un mensaje de chat entre cliente y conductor a través de la nube
 * para que ambos lo reciban en sus pantallas en vivo.
 */
export async function sendChatMessageToServer(
  requestId: string,
  message: OrderChatMessage
): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/requests/${encodeURIComponent(requestId)}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.version) {
      lastKnownVersion = data.version;
    }
    return true;
  } catch (err) {
    console.warn('[SyncService] Error al enviar chat al servidor:', err);
    return false;
  }
}

/**
 * Da de alta o actualiza un cliente / usuario en la base de datos central
 * de modo que pueda iniciar sesión desde cualquier dispositivo.
 */
export async function syncUserToServer(userData: any): Promise<boolean> {
  try {
    const res = await fetch('/api/sync/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userData }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.version) {
      lastKnownVersion = data.version;
    }
    return true;
  } catch (err) {
    console.warn('[SyncService] Error al registrar usuario en servidor central:', err);
    return false;
  }
}

/**
 * Consulta la lista de todos los usuarios y clientes dados de alta en cualquier dispositivo.
 */
export async function fetchServerUsers(): Promise<UserProfile[]> {
  try {
    const res = await fetch('/api/sync/users', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.users) ? data.users : [];
  } catch (err) {
    console.warn('[SyncService] Error al consultar usuarios del servidor:', err);
    return [];
  }
}

/**
 * Sincroniza la nueva contraseña generada en la recuperación
 * para que sea válida en cualquier dispositivo.
 */
export async function syncPasswordResetToServer(email: string, newPassword: string): Promise<boolean> {
  try {
    const res = await fetch('/api/sync/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[SyncService] Error al sincronizar restablecimiento de clave:', err);
    return false;
  }
}

/**
 * Inicia el monitoreo automático en tiempo real para mantener
 * sincronizados todos los pedidos y clientes entre dispositivos.
 */
export function startAutoSync(
  onUpdate: (state: SharedSyncState) => void,
  intervalMs = 2500
): () => void {
  let isMounted = true;
  let isChecking = false;

  const checkUpdates = async () => {
    if (isChecking || !isMounted) return;
    isChecking = true;
    try {
      const state = await fetchServerState();
      if (state && isMounted) {
        onUpdate(state);
      }
    } catch {
      // Ignorar fallas transitorias de red
    } finally {
      isChecking = false;
    }
  };

  // Primera consulta inmediata
  checkUpdates();

  const timer = setInterval(checkUpdates, intervalMs);

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      checkUpdates();
    }
  };

  const handleFocus = () => {
    checkUpdates();
  };

  window.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('focus', handleFocus);

  return () => {
    isMounted = false;
    clearInterval(timer);
    window.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('focus', handleFocus);
  };
}
