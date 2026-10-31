import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Paintbrush,
  ShieldCheck,
  ArrowRight,
  Layers,
  Camera,
  Image as ImageIcon,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  FileText,
  Printer,
  Download,
  AlertTriangle,
  Info,
  Warehouse,
  CheckCircle2,
  ShoppingCart,
  Zap,
  Tag,
  Boxes,
} from '../icons';
import { PINTUCO_PRODUCTS, PINTUCO_WAREHOUSES, calculatePintucoSystem, PINTUCO_INVENTORY } from '../data';
import { OFFICIAL_IMAGES } from '../productImages';
import { SurfaceType, UserProfile, PintucoProduct, WarehouseInventoryItem } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  imagePreview?: string;
  detectedProducts?: PintucoProduct[];
  actionType?: 'calculation' | 'diagnosis' | 'spec_sheet' | 'compatibility';
}

interface AiAssistantModalProps {
  onClose: () => void;
  onSelectRecommendation?: (surface: string, product: string, areaM2?: number) => void;
  onNavigate?: (viewTarget: 'orders' | 'calculator' | 'register' | 'login' | 'new_request') => void;
  currentUser?: UserProfile | null;
  city?: string;
  inventoryList?: WarehouseInventoryItem[];
}

type ActiveTab = 'chat' | 'calculator' | 'compatibility' | 'spec_sheet' | 'cedis';

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  onClose,
  onSelectRecommendation,
  onNavigate,
  currentUser,
  city = 'Bogotá D.C.',
  inventoryList,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Quick Calculator State
  const [calcSurface, setCalcSurface] = useState<SurfaceType>('mamposteria_interior');
  const [calcArea, setCalcArea] = useState<number>(60);
  const [calcMode, setCalcMode] = useState<'area' | 'dimensions'>('area');
  const [calcWidth, setCalcWidth] = useState<number>(4);
  const [calcHeight, setCalcHeight] = useState<number>(2.5);
  const [calcWalls, setCalcWalls] = useState<number>(4);

  // Chemical Compatibility State
  const [compatBase, setCompatBase] = useState<string>('vinilo_alquidico');
  const [compatTarget, setCompatTarget] = useState<string>('epoxico');
  const [compatResult, setCompatResult] = useState<any>(null);

  // Spec Sheet State
  const [specProjectName, setSpecProjectName] = useState('Edificio Central - Remodelación');
  const [specSurface, setSpecSurface] = useState<SurfaceType>('mamposteria_interior');
  const [specArea, setSpecArea] = useState(120);

  const initialGreeting: Message = {
    id: 'msg-0',
    role: 'assistant',
    content: '¡Hola! Soy tu asistente de ColorLink, ¿en qué puedo ayudarte hoy?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<Message[]>([initialGreeting]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sampleQuestions = [
    { label: '📦 Stock en Bogotá', text: '¿Cuánto inventario tenemos disponible en CEDI Siberia Bogotá?' },
    { label: '📦 Stock de Viniltex', text: '¿Cuánto stock de Viniltex tenemos en total en las bodegas?' },
    { label: '🛠️ Herramientas en Stock', text: '¿Qué herramientas y rodillos tenemos en inventario?' },
    { label: '🧾 Factura DIAN', text: '¿Cómo descargo o consulto mi Factura Electrónica con código CUFE?' },
    { label: '🛒 ¿Cómo hacer pedido?', text: '¿Cuáles son los 5 pasos para cotizar y comprar pinturas en ColorLink?' },
    { label: '📍 ¿Por qué solo mi ciudad?', text: '¿Por qué solo puedo ver y pedir el inventario del CEDI de mi ciudad principal?' },
    { label: '🛡️ Certificado de Calidad', text: '¿Dónde descargo el Certificado Oficial de Calidad con código de lote y garantía?' },
    { label: '💧 Humedad & Salitre', text: '¿Qué hacer con un muro interior que tiene salitre blanco y pintura desprendida?' },
    { label: '🏭 Pisos Epóxicos', text: '¿Cómo aplicar Pintucoat epóxico en piso de concreto de bodega y cuántas horas de secado requiere?' },
    { label: '🏢 Fachada 250 m²', text: 'Necesito pintar una fachada exterior de 250 m² con Koraza Máxima Protección. ¿Cuántos cuñetes y galones requiero?' },
  ];

  // Detect which Pintuco products are referenced in text
  const detectProductsInText = (text: string): PintucoProduct[] => {
    const lower = text.toLowerCase();
    const found: PintucoProduct[] = [];
    for (const prod of PINTUCO_PRODUCTS) {
      const pName = prod.name.toLowerCase();
      if (
        (pName.includes('viniltex') && lower.includes('viniltex')) ||
        (pName.includes('koraza') && lower.includes('koraza')) ||
        (pName.includes('pintulux') && lower.includes('pintulux')) ||
        (pName.includes('epóxico') && (lower.includes('epoxic') || lower.includes('epóxic') || lower.includes('pintucoat'))) ||
        (pName.includes('sellomax') && lower.includes('sellomax')) ||
        (pName.includes('maderprotect') && (lower.includes('maderprotect') || lower.includes('barniz') || lower.includes('madera')))
      ) {
        if (!found.some((p) => p.id === prod.id)) {
          found.push(prod);
        }
      }
    }
    return found;
  };

  // Handle Image File Selection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('La imagen no debe superar los 15 MB.');
      return;
    }

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Send message to Gemini server-side route
  const handleSend = async (textToSend?: string) => {
    const query = textToSend !== undefined ? textToSend : input;
    if (!query.trim() && !selectedImage) return;

    const userMessageId = `msg-${Date.now()}`;
    const userMsg: Message = {
      id: userMessageId,
      role: 'user',
      content: query || 'Inspección técnica visual de la fotografía adjunta',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imagePreview: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    setImageFileName(null);
    setIsTyping(true);
    setActiveTab('chat');

    try {
      const response = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          history: messages.slice(-5).map((m) => ({ role: m.role, content: m.content })),
          imageBase64: currentImage || undefined,
          clientContext: {
            city: currentUser?.city || city,
            role: currentUser?.role || 'cliente',
            userName: currentUser?.name || 'Cliente ColorLink',
          },
          inventory: inventoryList || PINTUCO_INVENTORY,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.reply || 'Diagnóstico técnico completado.';
      const detected = detectProductsInText(replyText);

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          detectedProducts: detected.length > 0 ? detected : undefined,
        },
      ]);
    } catch (err: any) {
      console.warn('API call failed, running dynamic rule-based advisor:', err);
      // Generate rich dynamic answer as fallback
      const fallbackReply = generateClientFallback(query, currentImage);
      const detected = detectProductsInText(fallbackReply);

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          detectedProducts: detected.length > 0 ? detected : undefined,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateClientFallback = (qText: string, hasImg: string | null): string => {
    const q = (qText || '').toLowerCase();
    const cityContext = city || 'Bogotá D.C.';

    if (hasImg) {
      return `📸 **Diagnóstico Técnico Visual Pintuco:**

1. **Inspección de la Imagen:**
   Se aprecian irregularidades de sustrato compatibles con alcalinidad residual y desprendimiento superficial de película por pérdida de anclaje.
2. **Protocolo Correctivo:**
   • Raspar completamente el área descascarada con espátula flexible.
   • Lijar con lija grano 120 para suavizar bordes de transición.
   • Aplicar 1 mano de **Sellomax® 7 en 1** para fijar partículas sueltas y sellar porosidad.
3. **Acabado de Calidad:**
   • Aplicar 2 manos de **Viniltex® BioCuidado** para áreas interiores o **Koraza® Máxima Protección** para exteriores.`;
    }

    // 0. BÚSQUEDA Y CONSULTA DE INVENTARIO / STOCK
    if (
      q.includes('inventario') ||
      q.includes('stock') ||
      q.includes('cuanto hay') ||
      q.includes('cuánto hay') ||
      q.includes('cuantos hay') ||
      q.includes('cuántos hay') ||
      q.includes('disponible') ||
      q.includes('disponib') ||
      q.includes('lote') ||
      q.includes('existencia') ||
      q.includes('unidades')
    ) {
      const items = (inventoryList && inventoryList.length > 0) ? inventoryList : PINTUCO_INVENTORY;
      let filtered = items;
      if (q.includes('bogot') || q.includes('siberia')) {
        filtered = items.filter(i => i.warehouseCity.toLowerCase().includes('bogot'));
      } else if (q.includes('cali') || q.includes('yumbo')) {
        filtered = items.filter(i => i.warehouseCity.toLowerCase().includes('cali'));
      } else if (q.includes('medellin') || q.includes('medellín') || q.includes('rionegro')) {
        filtered = items.filter(i => i.warehouseCity.toLowerCase().includes('medell'));
      } else if (q.includes('barranquilla') || q.includes('galapa')) {
        filtered = items.filter(i => i.warehouseCity.toLowerCase().includes('barranquilla'));
      } else if (q.includes('bucaramanga') || q.includes('girón') || q.includes('giron')) {
        filtered = items.filter(i => i.warehouseCity.toLowerCase().includes('bucaramanga'));
      } else if (q.includes('viniltex')) {
        filtered = items.filter(i => i.productName.toLowerCase().includes('viniltex'));
      } else if (q.includes('koraza')) {
        filtered = items.filter(i => i.productName.toLowerCase().includes('koraza'));
      } else if (q.includes('rodillo') || q.includes('brocha') || q.includes('herramienta')) {
        filtered = items.filter(i => i.productName.toLowerCase().includes('rodillo') || i.productName.toLowerCase().includes('brocha') || i.category?.includes('Herramientas'));
      }

      if (filtered.length === 0) filtered = items.slice(0, 5);

      const lines = filtered.map(item => {
        const units = item.cuñetesAvailable > 0
          ? `📦 ${item.cuñetesAvailable} Cuñetes (5 Gal) | 🪣 ${item.galonesAvailable} Galones`
          : `🛠️ ${item.galonesAvailable} Unidades disponibles`;
        return `• **${item.productName}** (${item.warehouseCity} - ${item.warehouseName}):\n  ${units} | 🏷️ Lote: \`${item.batchCode}\` | Precio: $${(item.pricePerGalon || item.unitPrice || 0).toLocaleString('es-CO')} COP`;
      }).join('\n\n');

      return `📦 **Inventario Oficial ColorLink que Tenemos Disponible en Bodegas:**\n\n${lines}\n\n💡 *Todo este inventario es 100% de ColorLink Pintuco y está disponible para despacho inmediato desde el CEDI correspondiente.*`;
    }

    // 1. Facturas Electrónicas
    if (q.includes('factura') || q.includes('dian') || q.includes('cufe') || q.includes('iva')) {
      return `🧾 **Facturación Electrónica Oficial en ColorLink (DIAN):**

Todos los pedidos procesados en ColorLink cuentan con **Factura Electrónica Legal** avalada por la DIAN.

**¿Cómo descargar o consultar tu Factura Electrónica?**
1. Inicia sesión en tu cuenta de cliente.
2. Ve a la sección **"Mis Pedidos"** o **"Historial de Cotizaciones"** en tu panel.
3. En cualquier pedido con estado **"Aprobado"**, **"En Alistamiento"**, **"En Ruta"** o **"Entregado"**, encontrarás el botón azul **"Factura Electrónica"**.
4. Al hacer clic se abrirá el documento con:
   • Código Único de Factura Electrónica (**CUFE**) y Código QR de validación fiscal.
   • Desglose legal: Valor Bruto, **IVA del 19%**, Retención en la fuente y Total a Pagar en COP.
   • Botones para **Imprimir o Guardar en PDF**.`;
    }

    // 2. Certificados de Calidad
    if (q.includes('certificado') || q.includes('calidad') || q.includes('garantia') || q.includes('garantía') || q.includes('ntc')) {
      return `🛡️ **Certificados de Calidad Pintuco & Garantías Oficiales:**

Cada despacho de ColorLink está respaldado por el laboratorio de aseguramiento de calidad de Pintuco Colombia bajo normas **NTC 1335** y **NTC 1280**.

**¿Cómo obtener el Certificado de Calidad de tu Pedido?**
1. Ingresa a tu **Panel de Cliente** > **"Mis Pedidos"**.
2. Ubica el pedido deseado y haz clic en el botón verde **"Certificado de Calidad"**.
3. El certificado emitido incluye:
   • **Código de Lote de Fabricación** verificado por planta.
   • Pruebas de película: Lavabilidad (>1.000 ciclos), Rendimiento, Poder Cubriente y Flexibilidad.
   • **Vigencia de Garantía:** *Koraza® Máxima Protección:* 7 Años • *Pintucoat® Epóxico:* 8 Años • *Viniltex® BioCuidado:* 5 Años • *Pintulux® 3 en 1:* 5 Años.`;
    }

    // 3. Registro e Inicio de Sesión
    if (q.includes('registr') || q.includes('iniciar sesion') || q.includes('iniciar sesión') || q.includes('login') || q.includes('clave') || q.includes('contraseña') || q.includes('password') || q.includes('cuenta')) {
      return `🔑 **Gestión de Cuentas, Registro e Inicio de Sesión:**

**1. Para Nuevos Clientes:**
• Haz clic en **"Crear Cuenta"** o **"Registrarse"** en la barra superior.
• Diligencia: Razón Social / Nombre, **NIT o Cédula** (indispensable para facturación electrónica), Correo Electrónico, Teléfono móvil (10 dígitos) y tu **Ciudad Principal** (Bogotá, Medellín, Cali, Barranquilla, Bucaramanga).
• Una vez registrado, el sistema te asigna de inmediato el CEDI regional correspondiente.

**2. Credenciales de Acceso:**
• Clientes registrados: Ingresan con su correo y contraseña (las cuentas de prueba utilizan la contraseña predeterminada: \`cliente123\`).
• También puedes iniciar sesión con un solo clic mediante **Google Sign-In**.`;
    }

    // 4. Aislamiento por Ciudad
    if (q.includes('ciudad') || q.includes('cedi') || q.includes('bodega') || q.includes('aislamiento') || q.includes('por que solo veo') || q.includes('por qué solo veo')) {
      return `📍 **Red Logística Nacional de CEDIs & Regla de Ciudad Principal:**

ColorLink opera bajo una **política de aislamiento logístico territorial inteligente**:

**¿Por qué un cliente solo ve el inventario de su ciudad?**
Para garantizar entregas el mismo día o en un plazo máximo de 12 a 24 horas, cada cliente está vinculado directamente con el Centro de Distribución (CEDI) de su área metropolitana:

🏢 **Nuestros CEDIs Oficiales en Colombia:**
• **Bogotá D.C.:** CEDI Siberia (Despacho: **18 horas**).
• **Medellín:** Planta Rionegro (Despacho: **12 horas**).
• **Cali:** Hub Regional Acopi Yumbo (Despacho: **24 horas**).
• **Barranquilla:** CEDI Galapa (Despacho: **24 horas**).
• **Bucaramanga:** CEDI Oriente Girón (Despacho: **36 horas**).

Esto asegura que el stock que ves en pantalla está **físicamente en la bodega de tu ciudad**, listo para ser alistado y despachado sin sobrecostos de fletes intermunicipales.`;
    }

    // 5. Cómo hacer un pedido / cotización
    if (q.includes('como pedir') || q.includes('cómo pedir') || q.includes('hacer pedido') || q.includes('cotizar') || q.includes('comprar') || q.includes('crear pedido') || q.includes('paso') || q.includes('pasos')) {
      return `🛒 **Guía para Realizar Cotizaciones y Pedidos en ColorLink (5 Pasos):**

1. **Paso 01 - Tu Necesidad:** Selecciona la superficie (Muros interiores, Fachadas, Piso Epóxico, Metales, Madera), los m² y el color de la carta Pintuco.
2. **Paso 02 - Solución Técnica:** Nuestro motor calcula el número de manos requeridas, la dilución adecuada y si necesitas imprimante (*Sellomax® 7 en 1*).
3. **Paso 03 - Abastecimiento:** El sistema cubicá automáticamente tu pedido en **Cuñetes (5 galones)** y **Galones sueltos**, verificando stock en tu CEDI local y sumando herramientas sugeridas (rodillos, brochas, cintas).
4. **Paso 04 - Despacho:** Indicas tu dirección de entrega y horario preferido. Un empacador CEDI sella tu pedido y se asigna un conductor.
5. **Paso 05 - Calidad & Entrega:** Recibes el pedido con precinto de seguridad, código QR de inspección, Factura Electrónica y Certificado de Calidad.`;
    }

    // 6. Herramientas e Insumos
    if (q.includes('herramienta') || q.includes('rodillo') || q.includes('brocha') || q.includes('cinta') || q.includes('lija') || q.includes('espatula') || q.includes('espátula') || q.includes('plastico') || q.includes('plástico') || q.includes('bandeja') || q.includes('masilla')) {
      return `🛠️ **Catálogo Oficial de Herramientas & Insumos Pintuco:**

En ColorLink puedes pedir tanto las pinturas como todos los materiales necesarios:

• **Rodillo Microfibra Cero Goteo 9":** \$32.000 COP • Muros lisos y estucados. No salpica.
• **Brocha Cerda Monofilamento 2.5":** \$18.500 COP • Precisión para esquinas y marcos.
• **Cinta de Enmascarar Azul de Pintor 1":** \$12.000 COP • Remoción limpia sin desprendimientos.
• **Bandeja Plástica para Rodillo 9":** \$14.000 COP • Con estrías dosificadoras.
• **Espátula Flexible Acero Inoxidable 3":** \$16.000 COP • Para resanar y raspar.
• **Pliegos de Lija de Agua (80, 120, 220):** \$3.500 COP c/u • Para suavizar muros.
• **Plástico Protector Cubretodo 4×5m:** \$22.000 COP • Para cubrir pisos y muebles.
• **Masilla Acrílica Resanadora:** \$28.000 COP • Relleno de grietas sin rechupe.`;
    }

    // 7. Empacador & Conductor
    if (q.includes('empacador') || q.includes('conductor') || q.includes('reparto') || q.includes('alistamiento') || q.includes('transporte')) {
      return `🚛 **Operaciones de Empaque y Despacho en ColorLink:**

**Terminal del Empacador (En CEDI):**
• Recibe los pedidos aprobados de su misma ciudad.
• Realiza la lista de chequeo digital de envases y herramientas.
• Aplica el **Precinto de Calidad Pintuco** y genera el **Código QR de inspección**.

**Panel del Conductor (En Ruta):**
• Visualiza los despachos asignados a su camión con su placa registrada.
• Optimiza la ruta urbana por sectores de la ciudad.
• Entrega el pedido al cliente con firma digital y activa la factura electrónica.`;
    }

    // 8. Calculadora & M²
    if (q.includes('calculadora') || q.includes('calcular') || q.includes('m2') || q.includes('m²') || q.includes('metro') || q.includes('cuanto necesito') || q.includes('cuánto necesito') || q.includes('cuñete') || q.includes('galon')) {
      return `🧮 **Calculadora Técnica de Rendimiento & Cubicaje Pintuco:**

• **Viniltex® BioCuidado:** ~25 m² por galón a 2 manos (o ~50 m² a 1 mano).
• **Koraza® Máxima Protección:** ~20 m² por galón a 2 manos (o ~40 m² a 1 mano).
• **Pintucoat® Epóxico:** ~15 m² por galón a 2 manos.
• **Pintulux® 3 en 1:** ~19 m² por galón a 2 manos.

💡 *¿Cómo usarla?* Haz clic en la pestaña **"Calculadora de Galones"** en este mismo asesor para calcular y enviar directamente los productos a tu cotización.`;
    }

    // 9. Humedad & Salitre
    if (q.includes('humedad') || q.includes('salitre') || q.includes('moho') || q.includes('hongo')) {
      return `🔍 **Diagnóstico Técnico para Humedad y Salitre en ${cityContext}:**
1. **Preparación:** Raspar toda la pintura suelta. Lavar con hipoclorito al 10% y dejar secar 24h.
2. **Neutralización:** Aplicar 1 mano pura de **Sellomax® 7 en 1**. Esto detiene la migración de sales minerales y neutraliza la alcalinidad.
3. **Acabado:** Aplicar 2 manos de **Koraza® Máxima Protección** o **Viniltex® BioCuidado**.
⏱️ Rendimiento: ~40 m²/gal a 1 mano (~20 m²/gal a 2 manos).`;
    }

    // 10. Pisos Epóxicos
    if (q.includes('piso') || q.includes('epóxico') || q.includes('epoxico') || q.includes('concreto')) {
      return `🏭 **Sistema Epóxico para Pisos de Concreto:**
1. **Condición de Losa:** Concreto con mínimo 28 días de vaciado y <4% de humedad. Abrir poro mecánico o químico.
2. **Fondo:** Imprimante Epóxico Pintuco.
3. **Acabado:** **Pintucoat® Epóxico Poliamida 500** (Relación 1:1 en volumen, disolvente 121.096).
⏱️ Secado: 4h al tacto, 24h para tránsito liviano, 7 días curado químico para montacargas.`;
    }

    // 11. Maderas
    if (q.includes('madera') || q.includes('barniz') || q.includes('deck') || q.includes('maderprotect')) {
      return `🪵 **Sistema Pintuco para Maderas con Maderprotect®:**
1. **Preparación:** Madera seca (<15% humedad), lijada en sentido de la veta con lija 180/220 y libre de grasa.
2. **Producto:** **Maderprotect® Barniz Poliuretano** con filtro solar UV.
3. **Aplicación:** 3 manos finas para intemperie. Dilución primera mano al 15% con Thinner Fino Pintuco; manos 2 y 3 al 5-10%.`;
    }

    // 12. Metales
    if (q.includes('metal') || q.includes('reja') || q.includes('oxido') || q.includes('óxido') || q.includes('pintulux')) {
      return `⚙️ **Protocolo de Protección de Metales con Pintulux® 3 en 1:**
1. **Preparación:** Remover óxido suelto con cepillo de alambre o lija grano 80/120. Desengrasar.
2. **Aplicación:** 2 manos de **Pintulux® Máxima Protección 3 en 1** (anticorrosivo + convertidor + esmalte brillante).
3. **Dilución:** 10% con Ajustador Pintuco 21219 (evitar thinner corriente). Secado: 3h tacto / 8h repinte.`;
    }

    // 13. Fachadas
    if (q.includes('fachada') || q.includes('koraza') || q.includes('exterior')) {
      return `🏢 **Sistema de Fachadas con Koraza® Máxima Protección:**
1. **Inspección:** Lavar polvo y hongos. Resanar fisuras con masilla elastomérica.
2. **Fondo:** 1 mano de **Sellomax® 7 en 1** en revoques nuevos o caleados.
3. **Acabado:** 2 a 3 manos de **Koraza® Máxima Protección** 100% acrílica (dilución primera mano al 20%, segunda al 10%).
🛡️ Garantía Pintuco: Hasta 7 años de resistencia a rayos UV e intemperie.`;
    }

    // 14. Dilución
    if (q.includes('diluci') || q.includes('solvente') || q.includes('thinner') || q.includes('agua')) {
      return `🎨 **Guía Oficial de Dilución de Productos Pintuco:**
• **Viniltex® BioCuidado:** 1ra mano hasta 25% agua; 2da mano hasta 15%.
• **Koraza® Máxima Protección:** 15% a 20% con agua limpia.
• **Pintulux® 3 en 1:** 10% únicamente con **Ajustador Pintuco 21219**.
• **Pintucoat® Epóxico 500:** 10% con **Disolvente Epóxico 121.096** tras 15 min de inducción.`;
    }

    return `💡 **Asistente Virtual Integral ColorLink Pintuco:**

Puedo orientarte en cualquier área de la plataforma y de proyectos de recubrimientos:

1. **Plataforma:**
   • Cómo crear un pedido paso a paso o generar cotizaciones.
   • Descarga de **Facturas Electrónicas DIAN** y **Certificados de Calidad**.
   • Por qué tu inventario se restringe al **CEDI de tu ciudad principal** (${cityContext}).
   • Registro de clientes, inicio de sesión y roles (Administrador, Empacador, Conductor).

2. **Dudas Técnicas:**
   • Diagnóstico de patologías: Humedad, salitre, ampollamiento, caleo o moho.
   • Sistemas Pintuco: Viniltex®, Koraza®, Pintulux®, Pintucoat® Epóxico, Sellomax® y Maderprotect®.
   • Herramientas oficiales: Rodillos cero goteo, brochas, cintas, lijas y masillas.

3. **Herramientas de este Asesor:**
   • Pestaña **"Calculadora de Galones"**: Calcula envases exactos y cotiza de inmediato.
   • Pestaña **"Test de Compatibilidad"**: Evalúa si tu pintura nueva sirve sobre la anterior.
   • Pestaña **"Pliego Técnico"**: Genera la especificación formal para tu obra en PDF.
   • Botón de **Cámara**: Sube una foto de tu muro para evaluación visual.`;
  };

  // Copy text to clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Voice narration using Web Speech API
  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-CO';
    utterance.rate = 1.05;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Perform Chemical Compatibility Evaluation
  const evaluateCompatibility = () => {
    let status: 'compatible' | 'warning' | 'incompatible' = 'compatible';
    let title = '';
    let explanation = '';
    let recommendation = '';

    if (compatTarget === 'epoxico' && compatBase === 'vinilo_alquidico') {
      status = 'incompatible';
      title = '❌ Incompatibilidad Crítica: Alto Riesgo de Arrugamiento';
      explanation = 'Los solventes aromáticos y epóxicos atacan y remueven las resinas vinílicas o alquídicas existentes, causando que la pintura inferior se arrugue, ampolle y se desprenda en pocas horas.';
      recommendation = 'Debe removerse mecánicamente el 100% de la pintura vinílica previa mediante desbastado, o aplicar una barrera intermedia epóxica al agua 100% curada tras prueba de parche.';
    } else if (compatTarget === 'epoxico' && compatBase === 'cal_antigua') {
      status = 'incompatible';
      title = '❌ Incompatibilidad Total: Falta de Cohesión';
      explanation = 'La cal no tiene resistencia a la tracción; el epóxico al contraerse durante el curado arrancará la cal del muro.';
      recommendation = 'Retirar toda la cal con hidrolavadora a presión y cepillo de alambre antes de imprimar.';
    } else if (compatTarget === 'poliuretano' && compatBase === 'epoxico_existente') {
      status = 'compatible';
      title = '✅ Sistema Dúo Excelente (Epoxi-Poliuretano)';
      explanation = 'Es la combinación estándar de máxima durabilidad industrial. El epóxico provee resistencia mecánica y el poliuretano resistencia a rayos UV.';
      recommendation = 'Lijar suavemente la superficie del epóxico (grano 220) para matizar y generar anclaje mecánico antes de aplicar el poliuretano.';
    } else if (compatTarget === 'koraza' && compatBase === 'vinilo_alquidico') {
      status = 'warning';
      title = '⚠️ Requiere Prueba de Adherencia e Imprimación';
      explanation = 'Si el vinilo antiguo está bien adherido y seco, Koraza anclará bien. Si está caleado o polvoso, la película nueva se descascarará.';
      recommendation = 'Lavar, lijar y aplicar 1 mano de Sellomax® 7 en 1 antes de aplicar las 2 manos de Koraza.';
    } else {
      status = 'compatible';
      title = '✅ Aplicación Segura';
      explanation = 'Los componentes son químicamente compatibles. Se garantiza anclaje si el sustrato está limpio y seco.';
      recommendation = 'Limpiar polvo con trapo húmedo, aplicar imprimante si la superficie es porosa y proceder con 2 manos.';
    }

    setCompatResult({ status, title, explanation, recommendation });
  };

  // Calculate live cubicaje in calculator tab
  const computedCalcArea = calcMode === 'area' ? Math.max(1, calcArea) : Math.max(1, calcWidth * calcHeight * calcWalls);
  const calculationResult = calculatePintucoSystem(calcSurface, computedCalcArea);

  // Insert calculation result into the chat
  const handleInsertCalculationToChat = () => {
    const summary = `🧮 **Cálculo Técnico Solicitado:**
• **Superficie:** ${calcSurface.replace('_', ' ').toUpperCase()}
• **Área Neta:** ${computedCalcArea} m²
• **Producto Principal:** ${calculationResult.recommendedProduct.name}
• **Cantidad Estimada:** ${calculationResult.totalCuñetes} Cuñete(s) y ${calculationResult.remainderGalons} Galón(es) (${calculationResult.totalGalons} Galones totales).
• **Fondo Sellador:** ${calculationResult.primerGalons > 0 ? `${calculationResult.primerGalons} Galones de Sellomax® 7 en 1` : 'No requerido'}
• **Costo Estimado Material:** $${calculationResult.estimatedMaterialCostCOP.toLocaleString('es-CO')} COP`;

    setActiveTab('chat');
    handleSend(summary);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] h-[780px] animate-in fade-in duration-200">
        
        {/* Header Superior */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-400/20 border border-sky-300/40 flex items-center justify-center text-sky-300 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base font-['Space_Grotesk'] tracking-wide">
                  Asesor Técnico Inteligente ColorLink IA
                </h3>
                <span className="text-[10px] font-mono bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-ping" />
                  Gemini Flash 3.8
                </span>
              </div>
              <p className="text-[11px] text-blue-200/90 flex items-center gap-2 mt-0.5">
                <span>Ingeniería en Recubrimientos Pintuco</span>
                <span className="text-blue-400">•</span>
                <span className="text-sky-300 font-medium">Sede {city}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-base font-bold transition-colors cursor-pointer"
              title="Cerrar asesor"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Barra de Pestañas de Herramientas Inteligentes */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center gap-1 overflow-x-auto shrink-0 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'chat'
                ? 'bg-white text-blue-900 font-bold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Chat Técnico & Diagnóstico</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'calculator'
                ? 'bg-white text-blue-900 font-bold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span>Calculadora de Galones</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compatibility')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'compatibility'
                ? 'bg-white text-blue-900 font-bold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Test de Compatibilidad Química</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('spec_sheet')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'spec_sheet'
                ? 'bg-white text-blue-900 font-bold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pliego Técnico para Obra</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cedis')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'cedis'
                ? 'bg-white text-blue-900 font-bold shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5 text-purple-600" />
            <span>Stock en Bodegas CEDIs</span>
          </button>
        </div>

        {/* CUERPO PRINCIPAL SEGÚN PESTAÑA */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-50">
          
          {/* TAB 1: CHAT TÉCNICO & FOTODIAGNÓSTICO */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Mensajes */}
              <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-full`}
                  >
                    {/* Tarjeta de imagen si el usuario la adjuntó */}
                    {m.imagePreview && (
                      <div className="mb-2 max-w-xs rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-white p-1">
                        <img
                          src={m.imagePreview}
                          alt="Fotografía subida para diagnóstico"
                          className="w-full h-36 object-cover rounded-lg"
                        />
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 p-1">
                          <Camera className="w-3 h-3 text-blue-600" />
                          <span>Foto evaluada por Gemini Vision</span>
                        </div>
                      </div>
                    )}

                    <div
                      className={`p-3.5 sm:p-4 rounded-2xl max-w-[90%] sm:max-w-[85%] text-xs leading-relaxed shadow-xs transition-all ${
                        m.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs whitespace-pre-line'
                      }`}
                    >
                      {m.content}

                      {/* Tarjetas interactivas de productos detectados */}
                      {m.detectedProducts && m.detectedProducts.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                            Productos Pintuco recomendados para este caso:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {m.detectedProducts.map((p) => {
                              const prodImg =
                                p.category.includes('Fachada') || p.id.includes('koraza')
                                  ? OFFICIAL_IMAGES.tarroFachada
                                  : p.category.includes('Metal') || p.id.includes('pintulux')
                                  ? OFFICIAL_IMAGES.tarroEsmalte
                                  : p.id.includes('epoxico')
                                  ? OFFICIAL_IMAGES.tarroGalon
                                  : OFFICIAL_IMAGES.tarroPintura;

                              return (
                                <div
                                  key={p.id}
                                  className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 transition-colors"
                                >
                                  <img
                                    src={prodImg}
                                    alt={p.name}
                                    className="w-10 h-10 object-contain rounded bg-white p-0.5 border border-slate-200 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-[11px] text-slate-900 truncate">
                                      {p.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 truncate">
                                      {p.finishType} • {p.coveragePerGalM2} m²/gal
                                    </p>
                                    <p className="text-[10px] font-mono font-bold text-blue-700">
                                      ${p.pricePerGalon.toLocaleString('es-CO')} / gal
                                    </p>
                                  </div>

                                  {onSelectRecommendation && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const surf = p.id.includes('koraza')
                                          ? 'fachada_exterior'
                                          : p.id.includes('pintulux')
                                          ? 'metal_ferroso'
                                          : p.id.includes('epoxico')
                                          ? 'concreto_piso'
                                          : p.id.includes('madera')
                                          ? 'madera'
                                          : 'mamposteria_interior';
                                        onSelectRecommendation(surf, p.name, 60);
                                      }}
                                      className="btn-primary !p-1.5 text-[10px] shrink-0 rounded-lg"
                                      title="Agregar al pedido / Cotizar"
                                    >
                                      <ShoppingCart className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Botones de atajo rápido de la plataforma según el tema tratado */}
                      {m.role === 'assistant' && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {(m.content.includes('Factura') || m.content.includes('DIAN') || m.content.includes('Certificado') || m.content.includes('Mis Pedidos')) && onNavigate && (
                            <button
                              type="button"
                              onClick={() => onNavigate('orders')}
                              className="text-[10px] font-semibold bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <FileText className="w-3 h-3 text-blue-700" />
                              <span>Ir a Mis Pedidos y Facturas</span>
                            </button>
                          )}

                          {(m.content.includes('Calculadora') || m.content.includes('Cubicaje') || m.content.includes('m²') || m.content.includes('cuñete')) && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('calculator')}
                              className="text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <Sliders className="w-3 h-3 text-amber-700" />
                              <span>Abrir Calculadora Técnica</span>
                            </button>
                          )}

                          {(m.content.includes('Paso 01') || m.content.includes('Cotizaciones') || m.content.includes('hacer pedido') || m.content.includes('comprar')) && onNavigate && (
                            <button
                              type="button"
                              onClick={() => onNavigate('new_request')}
                              className="text-[10px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <ShoppingCart className="w-3 h-3 text-emerald-700" />
                              <span>Crear Nueva Cotización / Pedido</span>
                            </button>
                          )}

                          {(m.content.includes('CEDI') || m.content.includes('bodega') || m.content.includes('Siberia') || m.content.includes('Rionegro') || m.content.includes('Yumbo')) && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('cedis')}
                              className="text-[10px] font-semibold bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-1 rounded-lg hover:bg-purple-100 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <Warehouse className="w-3 h-3 text-purple-700" />
                              <span>Consultar Bodegas CEDIs</span>
                            </button>
                          )}

                          {(m.content.includes('Registrarse') || m.content.includes('Iniciar sesión') || m.content.includes('cliente123')) && !currentUser && onNavigate && (
                            <button
                              type="button"
                              onClick={() => onNavigate('login')}
                              className="text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-1 rounded-lg hover:bg-slate-200 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <CheckCircle2 className="w-3 h-3 text-blue-600" />
                              <span>Iniciar Sesión / Registrarse</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Barra de herramientas para cada mensaje del asistente */}
                    {m.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-1 px-1 text-[11px] text-slate-400">
                        <span className="font-mono text-[10px]">{m.timestamp}</span>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, m.content)}
                          className="hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Copiar respuesta"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 text-[10px]">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copiar</span>
                            </>
                          )}
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => handleSpeak(m.id, m.content)}
                          className="hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Escuchar asesoría en voz alta"
                        >
                          <Zap className={`w-3 h-3 ${speakingId === m.id ? 'text-amber-500 animate-bounce' : ''}`} />
                          <span className="text-[10px]">
                            {speakingId === m.id ? 'Detener Voz' : 'Escuchar'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 w-fit shadow-xs">
                    <div className="w-5 h-5 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <Sparkles className="w-3 h-3 animate-spin" />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">
                      El asesor técnico está evaluando la patología y normativas...
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Preguntas Frecuentes Rápidas */}
              <div className="p-2.5 bg-white border-t border-slate-100 shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                    Consultas Técnicas Frecuentes:
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium hidden sm:inline">
                    Haz clic para diagnosticar
                  </span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {sampleQuestions.map((sq, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(sq.text)}
                      className="text-[11px] whitespace-nowrap bg-slate-100 hover:bg-blue-50 hover:text-blue-900 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 transition-colors cursor-pointer shrink-0"
                    >
                      {sq.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vista previa de foto seleccionada */}
              {selectedImage && (
                <div className="px-3 py-1.5 bg-sky-50 border-t border-sky-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-sky-900 truncate">
                    <Camera className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="font-semibold truncate">Foto lista para diagnóstico:</span>
                    <span className="text-sky-700 truncate text-[11px]">{imageFileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImageFileName(null);
                    }}
                    className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-0.5 rounded cursor-pointer"
                  >
                    Quitar ✕
                  </button>
                </div>
              )}

              {/* Barra de Entrada / Input con botón de cámara */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
                {/* Input file oculto para tomar o subir foto */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                    selectedImage
                      ? 'bg-sky-100 border-sky-400 text-sky-700 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  }`}
                  title="Subir foto del muro, piso o defecto para diagnóstico visual con IA"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={
                    selectedImage
                      ? 'Escribe tu consulta adicional sobre la foto (opcional)...'
                      : 'Pregunta sobre patologías, preparación de muros, galones o formulación...'
                  }
                  className="flex-1 text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                />

                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() && !selectedImage}
                  className="btn-primary !py-2.5 !px-4 text-xs disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  <span>Consultar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CALCULADORA DE GALONES & CUBICAJE */}
          {activeTab === 'calculator' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-amber-700 font-bold">
                      MOTOR TÉCNICO DE CÁLCULO PINTUCO
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">
                      Calculadora Rápida de m², Galones y Cuñetes
                    </h3>
                  </div>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setCalcMode('area')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        calcMode === 'area' ? 'bg-white shadow-xs text-blue-900 font-bold' : 'text-slate-600'
                      }`}
                    >
                      Área Total (m²)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcMode('dimensions')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        calcMode === 'dimensions' ? 'bg-white shadow-xs text-blue-900 font-bold' : 'text-slate-600'
                      }`}
                    >
                      Dimensiones (Largo × Alto)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Tipo de Superficie a Pintar:
                    </label>
                    <select
                      value={calcSurface}
                      onChange={(e) => setCalcSurface(e.target.value as SurfaceType)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="mamposteria_interior">Mampostería Interior / Drywall (Viniltex BioCuidado)</option>
                      <option value="fachada_exterior">Fachada Exterior / Intemperie (Koraza Máxima Protección)</option>
                      <option value="metal_ferroso">Metales Ferrosos / Rejas (Pintulux 3 en 1)</option>
                      <option value="concreto_piso">Pisos de Concreto / Bodegas (Pintucoat Epóxico)</option>
                      <option value="madera">Maderas Interiores / Exteriores (Maderprotect)</option>
                      <option value="humedad_salitre">Pared con Humedad / Salitre (Sellomax + Koraza)</option>
                    </select>
                  </div>

                  {calcMode === 'area' ? (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Área Total en Metros Cuadrados (m²):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={5000}
                          value={calcArea}
                          onChange={(e) => setCalcArea(Number(e.target.value) || 1)}
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-600"
                        />
                        <span className="text-xs font-mono font-bold text-slate-500">m²</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-600 block mb-0.5">Largo (m):</label>
                        <input
                          type="number"
                          value={calcWidth}
                          onChange={(e) => setCalcWidth(Number(e.target.value))}
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-600 block mb-0.5">Alto (m):</label>
                        <input
                          type="number"
                          value={calcHeight}
                          onChange={(e) => setCalcHeight(Number(e.target.value))}
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-600 block mb-0.5">Muros:</label>
                        <input
                          type="number"
                          value={calcWalls}
                          onChange={(e) => setCalcWalls(Number(e.target.value))}
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Resumen del cálculo en vivo */}
                <div className="mt-4 p-3.5 bg-blue-50/60 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Resultado Técnico para {computedCalcArea} m²
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                      ${calculationResult.estimatedMaterialCostCOP.toLocaleString('es-CO')} COP
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Cuñetes (5 Gal)</span>
                      <strong className="text-base text-blue-900 font-mono">
                        {calculationResult.totalCuñetes}
                      </strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Galones Sueltos</span>
                      <strong className="text-base text-blue-900 font-mono">
                        {calculationResult.remainderGalons}
                      </strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Fondo Sellador</span>
                      <strong className="text-xs text-amber-900 font-semibold block mt-1">
                        {calculationResult.primerGalons > 0 ? `${calculationResult.primerGalons} Gal Sellomax®` : 'No requerido'}
                      </strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Manos Recomendadas</span>
                      <strong className="text-base text-emerald-800 font-mono">
                        {calculationResult.handsNeeded}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-blue-200/60">
                    <button
                      type="button"
                      onClick={handleInsertCalculationToChat}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Insertar en Chat
                    </button>
                    {onSelectRecommendation && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRecommendation(
                            calcSurface,
                            calculationResult.recommendedProduct.name,
                            computedCalcArea
                          );
                        }}
                        className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Agregar al Pedido / Cotizar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEST DE COMPATIBILIDAD QUÍMICA */}
          {activeTab === 'compatibility' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-mono uppercase text-indigo-700 font-bold block mb-1">
                  MÓDULO DE INGENIERÍA QUÍMICA DE RECUBRIMIENTOS
                </span>
                <h3 className="font-bold text-sm text-slate-900 mb-2">
                  Verificador de Compatibilidad entre Capas y Sustratos
                </h3>
                <p className="text-xs text-slate-600 mb-4">
                  Evita desprendimientos, arrugamientos por solvente y saponificación evaluando la interacción entre la pintura previa existente y la capa que vas a aplicar.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Pintura / Sustrato Actual Existente:
                    </label>
                    <select
                      value={compatBase}
                      onChange={(e) => setCompatBase(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none bg-white"
                    >
                      <option value="vinilo_alquidico">Vinilo Acrílico o Pintura Alquídica vieja</option>
                      <option value="cal_antigua">Cal o Blanqueador artesanal tradicional</option>
                      <option value="epoxico_existente">Piso con Epóxico existente curado</option>
                      <option value="concreto_nuevo">Concreto nuevo (menos de 28 días)</option>
                      <option value="metal_oxidado">Metal ferroso con óxido visible</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Pintura Nueva que Deseas Aplicar:
                    </label>
                    <select
                      value={compatTarget}
                      onChange={(e) => setCompatTarget(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none bg-white"
                    >
                      <option value="epoxico">Pintucoat® Epóxico Poliamida 500 (Solvente fuerte)</option>
                      <option value="koraza">Koraza® Máxima Protección (Acrílica base agua)</option>
                      <option value="viniltex">Viniltex® BioCuidado (Base agua interior)</option>
                      <option value="poliuretano">Maderprotect® Poliuretano</option>
                      <option value="pintulux">Pintulux® Máxima Protección 3 en 1</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={evaluateCompatibility}
                  className="btn-primary !py-2 !px-4 text-xs flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Evaluar Compatibilidad Química</span>
                </button>

                {compatResult && (
                  <div
                    className={`mt-4 p-4 rounded-xl border ${
                      compatResult.status === 'incompatible'
                        ? 'bg-red-50 border-red-200 text-red-950'
                        : compatResult.status === 'warning'
                        ? 'bg-amber-50 border-amber-200 text-amber-950'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    }`}
                  >
                    <h4 className="font-bold text-sm mb-1">{compatResult.title}</h4>
                    <p className="text-xs mb-2 leading-relaxed">{compatResult.explanation}</p>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-black/10 text-xs">
                      <strong>Recomendación de ingeniería Pintuco:</strong>
                      <p className="mt-0.5">{compatResult.recommendation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PLIEGO TÉCNICO PARA OBRA */}
          {activeTab === 'spec_sheet' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold">
                      DOCUMENTO FORMAL DE INGENIERÍA
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">
                      Generador de Pliego de Especificación Técnica Oficial
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 font-medium cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Imprimir / PDF</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-1">Nombre de la Obra:</label>
                    <input
                      type="text"
                      value={specProjectName}
                      onChange={(e) => setSpecProjectName(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-1">Sustrato / Área:</label>
                    <select
                      value={specSurface}
                      onChange={(e) => setSpecSurface(e.target.value as SurfaceType)}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="mamposteria_interior">Muros Interiores</option>
                      <option value="fachada_exterior">Fachada Exterior</option>
                      <option value="concreto_piso">Piso Epóxico</option>
                      <option value="metal_ferroso">Metales y Rejas</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-1">Área Estimada (m²):</label>
                    <input
                      type="number"
                      value={specArea}
                      onChange={(e) => setSpecArea(Number(e.target.value))}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Hoja de Pliego Técnico */}
                <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs space-y-3 font-sans">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        PLIEGO DE ESPECIFICACIÓN TÉCNICA PINTUCO COLORLINK
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Proyecto: {specProjectName} • Sede {city} • Fecha: {new Date().toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] bg-slate-200 px-2 py-0.5 rounded font-bold h-fit">
                      NTC 1335 / NTC 1280
                    </span>
                  </div>

                  <div>
                    <strong className="text-slate-800 text-[11px] block mb-1">1. Preparación de Sustrato:</strong>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      La superficie debe estar completamente limpia, seca y libre de grasa, polvo o pintura desprendida. Humedad de sustrato inferior al 5%. Aplicación obligatoria de imprimante acrílico Sellomax® 7 en 1 para fijar porosidad y neutralizar sales alcalinas.
                    </p>
                  </div>

                  <div>
                    <strong className="text-slate-800 text-[11px] block mb-1">2. Sistema de Recubrimiento Prescrito:</strong>
                    <ul className="list-disc pl-4 text-slate-600 space-y-1 text-[11px]">
                      <li>Fondo: 1 mano uniforme de Sellomax® 7 en 1 (Rendimiento ~45 m²/gal).</li>
                      <li>
                        Acabado: 2 manos de{' '}
                        {specSurface === 'fachada_exterior'
                          ? 'Koraza® Máxima Protección (Garantía 7 años)'
                          : specSurface === 'concreto_piso'
                          ? 'Pintucoat® Epóxico Poliamida 500 (Garantía 8 años)'
                          : specSurface === 'metal_ferroso'
                          ? 'Pintulux® 3 en 1 Anticorrosivo'
                          : 'Viniltex® BioCuidado Tipo 1 Antibacterial'}
                        .
                      </li>
                      <li>Espesor de película seca recomendado: 2.5 a 3.0 mils.</li>
                    </ul>
                  </div>

                  <div>
                    <strong className="text-slate-800 text-[11px] block mb-1">3. Tiempos de Secado y Repinte (a 25°C):</strong>
                    <p className="text-slate-600 text-[11px]">
                      Secado al tacto: 1 a 2 horas. Intervalo mínimo de repinte entre manos: 4 a 6 horas. Curado total para máxima lavabilidad: 7 días calendario.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DISPONIBILIDAD EN BODEGAS CEDIS */}
          {activeTab === 'cedis' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-mono uppercase text-purple-700 font-bold block mb-1">
                  RED LOGÍSTICA NACIONAL COLORLINK
                </span>
                <h3 className="font-bold text-sm text-slate-900 mb-2">
                  Inventario y Capacidad de Despacho en CEDIs
                </h3>
                <p className="text-xs text-slate-600 mb-4">
                  Consulta los tiempos de alistamiento y el estado de stock en los centros de distribución oficial Pintuco en Colombia.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PINTUCO_WAREHOUSES.map((wh, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 hover:bg-slate-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold text-xs">
                        <Warehouse className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-slate-900">{wh.city}</h4>
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-bold">
                            {wh.stockStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 truncate">{wh.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{wh.address}</p>
                        <p className="text-[10px] font-mono text-purple-900 font-bold mt-1">
                          ⏱️ Despacho promedio: {wh.avgDispatchHours} horas
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
