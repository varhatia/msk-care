import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createAppointmentSchema = z.object({
  physioId: z.string().min(1, 'Physio ID is required'),
  centerId: z.string().min(1, 'Center ID is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  type: z.enum(['CONSULTATION', 'FOLLOW_UP', 'ASSESSMENT', 'TREATMENT']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any)?.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patientId = (session.user as any)?.patientId
    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID not found' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = createAppointmentSchema.parse(body)

    // Check if the time slot is still available
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        physioId: validatedData.physioId,
        startTime: {
          lte: new Date(validatedData.endTime)
        },
        endTime: {
          gte: new Date(validatedData.startTime)
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    })

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      )
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
        type: validatedData.type,
        status: 'SCHEDULED',
        notes: validatedData.notes,
        patientId,
        physioId: validatedData.physioId,
        centerId: validatedData.centerId
      },
      include: {
        physio: {
          select: {
            firstName: true,
            lastName: true,
            specialization: true
          }
        },
        center: {
          select: {
            name: true,
            address: true,
            phone: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        appointment: {
          id: appointment.id,
          title: appointment.title,
          description: appointment.description,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          type: appointment.type,
          status: appointment.status,
          notes: appointment.notes,
          physio: {
            name: `${appointment.physio.firstName} ${appointment.physio.lastName}`,
            specialization: appointment.physio.specialization
          },
          center: {
            name: appointment.center.name,
            address: appointment.center.address,
            phone: appointment.center.phone
          }
        }
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}

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

    // Get patient's appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId
      },
      include: {
        physio: {
          select: {
            firstName: true,
            lastName: true,
            specialization: true
          }
        },
        center: {
          select: {
            name: true,
            address: true,
            phone: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    // Format the response
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.title,
      description: appointment.description,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      type: appointment.type,
      status: appointment.status,
      meetingUrl: appointment.meetingUrl,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      physio: {
        name: `${appointment.physio.firstName} ${appointment.physio.lastName}`,
        specialization: appointment.physio.specialization
      },
      center: {
        name: appointment.center.name,
        address: appointment.center.address,
        phone: appointment.center.phone
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        appointments: formattedAppointments
      }
    })

  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}
