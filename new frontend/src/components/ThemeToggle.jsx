import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import Magnetic from './motion/Magnetic'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <Magnetic strength={0.25}>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        data-cursor="hover"
        className={`relative flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors duration-200 hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
      >
        <Sun className="size-4 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
      </button>
    </Magnetic>
  )
}
