import { useEffect, useRef, useSyncExternalStore } from 'react'
import { socket } from '@/lib/socket'

function subscribe(onChange) {
  socket.on('connect', onChange)
  socket.on('disconnect', onChange)
  return () => {
    socket.off('connect', onChange)
    socket.off('disconnect', onChange)
  }
}

export function useRealtimeEvent(name, handler) {
  const latest = useRef(handler)

  useEffect(() => {
    latest.current = handler
  })

  useEffect(() => {
    const listener = (payload) => latest.current(payload)
    socket.on(name, listener)
    return () => socket.off(name, listener)
  }, [name])
}

export function useRealtimeConnected() {
  return useSyncExternalStore(subscribe, () => socket.connected)
}
