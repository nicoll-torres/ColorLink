import { EmailNotification, PaintRequest, UserProfile } from './types';
import { getAccessToken } from './googleAuth';
import { sendEmailViaGmailApi } from './gmailApiService';

const STORAGE_KEY = 'colorlink_sent_emails';

// Obtener todos los correos enviados desde el almacenamiento
export function getAllEmails(): EmailNotification[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error al cargar correos enviados:', err);
  }
  return [];
}

// Obtener correos dirigidos a un usuario o email específico (Exclusivo por usuario)
export function getEmailsForUser(userEmail?: string): EmailNotification[] {
  if (!userEmail || !userEmail.trim()) {
    // Si no hay email o el cliente no está registrado/autenticado, no devolver correos de otros
    return [];
  }
  const all = getAllEmails();
  const target = userEmail.toLowerCase().trim();
  return all.filter((e) => e.toEmail && e.toEmail.toLowerCase().trim() === target);
}

// Guardar lista de correos
function persistEmails(emails: EmailNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
  } catch (err) {
    console.error('Error al guardar correos:', err);
  }
}

// Formatear fecha y hora actual para Colombia
function getFormattedTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
}

// Reproducir un sonido agradable tipo "ding" de nuevo correo usando Web Audio API
export function playEmailNotificationSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Primer tono (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    // Segundo tono armónico más agudo (A5 - 880.00 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.42);
  } catch {
    // Si el usuario aún no ha interactuado con la página, ignorar silenciosamente
  }
}

// Disparar notificación nativa del sistema operativo si hay permiso
export function triggerDesktopNotification(email: EmailNotification): void {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`📧 ${email.subject}`, {
        body: `${email.toName}: ${email.previewText}`,
        icon: '/favicon.ico',
      });
    }
  } catch {}
}

// Solicitar permiso de notificaciones de escritorio
export async function requestDesktopNotificationPermission(): Promise<boolean> {
  try {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
    }
  } catch {}
  return false;
}

