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

  // Handle navigation with smooth scrolling to section
  const handleNavClick = (slug: string) => {
    // Special case for guest apartment (always go to dedicated page)
    if (slug === "gastlagenhet") {
      window.location.href = `/gastlagenhet`;
      return;
    }
    
    // If we're already on the home page, just scroll to the section
    if (location === '/' || location === '') {
      const element = document.getElementById(slug);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // If element is not found, probably we need to go to home page
        window.location.href = `/#${slug}`;
      }
    } else {
      // If we're on another page, go to home page with hash
      window.location.href = `/#${slug}`;
    }
  };
  
  // Handle admin navigation with direct URL
  const handleAdminClick = (path: string) => {
    window.location.href = path;
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
        id="sidebar" 
        style={{
          backgroundColor: "#ffffff", 
          background: "#ffffff", 
          color: "#333",
          position: "sticky",
          top: "0",
          height: "100vh",
          overflowY: "auto"
        }}
        className={`w-64 bg-white border-r shadow-md
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          fixed md:sticky left-0 top-0 md:top-0 
          transform transition-transform duration-300 z-30 
          pt-16`}
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
                    {sections?.map((section) => (
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
                        
                        {/* Booking management under Guest Apartment */}
                        {section.slug === "gastlagenhet" && (
                          <button 
                            onClick={() => {
                              handleAdminClick('/admin/bokningar');
                              // Close sidebar on mobile
                              if (window.innerWidth < 768) {
                                closeSidebar();
                              }
                            }}
                            style={{
                              textAlign: 'left', 
                              width: '100%', 
                              backgroundColor: location.includes("/admin/bokningar") ? '#f3f4f6' : 'white',
                              justifyContent: 'flex-start'
                            }}
                            className={`flex items-center text-xs md:text-sm py-2.5 px-3 ml-4 rounded touch-manipulation ${
                              location.includes("/admin/bokningar") 
                                ? 'bg-secondary font-medium' 
                                : 'hover:bg-secondary'
                            } transition-colors duration-200 ios-tap-highlight-fix`}
                          >
                            <i className="fas fa-calendar-check mr-2 text-primary w-4 text-center"></i>
                            <span className="truncate">Hantera bokningar</span>
                          </button>
                        )}
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
                  <li>
                    <button 
                      onClick={() => {
                        handleAdminClick('/admin/bokningar');
                        if (window.innerWidth < 768) {
                          closeSidebar();
                        }
                      }}
                      style={{
                        textAlign: 'left', 
                        width: '100%', 
                        backgroundColor: location.includes("/admin/bokningar") ? '#f3f4f6' : 'white',
                        justifyContent: 'flex-start'
                      }}
                      className={`flex items-center text-sm md:text-base py-3 px-3 md:px-3 rounded touch-manipulation ${
                        location.includes("/admin/bokningar") 
                          ? 'bg-secondary font-medium' 
                          : 'hover:bg-secondary'
                      } transition-colors duration-200 ios-tap-highlight-fix`}
                    >
                      <i className="fas fa-calendar-alt mr-2 text-primary w-5 text-center"></i>
                      <span className="truncate">Bokningar</span>
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
