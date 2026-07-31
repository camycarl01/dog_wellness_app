import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Loader2, PawPrint, Search, ImageOff } from 'lucide-react'
import api from '../lib/api'

const BREED_IMAGE_CACHE = new Map()
let breedListPromise = null
let breedListCache = null

function titleCase(value) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function formatBreedLabel(path) {
  const parts = path.split('/')
  if (parts.length === 1) return titleCase(parts[0])
  return `${titleCase(parts[1])} ${titleCase(parts[0])}`
}

async function fetchBreedList() {
  if (breedListCache) return breedListCache
  if (!breedListPromise) {
    breedListPromise = api.get('/api/breeds')
      .then(({ data }) => {
        const breeds = data?.breeds || []
        breeds.sort((a, b) => a.label.localeCompare(b.label))
        breedListCache = breeds
        return breeds
      })
      .catch((error) => {
        const message = error?.response?.data?.detail || 'Could not load breeds'
        throw new Error(message)
      })
      .finally(() => {
        breedListPromise = null
      })
  }
  return breedListPromise
}

async function fetchBreedImage(path) {
  if (BREED_IMAGE_CACHE.has(path)) {
    return BREED_IMAGE_CACHE.get(path)
  }

  try {
    const { data } = await api.get(`/api/breeds/image/${path}`)
    const imageUrl = data?.image_url || ''
    BREED_IMAGE_CACHE.set(path, imageUrl)
    return imageUrl
  } catch {
    BREED_IMAGE_CACHE.set(path, '')
    return ''
  }
}

function BreedThumb({ breed }) {
  const [src, setSrc] = useState(BREED_IMAGE_CACHE.get(breed.path) || '')
  const thumbRef = useRef(null)
  const hasTriggered = useRef(false)

  useEffect(() => {
    let active = true
    const node = thumbRef.current
    if (src || hasTriggered.current || !node) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting || hasTriggered.current) return
        hasTriggered.current = true
        fetchBreedImage(breed.path).then((imageUrl) => {
          if (active) setSrc(imageUrl)
        })
        observer.disconnect()
      },
      { rootMargin: '120px' }
    )

    observer.observe(node)

    return () => {
      active = false
      observer.disconnect()
    }
  }, [breed.path, src])

  if (src) {
    return <img src={src} alt={breed.label} className="size-full object-cover" loading="lazy" />
  }

  return (
    <div ref={thumbRef} className="flex size-full items-center justify-center bg-secondary text-muted-foreground">
      <PawPrint size={14} />
    </div>
  )
}

export default function BreedSelect({
  value,
  onChange,
  label = 'Breed',
  placeholder = 'Search or choose a breed',
  error,
  helperText = 'Choose from the public breed catalog.',
  disabled = false,
  className = '',
}) {
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const searchRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [breeds, setBreeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [menuStyle, setMenuStyle] = useState(null)

  const updateMenuStyle = () => {
    const root = rootRef.current
    if (!root) return

    const rect = root.getBoundingClientRect()
    const viewportPadding = 12
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding
    const spaceAbove = rect.top - viewportPadding
    const maxWidth = Math.max(240, Math.min(rect.width, window.innerWidth - viewportPadding * 2))
    const width = Math.max(rect.width, 240)

    if (spaceBelow >= 220 || spaceBelow >= spaceAbove) {
      setMenuStyle({
        position: 'fixed',
        left: Math.max(viewportPadding, rect.left),
        top: Math.min(window.innerHeight - viewportPadding, rect.bottom + 8),
        width: Math.min(width, maxWidth),
        maxHeight: Math.max(180, spaceBelow),
      })
      return
    }

    setMenuStyle({
      position: 'fixed',
      left: Math.max(viewportPadding, rect.left),
      bottom: Math.max(viewportPadding, window.innerHeight - rect.top + 8),
      width: Math.min(width, maxWidth),
      maxHeight: Math.max(180, spaceAbove),
    })
  }

  useEffect(() => {
    let active = true
    fetchBreedList()
      .then((items) => {
        if (!active) return
        setBreeds(items)
      })
      .catch((err) => {
        if (active) setLoadError(err.message || 'Could not load breeds')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    const onLayoutChange = () => updateMenuStyle()

    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', onLayoutChange)
    window.addEventListener('scroll', onLayoutChange, true)
    updateMenuStyle()
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', onLayoutChange)
      window.removeEventListener('scroll', onLayoutChange, true)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    if (open) updateMenuStyle()
  }, [open, breeds.length, query])

  const selectedBreed = useMemo(() => breeds.find((breed) => breed.label === value) || null, [breeds, value])
  const filteredBreeds = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return breeds.slice(0, 200)
    return breeds.filter((breed) => breed.label.toLowerCase().includes(search)).slice(0, 200)
  }, [breeds, query])

  const selectedLabel = selectedBreed?.label || value || ''

  return (
    <div ref={rootRef} className={`relative z-50 ${className}`}>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => !disabled && setOpen((current) => !current)}
        disabled={disabled}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-input bg-card px-3.5 text-left text-sm text-foreground transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selectedLabel ? 'truncate' : 'text-muted-foreground'}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
      </button>

      {error ? <p className="mt-1.5 text-sm text-destructive">{error}</p> : <p className="mt-1.5 text-xs text-muted-foreground">{helperText}</p>}

      {open && !disabled && menuStyle && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="z-[9999] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10"
        >
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search breeds"
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/25"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" /> Loading breeds...
              </div>
            ) : loadError ? (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-3 text-sm text-destructive">
                <ImageOff size={16} /> {loadError}
              </div>
            ) : filteredBreeds.length === 0 ? (
              <div className="px-3 py-6 text-sm text-muted-foreground">No breeds match your search.</div>
            ) : (
              filteredBreeds.map((breed) => {
                const active = breed.label === value
                return (
                  <button
                    key={breed.path}
                    type="button"
                    onClick={() => {
                      onChange(breed.label)
                      setOpen(false)
                      setQuery('')
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-secondary ${active ? 'bg-primary/10' : ''}`}
                  >
                    <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
                      <BreedThumb breed={breed} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{breed.label}</p>
                      <p className="truncate text-xs text-muted-foreground">Known breed from Dog CEO</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export { formatBreedLabel }
