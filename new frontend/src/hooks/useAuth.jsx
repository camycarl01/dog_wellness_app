import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getDemoUser, DEMO_AUTH_EVENT, updateDemoUserMetadata } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TEMPORARY: check for a demo admin session first.
    const demoUser = getDemoUser()
    if (demoUser) {
      setUser(demoUser)
      setSession({ user: demoUser })
      setLoading(false)
    } else {
      // Get initial session (guarded: throws synchronously when Supabase is unconfigured)
      try {
        supabase.auth
          .getSession()
          .then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
          })
          .catch(() => {})
          .finally(() => setLoading(false))
      } catch {
        setLoading(false)
      }
    }

    // TEMPORARY: react to demo admin sign in / sign out.
    const onDemoAuth = () => {
      const demo = getDemoUser()
      setUser(demo)
      setSession(demo ? { user: demo } : null)
    }
    window.addEventListener(DEMO_AUTH_EVENT, onDemoAuth)

    // Listen for auth state changes (real Supabase users)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (getDemoUser()) return
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => {
      window.removeEventListener(DEMO_AUTH_EVENT, onDemoAuth)
      subscription.unsubscribe()
    }
  }, [])

  /**
   * Call this after a successful supabase.auth.updateUser() so that the UI
   * immediately reflects the new name / metadata without waiting for the next
   * onAuthStateChange event (which is delayed or skipped for demo sessions).
   */
  async function refreshUser(updatedMetadata) {
    const demoUser = getDemoUser()
    if (demoUser) {
      // For the demo session, merge the new metadata into the in-memory object
      // AND persist it to sessionStorage so it survives a refresh.
      const merged = updateDemoUserMetadata(updatedMetadata)
      setUser({ ...merged })
      setSession({ user: { ...merged } })
      return
    }
    // For real Supabase sessions, re-fetch the latest user object
    try {
      const { data: { user: fresh } } = await supabase.auth.getUser()
      if (fresh) {
        setUser(fresh)
        setSession((prev) => prev ? { ...prev, user: fresh } : prev)
      }
    } catch { /* silent — stale state is acceptable here */ }
  }

  const value = {
    user,
    session,
    loading,
    refreshUser,
    isBreeder: user?.user_metadata?.is_breeder ?? false,
    displayName: user?.user_metadata?.name ?? user?.email ?? '',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
