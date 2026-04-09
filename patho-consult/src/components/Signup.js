import React, { useState } from 'react';
import { useNavigate, Link } from "react-router-dom";
import "../styles/login.css"; // Reuse your existing purple theme

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    phone: "",
    address: "",
    pin: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Inside Signup.js handleSignup function
const handleSignup = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  // Create a copy of the data to ensure PIN is a string
  const payload = { 
    ...formData, 
    pin: String(formData.pin) // Match backend's expected type
  };

  try {
    const response = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.success) {
      setMessage({ type: "success", text: "Registration successful! Redirecting..." });
      setTimeout(() => navigate('/'), 2000); // Back to Login to verify
    } else {
      setMessage({ type: "error", text: data.message });
    }
  } catch (error) {
    setMessage({ type: "error", text: "Server error during registration." });
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="login-wrapper">
      <header className="brand-bar">Patho Consult Portal - Registration</header>
      <div className="center-content">
        <div className="login-card" style={{ width: '450px' }}>
          <div className="scan-line"></div>
          <h2 className="brand-name">Create Account</h2>
          <p className="sub-brand">DIAGNOSTICS & RESEARCH</p>

          <form onSubmit={handleSignup} className="form-container">
            {message.text && (
              <div className={message.type === "error" ? "error-banner" : "success-banner"}>
                {message.text}
              </div>
            )}

            <div className="input-group">
              <input type="text" name="username" required placeholder=" " onChange={handleChange} />
              <label>Username</label>
            </div>

            <div className="input-group">
              <input type="password" name="password" required placeholder=" " onChange={handleChange} />
              <label>Password</label>
            </div>

            <div className="input-group">
              <input type="text" name="phone" required placeholder=" " onChange={handleChange} />
              <label>Phone Number</label>
            </div>

            <div className="input-group">
              <input type="text" name="address" required placeholder=" " onChange={handleChange} />
              <label>Address</label>
            </div>

            <div className="input-group">
              <input type="text" name="pin" maxLength="4" placeholder=" " onChange={handleChange} />
              <label>Admin PIN (Optional)</label>
            </div>

            <button type="submit" className="signin-btn" disabled={loading}>
              {loading ? "Registering..." : "Create Account"}
            </button>

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
              Already have an account? <Link to="/" style={{ color: '#7b1fa2', fontWeight: 'bold' }}>Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;