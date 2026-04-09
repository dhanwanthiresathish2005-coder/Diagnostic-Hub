import React, { createContext, useState, useContext, useEffect } from 'react';
import { Snackbar, Alert, Box } from '@mui/material';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]); 
  const [queue, setQueue] = useState([]); 
  const [open, setOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);

  const getSeverity = (type) => {
    switch(type) {
      case 'critical': return 'error';
      case 'pending':  return 'warning';
      case 'success':  return 'success';
      default:         return 'info';
    }
  };

  useEffect(() => {
    if (queue.length > 0 && !open) {
      setCurrentNote(queue[0]);
      setQueue((prev) => prev.slice(1));
      setOpen(true);
    }
  }, [queue, open]);

  const addNotification = (text, type) => {
    const newNote = { id: Date.now() + Math.random(), text, type, time: new Date().toLocaleTimeString() };
    
    // 1. Add to history
    setNotifications(prev => [newNote, ...prev].slice(0, 50));
    
    // 2. Add to active display queue
    setQueue(prev => [...prev, newNote]);
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, clearNotifications: () => setNotifications([]) }}>
      {children}
      
      <Snackbar 
        key={currentNote?.id} 
        open={open} 
       autoHideDuration={currentNote?.type === 'success' ? 2000 : 6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ marginTop: '64px' }}
      >
        <Alert 
          onClose={handleClose} 
          severity={getSeverity(currentNote?.type)} 
          sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 'bold' }}
          variant="filled"
        >
          {currentNote?.text}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);