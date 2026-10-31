/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ViewState, UserProfile, PaintRequest, SurfaceType, WarehouseInventoryItem, PendingRequestData, OrderItem } from './types';
import { THREAD_STEPS, INITIAL_REQUESTS, PINTUCO_INVENTORY, isPaintProduct } from './data';
import { BrandPanel } from './components/BrandPanel';
import { MobileHeader } from './components/MobileHeader';
import { LoginView } from './components/LoginView';
import { RegisterView } from './components/RegisterView';
import { ClientDashboard } from './components/ClientDashboard';
import { PackerDashboard } from './components/PackerDashboard';
import { DriverDashboard } from './components/DriverDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { SuccessView } from './components/SuccessView';
import { TransversalDashboard } from './components/TransversalDashboard';
import { TechnicalCalculator } from './components/TechnicalCalculator';
import { AiAssistantModal } from './components/AiAssistantModal';
import { QualityCertificateModal } from './components/QualityCertificateModal';
import { InvoiceModal } from './components/InvoiceModal';
import { SupabaseModal } from './components/SupabaseModal';
import { PintucoHomePage } from './components/PintucoHomePage';
import { MainNavbar } from './components/MainNavbar';
import { CartModal, CartProductItem } from './components/CartModal';
import { TechnicalSheetsModal } from './components/TechnicalSheetsModal';
import { AmbientesModal } from './components/AmbientesModal';
import { EmailToast } from './components/EmailToast';
import { EmailInboxModal } from './components/EmailInboxModal';
import { AiFloatingRobot } from './components/AiFloatingRobot';
import { initAuth } from './googleAuth';
import {
  sendWelcomeEmail,
  sendOrderCreatedEmail,
  sendOrderPackedEmail,
  sendOrderInTransitEmail,
  sendOrderDeliveredEmail,
  getEmailsForUser,
  getAllEmails,
} from './emailService';
import { syncPaintRequestToSupabase, syncAllInventoryToSupabase, getSupabaseConfig } from './supabase';
import { Sparkles, Sliders, Layers, User, LogOut, ShieldCheck, Boxes, Truck, Lock, UserPlus, Receipt, Database, Mail, CheckCircle2, Home, ShoppingBag, Bell } from './icons';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(() => getSupabaseConfig().connected);
  
  // Cargar pedidos persistidos o usar iniciales (asegurando que en pedidos de pintura solo haya pintura)
  const [requests, setRequests] = useState<PaintRequest[]>(() => {
    try {
      const saved = localStorage.getItem('colorlink_paint_requests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isUnwanted = (txt: string) => {
            const l = (txt || '').toLowerCase();
            return (
              l.includes('sellomax') ||
              l.includes('imprimante') ||
              l.includes('rodillo') ||
              l.includes('brocha') ||
              l.includes('bandeja') ||
              l.includes('cinta') ||
              l.includes('plástico') ||
              l.includes('plastico')
            );
          };

          const cleaned = parsed.map((r: PaintRequest) => {
            if (!r.items && r.orderItemType !== 'material') {
              if (r.packagingDetails?.status === 'empacado_listo') {
                if (r.packagingDetails?.manualItems) {
                  const filtered = r.packagingDetails.manualItems.filter((i) => !isUnwanted(i.description));
                  r.packagingDetails.manualItems = filtered.length > 0 ? filtered : undefined;
                }
                if (r.packagingDetails?.checkedSupplies) {
                  const filtered = r.packagingDetails.checkedSupplies.filter((s) => !isUnwanted(s));
                  r.packagingDetails.checkedSupplies = filtered.length > 0 ? filtered : [
                    `${r.packagingDetails.cuñetesPacked || 1} Cuñete(s) (5 Gal) - ${r.technicalCalculation?.recommendedProduct?.name || 'Pintura Pintuco'}`
                  ];
                }
              }
            }
            if (!r.chatMessages && r.id === 'req-001') {
              r.chatMessages = INITIAL_REQUESTS[0].chatMessages;
            }
            return r;
          });

          return cleaned;
        }
      }
    } catch {}
    return INITIAL_REQUESTS;
  });

  // Cargar inventario persistido con imágenes oficiales actualizadas
  // Cargar inventario persistido con imágenes oficiales actualizadas y productos de Bogotá
  const [inventoryList, setInventoryList] = useState<WarehouseInventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('colorlink_pintuco_inventory_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingSkus = new Set(parsed.map((p: any) => p.sku || p.id));
          const missingOfficial = PINTUCO_INVENTORY.filter((p) => !existingSkus.has(p.sku) && !existingSkus.has(p.id));
          if (missingOfficial.length > 0) {
            const merged = [...parsed, ...missingOfficial];
            localStorage.setItem('colorlink_pintuco_inventory_v4', JSON.stringify(merged));
            localStorage.setItem('colorlink_pintuco_inventory', JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      }

      // Si existían productos en v3 o previos, combinarlos con PINTUCO_INVENTORY
      const oldSaved = localStorage.getItem('colorlink_pintuco_inventory_v3') || localStorage.getItem('colorlink_pintuco_inventory');
      if (oldSaved) {
        const oldParsed = JSON.parse(oldSaved);
        if (Array.isArray(oldParsed)) {
          const customAdminProducts = oldParsed.filter((item: any) => !PINTUCO_INVENTORY.some((pi) => pi.id === item.id || pi.sku === item.sku));
          const combined = [...PINTUCO_INVENTORY, ...customAdminProducts];
          localStorage.setItem('colorlink_pintuco_inventory_v4', JSON.stringify(combined));
          localStorage.setItem('colorlink_pintuco_inventory', JSON.stringify(combined));
          return combined;
        }
      }
    } catch {}
    try {
      localStorage.setItem('colorlink_pintuco_inventory_v4', JSON.stringify(PINTUCO_INVENTORY));
      localStorage.setItem('colorlink_pintuco_inventory', JSON.stringify(PINTUCO_INVENTORY));
    } catch {}
    return PINTUCO_INVENTORY;
  });

  // Asegurar persistencia y sincronización con Supabase Cloud al cargar
  useEffect(() => {
    syncAllInventoryToSupabase(inventoryList).catch(console.error);
  }, []);

  // Selección pendiente desde la página de inicio o catálogo
  const [pendingRequestData, setPendingRequestData] = useState<PendingRequestData | null>(() => {
    try {
      const saved = localStorage.getItem('colorlink_pending_request');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const updatePendingRequestData = (data: PendingRequestData | null) => {
    setPendingRequestData(data);
    try {
      if (data) {
        localStorage.setItem('colorlink_pending_request', JSON.stringify(data));
      } else {
        localStorage.removeItem('colorlink_pending_request');
      }
    } catch {}
  };

  const [currentRequest, setCurrentRequest] = useState<PaintRequest>(requests[0] || INITIAL_REQUESTS[0]);
  
  // Modales Flotantes
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isEmailInboxOpen, setIsEmailInboxOpen] = useState(false);
  const [selectedEmailModalId, setSelectedEmailModalId] = useState<string | undefined>(undefined);
  const [certificateReq, setCertificateReq] = useState<PaintRequest | null>(null);
  const [invoiceReq, setInvoiceReq] = useState<PaintRequest | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTechnicalSheetsOpen, setIsTechnicalSheetsOpen] = useState(false);
  const [isAmbientesModalOpen, setIsAmbientesModalOpen] = useState(false);

  // Carrito de compras global persistido
  const [cartItems, setCartItems] = useState<CartProductItem[]>(() => {
    try {
      const saved = localStorage.getItem('colorlink_cart_items');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('colorlink_cart_items', JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  const handleAddToCart = (
    item: WarehouseInventoryItem,
    arg2?: any,
    arg3?: any,
    arg4?: any
  ) => {
    let qty = 1;
    let format: 'galon' | 'cuñete' | 'cuarto' | 'unidad' = isPaintProduct(item) ? 'galon' : 'unidad';
    let colorName: string | undefined;
    let colorHex: string | undefined;

    if (typeof arg2 === 'number') {
      qty = arg2 || 1;
      if (arg3) format = arg3;
      if (arg4) {
        colorName = arg4.name;
        colorHex = arg4.hex;
      }
    } else if (typeof arg2 === 'object' && arg2 !== null) {
      qty = arg2.quantity || 1;
      format = arg2.presentation || (isPaintProduct(item) ? 'galon' : 'unidad');
      colorName = arg2.colorName;
      colorHex = arg2.colorHex;
    }

    const isPaint = isPaintProduct(item);
    let unitPrice = item.unitPrice || item.pricePerGalon || (isPaint ? 115000 : 28000);
    if (isPaint && format === 'cuñete') {
      unitPrice = Math.round(unitPrice * 5 * 0.92);
    } else if (isPaint && format === 'cuarto') {
      unitPrice = Math.round(unitPrice * 0.32);
    }
    const totalCostCOP = unitPrice * qty;

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (ci) =>
          (ci.item.sku === item.sku || ci.item.id === item.id) &&
          ci.format === format &&
          (ci.selectedColor?.name === colorName || (!ci.selectedColor && !colorName))
      );
      if (existingIdx >= 0) {
        const next = [...prev];
        const updatedQty = next[existingIdx].quantity + qty;
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: updatedQty,
          totalCostCOP: next[existingIdx].unitPrice * updatedQty,
        };
        return next;
      }
      const newItem: CartProductItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        item,
        quantity: qty,
        format,
        selectedColor: colorName ? { name: colorName, hex: colorHex || '#F1F5F9' } : undefined,
        unitPrice,
        totalCostCOP,
      };
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((ci) => {
          if (ci.id === id) {
            const next = ci.quantity + delta;
            if (next <= 0) return null;
            return {
              ...ci,
              quantity: next,
              totalCostCOP: next * ci.unitPrice,
            };
          }
          return ci;
        })
        .filter(Boolean) as CartProductItem[]
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleCheckoutCart = () => {
    if (cartItems.length === 0) return;

    if (!currentUser) {
      setIsCartOpen(false);
      setView('register');
      return;
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

    const summaryNotes = `[Pedido Multi-Ítem Carrito: ${cartItems.length} productos | ${cartItems
      .map((c) => `${c.quantity}x ${c.item.productName} (${c.format}${c.selectedColor ? ` - ${c.selectedColor.name}` : ''})`)
      .join(', ')}]`.trim();

    const newReq: PaintRequest = {
      id: 'req-' + Date.now(),
      requestCode: `PTC-2026-${codeNumber}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      clientName: currentUser.name,
      clientEmail: currentUser.email,
      clientPhone: currentUser.phone,
      city: mainItem.item.warehouseCity || currentUser.city || 'Medellín',
      deliveryAddress: currentUser.address || `${currentUser.city || 'Medellín'}, Colombia`,
      projectType: 'Residencial',
      surfaceType: 'mamposteria_interior',
      environment: 'interior',
      areaM2: totalGalons > 0 ? totalGalons * 35 : cartItems.length * 10,
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
        totalGalons: totalGalons || 1,
        totalCuñetes: totalCuñetes,
        remainderGalons: cartItems.filter((c) => c.format === 'galon').reduce((acc, c) => acc + c.quantity, 0),
        primerGalons: 1,
        requiredSupplies: [],
        estimatedMaterialCostCOP: totalCostCOP,
        preparationAdvice: ['Limpieza mecánica de polvo y grasa'],
        applicationInstructions: ['Aplicar a dos manos con brocha o rodillo'],
        warrantyDurationYears: 5,
      },
      packagingDetails: {
        packerName: 'Operario CEDI Rionegro',
        batchCode: `LOT-PTC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        checkedSupplies: ['Sellos de seguridad Pintuco'],
        cuñetesPacked: totalCuñetes,
        galonesPacked: cartItems.filter((c) => c.format === 'galon').reduce((acc, c) => acc + c.quantity, 0),
        weightKg: Math.max(10, Math.round(totalGalons * 5 + cartItems.length * 2)),
        qualitySealAttached: true,
        qrInspectionCode: `QR-PTC-2026-${codeNumber}`,
        status: 'empacado_listo',
        notes: `Pedido multi-ítem con ${cartItems.length} referencias de inventario.`,
      },
      deliveryDetails: {
        driverName: 'Carlos Mario Jaramillo',
        driverPhone: '+57 312 849 2011',
        vehiclePlate: 'WOK-842',
        vehicleType: 'Turbo Pintuco 4.5T',
        routeStatus: 'en_ruta',
        currentLocation: `CEDI ${mainItem.item.warehouseCity || 'Rionegro'}`,
        deliveryAddress: currentUser.address || `${currentUser.city || 'Medellín'}, Colombia`,
        departedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    };

    handleSubmitRequest(newReq);
    setCartItems([]);
    setIsCartOpen(false);
    setView('request');
  };

  // Estadísticas del Buzón de Correos en Vivo (Exclusivo para el cliente registrado)
  const [emailStats, setEmailStats] = useState(() => ({
    total: 0,
    unread: 0,
  }));

  React.useEffect(() => {
    const refreshEmailCount = () => {
      // SEGURIDAD & PRIVACIDAD:
      // Si no hay usuario registrado/autenticado, no mostrar conteos de notificaciones de otros
      if (!currentUser || !currentUser.email) {
        setEmailStats({ total: 0, unread: 0 });
        return;
      }
      const list = currentUser.role === 'administrador'
        ? getAllEmails()
        : getEmailsForUser(currentUser.email);

      setEmailStats({
        total: list.length,
        unread: list.filter((e) => !e.read).length,
      });
    };

    refreshEmailCount();
    window.addEventListener('colorlink-email-sent', refreshEmailCount);
    window.addEventListener('colorlink-email-read', refreshEmailCount);
    window.addEventListener('colorlink-email-deleted', refreshEmailCount);

    return () => {
      window.removeEventListener('colorlink-email-sent', refreshEmailCount);
      window.removeEventListener('colorlink-email-read', refreshEmailCount);
      window.removeEventListener('colorlink-email-deleted', refreshEmailCount);
    };
  }, [currentUser]);

  // Sincronizar automáticamente si el cliente en sesión fue editado por el administrador
  React.useEffect(() => {
    const handleClientUpdated = (e: any) => {
      const updatedClient = e.detail;
      if (
        currentUser &&
        updatedClient &&
        (currentUser.id === updatedClient.id || currentUser.email.toLowerCase() === updatedClient.email?.toLowerCase())
      ) {
        setCurrentUser((prev) => (prev ? {
          ...prev,
          name: updatedClient.name || prev.name,
          email: updatedClient.email || prev.email,
          phone: updatedClient.phone || prev.phone,
          company: updatedClient.company || prev.company,
          city: updatedClient.city || prev.city,
          address: updatedClient.address || prev.address,
        } : prev));
      }
    };
    window.addEventListener('colorlink-client-updated', handleClientUpdated);
    return () => {
      window.removeEventListener('colorlink-client-updated', handleClientUpdated);
    };
  }, [currentUser]);

  // Estado de Google Account / Gmail API Oficial
  const [googleUser, setGoogleUser] = useState<{
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
  } | null>(null);

  // Inicializar observador de autenticación de Google
  React.useEffect(() => {
    const unsub = initAuth(
      (user) => {
        setGoogleUser({
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Guardar en localStorage cuando cambian los pedidos
  const persistRequests = (updatedList: PaintRequest[]) => {
    try {
      localStorage.setItem('colorlink_paint_requests', JSON.stringify(updatedList));
    } catch (err) {
      console.warn('Error al guardar localmente:', err);
    }
  };

  // Guardar en base de datos local y Supabase Cloud cuando cambia el inventario
  const handleUpdateInventory = (updatedInv: WarehouseInventoryItem[]) => {
    setInventoryList(updatedInv);
    try {
      localStorage.setItem('colorlink_pintuco_inventory_v4', JSON.stringify(updatedInv));
      localStorage.setItem('colorlink_pintuco_inventory', JSON.stringify(updatedInv));
    } catch (err) {
      console.warn('Error al guardar inventario:', err);
    }
    syncAllInventoryToSupabase(updatedInv).catch(console.error);
  };

  // Determinar paso activo para el panel izquierdo (BrandPanel)
  const getCurrentStep = (): number => {
    if (!currentUser) return 1;
    switch (view) {
      case 'login':
      case 'register':
        return 1;
      case 'request':
        if (currentUser.role === 'administrador') return 2;
        if (currentUser.role === 'empacador') return 3;
        if (currentUser.role === 'conductor') return 4;
        return 1;
      case 'success':
        return 5;
      case 'transversal-ecosystem':
        return 3;
      default:
        return 1;
    }
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setView('request');
  };

  const handleRegister = (user: UserProfile) => {
    setCurrentUser(user);
    setView('request');
    // Disparar correo de bienvenida oficial de felicitaciones al cliente
    sendWelcomeEmail(user).catch(console.error);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAiModalOpen(false);
    setIsCalculatorOpen(false);
    setIsEmailInboxOpen(false);
    setCertificateReq(null);
    setInvoiceReq(null);
    setView('login');
  };

  const handleUpdateRequest = (updated: PaintRequest) => {
    const prevReq = requests.find((r) => r.id === updated.id);

    // 1. ¿Pasó a Empacado en bodega CEDI?
    const isNowPacked = updated.packagingDetails?.status === 'empacado_listo';
    const wasPacked = prevReq?.packagingDetails?.status === 'empacado_listo';
    if (isNowPacked && !wasPacked) {
      sendOrderPackedEmail(updated).catch(console.error);
    }

    // 2. ¿Pasó a En transporte / en vehículo de despacho?
    const isNowInTransit = updated.deliveryDetails?.routeStatus === 'en_ruta' || updated.status === 'servicio_despacho';
    const wasInTransit = prevReq?.deliveryDetails?.routeStatus === 'en_ruta' || prevReq?.status === 'servicio_despacho';
    if (isNowInTransit && !wasInTransit) {
      sendOrderInTransitEmail(updated).catch(console.error);
    }

    // 3. ¿Pasó a Entregado en obra / Calidad y garantía emitida?
    const isNowDelivered = updated.deliveryDetails?.routeStatus === 'entregado' || updated.status === 'calidad_garantia';
    const wasDelivered = prevReq?.deliveryDetails?.routeStatus === 'entregado' || prevReq?.status === 'calidad_garantia';
    if (isNowDelivered && !wasDelivered) {
      sendOrderDeliveredEmail(updated).catch(console.error);
    }

    setRequests((prev) => {
      const next = prev.map((req) => (req.id === updated.id ? updated : req));
      persistRequests(next);
      return next;
    });
    if (currentRequest.id === updated.id) {
      setCurrentRequest(updated);
    }
    // Sincronizar en segundo plano con Supabase Cloud (12 tablas)
    syncPaintRequestToSupabase(updated);
  };

  const handleSubmitRequest = (newReq: PaintRequest) => {
    // 1. Guardar la solicitud y asignarla como activa
    setRequests((prev) => {
      const next = [newReq, ...prev];
      persistRequests(next);
      return next;
    });
    setCurrentRequest(newReq);
    setView('request');

    // Disparar correo de nueva orden registrada
    sendOrderCreatedEmail(newReq).catch(console.error);

    // 2. DESCONTAR DEL INVENTARIO EN TIEMPO REAL:
    // Todo lo que pida el cliente se descuenta del inventario (unidades, galones, cuñetes y productos múltiples)
    setInventoryList((prevInv) => {
      interface DeductionTarget {
        sku?: string;
        productName?: string;
        category?: string;
        surfaceType?: SurfaceType;
        warehouseCity?: string;
        presentation?: string;
        isPaint: boolean;
        cuñetes: number;
        galones: number;
        units: number;
      }

      const deductionsList: DeductionTarget[] = [];

      // Si el pedido contiene ítems explícitos (carrito multi-ítem, compra directa del catálogo o adicionales)
      if (newReq.items && newReq.items.length > 0) {
        newReq.items.forEach((it) => {
          const isPaint = it.itemType === 'pintura' || it.presentation === 'cuñete' || it.presentation === 'galon';
          let cuñetes = 0;
          let galones = 0;
          let units = 0;

          if (isPaint) {
            if (it.presentation === 'cuñete') {
              cuñetes = it.quantity || 1;
            } else if (it.presentation === 'galon') {
              galones = it.quantity || 1;
            } else if (it.presentation === 'cuarto') {
              galones = Math.max(1, Math.ceil((it.quantity || 1) / 4));
            } else {
              if (it.quantity >= 5) {
                cuñetes = Math.floor(it.quantity / 5);
                galones = it.quantity % 5;
              } else {
                galones = it.quantity || 1;
              }
            }
          } else {
            // Materiales, herramientas e insumos
            units = it.quantity || 1;
            galones = it.quantity || 1;
          }

          deductionsList.push({
            sku: it.sku,
            productName: it.productName,
            category: it.category,
            warehouseCity: it.warehouseCity || newReq.city,
            presentation: it.presentation,
            isPaint,
            cuñetes,
            galones,
            units,
          });
        });
      } else {
        // Pedido unitario tradicional sin array de items explícito
        if (newReq.orderItemType === 'material') {
          const qty = newReq.materialQuantity || 1;
          deductionsList.push({
            sku: newReq.catalogSku,
            productName: newReq.catalogProductName || 'Material',
            warehouseCity: newReq.city,
            isPaint: false,
            cuñetes: 0,
            galones: qty,
            units: qty,
          });
        } else {
          // Pintura principal
          const cuñetes = newReq.technicalCalculation?.totalCuñetes || 0;
          const galones = newReq.technicalCalculation?.remainderGalons ?? (cuñetes === 0 ? 1 : 0);
          deductionsList.push({
            sku: newReq.catalogSku || newReq.technicalCalculation?.recommendedProduct?.id,
            productName: newReq.catalogProductName || newReq.technicalCalculation?.recommendedProduct?.name,
            surfaceType: newReq.surfaceType,
            warehouseCity: newReq.city,
            isPaint: true,
            cuñetes,
            galones,
            units: 0,
          });

          // Si el cálculo técnico incluyó imprimante / sellador (Sellomax, etc.)
          if (
            (newReq.technicalCalculation?.primerGalons || 0) > 0 &&
            newReq.technicalCalculation?.recommendedPrimerProduct
          ) {
            deductionsList.push({
              sku: newReq.technicalCalculation.recommendedPrimerProduct.id,
              productName: newReq.technicalCalculation.recommendedPrimerProduct.name,
              warehouseCity: newReq.city,
              isPaint: true,
              cuñetes: 0,
              galones: newReq.technicalCalculation.primerGalons || 1,
              units: 0,
            });
          }
        }
      }

      // Mapear deducciones acumuladas por ID de ítem del inventario
      const deductionsByItemId = new Map<
        string,
        { cuñetes: number; galones: number; units: number; isPaint: boolean }
      >();

      deductionsList.forEach((reqItem) => {
        const targetCity = (reqItem.warehouseCity || newReq.city || '').toLowerCase().trim();

        let bestMatch: WarehouseInventoryItem | null = null;
        let highestScore = -1;

        prevInv.forEach((invItem) => {
          let score = 0;
          const invCity = (invItem.warehouseCity || '').toLowerCase().trim();
          const cityMatches = targetCity && (invCity === targetCity || invCity.includes(targetCity) || targetCity.includes(invCity));

          // 1. Coincidencia por SKU / ID
          const skuMatches =
            reqItem.sku &&
            (invItem.sku?.toLowerCase() === reqItem.sku.toLowerCase() ||
              invItem.id?.toLowerCase() === reqItem.sku.toLowerCase() ||
              invItem.productId?.toLowerCase() === reqItem.sku.toLowerCase());

          if (skuMatches) {
            score += 100;
          }

          // 2. Coincidencia por Nombre de Producto
          if (reqItem.productName && invItem.productName) {
            const cleanInvName = invItem.productName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanReqName = reqItem.productName.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanInvName === cleanReqName) {
              score += 90;
            } else if (cleanInvName.includes(cleanReqName) || cleanReqName.includes(cleanInvName)) {
              score += 70;
            } else {
              const reqWords = reqItem.productName.toLowerCase().split(' ').filter((w) => w.length > 3);
              const invWords = invItem.productName.toLowerCase().split(' ').filter((w) => w.length > 3);
              const commonWords = reqWords.filter((w) => invWords.includes(w));
              if (commonWords.length > 0) {
                score += 25 * commonWords.length;
              }
            }
          }

          // 3. Coincidencia por superficie / categoría si es formulación libre
          if (reqItem.surfaceType) {
            const cat = invItem.category.toLowerCase();
            if (reqItem.surfaceType === 'fachada_exterior' && (cat.includes('fachada') || cat.includes('exterior') || cat.includes('koraza'))) score += 50;
            if (reqItem.surfaceType === 'concreto_piso' && (cat.includes('industrial') || cat.includes('piso') || cat.includes('epox'))) score += 50;
            if (reqItem.surfaceType === 'metal_ferroso' && (cat.includes('metal') || cat.includes('ferroso') || cat.includes('pintulux'))) score += 50;
            if (reqItem.surfaceType === 'mamposteria_interior' && (cat.includes('arquitectónica') || cat.includes('interior') || cat.includes('viniltex'))) score += 50;
            if (reqItem.surfaceType === 'madera' && (cat.includes('madera') || cat.includes('barniz') || cat.includes('deck'))) score += 50;
            if (reqItem.surfaceType === 'humedad_salitre' && (cat.includes('preparación') || cat.includes('humedad') || cat.includes('sellomax'))) score += 50;
          }

          // Bonus por Bodega / Ciudad
          if (cityMatches) {
            score += 25;
          }

          // Bonus si el ítem tiene existencias
          const hasStock = (invItem.cuñetesAvailable || 0) > 0 || (invItem.galonesAvailable || 0) > 0 || (invItem.unitsAvailable ?? 0) > 0;
          if (hasStock) {
            score += 10;
          }

          if (score > highestScore && score >= 35) {
            highestScore = score;
            bestMatch = invItem;
          }
        });

        // Registrar la deducción acumulada en el ítem seleccionado
        if (bestMatch) {
          const current = deductionsByItemId.get(bestMatch.id) || {
            cuñetes: 0,
            galones: 0,
            units: 0,
            isPaint: reqItem.isPaint,
          };
          current.cuñetes += reqItem.cuñetes;
          current.galones += reqItem.galones;
          current.units += reqItem.units;
          current.isPaint = reqItem.isPaint || isPaintProduct(bestMatch);
          deductionsByItemId.set(bestMatch.id, current);
        }
      });

      // Si no se encontraron coincidencias, retornar sin cambios
      if (deductionsByItemId.size === 0) {
        return prevInv;
      }

      // Aplicar las deducciones de forma estricta a cada ítem afectado
      const updatedInv = prevInv.map((item) => {
        const deduction = deductionsByItemId.get(item.id);
        if (!deduction) return item;

        const isItemPaint = deduction.isPaint || isPaintProduct(item);

        let newCuñetes = item.cuñetesAvailable ?? 0;
        let newGalones = item.galonesAvailable ?? 0;
        let newUnits = item.unitsAvailable !== undefined ? item.unitsAvailable : (item.galonesAvailable ?? 0);

        if (isItemPaint) {
          newCuñetes = Math.max(0, newCuñetes - deduction.cuñetes);
          newGalones = Math.max(0, newGalones - deduction.galones);
          if (item.unitsAvailable !== undefined) {
            newUnits = (newCuñetes * 5) + newGalones;
          }
        } else {
          const qtyToDeduct = deduction.units || deduction.galones || 1;
          newUnits = Math.max(0, newUnits - qtyToDeduct);
          newGalones = newUnits;
        }

        const totalUnitsLeft = isItemPaint
          ? (newCuñetes * 5) + newGalones
          : newUnits;

        let newStatus: 'optimo' | 'alerta_reposicion' | 'critico' | 'agotado' = 'optimo';
        if (totalUnitsLeft <= 0) {
          newStatus = 'agotado';
        } else if (totalUnitsLeft <= item.minStockAlert) {
          newStatus = 'critico';
        } else if (totalUnitsLeft <= item.minStockAlert * 1.5) {
          newStatus = 'alerta_reposicion';
        } else {
          newStatus = 'optimo';
        }

        const newTotalLiters = isItemPaint
          ? Math.max(0, Math.round(newCuñetes * 18.925 + newGalones * 3.785))
          : Math.max(0, (item.totalLiters || 0) - (deduction.units || 1));

        return {
          ...item,
          cuñetesAvailable: newCuñetes,
          galonesAvailable: newGalones,
          unitsAvailable: newUnits,
          totalLiters: newTotalLiters,
          status: newStatus,
          lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      });

      // Guardar en localStorage de forma sincronizada
      try {
        localStorage.setItem('colorlink_pintuco_inventory_v3', JSON.stringify(updatedInv));
        localStorage.setItem('colorlink_pintuco_inventory', JSON.stringify(updatedInv));
        window.dispatchEvent(new CustomEvent('inventory-updated', { detail: updatedInv }));
      } catch (err) {
        console.warn('Error al guardar inventario:', err);
      }

      return updatedInv;
    });

    // 3. Limpiar selección pendiente
    updatePendingRequestData(null);

    // 4. Sincronizar en segundo plano con Supabase Cloud (12 tablas)
    syncPaintRequestToSupabase(newReq);
  };

  const handleApplyCalculationToRequest = (surface: SurfaceType, areaM2: number) => {
    setIsCalculatorOpen(false);

    const surfaceLabels: Record<SurfaceType, string> = {
      mamposteria_interior: 'Pared Interior',
      fachada_exterior: 'Fachada Exterior',
      metal_ferroso: 'Metales / Rejas',
      concreto_piso: 'Pisos / Bodegas',
      madera: 'Maderas / Decks',
      humedad_salitre: 'Humedad Severa',
      drywall_yeso: 'Drywall / Yeso',
    };

    // Buscar ítem en inventario CEDI que coincida con la superficie y la ciudad
    const matchingItem = inventoryList.find((item) => {
      const isPaint = isPaintProduct(item);
      if (!isPaint) return false;
      const cat = item.category.toLowerCase();
      const pName = item.productName.toLowerCase();
      if (surface === 'fachada_exterior') return cat.includes('fachada') || cat.includes('exterior') || pName.includes('koraza');
      if (surface === 'concreto_piso') return cat.includes('piso') || cat.includes('industrial') || pName.includes('epox');
      if (surface === 'metal_ferroso') return cat.includes('metal') || pName.includes('pintulux');
      if (surface === 'madera') return cat.includes('madera') || pName.includes('mader');
      if (surface === 'humedad_salitre') return cat.includes('humedad') || pName.includes('sellomax');
      return cat.includes('interior') || cat.includes('muros') || pName.includes('viniltex');
    });

    updatePendingRequestData({
      surfaceType: surface,
      areaM2: areaM2 || 80,
      productName: matchingItem?.productName || 'Pintura Pintuco Especializada',
      catalogItem: matchingItem || undefined,
      notes: `Cálculo generado desde Calculadora Técnica Pintuco: Área de ${areaM2} m² para ${surfaceLabels[surface] || 'superficie'}.`,
    });

    if (currentUser) {
      setView('request');
    } else {
      setView('register');
    }
  };

  // Guard de seguridad: Sólo el Administrador puede ingresar al Ecosistema 360°
  // Para cliente, empacador y conductores, se redirige inmediatamente a su portal
  useEffect(() => {
    if (currentUser && currentUser.role !== 'administrador' && view === 'transversal-ecosystem') {
      setView('request');
    }
  }, [currentUser, view]);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'administrador':
        return { label: 'Administrador General', icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />, bg: 'bg-blue-100/80 text-blue-950 border-blue-300 font-bold' };
      case 'empacador':
        return { label: 'Bodega & Empaque', icon: <Boxes className="w-3.5 h-3.5 text-sky-700" />, bg: 'bg-sky-100/80 text-sky-950 border-sky-300 font-bold' };
      case 'conductor':
        return { label: 'Conductor Logístico', icon: <Truck className="w-3.5 h-3.5 text-indigo-700" />, bg: 'bg-indigo-100/80 text-indigo-950 border-indigo-300 font-bold' };
      default:
        return { label: 'Cliente ColorLink', icon: <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />, bg: 'bg-blue-50 text-blue-900 border-blue-200 font-bold' };
    }
  };

  const roleBadge = getRoleBadge(currentUser?.role);

  const handleNavigateAmbientes = () => {
    setIsAmbientesModalOpen(false);
    if (view !== 'home') {
      setView('home');
    }
    setTimeout(() => {
      const el = document.getElementById('ambientes');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  return (
    <div className="app-root" id="colorlink-root-app">
      {/* Si la vista es 'home', renderizamos la página oficial estilo Pintuco */}
      {view === 'home' ? (
        <PintucoHomePage
          currentUser={currentUser}
          requests={requests}
          inventory={inventoryList}
          cartCount={cartItems.length}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenTechnicalSheets={() => setIsTechnicalSheetsOpen(true)}
          onNavigateAmbientes={handleNavigateAmbientes}
          emailUnreadCount={emailStats.unread}
          onNavigateToLogin={() => setView('login')}
          onNavigateToRegister={() => setView('register')}
          onNavigateToPortal={() => {
            if (currentUser) {
              setView('request');
            } else {
              setView('login');
            }
          }}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
          onOpenAiAssistant={() => setIsAiModalOpen(true)}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onOpenEmailInbox={() => {
            setSelectedEmailModalId(undefined);
            setIsEmailInboxOpen(true);
          }}
          onLogout={handleLogout}
          onSelectColorAndQuote={(colorName, colorHex) => {
            updatePendingRequestData({
              colorName,
              colorHex,
            });
            if (currentUser) {
              setView('request');
            } else {
              setView('register');
            }
          }}
          onSelectRoomAndQuote={(surface, productName, colorTag) => {
            updatePendingRequestData({
              surfaceType: surface,
              productName,
              colorName: colorTag.split('&')[0].trim(),
            });
            if (currentUser) {
              setView('request');
            } else {
              setView('register');
            }
          }}
          onSelectCalculationAndQuote={(surface, areaM2, productName) => {
            updatePendingRequestData({
              surfaceType: surface,
              areaM2,
              productName,
            });
            if (currentUser) {
              setView('request');
            } else {
              setView('register');
            }
          }}
          onSelectCatalogItemAndBuy={(item, options) => {
            handleAddToCart(item, options);
          }}
          onSelectSpaceAndQuote={(space) => {
            const matchingItem = inventoryList.find((item) =>
              item.productName.toLowerCase().includes(space.productName.toLowerCase().split(' ')[0]) ||
              (space.surface === 'fachada_exterior' && item.category.toLowerCase().includes('fachada')) ||
              (space.surface === 'concreto_piso' && item.category.toLowerCase().includes('industrial')) ||
              (space.surface === 'mamposteria_interior' && item.category.toLowerCase().includes('arquitectónica'))
            );

            updatePendingRequestData({
              surfaceType: space.surface,
              productName: space.productName,
              colorName: space.colorName,
              colorHex: space.colorHex,
              roomTitle: space.title,
              areaM2: space.areaM2 || 65,
              finish: space.finish,
              orderItemType: 'pintura',
              catalogItem: matchingItem,
              notes: `Formulado desde espacio real: ${space.title}. Producto recomendado: ${space.productName} (${space.finish || 'Estándar'}) en color ${space.colorName} (${space.colorHex}).`,
            });
            if (currentUser) {
              setView('request');
            } else {
              setView('register');
            }
          }}
        />
      ) : (
        <>
          {/* Barra de navegación superior ColorLink · Idéntica a la imagen */}
          <MainNavbar
            currentUser={currentUser}
            cartCount={cartItems.length}
            activeSection={view}
            onNavigateHome={() => setView('home')}
            onNavigateCatalog={() => setView('home')}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
            onNavigatePalettes={() => setView('home')}
            onOpenTechnicalSheets={() => setIsTechnicalSheetsOpen(true)}
            onNavigateAmbientes={handleNavigateAmbientes}
            onOpenCart={() => setIsCartOpen(true)}
            onNavigateLogin={() => setView('login')}
            onNavigatePortal={() => setView('request')}
            onLogout={handleLogout}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            onOpenEmailInbox={() => {
              setSelectedEmailModalId(undefined);
              setIsEmailInboxOpen(true);
            }}
            emailUnreadCount={emailStats.unread}
          />

          {/* Renderizado de la Vista Principal */}
          {currentUser && view === 'transversal-ecosystem' ? (
            <main className="min-h-[calc(100vh-65px)] bg-[#f8fafc] p-4 md:p-6">
              <TransversalDashboard
                requests={requests}
                onSelectRequest={(r) => {
                  setCurrentRequest(r);
                }}
                onCreateNewRequest={() => {
                  setView('request');
                }}
                onOpenCalculator={() => setIsCalculatorOpen(true)}
                onOpenAiAssistant={() => setIsAiModalOpen(true)}
                onOpenCertificate={(r) => setCertificateReq(r)}
              />
            </main>
          ) : currentUser && view === 'success' ? (
            <main className="min-h-[calc(100vh-45px)] w-full bg-[#f8fafc] p-3 sm:p-4 md:p-6" id="main-portal-content">
              <div className="max-w-4xl mx-auto py-6">
                <SuccessView
                  request={currentRequest}
                  onNewRequest={() => setView('request')}
                  onViewTransversal={() => setView('transversal-ecosystem')}
                  onOpenCertificateModal={() => setCertificateReq(currentRequest)}
                  onOpenInvoiceModal={() => setInvoiceReq(currentRequest)}
                  onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
                />
              </div>
            </main>
          ) : !currentUser ? (
            /* VISTAS NO AUTENTICADAS: Experiencia limpia, moderna en blanco y azul */
            <div className="min-h-[calc(100vh-65px)] bg-[#f8fafc] flex flex-col items-center justify-center p-4 sm:p-6 py-8 relative" id="main-auth-container">
              {/* Selector de modo estilo segmented pill */}
              <div className="mb-4 inline-flex items-center p-1 bg-white border border-blue-200/80 rounded-xl text-xs font-semibold shadow-2xs">
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    view !== 'register'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-blue-700'
                  }`}
                  id="tab-btn-auth-login"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Iniciar Sesión</span>
                </button>
                <button
                  type="button"
                  onClick={() => setView('register')}
                  className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    view === 'register'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-blue-700'
                  }`}
                  id="tab-btn-auth-register"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Crear Cuenta de Cliente</span>
                </button>
              </div>

              {view === 'register' ? (
                <RegisterView
                  onRegister={handleRegister}
                  onNavigateToLogin={() => setView('login')}
                  onNavigateToHome={() => setView('home')}
                  pendingRequestData={pendingRequestData}
                />
              ) : (
                <LoginView
                  onLogin={handleLogin}
                  onNavigateToRegister={() => setView('register')}
                  onNavigateToHome={() => setView('home')}
                />
              )}
            </div>
          ) : (
            /* USUARIO AUTENTICADO (ADMINISTRADOR, EMPACADOR, CONDUCTOR, CLIENTE):
               Pantalla completa y despejada sin BrandPanel lateral */
            <main className="min-h-[calc(100vh-45px)] w-full bg-[#f8fafc] p-3 sm:p-4 md:p-6 flex flex-col items-center" id="main-portal-content">
              {currentUser.role === 'administrador' ? (
                <AdminDashboard
                  currentUser={currentUser}
                  requests={requests}
                  inventoryList={inventoryList}
                  onUpdateInventory={handleUpdateInventory}
                  onUpdateRequest={handleUpdateRequest}
                  onCreateNewRequest={() => {
                    setIsCalculatorOpen(true);
                  }}
                  onOpenCalculator={() => setIsCalculatorOpen(true)}
                  onOpenAiAssistant={() => setIsAiModalOpen(true)}
                  onOpenCertificate={(req) => setCertificateReq(req)}
                />
              ) : currentUser.role === 'empacador' ? (
                <PackerDashboard
                  currentUser={currentUser}
                  requests={requests}
                  onUpdateRequest={handleUpdateRequest}
                  onOpenCalculator={() => setIsCalculatorOpen(true)}
                />
              ) : currentUser.role === 'conductor' ? (
                <DriverDashboard
                  currentUser={currentUser}
                  requests={requests}
                  onUpdateRequest={handleUpdateRequest}
                  onOpenCertificate={(req) => setCertificateReq(req)}
                />
              ) : (
                <ClientDashboard
                  currentUser={currentUser}
                  requests={requests}
                  inventoryList={inventoryList}
                  initialPendingData={pendingRequestData}
                  onClearInitialPendingData={() => updatePendingRequestData(null)}
                  onSubmitRequest={handleSubmitRequest}
                  onUpdateRequest={handleUpdateRequest}
                  onOpenEmailInbox={(emailId) => {
                    setSelectedEmailModalId(emailId);
                    setIsEmailInboxOpen(true);
                  }}
                  onOpenAiAssistant={() => setIsAiModalOpen(true)}
                  onOpenCalculator={() => setIsCalculatorOpen(true)}
                  onOpenCertificate={(req) => setCertificateReq(req)}
                  onLogout={handleLogout}
                  onViewTransversal={() => setView('transversal-ecosystem')}
                  cartItems={cartItems}
                  onAddToCart={handleAddToCart}
                  onUpdateCartQty={handleUpdateCartQty}
                  onRemoveFromCart={handleRemoveFromCart}
                  onClearCart={handleClearCart}
                  onOpenCart={() => setIsCartOpen(true)}
                />
              )}
            </main>
          )}
        </>
      )}

      {/* Modales Flotantes - Disponibles tanto en la Home como en el Portal */}
      {isAiModalOpen && (
        <AiAssistantModal
          onClose={() => setIsAiModalOpen(false)}
          currentUser={currentUser}
          city={currentUser?.city}
          inventoryList={inventoryList}
          onSelectRecommendation={(surface, product, areaM2) => {
            setIsAiModalOpen(false);
            updatePendingRequestData({
              surfaceType: surface as any,
              productName: product,
              areaM2: areaM2 || 60,
            });
            if (currentUser) {
              setView('request');
            } else {
              setView('register');
            }
          }}
          onNavigate={(target) => {
            setIsAiModalOpen(false);
            if (target === 'orders') {
              if (currentUser) setView('transversal-ecosystem');
              else setView('login');
            } else if (target === 'calculator') {
              setIsCalculatorOpen(true);
            } else if (target === 'register') {
              setView('register');
            } else if (target === 'login') {
              setView('login');
            } else if (target === 'new_request') {
              if (currentUser) setView('request');
              else setView('register');
            }
          }}
        />
      )}

      {isCalculatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <TechnicalCalculator
            onClose={() => setIsCalculatorOpen(false)}
            onApplyCalculationToRequest={(surface, areaM2) => {
              if (!currentUser) {
                setIsCalculatorOpen(false);
                setView('register');
              } else {
                handleApplyCalculationToRequest(surface, areaM2);
              }
            }}
          />
        </div>
      )}

      {currentUser && certificateReq && (
        <QualityCertificateModal
          request={certificateReq}
          onClose={() => setCertificateReq(null)}
        />
      )}

      {currentUser && invoiceReq && (
        <InvoiceModal
          request={invoiceReq}
          onClose={() => setInvoiceReq(null)}
        />
      )}

      {/* Modal de Conexión y Sincronización con Supabase Cloud */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => {
          setIsSupabaseModalOpen(false);
          setSupabaseConnected(getSupabaseConfig().connected);
        }}
        requests={requests}
        onSyncComplete={() => {
          setSupabaseConnected(getSupabaseConfig().connected);
        }}
      />

      {/* Toast Flotante de Correos Enviados en Tiempo Real (Exclusivo para el cliente registrado) */}
      <EmailToast
        currentUser={currentUser}
        onOpenEmail={(email) => {
          setSelectedEmailModalId(email.id);
          setIsEmailInboxOpen(true);
        }}
      />

      {/* Modal Oficial de Buzón de Correos Electrónicos */}
      {isEmailInboxOpen && (
        <EmailInboxModal
          currentUser={currentUser}
          onClose={() => setIsEmailInboxOpen(false)}
          initialSelectedEmailId={selectedEmailModalId}
        />
      )}

      {/* Modal de Carrito de Compras Oficial ColorLink */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onCheckout={handleCheckoutCart}
        onExploreCatalog={() => {
          setIsCartOpen(false);
          setView('home');
          setTimeout(() => {
            const el = document.getElementById('catalog-pintuco-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }, 150);
        }}
      />

      {/* Modal de Fichas Técnicas Oficiales Pintuco */}
      <TechnicalSheetsModal
        isOpen={isTechnicalSheetsOpen}
        onClose={() => setIsTechnicalSheetsOpen(false)}
        onOpenCalculator={() => {
          setIsTechnicalSheetsOpen(false);
          setIsCalculatorOpen(true);
        }}
        onSelectProductForQuote={(productName) => {
          setIsTechnicalSheetsOpen(false);
          if (currentUser) {
            setView('request');
          } else {
            setView('register');
          }
        }}
      />

      {/* Modal de Ambientes Arquitectónicos ColorLink */}
      <AmbientesModal
        isOpen={isAmbientesModalOpen}
        onClose={() => setIsAmbientesModalOpen(false)}
        onSelectRoomAndQuote={(surface, productName, colorTag) => {
          setIsAmbientesModalOpen(false);
          updatePendingRequestData({
            surfaceType: surface,
            productName,
            colorName: colorTag.split('&')[0].trim(),
          });
          if (currentUser) {
            setView('request');
          } else {
            setView('register');
          }
        }}
        onNavigateHomeAmbientes={() => {
          setIsAmbientesModalOpen(false);
          setView('home');
          setTimeout(() => {
            const el = document.getElementById('ambientes');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />

      {/* Robot Asistente Virtual Flotante Oficial ColorLink - Presente en todas las páginas */}
      <AiFloatingRobot
        onOpenAdvisor={() => setIsAiModalOpen(true)}
      />
    </div>
  );
};
