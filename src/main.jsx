import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SnackbarProvider } from './providers/SnackbarProvider'; // Importa el provider

ReactDOM.createRoot(document.getElementById('root')).render(
  <SnackbarProvider>
    <App />
  </SnackbarProvider>
);
