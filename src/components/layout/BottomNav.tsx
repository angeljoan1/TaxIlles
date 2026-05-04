'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

const TABS = [
  { href: '/hoy',          emoji: '🚕', key: 'hoy' },
  { href: '/viajes',       emoji: '📋', key: 'viajes' },
  { href: '/estadisticas', emoji: '📊', key: 'stats' },
  { href: '/ajustes',      emoji: '⚙️', key: 'ajustes' },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
    >
      <div className="max-w-lg mx-auto flex">
        {TABS.map(({ href, emoji, key }) => {
          const isActive = pathname === href || pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center py-2.5 pt-3 text-xs transition-colors"
            >
              <span style={{ fontSize: 20, lineHeight: 1, filter: isActive ? 'none' : 'grayscale(1) opacity(0.35)' }}>
                {emoji}
              </span>
              <span
                className="mt-1"
                style={{ fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--amber)' : 'var(--text-muted)' }}
              >
                {t(key)}
              </span>
              {isActive && (
                <span className="mt-1 w-1 h-1 rounded-full" style={{ background: 'var(--amber)' }} />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
