import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const sendEmailSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  includeExercisePlan: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { center: true }
    });

    if (!user || !user.center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = sendEmailSchema.parse(body);

    // Verify patient is linked to this center
    const centerPatient = await prisma.centerPatient.findFirst({
      where: {
        centerId: user.center.id,
        patientId: validatedData.patientId,
        isActive: true
      },
      include: {
        patient: true
      }
    });

    if (!centerPatient) {
      return NextResponse.json({ error: 'Patient not found or not linked to this center' }, { status: 404 });
    }

    // Get patient's latest exercise plan if requested
    let exercisePlanDetails = null;
    if (validatedData.includeExercisePlan) {
      const latestPrescription = await prisma.prescription.findFirst({
        where: {
          patientId: validatedData.patientId,
          status: 'ACTIVE'
        },
        include: {
          physio: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          prescriptionExercises: {
            include: {
              exercise: {
                select: {
                  name: true,
                  description: true,
                  category: true,
                  difficulty: true
                }
              }
            },
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (latestPrescription) {
        exercisePlanDetails = {
          startDate: latestPrescription.startDate,
          endDate: latestPrescription.endDate,
          physio: latestPrescription.physio,
          exercises: latestPrescription.prescriptionExercises.map(pe => ({
            name: pe.exercise.name,
            description: pe.exercise.description,
            category: pe.exercise.category,
            difficulty: pe.exercise.difficulty,
            sets: pe.sets,
            reps: pe.reps,
            order: pe.order
          }))
        };
      }
    }

    // For now, we'll simulate email sending
    // In a real application, you would integrate with an email service like SendGrid, AWS SES, etc.
    const emailData = {
      to: centerPatient.patient.email,
      subject: validatedData.subject,
      message: validatedData.message,
      patientName: `${centerPatient.patient.firstName} ${centerPatient.patient.lastName}`,
      centerName: user.center.name,
      exercisePlan: exercisePlanDetails
    };

    // Simulate email sending (replace with actual email service)
    console.log('Email would be sent:', emailData);

    // In a real implementation, you would:
    // 1. Use an email service like SendGrid, AWS SES, or Nodemailer
    // 2. Create an HTML email template
    // 3. Send the actual email
    // 4. Log the email in your database for tracking

    // For demo purposes, we'll just return success
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailData: {
        to: emailData.to,
        subject: emailData.subject,
        patientName: emailData.patientName
      }
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
