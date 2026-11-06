import assert from 'node:assert/strict'
import test from 'node:test'
import { addInventoryItem, QR_IMAGE_MAX_BYTES, validateQrImageFile } from './inventoryUtils.js'

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

test('accepts PNG/JPEG files within the 5 MB limit', () => {
  const png = { type: 'image/png', size: 1024 }
  assert.equal(validateQrImageFile(png), png)
  assert.doesNotThrow(() => validateQrImageFile({ type: 'image/jpeg', size: QR_IMAGE_MAX_BYTES }))
})

test('rejects unsupported, empty and oversized QR image files', () => {
  assert.throws(() => validateQrImageFile({ type: 'image/gif', size: 10 }), /PNG hoặc JPG/)
  assert.throws(() => validateQrImageFile({ type: 'image/png', size: 0 }), /rỗng/)
  assert.throws(() => validateQrImageFile({ type: 'image/png', size: QR_IMAGE_MAX_BYTES + 1 }), /5 MB/)
})
