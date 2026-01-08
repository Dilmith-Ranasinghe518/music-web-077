'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchProps {
    onSearch: (query: string) => void;
}

export default function Search({ onSearch }: SearchProps) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (debouncedQuery.trim()) {
            onSearch(debouncedQuery);
        }
    }, [debouncedQuery, onSearch]);

    return (
        <div className="relative w-full max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-4 border-none rounded-2xl bg-white/10 backdrop-blur-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-lg text-lg transition-all duration-300 ease-in-out hover:bg-white/15"
                placeholder="Search for artists, bands, or music..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
        </div>
    );
}
