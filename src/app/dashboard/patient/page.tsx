'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  UserIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  BeakerIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'

interface PainStats {
  averagePainScore: number
  mostRecentPainScore: number | null
  totalEntries: number
  trend: 'increasing' | 'decreasing' | 'stable'
  entries: Array<{
    painScore: number
    date: string
  }>
}

interface MobilityStats {
  averageMobilityScore: number
  mostRecentMobilityScore: number | null
  totalEntries: number
  trend: 'increasing' | 'decreasing' | 'stable'
  entries: Array<{
    mobilityScore: number
    date: string
  }>
}

interface ExerciseAdherenceStats {
  exerciseDays: number
  totalDays: number
  exercisePercentage: number
  mostRecentAdherence: boolean | null
  totalEntries: number
  trend: 'increasing' | 'decreasing' | 'stable'
  entries: Array<{
    exerciseAdherence: boolean
    date: string
  }>
}

interface MedicationAdherenceStats {
  medicationDays: number
  totalDays: number
  medicationPercentage: number
  mostRecentAdherence: boolean | null
  totalEntries: number
  trend: 'increasing' | 'decreasing' | 'stable'
  entries: Array<{
    medicationAdherence: boolean
    date: string
  }>
}

interface DaysActiveStats {
  daysActive: number
  totalDays: number
  averageAdherence: number
  trend: 'increasing' | 'decreasing' | 'stable'
  mostRecentDate: string | null
  totalEntries: number
  activeDays: string[]
}

interface ExercisePlanExercise {
  id: string
  name: string
  description?: string
  category: string
  difficulty: string
  duration: number
  sets: number
  reps: number
  imageUrl?: string
  videoUrl?: string
  instructions?: string
  notes?: string
  orderIndex: number
}

interface ExercisePlan {
  prescription: {
    id: string
    startDate: string
    endDate: string
    status: string
    notes?: string
  } | null
  exercises: ExercisePlanExercise[]
  physioName: string | null
}

interface RecentProgressEntry {
  id: string
  date: string
  displayDate: string
  painScore: number
  moodScore: number
  mobilityScore: number
  medicationAdherence: boolean
  exerciseAdherence: boolean
  notes?: string
  createdAt: string
}

interface RecentProgressData {
  entries: RecentProgressEntry[]
  totalEntries: number
  dateRange: {
    from: string
    to: string
  }
}

