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

    // Get all progress entries from the last 7 days
    const progressEntries = await prisma.progressEntry.findMany({
      where: {
        patientId,
        entryDate: {
          gte: sevenDaysAgo
        }
      },
      select: {
        entryDate: true,
        exerciseAdherence: true
      },
      orderBy: {
        entryDate: 'desc'
      }
    })

    // Count unique days with entries
    const uniqueDays = new Set()
    progressEntries.forEach(entry => {
      const dateStr = entry.entryDate.toISOString().split('T')[0]
      uniqueDays.add(dateStr)
    })

    const daysActive = uniqueDays.size
    const totalDays = 7

    // Calculate average exercise adherence for active days (as percentage)
    const totalAdherence = progressEntries.reduce((sum, entry) => sum + (entry.exerciseAdherence ? 1 : 0), 0)
    const averageAdherence = progressEntries.length > 0 ? (totalAdherence / progressEntries.length) * 100 : 0

    // Determine trend based on recent activity
    let trend = 'stable'
    if (progressEntries.length >= 3) {
      const recentEntries = progressEntries.slice(0, 3)
      const olderEntries = progressEntries.slice(3, 6)
      
      if (recentEntries.length > 0 && olderEntries.length > 0) {
        const recentAvg = (recentEntries.reduce((sum, entry) => sum + (entry.exerciseAdherence ? 1 : 0), 0) / recentEntries.length) * 100
        const olderAvg = (olderEntries.reduce((sum, entry) => sum + (entry.exerciseAdherence ? 1 : 0), 0) / olderEntries.length) * 100
        
        const difference = recentAvg - olderAvg
        if (difference > 10) { // 10% threshold for activity trend
          trend = 'increasing'
        } else if (difference < -10) {
          trend = 'decreasing'
        }
      }
    }

    // Get the most recent entry date
    const mostRecentDate = progressEntries.length > 0 ? progressEntries[0].entryDate.toISOString().split('T')[0] : null

    return NextResponse.json({
      success: true,
      data: {
        daysActive,
        totalDays,
        averageAdherence: Math.round(averageAdherence),
        trend,
        mostRecentDate,
        totalEntries: progressEntries.length,
        activeDays: Array.from(uniqueDays).sort().reverse() // Most recent first
      }
    })

  } catch (error) {
    console.error('Error fetching days active stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch days active statistics' },
      { status: 500 }
    )
  }
}
