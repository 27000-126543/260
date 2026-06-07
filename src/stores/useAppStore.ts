import { create } from 'zustand';
import type { User, CartItem, Land, Product } from '../../shared/types';
import { api } from '../utils/api';

interface AppState {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  cart: CartItem[];
  selectedLand: Land | null;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (phone: string, name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoggedIn: (value: boolean) => void;
  addToCart: (product: Product, specIndex: number, quantity: number) => void;
  removeFromCart: (productId: string, specIndex: number) => void;
  updateCartQuantity: (productId: string, specIndex: number, quantity: number) => void;
  clearCart: () => void;
  setSelectedLand: (land: Land | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isLoggedIn: !!localStorage.getItem('auth_token'),
  loading: false,
  cart: [],
  selectedLand: null,

  login: async (phone: string, password: string) => {
    try {
      set({ loading: true });
      const result: any = await api.auth.login({ phone, password });
      localStorage.setItem('auth_token', result.token);
      const userData = result.user as User;
      set({ user: userData, isLoggedIn: true, loading: false });
      return { success: true };
    } catch (error: any) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },

  register: async (phone: string, name: string, password: string) => {
    try {
      set({ loading: true });
      const result: any = await api.auth.register({ phone, name, password });
      localStorage.setItem('auth_token', result.token);
      const userData = result.user as User;
      set({ user: userData, isLoggedIn: true, loading: false });
      return { success: true };
    } catch (error: any) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, isLoggedIn: false, cart: [] });
  },

  fetchProfile: async () => {
    try {
      const profile: any = await api.auth.getProfile();
      set({ user: profile });
    } catch (error) {
      console.error('Fetch profile failed:', error);
    }
  },

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
