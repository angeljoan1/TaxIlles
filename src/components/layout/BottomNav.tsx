'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { Car, List, BarChart2, Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'

const TABS = [
  { href: '/hoy', icon: Car, key: 'hoy' },
  { href: '/viajes', icon: List, key: 'viajes' },
  { href: '/estadisticas', icon: BarChart2, key: 'stats' },
  { href: '/ajustes', icon: Settings, key: 'ajustes' },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
      <div className="max-w-lg mx-auto flex">
        {TABS.map(({ href, icon: Icon, key }) => {
          const isActive = pathname === href || pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex-1 flex flex-col items-center py-2 pt-3 text-xs transition-colors',
                isActive ? 'text-indigo-600' : 'text-gray-400'
              )}
            >
              <Icon size={22} className="mb-0.5" />
              <span className={clsx('font-medium', isActive && 'font-bold')}>{t(key)}</span>
              {isActive && <span className="mt-1 w-1 h-1 rounded-full bg-indigo-600" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
