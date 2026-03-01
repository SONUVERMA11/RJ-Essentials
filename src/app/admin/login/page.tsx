'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('admin-login', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
                setLoading(false);
            } else {
                // Hard redirect to ensure cookies are properly set before middleware runs
                window.location.href = '/admin/dashboard';
            }
        } catch {
            setError('Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel — Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2874F0] via-[#1e5bbf] to-[#143d8a] flex-col justify-between p-12 relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white/3 rounded-full -translate-x-1/2 -translate-y-1/2" />

                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <svg width="52" height="52" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="0" y="0" width="120" height="120" rx="10" fill="#FFE500" />
                            <rect x="5" y="5" width="110" height="110" rx="4" stroke="#2874F0" strokeWidth="3" fill="none" />
                            <rect x="11" y="11" width="98" height="98" rx="3" stroke="#2874F0" strokeWidth="2" fill="none" />
                            <text x="60" y="72" textAnchor="middle" fontFamily="'Arial Black', 'Impact', sans-serif" fontWeight="900" fontSize="54" fill="#2874F0" letterSpacing="-2">RJ</text>
                            <text x="60" y="96" textAnchor="middle" fontFamily="'Arial', 'Helvetica', sans-serif" fontWeight="800" fontSize="14" fill="#2874F0" letterSpacing="1">ESSENTIALS</text>
                        </svg>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">RJ ESSENTIALS</h1>
                            <p className="text-blue-200 text-sm mt-1 italic">Quality at Your Doorstep</p>
                        </div>
                    </Link>
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <ShieldCheck className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-lg">Admin Control Center</h3>
                                <p className="text-blue-200 text-sm">Manage your entire store from one place</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Products', desc: 'Add, edit & manage' },
                            { label: 'Orders', desc: 'Track & fulfill' },
                            { label: 'Analytics', desc: 'Revenue insights' },
                            { label: 'Customers', desc: 'Reviews & messages' },
                        ].map((item) => (
                            <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <p className="text-white font-medium text-sm">{item.label}</p>
                                <p className="text-blue-200 text-xs mt-0.5">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-blue-300 text-xs relative z-10">
                    © {new Date().getFullYear()} RJ ESSENTIALS. Secure admin access.
                </p>
            </div>

            {/* Right Panel — Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-6">
                <div className="w-full max-w-md">
                    {/* Mobile branding */}
                    <div className="lg:hidden mb-8">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <svg width="40" height="40" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="0" y="0" width="120" height="120" rx="10" fill="#FFE500" />
                                <rect x="5" y="5" width="110" height="110" rx="4" stroke="#2874F0" strokeWidth="3" fill="none" />
                                <rect x="11" y="11" width="98" height="98" rx="3" stroke="#2874F0" strokeWidth="2" fill="none" />
                                <text x="60" y="72" textAnchor="middle" fontFamily="'Arial Black', 'Impact', sans-serif" fontWeight="900" fontSize="54" fill="#2874F0" letterSpacing="-2">RJ</text>
                                <text x="60" y="96" textAnchor="middle" fontFamily="'Arial', 'Helvetica', sans-serif" fontWeight="800" fontSize="14" fill="#2874F0" letterSpacing="1">ESSENTIALS</text>
                            </svg>
                            <div>
                                <h1 className="text-2xl font-bold text-[#2874F0]">RJ ESSENTIALS</h1>
                                <p className="text-gray-400 text-xs italic">Quality at Your Doorstep</p>
                            </div>
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 md:p-10">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-11 h-11 bg-[#2874F0] rounded-xl flex items-center justify-center">
                                <ShieldCheck className="text-white" size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Admin Login</h2>
                                <p className="text-sm text-gray-400">Enter your credentials to continue</p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800 flex items-center gap-2">
                                <span className="text-lg">⚠️</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                                <div className="relative group">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2874F0] transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@rjessentials.com"
                                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#2874F0] focus:bg-white dark:focus:bg-gray-900 outline-none transition-all placeholder:text-gray-400"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                                <div className="relative group">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2874F0] transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#2874F0] focus:bg-white dark:focus:bg-gray-900 outline-none transition-all placeholder:text-gray-400"
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#2874F0] to-[#1e5bbf] hover:from-[#1e5bbf] hover:to-[#143d8a] text-white py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Sign In to Dashboard
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center space-y-3">
                        <Link href="/" className="text-sm text-gray-400 hover:text-[#2874F0] transition-colors inline-flex items-center gap-1">
                            ← Back to Store
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
