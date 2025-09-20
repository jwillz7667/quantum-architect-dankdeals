export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          age_verified?: boolean;
          age_verified_at?: string | null;
          marketing_consent?: boolean;
          terms_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          delivery_address?: {
            street: string;
            apartment?: string;
            city: string;
            state: string;
            zipCode: string;
            deliveryInstructions?: string;
          } | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          age_verified?: boolean;
          age_verified_at?: string | null;
          marketing_consent?: boolean;
          terms_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          delivery_address?: {
            street: string;
            apartment?: string;
            city: string;
            state: string;
            zipCode: string;
            deliveryInstructions?: string;
          } | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          age_verified?: boolean;
          age_verified_at?: string | null;
          marketing_consent?: boolean;
          terms_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          delivery_address?: {
            street: string;
            apartment?: string;
            city: string;
            state: string;
            zipCode: string;
            deliveryInstructions?: string;
          } | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category_id: string | null
          price: number
          thc_percentage: number | null
          cbd_percentage: number | null
          strain_type: string | null
          effects: string[] | null
          flavors: string[] | null
          image_url: string | null
          gallery_urls: string[] | null
          stock_quantity: number
          is_featured: boolean
          is_active: boolean
          weight_grams: number | null
          lab_tested: boolean
          lab_results_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          category_id?: string | null
          price: number
          thc_percentage?: number | null
          cbd_percentage?: number | null
          strain_type?: string | null
          effects?: string[] | null
          flavors?: string[] | null
          image_url?: string | null
          gallery_urls?: string[] | null
          stock_quantity?: number
          is_featured?: boolean
          is_active?: boolean
          weight_grams?: number | null
          lab_tested?: boolean
          lab_results_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          category_id?: string | null
          price?: number
          thc_percentage?: number | null
          cbd_percentage?: number | null
          strain_type?: string | null
          effects?: string[] | null
          flavors?: string[] | null
          image_url?: string | null
          gallery_urls?: string[] | null
          stock_quantity?: number
          is_featured?: boolean
          is_active?: boolean
          weight_grams?: number | null
          lab_tested?: boolean
          lab_results_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          type: string
          first_name: string
          last_name: string
          street_address: string
          apartment: string | null
          city: string
          state: string
          zip_code: string
          phone: string | null
          delivery_instructions: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: string
          first_name: string
          last_name: string
          street_address: string
          apartment?: string | null
          city: string
          state?: string
          zip_code: string
          phone?: string | null
          delivery_instructions?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          first_name?: string
          last_name?: string
          street_address?: string
          apartment?: string | null
          city?: string
          state?: string
          zip_code?: string
          phone?: string | null
          delivery_instructions?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          status?: string;
          subtotal: number;
          tax_amount: number;
          delivery_fee: number;
          total_amount: number;
          delivery_first_name: string;
          delivery_last_name: string;
          delivery_street_address: string;
          delivery_apartment?: string | null;
          delivery_city: string;
          delivery_state: string;
          delivery_zip_code: string;
          delivery_phone?: string | null;
          delivery_instructions?: string | null;
          payment_method?: string;
          payment_status?: string;
          delivery_date?: string | null;
          delivery_time_start?: string | null;
          delivery_time_end?: string | null;
          estimated_delivery_at?: string | null;
          delivered_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_number: string;
          status?: string;
          subtotal: number;
          tax_amount: number;
          delivery_fee: number;
          total_amount: number;
          delivery_first_name: string;
          delivery_last_name: string;
          delivery_street_address: string;
          delivery_apartment?: string | null;
          delivery_city: string;
          delivery_state: string;
          delivery_zip_code: string;
          delivery_phone?: string | null;
          delivery_instructions?: string | null;
          payment_method?: string;
          payment_status?: string;
          delivery_date?: string | null;
          delivery_time_start?: string | null;
          delivery_time_end?: string | null;
          estimated_delivery_at?: string | null;
          delivered_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_number?: string;
          status?: string;
          subtotal?: number;
          tax_amount?: number;
          delivery_fee?: number;
          total_amount?: number;
          delivery_first_name?: string;
          delivery_last_name?: string;
          delivery_street_address?: string;
          delivery_apartment?: string | null;
          delivery_city?: string;
          delivery_state?: string;
          delivery_zip_code?: string;
          delivery_phone?: string | null;
          delivery_instructions?: string | null;
          payment_method?: string;
          payment_status?: string;
          delivery_date?: string | null;
          delivery_time_start?: string | null;
          delivery_time_end?: string | null;
          estimated_delivery_at?: string | null;
          delivered_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          product_price: number;
          product_weight_grams?: number | null;
          product_thc_percentage?: number | null;
          product_cbd_percentage?: number | null;
          product_strain_type?: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at?: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_name: string;
          product_price: number;
          product_weight_grams?: number | null;
          product_thc_percentage?: number | null;
          product_cbd_percentage?: number | null;
          product_strain_type?: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          product_name?: string;
          product_price?: number;
          product_weight_grams?: number | null;
          product_thc_percentage?: number | null;
          product_cbd_percentage?: number | null;
          product_strain_type?: string | null;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          dark_mode: boolean
          two_factor_enabled: boolean
          email_notifications: boolean
          sms_notifications: boolean
          push_notifications: boolean
          marketing_emails: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          dark_mode?: boolean
          two_factor_enabled?: boolean
          email_notifications?: boolean
          sms_notifications?: boolean
          push_notifications?: boolean
          marketing_emails?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          dark_mode?: boolean
          two_factor_enabled?: boolean
          email_notifications?: boolean
          sms_notifications?: boolean
          push_notifications?: boolean
          marketing_emails?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          user_email: string | null
          type: string
          subject: string
          content: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_email?: string | null
          type: string
          subject: string
          content: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          user_email?: string | null
          type?: string
          subject?: string
          content?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      email_queue: {
        Row: {
          id: string
          recipient_email: string
          sender_email: string
          sender_name: string
          subject: string
          html_content: string
          email_type: string
          status: string
          metadata: Json | null
          created_at: string
          processed_at: string | null
          error_message: string | null
        }
        Insert: {
          id?: string
          recipient_email: string
          sender_email: string
          sender_name: string
          subject: string
          html_content: string
          email_type: string
          status?: string
          metadata?: Json | null
          created_at?: string
          processed_at?: string | null
          error_message?: string | null
        }
        Update: {
          id?: string
          recipient_email?: string
          sender_email?: string
          sender_name?: string
          subject?: string
          html_content?: string
          email_type?: string
          status?: string
          metadata?: Json | null
          created_at?: string
          processed_at?: string | null
          error_message?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for better type inference
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Product types with relations
export type ProductWithCategory = Database['public']['Tables']['products']['Row'] & {
  categories: Database['public']['Tables']['categories']['Row'] | null
}

export type CartItemWithProduct = Database['public']['Tables']['cart_items']['Row'] & {
  products: Database['public']['Tables']['products']['Row']
}

export type OrderWithItems = Database['public']['Tables']['orders']['Row'] & {
  order_items: Database['public']['Tables']['order_items']['Row'][]
}

export type OrderItemWithProduct = Database['public']['Tables']['order_items']['Row'] & {
  products: Database['public']['Tables']['products']['Row']
}

// User types with relations
export type UserProfile = Database['public']['Tables']['profiles']['Row']
export type UserAddress = Database['public']['Tables']['addresses']['Row']
export type UserOrder = Database['public']['Tables']['orders']['Row']

// Cart types
export type CartItem = Database['public']['Tables']['cart_items']['Row']
export type Cart = {
  items: CartItemWithProduct[]
  total: number
  itemCount: number
}

// Order types
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled'
export type PaymentMethod = 'cash' | 'card' | 'other'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

// Product types
export type Product = Database['public']['Tables']['products']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type StrainType = 'indica' | 'sativa' | 'hybrid'

// Address types
export type Address = Database['public']['Tables']['addresses']['Row']
export type AddressType = 'billing' | 'delivery'
