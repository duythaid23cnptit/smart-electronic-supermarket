import React from 'react'
import ReactDOM from 'react-dom/client'
import QrScannerPoc from './QrScannerPoc.jsx'
import './qr-scanner.css'

ReactDOM.createRoot(document.getElementById('qr-poc-root')).render(
  <React.StrictMode>
    <QrScannerPoc />
  </React.StrictMode>,
)
