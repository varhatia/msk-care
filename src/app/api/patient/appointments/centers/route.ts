import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

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

    // Get all centers with their physios
    const centers = await prisma.center.findMany({
      where: {
        isActive: true
      },
      include: {
        physios: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
            email: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Format the response
    const formattedCenters = centers.map(center => ({
      id: center.id,
      name: center.name,
      address: center.address,
      phone: center.phone,
      email: center.email,
      physios: center.physios.map(physio => ({
        id: physio.id,
        name: `${physio.firstName} ${physio.lastName}`,
        specialization: physio.specialization,
        email: physio.email
      }))
    }))

    return NextResponse.json({
      success: true,
      data: {
        centers: formattedCenters
      }
    })

  } catch (error) {
    console.error('Error fetching centers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch centers' },
      { status: 500 }
    )
  }
}
