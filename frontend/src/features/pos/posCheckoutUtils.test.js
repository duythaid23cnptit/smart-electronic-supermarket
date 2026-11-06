import assert from 'node:assert/strict'
import test from 'node:test'
import { canAddUnit, cartTotal, saleRequest } from './posCheckoutUtils.js'

test('calculates cart total and rejects invalid prices', () => {
  assert.equal(cartTotal([{ unitPriceVnd: 100 }, { unitPriceVnd: 200 }]), 300)
  assert.throws(() => cartTotal([{ unitPriceVnd: -1 }]))
  assert.throws(() => cartTotal([{ unitPriceVnd: Number.MAX_SAFE_INTEGER }, { unitPriceVnd: 1 }]))
})

test('preserves leading zeroes and defaults guest customer', () => {
  const request = saleRequest(
    [{ sku: 'TV-55-DEMO', serialImei: '00001234567890' }],
    '',
    'demo-req-00001',
  )
  assert.equal(request.lines[0].serialImei, '00001234567890')
  assert.equal(request.customerName, 'Khách lẻ')
  assert.equal(request.paymentMethod, 'DEMO_CASH')
})

test('only GOOD AVAILABLE non-duplicate units can enter cart', () => {
  assert.equal(canAddUnit([], { serialImei: '0001', status: 'SOLD', quality: 'GOOD' }), false)
  assert.equal(canAddUnit([], { serialImei: '0001', status: 'AVAILABLE', quality: 'DEFECTIVE' }), false)
  assert.equal(
    canAddUnit([{ serialImei: '0001' }], { serialImei: '0001', status: 'AVAILABLE', quality: 'GOOD' }),
    false,
  )
  assert.equal(canAddUnit([], { serialImei: '0001', status: 'AVAILABLE', quality: 'GOOD' }), true)
})

test('rejects empty or oversized carts', () => {
  assert.throws(() => saleRequest([], '', 'demo-req-00002'))
  const oversized = Array.from({ length: 31 }, (_, index) => ({
    sku: 'TV-55-DEMO',
    serialImei: String(index),
  }))
  assert.throws(() => saleRequest(oversized, '', 'demo-req-00003'))
})
