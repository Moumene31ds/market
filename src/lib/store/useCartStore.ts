import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, HeldOrder, SerializedProduct, ActiveSession } from '@/types';

interface CartState {
  cartItems: CartItem[];
  heldOrders: HeldOrder[];
  activeSession: ActiveSession | null;
  taxRate: number; // e.g. 0.19 for 19% tax rate
  discountAmount: number; // Flat discount amount
  searchQuery: string;
  
  // Cart operations
  addToCart: (product: SerializedProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Adjustments
  applyDiscount: (amount: number) => void;
  setTaxRate: (rate: number) => void;
  
  // Hold / Resume
  holdCurrentOrder: (notes?: string) => void;
  resumeOrder: (heldOrderId: string) => void;
  deleteHeldOrder: (heldOrderId: string) => void;
  
  // Session
  setActiveSession: (session: ActiveSession | null) => void;
  setSearchQuery: (query: string) => void;
  
  // Computed values helpers
  getCartSubtotal: () => number;
  getCartTax: () => number;
  getCartTotal: () => number;
  getCartCost: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartItems: [],
      heldOrders: [],
      activeSession: null,
      taxRate: 0.15, // Default 15% VAT
      discountAmount: 0,
      searchQuery: '',

      addToCart: (product, quantity = 1) => {
        const currentItems = get().cartItems;
        const existingItem = currentItems.find((item) => item.product.id === product.id);

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          // Block if exceeding stock
          if (newQuantity > product.stock) {
            alert(`الكمية المطلوبة تتجاوز المخزون المتاح (${product.stock})`);
            return;
          }
          set({
            cartItems: currentItems.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: newQuantity }
                : item
            ),
          });
        } else {
          // Block if exceeding stock
          if (quantity > product.stock) {
            alert(`الكمية المطلوبة تتجاوز المخزون المتاح (${product.stock})`);
            return;
          }
          set({
            cartItems: [...currentItems, { product, quantity }],
          });
        }
      },

      removeFromCart: (productId) => {
        set({
          cartItems: get().cartItems.filter((item) => item.product.id !== productId),
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        const currentItems = get().cartItems;
        const item = currentItems.find((item) => item.product.id === productId);
        if (item && quantity > item.product.stock) {
          alert(`الكمية المطلوبة تتجاوز المخزون المتاح (${item.product.stock})`);
          return;
        }

        set({
          cartItems: currentItems.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => {
        set({ cartItems: [], discountAmount: 0 });
      },

      applyDiscount: (amount) => {
        if (amount < 0) return;
        set({ discountAmount: amount });
      },

      setTaxRate: (rate) => {
        if (rate < 0) return;
        set({ taxRate: rate });
      },

      holdCurrentOrder: (notes = '') => {
        const { cartItems } = get();
        if (cartItems.length === 0) return;

        const newHeldOrder: HeldOrder = {
          id: crypto.randomUUID(),
          items: [...cartItems],
          notes,
          createdAt: new Date().toISOString(),
        };

        set({
          heldOrders: [...get().heldOrders, newHeldOrder],
          cartItems: [],
          discountAmount: 0,
        });
      },

      resumeOrder: (heldOrderId) => {
        const heldOrder = get().heldOrders.find((order) => order.id === heldOrderId);
        if (!heldOrder) return;

        // Load the items to the active cart, and remove it from held orders
        set({
          cartItems: heldOrder.items,
          heldOrders: get().heldOrders.filter((order) => order.id !== heldOrderId),
        });
      },

      deleteHeldOrder: (heldOrderId) => {
        set({
          heldOrders: get().heldOrders.filter((order) => order.id !== heldOrderId),
        });
      },

      setActiveSession: (session) => {
        set({ activeSession: session });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      getCartSubtotal: () => {
        return get().cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
      },

      getCartTax: () => {
        const subtotal = get().getCartSubtotal();
        const discount = get().discountAmount;
        const taxableAmount = Math.max(0, subtotal - discount);
        return taxableAmount * get().taxRate;
      },

      getCartTotal: () => {
        const subtotal = get().getCartSubtotal();
        const discount = get().discountAmount;
        const tax = get().getCartTax();
        return Math.max(0, subtotal - discount + tax);
      },

      getCartCost: () => {
        return get().cartItems.reduce((acc, item) => acc + item.product.cost * item.quantity, 0);
      },
    }),
    {
      name: 'market-pos-cart-storage',
      partialize: (state) => ({
        cartItems: state.cartItems,
        heldOrders: state.heldOrders,
        activeSession: state.activeSession,
        taxRate: state.taxRate,
        discountAmount: state.discountAmount,
      }),
    }
  )
);
