import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

function monthsBetween(start: Date, end: Date): number {
  const msInMonth = 1000 * 60 * 60 * 24 * 30;
  const diff = end.getTime() - start.getTime();
  const months = Math.max(1, Math.round(diff / msInMonth));
  return months;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { center: true }
    })

    if (!user?.center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 })
    }

    const centerId = user.center.id
    const now = new Date()
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const monthsWindow = monthsBetween(threeMonthsAgo, now)

    // Active physios linked to this center
    const centerPhysios = await prisma.centerPhysio.findMany({
      where: { centerId, isActive: true },
      include: { physio: true }
    })

    const summaries = [] as Array<{
      physioId: string
      physioName: string
      avgPatientsPerMonth: number
      avgAppointmentsPerMonth: number
      avgAppointmentDurationMin: number
      avgRating: number | null
    }>

    for (const cp of centerPhysios) {
      const physioId = cp.physio.id

      // Distinct patients with prescriptions overlapping window
      const prescriptions = await prisma.prescription.findMany({
        where: {
          physioId,
          OR: [
            { startDate: { lte: now }, endDate: { gte: threeMonthsAgo } },
            { startDate: { gte: threeMonthsAgo, lte: now } }
          ]
        },
        select: { patientId: true }
      })
      const distinctPatientIds = new Set(prescriptions.map(p => p.patientId))
      const avgPatientsPerMonth = distinctPatientIds.size / monthsWindow

      // Appointments in window
      const appointments = await prisma.appointment.findMany({
        where: {
          centerId,
          physioId,
          startTime: { gte: threeMonthsAgo, lte: now }
        },
        select: { startTime: true, endTime: true }
      })
      const avgAppointmentsPerMonth = appointments.length / monthsWindow
      const durations = appointments
        .map(a => (a.endTime.getTime() - a.startTime.getTime()) / (1000 * 60))
        .filter(d => d > 0)
      const avgAppointmentDurationMin = durations.length
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0

      // Average rating - not tracked in schema yet
      const avgRating = null

      summaries.push({
        physioId,
        physioName: `${cp.physio.firstName} ${cp.physio.lastName}`,
        avgPatientsPerMonth,
        avgAppointmentsPerMonth,
        avgAppointmentDurationMin,
        avgRating
      })
    }

    return NextResponse.json({
      rangeStart: threeMonthsAgo,
      rangeEnd: now,
      months: monthsWindow,
      summaries
    })
  } catch (error) {
    console.error('Reports GET error', error)
    return NextResponse.json({ error: 'Failed to build reports' }, { status: 500 })
  }
}


