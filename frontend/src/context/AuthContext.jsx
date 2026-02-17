import { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setToken(token)
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`)
      setUser(response.data)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)

    const response = await axios.post(`${API_URL}/api/auth/login`, formData)
    const { access_token, user: userData } = response.data
    
    localStorage.setItem('token', access_token)
    setToken(access_token)
    setUser(userData)
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    
    return userData
  }

  const register = async (email, password, fullName, role = 'patient', phone = null) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email,
      password,
      full_name: fullName,
      role: role,
      phone: phone
    })
    const { access_token, user: userData } = response.data
    
    localStorage.setItem('token', access_token)
    setToken(access_token)
    setUser(userData)
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    
    return userData
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  const sendOTP = async (phone) => {
    const response = await axios.post(`${API_URL}/api/auth/send-otp`, { phone })
    return response.data
  }

  const verifyOTP = async (phone, otp) => {
    const response = await axios.post(`${API_URL}/api/auth/verify-otp`, { phone, otp })
    return response.data
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    sendOTP,
    verifyOTP,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
