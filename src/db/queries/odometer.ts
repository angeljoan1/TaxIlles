import { db, type OdometerReading } from '../schema'

const now = () => new Date().toISOString()

export async function addOdometerReading(reading: Omit<OdometerReading, 'id' | 'updatedAt' | 'synced'>): Promise<number> {
  return db.odometer.add({ ...reading, updatedAt: now(), synced: 0 })
}

export async function getOdometerReadings(limit = 20): Promise<OdometerReading[]> {
  return db.odometer.orderBy('readAt').reverse().limit(limit).toArray()
}

export async function getTodayOdometer(): Promise<{ start?: OdometerReading; end?: OdometerReading }> {
  const today = new Date().toISOString().slice(0, 10)
  const readings = await db.odometer
    .where('readAt')
    .between(today, today + 'T23:59:59', true, true)
    .toArray()
  return {
    start: readings.find(r => r.type === 'start'),
    end: readings.find(r => r.type === 'end'),
  }
}

export async function getKmForPeriod(start: string, end: string): Promise<number | null> {
  const readings = await db.odometer
    .where('readAt')
    .between(start, end + 'T23:59:59', true, true)
    .toArray()
  if (readings.length < 2) return null
  const values = readings.map(r => r.kmValue)
  return Math.max(...values) - Math.min(...values)
}

export async function deleteOdometerReading(id: number): Promise<void> {
  await db.odometer.delete(id)
}
