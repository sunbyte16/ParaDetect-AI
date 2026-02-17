import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import ImageUpload from '../components/ImageUpload'
import ResultDisplay from '../components/ResultDisplay'
import AIChatbot from '../components/AIChatbot'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function DashboardPro() {
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
  const [showSuccess, setShowSuccess] = useState(false)
  const [recentPredictions, setRecentPredictions] = useState([])
  const [showChatbot, setShowChatbot] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchPatients()
    fetchRecentPredictions()
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

  const fetchRecentPredictions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/predictions?limit=5`)
      setRecentPredictions(response.data)
    } catch (error) {
      console.error('Failed to fetch recent predictions:', error)
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
      alert('✅ Patient created successfully!')
    } catch (error) {
      alert('❌ Failed to create patient: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError(null)
    setShowSuccess(false)
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image first')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setShowSuccess(false)

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
      setShowSuccess(true)
      fetchStats()
      fetchRecentPredictions()
      
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
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
    setShowSuccess(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AI Chatbot */}
      <AIChatbot 
        isOpen={showChatbot} 
        onClose={() => setShowChatbot(false)}
        userPrediction={result}
      />

      {/* Floating Chatbot Button */}
      <button
        onClick={() => setShowChatbot(true)}
        className="fixed bottom-8 right-8 w-14 h-14 gradient-primary text-white rounded-full shadow-strong hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center z-40"
        title="Chat with AI Assistant"
      >
        <span className="text-2xl">💬</span>
      </button>

      {/* Top Navigation */}
      <nav className="bg-white shadow-soft border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200">
                <div className="w-11 h-11 gradient-primary rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-2xl">🔬</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">ParaDetect AI</h1>
                  <p className="text-xs text-gray-600">Professional Dashboard</p>
                </div>
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-primary-600 bg-primary-50 rounded-lg font-medium hover:bg-primary-100 transition-all duration-200"
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => navigate('/history')}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-all duration-200"
              >
                📈 History
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 bg-accent-500 text-white rounded-lg font-medium hover:bg-accent-600 transition-all duration-200"
                >
                  👑 Admin
                </button>
              )}
              
              <div className="h-8 w-px bg-gray-300"></div>
              
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                <div className="w-9 h-9 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">{user?.full_name || 'User'}</div>
                  <div className="text-xs text-gray-600">{user?.email}</div>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Stats Dashboard */}
      {stats && (
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card-hover p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <span className="badge bg-primary-50 text-primary-600">Total</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total_scans}</div>
              <div className="text-sm text-gray-600">Total Scans</div>
            </div>
            
            <div className="card-hover p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <span className="badge bg-red-50 text-red-600">Alert</span>
              </div>
              <div className="text-3xl font-bold text-red-600 mb-1">{stats.infected_detected}</div>
              <div className="text-sm text-gray-600">Infected Detected</div>
            </div>
            
            <div className="card-hover p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <span className="badge bg-green-50 text-green-600">Healthy</span>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-1">{stats.uninfected_detected}</div>
              <div className="text-sm text-gray-600">Uninfected</div>
            </div>
            
            <div className="card-hover p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <span className="badge bg-accent-50 text-accent-600">Active</span>
              </div>
              <div className="text-3xl font-bold text-accent-600 mb-1">{stats.total_patients}</div>
              <div className="text-sm text-gray-600">Patients</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Analysis */}
          <div className="lg:col-span-2">
            <div className="card p-8 shadow-medium">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-4xl">🔬</span>
                New Analysis
              </h2>

              {/* Patient Selection */}
              <div className="mb-8 p-6 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl border border-primary-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>👤</span> Select Patient (Optional)
                </h3>
                <div className="flex gap-3">
                  <select
                    value={selectedPatientId || ''}
                    onChange={(e) => setSelectedPatientId(e.target.value ? parseInt(e.target.value) : null)}
                    className="flex-1 input-field bg-white"
                  >
                    <option value="">No patient selected</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.patient_id} - {patient.name || 'Unnamed'} {patient.age ? `(${patient.age}y)` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewPatient(!showNewPatient)}
                    className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 font-semibold shadow-sm"
                  >
                    + New
                  </button>
                </div>

                {showNewPatient && (
                  <form onSubmit={handleCreatePatient} className="mt-4 p-4 bg-white rounded-xl border-2 border-dashed border-gray-300">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Patient ID *"
                        value={newPatient.patient_id}
                        onChange={(e) => setNewPatient({...newPatient, patient_id: e.target.value})}
                        required
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={newPatient.name}
                        onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Age"
                        value={newPatient.age}
                        onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={newPatient.gender}
                        onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <button type="submit" className="mt-3 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold">
                      Create Patient
                    </button>
                  </form>
                )}
              </div>

              {/* Upload Section */}
              <ImageUpload onFileSelect={handleFileSelect} preview={preview} loading={loading} />
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || loading}
                  className="flex-1 gradient-primary text-white py-4 px-8 rounded-xl font-bold text-lg disabled:opacity-50 transition-all duration-300 hover:shadow-strong disabled:hover:shadow-none flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      Analyze Image
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="px-8 py-4 bg-gray-500 text-white rounded-xl font-bold hover:bg-gray-600 transition-all duration-200"
                >
                  🔄 Reset
                </button>
              </div>

              {error && (
                <div className="mt-6 p-5 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
                  <span className="text-3xl">⚠️</span>
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              )}

              {showSuccess && !loading && result && (
                <div className="mt-6 p-5 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
                  <span className="text-3xl">✅</span>
                  <p className="text-green-800 font-medium">Analysis completed successfully!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Results & Recent */}
          <div className="space-y-8">
            {/* Results */}
            <div id="results" className="card p-8 shadow-medium">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-3xl">📊</span>
                Results
              </h2>
              <ResultDisplay result={result} loading={loading} />
            </div>

            {/* Recent Predictions */}
            <div className="card p-8 shadow-medium">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📋</span> Recent Predictions
              </h3>
              {recentPredictions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No predictions yet</p>
              ) : (
                <div className="space-y-3">
                  {recentPredictions.map((pred) => (
                    <div key={pred.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          pred.prediction === 'Parasitized'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {pred.prediction}
                        </span>
                        <span className="text-sm text-gray-600">
                          {new Date(pred.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-700">
                        Confidence: {(pred.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => navigate('/history')}
                className="mt-4 w-full px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-all duration-200 font-semibold"
              >
                View All History →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
