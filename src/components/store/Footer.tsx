import Link from 'next/link';
import { Mail, Phone, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-black text-white pb-20 md:pb-0 font-sans tracking-tight">
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* About */}
                    <div>
                        <h3 className="text-xs font-black text-white uppercase mb-6 tracking-[0.2em] border-l-2 border-[#2874F0] pl-3">Company</h3>
                        <ul className="space-y-4">
                            <li><Link href="/about" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">About Us</Link></li>
                            <li><Link href="/contact" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Contact Us</Link></li>
                            <li><Link href="/about" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Careers</Link></li>
                        </ul>
                    </div>

                    {/* Help */}
                    <div>
                        <h3 className="text-xs font-black text-white uppercase mb-6 tracking-[0.2em] border-l-2 border-[#2874F0] pl-3">Support</h3>
                        <ul className="space-y-4">
                            <li><Link href="/track-order" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Track Order</Link></li>
                            <li><Link href="/return-policy" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Return Policy</Link></li>
                            <li><Link href="/contact" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">FAQ</Link></li>
                        </ul>
                    </div>

                    {/* Policy */}
                    <div>
                        <h3 className="text-xs font-black text-white uppercase mb-6 tracking-[0.2em] border-l-2 border-[#2874F0] pl-3">Legal</h3>
                        <ul className="space-y-4">
                            <li><Link href="/return-policy" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Return Policy</Link></li>
                            <li><Link href="/privacy-policy" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all">Terms & Conditions</Link></li>
                        </ul>
                    </div>

                    {/* Store Info */}
                    <div className="col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-white p-1 rounded-lg">
                                <svg width="32" height="32" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0" y="0" width="120" height="120" rx="10" fill="#FFE500" />
                                    <rect x="5" y="5" width="110" height="110" rx="4" stroke="#2874F0" strokeWidth="3" fill="none" />
                                    <text x="60" y="72" textAnchor="middle" fontFamily="'Arial Black', 'Impact', sans-serif" fontWeight="900" fontSize="54" fill="#2874F0" letterSpacing="-2">RJ</text>
                                    <text x="60" y="96" textAnchor="middle" fontFamily="'Arial', 'Helvetica', sans-serif" fontWeight="800" fontSize="14" fill="#2874F0" letterSpacing="1">ESSENTIALS</text>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white tracking-tight">RJ ESSENTIALS</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Quality First</p>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-3 mb-8">
                            <a href="mailto:support@rjessentials.app" className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
                                <div className="p-2 bg-white/5 rounded-lg"><Mail size={16} /></div>
                                support@rjessentials.app
                            </a>
                            <a href="tel:+918287386760" className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
                                <div className="p-2 bg-white/5 rounded-lg"><Phone size={16} /></div>
                                +91 82873 86760
                            </a>
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-4">
                            <a href="https://www.instagram.com/therjessentials?igsh=MTI2ZHd6MWs1cW5meA==" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-[#E1306C] rounded-xl transition-all hover:-translate-y-1" aria-label="Instagram">
                                <Instagram size={20} />
                            </a>
                            <a href="https://www.facebook.com/share/1LRsr9VzDt/" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-[#1877F2] rounded-xl transition-all hover:-translate-y-1" aria-label="Facebook">
                                <Facebook size={20} />
                            </a>
                            <a href="mailto:support@rjessentials.app" className="p-3 bg-white/5 hover:bg-[#2874F0] rounded-xl transition-all hover:-translate-y-1" aria-label="Email">
                                <Mail size={20} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/5 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs text-gray-500 font-medium">© 2026 RJ ESSENTIALS. All rights reserved.</p>
                    <div className="flex items-center gap-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-green-500"></span> 🇮🇳 Made in India</span>
                        <span className="hidden md:inline text-gray-800">•</span>
                        <span>Next.js Architecture</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
