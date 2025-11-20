import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { GoogleProvider } from "./context/GoogleContext.jsx";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleProvider>
        <App />
      </GoogleProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
