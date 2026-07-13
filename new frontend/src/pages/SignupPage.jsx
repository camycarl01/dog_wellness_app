import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getAuthErrorMessage, isSupabaseConfigured, signUp } from '../lib/supabase'
import { Eye, EyeOff, AlertCircle, Check, ArrowRight } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import Magnetic from '../components/motion/Magnetic'
import { Reveal } from '../components/motion/Reveal'

const schema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  isBreeder: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export default function SignupPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { isBreeder: false },
  })

  const password = watch('password', '')
  const isBreeder = watch('isBreeder', false)

  const passwordStrength = (pw) => {
    if (!pw) return 0
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return score
  }

  const strength = passwordStrength(password)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-destructive', 'bg-amber-400', 'bg-accent/70', 'bg-accent'][strength]

  const onSubmit = async (values) => {
    setAuthError('')
    if (!isSupabaseConfigured) {
      return
    }
    setLoading(true)
    try {
      await signUp(values.email, values.password, values.name, values.isBreeder)
      setSuccess(true)
    } catch (err) {
      setAuthError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthShell tagline="Welcome to the pack. Your journey starts now.">
        <Reveal stagger={0.1} className="text-center">
          <div data-reveal className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
            <Check size={28} className="text-accent" />
          </div>
          <h2 data-reveal className="mb-2 text-2xl font-semibold tracking-tight text-foreground">Check your email</h2>
          <p data-reveal className="mb-7 text-sm leading-relaxed text-muted-foreground">
            We sent a confirmation link to your inbox. Click it to activate your account, then sign in.
          </p>
          <div data-reveal>
            <Magnetic strength={0.25}>
              <Link to="/login" className="btn-primary">
                Go to sign in
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </Magnetic>
          </div>
        </Reveal>
      </AuthShell>
    )
  }

  return (
    <AuthShell tagline="One home for your dog's health, meals, and milestones.">
      <Reveal stagger={0.07}>
        <div data-reveal className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance">Create your account</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Free forever. No credit card needed.</p>
        </div>

        {!isSupabaseConfigured && (
          <div data-reveal className="mb-5 flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3.5 py-3 text-sm text-amber-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>
              Supabase credentials are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env, then reload to enable account creation.
            </span>
          </div>
        )}

        {authError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive" role="alert">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div data-reveal>
            <label htmlFor="name" className="field-label">Full name</label>
            <input
              {...register('name')}
              id="name"
              type="text"
              placeholder="Your name"
              className="field"
              autoComplete="name"
            />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

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
            <label htmlFor="password" className="field-label">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                className="field pr-10"
                autoComplete="new-password"
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
            {password && (
              <div className="mt-2">
                <div className="mb-1 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= strength ? strengthColor : 'bg-secondary'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{strengthLabel}</p>
              </div>
            )}
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>

          <div data-reveal>
            <label htmlFor="confirmPassword" className="field-label">Confirm password</label>
            <input
              {...register('confirmPassword')}
              id="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              className="field"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}
          </div>

          {/* Breeder toggle */}
          <label
            data-reveal
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors duration-200 ${
              isBreeder ? 'border-accent/50 bg-accent/10' : 'border-border hover:border-muted-foreground/40'
            }`}
          >
            <input {...register('isBreeder')} type="checkbox" className="mt-0.5 accent-[hsl(172,66%,50%)]" />
            <span>
              <span className="block text-sm font-medium text-foreground">I&apos;m a breeder</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                Unlocks litter management, puppy profiles, and health certificate exports
              </span>
            </span>
          </label>

          <div data-reveal className="mt-1">
            <Magnetic strength={0.25} className="block w-full">
              <button
                type="submit"
                disabled={loading || !isSupabaseConfigured}
                className="btn-primary group w-full"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" aria-hidden="true" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </>
                )}
              </button>
            </Magnetic>
          </div>
        </form>

        <p data-reveal className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent transition-colors hover:text-accent/80">
            Sign in
          </Link>
        </p>
      </Reveal>
    </AuthShell>
  )
}
