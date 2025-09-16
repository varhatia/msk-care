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

    console.log('🔍 Fetching prescriptions for center:', user.center.id);

    const { searchParams } = new URL(request.url)
    const patientIdFilter = searchParams.get('patientId')
    const latestOnly = searchParams.get('latest') === '1'
    
    // Get all prescriptions for patients linked to this center
    // First get the center's patients
    const centerPatients = await prisma.centerPatient.findMany({
      where: {
        centerId: user.center.id,
        isActive: true,
      },
      select: {
        patientId: true,
      },
    });

    const patientIds = centerPatients.map(cp => cp.patientId);

    // Then get prescriptions for these patients
    const whereClause: any = {
      patientId: { in: patientIds },
    }
    if (patientIdFilter) {
      whereClause.patientId = patientIdFilter
    }

    const prescriptions = await prisma.prescription.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        physio: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: latestOnly ? 1 : undefined,
    });

    console.log('✅ Found prescriptions:', prescriptions.length);
    console.log('📋 Prescriptions:', prescriptions.map(p => ({ id: p.id, patient: p.patient.firstName })));

    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
