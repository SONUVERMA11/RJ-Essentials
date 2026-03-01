export default function ReturnPolicyPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-sm p-6 md:p-10 shadow-sm prose prose-sm max-w-none">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Return & Refund Policy</h1>
                <p className="text-gray-600">At RJ ESSENTIALS, we want you to be completely satisfied with your purchase. If you&apos;re not happy, we offer a simple return and refund process.</p>
                <h2 className="text-lg font-bold text-gray-800 mt-6">Return Window</h2>
                <p className="text-gray-600">You can return most items within <strong>7 days</strong> of delivery. Items must be unused, unworn (for fashion), and in their original packaging.</p>
                <h2 className="text-lg font-bold text-gray-800 mt-6">How to Return</h2>
                <ol className="list-decimal pl-5 text-gray-600 space-y-2">
                    <li>Contact us via WhatsApp or the Contact page with your Order ID</li>
                    <li>Share photos of the product (if defective/damaged)</li>
                    <li>We will arrange a pickup or provide return shipping instructions</li>
                    <li>Refund will be processed within 5-7 business days after receiving the item</li>
                </ol>
                <h2 className="text-lg font-bold text-gray-800 mt-6">Non-Returnable Items</h2>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>Intimate wear and innerwear</li><li>Products with broken seals</li><li>Customized/personalized items</li>
                </ul>
                <h2 className="text-lg font-bold text-gray-800 mt-6">Refund Method</h2>
                <p className="text-gray-600">For COD orders, refunds are processed via UPI/bank transfer to the account you provide.</p>
            </div>
        </div>
    );
}
