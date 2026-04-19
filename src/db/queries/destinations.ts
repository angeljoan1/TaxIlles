import { db, type Destination } from '../schema'

export async function getActiveDestinations(): Promise<Destination[]> {
  return db.destinations.where('isActive').equals(1).sortBy('name')
}

export async function getAllDestinations(): Promise<Destination[]> {
  return db.destinations.orderBy('name').toArray()
}

export async function addDestination(name: string, color: string): Promise<number> {
  return db.destinations.add({ name: name.trim(), color, isActive: true, createdAt: new Date().toISOString() })
}

export async function updateDestination(id: number, data: Partial<Destination>): Promise<void> {
  await db.destinations.update(id, data)
}

export async function toggleDestination(id: number, isActive: boolean): Promise<void> {
  await db.destinations.update(id, { isActive })
}

export async function deleteDestination(id: number): Promise<void> {
  await db.destinations.delete(id)
}
