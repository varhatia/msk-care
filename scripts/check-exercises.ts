import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkExercises() {
  try {
    console.log('🔍 Checking current exercises in database...\n');
    
    const exercises = await prisma.exercise.findMany({
      select: {
        id: true,
        name: true,
        source: true,
        sourceId: true,
        category: true,
        difficulty: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Total exercises in database: ${exercises.length}\n`);
    
    if (exercises.length === 0) {
      console.log('❌ No exercises found in database');
      return;
    }

    // Group by source
    const bySource = exercises.reduce((acc, exercise) => {
      const source = exercise.source || 'manual';
      if (!acc[source]) {
        acc[source] = [];
      }
      acc[source].push(exercise);
      return acc;
    }, {} as Record<string, typeof exercises>);

    // Display by source
    Object.entries(bySource).forEach(([source, sourceExercises]) => {
      console.log(`📁 ${source.toUpperCase()} (${sourceExercises.length} exercises):`);
      sourceExercises.forEach(exercise => {
        console.log(`  - ${exercise.name} (${exercise.category}, ${exercise.difficulty})`);
      });
      console.log('');
    });

    console.log('💡 To sync external exercises, use the "Sync Exercises" button in the Exercise Directory');
    
  } catch (error) {
    console.error('❌ Error checking exercises:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExercises();
