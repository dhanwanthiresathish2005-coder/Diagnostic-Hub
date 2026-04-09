import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { 
    Box, Typography, IconButton, Button, TextField, MenuItem, 
    Table, TableBody, TableCell, TableContainer, TableHead, 
    TableRow, Paper, Pagination, Stack, Card, Grid 
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import { Users, UserPlus } from 'lucide-react';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { TablePagination} from '@mui/material';

function PatientDetails() {
    const navigate = useNavigate();
    const [metadata, setMetadata] = useState({ titles: [], doctors: [] });
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState('search'); 
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

   

    const [formData, setFormData] = useState({
        title_id: '',
        patient_name: '',
        age: '',
        gender: '',
        phone_no: '',
        email:'',
        doctor_id: ''
    });
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
    
    const recordsPerPage = 10;

    const colors = {
        primary: '#4a148c',    
        secondary: '#7b1fa2',  
        pageBG: '#f3e5f5',     
        white: '#ffffff',
        border: '#d1c4e9',
        grey: '#f4f4f4',
        danger: '#d32f2f'
    };

    useEffect(() => {
        fetch('http://localhost:5000/api/registration-metadata')
            .then(res => res.json())
            .then(data => setMetadata(data))
            .catch(err => console.error("Metadata error", err));

        fetch('http://localhost:5000/api/get-all-patients')
            .then(res => res.json())
            .then(data => setPatients(data))
            .catch(err => console.error("Patient list error", err));
    }, []);

    
    const handleSubmit = async (e) => {
    e.preventDefault();
    
    Swal.fire({
        title: 'Registering Patient...',
        didOpen: () => { Swal.showLoading(); },
        allowOutsideClick: false
    });

    try {
        const response = await fetch('http://localhost:5000/api/add-patient', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const result = await response.json();

        if (result.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Patient Registered!',
                text: 'The record has been saved successfully.',
                confirmButtonColor: '#2e7d32'
            });
            window.location.reload(); 
        } else {
            Swal.fire('Registration Failed', result.error || "Unknown error", 'error');
        }
    } catch (error) {
        Swal.fire('Connection Error', 'The server is unreachable.', 'error');
    }
};

    const handleDelete = async (id) => {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This will permanently delete the patient and all their billing history!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#4a148c',
        confirmButtonText: 'Yes, delete !'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`http://localhost:5000/api/patients/${id}`, {
                method: 'DELETE',
            });
            
            const data = await response.json();

            if (response.ok) {
                Toast.fire({
                    icon: 'success',
                    title: data.message || "Patient deleted successfully"
                });
                
                setPatients(prevPatients => prevPatients.filter(p => (p.PatientID || p.id) !== id));
            } else {
                Swal.fire('Error', data.error || "Could not delete patient", 'error');
            }
        } catch (error) {
            console.error("Delete error:", error);
            Swal.fire('Server Error', 'Could not connect to the database.', 'error');
        }
    }
};

const filteredPatients = patients.filter(p => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (p.patient_name || "").toLowerCase().includes(search) ||
                          (p.phone_no || "").includes(search) ||
                          (p.email || "").includes(search) ||
                          (p.PatientID || "").toString().includes(search);

    if (!fromDate && !toDate) return matchesSearch;

    const regDate = new Date(p.RegDate).setHours(0,0,0,0);
    const start = fromDate ? new Date(fromDate).setHours(0,0,0,0) : null;
    const end = toDate ? new Date(toDate).setHours(0,0,0,0) : null;

    return matchesSearch && (!start || regDate >= start) && (!end || regDate <= end);
}).sort((a, b) => (a.PatientID || 0) - (b.PatientID || 0)); 
const [currentPage, setCurrentPage] = useState(0); 
const [rowsPerPage, setRowsPerPage] = useState(10); 
const currentRecords = filteredPatients.slice(
    currentPage * rowsPerPage, 
    currentPage * rowsPerPage + rowsPerPage
);

const totalRecords = filteredPatients.length;

const handleChangePage = (event, newPage) => {
    setCurrentPage(newPage);
};

const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0); 
};

