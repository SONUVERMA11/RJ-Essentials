import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
    productId: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    mrp: number;
    addedAt: number;
}

interface WishlistStore {
    items: WishlistItem[];
    addItem: (item: Omit<WishlistItem, 'addedAt'>) => void;
    removeItem: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    toggleItem: (item: Omit<WishlistItem, 'addedAt'>) => void;
    clearWishlist: () => void;
    getItemCount: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (item) => {
                set((state) => {
                    if (state.items.some((i) => i.productId === item.productId)) {
                        return state; // Already in wishlist
                    }
                    return { items: [...state.items, { ...item, addedAt: Date.now() }] };
                });
            },

            removeItem: (productId: string) => {
                set((state) => ({
                    items: state.items.filter((i) => i.productId !== productId),
                }));
            },

            isInWishlist: (productId: string) => {
                return get().items.some((i) => i.productId === productId);
            },

            toggleItem: (item) => {
                const state = get();
                if (state.isInWishlist(item.productId)) {
                    state.removeItem(item.productId);
                } else {
                    state.addItem(item);
                }
            },

            clearWishlist: () => set({ items: [] }),

            getItemCount: () => get().items.length,
        }),
        {
            name: 'rj-wishlist',
        }
    )
);
