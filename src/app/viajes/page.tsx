'use client'
import { useState, useEffect, useCallback } from 'react'
import { RideCard } from '@/components/rides/RideCard'
import { Card } from '@/components/ui/Card'
import { getRidesByDateRange, deleteRide } from '@/db/queries/rides'
import { formatEuros } from '@/utils/currency'
import { formatDateShort, todayISO } from '@/utils/date'
import { type Ride } from '@/db/schema'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { useTranslations } from 'next-intl'

type Filter = 'hoy' | 'semana' | 'mes'

function getRange(filter: Filter): { start: string; end: string } {
  const today = new Date()
  if (filter === 'hoy') return { start: todayISO(), end: todayISO() }
  if (filter === 'semana') return { start: format(subDays(today, 6), 'yyyy-MM-dd'), end: todayISO() }
  return { start: format(startOfMonth(today), 'yyyy-MM-dd'), end: format(endOfMonth(today), 'yyyy-MM-dd') }
}

export default function ViajesPage() {
  const t = useTranslations('viajes')
  const [filter, setFilter] = useState<Filter>('hoy')
  const [rides, setRides] = useState<Ride[]>([])

  const refresh = useCallback(async () => {
    const { start, end } = getRange(filter)
    const data = await getRidesByDateRange(start, end)
    setRides(data)
  }, [filter])

  useEffect(() => { refresh() }, [refresh])

  const handleDelete = async (id: number) => {
    await deleteRide(id)
    refresh()
  }

  // Group by date
  const grouped = rides.reduce<Record<string, Ride[]>>((acc, ride) => {
    const day = ride.riddenAt.slice(0, 10)
    if (!acc[day]) acc[day] = []
    acc[day].push(ride)
    return acc
  }, {})

  const totalCents = rides.reduce((s, r) => s + r.priceCents, 0)

  const filters: { id: Filter; labelKey: string }[] = [
    { id: 'hoy', labelKey: 'hoy' },
    { id: 'semana', labelKey: '7dias' },
    { id: 'mes', labelKey: 'esteMes' },
  ]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <div
        className="px-5 pt-12 pb-5"
        style={{ background: `linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)` }}
      >
        <h1 className="text-3xl font-extrabold" style={{ color: 'var(--foreground)' }}>{t('title')}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
          {rides.length} {t('carreras')} · {formatEuros(totalCents)}
        </p>
      </div>

      <div className="px-4 pb-6 flex flex-col gap-3">
        {/* Filter tabs */}
        <div className="flex gap-1 rounded-2xl p-1" style={{ background: 'var(--surface2)' }}>
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={
                filter === f.id
                  ? { background: 'var(--surface)', color: 'var(--foreground)' }
                  : { background: 'transparent', color: 'var(--foreground)', opacity: 0.45 }
              }
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>

        {rides.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <span style={{ fontSize: 48, opacity: 0.15 }}>🗂️</span>
            <p className="font-semibold" style={{ color: 'var(--foreground)', opacity: 0.4 }}>{t('sinViajes')}</p>
          </div>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([day, dayRides]) => {
              const dayTotal = dayRides.reduce((s, r) => s + r.priceCents, 0)
              return (
                <div
                  key={day}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.06)' }}
                >
                  <div
                    className="px-4 py-3 flex justify-between items-center"
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                  >
                    <p className="text-sm font-semibold capitalize" style={{ color: 'var(--foreground)' }}>
                      {formatDateShort(day)}
                    </p>
                    <p className="text-sm font-bold" style={{ color: 'var(--emerald)' }}>
                      {formatEuros(dayTotal)}
                    </p>
                  </div>
                  {dayRides.map(ride => (
                    <RideCard key={ride.id} ride={ride} onDelete={handleDelete} />
                  ))}
                </div>
              )
            })
        )}
      </div>
    </div>
  )
}
