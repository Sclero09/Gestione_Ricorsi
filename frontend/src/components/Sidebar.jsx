import React from 'react';
import { LayoutGrid, FilePlus, Users, Settings, Scale, Menu, Archive } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isCollapsed, onToggle }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: LayoutGrid, path: '/' },
    { name: 'Nuovo Ricorso', icon: FilePlus, path: '/nuovo' },
    { name: 'Clienti', icon: Users, path: '/clienti' },
    { name: 'Archivio', icon: Archive, path: '/archivio' },
    { name: 'Impostazioni', icon: Settings, path: '/settings' },
  ];

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="logo-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Scale size={28} color="#2e5bff" />
          {!isCollapsed && <span>LegalApp</span>}
        </div>
        <button className="hamburger-btn" onClick={onToggle} title={isCollapsed ? "Espandi" : "Riduci"}>
          <Menu size={20} />
        </button>
      </div>
      
      <nav>
        {navItems.map((item) => {
          const ActiveIcon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`} 
              title={isCollapsed ? item.name : ''}
            >
              <ActiveIcon size={20} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
