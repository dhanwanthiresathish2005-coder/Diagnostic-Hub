import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, IconButton, TextField, 
    Button, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid'; 
import Swal from 'sweetalert2';
import HomeIcon from '@mui/icons-material/Home';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Microscope } from 'lucide-react';
import { Dna } from 'lucide-react';
import { FileEdit, Search, Home, Mail, MapPin } from 'lucide-react';
function AddIsolatedOrgans() {
    const navigate = useNavigate();
    const [organismName, setOrganismName] = useState('');
    const [cultureCategory, setCultureCategory] = useState(null);
    const [organList, setOrganList] = useState([]);
    
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editData, setEditData] = useState({ id: '', name: '', category: '' });

    const categories = ['Urine', 'Blood', 'Sputum', 'Pus', 'Stool', 'Wound Swab'];
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

    // DataGrid Column Definitions
    const columns = [
        { field: 'OrganismName', headerName: 'Organism Name', flex: 1, headerAlign: 'center', align: 'center' },
        { field: 'CultureCategory', headerName: 'Category', flex: 1, headerAlign: 'center', align: 'center' },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            headerAlign: 'center',
            align: 'center',
            sortable: false,
            renderCell: (params) => (
                <Box>
                    <IconButton onClick={() => handleEditClick(params.row)} sx={{ color: '#4a148c' }}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(params.row.id)} color="error">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            ),
        },
    ];

    const fetchOrgans = () => {
        fetch('http://localhost:5000/api/get-isolated-organs')
            .then(res => res.json())
            .then(result => {
                if (result.success) setOrganList(result.data);
            })
            .catch(err => console.error("Error fetching organs:", err));
    };

    useEffect(() => {
        fetchOrgans();
    }, []);

const handleSave = async () => {
    // 1. STRICT GUARD: Prevent saving unless both fields exist
    if (!organismName?.trim() || !cultureCategory) {
        return Swal.fire({
            icon: 'warning',
            title: 'Incomplete Data',
            text: 'Please provide both the Organism Name and the Culture Category.',
            confirmButtonColor: '#4a148c'
        });
    }

    // 2. LOADING STATE: UI feedback during DB write
    Swal.fire({
        title: 'Saving Organism...',
        didOpen: () => { Swal.showLoading(); },
        allowOutsideClick: false
    });

    try {
        const response = await fetch('http://localhost:5000/api/save-isolated-organ', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ organismName, cultureCategory })
        });

        const result = await response.json();
        Swal.close();

        if (result.success) {
            // 3. SUCCESS: Show Toast and clear inputs
            Toast.fire({
                icon: 'success',
                title: 'Organism saved to database'
            });

            setOrganismName('');
            setCultureCategory(null);
            fetchOrgans(); // Refresh your table list
        } else {
            Swal.fire('Save Failed', result.message || 'Database error occurred.', 'error');
        }
    } catch (err) {
        Swal.fire('Connection Error', 'Check your microbiology service/backend.', 'error');
    }
};

const handleDelete = async (id) => {
    // 4. CONFIRMATION: Prevent accidental data loss
    const confirm = await Swal.fire({
        title: 'Delete Organism?',
        text: "This organism will be removed from your master list.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#4a148c',
        confirmButtonText: 'Yes, delete it!'
    });

    if (confirm.isConfirmed) {
        try {
            const res = await fetch(`http://localhost:5000/api/delete-isolated-organ/${id}`, { method: 'DELETE' });
            const result = await res.json();

            if (result.success) {
                Toast.fire({ icon: 'success', title: 'Record deleted' });
                fetchOrgans();
            } else {
                Swal.fire('Error', 'Could not delete the record.', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Server connection failed.', 'error');
        }
    }
};

    const handleEditClick = (row) => {
        setEditData({ id: row.id, name: row.OrganismName, category: row.CultureCategory });
        setIsEditOpen(true);
    };

    const handleUpdate = async () => {
    // --- 1. THE SATISFACTION GUARD ---
    // Check if the name is just spaces or if the category is missing
    if (!editData.name?.trim() || !editData.category) {
        return Swal.fire({
            icon: 'error',
            title: 'Action Blocked',
            text: 'Organism Name and Culture Category cannot be empty.',
            confirmButtonColor: '#d32f2f'
        });
    }

    // --- 2. LOADING STATE ---
    Swal.fire({
        title: 'Updating Organism...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const res = await fetch(`http://localhost:5000/api/edit-isolated-organ/${editData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                organismName: editData.name, 
                cultureCategory: editData.category 
            })
        });

        const result = await res.json();
        Swal.close();

        if (result.success) {
            // --- 3. SUCCESS FEEDBACK ---
            Toast.fire({
                icon: 'success',
                title: 'Organism updated successfully!'
            });

            setIsEditOpen(false);
            fetchOrgans(); // Refresh the list in the background
        } else {
            Swal.fire('Update Failed', result.message || 'Database rejected the change.', 'error');
        }
    } catch (err) {
        Swal.close();
        console.error("Update Error:", err);
        Swal.fire('Server Error', 'Could not connect to the microbiology service.', 'error');
    }
};

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f3e5f5' }}>
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

            {/* Navigation Bar */}
