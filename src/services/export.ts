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
  downloadBlob('carreras.csv', '\uFEFF' + header + rows.join('\n'), 'text/csv;charset=utf-8;')
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
  downloadBlob('gastos.csv', '\uFEFF' + header + rows.join('\n'), 'text/csv;charset=utf-8;')
}

export async function exportJSONBackup(): Promise<void> {
  const [destinations, rides, odometer, shifts, expenses] = await Promise.all([
    db.destinations.toArray(),
    db.rides.orderBy('riddenAt').toArray(),
    db.odometer.orderBy('readAt').toArray(),
    db.shifts.orderBy('startAt').toArray(),
    db.expenses.orderBy('date').toArray(),
  ])
  const backup = {
    version: 2,
    exportedAt: new Date().toISOString(),
    destinations,
    rides,
    odometer,
    shifts,
    expenses,
  }
  const date = format(new Date(), 'yyyy-MM-dd')
  downloadBlob(`taxilles-backup-${date}.json`, JSON.stringify(backup, null, 2), 'application/json')
}

function downloadBlob(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
