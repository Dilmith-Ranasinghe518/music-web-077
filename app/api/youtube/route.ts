import { NextResponse } from 'next/server';
import yts from 'yt-search';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    try {
        // Perform search using yt-search
        const r = await yts(q);

        // Get the first video result
        const videos = r.videos;

        if (videos && videos.length > 0) {
            return NextResponse.json({ videoId: videos[0].videoId });
        }
    } catch (error) {
        console.error('Error fetching from YouTube (yt-search):', error);
    }

    return NextResponse.json({ error: 'Failed to find video ID' }, { status: 404 });
}
