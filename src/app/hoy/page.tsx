'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Car } from 'lucide-react'
import { AddRideModal } from '@/components/rides/AddRideModal'
import { RideCard } from '@/components/rides/RideCard'
import { ShiftBanner } from '@/components/shift/ShiftBanner'
import { Card } from '@/components/ui/Card'
import { getRidesToday, deleteRide } from '@/db/queries/rides'
import { formatEuros } from '@/utils/currency'
import { formatDateSpanish, todayISO } from '@/utils/date'
import { type Ride } from '@/db/schema'
import { useTranslations } from 'next-intl'

export default function HoyPage() {
  const t = useTranslations('hoy')
  const [rides, setRides] = useState<Ride[]>([])
  const [showAdd, setShowAdd] = useState(false)

  const refresh = useCallback(async () => {
    const data = await getRidesToday()
    setRides(data)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const totalCents = rides.reduce((s, r) => s + r.priceCents, 0)
  const avgCents = rides.length ? Math.round(totalCents / rides.length) : 0

  const handleDelete = async (id: number) => {
    await deleteRide(id)
    refresh()
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="text-white px-5 pt-12 pb-6" style={{ background: 'var(--indigo)' }}>
        <p className="text-indigo-200 text-sm capitalize">{formatDateSpanish(todayISO())}</p>
        <div className="flex items-end justify-between mt-2">
          <div>
            <p className="text-4xl font-bold">{formatEuros(totalCents)}</p>
            <p className="text-indigo-200 text-sm mt-1">
              {rides.length} {t('carreras')} · {t('media')} {formatEuros(avgCents)}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-lg active:scale-95 transition-transform"
          >
            <Plus size={28} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <ShiftBanner onUpdate={refresh} />

        {/* Ride list */}
        {rides.length === 0 ? (
          <Card className="text-center py-10">
            <Car size={40} className="text-indigo-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{t('sinCarreras')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('pulsaParaAnadir')}</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('carrerasHoy')}</p>
            </div>
            {rides.map(ride => (
              <RideCard key={ride.id} ride={ride} onDelete={handleDelete} />
            ))}
          </Card>
        )}
      </div>

      <AddRideModal isOpen={showAdd} onClose={() => setShowAdd(false)} onSaved={refresh} />
    </div>
  )
}
