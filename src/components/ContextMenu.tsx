import React, { useEffect, useRef } from 'react';
import '../styles/ContextMenu.css';
import { useTheme } from '../context/ThemeContext';

interface MenuItem {
  id?: string;
  label?: string;
  enabled?: boolean;
  submenu?: MenuItem[];
  type?: 'separator';
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onItemClick: (itemId: string, data?: any) => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onItemClick, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  
  // S1: Show context menu
  // Displays the context menu at the specified position
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    
    // Adjust position if menu would go off screen
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let adjustedX = x;
      let adjustedY = y;
      
      if (x + menuRect.width > viewportWidth) {
        adjustedX = viewportWidth - menuRect.width - 10;
      }
      
      if (y + menuRect.height > viewportHeight) {
        adjustedY = viewportHeight - menuRect.height - 10;
      }
      
      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [x, y, onClose]);
  
  // S2: Handle menu item click
  // Processes clicks on context menu items
  const handleMenuItemClick = (item: MenuItem) => {
    if (!item.enabled || !item.id) return;
    
    onItemClick(item.id);
  };
  
  // S3: Handle submenu item click
  // Processes clicks on submenu items
  const handleSubmenuItemClick = (parentId: string, item: MenuItem) => {
    if (!item.enabled || !item.id) return;
    
    onItemClick(item.id);
  };
  
  return (
    <div 
      className={`context-menu ${theme}`} 
      style={{ left: x, top: y }}
      ref={menuRef}
    >
      <ul className="menu-items">
        {items.map((item, index) => (
          <li key={item.id || `item-${index}`} className="menu-item">
            {item.type === 'separator' ? (
              <div className="separator" />
            ) : item.submenu ? (
              <div className="submenu-container">
                <div 
                  className={`menu-item-content ${!item.enabled ? 'disabled' : ''}`}
                  onClick={() => item.enabled && handleMenuItemClick(item)}
                >
                  <span>{item.label}</span>
                  <span className="submenu-indicator">▶</span>
                </div>
                <div className="submenu">
                  <ul className="menu-items">
                    {item.submenu.map((subItem, subIndex) => (
                      <li key={subItem.id || `subitem-${index}-${subIndex}`} className="menu-item">
                        {subItem.type === 'separator' ? (
                          <div className="separator" />
                        ) : (
                          <div 
                            className={`menu-item-content ${!subItem.enabled ? 'disabled' : ''}`}
                            onClick={() => subItem.enabled && item.id && handleSubmenuItemClick(item.id, subItem)}
                          >
                            <span>{subItem.label}</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div 
                className={`menu-item-content ${!item.enabled ? 'disabled' : ''}`}
                onClick={() => item.enabled && handleMenuItemClick(item)}
              >
                <span>{item.label}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;
