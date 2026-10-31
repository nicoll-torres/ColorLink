import React, { useState, useEffect, useMemo } from 'react';
import { PaintRequest, UserProfile, SurfaceType, WarehouseInventoryItem, PendingRequestData, OrderItem, OrderChatMessage } from '../types';
import { isPaintProduct, getProductImage } from '../data';
import { isSameCity } from '../utils/cityUtils';
import { RequestView } from './RequestView';
import { InvoiceModal } from './InvoiceModal';
import { OrderChatModal } from './OrderChatModal';
import {
  getEmailsForUser,
  openInGmail,
  openInEmailClient,
  openInOutlook,
  buildEmailPlainText,
} from '../emailService';
import {
  Building,
  Layers,
  Truck,
  Boxes,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  FileText,
  PlusCircle,
  Sparkles,
  Sliders,
  LogOut,
  Navigation,
  ShoppingCart,
  Ban,
  Tag,
  Search,
  Receipt,
  Download,
  Eye,
  Palette,
  Wrench,
  Plus,
  Minus,
  Check,
  X,
  Droplet,
  Mail,
  Send,
  ExternalLink,
  Package,
  Trash2,
  MessageSquare,
} from '../icons';

interface ClientDashboardProps {
  currentUser: UserProfile;
  requests: PaintRequest[];
  inventoryList?: WarehouseInventoryItem[];
  initialPendingData?: PendingRequestData | null;
  onClearInitialPendingData?: () => void;
  onSubmitRequest: (request: PaintRequest) => void;
  onUpdateRequest?: (request: PaintRequest) => void;
  onOpenEmailInbox?: (emailId?: string) => void;
  onOpenAiAssistant: () => void;
  onOpenCalculator: () => void;
  onOpenCertificate: (request: PaintRequest) => void;
  onOpenInvoice?: (request: PaintRequest) => void;
  onLogout: () => void;
  onViewTransversal: () => void;
  cartItems?: Array<{
    id: string;
    item: WarehouseInventoryItem;
    quantity: number;
    format: 'galon' | 'cuñete' | 'cuarto' | 'unidad';
    selectedColor?: { name: string; hex: string };
    unitPrice: number;
    totalCostCOP: number;
  }>;
  onAddToCart?: (
    item: WarehouseInventoryItem,
    quantity?: number,
    format?: 'galon' | 'cuñete' | 'cuarto' | 'unidad',
    color?: { name: string; hex: string }
  ) => void;
  onUpdateCartQty?: (cartId: string, delta: number) => void;
  onRemoveFromCart?: (cartId: string) => void;
  onClearCart?: () => void;
  onOpenCart?: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  currentUser,
  requests,
  inventoryList = [],
  initialPendingData,
  onClearInitialPendingData,
  onSubmitRequest,
  onUpdateRequest,
  onOpenEmailInbox,
  onOpenAiAssistant,
  onOpenCalculator,
  onOpenCertificate,
  onOpenInvoice,
  onLogout,
  onViewTransversal,
  cartItems: propsCartItems,
  onAddToCart,
  onUpdateCartQty: propsUpdateQty,
  onRemoveFromCart: propsRemoveItem,
  onClearCart: propsClearCart,
  onOpenCart,
}) => {
  const [activeTab, setActiveTab] = useState<'nueva_solicitud' | 'mis_pedidos' | 'catalogo_inventario' | 'mis_accesos' | 'mis_correos'>(
    () => (initialPendingData ? 'nueva_solicitud' : requests.filter((r) => r.clientEmail?.toLowerCase() === currentUser.email?.toLowerCase()).length === 0 ? 'nueva_solicitud' : 'mis_pedidos')
  );
  const [selectedReqId, setSelectedReqId] = useState<string>('');
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<PaintRequest | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<string>('todos');
  const [catalogWarehouseFilter, setCatalogWarehouseFilter] = useState<string>('todos');
  const [orderSuccessBanner, setOrderSuccessBanner] = useState<string | null>(null);

  // Chat estilo Wasap con el conductor en tiempo real
  const [chatReqId, setChatReqId] = useState<string | null>(null);

  const handleSendMessage = (requestId: string, messageText: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: OrderChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderRole: 'cliente',
      senderName: currentUser.name || 'Cliente',
      message: messageText,
      timestamp: timeStr,
      createdAtIso: now.toISOString(),
    };

    const updatedReq: PaintRequest = {
      ...req,
      chatMessages: [...(req.chatMessages || []), newMsg],
    };

    if (onUpdateRequest) {
      onUpdateRequest(updatedReq);
    }
    try {
      window.dispatchEvent(
        new CustomEvent('colorlink-order-chat-updated', {
          detail: { requestId, message: newMsg, updatedRequest: updatedReq },
        })
      );
    } catch {}
  };

  // Inventario restringido exclusivamente a la Ciudad Principal del cliente
  const clientCity = currentUser.city || 'Medellín';
  const clientInventory = useMemo(() => {
    const matched = inventoryList.filter((item) => isSameCity(item.warehouseCity, clientCity));
    if (matched.length > 0) return matched;
    // Respaldo por si no hay registros específicos aún
    return inventoryList.filter((item) => isSameCity(item.warehouseCity, 'Medellín'));
  }, [inventoryList, clientCity]);

  // Lista de correos del cliente actual
  const [userEmails, setUserEmails] = useState(() => getEmailsForUser(currentUser.email));

  useEffect(() => {
    const handleEmails = () => {
      setUserEmails(getEmailsForUser(currentUser.email));
    };
    handleEmails();
    window.addEventListener('colorlink-email-sent', handleEmails);
    window.addEventListener('colorlink-email-read', handleEmails);
    window.addEventListener('colorlink-email-deleted', handleEmails);
    return () => {
      window.removeEventListener('colorlink-email-sent', handleEmails);
      window.removeEventListener('colorlink-email-read', handleEmails);
      window.removeEventListener('colorlink-email-deleted', handleEmails);
    };
  }, [currentUser.email]);

  const [selectedCatalogItem, setSelectedCatalogItem] = useState<WarehouseInventoryItem | null>(() => {
    if (initialPendingData?.catalogItem) return initialPendingData.catalogItem;
    return null;
  });

  // Estado del Carrito Multi-Ítem (Sincronizado con la barra de navegación global)
  const [internalCartItems, setInternalCartItems] = useState<Array<{
    id: string;
    item: WarehouseInventoryItem;
    quantity: number;
    format: 'galon' | 'cuñete' | 'cuarto' | 'unidad';
    selectedColor?: { name: string; hex: string };
    unitPrice: number;
    totalCostCOP: number;
  }>>(() => {
    try {
      const saved = localStorage.getItem('colorlink_cart_items') || localStorage.getItem('colorlink_client_cart');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const cartItems = propsCartItems || internalCartItems;
  const setCartItems = propsCartItems ? (() => {}) as any : setInternalCartItems;
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cartDeliveryAddress, setCartDeliveryAddress] = useState<string>(
    currentUser.city ? `Calle 45 # 22-80, ${currentUser.city}` : 'Dirección de obra principal'
  );
  const [cartDeliveryNotes, setCartDeliveryNotes] = useState<string>('');
  const [cartToast, setCartToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('colorlink_client_cart', JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  // Modal de Compra Rápida Directa desde el Catálogo
  const [quickBuyItem, setQuickBuyItem] = useState<WarehouseInventoryItem | null>(null);
  const [quickBuyColor, setQuickBuyColor] = useState<{ name: string; hex: string }>({
    name: 'Blanco Lirio Silvestre 01',
    hex: '#F1F5F9',
  });
  const [quickBuyFormat, setQuickBuyFormat] = useState<'galon' | 'cuñete'>('galon');
  const [quickBuyQty, setQuickBuyQty] = useState<number>(1);
  const [quickBuyAddress, setQuickBuyAddress] = useState<string>(
    currentUser.city ? `Calle 45 # 22-80, ${currentUser.city}` : 'Dirección de obra principal'
  );
  const [quickBuyNotes, setQuickBuyNotes] = useState<string>('');
  const [quickBuyError, setQuickBuyError] = useState<string>('');

  const DEFAULT_PAINT_COLORS = [
    { name: 'Blanco Lirio Silvestre 01', hex: '#F1F5F9' },
    { name: 'Brisa Caribeña Aqua', hex: '#27CBD2' },
    { name: 'Menta Salvia Suave', hex: '#86DEB8' },
    { name: 'Azul Pizarra Moderno', hex: '#526C86' },
    { name: 'Mar Profundo Marengo', hex: '#2C3844' },
    { name: 'Luz de Arena Cálida', hex: '#FDF0B5' },
    { name: 'Lino Crudo Atemporal', hex: '#F7F4EA' },
    { name: 'Gris Basalto Grafito', hex: '#3D4B58' },
    { name: 'Verde Eucalipto Botánico', hex: '#70CCA7' },
    { name: 'Terracota Colonial', hex: '#C2674A' },
  ];

  // Abrir modal de compra rápida para un producto
  const handleOpenQuickBuy = (item: WarehouseInventoryItem) => {
    setQuickBuyItem(item);
    setQuickBuyQty(1);
    setQuickBuyFormat('galon');
    setQuickBuyNotes('');
    setQuickBuyError('');
    if (item.availableColors && item.availableColors.length > 0) {
      setQuickBuyColor(item.availableColors[0]);
    } else {
      setQuickBuyColor(DEFAULT_PAINT_COLORS[0]);
    }
  };

  // Confirmar compra rápida desde el catálogo
  const handleConfirmQuickBuy = () => {
    if (!quickBuyItem) return;
    const isPaint = isPaintProduct(quickBuyItem);
    const codeNumber = Math.floor(1000 + Math.random() * 9000);
    const itemPrice = quickBuyItem.unitPrice || quickBuyItem.pricePerGalon || (isPaint ? 115000 : 28000);

    // Validar existencias
    if (isPaint) {
      const isCuñete = quickBuyFormat === 'cuñete';
      if (isCuñete && quickBuyQty > (quickBuyItem.cuñetesAvailable || 0)) {
        setQuickBuyError(`Solo hay ${quickBuyItem.cuñetesAvailable || 0} cuñetes disponibles en este CEDI.`);
        return;
      }
      if (!isCuñete && quickBuyQty > (quickBuyItem.galonesAvailable || 0)) {
        setQuickBuyError(`Solo hay ${quickBuyItem.galonesAvailable || 0} galones disponibles en este CEDI.`);
        return;
      }
    } else {
      const availUnits = quickBuyItem.unitsAvailable ?? quickBuyItem.galonesAvailable ?? quickBuyItem.totalLiters ?? 0;
      if (quickBuyQty > availUnits) {
        setQuickBuyError(`Solo hay ${availUnits} unidades disponibles en este CEDI.`);
        return;
      }
    }

    let newReq: PaintRequest;

    if (isPaint) {
      const isCuñete = quickBuyFormat === 'cuñete';
      const totalGalons = isCuñete ? quickBuyQty * 5 : quickBuyQty;
      const unitCost = isCuñete ? Math.round(itemPrice * 5 * 0.92) : itemPrice;
      const totalCostCOP = unitCost * quickBuyQty;

      newReq = {
        id: 'req-' + Date.now(),
        requestCode: `PTC-2026-${codeNumber}`,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        clientName: currentUser.name,
        clientEmail: currentUser.email,
        clientPhone: currentUser.phone,
        city: quickBuyItem.warehouseCity || currentUser.city || 'Medellín',
        deliveryAddress: quickBuyAddress || `${currentUser.city}, Colombia`,
        projectType: 'Residencial',
        surfaceType: 'mamposteria_interior',
        environment: 'interior',
        areaM2: totalGalons * 35,
        colorName: quickBuyColor.name,
        colorHex: quickBuyColor.hex,
        orderItemType: 'pintura',
        catalogSku: quickBuyItem.sku,
        catalogProductName: quickBuyItem.productName,
        catalogUnitPrice: itemPrice,
        items: [
          {
            id: `item-${Date.now()}-1`,
            sku: quickBuyItem.sku,
            productName: quickBuyItem.productName,
            category: quickBuyItem.category,
            itemType: 'pintura',
            colorName: quickBuyColor.name,
            colorHex: quickBuyColor.hex,
            presentation: isCuñete ? 'cuñete' : 'galon',
            quantity: quickBuyQty,
            unitPrice: unitCost,
            totalCostCOP: totalCostCOP,
            warehouseCity: quickBuyItem.warehouseCity,
            warehouseName: quickBuyItem.warehouseName,
          },
        ],
        notes: `[Compra Directa Catálogo CEDI: ${quickBuyItem.productName} | Formato: ${isCuñete ? `${quickBuyQty} Cuñete(s) (5 Gal)` : `${quickBuyQty} Galón(es)`} | Color: ${quickBuyColor.name}] ${quickBuyNotes}`.trim(),
        requiresApplicationService: false,
        status: 'solucion_tecnica',
        technicalCalculation: {
          areaM2: totalGalons * 35,
          recommendedProduct: {
            id: quickBuyItem.productId || quickBuyItem.sku,
            name: quickBuyItem.productName,
            line: 'Hogar y Construcción',
            category: quickBuyItem.category,
            description: `Pintura despachada desde ${quickBuyItem.warehouseName}`,
            coveragePerGalM2: 35,
            recommendedHands: 2,
            dilution: '10% agua potable',
            dryingTouchHours: 1,
            dryingTotalHours: 4,
            warrantyYears: 5,
            finishType: (quickBuyItem.finish as any) || 'Mate',
            ecoFriendly: true,
            vocGramsLiter: 15,
            pricePerGalon: itemPrice,
            availableSizes: ['1 Galón', 'Cuñete (5 Gal)'],
          },
          handsNeeded: 2,
          totalGalons: totalGalons,
          totalCuñetes: isCuñete ? quickBuyQty : 0,
          remainderGalons: isCuñete ? 0 : quickBuyQty,
          primerGalons: 0,
          requiredSupplies: [],
          estimatedMaterialCostCOP: totalCostCOP,
          preparationAdvice: ['Limpiar superficie libre de polvo y grasa'],
          applicationInstructions: ['Aplicar 2 manos con rodillo o brocha Pintuco'],
          warrantyDurationYears: 5,
        },
        inventoryAllocation: {
          warehouseCity: quickBuyItem.warehouseCity,
          warehouseName: quickBuyItem.warehouseName,
          batchNumber: quickBuyItem.batchCode || 'LOTE-DIRECT-2026',
          stockConfirmed: true,
          dispatchReadyDate: new Date().toISOString().substring(0, 10),
        },
      };
    } else {
      // Material / Herramienta por unidad
      const totalCostCOP = itemPrice * quickBuyQty;
      newReq = {
        id: 'req-' + Date.now(),
        requestCode: `PTC-2026-${codeNumber}`,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        clientName: currentUser.name,
        clientEmail: currentUser.email,
        clientPhone: currentUser.phone,
        city: quickBuyItem.warehouseCity || currentUser.city || 'Medellín',
        deliveryAddress: quickBuyAddress || `${currentUser.city}, Colombia`,
        projectType: 'Residencial',
        surfaceType: 'mamposteria_interior',
        environment: 'interior',
        areaM2: quickBuyQty,
        colorName: 'N/A (Material / Herramienta)',
        orderItemType: 'material',
        materialQuantity: quickBuyQty,
        catalogSku: quickBuyItem.sku,
        catalogProductName: quickBuyItem.productName,
        catalogUnitPrice: itemPrice,
        items: [
          {
            id: `item-${Date.now()}-1`,
            sku: quickBuyItem.sku,
            productName: quickBuyItem.productName,
            category: quickBuyItem.category,
            itemType: 'material',
            presentation: 'unidad',
            quantity: quickBuyQty,
            unitPrice: itemPrice,
            totalCostCOP: totalCostCOP,
            warehouseCity: quickBuyItem.warehouseCity,
            warehouseName: quickBuyItem.warehouseName,
          },
        ],
        notes: `[Compra por Unidad desde Catálogo: ${quickBuyItem.productName} | Cantidad: ${quickBuyQty} ${quickBuyItem.unitMeasure || 'unidades'}] ${quickBuyNotes}`.trim(),
        requiresApplicationService: false,
        status: 'solucion_tecnica',
        technicalCalculation: {
          areaM2: quickBuyQty,
          recommendedProduct: {
            id: quickBuyItem.productId || quickBuyItem.sku,
            name: quickBuyItem.productName,
            line: 'Preparación y Fondos',
            category: quickBuyItem.category,
            description: `Artículo despachado desde ${quickBuyItem.warehouseName}`,
            coveragePerGalM2: 1,
            recommendedHands: 1,
            dilution: 'N/A',
            dryingTouchHours: 0,
            dryingTotalHours: 0,
            warrantyYears: 2,
            finishType: 'Mate',
            ecoFriendly: true,
            vocGramsLiter: 0,
            pricePerGalon: itemPrice,
            availableSizes: [quickBuyItem.unitMeasure || 'Unidad'],
          },
          handsNeeded: 1,
          totalGalons: quickBuyQty,
          totalCuñetes: 0,
          remainderGalons: quickBuyQty,
          primerGalons: 0,
          requiredSupplies: [],
          estimatedMaterialCostCOP: totalCostCOP,
          preparationAdvice: [],
          applicationInstructions: [],
          warrantyDurationYears: 2,
        },
        inventoryAllocation: {
          warehouseCity: quickBuyItem.warehouseCity,
          warehouseName: quickBuyItem.warehouseName,
          batchNumber: quickBuyItem.batchCode || 'LOTE-MAT-2026',
          stockConfirmed: true,
          dispatchReadyDate: new Date().toISOString().substring(0, 10),
        },
      };
    }

    setQuickBuyItem(null);
    handleRequestCreated(newReq);
  };

  // Añadir al Carrito (para pedidos multi-ítem)
  const handleAddToCart = (
    item: WarehouseInventoryItem,
    quantity: number,
    format: 'galon' | 'cuñete' | 'cuarto' | 'unidad',
    color?: { name: string; hex: string }
  ) => {
    if (onAddToCart) {
      onAddToCart(item, quantity, format, color);
    } else {
      const isPaint = isPaintProduct(item);
      let unitPrice = item.unitPrice || item.pricePerGalon || (isPaint ? 115000 : 28000);
      if (isPaint && format === 'cuñete') {
        unitPrice = Math.round(unitPrice * 5 * 0.92);
      }
      const totalCostCOP = unitPrice * quantity;

      setInternalCartItems((prev) => {
        const existingIdx = prev.findIndex(
          (ci) => ci.item.sku === item.sku && ci.format === format && (ci.selectedColor?.name === color?.name || !color)
        );
        if (existingIdx >= 0) {
          const next = [...prev];
          const updatedQty = next[existingIdx].quantity + quantity;
          next[existingIdx] = {
            ...next[existingIdx],
            quantity: updatedQty,
            totalCostCOP: next[existingIdx].unitPrice * updatedQty,
          };
          return next;
        }
        return [
          ...prev,
          {
            id: `cart-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            item,
            quantity,
            format,
            selectedColor: color,
            unitPrice,
            totalCostCOP,
          },
        ];
      });
    }

    setCartToast(`✅ "${item.productName}" (${quantity} ${format === 'cuñete' ? 'Cuñete(s)' : format === 'galon' ? 'Galón(es)' : 'und'}) agregado a tu pedido.`);
    setTimeout(() => setCartToast(null), 3500);
  };

  const handleUpdateCartQty = (cartId: string, delta: number) => {
    if (propsUpdateQty) {
      propsUpdateQty(cartId, delta);
    } else {
      setInternalCartItems((prev) =>
        prev
          .map((ci) => {
            if (ci.id === cartId) {
              const newQty = ci.quantity + delta;
              if (newQty <= 0) return null;
              return {
                ...ci,
                quantity: newQty,
                totalCostCOP: ci.unitPrice * newQty,
              };
            }
            return ci;
          })
          .filter(Boolean) as any[]
      );
    }
  };

  const handleRemoveFromCart = (cartId: string) => {
    if (propsRemoveItem) {
      propsRemoveItem(cartId);
    } else {
      setInternalCartItems((prev) => prev.filter((ci) => ci.id !== cartId));
    }
  };

  const handleClearCart = () => {
    if (propsClearCart) {
      propsClearCart();
    } else {
      setInternalCartItems([]);
    }
  };

  const handleOpenCartModal = () => {
    if (onOpenCart) {
      onOpenCart();
    } else {
      setIsCartOpen(true);
    }
  };

  const handleConfirmCartOrder = () => {
    if (cartItems.length === 0) return;

    // Validar existencias en tiempo real con inventario antes de descontar
    for (const ci of cartItems) {
      const invMatch = inventoryList.find(
        (i) =>
          i.sku === ci.item.sku ||
          i.id === ci.item.id ||
          (i.productName.toLowerCase() === ci.item.productName.toLowerCase() && i.warehouseCity === ci.item.warehouseCity)
      );
      if (invMatch) {
        if (isPaintProduct(invMatch)) {
          if (ci.format === 'cuñete' && ci.quantity > (invMatch.cuñetesAvailable || 0)) {
            setCartToast(
              `⚠️ Solo quedan ${invMatch.cuñetesAvailable || 0} cuñetes de "${invMatch.productName}" en CEDI ${invMatch.warehouseCity}. Por favor ajusta tu pedido.`
            );
            return;
          }
          if (ci.format === 'galon' && ci.quantity > (invMatch.galonesAvailable || 0)) {
            setCartToast(
              `⚠️ Solo quedan ${invMatch.galonesAvailable || 0} galones de "${invMatch.productName}" en CEDI ${invMatch.warehouseCity}. Por favor ajusta tu pedido.`
            );
            return;
          }
        } else {
          const avail = invMatch.unitsAvailable ?? invMatch.galonesAvailable ?? 0;
          if (ci.quantity > avail) {
            setCartToast(
              `⚠️ Solo quedan ${avail} unidades de "${invMatch.productName}" en CEDI ${invMatch.warehouseCity}. Por favor ajusta tu pedido.`
            );
            return;
          }
        }
      }
    }

    const codeNumber = Math.floor(1000 + Math.random() * 9000);
    const hasPaint = cartItems.some((ci) => isPaintProduct(ci.item));
    const firstPaint = cartItems.find((ci) => isPaintProduct(ci.item));
    const mainItem = firstPaint || cartItems[0];

    const totalCuñetes = cartItems.reduce((acc, ci) => (ci.format === 'cuñete' ? acc + ci.quantity : acc), 0);
    const totalGalons = cartItems.reduce(
      (acc, ci) => (ci.format === 'galon' ? acc + ci.quantity : ci.format === 'cuñete' ? acc + ci.quantity * 5 : acc),
      0
    );
    const totalCostCOP = cartItems.reduce((acc, ci) => acc + ci.totalCostCOP, 0);

    const orderItems: OrderItem[] = cartItems.map((ci, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      sku: ci.item.sku,
      productName: ci.item.productName,
      category: ci.item.category,
      itemType: isPaintProduct(ci.item) ? 'pintura' : 'material',
      colorName: ci.selectedColor?.name || (isPaintProduct(ci.item) ? 'Blanco Lirio Silvestre 01' : undefined),
      colorHex: ci.selectedColor?.hex || (isPaintProduct(ci.item) ? '#F1F5F9' : undefined),
      presentation: ci.format,
      quantity: ci.quantity,
      unitPrice: ci.unitPrice,
      totalCostCOP: ci.totalCostCOP,
      warehouseCity: ci.item.warehouseCity,
      warehouseName: ci.item.warehouseName,
      notes: ci.format === 'cuñete' ? 'Cuñete de 5 Galones' : ci.format === 'galon' ? 'Galón individual' : 'Unidad de producto',
    }));

    const summaryNotes = `[Pedido Multi-Ítem: ${cartItems.length} productos | ${cartItems
      .map((c) => `${c.quantity}x ${c.item.productName} (${c.format}${c.selectedColor ? ` - ${c.selectedColor.name}` : ''})`)
      .join(', ')}] ${cartDeliveryNotes}`.trim();

    const newReq: PaintRequest = {
      id: 'req-' + Date.now(),
      requestCode: `PTC-2026-${codeNumber}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      clientName: currentUser.name,
      clientEmail: currentUser.email,
      clientPhone: currentUser.phone,
      city: mainItem.item.warehouseCity || currentUser.city || 'Medellín',
      deliveryAddress: cartDeliveryAddress || `${currentUser.city || 'Medellín'}, Colombia`,
      projectType: 'Residencial',
      surfaceType: 'mamposteria_interior',
      environment: 'interior',
      areaM2: totalGalons > 0 ? totalGalons * 35 : cartItems.length,
      colorName: firstPaint?.selectedColor?.name || (hasPaint ? 'Blanco Lirio Silvestre 01' : 'N/A (Material / Herramienta)'),
      colorHex: firstPaint?.selectedColor?.hex || (hasPaint ? '#F1F5F9' : undefined),
      orderItemType: hasPaint ? 'pintura' : 'material',
      catalogSku: mainItem.item.sku,
      catalogProductName: mainItem.item.productName,
      catalogUnitPrice: mainItem.unitPrice,
      items: orderItems,
      notes: summaryNotes,
      requiresApplicationService: false,
      status: 'solucion_tecnica',
      technicalCalculation: {
        areaM2: totalGalons > 0 ? totalGalons * 35 : 10,
        recommendedProduct: {
          id: mainItem.item.productId || mainItem.item.sku,
          name: mainItem.item.productName,
          line: 'Hogar y Construcción',
          category: mainItem.item.category,
          description: `Despachado desde ${mainItem.item.warehouseName}`,
          coveragePerGalM2: 35,
          recommendedHands: 2,
          dilution: '10% agua potable',
          dryingTouchHours: 1,
          dryingTotalHours: 4,
          warrantyYears: 5,
          finishType: (mainItem.item.finish as any) || 'Mate',
          ecoFriendly: true,
          vocGramsLiter: 15,
          pricePerGalon: mainItem.unitPrice,
          availableSizes: ['1 Galón', 'Cuñete (5 Gal)'],
        },
        handsNeeded: 2,
        totalGalons: totalGalons,
        totalCuñetes: totalCuñetes,
        remainderGalons: Math.max(0, totalGalons - totalCuñetes * 5),
        primerGalons: 0,
        requiredSupplies: cartItems
          .filter((ci) => !isPaintProduct(ci.item))
          .map((ci) => ({ name: ci.item.productName, quantity: ci.quantity, unit: 'Unidades' })),
        estimatedMaterialCostCOP: totalCostCOP,
        preparationAdvice: ['Limpiar superficie libre de polvo y grasa'],
        applicationInstructions: ['Aplicar según ficha técnica de cada producto'],
        warrantyDurationYears: 5,
      },
      inventoryAllocation: {
        warehouseCity: mainItem.item.warehouseCity,
        warehouseName: mainItem.item.warehouseName,
        batchNumber: mainItem.item.batchCode || 'LOTE-MULTI-2026',
        stockConfirmed: true,
        dispatchReadyDate: new Date().toISOString().substring(0, 10),
      },
      packagingDetails: {
        packerName: 'Javier Gómez (CEDI Rionegro)',
        batchCode: mainItem.item.batchCode || 'LOTE-MULTI-2026',
        checkedSupplies: [],
        cuñetesPacked: totalCuñetes,
        galonesPacked: Math.max(0, totalGalons - totalCuñetes * 5),
        weightKg: Math.max(10, Math.round(totalGalons * 5 + cartItems.length * 2)),
        qualitySealAttached: false,
        qrInspectionCode: `QR-PKG-${codeNumber}`,
        status: 'pendiente',
        notes: `Pedido multi-ítem con ${cartItems.length} productos diferentes solicitados por el cliente.`,
      },
      deliveryDetails: {
        driverName: 'Wilson Cañas',
        driverPhone: '3123334455',
        vehiclePlate: 'WTL-582',
        vehicleType: 'Turbo FTR 4.5T Pintuco Express',
        routeStatus: 'en_ruta',
        currentLocation: `En muelle CEDI ${mainItem.item.warehouseCity} listo para alistamiento`,
        deliveryAddress: cartDeliveryAddress || `${currentUser.city || 'Medellín'}, Colombia`,
        departedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      },
    };

    setCartItems([]);
    setIsCartOpen(false);
    handleRequestCreated(newReq);
  };

  useEffect(() => {
    if (initialPendingData?.catalogItem) {
      setSelectedCatalogItem(initialPendingData.catalogItem);
      setActiveTab('nueva_solicitud');
    } else if (initialPendingData) {
      setSelectedCatalogItem(null);
      setActiveTab('nueva_solicitud');
    }
  }, [initialPendingData]);

  // Filtrar estrictamente solo los pedidos que pertenecen a este cliente
  const clientRequests = requests.filter((r) => {
    if (r.clientEmail && currentUser.email) {
      if (r.clientEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
    }
    if (currentUser.email?.toLowerCase() === 'cliente@pintuco.com') {
      return (
        r.clientEmail === 'cliente@pintuco.com' ||
        r.clientName?.toLowerCase().includes('luisa') ||
        r.clientName?.toLowerCase().includes('bolívar')
      );
    }
    if (r.clientName && currentUser.name && r.clientName.toLowerCase() === currentUser.name.toLowerCase()) {
      return true;
    }
    return false;
  });

  const selectedRequest = clientRequests.find((r) => r.id === selectedReqId) || clientRequests[0];

  const handleRequestCreated = (newReq: PaintRequest) => {
    onSubmitRequest(newReq);
    setSelectedReqId(newReq.id);
    setActiveTab('mis_pedidos');
    const itemsCount = newReq.items?.length || 1;
    setOrderSuccessBanner(
      `¡Solicitud ${newReq.requestCode} generada exitosamente! Se descontaron ${itemsCount} producto(s) del inventario CEDI en tiempo real y tu pedido ya está activo en el portal con trazabilidad oficial.`
    );
  };

  // Filtrar catálogo de inventario restringido estrictamente a la Ciudad Principal del cliente
  const filteredCatalog = clientInventory.filter((item) => {
    const isPaint = isPaintProduct(item);
    const matchesSearch =
      item.productName.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.warehouseCity.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(catalogSearch.toLowerCase());

    let matchesCategory = true;
    if (catalogCategory === 'pinturas') {
      matchesCategory = isPaint;
    } else if (catalogCategory === 'herramientas') {
      matchesCategory = !isPaint && (item.category.toLowerCase().includes('herramienta') || item.unitType === 'herramienta');
    } else if (catalogCategory === 'insumos') {
      matchesCategory = !isPaint && (item.category.toLowerCase().includes('insumo') || item.category.toLowerCase().includes('proteccion') || item.unitType === 'insumo');
    } else if (catalogCategory === 'disponibles') {
      const units = isPaint ? (item.cuñetesAvailable * 5 + item.galonesAvailable) : (item.unitsAvailable ?? item.galonesAvailable ?? 0);
      matchesCategory = units > 0 && item.status !== 'agotado';
    } else if (catalogCategory !== 'todos') {
      matchesCategory = item.category.toLowerCase().includes(catalogCategory.toLowerCase());
    }

    return matchesSearch && matchesCategory;
  });

  const paintsInCatalog = clientInventory.filter(i => isPaintProduct(i)).length;
  const toolsInCatalog = clientInventory.filter(i => !isPaintProduct(i) && (i.category.toLowerCase().includes('herramienta') || i.unitType === 'herramienta')).length;
  const suppliesInCatalog = clientInventory.filter(i => !isPaintProduct(i) && !i.category.toLowerCase().includes('herramienta') && i.unitType !== 'herramienta').length;

  return (
    <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto space-y-6" id="client-dashboard-root">
      {/* Notificación de Solicitud Exitosa */}
      {orderSuccessBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between gap-3 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold">{orderSuccessBanner}</p>
          </div>
          <button
            type="button"
            onClick={() => setOrderSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner Superior Corporativo de Gestión de Proyectos */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-7 shadow-xs border border-slate-800 relative overflow-hidden">
        {/* Glow sutil institucional */}
        <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/90 text-white flex items-center justify-center font-bold shadow-xs shrink-0 border border-blue-400/30">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-400/30 font-semibold">
                  PORTAL CLIENTE · CEDI {clientCity.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400 font-medium">· Trazabilidad & Formulación Oficial</span>
              </div>
              <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white mt-1 tracking-tight">
                Bienvenido, {currentUser.name}
              </h1>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mt-0.5">
                Plataforma de despacho oficial Pintuco. Monitorea tus pedidos en tiempo real o formula recubrimientos técnicos con certificación de calidad.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenCalculator}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700/80 text-slate-100 font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Calculadora m²</span>
            </button>
          </div>
        </div>

        {/* Selector de Pestañas: Mis Pedidos, Nueva Solicitud, Catálogo, Accesos, Correos */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('mis_pedidos')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                activeTab === 'mis_pedidos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mis Pedidos & Seguimiento</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === 'mis_pedidos' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {clientRequests.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('nueva_solicitud')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                activeTab === 'nueva_solicitud'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Crear Pintura / Nueva Solicitud</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('catalogo_inventario')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                activeTab === 'catalogo_inventario'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Catálogo CEDI {clientCity}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${activeTab === 'catalogo_inventario' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {clientInventory.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mis_accesos')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                activeTab === 'mis_accesos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mis Accesos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido según pestaña */}
      {activeTab === 'nueva_solicitud' ? (
        <div className="w-full">
          <RequestView
            currentUser={currentUser}
            inventoryList={clientInventory}
            selectedCatalogItem={selectedCatalogItem}
            initialPendingData={initialPendingData}
            onClearInitialPendingData={onClearInitialPendingData}
            onClearSelectedCatalogItem={() => {
              setSelectedCatalogItem(null);
              if (onClearInitialPendingData) onClearInitialPendingData();
            }}
            onSubmitRequest={(newReq) => {
              setSelectedCatalogItem(null);
              if (onClearInitialPendingData) onClearInitialPendingData();
              handleRequestCreated(newReq);
            }}
            onOpenAiAssistant={onOpenAiAssistant}
            onLogout={onLogout}
            onViewTransversal={onViewTransversal}
            onAddToCart={handleAddToCart}
            onOpenCart={handleOpenCartModal}
            onNavigateCatalog={() => setActiveTab('catalogo_inventario')}
          />
        </div>
      ) : activeTab === 'catalogo_inventario' ? (
        /* Catálogo Oficial Pintuco & Disponibilidad en Bodega CEDI - Experiencia Tienda Real */
        <div className="space-y-5" id="client-paint-store-catalog">
          {/* Header de la Tienda de Pinturas */}
          <div className="bg-gradient-to-r from-[#2c3844] via-[#1f2937] to-[#111827] rounded-2xl p-6 text-white border border-[#e5e0d3]/30 shadow-md relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-52 h-52 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-400/20 text-sky-200 border border-sky-400/40 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-300 animate-pulse" />
                    TIENDA OFICIAL COLORLINK · STOCK EN VIVO CEDI
                  </span>
                  <span className="text-xs text-white/60">5 Centros de Distribución Nacional</span>
                </div>
                <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-white">
                  Catálogo Oficial de Pinturas, Recubrimientos & Herramientas
                </h2>
                <p className="text-xs text-blue-100/80 mt-1 max-w-2xl leading-relaxed">
                  Todo lo que ves en este catálogo está en inventario real y listo para compra. Selecciona colores para pinturas o compra herramientas por unidad con despacho directo a pie de obra.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenCartModal}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                    cartItems.length > 0
                      ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold ring-2 ring-blue-400/40'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  id="btn-open-cart-header"
                >
                  <ShoppingCart className="w-4 h-4 text-white" />
                  <span>Mi Pedido ({cartItems.length} {cartItems.length === 1 ? 'ítem' : 'ítems'})</span>
                  {cartItems.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-mono font-bold">
                      ${cartItems.reduce((acc, ci) => acc + ci.totalCostCOP, 0).toLocaleString('es-CO')}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('nueva_solicitud')}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-white" />
                  <span>Formulación Técnica</span>
                </button>
              </div>
            </div>

            {/* 4 Métricas de Inventario en Tiempo Real */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10 relative z-10">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-mono text-white/60 uppercase block">Total Catálogo {clientCity}</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">{clientInventory.length} Referencias</span>
                <span className="text-[10px] text-sky-300">100% verificadas en CEDI {clientCity}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-mono text-white/60 uppercase block">Pinturas & Esmaltes</span>
                <span className="text-lg font-bold font-mono text-sky-300 mt-0.5 block">{paintsInCatalog} Líneas</span>
                <span className="text-[10px] text-white/60">Con carta de colores</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-mono text-white/60 uppercase block">Herramientas & Insumos</span>
                <span className="text-lg font-bold font-mono text-amber-300 mt-0.5 block">{toolsInCatalog + suppliesInCatalog} Ítems</span>
                <span className="text-[10px] text-white/60">Venta directa por unidad</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-mono text-white/60 uppercase block">Despacho en {clientCity}</span>
                <span className="text-lg font-bold font-mono text-[#27cbd2] mt-0.5 block">24 - 48 Horas</span>
                <span className="text-[10px] text-white/60">A pie de obra en {clientCity}</span>
              </div>
            </div>
          </div>

          {/* Barra de Filtros & Búsqueda Estilo E-Commerce */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            {/* Banner Oficial de Restricción Geográfica para Clientes */}
            <div className="p-3 bg-gradient-to-r from-blue-50/90 to-sky-50 border border-blue-200 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs text-blue-950">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  <strong>Inventario Exclusivo para tu Ciudad Principal ({clientCity}):</strong> Solo puedes consultar y ordenar productos disponibles en la bodega <strong>CEDI {clientCity}</strong> para garantizar despacho inmediato en tu zona de obra.
                </span>
              </div>
              <span className="text-[10.5px] font-mono font-bold bg-white text-blue-900 px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                {clientInventory.length} Referencias Disponibles en {clientCity}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Buscador inteligente */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder={`Buscar por nombre (ej. Viniltex, Koraza, Rodillo) en CEDI ${clientCity}...`}
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Indicador Fijo de CEDI Asignado a la Ciudad del Cliente */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl shrink-0">
                <MapPin className="w-4 h-4 text-blue-700 shrink-0" />
                <div className="text-left">
                  <span className="text-xs font-bold text-blue-950 block font-mono">
                    CEDI {clientCity}
                  </span>
                  <span className="text-[10px] text-blue-700 block font-medium">
                    Sede Exclusiva de tu Ciudad
                  </span>
                </div>
              </div>
            </div>

            {/* Categorías en chips de píldora */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCatalogCategory('todos')}
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  catalogCategory === 'todos'
                    ? 'bg-[#2c3844] text-white border-[#2c3844] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                Todos los Productos ({clientInventory.length})
              </button>

              <button
                type="button"
                onClick={() => setCatalogCategory('pinturas')}
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  catalogCategory === 'pinturas'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-teal-500" />
                <span>Pinturas & Esmaltes ({paintsInCatalog})</span>
              </button>

              <button
                type="button"
                onClick={() => setCatalogCategory('herramientas')}
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  catalogCategory === 'herramientas'
                    ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-500" />
                <span>Herramientas & Brochas ({toolsInCatalog})</span>
              </button>

              <button
                type="button"
                onClick={() => setCatalogCategory('insumos')}
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  catalogCategory === 'insumos'
                    ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Boxes className="w-3.5 h-3.5 text-indigo-500" />
                <span>Insumos & Protección ({suppliesInCatalog})</span>
              </button>

              <button
                type="button"
                onClick={() => setCatalogCategory('disponibles')}
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  catalogCategory === 'disponibles'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>En Stock Inmediato</span>
              </button>
            </div>
          </div>

          {/* Grilla de Productos con Diseño Real de E-Commerce de Pinturas */}
          {filteredCatalog.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Boxes className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No se encontraron productos con estos filtros</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Prueba buscando con otro término o limpia los filtros para ver todo el inventario disponible.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCatalogSearch('');
                  setCatalogCategory('todos');
                  setCatalogWarehouseFilter('todos');
                }}
                className="px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-xl hover:bg-teal-800 transition-colors"
              >
                Restablecer Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredCatalog.map((item) => {
                const isPaint = isPaintProduct(item);
                const colors = item.availableColors && item.availableColors.length > 0 ? item.availableColors : DEFAULT_PAINT_COLORS;

                // Cálculo de disponibilidad y existencias
                const cuñetes = item.cuñetesAvailable || 0;
                const galones = item.galonesAvailable || 0;
                const units = item.unitsAvailable ?? item.galonesAvailable ?? item.totalLiters ?? 0;
                const isAvailable = isPaint ? ((cuñetes > 0 || galones > 0) && item.status !== 'agotado') : (units > 0 && item.status !== 'agotado');
                const priceGalon = item.pricePerGalon || 115000;
                const priceCuñete = Math.round(priceGalon * 5 * 0.92);
                const unitPrice = item.unitPrice || item.pricePerGalon || 28000;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden group ${
                      isAvailable
                        ? 'border-slate-200 bg-white hover:border-teal-500 hover:shadow-md'
                        : 'border-red-200 bg-red-50/20 opacity-80'
                    }`}
                  >
                    <div>
                      {/* Imagen Real del Producto con Badges Flotantes */}
                      <div className="relative w-full h-44 overflow-hidden bg-slate-100 flex items-center justify-center">
                        <img
                          src={getProductImage(item)}
                          alt={item.productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-black/20 to-black/30" />

                        {/* Badges Flotantes */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          {isPaint ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono uppercase px-2.5 py-1 rounded-full bg-teal-800/90 backdrop-blur-xs text-white shadow-xs border border-teal-400/30">
                              <Palette className="w-3 h-3 text-teal-300" />
                              Pintura
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono uppercase px-2.5 py-1 rounded-full bg-amber-800/90 backdrop-blur-xs text-white shadow-xs border border-amber-400/30">
                              <Wrench className="w-3 h-3 text-amber-300" />
                              Herramienta
                            </span>
                          )}
                        </div>

                        <span
                          className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-xs backdrop-blur-xs ${
                            isAvailable
                              ? item.status === 'critico'
                                ? 'bg-amber-600/90 text-white border-amber-300'
                                : 'bg-emerald-600/90 text-white border-emerald-300'
                              : 'bg-red-600/90 text-white border-red-300'
                          }`}
                        >
                          {isAvailable ? (item.status === 'critico' ? 'Stock Crítico' : 'Disponible') : 'Agotado'}
                        </span>

                        {/* Pie de Imagen con SKU y Ciudad CEDI */}
                        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px]">
                          <span className="font-mono bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] border border-white/20">
                            {item.sku}
                          </span>
                          <span className="flex items-center gap-1 text-slate-200 text-[10.5px] font-medium bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded">
                            <MapPin className="w-3 h-3 text-[#27cbd2]" />
                            {item.warehouseCity}
                          </span>
                        </div>
                      </div>

                      {/* Información del Producto */}
                      <div className="p-4 pb-2">
                        <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-teal-700 transition-colors line-clamp-2">
                          {item.productName}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
                          <span>{item.category}</span>
                          {item.finish && (
                            <>
                              <span>·</span>
                              <span className="font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded text-[10px] border border-teal-200/60">
                                {item.finish}
                              </span>
                            </>
                          )}
                        </p>
                        {item.description && (
                          <p className="text-[11.5px] text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* SECCIÓN ESPECIAL PARA PINTURAS: CARTA DE COLORES HABILITADOS */}
                      {isPaint ? (
                        <div className="px-4 py-2.5 mx-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 font-semibold flex items-center gap-1">
                              <Palette className="w-3 h-3 text-teal-600" />
                              Colores Habilitados ({colors.length}):
                            </span>
                            <span className="text-[10px] text-teal-700 font-mono font-bold">
                              {colors[0]?.name.split(' ')[0]}
                            </span>
                          </div>
                          
                          {/* Muestrario de Colores Interactivo */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {colors.slice(0, 7).map((c, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setQuickBuyColor(c);
                                  handleOpenQuickBuy(item);
                                }}
                                className="w-5 h-5 rounded-full border-2 border-white shadow-2xs hover:scale-125 transition-transform cursor-pointer relative group/dot"
                                style={{ backgroundColor: c.hex }}
                                title={`Seleccionar color ${c.name} (${c.hex})`}
                              >
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/dot:block z-20 px-2 py-0.5 rounded bg-slate-900 text-white text-[9px] font-mono whitespace-nowrap shadow-md">
                                  {c.name}
                                </span>
                              </button>
                            ))}
                            {colors.length > 7 && (
                              <span className="text-[10px] text-slate-400 font-mono font-bold">
                                +{colors.length - 7} más
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* AVISO PARA HERRAMIENTAS / INSUMOS: VENTA DIRECTA POR UNIDAD */
                        <div className="px-4 py-2 mx-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 flex items-center justify-between">
                          <span className="font-medium">Venta directa por unidad</span>
                          <span className="font-mono font-bold text-amber-800">No requiere formulación</span>
                        </div>
                      )}

                      {/* Existencias y Stock CEDI */}
                      <div className="px-4 py-2 text-xs flex items-center justify-between border-t border-slate-100 mt-3 font-mono">
                        <span className="text-[11px] text-slate-500">Existencias CEDI:</span>
                        {isPaint ? (
                          <span className={`font-bold ${isAvailable ? 'text-teal-900' : 'text-red-600'}`}>
                            {isAvailable ? `${cuñetes} Cuñetes / ${galones} Gal` : '0 existencias'}
                          </span>
                        ) : (
                          <span className={`font-bold ${isAvailable ? 'text-amber-900' : 'text-red-600'}`}>
                            {isAvailable ? `${units} ${item.unitMeasure || 'Unidades'} en bodega` : '0 unidades'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer de Tarjeta con Precios y Botones de Compra */}
                    <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block">
                            {isPaint ? 'Precio Oficial:' : 'Precio Unitario:'}
                          </span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-bold font-mono text-slate-900">
                              ${isPaint ? priceGalon.toLocaleString('es-CO') : unitPrice.toLocaleString('es-CO')} COP
                            </span>
                            <span className="text-[10px] text-slate-500">
                              / {isPaint ? 'Galón' : item.unitMeasure || 'Unidad'}
                            </span>
                          </div>
                        </div>

                        {isPaint && (
                          <div className="text-right">
                            <span className="text-[9.5px] text-slate-400 block">Cuñete 5 Gal:</span>
                            <span className="text-xs font-bold font-mono text-teal-800">
                              ${priceCuñete.toLocaleString('es-CO')} COP
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Botones de Acción */}
                      {isAvailable ? (
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenQuickBuy(item)}
                              className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                              title="Configurar y añadir al pedido multi-ítem"
                              id={`btn-add-order-${item.sku}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Añadir al Pedido</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenQuickBuy(item)}
                              className="w-full py-2 bg-[#0F1E36] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                              title="Comprar directamente desde el catálogo"
                              id={`btn-quick-buy-${item.sku}`}
                            >
                              <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
                              <span>Comprar Directo</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCatalogItem(item);
                              setActiveTab('nueva_solicitud');
                            }}
                            className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            title="Formular con cálculo técnico de m² y mano de obra"
                          >
                            <Sliders className="w-3 h-3 text-teal-600" />
                            <span>Formular por m²</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-full py-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                          <Ban className="w-4 h-4 text-red-500" />
                          <span>Agotado temporalmente en CEDI</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MODAL DE COMPRA RÁPIDA DIRECTA (QUICK BUY) - DIMENSIONES Y ESTILO PINTUCO OFICIAL */}
          {quickBuyItem && (
            <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-scale-in">
                {/* Header del Modal */}
                <div className="bg-gradient-to-r from-[#0F1E36] via-[#1E2E4B] to-[#0F1E36] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                      {isPaintProduct(quickBuyItem) ? <Palette className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                        COMPRA DIRECTA · CEDI PINTUCO
                      </span>
                      <h3 className="text-base font-bold text-white leading-tight">
                        {quickBuyItem.productName}
                      </h3>
                      <span className="text-xs text-slate-300 font-mono">SKU: {quickBuyItem.sku}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuickBuyItem(null)}
                    className="text-white/70 hover:text-white text-lg font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Imagen del Producto en el Modal - Altura compacta para no saturar la pantalla */}
                <div className="relative h-24 sm:h-28 w-full shrink-0 overflow-hidden bg-slate-100 border-b border-slate-200">
                  <img
                    src={getProductImage(quickBuyItem)}
                    alt={quickBuyItem.productName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-white text-xs">
                    <span className="bg-black/60 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] font-mono border border-white/20">
                      CEDI {quickBuyItem.warehouseCity}
                    </span>
                    <span className="text-amber-300 font-bold text-xs bg-slate-900/70 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-amber-400/30">
                      {quickBuyItem.finish ? `Acabado ${quickBuyItem.finish}` : quickBuyItem.category}
                    </span>
                  </div>
                </div>

                {/* Formulario de Compra Rápida - Scrollable y Proporcionado */}
                <div className="p-4 sm:p-5 space-y-3.5 flex-1 min-h-0 overflow-y-auto">
                  {quickBuyError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                      <Ban className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{quickBuyError}</span>
                    </div>
                  )}

                  {/* CASO PINTURA: SELECCIÓN DE COLOR Y FORMATO */}
                  {isPaintProduct(quickBuyItem) ? (
                    <>
                      {/* Selector de Color de la Pintura */}
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center justify-between">
                          <span>1. Elige el Color de la Pintura:</span>
                          <span className="text-amber-700 font-mono font-bold text-[11px] flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: quickBuyColor.hex }} />
                            {quickBuyColor.name}
                          </span>
                        </label>

                        <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50">
                          {(quickBuyItem.availableColors && quickBuyItem.availableColors.length > 0 ? quickBuyItem.availableColors : DEFAULT_PAINT_COLORS).map((c, i) => {
                            const isSelected = quickBuyColor.name === c.name;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setQuickBuyColor(c)}
                                className={`p-1.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/30 shadow-2xs font-semibold'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <span
                                  className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-2xs"
                                  style={{ backgroundColor: c.hex }}
                                />
                                <span className="text-[11px] text-slate-800 truncate">
                                  {c.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selector de Formato: Cuñete (5 Gal) vs Galón */}
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          2. Formato de Presentación:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setQuickBuyFormat('galon')}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              quickBuyFormat === 'galon'
                                ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-400'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-xs font-bold text-slate-900 block">Galón Individual</span>
                            <span className="text-[10.5px] text-slate-500 block">3.785 Litros</span>
                            <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                              ${(quickBuyItem.pricePerGalon || 115000).toLocaleString('es-CO')} COP
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setQuickBuyFormat('cuñete')}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                              quickBuyFormat === 'cuñete'
                                ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-400'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl">
                              -8% AHORRO
                            </span>
                            <span className="text-xs font-bold text-slate-900 block">Cuñete (5 Galones)</span>
                            <span className="text-[10.5px] text-slate-500 block">18.9 Litros</span>
                            <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                              ${Math.round((quickBuyItem.pricePerGalon || 115000) * 5 * 0.92).toLocaleString('es-CO')} COP
                            </span>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* CASO MATERIAL/HERRAMIENTA: VENTA POR UNIDAD */
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                      <div className="flex items-center gap-2 text-amber-900 font-bold">
                        <Wrench className="w-4 h-4 text-amber-700" />
                        <span>Venta Directa por Unidad</span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Este producto se despacha por unidad física ({quickBuyItem.unitMeasure || 'Pieza/Rollo'}). No requiere formulación de color ni manos de pintura.
                      </p>
                      <div className="font-mono text-xs font-bold text-amber-950 pt-1">
                        Precio Unitario: ${(quickBuyItem.unitPrice || quickBuyItem.pricePerGalon || 28000).toLocaleString('es-CO')} COP
                      </div>
                    </div>
                  )}

                  {/* Contador de Cantidad */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>Cantidad a Pedir:</span>
                      <span className="text-slate-500 font-normal text-[11px]">
                        Disponibles: {isPaintProduct(quickBuyItem) ? (quickBuyFormat === 'cuñete' ? `${quickBuyItem.cuñetesAvailable} Cuñetes` : `${quickBuyItem.galonesAvailable} Galones`) : `${quickBuyItem.unitsAvailable ?? quickBuyItem.galonesAvailable} Unidades`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                        <button
                          type="button"
                          onClick={() => setQuickBuyQty(Math.max(1, quickBuyQty - 1))}
                          className="px-3.5 py-1.5 hover:bg-slate-200 text-slate-700 font-bold text-base transition-colors"
                        >
                          -
                        </button>
                        <span className="px-4 py-1.5 font-mono font-bold text-sm text-slate-900 min-w-[45px] text-center bg-white">
                          {quickBuyQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuickBuyQty(quickBuyQty + 1)}
                          className="px-3.5 py-1.5 hover:bg-slate-200 text-slate-700 font-bold text-base transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-xs text-slate-600 font-semibold">
                        {isPaintProduct(quickBuyItem) ? (quickBuyFormat === 'cuñete' ? 'Cuñete(s) de 5 Gal' : 'Galón(es)') : `${quickBuyItem.unitMeasure || 'Unidad(es)'}`}
                      </span>
                    </div>
                  </div>

                  {/* Dirección de Entrega y Notas */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Dirección de Despacho en Obra:
                      </label>
                      <input
                        type="text"
                        value={quickBuyAddress}
                        onChange={(e) => setQuickBuyAddress(e.target.value)}
                        placeholder="Ej. Cra 43A # 18 Sur - 135, Torre 2"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Notas para el Despachador (opcional):
                      </label>
                      <input
                        type="text"
                        value={quickBuyNotes}
                        onChange={(e) => setQuickBuyNotes(e.target.value)}
                        placeholder="Ej. Entregar en portería principal de obra antes de mediodía"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Resumen Económico */}
                  <div className="p-3.5 rounded-xl bg-[#0F1E36] text-white space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>CEDI Origen:</span>
                      <span className="font-semibold text-white">{quickBuyItem.warehouseCity}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Subtotal Material:</span>
                      <span className="font-mono text-white">
                        ${(
                          (isPaintProduct(quickBuyItem)
                            ? (quickBuyFormat === 'cuñete' ? Math.round((quickBuyItem.pricePerGalon || 115000) * 5 * 0.92) : (quickBuyItem.pricePerGalon || 115000))
                            : (quickBuyItem.unitPrice || quickBuyItem.pricePerGalon || 28000)) * quickBuyQty
                        ).toLocaleString('es-CO')} COP
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Flete CEDI Express:</span>
                      <span className="font-mono text-emerald-400 font-bold">¡GRATIS POR LANZAMIENTO!</span>
                    </div>
                    <div className="pt-1.5 border-t border-white/20 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Total a Facturar:</span>
                      <span className="text-base font-black font-mono text-amber-400">
                        ${(
                          (isPaintProduct(quickBuyItem)
                            ? (quickBuyFormat === 'cuñete' ? Math.round((quickBuyItem.pricePerGalon || 115000) * 5 * 0.92) : (quickBuyItem.pricePerGalon || 115000))
                            : (quickBuyItem.unitPrice || quickBuyItem.pricePerGalon || 28000)) * quickBuyQty
                        ).toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer del Modal Quick Buy - Pinned y siempre visible */}
                <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuickBuyItem(null)}
                    className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!quickBuyItem) return;
                        const isPaint = isPaintProduct(quickBuyItem);
                        handleAddToCart(
                          quickBuyItem,
                          quickBuyQty,
                          isPaint ? quickBuyFormat : 'unidad',
                          isPaint ? quickBuyColor : undefined
                        );
                        setQuickBuyItem(null);
                      }}
                      className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ring-1 ring-amber-500/40"
                      id="btn-add-cart-from-modal"
                    >
                      <Plus className="w-4 h-4" />
                      <span>➕ Añadir al Pedido</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmQuickBuy}
                      className="px-3.5 py-2 bg-[#0F1E36] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      id="btn-confirm-quick-buy"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Comprar Solo Este Ítem</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TOAST DE FEEDBACK DE CARRITO */}
          {cartToast && (
            <div className="fixed top-20 right-6 z-50 bg-[#0F1E36] text-white px-4 py-3 rounded-xl shadow-xl border border-amber-400/50 flex items-center gap-2 text-xs font-semibold animate-slide-in">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{cartToast}</span>
              <button
                type="button"
                onClick={() => setCartToast(null)}
                className="ml-2 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* BARRA FLOTANTE DE PEDIDO EN CURSO (MULTI-ÍTEM) - ESTILO PINTUCO */}
          {cartItems.length > 0 && (
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-xl bg-[#0F1E36] text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl border border-amber-400/50 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 animate-slide-up backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
                  <ShoppingCart className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Tu Pedido Pintuco:</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black">
                      {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate max-w-xs sm:max-w-sm">
                    {cartItems.map((c) => `${c.quantity}x ${c.item.productName.split(' ')[0]}`).join(', ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-slate-300 block font-mono">Total COP:</span>
                  <span className="font-mono font-black text-amber-300 text-sm">
                    ${cartItems.reduce((acc, ci) => acc + ci.totalCostCOP, 0).toLocaleString('es-CO')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCartModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  id="btn-view-cart-floating"
                >
                  <span>Ver Pedido y Finalizar</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* MODAL / DRAWER DEL CARRITO MULTI-ÍTEM - DIMENSIONES Y ESTILO PINTUCO */}
          {isCartOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl md:max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
                {/* Header del Carrito */}
                <div className="bg-gradient-to-r from-[#0F1E36] via-[#1E2E4B] to-[#0F1E36] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                      <ShoppingCart className="w-5 h-5 text-slate-950" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                        PEDIDO MULTI-ÍTEM · CEDI PINTUCO
                      </span>
                      <h3 className="text-base font-bold text-white leading-tight">
                        Mi Pedido ({cartItems.length} {cartItems.length === 1 ? 'Producto' : 'Productos'})
                      </h3>
                      <span className="text-xs text-slate-300">
                        Combina pinturas formuladas con herramientas e insumos oficiales.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="text-white/70 hover:text-white text-lg font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Contenido del Carrito */}
                <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-3.5">
                  {cartItems.length === 0 ? (
                    <div className="p-10 text-center space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <ShoppingCart className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Tu pedido aún no tiene productos</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Explora el catálogo oficial de Pintuco y haz clic en "Añadir al Pedido" en cada pintura, brocha o rodillo que necesites para tu obra.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCartOpen(false)}
                        className="px-4 py-2 bg-[#0F1E36] hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Explorar Catálogo
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Lista de Ítems */}
                      <div className="space-y-2.5">
                        {cartItems.map((ci) => {
                          const isPaint = isPaintProduct(ci.item);
                          return (
                            <div
                              key={ci.id}
                              className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                                  <img
                                    src={getProductImage(ci.item)}
                                    alt={ci.item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                                    <span>{ci.item.productName}</span>
                                    {isPaint && ci.selectedColor && (
                                      <span
                                        className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                                        style={{ backgroundColor: ci.selectedColor.hex }}
                                        title={ci.selectedColor.name}
                                      />
                                    )}
                                  </div>

                                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                                    <span className="font-semibold text-slate-800">
                                      {ci.format === 'cuñete' ? 'Cuñete (5 Gal)' : ci.format === 'galon' ? 'Galón (1 Gal)' : ci.format === 'cuarto' ? '1/4 Gal' : 'Unidad'}
                                    </span>
                                    {isPaint && ci.selectedColor && (
                                      <span>· Color: <strong>{ci.selectedColor.name}</strong></span>
                                    )}
                                    <span>· CEDI {ci.item.warehouseCity}</span>
                                  </div>

                                  <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                                    Precio unit: ${ci.unitPrice.toLocaleString('es-CO')} COP
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                                {/* Controles de Cantidad */}
                                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCartQty(ci.id, -1)}
                                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold text-sm cursor-pointer"
                                    title="Disminuir"
                                  >
                                    -
                                  </button>
                                  <span className="px-3 py-1 font-mono font-bold text-slate-900 text-xs min-w-[28px] text-center">
                                    {ci.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCartQty(ci.id, 1)}
                                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold text-sm cursor-pointer"
                                    title="Aumentar"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Subtotal por Ítem */}
                                <div className="text-right min-w-[85px]">
                                  <span className="font-mono font-bold text-slate-900 text-sm block">
                                    ${ci.totalCostCOP.toLocaleString('es-CO')}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono block">COP</span>
                                </div>

                                {/* Botón Eliminar */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromCart(ci.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Quitar este producto del pedido"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Dirección de Envío y Notas */}
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                        <span className="text-xs font-bold text-slate-800 uppercase font-mono block">
                          Datos de Entrega para este Pedido Completo:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                              Dirección de Despacho en Obra:
                            </label>
                            <input
                              type="text"
                              value={cartDeliveryAddress}
                              onChange={(e) => setCartDeliveryAddress(e.target.value)}
                              placeholder="Ej. Cra 43A # 18 Sur - 135, Medellín"
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                              Notas de entrega / portería:
                            </label>
                            <input
                              type="text"
                              value={cartDeliveryNotes}
                              onChange={(e) => setCartDeliveryNotes(e.target.value)}
                              placeholder="Ej. Recibe maestro de obra Juan Pérez"
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Resumen Total */}
                      <div className="p-3.5 bg-[#0F1E36] text-white rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Total Referencias:</span>
                          <span className="font-semibold text-white">{cartItems.length} referencias ({cartItems.reduce((acc, ci) => acc + ci.quantity, 0)} unidades/envases)</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Subtotal Materiales:</span>
                          <span className="font-mono text-white">
                            ${cartItems.reduce((acc, ci) => acc + ci.totalCostCOP, 0).toLocaleString('es-CO')} COP
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Flete Consolidado Pintuco:</span>
                          <span className="font-mono text-emerald-400 font-bold">¡GRATIS POR LANZAMIENTO!</span>
                        </div>
                        <div className="pt-1.5 border-t border-white/20 flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                            Total General del Pedido:
                          </span>
                          <span className="text-lg font-black font-mono text-amber-400">
                            ${cartItems.reduce((acc, ci) => acc + ci.totalCostCOP, 0).toLocaleString('es-CO')} COP
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer del Carrito - Pinned */}
                {cartItems.length > 0 && (
                  <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      + Seguir Agregando Productos
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleClearCart}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Vaciar
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmCartOrder}
                        className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
                        id="btn-confirm-multi-item-order"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        <span>Confirmar Pedido Completo ({cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'})</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'mis_accesos' ? (
        <div className="space-y-6">
          {/* Header de Bienvenida y Estado de la Cuenta */}
          <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-teal-500/30 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    PORTAL DE CLIENTE · ACCESO COMPLETO HABILITADO
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Cuenta Activa
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Bienvenido a ColorLink, {currentUser.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Esta es la matriz oficial de servicios y herramientas a las que tienes acceso exclusivo como cliente y contratista de ColorLink.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('nueva_solicitud')}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Crear Nueva Solicitud</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('catalogo_inventario')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
                >
                  <Boxes className="w-4 h-4" />
                  <span>Ver Catálogo</span>
                </button>
              </div>
            </div>

            {/* Credenciales de Acceso */}
            <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Cliente / Empresa</span>
                <span className="font-semibold text-white truncate block">{currentUser.company || currentUser.name}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Correo Registrado</span>
                <span className="font-semibold text-white truncate block">{currentUser.email}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Sede Asignada</span>
                <span className="font-semibold text-white truncate block">{currentUser.city || 'Medellín'}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Pedidos en Historial</span>
                <span className="font-bold text-sky-300 block">{clientRequests.length} órdenes</span>
              </div>
            </div>
          </div>

          {/* Tarjetas de Accesos y Módulos Disponibles */}
          <div>
            <h3 className="text-sm font-bold font-mono uppercase text-navy-900 tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
              Módulos y Servicios Habilitados para tu Cuenta
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: Solicitudes y Cotizaciones */}
              <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    MÓDULO 1 · COTIZACIONES
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">Nueva Solicitud y Cubicaje Técnico</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Registra tu obra o proyecto, superficie (m²), manos de pintura y calcula automáticamente cuñetes (5 gal) y galones requeridos con costo estimado en COP.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('nueva_solicitud')}
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Crear Solicitud de Pintura
                </button>
              </div>

              {/* Card 2: Catálogo de Inventario CEDI */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-3">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    MÓDULO 2 · INVENTARIO
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">Catálogo Oficial & Existencias en CEDIs</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Consulta el stock real disponible en plantas y bodegas (Rionegro, Siberia, Acopi Yumbo y Caribe) de Viniltex, Koraza, Pintulux y líneas industriales.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('catalogo_inventario')}
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  Explorar Catálogo CEDI {clientCity} ({clientInventory.length} SKUs)
                </button>
              </div>

              {/* Card 3: Calculadora Técnica */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center mb-3">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    MÓDULO 3 · RENDIMIENTO
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">Calculadora Técnica de Rendimiento</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Simula manos necesarias, sólidos por volumen, espesores en mils de película seca y rendimiento teórico vs práctico según la porosidad de la superficie.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenCalculator}
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Abrir Calculadora Técnica
                </button>
              </div>

              {/* Card 4: Asistente IA Pintuco */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center mb-3">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    MÓDULO 4 · INTELIGENCIA ARTIFICIAL
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">Asistente Técnico Especializado IA</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Asesoría 24/7 impulsada por IA para recomendaciones sobre patologías de muros, selladores de humedad, imprimantes epóxicos y tiempos de secado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenAiAssistant}
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Consultar Asistente IA
                </button>
              </div>

              {/* Card 5: Trazabilidad en Vivo */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mb-3">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    MÓDULO 5 · LOGÍSTICA
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">Trazabilidad en Vivo de Pedidos</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Seguimiento en tiempo real: asignación de operario de empaque en bodega, verificación de lote, placa del vehículo de transporte y confirmación de entrega en obra.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('mis_pedidos')}
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Truck className="w-3.5 h-3.5" />
                  {clientRequests.length > 0 ? `Ver Mis ${clientRequests.length} Pedidos` : 'Ver Panel de Trazabilidad'}
                </button>
              </div>

              {/* Card 6: Facturación & Garantía */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    MÓDULO 6 · LEGAL & CALIDAD
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">Facturación DIAN & Garantía 5 Años</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Acceso a facturación electrónica legal con código CUFE y QR DIAN, junto con la emisión del Certificado Oficial de Calidad y Adherencia firmado por Dirección Técnica Pintuco.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('mis_pedidos')}
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Ver Mis Pedidos y Facturas
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'mis_correos' ? (
        <div className="space-y-6" id="client-email-inbox-section">
          {/* Header del Buzón Oficial de Notificaciones al Correo */}
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-blue-400/30 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/30 text-sky-300 border border-blue-400/30 flex items-center justify-center shrink-0 shadow-xs">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-500/20 text-sky-200 border border-blue-400/30">
                      BUZÓN OFICIAL COLORLINK · ENLACE DIRECTO A TU BANDEJA
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Canal Verificado
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk'] text-white">
                    Notificaciones y Mensajes al Correo Electrónico
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Destinatario Oficial: <strong className="font-mono text-sky-300">{currentUser.email}</strong>
                  </p>
                </div>
              </div>

              {/* Botones de Acceso Rápido a Gmail Web y Outlook Web */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.open('https://mail.google.com', '_blank')}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  title="Abrir tu bandeja de entrada en Gmail Web"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Ir a Gmail Web</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </button>
                <button
                  type="button"
                  onClick={() => window.open('https://outlook.live.com', '_blank')}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  title="Abrir tu bandeja de entrada en Outlook"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Ir a Outlook Web</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </button>
                {onOpenEmailInbox && (
                  <button
                    type="button"
                    onClick={() => onOpenEmailInbox()}
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
                    title="Abrir modal de lectura completa"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-300" />
                    <span>Auditoría de Buzón</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Mensajes Registrados</span>
                <span className="font-bold text-white text-base block mt-0.5">{userEmails.length} Notificaciones</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Titular Registrado</span>
                <span className="font-semibold text-white truncate block mt-0.5">{currentUser.name}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Dirección de Envío</span>
                <span className="font-mono text-sky-300 truncate block mt-0.5">{currentUser.email}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Seguridad del Canal</span>
                <span className="font-semibold text-emerald-300 block mt-0.5">TLS / SSL Cifrado 256-bit</span>
              </div>
            </div>
          </div>

          {/* Listado de Correos Enviados al Cliente */}
          {userEmails.length === 0 ? (
            <div className="bg-white rounded-2xl border border-blue-200 p-8 sm:p-12 text-center shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 mx-auto flex items-center justify-center">
                <Mail className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  Aún no se registran correos para {currentUser.email}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cada vez que te registres, formules un pedido o tu orden avance (empaque en bodega CEDI, en ruta con el conductor y entrega finalizada con garantía), los mensajes oficiales quedarán archivados aquí con enlaces para abrirlos en tu correo electrónico.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('nueva_solicitud')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Crear Nueva Solicitud de Pedido</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                  <span>Mensajes Oficiales Despachados</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                    {userEmails.length}
                  </span>
                </h3>
                <span className="text-xs text-slate-500">
                  Haz clic en cualquier mensaje para abrirlo o redactarlo en Gmail Web
                </span>
              </div>

              <div className="space-y-3">
                {userEmails.map((email) => {
                  const plainText = buildEmailPlainText(email);
                  const isCopied = copiedEmailId === email.id;

                  const getBadge = () => {
                    switch (email.category) {
                      case 'bienvenida':
                        return { label: 'Bienvenida & Credenciales', bg: 'bg-sky-100 text-blue-900 border-sky-300', icon: <Sparkles className="w-3.5 h-3.5 text-blue-600" /> };
                      case 'orden_creada':
                        return { label: 'Orden Registrada', bg: 'bg-indigo-100 text-indigo-900 border-indigo-300', icon: <Clock className="w-3.5 h-3.5 text-indigo-600" /> };
                      case 'empaque':
                        return { label: 'Empacado en Bodega CEDI', bg: 'bg-amber-100 text-amber-900 border-amber-300', icon: <Package className="w-3.5 h-3.5 text-amber-700" /> };
                      case 'transporte':
                        return { label: 'En Ruta con Conductor', bg: 'bg-blue-100 text-blue-900 border-blue-300', icon: <Truck className="w-3.5 h-3.5 text-blue-700" /> };
                      case 'entrega':
                        return { label: 'Entregado & Garantía 5 Años', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> };
                      default:
                        return { label: 'Notificación Oficial', bg: 'bg-slate-100 text-slate-800 border-slate-300', icon: <Mail className="w-3.5 h-3.5 text-slate-700" /> };
                    }
                  };

                  const badge = getBadge();

                  return (
                    <div
                      key={email.id}
                      className="bg-white rounded-2xl border-2 border-slate-200/90 hover:border-blue-300 p-5 shadow-xs transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                            {badge.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.bg}`}>
                                {badge.label}
                              </span>
                              {email.requestCode && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {email.requestCode}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400 font-mono">
                                {email.sentAt}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                              {email.subject}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Enviado al correo
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {email.previewText}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 font-mono text-[11px]">
                          Para: <strong className="text-blue-700">{email.toEmail}</strong> ({email.toName})
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`ASUNTO: ${email.subject}\n\n${plainText}`);
                              setCopiedEmailId(email.id);
                              setTimeout(() => setCopiedEmailId(null), 2000);
                            }}
                            className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Copiar texto oficial del correo"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{isCopied ? '¡Copiado!' : 'Copiar Texto'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openInGmail(email)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                            title="Abrir este correo en Gmail Web pre-llenado"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Abrir en Gmail Web</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openInOutlook(email)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                            title="Abrir en Outlook Web"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Outlook</span>
                          </button>

                          {onOpenEmailInbox && (
                            <button
                              type="button"
                              onClick={() => onOpenEmailInbox(email.id)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                              title="Ver diseño HTML oficial en modal"
                            >
                              <Eye className="w-3.5 h-3.5 text-teal-400" />
                              <span>Ver Correo Completo</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : clientRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 mx-auto flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-navy-900">
              Aún no tienes solicitudes de pedidos en curso
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Formula tu proyecto indicando los m², el tipo de superficie y el color para que el sistema calcule los galones, asigne bodega CEDI y active la trazabilidad en vivo de tu orden.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('nueva_solicitud')}
              className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Crear Mi Primera Solicitud de Pedido</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('catalogo_inventario')}
              className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-2"
            >
              <Boxes className="w-4 h-4 text-teal-700" />
              <span>Explorar Catálogo CEDI</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Mis Pedidos (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <h2 className="text-xs font-bold font-mono uppercase text-navy-900 tracking-wider mb-3 flex items-center justify-between">
                <span>Historial de Proyectos</span>
                <span className="text-slate-500">{clientRequests.length} órdenes</span>
              </h2>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {clientRequests.map((req) => {
                  const isSelected = req.id === selectedReqId;
                  const routeSt = req.deliveryDetails?.routeStatus || 'pendiente_cargue';

                  const getStepLabel = () => {
                    if (req.status === 'calidad_garantia' || routeSt === 'entregado') {
                      return { text: '5. Entregado & Garantía', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
                    }
                    if (routeSt === 'en_ruta') {
                      return { text: '4. Conductor en Camino', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
                    }
                    if (req.packagingDetails?.status === 'empacado_listo') {
                      return { text: '3. Empacado en Bodega', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
                    }
                    return { text: '2. Formulación Técnica', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
                  };

                  const badge = getStepLabel();

                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedReqId(req.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-700 bg-teal-50/60 shadow-xs ring-1 ring-teal-600'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs">
                          <img
                            src={getProductImage({
                              productName: req.catalogProductName || req.technicalCalculation?.recommendedProduct?.name || req.surfaceType,
                              sku: req.catalogSku,
                            })}
                            alt={req.requestCode}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {req.colorHex && (
                            <span
                              className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                              style={{ backgroundColor: req.colorHex }}
                              title={req.colorName}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs font-bold text-teal-900">
                              {req.requestCode}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${badge.bg}`}>
                              {badge.text}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-slate-900 truncate">
                            {req.items && req.items.length > 0 ? (
                              <span className="flex items-center gap-1.5 text-teal-950 font-bold">
                                <Boxes className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                <span className="truncate">
                                  {req.items.length} productos: {req.items.map((i) => `${i.quantity}x ${i.productName.split(' ')[0]}`).join(', ')}
                                </span>
                              </span>
                            ) : req.orderItemType === 'material' ? (
                              <span className="flex items-center gap-1.5 text-navy-900">
                                <Boxes className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="truncate">
                                  {req.catalogProductName || req.technicalCalculation?.recommendedProduct?.name || 'Material'} ({req.materialQuantity || 1} uds)
                                </span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5">
                                {req.colorHex && (
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                                    style={{ backgroundColor: req.colorHex }}
                                  />
                                )}
                                <span className="truncate">{req.colorName} ({req.areaM2} m²)</span>
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                            <span>{req.city}</span>
                            <span className="text-teal-800 font-semibold truncate max-w-[130px]">
                              {req.items && req.items.length > 0
                                ? `${req.items.length} Ítems Pedidos`
                                : req.orderItemType === 'material'
                                ? `SKU: ${req.catalogSku || 'MAT-CEDI'}`
                                : (req.technicalCalculation?.recommendedProduct?.name?.split('®')[0] || 'Viniltex')}
                            </span>
                          </div>

                          {/* Botón Mensajes Directos con el Conductor */}
                          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReqId(req.id);
                                setChatReqId(req.id);
                              }}
                              className="w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              title="Escribir o contestar a tu conductor en tiempo real"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>💬 Mensajes con Conductor</span>
                              {req.chatMessages && req.chatMessages.length > 0 && (
                                <span className="ml-1 px-1.5 py-0.2 bg-[#25D366] text-slate-950 text-[10px] font-mono font-bold rounded-full">
                                  {req.chatMessages.length}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Trazabilidad Conectada en Vivo (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedRequest ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
                {/* Encabezado del Pedido Seleccionado */}
                <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-teal-300 font-bold">
                        {selectedRequest.requestCode}
                      </span>
                      <span className="text-xs text-slate-400">· {selectedRequest.createdAt}</span>
                    </div>
                    <h3 className="text-base font-bold font-['Space_Grotesk'] text-white mt-0.5">
                      {selectedRequest.clientName}
                    </h3>
                    <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-400" />
                      {selectedRequest.deliveryAddress || `${selectedRequest.city} - Dirección de Entrega`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botón Mensajes para contestar al conductor */}
                    <button
                      type="button"
                      onClick={() => setChatReqId(selectedRequest.id)}
                      className="px-3.5 py-2 bg-[#25D366] hover:bg-[#1ebd5b] text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md border-2 border-emerald-950 cursor-pointer"
                      title="Abrir mensajes en tiempo real con tu conductor"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-950" />
                      <span>💬 Mensajes con Conductor</span>
                      {selectedRequest.chatMessages && selectedRequest.chatMessages.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 bg-slate-950 text-white text-[10px] font-mono font-bold rounded-full">
                          {selectedRequest.chatMessages.length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenInvoice) onOpenInvoice(selectedRequest);
                        else setSelectedInvoice(selectedRequest);
                      }}
                      style={{ color: '#000000' }}
                      className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-md border-2 border-black cursor-pointer"
                      title="Descargar Factura Electrónica en PDF"
                    >
                      <Receipt className="w-4 h-4 text-black" style={{ color: '#000000' }} />
                      <span style={{ color: '#000000' }} className="text-black font-black">
                        📄 Descargar Factura PDF
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenCertificate(selectedRequest)}
                      className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Certificado de Garantía
                    </button>
                  </div>
                </div>

                {/* Tarjeta Visual de Producto & Asignación en Vivo */}
                {(() => {
                  const reqImg = getProductImage({
                    productName: selectedRequest.catalogProductName || selectedRequest.technicalCalculation?.recommendedProduct?.name || selectedRequest.surfaceType,
                    sku: selectedRequest.catalogSku,
                  });
                  return (
                    <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-sm group/zoom">
                        <img
                          src={reqImg}
                          alt="Producto Formulador"
                          className="w-full h-full object-cover group-hover/zoom:scale-110 transition-transform duration-500"
                        />
                        {selectedRequest.colorHex && (
                          <div
                            className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono shadow-xs border border-white/20"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white"
                              style={{ backgroundColor: selectedRequest.colorHex }}
                            />
                            <span>{selectedRequest.colorHex}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 text-xs w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-base text-slate-900 font-['Space_Grotesk']">
                            {selectedRequest.orderItemType === 'material'
                              ? selectedRequest.catalogProductName || 'Herramienta / Insumo'
                              : selectedRequest.technicalCalculation?.recommendedProduct?.name || 'Viniltex® BioCuidado'}
                          </span>
                          {selectedRequest.colorName && (
                            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 font-bold text-[11px] border border-teal-300">
                              {selectedRequest.colorName}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                          <div className="p-2 rounded-lg bg-white border border-slate-200">
                            <span className="text-slate-400 block text-[9.5px]">ÁREA / CANTIDAD</span>
                            <span className="font-bold text-slate-900">
                              {selectedRequest.orderItemType === 'material'
                                ? `${selectedRequest.materialQuantity || 1} Unidades`
                                : `${selectedRequest.areaM2} m² calculados`}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-white border border-slate-200">
                            <span className="text-slate-400 block text-[9.5px]">VOLUMEN ENVASE</span>
                            <span className="font-bold text-amber-800">
                              {selectedRequest.technicalCalculation?.totalCuñetes || 1} Cuñ + {selectedRequest.technicalCalculation?.remainderGalons || 0} Gal
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-white border border-slate-200 col-span-2 sm:col-span-1">
                            <span className="text-slate-400 block text-[9.5px]">LOTE CEDI PINTUCO</span>
                            <span className="font-bold text-teal-800">
                              {selectedRequest.inventoryAllocation?.batchNumber || 'LOTE-PTC-2026'}
                            </span>
                          </div>
                        </div>

                        {selectedRequest.deliveryDetails?.driverName && (
                          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600">
                            <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Conductor Asignado: <strong>{selectedRequest.deliveryDetails.driverName}</strong> ({selectedRequest.deliveryDetails.vehiclePlate || 'WTL-582'})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* SI ES UN PEDIDO MULTI-ÍTEM: MOSTRAR DETALLE COMPLETO DE CADA PRODUCTO */}
                {selectedRequest.items && selectedRequest.items.length > 0 && (
                  <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase text-teal-950 flex items-center gap-1.5">
                        <Boxes className="w-4 h-4 text-teal-700" />
                        Productos Incluidos en este Pedido ({selectedRequest.items.length} Ítems)
                      </span>
                      <span className="text-xs font-mono font-bold text-teal-800">
                        Total Materiales: ${selectedRequest.items.reduce((s, i) => s + (i.totalCostCOP || 0), 0).toLocaleString('es-CO')} COP
                      </span>
                    </div>

                    <div className="divide-y divide-teal-100 bg-white rounded-lg border border-teal-200 overflow-hidden">
                      {selectedRequest.items.map((it, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-teal-100/70 border border-teal-200 shrink-0 flex items-center justify-center font-mono font-bold text-teal-900 text-xs">
                              {idx + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                <span>{it.productName}</span>
                                {it.colorName && it.colorName !== 'N/A' && !it.colorName.includes('Material') && (
                                  <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold text-[10px] border border-teal-200">
                                    {it.colorName}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                                <span>Presentación: <strong>{it.presentation === 'cuñete' ? 'Cuñete (5 Gal)' : it.presentation === 'galon' ? 'Galón (1 Gal)' : 'Unidad'}</strong></span>
                                <span>· SKU: {it.sku}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 font-mono">
                            <div className="font-bold text-slate-900 text-sm">
                              {it.quantity} {it.presentation === 'cuñete' ? 'Cuñete(s)' : it.presentation === 'galon' ? 'Galón(es)' : 'und'}
                            </div>
                            <div className="text-[11px] text-teal-700 font-semibold">
                              ${(it.totalCostCOP || (it.unitPrice * it.quantity)).toLocaleString('es-CO')} COP
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flujo Único de Seguimiento & Trazabilidad del Pedido */}
                <div className="space-y-4 pt-2">
                  {(() => {
                    // Calcular el progreso actual en porcentaje del flujo único
                    const isDelivered = selectedRequest.status === 'calidad_garantia' || selectedRequest.deliveryDetails?.routeStatus === 'entregado';
                    const isInTransit = selectedRequest.deliveryDetails?.routeStatus === 'en_ruta';
                    const isPacked = selectedRequest.packagingDetails?.status === 'empacado_listo';
                    const stepNum = isDelivered ? 5 : isInTransit ? 4 : isPacked ? 3 : 2;
                    const percent = stepNum * 20;

                    return (
                      <>
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
                              <Truck className="w-5 h-5 text-blue-700" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 font-['Space_Grotesk'] uppercase tracking-wider">
                                Flujo Único de Seguimiento & Trazabilidad
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                Ciclo integral en tiempo real: desde formulación hasta entrega certificada
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                              Paso {stepNum} de 5 ({percent}%)
                            </span>
                            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              En Monitoreo
                            </span>
                          </div>
                        </div>

                        {/* Barra de Progreso Dinámica e Interactiva */}
                        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200">
                          <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-600">
                            <span className="font-bold text-slate-900">Avance de Orden:</span>
                            <span className="font-bold text-blue-700">{percent}% Completado</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5 shadow-inner">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 transition-all duration-700 ease-out shadow-xs"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="grid grid-cols-5 text-[9.5px] font-mono text-slate-400 pt-0.5 text-center">
                            <span className={stepNum >= 1 ? 'font-bold text-blue-900' : ''}>1. Registro</span>
                            <span className={stepNum >= 2 ? 'font-bold text-blue-900' : ''}>2. Formulado</span>
                            <span className={stepNum >= 3 ? 'font-bold text-amber-800' : ''}>3. Empacado</span>
                            <span className={stepNum >= 4 ? 'font-bold text-blue-800' : ''}>4. En Camino</span>
                            <span className={stepNum >= 5 ? 'font-bold text-emerald-800' : ''}>5. Entregado</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {/* Paso 1: Solicitud */}
                    <div className="relative group/step">
                      <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs transition-transform group-hover/step:scale-110">
                        ✓
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs transition-all hover:border-slate-300 hover:shadow-2xs">
                        <div className="flex items-center justify-between font-bold text-navy-900 mb-1">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-700" />
                            {selectedRequest.orderItemType === 'material'
                              ? '1. Pedido de Material Recibido & Registrado'
                              : '1. Solicitud Recibida & Registrada'}
                          </span>
                          <span className="font-mono text-[10px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                            REGISTRADO ✓
                          </span>
                        </div>
                        <p className="text-slate-700">
                          {selectedRequest.orderItemType === 'material'
                            ? `${selectedRequest.catalogProductName || selectedRequest.technicalCalculation?.recommendedProduct?.name} (${selectedRequest.materialQuantity || 1} unidades despachadas desde CEDI)`
                            : `${selectedRequest.technicalCalculation?.recommendedProduct?.name || 'Viniltex® Avanzada Antibacterial'} (${selectedRequest.areaM2} m² - ${selectedRequest.colorName})`}
                        </p>
                      </div>
                    </div>

                    {/* Paso 2: Formulación Técnica / Aprobación de Material */}
                    <div className="relative group/step">
                      <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs transition-transform group-hover/step:scale-110">
                        ✓
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 transition-all hover:border-slate-300 hover:shadow-2xs">
                        <div className="flex items-center justify-between font-bold text-navy-900">
                          <span className="flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5 text-blue-700" />
                            {selectedRequest.orderItemType === 'material'
                              ? '2. Verificación de Lote & Alistamiento en CEDI'
                              : '2. Formulación & Especificación Técnica'}
                          </span>
                          <span className="font-mono text-[10px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                            {selectedRequest.orderItemType === 'material' ? 'VERIFICADO ✓' : 'FORMULADO ✓'}
                          </span>
                        </div>
                        <p className="text-slate-700">
                          {selectedRequest.orderItemType === 'material'
                            ? `Ítem de inventario verificado en bodega ${selectedRequest.inventoryAllocation?.warehouseName || 'CEDI Principal'}. Despacho de ${selectedRequest.materialQuantity || 1} unidades con control de calidad.`
                            : `Sistema: ${(selectedRequest.surfaceType || 'MAMPOSTERIA').toUpperCase()} · ${selectedRequest.technicalCalculation?.totalGallonsNeeded ? selectedRequest.technicalCalculation.totalGallonsNeeded.toFixed(1) : (selectedRequest.technicalCalculation?.totalGalons || 2)} Galones (${selectedRequest.technicalCalculation?.buckets5Gal || selectedRequest.technicalCalculation?.totalCuñetes || 1} Cuñetes de 5 Gal).`}
                        </p>
                      </div>
                    </div>

                    {/* Paso 3: Empaque y CEDI */}
                    <div className="relative group/step">
                      <div
                        className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs transition-transform group-hover/step:scale-110 ${
                          selectedRequest.packagingDetails?.status === 'empacado_listo'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {selectedRequest.packagingDetails?.status === 'empacado_listo' ? '✓' : '3'}
                      </div>
                      <div
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          selectedRequest.packagingDetails?.status === 'empacado_listo'
                            ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-navy-900 mb-1">
                          <span className="flex items-center gap-1.5">
                            <Boxes className="w-3.5 h-3.5 text-amber-700" />
                            3. Alistamiento & Empaque en Bodega CEDI
                          </span>
                          <span className={`font-mono text-[10px] px-2 py-0.5 rounded border font-bold ${
                            selectedRequest.packagingDetails?.status === 'empacado_listo'
                              ? 'text-amber-900 bg-amber-100 border-amber-300'
                              : 'text-slate-500 bg-slate-100 border-slate-200'
                          }`}>
                            {selectedRequest.packagingDetails?.status === 'empacado_listo'
                              ? 'EMPACADO & LISTO ✓'
                              : 'PENDIENTE'}
                          </span>
                        </div>
                        <p className="text-slate-700">
                          Empacador: <strong>{selectedRequest.packagingDetails?.packerName || 'Javier Gómez (CEDI Rionegro)'}</strong>
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Lote de Fábrica: <span className="font-mono font-bold text-amber-900">{selectedRequest.inventoryAllocation?.batchNumber || 'LOTE-KOR-2026-B14'}</span> · Peso: {selectedRequest.packagingDetails?.weightKg || 85} Kg con precinto de seguridad.
                        </p>
                      </div>
                    </div>

                    {/* Paso 4: Despacho & Conductor */}
                    <div className="relative group/step">
                      <div
                        className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs transition-transform group-hover/step:scale-110 ${
                          selectedRequest.deliveryDetails?.routeStatus === 'entregado'
                            ? 'bg-emerald-600 text-white'
                            : selectedRequest.deliveryDetails?.routeStatus === 'en_ruta'
                            ? 'bg-blue-600 text-white animate-pulse'
                            : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {selectedRequest.deliveryDetails?.routeStatus === 'entregado' ? '✓' : '4'}
                      </div>
                      <div
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          selectedRequest.deliveryDetails?.routeStatus === 'en_ruta'
                            ? 'bg-blue-50/80 border-blue-400 shadow-md ring-1 ring-blue-300'
                            : selectedRequest.deliveryDetails?.routeStatus === 'entregado'
                            ? 'bg-emerald-50/60 border-emerald-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-navy-900 mb-1">
                          <span className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-blue-700" />
                            4. Transporte & Conductor Pintuco Express
                          </span>
                          <span className={`font-mono text-[10px] px-2 py-0.5 rounded border font-bold ${
                            selectedRequest.deliveryDetails?.routeStatus === 'entregado'
                              ? 'text-emerald-900 bg-emerald-100 border-emerald-300'
                              : selectedRequest.deliveryDetails?.routeStatus === 'en_ruta'
                              ? 'text-blue-900 bg-blue-100 border-blue-300 font-bold'
                              : 'text-slate-500 bg-slate-100 border-slate-200'
                          }`}>
                            {selectedRequest.deliveryDetails?.routeStatus === 'entregado'
                              ? 'ENTREGADO ✓'
                              : selectedRequest.deliveryDetails?.routeStatus === 'en_ruta'
                              ? '🚚 EN RUTA (GPS ACTIVO) ✓'
                              : 'PENDIENTE'}
                          </span>
                        </div>

                        <div className="space-y-1 text-slate-700">
                          <p>
                            Conductor Asignado: <strong>{selectedRequest.deliveryDetails?.driverName || 'Wilson Cañas'}</strong> ({selectedRequest.deliveryDetails?.vehiclePlate || 'WTL-582'})
                          </p>
                          <p className="text-[11px] text-slate-600 flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-blue-600" />
                            Ubicación reportada: <em>"{selectedRequest.deliveryDetails?.currentLocation || 'En muelle CEDI Rionegro listo para salida'}"</em>
                          </p>
                        </div>

                        {/* Botón Mensajes en vivo para contestar al conductor */}
                        <div className="pt-2.5 mt-2.5 border-t border-blue-200/60 flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[11.5px] text-slate-600 font-medium">
                            Coordinación directa de entrega en tiempo real:
                          </span>
                          <button
                            type="button"
                            onClick={() => setChatReqId(selectedRequest.id)}
                            className="px-3.5 py-1.5 bg-[#25D366] hover:bg-[#1ebd5b] text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                            title="Escribir o contestar a tu conductor en tiempo real"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-slate-950" />
                            <span>💬 Mensajes con el Conductor</span>
                            {selectedRequest.chatMessages && selectedRequest.chatMessages.length > 0 && (
                              <span className="ml-1 px-1.5 py-0.2 bg-slate-950 text-white text-[10px] font-mono font-bold rounded-full">
                                {selectedRequest.chatMessages.length}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Paso 5: Garantía y Calidad */}
                    <div className="relative group/step">
                      <div
                        className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs transition-transform group-hover/step:scale-110 ${
                          selectedRequest.status === 'calidad_garantia' || selectedRequest.deliveryDetails?.routeStatus === 'entregado'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {selectedRequest.status === 'calidad_garantia' || selectedRequest.deliveryDetails?.routeStatus === 'entregado' ? '✓' : '5'}
                      </div>
                      <div className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                        selectedRequest.status === 'calidad_garantia' || selectedRequest.deliveryDetails?.routeStatus === 'entregado'
                          ? 'bg-emerald-50/80 border-emerald-400 shadow-xs'
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between font-bold text-emerald-900">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                            5. Calidad Certificada & Garantía Pintuco S.A.
                          </span>
                          <span className={`font-mono text-[10px] px-2 py-0.5 rounded border font-bold ${
                            selectedRequest.status === 'calidad_garantia' || selectedRequest.deliveryDetails?.routeStatus === 'entregado'
                              ? 'text-emerald-900 bg-emerald-100 border-emerald-300'
                              : 'text-slate-500 bg-slate-100 border-slate-200'
                          }`}>
                            {selectedRequest.status === 'calidad_garantia' || selectedRequest.deliveryDetails?.routeStatus === 'entregado'
                              ? 'ENTREGADO & CERTIFICADO ✓'
                              : 'PENDIENTE'}
                          </span>
                        </div>
                        <p className="text-emerald-900">
                          Certificado N°: <strong>{selectedRequest.qualityCertificate?.certificateId || 'GAR-PTC-99124'}</strong> · Inspector: {selectedRequest.qualityCertificate?.inspectorName || 'Ing. Andrea Valencia Q.A.'} ({selectedRequest.technicalCalculation?.warrantyDurationYears || 5} Años)
                        </p>
                        <button
                          type="button"
                          onClick={() => onOpenCertificate(selectedRequest)}
                          className="text-xs font-bold text-blue-800 hover:text-blue-950 hover:underline pt-1 block cursor-pointer transition-colors"
                        >
                          Ver y Descargar Certificado Oficial →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MÓDULO DE SEGUIMIENTO AL CORREO: CÓMO VA SU PEDIDO */}
                {(() => {
                  const targetEmail = selectedRequest.clientEmail || currentUser.email;
                  const reqCode = selectedRequest.requestCode;
                  
                  // Buscar correos asociados a este pedido específico
                  const orderEmails = userEmails.filter(
                    (e) => (e.requestCode && e.requestCode === reqCode) || (e.subject && e.subject.includes(reqCode))
                  );

                  const isPacked = selectedRequest.packagingDetails?.status === 'empacado_listo';
                  const isInTransit = selectedRequest.deliveryDetails?.routeStatus === 'en_ruta' || selectedRequest.status === 'servicio_despacho';
                  const isDelivered = selectedRequest.deliveryDetails?.routeStatus === 'entregado' || selectedRequest.status === 'calidad_garantia';

                  const emailOrderCreated = orderEmails.find((e) => e.category === 'orden_creada');
                  const emailPacked = orderEmails.find((e) => e.category === 'empaque');
                  const emailInTransit = orderEmails.find((e) => e.category === 'transporte');
                  const emailDelivered = orderEmails.find((e) => e.category === 'entrega');

                  return (
                    <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-sky-50/50 to-white border-2 border-blue-200/90 shadow-xs space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-blue-200">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Mail className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-blue-950 font-['Space_Grotesk']">
                              Notificaciones Oficiales al Correo Electrónico
                            </h4>
                            <p className="text-xs text-slate-600">
                              Destinatario registrado: <strong className="font-mono text-blue-800">{targetEmail}</strong>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.open('https://mail.google.com', '_blank')}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                            title="Abrir Gmail Web"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Abrir Gmail Web</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* 1. Orden Registrada */}
                        <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-blue-600" />
                              1. Pedido Registrado
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                              DESPACHADO ✓
                            </span>
                          </div>
                          <p className="text-[11.5px] text-slate-600 line-clamp-2">
                            {emailOrderCreated?.previewText || `Confirmación de orden ${reqCode} con resumen de materiales y costo estimado enviada.`}
                          </p>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-[10.5px] text-slate-400 font-mono">
                              {emailOrderCreated?.sentAt || selectedRequest.createdAt}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {emailOrderCreated && (
                                <button
                                  type="button"
                                  onClick={() => openInGmail(emailOrderCreated)}
                                  className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>Gmail</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                              {onOpenEmailInbox && (
                                <button
                                  type="button"
                                  onClick={() => onOpenEmailInbox(emailOrderCreated?.id)}
                                  className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                                >
                                  Ver Correo →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 2. Empacado en Bodega CEDI */}
                        <div className={`p-3 rounded-xl border space-y-2 shadow-2xs ${isPacked ? 'bg-white border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Package className={`w-4 h-4 ${isPacked ? 'text-amber-600' : 'text-slate-400'}`} />
                              2. Empaque en Bodega CEDI
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${isPacked ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-600'}`}>
                              {isPacked ? 'DESPACHADO ✓' : 'EN ESPERA'}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-slate-600 line-clamp-2">
                            {isPacked
                              ? (emailPacked?.previewText || `Aviso de empaque e inspección de lote ${selectedRequest.inventoryAllocation?.batchNumber || 'LOTE-2026'} despachado.`)
                              : 'Se despachará a tu correo cuando el operario en bodega complete el alistamiento y selle los envases.'}
                          </p>
                          {isPacked && (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                              <span className="text-[10.5px] text-slate-400 font-mono">
                                {emailPacked?.sentAt || selectedRequest.packagingDetails?.packedAt || 'Enviado'}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {emailPacked && (
                                  <button
                                    type="button"
                                    onClick={() => openInGmail(emailPacked)}
                                    className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <span>Gmail</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                )}
                                {onOpenEmailInbox && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenEmailInbox(emailPacked?.id)}
                                    className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                                  >
                                    Ver Correo →
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 3. En Ruta con Conductor */}
                        <div className={`p-3 rounded-xl border space-y-2 shadow-2xs ${isInTransit || isDelivered ? 'bg-white border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Truck className={`w-4 h-4 ${isInTransit || isDelivered ? 'text-blue-600' : 'text-slate-400'}`} />
                              3. En Ruta / Conductor
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${isInTransit || isDelivered ? 'bg-blue-100 text-blue-900' : 'bg-slate-200 text-slate-600'}`}>
                              {isInTransit || isDelivered ? 'DESPACHADO ✓' : 'EN ESPERA'}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-slate-600 line-clamp-2">
                            {isInTransit || isDelivered
                              ? (emailInTransit?.previewText || `Aviso con conductor ${selectedRequest.deliveryDetails?.driverName || 'Wilson Cañas'} y placa ${selectedRequest.deliveryDetails?.vehiclePlate || 'WTL-582'} despachado.`)
                              : 'Se despachará a tu correo tan pronto el conductor inicie la ruta desde el muelle del CEDI.'}
                          </p>
                          {(isInTransit || isDelivered) && (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                              <span className="text-[10.5px] text-slate-400 font-mono">
                                {emailInTransit?.sentAt || selectedRequest.deliveryDetails?.departedAt || 'Enviado'}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {emailInTransit && (
                                  <button
                                    type="button"
                                    onClick={() => openInGmail(emailInTransit)}
                                    className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <span>Gmail</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                )}
                                {onOpenEmailInbox && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenEmailInbox(emailInTransit?.id)}
                                    className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                                  >
                                    Ver Correo →
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 4. Entregado en Obra & Garantía */}
                        <div className={`p-3 rounded-xl border space-y-2 shadow-2xs ${isDelivered ? 'bg-white border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <ShieldCheck className={`w-4 h-4 ${isDelivered ? 'text-emerald-600' : 'text-slate-400'}`} />
                              4. Entrega & Certificado 5 Años
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${isDelivered ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-600'}`}>
                              {isDelivered ? 'DESPACHADO ✓' : 'EN ESPERA'}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-slate-600 line-clamp-2">
                            {isDelivered
                              ? (emailDelivered?.previewText || `Acta de entrega en obra y certificado de garantía 5 años N° ${selectedRequest.qualityCertificate?.certificateId || 'GAR-PTC'} despachados.`)
                              : 'Se despachará a tu correo con el Certificado Oficial cuando el conductor confirme la entrega en obra.'}
                          </p>
                          {isDelivered && (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                              <span className="text-[10.5px] text-slate-400 font-mono">
                                {emailDelivered?.sentAt || selectedRequest.deliveryDetails?.deliveredAt || 'Enviado'}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {emailDelivered && (
                                  <button
                                    type="button"
                                    onClick={() => openInGmail(emailDelivered)}
                                    className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <span>Gmail</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                )}
                                {onOpenEmailInbox && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenEmailInbox(emailDelivered?.id)}
                                    className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                                  >
                                    Ver Correo →
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                Seleccione un pedido para ver su seguimiento en tiempo real.
              </div>
            )}
          </div>
        </div>
      )}



      {/* Modal de Factura Electrónica en PDF para el Cliente */}
      {selectedInvoice && (
        <InvoiceModal
          request={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Modal / Ventana de Chat Wasap en Tiempo Real para el Cliente */}
      {chatReqId && (() => {
        const chatReq = requests.find((r) => r.id === chatReqId) || selectedRequest;
        if (!chatReq) return null;
        return (
          <OrderChatModal
            isOpen={Boolean(chatReqId)}
            onClose={() => setChatReqId(null)}
            request={chatReq}
            currentUserRole="cliente"
            currentUserName={currentUser.name || 'Cliente'}
            onSendMessage={handleSendMessage}
          />
        );
      })()}
    </div>
  );
};
