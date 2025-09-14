import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function fetchWgerExercises(): Promise<WgerExercise[]> {
  try {
    console.log('🔍 Fetching from Wger API...');
    const response = await fetch('https://wger.de/api/v2/exercise/?language=2&limit=50');
    
    if (!response.ok) {
      throw new Error(`Wger API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.results?.length || 0} exercises from Wger API`);
    return data.results || [];
  } catch (error) {
    console.error('❌ Error fetching from Wger API:', error);
    return [];
  }
}

async function fetchMuscleWikiExercises(): Promise<MuscleWikiExercise[]> {
  try {
    console.log('🔍 Fetching from MuscleWiki API...');
    const response = await fetch('https://workoutapi.vercel.app/exercises');
    
    if (!response.ok) {
      throw new Error(`MuscleWiki API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data?.length || 0} exercises from MuscleWiki API`);
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching from MuscleWiki API:', error);
    return [];
  }
}

async function syncExercises() {
  try {
    console.log('🚀 Starting exercise sync from external APIs...\n');

    // Fetch from external APIs
    const wgerExercises = await fetchWgerExercises();
    const muscleWikiExercises = await fetchMuscleWikiExercises();

    let savedCount = 0;

    // Process Wger exercises
    console.log('\n📝 Processing Wger exercises...');
    for (const exercise of wgerExercises) {
      try {
        const primaryMuscles = exercise.muscles.map(m => m.name).join(', ');
        const secondaryMuscles = exercise.muscles_secondary.map(m => m.name).join(', ');
        const equipment = exercise.equipment.map(e => e.name).join(', ');
        const mainImage = exercise.images.find(img => img.is_main)?.image || exercise.images[0]?.image;

        const exerciseData = {
          name: exercise.name,
          description: exercise.description || 'No description available',
          category: exercise.category.name,
          difficulty: 'INTERMEDIATE' as const,
          duration: 15,
          reps: 10,
          sets: 3,
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

        await prisma.exercise.upsert({
          where: {
            source_sourceId: {
              source: 'wger',
              sourceId: exercise.id.toString(),
            },
          },
          update: exerciseData,
          create: exerciseData,
        });

        savedCount++;
        if (savedCount % 10 === 0) {
          console.log(`  ✅ Processed ${savedCount} exercises...`);
        }
      } catch (error) {
        console.error(`❌ Error processing Wger exercise ${exercise.id}:`, error);
      }
    }

    // Process MuscleWiki exercises
    console.log('\n📝 Processing MuscleWiki exercises...');
    for (const exercise of muscleWikiExercises) {
      try {
        const difficultyMap: Record<string, 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'> = {
          'Beginner': 'BEGINNER',
          'Intermediate': 'INTERMEDIATE',
          'Advanced': 'ADVANCED',
        };

        const exerciseData = {
          name: exercise.exercise_name,
          description: exercise.details || exercise.steps.join(' '),
          category: exercise.Category,
          difficulty: difficultyMap[exercise.Difficulty] || 'INTERMEDIATE' as const,
          duration: 15,
          reps: 10,
          sets: 3,
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

        await prisma.exercise.upsert({
          where: {
            source_sourceId: {
              source: 'musclewiki',
              sourceId: exercise.id.toString(),
            },
          },
          update: exerciseData,
          create: exerciseData,
        });

        savedCount++;
        if (savedCount % 50 === 0) {
          console.log(`  ✅ Processed ${savedCount} exercises...`);
        }
      } catch (error) {
        console.error(`❌ Error processing MuscleWiki exercise ${exercise.exercise_name}:`, error);
      }
    }

    console.log(`\n🎉 Successfully synced ${savedCount} exercises to database!`);
    console.log(`📊 Wger: ${wgerExercises.length} exercises`);
    console.log(`📊 MuscleWiki: ${muscleWikiExercises.length} exercises`);
    
  } catch (error) {
    console.error('❌ Error syncing exercises:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncExercises();
