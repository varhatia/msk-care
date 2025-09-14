import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createAppointmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  type: z.enum(['FOLLOW_UP', 'CONSULTATION', 'ASSESSMENT', 'EMERGENCY']),
  patientId: z.string().min(1, 'Patient ID is required'),
  physioId: z.string().min(1, 'Physio ID is required'),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // First, let's check if there are any appointments at all for this center
    console.log('🔍 Fetching appointments for center:', user.center.id);
    
    const allAppointments = await prisma.appointment.findMany({
      where: {
        centerId: user.center.id,
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
      orderBy: [
        { startTime: 'asc' },
      ],
    });

    console.log('✅ Found appointments:', allAppointments.length);
    console.log('🔍 All appointments:', allAppointments.map(a => ({ id: a.id, title: a.title, patient: a.patient.firstName })));

    // Now let's check the center-patient relationships
    const centerPatients = await prisma.centerPatient.findMany({
      where: {
        centerId: user.center.id,
        isActive: true,
      },
    });

    console.log('🔍 Center-patient relationships:', centerPatients.length);
    console.log('🔍 Center patients:', centerPatients.map(cp => cp.patientId));

    // Filter appointments to only include those with proper center-patient relationships
    const appointments = allAppointments.filter(appointment => 
      centerPatients.some(cp => cp.patientId === appointment.patientId)
    );

    console.log('✅ Filtered appointments:', appointments.length);

    // For each appointment, get the last appointment for the patient
    const appointmentsWithLastAppointment = await Promise.all(
      appointments.map(async (appointment) => {
        const lastAppointment = await prisma.appointment.findFirst({
          where: {
            patientId: appointment.patientId,
            id: { not: appointment.id },
            startTime: { lt: appointment.startTime },
          },
          orderBy: {
            startTime: 'desc',
          },
          select: {
            id: true,
            startTime: true,
            notes: true,
          },
        });

        return {
          ...appointment,
          lastAppointment,
        };
      })
    );

    return NextResponse.json({ appointments: appointmentsWithLastAppointment });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createAppointmentSchema.parse(body);

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

    // Validate that the patient is linked to this center
    const centerPatient = await prisma.centerPatient.findFirst({
      where: {
        patientId: validatedData.patientId,
        centerId: user.center.id,
        isActive: true,
      },
    });

    if (!centerPatient) {
      return NextResponse.json({ error: 'Patient not found or not linked to this center' }, { status: 404 });
    }

    // Validate that the physio is linked to this center
    const centerPhysio = await prisma.centerPhysio.findFirst({
      where: {
        physioId: validatedData.physioId,
        centerId: user.center.id,
        isActive: true,
      },
    });

    if (!centerPhysio) {
      return NextResponse.json({ error: 'Physio not found or not linked to this center' }, { status: 404 });
    }

    // Check for time conflicts
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        OR: [
          {
            physioId: validatedData.physioId,
            startTime: { lt: new Date(validatedData.endTime) },
            endTime: { gt: new Date(validatedData.startTime) },
          },
          {
            patientId: validatedData.patientId,
            startTime: { lt: new Date(validatedData.endTime) },
            endTime: { gt: new Date(validatedData.startTime) },
          },
        ],
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json({ error: 'Time slot conflicts with existing appointment' }, { status: 400 });
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
        type: validatedData.type,
        notes: validatedData.notes,
        centerId: user.center.id,
        patientId: validatedData.patientId,
        physioId: validatedData.physioId,
      },
    });

    return NextResponse.json({ 
      message: 'Appointment scheduled successfully',
      appointment 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
