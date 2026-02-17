import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, today, upcoming, completed
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAppointments(response.data || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId, status, appointmentNotes = '') => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `${API_URL}/api/appointments/${appointmentId}`,
        { status, notes: appointmentNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchAppointments()
      setShowNotesModal(false)
      setSelectedAppointment(null)
      setNotes('')
    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Failed to update appointment')
    }
  }

  const handleCompleteAppointment = (appointment) => {
    setSelectedAppointment(appointment)
    setNotes(appointment.notes || '')
    setShowNotesModal(true)
  }

  const submitCompletion = () => {
    if (selectedAppointment) {
      updateAppointmentStatus(selectedAppointment.id, 'completed', notes)
    }
  }

  const getFilteredAppointments = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date)
      
      switch(filter) {
        case 'today':
          return aptDate.toDateString() === today.toDateString() && apt.status === 'scheduled'
        case 'upcoming':
          return aptDate >= today && apt.status === 'scheduled'
        case 'completed':
          return apt.status === 'completed'
        default:
          return true
      }
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const filteredAppointments = getFilteredAppointments()

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
          <div className="flex gap-2">
            {['all', 'today', 'upcoming', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                  filter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{appointments.length}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {appointments.filter(a => a.status === 'scheduled').length}
            </p>
            <p className="text-sm text-gray-600">Scheduled</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {appointments.filter(a => a.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {appointments.filter(a => {
                const aptDate = new Date(a.appointment_date)
                const today = new Date()
                return aptDate.toDateString() === today.toDateString() && a.status === 'scheduled'
              }).length}
            </p>
            <p className="text-sm text-gray-600">Today</p>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <span className="text-6xl">📅</span>
            <p className="mt-4 text-lg text-gray-600">No appointments found</p>
            <p className="text-sm text-gray-500">Try changing the filter</p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                      {appointment.patient_name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{appointment.patient_name}</h3>
                      <p className="text-sm text-gray-600">{appointment.patient_email}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-semibold text-gray-900">
                      📅 {new Date(appointment.appointment_date).toLocaleDateString()}
                    </p>
                    <p className="font-semibold text-gray-900">
                      🕐 {new Date(appointment.appointment_date).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Booked On</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(appointment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Reason for Visit:</p>
                  <p className="text-sm text-gray-600">{appointment.reason}</p>
                </div>

                {appointment.notes && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Doctor's Notes:</p>
                    <p className="text-sm text-blue-800">{appointment.notes}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  {appointment.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handleCompleteAppointment(appointment)}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold transition-colors"
                      >
                        ✓ Mark as Completed
                      </button>
                      <button
                        onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold transition-colors">
                    View Patient Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Complete Appointment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Patient: <span className="font-semibold">{selectedAppointment?.patient_name}</span>
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Consultation Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="6"
                placeholder="Enter consultation notes, diagnosis, recommendations..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              ></textarea>
            </div>

            <div className="flex gap-3">
              <button
                onClick={submitCompletion}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
              >
                Complete Appointment
              </button>
              <button
                onClick={() => {
                  setShowNotesModal(false)
                  setSelectedAppointment(null)
                  setNotes('')
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
