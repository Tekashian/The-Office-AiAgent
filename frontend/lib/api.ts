import axios from 'axios';
import { getAccessToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
    });
    
    // Get token from Supabase session
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token added to request');
    } else {
      console.warn('⚠️ No authentication token found');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      isNetworkError: error.message === 'Network Error',
    });
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.warn('⚠️ Unauthorized - redirecting to /auth');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
