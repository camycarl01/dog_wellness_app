import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { isSupabaseConfigured, signIn } from '../lib/supabase'
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import Magnetic from '../components/motion/Magnetic'
import { Reveal } from '../components/motion/Reveal'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values) => {
    setAuthError('')
    setLoading(true)
    try {
      await signIn(values.email, values.password)
      navigate('/dashboard')
    } catch (err) {
      setAuthError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell tagline="Every wag, every walk, every checkup — beautifully tracked.">
      <Reveal stagger={0.09}>
        <div data-reveal className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance">Welcome back</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sign in to check on your dog&apos;s wellness.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div data-reveal className="mb-5 flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3.5 py-3 text-sm text-amber-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>
              Supabase credentials are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env, then reload to enable sign in.
            </span>
          </div>
        )}

        {/* TEMPORARY admin access — remove before production */}
        <div data-reveal className="mb-5 rounded-lg border border-accent/25 bg-accent/10 px-3.5 py-3 text-sm">
          <p className="font-medium text-foreground">Temporary admin access</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            admin@pawcare.app&ensp;/&ensp;admin123
          </p>
        </div>

        {authError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive" role="alert">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <div data-reveal>
            <label htmlFor="email" className="field-label">Email</label>
            <input
              {...register('email')}
              id="email"
              type="email"
              placeholder="you@example.com"
              className="field"
              autoComplete="email"
            />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>

          <div data-reveal>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="field-label mb-0">Password</label>
              <Link to="/forgot-password" className="text-xs font-medium text-accent transition-colors hover:text-accent/80">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="field pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>

          <div data-reveal className="mt-1">
            <Magnetic strength={0.25} className="block w-full">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary group w-full"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </>
                )}
              </button>
            </Magnetic>
          </div>
        </form>

        <p data-reveal className="mt-7 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-accent transition-colors hover:text-accent/80">
            Create one free
          </Link>
        </p>
      </Reveal>
    </AuthShell>
  )
}
