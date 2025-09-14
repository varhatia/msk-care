import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any)?.role !== 'ADMIN' || !(session.user as any)?.isMSKAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params

    // Get user details before deletion for response
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
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
      }
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete the user and all related data
    await prisma.user.delete({
      where: { id: userId }
    })

    // Format response
    let userName = ''
    let userDetails = ''

    switch (userToDelete.role) {
      case 'PATIENT':
        userName = `${userToDelete.patient?.firstName || ''} ${userToDelete.patient?.lastName || ''}`.trim()
        userDetails = 'Patient'
        break
      case 'PHYSIO':
        userName = `${userToDelete.physio?.firstName || ''} ${userToDelete.physio?.lastName || ''}`.trim()
        userDetails = `Physiotherapist - ${userToDelete.physio?.specialization || 'No specialization'}`
        break
      case 'NUTRITIONIST':
        userName = `${userToDelete.nutritionist?.firstName || ''} ${userToDelete.nutritionist?.lastName || ''}`.trim()
        userDetails = `Nutritionist - ${userToDelete.nutritionist?.specialization || 'No specialization'}`
        break
      case 'ADMIN':
        userName = userToDelete.center?.name || 'Center Admin'
        userDetails = 'Rehabilitation Center Admin'
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully rejected and removed ${userName || userToDelete.email}`,
        user: {
          id: userToDelete.id,
          email: userToDelete.email,
          role: userToDelete.role,
          name: userName,
          details: userDetails
        }
      }
    })

  } catch (error) {
    console.error('Error rejecting user:', error)
    return NextResponse.json(
      { error: 'Failed to reject user' },
      { status: 500 }
    )
  }
}
