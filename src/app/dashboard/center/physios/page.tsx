'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PlusIcon, MagnifyingGlassIcon, XMarkIcon, UserIcon, ClipboardDocumentListIcon, ClockIcon } from '@heroicons/react/24/outline'

interface Physio {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  license: string
  specialization: string | null
  isActive: boolean
  createdAt: string
  centerPhysioId: string
  addedAt: string
  notes?: string
  stats: {
    currentPatients: number
    activePlans: number
    totalPatientsServed: number
  }
}

interface GlobalPhysio {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  license: string
  specialization: string | null
  isActive: boolean
  createdAt: string
}

export default function CenterPhysiosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [physios, setPhysios] = useState<Physio[]>([])
  const [globalPhysios, setGlobalPhysios] = useState<GlobalPhysio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPhysio, setSelectedPhysio] = useState<GlobalPhysio | null>(null)
  const [notes, setNotes] = useState('')
  const [linkingPhysio, setLinkingPhysio] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchPhysios()
  }, [session, status, router])

  const fetchPhysios = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/center/physios')
      
      if (!response.ok) {
        throw new Error('Failed to fetch physios')
      }

      const data = await response.json()
      setPhysios(data.physios || [])
    } catch (err) {
      console.error('Error fetching physios:', err)
      setError('Failed to load physios')
    } finally {
      setLoading(false)
    }
  }

  const fetchGlobalPhysios = async () => {
    try {
      const response = await fetch('/api/physios')
      
      if (!response.ok) {
        throw new Error('Failed to fetch global physios')
      }

      const data = await response.json()
      setGlobalPhysios(data.physios || [])
    } catch (err) {
      console.error('Error fetching global physios:', err)
      setError('Failed to load global physios')
    }
  }

  const handleAddPhysio = async () => {
    if (!selectedPhysio) return

    try {
      setLinkingPhysio(true)
      const response = await fetch('/api/center/physios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          physioId: selectedPhysio.id,
          notes: notes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to link physio')
      }

      // Refresh the physios list
      await fetchPhysios()
      
      // Close modal and reset form
      setShowAddModal(false)
      setSelectedPhysio(null)
      setNotes('')
      setSearchTerm('')
    } catch (err) {
      console.error('Error linking physio:', err)
      setError(err instanceof Error ? err.message : 'Failed to link physio')
    } finally {
      setLinkingPhysio(false)
    }
  }

  const openAddModal = () => {
    setShowAddModal(true)
    fetchGlobalPhysios()
  }

  const closeAddModal = () => {
    setShowAddModal(false)
    setSelectedPhysio(null)
    setNotes('')
    setSearchTerm('')
  }

  const filteredGlobalPhysios = globalPhysios.filter(physio => {
    const searchLower = searchTerm.toLowerCase()
    return (
      physio.firstName.toLowerCase().includes(searchLower) ||
      physio.lastName.toLowerCase().includes(searchLower) ||
      physio.email.toLowerCase().includes(searchLower) ||
      physio.license.toLowerCase().includes(searchLower) ||
      (physio.specialization && physio.specialization.toLowerCase().includes(searchLower))
    )
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Inactive</span>
    )
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout userType="center">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userType="center">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Center Physios</h1>
              <p className="text-gray-600">Manage and view all physiotherapists working with your center</p>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Physio
            </button>
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
              <h2 className="text-xl font-semibold text-gray-900">Physio List</h2>
              <span className="text-sm text-gray-500">
                {physios.length} physio{physios.length !== 1 ? 's' : ''} registered
              </span>
            </div>
          </div>

          {physios.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 mb-4">
                <UserIcon className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No physios found</h3>
              <p className="text-gray-500 mb-4">Physios will appear here once they are linked to your center.</p>
              <button
                onClick={openAddModal}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Your First Physio
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Physio ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name & License
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact & Specialization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Patients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Plans
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Served
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {physios.map((physio) => (
                    <tr key={physio.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {physio.id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {physio.firstName} {physio.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            License: {physio.license}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{physio.email}</div>
                        <div className="text-sm text-gray-500">{physio.phone}</div>
                        {physio.specialization && (
                          <div className="text-sm text-blue-600">{physio.specialization}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {physio.stats.currentPatients}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ClipboardDocumentListIcon className="h-4 w-4 text-green-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {physio.stats.activePlans}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 text-blue-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {physio.stats.totalPatientsServed}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(physio.isActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(physio.addedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Physio Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add Physio to Center</h3>
                  <button
                    onClick={closeAddModal}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Physios
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, license, or specialization..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mb-4 max-h-64 overflow-y-auto">
                  {filteredGlobalPhysios.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No physios found matching your search.' : 'No physios available.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredGlobalPhysios.map((physio) => (
                        <div
                          key={physio.id}
                          onClick={() => setSelectedPhysio(physio)}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedPhysio?.id === physio.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {physio.firstName} {physio.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">{physio.email}</p>
                              <p className="text-sm text-gray-500">License: {physio.license}</p>
                              {physio.specialization && (
                                <p className="text-sm text-blue-600">{physio.specialization}</p>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatDate(physio.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedPhysio && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this physio..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeAddModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPhysio}
                    disabled={!selectedPhysio || linkingPhysio}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {linkingPhysio ? 'Linking...' : 'Link Physio'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
