import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { patientId } = params;

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

    // Check if patient is linked to this center
    const centerPatient = await prisma.centerPatient.findFirst({
      where: {
        patientId: patientId,
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
          },
        },
      },
    });

    if (!centerPatient) {
      return NextResponse.json({ error: 'Patient not found or not linked to this center' }, { status: 404 });
    }

    return NextResponse.json({ patient: centerPatient.patient });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
