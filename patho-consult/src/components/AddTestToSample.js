import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper, Table, TableBody, TablePagination, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, TextField, 
  Button, Card, CardContent, Autocomplete, Chip
} from '@mui/material';
import { FileEdit } from 'lucide-react';
import HomeIcon from '@mui/icons-material/Home';
import Swal from 'sweetalert2';
import {Search, Home, Mail, MapPin } from 'lucide-react';

const AddTestToSample = () => {
    const { sampleId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [availableTests, setAvailableTests] = useState([]);
    const [selectedTest, setSelectedTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

const handleChangePage = (event, newPage) => {
    setPage(newPage);
};

const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
};

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
    });

    const fetchAllData = useCallback(async () => {
        try {
        
            const [headerRes, tableRes, testsRes] = await Promise.all([
                fetch(`http://localhost:5000/api/add-test-header/${sampleId}`).then(res => res.json()),
                fetch(`http://localhost:5000/api/sample-details/${sampleId}`).then(res => res.json()),
                fetch(`http://localhost:5000/api/all-available-tests`).then(res => res.json())
            ]);

            if (headerRes.success) {
                setData({
                    ...headerRes.data,
                    tests: tableRes.success ? tableRes.data.tests : []
                });
            }
            
            setAvailableTests(testsRes || []);
            setLoading(false);
        } catch (err) {
            console.error("Fetch error:", err);
            setLoading(false);
            Toast.fire({ icon: 'error', title: 'Failed to load data' });
        }
    }, [sampleId]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

const handleAddTest = async () => {
    if (!selectedTest || !data) {
        Swal.fire('Warning', 'Please select a test first.', 'warning');
        return;
    }

    const payload = {
        sample_id: sampleId,
        item_id: selectedTest.id,         
        item_type: selectedTest.type,     
        patient_id: data.patient_id,
        patient_name: data.patient_name,
        invoice_no: data.invoice_no,
        doctor_id: data.doctor_id,
        location_code: data.location_code,
        client_code: data.client_code,
        billing_type: data.billing_type || null, 
        group_name: data.group_name || null 
    };

    try {
        const response = await fetch('http://localhost:5000/api/add-test-to-billing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();

        if (result.success) {
            Toast.fire({ icon: 'success', title: 'Test added successfully' });
            setSelectedTest(null); 
            if (typeof fetchAllData === 'function') {
                fetchAllData(); 
            }
        } else {
            Swal.fire('Error', result.message || 'Failed to add test', 'error');
        }
    } catch (err) {
        console.error("Add Test Error:", err);
        Swal.fire('Error', 'Server connection failed', 'error');
    }
};

    if (loading) return <Typography sx={{ p: 3 }}>Loading laboratory data...</Typography>;
    if (!data) return <Typography sx={{ p: 3 }}>No record found for {sampleId}</Typography>;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f6dcfa' }}>
            {/* Top Branding Bar */}
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
                               boxShadow: 3,
                                
                           }}
                       >
                           {/* Centered Title */}
                           <Typography variant="h6" fontWeight="bold">
                               PATHO CONSULT
                           </Typography>
                       
                           {/* Home Icon - Now Positioned to the RIGHT and visible */}
                            <IconButton onClick={() => navigate('/home')} sx={{ position: 'absolute', right: 36, top: 3, color: 'white' }}>
                                <HomeIcon fontSize="large" />
                            </IconButton>
                       </Box>
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center',mt: 5 }}>
                
                {/* Patient Info Card */}
                <Card sx={{ width: '100%', maxWidth: 1000, mb: 2, borderLeft: '6px solid #4a148c' }}>
                    <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                            <Typography variant="body2"><strong>Patient:</strong> {data.patient_name} ({data.gender}/{data.age})</Typography>
                            <Typography variant="body2"><strong>Patient ID:</strong> {data.patient_id}</Typography>
                            <Typography variant="body2"><strong>Invoice:</strong> {data.invoice_no}</Typography>
                            <Typography variant="body2"><strong>Referred By:</strong> {data.referredBy}</Typography>
                            <Typography variant="body2"><strong>Client:</strong> {data.client_code}</Typography>
                            <Typography variant="body2"><strong>External ID:</strong> {data.external_id}</Typography>
                        </Box>
                    </CardContent>
                </Card>

                {/* Test Selection Bar */}
                <Box sx={{ display: 'flex', gap: 2, width: '100%', maxWidth: 1000, mb: 2 }}>
                    
                    <Autocomplete
    fullWidth
    size="small"
    options={availableTests || []} 
    getOptionLabel={(opt) => `${opt.name} (ID: ${opt.id}) - ₹${opt.amount}`}
    value={selectedTest}
    onChange={(e, val) => setSelectedTest(val)}
    isOptionEqualToValue={(option, value) => option.id === value.id}
    renderInput={(params) => (
        <TextField 
            {...params} 
            placeholder="Search Test Master..." 
            sx={{ bgcolor: 'white' }} 
        />
    )}
