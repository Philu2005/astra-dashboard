import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { ConsentProvider } from './contexts/ConsentContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConsentProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConsentProvider>
  </React.StrictMode>,
)
