export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          timezone: string
          status: 'active' | 'suspended' | 'deleted'
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          timezone?: string
          status?: 'active' | 'suspended' | 'deleted'
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          timezone?: string
          status?: 'active' | 'suspended' | 'deleted'
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string | null
          settings: Json
          plan: 'free' | 'pro' | 'enterprise'
          seats_limit: number
          status: 'active' | 'suspended' | 'deleted'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id?: string | null
          settings?: Json
          plan?: 'free' | 'pro' | 'enterprise'
          seats_limit?: number
          status?: 'active' | 'suspended' | 'deleted'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string | null
          settings?: Json
          plan?: 'free' | 'pro' | 'enterprise'
          seats_limit?: number
          status?: 'active' | 'suspended' | 'deleted'
          created_at?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: 'admin' | 'sales_manager' | 'sdr' | 'ae'
          status: 'invited' | 'active' | 'suspended'
          invited_by: string | null
          invited_at: string | null
          joined_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role: 'admin' | 'sales_manager' | 'sdr' | 'ae'
          status?: 'invited' | 'active' | 'suspended'
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: 'admin' | 'sales_manager' | 'sdr' | 'ae'
          status?: 'invited' | 'active' | 'suspended'
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workspace_invitations: {
        Row: {
          id: string
          workspace_id: string
          email: string
          role: 'admin' | 'sales_manager' | 'sdr' | 'ae'
          token: string
          status: 'pending' | 'accepted' | 'expired' | 'revoked'
          invited_by: string
          accepted_by: string | null
          created_at: string
          expires_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          email: string
          role: 'admin' | 'sales_manager' | 'sdr' | 'ae'
          token: string
          status?: 'pending' | 'accepted' | 'expired' | 'revoked'
          invited_by: string
          accepted_by?: string | null
          created_at?: string
          expires_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          email?: string
          role?: 'admin' | 'sales_manager' | 'sdr' | 'ae'
          token?: string
          status?: 'pending' | 'accepted' | 'expired' | 'revoked'
          invited_by?: string
          accepted_by?: string | null
          created_at?: string
          expires_at?: string
          accepted_at?: string | null
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          device_name: string | null
          ip_address: string | null
          user_agent: string | null
          refresh_token_id: string | null
          last_used_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id?: string | null
          device_name?: string | null
          ip_address?: string | null
          user_agent?: string | null
          refresh_token_id?: string | null
          last_used_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          device_name?: string | null
          ip_address?: string | null
          user_agent?: string | null
          refresh_token_id?: string | null
          last_used_at?: string
          created_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          name: string
          key_prefix: string
          key_hash: string
          scopes: string[]
          status: 'active' | 'revoked'
          last_used_at: string | null
          expires_at: string | null
          created_at: string
          revoked_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          name: string
          key_prefix: string
          key_hash: string
          scopes?: string[]
          status?: 'active' | 'revoked'
          last_used_at?: string | null
          expires_at?: string | null
          created_at?: string
          revoked_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          name?: string
          key_prefix?: string
          key_hash?: string
          scopes?: string[]
          status?: 'active' | 'revoked'
          last_used_at?: string | null
          expires_at?: string | null
          created_at?: string
          revoked_at?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          workspace_id: string | null
          user_id: string | null
          event_type: string
          event_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id?: string | null
          user_id?: string | null
          event_type: string
          event_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string | null
          user_id?: string | null
          event_type?: string
          event_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      system_controls: {
        Row: {
          id: string
          feature: string
          enabled: boolean
          description: string | null
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          feature: string
          enabled?: boolean
          description?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          feature?: string
          enabled?: boolean
          description?: string | null
          updated_by?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_workspace_with_owner: {
        Args: {
          workspace_name: string
          workspace_slug: string
          owner_user_id: string
        }
        Returns: string
      }
      get_user_workspace_role: {
        Args: {
          p_user_id: string
          p_workspace_id: string
        }
        Returns: string
      }
      user_has_permission: {
        Args: {
          p_user_id: string
          p_workspace_id: string
          p_required_role: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
