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
      } md:translate-x-0 transition-transform duration-300 z-30 overflow-y-auto pt-14 md:pt-16`}
    >
      {/* Overlay för att stänga sidofältet på mobil när användaren trycker utanför */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-20 md:hidden" 
          onClick={() => document.dispatchEvent(new Event('close-sidebar'))}
        />
      )}
      
      <div className="p-3 md:p-4">
        <div className="mb-4 md:mb-6">
          <div className="md:hidden relative mb-4">
            {/* Mobile search */}
            <SearchBar />
          </div>
          
          <h2 className="font-semibold text-base md:text-lg mb-2">Innehåll</h2>
          <nav>
            <ul className="space-y-0.5 md:space-y-1">
              {isLoading ? (
                // Skeleton loading state
                Array(5).fill(0).map((_, i) => (
                  <li key={i}>
                    <div className="flex items-center py-2 px-2 md:px-3">
                      <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                      <Skeleton className="h-4 w-24 rounded" />
                    </div>
                  </li>
                ))
              ) : (
                // Navigation links
                <>
                  {sections?.map((section) => (
                    <li key={section.id}>
                      <a 
                        href={`#${section.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavClick(section.slug);
                          // Stäng sidofältet på mobila enheter efter navigation
                          if (window.innerWidth < 768) {
                            document.dispatchEvent(new Event('close-sidebar'));
                          }
                        }}
                        className={`flex items-center text-sm md:text-base py-3 px-3 md:px-3 rounded touch-manipulation ${
                          currentSection === section.slug 
                            ? 'bg-secondary font-medium' 
                            : 'hover:bg-secondary'
                        } transition-colors duration-200 nav-link ios-tap-highlight-fix`}
                      >
                        <i className={`fas ${section.icon} mr-2 text-primary w-5 text-center`}></i>
                        <span className="truncate">{section.title}</span>
                      </a>
                      
                      {/* Lägg till 'Hantera bokningar' under Gästlägenhet */}
                      {section.slug === "gastlagenhet" && (
                        <Link href="/admin/bokningar" 
                          onClick={() => {
                            // Stäng sidofältet på mobila enheter efter navigation
                            if (window.innerWidth < 768) {
                              document.dispatchEvent(new Event('close-sidebar'));
                            }
                          }}
                          className={`flex items-center text-xs md:text-sm py-2.5 md:py-2.5 px-3 md:px-3 ml-4 rounded touch-manipulation ${
                            location.includes("/admin/bokningar") 
                              ? 'bg-secondary font-medium' 
                              : 'hover:bg-secondary'
                          } transition-colors duration-200 nav-link ios-tap-highlight-fix`}
                        >
                          <i className="fas fa-calendar-check mr-2 text-primary w-4 text-center"></i>
                          <span className="truncate">Hantera bokningar</span>
                        </Link>
                      )}
                    </li>
                  ))}
                </>
              )}
            </ul>
          </nav>
          
          {/* Administratörssektionen */}
          <div className="mt-6 md:mt-8">
            <Separator className="my-3 md:my-4" />
            <h2 className="font-semibold text-base md:text-lg mb-2">Administration</h2>
            <nav>
              <ul className="space-y-0.5 md:space-y-1">
                <li>
                  <Link href="/admin/dashboard" 
                    onClick={() => {
                      // Stäng sidofältet på mobila enheter efter navigation
                      if (window.innerWidth < 768) {
                        document.dispatchEvent(new Event('close-sidebar'));
                      }
                    }}
                    className={`flex items-center text-sm md:text-base py-3 px-3 md:px-3 rounded touch-manipulation ${
                      location.includes("/admin/dashboard") 
                        ? 'bg-secondary font-medium' 
                        : 'hover:bg-secondary'
                    } transition-colors duration-200 nav-link ios-tap-highlight-fix`}
                  >
                    <i className="fas fa-gauge mr-2 text-primary w-5 text-center"></i>
                    <span className="truncate">Admin Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/bokningar" 
                    onClick={() => {
                      // Stäng sidofältet på mobila enheter efter navigation
                      if (window.innerWidth < 768) {
                        document.dispatchEvent(new Event('close-sidebar'));
                      }
                    }}
                    className={`flex items-center text-sm md:text-base py-3 px-3 md:px-3 rounded touch-manipulation ${
                      location.includes("/admin/bokningar") 
                        ? 'bg-secondary font-medium' 
                        : 'hover:bg-secondary'
                    } transition-colors duration-200 nav-link ios-tap-highlight-fix`}
                  >
                    <i className="fas fa-calendar-alt mr-2 text-primary w-5 text-center"></i>
                    <span className="truncate">Bokningar</span>
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
