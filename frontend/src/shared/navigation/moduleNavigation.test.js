import assert from 'node:assert/strict'
import test from 'node:test'
import { getNavigationGuard, NAVIGATION_GUARD } from './moduleNavigation.js'

test('allows navigation when the page has no protected state', () => {
  assert.equal(getNavigationGuard({
    isBusy: false,
    hasPendingOutcome: false,
    hasUnsavedWork: false,
  }), NAVIGATION_GUARD.CLEAR)
})

test('requires confirmation for unsaved work or an uncertain request', () => {
  assert.equal(getNavigationGuard({
    isBusy: false,
    hasPendingOutcome: false,
    hasUnsavedWork: true,
  }), NAVIGATION_GUARD.UNSAVED_WORK)
  assert.equal(getNavigationGuard({
    isBusy: false,
    hasPendingOutcome: true,
    hasUnsavedWork: true,
  }), NAVIGATION_GUARD.PENDING_OUTCOME)
})

test('blocks navigation while a request is running', () => {
  assert.equal(getNavigationGuard({
    isBusy: true,
    hasPendingOutcome: true,
    hasUnsavedWork: true,
  }), NAVIGATION_GUARD.BUSY)
})
