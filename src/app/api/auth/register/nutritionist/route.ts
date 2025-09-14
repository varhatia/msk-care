import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
// import { validateSingleEntityConstraint } from '@/lib/validations'

// Validation schema for nutritionist registration
const nutritionistRegistrationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  license: z.string().min(5, 'License number must be at least 5 characters'),
  specialization: z.string().optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validatedData = nutritionistRegistrationSchema.parse(body)
    
    // Check if nutritionist already exists by email
    const existingNutritionistByEmail = await prisma.nutritionist.findFirst({
      where: {
        email: validatedData.email
      }
    })
    
    if (existingNutritionistByEmail) {
      return NextResponse.json(
        { error: 'A nutritionist with this email address is already registered' },
        { status: 400 }
      )
    }
    
    // Check if nutritionist already exists by license
    const existingNutritionistByLicense = await prisma.nutritionist.findFirst({
      where: {
        license: validatedData.license
      }
    })
    
    if (existingNutritionistByLicense) {
      return NextResponse.json(
        { error: 'A nutritionist with this license number is already registered' },
        { status: 400 }
      )
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: validatedData.email
      }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email address is already registered' },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    // Create nutritionist and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create nutritionist
      const nutritionist = await tx.nutritionist.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          license: validatedData.license,
          specialization: validatedData.specialization || null,
          phone: validatedData.phone,
          email: validatedData.email,
          isActive: true
        }
      })
      
      // Validate single entity constraint before creating user
      // For NUTRITIONIST role, we need nutritionistId to be set
      if (!nutritionist.id) {
        throw new Error('Nutritionist ID is required for NUTRITIONIST role')
      }
      
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          role: 'NUTRITIONIST',
          nutritionistId: nutritionist.id,
          isApproved: false,
          approvedAt: null,
          approvedBy: null
        }
      })
      
      return { nutritionist, user }
    })
    
    // Return success response (without sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Nutritionist registered successfully',
      nutritionist: {
        id: result.nutritionist.id,
        firstName: result.nutritionist.firstName,
        lastName: result.nutritionist.lastName,
        email: result.nutritionist.email,
        license: result.nutritionist.license
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Nutritionist registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
