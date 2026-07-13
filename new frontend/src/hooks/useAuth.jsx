import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getDemoUser, DEMO_AUTH_EVENT } from '../lib/supabase'

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

    // Listen for auth state changes
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

  const value = {
    user,
    session,
    loading,
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
