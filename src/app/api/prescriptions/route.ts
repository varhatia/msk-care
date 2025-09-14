import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  physioId: z.string().min(1, 'Physio ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  notes: z.string().optional(),
  exercises: z.array(z.object({
    exerciseId: z.string().min(1, 'Exercise ID is required'),
    sets: z.number().min(1, 'Sets must be at least 1'),
    reps: z.number().min(1, 'Reps must be at least 1'),
    order: z.number().min(0, 'Order must be at least 0'),
  })).min(1, 'At least one exercise is required'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPrescriptionSchema.parse(body);

    // Get the user and their center info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        center: true,
      },
    });

    if (!user?.center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    // Verify that the physio belongs to this center
    const centerPhysio = await prisma.centerPhysio.findFirst({
      where: {
        centerId: user.center.id,
        physioId: validatedData.physioId,
        isActive: true,
      },
    });

    if (!centerPhysio) {
      return NextResponse.json({ error: 'Physio not found or not linked to this center' }, { status: 404 });
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Check if patient is linked to this center, if not, create the relationship
    let centerPatient = await prisma.centerPatient.findFirst({
      where: {
        patientId: validatedData.patientId,
        centerId: user.center.id,
        isActive: true,
      },
    });

    if (!centerPatient) {
      // Create the relationship automatically
      centerPatient = await prisma.centerPatient.create({
        data: {
          centerId: user.center.id,
          patientId: validatedData.patientId,
          notes: 'Auto-linked during prescription creation',
        },
      });
    }

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const newPrescription = await tx.prescription.create({
        data: {
          patientId: validatedData.patientId,
          physioId: validatedData.physioId,
          startDate: new Date(validatedData.startDate),
          endDate: new Date(validatedData.endDate),
          notes: validatedData.notes,
        },
      });

      // Fetch all referenced exercises and denormalize into items
      for (const ex of validatedData.exercises) {
        const source = await tx.exercise.findUnique({ where: { id: ex.exerciseId } });
        if (!source) {
          throw new Error(`Exercise not found: ${ex.exerciseId}`);
        }

        await tx.prescriptionExercise.create({
          data: {
            prescriptionId: newPrescription.id,
            exerciseRefId: source.id,
            name: source.name,
            description: source.description ?? null,
            category: source.category,
            difficulty: source.difficulty,
            duration: source.duration,
            imageUrl: source.imageUrl ?? null,
            videoUrl: source.videoUrl ?? null,
            instructions: source.instructions ?? null,
            sets: ex.sets,
            reps: ex.reps,
            orderIndex: ex.order,
          },
        });
      }

      return newPrescription;
    });

    return NextResponse.json({
      message: 'Prescription created successfully',
      prescriptionId: result.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating prescription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
