import { useCallback, useEffect, useRef, useState } from 'react'
import { completeDemoCashSale, listAvailableUnits, listPosProducts } from './posApi.js'
import { canAddUnit, cartTotal, formatVnd, saleRequest } from './posCheckoutUtils.js'
import './pos.css'

function explainError(error) {
  return error?.response?.data?.message
    ?? 'Không kết nối được API POS. Kiểm tra Spring Boot và tích hợp dữ liệu Kho.'
}

export default function PosPage({ onNavigationStateChange }) {
  const [products, setProducts] = useState([])
  const [sku, setSku] = useState('')
  const [units, setUnits] = useState([])
  const [serial, setSerial] = useState('')
  const [cart, setCart] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const submittingRef = useRef(false)
  const pendingRequestRef = useRef(null)
  const selectedProduct = products.find((product) => product.sku === sku)

  useEffect(() => {
    onNavigationStateChange?.({
      hasUnsavedWork: cart.length > 0,
      hasPendingOutcome: pendingRequestRef.current !== null,
      isBusy: loading || loadingUnits || checkingOut,
    })
  }, [cart.length, checkingOut, customerName, error, loading, loadingUnits, onNavigationStateChange, receipt])

  const refreshProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setProducts(await listPosProducts())
    } catch (requestError) {
      setError(explainError(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshProducts()
  }, [refreshProducts])

  useEffect(() => {
    let active = true
    setUnits([])
    setSerial('')
    if (!sku) return () => { active = false }

    setLoadingUnits(true)
    listAvailableUnits(sku)
      .then((data) => {
        if (active) {
          setUnits(data.filter((unit) => unit.status === 'AVAILABLE' && unit.quality === 'GOOD'))
        }
      })
      .catch((requestError) => {
        if (active) setError(explainError(requestError))
      })
      .finally(() => {
        if (active) setLoadingUnits(false)
      })
    return () => { active = false }
  }, [sku])

  function resetPending() {
    pendingRequestRef.current = null
    setReceipt(null)
  }

  function addToCart() {
    const unit = units.find((item) => item.serialImei === serial)
    if (!selectedProduct || !canAddUnit(cart, unit)) {
      setError('Serial/IMEI không khả dụng hoặc đã có trong giỏ.')
      return
    }
    resetPending()
    setError('')
    setCart((current) => [...current, {
      sku: selectedProduct.sku,
      productName: selectedProduct.name,
      serialImei: unit.serialImei,
      unitPriceVnd: selectedProduct.unitPriceVnd,
    }])
    setSerial('')
  }

  async function checkout() {
    if (submittingRef.current || cart.length === 0) return
    submittingRef.current = true
    setCheckingOut(true)
    setError('')
    try {
      if (!pendingRequestRef.current) {
        pendingRequestRef.current = saleRequest(cart, customerName, crypto.randomUUID())
      }
      const result = await completeDemoCashSale(pendingRequestRef.current)
      setReceipt(result)
      setCart([])
      pendingRequestRef.current = null

      try {
        const [freshProducts, freshUnits] = await Promise.all([
          listPosProducts(),
          sku ? listAvailableUnits(sku) : Promise.resolve([]),
        ])
        setProducts(freshProducts)
        setUnits(freshUnits.filter((item) => item.status === 'AVAILABLE' && item.quality === 'GOOD'))
      } catch {
        setError('Đơn demo đã tạo, nhưng chưa tải lại được tồn. Bấm Tải sản phẩm để cập nhật.')
      }
    } catch (requestError) {
      setError(`${explainError(requestError)} Nếu phản hồi không rõ, thử lại; hệ thống giữ cùng idempotency key.`)
    } finally {
      submittingRef.current = false
      setCheckingOut(false)
    }
  }

  let amount = 0
  try {
    amount = cartTotal(cart)
  } catch {
    // The backend remains authoritative and will reject an invalid total.
  }
  const selectableUnits = units.filter((unit) => !cart.some((line) => line.serialImei === unit.serialImei))

  return (
    <section className="pos-panel">
      <div className="pos-toolbar">
        <p>Sản phẩm, Serial/IMEI và giá được tải trực tiếp từ backend.</p>
        <button className="pos-action pos-action-secondary" type="button" onClick={refreshProducts} disabled={loading || checkingOut}>
          {loading ? 'Đang tải…' : 'Tải lại sản phẩm'}
        </button>
      </div>

      {error && <p role="alert" className="pos-error">{error}</p>}
      <div className="pos-workspace">
        <div className="pos-card pos-selector-card">
          <div className="pos-section-heading">
            <span className="pos-step">01</span>
            <div><h2>Chọn sản phẩm</h2><p>Danh sách thực tế đến từ Kho; giá được backend kiểm tra lại khi checkout.</p></div>
          </div>

          {loading ? <div className="pos-empty-state">Đang tải sản phẩm…</div> : (
            <div className="pos-products" aria-label="Danh sách sản phẩm">
              {products.map((product) => (
                <button
                  key={product.sku}
                  className={`pos-product${product.sku === sku ? ' is-selected' : ''}`}
                  type="button"
                  onClick={() => setSku(product.sku)}
                  disabled={checkingOut}
                  aria-pressed={product.sku === sku}
                >
                  <span className="pos-product-icon" aria-hidden="true">▣</span>
                  <span className="pos-product-copy">
                    <strong>{product.name}</strong>
                    <small>{product.sku}</small>
                    <b>{formatVnd(product.unitPriceVnd)}</b>
                  </span>
                  <span className={`pos-availability${product.available > 0 ? '' : ' is-empty'}`}>{product.available} Serial</span>
                </button>
              ))}
              {!products.length && <div className="pos-empty-state">Chưa có sản phẩm khả dụng từ backend.</div>}
            </div>
          )}

          <div className="pos-section-heading pos-serial-heading">
            <span className="pos-step">02</span>
            <div><h2>Chọn Serial/IMEI</h2><p>Chỉ hiển thị thiết bị GOOD + AVAILABLE chưa nằm trong giỏ.</p></div>
          </div>

          <fieldset className="pos-serial-list" disabled={!sku || loadingUnits || checkingOut}>
            <legend className="pos-visually-hidden">Serial/IMEI khả dụng</legend>
            {loadingUnits && <div className="pos-empty-state">Đang tải Serial/IMEI…</div>}
            {!loadingUnits && selectableUnits.map((unit) => (
              <label className={`pos-serial-option${unit.serialImei === serial ? ' is-selected' : ''}`} key={unit.serialImei}>
                <span><input type="radio" name="pos-serial" value={unit.serialImei} checked={unit.serialImei === serial} onChange={(event) => setSerial(event.target.value)} />{unit.serialImei}</span>
                <strong>AVAILABLE</strong>
              </label>
            ))}
            {!loadingUnits && sku && units.length === 0 && <div className="pos-empty-state">Sản phẩm này hiện không có Serial/IMEI khả dụng để bán.</div>}
            {!loadingUnits && sku && units.length > 0 && selectableUnits.length === 0 && <div className="pos-empty-state">Tất cả Serial/IMEI khả dụng của sản phẩm này đã nằm trong giỏ.</div>}
            {!sku && <div className="pos-empty-state">Chọn một sản phẩm để tải Serial/IMEI khả dụng.</div>}
          </fieldset>
          <div className="pos-add-row">
            <button className="pos-action pos-action-primary" type="button" onClick={addToCart} disabled={!serial || checkingOut}>＋ Thêm vào giỏ</button>
          </div>
        </div>

        <div className="pos-side-stack">
          <div className="pos-card">
            <div className="pos-section-heading">
              <span className="pos-step">03</span>
              <div><h2>Giỏ hàng</h2><p>Mỗi thiết bị được định danh bởi một Serial riêng.</p></div>
            </div>
            {cart.length === 0 ? <div className="pos-empty-state">Chưa có thiết bị trong giỏ.</div> : (
              <ul className="pos-items">
                {cart.map((item) => (
                  <li key={item.serialImei}>
                    <span className="pos-cart-icon" aria-hidden="true">▣</span>
                    <div className="pos-cart-copy"><strong>{item.productName}</strong><small>SKU: {item.sku} · Serial: {item.serialImei}</small></div>
                    <strong className="pos-cart-price">{formatVnd(item.unitPriceVnd)}</strong>
                    <button type="button" className="pos-remove" onClick={() => { resetPending(); setCart((current) => current.filter((line) => line.serialImei !== item.serialImei)) }} disabled={checkingOut}>Xóa</button>
                  </li>
                ))}
              </ul>
            )}
            <div className="pos-total"><span>Tổng thanh toán</span><strong>{formatVnd(amount)}</strong></div>
          </div>

          <div className="pos-card">
            <div className="pos-section-heading">
              <span className="pos-step">04</span>
              <div><h2>Xác nhận thanh toán</h2><p>Giao dịch tiền mặt mô phỏng, không thu tiền thật.</p></div>
            </div>
            <label className="pos-field" htmlFor="pos-customer"><span>Tên khách hàng (không bắt buộc)</span>
              <input id="pos-customer" value={customerName} maxLength={120} onChange={(event) => { resetPending(); setCustomerName(event.target.value) }} disabled={checkingOut} placeholder="Khách lẻ" />
            </label>
            <div className="pos-payment-method"><span>Phương thức</span><strong>DEMO_CASH</strong></div>
            <button className="pos-action pos-action-primary pos-checkout" type="button" disabled={!cart.length || checkingOut} onClick={checkout}>
              {checkingOut ? 'Đang xử lý…' : 'Xác nhận bán hàng demo'}
            </button>
            <p className="pos-help">Server khóa và kiểm tra lại Serial, giá và trạng thái tồn trước khi lưu giao dịch.</p>
          </div>

          {receipt && (
            <aside className="pos-card pos-receipt" aria-live="polite">
              <div className="pos-receipt-heading"><span aria-hidden="true">✓</span><div><p>Biên nhận demo</p><h2>{receipt.saleNumber}</h2></div></div>
              <div className="pos-receipt-meta"><span>Khách hàng<strong>{receipt.customerName}</strong></span><span>Trạng thái<strong>{receipt.paymentStatus}</strong></span></div>
              <ul>{receipt.lines.map((line) => <li key={line.serialImei}><span>{line.productName}<small>{line.serialImei}</small></span><strong>{formatVnd(line.unitPriceVnd)}</strong></li>)}</ul>
              <div className="pos-receipt-total"><span>Tổng đã xác nhận</span><strong>{formatVnd(receipt.totalVnd)}</strong></div>
              <p className="pos-help">Biên nhận trên màn hình, không phải hóa đơn thuế hoặc bản in vật lý.</p>
            </aside>
          )}
        </div>
      </div>
    </section>
  )
}
