import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import AIChatbot from '../components/AIChatbot'
import ImageUpload from '../components/ImageUpload'
import ResultDisplay from '../components/ResultDisplay'
import AppointmentBooking from '../components/AppointmentBooking'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function PatientPanel() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [myResults, setMyResults] = useState([])
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showChatbot, setShowChatbot] = useState(false)
  
  // New analysis states
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisError, setAnalysisError] = useState(null)

  useEffect(() => {
    fetchPatientData()
  }, [])

  const fetchPatientData = async () => {
    try {
      setLoading(true)
      // Fetch patient's test results from predictions endpoint
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.error('No token found')
        setMyResults([])
        setLoading(false)
        return
      }

      const resultsRes = await axios.get(`${API_URL}/api/predictions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMyResults(resultsRes.data || [])
    } catch (error) {
      console.error('Error fetching patient data:', error)
      if (error.response?.status === 401) {
        console.error('Authentication failed - logging out')
        logout()
      }
      setMyResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setAnalysisResult(null)
    setAnalysisError(null)
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setAnalysisError('Please select an image first')
      return
    }

    setAnalyzing(true)
    setAnalysisError(null)
    setAnalysisResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Get token from localStorage
      const token = localStorage.getItem('token')
      
      if (!token) {
        setAnalysisError('You are not logged in. Please login again.')
        logout()
        return
      }

      const response = await axios.post(`${API_URL}/api/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      })

      setAnalysisResult(response.data)
      fetchPatientData() // Refresh results list
      
      setTimeout(() => {
        document.getElementById('analysis-result')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error('Analysis error:', err)
      if (err.response?.status === 401) {
        setAnalysisError('Session expired. Please login again.')
        setTimeout(() => logout(), 2000)
      } else {
        setAnalysisError(err.response?.data?.detail || 'Failed to analyze image')
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreview(null)
    setAnalysisResult(null)
    setAnalysisError(null)
  }

  const downloadPDF = async (result) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/predictions/${result.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `malaria-report-${result.id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF report')
    }
  }

  const generatePDFReport = (result) => {
    // Generate PDF using browser print
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Malaria Test Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; color: #3b82f6; }
          .section { margin: 20px 0; }
          .label { font-weight: bold; color: #4b5563; }
          .value { color: #1f2937; margin-left: 10px; }
          .result-box { padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; margin: 20px 0; }
          .positive { background-color: #fee2e2; border-color: #ef4444; }
          .negative { background-color: #d1fae5; border-color: #10b981; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🔬 ParaDetect AI</div>
          <p>Malaria Detection Report</p>
        </div>
        
        <div class="section">
          <p><span class="label">Patient Name:</span><span class="value">${user?.full_name || 'N/A'}</span></p>
          <p><span class="label">Patient Email:</span><span class="value">${user?.email || 'N/A'}</span></p>
          <p><span class="label">Report Date:</span><span class="value">${new Date(result.created_at).toLocaleString()}</span></p>
          <p><span class="label">Report ID:</span><span class="value">#${result.id}</span></p>
        </div>
        
        <div class="result-box ${result.prediction === 'Parasitized' ? 'positive' : 'negative'}">
          <h2>Test Result: ${result.prediction}</h2>
          <p><span class="label">Confidence Level:</span><span class="value">${(result.confidence * 100).toFixed(2)}%</span></p>
          <p><span class="label">Parasitized Probability:</span><span class="value">${(result.probabilities?.Parasitized * 100 || 0).toFixed(2)}%</span></p>
          <p><span class="label">Uninfected Probability:</span><span class="value">${(result.probabilities?.Uninfected * 100 || 0).toFixed(2)}%</span></p>
        </div>
        
        ${result.doctor_notes ? `
        <div class="section">
          <h3>Doctor's Notes</h3>
          <p>${result.doctor_notes}</p>
        </div>
        ` : ''}
        
        <div class="section">
          <h3>Interpretation</h3>
          <p>${result.prediction === 'Parasitized' 
            ? 'The blood sample shows presence of malaria parasites. Please consult with a healthcare professional immediately for proper treatment.' 
            : 'The blood sample appears to be free from malaria parasites. However, if symptoms persist, please consult with a healthcare professional.'
          }</p>
        </div>
        
        <div class="footer">
          <p>This report is generated by ParaDetect AI - AI-Powered Malaria Detection System</p>
          <p>⚠️ This tool is for research and educational purposes. Always consult qualified healthcare professionals for medical diagnosis.</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'reviewed': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPredictionColor = (prediction) => {
    return prediction === 'Parasitized' 
      ? 'text-red-600 font-bold' 
      : 'text-green-600 font-bold'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Chatbot */}
      <AIChatbot isOpen={showChatbot} onClose={() => setShowChatbot(false)} />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Panel</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.full_name}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowChatbot(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                💬 Ask AI Assistant
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {['dashboard', 'new-test', 'appointments', 'results', 'profile'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="card-hover p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🔬</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Tests</p>
                        <p className="text-2xl font-semibold text-gray-900">{myResults.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="card-hover p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">✅</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Negative</p>
                        <p className="text-2xl font-semibold text-green-600">
                          {myResults.filter(r => r.prediction === 'Uninfected').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="card-hover p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Positive</p>
                        <p className="text-2xl font-semibold text-red-600">
                          {myResults.filter(r => r.prediction === 'Parasitized').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="card-hover p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📊</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {myResults.length > 0 
                            ? (myResults.reduce((sum, r) => sum + r.confidence, 0) / myResults.length * 100).toFixed(0) + '%'
                            : '0%'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button
                      onClick={() => setActiveTab('new-test')}
                      className="p-6 border-2 border-dashed border-primary-300 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 text-center group"
                    >
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🔬</div>
                      <div className="font-semibold text-gray-900">New Test</div>
                      <div className="text-sm text-gray-600 mt-1">Upload & Analyze</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="p-6 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-center group"
                    >
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📅</div>
                      <div className="font-semibold text-gray-900">Book Appointment</div>
                      <div className="text-sm text-gray-600 mt-1">See a Doctor</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('results')}
                      className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-500 hover:bg-gray-50 transition-all duration-200 text-center group"
                    >
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📋</div>
                      <div className="font-semibold text-gray-900">View Results</div>
                      <div className="text-sm text-gray-600 mt-1">All Test History</div>
                    </button>
                    <button
                      onClick={() => setShowChatbot(true)}
                      className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-500 hover:bg-gray-50 transition-all duration-200 text-center group"
                    >
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">💬</div>
                      <div className="font-semibold text-gray-900">AI Assistant</div>
                      <div className="text-sm text-gray-600 mt-1">Ask Questions</div>
                    </button>
                  </div>
                </div>

                {/* Recent Results */}
                <div className="card">
                  <div className="px-6 py-4 border-b">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-900">Recent Test Results</h2>
                      <button
                        onClick={() => setActiveTab('results')}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View All →
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    {myResults.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔬</div>
                        <p className="text-gray-500 text-lg mb-4">No test results yet</p>
                        <button
                          onClick={() => setActiveTab('new-test')}
                          className="btn-primary"
                        >
                          Take Your First Test
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {myResults.slice(0, 5).map((result) => (
                          <div key={result.id} className="card-hover p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`text-xl font-bold ${getPredictionColor(result.prediction)}`}>
                                    {result.prediction}
                                  </span>
                                  <span className="badge bg-gray-100 text-gray-700">
                                    {(result.confidence * 100).toFixed(1)}% confidence
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {new Date(result.created_at).toLocaleString()}
                                </p>
                              </div>
                              <button
                                onClick={() => generatePDFReport(result)}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 text-sm flex items-center gap-2"
                              >
                                <span>📄</span>
                                Download PDF
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* New Test Tab */}
            {activeTab === 'new-test' && (
              <div className="max-w-4xl mx-auto">
                <div className="card p-8 shadow-medium">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <span className="text-4xl">🔬</span>
                    New Malaria Test
                  </h2>

                  <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Instructions:</span> Upload a clear blood smear microscopy image. 
                      Our AI will analyze it and provide instant results with confidence scores.
                    </p>
                  </div>

                  {/* Upload Section */}
                  <ImageUpload onFileSelect={handleFileSelect} preview={preview} loading={analyzing} />
                  
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handleAnalyze}
                      disabled={!selectedFile || analyzing}
                      className="flex-1 gradient-primary text-white py-4 px-8 rounded-xl font-bold text-lg disabled:opacity-50 transition-all duration-300 hover:shadow-strong disabled:hover:shadow-none flex items-center justify-center gap-3"
                    >
                      {analyzing ? (
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
                      disabled={analyzing}
                      className="px-8 py-4 bg-gray-500 text-white rounded-xl font-bold hover:bg-gray-600 transition-all duration-200"
                    >
                      🔄 Reset
                    </button>
                  </div>

                  {analysisError && (
                    <div className="mt-6 p-5 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
                      <span className="text-3xl">⚠️</span>
                      <p className="text-red-800 font-medium">{analysisError}</p>
                    </div>
                  )}

                  {analysisResult && (
                    <div id="analysis-result" className="mt-8">
                      <div className="p-6 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3 mb-6">
                        <span className="text-3xl">✅</span>
                        <p className="text-green-800 font-medium">Analysis completed successfully!</p>
                      </div>

                      <div className="card p-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Test Results</h3>
                        <ResultDisplay result={analysisResult} loading={false} />
                        
                        <div className="mt-6 flex gap-4">
                          <button
                            onClick={() => generatePDFReport(analysisResult)}
                            className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <span>📄</span>
                            Download PDF Report
                          </button>
                          <button
                            onClick={() => setActiveTab('results')}
                            className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-all duration-200"
                          >
                            View All Results
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <AppointmentBooking />
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                        <span className="text-2xl">🔬</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Tests</p>
                        <p className="text-2xl font-semibold text-gray-900">{myResults.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                        <span className="text-2xl">✅</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Negative</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {myResults.filter(r => r.prediction === 'Uninfected').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Positive</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {myResults.filter(r => r.prediction === 'Parasitized').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                        <span className="text-2xl">📅</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Appointments</p>
                        <p className="text-2xl font-semibold text-gray-900">{appointments.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Results */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Test Results</h2>
                  </div>
                  <div className="p-6">
                    {myResults.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No test results yet</p>
                    ) : (
                      <div className="space-y-4">
                        {myResults.slice(0, 5).map((result) => (
                          <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <span className={`text-lg ${getPredictionColor(result.prediction)}`}>
                                    {result.prediction}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(result.status)}`}>
                                    {result.status}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  Confidence: {(result.confidence * 100).toFixed(1)}%
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(result.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                                View Details
                              </button>
                            </div>
                            {result.doctor_notes && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm font-medium text-blue-900">Doctor's Notes:</p>
                                <p className="text-sm text-blue-800 mt-1">{result.doctor_notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Upcoming Appointments */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
                  </div>
                  <div className="p-6">
                    {appointments.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No upcoming appointments</p>
                    ) : (
                      <div className="space-y-4">
                        {appointments.slice(0, 3).map((apt) => (
                          <div key={apt.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">Dr. {apt.doctor_name}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  📅 {new Date(apt.appointment_date).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">Reason: {apt.reason}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(apt.status)}`}>
                                {apt.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <div className="card shadow-medium">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">All Test Results</h2>
                  <p className="text-sm text-gray-600 mt-1">Complete history of your malaria tests</p>
                </div>
                <div className="p-6">
                  {myResults.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📋</div>
                      <p className="text-gray-500 text-lg mb-4">No test results available</p>
                      <button
                        onClick={() => setActiveTab('new-test')}
                        className="btn-primary"
                      >
                        Take Your First Test
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myResults.map((result) => (
                        <div key={result.id} className="card-hover p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`text-2xl font-bold ${getPredictionColor(result.prediction)}`}>
                                  {result.prediction}
                                </span>
                                <span className="badge bg-gray-100 text-gray-700">
                                  ID: #{result.id}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                <div>
                                  <p className="text-xs text-gray-500">Confidence</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {(result.confidence * 100).toFixed(1)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Parasitized</p>
                                  <p className="text-sm font-semibold text-red-600">
                                    {((result.probabilities?.Parasitized || result.prob_parasitized || 0) * 100).toFixed(1)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Uninfected</p>
                                  <p className="text-sm font-semibold text-green-600">
                                    {((result.probabilities?.Uninfected || result.prob_uninfected || 0) * 100).toFixed(1)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Date</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {new Date(result.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              {result.doctor_notes && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                  <p className="text-sm font-medium text-blue-900">Doctor's Notes:</p>
                                  <p className="text-sm text-blue-800 mt-1">{result.doctor_notes}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => generatePDFReport(result)}
                                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
                              >
                                <span>📄</span>
                                Download PDF
                              </button>
                              <button
                                onClick={() => {
                                  setAnalysisResult(result)
                                  setActiveTab('new-test')
                                }}
                                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-200 font-semibold"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl mx-auto">
                <div className="card shadow-medium">
                  <div className="px-6 py-4 border-b">
                    <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage your personal information</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 pb-6 border-b">
                        <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md">
                          {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{user?.full_name || 'User'}</h3>
                          <p className="text-sm text-gray-600">{user?.email}</p>
                          <span className="badge bg-primary-100 text-primary-700 mt-2">Patient</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={user?.full_name || ''}
                          className="input-field"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          className="input-field"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          placeholder="Enter phone number"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                        <input
                          type="date"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                        <select className="input-field">
                          <option>Select gender</option>
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                        <textarea
                          rows="3"
                          placeholder="Enter your address"
                          className="input-field"
                        ></textarea>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button className="btn-primary flex-1">
                          Update Profile
                        </button>
                        <button className="btn-secondary flex-1">
                          Change Password
                        </button>
                      </div>
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
