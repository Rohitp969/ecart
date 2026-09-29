import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Toaster } from '@/components/ui/sonner'
import { Provider } from 'react-redux'
import  store  from "./redux/store";
import { PersistGate } from 'redux-persist/integration/react'
import { persistStore } from 'redux-persist'
import axios from 'axios'
import { toast } from 'sonner'
import { setUser } from './redux/userSlice'

let persistor = persistStore(store)

// Backend sends 401 when the token is missing/expired/invalid: clear the stale login
// so the user is sent to login instead of every request silently failing.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      if (store.getState().user.user) {
        store.dispatch(setUser(null))
        toast.error(error.response.data?.message || 'Session expired, please login again', { id: 'session-expired' })
      }
    }
    return Promise.reject(error)
  }
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
       <App />
       <Toaster/>
      </PersistGate>
    </Provider>
  </StrictMode>
)

