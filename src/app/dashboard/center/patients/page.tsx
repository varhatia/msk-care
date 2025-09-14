'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LinkPatientModal from '@/components/center/LinkPatientModal'
import { PlusIcon, MagnifyingGlassIcon, XMarkIcon, EnvelopeIcon, UserPlusIcon } from '@heroicons/react/24/outline'

interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  currentCondition: string
  rehabGoals: string
  isActive: boolean
  createdAt: string
  centerPatientId: string
  addedAt: string
  notes?: string
  physio?: {
    id: string
    firstName: string
    lastName: string
  }
  latestPrescription?: {
    id: string
    startDate: string
    endDate: string
    status: string
    physio: {
      firstName: string
      lastName: string
    }
  }
}

interface GlobalPatient {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  currentCondition: string
  rehabGoals: string
  createdAt: string
}

export default function CenterPatientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [globalPatients, setGlobalPatients] = useState<GlobalPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<GlobalPatient | null>(null)
  const [notes, setNotes] = useState('')
  const [linkingPatient, setLinkingPatient] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [selectedPatientForEmail, setSelectedPatientForEmail] = useState<Patient | null>(null)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [planLoading, setPlanLoading] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [selectedPatientForPlan, setSelectedPatientForPlan] = useState<Patient | null>(null)
  const [latestPlan, setLatestPlan] = useState<any | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchPatients()
  }, [session, status, router])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/center/patients')
      
      if (!response.ok) {
        throw new Error('Failed to fetch patients')
      }

      const data = await response.json()
      setPatients(data.patients || [])
    } catch (err) {
      console.error('Error fetching patients:', err)
      setError('Failed to load patients')
    } finally {
      setLoading(false)
    }
  }

  const fetchGlobalPatients = async () => {
    try {
      const response = await fetch('/api/patients')
      
      if (!response.ok) {
        throw new Error('Failed to fetch global patients')
      }

      const data = await response.json()
      setGlobalPatients(data.patients || [])
    } catch (err) {
      console.error('Error fetching global patients:', err)
      setError('Failed to load global patients')
    }
  }

  const handleAddPatient = async () => {
    if (!selectedPatient) return

    try {
      setLinkingPatient(true)
      const response = await fetch('/api/center/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          notes: notes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to link patient')
      }

      // Refresh the patients list
      await fetchPatients()
      
      // Close modal and reset form
      setShowAddModal(false)
      setSelectedPatient(null)
      setNotes('')
      setSearchTerm('')
    } catch (err) {
      console.error('Error linking patient:', err)
      setError(err instanceof Error ? err.message : 'Failed to link patient')
    } finally {
      setLinkingPatient(false)
    }
  }

  const openAddModal = () => {
    setShowAddModal(true)
    fetchGlobalPatients()
  }

  const closeAddModal = () => {
    setShowAddModal(false)
    setSelectedPatient(null)
    setNotes('')
    setSearchTerm('')
  }

  const filteredGlobalPatients = globalPatients.filter(patient => {
    const searchLower = searchTerm.toLowerCase()
    return (
      patient.firstName.toLowerCase().includes(searchLower) ||
      patient.lastName.toLowerCase().includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower) ||
      patient.currentCondition.toLowerCase().includes(searchLower)
    )
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const openEmailModal = (patient: Patient) => {
    setSelectedPatientForEmail(patient)
    setShowEmailModal(true)
  }

  const closeEmailModal = () => {
    setSelectedPatientForEmail(null)
    setShowEmailModal(false)
  }

  const sendEmailReminder = async (patientId: string, subject: string, message: string, includeExercisePlan: boolean = true) => {
    setEmailLoading(true)
    try {
      const response = await fetch('/api/center/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, subject, message, includeExercisePlan })
      })
      if (response.ok) {
        setShowEmailModal(false)
        setSelectedPatientForEmail(null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to send email')
      }
    } catch (e) {
      setError('Failed to send email')
    } finally {
      setEmailLoading(false)
    }
  }

  const getPhysioName = (patient: Patient) => {
    if (patient.latestPrescription?.physio) {
      return `${patient.latestPrescription.physio.firstName} ${patient.latestPrescription.physio.lastName}`
    }
    if (patient.physio) {
      return `${patient.physio.firstName} ${patient.physio.lastName}`
    }
    return 'Not assigned'
  }

  const getPrescriptionStatus = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
      case 'COMPLETED':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Completed</span>
      case 'PAUSED':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Paused</span>
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>
    }
  }

  const openPlanModal = async (patient: Patient) => {
    setSelectedPatientForPlan(patient)
    setShowPlanModal(true)
    setPlanLoading(true)
    try {
      const res = await fetch(`/api/center/prescriptions?patientId=${encodeURIComponent(patient.id)}&latest=1`)
      if (!res.ok) throw new Error('Failed to load plan')
      const json = await res.json()
      const plan = (json.prescriptions && json.prescriptions[0]) || null
      setLatestPlan(plan)
    } catch (e) {
      setLatestPlan(null)
      setError('Failed to load exercise plan')
    } finally {
      setPlanLoading(false)
    }
  }

  const closePlanModal = () => {
    setShowPlanModal(false)
    setSelectedPatientForPlan(null)
    setLatestPlan(null)
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout userType="center">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="center">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Center Patients</h1>
              <p className="text-gray-600">Manage and view all patients registered with your center</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLinkModal(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Link & Assign
              </button>
              <button
                onClick={openAddModal}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Patient
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Patient List</h2>
              <span className="text-sm text-gray-500">
                {patients.length} patient{patients.length !== 1 ? 's' : ''} registered
              </span>
            </div>
          </div>

          {patients.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
              <p className="text-gray-500 mb-4">Patients will appear here once they are registered and linked to your center.</p>
              <button
                onClick={openAddModal}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Your First Patient
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Physio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exercise Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {patient.id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {patient.currentCondition}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.email}</div>
                        <div className="text-sm text-gray-500">{patient.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getPhysioName(patient)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.latestPrescription ? (
                          <button
                            onClick={() => openPlanModal(patient)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            aria-label="View exercise plan"
                          >
                            View Plan
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">No plan</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.latestPrescription ? (
                          <div>
                            <div>Start: {formatDate(patient.latestPrescription.startDate)}</div>
                            <div>End: {formatDate(patient.latestPrescription.endDate)}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.latestPrescription ? (
                          getPrescriptionStatus(patient.latestPrescription.status)
                        ) : (
                          <span className="text-gray-400 text-sm">No plan</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(patient.addedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => openEmailModal(patient)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          aria-label="Send email reminder"
                          title="Send email reminder"
                        >
                          <EnvelopeIcon className="h-4 w-4 mr-2" />
                          Email
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Patient Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add Patient to Center</h3>
                  <button
                    onClick={closeAddModal}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Patients
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or condition..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mb-4 max-h-64 overflow-y-auto">
                  {filteredGlobalPatients.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No patients found matching your search.' : 'No patients available.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredGlobalPatients.map((patient) => (
                        <div
                          key={patient.id}
                          onClick={() => setSelectedPatient(patient)}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedPatient?.id === patient.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {patient.firstName} {patient.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">{patient.email}</p>
                              <p className="text-sm text-gray-500">{patient.currentCondition}</p>
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatDate(patient.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedPatient && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this patient..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeAddModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPatient}
                    disabled={!selectedPatient || linkingPatient}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {linkingPatient ? 'Linking...' : 'Link Patient'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && selectedPatientForEmail && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Send Exercise Reminder</h3>
              <button onClick={closeEmailModal} className="text-gray-400 hover:text-gray-600" aria-label="Close email modal">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>To:</strong> {selectedPatientForEmail.firstName} {selectedPatientForEmail.lastName} ({selectedPatientForEmail.email})
              </p>
            </div>
            <EmailForm
              loading={emailLoading}
              onCancel={closeEmailModal}
              onSend={(subject, message, includePlan) => sendEmailReminder(selectedPatientForEmail.id, subject, message, includePlan)}
            />
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Exercise Plan</h3>
              <button onClick={closePlanModal} className="text-gray-400 hover:text-gray-600" aria-label="Close plan modal">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {planLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : !latestPlan ? (
              <div className="text-center text-gray-500 py-8">No plan found</div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <div>
                    Patient: <span className="font-medium text-gray-900">{latestPlan.patient.firstName} {latestPlan.patient.lastName}</span>
                  </div>
                  <div>
                    Physio: <span className="font-medium text-gray-900">{latestPlan.physio.firstName} {latestPlan.physio.lastName}</span>
                  </div>
                  <div>
                    Period: <span className="font-medium text-gray-900">{new Date(latestPlan.startDate).toLocaleDateString()} - {new Date(latestPlan.endDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg">
                  <div className="px-4 py-2 bg-gray-50 border-b text-sm font-medium text-gray-700">Assigned Exercises</div>
                  <div className="divide-y">
                    {latestPlan.items.map((it: any, idx: number) => (
                      <div key={idx} className="p-4 flex items-start gap-4">
                        {it.imageUrl ? (
                          it.imageUrl.includes('.mp4') || it.imageUrl.includes('video') ? (
                            <video
                              src={it.imageUrl.startsWith('http') ? `/api/proxy/video?url=${encodeURIComponent(it.imageUrl)}` : it.imageUrl}
                              className="w-24 h-24 rounded object-cover"
                              muted
                              loop
                              playsInline
                              preload="metadata"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                (e.currentTarget as HTMLVideoElement).style.display = 'none'
                                const fallback = (e.currentTarget.nextElementSibling as HTMLElement)
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                          ) : (
                            <img
                              src={it.imageUrl.startsWith('http') ? `/api/proxy/video?url=${encodeURIComponent(it.imageUrl)}` : it.imageUrl}
                              alt={it.name}
                              className="w-24 h-24 object-cover rounded"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none'
                                const fallback = (e.currentTarget.nextElementSibling as HTMLElement)
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                          )
                        ) : null}
                        <div className="w-24 h-24 bg-gray-100 rounded hidden items-center justify-center text-gray-400 text-xs">No Media</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-gray-900">{it.name}</div>
                            <div className="text-xs text-gray-500">{it.category} · {it.difficulty}</div>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">{it.instructions || it.description || ''}</div>
                          <div className="mt-2 text-sm">
                            <span className="font-medium text-gray-900">{it.sets}</span> sets × <span className="font-medium text-gray-900">{it.reps}</span> reps · <span className="font-medium text-gray-900">{it.duration}</span> min
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <PlanEditor
                  plan={latestPlan}
                  onClose={closePlanModal}
                  onSaved={(p) => setLatestPlan(p)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Link Patient Modal */}
      <LinkPatientModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onSuccess={() => {
          setShowLinkModal(false)
          fetchPatients() // Refresh the patient list
        }}
      />
    </DashboardLayout>
  )
}

interface PlanEditorProps {
  plan: any
  onClose: () => void
  onSaved: (plan: any) => void
}

function PlanEditor({ plan, onClose, onSaved }: PlanEditorProps) {
  const [saving, setSaving] = useState(false)
  const [startDate, setStartDate] = useState<string>(plan.startDate?.slice(0,10) ?? '')
  const [endDate, setEndDate] = useState<string>(plan.endDate?.slice(0,10) ?? '')
  const [items, setItems] = useState<any[]>(plan.items || [])
  const [allExercises, setAllExercises] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/center/exercises')
        if (res.ok) {
          const json = await res.json()
          setAllExercises(json.exercises || [])
        }
      } catch {}
    }
    load()
  }, [])

  const addItem = () => {
    setItems((prev) => ([...prev, {
      name: allExercises[0]?.name || 'Exercise',
      description: allExercises[0]?.description || null,
      category: allExercises[0]?.category || 'General',
      difficulty: allExercises[0]?.difficulty || 'BEGINNER',
      duration: allExercises[0]?.duration || 10,
      imageUrl: allExercises[0]?.imageUrl || null,
      videoUrl: allExercises[0]?.videoUrl || null,
      instructions: allExercises[0]?.instructions || null,
      sets: 1,
      reps: 10,
      orderIndex: (prev[prev.length-1]?.orderIndex ?? prev.length) + 1,
    }]))
  }

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const replaceItem = (idx: number, exerciseId: string) => {
    const ex = allExercises.find((e: any) => e.id === exerciseId)
    if (!ex) return
    setItems((prev) => prev.map((it, i) => i === idx ? {
      ...it,
      name: ex.name,
      description: ex.description ?? null,
      category: ex.category,
      difficulty: ex.difficulty,
      duration: ex.duration,
      imageUrl: ex.imageUrl ?? null,
      videoUrl: ex.videoUrl ?? null,
      instructions: ex.instructions ?? null,
    } : it))
  }

  const updateItemField = (idx: number, field: string, value: any) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/center/prescriptions/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, items }),
      })
      if (!res.ok) throw new Error('Failed to save')
      onSaved({ ...plan, startDate, endDate, items })
      onClose()
    } catch (e) {
      // TODO: toast error if available
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" id="plan-start-date" title="Plan start date" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" id="plan-end-date" title="Plan end date" />
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg">
        <div className="px-4 py-2 bg-gray-50 border-b text-sm font-medium text-gray-700 flex items-center justify-between">
          <span>Exercises</span>
          <button onClick={addItem} className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">Add Exercise</button>
        </div>
        <div className="divide-y">
          {items.map((it, idx) => (
            <div key={idx} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">{it.name}</div>
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e)=>replaceItem(idx, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-md"
                    aria-label="Replace exercise"
                  >
                    <option value="">Replace with...</option>
                    {allExercises.map((ex:any)=>(
                      <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                  </select>
                  <button onClick={()=>removeItem(idx)} className="px-2 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700">Remove</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Sets</label>
                  <input type="number" min={1} value={it.sets} onChange={(e)=>updateItemField(idx,'sets', Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 rounded" id={`sets-${idx}`} title="Sets" placeholder="Sets" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Reps</label>
                  <input type="number" min={1} value={it.reps} onChange={(e)=>updateItemField(idx,'reps', Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 rounded" id={`reps-${idx}`} title="Reps" placeholder="Reps" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Duration (min)</label>
                  <input type="number" min={1} value={it.duration} onChange={(e)=>updateItemField(idx,'duration', Number(e.target.value))} className="w-full px-2 py-1 border border-gray-300 rounded" id={`duration-${idx}`} title="Duration in minutes" placeholder="Minutes" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel</button>
        <button onClick={save} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </div>
  )
}

interface EmailFormProps {
  loading: boolean
  onCancel: () => void
  onSend: (subject: string, message: string, includeExercisePlan: boolean) => void
}

function EmailForm({ loading, onCancel, onSend }: EmailFormProps) {
  const [subject, setSubject] = useState('Exercise Plan Reminder')
  const [message, setMessage] = useState('Hi, this is a friendly reminder to complete your prescribed exercises for today.')
  const [includePlan, setIncludePlan] = useState(true)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    onSend(subject.trim(), message.trim(), includePlan)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          id="email-subject"
          placeholder="Exercise Plan Reminder"
          title="Email subject"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          id="email-message"
          placeholder="Write your message here..."
          title="Email message"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="includePlan"
          checked={includePlan}
          onChange={(e) => setIncludePlan(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="includePlan" className="ml-2 block text-sm text-gray-700">Include current exercise plan details</label>
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
          Cancel
        </button>
        <button type="submit" disabled={loading || !subject.trim() || !message.trim()} className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Sending...' : 'Send Email'}
        </button>
      </div>
    </form>
  )
}
