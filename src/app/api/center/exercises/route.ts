import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  console.log('🔍 /api/center/exercises - Request received');
  
  try {
    console.log('🔍 Getting session...');
    const session = await getServerSession(authOptions);
    
    console.log('🔍 Session object:', JSON.stringify(session, null, 2));
    console.log('🔍 Session user:', session?.user);
    console.log('🔍 Session user email:', session?.user?.email);
    
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json({ 
        error: 'No session found',
        debug: 'Session is null or undefined'
      }, { status: 401 });
    }
    
    if (!session.user) {
      console.log('❌ No user in session');
      return NextResponse.json({ 
        error: 'No user in session',
        debug: 'Session exists but user is null or undefined'
      }, { status: 401 });
    }
    
    if (!session.user.email) {
      console.log('❌ No email in session user');
      return NextResponse.json({ 
        error: 'No email in session user',
        debug: 'User exists but email is missing'
      }, { status: 401 });
    }

    console.log('✅ Authentication passed, fetching exercises...');

    // Return all active exercises from the global catalog (exercise is decoupled)
    const exercises = await prisma.exercise.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        difficulty: true,
        duration: true,
        reps: true,
        sets: true,
        frequency: true,
        videoUrl: true,
        imageUrl: true,
        instructions: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`✅ Found ${exercises.length} exercises`);
    console.log('🔍 Exercises:', JSON.stringify(exercises, null, 2));

    return NextResponse.json({ 
      exercises,
      debug: `Successfully fetched ${exercises.length} exercises`
    });
  } catch (error) {
    console.error('❌ Error in /api/center/exercises:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
