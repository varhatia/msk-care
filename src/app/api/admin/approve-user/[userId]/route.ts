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

    // Update user approval status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: session.user?.email || 'admin'
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
      }
    })

    // Format response
    let userName = ''
    let userDetails = ''

    switch (updatedUser.role) {
      case 'PATIENT':
        userName = `${updatedUser.patient?.firstName || ''} ${updatedUser.patient?.lastName || ''}`.trim()
        userDetails = 'Patient'
        break
      case 'PHYSIO':
        userName = `${updatedUser.physio?.firstName || ''} ${updatedUser.physio?.lastName || ''}`.trim()
        userDetails = `Physiotherapist - ${updatedUser.physio?.specialization || 'No specialization'}`
        break
      case 'NUTRITIONIST':
        userName = `${updatedUser.nutritionist?.firstName || ''} ${updatedUser.nutritionist?.lastName || ''}`.trim()
        userDetails = `Nutritionist - ${updatedUser.nutritionist?.specialization || 'No specialization'}`
        break
      case 'ADMIN':
        userName = updatedUser.center?.name || 'Center Admin'
        userDetails = 'Rehabilitation Center Admin'
        break
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully approved ${userName || updatedUser.email}`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          name: userName,
          details: userDetails,
          approvedAt: updatedUser.approvedAt
        }
      }
    })

  } catch (error) {
    console.error('Error approving user:', error)
    return NextResponse.json(
      { error: 'Failed to approve user' },
      { status: 500 }
    )
  }
}
