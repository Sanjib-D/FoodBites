import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global fetch interceptor to append authorization token
const { fetch: originalFetch } = window;
Object.defineProperty(window, 'fetch', {
  configurable: true,
  writable: true,
  value: async (...args: Parameters<typeof originalFetch>) => {
    let [resource, config] = args;
    const token = localStorage.getItem('token');
    if (token) {
      if (!config) config = {};
      if (!config.headers) config.headers = {};
      if (config.headers instanceof Headers) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
      }
    }
    return originalFetch(resource, config);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
