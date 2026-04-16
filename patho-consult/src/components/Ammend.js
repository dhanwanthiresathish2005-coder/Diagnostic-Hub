import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, IconButton, TextField, Button, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, 
    CircularProgress, Chip
} from '@mui/material';
import Swal from 'sweetalert2';
import HomeIcon from '@mui/icons-material/Home';
import { FileEdit, Search, Home, Mail, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function Ammend() {
    const navigate = useNavigate();
    const [codes, setCodes] = useState([]); 
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const entriesPerPage = 12;
    useEffect(() => { fetchPatients(); }, []);
    const fetchPatients = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/get-amend-data');
            const data = await response.json();
            const dataArray = Array.isArray(data) ? data : [];
            setCodes(dataArray);
            setFilteredData(dataArray);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (!dateRange.from || !dateRange.to) {
            setFilteredData(codes);
            return;
        }
        const filtered = codes.filter(row => {
            const regDate = new Date(row.RegDate).toISOString().split('T')[0];
            return regDate >= dateRange.from && regDate <= dateRange.to;
        });
        setFilteredData(filtered);
        setCurrentPage(1);
    };

    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredData.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);

    const columns = [
        "Patient Name", "Lab Status", "Status", "Patient ID", 
        "Referred By", "Collected At", "Billed", 
        "Saved", "Confirmed", "Approved", "Pending", 
        "Created Date", "Sample ID"
    ];

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ bgcolor: '#f3e5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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

            {/* Page Title & Search Section */}
            <Box sx={{ p: 4, maxWidth: '1600px', mx: 'auto', width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ bgcolor: '#4a148c', p: 1.5, borderRadius: 2, display: 'flex', color: 'white' }}>
                            <FileEdit size={28} />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#2d3436' }}>Amend Test Records</Typography>
                            <Typography variant="body2" sx={{ color: '#636e72' }}>Update clinical entries and manage test deletions</Typography>
                        </Box>
                    </Box>

                    {/* Compact Filter Bar */}
                    <Paper elevation={0} sx={{ 
                        p: 1.5, display: 'flex', alignItems: 'center', gap: 2, 
                        borderRadius: 3, border: '1px solid #e0e0e0', bgcolor: 'white' 
                    }}>
                       <DatePicker
    label="From"
    value={dateRange.from ? dayjs(dateRange.from) : null}
    onChange={(val) => setDateRange({ ...dateRange, from: val ? val.format('YYYY-MM-DD') : '' })}
    slotProps={{
        textField: {
            size: "small",
            sx: {
                width: '180px',
                '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    '& fieldset': { border: '2px solid #dfe6e9' },
                    '&:hover fieldset': { borderColor: '#7b1fa2' },
                    '&.Mui-focused fieldset': { borderColor: '#4a148c' },
                }
            }
        }
    }}
/>

<DatePicker
    label="To"
    value={dateRange.to ? dayjs(dateRange.to) : null}
    onChange={(val) => setDateRange({ ...dateRange, to: val ? val.format('YYYY-MM-DD') : '' })}
    slotProps={{
        textField: {
            size: "small",
            sx: {
                width: '180px',
                '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    '& fieldset': { border: '2px solid #dfe6e9' },
                    '&:hover fieldset': { borderColor: '#7b1fa2' },
                    '&.Mui-focused fieldset': { borderColor: '#4a148c' },
                }
            }
        }
    }}
/>
                        <Button 
                            variant="contained" disableElevation disableRipple
                            onClick={handleSearch} startIcon={<Search size={18}/>}
                            sx={{ bgcolor: '#4a148c', '&:hover': { bgcolor: '#6a1b9a' }, borderRadius: 2, py: 1 }}
                        >
                            Search
                        </Button>
                    </Paper>
                </Box>

                {/* Modern Table */}
                <TableContainer component={Paper} sx={{ 
                    borderRadius: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', 
                    border: '1px solid #e0e0e0', maxHeight: 'calc(100vh - 350px)' 
                }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                {columns.map((col) => (
                                    <TableCell key={col} align="center" sx={{ 
                                        bgcolor: '#f4f4f9', fontWeight: 700, fontSize: '0.75rem', 
                                        textTransform: 'uppercase', color: '#4a148c', py: 2,
                                        borderBottom: '2px solid #e0e0e0'
                                    }}>
                                        {col}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={columns.length} align="center" sx={{ py: 10 }}><CircularProgress size={30} sx={{ color: '#4a148c' }} /></TableCell></TableRow>
                            ) : currentEntries.map((row, index) => (
                                <TableRow key={index} hover sx={{ '&:hover': { bgcolor: '#f3e5f5 !important' } }}>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#2d3436' }}>
                                        {row.patient_name}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={row.LabStatus || 'Received'} size="small" sx={{ fontWeight: 600, fontSize: '10px', bgcolor: '#e8f5e9', color: '#2e7d32' }} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Typography sx={{ 
                                            fontSize: '0.75rem', fontWeight: 800, 
                                            color: row.Status === 'Paid' ? '#2e7d32' : '#d32f2f' 
                                        }}>
                                            {row.Status?.toUpperCase() || 'UNPAID'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontSize: '0.8rem', color: '#636e72' }}>{row.PatientID}</TableCell>
                                    <TableCell align="center" sx={{ fontSize: '0.75rem' }}>{row.ReferredBy || 'SELF'}</TableCell>
                                    <TableCell align="center" sx={{ fontSize: '0.75rem' }}>{row.CollectedAt || 'Main Lab'}</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 600 }}>{row.TotalBilled}</TableCell>
                                    <TableCell align="center" sx={{ color: '#1976d2' }}>{row.TestSaved}</TableCell>
                                    <TableCell align="center" sx={{ color: '#388e3c' }}>{row.ConfirmedTest}</TableCell>
                                    <TableCell align="center" sx={{ color: '#4a148c' }}>{row.ApprovedTest}</TableCell>
                                    <TableCell align="center" sx={{ color: '#f57c00' }}>{row.PendingApproval}</TableCell>
                                    <TableCell align="center" sx={{ fontSize: '0.75rem', color: '#636e72' }}>
                                        {row.RegDate ? new Date(row.RegDate).toLocaleDateString('en-GB') : 'N/A'}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Button 
                                            size="small" variant="outlined"
                                            onClick={() => navigate(`/amend-test/${row.SampleID}`)}
                                            sx={{ 
                                                fontSize: '10px', fontWeight: 900, py: 0, 
                                                color: '#4a148c', borderColor: '#4a148c',
                                                '&:hover': { bgcolor: '#4a148c', color: 'white' }
                                            }}
                                        >
                                            {row.SampleID}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Styled Pagination */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination 
                        count={totalPages} page={currentPage} 
                        onChange={(e, v) => setCurrentPage(v)} 
                        sx={{ '& .Mui-selected': { bgcolor: '#4a148c !important', color: 'white' } }}
                    />
                </Box>
            </Box>

            {/* Aesthetic Footer */}
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
        </LocalizationProvider>
    );
}

export default Ammend;