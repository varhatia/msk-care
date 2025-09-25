import { z } from 'zod'

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be no more than 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character (!@#$%^&*)')
  .refine(
    (password) => {
      // Check for common weak patterns
      const weakPatterns = [
        /(.)\1{2,}/, // 3+ consecutive same characters
        /123|234|345|456|567|678|789|890/, // Sequential numbers
        /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // Sequential letters
        /qwerty|asdfgh|zxcvbn/i, // Keyboard patterns
        /password|admin|user|login|welcome|123456|qwerty/i // Common weak passwords
      ]
      
      return !weakPatterns.some(pattern => pattern.test(password))
    },
    'Password contains common weak patterns'
  )

// Password strength checker for UI feedback
export interface PasswordStrength {
  score: number // 0-4
  feedback: string[]
  isValid: boolean
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('At least 8 characters')
  }

  if (password.length >= 12) {
    score += 1
  }

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Lowercase letter')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Uppercase letter')
  }

  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Number')
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Special character')
  }

  // Bonus points for length
  if (password.length >= 16) {
    score += 1
  }

  // Check for weak patterns
  const weakPatterns = [
    /(.)\1{2,}/, // 3+ consecutive same characters
    /123|234|345|456|567|678|789|890/, // Sequential numbers
    /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // Sequential letters
    /qwerty|asdfgh|zxcvbn/i, // Keyboard patterns
    /password|admin|user|login|welcome|123456|qwerty/i // Common weak passwords
  ]

  const hasWeakPattern = weakPatterns.some(pattern => pattern.test(password))
  if (hasWeakPattern) {
    score = Math.max(0, score - 2)
    feedback.push('Avoid common patterns')
  }

  // Cap score at 4
  score = Math.min(4, score)

  return {
    score,
    feedback,
    isValid: score >= 3 && !hasWeakPattern
  }
}

// Password strength labels
export const getPasswordStrengthLabel = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'Very Weak'
    case 2:
      return 'Weak'
    case 3:
      return 'Good'
    case 4:
      return 'Strong'
    default:
      return 'Very Weak'
  }
}

// Password strength colors
export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'text-red-600'
    case 2:
      return 'text-orange-600'
    case 3:
      return 'text-yellow-600'
    case 4:
      return 'text-green-600'
    default:
      return 'text-red-600'
  }
}
