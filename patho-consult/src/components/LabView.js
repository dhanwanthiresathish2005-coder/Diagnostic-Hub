import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Paper, Divider, IconButton } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import HomeIcon from '@mui/icons-material/Home'; 
import dayjs from 'dayjs';
 import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
 import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { FlaskConical } from 'lucide-react';


function LabView() {
    const navigate = useNavigate();
    
    const [dates, setDates] = useState(() => {
        const today = new Date();
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 30);
        return {
            from: lastWeek.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0]
        };
    });
    
    const [rows, setRows] = useState([]);

    const columns = [
        { 
            field: 'patient_name', 
            headerName: 'Patient Name', 
            width: 150, 
            renderCell: (params) => (
                <span style={{ color: '#4a148c', fontWeight: 'bold', cursor: 'pointer' }}>
                    {params.value}
                </span>
            )
        },
        { field: 'patient_id', headerName: 'Patient ID', width: 110 },
        { field: 'external_id', headerName: 'External ID', width: 100 },
        { field: 'collected_at', headerName: 'Collected At', width: 180 },
        { field: 'client_code', headerName: 'Client Code', width: 110 },
        { field: 'lab_status', headerName: 'Lab Status', width: 100, align: 'center' },
        { field: 'status', headerName: 'Status', width: 100 },
        { field: 'test_billed', headerName: 'Test Billed', type: 'number', width: 100, align: 'center' },
        { field: 'test_saved', headerName: 'Saved', type: 'number', width: 100, align: 'center' },
        { field: 'confirmed_test', headerName: 'Confirmed Test', type: 'number', width: 110, align: 'center' },
        { field: 'approved_test', headerName: 'Approved Test', type: 'number', width: 110, align: 'center' },
        { field: 'test_pending_approval', headerName: 'Test Pending Appr.', type: 'number', width: 140, align: 'center' },
        { field: 'create_date', headerName: 'Create Date', width: 150 },
        { field: 'test_completed', headerName: 'Test Completed', width: 130 },
        { 
            field: 'sample_id', 
            headerName: 'Sample ID', 
            width: 130,
            renderCell: (params) => (
                <span 
                    style={{ color: '#4a148c', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={() => navigate(`/sample-action-screen/${params.value}`)}
                >
                    {params.value}
                </span>
            )
        },
    ];

    const handleSearch = useCallback(async () => {
        if (!dates.from || !dates.to) return;
        try {
            const response = await fetch(`http://localhost:5000/api/lab-view-data?fromDate=${dates.from}&toDate=${dates.to}`);
            const result = await response.json();
            if (result.success) {
                const rowsWithId = result.data.map((row, index) => ({
                    ...row,
                    id: row.sample_id || `temp-${index}` 
                }));
                setRows(rowsWithId);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        }
    }, [dates.from, dates.to]);

    useEffect(() => {
        handleSearch();
    }, [handleSearch]); 

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f4f6f8', overflow: 'hidden' }}>
            
            {/* 1. Header Box */}
   <Paper elevation={3} sx={{ borderRadius: 0, bgcolor: '#4a148c', color: 'white', px: 3, py: 1, zIndex: 10 }}>
    <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        position: 'relative', 
        justifyContent: 'center',
        minHeight: '40px' 
    }}>
        {/* The Title - Now Centered */}
        <Typography variant="h6" fontWeight="800" sx={{ letterSpacing: 1 }}>
            PATHO CONSULT
        </Typography>
<IconButton 
                        onClick={() => navigate('/home')} 
                        sx={{ position: 'absolute', right: 36, top: -6, color: 'white' }}
                    >
                        <HomeIcon fontSize="large" />
                    </IconButton>

    </Box>
    
</Paper>




{/* MAIN CONTENT AREA - Start the background color here */}
<Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#f6dcfa' }}>
    
    {/* --- LAB VIEW HEADING (Now it will have the light purple background) --- */}
    <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        mb: 2 
    }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: '#4a148c', p: 1.2, borderRadius: '50%', display: 'flex' }}>
                <FlaskConical size={28} color="white" />
            </Box>
            <Box>
                <Typography variant="h5" sx={{ color: '#4a148c', fontWeight: 900 }}>
                    LABORATORY VIEW
                </Typography>
                <Typography variant="caption" sx={{ color: '#6a1b9a', fontWeight: 600 }}>
                    Diagnostic Processing & Result Entry
                </Typography>
            </Box>
        </Box>
    </Box>

    {/* 2. Filter Box */}
    {/* 3. Data Content Box */}
