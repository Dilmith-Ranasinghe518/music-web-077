'use client';

import { useState, useCallback, useEffect } from 'react';
import Search from '@/components/Search';
import Card from '@/components/Card';
import Player from '@/components/Player';
import ArtistCard from '@/components/ArtistCard';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface DeezerTrack {
  id: number;
  title: string;
  artist: {
    name: string;
    picture_medium: string;
  };
  album: {
    title: string;
    cover_medium: string;
  };
  preview: string;
}

interface Artist {
  id: number;
  name: string;
  picture_medium?: string;
  picture_xl?: string;
  picture?: string;
  picture_big?: string;
}

const COUNTRIES = [
  { code: 'global', name: 'Global' },
  { code: 'us', name: 'United States' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'lk', name: 'Sri Lanka' },
  { code: 'in', name: 'India' },
  { code: 'kr', name: 'South Korea' },
  { code: 'jp', name: 'Japan' },
  { code: 'br', name: 'Brazil' },
  { code: 'fr', name: 'France' },
];

export default function Home() {
  const [results, setResults] = useState<DeezerTrack[]>([]);
  const [globalTrending, setGlobalTrending] = useState<DeezerTrack[]>([]);
  const [lkTrending, setLkTrending] = useState<DeezerTrack[]>([]);

  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
  const [displayedArtists, setDisplayedArtists] = useState<Artist[]>([]); // For 'View All' screen

  const [loading, setLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<DeezerTrack | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'home' | 'search' | 'artist' | 'all_artists'>('home');
  const [sectionTitle, setSectionTitle] = useState('Search Results');

  // Filter States
  const [artistSearchQuery, setArtistSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('global');

  // Load Charts on Mount
  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const [globalRes, lkRes, artistRes] = await Promise.all([
          fetch('/api/deezer'),
          fetch('/api/deezer?type=lk'),
          fetch('/api/deezer?type=artists')
        ]);

        const globalData = await globalRes.json();
        const lkData = await lkRes.json();
        const artistData = await artistRes.json();

        if (Array.isArray(globalData)) setGlobalTrending(globalData);
        if (Array.isArray(lkData)) setLkTrending(lkData);
        if (Array.isArray(artistData)) {
          setPopularArtists(artistData);
          setDisplayedArtists(artistData); // Default
        }

      } catch (e) {
        console.error("Failed to load charts", e);
      }
    };
    fetchCharts();
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query) {
      setViewMode('home');
      setResults([]);
      return;
    }

    setViewMode('search');
    setSectionTitle('Search Results');
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch(`/api/deezer?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      const items = data.data || [];
      setResults(items);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(`Something went wrong: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePlay = (track: DeezerTrack) => {
    setCurrentTrack(track);
  };

  const handleArtistClick = async (artist: Artist) => {
    setViewMode('artist');
    setSectionTitle(`Top Songs by ${artist.name}`);
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch(`/api/deezer?type=artist_top&id=${artist.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (err: any) {
      console.error("Artist load error:", err);
      setError("Failed to load artist tracks.");
    } finally {
      setLoading(false);
    }
  };

  // Artist Filter Logic
  const handleArtistSearch = async (query: string) => {
    setArtistSearchQuery(query);
    if (!query && selectedCountry === 'global') {
      setDisplayedArtists(popularArtists);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/deezer?type=artist_search&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (Array.isArray(data)) setDisplayedArtists(data);
    } catch (e) { console.error(e) } finally { setLoading(false) }
  };

  const handleCountryFilter = async (countryName: string) => {
    // If code is global, reset
    if (countryName === 'Global') {
      setDisplayedArtists(popularArtists);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/deezer?type=artists_by_country&q=${encodeURIComponent(countryName)}`);
      const data = await res.json();
      if (Array.isArray(data)) setDisplayedArtists(data);
    } catch (e) {
      console.error(e);
      setDisplayedArtists([]);
    } finally { setLoading(false) }
  };

  return (
    <main className="min-h-screen bg-[#0f0f13] text-white selection:bg-purple-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">

        {/* HERO (Only on Home) */}
        {viewMode === 'home' && (
          <header className="flex flex-col items-center justify-center mb-16 space-y-8 pt-10 md:pt-20">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 opacity-75 blur"></div>
              <h1 className="relative text-5xl md:text-8xl font-black text-white tracking-tighter text-center px-4">
                Sonic<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Dive</span>
              </h1>
            </div>
            <p className="text-gray-400 text-lg md:text-2xl text-center max-w-2xl font-light">
              Discover. Stream. <span className="text-white font-medium">Vibe.</span>
            </p>
            <div className="w-full max-w-xl shadow-2xl shadow-purple-900/20 rounded-2xl">
              <Search onSearch={handleSearch} />
            </div>
          </header>
        )}

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 shadow-lg shadow-purple-500/50"></div>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="text-center text-red-400 py-10 bg-red-900/10 rounded-xl mb-8 border border-red-500/20">
            {error}
          </div>
        )}

        {/* --- VIEW MODE: HOME --- */}
        {!loading && viewMode === 'home' && !error && (
          <div className="space-y-16 animate-in fade-in duration-1000">

            {/* Popular Artists Row */}
            {popularArtists.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl md:text-4xl font-bold flex items-center gap-3">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-red-400">
                      Popular Artists
                    </span>
                  </h2>
                  <button
                    onClick={() => setViewMode('all_artists')}
                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full hover:bg-white/10"
                  >
                    View All
                  </button>
                </div>
                <div className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide snap-x">
                  {popularArtists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} onClick={handleArtistClick} />
                  ))}
                </div>
              </section>
            )}

            {/* Charts */}
            {globalTrending.length > 0 && (
              <section>
                <h2 className="text-2xl md:text-4xl font-bold mb-8 flex items-center gap-3">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                    Global Top Charts
                  </span>
                  <span className="text-sm bg-white/10 px-2 py-1 rounded text-gray-300 font-normal">Top 10</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {globalTrending.map((track) => (
                    <Card key={track.id} track={track} onClick={handlePlay} />
                  ))}
                </div>
              </section>
            )}

            {lkTrending.length > 0 && (
              <section>
                <h2 className="text-2xl md:text-4xl font-bold mb-8 flex items-center gap-3">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-yellow-400">
                    Sri Lanka Top Hits
                  </span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {lkTrending.map((track) => (
                    <Card key={track.id} track={track} onClick={handlePlay} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* --- VIEW MODE: ALL ARTISTS --- */}
        {!loading && viewMode === 'all_artists' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-[60vh]">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  onClick={() => setViewMode('home')}
                  className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  ←
                </button>
                <h2 className="text-3xl font-bold">All Artists</h2>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search Artists..."
                    value={artistSearchQuery}
                    onChange={(e) => handleArtistSearch(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 w-full sm:w-64"
                  />
                </div>
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    const country = COUNTRIES.find(c => c.code === e.target.value);
                    if (country) handleCountryFilter(country.name);
                  }}
                  className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code} className="bg-gray-900 text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {displayedArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} onClick={handleArtistClick} />
              ))}
            </div>
            {displayedArtists.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                No artists found.
              </div>
            )}
          </div>
        )}

        {/* --- VIEW MODE: SEARCH Results / ARTIST TRACKS --- */}
        {!loading && (viewMode === 'search' || viewMode === 'artist') && results.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 mb-20">
            <button
              onClick={() => setViewMode('home')}
              className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors flex items-center gap-2"
            >
              ← Back to Home
            </button>

            <h2 className="text-2xl md:text-3xl font-bold mb-6 pl-2 border-l-4 border-purple-500">
              {sectionTitle}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {results.map((track) => (
                <Card key={track.id} track={track} onClick={handlePlay} />
              ))}
            </div>
          </div>
        )}

        {/* --- EMPTY STATE FOR SEARCH/ARTIST --- */}
        {!loading && (viewMode === 'search' || viewMode === 'artist') && results.length === 0 && !error && (
          <div className="text-center text-gray-500 py-20">
            <p className="text-xl">No tracks found.</p>
            <button
              onClick={() => setViewMode('home')}
              className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}

        {currentTrack && (
          <Player
            track={currentTrack}
            onClose={() => setCurrentTrack(null)}
          />
        )}
      </div>
    </main>
  );
}
