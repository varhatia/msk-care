import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const addPatientSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Getting session...');
    const session = await getServerSession(authOptions);
    
    console.log('🔍 Session object:', JSON.stringify(session, null, 2));
    console.log('🔍 Session user:', session?.user);
    console.log('🔍 Session user email:', session?.user?.email);
    
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json({ 
        error: 'No session found',
        debug: 'Session is null or undefined'
      }, { status: 401 });
    }
    
    if (!session.user) {
      console.log('❌ No user in session');
      return NextResponse.json({ 
        error: 'No user in session',
        debug: 'Session exists but user is null or undefined'
      }, { status: 401 });
    }
    
    if (!session.user.email) {
      console.log('❌ No email in session user');
      return NextResponse.json({ 
        error: 'No email in session user',
        debug: 'User exists but email is missing'
      }, { status: 401 });
    }

    console.log('✅ Authentication passed, fetching patients...'); 
    // const session = await getServerSession(authOptions);
    
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

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

    // Get all patients linked to this center through CenterPatient
    const centerPatients = await prisma.centerPatient.findMany({
      where: {
        centerId: user.center.id,
        isActive: true,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            currentCondition: true,
            rehabGoals: true,
            isActive: true,
            createdAt: true,
            prescriptions: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              include: {
                physio: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        addedAt: 'desc',
      },
    });

    const patients = centerPatients.map(cp => ({
      ...cp.patient,
      centerPatientId: cp.id,
      addedAt: cp.addedAt,
      notes: cp.notes,
      latestPrescription: cp.patient.prescriptions[0] || null,
    }));

    return NextResponse.json({ patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
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
    const validatedData = addPatientSchema.parse(body);

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

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Check if relationship already exists
    const existingRelationship = await prisma.centerPatient.findUnique({
      where: {
        centerId_patientId: {
          centerId: user.center.id,
          patientId: validatedData.patientId,
        },
      },
    });

    if (existingRelationship) {
      if (existingRelationship.isActive) {
        return NextResponse.json({ error: 'Patient is already linked to this center' }, { status: 400 });
      } else {
        // Reactivate the relationship
        await prisma.centerPatient.update({
          where: { id: existingRelationship.id },
          data: { 
            isActive: true,
            notes: validatedData.notes,
          },
        });
        return NextResponse.json({ message: 'Patient relationship reactivated' });
      }
    }

    // Create new relationship
    await prisma.centerPatient.create({
      data: {
        centerId: user.center.id,
        patientId: validatedData.patientId,
        notes: validatedData.notes,
      },
    });

    return NextResponse.json({ message: 'Patient added to center successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error adding patient to center:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
