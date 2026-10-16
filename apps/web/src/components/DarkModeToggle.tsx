import { useState, useEffect } from 'react'
import { Button } from '@heroui/react'
import { RiSunLine, RiMoonLine } from 'react-icons/ri'

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark') ||
      localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    setIsDark(isDarkMode)
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <Button
      isIconOnly
      variant="light"
      radius="full"
      aria-label="Toggle dark mode"
      onClick={toggleDarkMode}
      className="text-muted hover:text-ink"
    >
      {isDark ? <RiSunLine className="text-lg text-amber-400" /> : <RiMoonLine className="text-lg" />}
    </Button>
  )
}
