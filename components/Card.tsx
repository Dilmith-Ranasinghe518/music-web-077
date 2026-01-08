'use client';

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

interface CardProps {
    track: DeezerTrack;
    onClick: (track: DeezerTrack) => void;
}

export default function Card({ track, onClick }: CardProps) {
    return (
        <div
            onClick={() => onClick(track)}
            className="group relative bg-white/5 backdrop-blur-sm rounded-xl p-4 cursor-pointer overflow-hidden transition-all duration-300 hover:bg-white/10 hover:scale-105 hover:shadow-xl border border-white/5 hover:border-purple-500/30 flex flex-col items-center text-center"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="relative z-10 w-full flex flex-col items-center">
                <div className="w-full aspect-square mb-4 rounded-lg overflow-hidden shadow-lg relative group-hover:shadow-purple-500/20 transition-shadow">
                    <img
                        src={track.album.cover_medium}
                        alt={track.album.title}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-white text-4xl">▶</span>
                    </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-1 truncate w-full group-hover:text-purple-300 transition-colors">
                    {track.title}
                </h3>

                <p className="text-gray-400 text-sm truncate w-full group-hover:text-gray-300 transition-colors">
                    {track.artist.name}
                </p>
                <p className="text-gray-500 text-xs truncate w-full mt-1">
                    {track.album.title}
                </p>
            </div>
        </div>
    );
}
