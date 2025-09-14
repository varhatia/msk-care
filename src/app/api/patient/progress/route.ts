import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for progress entry
const progressEntrySchema = z.object({
  painScore: z.number().min(1).max(10),
  moodScore: z.number().min(1).max(10),
  mobilityScore: z.number().min(1).max(10),
  medicationAdherence: z.boolean(),
  exerciseAdherence: z.boolean(),
  notes: z.string().optional(),
  entryDate: z.string().min(1, 'Entry date is required'), // ISO date string
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any)?.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patientId = (session.user as any)?.patientId
    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID not found' }, { status: 400 })
    }

    // Get query parameters for filtering
    const url = new URL(request.url)
    const limit = url.searchParams.get('limit')
    const offset = url.searchParams.get('offset')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    // Build where clause
    const whereClause: any = { patientId }
    
    if (startDate || endDate) {
      whereClause.entryDate = {}
      if (startDate) whereClause.entryDate.gte = new Date(startDate)
      if (endDate) whereClause.entryDate.lte = new Date(endDate)
    }

    // Build query options
    const queryOptions: any = {
      where: whereClause,
      orderBy: { entryDate: 'desc' },
    }

    if (limit) {
      queryOptions.take = parseInt(limit)
    }
    if (offset) {
      queryOptions.skip = parseInt(offset)
    }

    const progressEntries = await prisma.progressEntry.findMany(queryOptions)

    return NextResponse.json({ progressEntries })
  } catch (error) {
    console.error('Error fetching progress entries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any)?.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patientId = (session.user as any)?.patientId
    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID not found' }, { status: 400 })
    }

    const body = await request.json()
    
    // Validate input data
    const validatedData = progressEntrySchema.parse(body)
    
    // Check if entry already exists for the selected date
    const selectedDate = new Date(validatedData.entryDate)
    selectedDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)

    const existingEntry = await prisma.progressEntry.findFirst({
      where: {
        patientId,
        entryDate: {
          gte: selectedDate,
          lt: nextDay,
        },
      },
    })

    if (existingEntry) {
      return NextResponse.json(
        { error: `Progress entry already exists for ${validatedData.entryDate}. Please update the existing entry instead.` },
        { status: 400 }
      )
    }

    // Create progress entry
    const progressEntry = await prisma.progressEntry.create({
      data: {
        painScore: validatedData.painScore,
        moodScore: validatedData.moodScore,
        mobilityScore: validatedData.mobilityScore,
        medicationAdherence: validatedData.medicationAdherence,
        exerciseAdherence: validatedData.exerciseAdherence,
        notes: validatedData.notes || null,
        entryDate: new Date(validatedData.entryDate),
        patientId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Progress entry created successfully',
      progressEntry,
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating progress entry:', error)
    
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
