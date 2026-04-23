'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { CryptoProvider, useCrypto } from '@/context/CryptoContext'
import { I18nProvider } from '@/i18n/provider'
import { BottomNav } from './BottomNav'
import { useSync } from '@/hooks/useSync'

const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/pin']

function SyncRunner() {
  useSync()
  return null
}

function ThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved)
    }
  }, [])
  return null
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { isUnlocked } = useCrypto()
  const router = useRouter()
  const pathname = usePathname()

  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))

  useEffect(() => {
    if (loading) return
    if (!user && !isAuthRoute) {
      router.replace('/auth/login')
    }
  }, [user, loading, isAuthRoute, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user && !isUnlocked && !isAuthRoute) {
    return <PinUnlockScreen />
  }

  return (
    <>
      {user && isUnlocked && <SyncRunner />}
      <main className="max-w-lg mx-auto pb-20 min-h-screen">
        {children}
      </main>
      {user && isUnlocked && <BottomNav />}
    </>
  )
}

function PinUnlockScreen() {
  const router = useRouter()
  useEffect(() => { router.replace('/auth/pin?unlock=1') }, [router])
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CryptoProvider>
        <I18nProvider>
          <ThemeInit />
          <AuthGuard>{children}</AuthGuard>
        </I18nProvider>
      </CryptoProvider>
    </AuthProvider>
  )
}

