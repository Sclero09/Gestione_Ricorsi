import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Archivio from './pages/Archivio';
import Nuovo from './pages/Nuovo';
import Clienti from './pages/Clienti';
import Settings from './pages/Settings';
import './index.css';

function App() {
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.theme) {
          document.documentElement.setAttribute('data-theme', data.theme);
        }
      } catch (err) {
        console.error('Failed to load theme:', err);
      }
    };
    fetchTheme();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/archivio" element={<Archivio />} />
        <Route path="/nuovo" element={<Nuovo />} />
        <Route path="/clienti" element={<Clienti />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
