import Link from 'next/link';
import { Mail, Phone, MapPin, Instagram, Facebook, Youtube, Heart, Shield, Truck, RotateCcw } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gray-900 dark:bg-[#0a0a0f] text-white pb-20 md:pb-0">
            {/* Trust Badges */}
            <div className="border-b border-gray-800 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 dark:bg-gray-800/30">
                            <div className="p-2 bg-[#2874F0]/20 rounded-lg">
                                <Truck size={22} className="text-[#2874F0]" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Free Delivery</p>
                                <p className="text-xs text-gray-400">On orders above ₹499</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 dark:bg-gray-800/30">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <Shield size={22} className="text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">COD Available</p>
                                <p className="text-xs text-gray-400">Pay on delivery</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 dark:bg-gray-800/30">
                            <div className="p-2 bg-orange-500/20 rounded-lg">
                                <RotateCcw size={22} className="text-orange-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Easy Returns</p>
                                <p className="text-xs text-gray-400">7-day return policy</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 dark:bg-gray-800/30">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Heart size={22} className="text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Quality Products</p>
                                <p className="text-xs text-gray-400">Handpicked for you</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 py-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* About */}
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase mb-4 tracking-wider">About</h3>
                        <ul className="space-y-2.5">
                            <li><Link href="/about" className="text-sm text-gray-400 hover:text-[#2874F0] transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="text-sm text-gray-400 hover:text-[#2874F0] transition-colors">Contact Us</Link></li>
                            <li><Link href="/about" className="text-sm text-gray-400 hover:text-[#2874F0] transition-colors">Careers</Link></li>
                        </ul>
                    </div>

                    {/* Help */}
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase mb-4 tracking-wider">Help</h3>
                        <ul className="space-y-2.5">
                            <li><Link href="/track-order" className="text-sm text-gray-400 hover:text-[#2874F0] transition-colors">Track Order</Link></li>
                            <li><Link href="/return-policy" className="text-sm text-gray-400 hover:text-[#2874F0] transition-colors">Return Policy</Link></li>
                            <li><Link href="/contact" className="text-sm text-gray-400 hover:text-[#2874F0] transition-colors">FAQ</Link></li>
                        </ul>
                    </div>

                    {/* Policy */}
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase mb-4 tracking-wider">Policy</h3>
                        <ul className="space-y-2.5">
                            <li><Link href="/return-policy" className="text-sm text-gray-400 hover:text-[#2874F0] transition-colors">Return Policy</Link></li>
                            <li><Link href="/privacy-policy" className="text-sm text-gray-400 hover:text-[#2874F0] transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-sm text-gray-400 hover:text-[#2874F0] transition-colors">Terms of Use</Link></li>
                        </ul>
                    </div>

                    {/* Store Info */}
                    <div>
                        <div className="flex items-center gap-2.5 mb-4">
                            <svg width="36" height="36" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="0" y="0" width="120" height="120" rx="10" fill="#FFE500" />
                                <rect x="5" y="5" width="110" height="110" rx="4" stroke="#2874F0" strokeWidth="3" fill="none" />
                                <rect x="11" y="11" width="98" height="98" rx="3" stroke="#2874F0" strokeWidth="2" fill="none" />
                                <text x="60" y="72" textAnchor="middle" fontFamily="'Arial Black', 'Impact', sans-serif" fontWeight="900" fontSize="54" fill="#2874F0" letterSpacing="-2">RJ</text>
                                <text x="60" y="96" textAnchor="middle" fontFamily="'Arial', 'Helvetica', sans-serif" fontWeight="800" fontSize="14" fill="#2874F0" letterSpacing="1">ESSENTIALS</text>
                            </svg>
                            <div>
                                <h3 className="text-sm font-bold text-white">RJ ESSENTIALS</h3>
                                <p className="text-[10px] text-gray-400 italic">Quality at Your Doorstep</p>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-2 mb-4">
                            <a href="mailto:support@rjessentials.com" className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#2874F0] transition-colors">
                                <Mail size={14} /> support@rjessentials.com
                            </a>
                            <a href="tel:+918287386760" className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#2874F0] transition-colors">
                                <Phone size={14} /> +91 82873 86760
                            </a>
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-3">
                            <a href="#" className="p-2 bg-gray-800 hover:bg-[#E1306C] rounded-lg transition-colors" aria-label="Instagram">
                                <Instagram size={16} />
                            </a>
                            <a href="#" className="p-2 bg-gray-800 hover:bg-[#1877F2] rounded-lg transition-colors" aria-label="Facebook">
                                <Facebook size={16} />
                            </a>
                            <a href="#" className="p-2 bg-gray-800 hover:bg-[#FF0000] rounded-lg transition-colors" aria-label="YouTube">
                                <Youtube size={16} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">© 2026 RJ ESSENTIALS. All rights reserved.</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>🇮🇳 Made in India</span>
                        <span>•</span>
                        <span>Powered by Next.js</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
