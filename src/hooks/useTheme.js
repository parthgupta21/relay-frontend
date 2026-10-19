import { useSyncExternalStore } from 'react'

const KEY = 'relay-theme'
const listeners = new Set()
const media = window.matchMedia('(prefers-color-scheme: dark)')

let chosen = null
try {
  chosen = localStorage.getItem(KEY)
} catch {
  chosen = null
}

function resolve() {
  if (chosen === 'light' || chosen === 'dark') return chosen
  return media.matches ? 'dark' : 'light'
}

function apply() {
  document.documentElement.classList.toggle('dark', resolve() === 'dark')
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

media.addEventListener('change', apply)
apply()

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, resolve)
  function setTheme(next) {
    chosen = next
    try {
      localStorage.setItem(KEY, next)
    } catch {}
    apply()
  }
  return { theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }
}
