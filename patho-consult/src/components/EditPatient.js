import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import "../styles/forms.css"; 
import "../styles/login.css"; 
import {
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, TextField, Button
} from '@mui/material';
import { UserRoundPen } from 'lucide-react';
import HomeIcon from '@mui/icons-material/Home';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';

function EditPatient() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [metadata, setMetadata] = useState({ titles: [], doctors: [] });
    const [formData, setFormData] = useState({
        title_id: '',
        patient_name: '',
        age: '',
        gender: '',
        phone_no: '',
        email:'',
        doctor_id: ''
    });

useEffect(() => {
    fetch('http://localhost:5000/api/registration-metadata')
        .then(res => res.json())
        .then(data => setMetadata(data))
        .catch(err => {
            console.error("Metadata error", err);
            Swal.fire({
                icon: 'error',
                title: 'System Error',
                text: 'Could not load doctors list. Please refresh.',
                confirmButtonColor: '#4a148c'
            });
        });

    fetch(`http://localhost:5000/api/get-patient/${id}`)
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                const patientData = {
                    ...result.data,
                    doctor_id: result.data.doctor_id ? String(result.data.doctor_id) : "",
                    email: result.data.email || ""
                };
                setFormData(patientData);
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Not Found',
                    text: 'The requested patient profile does not exist.',
                    confirmButtonColor: '#4a148c'
                }).then(() => {
                    navigate('/add-patient'); 
                });
            }
        })
        .catch(err => {
            console.error("Fetch error", err);
            Swal.fire({
                icon: 'error',
                title: 'Connection Failed',
                text: 'Unable to reach the server. Please try again later.',
                confirmButtonColor: '#4a148c'
            });
        });
}, [id, navigate]);

const handleUpdate = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch(`http://localhost:5000/api/update-patient/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();

        if (result.success) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    Swal.getContainer().style.zIndex = '9999';
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });

            await Toast.fire({
                icon: 'success',
                title: 'Patient Profile Updated',
                background: '#f3e5f5',
                iconColor: '#4a148c'
            });

            navigate('/add-patient'); 
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: result.error || "There was an issue saving the changes.",
                confirmButtonColor: '#4a148c'
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: 'Could not connect to the database. Please check your network.',
            confirmButtonColor: '#4a148c'
        });
    }
};

    return (
        <div className="login-wrapper"> 
            
            {/* Professional Header */}
            <Box sx={{ 
                px: 3, py: 1.5, bgcolor: '#4a148c', color: 'white', 
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 1100
            }}>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1 }}>PATHO CONSULT</Typography>
                <IconButton 
                        onClick={() => navigate('/home')} 
                        sx={{ position: 'absolute', right: 36, top: 3, color: 'white' }}
                    >
                        <HomeIcon fontSize="large" />
                    </IconButton>
            </Box>

            <div className="center-content" style={{ flexDirection: 'column', paddingTop: '10px', marginTop: '-70px' }}>
              
<div className="login-card admin-fade-in" style={{ width: '500px', maxWidth: '95%', padding: '2rem' }}>
    
    <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '12px', 
        marginBottom: '1.5rem',
        borderBottom: '1px solid #eee',
        paddingBottom: '1rem'
    }}>
        <UserRoundPen size={28} color="#2e004d" strokeWidth={2.5} />
        
        <h2 className="brand-name" style={{ margin: 0, fontSize: '1.5rem' }}>
            Edit Patient Profile
        </h2>
    </div>

   
                    <p className="sub-brand">PATIENT ID: #{id}</p>

                    <form onSubmit={handleUpdate}>
                        {/* Title and Name */}
                        <div className="form-row" style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                            <div className="input-group" style={{ flex: '0.4' }}>
                                <select 
                                    required 
                                    className="purple-select-flat"
                                    value={formData.title_id}
                                    onChange={(e) => setFormData({...formData, title_id: e.target.value})}
                                >
                                    <option value="">Title</option>
                                    {metadata.titles.map(t => (
                                        <option key={t.id} value={t.id}>{t.title_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group" style={{ flex: '1' }}>
                                <input 
                                    type="text" required placeholder=" " 
                                    value={formData.patient_name}
                                    onChange={(e) => setFormData({...formData, patient_name: e.target.value})} 
                                />
                                <label>Patient Full Name</label>
                            </div>
                        </div>

                        {/* Age and Gender */}
                        <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                            <div className="input-group" style={{ flex: '1' }}>
                                <input 
                                    type="number" required placeholder=" " 
                                    value={formData.age}
                                    onChange={(e) => setFormData({...formData, age: e.target.value})} 
                                />
                                <label>Age & Gender</label>
                            </div>
                            <div className="input-group" style={{ flex: '1' }}>
                                <select 
                                    required className="purple-select-flat"
                                    value={formData.gender}
                                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                >
                                    <option value="">Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="input-group">
                            <input 
                                type="email" 
                                placeholder=" " 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                            />
                            <label>Email Address</label>
                        </div>



                        
                        {/* Referring Doctor */}
                        <div className="input-group">
                            <select 
                                required className="purple-select-flat" 
                                value={formData.doctor_id} 
                                onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
                            >
                                <option value="">-- Referring Doctor --</option>
                                {metadata.doctors.map(d => (
                                    <option key={d.id} value={d.id}>{d.doctor_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Phone Number */}
                        <div className="input-group">
                            <input 
                                type="tel" required placeholder=" " 
                                value={formData.phone_no}
                                onChange={(e) => setFormData({...formData, phone_no: e.target.value})} 
                            />
                            <label>Phone Number</label>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <button type="submit" className="signin-btn">Save Changes</button>
                            <button 
                                type="button" 
                                className="signin-btn" 
                                style={{ background: '#757575' }} 
                                onClick={() => navigate('/add-patient')}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <Box sx={{ 
                            mt: 'auto', p: 1.5, bgcolor: '#4a148c', color: 'rgba(255,255,255,0.8)', 
                            display: 'flex', justifyContent: 'center', gap: 4
                        }}>
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

export default EditPatient; 