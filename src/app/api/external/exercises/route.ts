import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface WgerExercise {
  id: number;
  name: string;
  description: string;
  category: {
    id: number;
    name: string;
  };
  muscles: Array<{
    id: number;
    name: string;
    is_front: boolean;
  }>;
  muscles_secondary: Array<{
    id: number;
    name: string;
    is_front: boolean;
  }>;
  equipment: Array<{
    id: number;
    name: string;
  }>;
  images: Array<{
    id: number;
    image: string;
    is_main: boolean;
  }>;
  variations: number[];
}

interface MuscleWikiExercise {
  exercise_name: string;
  Category: string;
  Difficulty: string;
  Force: string;
  details: string;
  steps: string[];
  target: {
    Primary: string[];
  };
  videoURL: string[];
  youtubeURL: string;
  id: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { center: true },
    });

    if (!user?.center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    console.log('🔄 Starting exercise sync from external APIs...');

    // Fetch from Wger API
    const wgerExercises = await fetchWgerExercises();
    console.log(`✅ Fetched ${wgerExercises.length} exercises from Wger API`);

    // Fetch from MuscleWiki API
    const muscleWikiExercises = await fetchMuscleWikiExercises();
    console.log(`✅ Fetched ${muscleWikiExercises.length} exercises from MuscleWiki API`);

    // Process and save exercises
    const savedExercises = await processAndSaveExercises(wgerExercises, muscleWikiExercises);
    
    console.log(`✅ Successfully synced ${savedExercises.length} exercises to database`);

    return NextResponse.json({
      message: 'Exercise sync completed successfully',
      totalExercises: savedExercises.length,
      wgerExercises: wgerExercises.length,
      muscleWikiExercises: muscleWikiExercises.length,
    });

  } catch (error) {
    console.error('❌ Error syncing exercises:', error);
    return NextResponse.json(
      { error: 'Failed to sync exercises', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function fetchWgerExercises(): Promise<WgerExercise[]> {
  try {
    const response = await fetch('https://wger.de/api/v2/exercise/?language=2&limit=100', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Wger API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching from Wger API:', error);
    return [];
  }
}

async function fetchMuscleWikiExercises(): Promise<MuscleWikiExercise[]> {
  try {
    const response = await fetch('https://workoutapi.vercel.app/exercises', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`MuscleWiki API error: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching from MuscleWiki API:', error);
    return [];
  }
}

async function processAndSaveExercises(
  wgerExercises: WgerExercise[],
  muscleWikiExercises: MuscleWikiExercise[]
): Promise<any[]> {
  const savedExercises = [];

  // Process Wger exercises
  for (const exercise of wgerExercises) {
    try {
      const primaryMuscles = exercise.muscles.map(m => m.name).join(', ');
      const secondaryMuscles = exercise.muscles_secondary.map(m => m.name).join(', ');
      const equipment = exercise.equipment.map(e => e.name).join(', ');
      const mainImage = exercise.images.find(img => img.is_main)?.image || exercise.images[0]?.image;

      const mappedDifficultyWger: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'INTERMEDIATE'

      const exerciseCreateData = {
        name: exercise.name,
        description: exercise.description || 'No description available',
        category: exercise.category.name,
        difficulty: mappedDifficultyWger, // Default difficulty
        duration: 15, // Default duration
        reps: 10, // Default reps
        sets: 3, // Default sets
        frequency: 'Daily',
        instructions: exercise.description || 'No instructions available',
        imageUrl: mainImage ? `https://wger.de${mainImage}` : null,
        videoUrl: null,
        isActive: true,
        source: 'wger',
        sourceId: exercise.id.toString(),
        metadata: {
          primaryMuscles,
          secondaryMuscles,
          equipment,
          variations: exercise.variations,
        },
      };

      const exerciseUpdateData = {
        ...exerciseCreateData,
        difficulty: { set: mappedDifficultyWger },
      } as const

      const savedExercise = await prisma.exercise.upsert({
        where: {
          source_sourceId: {
            source: 'wger',
            sourceId: exercise.id.toString(),
          },
        },
        update: exerciseUpdateData,
        create: exerciseCreateData,
      });

      savedExercises.push(savedExercise);
    } catch (error) {
      console.error(`Error processing Wger exercise ${exercise.id}:`, error);
    }
  }

  // Process MuscleWiki exercises
  for (const exercise of muscleWikiExercises) {
    try {
      const difficultyMap: Record<string, 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'> = {
        'Beginner': 'BEGINNER',
        'Intermediate': 'INTERMEDIATE',
        'Advanced': 'ADVANCED',
      };

      const mappedDifficulty = difficultyMap[exercise.Difficulty] || 'INTERMEDIATE'

      const exerciseCreateData = {
        name: exercise.exercise_name,
        description: exercise.details || exercise.steps.join(' '),
        category: exercise.Category,
        difficulty: mappedDifficulty,
        duration: 15, // Default duration
        reps: 10, // Default reps
        sets: 3, // Default sets
        frequency: 'Daily',
        instructions: exercise.steps.join('\n'),
        imageUrl: exercise.videoURL?.[0] || null,
        videoUrl: exercise.youtubeURL || null,
        isActive: true,
        source: 'musclewiki',
        sourceId: exercise.id.toString(),
        metadata: {
          force: exercise.Force,
          primaryMuscles: exercise.target.Primary.join(', '),
          steps: exercise.steps,
          videoURLs: exercise.videoURL,
          youtubeURL: exercise.youtubeURL,
        },
      };

      const exerciseUpdateData = {
        ...exerciseCreateData,
        difficulty: { set: mappedDifficulty },
      } as const

      const savedExercise = await prisma.exercise.upsert({
        where: {
          source_sourceId: {
            source: 'musclewiki',
            sourceId: exercise.id.toString(),
          },
        },
        update: exerciseUpdateData,
        create: exerciseCreateData,
      });

      savedExercises.push(savedExercise);
    } catch (error) {
      console.error(`Error processing MuscleWiki exercise ${exercise.exercise_name}:`, error);
    }
  }

  return savedExercises;
}
