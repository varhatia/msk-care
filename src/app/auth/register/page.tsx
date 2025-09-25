'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  UserGroupIcon, 
  UserIcon,
  HeartIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  MapPinIcon,
  CakeIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import PasswordInput from '@/components/ui/PasswordInput'
import ConfirmPasswordInput from '@/components/ui/ConfirmPasswordInput'
import { passwordSchema } from '@/lib/passwordValidation'

const centerSchema = z.object({
  centerName: z.string().min(2, 'Center name must be at least 2 characters'),
  address: z.string().min(10, 'Please enter a complete address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email address'),
  license: z.string().min(5, 'Please enter a valid license number'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const patientSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  dateOfBirth: z.string().min(1, 'Please select your date of birth'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const physioSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  license: z.string().min(5, 'Please enter a valid license number'),
  specialization: z.string().optional(),
  centerId: z.string().optional(),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const nutritionistSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  license: z.string().min(5, 'Please enter a valid license number'),
  specialization: z.string().optional(),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type CenterFormData = z.infer<typeof centerSchema>
type PatientFormData = z.infer<typeof patientSchema>
type PhysioFormData = z.infer<typeof physioSchema>
type NutritionistFormData = z.infer<typeof nutritionistSchema>

function RegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  
  const defaultRole = searchParams.get('type') as 'center' | 'patient' | 'physio' | 'nutritionist' || 'center'
  const [role, setRole] = useState<'center' | 'patient' | 'physio' | 'nutritionist'>(defaultRole)

  const centerForm = useForm<CenterFormData>({
    resolver: zodResolver(centerSchema),
  })

  const patientForm = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  })

  const physioForm = useForm<PhysioFormData>({
    resolver: zodResolver(physioSchema),
  })

  const nutritionistForm = useForm<NutritionistFormData>({
    resolver: zodResolver(nutritionistSchema),
  })

  const onCenterSubmit = async (data: CenterFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register/center', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.centerName,
          address: data.address,
          phone: data.phone,
          email: data.email,
          license: data.license,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      toast.success('Center registered successfully!')
      router.push('/auth/login?type=center')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onPatientSubmit = async (data: PatientFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register/patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          address: data.address,
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      toast.success('Patient registered successfully!')
      router.push('/auth/login?type=patient')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onPhysioSubmit = async (data: PhysioFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register/physio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          license: data.license,
          specialization: data.specialization,
          centerId: data.centerId,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      toast.success('Physio registered successfully!')
      router.push('/auth/login?type=physio')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onNutritionistSubmit = async (data: NutritionistFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register/nutritionist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          license: data.license,
          specialization: data.specialization,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      toast.success('Nutritionist registered successfully!')
      router.push('/auth/login?type=nutritionist')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <HeartIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join MSK Care as a {role === 'center' ? 'rehabilitation center' : role === 'physio' ? 'physiotherapist' : role === 'nutritionist' ? 'nutritionist' : 'patient'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Role Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I want to register as:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('center')}
                className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  role === 'center'
                    ? 'bg-primary-100 text-primary-600 border-2 border-primary-200'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                Rehab Center
              </button>
              <button
                type="button"
                onClick={() => setRole('physio')}
                className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  role === 'physio'
                    ? 'bg-primary-100 text-primary-600 border-2 border-primary-200'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <UserGroupIcon className="h-4 w-4 mr-2" />
                Physio
              </button>
              <button
                type="button"
                onClick={() => setRole('nutritionist')}
                className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  role === 'nutritionist'
                    ? 'bg-primary-100 text-primary-600 border-2 border-primary-200'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <CakeIcon className="h-4 w-4 mr-2" />
                Nutritionist
              </button>
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  role === 'patient'
                    ? 'bg-primary-100 text-primary-600 border-2 border-primary-200'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Patient
              </button>
            </div>
          </div>

          {/* Center Registration Form */}
          {role === 'center' && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
              onSubmit={centerForm.handleSubmit(onCenterSubmit)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="centerName" className="block text-sm font-medium text-gray-700">
                    Center Name *
                  </label>
                  <input
                    id="centerName"
                    type="text"
                    {...centerForm.register('centerName')}
                    className="input-field"
                    placeholder="Enter center name"
                  />
                  {centerForm.formState.errors.centerName && (
                    <p className="mt-1 text-sm text-error-600">{centerForm.formState.errors.centerName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="license" className="block text-sm font-medium text-gray-700">
                    License Number *
                  </label>
                  <input
                    id="license"
                    type="text"
                    {...centerForm.register('license')}
                    className="input-field"
                    placeholder="Enter license number"
                  />
                  {centerForm.formState.errors.license && (
                    <p className="mt-1 text-sm text-error-600">{centerForm.formState.errors.license.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address *
                </label>
                <div className="mt-1 relative">
                  <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="address"
                    type="text"
                    {...centerForm.register('address')}
                    className="input-field pl-10"
                    placeholder="Enter complete address"
                  />
                </div>
                {centerForm.formState.errors.address && (
                  <p className="mt-1 text-sm text-error-600">{centerForm.formState.errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <div className="mt-1 relative">
                    <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="phone"
                      type="tel"
                      {...centerForm.register('phone')}
                      className="input-field pl-10"
                      placeholder="Enter phone number"
                    />
                  </div>
                  {centerForm.formState.errors.phone && (
                    <p className="mt-1 text-sm text-error-600">{centerForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...centerForm.register('email')}
                    className="input-field"
                    placeholder="Enter email address"
                  />
                  {centerForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-error-600">{centerForm.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <PasswordInput
                    value={centerForm.watch('password') || ''}
                    onChange={(value) => centerForm.setValue('password', value)}
                    label="Password"
                    placeholder="Enter password"
                    error={centerForm.formState.errors.password?.message}
                    showStrength={true}
                    required={true}
                  />
                </div>

                <div>
                  <ConfirmPasswordInput
                    value={centerForm.watch('confirmPassword') || ''}
                    onChange={(value) => centerForm.setValue('confirmPassword', value)}
                    label="Confirm Password"
                    placeholder="Confirm password"
                    error={centerForm.formState.errors.confirmPassword?.message}
                    required={true}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create Center Account'
                )}
              </button>
            </motion.form>
          )}

          {/* Patient Registration Form */}
          {role === 'patient' && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
              onSubmit={patientForm.handleSubmit(onPatientSubmit)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    {...patientForm.register('firstName')}
                    className="input-field"
                    placeholder="Enter first name"
                  />
                  {patientForm.formState.errors.firstName && (
                    <p className="mt-1 text-sm text-error-600">{patientForm.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    {...patientForm.register('lastName')}
                    className="input-field"
                    placeholder="Enter last name"
                  />
                  {patientForm.formState.errors.lastName && (
                    <p className="mt-1 text-sm text-error-600">{patientForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date of Birth *
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    {...patientForm.register('dateOfBirth')}
                    className="input-field"
                  />
                  {patientForm.formState.errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-error-600">{patientForm.formState.errors.dateOfBirth.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    {...patientForm.register('gender')}
                    className="input-field"
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {patientForm.formState.errors.gender && (
                    <p className="mt-1 text-sm text-error-600">{patientForm.formState.errors.gender.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <div className="mt-1 relative">
                    <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="phone"
                      type="tel"
                      {...patientForm.register('phone')}
                      className="input-field pl-10"
                      placeholder="Enter phone number"
                    />
                  </div>
                  {patientForm.formState.errors.phone && (
                    <p className="mt-1 text-sm text-error-600">{patientForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...patientForm.register('email')}
                    className="input-field"
                    placeholder="Enter email address"
                  />
                  {patientForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-error-600">{patientForm.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <div className="mt-1 relative">
                  <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="address"
                    type="text"
                    {...patientForm.register('address')}
                    className="input-field pl-10"
                    placeholder="Enter address (optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700">
                    Emergency Contact
                  </label>
                  <input
                    id="emergencyContact"
                    type="text"
                    {...patientForm.register('emergencyContact')}
                    className="input-field"
                    placeholder="Emergency contact name"
                  />
                </div>

                <div>
                  <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700">
                    Emergency Phone
                  </label>
                  <div className="mt-1 relative">
                    <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="emergencyPhone"
                      type="tel"
                      {...patientForm.register('emergencyPhone')}
                      className="input-field pl-10"
                      placeholder="Emergency phone number"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <PasswordInput
                    value={patientForm.watch('password') || ''}
                    onChange={(value) => patientForm.setValue('password', value)}
                    label="Password"
                    placeholder="Enter password"
                    error={patientForm.formState.errors.password?.message}
                    showStrength={true}
                    required={true}
                  />
                </div>

                <div>
                  <ConfirmPasswordInput
                    value={patientForm.watch('confirmPassword') || ''}
                    onChange={(value) => patientForm.setValue('confirmPassword', value)}
                    label="Confirm Password"
                    placeholder="Confirm password"
                    error={patientForm.formState.errors.confirmPassword?.message}
                    required={true}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create Patient Account'
                )}
              </button>
            </motion.form>
          )}

          {/* Physio Registration Form */}
          {role === 'physio' && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
              onSubmit={physioForm.handleSubmit(onPhysioSubmit)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    {...physioForm.register('firstName')}
                    className="input-field"
                    placeholder="Enter first name"
                  />
                  {physioForm.formState.errors.firstName && (
                    <p className="mt-1 text-sm text-error-600">{physioForm.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    {...physioForm.register('lastName')}
                    className="input-field"
                    placeholder="Enter last name"
                  />
                  {physioForm.formState.errors.lastName && (
                    <p className="mt-1 text-sm text-error-600">{physioForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <div className="mt-1 relative">
                    <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="phone"
                      type="tel"
                      {...physioForm.register('phone')}
                      className="input-field pl-10"
                      placeholder="Enter phone number"
                    />
                  </div>
                  {physioForm.formState.errors.phone && (
                    <p className="mt-1 text-sm text-error-600">{physioForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...physioForm.register('email')}
                    className="input-field"
                    placeholder="Enter email address"
                  />
                  {physioForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-error-600">{physioForm.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="license" className="block text-sm font-medium text-gray-700">
                  License Number *
                </label>
                <input
                  id="license"
                  type="text"
                  {...physioForm.register('license')}
                  className="input-field"
                  placeholder="Enter license number"
                />
                {physioForm.formState.errors.license && (
                  <p className="mt-1 text-sm text-error-600">{physioForm.formState.errors.license.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                  Specialization *
                </label>
                <input
                  id="specialization"
                  type="text"
                  {...physioForm.register('specialization')}
                  className="input-field"
                  placeholder="Enter your specialization"
                />
                {physioForm.formState.errors.specialization && (
                  <p className="mt-1 text-sm text-error-600">{physioForm.formState.errors.specialization.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="centerId" className="block text-sm font-medium text-gray-700">
                  Center (Optional)
                </label>
                <input
                  id="centerId"
                  type="text"
                  {...physioForm.register('centerId')}
                  className="input-field"
                  placeholder="Enter center ID if you are a physio working for a center"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <PasswordInput
                    value={physioForm.watch('password') || ''}
                    onChange={(value) => physioForm.setValue('password', value)}
                    label="Password"
                    placeholder="Enter password"
                    error={physioForm.formState.errors.password?.message}
                    showStrength={true}
                    required={true}
                  />
                </div>

                <div>
                  <ConfirmPasswordInput
                    value={physioForm.watch('confirmPassword') || ''}
                    onChange={(value) => physioForm.setValue('confirmPassword', value)}
                    label="Confirm Password"
                    placeholder="Confirm password"
                    error={physioForm.formState.errors.confirmPassword?.message}
                    required={true}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create Physio Account'
                )}
              </button>
            </motion.form>
          )}

          {/* Nutritionist Registration Form */}
          {role === 'nutritionist' && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
              onSubmit={nutritionistForm.handleSubmit(onNutritionistSubmit)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    {...nutritionistForm.register('firstName')}
                    className="input-field"
                    placeholder="Enter first name"
                  />
                  {nutritionistForm.formState.errors.firstName && (
                    <p className="mt-1 text-sm text-error-600">{nutritionistForm.formState.errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    {...nutritionistForm.register('lastName')}
                    className="input-field"
                    placeholder="Enter last name"
                  />
                  {nutritionistForm.formState.errors.lastName && (
                    <p className="mt-1 text-sm text-error-600">{nutritionistForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <div className="mt-1 relative">
                    <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="phone"
                      type="tel"
                      {...nutritionistForm.register('phone')}
                      className="input-field pl-10"
                      placeholder="Enter phone number"
                    />
                  </div>
                  {nutritionistForm.formState.errors.phone && (
                    <p className="mt-1 text-sm text-error-600">{nutritionistForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...nutritionistForm.register('email')}
                    className="input-field"
                    placeholder="Enter email address"
                  />
                  {nutritionistForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-error-600">{nutritionistForm.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="license" className="block text-sm font-medium text-gray-700">
                  License Number *
                </label>
                <input
                  id="license"
                  type="text"
                  {...nutritionistForm.register('license')}
                  className="input-field"
                  placeholder="Enter license number"
                />
                {nutritionistForm.formState.errors.license && (
                  <p className="mt-1 text-sm text-error-600">{nutritionistForm.formState.errors.license.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                  Specialization
                </label>
                <input
                  id="specialization"
                  type="text"
                  {...nutritionistForm.register('specialization')}
                  className="input-field"
                  placeholder="Enter your specialization (e.g., Sports Nutrition, Clinical Nutrition)"
                />
                {nutritionistForm.formState.errors.specialization && (
                  <p className="mt-1 text-sm text-error-600">{nutritionistForm.formState.errors.specialization.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <PasswordInput
                    value={nutritionistForm.watch('password') || ''}
                    onChange={(value) => nutritionistForm.setValue('password', value)}
                    label="Password"
                    placeholder="Enter password"
                    error={nutritionistForm.formState.errors.password?.message}
                    showStrength={true}
                    required={true}
                  />
                </div>

                <div>
                  <ConfirmPasswordInput
                    value={nutritionistForm.watch('confirmPassword') || ''}
                    onChange={(value) => nutritionistForm.setValue('confirmPassword', value)}
                    label="Confirm Password"
                    placeholder="Confirm password"
                    error={nutritionistForm.formState.errors.confirmPassword?.message}
                    required={true}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create Nutritionist Account'
                )}
              </button>
            </motion.form>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                href={`/auth/login?type=${role}`}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link 
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>}>
      <RegisterPageContent />
    </Suspense>
  )
}
