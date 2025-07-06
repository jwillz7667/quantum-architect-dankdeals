import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface EmailData {
  to: string;
  orderNumber: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  deliveryAddress: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export const sendOrderConfirmationEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    // In production, this would integrate with an email service like SendGrid, AWS SES, etc.
    // For now, we'll store the email in a notifications table

    const emailContent = `
      <h2>Order Confirmation - ${emailData.orderNumber}</h2>
      <p>Thank you for your order! A team member will contact you within 5 minutes to confirm delivery details.</p>
      
      <h3>Order Details:</h3>
      <ul>
        ${emailData.items
          .map(
            (item) =>
              `<li>${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}</li>`
          )
          .join('')}
      </ul>
      
      <p><strong>Total: $${emailData.totalAmount.toFixed(2)}</strong></p>
      
      <h3>Delivery Address:</h3>
      <p>
        ${emailData.deliveryAddress.street} ${emailData.deliveryAddress.apartment || ''}<br>
        ${emailData.deliveryAddress.city}, ${emailData.deliveryAddress.state} ${emailData.deliveryAddress.zipCode}
      </p>
      
      <p><strong>Payment Method:</strong> Cash on Delivery</p>
      
      <h3>What's Next?</h3>
      <ol>
        <li>A team member will call you within 5 minutes</li>
        <li>Your order will be prepared</li>
        <li>A licensed driver will deliver your order</li>
        <li>Have your ID and cash ready</li>
      </ol>
      
      <p>Questions? Contact us at support@dankdealsmn.com or (612) 555-DANK</p>
    `;

    // Store notification in database
    const { error } = await supabase.from('notifications').insert({
      user_email: emailData.to,
      type: 'order_confirmation',
      subject: `Order Confirmation - ${emailData.orderNumber}`,
      content: emailContent,
      metadata: {
        orderNumber: emailData.orderNumber,
        totalAmount: emailData.totalAmount,
      },
    });

    if (error) {
      logger.error('Failed to store email notification', error);
      return false;
    }

    logger.info('Order confirmation email queued', {
      context: {
        orderNumber: emailData.orderNumber,
        email: emailData.to,
      },
    });

    // In production, you would call your email service API here
    // Example: await sendgrid.send({ to: emailData.to, subject, html: emailContent });

    return true;
  } catch (error) {
    logger.error('Failed to send order confirmation email', error as Error);
    return false;
  }
};
