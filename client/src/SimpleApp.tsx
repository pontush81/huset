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
  // Ultra-defensive check - if sections is not an array, use empty array
  const sectionsToUse = Array.isArray(sections) ? sections : [];
  
  // Filter out any potentially invalid sections
  const validSections = sectionsToUse.filter(section => section && typeof section.id === 'number');
  
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

// COMPLETELY REBUILT: Modern, reliable EditSection component
const EditSection = ({ 
  section, 
  onSave, 
  onCancel
}: { 
  section: Section, 
  onSave: (updatedData: { id: number, content: string }) => Promise<void>, 
  onCancel: () => void
}) => {
  // Store section ID at initialization to ensure we always have it
  const [sectionId] = useState<number>(section?.id);
  const [content, setContent] = useState<string>(section?.content || '');
  const [status, setStatus] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
    localOnly: boolean;
  }>({
    loading: false,
    error: null,
    success: false,
    localOnly: false
  });

  // Safety check - if somehow we got a null/undefined section or id
  if (!sectionId) {
    console.error("EditSection received invalid section:", section);
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p className="text-red-600 mb-4">Cannot edit section: Invalid section data.</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset status
    setStatus({
      loading: true,
      error: null,
      success: false,
      localOnly: false
    });

    try {
      console.log(`Submitting edit for section ID ${sectionId}`);
      
      // Always include section ID in the save data
      await onSave({ 
        id: sectionId, 
        content 
      });
      
      setStatus({
        loading: false,
        error: null,
        success: true,
        localOnly: false
      });
      
      // Auto-dismiss after successful save
      setTimeout(() => {
        onCancel();
      }, 1500);
      
    } catch (err) {
      console.error("Error saving section:", err);
      
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Failed to save changes. Please try again.";
      
      const isLocalSave = String(errorMessage).toLowerCase().includes('local');
      
      setStatus({
        loading: false,
        error: errorMessage,
        success: isLocalSave, // Show success even if it's a local-only save
        localOnly: isLocalSave
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-4">
        Edit Section {section?.title ? `"${section.title}"` : `#${sectionId}`}
      </h2>
      
      {status.error && !status.localOnly && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4 border-l-4 border-red-500">
          <p className="font-bold">Error:</p>
          <p>{status.error}</p>
        </div>
      )}
      
      {status.success && (
        <div className="bg-green-50 text-green-700 p-3 rounded mb-4 border-l-4 border-green-500">
          <p className="font-bold">Saved!</p>
          {status.localOnly ? (
            <p>Changes have been saved locally in your browser.</p>
          ) : (
            <p>Changes have been saved successfully.</p>
          )}
        </div>
      )}
      
      {status.error && status.localOnly && (
        <div className="bg-blue-50 text-blue-700 p-3 rounded mb-4 border-l-4 border-blue-500">
          <p className="font-bold">Offline Mode</p>
          <p>Your changes have been saved locally. They will appear in the app, but the server could not be reached.</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={status.loading}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={status.loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
            disabled={status.loading}
          >
            {status.loading ? 'Saving...' : 'Save'}
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>Section ID: {sectionId}</p>
          <p>Content Length: {content.length} characters</p>
        </div>
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

// Simple Content component with enhanced reliability
const Content = ({ 
  section, 
  onEditSection 
}: { 
  section: Section | null,
  onEditSection: (section: Section) => void
}) => {
  // Show welcome message if no section is selected
  if (!section || typeof section.id !== 'number') {
    return (
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="text-center text-gray-500">
          <i className="fas fa-book text-4xl mb-4"></i>
          <h2 className="text-xl font-semibold">Welcome to BRF Handbook</h2>
          <p className="mt-2">Select a section from the menu to get started.</p>
        </div>
      </div>
    );
  }

  // Destructure properties for safer access
  const { id, title, icon, content } = section;
  
  const handleEdit = () => {
    // Double check section validity before editing
    if (typeof id !== 'number' || !title) {
      console.error('Cannot edit invalid section:', section);
      return;
    }
    onEditSection(section);
  };
  
  return (
    <div className="flex-1 p-4 md:p-8 overflow-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">
          <i className={`fas ${icon} mr-2`}></i> {title}
        </h1>
        <button 
          onClick={handleEdit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center md:justify-start w-full sm:w-auto"
        >
          <i className="fas fa-edit mr-2"></i> Edit
        </button>
      </div>
      <div 
        className="prose max-w-none" 
        dangerouslySetInnerHTML={{ __html: content }}
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
    const validApiSections = apiSections.filter(isValidSection);
    
    console.log('Valid API sections count:', validApiSections.length);
    
    // Safety check - get local sections, with fallback to empty array
    let localSections: Section[] = [];
    try {
      localSections = localStorageHelpers.getSavedSections();
      console.log('Raw local sections count:', localSections?.length || 'undefined');
    } catch (err) {
      console.error('Error loading from localStorage:', err);
    }
    
    // Safety check - ensure localSections is an array with valid sections
    if (!Array.isArray(localSections)) {
      console.error('Local sections is not an array:', localSections);
      localSections = []; // Reset to empty array if invalid
    }
    
    // Filter local sections to ensure they have valid IDs
    console.log('Filtering invalid local sections');
    const validLocalSections = localSections.filter(isValidSection);
    
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
        if (isValidSection(section)) {
          localSectionsMap.set(section.id, section);
        }
      });
      
      // Process each API section, merging with local if available - USING SAFE MAP UTILITY
      const mergedSections = safeMapSections(validApiSections, apiSection => {
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
  if (!section) return false;
  if (typeof section !== 'object') return false;
  if (typeof section.id !== 'number') return false;
  return true;
};

// Ultra-safe array mapping utility - never fails even with bad data
const safeMapSections = (sections: any[], mapFn: (section: Section) => any, filterEmpty: boolean = true): any[] => {
  // Handle bad input
  if (!Array.isArray(sections)) {
    console.warn('safeMapSections received non-array input:', sections);
    return [];
  }
  
  try {
    // First filter out any invalid items
    const validSections = sections.filter(section => {
      const valid = isValidSection(section);
      if (!valid && section !== null && section !== undefined) {
        console.warn('Filtering out invalid section in safeMapSections:', section);
      }
      return valid;
    });
    
    // Then safely map over the valid items only
    const result = validSections.map(section => {
      try {
        return mapFn(section as Section);
      } catch (err) {
        console.error('Error in map function for section:', section, err);
        return null; // Return null for any mapping errors
      }
    });
    
    // Optionally filter out null/undefined results
    return filterEmpty ? result.filter(Boolean) : result;
  } catch (err) {
    console.error('Critical error in safeMapSections:', err);
    return []; // Return empty array as ultimate fallback
  }
};

// COMPLETELY REBUILT: Simplified App component with better state management
const App = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionSlug, setActiveSectionSlug] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [apiState, setApiState] = useState({
    isAvailable: true,
    isOffline: false,
    lastUpdated: new Date(),
    version: "1.2.0" // Version tracker to verify cache is refreshed
  });
  
  // New state for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Auth token state
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Check for auth token in URL/localStorage
  useEffect(() => {
    // Log the version to console to verify cache status
    console.log("BRF Handbook app version:", apiState.version);
    
    // Try to get token from localStorage first
    const storedToken = localStorage.getItem('brf_handbook_auth_token');
    if (storedToken) {
      setAuthToken(storedToken);
    }
    
    // Check for auth token in URL (overrides localStorage)
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('auth_token');
    if (tokenFromUrl) {
      setAuthToken(tokenFromUrl);
      localStorage.setItem('brf_handbook_auth_token', tokenFromUrl);
    }
  }, []);

  // Fetch sections from API and merge with local storage
  useEffect(() => {
    const fetchSections = async () => {
      try {
        console.log('Fetching sections from API');
        
        // First load from localStorage as a quick start
        const localSections = getLocalSections();
        if (localSections.length > 0) {
          console.log(`Found ${localSections.length} sections in localStorage`);
          setSections(localSections);
          setLoading(false);
        }
        
        // Then try API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/sections', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API error (${response.status})`);
        }
        
        const apiSections = await response.json();
        
        if (!Array.isArray(apiSections)) {
          throw new Error('API did not return an array');
        }
        
        console.log(`Received ${apiSections.length} sections from API`);
        
        // Validate sections
        const validSections = apiSections.filter(s => s && typeof s.id === 'number');
        
        // Merge with localStorage data to preserve any local edits
        const mergedSections = mergeSections(validSections, localSections);
        
        // Update states
        setSections(mergedSections);
        setApiState({
          isAvailable: true,
          isOffline: false,
          lastUpdated: new Date()
        });
        
      } catch (err) {
        console.error('Error fetching sections:', err);
        
        // Check if error is from API being offline
        const isOffline = err instanceof Error && (
          err.name === 'AbortError' || 
          err.message.includes('fetch') || 
          err.message.includes('network')
        );
        
        if (isOffline) {
          console.log('API appears to be offline, using localStorage data only');
          setApiState({
            isAvailable: false,
            isOffline: true,
            lastUpdated: new Date()
          });
        } else {
          setError('Failed to load sections. Using local data if available.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  // Get sections from localStorage
  const getLocalSections = (): Section[] => {
    try {
      const data = localStorage.getItem('brf_handbook_sections');
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      
      return parsed.filter(s => s && typeof s.id === 'number');
    } catch (err) {
      console.error('Error reading from localStorage:', err);
      return [];
    }
  };

  // Merge API sections with localStorage sections, preferring localStorage for edited sections
  const mergeSections = (apiSections: Section[], localSections: Section[]): Section[] => {
    if (!localSections.length) return apiSections;
    if (!apiSections.length) return localSections;
    
    // Create a map of local sections by ID for quick lookup
    const localSectionsMap = new Map(
      localSections.map(section => [section.id, section])
    );
    
    // For each API section, use the local version if it exists
    return apiSections.map(apiSection => {
      const localSection = localSectionsMap.get(apiSection.id);
      if (localSection) {
        // Use local content but keep other properties from API
        return { ...apiSection, content: localSection.content };
      }
      return apiSection;
    });
  };

  // Save sections to localStorage
  const saveToLocalStorage = (updatedSections: Section[]): boolean => {
    try {
      localStorage.setItem('brf_handbook_sections', JSON.stringify(updatedSections));
      return true;
    } catch (err) {
      console.error('Error saving to localStorage:', err);
      return false;
    }
  };

  // Update active section when slug changes or sections change
  useEffect(() => {
    if (!activeSectionSlug || !sections.length) {
      setActiveSection(null);
      return;
    }
    
    const section = sections.find(s => s.slug === activeSectionSlug);
    setActiveSection(section || null);
  }, [activeSectionSlug, sections]);

  // Handle edit section action
  const handleEditSection = (section: Section) => {
    if (!section || typeof section.id !== 'number') {
      console.error('Cannot edit invalid section:', section);
      return;
    }
    
    // Make a copy to avoid reference issues
    setEditingSection({...section});
  };

  // COMPLETELY REBUILT: Handle section save with simpler, more reliable approach
  const handleSaveSection = async (updateData: { id: number, content: string }) => {
    try {
      console.log(`=== DEBUG: Starting save operation for section ID ${updateData.id} ===`);
      
      if (!updateData.id) {
        throw new Error('Cannot save: Missing section ID');
      }
      
      // Find the section in our current state
      const sectionToUpdate = sections.find(s => s.id === updateData.id);
      
      if (!sectionToUpdate) {
        throw new Error(`Section with ID ${updateData.id} not found`);
      }
      
      // Create updated section object
      const updatedSection = {
        ...sectionToUpdate,
        content: updateData.content,
        updatedAt: new Date().toISOString()
      };
      
      // 1. First update the local state immediately for a responsive UX
      console.log('DEBUG: Updating local state');
      const updatedSections = sections.map(s => 
        s.id === updatedSection.id ? updatedSection : s
      );
      
      setSections(updatedSections);
      
      // 2. Always save to localStorage as a backup
      console.log('DEBUG: Saving to localStorage');
      const savedLocally = saveToLocalStorage(updatedSections);
      
      // If API is known to be offline, don't attempt API call
      if (apiState.isOffline) {
        console.log('API is offline, skipping API update');
        if (savedLocally) {
          return; // Success - saved locally
        } else {
          throw new Error('Failed to save changes locally');
        }
      }
      
      // 3. Try to update via API
      try {
        // Setup auth header if available
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        // Try different endpoints with different methods
        const endpoints = [
          { url: '/api/sections', method: 'PUT' },
          { url: '/api/admin/sections', method: 'PUT' },
          { url: `/api/sections/${updatedSection.id}`, method: 'PUT' },
          { url: `/api/admin/sections/${updatedSection.id}`, method: 'PUT' },
          { url: `/api/admin/sections/${updatedSection.id}`, method: 'PATCH' }
        ];
        
        let apiSuccess = false;
        
        for (const endpoint of endpoints) {
          try {
            console.log(`Trying ${endpoint.method} ${endpoint.url}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(endpoint.url, {
              method: endpoint.method,
              headers,
              body: JSON.stringify({ section: updatedSection }),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              console.log(`Success with ${endpoint.method} ${endpoint.url}`);
              apiSuccess = true;
              break;
            }
          } catch (endpointErr) {
            console.log(`Failed with ${endpoint.method} ${endpoint.url}`);
          }
        }
        
        if (!apiSuccess) {
          // API update failed but we already saved locally
          setApiState(prev => ({ ...prev, isOffline: true }));
          throw new Error('Changes saved locally, but could not save to server.');
        }
        
      } catch (apiErr) {
        // API failed, but we still saved locally
        console.error('API update failed:', apiErr);
        
        if (savedLocally) {
          throw new Error('Changes saved locally, but could not save to server.');
        } else {
          throw new Error('Failed to save changes.');
        }
      }
      
      // Clear editing state
      setEditingSection(null);
      
    } catch (err) {
      console.error('ERROR in handleSaveSection:', err);
      throw err; // Let the UI handle the error
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
  };
  
  // Filter out any invalid sections for safety
  const validSections = sections.filter(s => s && typeof s.id === 'number');

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="h-14 bg-white shadow flex items-center justify-center">
          <div className="animate-pulse h-6 w-36 bg-gray-200 rounded"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <i className="fas fa-spinner fa-spin text-blue-600 text-4xl mb-4"></i>
            <p>Loading content...</p>
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
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? (
            <i className="fas fa-times"></i>
          ) : (
            <i className="fas fa-bars"></i>
          )}
        </button>
      </div>

      {/* API status indicator */}
      {apiState.isOffline && (
        <div className="bg-blue-50 border-b border-blue-200 p-2 text-center text-sm text-blue-800">
          <i className="fas fa-info-circle mr-2"></i>
          App running in offline mode. Changes are saved locally in your browser.
        </div>
      )}

      {/* Version indicator to verify cache refresh */}
      <div className="hidden absolute top-0 right-0 text-xs text-gray-400 p-1" data-version={apiState.version}>
        v{apiState.version}
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