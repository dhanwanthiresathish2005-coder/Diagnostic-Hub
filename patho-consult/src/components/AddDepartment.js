import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, IconButton, TextField, Grid } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import HomeIcon from '@mui/icons-material/Home';
import { LayoutGrid } from 'lucide-react';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Search, Home, Mail, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';

const AddDepartment = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [deptName, setDeptName] = useState("");
    const currentDate = new Date().toLocaleString();
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

    const fetchData = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/get-departments');
            const result = await res.json();
            if (result.success) setDepartments(result.data);
        } catch (err) { console.error("Fetch error:", err); }
    };

    useEffect(() => { fetchData(); }, []);

const handleSubmit = async (e) => {
    e.preventDefault();

    if (!deptName) {
        return Toast.fire({
            icon: 'warning',
            title: 'Department Name Required',
            text: 'Please enter a name (e.g., Pathology).'
        });
    }
    

    Swal.fire({
        title: 'Adding Department...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const res = await fetch('http://localhost:5000/api/add-department', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: deptName })
        });

        const result = await res.json();
        Swal.close();

        if (result.success) {
            Toast.fire({
                icon: 'success',
                title: 'Department Added Successfully!'
            });

            setDeptName("");
            fetchData(); 
        } else {
            Swal.fire('Error', result.message || 'Could not add department.', 'error');
        }
    } catch (err) { 
        console.error("Submit error:", err);
        Swal.fire('Server Error', 'Check your backend connection.', 'error');
    }
};

    
const columns = [
    { field: 'DepartmentID', headerName: 'ID', width: 100 },
    { field: 'DepartmentName', headerName: 'Department Name', flex: 1 },
    {
        field: 'action',
        headerName: 'Action',
        width: 120,
        sortable: false,
        renderCell: (params) => (
            <IconButton color="error" onClick={() => handleDelete(params.row.DepartmentID)}>
                <DeleteIcon />
            </IconButton>
        )
    }
];

const handleDelete = async (id) => {
    const result = await Swal.fire({
        title: 'Delete Department?',
        text: "Warning: This may affect all tests currently assigned to this department!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', 
        cancelButtonColor: '#4a148c', 
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel'
    });


    if (result.isConfirmed) {
        try {
            const res = await fetch(`http://localhost:5000/api/delete-department/${id}`, { 
                method: 'DELETE' 
            });
            
            const data = await res.json();

            if (data.success) {
                Toast.fire({
                    icon: 'success',
                    title: 'Department deleted successfully'
                });
                
                fetchData(); 
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Delete Failed',
                    text: data.message || "Cannot delete a department that has active tests."
                });
            }
        } catch (err) {
            console.error("Delete error:", err);
            Swal.fire('Error', 'Connection to server failed.', 'error');
        }
    }
};
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f6dcfa', pb: 8 }}>
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

            <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 3, px: 2 }}>

<Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 1, 
    mb: 1 
}}>
    <LayoutGrid size={16} color="#4a148c" strokeWidth={2.5} />
    
    <Typography 
        align="center" 
        variant="subtitle2" 
        sx={{ 
            color: '#4a148c', 
            fontWeight: 'bold',
            fontSize: '15px',
            textTransform: 'uppercase', 
            letterSpacing: '0.5px'
        }}
    >
        Department and Profile View
    </Typography>
</Box>

                {/* Form Section */}
                <Paper sx={{ p: 4, mb: 3, borderRadius: '8px', position: 'relative' }}>

                    <Grid container spacing={4} alignItems="center" justifyContent="center">
                        <Grid item xs={12} md={5}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Department Name</Typography>
                                <TextField 
                                    fullWidth size="small" 
                                    value={deptName}
                                    onChange={(e) => setDeptName(e.target.value)}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Create Date</Typography>
                                <TextField fullWidth size="small" disabled value={currentDate} />
                            </Box>
                        </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Button 
                            variant="contained" 
                            onClick={handleSubmit}
                            sx={{ bgcolor: 'blue', px: 4, borderRadius: '20px', textTransform: 'none' }}
                        >
                            Submit
                        </Button>
                    </Box>
                </Paper>

                {/* DataGrid Section */}
                <Paper sx={{ height: 400, width: '100%', overflow: 'hidden', boxShadow: 3 }}>
                    <DataGrid 
                        rows={departments} 
                        columns={columns} 
                        getRowId={(row) => row.DepartmentID}
                        pageSizeOptions={[5, 10]}
                        initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                        sx={{
                            '& .MuiDataGrid-columnHeader': { bgcolor: '#4a148c', color: 'white' },
                            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold' }
                        }}
                    />
                </Paper>
            </Box>

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
            
        </Box>
    );
};

export default AddDepartment;