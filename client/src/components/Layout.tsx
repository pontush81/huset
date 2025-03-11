import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import SearchBar from "./SearchBar";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Section } from "@shared/schema";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const [currentSection, setCurrentSection] = useState<string>("hem");

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const menuToggle = document.getElementById('menu-toggle');
      
      if (sidebar && menuToggle) {
        const isClickInsideSidebar = sidebar.contains(event.target as Node);
        const isClickOnMenuToggle = menuToggle.contains(event.target as Node);
        
        if (!isClickInsideSidebar && !isClickOnMenuToggle && window.innerWidth < 768) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Update current section based on location
  useEffect(() => {
    const path = location.slice(1); // Remove leading slash
    if (path) {
      setCurrentSection(path);
    } else {
      setCurrentSection("hem");
    }
  }, [location]);

  // Fetch sections for breadcrumbs and footer
  const { data: sections } = useQuery<Section[]>({
    queryKey: ['/api/sections'],
  });
  
  // Fetch footer data specifically
  const { data: footerSection } = useQuery<Section>({
    queryKey: ['/api/sections/footer'],
  });
  
  // Parse footer data
  const footerData = (() => {
    try {
      if (footerSection?.content) {
        return JSON.parse(footerSection.content);
      }
      return null;
    } catch (e) {
      console.error("Error parsing footer data:", e);
      return null;
    }
  })();

  // Find current section title for breadcrumbs
  const currentSectionTitle = sections?.find(s => s.slug === currentSection)?.title || 
                              (currentSection === "hem" ? "Hem" : currentSection);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <button id="menu-toggle" className="mr-4 md:hidden" onClick={toggleSidebar}>
              <i className="fas fa-bars text-xl"></i>
            </button>
            <Link href="/">
              <h1 className="text-xl font-semibold cursor-pointer">BRF Handbok</h1>
            </Link>
          </div>
          <div className="flex items-center">
            <div className="relative hidden md:block">
              <SearchBar />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-grow">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} currentSection={currentSection} />

        {/* Main Content */}
        <main className="flex-grow md:ml-64 p-4">
          <div className="container mx-auto max-w-4xl">
            {/* Breadcrumbs */}
            <div className="text-sm mb-6 text-gray-500">
              <Link href="/" className="hover:text-primary">Hem</Link>
              {currentSection !== "hem" && (
                <>
                  <span className="mx-2">/</span>
                  <span className="text-primary">{currentSectionTitle}</span>
                </>
              )}
            </div>

            {/* Page content */}
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-primary text-white py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-semibold mb-2">BRF Ellagården</h3>
              {footerData?.address && <p className="text-sm opacity-80">{footerData.address}</p>}
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
              {footerData?.email && (
                <a href={`mailto:${footerData.email}`} className="text-sm opacity-80 hover:opacity-100">
                  <i className="fas fa-envelope mr-2"></i>{footerData.email}
                </a>
              )}
              {footerData?.phone && (
                <a href={`tel:${footerData.phone.replace(/[^0-9+]/g, '')}`} className="text-sm opacity-80 hover:opacity-100">
                  <i className="fas fa-phone mr-2"></i>{footerData.phone}
                </a>
              )}
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/20 text-center text-sm opacity-70">
            {footerData?.copyright && <p>{footerData.copyright}</p>}
          </div>
        </div>
      </footer>
    </div>
  );
}
