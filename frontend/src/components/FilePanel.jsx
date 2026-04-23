import React, { useState, useEffect } from 'react';
import { FileText, FolderOpen, ExternalLink, Eye, RefreshCw, Folder, ChevronLeft } from 'lucide-react';

const FilePanel = ({ recurrentName, appeal, showCopyFeedback, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [directoryItems, setDirectoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // When appeal changes, reset to the root folder of that appeal
  useEffect(() => {
    if (appeal?.folder_path) {
      setCurrentPath(appeal.folder_path);
    } else {
      setCurrentPath('');
      setDirectoryItems([]);
    }
  }, [appeal]);

  // Fetch directory items whenever currentPath changes
  useEffect(() => {
    if (currentPath) {
      fetchDirectory(currentPath);
    }
  }, [currentPath]);

  const fetchDirectory = async (path) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/list_directory?path=${encodeURIComponent(path)}`);
      if (response.ok) {
        const data = await response.json();
        setDirectoryItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch directory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIconInfo = (filename, isDir) => {
    if (isDir) return { color: "#fbbf24", label: "FOLDER" };
    const ext = (filename || '').toLowerCase().split('.').pop();
    if (ext === 'pdf') return { color: "#ef4444", label: "PDF" };
    if (['xls', 'xlsx', 'csv'].includes(ext)) return { color: "#10b981", label: "EXCEL" };
    if (['doc', 'docx'].includes(ext)) return { color: "#3b82f6", label: "WORD" };
    return { color: "#64748b", label: ext.toUpperCase() };
  };

  const handleItemClick = (item) => {
    if (item.is_dir) {
      setCurrentPath(item.path);
    } else {
      handleOpenFile(item.path);
    }
  };

  const handleGoBack = () => {
    if (!currentPath || currentPath === appeal?.folder_path) return;
    
    const separator = currentPath.includes('\\') ? '\\' : '/';
    const parts = currentPath.split(separator);
    if (parts.length > 1) {
      parts.pop();
      const newPath = parts.join(separator);
      setCurrentPath(newPath);
    }
  };

  const handleOpenFile = async (filePath) => {
    try {
      await fetch('/api/open_file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const handleOpenFolderInExplorer = async (pathOverride = null) => {
    const targetPath = pathOverride || currentPath;
    if (!targetPath) return;
    try {
      await fetch('/api/open_folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetPath })
      });
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const handleRefresh = async () => {
    if (!appeal?.recurrent_id || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/refresh_folder/${appeal.recurrent_id}`, { method: 'POST' });
      if (response.ok) {
        fetchDirectory(currentPath);
        onRefresh();
        setTimeout(() => setIsRefreshing(false), 800);
      } else {
        setIsRefreshing(false);
      }
    } catch (error) {
      console.error('Failed to refresh folder:', error);
      setIsRefreshing(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!appeal) return;
    
    const text = `
Ricorrente: ${appeal.name}
Data Presentazione: ${appeal.presentation_date || '-'}
RG: ${appeal.rg_number || '-'}
Data Udienza: ${appeal.hearing_date || '-'}
Tribunale: ${appeal.court || '-'}
Stato: ${appeal.status}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      showCopyFeedback();
    });
  };

  const isAtRoot = currentPath === appeal?.folder_path;
  
  // Extract subdirectory name for display
  const getSubDirName = () => {
    if (isAtRoot || !currentPath) return '';
    const separator = currentPath.includes('\\') ? '\\' : '/';
    return currentPath.split(separator).pop();
  };

  return (
    <div className="side-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-title" style={{ padding: '16px', borderBottom: '1px solid #eef2f7', fontSize: '15px', fontWeight: '700' }}>
        Directory Documenti
      </div>
      
      <div style={{ padding: '8px 16px', fontSize: '13px', color: '#1e293b', fontStyle: 'italic', fontWeight: '700' }}>
        {recurrentName || 'Seleziona un cliente'}
      </div>

      {/* Main Actions Row */}
      <div style={{ padding: '16px 16px 8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#697386' }}>
        <div 
          onClick={() => handleOpenFolderInExplorer(appeal?.folder_path)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          title="Apri cartella principale del cliente"
          className="folder-link"
        >
          <FolderOpen size={18} color="#fbbf24" fill="#fbbf24" fillOpacity={0.2} />
          <span style={{ fontSize: '14px', fontWeight: '600' }}>Apri Cartella</span>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <RefreshCw 
            size={18} 
            title="Sincronizza file"
            className={`hover-blue ${isRefreshing ? 'refresh-spin' : ''}`}
            style={{ cursor: 'pointer' }} 
            onClick={handleRefresh}
          />
          <ExternalLink 
            size={18} 
            title="Copia dati pratica"
            style={{ cursor: 'pointer' }} 
            onClick={handleCopyToClipboard}
            className="hover-blue"
          />
        </div>
      </div>

      {/* Subdirectory Breadcrumb Row */}
      {!isAtRoot && currentPath && (
        <div style={{ padding: '0 16px 12px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={handleGoBack}
            style={{ 
              border: 'none', 
              background: '#f1f5f9', 
              padding: '4px', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              display: 'flex',
              transition: 'background 0.2s'
            }}
            className="hover-bg-slate"
            title="Torna su"
          >
            <ChevronLeft size={16} color="#475569" />
          </button>
          
          <div 
            onClick={() => handleOpenFolderInExplorer(currentPath)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
            className="folder-link"
            title={`Apri ${getSubDirName()} in Windows Explorer`}
          >
            <FolderOpen size={18} color="#fbbf24" fill="#fbbf24" fillOpacity={0.2} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {getSubDirName()}
            </span>
          </div>
        </div>
      )}

      {previewFile && (
        <div style={{ 
          margin: '0 16px 16px 16px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e3e8ee',
          backgroundColor: '#000',
          height: '300px',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }} onClick={() => setPreviewFile(null)}>
            Chiudi Anteprima
          </div>
          <iframe 
             src={`/api/documents/view?path=${encodeURIComponent(previewFile.path)}`}
             style={{ width: '100%', height: '100%', border: 'none' }}
             title="PDF Preview"
          />
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderTop: !isAtRoot ? '1px solid #f1f5f9' : 'none', paddingTop: !isAtRoot ? '12px' : '0' }}>
          <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Documenti Pratica
          </h3>
          {isLoading && <span style={{ fontSize: '10px', color: '#697386' }}>Aggiornamento...</span>}
        </div>

        {(!directoryItems || directoryItems.length === 0) ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#697386', fontSize: '14px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            {appeal ? 'Cartella vuota.' : 'Seleziona un rigo per vedere i file.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {directoryItems.map((item, idx) => {
              const fileInfo = getFileIconInfo(item.name, item.is_dir);
              const isPdf = item.name.toLowerCase().endsWith('.pdf');
              
              return (
                <div 
                  key={idx}
                  className="file-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #eef2f7',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleItemClick(item)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}>
                    {item.is_dir ? (
                      <Folder size={18} color={fileInfo.color} fill={fileInfo.color} fillOpacity={0.2} style={{ flexShrink: 0 }} />
                    ) : (
                      <FileText size={18} color={fileInfo.color} style={{ flexShrink: 0 }} />
                    )}
                    <div style={{ 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      fontSize: '13px',
                      fontWeight: '500'
                    }} className="filename-text">
                      {item.name}
                    </div>
                  </div>
                  
                  {!item.is_dir && isPdf && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPreviewFile(item); }}
                      style={{
                        border: 'none',
                        background: '#f0f4ff',
                        color: '#2e5bff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      className="preview-btn"
                    >
                      <Eye size={12} />
                      Vedi
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePanel;
