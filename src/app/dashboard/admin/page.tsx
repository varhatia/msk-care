'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  UsersIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  HeartIcon,
  AcademicCapIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface DashboardStats {
  totalCenters: number
  totalPhysios: number
  totalPatients: number
  totalNutritionists: number
  pendingApprovals: number
  totalAppointments: number
  activeAppointments: number
  completedAppointments: number
  averagePainScore: number
  averageMobilityScore: number
  totalExercisePlans: number
  activeExercisePlans: number
}

interface PendingUser {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
  centerName?: string
  specialization?: string
  createdAt: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, pendingResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/pending-approvals')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        setPendingUsers(pendingData.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveUser = async (userId: string) => {
    setApproving(userId)
    try {
      const response = await fetch(`/api/admin/approve-user/${userId}`, {
        method: 'POST'
      })

      if (response.ok) {
        // Remove from pending list
        setPendingUsers(prev => prev.filter(user => user.id !== userId))
        // Update stats
        if (stats) {
          setStats(prev => prev ? { ...prev, pendingApprovals: prev.pendingApprovals - 1 } : null)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to approve user')
      }
    } catch (error) {
      console.error('Error approving user:', error)
      alert('Failed to approve user')
    } finally {
      setApproving(null)
    }
  }

  const handleRejectUser = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this user? This action cannot be undone.')) {
      return
    }

    setApproving(userId)
    try {
      const response = await fetch(`/api/admin/reject-user/${userId}`, {
        method: 'POST'
      })

      if (response.ok) {
        // Remove from pending list
        setPendingUsers(prev => prev.filter(user => user.id !== userId))
        // Update stats
        if (stats) {
          setStats(prev => prev ? { ...prev, pendingApprovals: prev.pendingApprovals - 1 } : null)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to reject user')
      }
    } catch (error) {
      console.error('Error rejecting user:', error)
      alert('Failed to reject user')
    } finally {
      setApproving(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <BuildingOfficeIcon className="h-5 w-5 text-blue-500" />
      case 'PHYSIO':
        return <HeartIcon className="h-5 w-5 text-green-500" />
      case 'PATIENT':
        return <UserGroupIcon className="h-5 w-5 text-purple-500" />
      case 'NUTRITIONIST':
        return <BeakerIcon className="h-5 w-5 text-orange-500" />
      default:
        return <UsersIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800'
      case 'PHYSIO':
        return 'bg-green-100 text-green-800'
      case 'PATIENT':
        return 'bg-purple-100 text-purple-800'
      case 'NUTRITIONIST':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <DashboardLayout userType="admin" userName="MSK Care Admin" userEmail="admin@mskcare.com">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="admin" userName="MSK Care Admin" userEmail="admin@mskcare.com">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MSK Care Admin Dashboard</h1>
          <p className="text-gray-600">Manage the MSK Care platform and user approvals</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Total Centers */}
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Centers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCenters}</p>
                </div>
              </div>
            </div>

            {/* Total Physios */}
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <HeartIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Physios</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPhysios}</p>
                </div>
              </div>
            </div>

            {/* Total Patients */}
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
                </div>
              </div>
            </div>

            {/* Total Nutritionists */}
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BeakerIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Nutritionists</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalNutritionists}</p>
                </div>
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
                </div>
              </div>
            </div>

            {/* Total Appointments */}
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
                </div>
              </div>
            </div>

            {/* Active Appointments */}
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeAppointments}</p>
                </div>
              </div>
            </div>

            {/* Exercise Plans */}
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <AcademicCapIcon className="h-6 w-6 text-teal-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Exercise Plans</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalExercisePlans}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending Approvals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-500" />
                Pending User Approvals
              </h3>
              <p className="card-subtitle">Review and approve new user registrations</p>
            </div>

            {pendingUsers.length > 0 ? (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getRoleIcon(user.role)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}` 
                                : user.email
                              }
                            </h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {user.centerName && (
                            <p className="text-sm text-gray-500">Center: {user.centerName}</p>
                          )}
                          {user.specialization && (
                            <p className="text-sm text-gray-500">Specialization: {user.specialization}</p>
                          )}
                          <p className="text-xs text-gray-400">Registered: {formatDate(user.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveUser(user.id)}
                          disabled={approving === user.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          <span>{approving === user.id ? 'Approving...' : 'Approve'}</span>
                        </button>
                        <button
                          onClick={() => handleRejectUser(user.id)}
                          disabled={approving === user.id}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          <XCircleIcon className="h-4 w-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircleIcon className="h-12 w-12 text-green-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No pending approvals</p>
                <p className="text-gray-400 text-xs mt-1">All users have been reviewed</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Platform Statistics */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="card">
              <div className="card-header">
                <h3 className="card-title flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Platform Statistics
                </h3>
                <p className="card-subtitle">Key metrics and performance indicators</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{stats.averagePainScore.toFixed(1)}</div>
                  <div className="text-sm text-gray-500">Average Pain Score</div>
                  <div className="text-xs text-gray-400">out of 10</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{stats.averageMobilityScore.toFixed(1)}</div>
                  <div className="text-sm text-gray-500">Average Mobility Score</div>
                  <div className="text-xs text-gray-400">out of 10</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{stats.activeExercisePlans}</div>
                  <div className="text-sm text-gray-500">Active Exercise Plans</div>
                  <div className="text-xs text-gray-400">currently assigned</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}
