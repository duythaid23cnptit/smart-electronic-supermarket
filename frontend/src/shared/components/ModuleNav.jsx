import { useEffect, useRef, useState } from 'react'
import { getNavigationGuard, NAVIGATION_GUARD } from '../navigation/moduleNavigation.js'

const MODULES = [
  { id: 'inventory', label: 'Kho', href: '/inventory.html' },
  { id: 'pos', label: 'POS', href: '/' },
]

const MESSAGES = {
  [NAVIGATION_GUARD.BUSY]: 'Đang xử lý yêu cầu. Hãy chờ hoàn tất trước khi chuyển module.',
  [NAVIGATION_GUARD.PENDING_OUTCOME]: 'Kết quả yêu cầu hiện chưa rõ. Rời trang có thể làm mất ngữ cảnh retry với cùng idempotency key. Bạn vẫn muốn rời trang?',
  [NAVIGATION_GUARD.UNSAVED_WORK]: 'Trang hiện có dữ liệu chưa hoàn tất. Rời trang sẽ làm mất dữ liệu này. Bạn vẫn muốn rời trang?',
}

export default function ModuleNav({
  activeModule,
  hasUnsavedWork = false,
  hasPendingOutcome = false,
  isBusy = false,
}) {
  const [navigationMessage, setNavigationMessage] = useState('')
  const allowNextUnloadRef = useRef(false)
  const guard = getNavigationGuard({ isBusy, hasPendingOutcome, hasUnsavedWork })

  useEffect(() => {
    if (guard === NAVIGATION_GUARD.CLEAR) return undefined

    function warnBeforeUnload(event) {
      if (allowNextUnloadRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [guard])

  function handleNavigation(event, module) {
    setNavigationMessage('')
    if (module.id === activeModule) {
      event.preventDefault()
      return
    }
    if (guard === NAVIGATION_GUARD.BUSY) {
      event.preventDefault()
      setNavigationMessage(MESSAGES[guard])
      return
    }
    if (guard !== NAVIGATION_GUARD.CLEAR && !window.confirm(MESSAGES[guard])) {
      event.preventDefault()
      setNavigationMessage('Đã giữ nguyên trang và dữ liệu hiện tại.')
      return
    }
    allowNextUnloadRef.current = true
  }

  return (
    <nav className="sasms-module-nav" aria-label="Điều hướng module SASMS">
      <a className="sasms-module-nav__brand" href={activeModule === 'pos' ? '/' : '/inventory.html'} onClick={(event) => event.preventDefault()}>
        <span className="sasms-module-nav__mark" aria-hidden="true">S</span>
        <span><strong>SASMS</strong><small>Smart Electronic Supermarket</small></span>
      </a>
      <div className="sasms-module-nav__links">
        {MODULES.map((module) => (
          <a
            key={module.id}
            href={module.href}
            className={`sasms-module-nav__link${module.id === activeModule ? ' is-active' : ''}`}
            aria-current={module.id === activeModule ? 'page' : undefined}
            aria-disabled={guard === NAVIGATION_GUARD.BUSY && module.id !== activeModule ? 'true' : undefined}
            onClick={(event) => handleNavigation(event, module)}
          >
            {module.label}
          </a>
        ))}
      </div>
      <p className="sasms-module-nav__status" role="status" aria-live="polite">{navigationMessage}</p>
    </nav>
  )
}
