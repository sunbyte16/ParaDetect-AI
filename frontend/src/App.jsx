import { useState, useEffect } from 'react'
import axios from 'axios'
import ImageUpload from './components/ImageUpload'
import ResultDisplay from './components/ResultDisplay'
import Header from './components/Header'
import Stats from './components/Stats'
import Features from './components/Features'
import Footer from './components/Footer'
import { mockPredict } from './utils/mockPredict'

// Use environment variable or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const USE_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || !API_URL.includes('localhost')

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analysisCount, setAnalysisCount] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    // Load analysis count from localStorage
    const count = localStorage.getItem('analysisCount') || 0
    setAnalysisCount(parseInt(count))
  }, [])

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
      let response

      if (USE_DEMO_MODE) {
        // Use mock prediction for GitHub Pages demo
        const data = await mockPredict(selectedFile)
        response = { data }
      } else {
        // Use real API
        const formData = new FormData()
        formData.append('file', selectedFile)
        response = await axios.post(`${API_URL}/predict`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      }

      setResult(response.data)
      setShowSuccess(true)
      
      // Update analysis count
      const newCount = analysisCount + 1
      setAnalysisCount(newCount)
      localStorage.setItem('analysisCount', newCount)
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      if (USE_DEMO_MODE) {
        setError('Failed to analyze image. Please try again.')
      } else {
        setError(
          err.response?.data?.detail || 
          'Failed to analyze image. Please ensure the backend server is running.'
        )
      }
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
      {USE_DEMO_MODE && (
        <div className="bg-yellow-50 border-b border-yellow-200 py-2 px-4 text-center">
          <p className="text-sm text-yellow-800">
            🎭 <strong>Demo Mode:</strong> This is a demonstration version. Predictions are simulated. 
            For real AI predictions, run the backend server locally.
          </p>
        </div>
      )}
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            AI-Powered Malaria Detection
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            🔬 Upload a blood smear image and get instant, accurate diagnosis powered by deep learning
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <div className="px-6 py-3 bg-white rounded-lg border border-gray-200 text-gray-700 font-medium shadow-sm">
              ⚡ Lightning Fast
            </div>
            <div className="px-6 py-3 bg-white rounded-lg border border-gray-200 text-gray-700 font-medium shadow-sm">
              🎯 Accurate
            </div>
            <div className="px-6 py-3 bg-white rounded-lg border border-gray-200 text-gray-700 font-medium shadow-sm">
              🔒 Secure
            </div>
          </div>
        </div>

        <Stats analysisCount={analysisCount} />
      </section>

      {/* Main Analysis Section */}
      <main className="container mx-auto px-4 pb-12 max-w-6xl">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 border border-gray-200">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Upload */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow">
                  <span className="text-3xl">📤</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Upload Image
                </h2>
              </div>

              <ImageUpload
                onFileSelect={handleFileSelect}
                preview={preview}
                loading={loading}
              />
              
              <div className="flex gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || loading}
                  className="flex-1 bg-blue-500 text-white py-4 px-8 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-blue-600 disabled:hover:bg-blue-500 shadow-md flex items-center justify-center gap-3 text-lg"
                >
                  {loading ? (
                    <>
                      <div className="relative w-6 h-6">
                        <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Analyze Image
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="px-6 py-4 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50 transition-all shadow-md"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="p-5 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <p className="text-red-800 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {showSuccess && !loading && result && (
                <div className="p-5 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <p className="text-green-800 text-sm font-medium">Analysis completed successfully!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Results */}
            <div id="results" className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center shadow">
                  <span className="text-3xl">📊</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Analysis Results
                </h2>
              </div>
              
              <ResultDisplay result={result} loading={loading} />
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <Features />

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default App
