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
import ModuleNav from '../../shared/components/ModuleNav.jsx'
import { createGoodsReceipt, getPurchaseOrder } from './inventoryApi.js'
import { addInventoryItem, newIdempotencyKey, validateQrImageFile } from './inventoryUtils.js'

const IMAGE_BENCHMARK_RUNS = 20
const BENCHMARK_SAMPLE = '/qr-samples/01-leading-zeroes.png'
const BENCHMARK_EXPECTED_VALUE = '00001234567890'
const SCANNER_STATE_LABELS = {
  IDLE: 'Sẵn sàng',
  REQUESTING_PERMISSION: 'Đang xin quyền camera',
  SCANNING: 'Đang quét camera',
  STOPPED: 'Đã dừng camera',
  ERROR: 'Có lỗi',
  DECODING_IMAGE: 'Đang đọc ảnh',
  IMAGE_DECODED: 'Đã đọc ảnh',
  BENCHMARKING_IMAGE: 'Đang benchmark',
  BENCHMARK_COMPLETE: 'Benchmark hoàn tất',
}

function apiMessage(error) {
  return error?.response?.data?.message ?? error?.message ?? 'Không thể kết nối backend.'
}

function formatMs(value) {
  return `${value.toFixed(1)} ms`
}

function formatDateTime(value) {
  if (!value) return 'Không có dữ liệu'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(parsed)
}