</Box>


            <Box sx={{ p: 6, flex: 1, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#f6dcfa' }}>
                
                {/* 2. Filter Box */}
                <Paper sx={{ p: 2, display: 'flex', gap: 5, justifyContent: 'center', alignItems: 'flex-end', borderRadius: '12px',  marginLeft: '500px',  marginRight: '500px', mt:-46}}>
                    
                    <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', p: 2 }}>
    {/* Centered From Date */}
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="caption" fontWeight="800" color="#4a148c" sx={{ mb: 0.5, textTransform: 'uppercase' }}>
            From Date
        </Typography>
        <DatePicker
            value={dates.from ? dayjs(dates.from) : null}
            onChange={(val) => setDates({ ...dates, from: val ? val.format('YYYY-MM-DD') : '' })}
            slotProps={{
                textField: {
                    size: "small",
                    sx: {
                        width: '180px',
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: '#fff',
                            '& fieldset': { border: '2px solid #dfe6e9' },
                            '&:hover fieldset': { borderColor: '#4a148c' },
                            '&.Mui-focused fieldset': { borderColor: '#4a148c' },
                        }
                    }
                }
            }}
        />
    </Box>

    {/* Centered To Date */}
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="caption" fontWeight="800" color="#4a148c" sx={{ mb: 0.5, textTransform: 'uppercase' }}>
            To Date
        </Typography>
        <DatePicker
            value={dates.to ? dayjs(dates.to) : null}
            onChange={(val) => setDates({ ...dates, to: val ? val.format('YYYY-MM-DD') : '' })}
            slotProps={{
                textField: {
                    size: "small",
                    sx: {
                        width: '180px',
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: '#fff',
                            '& fieldset': { border: '2px solid #dfe6e9' },
                            '&:hover fieldset': { borderColor: '#4a148c' },
                            '&.Mui-focused fieldset': { borderColor: '#4a148c' },
                        }
                    }
                }
            }}
        />
    </Box>
</Box>

                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                    <Button 
                        variant="contained" 
                        onClick={handleSearch} 
                        sx={{ 
                            bgcolor: '#4a148c', 
                            px: 4, 
                            height: '40px', 
                            '&:hover': { bgcolor: '#6a1b9a' } 
                        }}
                    >
                        Search
                    </Button>
                </Paper>

                {/* 3. Data Content Box */}
                <Paper sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    borderRadius: '12px', 
                    overflow: 'hidden',
                    boxShadow: 4 ,
                    marginBottom: '90px'
                }}>
                    <Box sx={{ flex: 1, p: 2, marginTop: '7px', '& .MuiDataGrid-root': { border: 'none' } }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            getRowId={(row) => row.id}
                            slots={{ toolbar: GridToolbar }}
                            slotProps={{
                                toolbar: {
                                    showQuickFilter: true,
                                    quickFilterProps: { debounceMs: 500 },
                                },
                            }}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 10 } },
                            }}
                            pageSizeOptions={[10, 15, 20]}
                            disableRowSelectionOnClick
                            density="compact"
                            sx={{
                                '& .MuiDataGrid-columnHeaders': { 
                                    bgcolor: '#eeeeee', 
                                    color: '#4a148c', 
                                    fontWeight: 'bold' 
                                },
                                '& .MuiDataGrid-row:nth-of-type(even)': { bgcolor: '#fcfaff' },
                                '& .MuiDataGrid-row:hover': { bgcolor: '#f7dffa !important' }
                            }}
                        />
                    </Box>
                </Paper>
            </Box>

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

export default LabView;