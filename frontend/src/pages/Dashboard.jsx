import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import ImageUpload from '../components/ImageUpload'
import ResultDisplay from '../components/ResultDisplay'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [patients, setPatients] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [showNewPatient, setShowNewPatient] = useState(false)
  const [newPatient, setNewPatient] = useState({ patient_id: '', name: '', age: '', gender: '' })

  useEffect(() => {
    fetchStats()
    fetchPatients()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stats`)
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/patients`)
      setPatients(response.data)
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    }
  }

  const handleCreatePatient = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post(`${API_URL}/api/patients`, newPatient)
      setPatients([...patients, response.data])
      setSelectedPatientId(response.data.id)
      setShowNewPatient(false)
      setNewPatient({ patient_id: '', name: '', age: '', gender: '' })
    } catch (error) {
      alert('Failed to create patient: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image first')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (selectedPatientId) {
        formData.append('patient_id', selectedPatientId)
      }

      const response = await axios.post(`${API_URL}/api/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setResult(response.data)
      fetchStats()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze image')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">🔬 ParaDetect AI</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                Dashboard
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/history')}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              >
                📊 History
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all"
                >
                  👑 Admin
                </button>
              )}
              <div className="flex items-center gap-2">
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
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total_scans}</div>
              <div className="text-sm text-gray-600">Total Scans</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-3xl mb-2">⚠️</div>
              <div className="text-2xl font-bold text-red-600">{stats.infected_detected}</div>
              <div className="text-sm text-gray-600">Infected Detected</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-2xl font-bold text-green-600">{stats.uninfected_detected}</div>
              <div className="text-sm text-gray-600">Uninfected</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-2xl font-bold text-blue-600">{stats.total_patients}</div>
              <div className="text-sm text-gray-600">Patients</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Patient Selection */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Select Patient (Optional)</h3>
            <div className="flex gap-4">
              <select
                value={selectedPatientId || ''}
                onChange={(e) => setSelectedPatientId(e.target.value ? parseInt(e.target.value) : null)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No patient selected</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.patient_id} - {patient.name || 'Unnamed'}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowNewPatient(!showNewPatient)}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
              >
                + New Patient
              </button>
            </div>

            {showNewPatient && (
              <form onSubmit={handleCreatePatient} className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Patient ID *"
                    value={newPatient.patient_id}
                    onChange={(e) => setNewPatient({...newPatient, patient_id: e.target.value})}
                    required
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}
                    className="px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <button type="submit" className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  Create Patient
                </button>
              </form>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Image</h2>
              <ImageUpload onFileSelect={handleFileSelect} preview={preview} loading={loading} />
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || loading}
                  className="flex-1 bg-blue-500 text-white py-4 px-8 rounded-lg font-semibold disabled:opacity-50 transition-all hover:bg-blue-600"
                >
                  {loading ? 'Analyzing...' : 'Analyze Image'}
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 py-4 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
                >
                  Reset
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Results Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Results</h2>
              <ResultDisplay result={result} loading={loading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
