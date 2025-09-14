'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  HeartIcon,
  UserGroupIcon,
  UserIcon,
  CalendarIcon,
  ChartBarIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  BellIcon,
  CakeIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: React.ReactNode
  userType: 'center' | 'patient' | 'nutritionist' | 'admin'
  userName?: string
  userEmail?: string
}

export default function DashboardLayout({ 
  children, 
  userType, 
  userName = 'User',
  userEmail = 'user@example.com'
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const centerNavigation = [
    { name: 'Dashboard', href: '/dashboard/center', icon: ChartBarIcon },
    { name: 'Patients', href: '/dashboard/center/patients', icon: UserGroupIcon },
    { name: 'Physios', href: '/dashboard/center/physios', icon: UserIcon },
    { name: 'Exercise Directory', href: '/dashboard/center/exercises', icon: DocumentTextIcon },
    { name: 'Exercise Plans', href: '/dashboard/center/exercise-plans', icon: DocumentTextIcon },
    { name: 'Appointments', href: '/dashboard/center/appointments', icon: CalendarIcon },
    { name: 'Video Calls', href: '/dashboard/center/video-calls', icon: VideoCameraIcon },
    { name: 'Reports', href: '/dashboard/center/reports', icon: ChartBarIcon },
  ]

  const patientNavigation = [
    { name: 'Dashboard', href: '/dashboard/patient', icon: ChartBarIcon },
    { name: 'My Exercises', href: '/dashboard/patient/exercises', icon: DocumentTextIcon },
    { name: 'Progress', href: '/dashboard/patient/progress', icon: ChartBarIcon },
    { name: 'Appointments', href: '/dashboard/patient/appointments', icon: CalendarIcon },
    { name: 'Video Calls', href: '/dashboard/patient/video-calls', icon: VideoCameraIcon },
    { name: 'Health Records', href: '/dashboard/patient/records', icon: DocumentTextIcon },
  ]

  const nutritionistNavigation = [
    { name: 'Dashboard', href: '/dashboard/nutritionist', icon: ChartBarIcon },
    { name: 'My Patients', href: '/dashboard/nutritionist/patients', icon: UserGroupIcon },
    { name: 'Meal Plans', href: '/dashboard/nutritionist/meal-plans', icon: DocumentTextIcon },
    { name: 'Appointments', href: '/dashboard/nutritionist/appointments', icon: CalendarIcon },
    { name: 'Video Calls', href: '/dashboard/nutritionist/video-calls', icon: VideoCameraIcon },
    { name: 'Reports', href: '/dashboard/nutritionist/reports', icon: ChartBarIcon },
  ]

  const adminNavigation = [
    { name: 'Dashboard', href: '/dashboard/admin', icon: ChartBarIcon },
    { name: 'User Approvals', href: '/dashboard/admin/approvals', icon: UserGroupIcon },
    { name: 'Centers', href: '/dashboard/admin/centers', icon: UserIcon },
    { name: 'Physios', href: '/dashboard/admin/physios', icon: HeartIcon },
    { name: 'Patients', href: '/dashboard/admin/patients', icon: UserGroupIcon },
    { name: 'Nutritionists', href: '/dashboard/admin/nutritionists', icon: CakeIcon },
    { name: 'Reports', href: '/dashboard/admin/reports', icon: ChartBarIcon },
    { name: 'System Settings', href: '/dashboard/admin/settings', icon: Cog6ToothIcon },
  ]

  const getNavigation = () => {
    switch (userType) {
      case 'center':
        return centerNavigation
      case 'nutritionist':
        return nutritionistNavigation
      case 'admin':
        return adminNavigation
      default:
        return patientNavigation
    }
  }

  const navigation = getNavigation()

  const handleLogout = () => {
    // TODO: Implement logout logic
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative flex w-full max-w-xs flex-1 flex-col bg-white pb-4 pt-5"
            >
              <div className="absolute right-0 top-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close sidebar"
                >
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>

              <div className="flex flex-shrink-0 items-center px-4">
                <HeartIcon className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">MSK Care</span>
              </div>

              <div className="mt-5 h-0 flex-1 overflow-y-auto">
                <nav className="space-y-1 px-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-primary-100 text-primary-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon
                          className={`mr-4 h-6 w-6 flex-shrink-0 ${
                            isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                          }`}
                        />
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {/* User menu */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center">
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">{userName}</p>
                    <p className="text-xs text-gray-500">{userEmail}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                  >
                    <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                    Sign out
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <HeartIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">MSK Care</span>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User menu */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href="/dashboard/settings"
                className="flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
              >
                <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                aria-label="Notifications"
              >
                <BellIcon className="h-6 w-6" />
              </button>

              {/* Separator */}
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

              {/* Profile dropdown */}
              <div className="flex items-center gap-x-4">
                <span className="hidden lg:flex lg:items-center">
                  <span className="text-sm font-medium text-gray-700">{userName}</span>
                </span>
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
