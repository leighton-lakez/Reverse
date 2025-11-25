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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          brand: string | null
          category: string | null
          condition: string
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          location: string
          price: number
          size: string | null
          status: string
          title: string
          trade_preference: string | null
          updated_at: string
          user_id: string
          return_policy: string | null
          shipping_type: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          condition: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          location: string
          price: number
          size?: string | null
          status?: string
          title: string
          trade_preference?: string | null
          updated_at?: string
          user_id: string
          return_policy?: string | null
          shipping_type?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          location?: string
          price?: number
          size?: string | null
          status?: string
          title?: string
          trade_preference?: string | null
          updated_at?: string
          user_id?: string
          return_policy?: string | null
          shipping_type?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          item_id: string | null
          read: boolean
          receiver_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          item_id?: string | null
          read?: boolean
          receiver_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          item_id?: string | null
          read?: boolean
          receiver_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          location: string | null
          venmo: string | null
          cashapp: string | null
          zelle: string | null
          paypal: string | null
          apple_pay: string | null
          other_payment: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          location?: string | null
          venmo?: string | null
          cashapp?: string | null
          zelle?: string | null
          paypal?: string | null
          apple_pay?: string | null
          other_payment?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          venmo?: string | null
          cashapp?: string | null
          zelle?: string | null
          paypal?: string | null
          apple_pay?: string | null
          other_payment?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          buyer_id: string
          completed_at: string | null
          created_at: string
          id: string
          item_id: string
          payment_intent_id: string | null
          seller_id: string
          shipping_address: Json
          status: string
        }
        Insert: {
          amount: number
          buyer_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          item_id: string
          payment_intent_id?: string | null
          seller_id: string
          shipping_address: Json
          status?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          item_id?: string
          payment_intent_id?: string | null
          seller_id?: string
          shipping_address?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
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
      orders: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          item_id: string
          buyer_id: string
          seller_id: string
          amount: number
          platform_fee: number
          seller_amount: number
          status: string
          payment_intent_id: string | null
          stripe_transfer_id: string | null
          shipping_address: Json | null
          shipping_type: string
          tracking_number: string | null
          tracking_carrier: string | null
          shipped_at: string | null
          delivered_at: string | null
          buyer_confirmed_at: string | null
          escrow_release_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          item_id: string
          buyer_id: string
          seller_id: string
          amount: number
          platform_fee: number
          seller_amount: number
          status?: string
          payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          shipping_address?: Json | null
          shipping_type: string
          tracking_number?: string | null
          tracking_carrier?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          buyer_confirmed_at?: string | null
          escrow_release_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          item_id?: string
          buyer_id?: string
          seller_id?: string
          amount?: number
          platform_fee?: number
          seller_amount?: number
          status?: string
          payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          shipping_address?: Json | null
          shipping_type?: string
          tracking_number?: string | null
          tracking_carrier?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          buyer_confirmed_at?: string | null
          escrow_release_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          }
        ]
      }
      seller_accounts: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          payout_method: string | null
          payout_email: string | null
          bank_last_four: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          payout_method?: string | null
          payout_email?: string | null
          bank_last_four?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          payout_method?: string | null
          payout_email?: string | null
          bank_last_four?: string | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          order_id: string
          opened_by: string
          reason: string
          description: string | null
          status: string
          resolution: string | null
          resolved_at: string | null
          refund_amount: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          order_id: string
          opened_by: string
          reason: string
          description?: string | null
          status?: string
          resolution?: string | null
          resolved_at?: string | null
          refund_amount?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          order_id?: string
          opened_by?: string
          reason?: string
          description?: string | null
          status?: string
          resolution?: string | null
          resolved_at?: string | null
          refund_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      saved_payment_methods: {
        Row: {
          id: string
          user_id: string
          created_at: string
          stripe_payment_method_id: string
          card_brand: string | null
          card_last_four: string | null
          is_default: boolean
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          stripe_payment_method_id: string
          card_brand?: string | null
          card_last_four?: string | null
          is_default?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          stripe_payment_method_id?: string
          card_brand?: string | null
          card_last_four?: string | null
          is_default?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
