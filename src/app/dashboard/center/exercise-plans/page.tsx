'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PlusIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

const exercisePlanSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  physioId: z.string().min(1, 'Please select a physio'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  notes: z.string().optional(),
  exercises: z.array(z.object({
    exerciseId: z.string().min(1, 'Please select an exercise'),
    sets: z.number().min(1, 'Sets must be at least 1'),
    reps: z.number().min(1, 'Reps must be at least 1'),
    order: z.number().min(0),
  })).min(1, 'At least one exercise is required'),
});

type ExercisePlanForm = z.infer<typeof exercisePlanSchema>;

interface EmailModalProps {
  patient: Patient;
  onClose: () => void;
  onSend: (patientId: string, subject: string, message: string, includeExercisePlan: boolean) => void;
  loading: boolean;
}

const EmailModal: React.FC<EmailModalProps> = ({ patient, onClose, onSend, loading }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [includeExercisePlan, setIncludeExercisePlan] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim() && message.trim()) {
      onSend(patient.id, subject.trim(), message.trim(), includeExercisePlan);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Send Exercise Reminder
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close email modal"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>To:</strong> {patient.firstName} {patient.lastName} ({patient.email})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Exercise Plan Reminder"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeExercisePlan"
              checked={includeExercisePlan}
              onChange={(e) => setIncludeExercisePlan(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="includeExercisePlan" className="ml-2 block text-sm text-gray-700">
              Include current exercise plan details
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !subject.trim() || !message.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentCondition: string;
  rehabGoals: string;
}

interface Physio {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  license: string;
  specialization: string;
}

interface Exercise {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  imageUrl: string;
  instructions: string;
}

export default function ExercisePlanPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [physios, setPhysios] = useState<Physio[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showNoPhysioError, setShowNoPhysioError] = useState(false);
  const [showNoPatientError, setShowNoPatientError] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [selectedPatientForEmail, setSelectedPatientForEmail] = useState<Patient | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExercisePlanForm>({
    resolver: zodResolver(exercisePlanSchema),
    defaultValues: {
      exercises: [{ exerciseId: '', sets: 1, reps: 10, order: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'exercises',
  });

  const watchedExercises = watch('exercises');

  useEffect(() => {
    fetchPatients();
    fetchPhysios();
    fetchExercises();
  }, []);

  const fetchPatients = async () => {
    try {
      console.log('🔍 Client: Fetching center patients...');
      const response = await fetch('/api/center/patients');
      console.log('🔍 Client: Patients response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Client: Patients data:', data);
        setPatients(data.patients);
        
        // Check if no patients are registered
        if (data.patients.length === 0) {
          setShowNoPatientError(true);
        } else {
          setShowNoPatientError(false);
        }
      } else {
        const errorData = await response.json();
        console.log('🔍 Client: Patients error response:', errorData);
        toast.error(`Failed to fetch patients: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Client: Error fetching patients:', error);
      toast.error('Failed to fetch patients');
    }
  };

  const fetchPhysios = async () => {
    try {
      console.log('🔍 Client: Fetching center physios...');
      const response = await fetch('/api/center/physios');
      console.log('🔍 Client: Physios response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Client: Physios data:', data);
        setPhysios(data.physios);
        
        // Check if no physios are registered
        if (data.physios.length === 0) {
          setShowNoPhysioError(true);
        } else {
          setShowNoPhysioError(false);
        }
      } else {
        const errorData = await response.json();
        console.log('🔍 Client: Physios error response:', errorData);
        toast.error(`Failed to fetch physios: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Client: Error fetching physios:', error);
      toast.error('Failed to fetch physios');
    }
  };

  const fetchExercises = async () => {
    try {
      console.log('🔍 Client: Fetching exercises...');
      const response = await fetch('/api/center/exercises');
      console.log('🔍 Client: Response status:', response.status);
      console.log('🔍 Client: Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Client: Response data:', data);
        setExercises(data.exercises);
      } else {
        const errorData = await response.json();
        console.log('🔍 Client: Error response:', errorData);
        toast.error(`Failed to fetch exercises: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Client: Error fetching exercises:', error);
      toast.error('Failed to fetch exercises');
    }
  };

  const onSubmit = async (data: ExercisePlanForm) => {
    setLoading(true);
    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Exercise plan created successfully!');
        reset();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create exercise plan');
      }
    } catch (error) {
      console.error('Error creating exercise plan:', error);
      toast.error('Failed to create exercise plan');
    } finally {
      setLoading(false);
    }
  };

  const addExercise = () => {
    append({
      exerciseId: '',
      sets: 1,
      reps: 10,
      order: fields.length,
    });
  };

  const removeExercise = (index: number) => {
    remove(index);
  };

  const showExerciseDetails = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    setSelectedExercise(exercise || null);
  };

  const sendEmailReminder = async (patientId: string, subject: string, message: string, includeExercisePlan: boolean = false) => {
    setEmailLoading(true);
    try {
      const response = await fetch('/api/center/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          subject,
          message,
          includeExercisePlan
        }),
      });

      if (response.ok) {
        toast.success('Email reminder sent successfully!');
        setShowEmailModal(false);
        setSelectedPatientForEmail(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to send email reminder');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email reminder');
    } finally {
      setEmailLoading(false);
    }
  };

  const openEmailModal = (patient: Patient) => {
    setSelectedPatientForEmail(patient);
    setShowEmailModal(true);
  };

  return (
    <DashboardLayout userType="center">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Exercise Plan</h1>
          <p className="text-gray-600 mt-2">
            Create a personalized exercise plan for your patients with specific sets, reps, and instructions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Exercise Plan Form */}
          <div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Patient and Physio Selection */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient & Physio Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Patient *
                    </label>
                    <select
                      {...register('patientId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a patient...</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName} - {patient.currentCondition}
                        </option>
                      ))}
                    </select>
                    {errors.patientId && (
                      <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Physio *
                    </label>
                    <select
                      {...register('physioId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a physio...</option>
                      {physios.map((physio) => (
                        <option key={physio.id} value={physio.id}>
                          Dr. {physio.firstName} {physio.lastName} - {physio.specialization}
                        </option>
                      ))}
                    </select>
                    {errors.physioId && (
                      <p className="text-red-500 text-sm mt-1">{errors.physioId.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Plan Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Plan Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      {...register('startDate')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.startDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      {...register('endDate')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.endDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional instructions or notes for the patient..."
                  />
                </div>
              </div>

              {/* Exercises */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Exercises</h2>
                  <button
                    type="button"
                    onClick={addExercise}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Exercise
                  </button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Exercise {index + 1}
                      </h3>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExercise(index)}
                          className="text-red-600 hover:text-red-800"
                          aria-label="Remove exercise"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Exercise *
                        </label>
                        <div className="flex gap-2">
                          <select
                            {...register(`exercises.${index}.exerciseId`)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select exercise...</option>
                            {exercises.map((exercise) => (
                              <option key={exercise.id} value={exercise.id}>
                                {exercise.name}
                              </option>
                            ))}
                          </select>
                          {watchedExercises[index]?.exerciseId && (
                            <button
                              type="button"
                              onClick={() => showExerciseDetails(watchedExercises[index].exerciseId)}
                              className="px-3 py-2 text-blue-600 hover:text-blue-800"
                              aria-label="View exercise details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                        {errors.exercises?.[index]?.exerciseId && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.exercises[index]?.exerciseId?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sets *
                        </label>
                        <input
                          type="number"
                          min="1"
                          {...register(`exercises.${index}.sets`, { valueAsNumber: true })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.exercises?.[index]?.sets && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.exercises[index]?.sets?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reps *
                        </label>
                        <input
                          type="number"
                          min="1"
                          {...register(`exercises.${index}.reps`, { valueAsNumber: true })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.exercises?.[index]?.reps && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.exercises[index]?.reps?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {errors.exercises && (
                  <p className="text-red-500 text-sm mt-2">{errors.exercises.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting || loading ? 'Creating Plan...' : 'Create Exercise Plan'}
                </button>
              </div>
            </form>

            
          </div>
        </div>
      </div>

      {/* No Physio Error Modal */}
      {showNoPhysioError && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">No Physios Registered</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  You need to register at least one physio to your center before creating exercise plans.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => window.location.href = '/dashboard/center/physios'}
                  className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  Go to Physio Management
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Patient Error Modal */}
      {showNoPatientError && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">No Patients Registered</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  You need to register at least one patient to your center before creating exercise plans.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => window.location.href = '/dashboard/center/patients'}
                  className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  Go to Patient Management
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      

      {/* Exercise Media Preview Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedExercise.name}</h3>
                <p className="text-sm text-gray-600">{selectedExercise.category}</p>
              </div>
              <button
                onClick={() => setSelectedExercise(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close preview"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedExercise.imageUrl ? (
              <div className="w-full">
                {selectedExercise.imageUrl.includes('.mp4') || selectedExercise.imageUrl.includes('video') ? (
                  <video
                    src={selectedExercise.imageUrl.startsWith('http') ? `/api/proxy/video?url=${encodeURIComponent(selectedExercise.imageUrl)}` : selectedExercise.imageUrl}
                    className="w-full h-auto rounded-md"
                    controls
                    playsInline
                    crossOrigin="anonymous"
                    onError={(e) => {
                      // Hide the video element on error and show fallback below
                      (e.currentTarget as HTMLVideoElement).style.display = 'none';
                      const fallback = (e.currentTarget.nextElementSibling as HTMLElement);
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : (
                  <img
                    src={selectedExercise.imageUrl.startsWith('http') ? `/api/proxy/video?url=${encodeURIComponent(selectedExercise.imageUrl)}` : selectedExercise.imageUrl}
                    alt={selectedExercise.name}
                    className="w-full h-auto rounded-md object-contain"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                      const fallback = (e.currentTarget.nextElementSibling as HTMLElement);
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                )}
                <div className="w-full h-64 items-center justify-center bg-gray-100 rounded-md text-gray-500 hidden">
                  Media not available
                </div>
              </div>
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-md text-gray-500">
                No image available for this exercise
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
