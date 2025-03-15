import { useState, useEffect } from "react";

export default function Debug() {
  const [apiStatus, setApiStatus] = useState("Checking API...");
  const [sections, setSections] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const checkApi = async () => {
      try {
        console.log("Debug: Testing API connection...");
        
        // First, try the health endpoint
        try {
          const healthResponse = await fetch('/api/health');
          const healthData = await healthResponse.json();
          console.log("Health check response:", healthData);
        } catch (err) {
          console.warn("Health check failed:", err);
        }
        
        // Check sections endpoint with retries
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            const response = await fetch('/api/sections');
            if (!response.ok) {
              throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              throw new Error(`Expected JSON but got ${contentType}`);
            }
            
            const data = await response.json();
            console.log("API Response:", data);
            
            if (data && Array.isArray(data)) {
              setApiStatus(`API working! Found ${data.length} sections`);
              setSections(data);
              return; // Success, exit
            } else {
              throw new Error(`API responded but returned unexpected data: ${JSON.stringify(data)}`);
            }
          } catch (err) {
            retries++;
            console.error(`API request failed (attempt ${retries}/${maxRetries}):`, err);
            setApiStatus(`API error (attempt ${retries}/${maxRetries}): ${err instanceof Error ? err.message : String(err)}`);
            setError(err instanceof Error ? err.message : String(err));
            
            if (retries < maxRetries) {
              // Wait before retrying
              await new Promise(r => setTimeout(r, 1000 * retries));
            }
          }
        }
        
        if (retries >= maxRetries) {
          setApiStatus(`API could not be reached after ${maxRetries} attempts`);
        }
      } catch (err) {
        console.error("Debug component error:", err);
        setApiStatus(`Component error: ${err instanceof Error ? err.message : String(err)}`);
        setError(err instanceof Error ? err.message : String(err));
      }
    };
    
    checkApi();
    
    // Set up periodic checking
    const interval = setInterval(checkApi, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '10px',
      borderRadius: '5px',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      zIndex: 9999,
      maxWidth: expanded ? '80%' : '300px',
      maxHeight: expanded ? '80%' : '200px',
      overflow: 'auto'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>Debug Info</h4>
      <p><strong>API Status:</strong> {apiStatus}</p>
      <p><strong>Sections:</strong> {sections.length}</p>
      <p><strong>URL:</strong> {window.location.href}</p>
      <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: '5px 10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
        
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '5px 10px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </div>
      
      {expanded && sections.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h5>Available Sections:</h5>
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                {section.title} ({section.slug})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 