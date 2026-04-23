import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Save, FolderSearch } from 'lucide-react';

export default function Settings() {
  const [basePath, setBasePath] = useState('');
  const [lawyerName, setLawyerName] = useState('');
  const [studioName, setStudioName] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/settings');
      const data = await response.json();
      setBasePath(data.base_path || '');
      setLawyerName(data.lawyer_name || '');
      setStudioName(data.studio_name || '');
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async () => {
    setStatus('Salvataggio...');
    try {
      const response = await fetch('/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          base_path: basePath,
          lawyer_name: lawyerName,
          studio_name: studioName
        }),
      });
      if (response.ok) {
        setStatus('Salvato con successo!');
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (error) {
      setStatus('Errore nel salvataggio.');
    }
  };

  const handleSelectFolder = async () => {
    try {
      const response = await fetch('/select_folder', { method: 'POST' });
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
      const response = await fetch('/scan', { method: 'POST' });
      if (response.ok) {
        setStatus('Scansione completata!');
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (error) {
      setStatus('Errore durante la scansione.');
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      
      <div className="main-content">
        <main className="page-container">
          <div className="page-header">
            <h1 className="page-title">Impostazioni</h1>
            <p style={{ color: '#697386' }}>Configura il tuo ambiente di lavoro.</p>
          </div>

          <div style={{ 
            backgroundColor: '#fff', 
            padding: '32px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            maxWidth: '600px'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                Percorso Cartella Base
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                    type="text" 
                    value={basePath}
                    onChange={(e) => setBasePath(e.target.value)}
                    placeholder="C:\Users\...\Doc"
                    style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e3e8ee',
                    fontSize: '14px',
                    outline: 'none'
                    }}
                />
                <button 
                    onClick={handleSelectFolder}
                    style={{
                        padding: '0 20px',
                        borderRadius: '8px',
                        border: '1px solid #e3e8ee',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    Sfoglia...
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#697386', marginTop: '8px' }}>
                Questa è la cartella che contiene le sottocartelle dei tuoi ricorrenti.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                Nome Avvocato
              </label>
              <input 
                type="text" 
                value={lawyerName}
                onChange={(e) => setLawyerName(e.target.value)}
                placeholder="Avv. Mario Rossi"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e3e8ee',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                Nome Studio / Studio Legale
              </label>
              <input 
                type="text" 
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder="Studio Legale Rossi"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e3e8ee',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button 
                onClick={handleSave}
                style={{
                  backgroundColor: '#2e5bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Save size={18} />
                Salva Percorso
              </button>

              <button 
                onClick={handleScan}
                style={{
                  backgroundColor: '#fff',
                  color: '#2e5bff',
                  border: '1px solid #2e5bff',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FolderSearch size={18} />
                Avvia Scansione
              </button>

              {status && <span style={{ fontSize: '14px', color: '#37b24d' }}>{status}</span>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
