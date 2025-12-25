// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRoutes from './AppRoutes'
import './index.css'
import { AuthProvider } from '@/context/AuthContext'
import { AppProvider } from '@/context/AppContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 1. Wrap Outer Layer with Providers */}
    <AuthProvider>
      <AppProvider>
        {/* 2. Then Render Routes */}
        <AppRoutes />
      </AppProvider>
    </AuthProvider>
  </React.StrictMode>,
)