import { httpClient } from '../../shared/api/httpClient.js'

export async function getPosStatus() {
  const response = await httpClient.get('/pos/status')
  return response.data
}

export async function listPosProducts() {
  const response = await httpClient.get('/pos/products')
  return response.data
}

export async function listAvailableUnits(sku) {
  const response = await httpClient.get(`/pos/products/${encodeURIComponent(sku)}/units`)
  return response.data
}

export async function completeDemoCashSale(request) {
  const response = await httpClient.post('/pos/sales', request, { timeout: 15000 })
  return response.data
}
