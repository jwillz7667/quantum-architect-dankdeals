// Database types that mirror the Supabase schema
// This file provides type definitions for database entities

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  price: number;
  thc_content: number | null;
  cbd_content: number | null;
  strain_type: string | null;
  effects: string[] | null;
  flavors: string[] | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  stock_quantity: number | null;
  is_featured: boolean | null;
  is_active: boolean;
  weight_grams: number | null;
  lab_tested: boolean | null;
  lab_results_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Address {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  street_address: string;
  apartment: string | null;
  city: string;
  state: string;
  zip_code: string;
  phone: string | null;
  delivery_instructions: string | null;
  type: string | null;
  label: string | null;
  is_default: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Order {
  id: string;
  user_id: string | null;
  order_number: string;
  status: string | null;
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  total_amount: number;
  customer_email: string | null;
  customer_phone_number: string | null;
  delivery_first_name: string;
  delivery_last_name: string;
  delivery_street_address: string;
  delivery_apartment: string | null;
  delivery_city: string;
  delivery_state: string;
  delivery_zip_code: string;
  delivery_phone: string | null;
  delivery_instructions: string | null;
  delivery_date: string | null;
  delivery_time_start: string | null;
  delivery_time_end: string | null;
  payment_method: string | null;
  payment_status: string | null;
  notes: string | null;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string | null;
  product_id: string | null;
  product_name: string;
  product_description: string | null;
  product_category: string | null;
  product_price: number;
  product_weight_grams: number | null;
  product_thc_percentage: number | null;
  product_cbd_percentage: number | null;
  product_strain_type: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string | null;
}