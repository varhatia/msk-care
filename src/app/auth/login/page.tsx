'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  EyeIcon, 
  EyeSlashIcon, 
  UserGroupIcon, 
  UserIcon,
  HeartIcon,
  CakeIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { signIn } from 'next-auth/react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['center', 'patient', 'physio', 'nutritionist', 'admin']),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const defaultRole = searchParams.get('type') as 'center' | 'patient' | 'physio' | 'nutritionist' | 'admin' || 'center'

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: defaultRole,
    },
  })

  const watchedRole = watch('role')

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
        role: data.role,
      })

      if (!result) {
        toast.error('Something went wrong. Please try again.')
        return
      }

      if (result.error) {
        const err = result.error
        if (err.includes('register')) {
          toast.error(err)
        } else if (err.toLowerCase().includes('invalid')) {
          toast.error('Invalid email or password')
        } else {
          toast.error(err)
        }
        return
      }

      toast.success('Login successful!')
      if (data.role === 'center') router.push('/dashboard/center')
      else if (data.role === 'physio') router.push('/dashboard/physio')
      else if (data.role === 'nutritionist') router.push('/dashboard/nutritionist')
      else if (data.role === 'admin') router.push('/dashboard/admin')
      else router.push('/dashboard/patient')
    } catch (error) {
      toast.error('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="flex justify-center">
            <HeartIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your {watchedRole === 'center' ? 'center' : watchedRole === 'physio' ? 'physio' : watchedRole === 'nutritionist' ? 'nutritionist' : watchedRole === 'admin' ? 'MSK Care admin' : 'patient'} account
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I am a:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue('role', 'center', { shouldValidate: true, shouldDirty: true })}
                className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  watchedRole === 'center'
                    ? 'bg-primary-100 text-primary-600 border-2 border-primary-200'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <UserGroupIcon className="h-4 w-4 mr-2" />
                Rehab Center
              </button>
              <button
                type="button"
                onClick={() => setValue('role', 'physio', { shouldValidate: true, shouldDirty: true })}
                className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  watchedRole === 'physio'
                    ? 'bg-primary-100 text-primary-600 border-2 border-primary-200'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Physio
              </button>
              <button
                type="button"
                onClick={() => setValue('role', 'nutritionist', { shouldValidate: true, shouldDirty: true })}
                className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  watchedRole === 'nutritionist'
                    ? 'bg-primary-100 text-primary-600 border-2 border-primary-200'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <CakeIcon className="h-4 w-4 mr-2" />
                Nutritionist
              </button>
              <button
                type="button"
                onClick={() => setValue('role', 'patient', { shouldValidate: true, shouldDirty: true })}
                className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  watchedRole === 'patient'
                    ? 'bg-primary-100 text-primary-600 border-2 border-primary-200'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Patient
              </button>
              <button
                type="button"
                onClick={() => setValue('role', 'admin', { shouldValidate: true, shouldDirty: true })}
                className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-colors col-span-2 ${
                  watchedRole === 'admin'
                    ? 'bg-primary-100 text-primary-600 border-2 border-primary-200'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <UserGroupIcon className="h-4 w-4 mr-2" />
                MSK Care Admin
              </button>
            </div>
            <input type="hidden" {...register('role')} />
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="input-field"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/register?type=patient" className="font-medium text-primary-600 hover:text-primary-500">
                  New here? Register
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                href={`/auth/register?type=${watchedRole}`}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>}>
      <LoginPageContent />
    </Suspense>
  )
}
