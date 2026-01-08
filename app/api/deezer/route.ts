import { NextResponse } from 'next/server';

const SEARCH_URL = 'https://api.deezer.com/search';
const CHART_URL = 'https://api.deezer.com/chart';
const PLAYLIST_SEARCH_URL = 'https://api.deezer.com/search/playlist';
const PLAYLIST_URL = 'https://api.deezer.com/playlist';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const type = searchParams.get('type');

  // 1. Search Mode (Tracks)
  if (q && !type) {
    try {
      const response = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(q)}`);
      if (!response.ok) throw new Error(`Deezer Search Error: ${response.statusText}`);
      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ error: 'Search Failed' }, { status: 500 });
    }
  }

  try {
    if (type === 'lk') {
      const searchRes = await fetch(`${PLAYLIST_SEARCH_URL}?q=Sri+Lanka+Top&limit=1`);
      const searchData = await searchRes.json();

      if (searchData.data && searchData.data.length > 0) {
        const playlistId = searchData.data[0].id;
        const playlistRes = await fetch(`${PLAYLIST_URL}/${playlistId}`);
        const playlistData = await playlistRes.json();

        if (playlistData.tracks && playlistData.tracks.data) {
          return NextResponse.json(playlistData.tracks.data);
        }
      }
      return NextResponse.json([]);
    }

    if (type === 'artists') {
      // Fetch Top 50 Artists
      const response = await fetch(`${CHART_URL}/0/artists?limit=50`);
      const data = await response.json();
      if (data.data) return NextResponse.json(data.data);
      return NextResponse.json([]);
    }

    if (type === 'artist_top') {
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ error: 'Artist ID required' }, { status: 400 });

      const response = await fetch(`https://api.deezer.com/artist/${id}/top?limit=50`);
      const data = await response.json();
      if (data.data) return NextResponse.json(data.data);
      return NextResponse.json([]);
    }

    // 5. Artist Search
    if (type === 'artist_search') {
      if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 });
      const response = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}`);
      const data = await response.json();
      if (data.data) return NextResponse.json(data.data);
      return NextResponse.json([]);
    }

    // 6. Artists by Country (Derived from Playlist)
    if (type === 'artists_by_country') {
      if (!q) return NextResponse.json({ error: 'Country required' }, { status: 400 });
      // Search for "[Country] Top 50" playlist
      const searchRes = await fetch(`${PLAYLIST_SEARCH_URL}?q=${encodeURIComponent(q + ' Top 50')}&limit=1`);
      const searchData = await searchRes.json();

      if (searchData.data && searchData.data.length > 0) {
        const playlistId = searchData.data[0].id;
        const playlistRes = await fetch(`${PLAYLIST_URL}/${playlistId}`);
        const playlistData = await playlistRes.json();

        if (playlistData.tracks && playlistData.tracks.data) {
          // Extract Unique Artists from the track list
          const tracks = playlistData.tracks.data;
          const uniqueArtists = new Map();
          tracks.forEach((track: any) => {
            if (!uniqueArtists.has(track.artist.id)) {
              uniqueArtists.set(track.artist.id, track.artist);
            }
          });
          return NextResponse.json(Array.from(uniqueArtists.values()));
        }
      }
      return NextResponse.json([]);
    }

    // Default: Global Charts
    const response = await fetch(CHART_URL);
    if (!response.ok) throw new Error(`Deezer Chart Error: ${response.statusText}`);

    const data = await response.json();
    if (data.tracks && data.tracks.data) {
      return NextResponse.json(data.tracks.data);
    }
    return NextResponse.json([]);

  } catch (error) {
    console.error('Error fetching from Deezer:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
