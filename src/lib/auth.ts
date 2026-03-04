import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
    providers: [
        // Google OAuth for customers
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        // Credentials for admin
        CredentialsProvider({
            id: 'admin-login',
            name: 'Admin Login',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const adminEmail = process.env.ADMIN_EMAIL;
                const adminPassword = process.env.ADMIN_PASSWORD;

                if (!adminEmail || !adminPassword) {
                    return null;
                }

                if (credentials.email !== adminEmail) {
                    return null;
                }

                // Only bcrypt hashes are accepted — no plaintext fallback
                if (!adminPassword.startsWith('$2')) {
                    console.error('ADMIN_PASSWORD must be a bcrypt hash');
                    return null;
                }
                const isValid = await bcrypt.compare(credentials.password, adminPassword);

                if (!isValid) {
                    return null;
                }

                return {
                    id: '1',
                    email: adminEmail,
                    name: 'Admin',
                    role: 'admin',
                };
            },
        }),
        // Credentials for customers (email/password)
        CredentialsProvider({
            id: 'customer-login',
            name: 'Customer Login',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    await connectDB();
                    const user = await User.findOne({ email: credentials.email.toLowerCase() });

                    if (!user) {
                        return null;
                    }

                    const isValid = await bcrypt.compare(credentials.password, user.password);
                    if (!isValid) {
                        return null;
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        role: 'customer',
                    };
                } catch (error) {
                    console.error('Customer auth error:', error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days for customers
    },
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                // Check if admin login
                if ((user as { role?: string }).role === 'admin') {
                    token.role = 'admin';
                } else {
                    token.role = 'customer';
                }
            }
            if (account) {
                token.provider = account.provider;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { role?: string; id?: string }).role = token.role as string;
                (session.user as { id?: string }).id = token.sub as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
