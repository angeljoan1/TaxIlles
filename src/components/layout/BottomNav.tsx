'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const tabs = [
  { href: '/hoy', label: 'Hoy', icon: '🚕' },
  { href: '/viajes', label: 'Viajes', icon: '📋' },
  { href: '/estadisticas', label: 'Stats', icon: '📊' },
  { href: '/ajustes', label: 'Ajustes', icon: '⚙️' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(tab => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                'flex-1 flex flex-col items-center py-2 pt-3 text-xs transition-colors',
                isActive ? 'text-indigo-600' : 'text-gray-400'
              )}
            >
              <span className="text-xl mb-0.5">{tab.icon}</span>
              <span className={clsx('font-medium', isActive && 'font-bold')}>{tab.label}</span>
              {isActive && <span className="mt-1 w-1 h-1 rounded-full bg-indigo-600" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
