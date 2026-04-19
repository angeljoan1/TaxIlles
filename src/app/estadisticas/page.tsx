'use client'
import { useState, useEffect, useCallback } from 'react'
import { BarChart2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EarningsBarChart } from '@/components/stats/EarningsBarChart'
import { TopDestinations } from '@/components/stats/TopDestinations'
import { getDailyEarnings, getTopDestinations, getWeekTotal } from '@/db/queries/rides'
import { getKmForPeriod } from '@/db/queries/odometer'
import { formatEuros } from '@/utils/currency'
import { getWeekBounds, getDayAbbr } from '@/utils/date'

export default function EstadisticasPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [chartData, setChartData] = useState<{ label: string; euros: number }[]>([])
  const [topEarnings, setTopEarnings] = useState<{ name: string; color: string; totalCents: number; count: number }[]>([])
  const [topFrequent, setTopFrequent] = useState<{ name: string; color: string; totalCents: number; count: number }[]>([])
  const [weekTotal, setWeekTotal] = useState(0)
  const [prevWeekTotal, setPrevWeekTotal] = useState(0)
  const [km, setKm] = useState<number | null>(null)

  const week = getWeekBounds(weekOffset)

  const refresh = useCallback(async () => {
    const [daily, topE, topF, total, prevTotal, kmDriven] = await Promise.all([
      getDailyEarnings(week.start, week.end),
      getTopDestinations(week.start, week.end, 'earnings'),
      getTopDestinations(week.start, week.end, 'count'),
      getWeekTotal(week.start, week.end),
      getWeekTotal(getWeekBounds(weekOffset - 1).start, getWeekBounds(weekOffset - 1).end),
      getKmForPeriod(week.start, week.end),
    ])
    setChartData(daily.map(d => ({ label: getDayAbbr(d.date), euros: d.totalCents / 100 })))
    setTopEarnings(topE)
    setTopFrequent(topF)
    setWeekTotal(total)
    setPrevWeekTotal(prevTotal)
    setKm(kmDriven)
  }, [week.start, week.end, weekOffset])

  useEffect(() => { refresh() }, [refresh])

  const earningsPerKm = km && weekTotal ? weekTotal / 100 / km : null
  const weekDelta = prevWeekTotal > 0 ? Math.round(((weekTotal - prevWeekTotal) / prevWeekTotal) * 100) : null

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-indigo-600 text-white px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold">Estadísticas</h1>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {/* Week selector */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <button onClick={() => setWeekOffset(o => o - 1)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 active:bg-gray-200">‹</button>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-800">{week.label}</p>
            <p className="text-xs text-gray-400">{week.start} — {week.end}</p>
          </div>
          <button onClick={() => setWeekOffset(o => Math.min(0, o + 1))} disabled={weekOffset >= 0} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 disabled:opacity-30 active:bg-gray-200">›</button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Total semana</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatEuros(weekTotal)}</p>
            {weekDelta !== null && (
              <p className={`text-xs font-medium mt-1 ${weekDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {weekDelta >= 0 ? '+' : ''}{weekDelta}% vs semana ant.
              </p>
            )}
          </Card>
          <Card>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">€ / km</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {earningsPerKm ? earningsPerKm.toFixed(2) : '—'}
            </p>
            {km && <p className="text-xs text-gray-400 mt-1">{km.toLocaleString('es-ES')} km totales</p>}
            {earningsPerKm && (
              <div className={`mt-1 w-2 h-2 rounded-full inline-block ${earningsPerKm >= 1.5 ? 'bg-emerald-500' : earningsPerKm >= 1 ? 'bg-amber-400' : 'bg-red-400'}`} />
            )}
          </Card>
        </div>

        {/* Earnings chart */}
        <Card>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Ingresos por día</p>
          <EarningsBarChart data={chartData} />
        </Card>

        {/* Top destinations by earnings */}
        {topEarnings.length > 0 && (
          <Card>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Más rentables</p>
            <TopDestinations destinations={topEarnings} metric="earnings" />
          </Card>
        )}

        {/* Top destinations by frequency */}
        {topFrequent.length > 0 && (
          <Card>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Más frecuentes</p>
            <TopDestinations destinations={topFrequent} metric="count" />
          </Card>
        )}

        {chartData.length === 0 && topEarnings.length === 0 && (
          <Card className="text-center py-10">
            <BarChart2 size={40} className="text-indigo-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Sin datos esta semana</p>
            <p className="text-gray-400 text-sm mt-1">Añade carreras para ver estadísticas</p>
          </Card>
        )}
      </div>
    </div>
  )
}
