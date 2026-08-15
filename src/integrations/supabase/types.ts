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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_pct: number
          min_order: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_pct?: number
          min_order?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_pct?: number
          min_order?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          order_no: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          order_no: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          order_no?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          advance_due: number
          bulk_discount: number
          coupon: string | null
          coupon_discount: number
          created_at: string
          customer: Json
          id: string
          lines: Json
          order_no: string
          payment_discount: number
          payment_method_code: string
          payment_screenshot_path: string | null
          payment_status: string
          shipping: number
          status: string
          stock_restored: boolean
          subtotal: number
          timeline: Json
          total: number
          tracking_number: string | null
          updated_at: string
          urgent: boolean | null
        }
        Insert: {
          advance_due?: number
          bulk_discount?: number
          coupon?: string | null
          coupon_discount?: number
          created_at?: string
          customer: Json
          id?: string
          lines?: Json
          order_no: string
          payment_discount?: number
          payment_method_code: string
          payment_screenshot_path?: string | null
          payment_status?: string
          shipping?: number
          status?: string
          stock_restored?: boolean
          subtotal?: number
          timeline?: Json
          total?: number
          tracking_number?: string | null
          updated_at?: string
          urgent?: boolean | null
        }
        Update: {
          advance_due?: number
          bulk_discount?: number
          coupon?: string | null
          coupon_discount?: number
          created_at?: string
          customer?: Json
          id?: string
          lines?: Json
          order_no?: string
          payment_discount?: number
          payment_method_code?: string
          payment_screenshot_path?: string | null
          payment_status?: string
          shipping?: number
          status?: string
          stock_restored?: boolean
          subtotal?: number
          timeline?: Json
          total?: number
          tracking_number?: string | null
          updated_at?: string
          urgent?: boolean | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_number: string | null
          account_title: string | null
          code: string
          created_at: string
          discount_pct: number
          enabled: boolean
          iban: string | null
          id: string
          instructions: string | null
          label: string
          note: string
          qr_url: string | null
          requires_proof: boolean
          sort_order: number
        }
        Insert: {
          account_number?: string | null
          account_title?: string | null
          code: string
          created_at?: string
          discount_pct?: number
          enabled?: boolean
          iban?: string | null
          id?: string
          instructions?: string | null
          label: string
          note?: string
          qr_url?: string | null
          requires_proof?: boolean
          sort_order?: number
        }
        Update: {
          account_number?: string | null
          account_title?: string | null
          code?: string
          created_at?: string
          discount_pct?: number
          enabled?: boolean
          iban?: string | null
          id?: string
          instructions?: string | null
          label?: string
          note?: string
          qr_url?: string | null
          requires_proof?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          badges: Json
          brand: string
          bulk_rules: Json
          category: string
          colors: Json
          created_at: string
          description: string
          fabric: string | null
          faqs: Json
          featured: boolean
          features: Json
          flash_ends_at: string | null
          flash_sale: boolean
          id: string
          images: Json
          included: Json
          name: string
          price: number
          rating: number
          reviews: Json
          sale_price: number | null
          shipping_details: string
          size: string | null
          sku: string
          slug: string
          sold: number
          sort_order: number
          specs: Json
          stock: number
          tagline: string
          texture: string | null
          trending: boolean
          updated_at: string
          video_url: string | null
          warranty: string
        }
        Insert: {
          active?: boolean
          badges?: Json
          brand?: string
          bulk_rules?: Json
          category?: string
          colors?: Json
          created_at?: string
          description?: string
          fabric?: string | null
          faqs?: Json
          featured?: boolean
          features?: Json
          flash_ends_at?: string | null
          flash_sale?: boolean
          id?: string
          images?: Json
          included?: Json
          name: string
          price?: number
          rating?: number
          reviews?: Json
          sale_price?: number | null
          shipping_details?: string
          size?: string | null
          sku?: string
          slug: string
          sold?: number
          sort_order?: number
          specs?: Json
          stock?: number
          tagline?: string
          texture?: string | null
          trending?: boolean
          updated_at?: string
          video_url?: string | null
          warranty?: string
        }
        Update: {
          active?: boolean
          badges?: Json
          brand?: string
          bulk_rules?: Json
          category?: string
          colors?: Json
          created_at?: string
          description?: string
          fabric?: string | null
          faqs?: Json
          featured?: boolean
          features?: Json
          flash_ends_at?: string | null
          flash_sale?: boolean
          id?: string
          images?: Json
          included?: Json
          name?: string
          price?: number
          rating?: number
          reviews?: Json
          sale_price?: number | null
          shipping_details?: string
          size?: string | null
          sku?: string
          slug?: string
          sold?: number
          sort_order?: number
          specs?: Json
          stock?: number
          tagline?: string
          texture?: string | null
          trending?: boolean
          updated_at?: string
          video_url?: string | null
          warranty?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          label: string | null
          p256dh: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          label?: string | null
          p256dh: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          label?: string | null
          p256dh?: string
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          data: Json
          id: boolean
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: boolean
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device: string | null
          id: string
          is_new: boolean
          os: string | null
          path: string
          referrer: string | null
          session_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          is_new?: boolean
          os?: string | null
          path?: string
          referrer?: string | null
          session_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          is_new?: boolean
          os?: string | null
          path?: string
          referrer?: string | null
          session_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_color_stock: {
        Args: { _color_name: string; _product_id: string; _qty: number }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      release_stock: { Args: { _lines: Json }; Returns: undefined }
      reserve_stock: { Args: { _lines: Json }; Returns: undefined }
      restore_order_stock: { Args: { _order_no: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff"
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
    Enums: {
      app_role: ["admin", "staff"],
    },
  },
} as const
