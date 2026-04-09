import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { Box, Typography } from '@mui/material';
import Biotech from '@mui/icons-material/Biotech'; 

const LocationDeskSplash = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook to get data from previous page

  useEffect(() => {
    // 1. Capture the location code from the state passed by the Modal/Home page
    // 2. Fallback to "MYL001" if somehow the state is missing
    const locationCode = location.state?.locationCode || "MYL001";

    console.log("Splash Screen active for unit:", locationCode);

    const timer = setTimeout(() => {
      // CRITICAL: Pass the locationCode forward to the final page
      navigate('/sample-collect', { state: { locationCode } });
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate, location]); // Added location to dependency array

  return (
    <Box sx={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle, #4a148c 0%, #1a0633 100%)', 
      color: 'white',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* MOVING OBJECT: The Glowing Scanning Ring */}
      <Box sx={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '50%',
        animation: 'spin 3s linear infinite',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '-5px',
          left: '50%',
          width: '12px',
          height: '12px',
          background: '#00e676', 
          borderRadius: '50%',
          boxShadow: '0 0 20px #00e676, 0 0 40px #00e676'
        }
      }} />

      <Box sx={{ 
        textAlign: 'center', 
        zIndex: 2,
        animation: 'zoomIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
      }}>
        <Biotech sx={{ 
          fontSize: 120, 
          mb: 1, 
          color: '#e1bee7',
          filter: 'drop-shadow(0 0 20px rgba(225,190,231,0.6))' 
        }} />
        
        <Typography variant="h1" sx={{ 
          fontWeight: 900, 
          fontSize: '4.5rem',
          letterSpacing: '-2px',
          textTransform: 'uppercase',
          background: 'linear-gradient(to bottom, #ffffff, #e1bee7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1
        }}>
          Sample Collect
        </Typography>

        {/* Display the active unit code on the splash screen */}
        <Typography sx={{ color: '#00e676', fontWeight: 'bold', mt: 1, letterSpacing: 2 }}>
          UNIT: {location.state?.locationCode || "LOADING..."}
        </Typography>

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Box sx={{ width: 40, height: 2, bgcolor: '#00e676', animation: 'expand 1.5s ease-in-out infinite' }} />
            <Typography sx={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '5px', color: '#00e676', opacity: 0.8 }}>
                ACCESSING DATABASE
            </Typography>
            <Box sx={{ width: 40, height: 2, bgcolor: '#00e676', animation: 'expand 1.5s ease-in-out infinite' }} />
        </Box>
      </Box>

      <style>
        {`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes zoomIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
          @keyframes expand { 0%, 100% { width: 10px; opacity: 0.3; } 50% { width: 50px; opacity: 1; } }
        `}
      </style>
    </Box>
  );
};

export default LocationDeskSplash;