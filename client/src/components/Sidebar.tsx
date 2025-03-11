import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Section } from "@shared/schema";
import SearchBar from "./SearchBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  isOpen: boolean;
  currentSection: string;
}

export default function Sidebar({ isOpen, currentSection }: SidebarProps) {
  const [location, setLocation] = useLocation();

  const { data: sections, isLoading } = useQuery<Section[]>({
    queryKey: ['/api/sections'],
  });

  // Handle navigation and close sidebar on mobile
  const handleNavClick = (slug: string) => {
    setLocation(`/${slug}`);
  };

  return (
    <aside 
      id="sidebar" 
      className={`w-64 bg-white shadow-md fixed h-full left-0 top-0 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 transition-transform duration-300 z-30 overflow-y-auto pt-16`}
    >
      <div className="p-4">
        <div className="mb-6">
          <div className="md:hidden relative mb-4">
            {/* Mobile search */}
            <SearchBar />
          </div>
          
          <h2 className="font-semibold text-lg mb-2">Innehåll</h2>
          <nav>
            <ul>
              {isLoading ? (
                // Skeleton loading state
                Array(5).fill(0).map((_, i) => (
                  <li key={i} className="mb-1">
                    <div className="flex items-center py-2 px-3">
                      <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                      <Skeleton className="h-4 w-24 rounded" />
                    </div>
                  </li>
                ))
              ) : (
                // Navigation links
                <>
                  {sections?.map((section) => (
                    <li key={section.id} className="mb-1">
                      <a 
                        href={`#${section.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavClick(section.slug);
                        }}
                        className={`block py-2 px-3 rounded ${
                          currentSection === section.slug 
                            ? 'bg-secondary font-medium' 
                            : 'hover:bg-secondary'
                        } transition-colors duration-200 nav-link`}
                      >
                        <i className={`fas ${section.icon} mr-2 text-primary`}></i>
                        {section.title}
                      </a>
                      
                      {/* Lägg till 'Hantera bokningar' under Gästlägenhet */}
                      {section.slug === "gastlagenhet" && (
                        <Link href="/admin/bokningar" 
                          className={`block py-2 px-3 ml-4 rounded ${
                            location.includes("/admin/bokningar") 
                              ? 'bg-secondary font-medium' 
                              : 'hover:bg-secondary'
                          } transition-colors duration-200 nav-link text-sm`}
                        >
                          <i className="fas fa-calendar-check mr-2 text-primary"></i>
                          Hantera bokningar
                        </Link>
                      )}
                    </li>
                  ))}
                </>
              )}
            </ul>
          </nav>
          
          {/* Administratörssektionen */}
          <div className="mt-8">
            <Separator className="my-4" />
            <h2 className="font-semibold text-lg mb-2">Administration</h2>
            <nav>
              <ul>
                <li className="mb-1">
                  <Link href="/admin/dashboard" 
                    className={`block py-2 px-3 rounded ${
                      location.includes("/admin/dashboard") 
                        ? 'bg-secondary font-medium' 
                        : 'hover:bg-secondary'
                    } transition-colors duration-200 nav-link`}
                  >
                    <i className="fas fa-gauge mr-2 text-primary"></i>
                    Admin Dashboard
                  </Link>
                </li>
                <li className="mb-1">
                  <Link href="/admin/bokningar" 
                    className={`block py-2 px-3 rounded ${
                      location.includes("/admin/bokningar") 
                        ? 'bg-secondary font-medium' 
                        : 'hover:bg-secondary'
                    } transition-colors duration-200 nav-link`}
                  >
                    <i className="fas fa-calendar-alt mr-2 text-primary"></i>
                    Bokningar
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}
