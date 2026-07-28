import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  User, Lock, Palette, ShieldCheck,
  Check, Loader2, Eye, EyeOff, Sun, Moon,
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'
import { Reveal, StaggerReveal } from '../components/motion/Reveal'
import PageTransition from '../components/motion/PageTransition'

const inputClass =
  'w-full h-11 rounded-lg border border-input bg-card px-3.5 text-sm text-foreground ' +
  'transition-colors placeholder:text-muted-foreground ' +
  'focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/25'
const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon size={16} className="text-primary" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      data-cursor="hover"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function SuccessBanner({ message }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-500">
      <Check size={15} className="shrink-0" />
      {message}
    </div>
  )
}

function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Profile section — update display name
// ---------------------------------------------------------------------------
function ProfileSection({ displayName }) {
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({
    defaultValues: { name: displayName },
  })

  async function onSave({ name }) {
    setSuccess(''); setError('')
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured — profile updates are unavailable in demo mode.')
      return
    }
    try {
      const { error: sbError } = await supabase.auth.updateUser({ data: { name } })
      if (sbError) throw sbError
      setSuccess('Display name updated.')
    } catch (err) {
      setError(err.message || 'Could not update profile.')
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <SectionHeader icon={User} title="Profile" description="Update the name shown across your account." />
      <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-4">
        <div>
          <label htmlFor="settings-name" className={labelClass}>Display name</label>
          <input
            id="settings-name"
            className={inputClass}
            placeholder="Your name"
            {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })}
          />
          {errors.name && <p className="mt-1.5 text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <SuccessBanner message={success} />
        <ErrorBanner message={error} />
        <button type="submit" disabled={isSubmitting} className="btn-primary" data-cursor="hover">
          {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> Save name</>}
        </button>
      </form>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Password section — change password
// ---------------------------------------------------------------------------
function PasswordSection() {
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const { register, handleSubmit, watch, reset, formState: { isSubmitting, errors } } = useForm()
  const newPassword = watch('newPassword', '')

  async function onSave({ newPassword }) {
    setSuccess(''); setError('')
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured — password changes are unavailable in demo mode.')
      return
    }
    try {
      const { error: sbError } = await supabase.auth.updateUser({ password: newPassword })
      if (sbError) throw sbError
      setSuccess('Password updated successfully.')
      reset()
    } catch (err) {
      setError(err.message || 'Could not update password.')
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <SectionHeader icon={Lock} title="Password" description="Choose a strong password you don't use elsewhere." />
      <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-4">
        <div>
          <label htmlFor="settings-new-pw" className={labelClass}>New password</label>
          <div className="relative">
            <input
              id="settings-new-pw"
              type={showNew ? 'text' : 'password'}
              className={inputClass + ' pr-11'}
              placeholder="At least 8 characters"
              {...register('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Must be at least 8 characters' },
              })}
            />
            <button
              type="button"
              onClick={() => setShowNew((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showNew ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.newPassword && <p className="mt-1.5 text-sm text-destructive">{errors.newPassword.message}</p>}
        </div>

        <div>
          <label htmlFor="settings-confirm-pw" className={labelClass}>Confirm new password</label>
          <div className="relative">
            <input
              id="settings-confirm-pw"
              type={showCurrent ? 'text' : 'password'}
              className={inputClass + ' pr-11'}
              placeholder="Repeat your new password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => val === newPassword || 'Passwords do not match',
              })}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1.5 text-sm text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <SuccessBanner message={success} />
        <ErrorBanner message={error} />

        <button type="submit" disabled={isSubmitting} className="btn-primary" data-cursor="hover">
          {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Updating...</> : <><Lock size={15} /> Update password</>}
        </button>
      </form>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Account type section — breeder toggle
// ---------------------------------------------------------------------------
function AccountTypeSection({ isBreeder: initialIsBreeder }) {
  const [isBreeder, setIsBreeder] = useState(initialIsBreeder)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleToggle(val) {
    setIsBreeder(val)
    setSuccess(''); setError('')
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured — account type changes are unavailable in demo mode.')
      return
    }
    setSaving(true)
    try {
      const { error: sbError } = await supabase.auth.updateUser({ data: { is_breeder: val } })
      if (sbError) throw sbError
      setSuccess(val ? 'Breeder features enabled.' : 'Breeder features disabled.')
    } catch (err) {
      setIsBreeder(!val) // revert
      setError(err.message || 'Could not update account type.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <SectionHeader
        icon={ShieldCheck}
        title="Account type"
        description="Breeder accounts unlock litter and puppy management features."
      />
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-foreground">Breeder account</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Enables the Litter management section in the sidebar.</p>
          </div>
          <div className="flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
            <Toggle checked={isBreeder} onChange={handleToggle} label="Breeder account" />
          </div>
        </div>
        <SuccessBanner message={success} />
        <ErrorBanner message={error} />
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Appearance section — theme toggle
// ---------------------------------------------------------------------------
function AppearanceSection() {
  const { theme, toggleTheme } = useTheme()

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <SectionHeader icon={Palette} title="Appearance" description="Choose how PawCare looks to you." />
      <div className="flex items-center gap-3">
        <button
          onClick={() => theme === 'dark' && toggleTheme()}
          data-cursor="hover"
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-medium transition-colors ${
            theme === 'light'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-foreground'
          }`}
        >
          <Sun size={16} />
          Light
        </button>
        <button
          onClick={() => theme === 'light' && toggleTheme()}
          data-cursor="hover"
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-medium transition-colors ${
            theme === 'dark'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-foreground'
          }`}
        >
          <Moon size={16} />
          Dark
        </button>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------
export default function SettingsPage() {
  const { displayName, isBreeder } = useAuth()

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
            Settings
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Manage your profile, security, and preferences.
          </p>
        </Reveal>

        <StaggerReveal className="mt-8 flex flex-col gap-4">
          <ProfileSection displayName={displayName} />
          <PasswordSection />
          <AccountTypeSection isBreeder={isBreeder} />
          <AppearanceSection />
        </StaggerReveal>
      </div>
    </PageTransition>
  )
}
