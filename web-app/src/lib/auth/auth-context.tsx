'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientRaw } from '@/lib/supabase/client-raw'
import { User } from '@supabase/supabase-js'
import { Profile, Workspace, UserRole } from '@/types/auth'

type AuthContextType = {
  user: User | null
  profile: Profile | null
  workspace: Workspace | null
  role: UserRole | null
  loading: boolean
  signOut: () => Promise<void>
  switchWorkspace: (workspaceId: string) => Promise<void>
  refreshWorkspace: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClientRaw()

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    return data
  }

  const fetchWorkspaceAndRole = async (userId: string, workspaceId?: string) => {
    // Use RPC function to bypass RLS circular dependency
    const { data: memberships, error } = await supabase
      .rpc('get_user_workspace_memberships', { p_user_id: userId } as any) as any

    if (error) {
      console.error('Error fetching memberships:', error)
      return { workspace: null, role: null }
    }

    if (!memberships || memberships.length === 0) {
      return { workspace: null, role: null }
    }

    let selectedMembership = memberships[0]

    // If workspace ID provided, try to find it
    if (workspaceId) {
      const found = memberships.find((m) => m.workspace_id === workspaceId)
      if (found) {
        selectedMembership = found
      }
    } else {
      // Try to get from localStorage
      const savedWorkspaceId =
        typeof window !== 'undefined'
          ? localStorage.getItem('currentWorkspaceId')
          : null

      if (savedWorkspaceId) {
        const found = memberships.find((m) => m.workspace_id === savedWorkspaceId)
        if (found) {
          selectedMembership = found
        }
      }
    }

    // Save current workspace to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentWorkspaceId', selectedMembership.workspace_id)
    }

    // Build workspace object from RPC result
    const workspaceData: Workspace = {
      id: selectedMembership.workspace_id,
      name: selectedMembership.workspace_name,
      slug: selectedMembership.workspace_slug,
      plan: selectedMembership.workspace_plan,
      seats_limit: selectedMembership.workspace_seats_limit,
    }

    return {
      workspace: workspaceData,
      role: selectedMembership.role as UserRole,
    }
  }

  const loadUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)

        // Fetch profile
        const profileData = await fetchProfile(user.id)
        setProfile(profileData)

        // Fetch workspace and role
        const { workspace: workspaceData, role: roleData } =
          await fetchWorkspaceAndRole(user.id)
        setWorkspace(workspaceData)
        setRole(roleData)
      } else {
        setUser(null)
        setProfile(null)
        setWorkspace(null)
        setRole(null)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUserData()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserData()
      } else {
        setUser(null)
        setProfile(null)
        setWorkspace(null)
        setRole(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentWorkspaceId')
    }
    setUser(null)
    setProfile(null)
    setWorkspace(null)
    setRole(null)
  }

  const switchWorkspace = async (workspaceId: string) => {
    if (!user) return

    const { workspace: workspaceData, role: roleData } =
      await fetchWorkspaceAndRole(user.id, workspaceId)

    setWorkspace(workspaceData)
    setRole(roleData)
  }

  const refreshWorkspace = async () => {
    if (!user || !workspace) return

    const { workspace: workspaceData, role: roleData } =
      await fetchWorkspaceAndRole(user.id, workspace.id)

    setWorkspace(workspaceData)
    setRole(roleData)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        workspace,
        role,
        loading,
        signOut,
        switchWorkspace,
        refreshWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
