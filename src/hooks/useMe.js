import { useEffect, useState } from 'react'
import { getMe } from '@/api/auth'

export function useMe() {
  const [state, setState] = useState({ me: null, loading: true, error: null })

  useEffect(() => {
    let active = true
    getMe()
      .then((me) => active && setState({ me, loading: false, error: null }))
      .catch((error) => active && setState({ me: null, loading: false, error }))
    return () => {
      active = false
    }
  }, [])

  return state
}
