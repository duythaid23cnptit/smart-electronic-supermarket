import { requireExactText } from '../../poc/qr-scanner/scanUtils.js'

export const QR_IMAGE_MAX_BYTES = 5 * 1024 * 1024
const QR_IMAGE_TYPES = new Set(['image/png', 'image/jpeg'])

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

export function validateQrImageFile(file) {
  if (!file) throw new Error('Hãy chọn một ảnh QR.')
  if (!QR_IMAGE_TYPES.has(file.type)) {
    throw new Error('Chỉ chấp nhận ảnh QR định dạng PNG hoặc JPG/JPEG.')
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    throw new Error('File ảnh QR rỗng hoặc không hợp lệ.')
  }
  if (file.size > QR_IMAGE_MAX_BYTES) {
    throw new Error('Ảnh QR vượt quá giới hạn 5 MB.')
  }
  return file
}
