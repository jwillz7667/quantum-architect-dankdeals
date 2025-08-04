// Order validation using Zod schemas
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { ValidationError } from './types.ts';
import '../_shared/deno-types.d.ts';

// Phone number validation and formatting
const phoneTransform = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith('1')) return cleaned;
  throw new Error('Invalid phone number format');
};

// Delivery address schema
export const DeliveryAddressSchema = z.object({
  street: z.string().min(1, 'Street address is required').max(200),
  apartment: z.string().max(50).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().length(2).default('MN'),
  zipcode: z.string().regex(/^\d{5}$/, 'Zipcode must be 5 digits'),
  instructions: z.string().max(500).optional(),
});

// Order item schema
export const OrderItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
  name: z.string().min(1, 'Product name is required'),
  weight: z.number().positive().optional(),
});

// Create order request schema
export const CreateOrderSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required').max(100),
  customer_email: z.string().email('Invalid email format'),
  customer_phone: z.string().transform(phoneTransform),
  delivery_first_name: z.string().min(1, 'First name is required').max(50),
  delivery_last_name: z.string().min(1, 'Last name is required').max(50),
  delivery_address: DeliveryAddressSchema,
  items: z.array(OrderItemSchema).min(1, 'Order must contain at least one item'),
  subtotal: z.number().positive('Subtotal must be positive'),
  tax: z.number().nonnegative('Tax cannot be negative'),
  delivery_fee: z.number().nonnegative('Delivery fee cannot be negative'),
  total: z.number().positive('Total must be positive'),
  payment_method: z.enum(['cash', 'card']).default('cash'),
  user_id: z.string().uuid().nullable().optional(),
});

// Validator class
export class OrderValidator {
  static validate(data: unknown): z.infer<typeof CreateOrderSchema> {
    try {
      const validated = CreateOrderSchema.parse(data);

      // Additional business validation
      const calculatedTotal = validated.subtotal + validated.tax + validated.delivery_fee;
      if (Math.abs(calculatedTotal - validated.total) > 0.01) {
        throw new ValidationError(
          'Total amount does not match sum of subtotal, tax, and delivery fee'
        );
      }

      // Validate item totals
      const itemsTotal = validated.items.reduce(
        (sum: number, item: z.infer<typeof OrderItemSchema>) => sum + item.price * item.quantity,
        0
      );
      if (Math.abs(itemsTotal - validated.subtotal) > 0.01) {
        throw new ValidationError('Subtotal does not match sum of item prices');
      }

      return validated;
    } catch (error) {
      if (error instanceof (z as any).ZodError) {
        const errors = error.errors.map((e: z.ZodIssue) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        throw new ValidationError('Validation failed', errors);
      }
      throw error;
    }
  }

  static validateEmail(email: string): boolean {
    return z.string().email().safeParse(email).success;
  }

  static formatPhone(phone: string): string {
    try {
      return phoneTransform(phone);
    } catch {
      return phone;
    }
  }
}
