import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// Import axios configuration and fetch interceptor to ensure all HTTP requests use interceptors
import './utils/axiosConfig';
import './utils/fetchInterceptor';

// Import axios configuration and fetch interceptor BEFORE any other imports
import './utils/axiosConfig';
import './utils/fetchInterceptor';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
