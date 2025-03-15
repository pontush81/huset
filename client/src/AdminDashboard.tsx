import React, { useEffect, useState } from 'react';

// Define types
interface Section {
  id: number;
  title: string;
  slug: string;
  content: string;
  icon: string;
  updatedAt: string;
}

interface AdminCredentials {
  password: string;
}

// Admin Dashboard component
const AdminDashboard = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState<AdminCredentials>({ password: '' });
  
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [newSection, setNewSection] = useState<Partial<Section>>({ title: '', content: '', icon: 'fa-file' });
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Authenticate admin
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Try to fetch dashboard data to test authentication
      const response = await fetch('/api/admin/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`:${credentials.password}`)}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSections(data.sections);
        setIsAuthenticated(true);
        setError(null);
      } else {
        setError('Invalid admin credentials');
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Error authenticating:', err);
      setError('An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch sections
  const fetchSections = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Basic ${btoa(`:${credentials.password}`)}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSections(data.sections);
        setError(null);
      } else {
        throw new Error('Failed to fetch sections');
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
      setError('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };
  
  // Create new section
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSection.title) {
      setError('Title is required');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`:${credentials.password}`)}`,
        },
        body: JSON.stringify(newSection),
      });
      
      if (response.ok) {
        const createdSection = await response.json();
        
        // Fetch updated sections list
        await fetchSections();
        
        // Reset new section form
        setNewSection({ title: '', content: '', icon: 'fa-file' });
        setShowNewSectionForm(false);
        setSuccessMessage(`Created new section: ${createdSection.title}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create section');
      }
    } catch (err: any) {
      console.error('Error creating section:', err);
      setError(err.message || 'Failed to create section');
    } finally {
      setLoading(false);
    }
  };
  
  // Update section
  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSection) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/sections/${editingSection.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`:${credentials.password}`)}`,
        },
        body: JSON.stringify(editingSection),
      });
      
      if (response.ok) {
        const updatedSection = await response.json();
        
        // Update sections list
        setSections(sections.map(s => 
          s.id === updatedSection.id ? updatedSection : s
        ));
        
        setEditingSection(null);
        setSuccessMessage(`Updated section: ${updatedSection.title}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update section');
      }
    } catch (err: any) {
      console.error('Error updating section:', err);
      setError(err.message || 'Failed to update section');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete section
  const handleDeleteSection = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this section?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/sections/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${btoa(`:${credentials.password}`)}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update sections list
        setSections(sections.filter(s => s.id !== id));
        setSuccessMessage(result.message || 'Section deleted successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete section');
      }
    } catch (err: any) {
      console.error('Error deleting section:', err);
      setError(err.message || 'Failed to delete section');
    } finally {
      setLoading(false);
    }
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded mb-4 border-l-4 border-red-500">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">BRF Handbok Admin</h1>
          <div className="flex space-x-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              View Site
            </button>
            <button 
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {successMessage && (
          <div className="bg-green-50 text-green-700 p-3 rounded mb-4 border-l-4 border-green-500">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-4 border-l-4 border-red-500">
            {error}
            <button 
              className="ml-2 text-sm underline" 
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Manage Sections</h2>
            <button
              onClick={() => setShowNewSectionForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add New Section
            </button>
          </div>
          
          {/* New Section Form */}
          {showNewSectionForm && (
            <div className="p-6 border-b border-gray-200">
              <form onSubmit={handleCreateSection}>
                <div className="mb-4">
                  <label htmlFor="new-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="new-title"
                    value={newSection.title}
                    onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="new-icon" className="block text-sm font-medium text-gray-700 mb-1">
                    Icon (Font Awesome class)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      id="new-icon"
                      value={newSection.icon}
                      onChange={(e) => setNewSection({ ...newSection, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {newSection.icon && (
                      <span className="ml-2">
                        <i className={`fas ${newSection.icon} text-xl`}></i>
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="new-content" className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    id="new-content"
                    value={newSection.content}
                    onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewSectionForm(false)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Section'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Edit Section Form */}
          {editingSection && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium mb-4">Edit Section: {editingSection.title}</h3>
              <form onSubmit={handleUpdateSection}>
                <div className="mb-4">
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    value={editingSection.title}
                    onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="edit-slug" className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    id="edit-slug"
                    value={editingSection.slug}
                    onChange={(e) => setEditingSection({ ...editingSection, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="edit-icon" className="block text-sm font-medium text-gray-700 mb-1">
                    Icon (Font Awesome class)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      id="edit-icon"
                      value={editingSection.icon}
                      onChange={(e) => setEditingSection({ ...editingSection, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {editingSection.icon && (
                      <span className="ml-2">
                        <i className={`fas ${editingSection.icon} text-xl`}></i>
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    id="edit-content"
                    value={editingSection.content}
                    onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Sections List */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sections.map((section) => (
                  <tr key={section.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {section.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <i className={`fas ${section.icon} mr-2 text-gray-400`}></i>
                        <div className="text-sm font-medium text-gray-900">
                          {section.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {section.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(section.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingSection(sections.find(s => s.id === section.id) || null)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard; 