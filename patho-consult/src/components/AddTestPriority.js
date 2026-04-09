import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, TextField, 
    Button, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import Swal from 'sweetalert2';
import SaveIcon from '@mui/icons-material/Save';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { ListOrdered } from 'lucide-react';
import { FileEdit, Search, Home, Mail, MapPin } from 'lucide-react';

function AddTestPriority() {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [selectedDeptName, setSelectedDeptName] = useState('');
    const [tests, setTests] = useState([]);
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

    // 1. Get the list of departments for the dropdown
    useEffect(() => {
        fetch('http://localhost:5000/api/get-departments')
            .then(res => res.json())
            .then(result => {
                if (result.success) setDepartments(result.data);
            });
    }, []);

    

    const handlePriorityChange = (id, value) => {
        setTests(prev => prev.map(t => t.TestID === id ? { ...t, newPriority: value } : t));
    };

    const handleDeptChange = async (name) => {
    setSelectedDeptName(name);
    if (!name) {
        setTests([]); // Clear tests if no department selected
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/api/get-tests-by-dept-name/${encodeURIComponent(name)}`);
        const result = await res.json();
        if (result.success) {
            // Map Priority to newPriority, ensuring we default to 0 if null
            setTests(result.data.map(t => ({ 
                ...t, 
                newPriority: t.Priority !== null && t.Priority !== undefined ? t.Priority : 0 
            })));
        }
    } catch (err) { 
        console.error("Fetch Tests Error:", err); 
        Toast.fire({ icon: 'error', title: 'Failed to load tests' });
    }
};

const handleSaveAll = async () => {
    if (tests.length === 0) return;

    // Loading overlay to prevent multiple clicks
    Swal.fire({
        title: 'Saving Test Priorities...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    const updateData = tests.map(t => ({ 
        id: t.TestID, 
        priority: parseInt(t.newPriority, 10) || 0 
    }));

    try {
        const res = await fetch('http://localhost:5000/api/update-test-priority', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priorities: updateData })
        });
        
        const result = await res.json();
        Swal.close();

        if (result.success) {
            Toast.fire({
                icon: 'success',
                title: 'Test priorities updated'
            });
            // Refresh the current list to ensure UI matches DB
            handleDeptChange(selectedDeptName);
        } else {
            Swal.fire('Error', result.message || "Failed to save changes", 'error');
        }
    } catch (err) { 
        console.error("Save Error:", err);
        Swal.fire('Server Error', 'Could not connect to the API', 'error');
    }
};

    const filteredTests = tests.filter(t => 
        t.TestName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f6dcfa' }}>
            <Box 
                component="header" 
                sx={{ 
                    p: 1.5, // Back to original slim padding
                    bgcolor: '#4a148c', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    position: 'relative', 
                    width: '100%', // Back to full width
                    boxShadow: 3 
                }}
            >
                {/* Centered Title */}
                <Typography variant="h6" fontWeight="bold">
                    PATHO CONSULT
                </Typography>
            
                {/* Home Icon - Now Positioned to the RIGHT and visible */}
                <IconButton 
                        onClick={() => navigate('/home')} 
                        sx={{ position: 'absolute', right: 36, top: 3, color: 'white' }}
                    >
                        <HomeIcon fontSize="large" />
                    </IconButton>
            </Box>





            <Box sx={{ p: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* New Header: Add Test Priority (Clean Style) */}
<Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'flex-start', // Alignment matches your Department screen
    gap: 1.5, 
    mb: 4, 
    mt: -11, 
    mr: -103,
    width: '100%', 
    maxWidth: 1000 
}}>
    {/* Using ListOrdered to signify priority management */}
    <ListOrdered size={22} color="#4a148c" strokeWidth={2.5} />
    
    <Typography 
        variant="subtitle1" 
        sx={{ 
            color: '#4a148c', 
            fontWeight: 'bold',
            textTransform: 'none' // Matches "Department Priority Management"
        }}
    >
        Add Test Priority
    </Typography>
</Box>
                <Box sx={{ display: 'flex', gap: 2, width: '100%', maxWidth: 1000, mb: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 250, bgcolor: 'white' }}>
                        <InputLabel>Department</InputLabel>
                        <Select
                            value={selectedDeptName}
                            label="Department"
                            onChange={(e) => handleDeptChange(e.target.value)}
                        >
                            {departments.map(d => (
                                <MenuItem key={d.DepartmentID} value={d.DepartmentName}>
                                    {d.DepartmentName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField 
                        fullWidth size="small" placeholder="Search test..." 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ bgcolor: 'white' }}
                    />
                </Box>

               <Paper sx={{ width: '100%', maxWidth: 1000, border: '1px solid #4a148c', overflow: 'hidden' }}>
    

    {/* TableContainer is the "Window". 
       Setting a height here makes it scrollable.
    */}
    <TableContainer 
    sx={{ 
        height: '450px', // Set a fixed height to force scrolling
        overflowY: 'auto', // Enable vertical scrollbar
        border: '1px solid #4a148c',
        borderRadius: '4px'
    }}
>
    <Table stickyHeader size="small"> 
        <TableHead>
            <TableRow>
                {/* stickyHeader keeps these at the top */}
                <TableCell sx={{ bgcolor: '#4a148c', color: 'white' }}>Test Name</TableCell>
                <TableCell sx={{ bgcolor: '#4a148c', color: 'white' }}>Current Priority</TableCell>
                <TableCell sx={{ bgcolor: '#4a148c', color: 'white' }}>Update</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {/* When you have 20+ tests, this area will scroll */}
            {filteredTests.map((t) => (
                <TableRow key={t.TestID}>
                    <TableCell>{t.TestName}</TableCell>
                    <TableCell align="center">{t.Priority}</TableCell>
                    <TableCell>
                        <input 
                            type="number" 
                            value={t.newPriority} 
                            onChange={(e) => handlePriorityChange(t.TestID, e.target.value)}
                            style={{ width: '60px' }}
                        />
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
</TableContainer>
</Paper>
                <Button variant="contained" onClick={handleSaveAll} sx={{ mt: 2, bgcolor: '#4a148c' }}>
                    Save Priority
                </Button>
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
}

export default AddTestPriority;