import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import AdminUserManagement from '../components/AdminUserManagement'
import AdminAppointments from '../components/AdminAppointments'
import AdminAnalytics from '../components/AdminAnalytics'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Admin() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard')
      return
    }
    fetchAdminData()
  }, [isAdmin])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/dashboard')} className="text-2xl hover:opacity-80">
                ←
              </button>
              <div>
                <h1 className="text-2xl font-bold">👑 Admin Dashboard</h1>
                <p className="text-sm opacity-90">System Management & Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">{user?.full_name || user?.email}</p>
                <p className="text-xs opacity-75">Administrator</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-all font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            {['dashboard', 'analytics', 'users', 'appointments', 'system'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading admin data...</p>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-6">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg shadow-lg p-8">
                  <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.full_name}!</h2>
                  <p className="text-lg opacity-90">Here's what's happening with your platform today.</p>
                </div>

                {/* Platform Stats */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Platform Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                      <div className="text-4xl mb-3">📊</div>
                      <div className="text-3xl font-bold text-gray-900">{stats.total_scans}</div>
                      <div className="text-sm text-gray-600 mt-1">Total Scans</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                      <div className="text-4xl mb-3">⚠️</div>
                      <div className="text-3xl font-bold text-red-600">{stats.infected_detected}</div>
                      <div className="text-sm text-gray-600 mt-1">Infected</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                      <div className="text-4xl mb-3">✅</div>
                      <div className="text-3xl font-bold text-green-600">{stats.uninfected_detected}</div>
                      <div className="text-sm text-gray-600 mt-1">Uninfected</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                      <div className="text-4xl mb-3">👥</div>
                      <div className="text-3xl font-bold text-blue-600">{stats.total_users}</div>
                      <div className="text-sm text-gray-600 mt-1">Total Users</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                      <div className="text-4xl mb-3">🏥</div>
                      <div className="text-3xl font-bold text-purple-600">{stats.total_patients}</div>
                      <div className="text-sm text-gray-600 mt-1">Patients</div>
                    </div>
                  </div>
                </div>

                {/* Time-based Stats */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md border-2 border-blue-200">
                      <div className="text-4xl mb-3">📅</div>
                      <div className="text-3xl font-bold text-blue-900">{stats.predictions_today}</div>
                      <div className="text-sm text-blue-700 font-semibold mt-1">Today</div>
                      <div className="text-xs text-blue-600 mt-2">
                        {((stats.predictions_today / stats.total_scans) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md border-2 border-green-200">
                      <div className="text-4xl mb-3">📆</div>
                      <div className="text-3xl font-bold text-green-900">{stats.predictions_this_week}</div>
                      <div className="text-sm text-green-700 font-semibold mt-1">This Week</div>
                      <div className="text-xs text-green-600 mt-2">
                        {((stats.predictions_this_week / stats.total_scans) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-md border-2 border-purple-200">
                      <div className="text-4xl mb-3">📊</div>
                      <div className="text-3xl font-bold text-purple-900">{stats.predictions_this_month}</div>
                      <div className="text-sm text-purple-700 font-semibold mt-1">This Month</div>
                      <div className="text-xs text-purple-600 mt-2">
                        {((stats.predictions_this_month / stats.total_scans) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      onClick={() => setActiveTab('users')}
                      className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-500"
                    >
                      <div className="text-4xl mb-2">👥</div>
                      <div className="font-semibold text-gray-900">Manage Users</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-all border-2 border-transparent hover:border-green-500"
                    >
                      <div className="text-4xl mb-2">📅</div>
                      <div className="font-semibold text-gray-900">Appointments</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-500"
                    >
                      <div className="text-4xl mb-2">📊</div>
                      <div className="font-semibold text-gray-900">Analytics</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('system')}
                      className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-all border-2 border-transparent hover:border-red-500"
                    >
                      <div className="text-4xl mb-2">⚙️</div>
                      <div className="font-semibold text-gray-900">System Info</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && stats && (
              <AdminAnalytics stats={stats} />
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <AdminUserManagement users={users} onRefresh={fetchAdminData} />
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <AdminAppointments />
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">System Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Application Version</p>
                      <p className="text-lg font-semibold text-gray-900">2.0.0</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">API Status</p>
                      <p className="text-lg font-semibold text-green-600">🟢 Operational</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Database</p>
                      <p className="text-lg font-semibold text-green-600">🟢 Connected</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">ML Model</p>
                      <p className="text-lg font-semibold text-green-600">🟢 Loaded</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Storage</p>
                      <p className="text-lg font-semibold text-gray-900">N/A</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Uptime</p>
                      <p className="text-lg font-semibold text-gray-900">N/A</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">System Health</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-gray-900">API Server</span>
                      </div>
                      <span className="text-green-600 font-semibold">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-gray-900">Database</span>
                      </div>
                      <span className="text-green-600 font-semibold">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-gray-900">ML Model</span>
                      </div>
                      <span className="text-green-600 font-semibold">Healthy</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
