import PosPage from '../features/pos/PosPage.jsx'
import SerialImeiPanel from '../features/serialImei/SerialImeiPanel.jsx'

export default function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">SMART ELECTRONIC SUPERMARKET</p>
        <h1>Module 2 — POS bán hàng tại quầy</h1>
        <p>
          Week 5 desktop demo kết nối trực tiếp ProductUnit của Module Kho.
          Thanh toán chỉ là xác nhận tiền mặt mô phỏng.
        </p>
      </header>

      <PosPage />
      <SerialImeiPanel />
    </main>
  )
}
