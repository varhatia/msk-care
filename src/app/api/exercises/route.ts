import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const where: any = {
      isActive: true,
    }

    if (category) {
      where.category = category
    }

    if (difficulty) {
      where.difficulty = difficulty
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }

    const exercises = await prisma.exercise.findMany({
      where,
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
        source: true,
      },
      orderBy: [
        { category: 'asc' },
        { difficulty: 'asc' },
        { name: 'asc' },
      ],
      take: limit,
    })

    // Get unique categories for filtering
    const categories = await prisma.exercise.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        exercises,
        categories: categories.map(c => c.category),
        total: exercises.length,
      },
    })

  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
