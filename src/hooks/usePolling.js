import { useEffect, useRef } from 'react'

export function usePolling(callback, intervalMs) {
  const latest = useRef(callback)

  useEffect(() => {
    latest.current = callback
  })

  useEffect(() => {
    const timer = setInterval(() => latest.current(), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
}
