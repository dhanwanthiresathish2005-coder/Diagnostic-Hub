import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    IconButton
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {Search, Home, Mail, MapPin } from 'lucide-react';

function DepartmentPriority() {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);

    // Fetch departments on load
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/get-departments');
                const result = await response.json();
                if (result.success) {
                    setDepartments(result.data);
                }
            } catch (error) {
                console.error("Failed to fetch departments:", error);
            }
        };
        fetchDepartments();
    }, []);

    const handlePriorityChange = (id, newPriority) => {
        setDepartments(prev => 
            prev.map(dept => dept.DepartmentID === id ? { ...dept, NewPriority: newPriority } : dept)
        );
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#78a1a1' }}>
            
            {/* TOP NAVIGATION BAR */}
            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', bgcolor: '#005f5f', position: 'relative' }}>
                <Typography variant="h6" fontWeight="bold">Patho Consult</Typography>
                <Box sx={{ position: 'absolute', right: 20, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">admin</Typography>
                    <IconButton onClick={() => navigate('/')} sx={{ color: 'white' }}>
                        <Typography sx={{ fontSize: '24px' }}>🚪</Typography>
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', py: 4 }}>
                <Paper sx={{ width: '90%', maxWidth: 1000, height: 'fit-content', borderRadius: '4px', overflow: 'hidden', boxShadow: 4 }}>
                    
                    {/* HEADER SECTION */}
                    <Box sx={{ p: 1, textAlign: 'center', borderBottom: '1px solid #ddd', position: 'relative' }}>
                        <Typography variant="subtitle1" color="#1a237e" fontWeight="bold">Department Details</Typography>
                        <IconButton 
                            onClick={() => navigate('/home')} 
                            sx={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}
                        >
                            <HomeIcon />
                        </IconButton>
                    </Box>

                    {/* SCROLLABLE TABLE CONTAINER */}
                    <TableContainer sx={{ maxHeight: 500 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Department ID</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Department Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Existing Priority</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>New Priority</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5', textAlign: 'center' }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {departments.map((dept) => (
                                    <TableRow key={dept.DepartmentID} hover>
                                        <TableCell>{dept.DepartmentID}</TableCell>
                                        <TableCell>{dept.DepartmentName}</TableCell>
                                        <TableCell>{dept.Priority || 0}</TableCell>
                                        <TableCell sx={{ p: 0.5 }}>
                                            <TextField 
                                                variant="outlined" 
                                                size="small" 
                                                type="number"
                                                sx={{ width: '80px' }}
                                                value={dept.NewPriority || ''}
                                                onChange={(e) => handlePriorityChange(dept.DepartmentID, e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <IconButton color="primary" size="small"><EditIcon fontSize="small" /></IconButton>
                                            <IconButton color="error" size="small"><DeleteIcon fontSize="small" /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>

            {/* FOOTER */}
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
}

export default DepartmentPriority;