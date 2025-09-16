import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        patient: true,
      },
    });

    if (!user?.patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: {
        patientId: user.patient.id,
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
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            exerciseRefId: true,
            name: true,
            description: true,
            category: true,
            difficulty: true,
            duration: true,
            imageUrl: true,
            videoUrl: true,
            instructions: true,
            sets: true,
            reps: true,
            notes: true,
            orderIndex: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