const styles = {
        wrapper: { backgroundColor: colors.pageBG, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Segoe UI, sans-serif' },
        header: { backgroundColor: colors.primary, color: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        navBtn: (active) => ({
            backgroundColor: active ? colors.primary : colors.secondary + '80',
            color: 'white', border: 'none', padding: '10px 25px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold'
        }),
        card: { backgroundColor: colors.white, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', margin: '0 auto' },
        input: { padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '4px', width: '100%', boxSizing: 'border-box' },
        
        tableContainer: { 
            maxHeight: '450px',
            overflowY: 'auto',  
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            border: `1px solid ${colors.border}`
        },
        tableTh: { 
            backgroundColor: colors.grey, 
            border: `1px solid ${colors.border}`, 
            padding: '12px 10px', 
            fontSize: '13px', 
            textAlign: 'left', 
            color: colors.primary, 
            fontWeight: 'bold',
            position: 'sticky', 
            top: -1,
            zIndex: 10
        },
        tableTd: { border: `1px solid ${colors.border}`, padding: '10px', fontSize: '13px', backgroundColor: '#fff' },
        paginationBar: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px', paddingBottom: '20px' },
        pageBtn: { padding: '5px 12px', cursor: 'pointer', backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '4px' },
        filterLabel: { fontSize: '12px', fontWeight: 'bold', color: colors.primary, marginBottom: '5px', display: 'block' }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div style={styles.wrapper}>
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
            {/* --- DYNAMIC HEADING SECTION --- */}
<Box sx={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    mt: 4, 
    mb: -5 
}}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ 
            bgcolor: '#4a148c', 
            p: 1.2, 
            borderRadius: '50%', 
            display: 'flex',
            boxShadow: '0 4px 10px rgba(74, 20, 140, 0.3)' 
        }}>
            {/* Dynamic Icon based on viewMode */}
            {viewMode === 'search' ? (
                <Users size={28} color="white" strokeWidth={2.5} />
            ) : (
                <UserPlus size={28} color="white" strokeWidth={2.5} />
            )}
        </Box>

        <Box>
            <Typography variant="h5" sx={{ color: '#4a148c', fontWeight: 900, letterSpacing: '0.5px', lineHeight: 1.1 }}>
                {viewMode === 'search' ? "PATIENT DETAILS" : "FRONT DESK REGISTRATION"}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6a1b9a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                {viewMode === 'search' 
                    ? "Search, Edit, or Remove Patient Records" 
                    : "Enter New Patient Details for Laboratory Processing"}
            </Typography>
        </Box>
    </Box>
</Box>
            <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button style={styles.navBtn(false)} onClick={() => navigate('/frontdesk')}>New Registration</button>
                    <button style={styles.navBtn(viewMode === 'search')} onClick={() => setViewMode('search')}>Patient Records</button>
                </div>

                {viewMode === 'search' ? (
                    <div style={{ width: '98%', maxWidth: '1300px' }}>
                        {/* Filters Section */}
                        <div style={{ ...styles.card, display: 'flex', gap: '20px', alignItems: 'flex-end', marginBottom: '20px', padding: '15px' }}>
                            <div style={{ flex: 2 }}>
                                <label style={styles.filterLabel}>Quick Search</label>
                                <input 
                                    style={styles.input} 
                                    placeholder="ID, Name, or Phone..." 
                                    value={searchTerm}
                                    onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                                />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
    <label style={styles.filterLabel}>From Date</label>
    <DatePicker
        value={fromDate ? dayjs(fromDate) : null}
        onChange={(val) => {
            setFromDate(val ? val.format('YYYY-MM-DD') : '');
            setCurrentPage(1); 
        }}
        slotProps={{
            textField: {
                size: "small",
                fullWidth: true,
                sx: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        '& fieldset': { border: '1px solid #ccc' },
                        '&:hover fieldset': { borderColor: '#4a148c' },
                        '&.Mui-focused fieldset': { borderColor: '#4a148c' },
                    }
                }
            }
        }}
    />
</div>

<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
    <label style={styles.filterLabel}>To Date</label>
    <DatePicker
        value={toDate ? dayjs(toDate) : null}
        onChange={(val) => {
            setToDate(val ? val.format('YYYY-MM-DD') : '');
            setCurrentPage(1); 
        }}
        slotProps={{
            textField: {
                size: "small",
                fullWidth: true,
                sx: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        '& fieldset': { border: '1px solid #ccc' },
                        '&:hover fieldset': { borderColor: '#4a148c' },
                        '&.Mui-focused fieldset': { borderColor: '#4a148c' },
                    }
                }
            }
        }}
    />