export default function InventoryReceivingPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [order, setOrder] = useState(null)
  const [sku, setSku] = useState('')
  const [serialImei, setSerialImei] = useState('')
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
  const [submissionOutcomeUncertain, setSubmissionOutcomeUncertain] = useState(false)

  const scannerRef = useRef(null)
  const duplicateGuardRef = useRef(createDuplicateGuard())
  const scannerOperationRef = useRef(createOperationGuard())
  const submitOperationRef = useRef(createOperationGuard())
  const cameraStartedAtRef = useRef(null)
  const mountedRef = useRef(true)
  const autoBenchmarkStartedRef = useRef(false)
  const serialInputRef = useRef(null)

  const invalidateSubmission = useCallback(() => {
    setIdempotencyKey(newIdempotencyKey())
    setReceipt(null)
    setApiRequestMs(null)
    setSubmissionOutcomeUncertain(false)
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

  async function loadOrder(event) {
    event?.preventDefault()
    if (orderLoading || submitting) return
    if (items.length > 0 && !receipt && !window.confirm(
      'Danh sách chờ nhập hiện chưa được lưu. Tải PO khác sẽ xóa danh sách này. Bạn vẫn muốn tiếp tục?',
    )) {
      setMessage({ type: 'info', text: 'Đã giữ nguyên PO và danh sách chờ nhập hiện tại.' })
      return
    }
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
      setMessage({ type: 'success', text: `Đã thêm Serial/IMEI ${serialImei} vào danh sách chờ nhập.` })
      window.requestAnimationFrame(() => serialInputRef.current?.focus())
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
    if (receipt) {
      submitOperationRef.current.finish('submit-receipt')
      return
    }
    if (!order || items.length === 0) {
      submitOperationRef.current.finish('submit-receipt')
      setMessage({ type: 'error', text: 'Hãy tải đơn mua hàng (PO) và thêm ít nhất một Serial/IMEI.' })
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
      setSubmissionOutcomeUncertain(false)
      setMessage({
        type: 'success',
        text: data.replayed ? 'Yêu cầu lặp: backend trả lại phiếu đã tạo.' : 'Nhập kho thành công.',
      })
    } catch (error) {
      setSubmissionOutcomeUncertain(!error?.response)
      setMessage({ type: 'error', text: apiMessage(error) })
    } finally {
      setApiRequestMs(performance.now() - startedAt)
      setSubmitting(false)
      submitOperationRef.current.finish('submit-receipt')
    }
  }

  async function startNewReceipt() {
    if (submitting || orderLoading) return
    await stopCamera(false)
    const currentOrderNumber = order?.orderNumber ?? orderNumber
    setItems([])
    setSerialImei('')
    duplicateGuardRef.current.reset()
    invalidateSubmission()
    setMessage(null)

    if (!currentOrderNumber) {
      setOrder(null)
      setSku('')
      window.requestAnimationFrame(() => serialInputRef.current?.focus())
      return
    }

    setOrderLoading(true)
    try {
      const data = await getPurchaseOrder(currentOrderNumber)
      setOrder(data)
      setOrderNumber(data.orderNumber)
      setSku(data.lines[0]?.sku ?? '')
      setMessage({ type: 'info', text: 'Đã bắt đầu phiếu mới và cập nhật lại số lượng còn nhận của PO.' })
    } catch (error) {
      setOrder(null)
      setSku('')
      setMessage({ type: 'error', text: apiMessage(error) })
    } finally {
      setOrderLoading(false)
      window.requestAnimationFrame(() => serialInputRef.current?.focus())
    }
  }

  const scannerBusy = cameraState === 'REQUESTING_PERMISSION'
    || cameraState === 'SCANNING'
    || cameraState === 'DECODING_IMAGE'
    || cameraState === 'BENCHMARKING_IMAGE'
  const goodCount = items.filter((item) => item.condition === 'GOOD').length
  const defectiveCount = items.length - goodCount
  const orderApproved = order?.status === 'APPROVED'

  return (
    <main className="sasms-design-root sasms-module-shell inventory-page">
      <ModuleNav
        activeModule="inventory"
        hasUnsavedWork={items.length > 0 && !receipt}
        hasPendingOutcome={submissionOutcomeUncertain}
        isBusy={orderLoading || submitting}
      />
      <header className="inventory-hero">
        <div className="inventory-hero-title">
          <span className="inventory-hero-icon" aria-hidden="true">▣</span>
          <div>
            <p className="inventory-kicker">MODULE 1 · KHO</p>
            <h1>Kho — Nhập thiết bị</h1>
            <p>Nhận hàng theo đơn mua đã duyệt, quản lý chính xác từng Serial/IMEI.</p>
          </div>
        </div>
        <div className="inventory-workflow" aria-label="Quy trình nhập kho">
          <span>PO</span><span aria-hidden="true">→</span><span>SKU</span><span aria-hidden="true">→</span>
          <span>Serial/QR</span><span aria-hidden="true">→</span><span>Phiếu nhập kho</span>
        </div>
      </header>
      {message && (
        <div className={`inventory-notice ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>
          {message.text}
        </div>
      )}

      <div className="inventory-v3-layout">
        <div className="inventory-v3-main">

      <section className="inventory-card">
        <div className="inventory-section-heading">
          <span className="inventory-step">01</span>
          <div><h2>Chọn đơn mua hàng</h2><p>Tải đơn để kiểm tra trạng thái duyệt và số lượng còn nhận.</p></div>
        </div>
        <form className="inventory-po-form" onSubmit={loadOrder}>
          <label className="inventory-field" htmlFor="inventory-po-number">
            <span>Mã đơn mua (PO)</span>
            <input
              id="inventory-po-number"
              value={orderNumber}
              maxLength={80}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="Nhập mã PO"
              autoComplete="off"
            />
          </label>
          <button className="inventory-action inventory-action-primary" type="submit" disabled={orderLoading || submitting || !orderNumber.trim()}>
            {orderLoading ? 'Đang tải…' : 'Tải đơn'}
          </button>
        </form>

        {order ? (
          <div className="inventory-order-summary">
            <div className="inventory-order-header">
              <div><span>Đơn mua hàng</span><strong>{order.orderNumber}</strong></div>
              <div><span>Kho nhận</span><strong>{order.warehouseCode} · {order.warehouseName}</strong></div>
              <span className={`inventory-status-badge ${orderApproved ? 'is-approved' : 'is-draft'}`}>{order.status}</span>
            </div>
            {!orderApproved && <p className="inventory-inline-warning">PO chưa được duyệt. Hệ thống không cho phép tạo phiếu nhập kho.</p>}
            <div className="inventory-table-wrap">
              <table className="inventory-table">
                <thead><tr><th>SKU</th><th>Sản phẩm</th><th className="is-number">Được duyệt</th><th className="is-number">Đã nhận</th><th className="is-number">Còn lại</th></tr></thead>
                <tbody>{order.lines.map((line) => (
                  <tr key={line.sku}>
                    <td><strong>{line.sku}</strong></td><td>{line.productName}</td>
                    <td className="is-number">{line.approvedQuantity}</td><td className="is-number">{line.receivedQuantity}</td>
                    <td className="is-number"><strong>{line.remainingQuantity}</strong></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="inventory-empty-state"><strong>Chưa tải đơn mua hàng</strong><span>Nhập mã PO rồi nhấn Enter hoặc chọn “Tải đơn”.</span></div>
        )}
      </section>

      <section className="inventory-card">
        <div className="inventory-section-heading">
          <span className="inventory-step">02</span>
          <div><h2>Nhập thiết bị</h2><p>Chọn SKU, nhập hoặc quét Serial/IMEI, sau đó xác nhận tình trạng thực nhận.</p></div>
        </div>
        <div className="inventory-entry-layout">
          <form className="inventory-item-form" onSubmit={addItem}>
            <label className="inventory-field" htmlFor="inventory-sku">
              <span>SKU</span>
              <select id="inventory-sku" value={sku} onChange={(event) => setSku(event.target.value)} disabled={!orderApproved || Boolean(receipt)}>
                <option value="">Chọn SKU</option>
                {order?.lines.map((line) => <option key={line.sku} value={line.sku}>{line.sku} — {line.productName}</option>)}
              </select>
            </label>
            <label className="inventory-field inventory-serial-field" htmlFor="inventory-serial">
              <span>Serial/IMEI</span>
              <input
                ref={serialInputRef}
                id="inventory-serial"
                value={serialImei}
                maxLength={160}
                required
                autoComplete="off"
                spellCheck="false"
                onChange={(event) => setSerialImei(event.target.value)}
                disabled={!orderApproved || Boolean(receipt)}
                placeholder="Nhập chính xác chuỗi Serial/IMEI"
              />
              <small>Giữ nguyên số 0 đầu; không tự mở chuỗi URL.</small>
            </label>
            <label className="inventory-field" htmlFor="inventory-condition">
              <span>Tình trạng</span>
              <select id="inventory-condition" value={condition} onChange={(event) => setCondition(event.target.value)} disabled={!orderApproved || Boolean(receipt)}>
                <option value="GOOD">GOOD — vào tồn khả dụng</option>
                <option value="DEFECTIVE">DEFECTIVE — không vào tồn khả dụng</option>
              </select>
            </label>
            <button className="inventory-action inventory-action-primary inventory-add-action" type="submit" disabled={!orderApproved || !sku || !serialImei || Boolean(receipt)}>
              Thêm vào danh sách
            </button>
          </form>

          <aside className="inventory-scan-panel" aria-label="Quét QR">
            <div className="inventory-scan-header"><div><strong>Quét QR</strong><span>Camera hoặc ảnh cục bộ</span></div><span className="inventory-scanner-state">{SCANNER_STATE_LABELS[cameraState] ?? cameraState}</span></div>
            <div className="inventory-camera-actions">
              <button className="inventory-action inventory-action-secondary" type="button" onClick={startCamera} disabled={scannerBusy || !orderApproved || Boolean(receipt)}>Bật camera</button>
              <button className="inventory-action inventory-action-quiet" type="button" onClick={() => stopCamera()} disabled={!scannerBusy || cameraState === 'DECODING_IMAGE' || cameraState === 'BENCHMARKING_IMAGE'}>Dừng</button>
              <label className={`inventory-file-button${scannerBusy || !orderApproved || receipt ? ' is-disabled' : ''}`}>
                <span>Chọn ảnh QR</span>
                <input type="file" accept="image/png,image/jpeg" onChange={selectQrImage} disabled={scannerBusy || !orderApproved || Boolean(receipt)} />
              </label>
            </div>
            <p>Ảnh PNG/JPG tối đa 5 MB, được giải mã trong trình duyệt và không tải lên server.</p>
          </aside>
        </div>

        {!order && <p className="inventory-disabled-help">Hãy tải một PO đã duyệt để bật chức năng nhập hoặc quét thiết bị.</p>}
        {order && !orderApproved && <p className="inventory-disabled-help is-warning">Các điều khiển nhập thiết bị đang khóa vì PO ở trạng thái {order.status}.</p>}
        {receipt && <p className="inventory-disabled-help is-success">Phiếu đã được lưu. Chọn “Bắt đầu phiếu mới” để tiếp tục nhập thiết bị.</p>}

        <div id="inventory-qr-reader" className="inventory-reader" />
        <details className="inventory-technical-panel">
          <summary>Thông tin kỹ thuật và benchmark QR</summary>
          <div className="inventory-measurement-grid" aria-live="polite">
            <span>CAMERA_SCAN_LATENCY: {cameraLatencyMs === null ? 'NOT RUN' : formatMs(cameraLatencyMs)}</span>
            <span>IMAGE_FILE_DECODE: {imageMeasurement === null ? 'NOT RUN' : formatMs(imageMeasurement.elapsedMs)}</span>
            <span>API_REQUEST_MS: {apiRequestMs === null ? 'NOT RUN' : formatMs(apiRequestMs)}</span>
          </div>
          <div className="inventory-benchmark-panel">
            <button className="inventory-action inventory-action-quiet" type="button" onClick={runImageBenchmark} disabled={scannerBusy}>Benchmark ảnh mẫu ×20</button>
            {benchmark?.summary && <span data-testid="benchmark-summary">n={benchmark.summary.n}; mean={formatMs(benchmark.summary.mean)}; median={formatMs(benchmark.summary.median)}; p95={formatMs(benchmark.summary.p95)}; min={formatMs(benchmark.summary.min)}; max={formatMs(benchmark.summary.max)}; fail={benchmark.failCount}</span>}
            {benchmark && !benchmark.summary && <span data-testid="benchmark-summary">n=0; fail={benchmark.failCount}</span>}
          </div>
        </details>
      </section>

      <section className="inventory-card">
        <div className="inventory-section-heading inventory-section-heading-split">
          <div className="inventory-section-title"><span className="inventory-step">03</span><div><h2>Danh sách chờ nhập</h2><p>{receipt ? 'Danh sách đã được lưu, không thể gửi lại.' : 'Kiểm tra thiết bị trước khi tạo phiếu nhập kho.'}</p></div></div>
          <span className={`inventory-state-label ${receipt ? 'is-saved' : 'is-pending'}`}>{receipt ? 'ĐÃ LƯU' : 'BẢN NHÁP'}</span>
        </div>

        <div className="inventory-counts" aria-label="Tổng hợp danh sách chờ nhập">
          <div><span>Tổng thiết bị</span><strong>{items.length}</strong></div>
          <div><span>GOOD</span><strong>{goodCount}</strong></div>
          <div><span>DEFECTIVE</span><strong>{defectiveCount}</strong></div>
        </div>

        {items.length === 0 ? (
          <div className="inventory-empty-state"><strong>Danh sách đang trống</strong><span>Thêm ít nhất một Serial/IMEI từ khu vực nhập thiết bị.</span></div>
        ) : (
          <div className="inventory-table-wrap inventory-draft-table-wrap">
            <table className="inventory-table inventory-unit-table">
              <thead><tr><th>SKU</th><th>Serial/IMEI</th><th>Tình trạng</th><th aria-label="Thao tác" /></tr></thead>
              <tbody>{items.map((item, index) => (
                <tr key={`${item.serialImei}-${index}`}>
                  <td><strong>{item.sku}</strong></td>
                  <td className="inventory-serial-value">{item.serialImei}</td>
                  <td><span className={`inventory-condition is-${item.condition.toLowerCase()}`}>{item.condition}</span></td>
                  <td className="inventory-row-action"><button className="inventory-action inventory-action-danger" type="button" onClick={() => removeItem(index)} disabled={submitting || Boolean(receipt)}>Xóa</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {!receipt && (
          <div className="inventory-submit-bar">
            <div><strong>Tạo phiếu nhập kho</strong><span>Backend sẽ kiểm tra lại PO, số lượng và Serial/IMEI.</span></div>
            <button className="inventory-action inventory-action-success" type="button" onClick={submitReceipt} disabled={submitting || items.length === 0 || !orderApproved}>
              {submitting ? 'Đang xử lý…' : 'Tạo phiếu nhập kho'}
            </button>
          </div>
        )}
      </section>
        </div>

        <aside className="inventory-v3-sidebar">
          <section className="inventory-card inventory-po-details" aria-labelledby="inventory-po-details-title">
            <div className="inventory-sidebar-heading">
              <h2 id="inventory-po-details-title">Thông tin PO</h2>
              {order && <span className={`inventory-status-badge ${orderApproved ? 'is-approved' : 'is-draft'}`}>{order.status}</span>}
            </div>
            {order ? (
              <>
                <dl className="inventory-po-meta">
                  <div><dt>Mã PO</dt><dd>{order.orderNumber}</dd></div>
                  <div><dt>Kho nhận</dt><dd>{order.warehouseCode} · {order.warehouseName}</dd></div>
                  <div><dt>Số SKU</dt><dd>{order.lines.length}</dd></div>
                </dl>
                {!orderApproved && <p className="inventory-inline-warning">PO chưa được duyệt. Hệ thống không cho phép tạo phiếu nhập kho.</p>}
                <div className="inventory-table-wrap inventory-po-table-wrap">
                  <table className="inventory-table">
                    <thead><tr><th>SKU</th><th className="is-number">Duyệt</th><th className="is-number">Đã nhận</th><th className="is-number">Còn lại</th></tr></thead>
                    <tbody>{order.lines.map((line) => (
                      <tr key={line.sku}><td><strong>{line.sku}</strong></td><td className="is-number">{line.approvedQuantity}</td><td className="is-number">{line.receivedQuantity}</td><td className="is-number"><strong>{line.remainingQuantity}</strong></td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="inventory-empty-state"><strong>Chưa có thông tin PO</strong><span>Tải một đơn mua hàng để xem kho nhận và hạn mức SKU.</span></div>
            )}
          </section>

          {!receipt && (
            <section className="inventory-card inventory-receipt-placeholder" aria-labelledby="inventory-receipt-placeholder-title">
              <div className="inventory-sidebar-heading"><h2 id="inventory-receipt-placeholder-title">Phiếu nhập kho</h2></div>
              <div className="inventory-empty-state inventory-receipt-empty"><span className="inventory-receipt-empty-icon" aria-hidden="true">▤</span><strong>Chưa có phiếu nhập</strong><span>Sau khi lưu thành công, mã phiếu và kết quả thật từ API sẽ hiển thị tại đây.</span></div>
            </section>
          )}

      {receipt && (
        <section className="inventory-card inventory-receipt" aria-labelledby="inventory-receipt-title">
          <div className="inventory-receipt-heading">
            <div><span className="inventory-success-mark" aria-hidden="true">✓</span><div><p>Phiếu nhập kho</p><h2 id="inventory-receipt-title">{receipt.receiptNumber}</h2></div></div>
            <span className="inventory-status-badge is-approved">{receipt.replayed ? 'ĐÃ TỒN TẠI' : 'ĐÃ LƯU'}</span>
          </div>
          <dl className="inventory-receipt-meta">
            <div><dt>Đơn mua hàng (PO)</dt><dd>{receipt.purchaseOrderNumber}</dd></div>
            <div><dt>Kho nhận</dt><dd>{receipt.warehouseCode}</dd></div>
            <div><dt>Thời điểm</dt><dd>{formatDateTime(receipt.createdAt)}</dd></div>
            <div><dt>Khả dụng</dt><dd>{receipt.availableQuantity}</dd></div>
            <div><dt>Hàng lỗi</dt><dd>{receipt.defectiveQuantity}</dd></div>
            <div><dt>Yêu cầu lặp</dt><dd>{receipt.replayed ? 'YES' : 'NO'}</dd></div>
          </dl>
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead><tr><th>SKU</th><th>Serial/IMEI</th><th>Tình trạng nhận</th><th>Trạng thái tồn</th></tr></thead>
              <tbody>{receipt.items.map((item) => (
                <tr key={item.serialImei}><td><strong>{item.sku}</strong></td><td className="inventory-serial-value">{item.serialImei}</td><td>{item.condition}</td><td>{item.inventoryStatus}</td></tr>
              ))}</tbody>
            </table>
          </div>
          <div className="inventory-receipt-actions">
            <p>Phiếu đã khóa trên giao diện để tránh gửi lại ngoài ý muốn.</p>
            <button className="inventory-action inventory-action-primary" type="button" onClick={startNewReceipt} disabled={orderLoading || submitting}>{orderLoading ? 'Đang cập nhật PO…' : 'Bắt đầu phiếu mới'}</button>
          </div>
        </section>
      )}
        </aside>
      </div>
    </main>
  )
}
