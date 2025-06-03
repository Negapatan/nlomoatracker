import React from 'react';
import { Badge, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function DuplicateNotification({ count }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/');
    // Find and click the duplicates tab
    const duplicatesTab = document.querySelector('[data-tab="duplicates"]');
    if (duplicatesTab) {
      duplicatesTab.click();
    }
  };

  if (count === 0) return null;

  return (
    <Tooltip title="View duplicate entries">
      <IconButton
        onClick={handleClick}
        sx={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          '&:hover': {
            backgroundColor: '#f5f5f5',
          },
          zIndex: 1000,
        }}
      >
        <Badge
          badgeContent={count}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.8rem',
              height: '20px',
              minWidth: '20px',
            },
          }}
        >
          <i className="fas fa-copy" style={{ fontSize: '1.2rem' }}></i>
        </Badge>
      </IconButton>
    </Tooltip>
  );
}

export default DuplicateNotification; 