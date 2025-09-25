'use client'

import { useState, useRef } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { checkPasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor } from '@/lib/passwordValidation'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  showStrength?: boolean
  required?: boolean
  className?: string
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = 'Enter password',
  label = 'Password',
  error,
  showStrength = true,
  required = false,
  className = ''
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const strength = checkPasswordStrength(value)
  const strengthLabel = getPasswordStrengthLabel(strength.score)
  const strengthColor = getPasswordStrengthColor(strength.score)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
    inputRef.current?.focus()
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type={showPassword ? 'text' : 'password'}
          id="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`block w-full px-3 py-2 pr-20 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          required={required}
        />
        
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          {showPassword ? (
            <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          ) : (
            <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {showStrength && value && (isFocused || value.length > 0) && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  strength.score === 0 || strength.score === 1
                    ? 'bg-red-500'
                    : strength.score === 2
                    ? 'bg-orange-500'
                    : strength.score === 3
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${(strength.score / 4) * 100}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${strengthColor}`}>
              {strengthLabel}
            </span>
          </div>
          
          {strength.feedback.length > 0 && (
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">Password requirements:</p>
              <ul className="space-y-1">
                {strength.feedback.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-red-500 mr-2">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
