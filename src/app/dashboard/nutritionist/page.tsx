'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { motion } from 'framer-motion'
import {
  UserGroupIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  CakeIcon,
  ClockIcon,
  TrendingUpIcon,
} from '@heroicons/react/24/outline'

interface DashboardStats {
  totalPatients: number
  activeMealPlans: number
  todaysAppointments: number
  completedSessions: number
}

export default function NutritionistDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activeMealPlans: 0,
    todaysAppointments: 0,
    completedSessions: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || (session.user as any)?.role !== 'NUTRITIONIST') {
      router.push('/auth/login')
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // TODO: Implement API calls to fetch nutritionist dashboard data
      // For now, using mock data
      setStats({
        totalPatients: 12,
        activeMealPlans: 8,
        todaysAppointments: 3,
        completedSessions: 45,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const statsData = [
    {
      name: 'Total Patients',
      value: stats.totalPatients,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      href: '/dashboard/nutritionist/patients',
    },
    {
      name: 'Active Meal Plans',
      value: stats.activeMealPlans,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      href: '/dashboard/nutritionist/meal-plans',
    },
    {
      name: "Today's Appointments",
      value: stats.todaysAppointments,
      icon: CalendarIcon,
      color: 'bg-purple-500',
      href: '/dashboard/nutritionist/appointments',
    },
    {
      name: 'Completed Sessions',
      value: stats.completedSessions,
      icon: ChartBarIcon,
      color: 'bg-orange-500',
      href: '/dashboard/nutritionist/reports',
    },
  ]

  const quickActions = [
    {
      name: 'Create Meal Plan',
      description: 'Design a personalized nutrition plan for a patient',
      icon: DocumentTextIcon,
      href: '/dashboard/nutritionist/meal-plans/create',
      color: 'bg-green-50 text-green-700 hover:bg-green-100',
    },
    {
      name: 'Schedule Appointment',
      description: 'Book a consultation with a patient',
      icon: CalendarIcon,
      href: '/dashboard/nutritionist/appointments/create',
      color: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    },
    {
      name: 'View Reports',
      description: 'Analyze patient progress and outcomes',
      icon: ChartBarIcon,
      href: '/dashboard/nutritionist/reports',
      color: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    },
  ]

  return (
    <DashboardLayout 
      userType="nutritionist" 
      userName={(session?.user as any)?.nutritionistName || 'Nutritionist'}
      userEmail={session?.user?.email || ''}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Welcome back, {(session?.user as any)?.nutritionistName || 'Nutritionist'}!
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Here's what's happening with your nutrition practice today.
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              <CakeIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
              New Meal Plan
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(stat.href)}
            >
              <div>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`rounded-md p-3 ${stat.color}`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(action.href)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <action.icon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">
                        {action.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="flow-root">
              <ul className="-mb-8">
                <li>
                  <div className="relative pb-8">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                          <DocumentTextIcon className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Created a new meal plan for <span className="font-medium text-gray-900">John Doe</span>
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime="2024-01-15">2 hours ago</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="relative pb-8">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                          <CalendarIcon className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Scheduled appointment with <span className="font-medium text-gray-900">Jane Smith</span>
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime="2024-01-15">4 hours ago</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="relative">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
                          <ChartBarIcon className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Completed progress review for <span className="font-medium text-gray-900">Mike Johnson</span>
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime="2024-01-15">1 day ago</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
