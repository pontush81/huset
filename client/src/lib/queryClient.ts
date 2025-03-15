import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to normalize API URLs for both development and production
function normalizeApiUrl(url: string): string {
  return url.startsWith('/api/') 
    ? (window.location.hostname === 'localhost' ? url : `/api${url.substring(4)}`)
    : url;
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { headers?: Record<string, string> }
): Promise<T> {
  const isFormData = data instanceof FormData;
  const headers: Record<string, string> = options?.headers || {};
  
  // Only set Content-Type to application/json if not FormData
  if (data && !isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Fix API url path for production environment
  const apiUrl = normalizeApiUrl(url);
  
  console.log('Making API request to:', apiUrl);

  const res = await fetch(apiUrl, {
    method,
    headers,
    body: isFormData ? data as FormData : data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  // Parse and return JSON data from response
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    const params = queryKey[1];
    
    // Add query parameters if present
    if (params && typeof params === 'object') {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      const queryString = searchParams.toString();
      if (queryString) {
        url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }
    
    // Fix API url path for production environment
    const apiUrl = normalizeApiUrl(url);
    console.log('Query function requesting:', apiUrl);
    
    const res = await fetch(apiUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
