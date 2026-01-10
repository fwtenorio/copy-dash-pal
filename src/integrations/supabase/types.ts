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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          adyen_api_key: string | null
          adyen_connected_at: string | null
          adyen_merchant_account: string | null
          airwallex_api_key: string | null
          airwallex_connected_at: string | null
          braintree_api_key: string | null
          braintree_connected_at: string | null
          braintree_merchant_id: string | null
          brand_color: string | null
          brand_text_color: string | null
          created_at: string
          email: string
          id: string
          klarna_api_key: string | null
          klarna_connected_at: string | null
          language: string
          logo_url: string | null
          magento_api_key: string | null
          magento_connected_at: string | null
          magento_store_url: string | null
          nome: string | null
          nome_empresa: string | null
          paypal_client_id: string | null
          paypal_connected_at: string | null
          paypal_secret: string | null
          refund_policy_url: string | null
          sender_email_footer: string | null
          sender_from_name: string | null
          sender_reply_to_email: string | null
          settings_updated_at: string | null
          shopify_access_token: string | null
          shopify_connected_at: string | null
          shopify_store_name: string | null
          stripe_api_key: string | null
          stripe_connected_at: string | null
          support_url: string | null
          telefone: string | null
          two_factor_enabled: boolean
          two_factor_enabled_at: string | null
          two_factor_secret: string | null
          updated_at: string
          wix_api_key: string | null
          wix_connected_at: string | null
          wix_site_id: string | null
          woocommerce_api_key: string | null
          woocommerce_connected_at: string | null
          woocommerce_store_url: string | null
          woopayments_api_key: string | null
          woopayments_connected_at: string | null
        }
        Insert: {
          adyen_api_key?: string | null
          adyen_connected_at?: string | null
          adyen_merchant_account?: string | null
          airwallex_api_key?: string | null
          airwallex_connected_at?: string | null
          braintree_api_key?: string | null
          braintree_connected_at?: string | null
          braintree_merchant_id?: string | null
          brand_color?: string | null
          brand_text_color?: string | null
          created_at?: string
          email: string
          id: string
          klarna_api_key?: string | null
          klarna_connected_at?: string | null
          language?: string
          logo_url?: string | null
          magento_api_key?: string | null
          magento_connected_at?: string | null
          magento_store_url?: string | null
          nome?: string | null
          nome_empresa?: string | null
          paypal_client_id?: string | null
          paypal_connected_at?: string | null
          paypal_secret?: string | null
          refund_policy_url?: string | null
          sender_email_footer?: string | null
          sender_from_name?: string | null
          sender_reply_to_email?: string | null
          settings_updated_at?: string | null
          shopify_access_token?: string | null
          shopify_connected_at?: string | null
          shopify_store_name?: string | null
          stripe_api_key?: string | null
          stripe_connected_at?: string | null
          support_url?: string | null
          telefone?: string | null
          two_factor_enabled?: boolean
          two_factor_enabled_at?: string | null
          two_factor_secret?: string | null
          updated_at?: string
          wix_api_key?: string | null
          wix_connected_at?: string | null
          wix_site_id?: string | null
          woocommerce_api_key?: string | null
          woocommerce_connected_at?: string | null
          woocommerce_store_url?: string | null
          woopayments_api_key?: string | null
          woopayments_connected_at?: string | null
        }
        Update: {
          adyen_api_key?: string | null
          adyen_connected_at?: string | null
          adyen_merchant_account?: string | null
          airwallex_api_key?: string | null
          airwallex_connected_at?: string | null
          braintree_api_key?: string | null
          braintree_connected_at?: string | null
          braintree_merchant_id?: string | null
          brand_color?: string | null
          brand_text_color?: string | null
          created_at?: string
          email?: string
          id?: string
          klarna_api_key?: string | null
          klarna_connected_at?: string | null
          language?: string
          logo_url?: string | null
          magento_api_key?: string | null
          magento_connected_at?: string | null
          magento_store_url?: string | null
          nome?: string | null
          nome_empresa?: string | null
          paypal_client_id?: string | null
          paypal_connected_at?: string | null
          paypal_secret?: string | null
          refund_policy_url?: string | null
          sender_email_footer?: string | null
          sender_from_name?: string | null
          sender_reply_to_email?: string | null
          settings_updated_at?: string | null
          shopify_access_token?: string | null
          shopify_connected_at?: string | null
          shopify_store_name?: string | null
          stripe_api_key?: string | null
          stripe_connected_at?: string | null
          support_url?: string | null
          telefone?: string | null
          two_factor_enabled?: boolean
          two_factor_enabled_at?: string | null
          two_factor_secret?: string | null
          updated_at?: string
          wix_api_key?: string | null
          wix_connected_at?: string | null
          wix_site_id?: string | null
          woocommerce_api_key?: string | null
          woocommerce_connected_at?: string | null
          woocommerce_store_url?: string | null
          woopayments_api_key?: string | null
          woopayments_connected_at?: string | null
        }
        Relationships: []
      }
      dispute_requests: {
        Row: {
          admin_bonus_percentage: number | null
          admin_notes: string | null
          client_id: string | null
          created_at: string
          currency: string | null
          customer_email: string
          customer_name: string | null
          evidence_data: Json
          id: string
          order_id: string
          order_total: number | null
          preferred_resolution: string
          problem_type: string
          protocol_number: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_bonus_percentage?: number | null
          admin_notes?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string | null
          customer_email: string
          customer_name?: string | null
          evidence_data?: Json
          id?: string
          order_id: string
          order_total?: number | null
          preferred_resolution: string
          problem_type: string
          protocol_number: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_bonus_percentage?: number | null
          admin_notes?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string | null
          customer_email?: string
          customer_name?: string | null
          evidence_data?: Json
          id?: string
          order_id?: string
          order_total?: number | null
          preferred_resolution?: string
          problem_type?: string
          protocol_number?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_field_configs: {
        Row: {
          client_id: string
          created_at: string | null
          display_order: number | null
          field_key: string
          field_label: string
          field_type: string
          id: string
          is_predefined: boolean | null
          is_required: boolean | null
          is_visible: boolean | null
          options: Json | null
          problem_type: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          display_order?: number | null
          field_key: string
          field_label: string
          field_type: string
          id?: string
          is_predefined?: boolean | null
          is_required?: boolean | null
          is_visible?: boolean | null
          options?: Json | null
          problem_type: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          display_order?: number | null
          field_key?: string
          field_label?: string
          field_type?: string
          id?: string
          is_predefined?: boolean | null
          is_required?: boolean | null
          is_visible?: boolean | null
          options?: Json | null
          problem_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_field_configs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          client_id: string
          created_at: string
          disputa_ganha: boolean
          id: string
          novo_alerta_impedido: boolean
          provas_apresentadas: boolean
          relatorio_semanal_alertas: boolean
          resumo_semanal: boolean
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          disputa_ganha?: boolean
          id?: string
          novo_alerta_impedido?: boolean
          provas_apresentadas?: boolean
          relatorio_semanal_alertas?: boolean
          resumo_semanal?: boolean
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          disputa_ganha?: boolean
          id?: string
          novo_alerta_impedido?: boolean
          provas_apresentadas?: boolean
          relatorio_semanal_alertas?: boolean
          resumo_semanal?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_menu: {
        Row: {
          alerts: number
          created_at: string
          disputes: number
          id: string
          last_login: string
          prevent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alerts?: number
          created_at?: string
          disputes?: number
          id?: string
          last_login?: string
          prevent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alerts?: number
          created_at?: string
          disputes?: number
          id?: string
          last_login?: string
          prevent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          client_id: string | null
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
          user_level: Database["public"]["Enums"]["user_level"]
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email: string
          id: string
          nome: string
          updated_at?: string
          user_level?: Database["public"]["Enums"]["user_level"]
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          updated_at?: string
          user_level?: Database["public"]["Enums"]["user_level"]
        }
        Relationships: [
          {
            foreignKeyName: "users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_client_id: { Args: { _user_id: string }; Returns: string }
      get_user_level: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_level"]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      list_user_sessions: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          ip: string
          user_agent: string
        }[]
      }
      revoke_user_session: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      user_level: "admin" | "manager" | "user"
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
      user_level: ["admin", "manager", "user"],
    },
  },
} as const
