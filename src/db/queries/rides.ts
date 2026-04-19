import { db, type Ride } from '../schema'

export async function addRide(ride: Omit<Ride, 'id'>): Promise<number> {
  return db.rides.add(ride)
}

export async function getRidesToday(): Promise<Ride[]> {
  const today = new Date().toISOString().slice(0, 10)
  return db.rides
    .where('riddenAt')
    .between(today, today + 'T23:59:59', true, true)
    .reverse()
    .toArray()
}

export async function getRidesByDateRange(start: string, end: string): Promise<Ride[]> {
  return db.rides
    .where('riddenAt')
    .between(start, end + 'T23:59:59', true, true)
    .reverse()
    .toArray()
}

export async function deleteRide(id: number): Promise<void> {
  await db.rides.delete(id)
}

export async function getDailyEarnings(weekStart: string, weekEnd: string): Promise<{ date: string; totalCents: number; count: number }[]> {
  const rides = await db.rides
    .where('riddenAt')
    .between(weekStart, weekEnd + 'T23:59:59', true, true)
    .toArray()

  const byDay: Record<string, { totalCents: number; count: number }> = {}
  for (const ride of rides) {
    const day = ride.riddenAt.slice(0, 10)
    if (!byDay[day]) byDay[day] = { totalCents: 0, count: 0 }
    byDay[day].totalCents += ride.priceCents
    byDay[day].count++
  }

  return Object.entries(byDay)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getTopDestinations(
  start: string,
  end: string,
  orderBy: 'earnings' | 'count' = 'earnings',
  limit = 8
): Promise<{ destinationId: number; name: string; color: string; totalCents: number; count: number }[]> {
  const rides = await db.rides
    .where('riddenAt')
    .between(start, end + 'T23:59:59', true, true)
    .toArray()

  const byDest: Record<number, { name: string; color: string; totalCents: number; count: number }> = {}
  for (const ride of rides) {
    if (!byDest[ride.destinationId]) {
      byDest[ride.destinationId] = { name: ride.destinationName, color: ride.destinationColor, totalCents: 0, count: 0 }
    }
    byDest[ride.destinationId].totalCents += ride.priceCents
    byDest[ride.destinationId].count++
  }

  return Object.entries(byDest)
    .map(([id, data]) => ({ destinationId: Number(id), ...data }))
    .sort((a, b) => orderBy === 'earnings' ? b.totalCents - a.totalCents : b.count - a.count)
    .slice(0, limit)
}

export async function getWeekTotal(weekStart: string, weekEnd: string): Promise<number> {
  const rides = await db.rides
    .where('riddenAt')
    .between(weekStart, weekEnd + 'T23:59:59', true, true)
    .toArray()
  return rides.reduce((sum, r) => sum + r.priceCents, 0)
}
