'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { deriveKey } from '@/lib/crypto/kdf'
import { authenticateWithBiometrics, registerBiometric, hasBiometricCredential, isPlatformAuthenticatorAvailable } from '@/lib/crypto/biometrics'

interface CryptoState {
  key: CryptoKey | null
  isUnlocked: boolean
  unlock: (pin: string, saltBase64: string) => Promise<void>
  unlockWithBiometrics: () => Promise<boolean>
  enrollBiometrics: (userId: string) => Promise<boolean>
  lock: () => void
  canUseBiometrics: boolean
  hasBiometric: boolean
  setBiometricState: (has: boolean) => void
}

const CryptoContext = createContext<CryptoState | null>(null)

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<CryptoKey | null>(null)
  const [canUseBiometrics, setCanUseBiometrics] = useState(false)
  const [hasBiometric, setHasBiometric] = useState(false)

  const unlock = useCallback(async (pin: string, saltBase64: string) => {
    const derived = await deriveKey(pin, saltBase64)
    setKey(derived)
    const available = await isPlatformAuthenticatorAvailable()
    setCanUseBiometrics(available)
    const has = await hasBiometricCredential()
    setHasBiometric(has)
  }, [])

  const unlockWithBiometrics = useCallback(async (): Promise<boolean> => {
    const k = await authenticateWithBiometrics()
    if (k) {
      setKey(k)
      return true
    }
    return false
  }, [])

  const enrollBiometrics = useCallback(async (userId: string): Promise<boolean> => {
    if (!key) return false
    const success = await registerBiometric(key, userId)
    if (success) setHasBiometric(true)
    return success
  }, [key])

  const lock = useCallback(() => setKey(null), [])

  const setBiometricState = useCallback((has: boolean) => setHasBiometric(has), [])

  return (
    <CryptoContext.Provider value={{ key, isUnlocked: !!key, unlock, unlockWithBiometrics, enrollBiometrics, lock, canUseBiometrics, hasBiometric, setBiometricState }}>
      {children}
    </CryptoContext.Provider>
  )
}

export function useCrypto() {
  const ctx = useContext(CryptoContext)
  if (!ctx) throw new Error('useCrypto must be used within CryptoProvider')
  return ctx
}
