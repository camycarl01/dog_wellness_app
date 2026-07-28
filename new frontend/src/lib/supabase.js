import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

const missingConfigMessage =
  'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env to use authentication and storage.'

function createUnavailableClient() {
  const fail = () => {
    throw new Error(missingConfigMessage)
  }

  return {
    auth: {
      getSession: fail,
      getUser: fail,
      signInWithPassword: fail,
      signUp: fail,
      signOut: fail,
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe() {},
          },
        },
      }),
    },
    storage: {
      from() {
        return {
          upload: fail,
          getPublicUrl: fail,
        }
      },
    },
  }
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createUnavailableClient()

// ---------------------------------------------------------------------------
// TEMPORARY admin login — remove before production.
// Credentials: admin@pawcare.app / admin123
// ---------------------------------------------------------------------------
const TEMP_ADMIN = { email: 'admin@pawcare.app', password: 'admin123' }
const DEMO_SESSION_KEY = 'pawcare_demo_admin'
export const DEMO_AUTH_EVENT = 'pawcare:demo-auth'

export const demoAdminUser = {
  id: 'demo-admin',
  email: TEMP_ADMIN.email,
  user_metadata: { name: 'Admin (Temp)', is_breeder: true },
}

export const getDemoUser = () => {
  try {
    return sessionStorage.getItem(DEMO_SESSION_KEY) ? demoAdminUser : null
  } catch {
    return null
  }
}

const startDemoSession = () => {
  sessionStorage.setItem(DEMO_SESSION_KEY, '1')
  window.dispatchEvent(new Event(DEMO_AUTH_EVENT))
}

const endDemoSession = () => {
  sessionStorage.removeItem(DEMO_SESSION_KEY)
  window.dispatchEvent(new Event(DEMO_AUTH_EVENT))
}

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

export const signIn = async (email, password) => {
  // TEMPORARY: allow the demo admin to log in without Supabase.
  if (email.trim().toLowerCase() === TEMP_ADMIN.email && password === TEMP_ADMIN.password) {
    startDemoSession()
    return { user: demoAdminUser, session: { user: demoAdminUser } }
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export const signUp = async (email, password, name, isBreeder = false) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, is_breeder: isBreeder }
    }
  })
  if (error) throw error

  // Supabase can return a user object without identities when the email is
  // already registered. Treat that as a duplicate account instead of a fresh signup.
  if (data?.user?.identities?.length === 0) {
    const duplicateError = new Error('An account with this email already exists. Please sign in instead.')
    duplicateError.code = 'user_already_exists'
    throw duplicateError
  }

  return data
}

export const getAuthErrorMessage = (error, fallback = 'Something went wrong. Try again.') => {
  const rawMessage = error?.message ?? ''
  const message = rawMessage.toLowerCase()

  if (
    message.includes('email rate limit exceeded') ||
    message.includes('too many requests') ||
    message.includes('rate limit') ||
    error?.status === 429
  ) {
    return 'Too many signup emails were requested. Please wait a few minutes before trying again.'
  }

  if (
    message.includes('email not confirmed') ||
    message.includes('user not confirmed') ||
    message.includes('signup not confirmed')
  ) {
    return 'Please check your email and confirm your account before signing in.'
  }

  return rawMessage || fallback
}

export const signOut = async () => {
  // TEMPORARY: end the demo admin session locally.
  if (getDemoUser()) {
    endDemoSession()
    return
  }
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
