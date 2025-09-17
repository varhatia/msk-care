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

    // Calculate date 7 days ago
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Get exercise adherence from the last 7 days
    const adherenceEntries = await prisma.progressEntry.findMany({
      where: {
        patientId,
        entryDate: {
          gte: sevenDaysAgo
        }
      },
      select: {
        exerciseAdherence: true,
        entryDate: true
      },
      orderBy: {
        entryDate: 'desc'
      }
    })

    // Calculate exercise days (count of true values)
    const exerciseDays = adherenceEntries.filter(entry => entry.exerciseAdherence).length
    const totalDays = adherenceEntries.length
    const exercisePercentage = totalDays > 0 ? (exerciseDays / totalDays) * 100 : 0

    // Get the most recent adherence
    const mostRecentAdherence = adherenceEntries.length > 0 ? adherenceEntries[0].exerciseAdherence : null

    // Calculate trend (comparing first half vs second half of the week)
    let trend = 'stable'
    if (adherenceEntries.length >= 4) {
      const midPoint = Math.floor(adherenceEntries.length / 2)
      const firstHalf = adherenceEntries.slice(midPoint)
      const secondHalf = adherenceEntries.slice(0, midPoint)
      
      const firstHalfExerciseDays = firstHalf.filter(entry => entry.exerciseAdherence).length
      const secondHalfExerciseDays = secondHalf.filter(entry => entry.exerciseAdherence).length
      
      const firstHalfPercentage = firstHalf.length > 0 ? (firstHalfExerciseDays / firstHalf.length) * 100 : 0
      const secondHalfPercentage = secondHalf.length > 0 ? (secondHalfExerciseDays / secondHalf.length) * 100 : 0
      
      const difference = secondHalfPercentage - firstHalfPercentage
      if (difference > 10) { // 10% threshold for exercise adherence
        trend = 'increasing'
      } else if (difference < -10) {
        trend = 'decreasing'
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        exerciseDays,
        totalDays,
        exercisePercentage: Math.round(exercisePercentage),
        mostRecentAdherence,
        totalEntries: adherenceEntries.length,
        trend,
        entries: adherenceEntries.map(entry => ({
          exerciseAdherence: entry.exerciseAdherence,
          date: entry.entryDate.toISOString().split('T')[0]
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching exercise adherence stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercise adherence statistics' },
      { status: 500 }
    )
  }
}
