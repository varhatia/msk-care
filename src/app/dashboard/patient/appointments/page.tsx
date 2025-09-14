'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Validation schemas
const appointmentFormSchema = z.object({
  physioId: z.string().min(1, 'Please select a physiotherapist'),
  centerId: z.string().min(1, 'Please select a center'),
  date: z.string().min(1, 'Please select a date'),
  timeSlot: z.string().min(1, 'Please select a time slot'),
  type: z.enum(['CONSULTATION', 'FOLLOW_UP', 'ASSESSMENT', 'TREATMENT'], {
    required_error: 'Please select appointment type'
  }),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  notes: z.string().optional()
})

type AppointmentFormData = z.infer<typeof appointmentFormSchema>

interface Physio {
  id: string
  name: string
  specialization: string
  email: string
}

interface Center {
  id: string
  name: string
  address: string
  phone: string
  email: string
  physios: Physio[]
}

interface TimeSlot {
  startTime: string
  endTime: string
  displayTime: string
  date: string
}

interface Appointment {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  type: string
  status: string
  meetingUrl?: string
  notes?: string
  createdAt: string
  physio: {
    name: string
    specialization: string
  }
  center: {
    name: string
    address: string
    phone: string
  }
}

interface LinkedInfo {
  hasLinkedPhysio: boolean
  physio?: {
    id: string
    name: string
    specialization: string
    email: string
    center: {
      id: string
      name: string
      address: string
      phone: string
      email: string
    }
  }
  linkedCenters: Center[]
  canSelectCenter: boolean
}

