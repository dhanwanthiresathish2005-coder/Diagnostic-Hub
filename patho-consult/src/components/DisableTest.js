import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';
import { FlaskConicalOff } from 'lucide-react';
import { FlaskConical } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';
import {Search, Home, Mail, MapPin } from 'lucide-react';

const DisableTest = () => {

    const navigate = useNavigate();

    const [activeTests, setActiveTests] = useState([]);
    const [disabledTests, setDisabledTests] = useState([]);
    const [showDisabled, setShowDisabled] = useState(false);
    const [loading, setLoading] = useState(false);

    // ✅ FETCH ACTIVE
    const fetchActive = async () => {
        const res = await fetch('http://localhost:5000/api/tests/active');
        const result = await res.json();

        if (result.success) {
            setActiveTests(result.data);
        }
    };

    // ✅ FETCH DISABLED
    const fetchDisabled = async () => {
        const res = await fetch('http://localhost:5000/api/tests/disabled');
        const result = await res.json();

        if (result.success) {
            setDisabledTests(result.data);
        }
    };

    // ✅ MASTER FETCH
    const fetchData = async () => {
        try {
            setLoading(true);
            await Promise.all([fetchActive(), fetchDisabled()]);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ✅ TOGGLE STATUS
    const handleToggle = async (id, newStatus) => {

        try {

            setLoading(true);

            await fetch(
                `http://localhost:5000/api/tests/toggle-status/${id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                }
            );

            // refresh tables
            await fetchData();

        } catch (err) {
            console.error("Toggle Error:", err);
        }
    };

    
    const columns = (type) => [
        { field: 'TestName', headerName: 'Test Name', flex: 1 },
        { field: 'TestCode', headerName: 'Test Code', width: 150 },
        { field: 'Price', headerName: 'Price', width: 120 },
        { field: 'Department', headerName: 'Department', width: 200 },
        {
            field: 'action',
            headerName: type === 'active' ? 'Disable' : 'Enable',
            width: 130,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    size="small"
                    disabled={loading} // prevents spam clicking
                    sx={{
                        textTransform: 'none',
                        bgcolor: type === 'active' ? "#d32f2f" : "#2e7d32",
                        '&:hover': {
                            bgcolor: type === 'active'
                                ? "#b71c1c"
                                : "#1b5e20"
                        }
                    }}
                    onClick={() =>
                        handleToggle(
                            params.row.id,
                            type === 'active' ? 0 : 1
                        )
                    }
                >
                    {type === 'active' ? 'Disable' : 'Enable'}
                </Button>
            )
        }
    ];

    const gridStyle = {
        height: 400,
        width: '100%',
        bgcolor: 'white'
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f6dcfa', pb: 5 }}>

            {/* HEADER */}
            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', bgcolor: '#4a148c', color: 'white', position: 'relative' }}>
                <Typography variant="h6" fontWeight="bold">PATHO CONSULT</Typography>
                <IconButton 
                        onClick={() => navigate('/home')} 
                        sx={{ position: 'absolute', right: 36, top: 3, color: 'white' }}
                    >
                        <HomeIcon fontSize="large" />
                    </IconButton>
            </Box>
            
            {/* Navigation Bar */}
<Box 
    sx={{ 
        p: 1.5, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderBottom: '1px solid #f6dcfa',
        gap: 1.5 
    }}
>
    <FlaskConicalOff size={20} color="#7b1fa2" strokeWidth={2} />
    
    <Typography 
        variant="body2" 
        sx={{ 
            color: '#7b1fa2', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            fontSize: '15px'
        }}
    >
        Disable Test 
    </Typography>
</Box>

            <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 1, px: 2, mb:5 }}>

                {/* ACTIVE */}
                <Paper sx={{ mb: 0, boxShadow: 3 }}>

<Box sx={{
    p: 1,
    px: 2,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center', 
    borderBottom: '1px solid #f0f0f0',mb :1
}}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Using a green or blue-ish color often denotes "Active" */}
        <FlaskConical size={18} color="#2e7d32" strokeWidth={2.5} />
        
        <Typography fontWeight="bold">
            Active Test List
        </Typography>
    </Box>

    {/* You can place a Badge or Count here on the right side */}
</Box>

                    <DataGrid
                        rows={activeTests}
                        columns={columns('active')}
                        loading={loading}
                        pageSizeOptions={[5, 10]}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 5 }
                            }
                        }}
                        sx={gridStyle}
                    />
                </Paper>

                {/* TOGGLE */}

<Typography
    align="center"
    onClick={() => setShowDisabled(!showDisabled)}
    sx={{
        my: 2,
        color: '#4a148c',
        fontWeight: 'bold',
        cursor: 'pointer',
        textDecoration: 'underline',
        display: 'flex',           // Added for icon alignment
        alignItems: 'center',       // Vertical center
        justifyContent: 'center',  // Horizontal center
        gap: 1                     // Space between icon and text
    }}
>
    {showDisabled ? (
        <>
            <EyeOff size={18} strokeWidth={2.5} />
            Hide Disabled Tests
        </>
    ) : (
        <>
            <Eye size={18} strokeWidth={2.5} />
            View Disabled Tests
        </>
    )}
</Typography>

                {/* DISABLED */}
                {showDisabled && (
                    <Paper sx={{ boxShadow: 3 }}>

<Box sx={{ 
    p: 1, 
    px: 2, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 1 
}}>
    <FlaskConicalOff size={18} color="#d32f2f" strokeWidth={2.5} />
    
    <Typography color="error" fontWeight="bold">
        Disabled Test List
    </Typography>
</Box>

                        <DataGrid
                            rows={disabledTests}
                            columns={columns('disabled')}
                            loading={loading}
                            pageSizeOptions={[5, 10]}
                            initialState={{
                                pagination: {
                                    paginationModel: { pageSize: 5 }
                                }
                            }}
                            sx={gridStyle}
                        />
                    </Paper>
                )}

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

export default DisableTest;
