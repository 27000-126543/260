import { create } from 'zustand';
import type { User, CartItem, Land, Product } from '../../shared/types';

interface AppState {
  user: User | null;
  isLoggedIn: boolean;
  cart: CartItem[];
  selectedLand: Land | null;
  setUser: (user: User | null) => void;
  setLoggedIn: (value: boolean) => void;
  addToCart: (product: Product, specIndex: number, quantity: number) => void;
  removeFromCart: (productId: string, specIndex: number) => void;
  updateCartQuantity: (productId: string, specIndex: number, quantity: number) => void;
  clearCart: () => void;
  setSelectedLand: (land: Land | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: {
    id: 'user001',
    phone: '13800138000',
    name: '张农夫',
    role: 'farmer',
    idCardVerified: true,
    memberLevel: 'gold',
    creditScore: 780,
    createdAt: '2024-01-15T00:00:00Z',
  },
  isLoggedIn: true,
  cart: [],
  selectedLand: null,
  setUser: (user) => set({ user }),
  setLoggedIn: (value) => set({ isLoggedIn: value }),
  addToCart: (product, specIndex, quantity) => {
    const existing = get().cart.find(
      (item) => item.productId === product.id && item.specIndex === specIndex
    );
    if (existing) {
      set({
        cart: get().cart.map((item) =>
          item.productId === product.id && item.specIndex === specIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      });
    } else {
      set({
        cart: [...get().cart, { productId: product.id, product, specIndex, quantity }],
      });
    }
  },
  removeFromCart: (productId, specIndex) =>
    set({
      cart: get().cart.filter(
        (item) => !(item.productId === productId && item.specIndex === specIndex)
      ),
    }),
  updateCartQuantity: (productId, specIndex, quantity) =>
    set({
      cart: get().cart.map((item) =>
        item.productId === productId && item.specIndex === specIndex
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      ),
    }),
  clearCart: () => set({ cart: [] }),
  setSelectedLand: (land) => set({ selectedLand: land }),
}));
