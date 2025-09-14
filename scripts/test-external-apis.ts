// Test script to verify external API endpoints
async function testWgerAPI() {
  try {
    console.log('🔍 Testing Wger API...');
    const response = await fetch('https://wger.de/api/v2/exercise/?language=2&limit=5');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Wger API working:', data.results?.length || 0, 'exercises found');
      console.log('Sample exercise:', data.results?.[0]?.name);
    } else {
      console.log('❌ Wger API error:', response.status);
    }
  } catch (error) {
    console.log('❌ Wger API error:', error);
  }
}

async function testMuscleWikiAPI() {
  try {
    console.log('🔍 Testing MuscleWiki API...');
    const response = await fetch('https://workoutapi.vercel.app/exercises');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ MuscleWiki API working:', data?.length || 0, 'exercises found');
      console.log('Sample exercise:', data?.[0]?.name);
    } else {
      console.log('❌ MuscleWiki API error:', response.status);
    }
  } catch (error) {
    console.log('❌ MuscleWiki API error:', error);
  }
}

async function testAPIs() {
  console.log('🚀 Testing external exercise APIs...\n');
  await testWgerAPI();
  console.log('');
  await testMuscleWikiAPI();
  console.log('\n✅ API testing completed');
}

testAPIs();
