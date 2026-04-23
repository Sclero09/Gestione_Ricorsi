import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NuovoRicorso() {
  const [folderName, setFolderName] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setStatus('Creazione in corso...');
    
    try {
      const response = await fetch('/api/recurrents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_name: folderName }),
      });
      
      if (response.ok) {
        setStatus('Cliente e cartella creati con successo!');
        timerRef.current = setTimeout(() => navigate('/'), 2000);
      } else {
        const err = await response.json();
        setStatus(`Errore: ${err.detail}`);
      }
    } catch (error) {
      setStatus('Errore di connessione al server.');
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      
      <div className="main-content">
        <main className="page-container">
          <div className="page-header">
            <h1 className="page-title">Nuovo Ricorso</h1>
            <p style={{ color: '#697386' }}>Crea un nuovo fascicolo per un ricorrente.</p>
          </div>

          <div style={{ 
            backgroundColor: '#fff', 
            padding: '32px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            maxWidth: '600px'
          }}>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Nome e Cognome Ricorrente (sarà il nome della cartella)
                </label>
                <input 
                  type="text" 
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Esempio: MOHAMED ALI"
                  required
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
                  type="submit"
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
                    gap: '8px'
                  }}
                >
                  <UserPlus size={18} />
                  Crea Pratica
                </button>
                
                <button 
                  type="button"
                  onClick={() => navigate('/')}
                  style={{
                    backgroundColor: '#fff',
                    color: '#697386',
                    border: '1px solid #e3e8ee',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Annulla
                </button>

                {status && <span style={{ fontSize: '14px', color: status.includes('Errore') ? '#d63031' : '#37b24d' }}>{status}</span>}
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
