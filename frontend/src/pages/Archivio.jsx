import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import FilePanel from '../components/FilePanel';
import { Search, User as UserIcon, MoreHorizontal, Check, Archive, RotateCcw } from 'lucide-react';

export default function Archivio() {
  const [appeals, setAppeals] = useState([]);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState(null); // { id, field }
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchAppeals();
    fetchSettings();

    const handleEsc = (event) => {
      if (event.keyCode === 27) setOpenMenuId(null);
    };
    const handleScroll = () => setOpenMenuId(null);
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('scroll', handleScroll, true);
    };
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch('/api/appeals/archived', { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await response.json();
      setAppeals(data || []);
      if (data && data.length > 0) {
        setSelectedAppeal(data[0]);
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
        // If it's unarchived, remove from local list
        if (data.is_archived === false || data.status) {
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

  const statusColors = {
    "Da Presentare":  { color: '#64748b', bg: '#f1f5f9' },
    "Presentato":     { color: '#2563eb', bg: '#eff6ff' },
    "Udienza Fissata":{ color: '#d97706', bg: '#fffbeb' },
    "Accolto":        { color: '#059669', bg: '#ecfdf5' },
    "Rigettato":      { color: '#dc2626', bg: '#fef2f2' },
    "Liquidato":      { color: '#7c3aed', bg: '#f5f3ff' },
    "Fatturato":      { color: '#0891b2', bg: '#ecfeff' },
    "Concluso":       { color: '#374151', bg: '#f3f4f6' },
  };

  const getStatusClass = (status) => {
    if (!status) return 'status-nuovo';
    const s = status.toLowerCase();
    if (s.includes('accolto') || s.includes('concluso')) return 'status-accolto';
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
        <header className="top-bar" style={{ backgroundColor: 'var(--sidebar-bg)', borderBottom: '1px solid var(--border-color)' }}>
          <div className="search-container" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Cerca nell'archivio..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ backgroundColor: 'transparent', color: 'var(--text-main)' }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Archivio Pratiche</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sola consultazione e ripristino</div>
            </div>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--sidebar-active)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' 
            }}>
              <Archive style={{margin: 'auto'}} size={20} />
            </div>
          </div>
        </header>

        <main className="page-container">
          <div className="page-header">
            <h1 className="page-title">Pratiche Archiviate</h1>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#697386' }}>Caricamento archivio...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>Ricorrente</th>
                  <th style={{ width: '15%' }}>Data Presentazione</th>
                  <th style={{ width: '15%' }}>RG</th>
                  <th style={{ width: '15%' }}>Data Udienza</th>
                  <th style={{ width: '15%' }}>Tribunale</th>
                  <th style={{ width: '15%' }}>Stato</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredAppeals.map((appeal, index) => (
                  <tr 
                    key={appeal.id} 
                    onClick={() => handleSelectAppeal(appeal)}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: selectedAppeal?.id === appeal.id ? '#fcfdfe' : 'transparent',
                      borderLeft: selectedAppeal?.id === appeal.id ? '4px solid #64748b' : 'none'
                    }}
                  >
                    <td style={{ fontWeight: '600', color: '#1e293b' }}>{appeal.name}</td>
                    <td>{appeal.presentation_date || '-'}</td>
                    <td>{appeal.rg_number || '-'}</td>
                    <td>{appeal.hearing_date || '-'}</td>
                    <td>{appeal.court || '-'}</td>
                    <td>
                      <div className={`status-badge ${getStatusClass(appeal.status)}`}>
                        {appeal.status}
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openMenuId === appeal.id) {
                            setOpenMenuId(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const menuHeight = 340;
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const top = spaceBelow < menuHeight ? rect.top - menuHeight : rect.bottom + 4;
                            setMenuPos({ top, left: rect.right - 220 });
                            setOpenMenuId(appeal.id);
                          }
                        }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#697386' }}
                      >
                        <MoreHorizontal size={20} />
                      </button>

                      {openMenuId === appeal.id && (
                        <>
                          <div 
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }} 
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div style={{ 
                            position: 'fixed',
                            top: `${menuPos.top}px`,
                            left: `${menuPos.left}px`,
                            zIndex: 9999,
                            width: '220px',
                            background: 'white',
                            border: '1px solid #eef2f7',
                            borderRadius: '10px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                            padding: '6px 0'
                          }}>
                             {statusOptions.map(opt => {
                               const sc = statusColors[opt] || { color: '#1e293b', bg: '#f1f5f9' };
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
                                     gap: '10px',
                                     fontWeight: isActive ? '700' : '600',
                                     backgroundColor: isActive ? sc.bg : 'transparent',
                                     padding: '10px 16px',
                                     color: sc.color
                                   }}
                                 >
                                   <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: sc.color, flexShrink: 0 }}></div>
                                   {opt}
                                   {isActive && <Check size={14} style={{ marginLeft: 'auto', color: sc.color }} />}
                                 </div>
                               );
                             })}
                             <div style={{ borderTop: '1px solid #eef2f7', margin: '4px 0' }}></div>
                             <div 
                               className="dropdown-item"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleUpdateStatus(appeal.id, { is_archived: false });
                                 setOpenMenuId(null);
                               }}
                               style={{ 
                                 color: '#059669', 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 gap: '10px', 
                                 fontWeight: '700',
                                 padding: '12px 16px',
                                 backgroundColor: '#f0fdf4'
                               }}
                             >
                               <RotateCcw size={16} />
                               Ripristina Pratica
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
        appeal={selectedAppeal}
        onRefresh={() => fetchAppeals()}
        showCopyFeedback={() => {
          setCopyFeedback(true);
          setTimeout(() => setCopyFeedback(false), 2000);
        }}
      />
    </div>
  );
}
