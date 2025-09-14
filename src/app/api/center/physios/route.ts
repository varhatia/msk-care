import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const addPhysioSchema = z.object({
  physioId: z.string().min(1, 'Physio ID is required'),
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

    console.log('✅ Authentication passed, fetching physios...'); 

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

    // Handle detail=patients for a specific physio
    const { searchParams } = new URL(request.url)
    const detail = searchParams.get('detail')
    const physioIdParam = searchParams.get('physioId')

    if (detail === 'patients' && physioIdParam) {
      // Ensure physio is linked to center
      const rel = await prisma.centerPhysio.findFirst({
        where: { centerId: user.center.id, physioId: physioIdParam, isActive: true },
      })
      if (!rel) {
        return NextResponse.json({ error: 'Physio not linked to this center' }, { status: 404 })
      }

      // Patients of this physio that are also linked to the center
      const physioPatientIdsData = await prisma.prescription.findMany({
        where: { physioId: physioIdParam },
        select: { patientId: true },
      })
      const physioPatientIds = Array.from(new Set(physioPatientIdsData.map(p => p.patientId)))

      const centerPatientIdsData = await prisma.centerPatient.findMany({
        where: { centerId: user.center.id, isActive: true, patientId: { in: physioPatientIds } },
        select: { patientId: true },
      })
      const targetPatientIds = centerPatientIdsData.map(p => p.patientId)

      // Fetch basic patient info
      const patientsBasic = await prisma.patient.findMany({
        where: { id: { in: targetPatientIds } },
        select: { id: true, firstName: true, lastName: true },
      })

      // For each patient compute start/current from ProgressReport and last feedback from appointments
      const patients = await Promise.all(patientsBasic.map(async (p) => {
        const earliest = await prisma.progressReport.findFirst({
          where: { patientId: p.id, physioId: physioIdParam },
          orderBy: { reportedAt: 'asc' },
          select: { painScore: true, mobilityScore: true },
        })
        const latest = await prisma.progressReport.findFirst({
          where: { patientId: p.id, physioId: physioIdParam },
          orderBy: { reportedAt: 'desc' },
          select: { painScore: true, mobilityScore: true },
        })
        const lastAppt = await prisma.appointment.findFirst({
          where: { centerId: user.center.id, physioId: physioIdParam, patientId: p.id },
          orderBy: { startTime: 'desc' },
          select: { notes: true },
        })
        return {
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          startPain: earliest?.painScore ?? null,
          startMobility: earliest?.mobilityScore ?? null,
          currentPain: latest?.painScore ?? null,
          currentMobility: latest?.mobilityScore ?? null,
          lastFeedback: lastAppt?.notes ?? null,
        }
      }))

      return NextResponse.json({ patients })
    }

    // Get all physios linked to this center through CenterPhysio
    const centerPhysios = await prisma.centerPhysio.findMany({
      where: {
        centerId: user.center.id,
        isActive: true,
      },
      include: {
        physio: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            license: true,
            specialization: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        addedAt: 'desc',
      },
    });

    // Get statistics for each physio
    const physiosWithStats = await Promise.all(
      centerPhysios.map(async (cp) => {
        // Get current patients (unique patients with active prescriptions ending in the future)
        const currentPatientsData = await prisma.prescription.findMany({
          where: {
            physioId: cp.physio.id,
            status: 'ACTIVE',
            endDate: {
              gte: new Date(), // Plans ending in the future
            },
          },
          select: {
            patientId: true,
          },
        });
        const currentPatients = new Set(currentPatientsData.map(p => p.patientId)).size;

        // Get active plans (prescriptions ending in the future)
        const activePlans = await prisma.prescription.count({
          where: {
            physioId: cp.physio.id,
            status: 'ACTIVE',
            endDate: {
              gte: new Date(), // Plans ending in the future
            },
          },
        });

        // Get total patients served (all unique patients this physio has ever treated)
        const totalPatientsData = await prisma.prescription.findMany({
          where: {
            physioId: cp.physio.id,
          },
          select: {
            patientId: true,
          },
        });
        const totalPatientsServed = new Set(totalPatientsData.map(p => p.patientId)).size;

        return {
          ...cp.physio,
          centerPhysioId: cp.id,
          addedAt: cp.addedAt,
          notes: cp.notes,
          stats: {
            currentPatients,
            activePlans,
            totalPatientsServed,
          },
        };
      })
    );

    return NextResponse.json({ physios: physiosWithStats });
  } catch (error) {
    console.error('Error fetching physios:', error);
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
    const validatedData = addPhysioSchema.parse(body);

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

    // Check if physio exists
    const physio = await prisma.physio.findUnique({
      where: { id: validatedData.physioId },
    });

    if (!physio) {
      return NextResponse.json({ error: 'Physio not found' }, { status: 404 });
    }

    // Check if relationship already exists
    const existingRelationship = await prisma.centerPhysio.findUnique({
      where: {
        centerId_physioId: {
          centerId: user.center.id,
          physioId: validatedData.physioId,
        },
      },
    });

    if (existingRelationship) {
      if (existingRelationship.isActive) {
        return NextResponse.json({ error: 'Physio is already linked to this center' }, { status: 400 });
      } else {
        // Reactivate the relationship
        await prisma.centerPhysio.update({
          where: { id: existingRelationship.id },
          data: { 
            isActive: true,
            notes: validatedData.notes,
          },
        });
        return NextResponse.json({ message: 'Physio relationship reactivated' });
      }
    }

    // Create new relationship
    await prisma.centerPhysio.create({
      data: {
        centerId: user.center.id,
        physioId: validatedData.physioId,
        notes: validatedData.notes,
      },
    });

    return NextResponse.json({ message: 'Physio added to center successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error adding physio to center:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
