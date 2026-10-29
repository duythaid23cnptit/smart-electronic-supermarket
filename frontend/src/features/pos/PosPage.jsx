import { useCallback, useEffect, useRef, useState } from 'react'
import { completeDemoCashSale, listAvailableUnits, listPosProducts } from './posApi.js'
import { canAddUnit, cartTotal, formatVnd, saleRequest } from './posCheckoutUtils.js'
import './pos.css'

function explainError(error) {
  return error?.response?.data?.message
    ?? 'Không kết nối được API POS. Kiểm tra Spring Boot và tích hợp dữ liệu Kho.'
}

export default function PosPage() {
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

  return (
    <section className="pos-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">TV4 · W5 · DESKTOP DEMO</p>
          <h2>POS – Bán hàng tại quầy</h2>
          <p className="pos-subtitle">
            Sản phẩm và Serial/IMEI lấy trực tiếp từ Module Kho. Chỉ xác nhận tiền mặt mô phỏng.
          </p>
        </div>
        <button type="button" onClick={refreshProducts} disabled={loading || checkingOut}>
          {loading ? 'Đang tải…' : 'Tải sản phẩm'}
        </button>
      </div>

      {error && <p role="alert" className="pos-error">{error}</p>}
      <div className="pos-grid">
        <div className="pos-card">
          <h3>1. Chọn thiết bị</h3>
          <label htmlFor="pos-sku">Sản phẩm</label>
          <select id="pos-sku" value={sku} onChange={(event) => setSku(event.target.value)} disabled={checkingOut}>
            <option value="">-- Chọn sản phẩm từ kho --</option>
            {products.map((product) => (
              <option key={product.sku} value={product.sku}>
                {product.name} ({product.sku}) · còn {product.available}
              </option>
            ))}
          </select>
          {selectedProduct && (
            <p><strong>Giá DEMO:</strong> {formatVnd(selectedProduct.unitPriceVnd)} (backend tính lại)</p>
          )}

          <label htmlFor="pos-serial">Serial/IMEI khả dụng</label>
          <select
            id="pos-serial"
            value={serial}
            onChange={(event) => setSerial(event.target.value)}
            disabled={!sku || loadingUnits || checkingOut}
          >
            <option value="">-- Chọn đúng thiết bị --</option>
            {units
              .filter((unit) => !cart.some((line) => line.serialImei === unit.serialImei))
              .map((unit) => <option key={unit.serialImei} value={unit.serialImei}>{unit.serialImei}</option>)}
          </select>
          <button type="button" onClick={addToCart} disabled={!serial || checkingOut}>Thêm vào giỏ</button>
        </div>

        <div className="pos-card">
          <h3>2. Giỏ hàng</h3>
          {cart.length === 0 ? <p>Chưa có thiết bị trong giỏ.</p> : (
            <ul className="pos-items">
              {cart.map((item) => (
                <li key={item.serialImei}>
                  <div>
                    <strong>{item.productName}</strong>
                    <small>{item.sku} · Serial: {item.serialImei}</small>
                  </div>
                  <div>
                    <strong>{formatVnd(item.unitPriceVnd)}</strong>
                    <button
                      type="button"
                      className="pos-remove"
                      onClick={() => {
                        resetPending()
                        setCart((current) => current.filter((line) => line.serialImei !== item.serialImei))
                      }}
                      disabled={checkingOut}
                    >
                      Xóa
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="pos-total"><span>Tạm tính</span><strong>{formatVnd(amount)}</strong></div>
        </div>

        <div className="pos-card">
          <h3>3. Hoàn tất demo</h3>
          <label htmlFor="pos-customer">Tên khách (để trống nếu khách lẻ)</label>
          <input
            id="pos-customer"
            value={customerName}
            maxLength={120}
            onChange={(event) => {
              resetPending()
              setCustomerName(event.target.value)
            }}
            disabled={checkingOut}
            placeholder="Khách lẻ"
          />
          <p><strong>Phương thức:</strong> Tiền mặt mô phỏng, không thu tiền thật</p>
          <p className="pos-help">
            Server khóa và kiểm tra lại Serial, giá và trạng thái tồn trước khi lưu giao dịch.
          </p>
          <button
            type="button"
            className="pos-primary"
            disabled={!cart.length || checkingOut}
            onClick={checkout}
          >
            {checkingOut ? 'Đang xử lý…' : 'Xác nhận thanh toán demo'}
          </button>
        </div>
      </div>

      {receipt && (
        <aside className="pos-receipt" aria-live="polite">
          <h3>Biên nhận demo · {receipt.saleNumber}</h3>
          <p>Khách: {receipt.customerName} · Trạng thái: {receipt.paymentStatus}</p>
          <ul>{receipt.lines.map((line) => (
            <li key={line.serialImei}>
              {line.productName} — {line.serialImei} — {formatVnd(line.unitPriceVnd)}
            </li>
          ))}</ul>
          <p><strong>Tổng đã xác nhận: {formatVnd(receipt.totalVnd)}</strong></p>
          <p className="pos-help">Biên nhận trên màn hình, không phải hóa đơn thuế hoặc bản in vật lý.</p>
        </aside>
      )}
    </section>
  )
}
