import { useEffect, useState, useRef } from "react";
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
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const { data: sections, isLoading, isError, error } = useQuery<Section[]>({
    queryKey: ['/api/sections'],
    retry: 3,
    onSuccess: (data) => {
      console.log('Sections loaded successfully:', data);
    },
    onSettled: (_data, error) => {
      if (error) console.error('Error fetching sections:', error);
    }
  });
  
  // Debug sections data
  useEffect(() => {
    console.log('Sidebar sections data:', sections);
  }, [sections]);
  
  // Set header height and handle sidebar scroll positioning
  useEffect(() => {
    const header = document.querySelector('header');
    if (header) {
      setHeaderHeight(header.clientHeight);
    }
    
    const handleScroll = () => {
      if (!sidebarRef.current) return;
      
      const scrollY = window.scrollY;
      
      // On mobile, don't apply sticky behavior
      if (window.innerWidth < 768) return;
      
      if (scrollY > 0) {
        // Apply sticky behavior on desktop when scrolled
        const newTop = Math.max(0, headerHeight - scrollY);
        sidebarRef.current.style.top = `${newTop}px`;
      } else {
        // Reset positioning when at the top
        sidebarRef.current.style.top = `${headerHeight}px`;
      }
    };
    
    // Initial positioning
    handleScroll();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [headerHeight]);

  // Handle navigation with smooth scrolling to section
  const handleNavClick = (slug: string) => {
    // Special case for guest apartment (always go to dedicated page)
    if (slug === "gastlagenhet") {
      setLocation('/gastlagenhet');
      return;
    }
    
    // Om vi redan är på hemsidan, bara scrolla till sektionen
    if (location === '/' || location === '') {
      // Kortare fördröjning för att säkerställa att DOM-elementet finns
      setTimeout(() => {
        const element = document.getElementById(slug);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    } else {
      // Om vi är på en annan sida, gå till hemsidan först
      setLocation('/');
      // Vänta tills sidan laddas och scrolla sedan till rätt avsnitt
      setTimeout(() => {
        const element = document.getElementById(slug);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };
  
  // Handle admin navigation with wouter instead of direct URL
  const handleAdminClick = (path: string) => {
    setLocation(path);
  };
  
  // Close sidebar function
  const closeSidebar = () => {
    document.dispatchEvent(new Event('close-sidebar'));
  };

  return (
    <>
      {/* Overlay for mobile sidebar close */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-20 md:hidden" 
          onClick={closeSidebar}
        />
      )}
      
      <aside 
        ref={sidebarRef}
        id="sidebar" 
        style={{
          backgroundColor: "#ffffff", 
          background: "#ffffff", 
          color: "#333"
        }}
        className={`w-64 bg-white fixed h-full left-0 transform border-r shadow-md
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 transition-transform duration-300 z-30 overflow-y-auto pt-16`}
      >
        <div className="p-3 md:p-4 bg-white">
          <div className="mb-4 md:mb-6 bg-white">
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
                  // Navigation links using buttons instead of <a> for better mobile handling
                  <>
                    {sections && sections.map((section: Section) => (
                      <li key={section.id}>
                        <button 
                          onClick={() => {
                            handleNavClick(section.slug);
                            // Close sidebar on mobile
                            if (window.innerWidth < 768) {
                              closeSidebar();
                            }
                          }}
                          style={{
                            textAlign: 'left', 
                            width: '100%', 
                            backgroundColor: currentSection === section.slug ? '#f3f4f6' : 'white',
                            justifyContent: 'flex-start'
                          }}
                          className={`flex items-center text-sm md:text-base py-3 px-3 md:px-3 rounded touch-manipulation ${
                            currentSection === section.slug 
                              ? 'bg-secondary font-medium' 
                              : 'hover:bg-secondary'
                          } transition-colors duration-200 ios-tap-highlight-fix`}
                        >
                          <i className={`fas ${section.icon} mr-2 text-primary w-5 text-center`}></i>
                          <span className="truncate">{section.title}</span>
                        </button>
                      </li>
                    ))}
                  </>
                )}
              </ul>
            </nav>
            
            {/* Admin section */}
            <div className="mt-6 md:mt-8">
              <Separator className="my-3 md:my-4" />
              <h2 className="font-semibold text-base md:text-lg mb-2">Administration</h2>
              <nav>
                <ul className="space-y-0.5 md:space-y-1">
                  <li>
                    <button 
                      onClick={() => {
                        handleAdminClick('/admin/dashboard');
                        if (window.innerWidth < 768) {
                          closeSidebar();
                        }
                      }}
                      style={{
                        textAlign: 'left', 
                        width: '100%', 
                        backgroundColor: location.includes("/admin/dashboard") ? '#f3f4f6' : 'white',
                        justifyContent: 'flex-start'
                      }}
                      className={`flex items-center text-sm md:text-base py-3 px-3 md:px-3 rounded touch-manipulation ${
                        location.includes("/admin/dashboard") 
                          ? 'bg-secondary font-medium' 
                          : 'hover:bg-secondary'
                      } transition-colors duration-200 ios-tap-highlight-fix`}
                    >
                      <i className="fas fa-gauge mr-2 text-primary w-5 text-center"></i>
                      <span className="truncate">Admin Dashboard</span>
                    </button>
                  </li>

                </ul>
              </nav>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
