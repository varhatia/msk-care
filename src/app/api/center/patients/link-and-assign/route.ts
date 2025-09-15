import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Schema for linking patient and assigning physio
const linkAndAssignSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  physioId: z.string().min(1, 'Physio ID is required'),
  notes: z.string().optional(),
  // Exercise plan details
  exercisePlan: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    exercises: z.array(z.object({
      exerciseId: z.string().min(1, 'Exercise ID is required'),
      sets: z.number().min(1, 'Sets must be at least 1'),
      reps: z.number().min(1, 'Reps must be at least 1'),
      notes: z.string().optional(),
      orderIndex: z.number().min(0, 'Order index must be non-negative')
    })).min(1, 'At least one exercise is required')
  })
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = linkAndAssignSchema.parse(body)

    // Get the user and their center
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        center: true,
      },
    })

    if (!user?.center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 })
    }

    const centerId = user.center.id

    // Verify that the physio belongs to this center
    const centerPhysio = await prisma.centerPhysio.findFirst({
      where: {
        centerId: centerId,
        physioId: validatedData.physioId,
        isActive: true,
      },
    })

    if (!centerPhysio) {
      return NextResponse.json({ 
        error: 'Physio not found or not linked to this center' 
      }, { status: 404 })
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Check if patient is already assigned to a physio
    if (patient.physioId && patient.physioId !== validatedData.physioId) {
      return NextResponse.json({ 
        error: 'Patient is already assigned to a different physio' 
      }, { status: 400 })
    }

    // Validate exercise IDs exist
    const exerciseIds = validatedData.exercisePlan.exercises.map(ex => ex.exerciseId)
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
      select: { id: true, name: true }
    })

    if (exercises.length !== exerciseIds.length) {
      return NextResponse.json({ 
        error: 'One or more exercises not found' 
      }, { status: 404 })
    }

    // Create all relationships and exercise plan in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Link patient to center (if not already linked)
      let centerPatient = await tx.centerPatient.findFirst({
        where: {
          patientId: validatedData.patientId,
          centerId: centerId,
          isActive: true,
        },
      })

      if (!centerPatient) {
        centerPatient = await tx.centerPatient.create({
          data: {
            centerId: centerId,
            patientId: validatedData.patientId,
            notes: validatedData.notes || 'Linked and assigned to physio',
          },
        })
      } else {
        // Update notes if relationship exists
        await tx.centerPatient.update({
          where: { id: centerPatient.id },
          data: { 
            notes: validatedData.notes || centerPatient.notes,
          },
        })
      }

      // 2. Assign physio to patient
      await tx.patient.update({
        where: { id: validatedData.patientId },
        data: { physioId: validatedData.physioId },
      })

      // 3. Create prescription (exercise plan)
      const prescription = await tx.prescription.create({
        data: {
          patientId: validatedData.patientId,
          physioId: validatedData.physioId,
          startDate: new Date(validatedData.exercisePlan.startDate),
          endDate: new Date(validatedData.exercisePlan.endDate),
          status: 'ACTIVE',
          notes: `Initial exercise plan created for ${patient.firstName} ${patient.lastName}`,
        },
      })

      // 4. Create prescription exercises
      const prescriptionExercises = await Promise.all(
        validatedData.exercisePlan.exercises.map(async (exerciseData) => {
          const exercise = exercises.find(ex => ex.id === exerciseData.exerciseId)!
          
          return tx.prescriptionExercise.create({
            data: {
              prescriptionId: prescription.id,
              exerciseRefId: exerciseData.exerciseId,
              name: exercise.name,
              description: `Exercise from ${exercise.name}`,
              category: 'General', // Default category
              difficulty: 'BEGINNER', // Default difficulty
              duration: 30, // Default duration in minutes
              sets: exerciseData.sets,
              reps: exerciseData.reps,
              notes: exerciseData.notes,
              orderIndex: exerciseData.orderIndex,
            },
          })
        })
      )

      return {
        centerPatient,
        prescription,
        prescriptionExercises,
      }
    })

    // Get updated patient info with physio details
    const updatedPatient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
      include: {
        physio: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Patient linked to center, physio assigned, and exercise plan created successfully',
      data: {
        patient: {
          id: updatedPatient!.id,
          firstName: updatedPatient!.firstName,
          lastName: updatedPatient!.lastName,
          email: updatedPatient!.email,
          physio: updatedPatient!.physio,
        },
        centerPatient: {
          id: result.centerPatient.id,
          addedAt: result.centerPatient.addedAt,
          notes: result.centerPatient.notes,
        },
        prescription: {
          id: result.prescription.id,
          startDate: result.prescription.startDate,
          endDate: result.prescription.endDate,
          status: result.prescription.status,
          exerciseCount: result.prescriptionExercises.length,
        },
      },
    })

  } catch (error) {
    console.error('Error linking patient and assigning physio:', error)
    
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
