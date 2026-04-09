import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

const PathoConsultSplash = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(false);
  const [showSubText, setShowSubText] = useState(false);

  useEffect(() => {
    // Stage 1: Reveal Main Card
    const timer1 = setTimeout(() => setActive(true), 200);
    // Stage 2: Reveal Subtitle 1 second later
    const timer2 = setTimeout(() => setShowSubText(true), 1200);
    // Stage 3: Exit
    const timer3 = setTimeout(() => navigate('/login'), 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [navigate]);

  return (
    <Box sx={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#040206', // Total Black#040206
      overflow: 'hidden',
      position: 'relative',
    }}>
      
      {/* 1. SOFT AMBIENT GLOWS (No Scanning) */}
      <Box sx={{
        position: 'absolute',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(123, 31, 162, 0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'pulseGlow 6s ease-in-out infinite',
      }} />

      {/* 2. BACKGROUND CONCENTRIC RINGS (Static & Elegant) */}
      {[1, 2, 3].map((ring) => (
        <Box key={ring} sx={{
          position: 'absolute',
          width: `${ring * 300}px`,
          height: `${ring * 300}px`,
          border: '1px solid rgba(255, 255, 255, 0.03)',
          borderRadius: '50%',
          opacity: active ? 1 : 0,
          transition: `opacity ${ring}s ease-in`,
        }} />
      ))}

      {/* 3. THE FLOATING INTERFACE */}
      <Box sx={{
        zIndex: 2,
        textAlign: 'center',
        transition: 'all 1.5s cubic-bezier(0.22, 1, 0.36, 1)',
        transform: active ? 'translateY(0)' : 'translateY(20px)',
        opacity: active ? 1 : 0,
      }}>
        
        {/* LOGO WITH LENS FLARE EFFECT */}
        <Box sx={{ position: 'relative', mb: 4, display: 'inline-block' }}>
           {/* Lens Flare */}
           <Box sx={{
             position: 'absolute', top: '50%', left: '50%',
             width: '120%', height: '2px',
             background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
             transform: 'translate(-50%, -50%) rotate(-45deg)',
             opacity: active ? 0.3 : 0,
             transition: 'opacity 2s ease-in-out',
           }} />

           <Box sx={{ animation: 'floatLogo 4s ease-in-out infinite' }}>
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="4" height="14" rx="1.5" fill="#7b1fa2" />
                <path d="M11 12C11 14.7614 13.2386 17 16 17C18.7614 17 21 14.7614 21 12C21 9.23858 18.7614 7 16 7C13.2386 7 11 9.23858 11 12Z" fill="#7b1fa2" />
                <circle cx="16" cy="12" r="3.5" fill="#e1bee7" />
                <circle cx="16" cy="12" r="1.8" fill="#7b1fa2" />
              </svg>
           </Box>
        </Box>

        {/* TYPOGRAPHY WITH LETTER SPACING ANIMATION */}
        <Typography variant="h1" sx={{ 
          fontWeight: 900, 
          fontSize: '4.5rem', 
          color: '#fff', //#4a148c #fff
          letterSpacing: active ? '4px' : '20px',
          transition: 'letter-spacing 2s cubic-bezier(0.22, 1, 0.36, 1)',
          lineHeight: 1,
          mb: 1
        }}>
          PATHO <Box component="span" sx={{ fontWeight: 200, color: '#ba68c8' }}>CONSULT</Box>
        </Typography>

        <Typography sx={{ 
          fontSize: '14px', 
          color: '#ba68c8', 
          fontWeight: 600, 
          letterSpacing: '10px',
          textTransform: 'uppercase',
          opacity: showSubText ? 0.7 : 0,
          transform: showSubText ? 'scale(1)' : 'scale(1.2)',
          transition: 'all 1s ease-out'
        }}>
          Diagnostics
        </Typography>

        {/* MINIMALIST BREATHING INDICATOR */}
        <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '4px' }}>
                {location.state?.locationCode || "CHENNAI_HQ"}
            </Typography>
            <Box sx={{ 
                width: '40px', height: '1px', 
                background: 'linear-gradient(90deg, transparent, #ba68c8, transparent)',
                animation: 'expandWidth 2s ease-in-out infinite'
            }} />
        </Box>
      </Box>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.2); opacity: 0.25; }
        }
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes expandWidth {
          0%, 100% { width: 20px; opacity: 0.2; }
          50% { width: 80px; opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

export default PathoConsultSplash;