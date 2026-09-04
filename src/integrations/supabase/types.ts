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
      articles: {
        Row: {
          content_html: string | null
          content_markdown: string | null
          created_at: string
          error: string | null
          faq: Json | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          og_description: string | null
          og_title: string | null
          outline: Json | null
          plan_item_id: string | null
          primary_keyword: string | null
          published_at: string | null
          scheduled_at: string | null
          search_intent: string | null
          secondary_keywords: string[] | null
          site_id: string | null
          slug: string | null
          status: string
          target_country: string | null
          title: string
          tone: string | null
          updated_at: string
          user_id: string
          word_count: number | null
          wp_post_id: number | null
        }
        Insert: {
          content_html?: string | null
          content_markdown?: string | null
          created_at?: string
          error?: string | null
          faq?: Json | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_title?: string | null
          outline?: Json | null
          plan_item_id?: string | null
          primary_keyword?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          search_intent?: string | null
          secondary_keywords?: string[] | null
          site_id?: string | null
          slug?: string | null
          status?: string
          target_country?: string | null
          title: string
          tone?: string | null
          updated_at?: string
          user_id: string
          word_count?: number | null
          wp_post_id?: number | null
        }
        Update: {
          content_html?: string | null
          content_markdown?: string | null
          created_at?: string
          error?: string | null
          faq?: Json | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_title?: string | null
          outline?: Json | null
          plan_item_id?: string | null
          primary_keyword?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          search_intent?: string | null
          secondary_keywords?: string[] | null
          site_id?: string | null
          slug?: string | null
          status?: string
          target_country?: string | null
          title?: string
          tone?: string | null
          updated_at?: string
          user_id?: string
          word_count?: number | null
          wp_post_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_plan_item_id_fkey"
            columns: ["plan_item_id"]
            isOneToOne: false
            referencedRelation: "content_plan_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      content_plan_items: {
        Row: {
          article_id: string | null
          cluster: string | null
          created_at: string
          day_number: number
          id: string
          plan_id: string
          primary_keyword: string | null
          scheduled_date: string | null
          search_intent: string | null
          status: string
          topic: string
          user_id: string
        }
        Insert: {
          article_id?: string | null
          cluster?: string | null
          created_at?: string
          day_number: number
          id?: string
          plan_id: string
          primary_keyword?: string | null
          scheduled_date?: string | null
          search_intent?: string | null
          status?: string
          topic: string
          user_id: string
        }
        Update: {
          article_id?: string | null
          cluster?: string | null
          created_at?: string
          day_number?: number
          id?: string
          plan_id?: string
          primary_keyword?: string | null
          scheduled_date?: string | null
          search_intent?: string | null
          status?: string
          topic?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "content_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      content_plans: {
        Row: {
          created_at: string
          duration_days: number
          id: string
          niche: string | null
          primary_keywords: string[] | null
          secondary_keywords: string[] | null
          site_id: string | null
          strategy: Json | null
          target_audience: string | null
          target_country: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_days?: number
          id?: string
          niche?: string | null
          primary_keywords?: string[] | null
          secondary_keywords?: string[] | null
          site_id?: string | null
          strategy?: Json | null
          target_audience?: string | null
          target_country?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_days?: number
          id?: string
          niche?: string | null
          primary_keywords?: string[] | null
          secondary_keywords?: string[] | null
          site_id?: string | null
          strategy?: Json | null
          target_audience?: string | null
          target_country?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_plans_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      publish_settings: {
        Row: {
          approval_mode: string
          auto_images: boolean
          auto_internal_links: boolean
          created_at: string
          end_date: string | null
          frequency: string
          id: string
          min_quality_score: number
          site_id: string
          start_date: string | null
          time_slots: string[] | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_mode?: string
          auto_images?: boolean
          auto_internal_links?: boolean
          created_at?: string
          end_date?: string | null
          frequency?: string
          id?: string
          min_quality_score?: number
          site_id: string
          start_date?: string | null
          time_slots?: string[] | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_mode?: string
          auto_images?: boolean
          auto_internal_links?: boolean
          created_at?: string
          end_date?: string | null
          frequency?: string
          id?: string
          min_quality_score?: number
          site_id?: string
          start_date?: string | null
          time_slots?: string[] | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publish_settings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_scores: {
        Row: {
          article_id: string
          created_at: string
          eeat: number
          grammar: number
          id: string
          keyword_coverage: number
          originality: number
          overall: number
          readability: number
          recommendations: string[] | null
          seo: number
          strengths: string[] | null
          structure: number
          tier: string
          user_id: string
          weaknesses: string[] | null
        }
        Insert: {
          article_id: string
          created_at?: string
          eeat: number
          grammar: number
          id?: string
          keyword_coverage: number
          originality: number
          overall: number
          readability: number
          recommendations?: string[] | null
          seo: number
          strengths?: string[] | null
          structure: number
          tier: string
          user_id: string
          weaknesses?: string[] | null
        }
        Update: {
          article_id?: string
          created_at?: string
          eeat?: number
          grammar?: number
          id?: string
          keyword_coverage?: number
          originality?: number
          overall?: number
          readability?: number
          recommendations?: string[] | null
          seo?: number
          strengths?: string[] | null
          structure?: number
          tier?: string
          user_id?: string
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_scores_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          business_type: string | null
          created_at: string
          default_tone: string | null
          default_word_count: number | null
          id: string
          name: string
          niche: string | null
          primary_keywords: string[] | null
          secondary_keywords: string[] | null
          target_audience: string | null
          target_country: string | null
          updated_at: string
          url: string
          user_id: string
          wp_app_password: string | null
          wp_connected: boolean
          wp_username: string | null
        }
        Insert: {
          business_type?: string | null
          created_at?: string
          default_tone?: string | null
          default_word_count?: number | null
          id?: string
          name: string
          niche?: string | null
          primary_keywords?: string[] | null
          secondary_keywords?: string[] | null
          target_audience?: string | null
          target_country?: string | null
          updated_at?: string
          url: string
          user_id: string
          wp_app_password?: string | null
          wp_connected?: boolean
          wp_username?: string | null
        }
        Update: {
          business_type?: string | null
          created_at?: string
          default_tone?: string | null
          default_word_count?: number | null
          id?: string
          name?: string
          niche?: string | null
          primary_keywords?: string[] | null
          secondary_keywords?: string[] | null
          target_audience?: string | null
          target_country?: string | null
          updated_at?: string
          url?: string
          user_id?: string
          wp_app_password?: string | null
          wp_connected?: boolean
          wp_username?: string | null
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          connected_at: string
          fb_page_id: string | null
          fb_page_name: string | null
          fb_page_token: string | null
          fb_user_id: string | null
          fb_user_token: string | null
          id: string
          ig_user_id: string | null
          ig_username: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_at?: string
          fb_page_id?: string | null
          fb_page_name?: string | null
          fb_page_token?: string | null
          fb_user_id?: string | null
          fb_user_token?: string | null
          id?: string
          ig_user_id?: string | null
          ig_username?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_at?: string
          fb_page_id?: string | null
          fb_page_name?: string | null
          fb_page_token?: string | null
          fb_user_id?: string | null
          fb_user_token?: string | null
          id?: string
          ig_user_id?: string | null
          ig_username?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_post_log: {
        Row: {
          caption: string | null
          created_at: string
          error: string | null
          external_id: string | null
          id: string
          image_url: string | null
          platform: string
          status: string
          topic: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          error?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          platform: string
          status: string
          topic?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          error?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          platform?: string
          status?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_schedules: {
        Row: {
          audience: string
          created_at: string
          cta: string
          enabled: boolean
          id: string
          last_error: string | null
          last_run_at: string | null
          last_status: string | null
          next_topic_index: number
          platforms: Json
          post_time_utc: string
          tone: string
          topics: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string
          created_at?: string
          cta?: string
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string | null
          next_topic_index?: number
          platforms?: Json
          post_time_utc?: string
          tone?: string
          topics?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string
          created_at?: string
          cta?: string
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string | null
          next_topic_index?: number
          platforms?: Json
          post_time_utc?: string
          tone?: string
          topics?: Json
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
    Enums: {},
  },
} as const
