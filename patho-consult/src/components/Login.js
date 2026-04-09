import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom";
import "../styles/login.css";
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    IconButton
} from '@mui/material';
import {Search, Home, Mail, MapPin } from 'lucide-react';

 

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch('http://localhost:5000/api/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password, 
          pin: String(adminPin) 
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("userRole", data.role);
        // ADD THIS LINE:
        localStorage.setItem("userName", username); 
        
        navigate('/home');
      } else {
        setErrorMessage(data.message); 
      }
    } catch (error) {
      setErrorMessage("Could not connect to secure login server.");
    } finally {
      setLoading(false);
    }
};
useEffect(() => {
  setUsername("");
  setPassword("");
  setAdminPin("");
}, []);
const PathoLogo = () => (
  <Box sx={{ position: 'relative', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {/* Concentric Circles */}
    <Box sx={{ 
      position: 'absolute', width: 34, height: 34, 
      border: '6px solid #e1bee7', 
      borderRadius: '50%', 
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <Box sx={{ width: 12, height: 12, bgcolor: '#7b1fa2', borderRadius: '50%' }} /> 
    </Box>
    {/* Vertical "P" Stem */}
    <Box sx={{ 
      position: 'absolute', left: 4, top: 0, 
      width: 6, height: '100%', bgcolor: '#7b1fa2', 
      zIndex: 2,
      borderRadius: '2px' 
    }} />
  </Box>
);

 return (
    <div className="login-wrapper">
      {/* Main Header */}
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', bgcolor: '#4a148c', color: 'white', position: 'relative' }}>
        <Typography variant="h6" fontWeight="bold">PATHO CONSULT PORTAL</Typography>
      </Box>

      <div className="center-content">
        <div className="login-card">
          <div className="scan-line"></div>

          {/* LOGO & HEADING GROUP - TEXT ON LEFT, LOGO ON RIGHT */}
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, }}>
           
           {/* BRAND TEXT GROUP */}
           <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end',mr:1,ml:6 }}>
             <Typography variant="h5" fontWeight="900" sx={{ 
               color: '#4a148c', 
               lineHeight: 1,
               letterSpacing: '0.5px',
               textTransform: 'uppercase'
             }}>
               Patho <span style={{ fontWeight: 400, color: '#7b1fa2' }}>Consult</span>
             </Typography>
             <Typography variant="caption" fontWeight="900" sx={{ color: '#9c27b0', letterSpacing: '2px', mt: 0.3 }}>
               DIAGNOSTICS
             </Typography>
           </Box>
         
           {/* LOGO MOVED TO THE RIGHT SIDE */}
           <PathoLogo /> 
    
          </Box>

          <div className="form-container">
            {errorMessage && <div className="error-banner">{errorMessage}</div>}

            <div className="input-group">
              <input 
  type="text" 
  required 
  placeholder=" " 
  value={username}
  autoComplete="off" // Change this to off
  name="my-unique-username" // Using a unique name helps prevent browser mapping
  onChange={(e) => setUsername(e.target.value)}
/>
              <label>Username</label>
            </div>

            <div className="input-group">
              <input 
  type="password" 
  required 
  placeholder=" "
  value={password}
  autoComplete="new-password" // "new-password" forces browsers to ignore saved ones
  name="my-unique-password"
  onChange={(e) => setPassword(e.target.value)}
/>
              <label>Password</label>
            </div>
            {username.toLowerCase() === "admin" && (
              <div className="input-group admin-fade-in">
                <input 
                  type="text" 
                  maxLength="4"
                  required 
                  placeholder=" "
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                />
                <label>Secret Admin Pin</label>
              </div>
            )}

            <button 
              className="signin-btn" 
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Authenticate"}
            </button>

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
              New user? <Link to="/signup" style={{ color: '#7b1fa2', fontWeight: 'bold' }}>Register Here</Link>
            </p>
          </div>
        </div>
      </div>

      <Box sx={{ mt: 'auto', p: 1.5, bgcolor: '#4a148c', color: 'rgba(255,255,255,0.8)',  display: 'flex', justifyContent: 'center', gap: 4, position: 'fixed', bottom: 0, width: '100%'}}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MapPin size={14} />
              <Typography variant="caption">Mylapore, Chennai-600 004</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Mail size={14} />
             <Typography variant="caption">pathoconsult@gmail.com</Typography>
        </Box>
      </Box>
    </div>
  );
}

export default Login;