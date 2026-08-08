import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Empêcher le zoom (Ctrl + Scroll / Ctrl + +/-)
document.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('keydown', (e) => {
  // On empêche SEULEMENT le zoom IN (+) pour éviter de tout casser.
  // On laisse le zoom OUT (-) et RESET (0) au cas où l'utilisateur serait bloqué en mode zoom.
  if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
    e.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
