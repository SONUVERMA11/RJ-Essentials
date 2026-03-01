import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="bg-[#172337] text-white pb-20 md:pb-0">
            <div className="max-w-7xl mx-auto px-4 py-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* About */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">About</h3>
                        <ul className="space-y-2">
                            <li><Link href="/about" className="text-sm text-gray-300 hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="text-sm text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
                            <li><Link href="/about" className="text-sm text-gray-300 hover:text-white transition-colors">Careers</Link></li>
                        </ul>
                    </div>

                    {/* Help */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Help</h3>
                        <ul className="space-y-2">
                            <li><Link href="/track-order" className="text-sm text-gray-300 hover:text-white transition-colors">Track Order</Link></li>
                            <li><Link href="/return-policy" className="text-sm text-gray-300 hover:text-white transition-colors">Return Policy</Link></li>
                            <li><Link href="/contact" className="text-sm text-gray-300 hover:text-white transition-colors">FAQ</Link></li>
                        </ul>
                    </div>

                    {/* Policy */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Policy</h3>
                        <ul className="space-y-2">
                            <li><Link href="/return-policy" className="text-sm text-gray-300 hover:text-white transition-colors">Return Policy</Link></li>
                            <li><Link href="/privacy-policy" className="text-sm text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-sm text-gray-300 hover:text-white transition-colors">Terms of Use</Link></li>
                        </ul>
                    </div>

                    {/* Store Info */}
                    <div>
                        <div className="flex items-center gap-2.5 mb-3">
                            <svg width="36" height="36" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="0" y="0" width="120" height="120" rx="10" fill="#FFE500" />
                                <rect x="5" y="5" width="110" height="110" rx="4" stroke="#2874F0" strokeWidth="3" fill="none" />
                                <rect x="11" y="11" width="98" height="98" rx="3" stroke="#2874F0" strokeWidth="2" fill="none" />
                                <text x="60" y="72" textAnchor="middle" fontFamily="'Arial Black', 'Impact', sans-serif" fontWeight="900" fontSize="54" fill="#2874F0" letterSpacing="-2">RJ</text>
                                <text x="60" y="96" textAnchor="middle" fontFamily="'Arial', 'Helvetica', sans-serif" fontWeight="800" fontSize="14" fill="#2874F0" letterSpacing="1">ESSENTIALS</text>
                            </svg>
                            <div>
                                <h3 className="text-sm font-bold text-white">RJ ESSENTIALS</h3>
                                <p className="text-[9px] text-gray-400 italic">Quality at Your Doorstep</p>
                            </div>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-[#388E3C] text-white px-3 py-1.5 rounded text-xs font-medium">
                            <span>✅</span> COD Available Across India
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-8 pt-6 border-t border-gray-600 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-400">© 2024 RJ ESSENTIALS. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400">Follow us:</span>
                        <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Instagram</a>
                        <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Facebook</a>
                        <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">YouTube</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
