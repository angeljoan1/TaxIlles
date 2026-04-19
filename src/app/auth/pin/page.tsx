'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { generateSalt } from '@/lib/crypto/kdf'
import { upsertUserConfig } from '@/lib/supabase/queries'
import { useCrypto } from '@/context/CryptoContext'
import { useAuth } from '@/context/AuthContext'
import { hasBiometricCredential, isPlatformAuthenticatorAvailable } from '@/lib/crypto/biometrics'
import { Fingerprint, Lock } from 'lucide-react'

function PinPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const isUnlockMode = params.get('unlock') === '1'
  const { unlock, unlockWithBiometrics, enrollBiometrics, canUseBiometrics, hasBiometric } = useCrypto()
  const { user } = useAuth()

  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState<'pin' | 'confirm' | 'biometric'>('pin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showBiometricOffer, setShowBiometricOffer] = useState(false)

  useEffect(() => {
    if (!isUnlockMode) return
    // Check if biometric available on unlock screen
    Promise.all([isPlatformAuthenticatorAvailable(), hasBiometricCredential()]).then(
      ([available, has]) => { if (available && has) setShowBiometricOffer(true) }
    )
  }, [isUnlockMode])

  async function handleBiometricUnlock() {
    setLoading(true)
    const ok = await unlockWithBiometrics()
    if (ok) {
      router.replace('/hoy')
    } else {
      setError('Autenticación biométrica fallida. Usa tu PIN.')
      setShowBiometricOffer(false)
      setLoading(false)
    }
  }

  async function handlePinSubmit() {
    if (pin.length < 4) { setError('El PIN debe tener al menos 4 dígitos'); return }
    setError('')

    if (isUnlockMode) {
      setLoading(true)
      try {
        const supabase = getSupabaseClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from('user_config') as any).select('kdf_salt').single()
        if (!data?.kdf_salt) {
          // No PIN set up yet — go to setup flow
          router.replace('/auth/pin')
          return
        }
        await unlock(pin, data.kdf_salt)
        router.replace('/hoy')
      } catch {
        setError('PIN incorrecto o error de red')
        setLoading(false)
      }
      return
    }

    // Setup mode: first entry
    if (step === 'pin') {
      setStep('confirm')
      return
    }

    // Confirm PIN
    if (pin !== confirmPin) { setError('Los PINs no coinciden'); return }
    if (pin.length < 4) { setError('El PIN debe tener al menos 4 dígitos'); return }

    setLoading(true)
    try {
      const salt = generateSalt()
      await upsertUserConfig(user!.id, salt)
      await unlock(pin, salt)
      const canBio = await isPlatformAuthenticatorAvailable()
      if (canBio) {
        setStep('biometric')
        setLoading(false)
      } else {
        router.replace('/hoy')
      }
    } catch {
      setError('Error al guardar PIN. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  async function handleBiometricEnroll() {
    if (!user) return
    setLoading(true)
    const ok = await enrollBiometrics(user.id)
    setLoading(false)
    router.replace('/hoy')
    if (!ok) console.warn('Biometric enrollment failed, continuing without biometrics')
  }

  if (step === 'biometric') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Fingerprint size={40} className="text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¿Activar biometría?</h2>
          <p className="text-gray-500 text-sm mb-8">
            Usa tu huella o Face ID para desbloquear TaxIlles sin introducir el PIN cada vez.
          </p>
          <button
            onClick={handleBiometricEnroll}
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold mb-3 disabled:opacity-60"
          >
            {loading ? 'Activando...' : 'Activar biometría'}
          </button>
          <button
            onClick={() => router.replace('/hoy')}
            className="w-full text-gray-500 text-sm py-2"
          >
            Ahora no
          </button>
        </div>
      </div>
    )
  }

  const currentPin = step === 'confirm' ? confirmPin : pin
  const setCurrentPin = step === 'confirm' ? setConfirmPin : setPin

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Lock size={28} className="text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {isUnlockMode ? 'Introduce tu PIN' : step === 'confirm' ? 'Confirma el PIN' : 'Crea tu PIN'}
          </h2>
          <p className="text-gray-500 text-sm mt-1 text-center">
            {isUnlockMode
              ? 'Tus datos están cifrados con este PIN'
              : step === 'confirm'
              ? 'Repite el PIN para confirmar'
              : 'Mínimo 4 dígitos. Lo necesitarás para acceder.'}
          </p>
        </div>

        {/* Biometric button on unlock */}
        {isUnlockMode && showBiometricOffer && (
          <button
            onClick={handleBiometricUnlock}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 rounded-xl py-3 font-semibold mb-4 disabled:opacity-60"
          >
            <Fingerprint size={20} />
            Usar huella / Face ID
          </button>
        )}

        {/* PIN dots display */}
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: Math.max(4, currentPin.length) }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-colors ${
                i < currentPin.length ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Hidden input for PIN */}
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          value={currentPin}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 8)
            setCurrentPin(v)
            setError('')
          }}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
          placeholder="••••"
          autoFocus
        />

        {error && (
          <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 mb-4 text-center">{error}</p>
        )}

        <button
          onClick={handlePinSubmit}
          disabled={loading || currentPin.length < 4}
          className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold text-base disabled:opacity-60"
        >
          {loading ? 'Procesando...' : isUnlockMode ? 'Desbloquear' : step === 'confirm' ? 'Guardar PIN' : 'Siguiente'}
        </button>

        {isUnlockMode && (
          <button
            onClick={() => getSupabaseClient().auth.signOut().then(() => router.replace('/auth/login'))}
            className="w-full text-gray-400 text-sm py-3 mt-2"
          >
            Cerrar sesión
          </button>
        )}
      </div>
    </div>
  )
}

export default function PinPage() {
  return (
    <Suspense>
      <PinPageInner />
    </Suspense>
  )
}
