// src/lib/api/schemas.ts
import { z } from 'zod';

/**
 * API Schemas
 * Zod schemas for validating API requests and responses
 */

// Common schemas
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email().max(255);
export const phoneSchema = z.string().regex(/^\+?1?\d{10,14}$/);
export const dateSchema = z.string().datetime();
export const priceSchema = z.number().nonnegative().multipleOf(0.01);
export const percentageSchema = z.number().min(0).max(100);

// Pagination schemas
export const paginationParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  });

// Product schemas
export const productVariantSchema = z.object({
  id: uuidSchema,
  product_id: uuidSchema,
  name: z.string().min(1).max(100),
  price: z.number().positive(), // Price in cents
  weight_grams: z.number().positive(),
  inventory_count: z.number().int().nonnegative(),
  is_active: z.boolean().default(true),
  created_at: dateSchema,
  updated_at: dateSchema,
});

export const productSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  category: z.enum(['flower', 'edibles', 'concentrates', 'accessories']),
  image_url: z.string().url(),
  thc_content: z.number().nullable(),
  cbd_content: z.number().nullable(),
  strain_type: z.enum(['indica', 'sativa', 'hybrid']).nullable(),
  effects: z.array(z.string()).nullable(),
  terpenes: z.array(z.string()).nullable(),
  is_active: z.boolean().default(true),
  featured: z.boolean().default(false),
  created_at: dateSchema,
  updated_at: dateSchema,
  variants: z.array(productVariantSchema).optional(),
});

export const productCreateSchema = productSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  variants: true,
});

export const productUpdateSchema = productCreateSchema.partial();

// Order schemas
export const orderItemSchema = z.object({
  id: uuidSchema,
  order_id: uuidSchema,
  product_id: uuidSchema,
  product_name: z.string(),
  product_price: priceSchema,
  product_weight_grams: z.number().positive(),
  quantity: z.number().int().positive(),
  unit_price: priceSchema,
  total_price: priceSchema,
  created_at: dateSchema,
});

export const orderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
]);

export const orderSchema = z.object({
  id: uuidSchema,
  order_number: z.string(),
  user_id: uuidSchema.nullable(),
  status: orderStatusSchema,
  subtotal: priceSchema,
  tax_amount: priceSchema,
  delivery_fee: priceSchema,
  total_amount: priceSchema,
  delivery_address: z.object({
    street: z.string(),
    apartment: z.string().optional(),
    city: z.string(),
    state: z.string().length(2),
    zip_code: z.string().regex(/^\d{5}$/),
  }),
  delivery_instructions: z.string().optional(),
  customer_email: emailSchema,
  customer_phone: phoneSchema,
  estimated_delivery: dateSchema.optional(),
  delivered_at: dateSchema.nullable(),
  created_at: dateSchema,
  updated_at: dateSchema,
  order_items: z.array(orderItemSchema).optional(),
});

export const createOrderSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: emailSchema,
  phone: phoneSchema,
  dateOfBirth: z.string().refine((date) => {
    const age = new Date().getFullYear() - new Date(date).getFullYear();
    return age >= 21;
  }, 'Must be 21 or older'),
  deliveryAddress: z.object({
    street: z.string().min(1),
    apartment: z.string().optional(),
    city: z.string().min(1),
    state: z.literal('MN'),
    zipCode: z.string().regex(/^\d{5}$/),
    deliveryInstructions: z.string().optional(),
  }),
  items: z
    .array(
      z.object({
        productId: uuidSchema,
        variantId: uuidSchema,
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  subtotal: priceSchema,
  taxAmount: priceSchema,
  deliveryFee: priceSchema,
  totalAmount: priceSchema,
  paymentMethod: z.literal('cash'),
});

// User schemas
export const userProfileSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  phone: phoneSchema.nullable(),
  date_of_birth: z.string().nullable(),
  is_verified: z.boolean().default(false),
  is_admin: z.boolean().default(false),
  created_at: dateSchema,
  updated_at: dateSchema,
});

export const updateProfileSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  phone: phoneSchema.optional(),
  date_of_birth: z.string().optional(),
});

// Auth schemas
export const signUpSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: phoneSchema,
  dateOfBirth: z.string(),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

// Cart schemas
export const cartItemSchema = z.object({
  id: z.string(),
  productId: uuidSchema,
  variantId: uuidSchema,
  name: z.string(),
  variant: z.union([
    z.string(),
    z.object({
      name: z.string(),
      weight_grams: z.number(),
    }),
  ]),
  price: priceSchema,
  quantity: z.number().int().positive(),
  image: z.string().optional(),
  category: z.string(),
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  totalItems: z.number().int().nonnegative(),
  totalPrice: priceSchema,
  subtotal: priceSchema,
  taxAmount: priceSchema,
  deliveryFee: priceSchema,
});

// API response schemas
export const apiSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.union([apiSuccessSchema(dataSchema), apiErrorSchema]);

// Type exports
export type PaginationParams = z.infer<typeof paginationParamsSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductCreate = z.infer<typeof productCreateSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type Order = z.infer<typeof orderSchema>;
export type CreateOrder = z.infer<typeof createOrderSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type SignUp = z.infer<typeof signUpSchema>;
export type SignIn = z.infer<typeof signInSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;
