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
    <div className="flex flex-col min-h-screen">
      <div className="text-white px-5 pt-12 pb-4" style={{ background: 'var(--indigo)' }}>
        <h1 className="text-xl font-bold">{t('title')}</h1>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {/* View mode toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
          {(['week', 'month'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode === mode ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
            >
              {mode === 'week' ? t('verSemana') : t('verMes')}
            </button>
          ))}
        </div>

        {/* Period selector */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <button onClick={() => setOffset(o => o - 1)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 active:bg-gray-200">‹</button>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-800">{period.label}</p>
            <p className="text-xs text-gray-400">{period.start} — {period.end}</p>
          </div>
          <button onClick={() => setOffset(o => Math.min(0, o + 1))} disabled={offset >= 0} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 disabled:opacity-30 active:bg-gray-200">›</button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{totalLabel}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatEuros(periodTotal)}</p>
            {delta !== null && (
              <p className={`text-xs font-medium mt-1 ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {delta >= 0 ? '+' : ''}{delta}% {prevLabel}
              </p>
            )}
          </Card>
          <Card>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{t('kmRatio')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {earningsPerKm ? earningsPerKm.toFixed(2) : '—'}
            </p>
            {km && <p className="text-xs text-gray-400 mt-1">{km.toLocaleString('es-ES')} km</p>}
            {earningsPerKm && (
              <div className={`mt-1 w-2 h-2 rounded-full inline-block ${earningsPerKm >= 1.5 ? 'bg-emerald-500' : earningsPerKm >= 1 ? 'bg-amber-400' : 'bg-red-400'}`} />
            )}
          </Card>
        </div>

        {/* Earnings chart */}
        <Card>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">{t('ingresosDia')}</p>
          <EarningsBarChart data={chartData} />
        </Card>

        {/* Top destinations by earnings */}
        {topEarnings.length > 0 && (
          <Card>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">{t('masRentable')}</p>
            <TopDestinations destinations={topEarnings} metric="earnings" />
          </Card>
        )}

        {/* Top destinations by frequency */}
        {topFrequent.length > 0 && (
          <Card>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">{t('masFrecuente')}</p>
            <TopDestinations destinations={topFrequent} metric="count" />
          </Card>
        )}

        {chartData.length === 0 && topEarnings.length === 0 && (
          <Card className="text-center py-10">
            <BarChart2 size={40} className="text-indigo-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{t('sinDatos')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('sinDatosDesc')}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
