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
          id: string
          user_id: string
          email: string | null
          first_name: string | null
          last_name: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          role: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          role?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          role?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          price: number
          stock_quantity: number
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category?: string | null
          price: number
          stock_quantity: number
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string | null
          price?: number
          stock_quantity?: number
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string
          status: string
          total_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id: string
          status: string
          total_amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string
          status?: string
          total_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      store_settings: {
        Row: {
          id: string
          store_name: string
          store_email: string
          store_phone: string | null
          store_address: string | null
          business_hours: Json
          timezone: string
          currency: string
          order_minimum: number
          delivery_fee: number
          tax_rate: number
          max_delivery_radius: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_name: string
          store_email: string
          store_phone?: string | null
          store_address?: string | null
          business_hours: Json
          timezone: string
          currency: string
          order_minimum: number
          delivery_fee: number
          tax_rate: number
          max_delivery_radius: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_name?: string
          store_email?: string
          store_phone?: string | null
          store_address?: string | null
          business_hours?: Json
          timezone?: string
          currency?: string
          order_minimum?: number
          delivery_fee?: number
          tax_rate?: number
          max_delivery_radius?: number
          created_at?: string
          updated_at?: string
        }
      }
      admin_notifications: {
        Row: {
          id: string
          admin_id: string
          type: string
          title: string
          message: string
          is_read: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          type: string
          title: string
          message: string
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          type?: string
          title?: string
          message?: string
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
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

// Additional types for admin use
export type OrderWithProfile = Database['public']['Tables']['orders']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row']
}

export type OrderItemWithRelations = Database['public']['Tables']['order_items']['Row'] & {
  products: Database['public']['Tables']['products']['Row']
}
