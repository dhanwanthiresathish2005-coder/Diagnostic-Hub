import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import "../styles/home.css";
import { Box, Typography, Paper, Button, IconButton, TextField, Grid, Tooltip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import Swal from 'sweetalert2';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { CalendarClock } from 'lucide-react';
import {Search, Home, Mail, MapPin } from 'lucide-react';


function CollectedAt() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', amount: 0 });
    const [list, setList] = useState([]);
    const [editId, setEditId] = useState(null);

    // --- PAGINATION STATE ---
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;

    const fetchList = () => {
        fetch('http://localhost:5000/api/collected-at')
            .then(res => res.json())
            .then(res => {
                if (res.success) setList(res.data);
            })
            .catch(err => console.error("Error fetching collection list:", err));
    };
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



    useEffect(() => { fetchList(); }, []);

    // --- PAGINATION CALCULATIONS ---
    const totalPages = Math.ceil(list.length / rowsPerPage);
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = list.slice(indexOfFirstRow, indexOfLastRow);

    const handleSave = async () => {
    // 1. Validation with Swal
    if (!form.name) {
        return Swal.fire({
            icon: 'warning',
            title: 'Name Required',
            text: 'Please enter the name of the collection center.',
            confirmButtonColor: '#4a148c'
        });
    }

    const url = editId 
        ? `http://localhost:5000/api/update-collected/${editId}` 
        : 'http://localhost:5000/api/add-collected';
    const method = editId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        const data = await response.json();

        if (data.success) {
            // 2. Success Feedback
            Toast.fire({
                icon: 'success',
                title: editId ? 'Record updated' : 'Record added successfully'
            });

            setForm({ name: '', amount: 0 });
            setEditId(null);
            fetchList();
        }
    } catch (err) {
        Swal.fire('Error', 'Server connection failed', 'error');
    }
};

const handleDelete = async (id) => {
    const result = await Swal.fire({
        title: 'Delete Record?',
        text: "This collection center will be removed from the system.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#4a148c',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`http://localhost:5000/api/delete-collected/${id}`, { 
                method: 'DELETE' 
            });
            const data = await response.json();

            if (data.success) {
                Toast.fire({
                    icon: 'success',
                    title: 'Deleted successfully'
                });
                fetchList();
            }
        } catch (err) {
            Swal.fire('Error', 'Could not delete the record', 'error');
        }
    }
};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f3e5f5' }}>
            
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

            <main style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
                
                {/* Input Panel */}
                <div className="admin-panel" style={{ width: '100%', maxWidth: '800px', flexShrink: 0 }}>
                  
<div style={{ 
    backgroundColor: '#4a148c', 
    color: 'white', 
    padding: '10px', 
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center', 
    gap: '10px' 
}}>
    <CalendarClock size={18} strokeWidth={2.5} />
    <span>CollectedAt Details</span>
</div>
                    <div style={{ display: 'flex', gap: '15px', padding: '20px', backgroundColor: 'white', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: 2 }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Collection Center Name</label>
                            <input className="purple-select" placeholder="Enter Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Default Amount</label>
                            <input type="number" className="purple-select" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                        </div>
                        <button onClick={handleSave} className="innovative-btn" style={{ marginTop: '22px' }}>{editId ? 'Update' : 'Save'}</button>
                    </div>
                </div>

                {/* Table Container with scroll and 5-row limit */}
                <div className="admin-panel" style={{ marginTop: '20px', width: '100%', maxWidth: '800px', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div className="custom-scrollbar" style={{ maxHeight: '320px', overflowY: 'auto', padding: '10px' }}>
                        <table className="operation-table" width="100%">
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                                <tr>
                                    <th style={{ borderBottom: '2px solid #ede7f6' }}>ID</th>
                                    <th style={{ borderBottom: '2px solid #ede7f6' }}>Center Name</th>
                                    <th style={{ borderBottom: '2px solid #ede7f6' }}>Amount</th>
                                    <th style={{ borderBottom: '2px solid #ede7f6' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRows.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td>
                                        <td>{item.name}</td>
                                        <td>₹{item.amount}</td>
                                        <td>


<Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
    <Tooltip title="Edit">
        <IconButton 
            onClick={() => { 
                setEditId(item.id); 
                setForm({ name: item.name, amount: item.amount }); 
            }}
            sx={{ 
                color: '#4a148c', 
                '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.1)' } 
            }}
        >
            <EditIcon fontSize="small" />
        </IconButton>
    </Tooltip>

    <Tooltip title="Delete">
        <IconButton 
            onClick={() => handleDelete(item.id)}
            sx={{ 
                color: '#f44336', 
                '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' } 
            }}
        >
            <DeleteIcon fontSize="small" />
        </IconButton>
    </Tooltip>
</Box>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', gap: '10px', borderTop: '1px solid #eee' }}>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="nav-btn">Prev</button>
                        <span style={{ fontWeight: 'bold' }}>Page {currentPage} of {totalPages || 1}</span>
                        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="nav-btn">Next</button>
                    </div>
                </div>
            </main>

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

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #7b1fa2; border-radius: 10px; }
                .nav-btn { padding: 5px 12px; cursor: pointer; border: 1px solid #ccc; background: white; border-radius: 4px; }
                .nav-btn:disabled { cursor: not-allowed; opacity: 0.5; }
            `}</style>
        </div>
    );
}

export default CollectedAt;