export default function PatientDashboard() {
  const [painStats, setPainStats] = useState<PainStats | null>(null)
  const [mobilityStats, setMobilityStats] = useState<MobilityStats | null>(null)
  const [exerciseAdherenceStats, setExerciseAdherenceStats] = useState<ExerciseAdherenceStats | null>(null)
  const [medicationAdherenceStats, setMedicationAdherenceStats] = useState<MedicationAdherenceStats | null>(null)
  const [daysActiveStats, setDaysActiveStats] = useState<DaysActiveStats | null>(null)
  const [exercisePlan, setExercisePlan] = useState<ExercisePlan | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<ExercisePlanExercise | null>(null)
  const [recentProgress, setRecentProgress] = useState<RecentProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllStats()
  }, [])

  const fetchAllStats = async () => {
    try {
      const [painResponse, mobilityResponse, exerciseResponse, medicationResponse, daysActiveResponse, exercisePlanResponse, recentProgressResponse] = await Promise.all([
        fetch('/api/patient/pain-stats'),
        fetch('/api/patient/mobility-stats'),
        fetch('/api/patient/exercise-adherence'),
        fetch('/api/patient/medication-adherence'),
        fetch('/api/patient/days-active'),
        fetch('/api/patient/exercise-plan'),
        fetch('/api/patient/recent-progress')
      ])

      if (painResponse.ok) {
        const data = await painResponse.json()
        setPainStats(data.data)
      }

      if (mobilityResponse.ok) {
        const data = await mobilityResponse.json()
        setMobilityStats(data.data)
      }

      if (exerciseResponse.ok) {
        const data = await exerciseResponse.json()
        setExerciseAdherenceStats(data.data)
      }

      if (medicationResponse.ok) {
        const data = await medicationResponse.json()
        setMedicationAdherenceStats(data.data)
      }

      if (daysActiveResponse.ok) {
        const data = await daysActiveResponse.json()
        setDaysActiveStats(data.data)
      }

      if (exercisePlanResponse.ok) {
        const data = await exercisePlanResponse.json()
        setExercisePlan(data.data)
      }

      if (recentProgressResponse.ok) {
        const data = await recentProgressResponse.json()
        setRecentProgress(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <ArrowUpIcon className="h-4 w-4 text-red-500" />
      case 'decreasing':
        return <ArrowDownIcon className="h-4 w-4 text-green-500" />
      default:
        return <MinusIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-red-600'
      case 'decreasing':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  const getPainScoreColor = (score: number) => {
    if (score <= 3) return 'text-green-600'
    if (score <= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMobilityScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAdherenceColor = (adherence: number) => {
    if (adherence >= 80) return 'text-green-600'
    if (adherence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDaysActiveColor = (days: number, total: number) => {
    const percentage = (days / total) * 100
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Real data metrics
  const healthMetrics = [
    {
      name: 'Pain Score (7-day avg)',
      value: painStats ? `${painStats.averagePainScore}/10` : 'Loading...',
      change: painStats ? getTrendIcon(painStats.trend) : null,
      changeType: painStats?.trend === 'decreasing' ? 'improvement' : painStats?.trend === 'increasing' ? 'decline' : 'stable',
      icon: HeartIcon,
      color: painStats ? getPainScoreColor(painStats.averagePainScore) : 'text-gray-600',
      loading: loading,
    },
    {
      name: 'Mobility Score (7-day avg)',
      value: mobilityStats ? `${mobilityStats.averageMobilityScore}/10` : 'Loading...',
      change: mobilityStats ? getTrendIcon(mobilityStats.trend) : null,
      changeType: mobilityStats?.trend === 'increasing' ? 'improvement' : mobilityStats?.trend === 'decreasing' ? 'decline' : 'stable',
      icon: UserIcon,
      color: mobilityStats ? getMobilityScoreColor(mobilityStats.averageMobilityScore) : 'text-gray-600',
      loading: loading,
    },
    {
      name: 'Medication Adherence',
      value: medicationAdherenceStats ? `${medicationAdherenceStats.medicationDays}/${medicationAdherenceStats.totalDays} days` : 'Loading...',
      change: medicationAdherenceStats ? getTrendIcon(medicationAdherenceStats.trend) : null,
      changeType: medicationAdherenceStats?.trend === 'increasing' ? 'improvement' : medicationAdherenceStats?.trend === 'decreasing' ? 'decline' : 'stable',
      icon: BeakerIcon,
      color: medicationAdherenceStats ? getAdherenceColor(medicationAdherenceStats.medicationPercentage) : 'text-gray-600',
      loading: loading,
    },
    {
      name: 'Exercise Days',
      value: exerciseAdherenceStats ? `${exerciseAdherenceStats.exerciseDays}/${exerciseAdherenceStats.totalDays} days` : 'Loading...',
      change: exerciseAdherenceStats ? getTrendIcon(exerciseAdherenceStats.trend) : null,
      changeType: exerciseAdherenceStats?.trend === 'increasing' ? 'improvement' : exerciseAdherenceStats?.trend === 'decreasing' ? 'decline' : 'stable',
      icon: PlayIcon,
      color: exerciseAdherenceStats ? getAdherenceColor(exerciseAdherenceStats.exercisePercentage) : 'text-gray-600',
      loading: loading,
    },
  ]

  // Get today's exercises from the exercise plan
  const todayExercises = exercisePlan?.exercises?.slice(0, 3) || []

  const upcomingAppointments = [
    {
      id: 1,
      type: 'Follow-up',
      physio: 'Dr. Sarah Johnson',
      date: 'Tomorrow',
      time: '10:00 AM',
      isVideo: true,
    },
    {
      id: 2,
      type: 'Assessment',
      physio: 'Dr. Mike Williams',
      date: 'Dec 15, 2024',
      time: '02:30 PM',
      isVideo: false,
    },
  ]



  return (
    <DashboardLayout userType="patient" userName="John Doe" userEmail="john.doe@example.com">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600">Track your rehabilitation progress and stay on top of your health goals.</p>
        </div>

        {/* Health Metrics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {healthMetrics.map((metric, index) => {
            // Determine if this metric should be clickable
            const isClickable = metric.name === 'Pain Score (7-day avg)' || metric.name === 'Mobility Score (7-day avg)' || metric.name === 'Medication Adherence' || metric.name === 'Exercise Days'
            const getProgressUrl = (metricName: string) => {
              if (metricName === 'Pain Score (7-day avg)') {
                return '/dashboard/patient/progress?filter=pain'
              } else if (metricName === 'Mobility Score (7-day avg)') {
                return '/dashboard/patient/progress?filter=mobility'
              }
              return '/dashboard/patient/progress'
            }

            const WidgetContent = () => (
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <metric.icon className={`h-8 w-8 ${metric.color}`} />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                      {metric.change && (
                        <span className={`ml-2 flex items-center ${metric.changeType === 'improvement' ? 'text-success-600' : metric.changeType === 'decline' ? 'text-red-600' : 'text-gray-600'}`}>
                          {typeof metric.change === 'string' ? metric.change : metric.change}
                        </span>
                      )}
                    </div>
                    {metric.name === 'Pain Score (7-day avg)' && painStats && (
                      <div className="mt-1 text-xs text-gray-500">
                        {painStats.totalEntries} entries
                        {painStats.mostRecentPainScore && (
                          <span className="ml-2">
                            • Latest: {painStats.mostRecentPainScore}/10
                          </span>
                        )}
                      </div>
                    )}
                    {metric.name === 'Mobility Score (7-day avg)' && mobilityStats && (
                      <div className="mt-1 text-xs text-gray-500">
                        {mobilityStats.totalEntries} entries
                        {mobilityStats.mostRecentMobilityScore && (
                          <span className="ml-2">
                            • Latest: {mobilityStats.mostRecentMobilityScore}/10
                          </span>
                        )}
                      </div>
                    )}
                    {metric.name === 'Medication Adherence' && medicationAdherenceStats && (
                      <div className="mt-1 text-xs text-gray-500">
                        {medicationAdherenceStats.totalEntries} entries
                        {medicationAdherenceStats.mostRecentAdherence !== null && (
                          <span className="ml-2">
                            • Latest: {medicationAdherenceStats.mostRecentAdherence ? 'Yes' : 'No'}
                          </span>
                        )}
                      </div>
                    )}
                    {metric.name === 'Exercise Days' && exerciseAdherenceStats && (
                      <div className="mt-1 text-xs text-gray-500">
                        {exerciseAdherenceStats.totalEntries} entries
                        {exerciseAdherenceStats.mostRecentAdherence !== null && (
                          <span className="ml-2">
                            • Latest: {exerciseAdherenceStats.mostRecentAdherence ? 'Yes' : 'No'}
                          </span>
                        )}
                      </div>
                    )}
                    {/* {isClickable && (
                      <div className="mt-2">
                        <span className="text-xs text-primary-600 font-medium cursor-pointer hover:text-primary-700">
                          View details →
                        </span>
                      </div>
                    )} */}
                  </div>
                </div>
              </div>
            )

            return (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {isClickable ? (
                  <Link href={getProgressUrl(metric.name)}>
                    <div className="cursor-pointer hover:shadow-md transition-shadow duration-200">
                      <WidgetContent />
                    </div>
                  </Link>
                ) : (
                  <WidgetContent />
                )}
              </motion.div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Today's Exercises */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Today's Exercises</h3>
                <p className="card-subtitle">Your daily rehabilitation routine</p>
              </div>
              <div className="space-y-4">
                {todayExercises.length > 0 ? (
                  todayExercises.map((exercise) => (
                    <div 
                      key={exercise.id} 
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <PlayIcon className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{exercise.name}</h4>
                          <p className="text-xs text-gray-500">{exercise.sets} sets × {exercise.reps} reps • {exercise.duration} min</p>
                          <p className="text-xs text-gray-400 capitalize">{exercise.difficulty} • {exercise.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {exercise.difficulty}
                        </span>
                        <button 
                          className="p-1 text-primary-600 hover:text-primary-700"
                          aria-label={`View ${exercise.name} details`}
                        >
                          <PlayIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <PlayIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">No exercises assigned yet</p>
                    <p className="text-gray-400 text-xs mt-1">Your physiotherapist will create an exercise plan for you</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="/dashboard/patient/exercises"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  View all exercises →
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Upcoming Appointments */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Upcoming Appointments</h3>
                <p className="card-subtitle">Your scheduled consultations</p>
              </div>
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {appointment.isVideo ? (
                        <VideoCameraIcon className="h-5 w-5 text-primary-600" />
                      ) : (
                        <CalendarIcon className="h-5 w-5 text-primary-600" />
                      )}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{appointment.type}</h4>
                        <p className="text-xs text-gray-500">with {appointment.physio}</p>
                        <p className="text-xs text-gray-400">{appointment.date} at {appointment.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                        {appointment.isVideo ? 'Video Call' : 'In-Person'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="/dashboard/patient/appointments"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  View all appointments →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Progress Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Progress</h3>
              <p className="card-subtitle">Your health metrics over time</p>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pain
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mood
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mobility
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exercise
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medication
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentProgress?.entries && recentProgress.entries.length > 0 ? (
                    recentProgress.entries.map((progress) => (
                      <tr key={progress.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {progress.displayDate}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${progress.painScore <= 3 ? 'text-green-600' : progress.painScore <= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {progress.painScore}/10
                            </span>
                            <div className="ml-2 w-12 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${progress.painScore <= 3 ? 'bg-green-500' : progress.painScore <= 6 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${(progress.painScore / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${progress.moodScore >= 7 ? 'text-green-600' : progress.moodScore >= 4 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {progress.moodScore}/10
                            </span>
                            <div className="ml-2 w-12 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${progress.moodScore >= 7 ? 'bg-green-500' : progress.moodScore >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${(progress.moodScore / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${progress.mobilityScore >= 7 ? 'text-green-600' : progress.mobilityScore >= 4 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {progress.mobilityScore}/10
                            </span>
                            <div className="ml-2 w-12 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${progress.mobilityScore >= 7 ? 'bg-green-500' : progress.mobilityScore >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${(progress.mobilityScore / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${progress.exerciseAdherence ? 'text-green-600' : 'text-red-600'}`}>
                              {progress.exerciseAdherence ? 'Yes' : 'No'}
                            </span>
                            <div className="ml-2">
                              {progress.exerciseAdherence ? (
                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                              ) : (
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${progress.medicationAdherence ? 'text-green-600' : 'text-red-600'}`}>
                              {progress.medicationAdherence ? 'Yes' : 'No'}
                            </span>
                            <div className="ml-2">
                              {progress.medicationAdherence ? (
                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                              ) : (
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {progress.notes || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <ChartBarIcon className="h-8 w-8 text-gray-300 mb-2" />
                          <p className="text-sm">No progress entries found</p>
                          <p className="text-xs text-gray-400 mt-1">Start logging your daily progress to see data here</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                href="/dashboard/patient/progress"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                View detailed progress →
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
              <p className="card-subtitle">Common tasks and shortcuts</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/dashboard/patient/exercises"
                className="group relative rounded-lg border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center">
                  <div className="bg-primary-500 rounded-lg p-2">
                    <DocumentTextIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                      Start Exercise
                    </p>
                    <p className="text-xs text-gray-500">Begin today's routine</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/patient/progress"
                className="group relative rounded-lg border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center">
                  <div className="bg-success-500 rounded-lg p-2">
                    <ChartBarIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                      Log Progress
                    </p>
                    <p className="text-xs text-gray-500">Update your metrics</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/patient/appointments"
                className="group relative rounded-lg border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center">
                  <div className="bg-warning-500 rounded-lg p-2">
                    <CalendarIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                      Book Appointment
                    </p>
                    <p className="text-xs text-gray-500">Schedule consultation</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/patient/video-calls"
                className="group relative rounded-lg border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center">
                  <div className="bg-secondary-500 rounded-lg p-2">
                    <VideoCameraIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                      Video Call
                    </p>
                    <p className="text-xs text-gray-500">Join consultation</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{selectedExercise.name}</h3>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close exercise details"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Exercise Image */}
                {selectedExercise.imageUrl && (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={selectedExercise.imageUrl}
                      alt={selectedExercise.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Exercise Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">{selectedExercise.duration} minutes</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Difficulty</p>
                    <p className="font-semibold capitalize">{selectedExercise.difficulty}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Sets</p>
                    <p className="font-semibold">{selectedExercise.sets}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Reps</p>
                    <p className="font-semibold">{selectedExercise.reps}</p>
                  </div>
                </div>

                {/* Description */}
                {selectedExercise.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600">{selectedExercise.description}</p>
                  </div>
                )}

                {/* Instructions */}
                {selectedExercise.instructions && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
                    <p className="text-gray-600 whitespace-pre-line">{selectedExercise.instructions}</p>
                  </div>
                )}

                {/* Notes */}
                {selectedExercise.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-gray-600">{selectedExercise.notes}</p>
                  </div>
                )}

                {/* Video */}
                {selectedExercise.videoUrl && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Video Guide</h4>
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <video
                        src={selectedExercise.videoUrl}
                        controls
                        className="w-full h-full"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedExercise(null)}
                    className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Start Exercise
                  </button>
                  <button
                    onClick={() => setSelectedExercise(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  )
}
