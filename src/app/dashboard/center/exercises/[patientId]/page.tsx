'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { PlayIcon, CalendarIcon, UserIcon, ClockIcon } from '@heroicons/react/24/outline';
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

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentCondition: string;
}

export default function PatientExercisePlanPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
      fetchPatientPrescriptions();
    }
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setPatient(data.patient);
      } else {
        console.error('Failed to fetch patient details');
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const fetchPatientPrescriptions = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}/prescriptions`);
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
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout userType="center">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout userType="center">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-gray-400 mb-4">
                <UserIcon className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Not Found</h3>
              <p className="text-gray-500">
                The patient you're looking for could not be found.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="center">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Patient Exercise Plan</h1>
          <p className="text-gray-600 mt-2">
            View exercise plan details for {patient.firstName} {patient.lastName}
          </p>
        </div>

        {/* Patient Information Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h2>
              <p className="text-gray-600">{patient.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Condition: {patient.currentCondition}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Patient ID</div>
              <div className="font-mono text-gray-900">{patient.id}</div>
            </div>
          </div>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Exercise Plans</h3>
              <p className="text-gray-500">
                No exercise plans have been created for this patient yet.
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
                          ? 'border-blue-300 bg-blue-50'
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
                        <h4 className="font-medium text-gray-900 mb-2">Notes from physiotherapist:</h4>
                        <p className="text-gray-600">{selectedPrescription.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Exercise Table */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-900">Exercise Details</h3>
                      <p className="text-gray-600">Complete exercise list with sets and reps</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Exercise Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sets
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reps
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Duration
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Difficulty
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedPrescription.items.map((exerciseItem, index) => (
                            <tr key={exerciseItem.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {index + 1}. {exerciseItem.name}
                                  </div>
                                  {exerciseItem.description && (
                                    <div className="text-sm text-gray-500">
                                      {exerciseItem.description}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {exerciseItem.sets}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {exerciseItem.reps}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {exerciseItem.duration} min
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(exerciseItem.difficulty)}`}>
                                  {exerciseItem.difficulty}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {exerciseItem.category}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                    Choose a plan from the list to view the exercises and details.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
