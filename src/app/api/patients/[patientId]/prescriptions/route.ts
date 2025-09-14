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
    });

    if (!centerPatient) {
      return NextResponse.json({ error: 'Patient not found or not linked to this center' }, { status: 404 });
    }

    // Fetch prescriptions for this patient
    const prescriptions = await prisma.prescription.findMany({
      where: {
        patientId: patientId,
      },
      include: {
        physio: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
