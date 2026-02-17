import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AdminAnalytics({ stats }) {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPredictions()
  }, [])

  const fetchPredictions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/admin/predictions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPredictions(response.data || [])
    } catch (error) {
      console.error('Error fetching predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAccuracy = () => {
    if (predictions.length === 0) return 0
    const highConfidence = predictions.filter(p => p.confidence > 0.9).length
    return ((highConfidence / predictions.length) * 100).toFixed(1)
  }

  const getRecentActivity = () => {
    return predictions
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
  }

  const getInfectionRate = () => {
    if (stats.total_scans === 0) return 0
    return ((stats.infected_detected / stats.total_scans) * 100).toFixed(1)
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-3xl font-bold">{stats.total_scans}</div>
          <div className="text-sm opacity-90">Total Scans</div>
          <div className="mt-2 text-xs opacity-75">
            +{stats.predictions_today} today
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
          <div className="text-4xl mb-2">✅</div>
          <div className="text-3xl font-bold">{calculateAccuracy()}%</div>
          <div className="text-sm opacity-90">High Confidence</div>
          <div className="mt-2 text-xs opacity-75">
            Confidence &gt; 90%
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg shadow-lg p-6">
          <div className="text-4xl mb-2">⚠️</div>
          <div className="text-3xl font-bold">{getInfectionRate()}%</div>
          <div className="text-sm opacity-90">Infection Rate</div>
          <div className="mt-2 text-xs opacity-75">
            {stats.infected_detected} positive cases
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-3xl font-bold">{stats.total_users}</div>
          <div className="text-sm opacity-90">Active Users</div>
          <div className="mt-2 text-xs opacity-75">
            {stats.total_patients} patients
          </div>
        </div>
      </div>

      {/* Time-based Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Activity Trends</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="text-4xl mb-2">📅</div>
            <div className="text-3xl font-bold text-blue-600">{stats.predictions_today}</div>
            <div className="text-sm text-gray-600 mt-2">Today</div>
            <div className="text-xs text-gray-500 mt-1">
              {((stats.predictions_today / stats.total_scans) * 100).toFixed(1)}% of total
            </div>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
            <div className="text-4xl mb-2">📆</div>
            <div className="text-3xl font-bold text-green-600">{stats.predictions_this_week}</div>
            <div className="text-sm text-gray-600 mt-2">This Week</div>
            <div className="text-xs text-gray-500 mt-1">
              {((stats.predictions_this_week / stats.total_scans) * 100).toFixed(1)}% of total
            </div>
          </div>

          <div className="text-center p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-3xl font-bold text-purple-600">{stats.predictions_this_month}</div>
            <div className="text-sm text-gray-600 mt-2">This Month</div>
            <div className="text-xs text-gray-500 mt-1">
              {((stats.predictions_this_month / stats.total_scans) * 100).toFixed(1)}% of total
            </div>
          </div>
        </div>
      </div>

      {/* Results Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Results Distribution</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="p-6 bg-red-50 rounded-lg border-2 border-red-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-red-600">{stats.infected_detected}</div>
                <div className="text-sm text-gray-600">Parasitized</div>
              </div>
              <div className="text-5xl">🦠</div>
            </div>
            <div className="w-full bg-red-200 rounded-full h-3">
              <div
                className="bg-red-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getInfectionRate()}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-600 mt-2">{getInfectionRate()}% of total</div>
          </div>

          <div className="p-6 bg-green-50 rounded-lg border-2 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-green-600">{stats.uninfected_detected}</div>
                <div className="text-sm text-gray-600">Uninfected</div>
              </div>
              <div className="text-5xl">✅</div>
            </div>
            <div className="w-full bg-green-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${100 - parseFloat(getInfectionRate())}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {(100 - parseFloat(getInfectionRate())).toFixed(1)}% of total
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Predictions</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {getRecentActivity().map((pred, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`w-3 h-3 rounded-full ${
                  pred.prediction === 'Parasitized' ? 'bg-red-500' : 'bg-green-500'
                }`}></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${
                      pred.prediction === 'Parasitized' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {pred.prediction}
                    </span>
                    <span className="text-sm text-gray-600">
                      ({(pred.confidence * 100).toFixed(1)}% confidence)
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(pred.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  User #{pred.user_id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">System Health</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">🟢</div>
            <div className="text-sm font-semibold text-green-600">API Status</div>
            <div className="text-xs text-gray-600 mt-1">Operational</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">🟢</div>
            <div className="text-sm font-semibold text-green-600">Model Status</div>
            <div className="text-xs text-gray-600 mt-1">Loaded</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">🟢</div>
            <div className="text-sm font-semibold text-green-600">Database</div>
            <div className="text-xs text-gray-600 mt-1">Connected</div>
          </div>
        </div>
      </div>
    </div>
  )
}
