import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, TextField, Button
} from '@mui/material';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import HomeIcon from '@mui/icons-material/Home';
import { Users } from 'lucide-react';
import { TablePagination} from '@mui/material';

function Workflow() {
    const location = useLocation();
    const navigate = useNavigate();
    const { groupId } = location.state || {};
    const [members, setMembers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    
const totalPages = Math.ceil(members.length / itemsPerPage);
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;

const [page, setPage] = useState(0); 
const [rowsPerPage, setRowsPerPage] = useState(5);
const currentItems = members.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

const handleChangePage = (event, newPage) => {
    setPage(newPage);
};

const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); 
};

    const s = {
        main: { backgroundColor: '#f3e5f5', minHeight: '100vh', fontFamily: '"Inter", "Segoe UI", sans-serif' },
        topBar: { 
            background: 'linear-gradient(90deg, #4a148c 0%, #7b1fa2 100%)', 
            color: 'white', 
            padding: '12px 30px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        },
        brand: { fontSize: '20px', fontWeight: '800', letterSpacing: '1px' },
        // Content Container
        container: { padding: '25px 50px' },
        breadcrumb: { color: '#6a1b9a', marginBottom: '20px', fontSize: '14px', cursor: 'pointer' },
        // Stats Row
        statsRow: { display: 'flex', gap: '20px', marginBottom: '25px' },
        statCard: { 
            flex: 1, background: 'white', padding: '20px', borderRadius: '12px', 
            borderLeft: '5px solid #7b1fa2', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' 
        },
        // Table Section
        card: { background: 'white', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', overflow: 'hidden' },
        table: { width: '100%', borderCollapse: 'collapse' },
        thead: { background: '#f8f5fc', borderBottom: '2px solid #eee' },
        th: { padding: '18px', textAlign: 'left', color: '#4a148c', fontSize: '13px', fontWeight: '700' },
        td: { padding: '16px', borderBottom: '1px solid #f0f0f0', fontSize: '14px' },
        // Add these to your 's' style object
paginationContainer: { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: '20px', 
    gap: '15px',
    borderTop: '1px solid #eee',
    background: 'white' 
},
pageInfo: { 
    fontSize: '13px', 
    fontWeight: '600', 
    color: '#666',
    minWidth: '100px',
    textAlign: 'center'
},
pageBtn: (disabled) => ({
    padding: '8px 16px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    backgroundColor: disabled ? '#f5f5f5' : '#4a148c',
    color: disabled ? '#999' : 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: disabled ? 'none' : '0 4px 10px rgba(74, 20, 140, 0.2)'
}),
        badge: (status) => ({
            padding: '6px 14px', borderRadius: '50px', fontSize: '11px', fontWeight: '700',
            backgroundColor: status === 'Approved' ? '#e8f5e9' : '#f3e5f5',
            color: status === 'Approved' ? '#2e7d32' : '#7b1fa2'
        })
    };

    useEffect(() => {
    if (groupId) {
        fetch(`http://localhost:5000/api/get-group-members/${groupId}`)
            .then(res => res.json())
            .then(data => {
                if(Array.isArray(data)) {
                    setMembers(data);
                } else {
                    setMembers([]);
                }
            })
            .catch(err => console.error("Error fetching group members:", err));
    }
}, [groupId]);

    return (
        <div style={s.main}>
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

            <div style={s.container}>
                

                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px'}}>

<div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
    {/* Icon styled to match your dark purple heading */}
    <div style={{ 
        backgroundColor: '#f3e5f5', 
        padding: '10px', 
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }}>
        <Users size={28} color="#2e004d" strokeWidth={2.5} />
    </div>

    <div>
        <h1 style={{ margin: 0, color: '#2e004d', fontSize: '1.5rem', lineHeight: 1.2 }}>
            Group Details
        </h1>
        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
            Managing entries for ID: <strong style={{ color: '#2e004d' }}>{groupId}</strong>
        </p>
    </div>
</div>
                    <button 
                        onClick={() => navigate(-1)} 
                        style={{backgroundColor: '#7b1fa2', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'}}
                    >
                        Back to List
                    </button>
                </div>

                {/* Group Stats Quick View */}
                <div style={s.statsRow}>
                    <div style={s.statCard}>
                        <div style={{fontSize: '12px', color: '#888'}}>TOTAL MEMBERS</div>
                        <div style={{fontSize: '24px', fontWeight: '800', color: '#4a148c'}}>{members.length}</div>
                    </div>
                    <div style={s.statCard}>
                        <div style={{fontSize: '12px', color: '#888'}}>REVENUE GENERATED</div>
                        <div style={{fontSize: '24px', fontWeight: '800', color: '#2e7d32'}}>
                            ₹{members.reduce((acc, m) => acc + (parseFloat(m.current_balance) || 0), 0)}
                        </div>
                    </div>
                    <div style={s.statCard}>
                        <div style={{fontSize: '12px', color: '#888'}}>PENDING REPORTS</div>
                        <div style={{fontSize: '24px', fontWeight: '800', color: '#ef6c00'}}>
                            {members.filter(m => m.current_status !== 'Approved').length}
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div style={s.card}>
    {members.length > 0 ? (
        <>
            <table style={s.table}>
                <thead style={s.thead}>
                    <tr>
                        <th style={s.th}>REF ID</th>
                        <th style={s.th}>PATIENT NAME</th>
                        <th style={s.th}>WORKFLOW STATUS</th>
                        <th style={s.th}>BILLING STATUS</th>
                        <th style={s.th}>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Use currentItems instead of members */}
                    {currentItems.map((m) => (
                        <tr key={m.PatientID}>
                            <td style={s.td}># {m.PatientID}</td>
                            <td style={{...s.td, fontWeight: '600'}}>{m.patient_name}</td>
                            <td style={s.td}>
                                <span style={s.badge(m.current_status)}>
                                    {m.current_status || 'New Entry'}
                                </span>
                            </td>
                            <td style={{...s.td, color: m.current_balance > 0 ? '#d32f2f' : '#2e7d32', fontWeight: 'bold'}}>
                                {m.current_balance > 0 ? `₹${m.current_balance} Due` : 'Fully Paid'}
                            </td>
                            <td style={s.td}>
                                <button 
                                    style={{ ...s.btnPurple, backgroundColor: '#2e7d32', padding: '6px 12px', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        navigate('/edit-invoice', { state: { filterID: m.PatientID } }); 
                                    }}
                                > 
                                    View Report 
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* MUI Table Pagination Footer */}
            <TablePagination
                component="div"
                count={members.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
                sx={{
                    borderTop: '1px solid #eee',
                    '.MuiTablePagination-toolbar': {
                        minHeight: '48px',
                    },
                    '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                        fontSize: '0.8rem',
                        color: '#666',
                        marginBottom: 0, 
                        marginTop: '12px'
                    }
                }}
            />
        </>
    ) : (
        <div style={{padding: '60px', textAlign: 'center', color: '#999'}}>
            <p>No active patients found in this group.</p>
        </div>
    )}
</div>
                
            </div>

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

export default Workflow;