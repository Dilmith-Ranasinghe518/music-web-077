import { NextResponse } from 'next/server';

// List of public Invidious instances to rotate through
// These are less likely to block Vercel IPs than direct YouTube scraping
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
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout per instance

        const res = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, {
            signal: controller.signal
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

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Shuffle instances to load balance
    const shuffled = [...INVIDIOUS_INSTANCES].sort(() => 0.5 - Math.random());

    for (const instance of shuffled) {
        const videoId = await fetchFromInvidious(instance, q);
        if (videoId) {
            return NextResponse.json({ videoId });
        }
    }

    // Fallback: Return a decent error or a generic fallback? 
    // If all fail, we can't play the song.
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
}