// Enviar y registrar un correo con soporte para backend de servidor, Gmail API y webmail
export async function sendEmail(
  payload: Omit<EmailNotification, 'id' | 'sentAt' | 'read'>
): Promise<EmailNotification> {
  const newEmail: EmailNotification = {
    ...payload,
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sentAt: getFormattedTimestamp(),
    read: false,
    dispatchedViaGmailApi: false,
  };

  // Reproducir sonido de llegada de correo
  playEmailNotificationSound();

  // Disparar notificación de escritorio si está habilitada
  triggerDesktopNotification(newEmail);

  // 1. Despacho a través de la API oficial de Gmail si hay token activo de Google
  let token: string | null = null;
  try {
    token = await getAccessToken();
    if (token) {
      console.info(`[ColorLink Mailer] 🚀 Token de Google detectado. Despachando correo real por Gmail API a ${newEmail.toEmail}...`);
      const result = await sendEmailViaGmailApi({
        accessToken: token,
        to: newEmail.toEmail,
        subject: newEmail.subject,
        htmlContent: newEmail.htmlContent,
      });

      if (result.success) {
        newEmail.dispatchedViaGmailApi = true;
        newEmail.gmailMessageId = result.messageId;
        console.info(`[ColorLink Mailer] ✅ ¡Correo entregado con éxito por Gmail API a ${newEmail.toEmail}! MessageId: ${result.messageId}`);
        window.dispatchEvent(
          new CustomEvent('colorlink-gmail-sent-success', {
            detail: {
              targetEmail: newEmail.toEmail,
              messageId: result.messageId,
            },
          })
        );
      } else {
        console.warn(`[ColorLink Mailer] ⚠️ Intento de Gmail API no completado:`, result.error);
      }
    }
  } catch (err) {
    console.warn('[ColorLink Mailer] Error de comunicación con Gmail API:', err);
  }

  // 2. Despacho a través del backend propio Express (/api/send-email)
  try {
    const cleanTo = (newEmail.toEmail || '').trim().toLowerCase();
    if (cleanTo && cleanTo.includes('@')) {
      console.info(`[ColorLink Mailer] 📡 Despachando notificación a ${cleanTo} mediante /api/send-email...`);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const backendPromise = fetch('/api/send-email', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          toEmail: cleanTo,
          toName: newEmail.toName,
          subject: newEmail.subject,
          previewText: newEmail.previewText,
          category: newEmail.category,
          requestCode: newEmail.requestCode,
          htmlContent: newEmail.htmlContent,
        }),
      }).then(async (res) => {
        const data = await res.json().catch(() => null);
        if (data && data.success) {
          newEmail.dispatchedViaNetwork = true;
          if (data.dispatchedViaGmailApi) {
            newEmail.dispatchedViaGmailApi = true;
            newEmail.gmailMessageId = data.messageId;
          }
          newEmail.networkDeliveryStatus = 'Despachado exitosamente al buzón del cliente';
          console.info('[ColorLink Mailer] 📬 Despacho confirmado por servidor:', data);
        }
      }).catch((err) => {
        console.warn('[ColorLink Mailer] Advertencia de despacho por backend:', err);
      });

      // Timeout preventivo de 1.5s para no bloquear la experiencia de usuario
      await Promise.race([
        backendPromise,
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    }
  } catch (backendErr) {
    console.warn('[ColorLink Mailer] Error despachando por backend:', backendErr);
  }

  // Guardar en almacenamiento persistente
  const existing = getAllEmails();
  const updated = [newEmail, ...existing];
  persistEmails(updated);

  // Emitir evento global en la ventana para que la interfaz reaccione instantáneamente
  try {
    window.dispatchEvent(
      new CustomEvent('colorlink-email-sent', {
        detail: newEmail,
      })
    );
  } catch (err) {
    console.warn('No se pudo despachar evento custom:', err);
  }

  // Notificación de consola
  console.info(`[ColorLink Mailer] 📧 Correo procesado para ${newEmail.toEmail} con asunto: "${newEmail.subject}"`);

  return newEmail;
}

// Marcar correo como leído
export function markEmailAsRead(id: string): void {
  const existing = getAllEmails();
  const updated = existing.map((e) => (e.id === id ? { ...e, read: true } : e));
  persistEmails(updated);
  window.dispatchEvent(new CustomEvent('colorlink-email-read', { detail: { id } }));
}

// Eliminar un correo
export function deleteEmail(id: string): void {
  const existing = getAllEmails();
  const updated = existing.filter((e) => e.id !== id);
  persistEmails(updated);
  window.dispatchEvent(new CustomEvent('colorlink-email-deleted', { detail: { id } }));
}

// Generar texto plano limpio y estructurado del correo oficial
export function buildEmailPlainText(email: EmailNotification): string {
  return `${email.previewText || email.subject}\n\n` +
    '==================================================\n' +
    'COLORLINK · PLATAFORMA OFICIAL DE PINTURA INTELIGENTE\n' +
    '==================================================\n' +
    `Para: ${email.toName} (${email.toEmail})\n` +
    `Fecha: ${email.sentAt}\n` +
    (email.requestCode ? `Código de Pedido: ${email.requestCode}\n` : '') +
    '--------------------------------------------------\n\n' +
    'Resumen de tu gestión en ColorLink:\n' +
    `${email.previewText || ''}\n\n` +
    'Puedes ingresar en cualquier momento a tu portal web oficial para consultar stock en bodegas CEDI, cubicaje técnico, trazabilidad satelital en vivo y facturas:\n' +
    window.location.origin + '\n\n' +
    'Atentamente,\n' +
    'Equipo Oficial ColorLink';
}

// Generar URL directa de composición en Gmail Web con destinatario prellenado
export function buildGmailComposeUrl(toEmail: string, subject: string, bodyText: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
}

