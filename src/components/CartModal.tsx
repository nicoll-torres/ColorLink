import React from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, CheckCircle2, Package, X } from '../icons';
import { WarehouseInventoryItem, OrderItem } from '../types';
import { getProductImage, isPaintProduct } from '../data';

export interface CartProductItem {
  id: string;
  item: WarehouseInventoryItem;
  quantity: number;
  format: 'galon' | 'cuñete' | 'cuarto' | 'unidad';
  selectedColor?: { name: string; hex: string };
  unitPrice: number;
  totalCostCOP: number;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartProductItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onExploreCatalog: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onExploreCatalog,
}) => {
  if (!isOpen) return null;

  const totalCOP = cartItems.reduce((acc, ci) => acc + ci.totalCostCOP, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header en Azul Institucional ColorLink */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-blue-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold block">
                MI PEDIDO · TIENDA OFICIAL COLORLINK
              </span>
              <h3 className="text-base sm:text-lg font-bold font-['Space_Grotesk'] text-white">
                Carrito de Compras ({cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'})
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Productos del Carrito */}
        <div className="p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto space-y-3">
          {cartItems.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
                <ShoppingCart className="w-8 h-8 text-amber-600" />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                Tu carrito de compras está vacío
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Explora el catálogo oficial de pinturas, esmaltes y herramientas Pintuco. Selecciona el tono deseado y agrégalo directamente a tu orden.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExploreCatalog();
                }}
                className="mt-2 px-5 py-2.5 bg-[#082857] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
              >
                <span>Explorar Catálogo de Pinturas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cartItems.map((ci) => {
                const isPaint = isPaintProduct(ci.item);
                return (
                  <div
                    key={ci.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
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
                          onClick={() => onUpdateQty(ci.id, -1)}
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
                          onClick={() => onUpdateQty(ci.id, 1)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold text-sm cursor-pointer"
                          title="Aumentar"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal por Ítem */}
                      <div className="text-right min-w-[90px]">
                        <span className="font-mono font-bold text-slate-900 text-sm block">
                          ${ci.totalCostCOP.toLocaleString('es-CO')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">COP</span>
                      </div>

                      {/* Botón Eliminar */}
                      <button
                        type="button"
                        onClick={() => onRemoveItem(ci.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Quitar este producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer del Carrito con Total y Checkout */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div>
              <span className="text-[10.5px] font-mono text-slate-500 uppercase block font-semibold">
                Total del Pedido (IVA incluido):
              </span>
              <span className="text-xl font-black font-mono text-slate-900">
                ${totalCOP.toLocaleString('es-CO')} COP
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                id="btn-modal-continue-shopping"
              >
                <span>🛍️ Seguir Comprando</span>
              </button>

              <button
                type="button"
                onClick={onClearCart}
                className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                Vaciar
              </button>

              <button
                type="button"
                onClick={onCheckout}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm shadow-blue-500/25 cursor-pointer"
                id="btn-modal-checkout-cart"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Confirmar & Despachar Pedido</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
