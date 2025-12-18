import React from 'react'
import ReactDOM from 'react-dom/client'
import PageLayout from './layout/index'
import './index.css'

const rootEl = document.getElementById('root')
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl)
  root.render(
    <React.StrictMode>
      <PageLayout />
    </React.StrictMode>
  )
}
