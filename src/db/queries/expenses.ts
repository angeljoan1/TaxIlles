import { db, type Expense } from '../schema'

export async function addExpense(expense: Omit<Expense, 'id'>): Promise<number> {
  return db.expenses.add(expense)
}

export async function getExpenses(limit = 50): Promise<Expense[]> {
  return db.expenses.orderBy('date').reverse().limit(limit).toArray()
}

export async function getExpensesForPeriod(start: string, end: string): Promise<Expense[]> {
  return db.expenses
    .where('date')
    .between(start, end, true, true)
    .toArray()
}

export async function deleteExpense(id: number): Promise<void> {
  await db.expenses.delete(id)
}

export async function getTotalExpenses(start: string, end: string): Promise<number> {
  const expenses = await getExpensesForPeriod(start, end)
  return expenses.reduce((sum, e) => sum + e.amountCents, 0)
}
