import React, { createContext, useState, useContext, useEffect } from 'react';
import { Snackbar, Box, Typography, IconButton } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]); 
  const [queue, setQueue] = useState([]); 
  const [open, setOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);

  useEffect(() => {
    if (queue.length > 0 && !open) {
      setCurrentNote(queue[0]);
      setQueue((prev) => prev.slice(1));
      setOpen(true);
    }
  }, [queue, open]);

  // ADDED: silent parameter to control the Snackbar popup
  const addNotification = (text, type = 'info', target = null, silent = false) => {
    const newNote = { 
      id: Date.now() + Math.random(), 
      text, 
      type, 
      target, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    // Always update history for the Home screen bell icon
    setNotifications(prev => [newNote, ...prev].slice(0, 50));
    
    // Only update the queue if NOT silent (this prevents the popup)
    if (!silent) {
      setQueue(prev => [...prev, newNote]);
    }
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  const getAccentColor = (type) => {
    switch(type) {
      case 'critical': return '#b71c1c'; // Matches SweetAlert Red
      case 'pending':  return '#f57f17'; // Matches SweetAlert Amber/Orange for Overdue
      case 'success':  return '#2e7d32'; // Matches SweetAlert Green for Ready
      default:         return '#4a148c'; // Default Purple theme
    }
  };

  const getIcon = (type) => {
    const iconStyle = { fontSize: '22px' };
    switch(type) {
      case 'critical': 
        return <ErrorOutlineIcon sx={{ ...iconStyle, color: '#b71c1c' }} />;
      case 'pending':  
        // Changed to Amber color to match "Past Deadline" warnings
        return <WarningAmberIcon sx={{ ...iconStyle, color: '#f57f17' }} />;
      case 'success':  
        return <CheckCircleOutlineIcon sx={{ ...iconStyle, color: '#2e7d32' }} />;
      default:         
        return <InfoOutlinedIcon sx={{ ...iconStyle, color: '#4a148c' }} />;
    }
  };

  return (
    // FIXED: Added setNotifications to the value object so Home.js can use it
    <NotificationContext.Provider value={{ 
      notifications, 
      setNotifications, 
      addNotification, 
      setQueue,
      clearNotifications: () => setNotifications([]) 
    }}>
      {children}
      
      <Snackbar 
        key={currentNote?.id} 
        open={open} 
        autoHideDuration={currentNote?.type === 'critical' ? 8000 : 4500}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ 
          marginTop: '70px', 
          right: '24px !important' 
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            minWidth: '340px',
            maxWidth: '450px',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            borderLeft: `6px solid ${getAccentColor(currentNote?.type)}`,
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ mr: 2, mt: '2px', display: 'flex' }}>
             {getIcon(currentNote?.type)}
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ 
                color: '#1e293b', 
                fontSize: '13.5px', 
                fontWeight: '600',
                lineHeight: 1.5 
            }}>
              {currentNote?.text}
            </Typography>
            <Typography sx={{ 
                color: '#64748b', 
                fontSize: '10px', 
                mt: 0.8,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.8px'
            }}>
              {currentNote?.time}
            </Typography>
          </Box>

          <IconButton 
            size="small" 
            onClick={handleClose} 
            sx={{ 
              ml: 1, 
              mt: -0.5, 
              color: '#94a3b8',
              '&:hover': { color: '#4a148c', backgroundColor: '#f3e5f5' } 
            }}
          >
            <CloseIcon sx={{ fontSize: '18px' }} />
          </IconButton>
        </Box>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);