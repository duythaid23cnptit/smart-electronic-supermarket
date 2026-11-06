# Inventory API Examples

Base URL: `http://localhost:8080/api/inventory`

## Read purchase order

```http
GET /api/inventory/purchase-orders/PO-DEMO-APPROVED
```

Example response:

```json
{
  "orderNumber": "PO-DEMO-APPROVED",
  "status": "APPROVED",
  "warehouseCode": "WH-HCM-01",
  "warehouseName": "Kho demo TP.HCM",
  "lines": [
    {
      "sku": "TV-55-DEMO",
      "productName": "Smart TV 55 inch Demo",
      "approvedQuantity": 3,
      "receivedQuantity": 0,
      "remainingQuantity": 3
    }
  ]
}
```

## Create goods receipt

The idempotency key must be stable when retrying exactly the same request.

```http
POST /api/inventory/goods-receipts
Content-Type: application/json

{
  "idempotencyKey": "an-demo-001",
  "purchaseOrderNumber": "PO-DEMO-APPROVED",
  "items": [
    {
      "sku": "PHONE-DEMO",
      "serialImei": "00001234567890",
      "condition": "GOOD"
    },
    {
      "sku": "TV-55-DEMO",
      "serialImei": "00001234567891",
      "condition": "DEFECTIVE"
    }
  ]
}
```

First response: HTTP `201 Created`.

```json
{
  "receiptNumber": "GR-<generated-uuid>",
  "idempotencyKey": "an-demo-001",
  "purchaseOrderNumber": "PO-DEMO-APPROVED",
  "warehouseCode": "WH-HCM-01",
  "createdAt": "<generated-instant>",
  "replayed": false,
  "availableQuantity": 1,
  "defectiveQuantity": 1,
  "items": [
    {
      "sku": "PHONE-DEMO",
      "serialImei": "00001234567890",
      "condition": "GOOD",
      "inventoryStatus": "AVAILABLE"
    },
    {
      "sku": "TV-55-DEMO",
      "serialImei": "00001234567891",
      "condition": "DEFECTIVE",
      "inventoryStatus": "DEFECTIVE"
    }
  ]
}
```

Sending the identical request again returns HTTP `200 OK`, the same receipt number and
`"replayed": true`. Sending different content with `an-demo-001` returns HTTP `409 Conflict`.

## Error shape

```json
{
  "timestamp": "<generated-instant>",
  "status": 409,
  "error": "Conflict",
  "message": "Purchase order chưa được duyệt nên không thể nhập kho.",
  "path": "/api/inventory/goods-receipts"
}
```
