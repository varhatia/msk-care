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

    // Get medication adherence from the last 7 days
    const adherenceEntries = await prisma.progressEntry.findMany({
      where: {
        patientId,
        entryDate: {
          gte: sevenDaysAgo
        }
      },
      select: {
        medicationAdherence: true,
        entryDate: true
      },
      orderBy: {
        entryDate: 'desc'
      }
    })

    // Calculate medication days (count of true values)
    const medicationDays = adherenceEntries.filter(entry => entry.medicationAdherence).length
    const totalDays = adherenceEntries.length
    const medicationPercentage = totalDays > 0 ? (medicationDays / totalDays) * 100 : 0

    // Get the most recent adherence
    const mostRecentAdherence = adherenceEntries.length > 0 ? adherenceEntries[0].medicationAdherence : null

    // Calculate trend (comparing first half vs second half of the week)
    let trend = 'stable'
    if (adherenceEntries.length >= 4) {
      const midPoint = Math.floor(adherenceEntries.length / 2)
      const firstHalf = adherenceEntries.slice(midPoint)
      const secondHalf = adherenceEntries.slice(0, midPoint)
      
      const firstHalfMedicationDays = firstHalf.filter(entry => entry.medicationAdherence).length
      const secondHalfMedicationDays = secondHalf.filter(entry => entry.medicationAdherence).length
      
      const firstHalfPercentage = firstHalf.length > 0 ? (firstHalfMedicationDays / firstHalf.length) * 100 : 0
      const secondHalfPercentage = secondHalf.length > 0 ? (secondHalfMedicationDays / secondHalf.length) * 100 : 0
      
      const difference = secondHalfPercentage - firstHalfPercentage
      if (difference > 10) { // 10% threshold for medication adherence
        trend = 'increasing'
      } else if (difference < -10) {
        trend = 'decreasing'
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        medicationDays,
        totalDays,
        medicationPercentage: Math.round(medicationPercentage),
        mostRecentAdherence,
        totalEntries: adherenceEntries.length,
        trend,
        entries: adherenceEntries.map(entry => ({
          medicationAdherence: entry.medicationAdherence,
          date: entry.entryDate.toISOString().split('T')[0]
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching medication adherence stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medication adherence statistics' },
      { status: 500 }
    )
  }
}