// Generar URL directa de composición en Outlook Web
export function buildOutlookComposeUrl(toEmail: string, subject: string, bodyText: string): string {
  return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(toEmail)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
}

// Generar enlace mailto
export function buildMailtoUrl(toEmail: string, subject: string, bodyText: string): string {
  return `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
}

// Abrir directamente en Gmail Web con destinatario, asunto y cuerpo prellenados
export function openInGmail(email: EmailNotification): void {
  const textBody = buildEmailPlainText(email);
  const gmailUrl = buildGmailComposeUrl(email.toEmail, email.subject, textBody);
  window.open(gmailUrl, '_blank');
}

// Abrir en Outlook Web
export function openInOutlook(email: EmailNotification): void {
  const textBody = buildEmailPlainText(email);
  const outlookUrl = buildOutlookComposeUrl(email.toEmail, email.subject, textBody);
  window.open(outlookUrl, '_blank');
}

// Abrir el correo en cliente de correo externo (Gmail, Outlook, Mail app) mediante mailto:
export function openInEmailClient(email: EmailNotification): void {
  // Si el correo es de Gmail, preferir abrir Gmail Web para mayor conveniencia del cliente
  if (email.toEmail.toLowerCase().includes('@gmail.com')) {
    openInGmail(email);
    return;
  }
  const textBody = buildEmailPlainText(email);
  const mailtoUrl = buildMailtoUrl(email.toEmail, email.subject, textBody);
  window.open(mailtoUrl, '_blank');
}

// =========================================================================
// PLANTILLAS DE CORREO OFICIALES COLORLINK · ARMONÍA BLANCOS Y AZULES
// =========================================================================

/**
 * 1. Correo de Bienvenida al registrarse como Cliente
 */
export async function sendWelcomeEmail(
  user: UserProfile,
  options?: { identification?: string; address?: string }
): Promise<EmailNotification> {
  const subject = '🎉 ¡Felicitaciones! Has sido registrado a la plataforma oficial ColorLink';
  const previewText = `¡Bienvenido a ColorLink, ${user.name}! Tu registro como nuevo cliente ha sido completado con éxito.`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #bfdbfe; border-radius: 16px; overflow: hidden; color: #0f172a; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);">
      <!-- Cabecera Institucional ColorLink - Armonía Blancos y Azules -->
      <div style="background: linear-gradient(135deg, #0a192f 0%, #1e3a8a 60%, #1d4ed8 100%); padding: 34px 28px; text-align: center; border-bottom: 4px solid #38bdf8;">
        <div style="display: inline-block; background-color: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); padding: 6px 16px; border-radius: 9999px; margin-bottom: 14px;">
          <span style="color: #bae6fd; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">
            COLORLINK · ECOSISTEMA DIGITAL OFICIAL
          </span>
        </div>
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.02em;">
          ¡Bienvenido a la Red Oficial ColorLink!
        </h1>
        <p style="color: #bfdbfe; font-size: 13px; margin: 0; line-height: 1.5;">
          Plataforma tecnológica integral para la formulación, cubicaje técnico y trazabilidad de recubrimientos y pinturas.
        </p>
      </div>

      <!-- Cuerpo del Correo -->
      <div style="padding: 30px 28px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%); border: 1px solid #93c5fd; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
          <h2 style="color: #1e3a8a; font-size: 17px; font-weight: 800; margin: 0 0 8px;">
            ¡Felicitaciones ${user.name}! Tu registro ha sido exitoso
          </h2>
          <p style="color: #1e40af; font-size: 13.5px; line-height: 1.6; margin: 0;">
            Has sido dado de alta formalmente en la plataforma web de <strong>ColorLink</strong>. A partir de este momento tienes acceso completo para cotizar pinturas, calcular cuñetes y galones por metro cuadrado (m²), consultar stock en bodegas CEDI y rastrear tus pedidos en vivo hasta pie de obra.
          </p>
        </div>

        <!-- Ficha de Credenciales y Datos Registrados -->
        <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 12px; display: flex; align-items: center; gap: 6px;">
          Resumen de tu Cuenta de Cliente ColorLink
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 11px 0; color: #64748b; width: 40%;">Nombre / Titular:</td>
            <td style="padding: 11px 0; font-weight: 700; color: #0f172a;">${user.name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 11px 0; color: #64748b;">Correo Registrado:</td>
            <td style="padding: 11px 0; font-weight: 700; color: #2563eb;">${user.email}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 11px 0; color: #64748b;">Teléfono de Contacto:</td>
            <td style="padding: 11px 0; font-weight: 600; color: #0f172a;">${user.phone || 'No especificado'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 11px 0; color: #64748b;">Sede / Ciudad:</td>
            <td style="padding: 11px 0; font-weight: 600; color: #0f172a;">${user.city}</td>
          </tr>
          ${options?.identification ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 11px 0; color: #64748b;">Identificación / NIT:</td>
            <td style="padding: 11px 0; font-weight: 600; color: #0f172a;">${options.identification}</td>
          </tr>` : ''}
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 11px 0; color: #64748b;">Rol Habilitado:</td>
            <td style="padding: 11px 0;">
              <span style="background-color: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px;">
                CLIENTE REGISTRADO (PORTAL ACTIVO)
              </span>
            </td>
          </tr>
        </table>

        <!-- Módulos Disponibles -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <h4 style="color: #0f172a; font-size: 13px; font-weight: 700; margin: 0 0 10px;">
            Beneficios Exclusivos en tu Portal ColorLink:
          </h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 12.5px; color: #475569; line-height: 1.7;">
            <li><strong>Catálogo Oficial & Existencias en CEDIs:</strong> Revisa el inventario disponible de pinturas vinílicas, acrílicas, esmaltes y epóxicos en tiempo real.</li>
            <li><strong>Cubicaje Técnico Automático:</strong> Calcula cuñetes (5 gal) y galones según m² con precios oficiales en pesos colombianos (COP).</li>
            <li><strong>Trazabilidad en Vivo de Órdenes:</strong> Recibe notificaciones automáticas cuando tu pedido esté empacado, en camino con el conductor y entregado.</li>
            <li><strong>Garantía de 5 Años y Factura DIAN:</strong> Descarga certificados oficiales de calidad y facturación electrónica legal directamente en PDF.</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 28px 0 16px;">
          <a href="${window.location.origin}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 13px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
            Ir al Portal de Cliente ColorLink →
          </a>
        </div>
      </div>

      <!-- Pie Institucional -->
      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.5;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #334155;">
          Este es un correo oficial generado automáticamente por el sistema <strong>ColorLink S.A.</strong>
        </p>
        <p style="margin: 0; color: #94a3b8;">
          ColorLink S.A. · Red de Logística y Pintura Inteligente · Colombia · contacto@colorlink.com
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    toEmail: user.email,
    toName: user.name,
    subject,
    previewText,
    htmlContent,
    category: 'bienvenida',
    metadata: {
      city: user.city,
    },
  });
}

