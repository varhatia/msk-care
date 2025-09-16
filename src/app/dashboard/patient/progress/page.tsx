'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  FaceSmileIcon,
  HeartIcon,
  BeakerIcon,
  PlayIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Validation schema for progress entry form
const progressFormSchema = z.object({
  painScore: z.number().min(1, 'Pain score must be at least 1').max(10, 'Pain score must be at most 10'),
  moodScore: z.number().min(1, 'Mood score must be at least 1').max(10, 'Mood score must be at most 10'),
  mobilityScore: z.number().min(1, 'Mobility score must be at least 1').max(10, 'Mobility score must be at most 10'),
  medicationAdherence: z.boolean(),
  exerciseAdherence: z.boolean(),
  notes: z.string().optional(),
  entryDate: z.string().min(1, 'Please select a date'),
})

type ProgressFormData = z.infer<typeof progressFormSchema>

interface ProgressEntry {
  id: string
  painScore: number
  moodScore: number
  mobilityScore: number
  medicationAdherence: boolean
  exerciseAdherence: boolean
  notes?: string
  entryDate: string
  createdAt: string
  updatedAt: string
}

function PatientProgressPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ProgressEntry | null>(null)
  const [chartFilter, setChartFilter] = useState<'painScore' | 'moodScore' | 'mobilityScore'>('painScore')
  const [dateRange, setDateRange] = useState(30) // days

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProgressFormData>({
    resolver: zodResolver(progressFormSchema),
    defaultValues: {
      painScore: 5,
      moodScore: 5,
      mobilityScore: 5,
      medicationAdherence: true,
      exerciseAdherence: true,
      entryDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    },
  })

  const watchedValues = watch()

  useEffect(() => {
    if (status === 'loading') return

    if (!session || (session.user as any)?.role !== 'PATIENT') {
      router.push('/auth/login')
      return
    }

    fetchProgressEntries()
  }, [session, status, router])

  // Handle URL parameters for chart filter
  useEffect(() => {
    const filterParam = searchParams.get('filter')
    if (filterParam === 'pain') {
      setChartFilter('painScore')
    } else if (filterParam === 'mobility') {
      setChartFilter('mobilityScore')
    } else if (filterParam === 'mood') {
      setChartFilter('moodScore')
    }
  }, [searchParams])

  const fetchProgressEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/patient/progress')
      const data = await response.json()
      
      if (response.ok) {
        setProgressEntries(data.progressEntries)
      } else {
        toast.error('Failed to fetch progress entries')
      }
    } catch (error) {
      console.error('Error fetching progress entries:', error)
      toast.error('Failed to fetch progress entries')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProgressFormData) => {
    setSubmitting(true)
    try {
      const url = editingEntry ? `/api/patient/progress/${editingEntry.id}` : '/api/patient/progress'
      const method = editingEntry ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          entryDate: data.entryDate,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(editingEntry ? 'Progress updated successfully!' : 'Progress logged successfully!')
        reset({
          painScore: 5,
          moodScore: 5,
          mobilityScore: 5,
          medicationAdherence: true,
          exerciseAdherence: true,
          entryDate: new Date().toISOString().split('T')[0],
        })
        setEditingEntry(null)
        fetchProgressEntries()
      } else {
        throw new Error(result.error || 'Failed to save progress')
      }
    } catch (error) {
      console.error('Error saving progress:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save progress')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (entry: ProgressEntry) => {
    setEditingEntry(entry)
    setValue('painScore', entry.painScore)
    setValue('moodScore', entry.moodScore)
    setValue('mobilityScore', entry.mobilityScore)
    setValue('medicationAdherence', entry.medicationAdherence)
    setValue('exerciseAdherence', entry.exerciseAdherence)
    setValue('notes', entry.notes || '')
    setValue('entryDate', new Date(entry.entryDate).toISOString().split('T')[0])
  }

  const handleCancelEdit = () => {
    setEditingEntry(null)
    reset({
      painScore: 5,
      moodScore: 5,
      mobilityScore: 5,
      medicationAdherence: true,
      exerciseAdherence: true,
      entryDate: new Date().toISOString().split('T')[0],
    })
  }

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this progress entry?')) return

    try {
      const response = await fetch(`/api/patient/progress/${entryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Progress entry deleted successfully!')
        fetchProgressEntries()
      } else {
        throw new Error('Failed to delete progress entry')
      }
    } catch (error) {
      console.error('Error deleting progress entry:', error)
      toast.error('Failed to delete progress entry')
    }
  }

  // Prepare chart data
  const chartData = progressEntries
    .slice(0, dateRange)
    .reverse()
    .map(entry => ({
      date: new Date(entry.entryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      painScore: entry.painScore,
      moodScore: entry.moodScore,
      mobilityScore: entry.mobilityScore,
      medicationAdherence: entry.medicationAdherence,
      exerciseAdherence: entry.exerciseAdherence,
    }))

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout 
      userType="patient" 
      userName={(session?.user as any)?.patientName || 'Patient'}
      userEmail={session?.user?.email || ''}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Progress Tracker
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Track your daily progress and monitor your recovery journey.
            </p>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Progress Overview</h3>
              {searchParams.get('filter') && (
                <p className="text-sm text-gray-500 mt-1">
                  Showing {chartFilter === 'painScore' ? 'Pain Score' : chartFilter === 'moodScore' ? 'Mood Score' : 'Mobility Score'} data
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={chartFilter}
                onChange={(e) => setChartFilter(e.target.value as 'painScore' | 'moodScore' | 'mobilityScore')}
                className="rounded-md border-gray-300 text-sm"
                aria-label="Select chart metric"
              >
                <option value="painScore">Pain Score</option>
                <option value="moodScore">Mood Score</option>
                <option value="mobilityScore">Mobility Score</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="rounded-md border-gray-300 text-sm"
                aria-label="Select date range"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>
          
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={chartFilter} 
                  stroke={chartFilter === 'painScore' ? '#ef4444' : chartFilter === 'moodScore' ? '#10b981' : '#3b82f6'} 
                  strokeWidth={2}
                  name={chartFilter === 'painScore' ? 'Pain Score' : chartFilter === 'moodScore' ? 'Mood Score' : 'Mobility Score'}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No progress data</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start logging your daily progress to see your recovery journey.
              </p>
            </div>
          )}
        </div>

        {/* Progress Entry Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {editingEntry ? 'Edit Progress Entry' : 'Log Daily Progress'}
            </h3>
            {editingEntry && (
              <button
                onClick={handleCancelEdit}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Date Selector */}
            <div>
              <label htmlFor="entryDate" className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="inline h-4 w-4 mr-1" />
                Select Date
              </label>
              <input
                type="date"
                id="entryDate"
                {...register('entryDate')}
                className="input-field"
                max={new Date().toISOString().split('T')[0]} // Can't select future dates
              />
              {errors.entryDate && (
                <p className="mt-1 text-sm text-red-600">{errors.entryDate.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pain Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <HeartIcon className="inline h-4 w-4 mr-1" />
                  Pain Score (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  {...register('painScore', { valueAsNumber: true })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 (No pain)</span>
                  <span>10 (Severe pain)</span>
                </div>
                <div className="text-center mt-2">
                  <span className="text-lg font-semibold text-red-600">
                    {watchedValues.painScore || 5}
                  </span>
                </div>
                {errors.painScore && (
                  <p className="mt-1 text-sm text-red-600">{errors.painScore.message}</p>
                )}
              </div>

              {/* Mood Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaceSmileIcon className="inline h-4 w-4 mr-1" />
                  Mood/Feel Score (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  {...register('moodScore', { valueAsNumber: true })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 (Very low)</span>
                  <span>10 (Excellent)</span>
                </div>
                <div className="text-center mt-2">
                  <span className="text-lg font-semibold text-green-600">
                    {watchedValues.moodScore || 5}
                  </span>
                </div>
                {errors.moodScore && (
                  <p className="mt-1 text-sm text-red-600">{errors.moodScore.message}</p>
                )}
              </div>

              {/* Mobility Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ArrowsRightLeftIcon className="inline h-4 w-4 mr-1" />
                  Mobility Score (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  {...register('mobilityScore', { valueAsNumber: true })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 (Very limited)</span>
                  <span>10 (Excellent)</span>
                </div>
                <div className="text-center mt-2">
                  <span className="text-lg font-semibold text-blue-600">
                    {watchedValues.mobilityScore || 5}
                  </span>
                </div>
                {errors.mobilityScore && (
                  <p className="mt-1 text-sm text-red-600">{errors.mobilityScore.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Medication Adherence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BeakerIcon className="inline h-4 w-4 mr-1" />
                  Medication Adherence
                </label>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">No</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('medicationAdherence')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-sm text-gray-600">Yes</span>
                </div>
                <div className="text-center mt-2">
                  <span className={`text-lg font-semibold ${watchedValues.medicationAdherence ? 'text-green-600' : 'text-red-600'}`}>
                    {watchedValues.medicationAdherence ? 'Yes' : 'No'}
                  </span>
                </div>
                {errors.medicationAdherence && (
                  <p className="mt-1 text-sm text-red-600">{errors.medicationAdherence.message}</p>
                )}
              </div>

              {/* Exercise Adherence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <PlayIcon className="inline h-4 w-4 mr-1" />
                  Exercise Adherence
                </label>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">No</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('exerciseAdherence')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                  <span className="text-sm text-gray-600">Yes</span>
                </div>
                <div className="text-center mt-2">
                  <span className={`text-lg font-semibold ${watchedValues.exerciseAdherence ? 'text-green-600' : 'text-red-600'}`}>
                    {watchedValues.exerciseAdherence ? 'Yes' : 'No'}
                  </span>
                </div>
                {errors.exerciseAdherence && (
                  <p className="mt-1 text-sm text-red-600">{errors.exerciseAdherence.message}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                {...register('notes')}
                className="input-field"
                placeholder="Any additional comments about your day, symptoms, or progress..."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingEntry ? 'Updating...' : 'Logging Progress...'}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {editingEntry ? 'Update Progress' : 'Log Progress'}
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Recent Entries */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Entries</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {progressEntries.length > 0 ? (
              progressEntries.slice(0, 10).map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {new Date(entry.entryDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 flex-wrap">
                            <div className="flex items-center">
                              <HeartIcon className="h-4 w-4 text-red-500 mr-1" />
                              <span className="text-sm font-medium text-gray-900">
                                Pain: {entry.painScore}/10
                              </span>
                            </div>
                            <div className="flex items-center">
                              <FaceSmileIcon className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-sm font-medium text-gray-900">
                                Mood: {entry.moodScore}/10
                              </span>
                            </div>
                            <div className="flex items-center">
                              <ArrowsRightLeftIcon className="h-4 w-4 text-blue-500 mr-1" />
                              <span className="text-sm font-medium text-gray-900">
                                Mobility: {entry.mobilityScore}/10
                              </span>
                            </div>
                            <div className="flex items-center">
                              <BeakerIcon className="h-4 w-4 text-blue-500 mr-1" />
                              <span className={`text-sm font-medium ${entry.medicationAdherence ? 'text-green-600' : 'text-red-600'}`}>
                                Meds: {entry.medicationAdherence ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <PlayIcon className="h-4 w-4 text-purple-500 mr-1" />
                              <span className={`text-sm font-medium ${entry.exerciseAdherence ? 'text-green-600' : 'text-red-600'}`}>
                                Exercise: {entry.exerciseAdherence ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>
                      {entry.notes && (
                        <p className="mt-2 text-sm text-gray-600">{entry.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit entry"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete entry"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-6 text-center">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No progress entries</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start logging your daily progress to track your recovery journey.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function PatientProgressPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>}>
      <PatientProgressPageContent />
    </Suspense>
  )
}
