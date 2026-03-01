export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-sm p-6 md:p-10 shadow-sm prose prose-sm max-w-none">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Terms & Conditions</h1>
                <p className="text-gray-600">By using RJ ESSENTIALS, you agree to the following terms:</p>
                <h2 className="text-lg font-bold text-gray-800 mt-6">Orders</h2>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>All orders are Cash on Delivery (COD)</li>
                    <li>Orders are subject to availability</li>
                    <li>We reserve the right to cancel orders if items are out of stock</li>
                    <li>Delivery typically takes 5-7 business days</li>
                </ul>
                <h2 className="text-lg font-bold text-gray-800 mt-6">Pricing</h2>
                <p className="text-gray-600">All prices are in INR (₹) and inclusive of applicable taxes. Prices are subject to change without notice. The price at the time of order confirmation is final.</p>
                <h2 className="text-lg font-bold text-gray-800 mt-6">Returns</h2>
                <p className="text-gray-600">Please refer to our Return Policy page for detailed return and refund information.</p>
                <h2 className="text-lg font-bold text-gray-800 mt-6">Intellectual Property</h2>
                <p className="text-gray-600">All content on this website including text, images, logos, and design is the property of RJ ESSENTIALS.</p>
                <h2 className="text-lg font-bold text-gray-800 mt-6">Contact</h2>
                <p className="text-gray-600">For any questions about these terms, please contact us via our Contact page.</p>
            </div>
        </div>
    );
}
