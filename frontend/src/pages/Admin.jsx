import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Admin() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
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
      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`),
        axios.get(`${API_URL}/api/admin/users`)
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
              <button onClick={() => navigate('/dashboard')} className="text-2xl">←</button>
              <h1 className="text-2xl font-bold">👑 Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-medium">{user?.full_name || user?.email}</span>
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

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading admin data...</p>
          </div>
        ) : (
          <>
            {/* Platform Stats */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total_scans}</div>
                  <div className="text-sm text-gray-600">Total Scans</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="text-3xl mb-2">⚠️</div>
                  <div className="text-2xl font-bold text-red-600">{stats.infected_detected}</div>
                  <div className="text-sm text-gray-600">Infected</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="text-3xl mb-2">✅</div>
                  <div className="text-2xl font-bold text-green-600">{stats.uninfected_detected}</div>
                  <div className="text-sm text-gray-600">Uninfected</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="text-2xl font-bold text-blue-600">{stats.total_users}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="text-3xl mb-2">🏥</div>
                  <div className="text-2xl font-bold text-purple-600">{stats.total_patients}</div>
                  <div className="text-sm text-gray-600">Patients</div>
                </div>
              </div>
            </div>

            {/* Time-based Stats */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md border border-blue-200">
                  <div className="text-3xl mb-2">📅</div>
                  <div className="text-2xl font-bold text-blue-900">{stats.predictions_today}</div>
                  <div className="text-sm text-blue-700 font-semibold">Today</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md border border-green-200">
                  <div className="text-3xl mb-2">📆</div>
                  <div className="text-2xl font-bold text-green-900">{stats.predictions_this_week}</div>
                  <div className="text-sm text-green-700 font-semibold">This Week</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-md border border-purple-200">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-2xl font-bold text-purple-900">{stats.predictions_this_month}</div>
                  <div className="text-sm text-purple-700 font-semibold">This Month</div>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="text-xl font-bold text-gray-900">All Users</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Full Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{u.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{u.full_name || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
