import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

    // Get mobility scores from the last 7 days
    const mobilityEntries = await prisma.progressEntry.findMany({
      where: {
        patientId,
        entryDate: {
          gte: sevenDaysAgo
        }
      },
      select: {
        mobilityScore: true,
        entryDate: true
      },
      orderBy: {
        entryDate: 'desc'
      }
    })

    // Calculate average mobility score
    const totalMobilityScore = mobilityEntries.reduce((sum, entry) => sum + entry.mobilityScore, 0)
    const averageMobilityScore = mobilityEntries.length > 0 ? totalMobilityScore / mobilityEntries.length : 0

    // Get the most recent mobility score
    const mostRecentMobilityScore = mobilityEntries.length > 0 ? mobilityEntries[0].mobilityScore : null

    // Calculate trend (comparing first half vs second half of the week)
    let trend = 'stable'
    if (mobilityEntries.length >= 4) {
      const midPoint = Math.floor(mobilityEntries.length / 2)
      const firstHalf = mobilityEntries.slice(midPoint)
      const secondHalf = mobilityEntries.slice(0, midPoint)
      
      const firstHalfAvg = firstHalf.reduce((sum, entry) => sum + entry.mobilityScore, 0) / firstHalf.length
      const secondHalfAvg = secondHalf.reduce((sum, entry) => sum + entry.mobilityScore, 0) / secondHalf.length
      
      const difference = secondHalfAvg - firstHalfAvg
      if (difference > 0.5) {
        trend = 'increasing'
      } else if (difference < -0.5) {
        trend = 'decreasing'
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        averageMobilityScore: Math.round(averageMobilityScore * 10) / 10, // Round to 1 decimal place
        mostRecentMobilityScore,
        totalEntries: mobilityEntries.length,
        trend,
        entries: mobilityEntries.map(entry => ({
          mobilityScore: entry.mobilityScore,
          date: entry.entryDate.toISOString().split('T')[0]
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching mobility stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mobility statistics' },
      { status: 500 }
    )
  }
}
