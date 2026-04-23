import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Folder, Edit3 } from 'lucide-react';

export default function Clienti() {
  const [recurrents, setRecurrents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecurrents();
  }, []);

  const fetchRecurrents = async () => {
    try {
      const response = await fetch('/recurrents');
      const data = await response.json();
      setRecurrents(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch recurrents:', error);
      setRecurrents([]);
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      
      <div className="main-content">
        <main className="page-container">
          <div className="page-header">
            <h1 className="page-title">Clienti</h1>
            <p style={{ color: '#697386' }}>Elenco completo dei ricorrenti registrati.</p>
          </div>

          {loading ? (
            <div>Caricamento...</div>
          ) : Array.isArray(recurrents) && recurrents.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cognome e Nome</th>
                  <th>Cartella Locale</th>
                  <th>Data Registrazione</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {recurrents.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: '600' }}>{r.surname} {r.name}</td>
                    <td style={{ fontSize: '12px', color: '#697386' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Folder size={14} />
                        {r.folder_name}
                      </div>
                    </td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      <button style={{ 
                        border: 'none', 
                        background: 'transparent', 
                        color: '#2e5bff', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px'
                      }}>
                        <Edit3 size={14} />
                        Rinomina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px', color: '#697386' }}>
              Nessun cliente trovato. Prova ad avviare una scansione o crea un nuovo ricorso.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
