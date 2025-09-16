import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any)?.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patientId = (session.user as any)?.patientId
    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID not found' }, { status: 400 })
    }

    // Get patient with linked physio and centers
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        physio: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
            email: true,
            center: {
              select: {
                id: true,
                name: true,
                address: true,
                phone: true,
                email: true
              }
            }
          }
        },
        centers: {
          include: {
            center: {
              select: {
                id: true,
                name: true,
                address: true,
                phone: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Format the response
    const linkedInfo = {
      hasLinkedPhysio: !!patient.physio,
      physio: patient.physio ? {
        id: patient.physio.id,
        name: `${patient.physio.firstName} ${patient.physio.lastName}`,
        specialization: patient.physio.specialization,
        email: patient.physio.email,
        center: patient.physio.center
      } : null,
      linkedCenters: patient.centers.map(link => link.center),
      canSelectCenter: !patient.physio && patient.centers.length === 0
    }

    return NextResponse.json({
      success: true,
      data: linkedInfo
    })

  } catch (error) {
    console.error('Error fetching linked info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch linked information' },
      { status: 500 }
    )
  }
}
