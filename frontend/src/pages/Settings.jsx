import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Save, FolderSearch, Sun, Moon } from 'lucide-react';

export default function Settings() {
  const [basePath, setBasePath] = useState('');
  const [lawyerName, setLawyerName] = useState('');
  const [studioName, setStudioName] = useState('');
  const [theme, setTheme] = useState('light');
  const [status, setStatus] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const applyTheme = (t) => {
    document.documentElement.setAttribute('data-theme', t);
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setBasePath(data.base_path || '');
      setLawyerName(data.lawyer_name || '');
      setStudioName(data.studio_name || '');
      setTheme(data.theme || 'light');
      applyTheme(data.theme || 'light');
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async () => {
    setStatus('Salvataggio...');
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_path: basePath,
          lawyer_name: lawyerName,
          studio_name: studioName,
          theme: theme
        }),
      });
      if (response.ok) {
        applyTheme(theme);
        setStatus('Salvato con successo!');
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (error) {
      setStatus('Errore nel salvataggio.');
    }
  };

  const handleSelectFolder = async () => {
    try {
      const response = await fetch('/api/select_folder', { method: 'POST' });
      const data = await response.json();
      if (data.path) {
        setBasePath(data.path);
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleScan = async () => {
    setStatus('Scansione in corso...');
    try {
      const response = await fetch('/api/scan', { method: 'POST' });
      if (response.ok) {
        setStatus('Scansione completata!');
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (error) {
      setStatus('Errore durante la scansione.');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e3e8ee',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    fontWeight: '600',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#1e293b'
  };

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="main-content">
        <main className="page-container">
          <div className="page-header">
            <h1 className="page-title">Impostazioni</h1>
            <p style={{ color: '#697386' }}>Configura il tuo ambiente di lavoro.</p>
          </div>

          <div style={{
            backgroundColor: 'var(--white)',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-md)',
            maxWidth: '600px'
          }}>

            {/* === TEMA === */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ ...labelStyle, fontSize: '14px' }}>
                Tema Applicazione
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  onClick={() => setTheme('light')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: `2px solid ${theme === 'light' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                    backgroundColor: 'var(--white)',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <Sun size={18} style={{ color: '#f59e0b', marginBottom: '4px' }} />
                  <div style={{ fontSize: '12px', fontWeight: '700' }}>Chiaro</div>
                </div>

                <div
                  onClick={() => setTheme('dark')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: `2px solid ${theme === 'dark' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <Moon size={18} style={{ color: '#a5b4fc', marginBottom: '4px' }} />
                  <div style={{ fontSize: '12px', fontWeight: '700', color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}>Scuro</div>
                </div>
              </div>
            </div>

            {/* Divisore */}
            <div style={{ borderTop: '1px solid #eef2f7', marginBottom: '24px' }}></div>

            {/* === PERCORSO CARTELLA === */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Percorso Cartella Base</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  value={basePath}
                  onChange={(e) => setBasePath(e.target.value)}
                  placeholder="C:\Users\...\Ricorsi"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={handleSelectFolder}
                  style={{
                    padding: '0 20px',
                    borderRadius: '8px',
                    border: '1px solid #e3e8ee',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Sfoglia...
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#697386', marginTop: '8px' }}>
                Questa è la cartella che contiene le sottocartelle dei tuoi ricorrenti.
              </p>
            </div>

            {/* === NOME AVVOCATO === */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Nome Avvocato</label>
              <input
                type="text"
                value={lawyerName}
                onChange={(e) => setLawyerName(e.target.value)}
                placeholder="Avv. Mario Rossi"
                style={inputStyle}
              />
            </div>

            {/* === NOME STUDIO === */}
            <div style={{ marginBottom: '32px' }}>
              <label style={labelStyle}>Nome Studio / Studio Legale</label>
              <input
                type="text"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder="Studio Legale Rossi"
                style={inputStyle}
              />
            </div>

            {/* === PULSANTI === */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleSave}
                style={{
                  backgroundColor: '#2e5bff',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px'
                }}
              >
                <Save size={18} />
                Salva Impostazioni
              </button>

              <button
                onClick={handleScan}
                style={{
                  backgroundColor: '#fff',
                  color: '#2e5bff',
                  border: '1px solid #2e5bff',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px'
                }}
              >
                <FolderSearch size={18} />
                Avvia Scansione
              </button>

              {status && (
                <span style={{
                  fontSize: '14px',
                  color: status.includes('Errore') ? '#ef4444' : '#37b24d',
                  fontWeight: '600'
                }}>
                  {status}
                </span>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
