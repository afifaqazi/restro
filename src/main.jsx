import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Bootstrap CSS & Icons
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.min.css'

// Custom CSS
import './assets/css/theme.css'
import './assets/css/components.css'
import './assets/css/auth.css'
import './assets/css/dashboard.css'
import './assets/css/manage.css'
import './assets/css/pos.css'
import './assets/css/settings.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
