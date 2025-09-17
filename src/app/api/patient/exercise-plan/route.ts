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

    // Get the patient's active prescription with exercises
    const prescription = await prisma.prescription.findFirst({
      where: {
        patientId,
        status: 'ACTIVE',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      include: {
        items: {
          orderBy: {
            orderIndex: 'asc'
          }
        },
        physio: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!prescription) {
      return NextResponse.json({
        success: true,
        data: {
          prescription: null,
          exercises: [],
          physioName: null
        }
      })
    }

    // Format the exercises for the frontend
    const exercises = prescription.items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      difficulty: item.difficulty,
      duration: item.duration,
      sets: item.sets,
      reps: item.reps,
      imageUrl: item.imageUrl,
      videoUrl: item.videoUrl,
      instructions: item.instructions,
      notes: item.notes,
      orderIndex: item.orderIndex
    }))

    const physioName = prescription.physio ? 
      `${prescription.physio.firstName} ${prescription.physio.lastName}` : 
      'Unknown Physio'

    return NextResponse.json({
      success: true,
      data: {
        prescription: {
          id: prescription.id,
          startDate: prescription.startDate,
          endDate: prescription.endDate,
          status: prescription.status,
          notes: prescription.notes
        },
        exercises,
        physioName
      }
    })

  } catch (error) {
    console.error('Error fetching exercise plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercise plan' },
      { status: 500 }
    )
  }
}