<Box 
    sx={{ 
        p: 1.5, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: 1.5,
        
    }}
>
    {/* Thick strokeWidth to balance the 900 font weight */}
    <Microscope size={22} color="#7b1fa2" strokeWidth={3} />

    <Typography 
        variant="body2" 
        sx={{ 
            color: '#7b1fa2', 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            fontSize: '15px',
            mt: 0 
        }}
    >
        Manage Isolated Organs
    </Typography>
</Box>


            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', p: 2}}>
                <Paper elevation={6} sx={{ width: '95%', maxWidth: 1000, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column',mt: -1 }}>
<Box 
    sx={{ 
        p: 2, 
        bgcolor: '#f8f4ff', 
        borderBottom: '2px solid #ce93d8', 
        display: 'flex',
        flexDirection: 'row', // Aligns items horizontally
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 1.5 // Slightly wider gap for horizontal layout
    }}
>
    <Dna size={24} color="#4a148c" strokeWidth={2.5} />
    
    <Typography variant="h6" fontWeight="bold" color="#4a148c">
        Organism Management
    </Typography>
</Box>

                    <Box sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Form */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 650, gap: 2 }}>
                                <Typography sx={{ minWidth: 160, fontWeight: 'bold', color: '#4a148c' }}>Organism Name:</Typography>
                                <TextField fullWidth size="small" value={organismName} onChange={(e) => setOrganismName(e.target.value)} />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 650, gap: 2 }}>
                                <Typography sx={{ minWidth: 160, fontWeight: 'bold', color: '#4a148c' }}>Category:</Typography>
                                <Autocomplete 
                                    fullWidth size="small" options={categories} 
                                    value={cultureCategory} onChange={(e, val) => setCultureCategory(val)}
                                    renderInput={(params) => <TextField {...params} placeholder="Select" />}
                                />
                            </Box>
                            <Button variant="contained" onClick={handleSave} sx={{ mt: 1, px: 6, bgcolor: '#4a148c', borderRadius: '20px' }}>Save</Button>
                        </Box>

                        {/* DataGrid (Scrollable) */}
                        <Box sx={{ height: 400, width: '100%' }}>
                            <DataGrid
                                rows={organList}
                                columns={columns}
                                pageSizeOptions={[5, 10]}
                                initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                                disableRowSelectionOnClick
                                sx={{
                                    border: '1px solid #ce93d8',
                                    '& .MuiDataGrid-columnHeaders': { bgcolor: '#f3e5f5', color: '#4a148c', fontWeight: 'bold' },
                                    '& .MuiDataGrid-virtualScroller': { bgcolor: 'white' },
                                }}
                            />
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ bgcolor: '#4a148c', color: 'white' }}>Edit Organism</DialogTitle>
                <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Name" fullWidth size="small" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} sx={{ mt: 1 }} />
                    <Autocomplete 
                        options={categories} value={editData.category} 
                        onChange={(e, val) => setEditData({...editData, category: val})}
                        renderInput={(params) => <TextField {...params} label="Category" size="small" />}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsEditOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdate} sx={{ bgcolor: '#4a148c' }}>Update</Button>
                </DialogActions>
            </Dialog>

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
        </Box>
    );
}

export default AddIsolatedOrgans;