/>
                    <Button 
                        variant="contained" 
                        onClick={handleAddTest} 
                        disabled={!selectedTest}
                        sx={{ bgcolor: '#4a148c', px: 4, '&:hover': { bgcolor: '#38006b' } }}
                    >
                        Add
                    </Button>
                </Box>

                <Paper sx={{ width: '100%', maxWidth: 1000, border: '1px solid #4a148c', overflow: 'hidden' }}>
                    {/* Centered Title Bar with Home Icon */}
                    <Box sx={{ p: 0.5, bgcolor: '#f3e5f5', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', position: 'relative' }}>
                        <IconButton onClick={() => navigate('/home')} sx={{ zIndex: 1 }}>
                            <HomeIcon sx={{ color: '#4a148c' }} /> 
                        </IconButton>
                        
                    

<Typography 
    variant="subtitle1" 
    sx={{ 
        color: '#4a148c', 
        fontWeight: 'bold', 
        position: 'absolute', 
        width: '100%', 
        left: 0, 
        textAlign: 'center', 
        pointerEvents: 'none',
        display: 'flex',       
        alignItems: 'center',  
        justifyContent: 'center', 
        gap: 1                 
    }}
>
    <FileEdit size={18} strokeWidth={2.5} />
    Manage Sample: {sampleId}
</Typography>
</Box>
                    

                    {/* Scrollable Table Area */}
                    <Paper sx={{ width: '100%', overflow: 'hidden', border: '1px solid #d1c4e9', borderRadius: '8px' }}>
    {/* Scrollable Table Area */}
    <TableContainer sx={{ height: '400px', overflowY: 'auto' }}>
        <Table stickyHeader size="small">
            <TableHead>
                <TableRow>
                    <TableCell sx={{ bgcolor: '#4a148c', color: 'white', fontWeight: 'bold' }}>Test Name</TableCell>
                    <TableCell sx={{ bgcolor: '#4a148c', color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ bgcolor: '#4a148c', color: 'white', fontWeight: 'bold' }}>Normal Range</TableCell>
                    <TableCell sx={{ bgcolor: '#4a148c', color: 'white', fontWeight: 'bold' }}>Units</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {data.tests
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((test, index) => (
                        <TableRow key={index} hover sx={{ height: '65px' }}>
                            <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{test.test_name}</TableCell>
                            <TableCell>
                                <Chip 
                                    label={test.status} 
                                    size="small" 
                                    color={test.status === 'Completed' ? 'success' : 'warning'} 
                                    sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}
                                />
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.85rem' }}>{test.normal_range || 'N/A'}</TableCell>
                            <TableCell sx={{ fontSize: '0.85rem', color: '#7b1fa2', fontWeight: 'bold' }}>{test.Units || '-'}</TableCell>
                        </TableRow>
                    ))}
                {/* Empty rows filler to keep table height consistent if less than 5 items */}
                {data.tests.length === 0 && (
                     <TableRow style={{ height: 200 }}>
                        <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            No tests available
                        </TableCell>
                     </TableRow>
                )}
            </TableBody>
        </Table>
    </TableContainer>

    <TablePagination
        rowsPerPageOptions={[5, 10]} // Allows switching to 10 if needed
        component="div"
        count={data.tests.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
            bgcolor: '#f3e5f5',
            borderTop: '1px solid #d1c4e9',
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: '#4a148c'
            }
        }}
    />
</Paper>
                </Paper>

                <Button variant="text" sx={{ mt: 2, bgcolor: '#4a148c', color: 'white' }} onClick={() => navigate(-1)}>
                    Back 
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
};

export default AddTestToSample;