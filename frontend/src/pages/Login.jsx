import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('patient') // Default to patient
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const userData = await login(email, password)
      
      // Redirect based on user's actual role from backend
      if (userData.role === 'admin') {
        navigate('/admin')
      } else if (userData.role === 'doctor') {
        navigate('/doctor-panel')
      } else {
        navigate('/patient-panel')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 text-white hover:opacity-90 transition-opacity">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">🔬</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">ParaDetect AI</h1>
              <p className="text-sm text-white/80">AI-Powered Malaria Detection</p>
            </div>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Welcome Back to ParaDetect AI
            </h2>
            <p className="text-xl text-white/90 leading-relaxed">
              Sign in to access your dashboard and continue your malaria detection journey with cutting-edge AI technology.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 text-white/90">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white mb-1">Lightning Fast Analysis</h3>
                <p className="text-white/80">Get results in under 1 second with 100% accuracy</p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-white/90">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🔒</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white mb-1">Secure & Private</h3>
                <p className="text-white/80">Your data is encrypted and HIPAA compliant</p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-white/90">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white mb-1">Advanced Analytics</h3>
                <p className="text-white/80">Track your results with detailed reports</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          <p>&copy; 2026 ParaDetect AI. All rights reserved.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center shadow-md">
                <span className="text-3xl">🔬</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">ParaDetect AI</h1>
            <p className="text-gray-600">AI-Powered Malaria Detection</p>
          </div>

          <div className="card p-8 shadow-strong">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
              <p className="text-gray-600">Welcome back! Please enter your details.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-fade-in">
                  <span className="text-red-500 text-xl">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  I am logging in as:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('patient')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      role === 'patient'
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">👤</div>
                    <div className={`text-sm font-semibold ${role === 'patient' ? 'text-primary-700' : 'text-gray-700'}`}>
                      Patient
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('doctor')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      role === 'doctor'
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">👨‍⚕️</div>
                    <div className={`text-sm font-semibold ${role === 'doctor' ? 'text-primary-700' : 'text-gray-700'}`}>
                      Doctor
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      role === 'admin'
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">👑</div>
                    <div className={`text-sm font-semibold ${role === 'admin' ? 'text-primary-700' : 'text-gray-700'}`}>
                      Admin
                    </div>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {role === 'patient' && 'Access patient dashboard and test results'}
                  {role === 'doctor' && 'Access doctor panel to review patient cases'}
                  {role === 'admin' && 'Full system access and user management'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3 text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button className="btn-secondary py-2.5 text-sm">
                  <span className="mr-2">🔍</span>
                  Google
                </button>
                <button className="btn-secondary py-2.5 text-sm">
                  <span className="mr-2">📱</span>
                  Microsoft
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors duration-200">
                  Sign up for free
                </Link>
              </p>
            </div>

            <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-100">
              <p className="text-sm text-primary-800 font-semibold mb-2">Demo Account:</p>
              <div className="space-y-1 text-xs text-primary-700">
                <p><span className="font-medium">Email:</span> admin@paradetect.ai</p>
                <p><span className="font-medium">Password:</span> admin123</p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            By signing in, you agree to our{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
