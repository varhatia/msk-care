'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  UserGroupIcon,
  UserIcon,
  CalendarIcon,
  ChartBarIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'

interface DashboardStats {
  totalPatients: number;
  activePhysios: number;
  todaysAppointments: number;
  activeExercisePlans: number;
}

interface Appointment {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  patient: {
    firstName: string;
    lastName: string;
  };
  physio: {
    firstName: string;
    lastName: string;
  };
}

export default function CenterDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activePhysios: 0,
    todaysAppointments: 0,
    activeExercisePlans: 0,
  });
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data individually to handle partial failures
      let patientsCount = 0;
      let physiosCount = 0;
      let appointmentsData = { appointments: [] };
      let prescriptionsCount = 0;

      try {
        console.log('🔍 Fetching patients...');
        const patientsRes = await fetch('/api/center/patients');
        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          patientsCount = patientsData.patients?.length || 0;
          console.log('✅ Patients count:', patientsCount);
        } else {
          console.log('❌ Patients API failed:', patientsRes.status);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      }

      try {
        console.log('🔍 Fetching physios...');
        const physiosRes = await fetch('/api/center/physios');
        if (physiosRes.ok) {
          const physiosData = await physiosRes.json();
          physiosCount = physiosData.physios?.length || 0;
          console.log('✅ Physios count:', physiosCount);
        } else {
          console.log('❌ Physios API failed:', physiosRes.status);
        }
      } catch (error) {
        console.error('Error fetching physios:', error);
      }

      try {
        console.log('🔍 Fetching appointments...');
        const appointmentsRes = await fetch('/api/center/appointments');
        if (appointmentsRes.ok) {
          appointmentsData = await appointmentsRes.json();
          console.log('✅ Appointments count:', appointmentsData.appointments?.length || 0);
        } else {
          console.log('❌ Appointments API failed:', appointmentsRes.status);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }

      try {
        console.log('🔍 Fetching prescriptions...');
        const prescriptionsRes = await fetch('/api/center/prescriptions');
        if (prescriptionsRes.ok) {
          const prescriptionsData = await prescriptionsRes.json();
          prescriptionsCount = prescriptionsData.prescriptions?.length || 0;
          console.log('✅ Prescriptions count:', prescriptionsCount);
        } else {
          console.log('❌ Prescriptions API failed:', prescriptionsRes.status);
        }
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      }

      // Calculate today's appointments
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const todaysAppts = appointmentsData.appointments.filter((appointment: Appointment) => {
        const appointmentDate = new Date(appointment.startTime);
        return appointmentDate >= todayStart && appointmentDate < todayEnd;
      });

      setStats({
        totalPatients: patientsCount,
        activePhysios: physiosCount,
        todaysAppointments: todaysAppts.length,
        activeExercisePlans: prescriptionsCount,
      });

      setTodaysAppointments(todaysAppts);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Some dashboard data could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      name: 'Total Patients',
      value: stats.totalPatients.toString(),
      change: '',
      changeType: 'neutral' as 'increase' | 'decrease' | 'neutral',
      icon: UserGroupIcon,
      href: '/dashboard/center/patients',
    },
    {
      name: 'Active Physios',
      value: stats.activePhysios.toString(),
      change: '',
      changeType: 'neutral' as 'increase' | 'decrease' | 'neutral',
      icon: UserIcon,
      href: '/dashboard/center/physios',
    },
    {
      name: 'Today\'s Appointments',
      value: stats.todaysAppointments.toString(),
      change: '',
      changeType: 'neutral' as 'increase' | 'decrease' | 'neutral',
      icon: CalendarIcon,
      href: '/dashboard/center/appointments',
    },
    {
      name: 'Active Exercise Plans',
      value: stats.activeExercisePlans.toString(),
      change: '',
      changeType: 'neutral' as 'increase' | 'decrease' | 'neutral',
      icon: DocumentTextIcon,
      href: '/dashboard/center/exercise-plans',
    },
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'patient',
      message: 'New patient John Doe registered',
      time: '2 hours ago',
      icon: UserGroupIcon,
    },
    {
      id: 2,
      type: 'appointment',
      message: 'Follow-up appointment scheduled for Sarah Smith',
      time: '4 hours ago',
      icon: CalendarIcon,
    },
    {
      id: 3,
      type: 'exercise',
      message: 'Exercise plan updated for Mike Johnson',
      time: '6 hours ago',
      icon: DocumentTextIcon,
    },
    {
      id: 4,
      type: 'progress',
      message: 'Progress report submitted by Lisa Brown',
      time: '1 day ago',
      icon: ChartBarIcon,
    },
  ]

  const quickActions = [
    {
      name: 'Add New Patient',
      description: 'Register a new patient',
      icon: UserGroupIcon,
      href: '/dashboard/center/patients',
      color: 'bg-primary-500',
    },
    {
      name: 'Schedule Appointment',
      description: 'Book a new appointment',
      icon: CalendarIcon,
      href: '/dashboard/center/appointments',
      color: 'bg-success-500',
    },
    {
      name: 'Create Exercise Plan',
      description: 'Design a new exercise program',
      icon: DocumentTextIcon,
      href: '/dashboard/center/exercise-plans',
      color: 'bg-warning-500',
    },
    {
      name: 'Start Video Call',
      description: 'Begin a consultation',
      icon: VideoCameraIcon,
      href: '/dashboard/center/video-calls',
      color: 'bg-secondary-500',
    },
  ]

  return (
    <DashboardLayout userType="center" userName="Rehab Center Admin" userEmail="admin@rehabcenter.com">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening at your center.</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={stat.href} className="block">
                <div className="card hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <stat.icon className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <div className="flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                        {stat.change && (
                          <span
                            className={`ml-2 flex items-baseline text-sm font-semibold ${
                              stat.changeType === 'increase' ? 'text-success-600' : 
                              stat.changeType === 'decrease' ? 'text-error-600' : 'text-gray-600'
                            }`}
                          >
                            {stat.changeType === 'increase' ? (
                              <ArrowUpIcon className="h-3 w-3 flex-shrink-0 self-center" />
                            ) : stat.changeType === 'decrease' ? (
                              <ArrowDownIcon className="h-3 w-3 flex-shrink-0 self-center" />
                            ) : null}
                            {stat.change}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Quick Actions</h3>
                <p className="card-subtitle">Common tasks and shortcuts</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    href={action.href}
                    className="group relative rounded-lg border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <div className={`${action.color} rounded-lg p-2`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                          {action.name}
                        </p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </div>
                    <PlusIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400 group-hover:text-primary-600" />
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Activities</h3>
                <p className="card-subtitle">Latest updates and notifications</p>
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <activity.icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="/dashboard/center/activities"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  View all activities →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Upcoming Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Today's Appointments</h3>
              <p className="card-subtitle">Upcoming consultations and follow-ups</p>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Physio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        Loading appointments...
                      </td>
                    </tr>
                  ) : todaysAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No appointments scheduled for today
                      </td>
                    </tr>
                  ) : (
                    todaysAppointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(appointment.startTime).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {appointment.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Dr. {appointment.physio.firstName} {appointment.physio.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            appointment.status === 'CONFIRMED' || appointment.status === 'SCHEDULED'
                              ? 'bg-success-100 text-success-800'
                              : 'bg-warning-100 text-warning-800'
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                href="/dashboard/center/appointments"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                View all appointments →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
