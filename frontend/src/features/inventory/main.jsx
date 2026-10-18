import React from 'react'
import ReactDOM from 'react-dom/client'
import InventoryReceivingPage from './InventoryReceivingPage.jsx'
import './inventory.css'

ReactDOM.createRoot(document.getElementById('inventory-root')).render(
  <React.StrictMode>
    <InventoryReceivingPage />
  </React.StrictMode>,
)
