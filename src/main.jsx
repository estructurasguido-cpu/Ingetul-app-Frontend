import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { GoogleProvider } from "./context/GoogleContext.jsx";
import { LoaderProvider } from "./context/LoaderContext.jsx";
import Loader from './components/Loader.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleProvider>
        <LoaderProvider>
          <Loader />
          <App />
        </LoaderProvider>
      </GoogleProvider>
    </BrowserRouter>
  </React.StrictMode>
)