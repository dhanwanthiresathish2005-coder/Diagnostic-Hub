import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Paper, Box, Typography, Button, TextField, Divider, 
  TableContainer, Table, TableHead, TableRow, TableCell,TablePagination, 
  TableBody, IconButton, 
  Chip // <--- Add this
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { 
  Save as SaveIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon,
  Science as ScienceIcon,   // <--- This must match the name used in your JSX
  Person as PersonIcon,
  Badge as IDIcon,         // 'ID' is not a valid MUI icon name, using 'Badge'
  Wc as GenderIcon,        // 'Gender' is not a valid MUI icon name, using 'Wc'
  ArrowBack as BackIcon    // 'Back' is not a valid MUI icon name, using 'ArrowBack'
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { FileEdit, Search, Home, Mail, MapPin } from 'lucide-react';

// Initialize SweetAlert2 Toast
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

function AmendTest() {
    const { sampleId } = useParams();
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [patientInfo, setPatientInfo] = useState({});

    const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(5); 

const handleChangePage = (event, newPage) => {
    setPage(newPage);
};

const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
};
    // 1. FETCH DATA
    const fetchData = () => {
        fetch(`http://localhost:5000/api/get-test-results/${sampleId}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    setPatientInfo(data[0]);
                    setTests(data); 
                }
            })
            .catch(err => {
                console.error("Fetch Error:", err);
                Toast.fire({ icon: 'error', title: 'Failed to fetch data' });
            });
    };

    useEffect(() => {
        fetchData();
    }, [sampleId]);

    // 2. HANDLE INPUT CHANGES
    const handleResultChange = (testId, compIndex, newValue) => {
        setTests(prevTests => prevTests.map(test => {
            if (test.id === testId) {
                const updatedComponents = [...test.components];
                updatedComponents[compIndex].result = newValue;
                return { ...test, components: updatedComponents };
            }
            return test;
        }));
    };

    // 3. DELETE TEST LOGIC
 const handleDeleteTest = async (testId, testName) => {
    const result = await Swal.fire({
        title: 'Delete Test?',
        text: `Remove "${testName}" permanently?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d32f2f',
        confirmButtonText: 'Delete'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`http://localhost:5000/api/delete-test/${testId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                setTests(prevTests => prevTests.filter(test => test.id !== testId));

                Toast.fire({ icon: 'success', title: 'Test deleted from database' });
    
                fetchData(); 
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            console.error("Delete Error:", err);
            Toast.fire({ icon: 'error', title: 'Error deleting test' });
        }
    }
};
    // 4. SAVE TO BACKEND
    const handleUpdate = async () => {
        try {
            const validTests = tests.filter(test => test.id && test.components?.length > 0);

            if (validTests.length === 0) {
                Toast.fire({ icon: 'warning', title: 'No valid data to update' });
                return;
            }

            const updatePromises = validTests.map(test => {
                const payload = {
                    id: test.id,
                    value: test.components[0]?.result || "",
                    comments: test.components[0]?.comments || "",
                    status: 'Reported' 
                };

                return fetch('http://localhost:5000/api/update-test-result', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(async res => {
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
                    return data;
                });
            });

            await Promise.all(updatePromises);
            Toast.fire({ icon: 'success', title: 'Results updated successfully' });
            setTimeout(() => navigate('/home'), 1500);

        } catch (err) {
            console.error("Save error details:", err);
            Toast.fire({ 
                icon: 'error', 
                title: 'Update failed', 
                text: err.message 
            });
        }
    };

    return (
        <Box sx={{ bgcolor: '#f3e5f5', minHeight: '100vh', pb: 8 }}>
            <Box sx={{ p: 1, bgcolor: '#4a148c', color: 'white', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <Typography variant="h6" fontWeight="bold">PATHO CONSULT</Typography>
                <Box sx={{ position: 'absolute', right: 20 }}>
                   <IconButton 
                        onClick={() => navigate('/home')} 
                        sx={{ position: 'absolute', right: 36, top: -6, color: 'white' }}
                    >
                        <HomeIcon fontSize="large" />
                    </IconButton>
                </Box>
            </Box>

           <Paper 
    elevation={4} 
    sx={{ 
        mx: 'auto', 
        mt: 4, // Reduced from 16 to 4 so it's not "stretched" down the page
        width: '98%', 
        maxWidth: '1200px', // Prevents it from getting too wide on huge monitors
        borderRadius: '12px', 
        overflow: 'hidden', 
        border: '1px solid #d1c4e9' 
    }}
>
    {/* Header Section */}
    <Box sx={{ 
        bgcolor: '#4a148c', 
        p: 2.5, // Increased padding
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
    }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '1.1rem' }}>
            <ScienceIcon /> Patient Details | <span style={{ opacity: 0.8 }}>Sample ID: {sampleId}</span>
        </Typography>
        <Button 
            variant="contained" 
            sx={{ 
                bgcolor: 'white', 
                color: '#4a148c', 
                fontWeight: 'bold',
                px: 3,
                '&:hover': { bgcolor: '#f3e5f5' }
            }}
            startIcon={<AddIcon />}
            onClick={() => navigate(`/add-test-to-sample/${sampleId}`)}
        >
            Add New Test
        </Button>
    </Box>

    {/* Patient Info Summary Bar */}
    <Box sx={{ 
        p: 3, 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: 4, 
        bgcolor: '#fbfaff' 
    }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonIcon sx={{ color: '#7b1fa2', fontSize: 28 }} />
            <TextField 
                label="Patient Name" 
                value={patientInfo.patient_name || ''} 
                variant="standard" 
                fullWidth 
                slotProps={{ 
                    input: { readOnly: true, style: { fontWeight: '700', fontSize: '15px', color: '#333' } },
                    inputLabel: { shrink: true, style: { fontSize: '14px' } }
                }} 
            />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IDIcon sx={{ color: '#7b1fa2', fontSize: 28 }} />
            <TextField 
                label="Patient ID" 
                value={patientInfo.PatientID || ''} 
                variant="standard" 
                fullWidth 
                slotProps={{ 
                    input: { readOnly: true, style: { fontWeight: '700', fontSize: '15px', color: '#333' } },
                    inputLabel: { shrink: true, style: { fontSize: '14px' } }
                }} 
            />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GenderIcon sx={{ color: '#7b1fa2', fontSize: 28 }} />
            <TextField 
                label="Age / Sex" 
                value={`${patientInfo.Age || ''} / ${patientInfo.Gender || ''}`} 
                variant="standard" 
                fullWidth 
                slotProps={{ 
                    input: { readOnly: true, style: { fontWeight: '700', fontSize: '15px', color: '#333' } },
                    inputLabel: { shrink: true, style: { fontSize: '14px' } }
                }} 
            />
        </Box>
    </Box>

    <Divider />
    {/* Table Section */}
<TableContainer sx={{ height: '450px', overflowY: 'auto', bgcolor: 'white' }}>
    <Table stickyHeader>
        <TableHead>
            <TableRow>
                <TableCell sx={{ bgcolor: '#f3e5f5', color: '#4a148c', fontWeight: '800', fontSize: '14px' }}>Parameter Name</TableCell>
                <TableCell sx={{ bgcolor: '#f3e5f5', color: '#4a148c', fontWeight: '800', fontSize: '14px', width: '30%' }}>Result Value</TableCell>
                <TableCell sx={{ bgcolor: '#f3e5f5', color: '#4a148c', fontWeight: '800', fontSize: '14px' }}>Normal Range</TableCell>
                <TableCell sx={{ bgcolor: '#f3e5f5', color: '#4a148c', fontWeight: '800', fontSize: '14px' }}>Unit</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#f3e5f5', color: '#4a148c', fontWeight: '800', fontSize: '14px' }}>Action</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {tests
                .flatMap(test => test.components.map(comp => ({ ...comp, testId: test.id })))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((comp, index) => (
                    <TableRow key={`${comp.testId}-${index}`} hover sx={{ height: '70px' }}>
                        <TableCell sx={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                            {comp.name}
                        </TableCell>
                        <TableCell>
                            <TextField 
                                fullWidth
                                variant="outlined" 
                                size="small"
                                value={comp.result || ""}
                                InputProps={{ readOnly: true, }}
                                onChange={(e) => handleResultChange(comp.testId, index, e.target.value)}
                                sx={{ 
                                    '& .MuiInputBase-input': { fontSize: '14px', py: 1, fontWeight: 'bold' },
                                    '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                                }} 
                            />
                        </TableCell>
                        <TableCell>
                            <Chip label={comp.range} size="small" sx={{ fontWeight: '600', bgcolor: '#edf2f7' }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: '14px', fontWeight: 'bold', color: '#7b1fa2' }}>
                            {comp.unit}
                        </TableCell>
                        <TableCell align="center">
                            <IconButton 
                                color="error" 
                                onClick={() => handleDeleteTest(comp.testId, comp.name)}
                                sx={{ bgcolor: '#fff5f5' }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </TableCell>
                    </TableRow>
                ))}
        </TableBody>
    </Table>
</TableContainer>

{/* Pagination Component */}
<TablePagination
    rowsPerPageOptions={[5, 10, 25]}
    component="div"
    count={tests.reduce((acc, test) => acc + test.components.length, 0)}
    rowsPerPage={rowsPerPage}
    page={page}
    onPageChange={handleChangePage}
    onRowsPerPageChange={handleChangeRowsPerPage}
    sx={{
        bgcolor: '#f3e5f5',
        borderBottom: '1px solid #e0e0e0',
        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
            fontWeight: 'bold',
            color: '#4a148c'
        }
    }}/>

    {/* Footer Actions */}
    <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #e2e8f0' }}>
        <Button 
            variant="outlined" 
            color="inherit" 
            startIcon={<BackIcon />}
            sx={{ borderRadius: '8px', px: 4, py: 1, fontWeight: 'bold' }}
            onClick={() => navigate(-1)}
        >
            Back
        </Button>
        <Button 
            variant="contained" 
            sx={{ 
                bgcolor: '#4a148c', 
                borderRadius: '8px', 
                px: 6, 
                py: 1,
                fontWeight: 'bold',
                fontSize: '15px',
                '&:hover': { bgcolor: '#311b92' }
            }} 
            startIcon={<SaveIcon />}
            onClick={handleUpdate}
        >
            Update Results
        </Button>
    </Box>
</Paper>
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
                    <Mail size={14}/>
                    <Typography variant="caption">pathoconsult@gmail.com</Typography>
                </Box>
            </Box>
        </Box>
    );
}

export default AmendTest;