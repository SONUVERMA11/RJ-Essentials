import { NextResponse } from 'next/server';

/**
 * Simple in-memory rate limiter using a sliding window.
 * For production, consider Redis-based rate limiting.
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}, 5 * 60 * 1000);

interface RateLimitConfig {
    /** Maximum number of requests in the window */
    maxRequests: number;
    /** Window duration in seconds */
    windowSeconds: number;
}

/**
 * Check rate limit for a given identifier (usually IP + route).
 * Returns null if within limit, or a 429 NextResponse if exceeded.
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = { maxRequests: 10, windowSeconds: 60 }
): NextResponse | null {
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;

    const existing = rateLimitMap.get(identifier);

    if (!existing || now > existing.resetTime) {
        rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
        return null;
    }

    if (existing.count >= config.maxRequests) {
        const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
                status: 429,
                headers: { 'Retry-After': String(retryAfter) },
            }
        );
    }

    existing.count++;
    return null;
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    const realIp = req.headers.get('x-real-ip');
    if (realIp) return realIp;
    return '127.0.0.1';
}
