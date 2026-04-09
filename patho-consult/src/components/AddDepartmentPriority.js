import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, TextField, Button
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { ListOrdered } from 'lucide-react';
import SaveIcon from '@mui/icons-material/Save';
import Swal from 'sweetalert2';
import { FileEdit, Search, Home, Mail, MapPin } from 'lucide-react';

function AddDepartmentPriority() {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); 
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
    const filteredDepartments = departments.filter(dept => 
        dept.DepartmentName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const fetchData = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/get-departments');
            const result = await response.json();
            if (result.success) {
                const mappedData = result.data.map(dept => ({
                    ...dept,
                    newPriority: dept.Priority || '' 
                }));
                setDepartments(mappedData);
            }
        } catch (error) {
            console.error("Error fetching departments:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePriorityChange = (id, value) => {
        setDepartments(prev => 
            prev.map(dept => dept.DepartmentID === id ? { ...dept, newPriority: value } : dept)
        );
    };

    const handleSaveAll = async () => {
    if (departments.length === 0) return;
    Swal.fire({
        title: 'Updating Priorities...',
        text: 'Re-ordering departments in the master list.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    const updateData = departments.map(dept => ({
        id: dept.DepartmentID,
        priority: dept.newPriority === '' || dept.newPriority === undefined 
                  ? 0 
                  : parseInt(dept.newPriority)
    }));

    try {
        const response = await fetch('http://localhost:5000/api/update-dept-priority', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priorities: updateData })
        });
        
        const result = await response.json();

        if (result.success) {
            Toast.fire({
                icon: 'success',
                title: 'Priorities updated successfully!'
            });

            fetchData(); 
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: result.error || result.message || "Unknown server error"
            });
        }
    } catch (error) {
        console.error("Save error:", error);
        Swal.fire('Connection Error', 'Could not reach the database server.', 'error');
    }
};

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f6dcfa' }}>
            
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
            

            <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: -2 }}>
    <ListOrdered size={20} color="#4a148c" strokeWidth={2.5} />
    
    <Typography variant="subtitle1" sx={{ color: '#4a148c', fontWeight: 'bold' }}>
        Department Priority Management
    </Typography>
</Box>

                {/* --- ADDED SEARCH BAR HERE --- */}
                <TextField 
                    placeholder="Search Department by Name..."
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ maxWidth: 900, mb: 2, bgcolor: 'white', borderRadius: '4px' }}
                />

                <Paper sx={{ width: '100%', maxWidth: 900, borderRadius: '8px', overflow: 'hidden', boxShadow: 3 }}>
                    
                    <Box sx={{ p: 1, bgcolor: '#f3e5f5', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                        <Typography color="#4a148c" variant="subtitle2" fontWeight="bold">Department Details</Typography>
                        
                    </Box>

                    <TableContainer sx={{ maxHeight: '60vh' }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#4a148c', color: 'white' }}>ID</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#4a148c', color: 'white' }}>Department Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#4a148c', color: 'white', textAlign: 'center' }}>Existing Priority</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#4a148c', color: 'white' }}>Update Priority</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/* --- CHANGED FROM departments TO filteredDepartments --- */}
                                {filteredDepartments.map((dept) => (
                                    <TableRow key={dept.DepartmentID} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#fcfaff' } }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{dept.DepartmentID}</TableCell>
                                        <TableCell>{dept.DepartmentName}</TableCell>
                                        <TableCell align="center">{dept.Priority || 0}</TableCell>
                                        <TableCell>
                                            <TextField 
                                                size="small" 
                                                variant="outlined" 
                                                type="number"
                                                placeholder="Level"
                                                value={dept.newPriority}
                                                onChange={(e) => handlePriorityChange(dept.DepartmentID, e.target.value)}
                                                sx={{ width: 100, bgcolor: 'white' }} 
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredDepartments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                            No departments found matching "{searchTerm}"
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', bgcolor: '#f3e5f5' }}>
                        <Button 
                            variant="contained" 
                            startIcon={<SaveIcon />}
                            onClick={handleSaveAll}
                            sx={{ 
                                bgcolor: '#4a148c', 
                                borderRadius: '20px', 
                                px: 4, 
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#6a1b9a' } 
                            }}
                        >
                            Update All Priorities
                        </Button>
                    </Box>
                </Paper>
            </Box>

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

export default AddDepartmentPriority;