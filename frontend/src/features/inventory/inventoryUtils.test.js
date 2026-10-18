import assert from 'node:assert/strict'
import test from 'node:test'
import { addInventoryItem } from './inventoryUtils.js'

test('preserves leading zeroes when adding a Serial/IMEI', () => {
  const items = addInventoryItem([], { sku: 'PHONE-01', serialImei: '0000123456', condition: 'GOOD' })
  assert.equal(items[0].serialImei, '0000123456')
})

test('rejects exact duplicate Serial/IMEI in the current receipt', () => {
  const existing = [{ sku: 'PHONE-01', serialImei: '0001', condition: 'GOOD' }]
  assert.throws(
    () => addInventoryItem(existing, { sku: 'PHONE-01', serialImei: '0001', condition: 'GOOD' }),
    /đã có/,
  )
})
