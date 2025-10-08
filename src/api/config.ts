// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    login: `${API_BASE_URL}/api/users/login`,
    users: `${API_BASE_URL}/api/users`,
    cases: `${API_BASE_URL}/api/cases`,
    progress: `${API_BASE_URL}/api/progress`,
    health: `${API_BASE_URL}/api/health`,
    sync: `${API_BASE_URL}/api/sync`,
  }
}

// Helper function to make API calls
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  // Remove leading slash from endpoint to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  const url = `${API_BASE_URL}/${cleanEndpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, { ...defaultOptions, ...options })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API call failed:', error)
    throw error
  }
}
