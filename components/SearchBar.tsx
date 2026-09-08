import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, XIcon } from './icons/Icons';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  placeholder: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, placeholder }) => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSearchActive) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      searchInputRef.current?.blur();
    }
  }, [isSearchActive]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        // Only collapse the search bar if it's empty
        if (!searchQuery) {
          setIsSearchActive(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchQuery]); // Dependency on searchQuery ensures the logic uses the latest state

  return (
    <div
      ref={searchContainerRef}
      className={`relative h-10 sm:h-11 transition-all duration-500 ease-in-out bg-[#e0e5ec] ${
        isSearchActive
          ? 'w-48 sm:w-56 rounded-full shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_rgba(255,255,255,0.5)]'
          : 'w-10 sm:w-11 rounded-full shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_rgba(255,255,255,0.5)] cursor-pointer'
      }`}
      onClick={() => !isSearchActive && setIsSearchActive(true)}
    >
      <div
        className={`absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out ${
          isSearchActive ? 'left-3' : 'left-1/2 -translate-x-1/2'
        }`}
      >
        <SearchIcon className="w-5 h-5 text-slate-500" />
      </div>
      <input
        ref={searchInputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsSearchActive(true)}
        placeholder={placeholder}
        className={`w-full h-full pl-10 pr-8 bg-transparent outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-400 transition-opacity duration-300 ${
          isSearchActive ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!isSearchActive}
        tabIndex={isSearchActive ? 0 : -1}
      />
      {isSearchActive && searchQuery && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Prevent container onClick from firing
            setSearchQuery('');
            searchInputRef.current?.focus();
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded-full text-slate-500 hover:bg-slate-300/50"
          aria-label="Hapus pencarian"
        >
          <XIcon className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      )}
    </div>
  );
};