'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface SummaryItem {
  physioId: string
  physioName: string
  avgPatientsPerMonth: number
  avgAppointmentsPerMonth: number
  avgAppointmentDurationMin: number
  avgRating: number | null
}

interface ReportResponse {
  rangeStart: string
  rangeEnd: string
  months: number
  summaries: SummaryItem[]
}

interface PatientRow {
  id: string
  firstName: string
  lastName: string
  startPain?: number
  startMobility?: number
  currentPain?: number
  currentMobility?: number
  lastFeedback?: string | null
}

export default function CenterReportsPage() {
  const [data, setData] = useState<ReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhysioId, setSelectedPhysioId] = useState<string>('')
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [patientsLoading, setPatientsLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/center/reports')
        if (!res.ok) throw new Error('Failed to load reports')
        const json = await res.json()
        setData(json)
      } catch (e) {
        setError('Failed to load reports')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadPatients = async () => {
      if (!selectedPhysioId) { setPatients([]); return }
      setPatientsLoading(true)
      try {
        // Build patients from prescriptions + progress
        const res = await fetch(`/api/center/physios?physioId=${encodeURIComponent(selectedPhysioId)}&detail=patients`)
        if (!res.ok) throw new Error('Failed to load patients for physio')
        const json = await res.json()
        // Expect API to return patients array with progress snapshots if available.
        setPatients(json.patients || [])
      } catch (e) {
        setPatients([])
      } finally {
        setPatientsLoading(false)
      }
    }
    loadPatients()
  }, [selectedPhysioId])

  const summaries = useMemo(() => data?.summaries || [], [data])

  return (
    <DashboardLayout userType="center">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Insights from the last 3 months</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {summaries.map((s) => (
                <div key={s.physioId} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{s.physioName}</h3>
                    <span className="text-xs text-gray-500">per month</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{s.avgPatientsPerMonth.toFixed(1)}</div>
                      <div className="text-xs text-gray-500">Avg Patients</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{s.avgAppointmentsPerMonth.toFixed(1)}</div>
                      <div className="text-xs text-gray-500">Avg Appointments</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{s.avgAppointmentDurationMin.toFixed(0)}m</div>
                      <div className="text-xs text-gray-500">Avg Duration</div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    Avg Rating: {s.avgRating !== null ? s.avgRating.toFixed(1) : 'N/A'}
                  </div>
                </div>
              ))}
            </div>

            {/* Physio filter and patients table */}
            <div className="mt-10 bg-white rounded-lg shadow p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Patients by Physio</h2>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-700">Select Physio</label>
                  <select
                    value={selectedPhysioId}
                    onChange={(e) => setSelectedPhysioId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Select physio"
                    title="Select physio"
                  >
                    <option value="">-- Choose --</option>
                    {summaries.map(s => (
                      <option key={s.physioId} value={s.physioId}>{s.physioName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                {patientsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : patients.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No patients to display</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Pain</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Mobility</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Pain</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Mobility</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Feedback</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {patients.map(p => (
                          <tr key={p.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.firstName} {p.lastName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{p.startPain ?? '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{p.startMobility ?? '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{p.currentPain ?? '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{p.currentMobility ?? '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.lastFeedback || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}


