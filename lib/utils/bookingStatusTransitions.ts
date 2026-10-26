// Mirrors Gentle.Book.API's AdminService.IsValidStatusTransition exactly. Shared by
// app/admin/bookings/page.tsx and app/admin/calendar/page.tsx so both status-change UIs enforce
// the same rules — Completed and NoShow are true end-states server-side, and offering every
// status regardless of the booking's current one made a rejected transition look like it
// silently failed to save instead of being disallowed up front.
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  Pending: ["Pending", "Confirmed", "Cancelled"],
  Confirmed: ["Confirmed", "Completed", "Cancelled", "NoShow"],
  Cancelled: ["Cancelled", "Confirmed"],
  Completed: ["Completed"],
  NoShow: ["NoShow"],
};

export function isStatusTransitionAllowed(currentStatus: string, targetStatus: string): boolean {
  return (VALID_STATUS_TRANSITIONS[currentStatus] ?? [targetStatus]).includes(targetStatus);
}
