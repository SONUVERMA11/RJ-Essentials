import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Checks if the current request is from an authenticated admin.
 * Supports two auth methods:
 * 1. API Key (for agents) — via Authorization: Bearer <AGENT_API_KEY> header
 * 2. Session (for browser) — via NextAuth session cookie
 * Returns a 401 NextResponse if not authorized, or null if authorized.
 */
export async function requireAdmin(req?: NextRequest): Promise<NextResponse | null> {
    // Check API key first (for agent access)
    if (req) {
        const authHeader = req.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const key = authHeader.slice(7);
            if (key && key === process.env.AGENT_API_KEY) {
                return null; // Authorized via API key
            }
        }
    }

    // Fall back to session auth (for browser access)
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}

/**
 * Escapes special regex characters to prevent NoSQL injection
 * when using $regex MongoDB operator with user input.
 */
export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
