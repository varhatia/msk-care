import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('url');

    if (!videoUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Validate that the URL is from an allowed domain
    const allowedDomains = [
      'media.musclewiki.com',
      'www.youtube.com',
      'youtube.com',
      'youtu.be'
    ];

    const url = new URL(videoUrl);
    if (!allowedDomains.includes(url.hostname)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    // Fetch the video content
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MSK-Care/1.0)',
        'Accept': 'video/*,image/*,*/*',
      },
    });

    if (!response.ok) {
      console.log(`❌ Video not found: ${videoUrl} (${response.status})`);
      return NextResponse.json({ 
        error: 'Video not found',
        url: videoUrl,
        status: response.status 
      }, { status: 404 });
    }

    // Get the content type
    const contentType = response.headers.get('content-type') || 'video/mp4';
    
    // Get the content
    const buffer = await response.arrayBuffer();

    // Return the video with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error proxying video:', error);
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}
