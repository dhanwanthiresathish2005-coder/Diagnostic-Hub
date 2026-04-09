import React, { useState, useEffect } from 'react';
import { useNavigate,useLocation } from "react-router-dom";
import Swal from 'sweetalert2';
import { Box, Typography, Paper, Button, IconButton, TextField, Grid, Tooltip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { Stethoscope } from 'lucide-react';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import { UsersRound } from 'lucide-react';

function DoctorDetails() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [form, setForm] = useState({ 
        id: null, 
        doctorName: '', 
        emailId: '', 
        phoneNo: '', 
        notification: 'No' 
    });
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    });

    // 1. Fetch Doctors with Filtering Logic
    const fetchDoctors = (searchVal = '') => {
        const query = new URLSearchParams({ search: searchVal }).toString();
        fetch(`http://localhost:5000/api/doctors/filter?${query}`)
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setDoctors(d.data);
                }
            })
            .catch(err => console.error("Fetch error:", err));
    };

    // 2. Debounced search trigger
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchDoctors(searchTerm);
        }, 400);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const { search } = useLocation();
    const queryParams = new URLSearchParams(search);
    const profileId = queryParams.get('ref');

    useEffect(() => {
    const fetchProfileData = async () => {
        if (!profileId) return;

        try {
            const response = await fetch(`http://localhost:5000/api/fetch-profile/${profileId}`);
            const result = await response.json();

            if (result.success && result.data) {
                // Map the MariaDB column names (FirstName, LastName) to your form
                const fullName = `Dr. ${result.data.FirstName} ${result.data.LastName || ''}`.trim();
                
                setForm(prev => ({
                    ...prev,
                    doctorName: fullName
                }));
            }
        } catch (error) {
            console.error("Failed to fetch profile for auto-fill:", error);
        }
    };

    fetchProfileData();
}, [profileId]);

    const handleSubmit = async () => {
    // Basic Validation
    if (!form.doctorName) {
        return Swal.fire({
            icon: 'warning',
            title: 'Missing Name',
            text: 'Please enter the Doctor\'s Name.',
            confirmButtonColor: '#4a148c'
        });
    }

    try {
        const res = await fetch('http://localhost:5000/api/add-doctor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        const result = await res.json();

        if (result.success) {
            Toast.fire({
                icon: 'success',
                title: form.id ? "Doctor profile updated" : "Doctor registered successfully"
            });
            
            setForm({ id: null, doctorName: '', emailId: '', phoneNo: '', notification: 'No' });
            fetchDoctors(); 
        }
    } catch (err) {
        Swal.fire('Error', 'Failed to save doctor details.', 'error');
    }
};

const handleDelete = async (id) => {
    const result = await Swal.fire({
        title: 'Remove Doctor?',
        text: "This will delete the doctor's contact info from the system.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#4a148c',
        confirmButtonText: 'Yes, delete record'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`http://localhost:5000/api/delete-doctor/${id}`, { 
                method: 'DELETE' 
            });

            if (res.ok) {
                Toast.fire({
                    icon: 'success',
                    title: 'Record deleted'
                });
                fetchDoctors(); 
            }
        } catch (err) {
            Swal.fire('Error', 'Could not delete record.', 'error');
        }
    }
};

