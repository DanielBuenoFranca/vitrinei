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
      ai_savings_log: {
        Row: {
          context: Json | null
          created_at: string
          estimated_credits: number
          fallback_used: string
          feature: string
          id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          estimated_credits?: number
          fallback_used: string
          feature: string
          id?: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          estimated_credits?: number
          fallback_used?: string
          feature?: string
          id?: string
        }
        Relationships: []
      }
      ai_savings_periods: {
        Row: {
          context: Json
          created_at: string
          ended_at: string | null
          ended_by: string | null
          id: string
          started_at: string
          started_by: string | null
          total_calls_diverted: number
          total_credits_saved: number
        }
        Insert: {
          context?: Json
          created_at?: string
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          started_at?: string
          started_by?: string | null
          total_calls_diverted?: number
          total_credits_saved?: number
        }
        Update: {
          context?: Json
          created_at?: string
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          started_at?: string
          started_by?: string | null
          total_calls_diverted?: number
          total_credits_saved?: number
        }
        Relationships: []
      }
      dynamic_products: {
        Row: {
          created_at: string
          distance: string
          id: number
          image_url: string | null
          name: string
          price: number
          product_id: number
          provider: string
          provider_id: number | null
          quantity: number
          rating: number
          related_service_ids: number[]
          segments: string[]
          stock_type: string
          tags: string[]
          unit: string
        }
        Insert: {
          created_at?: string
          distance?: string
          id?: number
          image_url?: string | null
          name: string
          price?: number
          product_id: number
          provider: string
          provider_id?: number | null
          quantity?: number
          rating?: number
          related_service_ids?: number[]
          segments?: string[]
          stock_type?: string
          tags?: string[]
          unit?: string
        }
        Update: {
          created_at?: string
          distance?: string
          id?: number
          image_url?: string | null
          name?: string
          price?: number
          product_id?: number
          provider?: string
          provider_id?: number | null
          quantity?: number
          rating?: number
          related_service_ids?: number[]
          segments?: string[]
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
          image_url: string | null
          labor_cost: number
          linked_product_ids: number[]
          name: string
          price: number
          products: string[]
          provider: string
          provider_id: number | null
          quantity: number
          rating: number
          segment: string
          segments: string[]
          service_id: number
          time: string
          unit: string
        }
        Insert: {
          created_at?: string
          distance?: string
          id?: number
          image_url?: string | null
          labor_cost?: number
          linked_product_ids?: number[]
          name: string
          price?: number
          products?: string[]
          provider: string
          provider_id?: number | null
          quantity?: number
          rating?: number
          segment: string
          segments?: string[]
          service_id: number
          time?: string
          unit?: string
        }
        Update: {
          created_at?: string
          distance?: string
          id?: number
          image_url?: string | null
          labor_cost?: number
          linked_product_ids?: number[]
          name?: string
          price?: number
          products?: string[]
          provider?: string
          provider_id?: number | null
          quantity?: number
          rating?: number
          segment?: string
          segments?: string[]
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
      kit_items: {
        Row: {
          agreed_unit_cost: number
          created_at: string
          id: string
          is_third_party: boolean
          kit_id: number
          quantity_per_kit: number
          snapshot_name: string | null
          source_item_id: number
          source_kind: string
          source_provider_id: number
        }
        Insert: {
          agreed_unit_cost?: number
          created_at?: string
          id?: string
          is_third_party?: boolean
          kit_id: number
          quantity_per_kit?: number
          snapshot_name?: string | null
          source_item_id: number
          source_kind: string
          source_provider_id: number
        }
        Update: {
          agreed_unit_cost?: number
          created_at?: string
          id?: string
          is_third_party?: boolean
          kit_id?: number
          quantity_per_kit?: number
          snapshot_name?: string | null
          source_item_id?: number
          source_kind?: string
          source_provider_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "kit_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "kits"
            referencedColumns: ["id"]
          },
        ]
      }
      kit_transactions: {
        Row: {
          action: string
          buyer_user_id: string | null
          created_at: string
          details: Json | null
          id: string
          kit_id: number
          owner_provider_id: number | null
          total_amount: number | null
        }
        Insert: {
          action: string
          buyer_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          kit_id: number
          owner_provider_id?: number | null
          total_amount?: number | null
        }
        Update: {
          action?: string
          buyer_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          kit_id?: number
          owner_provider_id?: number | null
          total_amount?: number | null
        }
        Relationships: []
      }
      kits: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          labor_cost: number
          name: string
          owner_provider_id: number
          price: number
          quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: never
          image_url?: string | null
          labor_cost?: number
          name: string
          owner_provider_id: number
          price?: number
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: never
          image_url?: string | null
          labor_cost?: number
          name?: string
          owner_provider_id?: number
          price?: number
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      pending_stock_orders: {
        Row: {
          buyer_user_id: string
          created_at: string
          delivered_items: Json
          id: string
          kit_id: number
          kit_name: string
          message: string | null
          owner_provider_id: number
          pending_items: Json
          status: string
          updated_at: string
        }
        Insert: {
          buyer_user_id: string
          created_at?: string
          delivered_items?: Json
          id?: string
          kit_id: number
          kit_name: string
          message?: string | null
          owner_provider_id: number
          pending_items?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_user_id?: string
          created_at?: string
          delivered_items?: Json
          id?: string
          kit_id?: number
          kit_name?: string
          message?: string | null
          owner_provider_id?: number
          pending_items?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          auth_split_5x: boolean | null
          avatar_url: string | null
          bank_account: string | null
          bank_agency: string | null
          bank_name: string | null
          cep: string | null
          city: string | null
          cpf_cnpj: string | null
          cpf_cnpj_normalized: string | null
          created_at: string
          display_name: string | null
          distance: string | null
          elite_since: string | null
          fidelity_score: number
          id: string
          is_customer: boolean
          is_provider: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          margin_pct: number | null
          neighborhood: string | null
          phone: string | null
          pix_key: string | null
          profit_pct: number | null
          provider_active: boolean | null
          provider_segments: string[] | null
          provider_type: string | null
          rating: number | null
          state: string | null
          storefront_config: Json | null
          subscription_paid: boolean
          subscription_paid_at: string | null
          updated_at: string
          user_id: string
          vini_preferences: Json | null
        }
        Insert: {
          address?: string | null
          auth_split_5x?: boolean | null
          avatar_url?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          cep?: string | null
          city?: string | null
          cpf_cnpj?: string | null
          cpf_cnpj_normalized?: string | null
          created_at?: string
          display_name?: string | null
          distance?: string | null
          elite_since?: string | null
          fidelity_score?: number
          id?: string
          is_customer?: boolean
          is_provider?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          margin_pct?: number | null
          neighborhood?: string | null
          phone?: string | null
          pix_key?: string | null
          profit_pct?: number | null
          provider_active?: boolean | null
          provider_segments?: string[] | null
          provider_type?: string | null
          rating?: number | null
          state?: string | null
          storefront_config?: Json | null
          subscription_paid?: boolean
          subscription_paid_at?: string | null
          updated_at?: string
          user_id: string
          vini_preferences?: Json | null
        }
        Update: {
          address?: string | null
          auth_split_5x?: boolean | null
          avatar_url?: string | null
          bank_account?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          cep?: string | null
          city?: string | null
          cpf_cnpj?: string | null
          cpf_cnpj_normalized?: string | null
          created_at?: string
          display_name?: string | null
          distance?: string | null
          elite_since?: string | null
          fidelity_score?: number
          id?: string
          is_customer?: boolean
          is_provider?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          margin_pct?: number | null
          neighborhood?: string | null
          phone?: string | null
          pix_key?: string | null
          profit_pct?: number | null
          provider_active?: boolean | null
          provider_segments?: string[] | null
          provider_type?: string | null
          rating?: number | null
          state?: string | null
          storefront_config?: Json | null
          subscription_paid?: boolean
          subscription_paid_at?: string | null
          updated_at?: string
          user_id?: string
          vini_preferences?: Json | null
        }
        Relationships: []
      }
      provider_ranking_groups: {
        Row: {
          avg_stars: number
          created_at: string
          first_at: string
          group_index: number
          id: string
          last_at: string
          provider_id: number
          rating_ids: string[]
          sales_count: number
        }
        Insert: {
          avg_stars: number
          created_at?: string
          first_at: string
          group_index: number
          id?: string
          last_at: string
          provider_id: number
          rating_ids?: string[]
          sales_count: number
        }
        Update: {
          avg_stars?: number
          created_at?: string
          first_at?: string
          group_index?: number
          id?: string
          last_at?: string
          provider_id?: number
          rating_ids?: string[]
          sales_count?: number
        }
        Relationships: []
      }
      provider_ratings: {
        Row: {
          comment: string | null
          context: Json | null
          created_at: string
          id: string
          item_id: number | null
          item_kind: string | null
          item_name: string | null
          order_ref: string | null
          provider_id: number
          stars: number
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          item_id?: number | null
          item_kind?: string | null
          item_name?: string | null
          order_ref?: string | null
          provider_id: number
          stars: number
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          item_id?: number | null
          item_kind?: string | null
          item_name?: string | null
          order_ref?: string | null
          provider_id?: number
          stars?: number
          user_id?: string | null
        }
        Relationships: []
      }
      providers: {
        Row: {
          active: boolean
          address: string | null
          auth_split_5x: boolean
          city: string | null
          cpf_cnpj: string | null
          created_at: string
          distance: string
          email: string | null
          groups_count: number
          id: number
          is_top_provider: boolean
          logo_url: string | null
          margin_pct: number
          name: string
          phone: string | null
          profit_pct: number
          ranking_score: number
          rating: number
          segment: string[]
          storefront_config: Json
          top_provider_since: string | null
          total_sales_rated: number
          type: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          auth_split_5x?: boolean
          city?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          distance?: string
          email?: string | null
          groups_count?: number
          id?: number
          is_top_provider?: boolean
          logo_url?: string | null
          margin_pct?: number
          name: string
          phone?: string | null
          profit_pct?: number
          ranking_score?: number
          rating?: number
          segment: string[]
          storefront_config?: Json
          top_provider_since?: string | null
          total_sales_rated?: number
          type?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          auth_split_5x?: boolean
          city?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          distance?: string
          email?: string | null
          groups_count?: number
          id?: number
          is_top_provider?: boolean
          logo_url?: string | null
          margin_pct?: number
          name?: string
          phone?: string | null
          profit_pct?: number
          ranking_score?: number
          rating?: number
          segment?: string[]
          storefront_config?: Json
          top_provider_since?: string | null
          total_sales_rated?: number
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      referral_campaigns: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          min_groups_for_ranking: number
          reward_buyer: number
          reward_mixed_total: number
          reward_seller: number
          sales_per_group: number
          top_ranked_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          min_groups_for_ranking?: number
          reward_buyer?: number
          reward_mixed_total?: number
          reward_seller?: number
          sales_per_group?: number
          top_ranked_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          min_groups_for_ranking?: number
          reward_buyer?: number
          reward_mixed_total?: number
          reward_seller?: number
          sales_per_group?: number
          top_ranked_count?: number
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
          consumed_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          joined_at: string | null
          link_token: string | null
          referral_code: string
          referred_email: string | null
          referred_id: string | null
          referred_name: string | null
          referred_phone: string | null
          referred_role: string | null
          referrer_id: string
          reward_snapshot: Json | null
          seller_released: boolean
          source: string
          status: string
          total_paid: number
        }
        Insert: {
          activated_at?: string | null
          bonus_released?: boolean
          buyer_released?: boolean
          commission_amount?: number
          consumed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          joined_at?: string | null
          link_token?: string | null
          referral_code: string
          referred_email?: string | null
          referred_id?: string | null
          referred_name?: string | null
          referred_phone?: string | null
          referred_role?: string | null
          referrer_id: string
          reward_snapshot?: Json | null
          seller_released?: boolean
          source?: string
          status?: string
          total_paid?: number
        }
        Update: {
          activated_at?: string | null
          bonus_released?: boolean
          buyer_released?: boolean
          commission_amount?: number
          consumed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          joined_at?: string | null
          link_token?: string | null
          referral_code?: string
          referred_email?: string | null
          referred_id?: string | null
          referred_name?: string | null
          referred_phone?: string | null
          referred_role?: string | null
          referrer_id?: string
          reward_snapshot?: Json | null
          seller_released?: boolean
          source?: string
          status?: string
          total_paid?: number
        }
        Relationships: []
      }
      segments: {
        Row: {
          created_at: string
          id: number
          image_url: string | null
          name: string
          suggested_tags: string[]
        }
        Insert: {
          created_at?: string
          id?: number
          image_url?: string | null
          name: string
          suggested_tags?: string[]
        }
        Update: {
          created_at?: string
          id?: number
          image_url?: string | null
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
      stock_entries: {
        Row: {
          created_at: string
          created_by: string | null
          document_number: string | null
          id: string
          notes: string | null
          provider_id: number
          source_type: string
          supplier_doc: string | null
          supplier_name: string | null
          total_amount: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_number?: string | null
          id?: string
          notes?: string | null
          provider_id: number
          source_type?: string
          supplier_doc?: string | null
          supplier_name?: string | null
          total_amount?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_number?: string | null
          id?: string
          notes?: string | null
          provider_id?: number
          source_type?: string
          supplier_doc?: string | null
          supplier_name?: string | null
          total_amount?: number
        }
        Relationships: []
      }
      stock_entry_items: {
        Row: {
          applied_price: number | null
          apply_choice: string | null
          create_new: boolean
          created_at: string
          current_price: number | null
          entry_id: string
          id: string
          matched_product_id: number | null
          quantity: number
          raw_barcode: string | null
          raw_name: string
          suggested_price: number | null
          unit: string | null
          unit_cost: number
        }
        Insert: {
          applied_price?: number | null
          apply_choice?: string | null
          create_new?: boolean
          created_at?: string
          current_price?: number | null
          entry_id: string
          id?: string
          matched_product_id?: number | null
          quantity?: number
          raw_barcode?: string | null
          raw_name: string
          suggested_price?: number | null
          unit?: string | null
          unit_cost?: number
        }
        Update: {
          applied_price?: number | null
          apply_choice?: string | null
          create_new?: boolean
          created_at?: string
          current_price?: number | null
          entry_id?: string
          id?: string
          matched_product_id?: number | null
          quantity?: number
          raw_barcode?: string | null
          raw_name?: string
          suggested_price?: number | null
          unit?: string | null
          unit_cost?: number
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          balance_after: number | null
          context: Json | null
          created_at: string
          id: string
          item_id: number
          item_kind: string
          item_name: string
          movement_type: string
          provider_id: number
          quantity_delta: number
          reference_id: string | null
          reference_label: string | null
          unit_cost: number | null
          user_id: string | null
        }
        Insert: {
          balance_after?: number | null
          context?: Json | null
          created_at?: string
          id?: string
          item_id: number
          item_kind: string
          item_name: string
          movement_type: string
          provider_id: number
          quantity_delta: number
          reference_id?: string | null
          reference_label?: string | null
          unit_cost?: number | null
          user_id?: string | null
        }
        Update: {
          balance_after?: number | null
          context?: Json | null
          created_at?: string
          id?: string
          item_id?: number
          item_kind?: string
          item_name?: string
          movement_type?: string
          provider_id?: number
          quantity_delta?: number
          reference_id?: string | null
          reference_label?: string | null
          unit_cost?: number | null
          user_id?: string | null
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
      support_requests: {
        Row: {
          context_analysis: string | null
          created_at: string
          details: string | null
          explanation: string | null
          id: string
          requested_item: string
          source: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          context_analysis?: string | null
          created_at?: string
          details?: string | null
          explanation?: string | null
          id?: string
          requested_item: string
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          context_analysis?: string | null
          created_at?: string
          details?: string | null
          explanation?: string | null
          id?: string
          requested_item?: string
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          context: Json | null
          created_at: string
          id: string
          level: string
          message: string
          user_id: string | null
        }
        Insert: {
          action: string
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          message: string
          user_id?: string | null
        }
        Update: {
          action?: string
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          message?: string
          user_id?: string | null
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
      user_activations: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          is_used: boolean | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          used_at?: string | null
          user_id?: string | null
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
      vini_brain_patterns: {
        Row: {
          created_at: string
          follow_up: string | null
          hits: number
          id: string
          keywords: string[]
          last_used_at: string | null
          replies: string[]
          source: string
          successes: number
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          follow_up?: string | null
          hits?: number
          id?: string
          keywords?: string[]
          last_used_at?: string | null
          replies?: string[]
          source?: string
          successes?: number
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          follow_up?: string | null
          hits?: number
          id?: string
          keywords?: string[]
          last_used_at?: string | null
          replies?: string[]
          source?: string
          successes?: number
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      vini_brain_signals: {
        Row: {
          assistant_reply: string
          created_at: string
          id: string
          mode: string
          pattern_id: string | null
          session_id: string | null
          signal: string | null
          user_id: string | null
          user_message: string
        }
        Insert: {
          assistant_reply: string
          created_at?: string
          id?: string
          mode: string
          pattern_id?: string | null
          session_id?: string | null
          signal?: string | null
          user_id?: string | null
          user_message: string
        }
        Update: {
          assistant_reply?: string
          created_at?: string
          id?: string
          mode?: string
          pattern_id?: string | null
          session_id?: string | null
          signal?: string | null
          user_id?: string | null
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "vini_brain_signals_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "vini_brain_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      vini_conversations: {
        Row: {
          content: string
          created_at: string
          id: string
          intent: string | null
          metadata: Json
          modality: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          intent?: string | null
          metadata?: Json
          modality?: string
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          intent?: string | null
          metadata?: Json
          modality?: string
          role?: string
          session_id?: string
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
          credit_limit: number
          credit_used: number
          id: string
          locked_cashback: number
          pending_balance: number
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          credit_limit?: number
          credit_used?: number
          id?: string
          locked_cashback?: number
          pending_balance?: number
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          credit_limit?: number
          credit_used?: number
          id?: string
          locked_cashback?: number
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
      admin_financial_health: {
        Row: {
          activated_referrals: number | null
          debtors_count: number | null
          healthy_count: number | null
          pending_referrals: number | null
          total_anticipation_fees: number | null
          total_credit_used: number | null
          total_customers: number | null
          total_debt: number | null
          total_float: number | null
          total_locked_cashback: number | null
          total_pending: number | null
          total_providers: number | null
          total_users: number | null
          total_vitrinei_fees: number | null
        }
        Relationships: []
      }
      v_lead_funnel: {
        Row: {
          activated_at: string | null
          bonus_released: boolean | null
          buyer_released: boolean | null
          commission_amount: number | null
          first_purchase_at: string | null
          first_sale_at: string | null
          has_subscription: boolean | null
          profile_created: boolean | null
          referral_code: string | null
          referral_created_at: string | null
          referral_id: string | null
          referral_status: string | null
          referred_email: string | null
          referred_id: string | null
          referred_name: string | null
          referred_phone: string | null
          referred_role: string | null
          referrer_id: string | null
          referrer_name: string | null
          seller_released: boolean | null
          subscription_paid: boolean | null
          subscription_status: string | null
          total_paid: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_stock_entry: { Args: { _entry_id: string }; Returns: Json }
      calculate_fidelity_score: { Args: { _user_id: string }; Returns: number }
      check_cpf_cnpj_available: { Args: { _doc: string }; Returns: Json }
      check_item_duplicate: {
        Args: {
          _exclude_id?: number
          _kind: string
          _name: string
          _provider_id: number
          _unit: string
        }
        Returns: Json
      }
      check_provider_uniqueness: {
        Args: {
          _cpf_cnpj?: string
          _email?: string
          _exclude_id?: number
          _phone?: string
        }
        Returns: Json
      }
      close_ai_savings_period: { Args: { _user_id?: string }; Returns: Json }
      contract_credit: {
        Args: { _amount: number; _user_id: string }
        Returns: Json
      }
      create_kit_acid: {
        Args: {
          _description: string
          _initial_quantity: number
          _items: Json
          _labor_cost: number
          _name: string
          _owner_provider_id: number
          _price: number
        }
        Returns: Json
      }
      current_ai_savings: { Args: never; Returns: Json }
      generate_random_pin: { Args: never; Returns: string }
      generate_referral_link_24h: { Args: { _referrer: string }; Returns: Json }
      get_public_display_name: { Args: { _user_id: string }; Returns: string }
      get_referral_by_token: {
        Args: { _token: string }
        Returns: {
          consumed_at: string
          expires_at: string
          id: string
          referrer_id: string
          status: string
        }[]
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
      process_checkout_acid: {
        Args: {
          _buyer_id: string
          _description?: string
          _installments?: number
          _items: Json
          _seller_id: string
          _use_cashback?: boolean
        }
        Returns: Json
      }
      process_sale_split: {
        Args: {
          _amount: number
          _buyer_id: string
          _description: string
          _installments?: number
          _seller_id: string
        }
        Returns: Json
      }
      recalc_provider_ranking: { Args: { _provider_id: number }; Returns: Json }
      refresh_top_providers: { Args: never; Returns: number }
      release_fractioned_cashback: {
        Args: { _phase: string; _referral_id: string }
        Returns: Json
      }
      release_referral_cashback: {
        Args: { _referred_user_id: string }
        Returns: undefined
      }
      release_referral_phase: {
        Args: { _phase: string; _referral_id: string }
        Returns: Json
      }
      sell_kit_acid: {
        Args: { _buyer_id: string; _kit_id: number; _quantity?: number }
        Returns: Json
      }
      start_ai_savings_period: { Args: { _user_id?: string }; Returns: string }
      unaccent_safe: { Args: { _text: string }; Returns: string }
      vini_brain_register_hit: {
        Args: { p_pattern_id: string; p_success?: boolean }
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
