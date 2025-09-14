'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { motion } from 'framer-motion'
import {
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'

interface MealPlan {
  id: string
  patientName: string
  patientId: string
  title: string
  description: string
  startDate: string
  endDate: string
  status: 'Active' | 'Completed' | 'Draft'
  mealsPerDay: number
  totalCalories: number
  createdAt: string
}

export default function MealPlansPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || (session.user as any)?.role !== 'NUTRITIONIST') {
      router.push('/auth/login')
      return
    }

    fetchMealPlans()
  }, [session, status, router])

  const fetchMealPlans = async () => {
    try {
      setLoading(true)
      // TODO: Implement API call to fetch nutritionist's meal plans
      // For now, using mock data
      setMealPlans([
        {
          id: '1',
          patientName: 'John Doe',
          patientId: '1',
          title: 'Weight Loss Plan',
          description: 'Low-calorie meal plan for gradual weight loss',
          startDate: '2024-01-01',
          endDate: '2024-02-01',
          status: 'Active',
          mealsPerDay: 3,
          totalCalories: 1500,
          createdAt: '2024-01-01',
        },
        {
          id: '2',
          patientName: 'Jane Smith',
          patientId: '2',
          title: 'Muscle Building Plan',
          description: 'High-protein meal plan for muscle gain',
          startDate: '2024-01-05',
          endDate: '2024-02-05',
          status: 'Active',
          mealsPerDay: 5,
          totalCalories: 2200,
          createdAt: '2024-01-05',
        },
        {
          id: '3',
          patientName: 'Mike Johnson',
          patientId: '3',
          title: 'Diabetes Management',
          description: 'Low-carb meal plan for blood sugar control',
          startDate: '2024-01-10',
          endDate: '2024-02-10',
          status: 'Draft',
          mealsPerDay: 3,
          totalCalories: 1800,
          createdAt: '2024-01-10',
        },
      ])
    } catch (error) {
      console.error('Error fetching meal plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Completed':
        return 'bg-blue-100 text-blue-800'
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

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
              Meal Plans
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage personalized nutrition plans for your patients.
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
              Create Meal Plan
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Plans
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {mealPlans.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Plans
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {mealPlans.filter(p => p.status === 'Active').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Draft Plans
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {mealPlans.filter(p => p.status === 'Draft').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {mealPlans.filter(p => p.status === 'Completed').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Meal Plans Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mealPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {plan.patientName}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                    {plan.status}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {plan.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {plan.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Meals/Day</p>
                    <p className="text-sm font-medium text-gray-900">{plan.mealsPerDay}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Calories</p>
                    <p className="text-sm font-medium text-gray-900">{plan.totalCalories}</p>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  {plan.startDate} - {plan.endDate}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      className="text-primary-600 hover:text-primary-900"
                      title="View Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit Plan"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
                      title="Delete Plan"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {mealPlans.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No meal plans</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first meal plan.
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                Create Meal Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
