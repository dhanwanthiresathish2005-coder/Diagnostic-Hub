import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, IconButton, TextField, InputAdornment } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid'; 
import HomeIcon from '@mui/icons-material/Home';
import { TestTubeDiagonal, FilePenLine, ClipboardList } from 'lucide-react';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import {Search, Home, Mail, MapPin } from 'lucide-react';
const ViewEditTest = () => {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/inventory/full-list');
            const result = await res.json();
            if (result.success) {
                setTests(result.data.filter(t => Number(t.IsActive) === 1));
            }
        } catch (err) { 
            console.error("Fetch error:", err); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchData(); 
    }, []);

    const filteredRows = tests.filter((row) => 
        row.TestName.toLowerCase().includes(search.toLowerCase()) || 
        row.TestCode.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { field: 'TestName', headerName: 'Test Name', width: 250 }, 
        { field: 'TestCode', headerName: 'Code', width: 90 },
        { field: 'Department', headerName: 'Department', width: 130 },
        { 
            field: 'Price', 
            headerName: 'Price (₹)', 
            width: 100,
            renderCell: (params) => `₹${params.value || 0}`
        },
        { field: 'TestSchedule', headerName: 'Schedule', width: 120 },
        { field: 'TurnAroundTime', headerName: 'TAT', width: 90 },
        { field: 'CutOffTime', headerName: 'Cut-Off', width: 90 },
        {
            field: 'IsActive',
            headerName: 'Status',
            width: 90,
            renderCell: (params) => (
                <Typography sx={{ color: 'green', fontSize: '13px', fontWeight: 'bold' }}>
                    Active
                </Typography>
            )
        },
        {
            field: 'edit',
            headerName: 'Action',
            width: 90,
            sortable: false,
            renderCell: (params) => (
                <Button 
                    variant="contained" 
                    size="small"
                    sx={{ 
                        bgcolor: '#4a148c', 
                        textTransform: 'none', 
                        fontSize: '12px',
                        '&:hover': { bgcolor: '#6a1b9a' } 
                    }}
                    onClick={() => navigate(`/edit-test/${params.row.TestID}`)}
                >
                    Edit
                </Button>
            )
        }
    ];

    const gridStyle = {
        height: 550, 
        width: '100%', 
        bgcolor: 'white',
        '& .MuiDataGrid-columnHeader': { 
            backgroundColor: '#4a148c', 
            color: 'white',
            fontWeight: 'bold'
        },
        '& .MuiDataGrid-cell:focus': {
            outline: 'none'
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f6dcfa', pb: 10 }}>
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

            <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 3, px: 2 }}>
                {/* Section Title: View/Edit Test */}
<Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 1.5, 
    mb: 2, 
    px: 0.5 
}}>
    {/* Using the TestTubeDiagonal or FilePen icon */}
    <div style={{ 
        backgroundColor: '#4a148c', 
        padding: '8px', 
        borderRadius: '8px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' ,
    
    }}>
        <TestTubeDiagonal size={24} color="white" strokeWidth={2.5} />
    </div>
    
    <Box>
        <Typography variant="h5" sx={{ color: '#4a148c', fontWeight: 'bold', lineHeight: 1.2  }}>
            View / Edit Tests
        </Typography>
        <Typography variant="caption" sx={{ color: '#6a1b9a', fontWeight: 500 }}>
            Manage laboratory test parameters and pricing
        </Typography>
    </Box>
</Box>
                
                <Paper sx={{ p: 1.5, mb: 2, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search by Test Name or Code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ maxWidth: 400 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Paper>

                <Paper sx={{ borderRadius: '4px', overflow: 'hidden', boxShadow: 3 }}>
                    <DataGrid 
                        rows={filteredRows} 
                        columns={columns} 
                        sx={gridStyle} 
                        loading={loading}
                        getRowId={(row) => row.TestID}
                        pageSizeOptions={[10, 20]}
                        initialState={{ 
                            pagination: { paginationModel: { pageSize: 10 } } 
                        }}
                        disableRowSelectionOnClick
                    />
                </Paper>
            </Box>

            <Box sx={{ mt: 'auto', p: 1.5, bgcolor: '#4a148c', color: 'rgba(255,255,255,0.8)', display: 'flex', justifyContent: 'center', gap: 4, position: 'fixed', bottom: 0, width: '100%' }}>
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

export default ViewEditTest;