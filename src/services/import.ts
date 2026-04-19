'use client'

import Papa from 'papaparse'
import { db } from '@/db/schema'

const now = () => new Date().toISOString()

interface BackupData {
  version: number
  destinations?: unknown[]
  rides?: unknown[]
  odometer?: unknown[]
  shifts?: unknown[]
  expenses?: unknown[]
}

export async function importJSONBackup(file: File): Promise<{ imported: number; errors: number }> {
  const text = await file.text()
  let backup: BackupData
  try {
    backup = JSON.parse(text)
  } catch {
    throw new Error('Archivo JSON inválido')
  }
  if (!backup.version) throw new Error('Formato de backup no reconocido')

  let imported = 0
  let errors = 0

  // Import destinations (skip duplicates by name)
  for (const d of backup.destinations ?? []) {
    const dest = d as { name: string; color: string; isActive: boolean; createdAt: string }
    try {
      const existing = await db.destinations.where('name').equals(dest.name).first()
      if (!existing) {
        await db.destinations.add({ ...dest, updatedAt: now(), synced: 0 })
        imported++
      }
    } catch { errors++ }
  }

  // Import rides (skip duplicates by riddenAt + priceCents + destinationName)
  for (const r of backup.rides ?? []) {
    const ride = r as { riddenAt: string; priceCents: number; destinationName: string; destinationId: number; destinationColor: string }
    try {
      const existing = await db.rides
        .where('riddenAt').equals(ride.riddenAt)
        .and(x => x.priceCents === ride.priceCents && x.destinationName === ride.destinationName)
        .first()
      if (!existing) {
        await db.rides.add({ ...ride, updatedAt: now(), synced: 0 })
        imported++
      }
    } catch { errors++ }
  }

  // Odometer
  for (const o of backup.odometer ?? []) {
    const odo = o as { readAt: string; kmValue: number; type: 'start' | 'end' | 'manual'; source: 'ocr' | 'manual' }
    try {
      const existing = await db.odometer.where('readAt').equals(odo.readAt).and(x => x.kmValue === odo.kmValue).first()
      if (!existing) {
        await db.odometer.add({ ...odo, updatedAt: now(), synced: 0 })
        imported++
      }
    } catch { errors++ }
  }

  // Shifts
  for (const s of backup.shifts ?? []) {
    const shift = s as { startAt: string; endAt?: string; startKm?: number; endKm?: number }
    try {
      const existing = await db.shifts.where('startAt').equals(shift.startAt).first()
      if (!existing) {
        await db.shifts.add({ ...shift, updatedAt: now(), synced: 0 })
        imported++
      }
    } catch { errors++ }
  }

  // Expenses
  for (const e of backup.expenses ?? []) {
    const exp = e as { date: string; amountCents: number; category: 'gasolina' | 'itv' | 'mantenimiento' | 'seguro' | 'otro'; description?: string }
    try {
      const existing = await db.expenses.where('date').equals(exp.date).and(x => x.amountCents === exp.amountCents).first()
      if (!existing) {
        await db.expenses.add({ ...exp, updatedAt: now(), synced: 0 })
        imported++
      }
    } catch { errors++ }
  }

  return { imported, errors }
}

export async function importRidesCSV(file: File): Promise<{ imported: number; errors: number }> {
  const text = await file.text()
  const defaultDest = await db.destinations.filter(d => d.isActive).first()

  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let imported = 0
        let errors = 0
        for (const row of results.data as Record<string, string>[]) {
          try {
            // Support columns: Fecha, Hora, Destino, Precio (€), Km GPS
            const fechaStr = row['Fecha'] ?? row['fecha']
            const horaStr = row['Hora'] ?? row['hora'] ?? '00:00'
            const destName = row['Destino'] ?? row['destino'] ?? 'Importado'
            const precioStr = row['Precio (€)'] ?? row['precio'] ?? row['Precio'] ?? '0'
            const kmStr = row['Km GPS'] ?? row['km_gps'] ?? ''

            if (!fechaStr) { errors++; continue }

            const [d, m, y] = fechaStr.split('/')
            const riddenAt = `${y}-${m}-${d}T${horaStr}:00.000Z`

            const dest = await db.destinations.where('name').equalsIgnoreCase(destName).first() ?? defaultDest
            if (!dest) { errors++; continue }

            const priceCents = Math.round(parseFloat(precioStr.replace(',', '.')) * 100)
            const kmGps = kmStr ? parseFloat(kmStr) : undefined

            await db.rides.add({
              destinationId: dest.id!,
              destinationName: dest.name,
              destinationColor: dest.color,
              priceCents,
              riddenAt,
              kmGps,
              updatedAt: now(),
              synced: 0,
            })
            imported++
          } catch { errors++ }
        }
        resolve({ imported, errors })
      },
      error: () => resolve({ imported: 0, errors: 1 }),
    })
  })
}
