'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  currentCondition: string
  rehabGoals: string
  hasAssignedPhysio: boolean
  assignedPhysio?: {
    id: string
    name: string
    specialization: string
  } | null
  linkedCenterCount: number
}

interface Physio {
  id: string
  firstName: string
  lastName: string
  email: string
  specialization: string | null
  stats: {
    currentPatients: number
    activePlans: number
    totalPatientsServed: number
  }
}

interface Exercise {
  id: string
  name: string
  description: string | null
  category: string
  difficulty: string
  duration: number
  reps: number | null
  sets: number | null
  videoUrl: string | null
  imageUrl: string | null
  instructions: string | null
}

interface LinkPatientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function LinkPatientModal({ isOpen, onClose, onSuccess }: LinkPatientModalProps) {
  const [step, setStep] = useState(1) // 1: Select Patient, 2: Select Physio, 3: Create Exercise Plan
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Patient selection
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  
  // Physio selection
  const [physios, setPhysios] = useState<Physio[]>([])
  const [selectedPhysio, setSelectedPhysio] = useState<Physio | null>(null)
  
  // Exercise plan
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercises, setSelectedExercises] = useState<Array<{
    exerciseId: string
    sets: number
    reps: number
    notes: string
    orderIndex: number
  }>>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')

  // Load available patients
  useEffect(() => {
    if (isOpen && step === 1) {
      loadAvailablePatients()
    }
  }, [isOpen, step])

  // Load physios when step 2
  useEffect(() => {
    if (isOpen && step === 2) {
      loadPhysios()
    }
  }, [isOpen, step])

  // Load exercises when step 3
  useEffect(() => {
    if (isOpen && step === 3) {
      loadExercises()
    }
  }, [isOpen, step])

  const loadAvailablePatients = async () => {
    try {
      const response = await fetch('/api/center/patients/available')
      const data = await response.json()
      
      if (data.success) {
        setPatients(data.data.patients)
      } else {
        setError(data.error || 'Failed to load patients')
      }
    } catch (err) {
      setError('Failed to load patients')
    }
  }

  const loadPhysios = async () => {
    try {
      const response = await fetch('/api/center/physios')
      const data = await response.json()
      
      if (data.success) {
        setPhysios(data.physios)
      } else {
        setError(data.error || 'Failed to load physios')
      }
    } catch (err) {
      setError('Failed to load physios')
    }
  }

  const loadExercises = async () => {
    try {
      const response = await fetch('/api/exercises?limit=100')
      const data = await response.json()
      
      if (data.success) {
        setExercises(data.data.exercises)
      } else {
        setError(data.error || 'Failed to load exercises')
      }
    } catch (err) {
      setError('Failed to load exercises')
    }
  }

  const handleNext = () => {
    if (step === 1 && selectedPatient) {
      setStep(2)
    } else if (step === 2 && selectedPhysio) {
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const addExercise = (exercise: Exercise) => {
    const newExercise = {
      exerciseId: exercise.id,
      sets: 3,
      reps: 10,
      notes: '',
      orderIndex: selectedExercises.length,
    }
    setSelectedExercises([...selectedExercises, newExercise])
  }

  const removeExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index))
  }

  const updateExercise = (index: number, field: string, value: any) => {
    const updated = [...selectedExercises]
    updated[index] = { ...updated[index], [field]: value }
    setSelectedExercises(updated)
  }

  const handleSubmit = async () => {
    if (!selectedPatient || !selectedPhysio || selectedExercises.length === 0) {
      setError('Please complete all required fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/center/patients/link-and-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          physioId: selectedPhysio.id,
          notes,
          exercisePlan: {
            startDate,
            endDate,
            exercises: selectedExercises,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
        onClose()
        resetForm()
      } else {
        setError(data.error || 'Failed to link patient and create exercise plan')
      }
    } catch (err) {
      setError('Failed to link patient and create exercise plan')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSelectedPatient(null)
    setSelectedPhysio(null)
    setSelectedExercises([])
    setStartDate('')
    setEndDate('')
    setNotes('')
    setError(null)
  }

  const filteredPatients = patients.filter(patient =>
    patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.currentCondition.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Link Patient & Create Exercise Plan
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepNumber}
                </div>
                <span className={`ml-2 text-sm ${
                  step >= stepNumber ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {stepNumber === 1 && 'Select Patient'}
                  {stepNumber === 2 && 'Assign Physio'}
                  {stepNumber === 3 && 'Create Plan'}
                </span>
                {stepNumber < 3 && (
                  <div className={`w-8 h-0.5 ml-4 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Select Patient */}
        {step === 1 && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Available Patients
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

            <div className="max-h-64 overflow-y-auto mb-4">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No patients found matching your search.' : 'No patients available.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPatient?.id === patient.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {patient.firstName} {patient.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{patient.email}</p>
                          <p className="text-sm text-gray-500">{patient.currentCondition}</p>
                          {patient.hasAssignedPhysio && (
                            <p className="text-sm text-orange-600">
                              Already assigned to: {patient.assignedPhysio?.name}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 ml-4">
                          <div>Linked to {patient.linkedCenterCount} center(s)</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select Physio */}
        {step === 2 && (
          <div>
            <div className="mb-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Select Physio for {selectedPatient?.firstName} {selectedPatient?.lastName}
              </h4>
              <p className="text-sm text-gray-600">
                Choose a physio to assign to this patient and create their exercise plan.
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto mb-4">
              {physios.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No physios available in your center.
                </div>
              ) : (
                <div className="space-y-2">
                  {physios.map((physio) => (
                    <div
                      key={physio.id}
                      onClick={() => setSelectedPhysio(physio)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPhysio?.id === physio.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {physio.firstName} {physio.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{physio.email}</p>
                          {physio.specialization && (
                            <p className="text-sm text-gray-500">{physio.specialization}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 ml-4">
                          <div>Current patients: {physio.stats.currentPatients}</div>
                          <div>Active plans: {physio.stats.activePlans}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Create Exercise Plan */}
        {step === 3 && (
          <div>
            <div className="mb-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Create Exercise Plan
              </h4>
              <p className="text-sm text-gray-600">
                Create an exercise plan for {selectedPatient?.firstName} {selectedPatient?.lastName} 
                with {selectedPhysio?.firstName} {selectedPhysio?.lastName}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Exercise plan start date"
                  title="Exercise plan start date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Exercise plan end date"
                  title="Exercise plan end date"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this patient or exercise plan..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Selected Exercises */}
            <div className="mb-4">
              <h5 className="text-md font-medium text-gray-900 mb-2">
                Selected Exercises ({selectedExercises.length})
              </h5>
              {selectedExercises.length === 0 ? (
                <p className="text-sm text-gray-500">No exercises selected yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedExercises.map((exercise, index) => {
                    const exerciseData = exercises.find(ex => ex.id === exercise.exerciseId)
                    return (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h6 className="font-medium text-gray-900">
                            {exerciseData?.name || 'Unknown Exercise'}
                          </h6>
                          <button
                            onClick={() => removeExercise(index)}
                            className="text-red-600 hover:text-red-800"
                            aria-label="Remove exercise"
                            title="Remove exercise"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Sets</label>
                            <input
                              type="number"
                              min="1"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              aria-label="Number of sets"
                              title="Number of sets"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Reps</label>
                            <input
                              type="number"
                              min="1"
                              value={exercise.reps}
                              onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value))}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              aria-label="Number of reps"
                              title="Number of reps"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700">Notes</label>
                            <input
                              type="text"
                              value={exercise.notes}
                              onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                              placeholder="Exercise notes..."
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              aria-label="Exercise notes"
                              title="Exercise notes"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Available Exercises */}
            <div>
              <h5 className="text-md font-medium text-gray-900 mb-2">
                Available Exercises
              </h5>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {exercises.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Loading exercises...
                  </div>
                ) : (
                  <div className="space-y-1">
                    {exercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => addExercise(exercise)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h6 className="font-medium text-sm text-gray-900">{exercise.name}</h6>
                            <p className="text-xs text-gray-500">
                              {exercise.category} • {exercise.difficulty} • {exercise.duration}min
                            </p>
                          </div>
                          <PlusIcon className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <div>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={
                  (step === 1 && !selectedPatient) ||
                  (step === 2 && !selectedPhysio)
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || selectedExercises.length === 0 || !startDate || !endDate}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Plan'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
