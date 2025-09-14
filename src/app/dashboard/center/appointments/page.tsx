'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon, UserIcon, ClockIcon, XMarkIcon, EyeIcon, PlusIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

interface Appointment {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  type: 'FOLLOW_UP' | 'CONSULTATION' | 'ASSESSMENT' | 'EMERGENCY';
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  meetingUrl?: string | null;
  notes?: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    currentCondition: string;
  };
  physio: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  lastAppointment?: {
    id: string;
    startTime: string;
    notes?: string | null;
  } | null;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentCondition: string;
}

interface Physio {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization?: string;
}

const appointmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  patientId: z.string().min(1, 'Patient is required'),
  physioId: z.string().min(1, 'Physio is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  type: z.enum(['FOLLOW_UP', 'CONSULTATION', 'ASSESSMENT', 'EMERGENCY']),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export default function CenterAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [physios, setPhysios] = useState<Physio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<string>('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      type: 'FOLLOW_UP',
    },
  });

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchPhysios();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/center/appointments');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments);
      } else {
        setError('Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/center/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients);
      } else {
        console.error('Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchPhysios = async () => {
    try {
      const response = await fetch('/api/center/physios');
      if (response.ok) {
        const data = await response.json();
        setPhysios(data.physios);
      } else {
        console.error('Failed to fetch physios');
      }
    } catch (error) {
      console.error('Error fetching physios:', error);
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    setScheduling(true);
    try {
      const startTime = new Date(`${data.date}T${data.startTime}`);
      const endTime = new Date(`${data.date}T${data.endTime}`);

      const response = await fetch('/api/center/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          type: data.type,
          patientId: data.patientId,
          physioId: data.physioId,
          notes: data.notes,
        }),
      });

      if (response.ok) {
        setShowScheduleModal(false);
        reset();
        fetchAppointments(); // Refresh the appointments list
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to schedule appointment');
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      setError('Failed to schedule appointment');
    } finally {
      setScheduling(false);
    }
  };

  const onEditSubmit = async (data: AppointmentFormData) => {
    if (!editingAppointment) return;
    
    setEditing(true);
    setError(null);

    try {
      const startDateTime = new Date(`${data.date}T${data.startTime}`);
      const endDateTime = new Date(`${data.date}T${data.endTime}`);

      const response = await fetch(`/api/center/appointments/${editingAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          type: data.type,
          patientId: data.patientId,
          physioId: data.physioId,
          notes: data.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update appointment');
      }

      toast.success('Appointment updated successfully!');
      closeEditModal();
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError(error instanceof Error ? error.message : 'Failed to update appointment');
    } finally {
      setEditing(false);
    }
  };

  const openScheduleModal = () => {
    setShowScheduleModal(true);
    setError(null);
  };

  const closeScheduleModal = () => {
    setShowScheduleModal(false);
    reset();
    setError(null);
  };

  const openAppointmentDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const closeAppointmentModal = () => {
    setShowAppointmentModal(false);
    setSelectedAppointment(null);
  };

  const openEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowEditModal(true);
    // Pre-fill the form with appointment data
    reset({
      title: appointment.title,
      description: appointment.description || '',
      patientId: appointment.patient.id,
      physioId: appointment.physio.id,
      date: format(new Date(appointment.startTime), 'yyyy-MM-dd'),
      startTime: format(new Date(appointment.startTime), 'HH:mm'),
      endTime: format(new Date(appointment.endTime), 'HH:mm'),
      type: appointment.type,
      notes: appointment.notes || '',
    });
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingAppointment(null);
    reset();
    setError(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'NO_SHOW':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Scheduled';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'NO_SHOW':
        return 'No Show';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'FOLLOW_UP':
        return 'Follow-up';
      case 'CONSULTATION':
        return 'Consultation';
      case 'ASSESSMENT':
        return 'Assessment';
      case 'EMERGENCY':
        return 'Emergency';
      default:
        return type;
    }
  };

  const truncateNotes = (notes: string | null | undefined, maxLength: number = 100) => {
    if (!notes) return '';
    if (notes.length <= maxLength) return notes;
    return notes.substring(0, maxLength) + '...';
  };

  const showNotesDetails = (notes: string) => {
    setSelectedNotes(notes);
    setShowNotesModal(true);
  };

  const closeNotesModal = () => {
    setShowNotesModal(false);
    setSelectedNotes('');
  };

  const formatDateTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return {
      start: format(start, 'MMM dd, yyyy h:mm a'),
      end: format(end, 'h:mm a'),
      date: format(start, 'MMM dd, yyyy'),
    };
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  if (loading) {
    return (
      <DashboardLayout userType="center">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="center">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Center Appointments</h1>
              <p className="text-gray-600">View and manage all upcoming appointments</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Appointments</div>
                <div className="text-2xl font-bold text-blue-600">{appointments.length}</div>
              </div>
              <button
                onClick={openScheduleModal}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Schedule Appointment
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
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
              <span className="text-sm text-gray-500">
                {appointments.filter(a => a.status === 'SCHEDULED').length} scheduled
              </span>
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 mb-4">
                <CalendarIcon className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-500">Appointments will appear here once they are scheduled.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Date & Time
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Type
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Patient Name
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Assigned Physio
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Last Appointment
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Notes
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Status
                     </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                                    {appointments.map((appointment) => (
                    <tr 
                      key={appointment.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openAppointmentDetails(appointment)}
                    >
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                           <div>
                             <div className="text-sm font-medium text-gray-900">
                               {formatDateTime(appointment.startTime, appointment.endTime).start}
                             </div>
                             <div className="text-sm text-gray-500">
                               to {formatDateTime(appointment.startTime, appointment.endTime).end}
                             </div>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                           {getTypeText(appointment.type)}
                         </span>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.patient.currentCondition}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Dr. {appointment.physio.firstName} {appointment.physio.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.physio.email}
                            </div>
                          </div>
                        </div>
                      </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {appointment.lastAppointment ? (
                           <div>
                             <div>{formatDate(appointment.lastAppointment.startTime)}</div>
                             {appointment.lastAppointment.notes && (
                               <div className="text-xs text-gray-500 mt-1">
                                 {truncateNotes(appointment.lastAppointment.notes, 50)}
                               </div>
                             )}
                           </div>
                         ) : (
                           <span className="text-gray-400">First appointment</span>
                         )}
                       </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {appointment.notes ? (
                            <div>
                              <span>{truncateNotes(appointment.notes, 100)}</span>
                              {appointment.notes.length > 100 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    showNotesDetails(appointment.notes!);
                                  }}
                                  className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  Show more
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">No notes</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notes Modal */}
        {showNotesModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Appointment Notes</h3>
                  <button
                    onClick={closeNotesModal}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedNotes}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={closeNotesModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Appointment Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Schedule New Appointment</h3>
                  <button
                    onClick={closeScheduleModal}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Appointment Title *
                    </label>
                    <input
                      type="text"
                      {...register('title')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Follow-up Consultation"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Brief description of the appointment"
                    />
                  </div>

                  {/* Patient Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient *
                    </label>
                    <select
                      {...register('patientId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a patient</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName} - {patient.currentCondition}
                        </option>
                      ))}
                    </select>
                    {errors.patientId && (
                      <p className="mt-1 text-sm text-red-600">{errors.patientId.message}</p>
                    )}
                  </div>

                  {/* Physio Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Physiotherapist *
                    </label>
                    <select
                      {...register('physioId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a physiotherapist</option>
                      {physios.map((physio) => (
                        <option key={physio.id} value={physio.id}>
                          Dr. {physio.firstName} {physio.lastName} - {physio.specialization || 'General'}
                        </option>
                      ))}
                    </select>
                    {errors.physioId && (
                      <p className="mt-1 text-sm text-red-600">{errors.physioId.message}</p>
                    )}
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        {...register('date')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.date && (
                        <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        {...register('startTime')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.startTime && (
                        <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time *
                      </label>
                      <input
                        type="time"
                        {...register('endTime')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.endTime && (
                        <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Appointment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Appointment Type *
                    </label>
                    <select
                      {...register('type')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="FOLLOW_UP">Follow-up</option>
                      <option value="CONSULTATION">Consultation</option>
                      <option value="ASSESSMENT">Assessment</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                    {errors.type && (
                      <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional notes for the appointment"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeScheduleModal}
                      className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={scheduling}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {scheduling ? 'Scheduling...' : 'Schedule Appointment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Appointment Modal */}
        {showEditModal && editingAppointment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Edit Appointment</h3>
                  <button
                    onClick={closeEditModal}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Appointment Title *
                    </label>
                    <input
                      type="text"
                      {...register('title')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Follow-up Consultation"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Brief description of the appointment"
                    />
                  </div>

                  {/* Patient Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient *
                    </label>
                    <select
                      {...register('patientId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a patient</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName} - {patient.currentCondition}
                        </option>
                      ))}
                    </select>
                    {errors.patientId && (
                      <p className="mt-1 text-sm text-red-600">{errors.patientId.message}</p>
                    )}
                  </div>

                  {/* Physio Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Physiotherapist *
                    </label>
                    <select
                      {...register('physioId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a physiotherapist</option>
                      {physios.map((physio) => (
                        <option key={physio.id} value={physio.id}>
                          Dr. {physio.firstName} {physio.lastName} - {physio.specialization || 'General'}
                        </option>
                      ))}
                    </select>
                    {errors.physioId && (
                      <p className="mt-1 text-sm text-red-600">{errors.physioId.message}</p>
                    )}
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        {...register('date')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.date && (
                        <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        {...register('startTime')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.startTime && (
                        <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time *
                      </label>
                      <input
                        type="time"
                        {...register('endTime')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.endTime && (
                        <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Appointment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Appointment Type *
                    </label>
                    <select
                      {...register('type')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="FOLLOW_UP">Follow-up</option>
                      <option value="CONSULTATION">Consultation</option>
                      <option value="ASSESSMENT">Assessment</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                    {errors.type && (
                      <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional notes for the appointment"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editing}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {editing ? 'Updating...' : 'Update Appointment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Appointment Details Modal */}
        {showAppointmentModal && selectedAppointment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Appointment Details</h3>
                  <button
                    onClick={closeAppointmentModal}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Appointment Title
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                      {selectedAppointment.title}
                    </div>
                  </div>

                  {/* Description */}
                  {selectedAppointment.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                        {selectedAppointment.description}
                      </div>
                    </div>
                  )}

                  {/* Patient Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                      {selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}
                      <div className="text-sm text-gray-500 mt-1">
                        {selectedAppointment.patient.currentCondition}
                      </div>
                    </div>
                  </div>

                  {/* Physio Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Physiotherapist
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                      Dr. {selectedAppointment.physio.firstName} {selectedAppointment.physio.lastName}
                      <div className="text-sm text-gray-500 mt-1">
                        {selectedAppointment.physio.email}
                      </div>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                        {formatDate(selectedAppointment.startTime)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                        {format(new Date(selectedAppointment.startTime), 'h:mm a')}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                        {format(new Date(selectedAppointment.endTime), 'h:mm a')}
                      </div>
                    </div>
                  </div>

                  {/* Appointment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Appointment Type
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800`}>
                        {getTypeText(selectedAppointment.type)}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAppointment.status)}`}>
                        {getStatusText(selectedAppointment.status)}
                      </span>
                    </div>
                  </div>

                  {/* Last Appointment */}
                  {selectedAppointment.lastAppointment && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Appointment
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                        {formatDate(selectedAppointment.lastAppointment.startTime)}
                        {selectedAppointment.lastAppointment.notes && (
                          <div className="text-sm text-gray-500 mt-1">
                            {truncateNotes(selectedAppointment.lastAppointment.notes, 100)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedAppointment.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg max-h-32 overflow-y-auto">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedAppointment.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Meeting URL */}
                  {selectedAppointment.meetingUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meeting URL
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                        <a 
                          href={selectedAppointment.meetingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {selectedAppointment.meetingUrl}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        closeAppointmentModal();
                        openEditModal(selectedAppointment);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Edit Appointment
                    </button>
                    <button
                      onClick={closeAppointmentModal}
                      className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
