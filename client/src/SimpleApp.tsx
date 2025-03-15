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
const Sidebar = ({ sections, activeSectionSlug, setActiveSectionSlug }: { 
  sections: Section[]; 
  activeSectionSlug: string | null;
  setActiveSectionSlug: (slug: string) => void;
}) => {
  return (
    <div className="w-64 bg-gray-100 p-4 border-r border-gray-200 h-screen overflow-auto">
      <div className="font-bold text-xl mb-4">BRF Handbok</div>
      <ul>
        {sections.map((section) => (
          <li key={section.id} className="mb-2">
            <button
              onClick={() => setActiveSectionSlug(section.slug)}
              className={`w-full text-left p-2 rounded ${
                activeSectionSlug === section.slug ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
              }`}
            >
              <i className={`fas ${section.icon} mr-2`}></i> {section.title}
            </button>
          </li>
        ))}
      </ul>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await onSave({ content });
      // If we reach here, the save was successful
      setSaveSuccess(true);
      
      // If in debug mode, don't dismiss the form
      if (!debugMode) {
        setTimeout(() => {
          onCancel();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error saving section:', err);
      setError(err.message || "Det gick inte att spara ändringarna. Försök igen.");
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-4">Redigera {section.title}</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4 border-l-4 border-red-500">
          <p className="font-bold">Det uppstod ett fel:</p>
          <p>{error}</p>
          {error.includes('404') && (
            <p className="mt-2 text-sm">
              API-slutpunkten för att spara saknas. Dina ändringar kommer att sparas lokalt istället.
            </p>
          )}
        </div>
      )}
      
      {saveSuccess && (
        <div className="bg-green-50 text-green-700 p-3 rounded mb-4 border-l-4 border-green-500">
          <p>Ändringarna har sparats!</p>
          {debugMode && <p className="text-sm mt-1">(Ändringarna sparades lokalt)</p>}
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
  return (
    <div className="flex-1 p-8 overflow-auto h-screen">
      {section ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">
              <i className={`fas ${section.icon} mr-2`}></i> {section.title}
            </h1>
            <button
              onClick={() => onEditSection(section)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <i className="fas fa-edit mr-2"></i> Redigera
            </button>
          </div>
          <div className="prose max-w-none">{section.content}</div>
          
          <div className="mt-12 border-t pt-6">
            <h2 className="text-2xl font-bold mb-4">Dokument</h2>
            <div className="bg-gray-50 p-6 rounded-md border border-gray-200 text-center">
              <p className="text-gray-500">Inga dokument tillgängliga</p>
              <UploadDocument sectionId={section.id} />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-20">
          <p className="text-xl">Välj en sektion från menyn för att visa innehåll</p>
        </div>
      )}
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

  // Check for debug mode
  useEffect(() => {
    if (window.location.search.includes('debug=true')) {
      setDebugMode(true);
      console.log('Debug mode enabled via URL');
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
      // First, attempt to use the official API endpoint
      let response = await fetch(`/api/sections/${editingSection.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSection),
      });

      // If the PATCH method is not supported, try PUT instead
      if (response.status === 405) { // Method Not Allowed
        console.log('PATCH not supported, trying PUT instead');
        response = await fetch(`/api/sections/${editingSection.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedData),
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
          throw new Error(`API-slutpunkten hittades inte (404). Dina ändringar har sparats lokalt istället.`);
        } else {
          throw new Error(`Kunde inte spara (${response.status}): ${response.statusText}`);
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-700">Laddar innehåll...</p>
        </div>
      </div>
    );
  }

  if (error && sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <p className="text-xl">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar 
        sections={sections} 
        activeSectionSlug={activeSectionSlug} 
        setActiveSectionSlug={setActiveSectionSlug} 
      />
      {editingSection ? (
        <div className="flex-1 p-8 overflow-auto">
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