import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateAppointmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  type: z.enum(['FOLLOW_UP', 'CONSULTATION', 'ASSESSMENT', 'EMERGENCY']),
  patientId: z.string().min(1, 'Patient ID is required'),
  physioId: z.string().min(1, 'Physio ID is required'),
  notes: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateAppointmentSchema.parse(body);

    // Get the user and their center
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        center: true,
      },
    });

    if (!user?.center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    // Check if appointment exists and belongs to this center
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: params.appointmentId,
        centerId: user.center.id,
      },
      include: {
        patient: true,
        physio: true,
      },
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Validate that the new patient and physio are linked to this center
    const patientLink = await prisma.centerPatient.findFirst({
      where: {
        centerId: user.center.id,
        patientId: validatedData.patientId,
        isActive: true,
      },
    });

    if (!patientLink) {
      return NextResponse.json({ error: 'Selected patient is not linked to this center' }, { status: 400 });
    }

    const physioLink = await prisma.centerPhysio.findFirst({
      where: {
        centerId: user.center.id,
        physioId: validatedData.physioId,
        isActive: true,
      },
    });

    if (!physioLink) {
      return NextResponse.json({ error: 'Selected physio is not linked to this center' }, { status: 400 });
    }

    // Check for time conflicts (excluding the current appointment)
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        OR: [
          {
            patientId: validatedData.patientId,
            startTime: {
              lt: validatedData.endTime,
            },
            endTime: {
              gt: validatedData.startTime,
            },
          },
          {
            physioId: validatedData.physioId,
            startTime: {
              lt: validatedData.endTime,
            },
            endTime: {
              gt: validatedData.startTime,
            },
          },
        ],
        id: {
          not: params.appointmentId,
        },
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json({ 
        error: 'Time conflict detected. The selected patient or physio has another appointment at this time.' 
      }, { status: 400 });
    }

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: {
        id: params.appointmentId,
      },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
        type: validatedData.type,
        patientId: validatedData.patientId,
        physioId: validatedData.physioId,
        centerId: user.center.id,
        notes: validatedData.notes,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            currentCondition: true,
          },
        },
        physio: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      message: 'Appointment updated successfully',
      appointment: updatedAppointment 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
