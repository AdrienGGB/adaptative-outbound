export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      account_hierarchies: {
        Row: {
          child_account_id: string
          created_at: string | null
          depth: number | null
          id: string
          ownership_percentage: number | null
          parent_account_id: string
          path: unknown | null
          relationship_type: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          child_account_id: string
          created_at?: string | null
          depth?: number | null
          id?: string
          ownership_percentage?: number | null
          parent_account_id: string
          path?: unknown | null
          relationship_type?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          child_account_id?: string
          created_at?: string | null
          depth?: number | null
          id?: string
          ownership_percentage?: number | null
          parent_account_id?: string
          path?: unknown | null
          relationship_type?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_hierarchies_child_account_id_fkey"
            columns: ["child_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_hierarchies_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_hierarchies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      account_versions: {
        Row: {
          account_id: string
          change_reason: string | null
          change_source: string | null
          change_type: string | null
          changed_by: string | null
          changed_fields: string[] | null
          created_at: string | null
          data: Json
          id: string
          version_number: number
        }
        Insert: {
          account_id: string
          change_reason?: string | null
          change_source?: string | null
          change_type?: string | null
          changed_by?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          data: Json
          id?: string
          version_number: number
        }
        Update: {
          account_id?: string
          change_reason?: string | null
          change_source?: string | null
          change_type?: string | null
          changed_by?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          data?: Json
          id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "account_versions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_tier: string | null
          activity_count: number | null
          annual_revenue: number | null
          assigned_team_id: string | null
          business_model: string | null
          company_type: string | null
          contact_count: number | null
          created_at: string | null
          created_by: string | null
          crunchbase_url: string | null
          description: string | null
          domain: string | null
          employee_count: number | null
          employee_range: string | null
          external_id: string | null
          facebook_url: string | null
          founded_year: number | null
          funding_stage: string | null
          funding_total: number | null
          github_url: string | null
          headquarters_address: string | null
          headquarters_city: string | null
          headquarters_country: string | null
          headquarters_postal_code: string | null
          headquarters_state: string | null
          headquarters_timezone: string | null
          id: string
          industry: string | null
          investors: string[] | null
          last_activity_at: string | null
          last_enriched_at: string | null
          last_funding_amount: number | null
          last_funding_date: string | null
          last_funding_type: string | null
          latitude: number | null
          lifecycle_stage: string | null
          linkedin_id: string | null
          linkedin_url: string | null
          logo_url: string | null
          longitude: number | null
          naics_code: string | null
          name: string
          open_opportunity_count: number | null
          owner_id: string | null
          parent_account_id: string | null
          revenue_range: string | null
          search_vector: unknown | null
          sic_code: string | null
          source: string | null
          status: string | null
          stock_ticker: string | null
          sub_industry: string | null
          tech_stack_last_updated: string | null
          technologies: Json | null
          twitter_handle: string | null
          twitter_url: string | null
          ultimate_parent_id: string | null
          updated_at: string | null
          website: string | null
          workspace_id: string
        }
        Insert: {
          account_tier?: string | null
          activity_count?: number | null
          annual_revenue?: number | null
          assigned_team_id?: string | null
          business_model?: string | null
          company_type?: string | null
          contact_count?: number | null
          created_at?: string | null
          created_by?: string | null
          crunchbase_url?: string | null
          description?: string | null
          domain?: string | null
          employee_count?: number | null
          employee_range?: string | null
          external_id?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          funding_stage?: string | null
          funding_total?: number | null
          github_url?: string | null
          headquarters_address?: string | null
          headquarters_city?: string | null
          headquarters_country?: string | null
          headquarters_postal_code?: string | null
          headquarters_state?: string | null
          headquarters_timezone?: string | null
          id?: string
          industry?: string | null
          investors?: string[] | null
          last_activity_at?: string | null
          last_enriched_at?: string | null
          last_funding_amount?: number | null
          last_funding_date?: string | null
          last_funding_type?: string | null
          latitude?: number | null
          lifecycle_stage?: string | null
          linkedin_id?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          naics_code?: string | null
          name: string
          open_opportunity_count?: number | null
          owner_id?: string | null
          parent_account_id?: string | null
          revenue_range?: string | null
          search_vector?: unknown | null
          sic_code?: string | null
          source?: string | null
          status?: string | null
          stock_ticker?: string | null
          sub_industry?: string | null
          tech_stack_last_updated?: string | null
          technologies?: Json | null
          twitter_handle?: string | null
          twitter_url?: string | null
          ultimate_parent_id?: string | null
          updated_at?: string | null
          website?: string | null
          workspace_id: string
        }
        Update: {
          account_tier?: string | null
          activity_count?: number | null
          annual_revenue?: number | null
          assigned_team_id?: string | null
          business_model?: string | null
          company_type?: string | null
          contact_count?: number | null
          created_at?: string | null
          created_by?: string | null
          crunchbase_url?: string | null
          description?: string | null
          domain?: string | null
          employee_count?: number | null
          employee_range?: string | null
          external_id?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          funding_stage?: string | null
          funding_total?: number | null
          github_url?: string | null
          headquarters_address?: string | null
          headquarters_city?: string | null
          headquarters_country?: string | null
          headquarters_postal_code?: string | null
          headquarters_state?: string | null
          headquarters_timezone?: string | null
          id?: string
          industry?: string | null
          investors?: string[] | null
          last_activity_at?: string | null
          last_enriched_at?: string | null
          last_funding_amount?: number | null
          last_funding_date?: string | null
          last_funding_type?: string | null
          latitude?: number | null
          lifecycle_stage?: string | null
          linkedin_id?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          longitude?: number | null
          naics_code?: string | null
          name?: string
          open_opportunity_count?: number | null
          owner_id?: string | null
          parent_account_id?: string | null
          revenue_range?: string | null
          search_vector?: unknown | null
          sic_code?: string | null
          source?: string | null
          status?: string | null
          stock_ticker?: string | null
          sub_industry?: string | null
          tech_stack_last_updated?: string | null
          technologies?: Json | null
          twitter_handle?: string | null
          twitter_url?: string | null
          ultimate_parent_id?: string | null
          updated_at?: string | null
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_assigned_team_id_fkey"
            columns: ["assigned_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_ultimate_parent_id_fkey"
            columns: ["ultimate_parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          account_id: string | null
          activity_category: string | null
          activity_data: Json | null
          activity_type: string
          body: string | null
          contact_id: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          external_id: string | null
          id: string
          occurred_at: string
          outcome: string | null
          scheduled_for: string | null
          sentiment_score: number | null
          source: string | null
          source_id: string | null
          subject: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          account_id?: string | null
          activity_category?: string | null
          activity_data?: Json | null
          activity_type: string
          body?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          external_id?: string | null
          id?: string
          occurred_at: string
          outcome?: string | null
          scheduled_for?: string | null
          sentiment_score?: number | null
          source?: string | null
          source_id?: string | null
          subject?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          account_id?: string | null
          activity_category?: string | null
          activity_data?: Json | null
          activity_type?: string
          body?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          external_id?: string | null
          id?: string
          occurred_at?: string
          outcome?: string | null
          scheduled_for?: string | null
          sentiment_score?: number | null
          source?: string | null
          source_id?: string | null
          subject?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          scopes: string[] | null
          status: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          scopes?: string[] | null
          status?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: string[] | null
          status?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_versions: {
        Row: {
          change_reason: string | null
          change_source: string | null
          change_type: string | null
          changed_by: string | null
          changed_fields: string[] | null
          contact_id: string
          created_at: string | null
          data: Json
          id: string
          version_number: number
        }
        Insert: {
          change_reason?: string | null
          change_source?: string | null
          change_type?: string | null
          changed_by?: string | null
          changed_fields?: string[] | null
          contact_id: string
          created_at?: string | null
          data: Json
          id?: string
          version_number: number
        }
        Update: {
          change_reason?: string | null
          change_source?: string | null
          change_type?: string | null
          changed_by?: string | null
          changed_fields?: string[] | null
          contact_id?: string
          created_at?: string | null
          data?: Json
          id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "contact_versions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          account_id: string | null
          activity_count: number | null
          bounce_reason: string | null
          buying_role: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          department: string | null
          direct_dial: string | null
          do_not_contact: boolean | null
          email: string | null
          email_opened_count: number | null
          email_replied_count: number | null
          email_sent_count: number | null
          email_status: string | null
          engagement_level: string | null
          external_id: string | null
          first_name: string | null
          full_name: string
          github_username: string | null
          id: string
          influence_score: number | null
          is_blocker: boolean | null
          is_champion: boolean | null
          is_decision_maker: boolean | null
          job_title: string | null
          last_contacted_at: string | null
          last_enriched_at: string | null
          last_name: string | null
          last_verified_at: string | null
          linkedin_id: string | null
          linkedin_url: string | null
          mobile_phone: string | null
          normalized_title: string | null
          opted_out_at: string | null
          owner_id: string | null
          phone: string | null
          phone_status: string | null
          reports_to_id: string | null
          search_vector: unknown | null
          seniority_level: string | null
          source: string | null
          state: string | null
          status: string | null
          timezone: string | null
          twitter_handle: string | null
          twitter_url: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          account_id?: string | null
          activity_count?: number | null
          bounce_reason?: string | null
          buying_role?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          direct_dial?: string | null
          do_not_contact?: boolean | null
          email?: string | null
          email_opened_count?: number | null
          email_replied_count?: number | null
          email_sent_count?: number | null
          email_status?: string | null
          engagement_level?: string | null
          external_id?: string | null
          first_name?: string | null
          full_name: string
          github_username?: string | null
          id?: string
          influence_score?: number | null
          is_blocker?: boolean | null
          is_champion?: boolean | null
          is_decision_maker?: boolean | null
          job_title?: string | null
          last_contacted_at?: string | null
          last_enriched_at?: string | null
          last_name?: string | null
          last_verified_at?: string | null
          linkedin_id?: string | null
          linkedin_url?: string | null
          mobile_phone?: string | null
          normalized_title?: string | null
          opted_out_at?: string | null
          owner_id?: string | null
          phone?: string | null
          phone_status?: string | null
          reports_to_id?: string | null
          search_vector?: unknown | null
          seniority_level?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          timezone?: string | null
          twitter_handle?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          account_id?: string | null
          activity_count?: number | null
          bounce_reason?: string | null
          buying_role?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          direct_dial?: string | null
          do_not_contact?: boolean | null
          email?: string | null
          email_opened_count?: number | null
          email_replied_count?: number | null
          email_sent_count?: number | null
          email_status?: string | null
          engagement_level?: string | null
          external_id?: string | null
          first_name?: string | null
          full_name?: string
          github_username?: string | null
          id?: string
          influence_score?: number | null
          is_blocker?: boolean | null
          is_champion?: boolean | null
          is_decision_maker?: boolean | null
          job_title?: string | null
          last_contacted_at?: string | null
          last_enriched_at?: string | null
          last_name?: string | null
          last_verified_at?: string | null
          linkedin_id?: string | null
          linkedin_url?: string | null
          mobile_phone?: string | null
          normalized_title?: string | null
          opted_out_at?: string | null
          owner_id?: string | null
          phone?: string | null
          phone_status?: string | null
          reports_to_id?: string | null
          search_vector?: unknown | null
          seniority_level?: string | null
          source?: string | null
          state?: string | null
          status?: string | null
          timezone?: string | null
          twitter_handle?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_reports_to_id_fkey"
            columns: ["reports_to_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          boolean_value: boolean | null
          created_at: string | null
          custom_field_id: string
          date_value: string | null
          datetime_value: string | null
          decimal_value: number | null
          entity_id: string
          id: string
          json_value: Json | null
          number_value: number | null
          text_value: string | null
          updated_at: string | null
        }
        Insert: {
          boolean_value?: boolean | null
          created_at?: string | null
          custom_field_id: string
          date_value?: string | null
          datetime_value?: string | null
          decimal_value?: number | null
          entity_id: string
          id?: string
          json_value?: Json | null
          number_value?: number | null
          text_value?: string | null
          updated_at?: string | null
        }
        Update: {
          boolean_value?: boolean | null
          created_at?: string | null
          custom_field_id?: string
          date_value?: string | null
          datetime_value?: string | null
          decimal_value?: number | null
          entity_id?: string
          id?: string
          json_value?: Json | null
          number_value?: number | null
          text_value?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_custom_field_id_fkey"
            columns: ["custom_field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          created_at: string | null
          created_by: string | null
          display_order: number | null
          entity_type: string
          field_label: string
          field_name: string
          field_type: string
          help_text: string | null
          id: string
          is_required: boolean | null
          is_searchable: boolean | null
          is_unique: boolean | null
          is_visible: boolean | null
          options: Json | null
          placeholder: string | null
          updated_at: string | null
          validation_rules: Json | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          entity_type: string
          field_label: string
          field_name: string
          field_type: string
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          is_searchable?: boolean | null
          is_unique?: boolean | null
          is_visible?: boolean | null
          options?: Json | null
          placeholder?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          entity_type?: string
          field_label?: string
          field_name?: string
          field_type?: string
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          is_searchable?: boolean | null
          is_unique?: boolean | null
          is_visible?: boolean | null
          options?: Json | null
          placeholder?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_fields_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      dead_letter_queue: {
        Row: {
          attempts: number
          error_message: string | null
          failed_at: string | null
          id: string
          job_id: string | null
          job_type: string
          payload: Json
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          stack_trace: string | null
          status: string | null
          workspace_id: string | null
        }
        Insert: {
          attempts: number
          error_message?: string | null
          failed_at?: string | null
          id?: string
          job_id?: string | null
          job_type: string
          payload: Json
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          stack_trace?: string | null
          status?: string | null
          workspace_id?: string | null
        }
        Update: {
          attempts?: number
          error_message?: string | null
          failed_at?: string | null
          id?: string
          job_id?: string | null
          job_type?: string
          payload?: Json
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          stack_trace?: string | null
          status?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dead_letter_queue_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_tags: {
        Row: {
          entity_id: string
          entity_type: string
          id: string
          tag_id: string | null
          tagged_at: string | null
          tagged_by: string | null
        }
        Insert: {
          entity_id: string
          entity_type: string
          id?: string
          tag_id?: string | null
          tagged_at?: string | null
          tagged_by?: string | null
        }
        Update: {
          entity_id?: string
          entity_type?: string
          id?: string
          tag_id?: string | null
          tagged_at?: string | null
          tagged_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      import_account_mapping: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          import_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: string
          import_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          import_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_account_mapping_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      job_logs: {
        Row: {
          created_at: string | null
          id: string
          job_id: string | null
          log_level: string
          message: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          log_level: string
          message: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string | null
          log_level?: string
          message?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "job_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          error_stack: string | null
          failed_at: string | null
          id: string
          job_queue: string | null
          job_type: string
          max_attempts: number | null
          next_retry_at: string | null
          payload: Json
          priority: number | null
          progress: Json | null
          result: Json | null
          retry_delay_seconds: number | null
          scheduled_for: string | null
          started_at: string | null
          status: string | null
          worker_heartbeat_at: string | null
          worker_id: string | null
          workspace_id: string | null
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          error_stack?: string | null
          failed_at?: string | null
          id?: string
          job_queue?: string | null
          job_type: string
          max_attempts?: number | null
          next_retry_at?: string | null
          payload: Json
          priority?: number | null
          progress?: Json | null
          result?: Json | null
          retry_delay_seconds?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string | null
          worker_heartbeat_at?: string | null
          worker_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          error_stack?: string | null
          failed_at?: string | null
          id?: string
          job_queue?: string | null
          job_type?: string
          max_attempts?: number | null
          next_retry_at?: string | null
          payload?: Json
          priority?: number | null
          progress?: Json | null
          result?: Json | null
          retry_delay_seconds?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string | null
          worker_heartbeat_at?: string | null
          worker_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_login_at: string | null
          last_name: string | null
          status: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_login_at?: string | null
          last_name?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_login_at?: string | null
          last_name?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_controls: {
        Row: {
          description: string | null
          enabled: boolean | null
          feature: string
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean | null
          feature: string
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean | null
          feature?: string
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          entity_type: string | null
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_type?: string | null
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_type?: string | null
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          account_id: string | null
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          completion_notes: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          reminder_at: string | null
          status: string | null
          task_type: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          account_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          reminder_at?: string | null
          status?: string | null
          task_type: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          account_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          reminder_at?: string | null
          status?: string | null
          task_type?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          team_lead_id: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          team_lead_id?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          team_lead_id?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_name: string | null
          id: string
          ip_address: unknown | null
          last_used_at: string | null
          refresh_token_id: string | null
          user_agent: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          ip_address?: unknown | null
          last_used_at?: string | null
          refresh_token_id?: string | null
          user_agent?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          ip_address?: unknown | null
          last_used_at?: string | null
          refresh_token_id?: string | null
          user_agent?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          role: string
          status: string | null
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          role: string
          status?: string | null
          token: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          role?: string
          status?: string | null
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          role: string
          status: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_workspace_members_profile"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          apollo_api_key_encrypted: string | null
          apollo_auto_enrich: boolean | null
          created_at: string | null
          enrichment_credits_used: number | null
          id: string
          last_enrichment_at: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          apollo_api_key_encrypted?: string | null
          apollo_auto_enrich?: boolean | null
          created_at?: string | null
          enrichment_credits_used?: number | null
          id?: string
          last_enrichment_at?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          apollo_api_key_encrypted?: string | null
          apollo_auto_enrich?: boolean | null
          created_at?: string | null
          enrichment_credits_used?: number | null
          id?: string
          last_enrichment_at?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string | null
          plan: string | null
          seats_limit: number | null
          settings: Json | null
          slug: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id?: string | null
          plan?: string | null
          seats_limit?: number | null
          settings?: Json | null
          slug: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          plan?: string | null
          seats_limit?: number | null
          settings?: Json | null
          slug?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _ltree_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      _ltree_gist_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      create_workspace_with_owner: {
        Args: {
          owner_user_id: string
          workspace_name: string
          workspace_slug: string
        }
        Returns: string
      }
      get_user_workspace_memberships: {
        Args: { p_user_id: string }
        Returns: {
          workspace_id: string
          role: string
          workspace_name: string
          workspace_slug: string
          workspace_seats_limit: number
          workspace_plan: string
        }[]
      }
      get_user_workspace_role: {
        Args: { p_user_id: string; p_workspace_id: string }
        Returns: string
      }
      hash_ltree: {
        Args: { "": unknown }
        Returns: number
      }
      lca: {
        Args: { "": unknown[] }
        Returns: unknown
      }
      lquery_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      lquery_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      lquery_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      lquery_send: {
        Args: { "": unknown }
        Returns: string
      }
      ltree_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltree_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltree_gist_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltree_gist_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      ltree_gist_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltree_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltree_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltree_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltree_send: {
        Args: { "": unknown }
        Returns: string
      }
      ltree2text: {
        Args: { "": unknown }
        Returns: string
      }
      ltxtq_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltxtq_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltxtq_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      ltxtq_send: {
        Args: { "": unknown }
        Returns: string
      }
      nlevel: {
        Args: { "": unknown }
        Returns: number
      }
      text2ltree: {
        Args: { "": string }
        Returns: unknown
      }
      user_has_permission: {
        Args: {
          p_required_role: string
          p_user_id: string
          p_workspace_id: string
        }
        Returns: boolean
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

