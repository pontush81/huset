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
  // Filter out any potentially invalid sections
  const validSections = sections.filter(section => section && typeof section.id === 'number');
  
  console.log('===== SIDEBAR DEBUG - SECTIONS COUNT ====', validSections.length);
  
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
        {validSections.map((section) => (
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
    console.log('===== MERGING WITH LOCAL STORAGE =====');
    console.log('Original API sections count:', apiSections?.length || 'undefined');
    
    // Safety check - make sure we have a valid array to work with
    if (!Array.isArray(apiSections)) {
      console.error('API sections is not an array:', apiSections);
      return []; // Return empty array if input is invalid
    }
    
    // Ensure we're working with valid sections only
    console.log('Filtering invalid API sections');
    const validApiSections = apiSections.filter((section, index) => {
      if (!section) {
        console.warn(`Filtering out null/undefined API section at index ${index}`);
        return false;
      }
      
      // Ensure we have a valid ID (must be a number)
      const valid = typeof section.id === 'number';
      if (!valid) {
        console.warn(`Filtering out invalid API section at index ${index}:`, section);
        console.warn('section.id type:', section.id ? typeof section.id : 'missing');
      }
      return valid;
    });
    
    console.log('Valid API sections count:', validApiSections.length);
    
    // Safety check - get local sections, with fallback to empty array
    let localSections = [];
    try {
      localSections = localStorageHelpers.getSavedSections();
      console.log('Raw local sections count:', localSections?.length || 'undefined');
    } catch (err) {
      console.error('Error loading from localStorage:', err);
    }
    
    // Safety check - ensure localSections is an array
    if (!Array.isArray(localSections)) {
      console.error('Local sections is not an array:', localSections);
      localSections = []; // Reset to empty array if invalid
    }
    
    // Filter local sections to ensure they have valid IDs
    console.log('Filtering invalid local sections');
    const validLocalSections = localSections.filter((section, index) => {
      if (!section) {
        console.warn(`Filtering out null/undefined local section at index ${index}`);
        return false;
      }
      
      // Ensure we have a valid ID (must be a number)
      const valid = typeof section.id === 'number';
      if (!valid) {
        console.warn(`Filtering out invalid local section at index ${index}:`, section);
        console.warn('section.id type:', section.id ? typeof section.id : 'missing');
      }
      return valid;
    });
    
    console.log('Valid local sections count:', validLocalSections.length);
    
    // If no valid local data, just return valid API data
    if (validLocalSections.length === 0) {
      console.log('No valid local data, returning valid API data only');
      return validApiSections;
    }
    
    // If no valid API data, return local data
    if (validApiSections.length === 0) {
      console.log('No valid API data, returning valid local data only');
      return validLocalSections;
    }
    
    console.log('Merging API data with local data');
    
    // Merge data - prefer local content when available
    try {
      // Use a safer approach - first convert to a map for faster lookups
      const localSectionsMap = new Map();
      validLocalSections.forEach(section => {
        if (section && typeof section.id === 'number') {
          localSectionsMap.set(section.id, section);
        }
      });
      
      // Process each API section, merging with local if available
      const mergedSections = validApiSections.map(apiSection => {
        // This is safe because we already filtered out invalid sections
        const sectionId = apiSection.id;
        const localSection = localSectionsMap.get(sectionId);
        
        // If we have a local version, merge content and updatedAt
        if (localSection) {
          console.log(`Found matching local section for ID ${sectionId}`);
          return { 
            ...apiSection, 
            content: localSection.content,
            updatedAt: localSection.updatedAt
          };
        }
        
        // No local version, use API version as is
        return apiSection;
      });
      
      console.log('Final merged sections count:', mergedSections.length);
      return mergedSections;
    } catch (error) {
      console.error('Error during merge operation:', error);
      // In case of error, return the API data as fallback
      return validApiSections;
    }
  }
};

// Utility function to safely debug log complex objects
const safeLog = (label: string, data: any) => {
  try {
    console.log(`${label} [v1.1]:`, 
      JSON.stringify(data, (key, value) => 
        value === undefined ? 'undefined' : value, 2)
    );
  } catch (err) {
    console.log(`${label} (stringify failed):`, data);
  }
};

// Utility function to check if a section is valid
const isValidSection = (section: any): boolean => {
  const valid = section && typeof section === 'object' && typeof section.id === 'number';
  if (!valid && section) {
    console.warn('Invalid section detected:', section);
    console.warn('section.id type:', section?.id ? typeof section.id : 'missing');
  }
  return valid;
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
      console.log('===== FETCHING SECTIONS =====');
      try {
        console.log('Making API request to /api/sections');
        const response = await fetch('/api/sections');
        
        if (!response.ok) {
          console.error('API request failed with status:', response.status);
          throw new Error('Failed to fetch sections');
        }
        
        console.log('API response status:', response.status);
        const apiData = await response.json();
        console.log('Raw API response data count:', apiData?.length || 'undefined');
        
        // Log each section from API to check for problems
        if (Array.isArray(apiData)) {
          console.log('Checking sections from API:');
          apiData.forEach((section, index) => {
            safeLog(`API section ${index}`, section);
            if (!isValidSection(section)) {
              console.warn(`Invalid section at index ${index} in API response`);
            }
          });
        } else {
          console.error('API did not return an array:', apiData);
        }
        
        // Merge with local storage data if any exists
        console.log('Merging with localStorage');
        const mergedData = localStorageHelpers.mergeWithLocalStorage(apiData);
        console.log('Merged data count:', mergedData.length);
        
        // Verify final sections
        mergedData.forEach((section, index) => {
          if (!isValidSection(section)) {
            console.error(`Invalid section at index ${index} after merge:`, section);
          }
        });
        
        console.log('Setting sections state with merged data');
        setSections(mergedData);
        setLoading(false);
      } catch (err) {
        console.error('===== ERROR FETCHING SECTIONS =====');
        console.error('Error type:', err.constructor.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        console.error('Error fetching sections:', err);
        
        setError('Failed to load sections. Please try again later.');
        setLoading(false);
        setApiAvailable(false);
        
        // If API fails, try to load from localStorage as fallback
        const localSections = localStorageHelpers.getSavedSections();
        if (localSections.length > 0) {
          console.log('Using locally saved data as fallback, count:', localSections.length);
          
          // Validate local sections
          const validLocalSections = localSections.filter(section => {
            const valid = isValidSection(section);
            if (!valid) console.warn('Filtering out invalid local section:', section);
            return valid;
          });
          
          console.log('Valid local sections count:', validLocalSections.length);
          setSections(validLocalSections);
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

  const handleSaveSection = async () => {
    console.log('===== SAVING SECTION =====');
    
    // Safety check - ensure we have a section to edit
    if (!editingSection) {
      console.error('No editing section found - cannot save!');
      throw new Error('No editing section found');
    }
    
    const sectionToUpdate = { ...editingSection };
    console.log('Section to update:', sectionToUpdate);
    
    // Safety check - validate section has the required properties
    if (!sectionToUpdate || typeof sectionToUpdate.id !== 'number') {
      console.error('Invalid section to update:', sectionToUpdate);
      throw new Error('Invalid section data - missing id');
    }
    
    // Always update the local state first (optimistic update)
    try {
      // Update local state optimistically
      console.log('Updating sections in state');
      setSections(currentSections => {
        // Safety check - validate current sections are valid
        if (!Array.isArray(currentSections)) {
          console.error('Current sections is not an array:', currentSections);
          return [sectionToUpdate]; // Return just the current section if no valid array
        }
        
        // Create new array with updated section
        const newSections = currentSections.map(section => {
          // Safety check - skip null/undefined sections
          if (!section) {
            console.warn('Found null/undefined section while mapping');
            return null; // Will be filtered out later
          }
          
          // Update the matching section
          return section.id === sectionToUpdate.id ? sectionToUpdate : section;
        }).filter(Boolean); // Filter out any null values
        
        console.log('Updated sections count:', newSections.length);
        return newSections;
      });
      
      // Capture current sections for local storage update
      // This happens after the state update but before API call
      const currentSections = sections.filter(section => section && typeof section.id === 'number');
      
      console.log('Valid sections for localStorage:', currentSections.length);
      
      // Always update localStorage immediately
      localStorageHelpers.saveSections(currentSections);
      
      // Call API in the background
      let apiAvailable = true;
      let apiResponseData;
      
      try {
        // Create headers with auth if available
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add auth token if available (prevents 401 errors)
        const token = authToken;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          console.warn('No authentication token available');
        }
        
        console.log('Calling API to update section');
        const response = await fetch('/api/sections', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ section: sectionToUpdate })
        });
        
        if (!response.ok) {
          console.error(`API error: ${response.status} ${response.statusText}`);
          apiAvailable = false;
        } else {
          try {
            const jsonData = await response.json();
            
            // Safety check - validate response data
            if (!jsonData || !Array.isArray(jsonData.sections)) {
              console.error('Invalid API response format:', jsonData);
              apiAvailable = false;
            } else {
              apiResponseData = jsonData.sections;
              console.log('API response sections count:', apiResponseData.length);
              
              // Safety validation - filter out any invalid sections in the response
              const validApiSections = apiResponseData.filter(section => 
                section && typeof section.id === 'number'
              );
              
              if (validApiSections.length < apiResponseData.length) {
                console.warn(`Filtered out ${apiResponseData.length - validApiSections.length} invalid sections from API response`);
                apiResponseData = validApiSections;
              }
            }
          } catch (parseError) {
            console.error('Error parsing API response:', parseError);
            apiAvailable = false;
          }
        }
      } catch (error) {
        console.error('API request failed:', error);
        apiAvailable = false;
      }
      
      // If API is available and we got valid data, do a final state update
      if (apiAvailable && apiResponseData) {
        console.log('Updating state with API response data');
        setSections(apiResponseData);
      } else {
        console.warn('API unavailable or invalid response - using local data only');
        // State already updated optimistically above
      }
      
      // Always end editing mode
      setEditingSection(null);
      
      console.log('Section save completed');
    } catch (error) {
      console.error('Error in handleSaveSection:', error);
      alert(`Error saving section: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
  };

  // Add defensive coding to filter out invalid sections before any operations
  const validSections = sections.filter(section => section && typeof section.id === 'number');
  
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
          sections={validSections} 
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