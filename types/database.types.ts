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
      admin_collection_instances: {
        Row: {
          created_at: string
          groups_count: number
          id: string
          instance_key: string | null
          instance_name: string
          is_active: boolean | null
          provider: Database["public"]["Enums"]["collection_provider"]
          qr_code_base64: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          groups_count?: number
          id?: string
          instance_key?: string | null
          instance_name: string
          is_active?: boolean | null
          provider: Database["public"]["Enums"]["collection_provider"]
          qr_code_base64?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          groups_count?: number
          id?: string
          instance_key?: string | null
          instance_name?: string
          is_active?: boolean | null
          provider?: Database["public"]["Enums"]["collection_provider"]
          qr_code_base64?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_outbound_meta: {
        Row: {
          access_token_encrypted: string
          created_at: string
          display_number: string | null
          id: string
          is_active: boolean | null
          phone_number_id: string
          updated_at: string
          verify_token: string
          waba_id: string
        }
        Insert: {
          access_token_encrypted: string
          created_at?: string
          display_number?: string | null
          id?: string
          is_active?: boolean | null
          phone_number_id: string
          updated_at?: string
          verify_token: string
          waba_id: string
        }
        Update: {
          access_token_encrypted?: string
          created_at?: string
          display_number?: string | null
          id?: string
          is_active?: boolean | null
          phone_number_id?: string
          updated_at?: string
          verify_token?: string
          waba_id?: string
        }
        Relationships: []
      }
      agent_presets: {
        Row: {
          bot_link: string | null
          contact_info: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          telegram_bot_username: string | null
          whatsapp_support_number: string | null
        }
        Insert: {
          bot_link?: string | null
          contact_info?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          telegram_bot_username?: string | null
          whatsapp_support_number?: string | null
        }
        Update: {
          bot_link?: string | null
          contact_info?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          telegram_bot_username?: string | null
          whatsapp_support_number?: string | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          agent: string
          batch_id: string
          created_at: string
          evidence_excerpt: string | null
          group_id: string
          id: string
          notified_at: string | null
          organization_id: string
          recommended_actions: Json | null
          score: number | null
          severity: string
          status: string
          summary: string | null
          title: string
          type: string
        }
        Insert: {
          agent: string
          batch_id: string
          created_at?: string
          evidence_excerpt?: string | null
          group_id: string
          id?: string
          notified_at?: string | null
          organization_id: string
          recommended_actions?: Json | null
          score?: number | null
          severity: string
          status?: string
          summary?: string | null
          title: string
          type: string
        }
        Update: {
          agent?: string
          batch_id?: string
          created_at?: string
          evidence_excerpt?: string | null
          group_id?: string
          id?: string
          notified_at?: string | null
          organization_id?: string
          recommended_actions?: Json | null
          score?: number | null
          severity?: string
          status?: string
          summary?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "message_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          key_hash: string
          last_used_at: string | null
          name: string | null
          organization_id: string
          prefix: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          key_hash: string
          last_used_at?: string | null
          name?: string | null
          organization_id: string
          prefix: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          key_hash?: string
          last_used_at?: string | null
          name?: string | null
          organization_id?: string
          prefix?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      group_agents: {
        Row: {
          created_at: string
          group_id: string
          id: string
          last_seen_at: string | null
          preset: string
          status: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          last_seen_at?: string | null
          preset: string
          status?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          last_seen_at?: string | null
          preset?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_agents_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_analytics: {
        Row: {
          alert_count_high: number | null
          alert_count_total: number | null
          created_at: string
          group_id: string
          id: string
          organization_id: string
          period_start: string
          period_type: string
          sentiment_score: number | null
          top_risk_types: Json | null
        }
        Insert: {
          alert_count_high?: number | null
          alert_count_total?: number | null
          created_at?: string
          group_id: string
          id?: string
          organization_id: string
          period_start: string
          period_type?: string
          sentiment_score?: number | null
          top_risk_types?: Json | null
        }
        Update: {
          alert_count_high?: number | null
          alert_count_total?: number | null
          created_at?: string
          group_id?: string
          id?: string
          organization_id?: string
          period_start?: string
          period_type?: string
          sentiment_score?: number | null
          top_risk_types?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "group_analytics_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          collection_instance_id: string | null
          created_at: string
          data_retention_days: number
          external_id: string
          id: string
          is_active: boolean
          name: string
          description: string | null
          organization_id: string
          platform: string
          preset_id: string | null
        }
        Insert: {
          collection_instance_id?: string | null
          created_at?: string
          data_retention_days?: number
          external_id: string
          id?: string
          is_active?: boolean
          name: string
          description?: string | null
          organization_id: string
          platform: string
          preset_id?: string | null
        }
        Update: {
          collection_instance_id?: string | null
          created_at?: string
          data_retention_days?: number
          external_id?: string
          id?: string
          is_active?: boolean
          name?: string
          description?: string | null
          organization_id?: string
          platform?: string
          preset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_collection_instance_id_fkey"
            columns: ["collection_instance_id"]
            isOneToOne: false
            referencedRelation: "admin_collection_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "agent_presets"
            referencedColumns: ["id"]
          },
        ]
      }
      member_insights: {
        Row: {
          author_hash: string
          created_at: string | null
          group_id: string | null
          id: string
          insight_text: string | null
          is_read: boolean | null
          organization_id: string | null
          role: string | null
          sentiment_score: number | null
        }
        Insert: {
          author_hash: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          insight_text?: string | null
          is_read?: boolean | null
          organization_id?: string | null
          role?: string | null
          sentiment_score?: number | null
        }
        Update: {
          author_hash?: string
          created_at?: string | null
          group_id?: string | null
          id?: string
          insight_text?: string | null
          is_read?: boolean | null
          organization_id?: string | null
          role?: string | null
          sentiment_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "member_insights_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_batches: {
        Row: {
          author_count: number
          created_at: string
          end_ts: string
          error: string | null
          excerpt: string | null
          group_id: string
          high_signal_flags: Json | null
          id: string
          locked_at: string | null
          locked_by: string | null
          message_count: number
          organization_id: string
          priority: string
          processed_at: string | null
          start_ts: string
          status: string
          tokens_used: number | null
        }
        Insert: {
          author_count?: number
          created_at?: string
          end_ts: string
          error?: string | null
          excerpt?: string | null
          group_id: string
          high_signal_flags?: Json | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          message_count?: number
          organization_id: string
          priority?: string
          processed_at?: string | null
          start_ts: string
          status?: string
          tokens_used?: number | null
        }
        Update: {
          author_count?: number
          created_at?: string
          end_ts?: string
          error?: string | null
          excerpt?: string | null
          group_id?: string
          high_signal_flags?: Json | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          message_count?: number
          organization_id?: string
          priority?: string
          processed_at?: string | null
          start_ts?: string
          status?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_batches_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_hash: string
          batch_id: string | null
          content_text: string
          created_at: string
          group_id: string
          has_link: boolean | null
          id: string
          link_domains: Json | null
          message_ts: string
          organization_id: string
          platform_message_id: string | null
          pre_flags: Json | null
        }
        Insert: {
          author_hash: string
          batch_id?: string | null
          content_text: string
          created_at?: string
          group_id: string
          has_link?: boolean | null
          id?: string
          link_domains?: Json | null
          message_ts: string
          organization_id: string
          platform_message_id?: string | null
          pre_flags?: Json | null
        }
        Update: {
          author_hash?: string
          batch_id?: string | null
          content_text?: string
          created_at?: string
          group_id?: string
          has_link?: boolean | null
          id?: string
          link_domains?: Json | null
          message_ts?: string
          organization_id?: string
          platform_message_id?: string | null
          pre_flags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "message_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_endpoints: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          organization_id: string
          target: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id: string
          target: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string
          target?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_endpoints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          plan_id: string | null
          plan_type: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          summary_delivery_days: Json | null
          summary_schedule_time: string | null
          trial_ends_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan_id?: string | null
          plan_type?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          summary_delivery_days?: Json | null
          summary_schedule_time?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan_id?: string | null
          plan_type?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          summary_delivery_days?: Json | null
          summary_schedule_time?: string | null
          trial_ends_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          max_groups: number | null
          name: string
          price_monthly: number | null
          retention_days: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          max_groups?: number | null
          name: string
          price_monthly?: number | null
          retention_days?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          max_groups?: number | null
          name?: string
          price_monthly?: number | null
          retention_days?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          is_superadmin: boolean | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          is_superadmin?: boolean | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          is_superadmin?: boolean | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          organization_id: string | null
          scope: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          organization_id?: string | null
          scope: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          organization_id?: string | null
          scope?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      summaries: {
        Row: {
          batch_id: string | null
          created_at: string
          group_id: string
          highlights: Json | null
          id: string
          is_read: boolean | null
          organization_id: string
          period_end: string
          period_start: string
          summary_text: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          group_id: string
          highlights?: Json | null
          id?: string
          is_read?: boolean | null
          organization_id: string
          period_end: string
          period_start: string
          summary_text: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          group_id?: string
          highlights?: Json | null
          id?: string
          is_read?: boolean | null
          organization_id?: string
          period_end?: string
          period_start?: string
          summary_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "message_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summaries_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summaries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_generate_enabled: boolean | null
          created_at: string
          id: string
          notification_email: string | null
          notification_whatsapp: string | null
          summary_frequency: string | null
          updated_at: string
          user_id: string
          whatsapp_summary_enabled: boolean | null
        }
        Insert: {
          auto_generate_enabled?: boolean | null
          created_at?: string
          id?: string
          notification_email?: string | null
          notification_whatsapp?: string | null
          summary_frequency?: string | null
          updated_at?: string
          user_id: string
          whatsapp_summary_enabled?: boolean | null
        }
        Update: {
          auto_generate_enabled?: boolean | null
          created_at?: string
          id?: string
          notification_email?: string | null
          notification_whatsapp?: string | null
          summary_frequency?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_summary_enabled?: boolean | null
        }
        Relationships: []
      }
      delivery_queue: {
        Row: {
          id: string
          batch_id: string | null
          type: 'email' | 'whatsapp'
          payload: Json
          status: 'pending' | 'processing' | 'completed' | 'failed'
          error: string | null
          created_at: string
          processed_at: string | null
          retry_count: number
        }
        Insert: {
          id?: string
          batch_id?: string | null
          type: 'email' | 'whatsapp'
          payload: Json
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error?: string | null
          created_at?: string
          processed_at?: string | null
          retry_count?: number
        }
        Update: {
          id?: string
          batch_id?: string | null
          type?: 'email' | 'whatsapp'
          payload?: Json
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error?: string | null
          created_at?: string
          processed_at?: string | null
          retry_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_queue_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "message_batches"
            referencedColumns: ["id"]
          }
        ]
      }
      system_settings: {
        Row: {
          key: string
          value: string
          updated_at: string | null
        }
        Insert: {
          key: string
          value: string
          updated_at?: string | null
        }
        Update: {
          key?: string
          value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_evolution_config: {
        Row: {
          id: string
          instance_url: string
          api_key: string
          updated_at: string
        }
        Insert: {
          id?: string
          instance_url: string
          api_key: string
          updated_at?: string
        }
        Update: {
          id?: string
          instance_url?: string
          api_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_whatsapp_templates: {
        Row: {
          id: string
          name: string
          platform: string
          category: string | null
          language: string
          content: Json | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          platform: string
          category?: string | null
          language?: string
          content?: Json | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          platform?: string
          category?: string | null
          language?: string
          content?: Json | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      inbox_feed: {
        Row: {
          created_at: string | null
          group_id: string | null
          id: string | null
          organization_id: string | null
          preview: string | null
          read_status: string | null
          subject: string | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_org_membership: { Args: { org_id: string }; Returns: boolean }
      delete_old_messages: { Args: never; Returns: undefined }
      get_global_sms_metrics: {
        Args: never
        Returns: {
          sent_today: number
          success_rate: number
          total_sent: number
          unique_users: number
        }[]
      }
      get_my_organizations: { Args: never; Returns: string[] }
      get_recent_sms_logs: {
        Args: { p_limit: number }
        Returns: {
          created_at: string
          id: string
          metadata: Json
          recipient: string
          sms_type: string
          user_email: string
        }[]
      }
      get_user_activity_stats: {
        Args: { p_user_id: string }
        Returns: {
          count: number
          date: string
        }[]
      }
      get_user_reports: {
        Args: never
        Returns: {
          ai_tokens: number
          alerts_count: number
          created_at: string
          email: string
          emails_sent: number
          groups_count: number
          id: string
          instances_count: number
          messages_received_count: number
          monitored_groups_count: number
          sms_sent: number
          summaries_generated: number
        }[]
      }
      is_superadmin:
      | { Args: never; Returns: boolean }
      | { Args: { _user_id: string }; Returns: boolean }
      log_keyword_match: {
        Args: { p_message_id: string; p_monitor_id: string }
        Returns: undefined
      }
      log_user_activity: {
        Args: { p_activity_type: string; p_metadata?: Json; p_user_id: string }
        Returns: string
      }
      provision_default_organization: {
        Args: { full_name: string; user_id: string }
        Returns: string
      }
    }
    Enums: {
      collection_provider: "evolution" | "telegram"
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
      collection_provider: ["evolution", "telegram"],
    },
  },
} as const
