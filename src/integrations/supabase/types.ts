/* eslint-disable @typescript-eslint/no-redundant-type-constituents */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          apartment: string | null
          city: string
          created_at: string | null
          delivery_instructions: string | null
          first_name: string
          id: string
          is_default: boolean | null
          label: string | null
          last_name: string
          phone: string | null
          state: string
          street_address: string
          type: string | null
          unit: string | null
          updated_at: string | null
          user_id: string | null
          zip_code: string
        }
        Insert: {
          apartment?: string | null
          city: string
          created_at?: string | null
          delivery_instructions?: string | null
          first_name: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          last_name: string
          phone?: string | null
          state?: string
          street_address: string
          type?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code: string
        }
        Update: {
          apartment?: string | null
          city?: string
          created_at?: string | null
          delivery_instructions?: string | null
          first_name?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          last_name?: string
          phone?: string | null
          state?: string
          street_address?: string
          type?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string
        }
        Relationships: []
      }
      age_verification_logs: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number
          updated_at: string | null
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          updated_at?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          updated_at?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_bounces: {
        Row: {
          bounce_count: number | null
          bounce_reason: string | null
          bounce_type: string | null
          email: string
          first_bounced_at: string | null
          id: string
          is_suppressed: boolean | null
          last_bounced_at: string | null
        }
        Insert: {
          bounce_count?: number | null
          bounce_reason?: string | null
          bounce_type?: string | null
          email: string
          first_bounced_at?: string | null
          id?: string
          is_suppressed?: boolean | null
          last_bounced_at?: string | null
        }
        Update: {
          bounce_count?: number | null
          bounce_reason?: string | null
          bounce_type?: string | null
          email?: string
          first_bounced_at?: string | null
          id?: string
          is_suppressed?: boolean | null
          last_bounced_at?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string | null
          email_id: string | null
          event_data: Json | null
          event_type: string
          from_email: string | null
          id: string
          processed_at: string | null
          subject: string | null
          to_email: string | null
        }
        Insert: {
          created_at?: string | null
          email_id?: string | null
          event_data?: Json | null
          event_type: string
          from_email?: string | null
          id?: string
          processed_at?: string | null
          subject?: string | null
          to_email?: string | null
        }
        Update: {
          created_at?: string | null
          email_id?: string | null
          event_data?: Json | null
          event_type?: string
          from_email?: string | null
          id?: string
          processed_at?: string | null
          subject?: string | null
          to_email?: string | null
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          data: Json | null
          email_type: string
          error_message: string | null
          id: string
          last_attempt_at: string | null
          max_attempts: number | null
          order_id: string | null
          priority: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          to_email: string | null
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          email_type: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          order_id?: string | null
          priority?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          to_email?: string | null
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          email_type?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          order_id?: string | null
          priority?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          to_email?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          product_category: string | null
          product_cbd_percentage: number | null
          product_description: string | null
          product_id: string | null
          product_name: string
          product_price: number
          product_strain_type: string | null
          product_thc_percentage: number | null
          product_weight_grams: number | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_category?: string | null
          product_cbd_percentage?: number | null
          product_description?: string | null
          product_id?: string | null
          product_name: string
          product_price: number
          product_strain_type?: string | null
          product_thc_percentage?: number | null
          product_weight_grams?: number | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_category?: string | null
          product_cbd_percentage?: number | null
          product_description?: string | null
          product_id?: string | null
          product_name?: string
          product_price?: number
          product_strain_type?: string | null
          product_thc_percentage?: number | null
          product_weight_grams?: number | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_processing_logs: {
        Row: {
          action: string
          correlation_id: string | null
          created_at: string | null
          details: Json | null
          duration_ms: number | null
          error: string | null
          id: string
          order_id: string | null
          status: string
        }
        Insert: {
          action: string
          correlation_id?: string | null
          created_at?: string | null
          details?: Json | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          order_id?: string | null
          status: string
        }
        Update: {
          action?: string
          correlation_id?: string | null
          created_at?: string | null
          details?: Json | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          order_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_processing_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_phone_number: string | null
          delivered_at: string | null
          delivery_apartment: string | null
          delivery_city: string
          delivery_date: string | null
          delivery_fee: number
          delivery_first_name: string
          delivery_instructions: string | null
          delivery_last_name: string
          delivery_phone: string | null
          delivery_state: string
          delivery_street_address: string
          delivery_time_end: string | null
          delivery_time_start: string | null
          delivery_zip_code: string
          estimated_delivery_at: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          status: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_phone_number?: string | null
          delivered_at?: string | null
          delivery_apartment?: string | null
          delivery_city: string
          delivery_date?: string | null
          delivery_fee?: number
          delivery_first_name: string
          delivery_instructions?: string | null
          delivery_last_name: string
          delivery_phone?: string | null
          delivery_state?: string
          delivery_street_address: string
          delivery_time_end?: string | null
          delivery_time_start?: string | null
          delivery_zip_code: string
          estimated_delivery_at?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          status?: string | null
          subtotal: number
          tax_amount?: number
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_phone_number?: string | null
          delivered_at?: string | null
          delivery_apartment?: string | null
          delivery_city?: string
          delivery_date?: string | null
          delivery_fee?: number
          delivery_first_name?: string
          delivery_instructions?: string | null
          delivery_last_name?: string
          delivery_phone?: string | null
          delivery_state?: string
          delivery_street_address?: string
          delivery_time_end?: string | null
          delivery_time_start?: string | null
          delivery_zip_code?: string
          estimated_delivery_at?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          created_at: string | null
          event_id: string
          event_type: string
          id: string
          order_id: string | null
          payload: Json
          provider: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          event_type: string
          id?: string
          order_id?: string | null
          payload: Json
          provider: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          event_type?: string
          id?: string
          order_id?: string | null
          payload?: Json
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string | null
          id: string
          inventory_count: number | null
          is_active: boolean | null
          name: string
          price: number
          product_id: string | null
          updated_at: string | null
          weight_grams: number
        }
        Insert: {
          created_at?: string | null
          id: string
          inventory_count?: number | null
          is_active?: boolean | null
          name: string
          price: number
          product_id?: string | null
          updated_at?: string | null
          weight_grams: number
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_count?: number | null
          is_active?: boolean | null
          name?: string
          price?: number
          product_id?: string | null
          updated_at?: string | null
          weight_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          cbd_content: number | null
          created_at: string | null
          description: string | null
          effects: string[] | null
          flavors: string[] | null
          gallery_urls: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          lab_results_url: string | null
          lab_tested: boolean | null
          name: string
          price: number
          search_vector: unknown | null
          slug: string
          stock_quantity: number | null
          strain_type: string | null
          thc_content: number | null
          updated_at: string | null
          weight_grams: number | null
        }
        Insert: {
          category: string
          cbd_content?: number | null
          created_at?: string | null
          description?: string | null
          effects?: string[] | null
          flavors?: string[] | null
          gallery_urls?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          lab_results_url?: string | null
          lab_tested?: boolean | null
          name: string
          price: number
          search_vector?: unknown | null
          slug: string
          stock_quantity?: number | null
          strain_type?: string | null
          thc_content?: number | null
          updated_at?: string | null
          weight_grams?: number | null
        }
        Update: {
          category?: string
          cbd_content?: number | null
          created_at?: string | null
          description?: string | null
          effects?: string[] | null
          flavors?: string[] | null
          gallery_urls?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          lab_results_url?: string | null
          lab_tested?: boolean | null
          name?: string
          price?: number
          search_vector?: unknown | null
          slug?: string
          stock_quantity?: number | null
          strain_type?: string | null
          thc_content?: number | null
          updated_at?: string | null
          weight_grams?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_verified: boolean | null
          age_verified_at: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_name: string | null
          marketing_consent: boolean | null
          phone: string | null
          role: string | null
          terms_accepted_at: string | null
          updated_at: string | null
        }
        Insert: {
          age_verified?: boolean | null
          age_verified_at?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_admin?: boolean | null
          last_name?: string | null
          marketing_consent?: boolean | null
          phone?: string | null
          role?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          age_verified?: boolean | null
          age_verified_at?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_name?: string | null
          marketing_consent?: boolean | null
          phone?: string | null
          role?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          dark_mode: boolean | null
          email_notifications: boolean | null
          id: string
          marketing_emails: boolean | null
          push_notifications: boolean | null
          sms_notifications: boolean | null
          two_factor_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dark_mode?: boolean | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dark_mode?: boolean | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_product: {
        Args: { hard_delete?: boolean; target_product_id: string }
        Returns: undefined
      }
      admin_upsert_product: {
        Args: {
          product_data: Json
          replace_variants?: boolean
          variant_data?: Json
        }
        Returns: Database['public']['Tables']['products']['Row']
      }
      check_user_is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      clear_user_cart: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      complete_profile_setup: {
        Args: {
          birth_date: string
          first_name: string
          last_name: string
          phone: string
        }
        Returns: boolean
      }
      create_order_from_cart: {
        Args: {
          delivery_address: Json
          delivery_date: string
          delivery_instructions?: string
          delivery_time_end: string
          delivery_time_start: string
        }
        Returns: string
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_personal_access_token: {
        Args: { expires_in_days?: number; token_name: string }
        Returns: string
      }
      get_guest_order: {
        Args: { customer_email_param: string; order_number_param: string }
        Returns: {
          created_at: string | null
          customer_email: string | null
          customer_phone_number: string | null
          delivered_at: string | null
          delivery_apartment: string | null
          delivery_city: string
          delivery_date: string | null
          delivery_fee: number
          delivery_first_name: string
          delivery_instructions: string | null
          delivery_last_name: string
          delivery_phone: string | null
          delivery_state: string
          delivery_street_address: string
          delivery_time_end: string | null
          delivery_time_start: string | null
          delivery_zip_code: string
          estimated_delivery_at: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          status: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }[]
      }
      get_user_orders: {
        Args: { limit_count?: number; offset_count?: number }
        Returns: {
          created_at: string
          delivery_date: string
          id: string
          item_count: number
          order_number: string
          status: string
          total_amount: number
        }[]
      }
      get_user_profile_data: {
        Args: { user_uuid?: string }
        Returns: {
          addresses: Json
          age_verified: boolean
          age_verified_at: string
          date_of_birth: string
          email: string
          first_name: string
          last_name: string
          marketing_consent: boolean
          phone: string
          preferences: Json
          profile_id: string
          role: string
          terms_accepted_at: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_age_verified: {
        Args: { check_user_id?: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_age_verification: {
        Args: { agent?: string; birth_date: string; ip?: string }
        Returns: undefined
      }
      search_products: {
        Args: {
          category_filter?: string
          limit_count?: number
          offset_count?: number
          search_query: string
        }
        Returns: {
          category: string
          cbd_content: number
          created_at: string
          description: string
          effects: string[]
          flavors: string[]
          id: string
          image_url: string
          is_active: boolean
          is_featured: boolean
          name: string
          price: number
          search_rank: number
          slug: string
          stock_quantity: number
          strain_type: string
          thc_content: number
        }[]
      }
      update_order_status: {
        Args: { new_status: string; order_id: string }
        Returns: boolean
      }
      verify_user_age: {
        Args: { birth_date: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