export default function PatientAppointments() {
  const [linkedInfo, setLinkedInfo] = useState<LinkedInfo | null>(null)
  const [centers, setCenters] = useState<Center[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null)
  const [selectedPhysio, setSelectedPhysio] = useState<Physio | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema)
  })

  const watchedValues = watch()

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [linkedInfoResponse, centersResponse, appointmentsResponse] = await Promise.all([
        fetch('/api/patient/linked-info'),
        fetch('/api/patient/appointments/centers'),
        fetch('/api/patient/appointments')
      ])

      if (linkedInfoResponse.ok) {
        const data = await linkedInfoResponse.json()
        setLinkedInfo(data.data)
      }

      if (centersResponse.ok) {
        const data = await centersResponse.json()
        setCenters(data.data.centers)
      }

      if (appointmentsResponse.ok) {
        const data = await appointmentsResponse.json()
        setAppointments(data.data.appointments)
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCenterChange = (centerId: string) => {
    const center = centers.find(c => c.id === centerId)
    setSelectedCenter(center || null)
    setSelectedPhysio(null)
    setValue('centerId', centerId)
    setValue('physioId', '')
    setAvailableSlots([])
  }

  const handlePhysioChange = (physioId: string) => {
    const physio = selectedCenter?.physios.find(p => p.id === physioId)
    setSelectedPhysio(physio || null)
    setValue('physioId', physioId)
    setAvailableSlots([])
  }

  const handleDateChange = async (date: string) => {
    setValue('date', date)
    setValue('timeSlot', '')
    setAvailableSlots([])

    if (selectedPhysio && date) {
      try {
        const response = await fetch(
          `/api/patient/appointments/availability?physioId=${selectedPhysio.id}&date=${date}`
        )
        if (response.ok) {
          const data = await response.json()
          setAvailableSlots(data.data.availableSlots)
        }
      } catch (error) {
        console.error('Error fetching availability:', error)
      }
    }
  }

  const onSubmit = async (data: AppointmentFormData) => {
    setBookingLoading(true)
    try {
      const selectedSlot = availableSlots.find(slot => slot.startTime === data.timeSlot)
      if (!selectedSlot) {
        throw new Error('Selected time slot not found')
      }

      const appointmentData = {
        ...data,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime
      }

      const response = await fetch('/api/patient/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      })

      if (response.ok) {
        const result = await response.json()
        setAppointments(prev => [result.data.appointment, ...prev])
        reset()
        setShowBookingForm(false)
        setSelectedCenter(null)
        setSelectedPhysio(null)
        setAvailableSlots([])
        alert('Appointment booked successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to book appointment')
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      alert('Failed to book appointment')
    } finally {
      setBookingLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <ClockIcon className="h-5 w-5 text-blue-500" />
      case 'CONFIRMED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'CANCELLED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800'
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <DashboardLayout userType="patient" userName="John Doe" userEmail="john.doe@example.com">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="patient" userName="John Doe" userEmail="john.doe@example.com">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600">Manage your physiotherapy appointments</p>
          </div>
          <button
            onClick={() => setShowBookingForm(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Book Appointment</span>
          </button>
        </div>

        {/* Booking Form Modal */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Book New Appointment</h2>
                  <button
                    onClick={() => setShowBookingForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close booking form"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Center Selection (only if patient can select) */}
                  {linkedInfo?.canSelectCenter && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Center
                      </label>
                      <select
                        {...register('centerId')}
                        onChange={(e) => handleCenterChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Choose a center...</option>
                        {centers.map((center) => (
                          <option key={center.id} value={center.id}>
                            {center.name} - {center.address}
                          </option>
                        ))}
                      </select>
                      {errors.centerId && (
                        <p className="mt-1 text-sm text-red-600">{errors.centerId.message}</p>
                      )}
                    </div>
                  )}

                  {/* Physio Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Physiotherapist
                    </label>
                    {linkedInfo?.hasLinkedPhysio ? (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{linkedInfo.physio?.name}</p>
                        <p className="text-sm text-gray-600">{linkedInfo.physio?.specialization}</p>
                        <input type="hidden" {...register('physioId')} value={linkedInfo.physio?.id} />
                        <input type="hidden" {...register('centerId')} value={linkedInfo.physio?.center.id} />
                      </div>
                    ) : (
                      <select
                        {...register('physioId')}
                        onChange={(e) => handlePhysioChange(e.target.value)}
                        disabled={!selectedCenter}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                      >
                        <option value="">Choose a physiotherapist...</option>
                        {selectedCenter?.physios.map((physio) => (
                          <option key={physio.id} value={physio.id}>
                            {physio.name} - {physio.specialization}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.physioId && (
                      <p className="mt-1 text-sm text-red-600">{errors.physioId.message}</p>
                    )}
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    <input
                      type="date"
                      {...register('date')}
                      onChange={(e) => handleDateChange(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={!selectedPhysio && !linkedInfo?.hasLinkedPhysio}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                    )}
                  </div>

                  {/* Time Slot Selection */}
                  {availableSlots.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Time Slots
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.startTime}
                            type="button"
                            onClick={() => setValue('timeSlot', slot.startTime)}
                            className={`p-2 text-sm border rounded-lg hover:bg-primary-50 hover:border-primary-300 ${
                              watchedValues.timeSlot === slot.startTime
                                ? 'bg-primary-100 border-primary-500 text-primary-700'
                                : 'border-gray-300'
                            }`}
                          >
                            {slot.displayTime}
                          </button>
                        ))}
                      </div>
                      {errors.timeSlot && (
                        <p className="mt-1 text-sm text-red-600">{errors.timeSlot.message}</p>
                      )}
                    </div>
                  )}

                  {/* Appointment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Appointment Type
                    </label>
                    <select
                      {...register('type')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select type...</option>
                      <option value="CONSULTATION">Consultation</option>
                      <option value="FOLLOW_UP">Follow-up</option>
                      <option value="ASSESSMENT">Assessment</option>
                      <option value="TREATMENT">Treatment</option>
                    </select>
                    {errors.type && (
                      <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      {...register('title')}
                      placeholder="e.g., Initial Consultation"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      placeholder="Brief description of the appointment..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={2}
                      placeholder="Any additional notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {bookingLoading ? 'Booking...' : 'Book Appointment'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Appointments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Your Appointments</h3>
              <p className="card-subtitle">Upcoming and past appointments</p>
            </div>
            
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(appointment.status)}
                          <h4 className="text-lg font-semibold text-gray-900">{appointment.title}</h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(appointment.startTime)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="h-4 w-4" />
                            <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4" />
                            <span>{appointment.physio.name} ({appointment.physio.specialization})</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{appointment.center.name}</span>
                          </div>
                        </div>

                        {appointment.description && (
                          <p className="mt-2 text-sm text-gray-600">{appointment.description}</p>
                        )}

                        {appointment.meetingUrl && (
                          <div className="mt-2">
                            <a
                              href={appointment.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
                            >
                              <VideoCameraIcon className="h-4 w-4" />
                              <span>Join Video Call</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No appointments found</p>
                <p className="text-gray-400 text-xs mt-1">Book your first appointment to get started</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
