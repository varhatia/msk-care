import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateExistingExercise() {
  try {
    // Update the existing exercise to mark it as manual
    const updatedExercise = await prisma.exercise.updateMany({
      where: {
        source: null,
      },
      data: {
        source: 'manual',
        sourceId: 'knee-extension-manual',
      },
    });

    console.log(`✅ Updated ${updatedExercise.count} exercises to mark as manual`);
  } catch (error) {
    console.error('❌ Error updating exercise:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingExercise();
