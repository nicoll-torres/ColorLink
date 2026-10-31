/**
 * Servicio de envío real de correos mediante la API REST oficial de Gmail
 * Endpoint: POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
 * Scope requerido: https://www.googleapis.com/auth/gmail.send
 */

import { auth } from './googleAuth';

export interface GmailSendResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
  details?: any;
}

/**
 * Codificar string con soporte UTF-8 completo a Base64
 */
export function utf8ToBase64(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Codificar un string a Base64URL según RFC 4648 sección 5 (seguro para URL sin relleno =).
 */
export function encodeBase64Url(str: string): string {
  return utf8ToBase64(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Codificar encabezado de asunto para formato MIME RFC 2047
 */
function encodeMimeSubject(subject: string): string {
  return `=?UTF-8?B?${utf8ToBase64(subject)}?=`;
}

/**
 * Construir el mensaje RFC 2822 MIME con HTML limpio codificado en base64
 */
export function buildRfc2822Email({
  to,
  subject,
  htmlContent,
  fromEmail,
}: {
  to: string;
  subject: string;
  htmlContent: string;
  fromEmail?: string;
}): string {
  const cleanTo = to.trim();
  const cleanSender = fromEmail && fromEmail.includes('@')
    ? fromEmail.trim()
    : auth.currentUser?.email || '';

  // Encabezados MIME válidos estándar RFC 2822
  const headerLines: string[] = [];
  if (cleanSender) {
    headerLines.push(`From: "ColorLink" <${cleanSender}>`);
  }
  headerLines.push(`To: <${cleanTo}>`);
  headerLines.push(`Subject: ${encodeMimeSubject(subject)}`);
  headerLines.push(`Date: ${new Date().toUTCString()}`);
  headerLines.push('MIME-Version: 1.0');
  headerLines.push('Content-Type: text/html; charset=UTF-8');
  headerLines.push('Content-Transfer-Encoding: base64');

  const headers = headerLines.join('\r\n');
  const base64Body = utf8ToBase64(htmlContent);
  // Dividir en líneas de máximo 76 caracteres según estándar MIME RFC 2045 sección 6.8
  const chunkedBody = base64Body.match(/.{1,76}/g)?.join('\r\n') || base64Body;

  return `${headers}\r\n\r\n${chunkedBody}`;
}

/**
 * Enviar un correo electrónico a través de la API REST de Gmail utilizando el token de acceso OAuth2
 * El destinatario principal SIEMPRE es el correo del cliente (to).
 */
export async function sendEmailViaGmailApi({
  accessToken,
  to,
  subject,
  htmlContent,
  fromEmail,
}: {
  accessToken: string;
  to: string;
  subject: string;
  htmlContent: string;
  fromEmail?: string;
}): Promise<GmailSendResult> {
  try {
    if (!accessToken) {
      return {
        success: false,
        error: 'No se detectó sesión activa de Google con permisos de Gmail. Por favor conecta tu cuenta.',
      };
    }

    const cleanTo = (to || '').trim();
    if (!cleanTo || !cleanTo.includes('@')) {
      return {
        success: false,
        error: `El correo de destino del cliente "${to}" no es válido.`,
      };
    }

    const sender = fromEmail || auth.currentUser?.email || undefined;

    // 1. Construir el mensaje RFC 2822 estándar
    const rawRfc2822 = buildRfc2822Email({
      to: cleanTo,
      subject,
      htmlContent,
      fromEmail: sender,
    });

    // 2. Codificar a Base64URL
    const encodedRaw = encodeBase64Url(rawRfc2822);

    console.info(`[Gmail API] Despachando correo directamente a los servidores de Gmail para: ${cleanTo}...`);

    // 3. Llamar al endpoint de Gmail para entregar el correo
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedRaw,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage =
        errorData?.error?.message ||
        `Error del servidor de Gmail (${response.status} ${response.statusText})`;
      console.error('[Gmail API Error]:', errorMessage, errorData);
      return {
        success: false,
        error: errorMessage,
        details: errorData,
      };
    }

    const data = await response.json();
    console.info(`[Gmail API Success] Mensaje entregado con éxito a ${cleanTo}:`, data);

    return {
      success: true,
      messageId: data.id,
      threadId: data.threadId,
      details: data,
    };
  } catch (err: any) {
    console.error('[Gmail API Exception]:', err);
    return {
      success: false,
      error: err?.message || 'Error de conexión al comunicarse con Gmail API.',
    };
  }
}
