import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * Checks if the current request is from an authenticated admin.
 * Returns a 401 NextResponse if not authorized, or null if authorized.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
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
