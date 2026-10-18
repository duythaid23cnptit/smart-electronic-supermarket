import assert from 'node:assert/strict'
import test from 'node:test'
import { createDuplicateGuard, isWebUrl, requireExactText } from './scanUtils.js'

test('preserves leading zeroes and whitespace exactly', () => {
  assert.equal(requireExactText('00001234567890'), '00001234567890')
  assert.equal(requireExactText(' 0007\n'), ' 0007\n')
})

test('rejects a repeated callback until the guard is reset', () => {
  const guard = createDuplicateGuard()

  assert.equal(guard.accept('0001'), true)
  assert.equal(guard.accept('0001'), false)
  assert.equal(guard.accept('0002'), true)
  guard.reset()
  assert.equal(guard.accept('0002'), true)
})

test('detects web URLs without opening or transforming them', () => {
  assert.equal(isWebUrl('https://example.com/qr-test?code=000123'), true)
  assert.equal(isWebUrl('javascript:alert(1)'), false)
  assert.equal(isWebUrl('00001234567890'), false)
})
