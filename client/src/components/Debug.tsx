import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Debug() {
  const [apiStatus, setApiStatus] = useState("Checking API...");
  
  const { data: sections, isLoading, isError } = useQuery({
    queryKey: ['/api/sections'],
    retry: 5,
    staleTime: 10000,
  });
  
  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch('/api/sections');
        const data = await response.json();
        if (data && Array.isArray(data)) {
          setApiStatus(`API working! Found ${data.length} sections`);
        } else {
          setApiStatus(`API responded but returned unexpected data: ${JSON.stringify(data)}`);
        }
      } catch (err) {
        setApiStatus(`API error: ${err.message}`);
      }
    };
    
    checkApi();
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
      maxWidth: '300px'
    }}>
      <h4>Debug Info</h4>
      <p><strong>API Status:</strong> {apiStatus}</p>
      <p><strong>Query Status:</strong> {isLoading ? 'Loading...' : isError ? 'Error!' : 'Success'}</p>
      <p><strong>Sections:</strong> {sections ? sections.length : 'None'}</p>
      <button onClick={() => window.location.reload()}>Reload Page</button>
    </div>
  );
} 