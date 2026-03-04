import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// In-memory reset token store (for production, use Redis or DB)
const resetTokens = new Map<string, { email: string; expires: number }>();

// POST: Request password reset
export async function POST(req: NextRequest) {
    try {
        // Strict rate limiting on password reset
        const rateLimited = checkRateLimit(`reset:${getClientIp(req)}`, { maxRequests: 3, windowSeconds: 300 });
        if (rateLimited) return rateLimited;

        await dbConnect();
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({ message: 'If an account exists with this email, you will receive a reset link.' });
        }

        // Generate reset token
        const token = crypto.randomBytes(32).toString('hex');
        resetTokens.set(token, { email: user.email, expires: Date.now() + 30 * 60 * 1000 }); // 30 min

        // In production, send email with reset link
        // For now, log the token (you'd integrate with your email service)
        console.log(`Password reset token for ${user.email}: ${token}`);

        // TODO: Send email with link like: ${baseUrl}/reset-password?token=${token}
        // await sendPasswordResetEmail({ email: user.email, token, name: user.name });

        return NextResponse.json({
            message: 'If an account exists with this email, you will receive a reset link.',
        });
    } catch {
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}

// PUT: Reset password with token
export async function PUT(req: NextRequest) {
    try {
        await dbConnect();
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        const resetData = resetTokens.get(token);

        if (!resetData || Date.now() > resetData.expires) {
            resetTokens.delete(token);
            return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
        }

        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.findOneAndUpdate(
            { email: resetData.email },
            { password: hashedPassword }
        );

        resetTokens.delete(token);

        return NextResponse.json({ message: 'Password reset successfully. You can now sign in.' });
    } catch {
        return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }
}
