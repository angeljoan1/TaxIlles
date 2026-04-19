'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  data: { label: string; euros: number }[]
}

export function EarningsBarChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="h-32 flex items-center justify-center text-gray-300 text-sm">Sin datos</div>
  }

  const maxVal = Math.max(...data.map(d => d.euros), 1)

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [`${Number(v).toFixed(2)} €`, 'Ingresos']}
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
        />
        <Bar dataKey="euros" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.euros === maxVal ? '#6366f1' : '#c7d2fe'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
