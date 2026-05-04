'use client'
import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { OdometerModal } from '@/components/odometer/OdometerModal'
import { getActiveShift, startShift, endShift } from '@/db/queries/shifts'
import { getTodayOdometer } from '@/db/queries/odometer'
import { type Shift, type OdometerReading } from '@/db/schema'
import { formatDuration, formatDateTime } from '@/utils/date'

interface ShiftBannerProps {
  onUpdate?: () => void
  onShiftChange?: (active: boolean) => void
}

export function ShiftBanner({ onUpdate, onShiftChange }: ShiftBannerProps) {
  const [shift, setShift] = useState<Shift | null>(null)
  const [tick, setTick] = useState(0)
  const [showStartKm, setShowStartKm] = useState(false)
  const [showEndKm, setShowEndKm] = useState(false)
  const [showAddKm, setShowAddKm] = useState(false)
  const [kmType, setKmType] = useState<'start' | 'end'>('start')
  const [kmData, setKmData] = useState<{ start?: OdometerReading; end?: OdometerReading }>({})

  const refresh = useCallback(async () => {
    const [active, km] = await Promise.all([getActiveShift(), getTodayOdometer()])
    setShift(active ?? null)
    onShiftChange?.(!!active)
    setKmData(km)
  }, [onShiftChange])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!shift) return
    const id = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [shift])

  // ── Start shift ──────────────────────────────────────────
  const doStartShift = useCallback(async () => {
    await startShift()
    await refresh()
    onUpdate?.()
  }, [refresh, onUpdate])

  const handleStartKmSaved = useCallback(async () => {
    setShowStartKm(false)
    await doStartShift()
  }, [doStartShift])

  const handleStartKmSkip = useCallback(async () => {
    setShowStartKm(false)
    await doStartShift()
  }, [doStartShift])

  // ── End shift ────────────────────────────────────────────
  const doEndShift = useCallback(async () => {
    if (!shift?.id) return
    await endShift(shift.id)
    await refresh()
    onUpdate?.()
  }, [shift, refresh, onUpdate])

  const handleEndKmSaved = useCallback(async () => {
    setShowEndKm(false)
    await doEndShift()
  }, [doEndShift])

  const handleEndKmSkip = useCallback(async () => {
    setShowEndKm(false)
    await doEndShift()
  }, [doEndShift])

  // ── Open km editor for active shift ──────────────────────
  const openKmModal = (type: 'start' | 'end') => {
    setKmType(type)
    setShowAddKm(true)
  }

  // ── No active shift ───────────────────────────────────────
  if (!shift) {
    return (
      <>
        <button
          onClick={() => setShowStartKm(true)}
          className="w-full rounded-2xl active:scale-95 transition-transform"
          style={{ background: 'var(--amber-dim)', border: '1.5px solid color-mix(in srgb, var(--amber) 33%, transparent)' }}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--amber)' }}>
                Iniciar torn
              </p>
              <p className="text-xs text-gray-400 mt-0.5">El cuentakilómetros és opcional</p>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--amber)' }}
            >
              <span className="text-white text-xl leading-none">▶</span>
            </div>
          </div>
        </button>

        <OdometerModal
          isOpen={showStartKm}
          title="Iniciar torn"
          defaultType="start"
          onClose={() => setShowStartKm(false)}
          onSaved={handleStartKmSaved}
          onSkip={handleStartKmSkip}
        />
      </>
    )
  }

  // ── Active shift ──────────────────────────────────────────
  return (
    <>
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'var(--amber-dim)',
          border: '1.5px solid color-mix(in srgb, var(--amber) 33%, transparent)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--amber)' }}>
              Torn actiu
            </p>
            <p className="text-2xl font-extrabold mt-0.5" style={{ color: 'var(--text)' }}>{formatDuration(shift.startAt)}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Inici: {formatDateTime(shift.startAt)}</p>
          </div>
          <button
            onClick={() => setShowEndKm(true)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-black active:scale-95 transition-transform"
            style={{ background: 'var(--amber)' }}
          >
            Finalitzar
          </button>
        </div>

        {/* Inline km display */}
        <div className="mt-3 pt-3 flex gap-3" style={{ borderTop: '1px solid color-mix(in srgb, var(--amber) 25%, transparent)' }}>
          <button
            onClick={() => openKmModal('start')}
            className="flex-1 py-2 rounded-xl text-center active:scale-95 transition-transform"
            style={{ background: 'rgba(0,0,0,0.08)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Km inici</p>
            {kmData.start ? (
              <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text)' }}>{kmData.start.kmValue.toLocaleString('es-ES')}</p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>afegir →</p>
            )}
          </button>
          <button
            onClick={() => openKmModal('end')}
            className="flex-1 py-2 rounded-xl text-center active:scale-95 transition-transform"
            style={{ background: 'rgba(0,0,0,0.04)', border: '1.5px dashed var(--border-mid)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Km fi</p>
            {kmData.end ? (
              <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text)' }}>{kmData.end.kmValue.toLocaleString('es-ES')}</p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>afegir →</p>
            )}
          </button>
        </div>
        <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>El registre de km és opcional</p>
        <span className="sr-only">{tick}</span>
      </div>

      <OdometerModal
        isOpen={showEndKm}
        title="Finalitzar torn"
        defaultType="end"
        onClose={() => setShowEndKm(false)}
        onSaved={handleEndKmSaved}
        onSkip={handleEndKmSkip}
      />

      {/* km editor for active shift (no skip — just adds/updates reading) */}
      <OdometerModal
        isOpen={showAddKm}
        defaultType={kmType}
        onClose={() => setShowAddKm(false)}
        onSaved={refresh}
      />
    </>
  )
}
