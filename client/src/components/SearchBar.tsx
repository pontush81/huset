import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Section } from "@shared/schema";
import { Card } from "@/components/ui/card";

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Section[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  const { data: sections } = useQuery<Section[]>({
    queryKey: ['/api/sections'],
  });

  // Handle search query change
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    if (!sections) return;

    // Simple search implementation - searches title and content
    const results = sections.filter(section => 
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      section.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setSearchResults(results);
  }, [searchQuery, sections]);

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle navigation on result click
  const handleResultClick = (slug: string) => {
    setLocation(`/${slug}`);
    setSearchQuery("");
    setShowResults(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      <input
        type="text"
        placeholder="Sök i handboken..."
        className="pl-10 pr-4 py-2 rounded-lg text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-accent"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setShowResults(true)}
      />
      <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>

      {/* Search results dropdown */}
      {showResults && searchResults.length > 0 && (
        <Card className="absolute mt-1 w-full z-50 max-h-60 overflow-y-auto shadow-lg">
          <ul className="py-1">
            {searchResults.map((result) => (
              <li 
                key={result.id} 
                className="px-4 py-2 hover:bg-secondary cursor-pointer"
                onClick={() => handleResultClick(result.slug)}
              >
                <div className="font-medium">{result.title}</div>
                <div className="text-sm text-gray-500 truncate">
                  {result.content.substring(0, 60)}...
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
