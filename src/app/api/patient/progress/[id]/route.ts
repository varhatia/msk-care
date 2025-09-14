import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for progress entry update
const progressEntryUpdateSchema = z.object({
  painScore: z.number().min(1).max(10).optional(),
  moodScore: z.number().min(1).max(10).optional(),
  mobilityScore: z.number().min(1).max(10).optional(),
  medicationAdherence: z.boolean().optional(),
  exerciseAdherence: z.boolean().optional(),
  notes: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any)?.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patientId = (session.user as any)?.patientId
    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID not found' }, { status: 400 })
    }

    const progressEntryId = params.id
    const body = await request.json()
    
    // Validate input data
    const validatedData = progressEntryUpdateSchema.parse(body)
    
    // Check if progress entry exists and belongs to the patient
    const existingEntry = await prisma.progressEntry.findFirst({
      where: {
        id: progressEntryId,
        patientId,
      },
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Progress entry not found' },
        { status: 404 }
      )
    }

    // Update progress entry
    const updatedEntry = await prisma.progressEntry.update({
      where: { id: progressEntryId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Progress entry updated successfully',
      progressEntry: updatedEntry,
    })
    
  } catch (error) {
    console.error('Error updating progress entry:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any)?.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patientId = (session.user as any)?.patientId
    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID not found' }, { status: 400 })
    }

    const progressEntryId = params.id
    
    // Check if progress entry exists and belongs to the patient
    const existingEntry = await prisma.progressEntry.findFirst({
      where: {
        id: progressEntryId,
        patientId,
      },
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Progress entry not found' },
        { status: 404 }
      )
    }

    // Delete progress entry
    await prisma.progressEntry.delete({
      where: { id: progressEntryId },
    })

    return NextResponse.json({
      success: true,
      message: 'Progress entry deleted successfully',
    })
    
  } catch (error) {
    console.error('Error deleting progress entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
