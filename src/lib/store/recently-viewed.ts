import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecentlyViewedStore {
    items: Array<{
        productId: string;
        name: string;
        slug: string;
        image: string;
        price: number;
        mrp: number;
        viewedAt: number;
    }>;
    addItem: (item: Omit<RecentlyViewedStore['items'][0], 'viewedAt'>) => void;
    getItems: () => RecentlyViewedStore['items'];
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (item) => {
                set((state) => {
                    const filtered = state.items.filter((i) => i.productId !== item.productId);
                    const newItems = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, 20);
                    return { items: newItems };
                });
            },

            getItems: () => get().items,
        }),
        {
            name: 'rj-recently-viewed',
        }
    )
);
