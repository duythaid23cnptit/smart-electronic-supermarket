import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserQRCodeReader } from '@zxing/browser'
import { NotFoundException } from '@zxing/library'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { QR_SAMPLES } from './qrSamples.js'
import { createDuplicateGuard, createOperationGuard, isWebUrl, requireExactText } from './scanUtils.js'
import { describeCameraError } from './cameraErrors.js'

const LIBRARIES = {
  HTML5_QRCODE: 'html5-qrcode',
  ZXING: 'zxing',
}

export default function QrScannerPoc() {
  const [library, setLibrary] = useState(LIBRARIES.HTML5_QRCODE)
  const [cameraState, setCameraState] = useState('IDLE')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [manualValue, setManualValue] = useState('00001234567890')
  const [duplicateCount, setDuplicateCount] = useState(0)

  const html5ScannerRef = useRef(null)
  const zxingControlsRef = useRef(null)
  const videoRef = useRef(null)
  const duplicateGuardRef = useRef(createDuplicateGuard())
  const scannerOperationRef = useRef(createOperationGuard())
  const cameraStartedAtRef = useRef(null)
  const mountedRef = useRef(true)

  const acceptDecodedValue = useCallback((value, source) => {
    if (!mountedRef.current) return
    const exactValue = requireExactText(value)

    if (!duplicateGuardRef.current.accept(exactValue)) {
      setDuplicateCount((count) => count + 1)
      return
    }

    const cameraLatencyMs = cameraStartedAtRef.current === null
      ? null
      : performance.now() - cameraStartedAtRef.current
    cameraStartedAtRef.current = null
    setResult({
      value: exactValue,
      source,
      capturedAt: new Date().toISOString(),
      cameraLatencyMs,
    })
    setError('')
  }, [])

  const stopScanner = useCallback(async (updateState = true) => {
    zxingControlsRef.current?.stop()
    zxingControlsRef.current = null

    const html5Scanner = html5ScannerRef.current
    html5ScannerRef.current = null
    if (html5Scanner) {
      try {
        if (html5Scanner.isScanning) {
          await html5Scanner.stop()
        }
        html5Scanner.clear()
      } catch {
        // Cleanup errors do not change a previously captured QR result.
      }
    }

    const stream = videoRef.current?.srcObject
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }

    cameraStartedAtRef.current = null
    scannerOperationRef.current.finish('camera')
    if (updateState && mountedRef.current) setCameraState('STOPPED')
  }, [])

  const startScanner = useCallback(async () => {
    await stopScanner(false)
    if (!scannerOperationRef.current.tryStart('camera')) return
    setError('')
    setCameraState('REQUESTING_PERMISSION')

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('ERROR')
      setError('Trình duyệt không hỗ trợ camera API hoặc trang chưa chạy trong secure context.')
      scannerOperationRef.current.finish('camera')
      return
    }

    try {
      if (library === LIBRARIES.HTML5_QRCODE) {
        const scanner = new Html5Qrcode('html5-qrcode-reader', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        })
        html5ScannerRef.current = scanner
        cameraStartedAtRef.current = performance.now()
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => acceptDecodedValue(decodedText, 'html5-qrcode'),
          () => {},
        )
      } else {
        const reader = new BrowserQRCodeReader(undefined, {
          delayBetweenScanAttempts: 100,
          delayBetweenScanSuccess: 500,
        })
        cameraStartedAtRef.current = performance.now()
        zxingControlsRef.current = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } }, audio: false },
          videoRef.current,
          (scanResult, scanError) => {
            if (scanResult) {
              acceptDecodedValue(scanResult.getText(), '@zxing/browser')
            } else if (scanError && !(scanError instanceof NotFoundException)) {
              setError(`ZXing callback: ${scanError.message}`)
            }
          },
        )
      }

      setCameraState('SCANNING')
    } catch (cameraError) {
      cameraStartedAtRef.current = null
      scannerOperationRef.current.finish('camera')
      setCameraState('ERROR')
      setError(describeCameraError(cameraError))
    }
  }, [acceptDecodedValue, library, stopScanner])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      void stopScanner(false)
    }
  }, [stopScanner])

  async function changeLibrary(event) {
    await stopScanner()
    duplicateGuardRef.current.reset()
    setDuplicateCount(0)
    setLibrary(event.target.value)
  }

  function submitManualValue(event) {
    event.preventDefault()
    duplicateGuardRef.current.reset()
    acceptDecodedValue(manualValue, 'manual-input')
  }

  function allowSameCodeAgain() {
    duplicateGuardRef.current.reset()
    setDuplicateCount(0)
  }

  async function copyResult() {
    if (!result) return

    try {
      await navigator.clipboard.writeText(result.value)
    } catch {
      setError('Không thể sao chép tự động. Hãy chọn và sao chép chuỗi thủ công.')
    }
  }

  return (
    <main className="qr-page">
      <header className="qr-hero">
        <div>
          <p className="qr-kicker">SASMS - TV4 DEV LEAD - W1</p>
          <h1>QR Scanner Library PoC</h1>
          <p className="qr-lead">
            So sánh camera scanning giữa <code>html5-qrcode</code> và <code>@zxing/browser</code>.
            Đây là PoC độc lập, không kết nối API hoặc thay đổi nghiệp vụ POS.
          </p>
        </div>
        <span className={`secure-badge ${window.isSecureContext ? 'is-secure' : 'is-warning'}`}>
          {window.isSecureContext ? 'Secure context' : 'HTTPS required'}
        </span>
      </header>

      <section className="qr-card controls-card" aria-labelledby="scanner-controls-title">
        <div>
          <p className="section-number">01</p>
          <h2 id="scanner-controls-title">Camera scanner</h2>
        </div>

        <label className="field">
          <span>Thư viện</span>
          <select value={library} onChange={changeLibrary} disabled={cameraState === 'REQUESTING_PERMISSION'}>
            <option value={LIBRARIES.HTML5_QRCODE}>html5-qrcode</option>
            <option value={LIBRARIES.ZXING}>@zxing/browser</option>
          </select>
        </label>

        <div className="button-row">
          <button className="primary-button" type="button" onClick={startScanner} disabled={cameraState === 'REQUESTING_PERMISSION' || cameraState === 'SCANNING'}>
            Bật camera
          </button>
          <button className="secondary-button" type="button" onClick={stopScanner}>
            Dừng camera
          </button>
        </div>

        <p className="camera-state" aria-live="polite">Camera: {cameraState}</p>
        {error && <p className="error-message" role="alert">{error}</p>}

        <div className="scanner-frame">
          <div
            id="html5-qrcode-reader"
            className={library === LIBRARIES.HTML5_QRCODE ? '' : 'is-hidden'}
          />
          <video
            ref={videoRef}
            className={library === LIBRARIES.ZXING ? 'zxing-video' : 'zxing-video is-hidden'}
            muted
            playsInline
          />
        </div>
      </section>

      <section className="qr-card result-card" aria-labelledby="result-title">
        <div>
          <p className="section-number">02</p>
          <h2 id="result-title">Kết quả nguyên bản</h2>
        </div>

        {result ? (
          <>
            <dl className="result-meta">
              <div><dt>Nguồn</dt><dd>{result.source}</dd></div>
              <div><dt>Độ dài</dt><dd>{result.value.length} ký tự</dd></div>
              <div><dt>Callback trùng đã chặn</dt><dd>{duplicateCount}</dd></div>
              <div><dt>CAMERA_SCAN_LATENCY</dt><dd>{result.cameraLatencyMs === null ? 'NOT RUN' : `${result.cameraLatencyMs.toFixed(1)} ms`}</dd></div>
            </dl>
            <textarea className="result-value" value={result.value} readOnly rows="4" />
            {isWebUrl(result.value) && (
              <p className="safety-note">Chuỗi này giống URL. PoC chỉ hiển thị text và không tự điều hướng.</p>
            )}
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={copyResult}>Sao chép chuỗi</button>
              <button className="secondary-button" type="button" onClick={allowSameCodeAgain}>
                Cho phép quét lại cùng mã
              </button>
            </div>
          </>
        ) : (
          <p className="empty-state">Chưa có kết quả. Bật camera hoặc dùng nhập tay bên dưới.</p>
        )}
      </section>

      <section className="qr-card" aria-labelledby="manual-title">
        <div>
          <p className="section-number">03</p>
          <h2 id="manual-title">Nhập tay để đối chiếu</h2>
        </div>
        <form onSubmit={submitManualValue}>
          <label className="field">
            <span>Chuỗi chính xác - không trim, không chuyển sang số</span>
            <textarea
              value={manualValue}
              onChange={(event) => setManualValue(event.target.value)}
              rows="3"
              spellCheck="false"
            />
          </label>
          <button className="primary-button" type="submit">Ghi nhận chuỗi nhập tay</button>
        </form>
      </section>

      <section className="qr-card samples-card" aria-labelledby="samples-title">
        <div>
          <p className="section-number">04</p>
          <h2 id="samples-title">QR test samples</h2>
        </div>
        <p>Mở sample trên màn hình khác hoặc in ra giấy. So sánh kết quả với chuỗi kỳ vọng bên dưới.</p>
        <div className="sample-grid">
          {QR_SAMPLES.map((sample) => (
            <article className="sample-item" key={sample.id}>
              <img src={`/qr-samples/${sample.fileName}`} alt={`QR sample: ${sample.label}`} />
              <h3>{sample.label}</h3>
              <code>{sample.value}</code>
            </article>
          ))}
        </div>
      </section>

      <footer>
        Không tự mở URL - không gửi dữ liệu lên backend - không lưu lịch sử quét.
      </footer>
    </main>
  )
}
