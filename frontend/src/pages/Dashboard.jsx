import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import FilePanel from '../components/FilePanel';
import { Search, User as UserIcon, MoreHorizontal, Check, Archive } from 'lucide-react';

export default function Dashboard() {
  const [appeals, setAppeals] = useState([]);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState(null); // { id, field }
  const [openMenuId, setOpenMenuId] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchAppeals();
    fetchSettings();

    const handleEsc = (event) => {
      if (event.keyCode === 27) setOpenMenuId(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchAppeals = async () => {
    try {
      const response = await fetch('/api/appeals');
      const data = await response.json();
      setAppeals(data || []);
      if (data && data.length > 0) {
        handleSelectAppeal(data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch appeals:', error);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, data) => {
    try {
      const response = await fetch(`/api/appeals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        if (data.is_archived === true) {
          setAppeals(appeals.filter(a => a.id !== id));
          if (selectedAppeal?.id === id) {
            setSelectedAppeal(null);
          }
        } else {
          setAppeals(appeals.map(a => a.id === id ? { ...a, ...data } : a));
          if (selectedAppeal?.id === id) {
            setSelectedAppeal({ ...selectedAppeal, ...data });
          }
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSelectAppeal = async (appeal) => {
    setSelectedAppeal(appeal);
  };

  const handleInlineEdit = (e, appealId, field) => {
    if (e.key === 'Enter') {
      handleUpdateStatus(appealId, { [field]: e.target.value });
      setEditingCell(null);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const filteredAppeals = (appeals || []).filter(appeal => {
    const search = searchTerm.toLowerCase();
    const nameMatch = (appeal.name || "").toLowerCase().includes(search);
    const rgMatch = (appeal.rg_number || "").toLowerCase().includes(search);
    const courtMatch = (appeal.court || "").toLowerCase().includes(search);
    return nameMatch || rgMatch || courtMatch;
  });

  const statusOptions = ["Da Presentare", "Presentato", "Udienza Fissata", "Accolto", "Rigettato", "Liquidato", "Fatturato", "Concluso"];

  const getStatusClass = (status) => {
    if (!status) return 'status-nuovo';
    const s = status.toLowerCase();
    if (s.includes('accolto')) return 'status-accolto';
    if (s.includes('rigettato')) return 'status-rigettato';
    if (s.includes('liquidato')) return 'status-liquidato';
    if (s.includes('fatturato')) return 'status-fatturato';
    if (s.includes('presentato') && !s.includes('da')) return 'status-presentato';
    if (s.includes('udienza')) return 'status-udienza-fissata';
    return `status-${s.replace(/ /g, '-')}`;
  };

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="main-content">
        <header className="top-bar">
          <div className="search-container">
            <Search size={18} color="#697386" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Cerca per nome, RG o tribunale..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {copyFeedback && (
              <div style={{ 
                backgroundColor: '#10b981', color: '#fff', padding: '6px 12px', 
                borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                animation: 'fadeInOut 2s forwards'
              }}>
                Dati pratica copiati!
              </div>
            )}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>{settings?.lawyer_name || 'Caricamento...'}</div>
              <div style={{ fontSize: '12px', color: '#697386' }}>{settings?.studio_name || ''}</div>
            </div>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eef4ff', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2e5bff' 
            }}>
              <UserIcon style={{margin: 'auto'}} size={20} />
            </div>
          </div>
        </header>

        <main className="page-container">
          <div className="page-header">
            <h1 className="page-title">Gestione Ricorsi</h1>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#697386' }}>Caricamento dati...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>Ricorrente</th>
                  <th style={{ width: '15%' }}>Data Presentazione</th>
                  <th style={{ width: '15%' }}>Repertorio Generale (RG)</th>
                  <th style={{ width: '15%' }}>Data Udienza</th>
                  <th style={{ width: '15%' }}>Tribunale</th>
                  <th style={{ width: '15%' }}>Stato</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredAppeals.map((appeal) => (
                  <tr 
                    key={appeal.id} 
                    onClick={() => handleSelectAppeal(appeal)}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: selectedAppeal?.id === appeal.id ? '#fcfdfe' : 'transparent',
                      borderLeft: selectedAppeal?.id === appeal.id ? '4px solid #2e5bff' : 'none'
                    }}
                  >
                    <td style={{ fontWeight: '600', color: '#1e293b' }}>{appeal.name}</td>
                    
                    <td onClick={(e) => { e.stopPropagation(); setEditingCell({id: appeal.id, field: 'presentation_date'}); }}>
                      {editingCell?.id === appeal.id && editingCell?.field === 'presentation_date' ? (
                        <input 
                          autoFocus
                          defaultValue={appeal.presentation_date || ''}
                          onKeyDown={(e) => handleInlineEdit(e, appeal.id, 'presentation_date')}
                          onBlur={() => setEditingCell(null)}
                          style={{ width: '100%', padding: '4px', border: '1px solid #2e5bff', borderRadius: '4px' }}
                        />
                      ) : (
                        appeal.presentation_date || <span style={{color: '#ccd3db'}}>Inserisci...</span>
                      )}
                    </td>

                    <td onClick={(e) => { e.stopPropagation(); setEditingCell({id: appeal.id, field: 'rg_number'}); }}>
                      {editingCell?.id === appeal.id && editingCell?.field === 'rg_number' ? (
                        <input 
                          autoFocus
                          defaultValue={appeal.rg_number || ''}
                          onKeyDown={(e) => handleInlineEdit(e, appeal.id, 'rg_number')}
                          onBlur={() => setEditingCell(null)}
                          style={{ width: '100%', padding: '4px', border: '1px solid #2e5bff', borderRadius: '4px' }}
                        />
                      ) : (
                        appeal.rg_number || <span style={{color: '#ccd3db'}}>Inserisci...</span>
                      )}
                    </td>

                    <td onClick={(e) => { e.stopPropagation(); setEditingCell({id: appeal.id, field: 'hearing_date'}); }}>
                      {editingCell?.id === appeal.id && editingCell?.field === 'hearing_date' ? (
                        <input 
                          autoFocus
                          defaultValue={appeal.hearing_date || ''}
                          onKeyDown={(e) => handleInlineEdit(e, appeal.id, 'hearing_date')}
                          onBlur={() => setEditingCell(null)}
                          style={{ width: '100%', padding: '4px', border: '1px solid #2e5bff', borderRadius: '4px' }}
                        />
                      ) : (
                        appeal.hearing_date || <span style={{color: '#ccd3db'}}>Inserisci...</span>
                      )}
                    </td>

                    <td onClick={(e) => { e.stopPropagation(); setEditingCell({id: appeal.id, field: 'court'}); }} style={{ fontSize: '13px' }}>
                      {editingCell?.id === appeal.id && editingCell?.field === 'court' ? (
                        <input 
                          autoFocus
                          defaultValue={appeal.court || ''}
                          onKeyDown={(e) => handleInlineEdit(e, appeal.id, 'court')}
                          onBlur={() => setEditingCell(null)}
                          style={{ width: '100%', padding: '4px', border: '1px solid #2e5bff', borderRadius: '4px' }}
                        />
                      ) : (
                        appeal.court || <span style={{color: '#ccd3db'}}>Inserisci...</span>
                      )}
                    </td>
                    
                    <td>
                      <div className={`status-badge ${getStatusClass(appeal.status)}`}>
                        {appeal.status}
                      </div>
                    </td>

                    <td style={{ position: 'relative' }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === appeal.id ? null : appeal.id);
                        }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#697386' }}
                      >
                        <MoreHorizontal size={20} />
                      </button>

                      {openMenuId === appeal.id && (
                        <>
                          <div 
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} 
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="status-dropdown" style={{ zIndex: 100 }}>
                            {statusOptions.map(opt => {
                              const sClass = getStatusClass(opt);
                              const isActive = appeal.status === opt;
                              return (
                                <div 
                                  key={opt}
                                  className="dropdown-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(appeal.id, { status: opt });
                                    setOpenMenuId(null);
                                  }}
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px',
                                    fontWeight: isActive ? '700' : '500',
                                    backgroundColor: sClass.includes('da-presentare') ? '#f1f5f9' : 
                                                    sClass.includes('presentato') ? '#eff6ff' :
                                                    sClass.includes('udienza') ? '#fffbeb' :
                                                    (sClass.includes('accolto') || sClass.includes('concluso')) ? '#ecfdf5' :
                                                    sClass.includes('rigettato') ? '#fef2f2' :
                                                    sClass.includes('liquidato') ? '#f5f3ff' :
                                                    sClass.includes('fatturato') ? '#faf5ff' : '#f1f5f9',
                                    color: sClass.includes('da-presentare') ? '#64748b' : 
                                           sClass.includes('presentato') ? '#2563eb' :
                                           sClass.includes('udienza') ? '#d97706' :
                                           (sClass.includes('accolto') || sClass.includes('concluso')) ? '#059669' :
                                           sClass.includes('rigettato') ? '#dc2626' :
                                           sClass.includes('liquidato') ? '#7c3aed' :
                                           sClass.includes('fatturato') ? '#9333ea' : '#64748b',
                                    borderLeft: `4px solid ${isActive ? 'currentColor' : 'transparent'}`,
                                    padding: '10px 16px',
                                    margin: '2px 4px',
                                    borderRadius: '6px'
                                  }}
                                >
                                  {opt}
                                  {isActive && <Check size={14} style={{ marginLeft: 'auto' }} />}
                                </div>
                              );
                            })}
                            <div style={{ borderTop: '1px solid #eef2f7', margin: '4px 0' }}></div>
                            <div 
                              className="dropdown-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(appeal.id, { is_archived: true });
                                setOpenMenuId(null);
                              }}
                              style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                              <Archive size={14} />
                              Archivia
                            </div>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>
      </div>

      <FilePanel 
        recurrentName={selectedAppeal?.name} 
        files={selectedFiles} 
        appeal={selectedAppeal}
        onUpdateStatus={handleUpdateStatus}
        showCopyFeedback={() => {
          setCopyFeedback(true);
          setTimeout(() => setCopyFeedback(false), 2000);
        }}
        onRefresh={() => fetchAppeals()}
      />
    </div>
  );
}
