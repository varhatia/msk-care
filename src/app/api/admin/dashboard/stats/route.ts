import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any)?.role !== 'ADMIN' || !(session.user as any)?.isMSKAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all statistics in parallel
    const [
      totalCenters,
      totalPhysios,
      totalPatients,
      totalNutritionists,
      pendingApprovals,
      totalAppointments,
      activeAppointments,
      completedAppointments,
      totalExercisePlans,
      activeExercisePlans,
      painScores,
      mobilityScores
    ] = await Promise.all([
      // Total counts
      prisma.center.count({ where: { isActive: true } }),
      prisma.physio.count({ where: { isActive: true } }),
      prisma.patient.count({ where: { isActive: true } }),
      prisma.nutritionist.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isApproved: false } }),
      
      // Appointment counts
      prisma.appointment.count(),
      prisma.appointment.count({ 
        where: { 
          status: { in: ['SCHEDULED', 'CONFIRMED'] } 
        } 
      }),
      prisma.appointment.count({ 
        where: { 
          status: 'COMPLETED' 
        } 
      }),
      
      // Exercise plan counts (using prescriptions as plans)
      prisma.prescription.count(),
      prisma.prescription.count({ 
        where: { 
          status: 'ACTIVE' 
        } 
      }),
      
      // Average scores
      prisma.progressEntry.aggregate({
        _avg: {
          painScore: true
        }
      }),
      prisma.progressEntry.aggregate({
        _avg: {
          mobilityScore: true
        }
      })
    ])

    const stats = {
      totalCenters,
      totalPhysios,
      totalPatients,
      totalNutritionists,
      pendingApprovals,
      totalAppointments,
      activeAppointments,
      completedAppointments,
      totalExercisePlans,
      activeExercisePlans,
      averagePainScore: painScores._avg.painScore || 0,
      averageMobilityScore: mobilityScores._avg.mobilityScore || 0
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}