/**
 * 2. Correo al registrar una nueva orden de pedido
 */
export async function sendOrderCreatedEmail(
  request: PaintRequest
): Promise<EmailNotification> {
  const isPaint = request.orderItemType !== 'material';
  const prodName = request.catalogProductName || request.technicalCalculation?.recommendedProduct?.name || 'Recubrimiento ColorLink';
  const subject = `📋 Tu orden [${request.requestCode}] ha sido REGISTRADA en ColorLink`;
  const previewText = `Hemos recibido tu solicitud de pedido ${request.requestCode} (${prodName}). Iniciando formulación técnica.`;

  const totalCOP = request.technicalCalculation?.estimatedMaterialCostCOP || 
    (request.catalogUnitPrice ? request.catalogUnitPrice * (request.materialQuantity || 1) : 0);

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #bfdbfe; border-radius: 16px; overflow: hidden; color: #0f172a; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);">
      <div style="background: linear-gradient(135deg, #0a192f 0%, #1e3a8a 60%, #1d4ed8 100%); padding: 28px; text-align: center; border-bottom: 4px solid #38bdf8;">
        <span style="color: #bae6fd; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">
          SOLICITUD DE PEDIDO · COLORLINK
        </span>
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 8px 0 4px;">
          ¡Orden ${request.requestCode} Registrada con Éxito!
        </h1>
        <p style="color: #bfdbfe; font-size: 12.5px; margin: 0;">
          Tu pedido ya está ingresado en el sistema y se encuentra en etapa de validación y alistamiento.
        </p>
      </div>

      <div style="padding: 24px;">
        <div style="background: linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%); border: 1px solid #93c5fd; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <p style="color: #1e40af; font-size: 13px; line-height: 1.6; margin: 0;">
            Hola <strong>${request.clientName}</strong>, tu orden <strong>${request.requestCode}</strong> para <strong>${prodName}</strong> ha sido ingresada en el centro de distribución <strong>${request.inventoryAllocation?.warehouseName || `CEDI ${request.city}`}</strong>. Te mantendremos informado por este medio cada vez que avance.
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
          ${request.items && request.items.length > 0 ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; vertical-align: top;">Ítems Solicitados (${request.items.length}):</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">
              <ul style="margin: 0; padding-left: 18px; font-size: 12px;">
                ${request.items.map((it) => `<li><strong>${it.quantity}x</strong> ${it.productName} (${it.presentation || 'und'}${it.colorName && it.colorName !== 'N/A' && !it.colorName.includes('Material') ? ` - Color: ${it.colorName}` : ''})</li>`).join('')}
              </ul>
            </td>
          </tr>
          ` : `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Producto:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${prodName}</td>
          </tr>
          ${isPaint ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Color Seleccionado:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${request.colorName || 'Blanco Lirio'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Área a Cubrir:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${request.areaM2} m²</td>
          </tr>
          ` : `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Cantidad Solicitada:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${request.materialQuantity || 1} unidades</td>
          </tr>`}
          `}
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Dirección de Entrega:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${request.deliveryAddress}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Total Estimado:</td>
            <td style="padding: 8px 0; font-weight: 800; color: #2563eb; font-size: 15px;">$${totalCOP.toLocaleString('es-CO')} COP</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b;">
        ColorLink S.A. · Seguimiento Logístico 360°
      </div>
    </div>
  `;

  return sendEmail({
    toEmail: request.clientEmail || 'cliente@colorlink.com',
    toName: request.clientName,
    subject,
    previewText,
    htmlContent,
    category: 'orden_creada',
    requestCode: request.requestCode,
    metadata: {
      productName: prodName,
      deliveryAddress: request.deliveryAddress,
      totalCostCOP: totalCOP,
    },
  });
}

/**
 * 3. Correo cuando el pedido es EMPACADO en bodega CEDI
 */
export async function sendOrderPackedEmail(
  request: PaintRequest
): Promise<EmailNotification> {
  const subject = `📦 Tu pedido [${request.requestCode}] ha sido EMPACADO en Bodega CEDI`;
  const prodName = request.catalogProductName || request.technicalCalculation?.recommendedProduct?.name || 'Materiales ColorLink';
  const packerName = request.packagingDetails?.packerName || 'Javier Gómez (CEDI)';
  const batchCode = request.packagingDetails?.batchCode || request.inventoryAllocation?.batchNumber || 'LOTE-CLK-2026';
  const warehouse = request.inventoryAllocation?.warehouseName || `CEDI Principal ColorLink ${request.city}`;

  const previewText = `¡Buenas noticias! Tu pedido ${request.requestCode} fue empacado e inspeccionado con éxito en ${warehouse}.`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #bfdbfe; border-radius: 16px; overflow: hidden; color: #0f172a; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);">
      <div style="background: linear-gradient(135deg, #0a192f 0%, #1e3a8a 60%, #1d4ed8 100%); padding: 28px; text-align: center; border-bottom: 4px solid #38bdf8;">
        <span style="color: #bae6fd; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">
          FASE 1: EMPAQUE Y ALISTAMIENTO EN BODEGA · CEDI COLORLINK
        </span>
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 8px 0 4px;">
          📦 Pedido ${request.requestCode} Empacado y Listo
        </h1>
        <p style="color: #bfdbfe; font-size: 12.5px; margin: 0;">
          Inspección de calidad completada en bodega. Sello de seguridad adherido.
        </p>
      </div>

      <div style="padding: 24px;">
        <div style="background: linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%); border: 1px solid #93c5fd; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <p style="color: #1e40af; font-size: 13px; line-height: 1.6; margin: 0;">
            Estimado(a) <strong>${request.clientName}</strong>: Te confirmamos que tu orden de <strong>${prodName}</strong> ha sido alistada y empacada en la bodega <strong>${warehouse}</strong> por nuestro operario <strong>${packerName}</strong>. El lote de producción ha sido certificado.
          </p>
        </div>

        <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 10px;">
          Detalles de Empaque y Control de Calidad
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Bodega de Despacho:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${warehouse}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Operario Responsable:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${packerName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Lote de Fabricación:</td>
            <td style="padding: 8px 0; font-mono; font-weight: 700; color: #2563eb;">${batchCode}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Sello de Seguridad:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #16a34a;">✓ Verificado & Adherido</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Próximo Paso:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #2563eb;">Cargue en vehículo de transporte asignado</td>
          </tr>
        </table>

        <div style="text-align: center; margin: 20px 0 10px;">
          <a href="${window.location.origin}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 22px; border-radius: 8px;">
            Ver Estado en el Portal ColorLink →
          </a>
        </div>
      </div>

      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b;">
        ColorLink S.A. · Sistema de Empaque & Logística CEDI
      </div>
    </div>
  `;

  return sendEmail({
    toEmail: request.clientEmail || 'cliente@colorlink.com',
    toName: request.clientName,
    subject,
    previewText,
    htmlContent,
    category: 'empaque',
    requestCode: request.requestCode,
    metadata: {
      packerName,
      batchCode,
      productName: prodName,
    },
  });
}

/**
 * 4. Correo cuando el pedido está EN TRANSPORTE / EN EL VEHÍCULO
 */
export async function sendOrderInTransitEmail(
  request: PaintRequest
): Promise<EmailNotification> {
  const subject = `🚚 Tu pedido [${request.requestCode}] va EN CAMINO en el vehículo de transporte`;
  const prodName = request.catalogProductName || request.technicalCalculation?.recommendedProduct?.name || 'Materiales ColorLink';
  const driverName = request.deliveryDetails?.driverName || 'Wilson Cañas';
  const driverPhone = request.deliveryDetails?.driverPhone || '+57 312 333 4455';
  const vehiclePlate = request.deliveryDetails?.vehiclePlate || 'WTL-582';
  const vehicleType = request.deliveryDetails?.vehicleType || 'Turbo FTR 4.5T ColorLink Express';
  const deliveryAddress = request.deliveryDetails?.deliveryAddress || request.deliveryAddress;

  const previewText = `¡Tu pedido ${request.requestCode} va en camino! Conductor ${driverName} a bordo del vehículo ${vehiclePlate}.`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #bfdbfe; border-radius: 16px; overflow: hidden; color: #0f172a; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);">
      <div style="background: linear-gradient(135deg, #0a192f 0%, #1e3a8a 60%, #1d4ed8 100%); padding: 28px; text-align: center; border-bottom: 4px solid #38bdf8;">
        <span style="color: #bae6fd; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">
          FASE 2: EN TRANSPORTE Y RUTA · COLORLINK EXPRESS
        </span>
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 8px 0 4px;">
          🚚 ¡Tu Pedido va en Camino a tu Obra!
        </h1>
        <p style="color: #bfdbfe; font-size: 12.5px; margin: 0;">
          El camión de despacho ha salido del muelle con destino a tu dirección registrada.
        </p>
      </div>

      <div style="padding: 24px;">
        <div style="background: linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%); border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <p style="color: #1e40af; font-size: 13px; line-height: 1.6; margin: 0;">
            Hola <strong>${request.clientName}</strong>: Tu pedido <strong>${request.requestCode}</strong> ha sido cargado en el vehículo de transporte y el conductor <strong>${driverName}</strong> se encuentra en ruta hacia tu dirección en <strong>${request.city}</strong>.
          </p>
        </div>

        <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 10px;">
          Datos del Vehículo de Transporte y Conductor
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Conductor Asignado:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${driverName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Teléfono del Conductor:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0284c7;">${driverPhone}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Vehículo y Placa:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">
              <span style="background-color: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-mono; border: 1px solid #bfdbfe;">${vehiclePlate}</span> (${vehicleType})
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Destino de Entrega:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${deliveryAddress}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Estado de Monitoreo:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #2563eb;">🛰️ En ruta · GPS Satelital Activo</td>
          </tr>
        </table>

        <div style="text-align: center; margin: 20px 0 10px;">
          <a href="${window.location.origin}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 22px; border-radius: 8px;">
            Ver Trazabilidad en Vivo →
          </a>
        </div>
      </div>

      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b;">
        ColorLink S.A. · Red de Distribución & Transporte Express
      </div>
    </div>
  `;

  return sendEmail({
    toEmail: request.clientEmail || 'cliente@colorlink.com',
    toName: request.clientName,
    subject,
    previewText,
    htmlContent,
    category: 'transporte',
    requestCode: request.requestCode,
    metadata: {
      driverName,
      vehiclePlate,
      deliveryAddress,
      productName: prodName,
    },
  });
}

/**
 * 5. Correo cuando el pedido ha sido ENTREGADO en obra
 */
export async function sendOrderDeliveredEmail(
  request: PaintRequest
): Promise<EmailNotification> {
  const subject = `✅ Tu pedido [${request.requestCode}] ha sido ENTREGADO exitosamente`;
  const prodName = request.catalogProductName || request.technicalCalculation?.recommendedProduct?.name || 'Materiales ColorLink';
  const deliveryAddress = request.deliveryDetails?.deliveryAddress || request.deliveryAddress;
  const receivedBy = request.deliveryDetails?.receivedByName || request.clientName;
  const certId = request.qualityCertificate?.certificateId || `GAR-CLK-${Math.floor(Math.random() * 90000 + 10000)}`;

  const previewText = `¡Entrega confirmada! Tu pedido ${request.requestCode} fue entregado a satisfacción. Garantía oficial de 5 años activada.`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #bfdbfe; border-radius: 16px; overflow: hidden; color: #0f172a; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);">
      <div style="background: linear-gradient(135deg, #0a192f 0%, #1e3a8a 60%, #1d4ed8 100%); padding: 28px; text-align: center; border-bottom: 4px solid #38bdf8;">
        <span style="color: #bae6fd; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">
          FASE 3: ENTREGA FINALIZADA · GARANTÍA Y CALIDAD COLORLINK
        </span>
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 8px 0 4px;">
          ✅ ¡Pedido Entregado con Éxito!
        </h1>
        <p style="color: #bfdbfe; font-size: 12.5px; margin: 0;">
          Recepción formal en obra completada y certificado de garantía emitido.
        </p>
      </div>

      <div style="padding: 24px;">
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <p style="color: #065f46; font-size: 13px; line-height: 1.6; margin: 0;">
            Apreciado(a) <strong>${request.clientName}</strong>: Confirmamos que tu pedido <strong>${request.requestCode}</strong> (${prodName}) ha sido entregado a satisfacción en <strong>${deliveryAddress}</strong>.
          </p>
        </div>

        <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 10px;">
          Acta de Recepción y Certificado Oficial
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Recibido en Obra por:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${receivedBy}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Dirección de Entrega:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${deliveryAddress}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Certificado de Calidad:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #2563eb;">
              ${certId} (Garantía Oficial ColorLink 5 Años)
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Factura Legal DIAN:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">Disponible para descarga en PDF en tu portal</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Estado del Pedido:</td>
            <td style="padding: 8px 0;">
              <span style="background-color: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                CERRADO CONFORMIDAD 100%
              </span>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin: 20px 0 10px;">
          <a href="${window.location.origin}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 22px; border-radius: 8px;">
            Descargar Certificado y Factura →
          </a>
        </div>
      </div>

      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b;">
        ColorLink S.A. · Certificado Oficial de Calidad & Garantía de Obra
      </div>
    </div>
  `;

  return sendEmail({
    toEmail: request.clientEmail || 'cliente@colorlink.com',
    toName: request.clientName,
    subject,
    previewText,
    htmlContent,
    category: 'entrega',
    requestCode: request.requestCode,
    metadata: {
      deliveryAddress,
      qualityCertificateId: certId,
      productName: prodName,
    },
  });
}

// Enviar correo de recuperación de contraseña con nueva clave generada
export async function sendPasswordRecoveryEmail(
  clientUser: { name: string; email: string },
  newPasswordCode: string
): Promise<EmailNotification> {
  const subject = `🔐 Recuperación de Contraseña ColorLink · Nueva clave: ${newPasswordCode}`;
  const previewText = `Hola ${clientUser.name}, tu nueva contraseña para ingresar a ColorLink es: ${newPasswordCode}. Úsala para acceder a tu portal.`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
        <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: rgba(255,255,255,0.2); border-radius: 12px; font-size: 22px; margin-bottom: 8px;">
          🔐
        </div>
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em;">ColorLink · Seguridad</h1>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Recuperación Oficial de Contraseña</p>
      </div>

      <div style="padding: 26px 24px;">
        <p style="font-size: 14px; color: #334155; margin: 0 0 16px;">
          Hola <strong>${clientUser.name}</strong>,
        </p>
        <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 20px;">
          Hemos recibido una solicitud para restablecer la contraseña de acceso a tu portal de cliente en ColorLink. Se ha generado una nueva contraseña segura para que puedas ingresar de inmediato:
        </p>

        <div style="background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
          <span style="font-size: 11px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 6px;">
            Tu Nueva Contraseña de Acceso
          </span>
          <span style="font-family: monospace; font-size: 24px; font-weight: 800; color: #1e3a8a; letter-spacing: 2px;">
            ${newPasswordCode}
          </span>
          <p style="font-size: 11px; color: #60a5fa; margin: 6px 0 0;">
            Copia esta clave e ingrésala en la pantalla de inicio de sesión
          </p>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 16px 0;">
          Cuenta vinculada: <strong style="color: #0f172a;">${clientUser.email}</strong>
        </p>

        <div style="text-align: center; margin: 24px 0 10px;">
          <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://colorlink.com'}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 6px rgba(37,99,235,0.3);">
            Ir a Iniciar Sesión en ColorLink →
          </a>
        </div>
      </div>

      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
        ColorLink S.A. · Tu nueva contraseña ya está registrada en el sistema.
      </div>
    </div>
  `;

  return sendEmail({
    toEmail: clientUser.email,
    toName: clientUser.name,
    subject,
    previewText,
    htmlContent,
    category: 'bienvenida',
    metadata: {
      action: 'password_recovery',
      newPassword: newPasswordCode,
    },
  });
}

