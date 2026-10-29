export function formatVnd(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Giá bán không hợp lệ')
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export function cartTotal(cart) {
  if (!Array.isArray(cart)) throw new Error('Giỏ hàng không hợp lệ')
  return cart.reduce((sum, line) => {
    if (!Number.isSafeInteger(line.unitPriceVnd)
      || line.unitPriceVnd < 0
      || !Number.isSafeInteger(sum + line.unitPriceVnd)) {
      throw new Error('Tổng tiền không hợp lệ')
    }
    return sum + line.unitPriceVnd
  }, 0)
}

export function canAddUnit(cart, unit) {
  return Boolean(
    unit?.serialImei
    && unit.status === 'AVAILABLE'
    && unit.quality === 'GOOD'
    && !cart.some((line) => line.serialImei === unit.serialImei)
  )
}

export function saleRequest(cart, customerName, key) {
  if (!Array.isArray(cart) || cart.length === 0 || cart.length > 30) {
    throw new Error('Giỏ hàng cần 1–30 thiết bị')
  }
  return {
    idempotencyKey: key,
    customerName: customerName.trim() || 'Khách lẻ',
    paymentMethod: 'DEMO_CASH',
    lines: cart.map(({ sku, serialImei }) => ({ sku, serialImei })),
  }
}
