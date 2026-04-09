import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2'; 
import { Box, Typography, Paper, IconButton, TextField, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid'; 
import HomeIcon from '@mui/icons-material/Home';
import { Tag, SquarePen } from 'lucide-react';
import EditIcon from '@mui/icons-material/Edit';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import DeleteIcon from '@mui/icons-material/Delete';

import "../styles/home.css";

function TitleDetails() {
    const navigate = useNavigate(); 
    const [titleName, setTitleName] = useState('');
    const [titles, setTitles] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    const fetchTitles = () => {
        fetch('http://localhost:5000/api/titles')
            .then(res => res.json())
            .then(res => {
                if(res.success) setTitles(res.data);
            })
            .catch(err => console.error("Error fetching titles:", err));
    };

    useEffect(() => { fetchTitles(); }, []);


    const columns = [
        { 
            field: 'id', 
            headerName: 'Title Id', 
            width: 120, 
            headerAlign: 'center', 
            align: 'center', 
        },
        { 
            field: 'title_name', 
            headerName: 'Title Name', 
            flex: 1, 
            headerAlign: 'center', 
            align: 'center' 
        },
        {
    field: 'actions',
    headerName: 'Action',
    width: 120, 
    headerAlign: 'center',
    align: 'center',
    sortable: false,
    renderCell: (params) => (
        <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%' 
        }}>
            <IconButton
                size="small"
                sx={{ 
                    color: '#4a148c', 
                    '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.1)' } 
                }}
                onClick={() => startEdit(params.row)}
            >
                <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
                size="small"
                sx={{ 
                    color: '#f44336', 
                    '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)' } 
                }}
                onClick={() => handleDelete(params.row.id)}
            >
                <DeleteIcon fontSize="small" />
            </IconButton>
        </Box>
    ),
},
    ];

    const handleSave = async () => {
        if (!titleName) {
            return Swal.fire({
                icon: 'warning',
                title: 'Empty Field',
                text: 'Please enter a title name',
                confirmButtonColor: '#4a148c'
            });
        }

        const url = editingId 
            ? `http://localhost:5000/api/update-title/${editingId}` 
            : 'http://localhost:5000/api/add-title';
        
        const method = editingId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titleName })
            });
            const data = await response.json();
            if (data.success) {
                Toast.fire({
                    icon: 'success',
                    title: editingId ? 'Title updated' : 'Title added'
                });
                setTitleName('');
                setEditingId(null); 
                fetchTitles();
            }
        } catch (err) {
            Swal.fire('Error', 'Failed to save title', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Title?',
            text: "This might affect records using this title.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#4a148c',
            confirmButtonText: 'Yes, delete it'
        });

        if (result.isConfirmed) {
            try {
                await fetch(`http://localhost:5000/api/delete-title/${id}`, { method: 'DELETE' });
                Toast.fire({ icon: 'success', title: 'Deleted successfully' });
                fetchTitles();
            } catch (err) {
                Swal.fire('Error', 'Could not delete title', 'error');
            }
        }
    };

    const startEdit = (t) => {
        setEditingId(t.id);
        setTitleName(t.title_name);
        Toast.fire({ icon: 'info', title: `Editing: ${t.title_name}`, timer: 1000 });
    };

    return (
        <div className="home-wrapper" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100vh', 
            backgroundColor: '#f3e5f5' 
        }}>
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

            {/* Main Content */}
            <main className="dashboard-content" style={{ 
                flex: 1, 
                padding: '50px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                overflowY: 'auto' 
            }}>
                
                {/* Input Panel */}
                <div className="admin-panel" style={{ width: '100%', maxWidth: '800px', flexShrink: 0 }}>
                   
<div style={{ 
    backgroundColor: '#4a148c', 
    color: 'white', 
    padding: '20px', 
    fontWeight: 'bold', 
    borderRadius: '4px 4px 0 0',
    display: 'flex',
    alignItems: 'center',      
    justifyContent: 'center',  
    gap: '12px' 
}}>

    {editingId ? (
        <SquarePen size={22} strokeWidth={2.5} />
    ) : (
        <Tag size={22} strokeWidth={2.5} />
    )}

    <span>
        Title Details {editingId ? '(Editing)' : ''}
    </span>
</div>
                    <div style={{ 
                        padding: '20px', 
                        display: 'flex', 
                        gap: '15px', 
                        alignItems: 'center', 
                        backgroundColor: 'white',
                        flexWrap: 'wrap',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <label style={{ fontWeight: 'bold' }}>Title Name</label>
                        <input 
                            className="purple-select" 
                            style={{ flex: '1 1 200px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                            placeholder="e.g. Mr. / Mrs. / Dr."
                            value={titleName} 
                            onChange={e => setTitleName(e.target.value)} 
                        />
                        <button className="innovative-btn" onClick={handleSave} style={{ minWidth: '100px' }}>
                            {editingId ? 'Update' : 'Save'}
                        </button>
                        {editingId && (
                            <button className="innovative-btn"
                                onClick={() => {setEditingId(null); setTitleName('');}} 
                                style={{minWidth: '100px'}}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Data Grid Section */}
                <div className="admin-panel" style={{ 
                    marginTop: '4px', 
                    width: '100%', 
                    maxWidth: '800px', 
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    height: '450px' 
                }}>
                    <DataGrid
                        rows={titles}
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 7, page: 0 },
                            },
                        }}
                        pageSizeOptions={[7]}
                        disableRowSelectionOnClick
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-columnHeaders': {
                                borderBottom: '2px solid #eee',
                                backgroundColor: '#e1bee7'
                            },
                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px solid #eee',
                                
                            },
                            '& .MuiDataGrid-footerContainer': {
                                borderTop: '1px solid #eee',
                            }
                        }}
                    />
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

            <style>{`
                @media (max-width: 600px) {
                    .admin-panel { width: 95% !important; }
                    .dashboard-content { padding: 10px !important; }
                }
            `}</style>
        </div>
    );
}

export default TitleDetails;