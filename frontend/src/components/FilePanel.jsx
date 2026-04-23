import React, { useState } from 'react';
import { FileText, FolderOpen, ExternalLink, Eye, RefreshCw } from 'lucide-react';

const FilePanel = ({ recurrentName, files = [], appeal, showCopyFeedback, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const getFileIconInfo = (filename) => {
    const ext = (filename || '').toLowerCase().split('.').pop();
    if (ext === 'pdf') return { color: "#ef4444", label: "PDF" };
    if (['xls', 'xlsx', 'csv'].includes(ext)) return { color: "#10b981", label: "EXCEL" };
    if (['doc', 'docx'].includes(ext)) return { color: "#3b82f6", label: "WORD" };
    return { color: "#64748b", label: ext.toUpperCase() };
  };

  const handleOpenFile = async (filePath) => {
    try {
      await fetch('/open_file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const handleOpenFolder = async () => {
    if (!appeal?.folder_path) return;
    try {
      await fetch('/open_folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: appeal.folder_path })
      });
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const handleRefresh = async () => {
    if (!appeal?.recurrent_id || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(`/refresh_folder/${appeal.recurrent_id}`, { method: 'POST' });
      if (response.ok) {
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

  return (
    <div className="side-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-title" style={{ padding: '16px', borderBottom: '1px solid #eef2f7', fontSize: '15px', fontWeight: '700' }}>
        Directory Documenti
      </div>
      
      <div style={{ padding: '8px 16px', fontSize: '13px', color: '#1e293b', fontStyle: 'italic', fontWeight: '700' }}>
        {recurrentName || 'Seleziona un cliente'}
      </div>

      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#697386' }}>
        <div 
          onClick={handleOpenFolder}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'color 0.2s' }}
          title="Apri cartella in Explorer"
          className="hover-blue"
        >
          <FolderOpen size={18} color="#fbbf24" fill="#fbbf24" fillOpacity={0.2} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Apri Cartella</span>
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
             src={`/documents/view?path=${encodeURIComponent(previewFile.path || previewFile.file_path)}`}
             style={{ width: '100%', height: '100%', border: 'none' }}
             title="PDF Preview"
          />
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px 16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
          Documenti Pratica
        </h3>
        {(!files || files.length === 0) ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#697386', fontSize: '14px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            {appeal ? 'Nessun documento trovato.' : 'Seleziona un rigo per vedere i file.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {files.map((file, idx) => {
              const fileInfo = getFileIconInfo(file.file_name || file.name);
              const isPdf = (file.file_name || '').toLowerCase().endsWith('.pdf');
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
                    transition: 'all 0.2s'
                  }}
                >
                  <div 
                    onClick={() => handleOpenFile(file.file_path || file.path)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
                    title="Apri con applicazione di sistema"
                  >
                    <FileText size={16} color={fileInfo.color} />
                    <div style={{ 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      maxWidth: '160px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }} className="filename-text">
                      {file.file_name || file.name}
                    </div>
                  </div>
                  
                  {isPdf && (
                    <button 
                      onClick={() => setPreviewFile(file)}
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
