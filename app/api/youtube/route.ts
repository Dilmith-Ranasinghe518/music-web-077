import { NextResponse } from 'next/server';
import yts from 'yt-search';

// List of public Invidious instances
const INVIDIOUS_INSTANCES = [
    'https://inv.tux.pizza',
    'https://yt.artemislena.eu',
    'https://invidious.projectsegfau.lt',
    'https://vid.puffyan.us',
    'https://invidious.slipfox.xyz',
    'https://yewtu.be'
];

async function fetchFromInvidious(instance: string, query: string) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s timeout

        const res = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            // console.error(`Invidious ${instance} error:`, res.status);
            return null;
        }

        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            return data[0].videoId;
        }
        return null;
    } catch (e) {
        return null;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // 1. Try yt-search first (Direct scraping)
    // Works best locally, might fail on Vercel
    try {
        const r = await yts(q);
        if (r.videos && r.videos.length > 0) {
            return NextResponse.json({ videoId: r.videos[0].videoId });
        }
    } catch (error) {
        console.warn('yt-search failed, falling back to Invidious proxy...');
    }

    // 2. Fallback: Rotate through Invidious instances
    const shuffled = [...INVIDIOUS_INSTANCES].sort(() => 0.5 - Math.random());

    // Try max 3 instances to avoid long wait times
    for (const instance of shuffled.slice(0, 3)) {
        const videoId = await fetchFromInvidious(instance, q);
        if (videoId) {
            return NextResponse.json({ videoId });
        }
    }

    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
}
