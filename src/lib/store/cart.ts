import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    productId: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    mrp: number;
    quantity: number;
    variant?: string;
    stock: number;
    meeshoLink?: string;
}

interface CartStore {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (productId: string, variant?: string) => void;
    updateQuantity: (productId: string, quantity: number, variant?: string) => void;
    clearCart: () => void;
    getItemCount: () => number;
    getSubtotal: () => number;
    getMrpTotal: () => number;
    getDiscount: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (item: CartItem) => {
                set((state) => {
                    const existingIndex = state.items.findIndex(
                        (i) => i.productId === item.productId && i.variant === item.variant
                    );

                    if (existingIndex > -1) {
                        const updated = [...state.items];
                        updated[existingIndex].quantity = Math.min(
                            updated[existingIndex].quantity + item.quantity,
                            10
                        );
                        return { items: updated };
                    }

                    return { items: [...state.items, { ...item, quantity: Math.min(item.quantity, 10) }] };
                });
            },

            removeItem: (productId: string, variant?: string) => {
                set((state) => ({
                    items: state.items.filter(
                        (i) => !(i.productId === productId && i.variant === variant)
                    ),
                }));
            },

            updateQuantity: (productId: string, quantity: number, variant?: string) => {
                set((state) => ({
                    items: state.items.map((i) =>
                        i.productId === productId && i.variant === variant
                            ? { ...i, quantity: Math.max(1, Math.min(quantity, 10)) }
                            : i
                    ),
                }));
            },

            clearCart: () => set({ items: [] }),

            getItemCount: () => get().items.reduce((acc, item) => acc + item.quantity, 0),

            getSubtotal: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),

            getMrpTotal: () => get().items.reduce((acc, item) => acc + item.mrp * item.quantity, 0),

            getDiscount: () => {
                const state = get();
                return state.getMrpTotal() - state.getSubtotal();
            },
        }),
        {
            name: 'rj-cart',
        }
    )
);
