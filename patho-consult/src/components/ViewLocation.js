import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, TextField, Button
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import { Map } from 'lucide-react';
import "../styles/home.css"; 

function ViewLocation() {
    const [locations, setLocations] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
    const fetchLatestData = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/get-locations');
            const data = await res.json();
            if (data.success) {
                const rows = data.data.map((loc, index) => ({
                    ...loc,
                    id: loc.LocationID || index 
                }));
                setLocations(rows); 
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };
    fetchLatestData();
}, []); 

    const columns = [
        { field: 'LocationID', headerName: 'ID', width: 100, headerAlign: 'center', align: 'center' },
        { field: 'LocationCode', headerName: 'Location Code', flex: 1, headerAlign: 'center', align: 'center' },
        { field: 'LocationName', headerName: 'Location Name', flex: 1, headerAlign: 'center', align: 'center' },
        { 
            field: 'IsActive', 
            headerName: 'Status', 
            width: 150,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => (
                <span style={{ 
                    color: params.value === 1 ? '#2e7d32' : '#d32f2f', 
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '0.85rem'
                }}>
                    {params.value === 1 ? "Active" : "Inactive"}
                </span>
            )
        }
    ];

    return (
        <div className="home-wrapper" style={{ 
            backgroundColor: '#f4f7f7', 
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header: Patho Consult Branding */}
            <header style={{ 
                backgroundColor: '#4a148c', 
                height: '60px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative'
            }}>

                <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem', letterSpacing: '1px' }}>
                    PATHO CONSULT
                </h2>
                <IconButton 
                                        onClick={() => navigate('/home')} 
                                        sx={{ position: 'absolute', right: 36, top: 3, color: 'white' }}
                                    >
                                        <HomeIcon fontSize="large" />
                                    </IconButton>
            </header>

            <main style={{ 
                flex: 1, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: '40px' 
            }}>
                <div style={{ 
                    width: '90%', 
                    maxWidth: '1000px', 
                    backgroundColor: 'white', 
                    borderRadius: '6px', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    border: '1px solid #d1d9d9',marginBottom: '170px'
                     
                }}>
                    
<div style={{ 
    backgroundColor: '#f8fbfb', 
    padding: '20px', 
    borderBottom: '1px solid #d1d9d9',
    textAlign: 'center',
    display: 'flex',           
    alignItems: 'center',       
    justifyContent: 'center',  
    gap: '10px' ,
                  
}}>
    {/* Setting the color to #4a148c to match your text color */}
    <Map size={20} strokeWidth={2.5} color="#4a148c" /> 
    
    <span style={{ fontWeight: 'bold', color: '#4a148c', fontSize: '1rem' }}>
        Location Records
    </span>
</div>

                    <div style={{ height: 475, width: '100%',  }}>
                        <DataGrid
                            rows={locations}
                            columns={columns}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 7 } },
                            }}
                            pageSizeOptions={[5]}
                            disableRowSelectionOnClick
                            sx={{
                                border: 'none',
                                '& .MuiDataGrid-columnHeaders': { 
                                    backgroundColor: '#4a148c !important', 
                                    color: '#ffffff !important',          
                                    minHeight: '56px !important',
                                },
                                '& .MuiDataGrid-columnHeader': {
                                    backgroundColor: '#4a148c !important',
                                },
                                '& .MuiDataGrid-columnHeaderTitle': { 
                                    color: '#ffffff !important',
                                    fontWeight: 'bold !important',
                                    fontSize: '0.95rem',
                                    textTransform: 'uppercase'
                                },
                                '& .MuiDataGrid-cell': {
                                    borderBottom: '1px solid #f0f0f0',
                                    color: '#444',
                                    fontSize: '15px',
                                    fontWeight: 600
                                },
                                '& .MuiDataGrid-row:hover': {
                                    backgroundColor: '#e3d4f5'
                                }
                            }}
                        />
                    </div>
                </div>
            </main>
            <Box sx={{ mt: 'auto', p: 1.5, bgcolor: '#4a148c', color: 'rgba(255,255,255,0.8)', display: 'flex', justifyContent: 'center', gap: 4, position: 'fixed', bottom: 0, width: '100%'}}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MapPin size={14} />
                        <Typography variant="caption">Mylapore, Chennai-600 004</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Mail size={14} />
                        <Typography variant="caption">pathoconsult@gmail.com</Typography>
                </Box>
            </Box>
            
        </div>
    );
}

export default ViewLocation;