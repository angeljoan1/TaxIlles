'use client'
import { formatEuros } from '@/utils/currency'

interface DestinationStat {
  name: string
  color: string
  totalCents: number
  count: number
}

interface Props {
  destinations: DestinationStat[]
  metric: 'earnings' | 'count'
}

export function TopDestinations({ destinations, metric }: Props) {
  const maxVal = metric === 'earnings'
    ? Math.max(...destinations.map(d => d.totalCents), 1)
    : Math.max(...destinations.map(d => d.count), 1)

  return (
    <div className="flex flex-col gap-3">
      {destinations.map((dest, i) => {
        const val = metric === 'earnings' ? dest.totalCents : dest.count
        const pct = (val / maxVal) * 100
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dest.color }} />
                <span className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{dest.name}</span>
              </div>
              <span className="text-sm font-bold text-gray-700">
                {metric === 'earnings' ? formatEuros(dest.totalCents) : `${dest.count} carrera${dest.count !== 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: dest.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
