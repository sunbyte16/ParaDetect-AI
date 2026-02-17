import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AppointmentBooking() {
  const [doctors, setDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [formData, setFormData] = useState({
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Fetch doctors
      const doctorsRes = await axios.get(`${API_URL}/api/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDoctors(doctorsRes.data || [])
      
      // Fetch appointments
      const appointmentsRes = await axios.get(`${API_URL}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAppointments(appointmentsRes.data || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem('token')
      
      // Combine date and time
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`)
      
      await axios.post(
        `${API_URL}/api/appointments`,
        {
          doctor_id: parseInt(formData.doctor_id),
          appointment_date: appointmentDateTime.toISOString(),
          reason: formData.reason
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      setSuccess('Appointment booked successfully!')
      setShowBookingForm(false)
      setFormData({
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        reason: ''
      })
      fetchData() // Refresh appointments
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to book appointment')
    } finally {
      setSubmitting(false)
    }
  }

  const cancelAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/api/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccess('Appointment cancelled successfully')
      fetchData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to cancel appointment')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getMinDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1) // Minimum 1 hour from now
    return now.toISOString().slice(0, 16)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
          <p className="text-sm text-gray-600 mt-1">Book and manage your doctor appointments</p>
        </div>
        <button
          onClick={() => setShowBookingForm(!showBookingForm)}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-semibold flex items-center gap-2"
        >
          <span>📅</span>
          {showBookingForm ? 'Cancel' : 'Book New Appointment'}
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <p className="text-green-800 font-medium">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-800 hover:text-green-900">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <p className="text-red-800 font-medium">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-800 hover:text-red-900">✕</button>
        </div>
      )}

      {/* Booking Form */}
      {showBookingForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Book New Appointment</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Doctor <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.doctor_id}
                onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose a doctor...</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.full_name} {doctor.specialization ? `- ${doctor.specialization}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Visit <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows="3"
                placeholder="Describe your symptoms or reason for consultation..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              ></textarea>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Booking...' : 'Confirm Appointment'}
              </button>
              <button
                type="button"
                onClick={() => setShowBookingForm(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {appointments.length > 0 ? `${appointments.length} Appointment${appointments.length !== 1 ? 's' : ''}` : 'No Appointments'}
          </h3>
        </div>
        <div className="p-6">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-gray-500 text-lg mb-4">No appointments scheduled</p>
              <button
                onClick={() => setShowBookingForm(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-semibold"
              >
                Book Your First Appointment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-lg font-bold text-gray-900">
                          Dr. {appointment.doctor_name}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      
                      {appointment.doctor_specialization && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-semibold">Specialization:</span> {appointment.doctor_specialization}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">📅 Date:</span> {new Date(appointment.appointment_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">🕐 Time:</span> {new Date(appointment.appointment_date).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded-lg mb-3">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Reason:</p>
                        <p className="text-sm text-gray-600">{appointment.reason}</p>
                      </div>
                      
                      {appointment.notes && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-semibold text-blue-900 mb-1">Doctor's Notes:</p>
                          <p className="text-sm text-blue-800">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    {appointment.status === 'scheduled' && (
                      <button
                        onClick={() => cancelAppointment(appointment.id)}
                        className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 text-sm font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Doctors */}
      {doctors.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Available Doctors</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                      {doctor.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Dr. {doctor.full_name}</h4>
                      {doctor.specialization && (
                        <p className="text-xs text-gray-600">{doctor.specialization}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{doctor.email}</p>
                  <button
                    onClick={() => {
                      setFormData({ ...formData, doctor_id: doctor.id.toString() })
                      setShowBookingForm(true)
                    }}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm font-semibold"
                  >
                    Book Appointment
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
