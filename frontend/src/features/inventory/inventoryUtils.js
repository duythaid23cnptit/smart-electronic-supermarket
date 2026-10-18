import { requireExactText } from '../../poc/qr-scanner/scanUtils.js'

export function addInventoryItem(items, nextItem) {
  const serialImei = requireExactText(nextItem.serialImei)
  if (serialImei.trim().length === 0) {
    throw new Error('Serial/IMEI không được để trống.')
  }
  if (items.some((item) => item.serialImei === serialImei)) {
    throw new Error('Serial/IMEI đã có trong phiếu nhập hiện tại.')
  }
  return [...items, { ...nextItem, serialImei }]
}

export function newIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return `inventory-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
