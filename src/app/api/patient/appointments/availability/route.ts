import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addDays, startOfDay, endOfDay, isWeekend, format, addHours, isAfter, isBefore } from 'date-fns'

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

    const { searchParams } = new URL(request.url)
    const physioId = searchParams.get('physioId')
    const date = searchParams.get('date')

    if (!physioId || !date) {
      return NextResponse.json({ error: 'Physio ID and date are required' }, { status: 400 })
    }

    const selectedDate = new Date(date)
    const startOfSelectedDate = startOfDay(selectedDate)
    const endOfSelectedDate = endOfDay(selectedDate)

    // Get physio working hours based on day of week
    const isWeekendDay = isWeekend(selectedDate)
    const workingHours = {
      start: isWeekendDay ? 10 : 10, // 10 AM
      end: isWeekendDay ? 17 : 20    // 5 PM on weekends, 8 PM on weekdays
    }

    // Get existing appointments for the physio on the selected date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        physioId,
        startTime: {
          gte: startOfSelectedDate,
          lte: endOfSelectedDate
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    })

    // Generate available time slots
    const availableSlots = []
    const slotDuration = 30 // 30 minutes per slot

    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotStart = addHours(startOfSelectedDate, hour)
        const slotStartWithMinutes = addHours(slotStart, minute / 60)
        const slotEnd = addHours(slotStartWithMinutes, slotDuration / 60)

        // Skip if slot is in the past
        if (isBefore(slotEnd, new Date())) {
          continue
        }

        // Check if slot conflicts with existing appointments
        const hasConflict = existingAppointments.some(appointment => {
          const appointmentStart = new Date(appointment.startTime)
          const appointmentEnd = new Date(appointment.endTime)
          
          return (
            (isAfter(slotStartWithMinutes, appointmentStart) && isBefore(slotStartWithMinutes, appointmentEnd)) ||
            (isAfter(slotEnd, appointmentStart) && isBefore(slotEnd, appointmentEnd)) ||
            (isBefore(slotStartWithMinutes, appointmentStart) && isAfter(slotEnd, appointmentEnd))
          )
        })

        if (!hasConflict) {
          availableSlots.push({
            startTime: slotStartWithMinutes.toISOString(),
            endTime: slotEnd.toISOString(),
            displayTime: format(slotStartWithMinutes, 'h:mm a'),
            date: format(selectedDate, 'yyyy-MM-dd')
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        date: format(selectedDate, 'yyyy-MM-dd'),
        physioId,
        availableSlots,
        workingHours: {
          start: `${workingHours.start}:00`,
          end: `${workingHours.end}:00`
        }
      }
    })

  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}