const startEdit = (doc) => {
    setForm({
        id: doc.id,
        doctorName: doc.doctor_name || '',
        emailId: doc.email_id || '',
        phoneNo: doc.phone_no || '',
        notification: doc.notification_required || ''
    });

    // Visual feedback that we are editing
    Toast.fire({
        icon: 'info',
        title: `Editing Dr. ${doc.doctor_name}`,
        position: 'top-center',
        timer: 1000
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
};
    return (
        <div className="home-wrapper" style={{ backgroundColor: '#4a148c', minHeight: '100vh', paddingBottom: '70px' }}>
                    {/* Main Header */}
                    <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', bgcolor: '#4a148c', color: 'white', position: 'relative' }}>
                        <Typography variant="h6" fontWeight="bold">Patho Consult</Typography>
                        <IconButton 
                                onClick={() => navigate('/home')} 
                                sx={{ position: 'absolute', right: 36, top: 3, color: 'white' }}
                            >
                                <HomeIcon fontSize="large" />
                            </IconButton>
                    </Box>

            <main className="dashboard-content">
                {/* Form Section */}
                <div className="admin-panel" style={{ width: '95%', margin: '0 auto', marginTop: '30px', backgroundColor: 'white', borderRadius: '8px' }}>
<div className="panel-header" style={{ 
    backgroundColor: '#4a148c', 
    color: 'white', 
    padding: '13px', 
    textAlign: 'center', 
    fontWeight: 'bold',
    display: 'flex',           
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '10px' 
}}>
    <Stethoscope size={18} strokeWidth={2.5} />
    <span>Doctor Details</span>
</div>
                    <div className="card-form" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 2fr', gap: '15px', alignItems: 'center' }}>
                        <label>Doctor Name</label>
                        <input className="purple-select" value={form.doctorName} onChange={e => setForm({...form, doctorName: e.target.value})} />
                        
                        <label>Email Id</label>
                        <input className="purple-select" value={form.emailId} onChange={e => setForm({...form, emailId: e.target.value})} />
                        
                        <label>Phone NO</label>
                        <input className="purple-select" value={form.phoneNo} onChange={e => setForm({...form, phoneNo: e.target.value})} />
                        
                        <label>Mail Notification</label>
                        <div>
                            <input type="radio" name="notif" checked={form.notification === 'Yes'} onChange={() => setForm({...form, notification: 'Yes'})} /> Yes
                            <input type="radio" name="notif" style={{marginLeft:'10px'}} checked={form.notification === 'No'} onChange={() => setForm({...form, notification: 'No'})} /> No
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                        <button className="innovative-btn" onClick={handleSubmit}>
                            {form.id ? "Update Doctor" : "Add Doctor"}
                        </button>
                         <button type="button" className="cancel-btn" style={{ marginLeft: '10px' }} onClick={() => navigate('/home')}>Cancel</button>
                    </div>
                </div>

                {/* Search Bar */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                    <input 
                        type="text" 
                        placeholder="🔍 Search here" 
                        style={{ padding: '12px', width: '400px', borderRadius: '25px', border: '1px solid #ccc', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Data Table Container */}
<div className="admin-panel" style={{ 
    marginTop: '10px', 
    width: '95%', 
    maxWidth: '1000px', 
    margin: '20px auto',
    backgroundColor: 'white', 
    display: 'flex', 
    flexDirection: 'column',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e1bee7'
}}>
    {/* Header for the Panel */}

<div style={{ 
    backgroundColor: '#4a148c', 
    color: 'white', 
    padding: '10px 15px', 
    fontWeight: 'bold', 
    fontSize: '14px',
    display: 'flex',          // Enables flexbox
    alignItems: 'center',      // Vertical center
    justifyContent: 'center', // Horizontal center
    gap: '10px'               // Space between icon and text
}}>
    <UsersRound size={18} strokeWidth={2.5} />
    <span>Doctor Registry List</span>
</div>

    {/* Scrollable Area - Height restricted to roughly 5 entries */}
    <div className="custom-scrollbar" style={{ 
        padding: '0px', 
        overflowY: 'auto', 
        maxHeight: '250px'
    }}>
        <table className="operation-table" width="100%" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f3e5f5', zIndex: 1 }}>
                <tr style={{ textAlign: 'left', color: '#4a148c' }}>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ede7f6' }}>ID</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ede7f6' }}>Doctor Name</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ede7f6' }}>Email ID</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ede7f6' }}>Phone No</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ede7f6' }}>Notification</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ede7f6', textAlign: 'center' }}>Action</th>
                </tr>
            </thead>
            <tbody>
                {doctors.length > 0 ? (
                    doctors.map((doc) => (
                        <tr key={doc.id} style={{ borderBottom: '1px solid #f3e5f5' }}>
                            <td style={{ padding: '10px 12px', fontSize: '13px' }}>{doc.id}</td>
                            <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '500' }}>{doc.doctor_name}</td>
                            <td style={{ padding: '10px 12px', fontSize: '13px' }}>{doc.email_id}</td>
                            <td style={{ padding: '10px 12px', fontSize: '13px' }}>{doc.phone_no}</td>
                            <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                                <span style={{ 
                                    padding: '2px 8px', 
                                    borderRadius: '12px', 
                                    backgroundColor: doc.notification_required === 'Yes' ? '#e8f5e9' : '#ffebee',
                                    color: doc.notification_required === 'Yes' ? '#2e7d32' : '#c62828',
                                    fontSize: '11px',
                                    fontWeight: 'bold'
                                }}>
                                    {doc.notification_required}
                                </span>
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <button 
                                    onClick={() => startEdit(doc)} 
                                    className="view-page-btn" 
                                    style={{ marginRight: '8px', backgroundColor: '#2196F3', padding: '4px 8px' }}
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(doc.id)} 
                                    className="view-page-btn" 
                                    style={{ backgroundColor: '#f44336', padding: '4px 8px' }}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                            No doctors found in the database.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
    
    {/* Footer for the table panel to show status */}
    <div style={{ padding: '8px 15px', backgroundColor: '#f3e5f5', fontSize: '11px', color: '#4a148c', textAlign: 'right', borderTop: '1px solid #e1bee7' }}>
        Total Records: {doctors.length}
    </div>

    {/* Custom Scrollbar CSS */}
    <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #7b1fa2; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4a148c; }
        .operation-table tr:hover { backgroundColor: #fafafa; }
    `}</style>
</div>
            </main>
            {/* Footer */}
                                   <Box sx={{ 
                                       mt: 'auto', p: 1.5, bgcolor: '#4a148c', color: 'rgba(255,255,255,0.8)', 
                                       display: 'flex', justifyContent: 'center', gap: 4, position: 'fixed', bottom: 0, width: '100%'
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

export default DoctorDetails;