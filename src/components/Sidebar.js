import React, { useState } from 'react';
import './Sidebar.css';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function Sidebar({ activeTab, setActiveTab }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Show confirmation dialog using toast
    toast((t) => (
      <div className="logout-confirmation-toast">
        <p>Are you sure you want to log out?</p>
        <div className="toast-actions">
          <button
            onClick={() => confirmLogout(t.id)}
            className="confirm-logout"
          >
            Log Out
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="cancel-logout"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      position: "bottom-right",
      autoClose: false,
      closeButton: false,
      className: 'logout-toast',
      draggable: false
    });
  };

  const confirmLogout = async (toastId) => {
    try {
      await signOut(auth);
      navigate('/login');
      toast.dismiss(toastId);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
    }
  };

  const menuItems = [
    {
      id: 'form',
      label: 'Agreement Form',
      icon: 'fas fa-file-alt'
    },
    {
      id: 'records',
      label: 'Records',
      icon: 'fas fa-table'
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: 'fas fa-check-circle'
    }
  ];

  const contactItems = [
    {
      icon: 'fas fa-map-marker-alt',
      text: 'N. Bacalso Avenue, Cebu City, Philippines 6000',
      title: 'Address'
    },
    {
      icon: 'fas fa-phone',
      text: '+63 32 411 2000 (trunkline)',
      title: 'Phone'
    },
    {
      icon: 'fas fa-envelope',
      text: 'info@cit.edu',
      title: 'Email'
    }
  ];

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && <h2>NLO MONITORING</h2>}
        {isCollapsed ? (
          <button 
            className="collapse-button"
            onClick={() => setIsCollapsed(false)}
            title="Expand sidebar"
          >
            <i className="fas fa-bars"></i>
          </button>
        ) : (
          <button 
            className="collapse-button"
            onClick={() => setIsCollapsed(true)}
            title="Collapse sidebar"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
        )}
      </div>

      <div className="sidebar-content">
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="nav-item-content">
                <i className={item.icon}></i>
                {!isCollapsed && <span>{item.label}</span>}
              </div>
            </button>
          ))}
        </nav>

        <div className="bottom-section">
          <button className="logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            {!isCollapsed && <span>Logout</span>}
          </button>

          <div className="contact-info">
            {!isCollapsed && <h3>Contact Us</h3>}
            {contactItems.map((item, index) => (
              <div key={index} className="contact-item" title={isCollapsed ? item.text : undefined}>
                <i className={item.icon}></i>
                {!isCollapsed && <span>{item.text}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar; 