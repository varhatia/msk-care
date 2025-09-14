import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { subDays } from 'date-fns'

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

    // Get progress entries from the last 3 days
    const threeDaysAgo = subDays(new Date(), 2) // Last 3 days including today

    const progressEntries = await prisma.progressEntry.findMany({
      where: {
        patientId,
        entryDate: {
          gte: threeDaysAgo,
        },
      },
      select: {
        id: true,
        painScore: true,
        moodScore: true,
        mobilityScore: true,
        medicationAdherence: true,
        exerciseAdherence: true,
        notes: true,
        entryDate: true,
        createdAt: true
      },
      orderBy: {
        entryDate: 'desc'
      }
    })

    // Format the data for the frontend
    const formattedEntries = progressEntries.map(entry => ({
      id: entry.id,
      date: entry.entryDate.toISOString().split('T')[0],
      displayDate: entry.entryDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      painScore: entry.painScore,
      moodScore: entry.moodScore,
      mobilityScore: entry.mobilityScore,
      medicationAdherence: entry.medicationAdherence,
      exerciseAdherence: entry.exerciseAdherence,
      notes: entry.notes,
      createdAt: entry.createdAt
    }))

    return NextResponse.json({
      success: true,
      data: {
        entries: formattedEntries,
        totalEntries: formattedEntries.length,
        dateRange: {
          from: threeDaysAgo.toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        }
      }
    })

  } catch (error) {
    console.error('Error fetching recent progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent progress' },
      { status: 500 }
    )
  }
}
