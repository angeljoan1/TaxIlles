'use client'
import { useState, useEffect, useCallback } from 'react'
import { AddRideModal } from '@/components/rides/AddRideModal'
import { RideCard } from '@/components/rides/RideCard'
import { ShiftBanner } from '@/components/shift/ShiftBanner'
import { getRidesToday, deleteRide } from '@/db/queries/rides'
import { formatEuros } from '@/utils/currency'
import { formatDateSpanish, todayISO } from '@/utils/date'
import { type Ride } from '@/db/schema'
import { useTranslations } from 'next-intl'

export default function HoyPage() {
  const t = useTranslations('hoy')
  const [rides, setRides] = useState<Ride[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [hasActiveShift, setHasActiveShift] = useState(false)

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
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Header ───────────────────────────────────────── */}
      <div
        className="px-5 pt-12 pb-6"
        style={{ background: `linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)` }}
      >
        <p
          className="text-xs font-medium uppercase tracking-widest mb-2"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}
        >
          {formatDateSpanish(todayISO())}
        </p>

        <div className="flex items-end justify-between">
          <div>
            <p
              className="text-5xl font-extrabold leading-none tracking-tight"
              style={{ color: hasActiveShift ? 'var(--text)' : 'var(--text-dim)' }}
            >
              {formatEuros(totalCents)}
            </p>
            <p className="text-sm font-medium mt-1.5" style={{ color: 'var(--text-muted)' }}>
              {rides.length} {t('carreras')}
              {rides.length > 0 && ` · ${t('media')} ${formatEuros(avgCents)}`}
              {!hasActiveShift && rides.length === 0 && ` · ${t('sinTurno')}`}
            </p>
          </div>

          {hasActiveShift && (
            <button
              onClick={() => setShowAdd(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform text-black text-3xl font-bold"
              style={{ background: 'var(--amber)' }}
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 px-4 pb-6">
        <ShiftBanner onUpdate={refresh} onShiftChange={setHasActiveShift} />

        {rides.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <span style={{ fontSize: 52, opacity: 0.15 }}>🚕</span>
            <p className="text-base font-semibold" style={{ color: 'var(--text-muted)' }}>
              {t('sinCarreras')}
            </p>
            <p className="text-sm text-center leading-relaxed" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
              {t('pulsaParaAnadir')}
            </p>
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}
              >
                {t('carrerasHoy')}
              </p>
            </div>
            {rides.map(ride => (
              <RideCard key={ride.id} ride={ride} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <AddRideModal isOpen={showAdd} onClose={() => setShowAdd(false)} onSaved={refresh} />
    </div>
  )
}
