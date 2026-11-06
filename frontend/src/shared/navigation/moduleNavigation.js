export const NAVIGATION_GUARD = Object.freeze({
  CLEAR: 'CLEAR',
  BUSY: 'BUSY',
  PENDING_OUTCOME: 'PENDING_OUTCOME',
  UNSAVED_WORK: 'UNSAVED_WORK',
})

export function getNavigationGuard({ isBusy, hasPendingOutcome, hasUnsavedWork }) {
  if (isBusy) return NAVIGATION_GUARD.BUSY
  if (hasPendingOutcome) return NAVIGATION_GUARD.PENDING_OUTCOME
  if (hasUnsavedWork) return NAVIGATION_GUARD.UNSAVED_WORK
  return NAVIGATION_GUARD.CLEAR
}
