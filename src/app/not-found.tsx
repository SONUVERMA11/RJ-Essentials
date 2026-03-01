import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#F1F3F6] flex items-center justify-center px-4">
            <div className="text-center bg-white rounded-sm p-12 shadow-sm max-w-md">
                <div className="text-6xl mb-4">🛒</div>
                <h1 className="text-7xl font-bold text-[#2874F0] mb-2">404</h1>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Page Not Found</h2>
                <p className="text-gray-500 mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-[#2874F0] text-white px-8 py-3 rounded-sm font-bold hover:bg-blue-600 transition-colors"
                >
                    Continue Shopping
                </Link>
            </div>
        </div>
    );
}
