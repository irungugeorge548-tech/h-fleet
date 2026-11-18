import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// In production, API calls go to the Render backend (VITE_API_URL). In dev, the Vite proxy handles /api.
axios.defaults.baseURL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>
)
