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
    <div className="flex flex-col min-h-screen">
      <div className="text-white px-5 pt-12 pb-6" style={{ background: 'var(--indigo)' }}>
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <p className="text-indigo-200 text-sm mt-1">{rides.length} {t('carreras')} · {formatEuros(totalCents)}</p>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Filter tabs */}
        <div className="flex gap-2 bg-gray-100 rounded-2xl p-1">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${filter === f.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>

        {rides.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-4xl mb-3">🗂️</p>
            <p className="text-gray-500 font-medium">{t('sinViajes')}</p>
          </Card>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([day, dayRides]) => {
              const dayTotal = dayRides.reduce((s, r) => s + r.priceCents, 0)
              return (
                <Card key={day} className="p-0 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
                    <p className="text-sm font-semibold text-gray-700 capitalize">{formatDateShort(day)}</p>
                    <p className="text-sm font-bold text-emerald-600">{formatEuros(dayTotal)}</p>
                  </div>
                  {dayRides.map(ride => (
                    <RideCard key={ride.id} ride={ride} onDelete={handleDelete} />
                  ))}
                </Card>
              )
            })
        )}
      </div>
    </div>
  )
}
