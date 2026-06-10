import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from './firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pos from './pages/Pos'
import Menu from './pages/Menu'
import Settings from './pages/Settings'
import Orders from './pages/Orders'
import Tables from './pages/Tables'
import Customers from './pages/Customers'
import Employees from './pages/Employees'
import Expenses from './pages/Expenses'
import AuthUsers from './pages/AuthUsers'
import Seed from './pages/Seed'
import Layout from './components/Layout'
import { loadAndApplyTheme } from './helpers/themeManager'

const App = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email))
        const snapshot = await getDocs(q)
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data()
          if (userData.status === true) {
            setUser({ uid: firebaseUser.uid, ...userData })
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    // Apply global theme on app boot
    loadAndApplyTheme()

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!user ? <Login user={user} /> : <Navigate to="/dashboard" />} />
        <Route path="/seed" element={<Seed />} />
        
        <Route element={user ? <Layout user={user} /> : <Navigate to="/" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/menu" element={<Menu user={user} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/orders" element={<Orders user={user} />} />
          <Route path="/tables" element={<Tables user={user} />} />
          <Route path="/customers" element={<Customers user={user} />} />
          <Route path="/employees" element={<Employees user={user} />} />
          <Route path="/expenses" element={<Expenses user={user} />} />
          <Route path="/auth-users" element={<AuthUsers user={user} />} />
        </Route>

        <Route path="/pos" element={user ? <Pos user={user} /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
