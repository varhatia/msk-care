import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
// import { validateSingleEntityConstraint } from '@/lib/validations'

// Validation schema for center registration
const centerRegistrationSchema = z.object({
  name: z.string().min(2, 'Center name must be at least 2 characters'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  email: z.string().email('Invalid email address'),
  license: z.string().min(5, 'License number must be at least 5 characters'),
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
    const validatedData = centerRegistrationSchema.parse(body)
    
    // Check if center already exists by email
    const existingCenterByEmail = await prisma.center.findFirst({
      where: {
        email: validatedData.email
      }
    })
    
    if (existingCenterByEmail) {
      return NextResponse.json(
        { error: 'A center with this email address is already registered' },
        { status: 400 }
      )
    }
    
    // Check if center already exists by license number
    const existingCenterByLicense = await prisma.center.findFirst({
      where: {
        license: validatedData.license
      }
    })
    
    if (existingCenterByLicense) {
      return NextResponse.json(
        { error: 'A center with this license number is already registered' },
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
    
    // Create center and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create center
      const center = await tx.center.create({
        data: {
          name: validatedData.name,
          address: validatedData.address,
          phone: validatedData.phone,
          email: validatedData.email,
          license: validatedData.license,
          isActive: true
        }
      })
      
      // Validate single entity constraint before creating user
      // For ADMIN role, we need centerId to be set and others to be null
      if (!center.id) {
        throw new Error('Center ID is required for ADMIN role')
      }
      
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          role: 'ADMIN',
          centerId: center.id,
          isApproved: false,
          approvedAt: null,
          approvedBy: null
        }
      })
      
      return { center, user }
    })
    
    // Return success response (without sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Center registered successfully',
      center: {
        id: result.center.id,
        name: result.center.name,
        email: result.center.email,
        license: result.center.license
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Center registration error:', error)
    
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

