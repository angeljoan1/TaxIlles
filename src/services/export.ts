'use client'
import { db } from '@/db/schema'
import { format, parseISO } from 'date-fns'

export async function exportRidesCSV(): Promise<void> {
  const rides = await db.rides.orderBy('riddenAt').toArray()
  const header = 'Fecha,Hora,Destino,Precio (€),Km GPS\n'
  const rows = rides.map(r => {
    const dt = parseISO(r.riddenAt)
    return [
      format(dt, 'dd/MM/yyyy'),
      format(dt, 'HH:mm'),
      `"${r.destinationName}"`,
      (r.priceCents / 100).toFixed(2),
      r.kmGps ?? '',
    ].join(',')
  })
  downloadCSV('carreras.csv', header + rows.join('\n'))
}

export async function exportExpensesCSV(): Promise<void> {
  const expenses = await db.expenses.orderBy('date').toArray()
  const header = 'Fecha,Categoría,Descripción,Importe (€)\n'
  const rows = expenses.map(e => [
    e.date,
    e.category,
    `"${e.description ?? ''}"`,
    (e.amountCents / 100).toFixed(2),
  ].join(','))
  downloadCSV('gastos.csv', header + rows.join('\n'))
}

function downloadCSV(filename: string, content: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
