export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published: boolean
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bounties: {
        Row: {
          amount: number
          complexity: string
          created_at: string
          creator_id: string
          currency: string
          id: string
          issue_id: string
          issue_number: number
          issue_title: string
          protection_status: string | null
          repository_id: string
          repository_name: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          complexity?: string
          created_at?: string
          creator_id: string
          currency?: string
          id?: string
          issue_id: string
          issue_number: number
          issue_title: string
          protection_status?: string | null
          repository_id: string
          repository_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          complexity?: string
          created_at?: string
          creator_id?: string
          currency?: string
          id?: string
          issue_id?: string
          issue_number?: number
          issue_title?: string
          protection_status?: string | null
          repository_id?: string
          repository_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      bounty_logs: {
        Row: {
          action: string
          bounty_id: string | null
          created_at: string
          details: Json | null
          error_message: string | null
          id: string
          payout_id: string | null
          success: boolean
        }
        Insert: {
          action: string
          bounty_id?: string | null
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          payout_id?: string | null
          success?: boolean
        }
        Update: {
          action?: string
          bounty_id?: string | null
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          payout_id?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bounty_logs_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "active_bounties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bounty_logs_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "bounties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bounty_logs_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      coinbase_auth: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      enabled_repositories: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          protection_status: string | null
          repository_description: string | null
          repository_full_name: string
          repository_id: string
          repository_language: string | null
          repository_name: string
          stargazers_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          protection_status?: string | null
          repository_description?: string | null
          repository_full_name: string
          repository_id: string
          repository_language?: string | null
          repository_name: string
          stargazers_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          protection_status?: string | null
          repository_description?: string | null
          repository_full_name?: string
          repository_id?: string
          repository_language?: string | null
          repository_name?: string
          stargazers_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      github_auth: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          refresh_token: string | null
          updated_at: string
          user_id: string
          webhook_secret: string | null
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
          webhook_secret?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      github_installations: {
        Row: {
          account_id: string
          account_login: string
          account_type: string
          created_at: string | null
          id: string
          installation_id: string
          permissions: Json | null
          repository_selection: string | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          account_login: string
          account_type?: string
          created_at?: string | null
          id?: string
          installation_id: string
          permissions?: Json | null
          repository_selection?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          account_login?: string
          account_type?: string
          created_at?: string | null
          id?: string
          installation_id?: string
          permissions?: Json | null
          repository_selection?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          contributor_id: string
          contributor_name: string
          created_at: string
          currency: string
          id: string
          pull_request_id: string
          pull_request_number: number
          repository_id: string
          repository_name: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          contributor_id: string
          contributor_name: string
          created_at?: string
          currency: string
          id?: string
          pull_request_id: string
          pull_request_number: number
          repository_id: string
          repository_name: string
          status: string
          updated_at?: string
        }
        Update: {
          amount?: number
          contributor_id?: string
          contributor_name?: string
          created_at?: string
          currency?: string
          id?: string
          pull_request_id?: string
          pull_request_number?: number
          repository_id?: string
          repository_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          description: string
          features: Json
          id: string
          is_popular: boolean | null
          name: string
          price_monthly: number
          price_yearly: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          features: Json
          id?: string
          is_popular?: boolean | null
          name: string
          price_monthly: number
          price_yearly: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          features?: Json
          id?: string
          is_popular?: boolean | null
          name?: string
          price_monthly?: number
          price_yearly?: number
          updated_at?: string
        }
        Relationships: []
      }
      public_issues: {
        Row: {
          body: string | null
          comments_count: number | null
          complexity: string
          created_at: string
          html_url: string
          id: string
          issue_id: string
          labels: Json | null
          last_checked: string | null
          number: number
          repository_id: string
          state: string
          suggested_bounty: number | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          comments_count?: number | null
          complexity?: string
          created_at: string
          html_url: string
          id?: string
          issue_id: string
          labels?: Json | null
          last_checked?: string | null
          number: number
          repository_id: string
          state?: string
          suggested_bounty?: number | null
          title: string
          updated_at: string
        }
        Update: {
          body?: string | null
          comments_count?: number | null
          complexity?: string
          created_at?: string
          html_url?: string
          id?: string
          issue_id?: string
          labels?: Json | null
          last_checked?: string | null
          number?: number
          repository_id?: string
          state?: string
          suggested_bounty?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_repositories: {
        Row: {
          created_at: string
          description: string | null
          full_name: string
          html_url: string
          id: string
          language: string | null
          last_scanned: string | null
          name: string
          open_issues_count: number | null
          owner_login: string
          owner_type: string
          protection_status: string | null
          repository_id: string
          stargazers_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          full_name: string
          html_url: string
          id?: string
          language?: string | null
          last_scanned?: string | null
          name: string
          open_issues_count?: number | null
          owner_login: string
          owner_type: string
          protection_status?: string | null
          repository_id: string
          stargazers_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          full_name?: string
          html_url?: string
          id?: string
          language?: string | null
          last_scanned?: string | null
          name?: string
          open_issues_count?: number | null
          owner_login?: string
          owner_type?: string
          protection_status?: string | null
          repository_id?: string
          stargazers_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          coinbase_transaction_id: string | null
          created_at: string
          currency: string
          id: string
          payout_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          coinbase_transaction_id?: string | null
          created_at?: string
          currency: string
          id?: string
          payout_id: string
          status: string
          updated_at?: string
        }
        Update: {
          amount?: number
          coinbase_transaction_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          payout_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_bounties: {
        Row: {
          amount: number | null
          complexity: string | null
          created_at: string | null
          creator_id: string | null
          currency: string | null
          id: string | null
          issue_id: string | null
          issue_number: number | null
          issue_title: string | null
          protection_status: string | null
          repository_id: string | null
          repository_name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          complexity?: string | null
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          id?: string | null
          issue_id?: string | null
          issue_number?: number | null
          issue_title?: string | null
          protection_status?: string | null
          repository_id?: string | null
          repository_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          complexity?: string | null
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          id?: string | null
          issue_id?: string | null
          issue_number?: number | null
          issue_title?: string | null
          protection_status?: string | null
          repository_id?: string | null
          repository_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      active_repositories: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string | null
          protection_status: string | null
          repository_description: string | null
          repository_full_name: string | null
          repository_id: string | null
          repository_language: string | null
          repository_name: string | null
          stargazers_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string | null
          protection_status?: string | null
          repository_description?: string | null
          repository_full_name?: string | null
          repository_id?: string | null
          repository_language?: string | null
          repository_name?: string | null
          stargazers_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string | null
          protection_status?: string | null
          repository_description?: string | null
          repository_full_name?: string | null
          repository_id?: string | null
          repository_language?: string | null
          repository_name?: string | null
          stargazers_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      safe_soft_delete: {
        Args: { table_name: string; record_id: string; reason?: string }
        Returns: Json
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
