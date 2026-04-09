import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { DataGrid } from '@mui/x-data-grid'; 
import Swal from 'sweetalert2';
import "../styles/home.css";
import { Edit3, Trash2 } from 'lucide-react';
import HomeIcon from '@mui/icons-material/Home';
import { UserPlus } from 'lucide-react';
import { Box, IconButton, Typography } from '@mui/material';
import {Search, Home, Mail, MapPin } from 'lucide-react';

function CreateUser() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        username: '', password: '', confirmPassword: '', role: '', isAdmin: false
    });
    const [signature, setSignature] = useState(null);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetData, setResetData] = useState({ username: '', newPassword: '' });
    const [showTable, setShowTable] = useState(false);
    const [users, setUsers] = useState([]);

    // DataGrid Column Definitions
    const columns = [
        { field: 'ID', headerName: 'ID', width: 90 },
        { field: 'Username', headerName: 'User Name', flex: 1, minWidth: 150 },
        { field: 'Role', headerName: 'Role', flex: 1, minWidth: 120 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 180,
            sortable: false,
            renderCell: (params) => (
<div style={{ display: 'flex', gap: '12px', alignItems: 'center', height: '100%' }}>
    <Edit3 
        size={20}
        onClick={() => handleEdit(params.row)} 
        style={{ color: '#4a148c', cursor: 'pointer', transition: 'transform 0.2s' }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
    />
    <Trash2 
        size={20}
        onClick={() => handleDelete(params.row.ID || params.row.id)} 
        style={{ color: '#f44336', cursor: 'pointer', transition: 'transform 0.2s' }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
    />
</div>
            ),
        },
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
    // Inject custom style to force SweetAlert above the header
    const style = document.createElement('style');
    style.innerHTML = `.swal2-container { z-index: 2000 !important; }`;
    document.head.appendChild(style);
    
    return () => {
        document.head.removeChild(style); // Cleanup on unmount
    };
}, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/get-users');
            const result = await response.json();
            if (result.success) {
                setUsers(result.data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Validation with SweetAlert
    if (!userData.username || !userData.password || !userData.role) {
        return Swal.fire({
            icon: 'warning',
            title: 'Required Fields',
            text: 'Username, Password, and Role are mandatory.',
            confirmButtonColor: '#4a148c'
        });
    }
    
    if (userData.password !== userData.confirmPassword) {
        return Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Passwords do not match!',
            confirmButtonColor: '#4a148c'
        });
    }

    const dataToSend = new FormData();
    dataToSend.append('username', userData.username);
    dataToSend.append('password', userData.password);
    dataToSend.append('role', userData.role);
    dataToSend.append('isAdmin', userData.isAdmin ? 1 : 0);
    if (signature) dataToSend.append('signature', signature);

    try {
        const response = await fetch('http://localhost:5000/api/register-full', {
            method: 'POST',
            body: dataToSend
        });
        const result = await response.json();
        
        if (result.success) {
            // SUCCESS ANIMATION
            Swal.fire({
                icon: 'success',
                title: 'User Created!',
                text: `Welcome, ${userData.username}!`,
                showConfirmButton: false,
                timer: 2000,
                willClose: () => {
                    navigate('/home');
                }
            });
        } else {
            Swal.fire('Failed', result.message, 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Could not connect to server', 'error');
    }
};

   const handlePasswordUpdate = async () => {
    if (!resetData.username || !resetData.newPassword) {
        return Swal.fire({
            icon: 'warning',
            title: 'Missing Info',
            text: 'Please enter both Username and New Password.',
            confirmButtonColor: '#4a148c'
        });
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/update-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: resetData.username,
                newPassword: resetData.newPassword
            }),
        });
        const data = await response.json();
        
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Password Updated!',
                text: `Security credentials updated for ${resetData.username}`,
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
            
            setShowResetModal(false);
            setResetData({ username: '', newPassword: '' });
            fetchUsers(); 
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Connection Error',
            text: 'Unable to reach the server.',
            confirmButtonColor: '#4a148c'
        });
    }
};

    const handleView = () => {
    if (!showTable) {
        fetchUsers();
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Loading users...',
            showConfirmButton: false,
            timer: 1000
        });
    }
    setShowTable(!showTable);
};

const handleEdit = (user) => {
    setResetData({ username: user.Username, newPassword: '' });
    setShowResetModal(true);
    Swal.fire({
        toast: true,
        position: 'top-end',
        title: `Editing: ${user.Username}`,
        showConfirmButton: false,
        timer: 1500
    });
};

    const handleDelete = async (userId) => {
    if (!userId && userId !== 0) return;

    Swal.fire({
        title: 'Delete User?',
        text: "This action cannot be undone!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#4a148c',
        confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`http://localhost:5000/api/delete-user/${userId}`, { method: 'DELETE' });
                const data = await response.json();
                if (data.success) {
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'User has been removed.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    fetchUsers();
                }
            } catch (error) {
                Swal.fire('Error', 'Failed to delete user.', 'error');
            }
        }
    });
};

    return (
        <div className="home-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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

            <main className="dashboard-content" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '40px', paddingBottom: '40px' }}>
                <div className="admin-panel" style={{ width: '90%', maxWidth: '800px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                   <div style={{ 
    backgroundColor: '#4a148c', 
    color: 'white', 
    padding: '15px', 
    borderRadius: '8px 8px 0 0', 
    display: 'flex',           // Added for alignment
    alignItems: 'center',       // Centers icon vertically
    justifyContent: 'center',  // Centers content horizontally
    gap: '12px',               // Space between icon and text
    fontWeight: 'bold', 
    fontSize: '1.2rem' 
}}>
    {/* Lucide-react UserPlus icon */}
    <UserPlus size={24} strokeWidth={2.5} /> 
    
    <span>New User Registration</span>
