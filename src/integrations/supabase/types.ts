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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          entity: string
          entity_id: string
          id: string
          meta: Json
          reason: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          entity: string
          entity_id: string
          id?: string
          meta?: Json
          reason?: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          entity?: string
          entity_id?: string
          id?: string
          meta?: Json
          reason?: string
        }
        Relationships: []
      }
      commission_rates: {
        Row: {
          percent: number
          tier: Database["public"]["Enums"]["commission_tier"]
          updated_at: string
        }
        Insert: {
          percent: number
          tier: Database["public"]["Enums"]["commission_tier"]
          updated_at?: string
        }
        Update: {
          percent?: number
          tier?: Database["public"]["Enums"]["commission_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          created_at: string
          detail: string
          edit_reason: string | null
          id: string
          kind: string
          occurred_at: string
          promoter_id: string
          source_ref: string
          status: string
          title: string
        }
        Insert: {
          amount: number
          created_at?: string
          detail?: string
          edit_reason?: string | null
          id?: string
          kind: string
          occurred_at?: string
          promoter_id: string
          source_ref?: string
          status?: string
          title: string
        }
        Update: {
          amount?: number
          created_at?: string
          detail?: string
          edit_reason?: string | null
          id?: string
          kind?: string
          occurred_at?: string
          promoter_id?: string
          source_ref?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          api_key_hash: string
          commission_rate: number
          contact_email: string
          contact_phone: string
          created_at: string
          id: string
          name: string
          status: string
          updated_at: string
          webhook_url: string
        }
        Insert: {
          api_key_hash?: string
          commission_rate?: number
          contact_email?: string
          contact_phone?: string
          created_at?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
          webhook_url?: string
        }
        Update: {
          api_key_hash?: string
          commission_rate?: number
          contact_email?: string
          contact_phone?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
          webhook_url?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_notes: string
          created_at: string
          display_name: string
          email: string | null
          pix_key: string | null
          referral_code: string
          status: Database["public"]["Enums"]["promoter_status"]
          tier: Database["public"]["Enums"]["commission_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string
          created_at?: string
          display_name?: string
          email?: string | null
          pix_key?: string | null
          referral_code: string
          status?: Database["public"]["Enums"]["promoter_status"]
          tier?: Database["public"]["Enums"]["commission_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string
          created_at?: string
          display_name?: string
          email?: string | null
          pix_key?: string | null
          referral_code?: string
          status?: Database["public"]["Enums"]["promoter_status"]
          tier?: Database["public"]["Enums"]["commission_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          promoter_id: string
          referred_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          promoter_id: string
          referred_name: string
        }
        Update: {
          created_at?: string
          id?: string
          promoter_id?: string
          referred_name?: string
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
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          pix_key: string
          processed_by: string | null
          promoter_id: string
          rejection_reason: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          pix_key: string
          processed_by?: string | null
          promoter_id: string
          rejection_reason?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          pix_key?: string
          processed_by?: string | null
          promoter_id?: string
          rejection_reason?: string | null
          status?: string
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
      app_role: "admin" | "promoter"
      commission_tier: "novato" | "prata" | "ouro" | "diamante"
      promoter_status: "pending" | "active" | "suspended" | "banned"
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
      app_role: ["admin", "promoter"],
      commission_tier: ["novato", "prata", "ouro", "diamante"],
      promoter_status: ["pending", "active", "suspended", "banned"],
    },
  },
} as const
