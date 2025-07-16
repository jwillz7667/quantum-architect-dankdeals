import { supabase } from '@/integrations/supabase/client';
import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend((import.meta.env.VITE_RESEND_API_KEY as string) || '');

interface OrderEmailData {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    weight_grams: number;
  }>;
  deliveryAddress: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    instructions?: string;
  };
  totals: {
    subtotal: number;
    tax: number;
    delivery: number;
    total: number;
  };
}

export class EmailService {
  private static formatCurrency(amount: number): string {
    return `$${Number(amount).toFixed(2)}`;
  }

  private static createOrderConfirmationHTML(data: OrderEmailData): string {
    const { orderNumber, customerName, items, deliveryAddress, totals } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - DankDeals MN</title>
  <style>
    body { 
      font-family: 'Arial', sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background-color: #f4f4f4; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      padding: 20px; 
      border-radius: 10px; 
      box-shadow: 0 0 20px rgba(0,0,0,0.1); 
    }
    .header { 
      text-align: center; 
      border-bottom: 3px solid #2d5a2d; 
      padding-bottom: 20px; 
      margin-bottom: 30px; 
    }
    .logo { 
      font-size: 28px; 
      font-weight: bold; 
      color: #2d5a2d; 
      margin-bottom: 10px; 
    }
    .order-number { 
      background: #2d5a2d; 
      color: white; 
      padding: 10px 20px; 
      border-radius: 25px; 
      display: inline-block; 
      font-weight: bold; 
      margin: 20px 0; 
    }
    .section { 
      margin: 25px 0; 
      padding: 20px; 
      background: #f9f9f9; 
      border-radius: 8px; 
    }
    .section h3 { 
      color: #2d5a2d; 
      margin-top: 0; 
      border-bottom: 2px solid #2d5a2d; 
      padding-bottom: 10px; 
    }
    .item { 
      display: flex; 
      justify-content: space-between; 
      padding: 10px 0; 
      border-bottom: 1px solid #eee; 
    }
    .item:last-child { 
      border-bottom: none; 
    }
    .total { 
      background: #2d5a2d; 
      color: white; 
      padding: 15px; 
      border-radius: 8px; 
      font-size: 18px; 
      font-weight: bold; 
      text-align: center; 
    }
    .important-note { 
      background: #fff3cd; 
      border: 1px solid #ffeaa7; 
      color: #856404; 
      padding: 15px; 
      border-radius: 8px; 
      margin: 20px 0; 
    }
    .footer { 
      text-align: center; 
      margin-top: 30px; 
      padding-top: 20px; 
      border-top: 1px solid #eee; 
      color: #666; 
      font-size: 14px; 
    }
    .contact-info { 
      background: #e8f5e8; 
      padding: 15px; 
      border-radius: 8px; 
      text-align: center; 
      margin: 20px 0; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🌿 DankDeals MN</div>
      <p>Premium Cannabis Delivery Service</p>
      <div class="order-number">Order #${orderNumber}</div>
    </div>

    <h2>Thank you for your order, ${customerName}!</h2>
    <p>We've received your order and it's being prepared for delivery. You'll receive updates as your order progresses.</p>

    <div class="section">
      <h3>📦 Order Details</h3>
      ${items
        .map(
          (item) => `
        <div class="item">
          <div>
            <strong>${item.name}</strong><br>
            <small>Quantity: ${item.quantity} | Weight: ${item.weight_grams}g</small>
          </div>
          <div><strong>${this.formatCurrency(item.price * item.quantity)}</strong></div>
        </div>
      `
        )
        .join('')}
    </div>

    <div class="section">
      <h3>🚚 Delivery Information</h3>
      <p><strong>Delivery Address:</strong><br>
      ${deliveryAddress.street}${deliveryAddress.apartment ? ` ${deliveryAddress.apartment}` : ''}<br>
      ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zipCode}</p>
      
      ${deliveryAddress.instructions ? `<p><strong>Delivery Instructions:</strong><br>${deliveryAddress.instructions}</p>` : ''}
      
      <p><strong>Phone:</strong> ${deliveryAddress.phone}</p>
      <p><strong>Estimated Delivery:</strong> Within 2-4 hours</p>
    </div>

    <div class="section">
      <h3>💰 Order Summary</h3>
      <div class="item">
        <span>Subtotal:</span>
        <span>${this.formatCurrency(totals.subtotal)}</span>
      </div>
      <div class="item">
        <span>Tax:</span>
        <span>${this.formatCurrency(totals.tax)}</span>
      </div>
      <div class="item">
        <span>Delivery Fee:</span>
        <span>${this.formatCurrency(totals.delivery)}</span>
      </div>
      <div class="total">
        Total: ${this.formatCurrency(totals.total)}
      </div>
    </div>

    <div class="important-note">
      <strong>⚠️ Important Reminders:</strong>
      <ul>
        <li>Payment is <strong>cash on delivery</strong> - please have exact change ready</li>
        <li>Valid ID required - must be 21+ years old</li>
        <li>Tip suggestions: 15% (${this.formatCurrency(totals.total * 0.15)}), 18% (${this.formatCurrency(totals.total * 0.18)}), 20% (${this.formatCurrency(totals.total * 0.2)})</li>
        <li>Please be available at the delivery address during the estimated time</li>
      </ul>
    </div>

    <div class="contact-info">
      <h3>📞 Need Help?</h3>
      <p><strong>Call or Text:</strong> <a href="tel:763-247-5378">(763) 247-5378</a></p>
      <p><strong>Email:</strong> <a href="mailto:support@dankdealsmn.com">support@dankdealsmn.com</a></p>
    </div>

    <div class="footer">
      <p>This email was sent to confirm your order with DankDeals MN.</p>
      <p>&copy; 2025 DankDeals MN. All rights reserved.</p>
      <p><small>This email contains information about cannabis products. Must be 21+ to receive.</small></p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Send order confirmation email immediately via Resend API
   */
  static async sendOrderConfirmationEmail(orderData: OrderEmailData): Promise<boolean> {
    try {
      // Create email content
      const htmlContent = this.createOrderConfirmationHTML(orderData);

      // Send via Resend SDK
      const { data, error } = await resend.emails.send({
        from: 'DankDeals MN <info@dankdealsmn.com>',
        to: [orderData.customerEmail],
        subject: `Order Confirmation #${orderData.orderNumber} - DankDeals MN`,
        html: htmlContent,
        replyTo: ['support@dankdealsmn.com'],
        tags: [
          { name: 'category', value: 'order_confirmation' },
          { name: 'order_number', value: orderData.orderNumber },
        ],
      });

      if (error) {
        console.error('Resend API error:', error);
        return false;
      }

      // Log the successful email send
      await supabase.from('email_logs').insert({
        email_id: data?.id,
        event_type: 'sent',
        to_email: orderData.customerEmail,
        from_email: 'info@dankdealsmn.com',
        subject: `Order Confirmation #${orderData.orderNumber} - DankDeals MN`,
        event_data: {
          order_number: orderData.orderNumber,
          customer_name: orderData.customerName,
          total_amount: orderData.totals.total,
        },
      });

      console.log(`Order confirmation email sent to ${orderData.customerEmail}, ID: ${data?.id}`);
      return true;
    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
      return false;
    }
  }

  /**
   * Queue an order confirmation email for sending (fallback method)
   * This adds the email to the email_queue table for processing by the edge function
   */
  static async queueOrderConfirmationEmail(orderData: OrderEmailData): Promise<boolean> {
    try {
      // Create email content
      const htmlContent = this.createOrderConfirmationHTML(orderData);

      // Add to email queue for processing
      const { error } = await supabase.from('email_queue').insert({
        recipient_email: orderData.customerEmail,
        sender_email: 'info@dankdealsmn.com',
        sender_name: 'DankDeals MN',
        subject: `Order Confirmation #${orderData.orderNumber} - DankDeals MN`,
        html_content: htmlContent,
        email_type: 'order_confirmation',
        status: 'pending',
        metadata: {
          order_number: orderData.orderNumber,
          customer_name: orderData.customerName,
          total_amount: orderData.totals.total,
        },
      });

      if (error) {
        console.error('Error queueing order confirmation email:', error);
        return false;
      }

      console.log(`Order confirmation email queued for ${orderData.customerEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to queue order confirmation email:', error);
      return false;
    }
  }

  /**
   * Queue an order status update email
   */
  static async queueOrderStatusEmail(
    orderNumber: string,
    customerEmail: string,
    status: string,
    message: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from('email_queue').insert({
        recipient_email: customerEmail,
        sender_email: 'info@dankdealsmn.com',
        sender_name: 'DankDeals MN',
        subject: `Order Update #${orderNumber} - ${status}`,
        html_content: `
            <h2>Order Update</h2>
            <p>Your order #${orderNumber} status has been updated to: <strong>${status}</strong></p>
            <p>${message}</p>
            <p>Thank you for choosing DankDeals MN!</p>
          `,
        email_type: 'order_update',
        status: 'pending',
        metadata: {
          order_number: orderNumber,
          order_status: status,
        },
      });

      return !error;
    } catch (error) {
      console.error('Failed to queue order status email:', error);
      return false;
    }
  }
}
