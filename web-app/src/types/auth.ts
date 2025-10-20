import { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row']
export type WorkspaceInvitation = Database['public']['Tables']['workspace_invitations']['Row']

export type UserRole = 'admin' | 'sales_manager' | 'sdr' | 'ae'

export type WorkspaceWithRole = Workspace & {
  role: UserRole
}

export type MemberWithProfile = WorkspaceMember & {
  profile: Profile | null
}
