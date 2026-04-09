import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, IconButton, TextField, 
    Button, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { DataGrid, GridToolbarQuickFilter } from '@mui/x-data-grid';
import Swal from 'sweetalert2';
import HomeIcon from '@mui/icons-material/Home';
import { Microscope } from 'lucide-react';
import { Edit, DeleteOutline } from '@mui/icons-material';
import {  Tooltip } from '@mui/material';
import { FileEdit, Search, Home, Mail, MapPin } from 'lucide-react';

function AddMicrobialAgent() {
    const navigate = useNavigate();
    const [agentName, setAgentName] = useState('');
    const [cultureCategory, setCultureCategory] = useState(null);
    const [agentList, setAgentList] = useState([]);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editData, setEditData] = useState({ id: '', name: '', category: '' });
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

    const categories = ['Urine', 'Blood', 'Sputum', 'Pus', 'Stool', 'Wound Swab'];

    const fetchData = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/get-microbial-agents');
            const result = await response.json();
            if (result.success) setAgentList(result.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        }
    };

    useEffect(() => { fetchData(); }, []);

const handleSave = async () => {
    // 1. STRICT SATISFACTION GUARD
    if (!agentName?.trim() || !cultureCategory) {
        return Swal.fire({
            icon: 'warning',
            title: 'Fields Required',
            text: 'Please provide both the Agent Name and a valid Category before saving.',
            confirmButtonColor: '#4a148c'
        });
    }

    Swal.fire({ title: 'Saving Agent...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    try {
        const response = await fetch('http://localhost:5000/api/save-microbial-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentName, cultureCategory })
        });
        const result = await response.json();
        Swal.close();

        if (result.success) {
            Toast.fire({ icon: 'success', title: 'Agent added successfully' });
            setAgentName('');
            setCultureCategory(null);
            fetchData();
        } else {
            Swal.fire('Error', result.message || 'Database error', 'error');
        }
    } catch (err) {
        Swal.fire('Server Error', 'Could not connect to microbiology API', 'error');
    }
};

const handleUpdate = async () => {
    // 2. UPDATE GUARD: Prevent saving empty edits
    if (!editData.name?.trim() || !editData.category) {
        return Swal.fire({
            icon: 'error',
            title: 'Invalid Update',
            text: 'Agent Name and Category cannot be blank.',
            confirmButtonColor: '#d32f2f'
        });
    }

    try {
        const response = await fetch(`http://localhost:5000/api/edit-microbial-agent/${editData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentName: editData.name, cultureCategory: editData.category })
        });
        const result = await response.json();
        if (result.success) {
            Toast.fire({ icon: 'success', title: 'Agent updated' });
            setIsEditOpen(false);
            fetchData();
        }
    } catch (err) {
        Swal.fire('Update Failed', 'Server connection lost', 'error');
    }
};

const handleDelete = async (id) => {
    // 3. SAFETY CONFIRMATION
    const result = await Swal.fire({
        title: 'Delete Agent?',
        text: "This agent will be removed from all future culture reports.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#4a148c',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`http://localhost:5000/api/delete-microbial-agent/${id}`, { method: 'DELETE' });
            const resData = await response.json();
            if (resData.success) {
                Toast.fire({ icon: 'success', title: 'Agent removed' });
                fetchData();
            }
        } catch (err) {
            Swal.fire('Delete Error', 'Record is currently in use or server is down.', 'error');
        }
    }
};

    const columns = [
        { 
            field: 'AgentName', 
            headerName: 'Antimicrobial Agent Name', 
            flex: 1.5, 
            headerAlign: 'center', 
            align: 'left',
            filterable: true 
        },
        { 
            field: 'CultureCategory', 
            headerName: 'Culture Category', 
            flex: 1, 
            headerAlign: 'center', 
            align: 'center',
            filterable: true 
        },
        {
            field: 'actions',
            headerName: 'Action',
            width: 180,
            headerAlign: 'center',
            align: 'center',
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                
<Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center' }}>
  {/* EDIT BUTTON */}
  <Tooltip title="Edit Record">
    <IconButton 
      size="small"
      onClick={() => {
        setEditData({ id: params.row.id, name: params.row.AgentName, category: params.row.CultureCategory });
        setIsEditOpen(true);
      }}
      sx={{ 
        color: '#4a148c', 
        bgcolor: '#f3e5f5', // Subtle purple background
        '&:hover': { bgcolor: '#e1bee7' },
        padding: '10px' 
      }}
    >
      <Edit sx={{ fontSize: '1.1rem' }} />
    </IconButton>
  </Tooltip>

  {/* DELETE BUTTON */}
  <Tooltip title="Delete Record">
    <IconButton 
      size="small" 
      onClick={() => handleDelete(params.row.id)}
      sx={{ 
        color: '#d32f2f', 
        bgcolor: '#ffebee', // Subtle red background
        '&:hover': { bgcolor: '#ffcdd2' },
        padding: '10px'
      }}
    >
      <DeleteOutline sx={{ fontSize: '1.1rem' }} />
    </IconButton>
  </Tooltip>
</Box>
            ),
        },
    ];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f0d4f5', fontFamily: 'Roboto, sans-serif' }}>
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
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', p: 3, overflow: 'hidden' }}>
                <Paper elevation={6} sx={{ width: '100%', maxWidth: 1000, display: 'flex', flexDirection: 'column', borderRadius: 2, border: '2px solid #4a148c' }}>
                    
                    {/* Input Form Area */}
                    <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0', bgcolor: '#fafafa' }}>
