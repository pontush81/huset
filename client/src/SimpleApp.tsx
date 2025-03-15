import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Define types without using the shared schema
interface Section {
  id: number;
  title: string;
  slug: string;
  content: string;
  icon: string;
  updatedAt: string;
}

// Create a new QueryClient
const queryClient = new QueryClient();

// Simple Sidebar component
const Sidebar = ({ sections, activeSectionSlug, setActiveSectionSlug, isMobileMenuOpen, setIsMobileMenuOpen }: { 
  sections: Section[]; 
  activeSectionSlug: string | null;
  setActiveSectionSlug: (slug: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}) => {
  const handleSectionClick = (slug: string) => {
    setActiveSectionSlug(slug);
    // Close mobile menu when selection is made on small screens
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block fixed md:static top-14 left-0 right-0 bottom-0 md:w-64 bg-gray-100 p-4 border-r border-gray-200 overflow-auto z-20`}>
      <div className="font-bold text-xl mb-4">BRF Handbok</div>
      <ul>
        {sections.map((section) => (
          <li key={section.id} className="mb-2">
            <button
              onClick={() => handleSectionClick(section.slug)}
              className={`w-full text-left p-2 rounded ${
                activeSectionSlug === section.slug ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
              }`}
            >
              <i className={`fas ${section.icon} mr-2`}></i> {section.title}
            </button>
          </li>
        ))}
      </ul>
      
      {/* Admin link at the bottom of sidebar */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <a 
          href="/admin" 
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
        >
          <i className="fas fa-cog mr-1"></i> Admin
        </a>
      </div>
    </div>
  );
};

// Edit section component
const EditSection = ({ 
  section, 
  onSave, 
  onCancel,
  debugMode = false
}: { 
  section: Section, 
  onSave: (updatedSection: Partial<Section>) => void, 
  onCancel: () => void,
  debugMode?: boolean
}) => {
  const [content, setContent] = useState(section.content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedLocally, setSavedLocally] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    setSavedLocally(false);

    try {
      await onSave({ content });
      // If we reach here, the save was successful
      setSaveSuccess(true);
      
      // If in debug mode, keep the form open
      if (!debugMode) {
        setTimeout(() => {
          onCancel();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error saving section:', err);
      setError(err.message || "Det gick inte att spara ändringarna. Försök igen.");
      setSaving(false);
      
      // Check if error message indicates local saving
      if (err.message && (
        err.message.includes('sparats lokalt') || 
        err.message.includes('404') || 
        err.message.includes('401')
      )) {
        setSavedLocally(true);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-4">Redigera {section.title}</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4 border-l-4 border-red-500">
          <p className="font-bold">Meddelande:</p>
          <p>{error}</p>
          {error.includes('404') && (
            <p className="mt-2 text-sm">
              API-slutpunkten för att spara kunde inte hittas. Dina ändringar sparas automatiskt lokalt i webbläsaren istället.
            </p>
          )}
        </div>
      )}
      
      {saveSuccess && (
        <div className="bg-green-50 text-green-700 p-3 rounded mb-4 border-l-4 border-green-500">
          <p className="font-bold">Sparat!</p>
          {savedLocally ? (
            <p>Ändringarna har sparats lokalt i webbläsaren och kommer att visas när du återkommer till sidan.</p>
          ) : (
            <p>Ändringarna har sparats till servern.</p>
          )}
          {debugMode && <p className="text-sm mt-1">(Debug-läge är aktivt)</p>}
        </div>
      )}
      
      {debugMode && !error && !saveSuccess && (
        <div className="bg-blue-50 text-blue-700 p-3 rounded mb-4 border-l-4 border-blue-500">
          <p className="font-bold">Debug-läge är aktivt</p>
          <p>Ändringar kommer att sparas lokalt i din webbläsare.</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Innehåll
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={saving}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={saving}
          >
            Avbryt
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={saving}
          >
            {saving ? 'Sparar...' : 'Spara'}
          </button>
        </div>
        
        {debugMode && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm font-mono">
            <p className="font-bold">Debug Info:</p>
            <p>Section ID: {section.id}</p>
            <p>Section Slug: {section.slug}</p>
            <p>Content Length: {content.length} characters</p>
            <p>Local Storage Active: Yes</p>
            <p>Saved Locally: {savedLocally ? 'Yes' : 'No'}</p>
          </div>
        )}
      </form>
    </div>
  );
};

// Upload document component
const UploadDocument = ({ sectionId }: { sectionId: number }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('sectionId', sectionId.toString());

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Uppladdningen misslyckades');
      }

      // Reload the page to show the new document
      window.location.reload();
    } catch (err) {
      setError('Det gick inte att ladda upp dokumentet. Försök igen.');
      setUploading(false);
    }
  };

  return (
    <div className="mt-4">
      <label htmlFor="document-upload" className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
        <span className="mr-2">
          <i className="fas fa-upload"></i>
        </span>
        <span>Ladda upp Dokument</span>
        <input
          id="document-upload"
          type="file"
          className="sr-only"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

// Simple Content component
const Content = ({ 
  section, 
  onEditSection 
}: { 
  section: Section | null,
  onEditSection: (section: Section) => void
}) => {
  if (!section) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="text-center text-gray-500">
          <i className="fas fa-book text-4xl mb-4"></i>
          <h2 className="text-xl font-semibold">Välkommen till BRF Handboken</h2>
          <p className="mt-2">Välj en sektion från menyn för att börja.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 overflow-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">
          <i className={`fas ${section.icon} mr-2`}></i> {section.title}
        </h1>
        <button 
          onClick={() => onEditSection(section)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center md:justify-start w-full sm:w-auto"
        >
          <i className="fas fa-edit mr-2"></i> Redigera
        </button>
      </div>
      <div 
        className="prose max-w-none" 
        dangerouslySetInnerHTML={{ __html: section.content }}
      />
    </div>
  );
};

// Local storage helper functions
const localStorageHelpers = {
  getSavedSections: (): Section[] => {
    try {
      const saved = localStorage.getItem('brf_handbook_sections');
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
      return [];
    }
  },
  
  saveSections: (sections: Section[]): void => {
    try {
      localStorage.setItem('brf_handbook_sections', JSON.stringify(sections));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  },
  
  getAuthToken: (): string | null => {
    try {
      return localStorage.getItem('brf_handbook_auth_token');
    } catch (err) {
      console.error('Failed to get auth token from localStorage:', err);
      return null;
    }
  },
  
  saveAuthToken: (token: string): void => {
    try {
      localStorage.setItem('brf_handbook_auth_token', token);
    } catch (err) {
      console.error('Failed to save auth token to localStorage:', err);
    }
  },
  
  mergeWithLocalStorage: (apiSections: Section[]): Section[] => {
    const localSections = localStorageHelpers.getSavedSections();
    
    // If no local data, just return API data
    if (localSections.length === 0) return apiSections;
    
    // Merge data - prefer local content when available
    return apiSections.map(apiSection => {
      const localSection = localSections.find(s => s.id === apiSection.id);
      if (localSection) {
        return { 
          ...apiSection, 
          content: localSection.content,
          updatedAt: localSection.updatedAt
        };
      }
      return apiSection;
    });
  }
};

// Main App component
const App = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionSlug, setActiveSectionSlug] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);
  
  // New state for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Auth token state
  const [authToken, setAuthToken] = useState<string | null>(localStorageHelpers.getAuthToken());

  // Check for debug mode
  useEffect(() => {
    if (window.location.search.includes('debug=true')) {
      setDebugMode(true);
      console.log('Debug mode enabled via URL');
    }
    
    // Check for auth token in URL if present
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('auth_token');
    if (tokenFromUrl) {
      console.log('Auth token found in URL, saving');
      setAuthToken(tokenFromUrl);
      localStorageHelpers.saveAuthToken(tokenFromUrl);
    }
    
    // Check for existing local storage data
    const localSections = localStorageHelpers.getSavedSections();
    if (localSections.length > 0) {
      console.log('Found locally saved section data');
    }
  }, []);

  // Fetch sections from API and merge with local storage
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch('/api/sections');
        if (!response.ok) {
          throw new Error('Failed to fetch sections');
        }
        const apiData = await response.json();
        
        // Merge with local storage data if any exists
        const mergedData = localStorageHelpers.mergeWithLocalStorage(apiData);
        setSections(mergedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching sections:', err);
        setError('Failed to load sections. Please try again later.');
        setLoading(false);
        setApiAvailable(false);
        
        // If API fails, try to load from localStorage as fallback
        const localSections = localStorageHelpers.getSavedSections();
        if (localSections.length > 0) {
          console.log('Using locally saved data as fallback');
          setSections(localSections);
          setError(null);
          setDebugMode(true); // Enable debug mode automatically when API fails
        }
      }
    };

    fetchSections();
  }, []);

  // Update active section when slug changes
  useEffect(() => {
    if (activeSectionSlug && sections.length > 0) {
      const section = sections.find((s) => s.slug === activeSectionSlug);
      setActiveSection(section || null);
    } else {
      setActiveSection(null);
    }
  }, [activeSectionSlug, sections]);

  const handleEditSection = (section: Section) => {
    setEditingSection(section);
  };

  const handleSaveSection = async (updatedSection: Partial<Section>) => {
    if (!editingSection) return;
    
    // Create an updated section object
    const updatedData = {
      ...editingSection,
      ...updatedSection,
      updatedAt: new Date().toISOString()
    };

    // Always save to localStorage as a backup
    const updatedSections = sections.map(s => 
      s.id === updatedData.id ? updatedData : s
    );
    localStorageHelpers.saveSections(updatedSections);
    
    // If debug mode is active or API previously failed, use local storage only
    if (debugMode || !apiAvailable) {
      console.log('Debug mode or API unavailable - saving locally only');
      
      // Update sections with the updated one
      setSections(updatedSections);
      
      // If the active section was updated, update it as well
      if (activeSection && activeSection.id === updatedData.id) {
        setActiveSection(updatedData);
      }
      
      return;
    }
    
    // If not in debug mode, try API
    try {
      // Create headers with auth token if available
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Basic ${btoa(`:${authToken}`)}`;
      }
      
      // First, attempt to use the official admin API endpoint
      console.log('Trying to save to admin API endpoint...');
      let response = await fetch(`/api/admin/sections/${editingSection.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updatedSection),
      });

      // If the PATCH method is not supported, try PUT instead
      if (response.status === 405) { // Method Not Allowed
        console.log('PATCH not supported, trying PUT instead');
        response = await fetch(`/api/admin/sections/${editingSection.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(updatedData),
        });
      }
      
      // If auth is required but missing or invalid
      if (response.status === 401) {
        console.log('Authentication required, trying non-admin endpoint');
        // Fall back to regular endpoint without auth
        response = await fetch(`/api/sections/${editingSection.id}`, {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(updatedSection),
        });
      }

      // If admin endpoint not found, try standard endpoint
      if (response.status === 404) {
        console.log('Admin API endpoint not found, trying standard endpoint...');
        response = await fetch(`/api/sections/${editingSection.id}`, {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(updatedSection),
        });
      }

      // If we still get an error, switch to local storage mode
      if (!response.ok) {
        if (response.status === 404) {
          // API endpoint not found - automatically switch to local storage mode
          console.log('API endpoint not found (404) - activating local storage mode');
          setDebugMode(true);
          setApiAvailable(false);
          
          // We already saved to localStorage above, so let the changes apply
          setSections(updatedSections);
          
          // If the active section was updated, update it as well
          if (activeSection && activeSection.id === updatedData.id) {
            setActiveSection(updatedData);
          }
          
          // Throw error for UI feedback
          throw new Error(`API-slutpunkten för att spara hittades inte (404). Dina ändringar har sparats lokalt i webbläsaren istället och kommer att finnas kvar när du återkommer till sidan.`);
        } else if (response.status === 401) {
          throw new Error(`Autentisering krävs (401). Dina ändringar har sparats lokalt i webbläsaren istället. Logga in som administratör för att spara permanent.`);
        } else {
          throw new Error(`Kunde inte spara till servern (${response.status}): ${response.statusText}. Dina ändringar har sparats lokalt i webbläsaren istället.`);
        }
      }

      // Parse the response from the API
      const apiResponseData = await response.json();
      
      // Update sections with the updated one from API
      setSections(
        sections.map((s) => (s.id === apiResponseData.id ? apiResponseData : s))
      );

      // If the active section was updated, update it as well
      if (activeSection && activeSection.id === apiResponseData.id) {
        setActiveSection(apiResponseData);
      }

    } catch (err: any) {
      console.error('Error updating section:', err);
      throw err;
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="h-14 bg-white shadow flex items-center justify-center">
          <div className="animate-pulse h-6 w-36 bg-gray-200 rounded"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <i className="fas fa-spinner fa-spin text-blue-600 text-4xl mb-4"></i>
            <p>Laddar innehåll...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && sections.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="h-14 bg-white shadow flex items-center justify-center">
          <div className="font-bold">BRF Handbok</div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border-l-4 border-red-500 max-w-lg mx-auto">
            <h2 className="text-lg font-semibold mb-2">Ett fel uppstod</h2>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Försök igen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile header */}
      <div className="h-14 bg-white shadow flex items-center justify-between px-4 md:hidden sticky top-0 z-30">
        <div className="font-bold">BRF Handbok</div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md hover:bg-gray-100"
          aria-label={isMobileMenuOpen ? "Stäng meny" : "Öppna meny"}
        >
          {isMobileMenuOpen ? (
            <i className="fas fa-times"></i>
          ) : (
            <i className="fas fa-bars"></i>
          )}
        </button>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          sections={sections} 
          activeSectionSlug={activeSectionSlug} 
          setActiveSectionSlug={setActiveSectionSlug}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        {editingSection ? (
          <div className="flex-1 p-4 md:p-8 overflow-auto">
            <EditSection 
              section={editingSection}
              onSave={handleSaveSection}
              onCancel={handleCancelEdit}
              debugMode={debugMode}
            />
          </div>
        ) : (
          <Content 
            section={activeSection} 
            onEditSection={handleEditSection}
          />
        )}
      </div>
      
      {/* Admin footer link - hidden on smaller screens where it would already be in sidebar */}
      <div className="hidden md:block fixed bottom-2 right-4">
        <a 
          href="/admin" 
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center opacity-60 hover:opacity-100"
          title="Admin Dashboard"
        >
          <i className="fas fa-cog mr-1"></i>
          <span className="sr-only">Admin</span>
        </a>
      </div>
    </div>
  );
};

// Wrapped app with React Query provider
const WrappedApp = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
};

export default WrappedApp; 