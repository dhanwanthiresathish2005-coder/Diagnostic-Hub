import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Edit3, Trash2, Wand2, Search, Table, EyeOff, Home } from 'lucide-react';
import {
    Box, Typography, Paper, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, TextField, Button, Pagination
} from '@mui/material';
import { ScanText } from 'lucide-react';
import HomeIcon from '@mui/icons-material/Home';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Mail, MapPin } from 'lucide-react';

function DisplayCodes() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [codes, setCodes] = useState([]);
    // Change this line (Line 15 approx):
const [showTable, setShowTable] = useState(false);
    
    const [form, setForm] = useState({ 
        id: null, 
        location: [], 
        clientName: '', 
        code: '', 
        emailId: '', 
        phoneNo: '', 
        panNo: '', 
        address: '', 
        notification: 'No' 
    });

    const resetForm = () => {
        setForm({ 
            id: null, location: [], clientName: '', code: '', emailId: '', 
            phoneNo: '', panNo: '', address: '', notification: 'No' 
        });
    };

    const locationOptions = [
        "Chennai", "Bangalore", "Mumbai", "Delhi", 
        "Karnataka", "Andhra Pradesh", "Kerala", 
        "West Bengal", "Uttar Pradesh"
    ];

    const [currentPage, setCurrentPage] = useState(1);
const entriesPerPage = 5;

// Calculate current data for the table
const indexOfLastEntry = currentPage * entriesPerPage;
const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
const currentEntries = codes.slice(indexOfFirstEntry, indexOfLastEntry);
const totalPages = Math.ceil(codes.length / entriesPerPage);

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

    const fetchCodes = (searchVal = '') => {
        const query = new URLSearchParams({ search: searchVal }).toString();
        fetch(`http://localhost:5000/api/clients/filter?${query}`)
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setCodes(d.data); 
                }
            })
            .catch(err => console.error("Fetch error:", err));
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchCodes(searchTerm);
        }, 400);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        const handleClickOutside = () => setIsOpen(false);
        if (isOpen) window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [isOpen]);

    
    // 1. Ensure your state starts as false at the top of your component
// const [showTable, setShowTable] = useState(false);

