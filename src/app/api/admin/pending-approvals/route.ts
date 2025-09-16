import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any)?.role !== 'ADMIN' || !(session.user as any)?.isMSKAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all pending users with their related data
    const pendingUsers = await prisma.user.findMany({
      where: {
        isApproved: false
      },
      include: {
        center: {
          select: {
            name: true
          }
        },
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        physio: {
          select: {
            firstName: true,
            lastName: true,
            specialization: true
          }
        },
        nutritionist: {
          select: {
            firstName: true,
            lastName: true,
            specialization: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Format the response
    const formattedUsers = pendingUsers.map(user => {
      let firstName = ''
      let lastName = ''
      let specialization = ''
      let centerName = user.center?.name

      switch (user.role) {
        case 'PATIENT':
          firstName = user.patient?.firstName || ''
          lastName = user.patient?.lastName || ''
          break
        case 'PHYSIO':
          firstName = user.physio?.firstName || ''
          lastName = user.physio?.lastName || ''
          specialization = user.physio?.specialization || ''
          break
        case 'NUTRITIONIST':
          firstName = user.nutritionist?.firstName || ''
          lastName = user.nutritionist?.lastName || ''
          specialization = user.nutritionist?.specialization || ''
          break
        case 'ADMIN':
          // For center admins, we might need to get center name differently
          break
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName,
        lastName,
        centerName,
        specialization,
        createdAt: user.createdAt
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedUsers
    })

  } catch (error) {
    console.error('Error fetching pending approvals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending approvals' },
      { status: 500 }
    )
  }
}
