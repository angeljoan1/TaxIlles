'use client'

import { useEffect } from 'react'
import { useCrypto } from '@/context/CryptoContext'
import { runSync } from '@/services/sync'

export function useSync() {
  const { key, isUnlocked } = useCrypto()

  useEffect(() => {
    if (!isUnlocked || !key) return
    // Initial sync on unlock
    runSync(key)
    // Re-sync when network comes back
    const onOnline = () => runSync(key)
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [key, isUnlocked])
}
