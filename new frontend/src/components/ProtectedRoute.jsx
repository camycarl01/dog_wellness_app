import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getDemoUser } from '../lib/supabase'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  // TEMPORARY: treat an active demo admin session as authenticated,
  // avoiding a redirect race right after demo sign-in.
  const demoUser = getDemoUser()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user && !demoUser) {
    return <Navigate to="/login" replace />
  }

  return children
}
