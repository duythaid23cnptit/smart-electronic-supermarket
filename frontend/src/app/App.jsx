import { useCallback, useState } from 'react'
import PosPage from '../features/pos/PosPage.jsx'
import ModuleNav from '../shared/components/ModuleNav.jsx'

export default function App() {
  const [navigationState, setNavigationState] = useState({
    hasUnsavedWork: false,
    hasPendingOutcome: false,
    isBusy: true,
  })
  const updateNavigationState = useCallback((nextState) => setNavigationState(nextState), [])

  return (
    <main className="sasms-design-root sasms-module-shell app-shell">
      <ModuleNav activeModule="pos" {...navigationState} />
      <header className="pos-hero">
        <div className="pos-hero__title">
          <span className="pos-hero__icon" aria-hidden="true">▤</span>
          <div>
            <p className="eyebrow">MODULE 2 · BÁN HÀNG TẠI QUẦY</p>
            <h1>POS — Bán hàng</h1>
            <p>Chọn đúng thiết bị trong Kho, xem giỏ hàng và xác nhận DEMO_CASH.</p>
          </div>
        </div>
        <span className="pos-hero__badge">Dữ liệu trực tiếp từ Module Kho</span>
      </header>

      <PosPage onNavigationStateChange={updateNavigationState} />
    </main>
  )
}
