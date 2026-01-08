'use client';

import { useState, useRef, useEffect } from 'react';
import YouTube, { YouTubeProps, YouTubePlayer } from 'react-youtube';
import { PlayIcon, PauseIcon, VideoCameraIcon, MusicalNoteIcon } from '@heroicons/react/24/solid';

interface PlayerProps {
    track: {
        title: string;
        artist: { name: string; };
        album: { cover_medium: string; };
        preview: string;
    };
    onClose: () => void;
}

export default function Player({ track, onClose }: PlayerProps) {
    const [mode, setMode] = useState<'audio' | 'video'>('audio');
    const [videoId, setVideoId] = useState<string | null>(null);
    const [loadingVideo, setLoadingVideo] = useState(true);
    const [player, setPlayer] = useState<YouTubePlayer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false); // Track internal player state

    // Progress State
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [seeking, setSeeking] = useState(false);

    // List of CORS-enabled Invidious instances for client-side fallback
    const CORS_INSTANCES = [
        'https://vid.puffyan.us',
        'https://invidious.projectsegfau.lt',
        'https://inv.tux.pizza',
        'https://yewtu.be'
    ];

    const fetchVideoIdFromClient = async (query: string): Promise<string | null> => {
        // Try each instance
        for (const instance of CORS_INSTANCES) {
            try {
                const res = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, {
                    mode: 'cors'
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        return data[0].videoId;
                    }
                }
            } catch (e) {
                // Continue to next instance
            }
        }
        return null;
    };

    // Fetch Video ID
    useEffect(() => {
        let active = true;
        const fetchVideo = async () => {
            setVideoId(null);
            setLoadingVideo(true);
            setCurrentTime(0);
            setDuration(0);

            try {
                const query = `${track.artist.name} ${track.title} official audio`;

                // 1. Try Server API (yt-search + Proxy)
                const res = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`);

                if (res.ok) {
                    const data = await res.json();
                    if (active && data.videoId) {
                        setVideoId(data.videoId.trim());
                        setLoadingVideo(false);
                        return;
                    }
                }

                // 2. If Server fails, Try Client-Side (User IP)
                console.warn('Server API failed to find video, attempting client-side fallback...');
                const clientVideoId = await fetchVideoIdFromClient(query);

                if (active && clientVideoId) {
                    setVideoId(clientVideoId);
                } else {
                    console.error("All sources failed.");
                }

            } catch (e) {
                console.error("Failed to fetch video ID", e);
                // Try client side on error too
                if (active) {
                    const query = `${track.artist.name} ${track.title} official audio`;
                    const clientVideoId = await fetchVideoIdFromClient(query);
                    if (clientVideoId) setVideoId(clientVideoId);
                }
            } finally {
                if (active) setLoadingVideo(false);
            }
        };
        fetchVideo();
        return () => { active = false; };
    }, [track]);

    // Polling for Progress
    useEffect(() => {
        if (!player || !isPlaying || seeking) return;

        const interval = setInterval(() => {
            const time = player.getCurrentTime();
            const dur = player.getDuration();
            if (time) setCurrentTime(time);
            if (dur) setDuration(dur);
        }, 1000);

        return () => clearInterval(interval);
    }, [player, isPlaying, seeking]);

    // Player Event Handlers
    const onReady: YouTubeProps['onReady'] = (event) => {
        setPlayer(event.target);
        setDuration(event.target.getDuration());
        // Auto-play when ready
        event.target.playVideo();
    };

    const onStateChange: YouTubeProps['onStateChange'] = (event) => {
        // PlayerState: 1 = Playing, 2 = Paused, 3 = Buffering, 0 = Ended
        const state = event.data;
        setIsPlaying(state === 1);
        if (state === 1) { // Playing
            setDuration(event.target.getDuration());
        }
    };

    // Controls
    const togglePlay = () => {
        if (!player) return;
        if (isPlaying) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    };

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentTime(parseFloat(e.target.value));
    };

    const handleSeekMouseDown = () => {
        setSeeking(true);
    };

    const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
        setSeeking(false);
        const target = e.target as HTMLInputElement;
        const time = parseFloat(target.value);
        if (player) {
            player.seekTo(time, true);
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds) return "0:00";
        const date = new Date(seconds * 1000);
        const mm = date.getUTCMinutes();
        const ss = date.getUTCSeconds().toString().padStart(2, '0');
        return `${mm}:${ss}`;
    };

    const opts: YouTubeProps['opts'] = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            controls: mode === 'video' ? 1 : 0, // Show controls only in video mode
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-4xl bg-[#121212] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 flex flex-col md:flex-row h-[70vh] md:h-[500px]">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* React Youtube Player */}
                <div className={`absolute inset-0 z-0 ${mode === 'audio' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    {videoId ? (
                        <YouTube
                            videoId={videoId}
                            opts={opts}
                            onReady={onReady}
                            onStateChange={onStateChange}
                            onError={(e) => console.error("YouTube Error:", e)}
                            className="w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black text-gray-500">
                            {loadingVideo ? 'Loading Player...' : 'Video Unavailable'}
                        </div>
                    )}
                </div>

                {/* Audio Mode UI Overlay */}
                {mode === 'audio' && (
                    <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-[#121212]">
                        {/* Background Blur */}
                        <div className="absolute inset-0 z-0 h-full w-full">
                            <img src={track.album.cover_medium} alt="" className="w-full h-full object-cover opacity-20 blur-2xl scale-125" />
                        </div>

                        <div className="relative z-10 flex flex-col items-center w-full max-w-md">
                            <img
                                src={track.album.cover_medium}
                                alt={track.title}
                                className={`w-48 h-48 md:w-64 md:h-64 rounded-2xl shadow-2xl mb-6 object-cover transition-transform duration-700 ${isPlaying ? 'scale-100' : 'scale-95 opacity-80'}`}
                            />

                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 truncate w-full">{track.title}</h2>
                            <p className="text-lg text-gray-400 mb-6 truncate w-full">{track.artist.name}</p>

                            <div className="w-full flex flex-col items-center gap-4">
                                {/* Progress Bar */}
                                <div className="w-full flex items-center gap-3 text-xs text-gray-400 font-mono">
                                    <span>{formatTime(currentTime)}</span>
                                    <input
                                        type="range"
                                        min={0}
                                        max={duration || 100} // Default to 100 avoid /0
                                        step="1"
                                        value={currentTime}
                                        onMouseDown={handleSeekMouseDown}
                                        onChange={handleSeekChange}
                                        onMouseUp={handleSeekMouseUp}
                                        onTouchStart={handleSeekMouseDown}
                                        onTouchEnd={handleSeekMouseUp}
                                        className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                                    />
                                    <span>{formatTime(duration)}</span>
                                </div>

                                <div className="flex items-center gap-6 mt-2">
                                    <button
                                        onClick={togglePlay}
                                        className="p-5 bg-purple-600 hover:bg-purple-500 rounded-full text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
                                    >
                                        {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 pl-1" />}
                                    </button>

                                    <button
                                        onClick={() => setMode('video')}
                                        className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium transition-colors border border-white/10 hover:border-purple-500/50"
                                    >
                                        <VideoCameraIcon className="w-5 h-5" />
                                        <span className="hidden sm:inline">Video</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Video Mode Controls Overlay (Minimal) */}
                {mode === 'video' && (
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between pointer-events-none">
                        <div className="pointer-events-auto">
                            <h2 className="text-lg font-bold text-white truncate">{track.title}</h2>
                            <p className="text-sm text-gray-400">{track.artist.name}</p>
                        </div>
                        <button
                            onClick={() => setMode('audio')}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-medium transition-colors border border-white/10 backdrop-blur-md pointer-events-auto"
                        >
                            <MusicalNoteIcon className="w-4 h-4" />
                            Listen Audio
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
