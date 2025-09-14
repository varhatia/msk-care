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

    // Get pain scores from the last 7 days
    const painEntries = await prisma.progressEntry.findMany({
      where: {
        patientId,
        entryDate: {
          gte: sevenDaysAgo
        }
      },
      select: {
        painScore: true,
        entryDate: true
      },
      orderBy: {
        entryDate: 'desc'
      }
    })

    // Calculate average pain score
    const totalPainScore = painEntries.reduce((sum, entry) => sum + entry.painScore, 0)
    const averagePainScore = painEntries.length > 0 ? totalPainScore / painEntries.length : 0

    // Get the most recent pain score
    const mostRecentPainScore = painEntries.length > 0 ? painEntries[0].painScore : null

    // Calculate trend (comparing first half vs second half of the week)
    let trend = 'stable'
    if (painEntries.length >= 4) {
      const midPoint = Math.floor(painEntries.length / 2)
      const firstHalf = painEntries.slice(midPoint)
      const secondHalf = painEntries.slice(0, midPoint)
      
      const firstHalfAvg = firstHalf.reduce((sum, entry) => sum + entry.painScore, 0) / firstHalf.length
      const secondHalfAvg = secondHalf.reduce((sum, entry) => sum + entry.painScore, 0) / secondHalf.length
      
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
        averagePainScore: Math.round(averagePainScore * 10) / 10, // Round to 1 decimal place
        mostRecentPainScore,
        totalEntries: painEntries.length,
        trend,
        entries: painEntries.map(entry => ({
          painScore: entry.painScore,
          date: entry.entryDate.toISOString().split('T')[0]
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching pain stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pain statistics' },
      { status: 500 }
    )
  }
}
