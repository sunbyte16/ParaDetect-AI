import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { format } from 'date-fns'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function History() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchPredictions()
  }, [])

  const fetchPredictions = async () => {
    try {
      let url = `${API_URL}/api/predictions`
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      if (params.toString()) url += `?${params.toString()}`

      const response = await axios.get(url)
      setPredictions(response.data)
    } catch (error) {
      console.error('Failed to fetch predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    setLoading(true)
    fetchPredictions()
  }

  const exportCSV = () => {
    const headers = ['Date', 'Patient ID', 'Prediction', 'Confidence', 'Parasitized %', 'Uninfected %']
    const rows = predictions.map(p => [
      format(new Date(p.created_at), 'yyyy-MM-dd HH:mm:ss'),
      p.patient_id || 'N/A',
      p.prediction,
      (p.confidence * 100).toFixed(2) + '%',
      (p.prob_parasitized * 100).toFixed(2) + '%',
      (p.prob_uninfected * 100).toFixed(2) + '%'
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paradetect-history-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/dashboard')} className="text-2xl">←</button>
              <h1 className="text-2xl font-bold text-gray-900">📊 Case History</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">{user?.full_name || user?.email}</span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <button
              onClick={handleFilter}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Filter
            </button>
            <button
              onClick={exportCSV}
              disabled={predictions.length === 0}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Loading history...</p>
            </div>
          ) : predictions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-600">No predictions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Patient ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Prediction</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Confidence</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Parasitized</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Uninfected</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {predictions.map((prediction) => (
                    <tr key={prediction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {format(new Date(prediction.created_at), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {prediction.patient_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          prediction.prediction === 'Parasitized'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {prediction.prediction}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(prediction.confidence * 100).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(prediction.prob_parasitized * 100).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(prediction.prob_uninfected * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