</div>

                    <div className="card-form" style={{ padding: '30px' }}>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '20px', alignItems: 'center' }}>
                            <label style={{ color: '#4a148c', fontWeight: 'bold' }}>User Name<span style={{ color: 'red' }}>*</span></label>
                            <input type="text" className="purple-select" placeholder="Enter Username"
                                value={userData.username} onChange={e => setUserData({ ...userData, username: e.target.value })} />

                            <label style={{ color: '#4a148c', fontWeight: 'bold' }}>Password</label>
                            <input type="password" className="purple-select" placeholder="Password"
                                value={userData.password} onChange={e => setUserData({ ...userData, password: e.target.value })} />

                            <label style={{ color: '#4a148c', fontWeight: 'bold' }}>Confirm Password</label>
                            <input type="password" className="purple-select" placeholder="Confirm Password"
                                value={userData.confirmPassword} onChange={e => setUserData({ ...userData, confirmPassword: e.target.value })} />

                            <label style={{ color: '#4a148c', fontWeight: 'bold' }}>Signature</label>
                            <input type="file" onChange={e => setSignature(e.target.files[0])} />

                            <label style={{ color: '#4a148c', fontWeight: 'bold' }}>Select Role</label>
                            <select className="purple-select" value={userData.role} onChange={e => setUserData({ ...userData, role: e.target.value })}>
                                <option value="">--Select Role--</option>
                                <option value="Admin">Admin</option>
                                <option value="Lab">FrontDesk</option>
                                <option value="Invoive">Sample Collect</option>
                                <option value="Invoive">Lab View</option>
                                <option value="Invoive">Approver</option>
                                <option value="Invoive">Customer Care</option>
                                <option value="Invoive">Patient Details</option>
                                <option value="Invoive">Table View</option>
                                <option value="Invoive">Ammend</option>
                            </select>

                            <label style={{ color: '#4a148c', fontWeight: 'bold' }}>Is Admin</label>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <label><input type="radio" name="isAdmin" checked={userData.isAdmin === true} onChange={() => setUserData({ ...userData, isAdmin: true })} /> Yes</label>
                                <label><input type="radio" name="isAdmin" checked={userData.isAdmin === false} onChange={() => setUserData({ ...userData, isAdmin: false })} /> No</label>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px' }}>
                            <button className="innovative-btn" style={{ width: '150px' }} onClick={() => setShowResetModal(true)}>Reset Password</button>
                            <button className="innovative-btn" style={{ width: '150px' }} onClick={handleSubmit}>Submit User</button>
                            <button className="innovative-btn" style={{ width: '150px' }} onClick={handleView}>{showTable ? "Hide Table" : "View Users"}</button>
                        </div>
                    </div>
                </div>
            </main>

            {/* --- DataGrid Section --- */}
            {showTable && (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingBottom: '100px' }}>
                    <div style={{ 
                        width: '90%', 
                        maxWidth: '800px', 
                        height: 400, 
                        backgroundColor: 'white', 
                        borderRadius: '8px', 
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '2px solid #4a148c' }}>
                            <h3 style={{ color: '#4a148c', margin: 0 }}>Registered Users</h3>
                            <button onClick={() => setShowTable(false)} style={{ color: '#f44336', cursor: 'pointer', border: 'none', background: 'none', fontWeight: 'bold' }}>[X] Close</button>
                        </div>
                        
                        <DataGrid
    rows={users}
    columns={columns}
    getRowId={(row) => (row.ID !== undefined ? row.ID : row.id)} 
    initialState={{
        pagination: {
            paginationModel: { pageSize: 5, page: 0 },
        },
    }}
    pageSizeOptions={[5]} 
    
    disableSelectionOnClick
    sx={{
        border: 'none',
        '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f5f5',
            color: '#4a148c',
            fontWeight: 'bold',
        },
        '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid #eee'
        }
    }}
/>
                    </div>
                </div>
            )}

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

            {/* Reset Modal */}
            {showResetModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '350px' }}>
                        <h3 style={{ color: '#4a148c', marginTop: 0 }}>Reset Password</h3>
                        <label>Username</label>
                        <input type="text" className="purple-select" style={{ width: '100%', marginBottom: '15px' }} onChange={(e) => setResetData({ ...resetData, username: e.target.value })} />
                        <label>New Password</label>
                        <input type="password" className="purple-select" style={{ width: '100%', marginBottom: '20px' }} onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="innovative-btn" onClick={handlePasswordUpdate} style={{ flex: 1 }}>Update</button>
                            <button className="innovative-btn" onClick={() => setShowResetModal(false)} style={{ flex: 1, backgroundColor: '#ccc' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateUser;