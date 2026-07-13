import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getAuthErrorMessage, isSupabaseConfigured, signUp } from '../lib/supabase'
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react'

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
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-teal-300', 'bg-teal-500'][strength]

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
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 border border-teal-200 rounded-full mb-5">
            <Check size={28} className="text-teal-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-6">
            We sent a confirmation link to your inbox. Click it to activate your account, then sign in.
          </p>
          <Link to="/login" className="btn-primary inline-block">
            Go to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl">🐾</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">PawCare</h1>
          <p className="text-sm text-gray-500 mt-1">Your dog's wellness companion</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Create your account</h2>
          <p className="text-sm text-gray-500 mb-6">Free forever. No credit card needed.</p>

          {!isSupabaseConfigured && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 text-amber-800 rounded-lg px-3.5 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>
                Supabase credentials are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env, then reload to enable account creation.
              </span>
            </div>
          )}

          {authError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 rounded-lg px-3.5 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                {...register('name')}
                type="text"
                placeholder="Your name"
                className="input-field"
                autoComplete="name"
              />
              {errors.name && <p className="text-xs text-red-600 mt-1.5">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="input-field"
                autoComplete="email"
              />
              {errors.email && <p className="text-xs text-red-600 mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  className="input-field pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">{strengthLabel}</p>
                </div>
              )}
              {errors.password && <p className="text-xs text-red-600 mt-1.5">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="Repeat your password"
                className="input-field"
                autoComplete="new-password"
              />
              {errors.confirmPassword && <p className="text-xs text-red-600 mt-1.5">{errors.confirmPassword.message}</p>}
            </div>

            {/* Breeder toggle */}
            <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${isBreeder ? 'border-teal-300 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input {...register('isBreeder')} type="checkbox" className="mt-0.5 accent-teal-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">I'm a breeder</p>
                <p className="text-xs text-gray-500 mt-0.5">Unlocks litter management, puppy profiles, and health certificate exports</p>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </>
              ) : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-600 hover:text-teal-800 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
