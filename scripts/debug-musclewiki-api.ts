// Debug script to check MuscleWiki API response structure
async function debugMuscleWikiAPI() {
  try {
    console.log('🔍 Debugging MuscleWiki API response structure...\n');
    
    const response = await fetch('https://workoutapi.vercel.app/exercises');
    
    if (!response.ok) {
      throw new Error(`MuscleWiki API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 Raw API response:');
    console.log('Type:', typeof data);
    console.log('Is Array:', Array.isArray(data));
    console.log('Length:', data?.length);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('\n📝 First exercise structure:');
      console.log(JSON.stringify(data[0], null, 2));
      
      console.log('\n📝 Second exercise structure:');
      console.log(JSON.stringify(data[1], null, 2));
    } else {
      console.log('\n📝 Full response structure:');
      console.log(JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error debugging MuscleWiki API:', error);
  }
}

debugMuscleWikiAPI();
