import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { createDuplicateGuard, requireExactText } from '../../poc/qr-scanner/scanUtils.js'
import { describeCameraError } from '../../poc/qr-scanner/cameraErrors.js'
import { createGoodsReceipt, getPurchaseOrder } from './inventoryApi.js'
import { addInventoryItem, newIdempotencyKey } from './inventoryUtils.js'

function apiMessage(error) {
  return error?.response?.data?.message ?? error?.message ?? 'Không thể kết nối backend.'
}

export default function InventoryReceivingPage() {
  const [orderNumber, setOrderNumber] = useState('PO-DEMO-APPROVED')
  const [order, setOrder] = useState(null)
  const [sku, setSku] = useState('')
  const [serialImei, setSerialImei] = useState('00001234567890')
  const [condition, setCondition] = useState('GOOD')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [cameraState, setCameraState] = useState('IDLE')
  const [idempotencyKey, setIdempotencyKey] = useState(() => newIdempotencyKey())

  const scannerRef = useRef(null)
  const duplicateGuardRef = useRef(createDuplicateGuard())

  const invalidateSubmission = useCallback(() => {
    setIdempotencyKey(newIdempotencyKey())
    setReceipt(null)
  }, [])

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (scanner) {
      try {
        if (scanner.isScanning) await scanner.stop()
        scanner.clear()
      } catch {
        // Camera cleanup must not discard entered receipt data.
      }
    }
    setCameraState('STOPPED')
  }, [])

  useEffect(() => () => { void stopCamera() }, [stopCamera])

  async function loadOrder() {
    setLoading(true)
    setMessage(null)
    try {
      const data = await getPurchaseOrder(orderNumber)
      setOrder(data)
      setSku(data.lines[0]?.sku ?? '')
      setItems([])
      invalidateSubmission()
    } catch (error) {
      setOrder(null)
      setMessage({ type: 'error', text: apiMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  async function startCamera() {
    await stopCamera()
    setMessage(null)
    setCameraState('REQUESTING_PERMISSION')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('ERROR')
      setMessage({ type: 'error', text: 'Camera API yêu cầu HTTPS hoặc localhost.' })
      return
    }
    try {
      const scanner = new Html5Qrcode('inventory-qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      })
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          const exact = requireExactText(decodedText)
          if (duplicateGuardRef.current.accept(exact)) {
            setSerialImei(exact)
            setMessage({ type: 'success', text: 'Đã đọc QR. Kiểm tra chuỗi rồi nhấn “Thêm mã”.' })
          }
        },
        () => {},
      )
      setCameraState('SCANNING')
    } catch (error) {
      setCameraState('ERROR')
      setMessage({ type: 'error', text: describeCameraError(error) })
    }
  }

  function addItem(event) {
    event.preventDefault()
    setMessage(null)
    try {
      setItems((current) => addInventoryItem(current, { sku, serialImei, condition }))
      setSerialImei('')
      duplicateGuardRef.current.reset()
      invalidateSubmission()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  function removeItem(index) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
    invalidateSubmission()
  }

  async function submitReceipt() {
    if (!order || items.length === 0) {
      setMessage({ type: 'error', text: 'Hãy tải purchase order và thêm ít nhất một Serial/IMEI.' })
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const data = await createGoodsReceipt({
        idempotencyKey,
        purchaseOrderNumber: order.orderNumber,
        items,
      })
      setReceipt(data)
      setMessage({
        type: 'success',
        text: data.replayed ? 'Yêu cầu lặp: backend trả lại phiếu đã tạo.' : 'Nhập kho thành công.',
      })
    } catch (error) {
      setMessage({ type: 'error', text: apiMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="inventory-page">
      <header className="inventory-hero">
        <p className="inventory-kicker">SASMS · TV4 · WEEK 3</p>
        <h1>Inventory QR Receiving</h1>
        <p>Nhập kho theo purchase order đã duyệt. Serial/IMEI luôn được giữ dưới dạng chuỗi.</p>
      </header>

      {message && <div className={`notice ${message.type}`} role="status">{message.text}</div>}

      <section className="inventory-card">
        <div className="step-heading"><span>01</span><h2>Tải purchase order</h2></div>
        <div className="inline-form">
          <label><span>Mã PO</span><input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} /></label>
          <button type="button" onClick={loadOrder} disabled={loading}>Tải đơn</button>
        </div>
        {order && (
          <div className="order-summary">
            <strong>{order.orderNumber}</strong>
            <span className={order.status === 'APPROVED' ? 'approved' : 'draft'}>{order.status}</span>
            <span>{order.warehouseCode} · {order.warehouseName}</span>
            <ul>{order.lines.map((line) => <li key={line.sku}>{line.sku}: còn {line.remainingQuantity}/{line.approvedQuantity}</li>)}</ul>
          </div>
        )}
      </section>

      <section className="inventory-card">
        <div className="step-heading"><span>02</span><h2>Quét hoặc nhập Serial/IMEI</h2></div>
        <div className="camera-actions">
          <button type="button" onClick={startCamera}>Bật camera</button>
          <button className="button-muted" type="button" onClick={stopCamera}>Dừng camera</button>
          <small>Camera: {cameraState}</small>
        </div>
        <div id="inventory-qr-reader" className="inventory-reader" />
        <form className="item-form" onSubmit={addItem}>
          <label><span>SKU</span><select value={sku} onChange={(event) => setSku(event.target.value)} disabled={!order}>
            <option value="">Chọn SKU</option>
            {order?.lines.map((line) => <option key={line.sku} value={line.sku}>{line.sku} — {line.productName}</option>)}
          </select></label>
          <label className="serial-field"><span>Serial/IMEI chính xác</span><input value={serialImei} onChange={(event) => setSerialImei(event.target.value)} /></label>
          <label><span>Tình trạng</span><select value={condition} onChange={(event) => setCondition(event.target.value)}>
            <option value="GOOD">GOOD — vào tồn khả dụng</option>
            <option value="DEFECTIVE">DEFECTIVE — không vào tồn khả dụng</option>
          </select></label>
          <button type="submit" disabled={!order || !sku}>Thêm mã</button>
        </form>
      </section>

      <section className="inventory-card">
        <div className="step-heading"><span>03</span><h2>Xác nhận phiếu nhập</h2></div>
        {items.length === 0 ? <p className="empty">Chưa có Serial/IMEI.</p> : (
          <div className="unit-list">{items.map((item, index) => (
            <article key={`${item.serialImei}-${index}`}>
              <div><strong>{item.serialImei}</strong><small>{item.sku} · {item.condition}</small></div>
              <button className="button-danger" type="button" onClick={() => removeItem(index)}>Xóa</button>
            </article>
          ))}</div>
        )}
        <button className="submit-receipt" type="button" onClick={submitReceipt} disabled={loading || items.length === 0}>
          {loading ? 'Đang xử lý…' : 'Tạo Goods Receipt'}
        </button>
        {receipt && <div className="receipt-result">
          <strong>{receipt.receiptNumber}</strong>
          <span>Khả dụng: {receipt.availableQuantity}</span>
          <span>Hàng lỗi: {receipt.defectiveQuantity}</span>
          <span>Idempotent replay: {receipt.replayed ? 'YES' : 'NO'}</span>
        </div>}
      </section>
    </main>
  )
}
