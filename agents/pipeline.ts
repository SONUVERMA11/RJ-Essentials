/**
 * Pipeline State
 * ──────────────
 * Shared state object that flows between agents, making them interconnected.
 * Each agent reads from previous agents' output and writes its own results.
 */

import type { Product } from './api-client.js';

// ─── Shared Pipeline State ───────────────────────────────────────────
export interface PipelineState {
    startedAt: string;
    completedSteps: string[];
    errors: { agent: string; error: string }[];

    // From Research Agent
    research: {
        ran: boolean;
        productsFound: number;
        topProducts: { name: string; score: number; meeshoPrice: number; cleanImages: number }[];
        queuedForListing: number;
    };

    // From Listing Agent
    listing: {
        ran: boolean;
        created: number;
        failed: number;
        skipped: number;
        createdProductIds: string[];
    };

    // From Inventory Agent
    inventory: {
        ran: boolean;
        outOfStock: { name: string; id: string }[];
        lowStock: { name: string; id: string; stock: number }[];
        priceChanges: { name: string; oldPrice: number; newPrice: number }[];
        healthyCount: number;
    };

    // From Order Management Agent
    orders: {
        ran: boolean;
        totalOrders: number;
        pendingCount: number;
        staleCount: number;
        todayRevenue: number;
        meeshoItemsCount: number;
    };

    // From Analytics Agent
    analytics: {
        ran: boolean;
        totalRevenue: number;
        topProducts: { name: string; id: string; soldCount: number; revenue: number }[];
        worstProducts: { name: string; id: string }[];
        recommendations: string[];
        topCategory: string;
    };

    // From Social Media Marketing Agent
    marketing: {
        ran: boolean;
        generated: number;
        failed: number;
        contentDir: string;
    };

    // From Website Manager Agent
    website: {
        ran: boolean;
        sectionsUpdated: number;
        bannersUpdated: number;
        settingsUpdated: string[];
        announcementUpdated: boolean;
    };

    // All active products (shared reference for multiple agents)
    allProducts: Product[];
}

export function createEmptyPipeline(): PipelineState {
    return {
        startedAt: new Date().toISOString(),
        completedSteps: [],
        errors: [],
        research: { ran: false, productsFound: 0, topProducts: [], queuedForListing: 0 },
        listing: { ran: false, created: 0, failed: 0, skipped: 0, createdProductIds: [] },
        inventory: { ran: false, outOfStock: [], lowStock: [], priceChanges: [], healthyCount: 0 },
        orders: { ran: false, totalOrders: 0, pendingCount: 0, staleCount: 0, todayRevenue: 0, meeshoItemsCount: 0 },
        analytics: { ran: false, totalRevenue: 0, topProducts: [], worstProducts: [], recommendations: [], topCategory: '' },
        marketing: { ran: false, generated: 0, failed: 0, contentDir: '' },
        website: { ran: false, sectionsUpdated: 0, bannersUpdated: 0, settingsUpdated: [], announcementUpdated: false },
        allProducts: [],
    };
}

export function markStepComplete(state: PipelineState, step: string): void {
    state.completedSteps.push(step);
}

export function addError(state: PipelineState, agent: string, error: string): void {
    state.errors.push({ agent, error });
}
