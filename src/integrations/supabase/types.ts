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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      dynamic_products: {
        Row: {
          created_at: string
          distance: string
          id: number
          name: string
          price: number
          product_id: number
          provider: string
          provider_id: number | null
          rating: number
          related_service_ids: number[]
          stock_type: string
          tags: string[]
          unit: string
        }
        Insert: {
          created_at?: string
          distance?: string
          id?: number
          name: string
          price?: number
          product_id: number
          provider: string
          provider_id?: number | null
          rating?: number
          related_service_ids?: number[]
          stock_type?: string
          tags?: string[]
          unit?: string
        }
        Update: {
          created_at?: string
          distance?: string
          id?: number
          name?: string
          price?: number
          product_id?: number
          provider?: string
          provider_id?: number | null
          rating?: number
          related_service_ids?: number[]
          stock_type?: string
          tags?: string[]
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_products_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_services: {
        Row: {
          created_at: string
          distance: string
          id: number
          labor_cost: number
          linked_product_ids: number[]
          name: string
          price: number
          products: string[]
          provider: string
          provider_id: number | null
          rating: number
          segment: string
          service_id: number
          time: string
          unit: string
        }
        Insert: {
          created_at?: string
          distance?: string
          id?: number
          labor_cost?: number
          linked_product_ids?: number[]
          name: string
          price?: number
          products?: string[]
          provider: string
          provider_id?: number | null
          rating?: number
          segment: string
          service_id: number
          time?: string
          unit?: string
        }
        Update: {
          created_at?: string
          distance?: string
          id?: number
          labor_cost?: number
          linked_product_ids?: number[]
          name?: string
          price?: number
          products?: string[]
          provider?: string
          provider_id?: number | null
          rating?: number
          segment?: string
          service_id?: number
          time?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bank_account: string | null
          bank_agency: string | null
          bank_name: string | null
          created_at: string
          display_name: string | null
          id: string
          is_customer: boolean
          is_provider: boolean
          latitude: number | null
          longitude: number | null
          phone: string | null
          pix_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_customer?: boolean
          is_provider?: boolean
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          pix_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_customer?: boolean
          is_provider?: boolean
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          pix_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          active: boolean
          address: string | null
          city: string | null
          cpf_cnpj: string | null
          created_at: string
          distance: string
          email: string | null
          id: number
          logo_url: string | null
          name: string
          phone: string | null
          rating: number
          segment: string[]
          storefront_config: Json
          type: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          city?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          distance?: string
          email?: string | null
          id?: number
          logo_url?: string | null
          name: string
          phone?: string | null
          rating?: number
          segment: string[]
          storefront_config?: Json
          type?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          city?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          distance?: string
          email?: string | null
          id?: number
          logo_url?: string | null
          name?: string
          phone?: string | null
          rating?: number
          segment?: string[]
          storefront_config?: Json
          type?: string
        }
        Relationships: []
      }
      referral_campaigns: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          reward_buyer: number
          reward_mixed_total: number
          reward_seller: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          reward_buyer?: number
          reward_mixed_total?: number
          reward_seller?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          reward_buyer?: number
          reward_mixed_total?: number
          reward_seller?: number
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          activated_at: string | null
          bonus_released: boolean
          buyer_released: boolean
          commission_amount: number
          created_at: string
          id: string
          joined_at: string | null
          referral_code: string
          referred_email: string | null
          referred_id: string | null
          referred_name: string | null
          referred_phone: string | null
          referred_role: string | null
          referrer_id: string
          reward_snapshot: Json | null
          seller_released: boolean
          status: string
          total_paid: number
        }
        Insert: {
          activated_at?: string | null
          bonus_released?: boolean
          buyer_released?: boolean
          commission_amount?: number
          created_at?: string
          id?: string
          joined_at?: string | null
          referral_code: string
          referred_email?: string | null
          referred_id?: string | null
          referred_name?: string | null
          referred_phone?: string | null
          referred_role?: string | null
          referrer_id: string
          reward_snapshot?: Json | null
          seller_released?: boolean
          status?: string
          total_paid?: number
        }
        Update: {
          activated_at?: string | null
          bonus_released?: boolean
          buyer_released?: boolean
          commission_amount?: number
          created_at?: string
          id?: string
          joined_at?: string | null
          referral_code?: string
          referred_email?: string | null
          referred_id?: string | null
          referred_name?: string | null
          referred_phone?: string | null
          referred_role?: string | null
          referrer_id?: string
          reward_snapshot?: Json | null
          seller_released?: boolean
          status?: string
          total_paid?: number
        }
        Relationships: []
      }
      segments: {
        Row: {
          created_at: string
          id: number
          name: string
          suggested_tags: string[]
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          suggested_tags?: string[]
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          suggested_tags?: string[]
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          plan: string
          price: number
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          plan?: string
          price?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          plan?: string
          price?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          created_at: string
          id: number
          label: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: never
          label: string
          name: string
        }
        Update: {
          created_at?: string
          id?: never
          label?: string
          name?: string
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
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          id: string
          pending_balance: number
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          pending_balance?: number
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          pending_balance?: number
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_provider_uniqueness: {
        Args: {
          _cpf_cnpj?: string
          _email?: string
          _exclude_id?: number
          _phone?: string
        }
        Returns: Json
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      release_fractioned_cashback: {
        Args: { _phase: string; _referral_id: string }
        Returns: Json
      }
      release_referral_cashback: {
        Args: { _referred_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "master"
        | "client"
        | "provider"
        | "mixed"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "master",
        "client",
        "provider",
        "mixed",
      ],
    },
  },
} as const
