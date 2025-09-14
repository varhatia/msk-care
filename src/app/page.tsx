'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  UserGroupIcon, 
  UserIcon, 
  HeartIcon, 
  CalendarIcon,
  ChartBarIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'center' | 'patient'>('center')

  const features = [
    {
      icon: UserGroupIcon,
      title: 'Center Management',
      description: 'Comprehensive tools for rehab centers to manage patients, physios, and schedules.'
    },
    {
      icon: UserIcon,
      title: 'Patient Profiles',
      description: 'Detailed patient profiles with medical history, progress tracking, and personalized care plans.'
    },
    {
      icon: CalendarIcon,
      title: 'Exercise Scheduling',
      description: 'Create and manage custom exercise plans with video demonstrations and automated reminders.'
    },
    {
      icon: VideoCameraIcon,
      title: 'Video Consultations',
      description: 'Integrated video calling for follow-up sessions and remote consultations.'
    },
    {
      icon: ChartBarIcon,
      title: 'Progress Tracking',
      description: 'Monitor patient progress with detailed analytics and form-based assessments.'
    },
    {
      icon: HeartIcon,
      title: 'Health Monitoring',
      description: 'Track pain scores, mobility, and adherence to treatment plans.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <HeartIcon className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">MSK Care</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/auth/login" className="btn-secondary">
                Login
              </Link>
              <Link href="/auth/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              Revolutionizing
              <span className="text-primary-600"> Rehab Care</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              Comprehensive rehabilitation management platform connecting centers and patients for better outcomes
            </motion.p>
            
            {/* Login Tabs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="max-w-md mx-auto mb-8"
            >
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                  <button
                    onClick={() => setActiveTab('center')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'center'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Rehab Center
                  </button>
                  <button
                    onClick={() => setActiveTab('patient')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'patient'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Patient
                  </button>
                </div>
                
                <div className="space-y-4">
                  <Link 
                    href={`/auth/login?type=${activeTab}`}
                    className="w-full btn-primary block text-center"
                  >
                    Login to {activeTab === 'center' ? 'Center Portal' : 'Patient Portal'}
                  </Link>
                  <Link 
                    href={`/auth/register?type=${activeTab}`}
                    className="w-full btn-secondary block text-center"
                  >
                    Register New {activeTab === 'center' ? 'Center' : 'Patient'}
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need for effective rehabilitation
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides comprehensive tools for both rehabilitation centers and patients
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <feature.icon className="h-12 w-12 text-primary-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to transform your rehabilitation practice?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of healthcare professionals and patients who trust MSK Care for their rehabilitation needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register?type=center" className="btn-secondary">
              Register Your Center
            </Link>
            <Link href="/auth/register?type=patient" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-2 px-6 rounded-lg transition-colors duration-200">
              Join as Patient
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <HeartIcon className="h-6 w-6 text-primary-400" />
                <span className="ml-2 text-lg font-semibold">MSK Care</span>
              </div>
              <p className="text-gray-400">
                Revolutionizing rehabilitation care through technology and innovation.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">For Centers</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features/centers" className="hover:text-white">Patient Management</Link></li>
                <li><Link href="/features/centers" className="hover:text-white">Exercise Library</Link></li>
                <li><Link href="/features/centers" className="hover:text-white">Progress Tracking</Link></li>
                <li><Link href="/features/centers" className="hover:text-white">Video Consultations</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">For Patients</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features/patients" className="hover:text-white">Exercise Plans</Link></li>
                <li><Link href="/features/patients" className="hover:text-white">Progress Monitoring</Link></li>
                <li><Link href="/features/patients" className="hover:text-white">Appointment Booking</Link></li>
                <li><Link href="/features/patients" className="hover:text-white">Health Records</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MSK Care. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
