import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { passwordSchema, emailSchema } from '@/lib/passwordValidation'
// import { validateSingleEntityConstraint } from '@/lib/validations'

export const dynamic = 'force-dynamic'

// Validation schema for physio registration
const physioRegistrationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  license: z.string().min(5, 'License number must be at least 5 characters'),
  specialization: z.string().optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  email: emailSchema,
  centerId: z.string().optional(),
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
    const validatedData = physioRegistrationSchema.parse(body)
    
    // Check if center exists (only if centerId is provided)
    if (validatedData.centerId) {
      const center = await prisma.center.findUnique({
        where: { id: validatedData.centerId }
      })
      
      if (!center) {
        return NextResponse.json(
          { error: 'Center not found' },
          { status: 404 }
        )
      }
    }
    
    // Check if physio already exists by email
    const existingPhysioByEmail = await prisma.physio.findFirst({
      where: {
        email: validatedData.email
      }
    })
    
    if (existingPhysioByEmail) {
      return NextResponse.json(
        { error: 'A physio with this email address is already registered' },
        { status: 400 }
      )
    }
    
    // Check if physio already exists by license
    const existingPhysioByLicense = await prisma.physio.findFirst({
      where: {
        license: validatedData.license
      }
    })
    
    if (existingPhysioByLicense) {
      return NextResponse.json(
        { error: 'A physio with this license number is already registered' },
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
    
    // Create physio and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create physio
      const physioData: any = {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        license: validatedData.license,
        specialization: validatedData.specialization || null,
        phone: validatedData.phone,
        email: validatedData.email,
        isActive: true
      }
      
      if (validatedData.centerId) {
        physioData.centerId = validatedData.centerId
      }
      
      const physio = await tx.physio.create({
        data: physioData
      })
      
      // Validate single entity constraint before creating user
      // For PHYSIO role, we need physioId to be set
      if (!physio.id) {
        throw new Error('Physio ID is required for PHYSIO role')
      }
      
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          role: 'PHYSIO',
          physioId: physio.id,
          isApproved: false,
          approvedAt: null,
          approvedBy: null
        }
      })
      
      return { physio, user }
    })
    
    // Return success response (without sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Physio registered successfully',
      physio: {
        id: result.physio.id,
        firstName: result.physio.firstName,
        lastName: result.physio.lastName,
        email: result.physio.email,
        license: result.physio.license,
        centerId: result.physio.centerId
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Physio registration error:', error)
    
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
