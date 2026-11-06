import { httpClient } from '../../shared/api/httpClient.js'

export async function getPurchaseOrder(orderNumber) {
  const response = await httpClient.get(`/inventory/purchase-orders/${encodeURIComponent(orderNumber)}`)
  return response.data
}

export async function createGoodsReceipt(payload) {
  const response = await httpClient.post('/inventory/goods-receipts', payload)
  return response.data
}
