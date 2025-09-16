import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get the user and their center
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        center: true,
      },
    })

    if (!user?.center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 })
    }

    // Build where clause for patients not linked to this center
    const where: any = {
      isActive: true,
      // Exclude patients already linked to this center
      centers: {
        none: {
          centerId: user.center.id,
          isActive: true,
        },
      },
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const patients = await prisma.patient.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        currentCondition: true,
        rehabGoals: true,
        createdAt: true,
        physio: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
        // Get count of centers they're linked to
        _count: {
          select: {
            centers: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
      take: limit,
    })

    // Format the response
    const formattedPatients = patients.map(patient => ({
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      currentCondition: patient.currentCondition,
      rehabGoals: patient.rehabGoals,
      createdAt: patient.createdAt,
      hasAssignedPhysio: !!patient.physio,
      assignedPhysio: patient.physio ? {
        id: patient.physio.id,
        name: `${patient.physio.firstName} ${patient.physio.lastName}`,
        specialization: patient.physio.specialization,
      } : null,
      linkedCenterCount: patient._count.centers,
    }))

    return NextResponse.json({
      success: true,
      data: {
        patients: formattedPatients,
        total: formattedPatients.length,
      },
    })

  } catch (error) {
    console.error('Error fetching available patients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
