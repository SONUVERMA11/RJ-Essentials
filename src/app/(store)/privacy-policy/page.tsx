export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-sm p-6 md:p-10 shadow-sm prose prose-sm max-w-none">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Privacy Policy</h1>
                <p className="text-gray-600">RJ ESSENTIALS is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.</p>
                <h2 className="text-lg font-bold text-gray-800 mt-6">Information We Collect</h2>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>Name, phone number, and email (for order processing)</li>
                    <li>Delivery address (for shipping)</li>
                    <li>Browsing data (cookies, analytics)</li>
                </ul>
                <h2 className="text-lg font-bold text-gray-800 mt-6">How We Use It</h2>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>To process and deliver your orders</li><li>To send order confirmations and updates</li>
                    <li>To improve our website and services</li><li>To respond to your inquiries</li>
                </ul>
                <h2 className="text-lg font-bold text-gray-800 mt-6">Data Security</h2>
                <p className="text-gray-600">We implement industry-standard security measures. We do not store any payment information since we operate on COD only.</p>
                <h2 className="text-lg font-bold text-gray-800 mt-6">Contact</h2>
                <p className="text-gray-600">For privacy-related queries, contact us via WhatsApp or email.</p>
            </div>
        </div>
    );
}
