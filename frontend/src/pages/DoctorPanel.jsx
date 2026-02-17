import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import DoctorAppointments from '../components/DoctorAppointments'
import PatientDetails from '../components/PatientDetails'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function DoctorPanel() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [patients, setPatients] = useState([])
  const [pendingCases, setPendingCases] = useState([])
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showPatientDetails, setShowPatientDetails] = useState(false)
  const [showAddPrescription, setShowAddPrescription] = useState(false)

  useEffect(() => {
    fetchDoctorData()
  }, [])

  const fetchDoctorData = async () => {
    try {
      setLoading(true)
      // Fetch doctor's patients
      const patientsRes = await axios.get(`${API_URL}/api/doctor/patients`)
      setPatients(patientsRes.data)
      
      // Fetch pending cases
      const casesRes = await axios.get(`${API_URL}/api/doctor/pending-cases`)
      setPendingCases(casesRes.data)
      
      // Fetch appointments
      const appointmentsRes = await axios.get(`${API_URL}/api/doctor/appointments`)
      setAppointments(appointmentsRes.data)
      
      // Fetch stats
      const statsRes = await axios.get(`${API_URL}/api/doctor/stats`)
      setStats(statsRes.data)
    } catch (error) {
      console.error('Error fetching doctor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewCase = async (caseId, diagnosis, notes) => {
    try {
      await axios.put(`${API_URL}/api/doctor/cases/${caseId}/review`, {
        diagnosis,
        notes,
        status: 'reviewed'
      })
      fetchDoctorData()
    } catch (error) {
      console.error('Error reviewing case:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Panel</h1>
              <p className="text-sm text-gray-600">Dr. {user?.full_name}</p>
              {user?.specialization && (
                <p className="text-xs text-gray-500">{user.specialization}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">License: {user?.license_number || 'N/A'}</p>
                <p className="text-xs text-gray-500">Active Status</p>
              </div>
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
            {['dashboard', 'patients', 'pending-cases', 'appointments', 'prescriptions', 'analytics'].map((tab) => (
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
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                        <span className="text-2xl">👥</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Patients</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.total_patients || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                        <span className="text-2xl">⏳</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Pending Cases</p>
                        <p className="text-2xl font-semibold text-gray-900">{pendingCases.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                        <span className="text-2xl">✅</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Cases Reviewed</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.reviewed_cases || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                        <span className="text-2xl">📅</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {appointments.filter(a => new Date(a.appointment_date).toDateString() === new Date().toDateString()).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Cases Alert */}
                {pendingCases.length > 0 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          You have {pendingCases.length} pending case(s) requiring review
                        </h3>
                        <button
                          onClick={() => setActiveTab('pending-cases')}
                          className="mt-2 text-sm text-yellow-700 underline hover:text-yellow-900"
                        >
                          Review now →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Today's Appointments */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
                  </div>
                  <div className="p-6">
                    {appointments.filter(a => new Date(a.appointment_date).toDateString() === new Date().toDateString()).length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No appointments today</p>
                    ) : (
                      <div className="space-y-4">
                        {appointments
                          .filter(a => new Date(a.appointment_date).toDateString() === new Date().toDateString())
                          .map((apt) => (
                            <div key={apt.id} className="border rounded-lg p-4 hover:bg-gray-50">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-gray-900">{apt.patient_name}</h3>
                                  <p className="text-sm text-gray-600 mt-1">
                                    🕐 {new Date(apt.appointment_date).toLocaleTimeString()}
                                  </p>
                                  <p className="text-sm text-gray-600">Reason: {apt.reason}</p>
                                </div>
                                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                                  View Patient
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {stats.recent_activity?.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{activity.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Patients Tab */}
            {activeTab === 'patients' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">My Patients</h2>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                      Add New Patient
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Visit</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {patients.map((patient) => (
                          <tr key={patient.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold">
                                    {patient.name?.charAt(0) || 'P'}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                                  <div className="text-sm text-gray-500">{patient.patient_id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {patient.age || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {patient.gender || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  setSelectedPatient(patient)
                                  setShowPatientDetails(true)
                                }}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPatient(patient)
                                  setShowPatientDetails(true)
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                History
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Cases Tab */}
            {activeTab === 'pending-cases' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Pending Cases ({pendingCases.length})
                    </h2>
                  </div>
                  <div className="p-6">
                    {pendingCases.length === 0 ? (
                      <div className="text-center py-12">
                        <span className="text-6xl">✅</span>
                        <p className="mt-4 text-lg text-gray-600">All caught up!</p>
                        <p className="text-sm text-gray-500">No pending cases to review</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {pendingCases.map((case_) => (
                          <div key={case_.id} className="border rounded-lg p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  Patient: {case_.patient_name || 'Unknown'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Test Date: {new Date(case_.created_at).toLocaleString()}
                                </p>
                              </div>
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                Pending Review
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Image */}
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Blood Smear Image:</p>
                                <img
                                  src={`${API_URL}/${case_.image_path}`}
                                  alt="Blood smear"
                                  className="w-full h-64 object-cover rounded-lg border"
                                />
                              </div>

                              {/* AI Prediction */}
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">AI Analysis:</p>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                  <div>
                                    <p className="text-xs text-gray-500">Prediction</p>
                                    <p className={`text-lg font-bold ${
                                      case_.prediction === 'Parasitized' ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                      {case_.prediction}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Confidence</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                      {(case_.confidence * 100).toFixed(1)}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Probabilities</p>
                                    <div className="space-y-1 mt-1">
                                      <div className="flex justify-between text-sm">
                                        <span>Parasitized:</span>
                                        <span className="font-medium">{(case_.prob_parasitized * 100).toFixed(1)}%</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>Uninfected:</span>
                                        <span className="font-medium">{(case_.prob_uninfected * 100).toFixed(1)}%</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Review Form */}
                            <div className="mt-6 border-t pt-6">
                              <h4 className="font-semibold text-gray-900 mb-4">Doctor's Review</h4>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Diagnosis
                                  </label>
                                  <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                    <option>Confirm AI Prediction</option>
                                    <option>Malaria Positive</option>
                                    <option>Malaria Negative</option>
                                    <option>Requires Further Testing</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Clinical Notes
                                  </label>
                                  <textarea
                                    rows="4"
                                    placeholder="Enter your clinical observations and recommendations..."
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  ></textarea>
                                </div>
                                <div className="flex gap-4">
                                  <button
                                    onClick={() => handleReviewCase(case_.id, 'confirmed', 'Reviewed and confirmed')}
                                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                                  >
                                    ✓ Approve & Submit
                                  </button>
                                  <button
                                    onClick={() => setShowAddPrescription(true)}
                                    className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                                  >
                                    💊 Add Prescription
                                  </button>
                                  <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">
                                    Skip
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <DoctorAppointments />
            )}

            {/* Prescriptions Tab */}
            {activeTab === 'prescriptions' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Prescriptions Issued</h2>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    New Prescription
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-center text-gray-500 py-8">Prescription management coming soon...</p>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Performance Analytics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">{stats.total_cases || 0}</p>
                      <p className="text-sm text-gray-600 mt-2">Total Cases Reviewed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">{stats.accuracy || '0'}%</p>
                      <p className="text-sm text-gray-600 mt-2">Diagnostic Accuracy</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">{stats.avg_response_time || '0'}h</p>
                      <p className="text-sm text-gray-600 mt-2">Avg Response Time</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Overview</h3>
                  <p className="text-center text-gray-500 py-8">Charts and graphs coming soon...</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Patient Details Modal */}
      {showPatientDetails && selectedPatient && (
        <PatientDetails
          patientId={selectedPatient.id}
          onClose={() => {
            setShowPatientDetails(false)
            setSelectedPatient(null)
          }}
        />
      )}
    </div>
  )
}
