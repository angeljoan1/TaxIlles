'use client'
import { useState, useEffect, useCallback } from 'react'
import { BarChart2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EarningsBarChart } from '@/components/stats/EarningsBarChart'
import { TopDestinations } from '@/components/stats/TopDestinations'
import { getDailyEarnings, getTopDestinations, getWeekTotal } from '@/db/queries/rides'
import { getKmForPeriod } from '@/db/queries/odometer'
import { formatEuros } from '@/utils/currency'
import { getWeekBounds, getMonthBounds, getDayAbbr } from '@/utils/date'
import { useTranslations } from 'next-intl'

type ViewMode = 'week' | 'month'

export default function EstadisticasPage() {
  const t = useTranslations('estadisticas')
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [chartData, setChartData] = useState<{ label: string; euros: number }[]>([])
  const [topEarnings, setTopEarnings] = useState<{ name: string; color: string; totalCents: number; count: number }[]>([])
  const [topFrequent, setTopFrequent] = useState<{ name: string; color: string; totalCents: number; count: number }[]>([])
  const [periodTotal, setPeriodTotal] = useState(0)
  const [prevTotal, setPrevTotal] = useState(0)
  const [km, setKm] = useState<number | null>(null)

  const offset = viewMode === 'week' ? weekOffset : monthOffset
  const setOffset = viewMode === 'week' ? setWeekOffset : setMonthOffset
  const period = viewMode === 'week' ? getWeekBounds(offset) : getMonthBounds(offset)
  const prevPeriod = viewMode === 'week' ? getWeekBounds(offset - 1) : getMonthBounds(offset - 1)

  const refresh = useCallback(async () => {
    const [daily, topE, topF, total, prev, kmDriven] = await Promise.all([
      getDailyEarnings(period.start, period.end),
      getTopDestinations(period.start, period.end, 'earnings'),
      getTopDestinations(period.start, period.end, 'count'),
      getWeekTotal(period.start, period.end),
      getWeekTotal(prevPeriod.start, prevPeriod.end),
      getKmForPeriod(period.start, period.end),
    ])
    setChartData(daily.map(d => ({ label: getDayAbbr(d.date), euros: d.totalCents / 100 })))
    setTopEarnings(topE)
    setTopFrequent(topF)
    setPeriodTotal(total)
    setPrevTotal(prev)
    setKm(kmDriven)
  }, [period.start, period.end, prevPeriod.start, prevPeriod.end])

  useEffect(() => { refresh() }, [refresh])

  const earningsPerKm = km && periodTotal ? periodTotal / 100 / km : null
  const delta = prevTotal > 0 ? Math.round(((periodTotal - prevTotal) / prevTotal) * 100) : null
  const prevLabel = viewMode === 'week' ? t('semanaAnterior') : t('mesAnterior')
  const totalLabel = viewMode === 'week' ? t('totalSemana') : t('totalMes')

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-5"
        style={{ background: `linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)` }}
      >
        <h1 className="text-3xl font-extrabold" style={{ color: 'var(--foreground)' }}>
          {t('title')}
        </h1>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-6">
        {/* View mode toggle */}
        <div className="flex gap-1 rounded-2xl p-1" style={{ background: 'var(--surface2)' }}>
          {(['week', 'month'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={
                viewMode === mode
                  ? { background: 'var(--surface)', color: 'var(--foreground)' }
                  : { background: 'transparent', color: 'var(--foreground)', opacity: 0.45 }
              }
            >
              {mode === 'week' ? t('verSemana') : t('verMes')}
            </button>
          ))}
        </div>

        {/* Period selector */}
        <div
          className="flex items-center justify-between rounded-2xl p-3"
          style={{ background: 'var(--surface)', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <button
            onClick={() => setOffset(o => o - 1)}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform text-lg font-semibold"
            style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
          >‹</button>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{period.label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.4 }}>{period.start} — {period.end}</p>
          </div>
          <button
            onClick={() => setOffset(o => Math.min(0, o + 1))}
            disabled={offset >= 0}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform text-lg font-semibold disabled:opacity-20"
            style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
          >›</button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--foreground)', opacity: 0.4 }}
            >{totalLabel}</p>
            <p className="text-2xl font-extrabold mt-1.5" style={{ color: 'var(--foreground)' }}>
              {formatEuros(periodTotal)}
            </p>
            {delta !== null && (
              <span
                className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{
                  background: delta >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                  color: delta >= 0 ? 'var(--emerald)' : '#ef4444',
                }}
              >
                {delta >= 0 ? '+' : ''}{delta}%
                <span style={{ fontWeight: 400, opacity: 0.7 }}>{prevLabel}</span>
              </span>
            )}
          </Card>
          <Card>
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--foreground)', opacity: 0.4 }}
            >{t('kmRatio')}</p>
            <p className="text-2xl font-extrabold mt-1.5" style={{ color: 'var(--foreground)' }}>
              {earningsPerKm ? earningsPerKm.toFixed(2) : '—'}
            </p>
            {km !== null && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: earningsPerKm
                      ? earningsPerKm >= 1.5 ? 'var(--emerald)' : earningsPerKm >= 1 ? 'var(--amber)' : '#ef4444'
                      : 'var(--surface2)',
                  }}
                />
                <p className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
                  {km.toLocaleString('es-ES')} km
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Earnings chart */}
        <Card>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: 'var(--foreground)', opacity: 0.4 }}
          >{t('ingresosDia')}</p>
          <EarningsBarChart data={chartData} />
        </Card>

        {/* Top destinations by earnings */}
        {topEarnings.length > 0 && (
          <Card>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: 'var(--foreground)', opacity: 0.4 }}
            >{t('masRentable')}</p>
            <TopDestinations destinations={topEarnings} metric="earnings" />
          </Card>
        )}

        {/* Top destinations by frequency */}
        {topFrequent.length > 0 && (
          <Card>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: 'var(--foreground)', opacity: 0.4 }}
            >{t('masFrecuente')}</p>
            <TopDestinations destinations={topFrequent} metric="count" />
          </Card>
        )}

        {chartData.length === 0 && topEarnings.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <BarChart2 size={48} style={{ color: 'var(--foreground)', opacity: 0.1 }} />
            <p className="font-semibold" style={{ color: 'var(--foreground)', opacity: 0.4 }}>{t('sinDatos')}</p>
            <p className="text-sm text-center" style={{ color: 'var(--foreground)', opacity: 0.3 }}>{t('sinDatosDesc')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
