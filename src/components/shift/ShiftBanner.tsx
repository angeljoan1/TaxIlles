'use client'
import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { getActiveShift, startShift, endShift } from '@/db/queries/shifts'
import { type Shift } from '@/db/schema'
import { formatDuration, formatDateTime } from '@/utils/date'

interface ShiftBannerProps {
  onUpdate?: () => void
}

export function ShiftBanner({ onUpdate }: ShiftBannerProps) {
  const [shift, setShift] = useState<Shift | null>(null)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(async () => {
    const active = await getActiveShift()
    setShift(active ?? null)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Update duration every minute
  useEffect(() => {
    if (!shift) return
    const id = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [shift])

  const handleStart = async () => {
    await startShift()
    await refresh()
    onUpdate?.()
  }

  const handleEnd = async () => {
    if (!shift?.id) return
    await endShift(shift.id)
    await refresh()
    onUpdate?.()
  }

  if (!shift) {
    return (
      <button
        onClick={handleStart}
        className="w-full py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        🕐 Iniciar turno
      </button>
    )
  }

  return (
    <Card className="bg-amber-50 border-amber-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Turno activo</p>
          <p className="text-amber-900 font-bold text-lg">{formatDuration(shift.startAt)}</p>
          <p className="text-xs text-amber-600">Inicio: {formatDateTime(shift.startAt)}</p>
        </div>
        <button
          onClick={handleEnd}
          className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold active:scale-95 transition-transform"
        >
          Finalizar
        </button>
      </div>
      <span className="sr-only">{tick}</span>
    </Card>
  )
}
