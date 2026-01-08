'use client';

interface Artist {
    id: number;
    name: string;
    picture_medium?: string;
    picture_xl?: string;
    picture?: string;
    picture_big?: string;
}

interface ArtistCardProps {
    artist: Artist;
    onClick: (artist: Artist) => void;
}

export default function ArtistCard({ artist, onClick }: ArtistCardProps) {
    const imageSrc = artist.picture_medium || artist.picture_xl || artist.picture_big || artist.picture || '';

    return (
        <div
            onClick={() => onClick(artist)}
            className="flex flex-col items-center gap-3 cursor-pointer group w-32 md:w-40 flex-shrink-0"
        >
            <div className={`w-full aspect-square rounded-full overflow-hidden border-2 border-transparent group-hover:border-purple-500 transition-all duration-300 shadow-lg group-hover:shadow-purple-500/40 relative ${!imageSrc ? 'bg-white/10' : ''}`}>
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        alt={artist.name}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl font-bold">
                        {artist.name.charAt(0)}
                    </div>
                )}
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">View</span>
                </div>
            </div>

            <h3 className="text-center font-medium text-white group-hover:text-purple-400 transition-colors text-sm md:text-base truncate w-full px-2">
                {artist.name}
            </h3>
        </div>
    );
}