</div>
                        <button 
                                style={{ ...styles.pageBtn, height: '40px', backgroundColor: colors.secondary }}
                                onClick={() => {setFromDate(""); setToDate(""); setSearchTerm("");}}
                            >Clear</button>
                        </div>

                        {/* Scrollable Table Container */}
                        <div style={styles.tableContainer}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={styles.tableTh}>Patient ID</th>
                                        <th style={styles.tableTh}>Date of Reg</th>
                                        <th style={styles.tableTh}>Title</th>
                                        <th style={styles.tableTh}>Full Name</th>
                                        <th style={styles.tableTh}>Sex</th>
                                        <th style={styles.tableTh}>Age</th>
                                        <th style={styles.tableTh}>Email</th>
                                        <th style={styles.tableTh}>External ID</th>
                                        <th style={styles.tableTh}>Phone Number</th>
                                        <th style={styles.tableTh}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentRecords.length > 0 ? currentRecords.map(p => {
                                        const id = p.PatientID || p.id;
                                        const displayDate = p.RegDate ? new Date(p.RegDate).toLocaleDateString('en-GB') : 'N/A';
                                        return (
                                            <tr key={id}>
                                                <td style={styles.tableTd}>{id}</td>
                                                <td style={styles.tableTd}>{displayDate}</td>
                                                <td style={styles.tableTd}>{p.title_name || 'N/A'}</td>
                                                <td style={styles.tableTd}>{p.patient_name}</td>
                                                <td style={styles.tableTd}>{p.gender}</td>
                                                <td style={styles.tableTd}>{p.age}</td>
                                                <td style={styles.tableTd}>{p.email}</td>
                                                <td style={styles.tableTd}>{p.external_id || '0'}</td>
                                                <td style={styles.tableTd}>{p.phone_no}</td>
<td style={{ ...styles.tableTd, textAlign: 'center', whiteSpace: 'nowrap' }}>
    {/* Edit Icon Button */}
    <IconButton 
        onClick={() => navigate(`/edit-patient/${id}`)}
        size="small"
        title="Edit Patient"
        sx={{
            color: '#4a148c',
            border: '1px solid #4a148c',
            marginRight: '8px',
            '&:hover': {
                backgroundColor: '#4a148c',
                color: 'white',
            }
        }}
    >
        <EditIcon fontSize="small" />
    </IconButton>

    {/* Remove Icon Button */}
    <IconButton 
        onClick={() => handleDelete(id)}
        size="small"
        title="Remove Patient"
        sx={{
            color: '#c62828',
            border: '1px solid #c62828',
            '&:hover': {
                backgroundColor: '#c62828',
                color: 'white',
            }
        }}
    >
        <DeleteIcon fontSize="small" />
    </IconButton>
</td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan="9" style={{...styles.tableTd, textAlign: 'center', padding: '20px'}}>No records found for the selected criteria.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                    
<TablePagination
    component="div"
    count={filteredPatients.length} 
    page={currentPage}             
    onPageChange={handleChangePage}
    rowsPerPage={rowsPerPage}
    onRowsPerPageChange={handleChangeRowsPerPage}
    rowsPerPageOptions={[5, 10, 25]}
    sx={{
        backgroundColor: '#fff',
        borderTop: '1px solid #eee',
        borderBottomLeftRadius: '15px',
        borderBottomRightRadius: '15px',
        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
            fontSize: '14px',
            color: '#666',
            marginTop: '14px' 
        },
        '.MuiTablePagination-actions': {
            color: '#4a148c' 
        }
    }}
/>
                    </div>
                ) : (
                    /* Registration Form */
                    <div style={{ ...styles.card, width: '500px' }}>
                        <h2 style={{ color: colors.primary, textAlign: 'center', margin: '0 0 10px 0' }}>New Patient Registration</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {/* ... same form fields as before ... */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <select style={{ ...styles.input, flex: 0.3 }} required value={formData.title_id} onChange={(e) => setFormData({ ...formData, title_id: e.target.value })}>
                                    <option value="">Title</option>
                                    {metadata.titles.map(t => <option key={t.id} value={t.id}>{t.title_name}</option>)}
                                </select>
                                <input style={{ ...styles.input, flex: 1 }} placeholder="Patient Full Name" required value={formData.patient_name} onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="number" style={styles.input} placeholder="Age" required value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
                                <select style={styles.input} required value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                                    <option value="">Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>


                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" style={styles.input} placeholder="Email" required value={formData.age} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                </div>


                            <select style={styles.input} required value={formData.doctor_id} onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}>
                                <option value="">-- Referring Doctor --</option>
                                {metadata.doctors.map(d => <option key={d.id} value={d.id}>{d.doctor_name}</option>)}
                            </select>
                            <input type="tel" style={styles.input} placeholder="Phone Number" required value={formData.phone_no} onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })} />
                            <button type="submit" style={{ ...styles.navBtn(true), width: '100%', marginTop: '10px' }}>Register Patient</button>
                        </form>
                    </div>
                )}
            </div>

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
        </div>
        </LocalizationProvider>
    );
}

export default PatientDetails;