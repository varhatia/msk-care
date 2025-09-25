import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { passwordSchema, emailSchema } from '@/lib/passwordValidation'
// import { validateSingleEntityConstraint } from '@/lib/validations'

export const dynamic = 'force-dynamic'

// Validation schema for patient registration
const patientRegistrationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: emailSchema,
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  dateOfBirth: z.string().min(1, 'Please select your date of birth'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validatedData = patientRegistrationSchema.parse(body)
    
    // Check if phone is already registered across entities
    const [existingCenterByPhone, existingPatientByPhone, existingPhysioByPhone, existingNutritionistByPhone] = await Promise.all([
      prisma.center.findFirst({ where: { phone: validatedData.phone } }),
      prisma.patient.findFirst({ where: { phone: validatedData.phone } }),
      prisma.physio.findFirst({ where: { phone: validatedData.phone } }),
      prisma.nutritionist.findFirst({ where: { phone: validatedData.phone } })
    ])

    if (existingCenterByPhone || existingPatientByPhone || existingPhysioByPhone || existingNutritionistByPhone) {
      return NextResponse.json(
        { error: 'This phone number is already registered. Please use a different number.' },
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
    
    // Create a patient without any center or physio assignment
    // Centers can link patients later when needed for exercise plans
    

    

    
    // Create patient, user, and center relationship in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create patient
      const patient = await tx.patient.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          dateOfBirth: new Date(validatedData.dateOfBirth),
          gender: validatedData.gender,
          phone: validatedData.phone,
          email: validatedData.email,
          addressLine: validatedData.addressLine || null,
          city: validatedData.city || null,
          state: validatedData.state || null,
          country: validatedData.country || null,
          emergencyContact: validatedData.emergencyContact || null,
          emergencyPhone: validatedData.emergencyPhone || null,

          isActive: true
        }
      })
      
      // Validate single entity constraint before creating user
      // For PATIENT role, we need patientId to be set
      if (!patient.id) {
        throw new Error('Patient ID is required for PATIENT role')
      }
      
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          role: 'PATIENT',
          patientId: patient.id,
          isApproved: false,
          approvedAt: null,
          approvedBy: null
        }
      })


      
      return { patient, user }
    })
    
    // Return success response (without sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Patient registered successfully',
      patient: {
        id: result.patient.id,
        firstName: result.patient.firstName,
        lastName: result.patient.lastName,
        email: result.patient.email
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Patient registration error:', error)
    
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

