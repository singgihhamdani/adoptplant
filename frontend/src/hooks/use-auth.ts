'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { UserRole, UserProfile } from '@/lib/supabase/types'

export function useAuth() {
  const router = useRouter()
  const supabase = createClient()
  const { user, isLoading, setUser, setLoading, logout } = useAuthStore()

  useEffect(() => {
    async function loadUser() {
      setLoading(true)
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        // Fetch public.users profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        const typedProfile = profile as unknown as UserProfile | null

        if (typedProfile) {
          setUser({
            id: typedProfile.id,
            email: typedProfile.email,
            name: typedProfile.name,
            role: typedProfile.role as UserRole,
            avatar_url: typedProfile.avatar_url,
          })
        } else {
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            role: 'VIEWER',
          })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    loadUser()

    // Listen to Supabase Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        const typedProfile = profile as unknown as UserProfile | null

        if (typedProfile) {
          setUser({
            id: typedProfile.id,
            email: typedProfile.email,
            name: typedProfile.name,
            role: typedProfile.role as UserRole,
            avatar_url: typedProfile.avatar_url,
          })
        }
      } else {
        logout()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading, logout, supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    logout()
    router.push('/login')
  }

  const resetPasswordForEmail = async (email: string, redirectTo?: string) => {
    const defaultRedirect =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=/reset-password`
        : undefined
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || defaultRedirect,
    })
    if (error) throw error
    return data
  }

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
    return data
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    resetPasswordForEmail,
    updatePassword,
  }
}
