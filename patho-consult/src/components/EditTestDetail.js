import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Box, Typography, TextField, Button, Paper, Grid, IconButton, 
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    CircularProgress
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import SaveIcon from '@mui/icons-material/Save';
import Swal from 'sweetalert2';
const EditTestDetail = () => {
    const { id } = useParams(); // Retrieves the TestID from the URL
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [openDelete, setOpenDelete] = useState(false);
    
    // Initializing state with all major fields from your database schema
    const [formData, setFormData] = useState({
        TestName: '',
        TestCode: '',
        Price: 0,
        Department: '',
        TurnAroundTime: '',
        CutOffTime: '',
        TestSchedule: '',
        SampleContainer: '',
        Methodology: '',
        Category: ''
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

    // 1. FETCH DATA ON LOAD: Auto-fills the form based on the TestID
    useEffect(() => {
        const fetchTestDetails = async () => {
            try {
                // Calling the specialized single-test API
                const res = await fetch(`http://localhost:5000/api/inventory/test/${id}`);
                const result = await res.json();
                
                if (result.success) {
                    setFormData(result.data); // This auto-fills all fields via state
                } else {
                    alert("Test not found");
                    navigate('/view-edit-test');
                }
            } catch (err) {
                console.error("Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTestDetails();
    }, [id, navigate]);

    // 2. DYNAMIC AUTO-GENERATION: Updates Code if Name changes during editing
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === "TestName") {
            // Logic: Take first 3 letters + Current ID to keep it unique
            const generatedCode = value.substring(0, 3).toUpperCase() + `-${id}`;
            
            setFormData({ 
                ...formData, 
                TestName: value, 
                TestCode: generatedCode 
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Show loading state
    Swal.fire({
        title: 'Saving Changes...',
        didOpen: () => { Swal.showLoading(); },
        allowOutsideClick: false
    });

    try {
        const res = await fetch(`http://localhost:5000/api/update-test/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await res.json();
        
        if (result.success) {
            await Toast.fire({
                icon: 'success',
                title: 'Test updated successfully!'
            });
            navigate('/view-edit-test');
        } else {
            Swal.fire('Update Failed', result.message || 'Check your database connection.', 'error');
        }
    } catch (err) {
        console.error("Update Error:", err);
        Swal.fire('Server Error', 'Could not reach the backend.', 'error');
    }
};

const handleDelete = async () => {
    const confirmation = await Swal.fire({
        title: 'Are you sure?',
        text: "Deleting this test will remove it from all Profiles and Templates!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#4a148c',
        confirmButtonText: 'Yes, delete it!'
    });

    if (confirmation.isConfirmed) {
        try {
            const res = await fetch(`http://localhost:5000/api/delete-test/${id}`, { 
                method: 'DELETE' 
            });
            const result = await res.json();

            if (result.success) {
                setOpenDelete(false);
                await Swal.fire('Deleted!', 'The test has been removed.', 'success');
                navigate('/view-edit-test');
            } else {
                Swal.fire('Error', result.message || 'Deletion failed.', 'error');
            }
        } catch (err) { 
            console.error("Delete Error:", err);
            Swal.fire('Connection Error', 'Backend unreachable.', 'error');
        }
    }
};
    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f3e5f5' }}>
        <Box 
            component="header" 
            sx={{ 
                p: 1.5, 
                bgcolor: '#4a148c', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                position: 'relative', 
                width: '100%', 
                boxShadow: 3 
            }}
        >
            {/* Centered Title */}
            <Typography variant="h6" fontWeight="bold">
                PATHO CONSULT
            </Typography>
        
             <IconButton 
                        onClick={() => navigate('/home')} 
                        sx={{ position: 'absolute', right: 36, top: 3, color: 'white' }}
                    >
                        <HomeIcon fontSize="large" />
                    </IconButton>
        </Box>
        <Box sx={{ 
                    flexGrow: 1,         
                    display: 'flex', 
                    alignItems: 'center',    
                    justifyContent: 'center', 
                    p: 2, 
                    mb: '200px'          
                }}>
            <Paper sx={{ maxWidth: 900, mx: 'auto', p: 4, borderRadius: 2, boxShadow: 3 }}>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => navigate('/view-edit-test')} sx={{ color: '#4a148c', mr: 2 }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h5" fontWeight="bold" color="#4a148c">
                            Edit: {formData.TestName}
                        </Typography>
                    </Box>
                    <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setOpenDelete(true)}>
                        Remove Test
                    </Button>
                </Box>
                

                <form onSubmit={handleUpdate}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Test Name" name="TestName" value={formData.TestName} onChange={handleChange} variant="outlined" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField 
                                fullWidth 
                                label="Test Code" 
                                name="TestCode" 
                                value={formData.TestCode} 
                                InputProps={{ readOnly: true }} 
                                variant="filled" 
                                helperText="Auto-generated from Name"
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Price (₹)" name="Price" type="number" value={formData.Price} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Department" name="Department" value={formData.Department} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Category" name="Category" value={formData.Category || ''} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Sample Container" name="SampleContainer" value={formData.SampleContainer || ''} onChange={handleChange} placeholder="e.g. EDTA Tube" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Methodology" name="Methodology" value={formData.Methodology || ''} onChange={handleChange} placeholder="e.g. ELISA" />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Schedule" name="TestSchedule" value={formData.TestSchedule} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="TAT" name="TurnAroundTime" value={formData.TurnAroundTime} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth label="Cut-Off" name="CutOffTime" value={formData.CutOffTime} onChange={handleChange} />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Button type="submit" variant="contained" fullWidth startIcon={<SaveIcon />} sx={{ bgcolor: '#4a148c', py: 1.5, mt: 2, '&:hover': { bgcolor: '#38006b' } }}>
                                Save All Changes
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
            </Box>

            {/* Delete Confirmation */}
            <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <b>{formData.TestName}</b>? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Confirm Delete</Button>
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
};

export default EditTestDetail;