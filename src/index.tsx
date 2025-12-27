import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import PageLayout from './layout/index'
import './index.css'

const rootEl = document.getElementById('root')
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl)

  root.render(
    <React.StrictMode>
      <ConfigProvider locale={zhCN}>
        <PageLayout />
      </ConfigProvider>
    </React.StrictMode>
  )
}
