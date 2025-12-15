import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { GoogleProvider } from "./context/GoogleContext.jsx";
import { LoaderProvider } from "./context/LoaderContext.jsx";
import Loader from './components/Loader.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleProvider>
        <LoaderProvider>
          <Loader />
          <App />
        </LoaderProvider>
      </GoogleProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
