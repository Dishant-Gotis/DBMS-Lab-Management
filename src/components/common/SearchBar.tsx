import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search...',
}) => {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative flex items-center">
      <FiSearch className="absolute left-3 text-slate-400 pointer-events-none" size={14} />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 placeholder-slate-400 text-slate-700 transition-colors"
      />
    </div>
  );
};
