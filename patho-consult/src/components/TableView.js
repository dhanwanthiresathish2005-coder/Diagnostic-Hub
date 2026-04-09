import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, IconButton, TextField, Button, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, 
    CircularProgress, Modal, Close
} from '@mui/material';
import { ClipboardList, Paperclip } from 'lucide-react';

import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';


const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '70%',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 0,
    borderRadius: '8px',
    overflow: 'hidden'
};


function TableView() {
    const navigate = useNavigate();
    const [codes, setCodes] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [openModal, setOpenModal] = useState(false);
    const [selectedSample, setSelectedSample] = useState(null);
    const [fileData, setFileData] = useState({ wordFiles: [], imageFiles: [] });
    
    const entriesPerPage = 12;

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/get-table-view-data');
            const data = await response.json();
            setCodes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch Error:", err);
            setCodes([]);
        } finally {
            setLoading(false);
        }
    };

const [uploading, setUploading] = useState(false);
const [selectedFiles, setSelectedFiles] = useState([]);


const handleFileChange = (e) => {
    setSelectedFiles(e.target.files);
};

const onUpload = async () => {
    if (selectedFiles.length === 0) return alert("Please select files first");
    
    setUploading(true);
    const formData = new FormData();
    formData.append('sampleId', selectedSample); 
    
    for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
    }

    try {
        const response = await fetch('http://localhost:5000/api/upload-patient-files', {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (result.success) {
            alert("Files uploaded successfully!");
            setSelectedFiles([]); 
            handleSampleClick(selectedSample); 
        }
    } catch (err) {
        console.error("Upload error:", err);
        alert("Upload failed.");
    } finally {
        setUploading(false);
    }
};


const handleViewFile = (fileName) => {
    const fileUrl = `http://localhost:5000/uploads/patient_files/${selectedSample}/${fileName}`;
    window.open(fileUrl, '_blank'); 
};

  
    const handleSampleClick = async (sampleId) => {
        if (!sampleId || sampleId === 'N/A') return;
        
        setSelectedSample(sampleId);
        setOpenModal(true);
        
        try {
            
            const response = await fetch(`http://localhost:5000/api/patient-files/${sampleId}`);
            const data = await response.json();
            if (data.success) {
                setFileData({ wordFiles: data.wordFiles, imageFiles: data.imageFiles });
            }
        } catch (err) {
            console.error("Error fetching files:", err);
            setFileData({ wordFiles: [], imageFiles: [] });
        }
    };

    const handleClose = () => {
        setOpenModal(false);
        setFileData({ wordFiles: [], imageFiles: [] });
    };


const safeCodes = Array.isArray(codes) ? codes : [];
const filteredCodes = safeCodes.filter((row) => {
    if (!dateRange.from && !dateRange.to) return true;

    const regDate = new Date(row.RegDate);
    const fromDate = dateRange.from ? new Date(dateRange.from) : null;
    const toDate = dateRange.to ? new Date(dateRange.to) : null;

    regDate.setHours(0, 0, 0, 0);
    if (fromDate) fromDate.setHours(0, 0, 0, 0);
    if (toDate) toDate.setHours(0, 0, 0, 0);

    if (fromDate && toDate) return regDate >= fromDate && regDate <= toDate;
    if (fromDate) return regDate >= fromDate;
    if (toDate) return regDate <= toDate;
    return true;
});


const indexOfLastEntry = currentPage * entriesPerPage;
const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
const currentEntries = filteredCodes.slice(indexOfFirstEntry, indexOfLastEntry);
const totalPages = Math.ceil(filteredCodes.length / entriesPerPage);

    

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ bgcolor: '#f3e5f5', minHeight: '100vh', pb: 10 }}>
            {/* Header */}
            <Box sx={{ p: 1.5, bgcolor: '#4a148c', color: 'white', display: 'flex', justifyContent: 'center', position: 'relative', boxShadow: 2 }}>
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

