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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      company_branding: {
        Row: {
          active_theme_id: string
          address: string
          body_font: string
          company_name: string
          company_phone: string
          custom_accent_color: string
          custom_header_color: string
          custom_primary_color: string
          footer_text: string
          header_logo_slot: number
          heading_font: string
          id: string
          logo_finish: string
          logo_size: string
          logo_url: string
          logos: Json
          updated_at: string
          website: string
        }
        Insert: {
          active_theme_id?: string
          address?: string
          body_font?: string
          company_name?: string
          company_phone?: string
          custom_accent_color?: string
          custom_header_color?: string
          custom_primary_color?: string
          footer_text?: string
          header_logo_slot?: number
          heading_font?: string
          id?: string
          logo_finish?: string
          logo_size?: string
          logo_url?: string
          logos?: Json
          updated_at?: string
          website?: string
        }
        Update: {
          active_theme_id?: string
          address?: string
          body_font?: string
          company_name?: string
          company_phone?: string
          custom_accent_color?: string
          custom_header_color?: string
          custom_primary_color?: string
          footer_text?: string
          header_logo_slot?: number
          heading_font?: string
          id?: string
          logo_finish?: string
          logo_size?: string
          logo_url?: string
          logos?: Json
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      divisions: {
        Row: {
          created_at: string
          description: string
          display_order: number
          id: string
          name: string
          slug: string
          therapy_tag: string
        }
        Insert: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          name: string
          slug: string
          therapy_tag?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          name?: string
          slug?: string
          therapy_tag?: string
        }
        Relationships: []
      }
      download_files: {
        Row: {
          brand_name: string | null
          category: string
          created_at: string
          description: string | null
          division_name: string | null
          download_count: number
          extension: string
          file_name: string
          file_path: string
          file_size_bytes: number
          file_type: string | null
          file_url: string
          id: string
          is_featured: boolean
          title: string
        }
        Insert: {
          brand_name?: string | null
          category?: string
          created_at?: string
          description?: string | null
          division_name?: string | null
          download_count?: number
          extension?: string
          file_name: string
          file_path: string
          file_size_bytes?: number
          file_type?: string | null
          file_url: string
          id?: string
          is_featured?: boolean
          title: string
        }
        Update: {
          brand_name?: string | null
          category?: string
          created_at?: string
          description?: string | null
          division_name?: string | null
          download_count?: number
          extension?: string
          file_name?: string
          file_path?: string
          file_size_bytes?: number
          file_type?: string | null
          file_url?: string
          id?: string
          is_featured?: boolean
          title?: string
        }
        Relationships: []
      }
      greeting_cards: {
        Row: {
          created_at: string
          doctor_name: string
          id: string
          image_path: string
          occasion: string
          template: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          doctor_name: string
          id?: string
          image_path: string
          occasion: string
          template?: Json
          user_id?: string
        }
        Update: {
          created_at?: string
          doctor_name?: string
          id?: string
          image_path?: string
          occasion?: string
          template?: Json
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          brand_color: string | null
          brand_name: string
          composition: string
          created_at: string
          division_id: string
          dosage_form: string
          id: string
          indications: string[]
          is_top_product: boolean
          is_upcoming: boolean
          pack_image_url: string | null
        }
        Insert: {
          brand_color?: string | null
          brand_name: string
          composition?: string
          created_at?: string
          division_id: string
          dosage_form?: string
          id?: string
          indications?: string[]
          is_top_product?: boolean
          is_upcoming?: boolean
          pack_image_url?: string | null
        }
        Update: {
          brand_color?: string | null
          brand_name?: string
          composition?: string
          created_at?: string
          division_id?: string
          dosage_form?: string
          id?: string
          indications?: string[]
          is_top_product?: boolean
          is_upcoming?: boolean
          pack_image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
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
      visiting_cards: {
        Row: {
          created_at: string
          designation: string
          details: Json
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          designation?: string
          details?: Json
          full_name: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          designation?: string
          details?: Json
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visual_aids: {
        Row: {
          created_at: string
          created_by: string | null
          creative_type: string
          id: string
          image_url: string
          product_id: string | null
          prompt_used: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          creative_type?: string
          id?: string
          image_url: string
          product_id?: string | null
          prompt_used?: string | null
          title?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          creative_type?: string
          id?: string
          image_url?: string
          product_id?: string | null
          prompt_used?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "visual_aids_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      increment_download_count: { Args: { _id: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
