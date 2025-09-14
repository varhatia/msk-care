import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { center: true },
    })
    if (!user?.center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 })
    }

    const body = await request.json()
    const { startDate, endDate, items } = body as {
      startDate: string
      endDate: string
      items: Array<{
        id?: string
        name: string
        description?: string | null
        category: string
        difficulty: string
        duration: number
        imageUrl?: string | null
        videoUrl?: string | null
        instructions?: string | null
        sets: number
        reps: number
        orderIndex: number
      }>
    }

    // Validate target prescription exists and belongs to a patient in this center
    const target = await prisma.prescription.findUnique({
      where: { id: params.id },
      include: { patient: { include: { centers: true } }, physio: true },
    })
    if (!target) return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })

    const isInCenter = await prisma.centerPatient.findFirst({
      where: { centerId: user.center.id, patientId: target.patientId, isActive: true },
      select: { id: true },
    })
    if (!isInCenter) return NextResponse.json({ error: 'Not authorized for this patient' }, { status: 403 })

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Guardrail: cancel other prescriptions for same patient overlapping this range
    await prisma.prescription.updateMany({
      where: {
        id: { not: target.id },
        patientId: target.patientId,
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
          { startDate: { gte: start, lte: end } },
        ],
      },
      data: { status: 'CANCELLED' },
    })

    // Update prescription core fields
    const updated = await prisma.prescription.update({
      where: { id: target.id },
      data: {
        startDate: start,
        endDate: end,
        // keep same physio, patient
      },
    })

    // Replace items: simplest robust approach — delete all and recreate from payload
    await prisma.prescriptionExercise.deleteMany({ where: { prescriptionId: target.id } })

    if (Array.isArray(items)) {
      await prisma.prescriptionExercise.createMany({
        data: items.map((it) => ({
          prescriptionId: target.id,
          name: it.name,
          description: it.description ?? null,
          category: it.category,
          difficulty: it.difficulty as any,
          duration: it.duration,
          imageUrl: it.imageUrl ?? null,
          videoUrl: it.videoUrl ?? null,
          instructions: it.instructions ?? null,
          sets: it.sets,
          reps: it.reps,
          orderIndex: it.orderIndex ?? 0,
        })),
      })
    }

    return NextResponse.json({ success: true, id: updated.id })
  } catch (error) {
    console.error('Update prescription error', error)
    return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 })
  }
}