<Box sx={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    mt: 4, 
    mb: -3 
}}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ 
            bgcolor: '#4a148c', 
            p: 1.2, 
            borderRadius: '50%', 
            display: 'flex',
            boxShadow: '0 4px 10px rgba(74, 20, 140, 0.3)' 
        }}>
            <ClipboardList size={28} color="white" strokeWidth={2.5} />
        </Box>

        <Box>
            <Typography variant="h5" sx={{ color: '#4a148c', fontWeight: 900, letterSpacing: '0.5px', lineHeight: 1.1 }}>
                PATIENT RECORD TABLE
            </Typography>
            <Typography variant="caption" sx={{ color: '#6a1b9a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                Clinical Data Management & Attachments
            </Typography>
        </Box>
    </Box>
</Box>

            <Paper sx={{ width: '90%', margin: '50px auto', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
    {/* From Date Group */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" fontWeight="800" sx={{ color: '#4a148c', textTransform: 'uppercase' }}>
            From
        </Typography>
        <DatePicker
            value={dateRange.from ? dayjs(dateRange.from) : null}
            onChange={(val) => setDateRange({ ...dateRange, from: val ? val.format('YYYY-MM-DD') : '' })}
            slotProps={{
                textField: {
                    size: "small",
                    sx: {
                        width: 170,
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
    </Box>

    {/* To Date Group */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" fontWeight="800" sx={{ color: '#4a148c', textTransform: 'uppercase' }}>
            To
        </Typography>
        <DatePicker
            value={dateRange.to ? dayjs(dateRange.to) : null}
            onChange={(val) => setDateRange({ ...dateRange, to: val ? val.format('YYYY-MM-DD') : '' })}
            slotProps={{
                textField: {
                    size: "small",
                    sx: {
                        width: 170,
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
    </Box>

    <Button 
        variant="contained" 
        sx={{ 
            bgcolor: '#7b1fa2', 
            px: 4,
            fontWeight: 'bold',
            borderRadius: '8px',
            '&:hover': { bgcolor: '#4a148c' } 
        }} 
        startIcon={<SearchIcon />}
    >
        Search
    </Button>
</Box>

                <TableContainer sx={{ maxHeight: 500 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                {['Patient Name', 'Lab Status', 'Reg Date', 'Sample ID'].map((head) => (
                                    <TableCell key={head} align="center" sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', color: '#607d8b', borderBottom: '2px solid #e0e0e0' }}>{head}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}><CircularProgress color="secondary" /></TableCell></TableRow>
                            ) : currentEntries.length > 0 ? currentEntries.map((row) => (
                                <TableRow key={row.PatientID} hover>
                                    <TableCell align="center">{row.patient_name}</TableCell>
                                    <TableCell align="center">
                                        <Typography variant="caption" sx={{ color: row.Status === 'Completed' || row.Status === 'Approved' ? 'green' : 'orange', fontWeight: 'bold' }}>
                                            {row.Status || 'Pending'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">{row.RegDate ? new Date(row.RegDate).toLocaleDateString('en-GB') : 'N/A'}</TableCell>
                                    
                                    {/* CLICKABLE SAMPLE ID */}
                                    <TableCell align="center">
                                        <Button 
                                            onClick={() => handleSampleClick(row.SampleID)}
                                            sx={{ 
                                                border: '1px solid #ccc', 
                                                p: 0.5, 
                                                borderRadius: 1, 
                                                minWidth: 80, 
                                                fontSize: '12px', 
                                                fontWeight: 'bold', 
                                                bgcolor: '#f9f9f9',
                                                color: 'inherit',
                                                textTransform: 'none',
                                                '&:hover': { bgcolor: '#ececec' }
                                            }}
                                        >
                                            {row.SampleID || 'N/A'} 
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>No Records Found</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e0e0e0' }}>
                    <Pagination count={totalPages} page={currentPage} onChange={(e, value) => setCurrentPage(value)} color="secondary" shape="rounded" size="small" />
                    <Typography variant="caption" color="text.secondary">
                        {indexOfFirstEntry + 1} - {Math.min(indexOfLastEntry, safeCodes.length)} of {safeCodes.length} items
                    </Typography>
                </Box>
            </Paper>

            {/* --- ATTACHMENT MODAL (POPUP) --- */}
<Modal open={openModal} onClose={handleClose}>
    <Box sx={modalStyle}>
<Box 
    sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 1.5, 
        bgcolor: '#4a148c', 
        color: 'white' 
    }}
>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Paperclip size={18} color="white" strokeWidth={2.5} />
        
        <Typography variant="subtitle2" fontWeight="bold">
            Patient Attachments: {selectedSample}
        </Typography>
    </Box>
    
    <IconButton size="small" onClick={handleClose} sx={{ color: 'white' }}>
        <CloseIcon fontSize="small" />
    </IconButton>
</Box>

        <Box sx={{ p: 2 }}>
            <Box sx={{ 
                mb: 3, p: 1, 
                border: '1px dashed #4a148c', 
                borderRadius: '4px', 
                bgcolor: '#f3e5f5',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
            }}>
                <input 
                    type="file" 
                    multiple 
                    onChange={handleFileChange} 
                    style={{ fontSize: '11px', width: '70%' }} 
                />
                <Button 
                    variant="contained" 
                    size="small" 
                    disabled={uploading || selectedFiles.length === 0}
                    onClick={onUpload}
                    sx={{ bgcolor: '#4a148c', fontSize: '10px', height: '25px' }}
                >
                    {uploading ? <CircularProgress size={14} sx={{ color: 'white' }} /> : 'Upload'}
                </Button>
            </Box>

            {/* Word Files Table */}
            <Typography variant="caption" display="block" sx={{ bgcolor: '#4a148c', color: 'white', p: 0.5, textAlign: 'center', fontWeight: 'bold' }}>Word Files</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#f0f0f0' }}>
                        <TableRow>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '12px' }}>FilePath</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '12px' }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {fileData.wordFiles.length > 0 ? fileData.wordFiles.map((file, idx) => (
                            <TableRow key={idx}>
                                <TableCell sx={{ fontSize: '11px' }}>{file.file_path}</TableCell>
                                <TableCell align="center">
    <Button 
        size="small" 
       sx={{ fontSize: '10px', color: '#4a148c', fontWeight: 'bold' }} 
        onClick={() => handleViewFile(file.file_path)} 
    >
        Open
    </Button>
</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={2} align="center" sx={{ fontSize: '11px', py: 2 }}>No word files found</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Image Files Table */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#4a148c', color: 'white', p: 0.5, mb: 0 }}>
                 <Typography variant="caption" fontWeight="bold" sx={{ flexGrow: 1, textAlign: 'center' }}>Image Files</Typography>
                 <Button size="small" variant="contained" sx={{ height: 20, fontSize: '10px', bgcolor: 'white', color: 'black', '&:hover': { bgcolor: '#f0f0f0' } }} onClick={() => window.print()}>Print</Button>
            </Box>
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableBody>
                        {fileData.imageFiles.length > 0 ? fileData.imageFiles.map((file, idx) => (
                            <TableRow key={idx}>
                                <TableCell sx={{ fontSize: '11px' }}>{file.file_path}</TableCell>
                                <TableCell align="center">
    <Button 
        size="small" 
        sx={{ fontSize: '10px', color: '#4a148c', fontWeight: 'bold',  }} 
        onClick={() => handleViewFile(file.file_path)}
    >
        View
    </Button>
</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell align="center" sx={{ fontSize: '11px', py: 2 }}>No image files found</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    </Box>
</Modal>

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
        </LocalizationProvider>
    );
}
export default TableView;