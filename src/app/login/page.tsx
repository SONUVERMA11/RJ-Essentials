'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { Package, Zap, Tag, Bell, ArrowLeft, Truck, Mail, Lock, Eye, EyeOff, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

function LoginContent() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';
    const error = searchParams.get('error');

    const [tab, setTab] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFormError('');

        const result = await signIn('customer-login', {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            setFormError('Invalid email or password');
        } else {
            window.location.href = callbackUrl;
        }
        setLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setFormError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setFormError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setFormError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setFormError(data.error || 'Registration failed');
                setLoading(false);
                return;
            }

            // Auto sign-in after registration
            const result = await signIn('customer-login', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setFormError('Account created! Please sign in.');
                setTab('signin');
            } else {
                toast.success('Account created successfully!');
                window.location.href = callbackUrl;
            }
        } catch {
            setFormError('Something went wrong. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel — Branding & Illustration */}
            <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#2874F0] via-[#4b8af5] to-[#1e5bbf] flex-col justify-between p-12 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
                <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-white/5 rounded-full" />
                <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-white/3 rounded-full" />

                {/* Top — Logo */}
                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <svg width="48" height="48" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="0" y="0" width="120" height="120" rx="10" fill="#FFE500" />
                            <rect x="5" y="5" width="110" height="110" rx="4" stroke="#2874F0" strokeWidth="3" fill="none" />
                            <rect x="11" y="11" width="98" height="98" rx="3" stroke="#2874F0" strokeWidth="2" fill="none" />
                            <text x="60" y="72" textAnchor="middle" fontFamily="'Arial Black', 'Impact', sans-serif" fontWeight="900" fontSize="54" fill="#2874F0" letterSpacing="-2">RJ</text>
                            <text x="60" y="96" textAnchor="middle" fontFamily="'Arial', 'Helvetica', sans-serif" fontWeight="800" fontSize="14" fill="#2874F0" letterSpacing="1">ESSENTIALS</text>
                        </svg>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">RJ ESSENTIALS</h1>
                            <p className="text-blue-200 text-xs italic">Quality at Your Doorstep</p>
                        </div>
                    </Link>
                </div>

                {/* Middle — Value Props */}
                <div className="relative z-10 space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white leading-tight">
                            Your one-stop shop<br />for everything you need
                        </h2>
                        <p className="text-blue-200 mt-3 text-base leading-relaxed max-w-sm">
                            Sign in to unlock personalized recommendations, track orders, and get exclusive deals.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: Truck, label: 'Free Delivery', desc: 'On orders above ₹499' },
                            { icon: Tag, label: 'Best Prices', desc: 'Guaranteed lowest prices' },
                            { icon: Package, label: 'Easy Returns', desc: '7-day return policy' },
                            { icon: Zap, label: 'COD Available', desc: 'Pay cash at your door' },
                        ].map((item) => (
                            <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
                                <item.icon className="text-blue-100 mb-2" size={20} />
                                <p className="text-white font-semibold text-sm">{item.label}</p>
                                <p className="text-blue-200 text-xs mt-0.5">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom — Trust */}
                <div className="relative z-10 flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {['bg-orange-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400'].map((bg, i) => (
                            <div key={i} className={`w-8 h-8 ${bg} rounded-full border-2 border-white/20 flex items-center justify-center text-white text-[10px] font-bold`}>
                                {['R', 'A', 'S', 'P'][i]}
                            </div>
                        ))}
                    </div>
                    <p className="text-blue-200 text-sm">Trusted by <span className="text-white font-semibold">10,000+</span> happy customers</p>
                </div>
            </div>

            {/* Right Panel — Login Form */}
            <div className="w-full lg:w-[55%] flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Mobile header */}
                    <div className="lg:hidden mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#2874F0] transition-colors mb-6">
                            <ArrowLeft size={16} /> Back to store
                        </Link>
                        <div className="flex items-center gap-3">
                            <svg width="40" height="40" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="0" y="0" width="120" height="120" rx="10" fill="#FFE500" />
                                <rect x="5" y="5" width="110" height="110" rx="4" stroke="#2874F0" strokeWidth="3" fill="none" />
                                <rect x="11" y="11" width="98" height="98" rx="3" stroke="#2874F0" strokeWidth="2" fill="none" />
                                <text x="60" y="72" textAnchor="middle" fontFamily="'Arial Black', 'Impact', sans-serif" fontWeight="900" fontSize="54" fill="#2874F0" letterSpacing="-2">RJ</text>
                                <text x="60" y="96" textAnchor="middle" fontFamily="'Arial', 'Helvetica', sans-serif" fontWeight="800" fontSize="14" fill="#2874F0" letterSpacing="1">ESSENTIALS</text>
                            </svg>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">RJ ESSENTIALS</h1>
                                <p className="text-xs text-gray-400 italic">Quality at Your Doorstep</p>
                            </div>
                        </div>
                    </div>

                    {/* Card */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                        {/* Card Header */}
                        <div className="px-8 pt-8 pb-4">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {tab === 'signin' ? 'Welcome back!' : 'Create Account'}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm leading-relaxed">
                                {tab === 'signin'
                                    ? 'Sign in to track orders, save favorites, and get personalized recommendations.'
                                    : 'Join RJ ESSENTIALS for exclusive deals and easy shopping.'}
                            </p>
                        </div>

                        <div className="px-8 pb-8">
                            {(error || formError) && (
                                <div className="mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800 flex items-center gap-2">
                                    <span className="text-base">⚠️</span>
                                    {formError || (error === 'OAuthAccountNotLinked'
                                        ? 'This email is already linked to another sign-in method.'
                                        : 'Something went wrong. Please try again.')}
                                </div>
                            )}

                            {/* Google Sign In */}
                            <button
                                onClick={() => signIn('google', { callbackUrl })}
                                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all duration-200 group"
                            >
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-3 my-5">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
                                <span className="text-xs text-gray-400 uppercase font-medium tracking-wider">or</span>
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
                            </div>

                            {/* Tab Toggle */}
                            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-5">
                                <button
                                    onClick={() => { setTab('signin'); setFormError(''); }}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${tab === 'signin'
                                        ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => { setTab('signup'); setFormError(''); }}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${tab === 'signup'
                                        ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    Create Account
                                </button>
                            </div>

                            {/* Sign In Form */}
                            {tab === 'signin' && (
                                <form onSubmit={handleSignIn} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                                        <div className="relative group">
                                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2874F0]" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#2874F0] focus:bg-white dark:focus:bg-gray-900 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                                        <div className="relative group">
                                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2874F0]" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#2874F0] focus:bg-white dark:focus:bg-gray-900 outline-none transition-all"
                                                required
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-[#2874F0] to-[#1e5bbf] hover:from-[#1e5bbf] hover:to-[#143d8a] text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>Sign In <ArrowRight size={16} /></>
                                        )}
                                    </button>
                                </form>
                            )}

                            {/* Sign Up Form */}
                            {tab === 'signup' && (
                                <form onSubmit={handleSignUp} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                                        <div className="relative group">
                                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2874F0]" />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Your name"
                                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#2874F0] focus:bg-white dark:focus:bg-gray-900 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                                        <div className="relative group">
                                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2874F0]" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#2874F0] focus:bg-white dark:focus:bg-gray-900 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                                        <div className="relative group">
                                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2874F0]" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Min 6 characters"
                                                className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#2874F0] focus:bg-white dark:focus:bg-gray-900 outline-none transition-all"
                                                required
                                                minLength={6}
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                                        <div className="relative group">
                                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2874F0]" />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#2874F0] focus:bg-white dark:focus:bg-gray-900 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-[#388E3C] to-[#2e7d32] hover:from-[#2e7d32] hover:to-[#1b5e20] text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>Create Account <ArrowRight size={16} /></>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 space-y-4 text-center">
                        <p className="text-xs text-gray-400 leading-relaxed">
                            By continuing, you agree to our{' '}
                            <Link href="/terms" className="text-gray-500 dark:text-gray-300 underline underline-offset-2 hover:text-[#2874F0]">Terms</Link>
                            {' & '}
                            <Link href="/privacy-policy" className="text-gray-500 dark:text-gray-300 underline underline-offset-2 hover:text-[#2874F0]">Privacy Policy</Link>
                        </p>

                        <div className="flex items-center justify-center gap-2">
                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                            <Link href="/admin/login" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                Admin Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-[#2874F0] rounded-full animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
