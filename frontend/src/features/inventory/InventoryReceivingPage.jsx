import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import {
  createDuplicateGuard,
  createOperationGuard,
  isWebUrl,
  requireExactText,
  summarizeDurations,
} from '../../poc/qr-scanner/scanUtils.js'
import { describeCameraError } from '../../poc/qr-scanner/cameraErrors.js'
import { createGoodsReceipt, getPurchaseOrder } from './inventoryApi.js'
import { addInventoryItem, newIdempotencyKey, validateQrImageFile } from './inventoryUtils.js'

const IMAGE_BENCHMARK_RUNS = 20
const BENCHMARK_SAMPLE = '/qr-samples/01-leading-zeroes.png'
const BENCHMARK_EXPECTED_VALUE = '00001234567890'

function apiMessage(error) {
  return error?.response?.data?.message ?? error?.message ?? 'Không thể kết nối backend.'
}

function formatMs(value) {
  return `${value.toFixed(1)} ms`
}

export default function InventoryReceivingPage() {
  const [orderNumber, setOrderNumber] = useState('PO-DEMO-APPROVED')
  const [order, setOrder] = useState(null)
  const [sku, setSku] = useState('')
  const [serialImei, setSerialImei] = useState('00001234567890')
  const [condition, setCondition] = useState('GOOD')
  const [items, setItems] = useState([])
  const [orderLoading, setOrderLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [cameraState, setCameraState] = useState('IDLE')
  const [cameraLatencyMs, setCameraLatencyMs] = useState(null)
  const [imageMeasurement, setImageMeasurement] = useState(null)
  const [benchmark, setBenchmark] = useState(null)
  const [apiRequestMs, setApiRequestMs] = useState(null)
  const [idempotencyKey, setIdempotencyKey] = useState(() => newIdempotencyKey())

  const scannerRef = useRef(null)
  const duplicateGuardRef = useRef(createDuplicateGuard())
  const scannerOperationRef = useRef(createOperationGuard())
  const submitOperationRef = useRef(createOperationGuard())
  const cameraStartedAtRef = useRef(null)
  const mountedRef = useRef(true)
  const autoBenchmarkStartedRef = useRef(false)

  const invalidateSubmission = useCallback(() => {
    setIdempotencyKey(newIdempotencyKey())
    setReceipt(null)
    setApiRequestMs(null)
  }, [])

  const clearScanner = useCallback(async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (!scanner) return
    try {
      if (scanner.isScanning) await scanner.stop()
      scanner.clear()
    } catch {
      // Cleanup must not discard entered receipt data.
    }
  }, [])

  const stopCamera = useCallback(async (updateState = true) => {
    await clearScanner()
    cameraStartedAtRef.current = null
    scannerOperationRef.current.finish('camera')
    if (updateState && mountedRef.current) setCameraState('STOPPED')
  }, [clearScanner])

  const acceptScannedSerial = useCallback((decodedText, source) => {
    if (!mountedRef.current) return false
    const exact = requireExactText(decodedText)
    if (!duplicateGuardRef.current.accept(exact)) {
      setMessage({ type: 'error', text: 'Đã chặn callback QR trùng. Dữ liệu hiện tại không bị thay đổi.' })
      return false
    }
    setSerialImei(exact)
    const urlWarning = isWebUrl(exact)
      ? ' Chuỗi giống URL nhưng chỉ được điền dưới dạng text; ứng dụng không tự mở liên kết.'
      : ''
    setMessage({
      type: 'success',
      text: `Đã đọc QR từ ${source}. Kiểm tra chuỗi rồi nhấn “Thêm mã”.${urlWarning}`,
    })
    return true
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      void stopCamera(false)
    }
  }, [stopCamera])

  async function loadOrder() {
    if (orderLoading || submitting) return
    setOrderLoading(true)
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
      setOrderLoading(false)
    }
  }

  async function startCamera() {
    await stopCamera(false)
    if (!scannerOperationRef.current.tryStart('camera')) return
    setMessage(null)
    setCameraLatencyMs(null)
    setCameraState('REQUESTING_PERMISSION')
    if (!navigator.mediaDevices?.getUserMedia) {
      scannerOperationRef.current.finish('camera')
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
      cameraStartedAtRef.current = performance.now()
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (acceptScannedSerial(decodedText, 'camera') && cameraStartedAtRef.current !== null) {
            setCameraLatencyMs(performance.now() - cameraStartedAtRef.current)
            cameraStartedAtRef.current = null
          }
        },
        () => {},
      )
      setCameraState('SCANNING')
    } catch (error) {
      cameraStartedAtRef.current = null
      scannerOperationRef.current.finish('camera')
      setCameraState('ERROR')
      setMessage({ type: 'error', text: describeCameraError(error) })
    }
  }

  async function decodeImageFile(file) {
    validateQrImageFile(file)
    await stopCamera(false)
    if (!scannerOperationRef.current.tryStart('image-file')) {
      throw new Error('Scanner đang xử lý một tác vụ khác. Hãy thử lại.')
    }
    setMessage(null)
    setCameraState('DECODING_IMAGE')
    const scanner = new Html5Qrcode('inventory-qr-reader', {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    })
    scannerRef.current = scanner
    const startedAt = performance.now()
    try {
      const decodedText = await scanner.scanFile(file, false)
      const elapsedMs = performance.now() - startedAt
      setImageMeasurement({ elapsedMs, fileName: file.name })
      acceptScannedSerial(decodedText, 'ảnh cục bộ')
      setCameraState('IMAGE_DECODED')
    } finally {
      await clearScanner()
      scannerOperationRef.current.finish('image-file')
    }
  }

  async function selectQrImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    try {
      await decodeImageFile(file)
    } catch (error) {
      if (mountedRef.current) {
        setCameraState('ERROR')
        setMessage({ type: 'error', text: `Không thể đọc ảnh QR: ${error.message}` })
      }
    }
  }

  const runImageBenchmark = useCallback(async () => {
    await stopCamera(false)
    if (!scannerOperationRef.current.tryStart('image-benchmark')) return
    setBenchmark(null)
    setMessage(null)
    setCameraState('BENCHMARKING_IMAGE')
    const durations = []
    let failCount = 0
    const scanner = new Html5Qrcode('inventory-qr-reader', {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    })
    scannerRef.current = scanner

    try {
      const response = await fetch(BENCHMARK_SAMPLE)
      if (!response.ok) throw new Error(`Không tải được ảnh mẫu (${response.status}).`)
      const blob = await response.blob()
      const file = new File([blob], '01-leading-zeroes.png', { type: 'image/png' })
      validateQrImageFile(file)
      for (let index = 0; index < IMAGE_BENCHMARK_RUNS; index += 1) {
        const startedAt = performance.now()
        try {
          const decodedText = requireExactText(await scanner.scanFile(file, false))
          const elapsedMs = performance.now() - startedAt
          if (decodedText === BENCHMARK_EXPECTED_VALUE) durations.push(elapsedMs)
          else failCount += 1
        } catch {
          failCount += 1
        }
      }
      const summary = durations.length > 0 ? summarizeDurations(durations) : null
      if (mountedRef.current) {
        setBenchmark({ summary, failCount, requestedRuns: IMAGE_BENCHMARK_RUNS })
        setMessage({
          type: failCount === 0 ? 'success' : 'error',
          text: `Benchmark ảnh hoàn tất: ${durations.length}/${IMAGE_BENCHMARK_RUNS} lần giải mã đúng.`,
        })
        setCameraState('BENCHMARK_COMPLETE')
      }
    } catch (error) {
      if (mountedRef.current) {
        setCameraState('ERROR')
        setMessage({ type: 'error', text: `Benchmark ảnh thất bại: ${error.message}` })
      }
    } finally {
      await clearScanner()
      scannerOperationRef.current.finish('image-benchmark')
    }
  }, [clearScanner, stopCamera])

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('benchmark') !== '1') return undefined
    const timer = window.setTimeout(() => {
      if (autoBenchmarkStartedRef.current) return
      autoBenchmarkStartedRef.current = true
      void runImageBenchmark()
    }, 50)
    return () => window.clearTimeout(timer)
  }, [runImageBenchmark])

  function addItem(event) {
    event.preventDefault()
    setMessage(null)
    try {
      const nextItems = addInventoryItem(items, { sku, serialImei, condition })
      setItems(nextItems)
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
    if (!submitOperationRef.current.tryStart('submit-receipt')) return
    if (!order || items.length === 0) {
      submitOperationRef.current.finish('submit-receipt')
      setMessage({ type: 'error', text: 'Hãy tải purchase order và thêm ít nhất một Serial/IMEI.' })
      return
    }
    setSubmitting(true)
    setMessage(null)
    const startedAt = performance.now()
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
      setApiRequestMs(performance.now() - startedAt)
      setSubmitting(false)
      submitOperationRef.current.finish('submit-receipt')
    }
  }

  const scannerBusy = cameraState === 'REQUESTING_PERMISSION'
    || cameraState === 'SCANNING'
    || cameraState === 'DECODING_IMAGE'
    || cameraState === 'BENCHMARKING_IMAGE'

  return (
    <main className="inventory-page">
      <header className="inventory-hero">
        <p className="inventory-kicker">SASMS · TV4 · WEEK 4 RC1</p>
        <h1>Inventory QR Receiving</h1>
        <p>Nhập kho theo purchase order đã duyệt. Serial/IMEI luôn được giữ dưới dạng chuỗi.</p>
      </header>
      {message && <div className={`notice ${message.type}`} role="status">{message.text}</div>}
      <section className="inventory-card">
        <div className="step-heading"><span>01</span><h2>Tải purchase order</h2></div>
        <div className="inline-form">
          <label><span>Mã PO</span><input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} /></label>
          <button type="button" onClick={loadOrder} disabled={orderLoading || submitting}>{orderLoading ? 'Đang tải…' : 'Tải đơn'}</button>
        </div>
        {order && <div className="order-summary">
          <strong>{order.orderNumber}</strong>
          <span className={order.status === 'APPROVED' ? 'approved' : 'draft'}>{order.status}</span>
          <span>{order.warehouseCode} · {order.warehouseName}</span>
          <ul>{order.lines.map((line) => <li key={line.sku}>{line.sku}: còn {line.remainingQuantity}/{line.approvedQuantity}</li>)}</ul>
        </div>}
      </section>
      <section className="inventory-card">
        <div className="step-heading"><span>02</span><h2>Quét hoặc nhập Serial/IMEI</h2></div>
        <div className="camera-actions">
          <button type="button" onClick={startCamera} disabled={scannerBusy}>Bật camera</button>
          <button className="button-muted" type="button" onClick={() => stopCamera()} disabled={!scannerBusy || cameraState === 'DECODING_IMAGE' || cameraState === 'BENCHMARKING_IMAGE'}>Dừng camera</button>
          <label className="file-button"><span>Chọn ảnh QR</span><input type="file" accept="image/png,image/jpeg" onChange={selectQrImage} disabled={scannerBusy} /></label>
          <small>Scanner: {cameraState}</small>
        </div>
        <p className="scanner-help">Ảnh PNG/JPG tối đa 5 MB được giải mã ngay trong trình duyệt và không được tải lên server.</p>
        <div id="inventory-qr-reader" className="inventory-reader" />
        <div className="measurement-grid" aria-live="polite">
          <span>CAMERA_SCAN_LATENCY: {cameraLatencyMs === null ? 'NOT RUN' : formatMs(cameraLatencyMs)}</span>
          <span>IMAGE_FILE_DECODE: {imageMeasurement === null ? 'NOT RUN' : formatMs(imageMeasurement.elapsedMs)}</span>
          <span>API_REQUEST_MS: {apiRequestMs === null ? 'NOT RUN' : formatMs(apiRequestMs)}</span>
        </div>
        <div className="benchmark-panel">
          <button className="button-muted" type="button" onClick={runImageBenchmark} disabled={scannerBusy}>Benchmark ảnh mẫu ×20</button>
          {benchmark?.summary && <span data-testid="benchmark-summary">n={benchmark.summary.n}; mean={formatMs(benchmark.summary.mean)}; median={formatMs(benchmark.summary.median)}; p95={formatMs(benchmark.summary.p95)}; min={formatMs(benchmark.summary.min)}; max={formatMs(benchmark.summary.max)}; fail={benchmark.failCount}</span>}
          {benchmark && !benchmark.summary && <span data-testid="benchmark-summary">n=0; fail={benchmark.failCount}</span>}
        </div>
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
        {items.length === 0 ? <p className="empty">Chưa có Serial/IMEI.</p> : <div className="unit-list">{items.map((item, index) => <article key={`${item.serialImei}-${index}`}>
          <div><strong>{item.serialImei}</strong><small>{item.sku} · {item.condition}</small></div>
          <button className="button-danger" type="button" onClick={() => removeItem(index)} disabled={submitting}>Xóa</button>
        </article>)}</div>}
        <button className="submit-receipt" type="button" onClick={submitReceipt} disabled={submitting || items.length === 0}>{submitting ? 'Đang xử lý…' : 'Tạo Goods Receipt'}</button>
        {receipt && <div className="receipt-result">
          <strong>{receipt.receiptNumber}</strong><span>Khả dụng: {receipt.availableQuantity}</span><span>Hàng lỗi: {receipt.defectiveQuantity}</span><span>Idempotent replay: {receipt.replayed ? 'YES' : 'NO'}</span>
        </div>}
      </section>
    </main>
  )
}
