import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred.';

    if (error.response) {
      // Backend returned an error response
      const data = error.response.data;
      if (typeof data?.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data?.detail)) {
        // FastAPI validation errors (422)
        message = data.detail.map((err) => `${err.loc?.slice(-1)[0] || 'Field'}: ${err.msg}`).join(', ');
      } else if (typeof data === 'string') {
        message = data;
      } else {
        message = `Request failed with status ${error.response.status}`;
      }
    } else if (error.request) {
      // Network error or backend offline
      message = `Cannot connect to backend server at ${baseURL}. Please verify that the API is running.`;
    } else {
      message = error.message || message;
    }

    const enhancedError = new Error(message);
    enhancedError.status = error.response?.status;
    enhancedError.originalError = error;
    return Promise.reject(enhancedError);
  }
);

export default api;
