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

// List of public Piped instances (Alternative to Invidious)
const PIPED_INSTANCES = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.ot.ax',
    'https://pipedapi.tokhmi.xyz',
    'https://api.piped.yt'
];

async function fetchFromInvidious(instance: string, query: string) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        clearTimeout(timeoutId);

        if (!res.ok) return null;

        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            return data[0].videoId;
        }
        return null;
    } catch (e) {
        return null;
    }
}

async function fetchFromPiped(instance: string, query: string) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&filter=music_videos`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) return null;

        const data = await res.json();
        // Piped returns { items: [...] }
        if (data.items && data.items.length > 0) {
            const url = data.items[0].url; // "/watch?v=VIDEO_ID"
            const videoId = url.split('v=')[1];
            return videoId;
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

    // 1. Try yt-search first
    try {
        const r = await yts(q);
        if (r.videos && r.videos.length > 0) {
            return NextResponse.json({ videoId: r.videos[0].videoId });
        }
    } catch (error) {
        console.warn('yt-search failed, falling back to Proxies...');
    }

    // 2. Fallback: Mix of Invidious and Piped
    // We intertwine them to maximize success chance
    const fallbacks = [
        ...INVIDIOUS_INSTANCES.map(url => ({ url, type: 'invidious' })),
        ...PIPED_INSTANCES.map(url => ({ url, type: 'piped' }))
    ].sort(() => 0.5 - Math.random());

    for (const remote of fallbacks.slice(0, 4)) {
        if (remote.type === 'invidious') {
            const videoId = await fetchFromInvidious(remote.url, q);
            if (videoId) return NextResponse.json({ videoId });
        } else {
            const videoId = await fetchFromPiped(remote.url, q);
            if (videoId) return NextResponse.json({ videoId });
        }
    }

    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
}
