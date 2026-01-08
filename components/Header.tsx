import Link from 'next/link';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-40 bg-[#0f0f13]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
                        <MusicalNoteIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:from-purple-400 group-hover:to-pink-400 transition-all">
                        SonicDive
                    </span>
                </Link>

                {/* Navigation (Future Proofing) */}

            </div>
        </header>
    );
}
