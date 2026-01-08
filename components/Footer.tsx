export default function Footer() {
    return (
        <footer className="w-full bg-[#0f0f13] border-t border-white/5 py-8 mt-auto">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">

                <div className="flex flex-col gap-1">
                    <h4 className="text-white font-bold text-lg">SonicDive</h4>
                    <p className="text-gray-500 text-sm">
                        Immersive Music Streaming Experience.
                    </p>
                </div>

                <div className="text-gray-600 text-xs">
                    <p>&copy; {new Date().getFullYear()} SonicDive. All rights reserved.</p>
                    <p className="mt-1">
                        Powered by <span className="text-gray-400">Deezer</span> & <span className="text-gray-400">YouTube</span>
                    </p>
                </div>

            </div>
        </footer>
    );
}