<Box 
    sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 1.5, 
        mb: 2 
    }}
>
    <Microscope size={24} color="#4a148c" strokeWidth={2.5} />
    
    <Typography 
        variant="h6" 
        fontWeight="bold" 
        textAlign="center" 
        sx={{ color: '#4a148c' }}
    >
        Add Microbial Agent
    </Typography>
</Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600, mx: 'auto' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography sx={{ minWidth: 150, fontWeight: 'bold', fontSize: '0.9rem' }}>Culture Category* :</Typography>
                                <Autocomplete 
                                    fullWidth size="small" options={categories} 
                                    value={cultureCategory} onChange={(e, val) => setCultureCategory(val)}
                                    renderInput={(params) => <TextField {...params} variant="outlined" placeholder="Select Category" />}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography sx={{ minWidth: 150, fontWeight: 'bold', fontSize: '0.9rem' }}>Agent Name :</Typography>
                                <TextField fullWidth size="small" value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Enter Agent Name" />
                            </Box>
                            <Button 
                                variant="contained" onClick={handleSave} 
                                sx={{ bgcolor: '#4a148c', borderRadius: '20px', px: 6, py: 1, alignSelf: 'center', textTransform: 'none', fontWeight: 'bold', '&:hover': { bgcolor: '#6a1b9a' } }}
                            >
                                SAVE
                            </Button>
                        </Box>
                    </Box>

                    {/* Table Area */}
                    <Box sx={{ flex: 1, p: 2, minHeight: 0 }}>
                        <DataGrid
    rows={agentList}
    columns={columns}
    // This prop shows the filter row under the headers
    showColumnFilters={true} 
    slotProps={{
        // This ensures the filter panel stays visible or accessible
        filterPanel: { disableAddFilterButton: true }
    }}
    sx={{
        border: 'none',
        // Styling the filter row to look better
        '& .MuiDataGrid-filterForm': { p: 1 },
        '& .MuiDataGrid-columnHeaders': {
            bgcolor: '#f3e5f5',
            color: '#4a148c',
            fontWeight: 'bold',
            borderBottom: '2px solid #4a148c'
        },
        '& .MuiDataGrid-row:hover': {
            bgcolor: '#fce4ec !important'
        }
    }}
/>
                    </Box>
                </Paper>
            </Box>

{/* Footer */}
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
            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} PaperProps={{ sx: { border: '2px solid #4a148c', borderRadius: 2 } }}>
                <DialogTitle sx={{ bgcolor: '#4a148c', color: 'white', fontWeight: 'bold' }}>Update Microbial Agent</DialogTitle>
                <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 400 }}>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" fontWeight="bold">Agent Name</Typography>
                        <TextField 
                            fullWidth size="small"
                            value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} 
                        />
                    </Box>
                    <Box>
                        <Typography variant="caption" fontWeight="bold">Category</Typography>
                        <Autocomplete 
                            options={categories} value={editData.category} 
                            onChange={(e, val) => setEditData({...editData, category: val})}
                            renderInput={(params) => <TextField {...params} size="small" />}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                    <Button onClick={() => setIsEditOpen(false)} sx={{ color: '#757575', textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdate} sx={{ bgcolor: '#4a148c', textTransform: 'none', px: 3 }}>Update</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default AddMicrobialAgent;