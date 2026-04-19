'use client'

import { NextIntlClientProvider } from 'next-intl'
import { ReactNode, useEffect, useState } from 'react'
import esMessages from './messages/es.json'
import caMessages from './messages/ca.json'

const MESSAGES = { es: esMessages, ca: caMessages }
type Locale = 'es' | 'ca'

const LOCALE_KEY = 'taxilles_locale'

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'es'
  return (localStorage.getItem(LOCALE_KEY) as Locale) ?? 'es'
}

export function setStoredLocale(locale: Locale) {
  localStorage.setItem(LOCALE_KEY, locale)
  window.dispatchEvent(new CustomEvent('taxilles:locale', { detail: locale }))
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('es')

  useEffect(() => {
    setLocale(getStoredLocale())
    const handler = (e: Event) => setLocale((e as CustomEvent<Locale>).detail)
    window.addEventListener('taxilles:locale', handler)
    return () => window.removeEventListener('taxilles:locale', handler)
  }, [])

  return (
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      {children}
    </NextIntlClientProvider>
  )
}
