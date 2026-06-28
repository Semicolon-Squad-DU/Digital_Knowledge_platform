/**
 * Calculates the overdue fine for a borrow returned `today`, given its due date
 * and the configured per-day rate. Returns 0 if not overdue.
 */
export function calculateOverdueFine(dueDate: Date, today: Date, ratePerDay: number): number {
  if (today <= dueDate) return 0;
  const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysOverdue > 0 ? daysOverdue * ratePerDay : 0;
}
