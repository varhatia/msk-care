'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlayIcon, CalendarIcon, UserIcon, ClockIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { format } from 'date-fns';

interface PrescriptionItem {
  id: string;
  exerciseRefId?: string | null;
  name: string;
  description?: string | null;
  category: string;
  difficulty: string;
  duration: number;
  imageUrl?: string | null;
  videoUrl?: string | null;
  instructions?: string | null;
  sets: number;
  reps: number;
  notes?: string | null;
  orderIndex: number;
}

interface Prescription {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  physio: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items: PrescriptionItem[];
}

export default function PatientExercisesPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<PrescriptionItem | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch('/api/patient/prescriptions');
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions);
        if (data.prescriptions.length > 0) {
          setSelectedPrescription(data.prescriptions[0]);
        }
      } else {
        console.error('Failed to fetch prescriptions');
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-success-100 text-success-800';
      case 'COMPLETED':
        return 'bg-primary-100 text-primary-800';
      case 'EXPIRED':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-success-100 text-success-800';
      case 'INTERMEDIATE':
        return 'bg-warning-100 text-warning-800';
      case 'ADVANCED':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const showExerciseDetails = (exercise: PrescriptionItem) => {
    setSelectedExercise(exercise);
  };

  if (loading) {
    return (
      <DashboardLayout userType="patient">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="patient">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Exercise Plans</h1>
          <p className="text-gray-600 mt-2">
            View and follow your personalized exercise plans created by your physiotherapist.
          </p>
        </div>

        {prescriptions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-gray-400 mb-4">
                <PlayIcon className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Exercise Plans Yet</h3>
              <p className="text-gray-500">
                Your physiotherapist will create a personalized exercise plan for you soon.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Prescription List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Exercise Plans</h2>
                  <p className="text-sm text-gray-600">Select a plan to view details</p>
                </div>
                <div className="p-4 space-y-2">
                  {prescriptions.map((prescription, index) => (
                    <motion.button
                      key={prescription.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      onClick={() => setSelectedPrescription(prescription)}
                      className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                        selectedPrescription?.id === prescription.id
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          Plan {prescriptions.length - index}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(prescription.status)}`}>
                          {prescription.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {format(new Date(prescription.startDate), 'MMM dd')} - {format(new Date(prescription.endDate), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          Dr. {prescription.physio.firstName} {prescription.physio.lastName}
                        </div>
                        <div className="flex items-center">
                          <PlayIcon className="h-4 w-4 mr-1" />
                          {prescription.items.length} exercises
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Exercise Details */}
            <div className="lg:col-span-3">
              {selectedPrescription ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Plan Header */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Exercise Plan {prescriptions.findIndex(p => p.id === selectedPrescription.id) + 1}
                        </h2>
                        <p className="text-gray-600">
                          Created by Dr. {selectedPrescription.physio.firstName} {selectedPrescription.physio.lastName}
                        </p>
                      </div>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedPrescription.status)}`}>
                        {selectedPrescription.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="font-medium text-gray-900">Duration</p>
                          <p className="text-gray-600">
                            {format(new Date(selectedPrescription.startDate), 'MMM dd, yyyy')} - {format(new Date(selectedPrescription.endDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <PlayIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="font-medium text-gray-900">Exercises</p>
                          <p className="text-gray-600">{selectedPrescription.items.length} exercises</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="font-medium text-gray-900">Created</p>
                          <p className="text-gray-600">
                            {format(new Date(selectedPrescription.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedPrescription.notes && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Notes from your physiotherapist:</h4>
                        <p className="text-gray-600">{selectedPrescription.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Exercises List */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-900">Exercises</h3>
                      <p className="text-gray-600">Follow these exercises in order for best results</p>
                    </div>
                    <div className="p-6 space-y-6">
                      {selectedPrescription.items.map((exerciseItem, index) => (
                        <motion.div
                          key={exerciseItem.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                          onClick={() => showExerciseDetails(exerciseItem)}
                        >
                          <div className="flex items-start space-x-4">
                            {/* Exercise Image */}
                            <div className="flex-shrink-0">
                              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                                {exerciseItem.imageUrl ? (
                                  <>
                                    {exerciseItem.imageUrl.includes('.mp4') || exerciseItem.imageUrl.includes('video') ? (
                                      <video
                                        src={exerciseItem.imageUrl.startsWith('http') ? `/api/proxy/video?url=${encodeURIComponent(exerciseItem.imageUrl)}` : exerciseItem.imageUrl}
                                        className="w-full h-full object-cover"
                                        muted
                                        loop
                                        playsInline
                                        preload="metadata"
                                        crossOrigin="anonymous"
                                        onError={(e) => {
                                          console.log('Video failed to load, trying fallback...');
                                          e.currentTarget.style.display = 'none';
                                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                          if (nextElement) {
                                            nextElement.style.display = 'flex';
                                          }
                                        }}
                                      />
                                    ) : (
                                      <img
                                        src={exerciseItem.imageUrl.startsWith('http') ? `/api/proxy/video?url=${encodeURIComponent(exerciseItem.imageUrl)}` : exerciseItem.imageUrl}
                                        alt={exerciseItem.name}
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                        onError={(e) => {
                                          console.log('Image failed to load, showing placeholder...');
                                          e.currentTarget.style.display = 'none';
                                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                          if (nextElement) {
                                            nextElement.style.display = 'flex';
                                          }
                                        }}
                                      />
                                    )}
                                    {/* Fallback placeholder */}
                                    <div 
                                      className="w-full h-full flex items-center justify-center"
                                      style={{ display: 'none' }}
                                    >
                                      <PlayIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <PlayIcon className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Exercise Details */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    {index + 1}. {exerciseItem.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {exerciseItem.description}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(exerciseItem.difficulty)}`}>
                                    {exerciseItem.difficulty}
                                  </span>
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                                    {exerciseItem.category}
                                  </span>
                                </div>
                              </div>

                              {/* Exercise Instructions */}
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-sm font-medium text-gray-900">Sets & Reps</p>
                                  <p className="text-lg font-semibold text-primary-600">
                                    {exerciseItem.sets} × {exerciseItem.reps}
                                  </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-sm font-medium text-gray-900">Duration</p>
                                  <p className="text-lg font-semibold text-primary-600">
                                    {exerciseItem.duration} min
                                  </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-sm font-medium text-gray-900">Order</p>
                                  <p className="text-lg font-semibold text-primary-600">
                                    #{exerciseItem.orderIndex + 1}
                                  </p>
                                </div>
                              </div>

                              {exerciseItem.instructions && (
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                  <h5 className="font-medium text-gray-900 mb-2">Instructions:</h5>
                                  <p className="text-sm text-gray-700 line-clamp-3">{exerciseItem.instructions}</p>
                                </div>
                              )}

                              <div className="mt-4 flex justify-end">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    showExerciseDetails(exerciseItem);
                                  }}
                                  className="inline-flex items-center px-3 py-1 text-sm text-primary-600 hover:text-primary-800"
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <PlayIcon className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Exercise Plan</h3>
                  <p className="text-gray-500">
                    Choose a plan from the list to view the exercises and instructions.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exercise Details Modal */}
        {selectedExercise && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{selectedExercise.name}</h3>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close exercise details"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDifficultyColor(selectedExercise.difficulty)}`}>
                    {selectedExercise.difficulty}
                  </span>
                  <span className="text-sm text-gray-600">{selectedExercise.category}</span>
                  <span className="text-sm text-gray-600">{selectedExercise.duration} minutes</span>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedExercise.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Sets:</span>
                    <span className="ml-1 text-gray-600">{selectedExercise.sets}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Reps:</span>
                    <span className="ml-1 text-gray-600">{selectedExercise.reps}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Duration:</span>
                    <span className="ml-1 text-gray-600">{selectedExercise.duration} min</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Order:</span>
                    <span className="ml-1 text-gray-600">#{selectedExercise.orderIndex + 1}</span>
                  </div>
                </div>
                
                {selectedExercise.instructions && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{selectedExercise.instructions}</p>
                  </div>
                )}

                {selectedExercise.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{selectedExercise.notes}</p>
                  </div>
                )}

                {(selectedExercise.videoUrl || (selectedExercise.imageUrl && (selectedExercise.imageUrl.includes('.mp4') || selectedExercise.imageUrl.includes('video')))) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Video Demo</h4>
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      {selectedExercise.videoUrl && selectedExercise.videoUrl.includes('youtube') ? (
                        /* YouTube embed */
                        <iframe
                          src={selectedExercise.videoUrl}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={`${selectedExercise.name} - YouTube Video`}
                        />
                      ) : (
                        /* Regular video */
                        <video
                          src={selectedExercise.videoUrl ? 
                            (selectedExercise.videoUrl.includes('youtube') ? selectedExercise.videoUrl : selectedExercise.videoUrl) :
                            (selectedExercise.imageUrl ? (selectedExercise.imageUrl.startsWith('http') ? `/api/proxy/video?url=${encodeURIComponent(selectedExercise.imageUrl)}` : selectedExercise.imageUrl) : '')
                          }
                          controls
                          className="w-full h-full"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            console.log('Modal video failed to load, showing fallback...');
                            e.currentTarget.style.display = 'none';
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'flex';
                            }
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
                      {/* Fallback for failed video */}
                      <div 
                        className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500"
                        style={{ display: 'none' }}
                      >
                        <div className="text-center">
                          <div className="text-4xl mb-2">🎥</div>
                          <div>Video not available</div>
                          <div className="text-sm mt-1">The video file may have been moved or removed</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
