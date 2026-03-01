import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderEmailData {
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
        image?: string;
    }>;
    total: number;
    address: string;
    estimatedDelivery: string;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
    const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${item.price.toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

    try {
        await resend.emails.send({
            from: 'RJ ESSENTIALS <orders@rjessentials.com>',
            to: data.customerEmail,
            subject: `Order Confirmed - ${data.orderId} | RJ ESSENTIALS`,
            html: `
        <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
          <div style="background:#2874F0;padding:20px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">RJ ESSENTIALS</h1>
            <p style="color:#fff;margin:5px 0 0;font-size:14px;">Quality at Your Doorstep</p>
          </div>
          <div style="padding:30px 20px;">
            <div style="text-align:center;margin-bottom:30px;">
              <div style="font-size:48px;">✅</div>
              <h2 style="color:#388e3c;margin:10px 0;">Order Placed Successfully!</h2>
              <p style="color:#666;font-size:14px;">Thank you for your order, ${data.customerName}!</p>
            </div>
            <div style="background:#f5f5f5;padding:15px;border-radius:8px;margin-bottom:20px;">
              <p style="margin:0;font-size:14px;"><strong>Order ID:</strong> ${data.orderId}</p>
              <p style="margin:5px 0 0;font-size:14px;"><strong>Payment:</strong> Cash on Delivery (COD)</p>
              <p style="margin:5px 0 0;font-size:14px;"><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <thead>
                <tr style="background:#f5f5f5;">
                  <th style="padding:8px;text-align:left;">Item</th>
                  <th style="padding:8px;text-align:center;">Qty</th>
                  <th style="padding:8px;text-align:right;">Price</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:12px 8px;font-weight:bold;font-size:16px;">Total (COD)</td>
                  <td style="padding:12px 8px;text-align:right;font-weight:bold;font-size:16px;color:#388e3c;">₹${data.total.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
            <div style="background:#f5f5f5;padding:15px;border-radius:8px;margin-bottom:20px;">
              <p style="margin:0;font-size:14px;"><strong>Delivery Address:</strong></p>
              <p style="margin:5px 0 0;font-size:14px;color:#666;">${data.address}</p>
            </div>
            <div style="text-align:center;margin-top:30px;">
              <a href="${process.env.NEXTAUTH_URL}/track-order" style="background:#2874F0;color:#fff;padding:12px 30px;border-radius:4px;text-decoration:none;font-weight:bold;">Track Your Order</a>
            </div>
          </div>
          <div style="background:#f5f5f5;padding:15px;text-align:center;font-size:12px;color:#999;">
            <p style="margin:0;">© 2024 RJ ESSENTIALS. All rights reserved.</p>
            <p style="margin:5px 0 0;">Need help? WhatsApp us at +91 ${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.slice(2)}</p>
          </div>
        </div>
      `,
        });
    } catch (error) {
        console.error('Email send error:', error);
    }
}

export async function sendAdminOrderNotification(data: OrderEmailData) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    try {
        await resend.emails.send({
            from: 'RJ ESSENTIALS <orders@rjessentials.com>',
            to: adminEmail,
            subject: `🛒 New Order - ${data.orderId} - ₹${data.total.toLocaleString('en-IN')}`,
            html: `
        <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>New Order Received!</h2>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Customer:</strong> ${data.customerName}</p>
          <p><strong>Phone:</strong> ${data.customerPhone}</p>
          <p><strong>Total:</strong> ₹${data.total.toLocaleString('en-IN')} (COD)</p>
          <p><strong>Address:</strong> ${data.address}</p>
          <h3>Items:</h3>
          <ul>
            ${data.items.map(i => `<li>${i.name} x ${i.quantity} — ₹${i.price.toLocaleString('en-IN')}</li>`).join('')}
          </ul>
          <a href="${process.env.NEXTAUTH_URL}/admin/orders" style="background:#2874F0;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;">View in Admin Panel</a>
        </div>
      `,
        });
    } catch (error) {
        console.error('Admin email error:', error);
    }
}

export async function sendStatusUpdateEmail(
    email: string,
    customerName: string,
    orderId: string,
    status: string
) {
    const statusMessages: Record<string, string> = {
        confirmed: 'Your order has been confirmed and is being processed.',
        shipped: 'Your order has been shipped! It\'s on its way to you.',
        'out-for-delivery': 'Your order is out for delivery! You\'ll receive it soon.',
        delivered: 'Your order has been delivered. Thank you for shopping with us!',
        cancelled: 'Your order has been cancelled. If you have any questions, please contact us.',
    };

    try {
        await resend.emails.send({
            from: 'RJ ESSENTIALS <orders@rjessentials.com>',
            to: email,
            subject: `Order ${orderId} - ${status.charAt(0).toUpperCase() + status.slice(1)} | RJ ESSENTIALS`,
            html: `
        <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#2874F0;padding:20px;text-align:center;">
            <h1 style="color:#fff;margin:0;">RJ ESSENTIALS</h1>
          </div>
          <div style="padding:30px 20px;">
            <h2>Hi ${customerName},</h2>
            <p>${statusMessages[status] || `Your order status has been updated to: ${status}`}</p>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <div style="text-align:center;margin-top:20px;">
              <a href="${process.env.NEXTAUTH_URL}/track-order" style="background:#2874F0;color:#fff;padding:12px 30px;border-radius:4px;text-decoration:none;">Track Your Order</a>
            </div>
          </div>
        </div>
      `,
        });
    } catch (error) {
        console.error('Status email error:', error);
    }
}