const handleSave = async () => {
    // Validation: Client Name and Code are mandatory
    if (!form.clientName || !form.code) {
        return Swal.fire({
            icon: 'warning',
            title: 'Missing Data',
            text: 'Client Name and Code are required to save.',
            confirmButtonColor: '#4a148c'
        });
    }

    try {
        const dataToSend = {
            ...form,
            location: Array.isArray(form.location) ? form.location.join(', ') : form.location
        };

        const response = await fetch('http://localhost:5000/api/add-client-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });
        const result = await response.json();
        
        if (result.success) {
            Toast.fire({
                icon: 'success',
                title: form.id ? "Client updated!" : "Client registered!"
            });

            // Clear the form
            setForm({ 
                id: null, location: [], clientName: '', code: '', emailId: '', 
                phoneNo: '', panNo: '', address: '', notification: 'No' 
            });

            // Refresh the data
            fetchCodes(); 

            // --- THE FIX ---
            // This line forces the table to appear ONLY after a successful save
            setShowTable(true); 
            // ----------------
        }
        
    } catch (err) {
        Swal.fire('Server Error', 'Could not save client data.', 'error');
    }
};
    const handleDelete = async (id) => {
    const confirm = await Swal.fire({
        title: 'Delete Client?',
        text: "This will remove the client and their unique code from the registry.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#4a148c',
        confirmButtonText: 'Yes, delete it'
    });

    if (confirm.isConfirmed) {
        try {
            const response = await fetch(`http://localhost:5000/api/delete-client-code/${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (result.success) {
                Toast.fire({ icon: 'success', title: 'Deleted successfully' });
                fetchCodes(); 
            }
        } catch (err) {
            Swal.fire('Error', 'Could not connect to the server.', 'error');
        }
    }
};

const generateCode = () => {
    if (!form.clientName || form.clientName.length < 3) {
        return Toast.fire({
            icon: 'info',
            title: 'Name too short',
            text: 'Enter at least 3 characters first'
        });
    }
    const prefix = form.clientName.replace(/\s/g, '').substring(0, 4).toUpperCase();
    const randomNumber = Math.floor(100 + Math.random() * 900);
    const newCode = `${prefix}-${randomNumber}`;
    
    setForm({ ...form, code: newCode });
    Toast.fire({
        icon: 'success',
        title: `Generated: ${newCode}`,
        position: 'bottom-end' 
    });
};
    const startEdit = (c) => {
    setForm({
        id: c.id, 
        location: c.location ? c.location.split(', ') : [],
        clientName: c.client_name || '', 
        code: c.client_code || '',
        emailId: c.email_id || '',
        phoneNo: c.phone_no || '',
        panNo: c.pan_no || '',
        address: c.address || '',
        notification: c.notification_required || 'No'
    });
    Toast.fire({
        icon: 'info',
        title: `Editing Client: ${c.client_name}`,
        position: 'top-center',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

    
    return (
       <div className="home-wrapper" style={{ backgroundColor: '#4a148c', minHeight: '100vh', paddingBottom: '70px' }}>
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
            <main className="dashboard-content">
                {/* FORM PANEL */}
                <div className="admin-panel" style={{ 
    width: '98%', 
    margin: '0 auto', 
    marginTop: '30px', /* Reduced top margin */
    backgroundColor: 'white', 
    borderRadius: '8px', 
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
}}>
    {/* Header: Reduced padding and font-size */}

<div className="panel-header" style={{ 
    backgroundColor: '#4a148c', 
    color: 'white', 
    padding: '12px 10px', 
    textAlign: 'center', 
    fontWeight: 'bold', 
    borderTopLeftRadius: '8px', 
    borderTopRightRadius: '10px',
    fontSize: '16px',
    display: 'flex',          
    alignItems: 'center',      
    justifyContent: 'center', 
    gap: '8px',
    marginTop: '-12px'                
}}>
    

<ScanText size={16} strokeWidth={2.5} />
    <span>Client Code Details</span>
</div>
    
    {/* Content Container: Reduced padding from 20px to 10px */}
    <div style={{ padding: '10px 20px' }}>
        {/* Form Grid: Reduced gap from 15px to 8px */}
        <div className="card-form" style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 2fr 1fr 2fr', 
            gap: '8px 15px', 
            alignItems: 'center',
            fontSize: '13px' 
        }}>
            <label>Location*</label>
            <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                <div 
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ 
                        padding: '5px 10px', 
                        border: '1px solid #ccc', 
                        borderRadius: '4px', 
                        cursor: 'pointer', 
                        backgroundColor: 'white', 
                        minHeight: '32px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                    }}
                >
                    <span style={{ fontSize: '12px' }}>
                        {form.location.length > 0 ? form.location.join(', ') : '- Select -'}
                    </span>
                    <span style={{ fontSize: '10px' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
                {isOpen && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, backgroundColor: 'white', border: '1px solid #ccc', maxHeight: '150px', overflowY: 'auto', padding: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                        {locationOptions.map(loc => (
                            <div key={loc} style={{ padding: '3px 0', display: 'flex', alignItems: 'center' }}>
                                <input 
                                    type="checkbox" 
                                    id={`loc-${loc}`}
                                    checked={form.location.includes(loc)}
                                    onChange={() => {
                                        const newLocs = form.location.includes(loc)
                                            ? form.location.filter(i => i !== loc)
                                            : [...form.location, loc];
                                        setForm({ ...form, location: newLocs });
                                    }}
                                />
                                <label htmlFor={`loc-${loc}`} style={{ marginLeft: '10px', cursor: 'pointer', fontSize: '13px' }}>{loc}</label>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <label>Client Name</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                    style={{ width: '100%', padding: '5px 10px', paddingRight: '40px', borderRadius: '4px', border: '1px solid #ccc' }} 
                    placeholder="Name" 
                    value={form.clientName || ''} 
                    onChange={e => setForm({...form, clientName: e.target.value})} 
                />
                <span onClick={generateCode} style={{ position: 'absolute', right: '10px', cursor: 'pointer', fontSize: '16px' }} title="Generate Auto Code">🪄</span>
            </div>

            <label>Code*</label>
            <input style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ccc' }} placeholder="Code" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
            
            <label>Email Id</label>
            <input style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ccc' }} placeholder="Email" value={form.emailId} onChange={e => setForm({...form, emailId: e.target.value})} />

            <label>Phone NO</label>
            <input style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ccc' }} placeholder="Phone" value={form.phoneNo} onChange={e => setForm({...form, phoneNo: e.target.value})} />

            <label>Pan NO</label>
            <input style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ccc' }} placeholder="PAN" value={form.panNo} onChange={e => setForm({...form, panNo: e.target.value})} />

            <label>Address</label>
            <textarea 
                style={{ gridColumn: 'span 3', height: '40px',  padding: '5px 10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }} 
                placeholder="Address" 
                value={form.address} 
                onChange={e => setForm({...form, address: e.target.value})} 
            />
        </div>

        {/* Notification Section: Reduced margin */}
        <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '13px' }}>
            <span>Is Notification Mail Required* </span>
            <input type="radio" name="notif" checked={form.notification === 'Yes'} onChange={() => setForm({...form, notification: 'Yes'})} /> Yes
            <input type="radio" name="notif" style={{marginLeft: '15px'}} checked={form.notification === 'No'} onChange={() => setForm({...form, notification: 'No'})} /> No
        </div>

        <div style={{ textAlign: 'center', marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
    <Button 
        variant="contained" 
        onClick={handleSave}
        sx={{ 
            backgroundColor: '#4a148c', // Corporate Blue
            color: 'white', 
            borderRadius: '25px', 
            padding: '6px 35px', 
            fontWeight: 'bold', 
            fontSize: '13px',
            textTransform: 'none', // Keeps "Save" from becoming "SAVE"
            boxShadow: '0 4px 6px rgba(63, 81, 181, 0.2)',
            '&:hover': {
                backgroundColor: '#4a148c',
                boxShadow: '0 6px 10px rgba(63, 81, 181, 0.3)',
            }
        }}
    >
        {form.id ? "Update Details" : "Save Client"}
    </Button>

    <Button 
        variant="outlined" 
        onClick={() => navigate('/home')}
        sx={{ 
            backgroundColor: '#4a148c', 
            color: 'white', 
            borderColor: '#4a148c',
            borderRadius: '25px', 
            padding: '6px 25px', 
            fontWeight: '500', 
            fontSize: '13px',
            textTransform: 'none',
             boxShadow: '0 4px 6px rgba(63, 81, 181, 0.2)',
            '&:hover': {
                borderColor: '#4a148c',
               boxShadow: '0 6px 10px rgba(63, 81, 181, 0.3)',
            }
        }}
    >
        Cancel
    </Button>
</div>
    </div>
</div>

                {/* SEARCH & TOGGLE SECTION */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px',  gap: '9px' }}>
                    <input 
                        type="text" placeholder="🔍 Search here..." 
                        style={{ padding: '12px', width: '350px', borderRadius: '25px', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />

<Button
    variant="contained"
    onClick={() => setShowTable(!showTable)}
    startIcon={showTable ? <VisibilityOffIcon /> : <VisibilityIcon />}
    sx={{
        borderRadius: '8px', 
        padding: '8px 24px',
        fontWeight: 'bold',
        textTransform: 'none', 
        backgroundColor: showTable ? '#5c6bc0' : '#4a148c',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease',
        '&:hover': {
            backgroundColor: showTable ? '#3f51b5' : '#311b92',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            transform: 'translateY(-1px)'
        }
    }}
>
    {showTable ? "Hide Table" : "View Table"}
</Button>
                </div>


{showTable && (
                    <div style={{ marginTop: '20px', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', width: '98%', margin: '20px auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
                            <table style={{ width: '100%', minWidth: '1100px', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#4a148c', color: 'white', zIndex: 2 }}>
                                    <tr>
                                        <th style={{ padding: '15px' }}>ID</th>
                                        <th>Code</th>
                                        <th>Client Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>PAN</th>
                                        <th>Location</th>
                                        <th style={{ textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentEntries.map(c => (
                                        <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px 15px' }}>{c.id}</td>
                                            <td style={{ fontWeight: 'bold', color: '#4a148c' }}>{c.client_code}</td>
                                            <td style={{ fontWeight: 'bold' }}>{c.client_name}</td>
                                            <td>{c.email_id}</td>
                                            <td>{c.phone_no}</td>
                                            <td>{c.pan_no}</td>
                                            <td>{c.location}</td>
                                            <td style={{ textAlign: 'center' }}>
    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        {/* Edit Button - Themed Purple */}
        <button
            onClick={() => startEdit(c)}
            title="Edit Client"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f3e5f5', 
                color: '#4a148c',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#4a148c';
                e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f3e5f5';
                e.currentTarget.style.color = '#4a148c';
            }}
        >
            <Edit3 size={16} />
        </button>

        {/* Delete Button - Danger Red */}
        <button
            onClick={() => handleDelete(c.id)}
            title="Delete Client"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#ffebee',
                color: '#d32f2f',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#d32f2f';
                e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#ffebee';
                e.currentTarget.style.color = '#d32f2f';
            }}
        >
            <Trash2 size={16} />
        </button>
    </div>
</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

        {/* PAGINATION CONTROLS */}
        <div style={{ padding: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', borderTop: '1px solid #eee' }}>
            <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(currentPage - 1)}
                style={{ padding: '5px 15px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
                Prev
            </button>
            <span>Page {currentPage} of {totalPages || 1}</span>
            <button 
                disabled={currentPage >= totalPages} 
                onClick={() => setCurrentPage(currentPage + 1)}
                style={{ padding: '5px 15px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
            >
                Next
            </button>
        </div>
    </div>
)}
            </main>
            {/* Footer */}
                                   <Box sx={{ 
                                                                mt: 'auto',p: 1, bgcolor: '#4a148c', color: 'rgba(255,255,255,0.8)', 
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
        </div>
    );
}

export default DisplayCodes;