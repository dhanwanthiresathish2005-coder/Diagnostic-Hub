import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import Swal from 'sweetalert2';
import { FilePenLine, StickyNote } from 'lucide-react';
import {Search, Home, Mail, MapPin } from 'lucide-react';

import { 
  FaSearch, FaHome, FaEdit, FaFileInvoice, 
  FaTags, FaPercent, FaFileAlt, FaFilter 
} from 'react-icons/fa';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Tooltip, IconButton } from '@mui/material';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function EditInvoice() {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(null); 
    const [selectedRow, setSelectedRow] = useState({ patientName: '', patientId: '', totalAmount: '', discount_amount: '' });
    const [clientCodes, setClientCodes] = useState([]);
const [collectedAtList, setCollectedAtList] = useState([]);
const [doctorsList, setDoctorsList] = useState([]);
const [fromDate, setFromDate] = useState(""); 
const [dates, setDates] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

const [toDate, setToDate] = useState("");
const [invoiceCategory, setInvoiceCategory] = useState("Individual"); 
const [selectType, setSelectType] = useState("All Invoice"); 
const [discountInput, setDiscountInput] = useState(""); 
const [notesInput, setNotesInput] = useState('');
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

const handleSaveNotes = async () => {
    if (!selectedRow?.id) return;
    
    if (!notesInput?.trim()) {
        return Swal.fire({
            icon: 'warning',
            title: 'Empty Note',
            text: 'Please enter a note before saving.',
            confirmButtonColor: '#4a148c',
            didOpen: () => { Swal.getContainer().style.zIndex = '3000'; } 
        });
    }

    Swal.fire({
        title: 'Saving Note...',
        allowOutsideClick: false,
        didOpen: () => { 
            Swal.showLoading(); 
            Swal.getContainer().style.zIndex = '3000'; 
        }
    });

    try {
        const response = await fetch(`http://localhost:5000/api/invoices/${selectedRow.id}/notes`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: notesInput })
        });

        const data = await response.json();
        
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Note updated successfully!',
                showConfirmButton: false,
                timer: 1500,
                didOpen: () => { Swal.getContainer().style.zIndex = '3000'; }
            });

            setNotesInput(''); 
            handleSearch(); 
            handleClose(); 
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || "Failed to save notes",
                didOpen: () => { Swal.getContainer().style.zIndex = '3000'; }
            });
        }
    } catch (error) {
        console.error("Error saving notes:", error);
        Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: 'Could not reach the billing service.',
            didOpen: () => { Swal.getContainer().style.zIndex = '3000'; }
        });
    }
};

const calculateBalance = (row) => {
    if (!row) return "0.00";
    const total = parseFloat(row.totalAmount) || 0;
    const paid = parseFloat(row.paidAmount) || 0;
    const discount = parseFloat(row.discount_amount) || 0;
    return (total - paid - discount).toFixed(2);
};

const handleSearch = () => {
    setLoading(true);
    
    const typeMapping = {
        "All Invoice": "All",
        "Self": "self",
        "Group": "group",
        "Insurance": "insurance",
        "Hospital": "out" 
    };

    const typeValue = typeMapping[selectType] || "All";
    const params = new URLSearchParams({
        from: passedFilterID ? "2020-01-01T00:00" : fromDate,
        to: toDate,
        category: invoiceCategory, 
        type: typeValue 
    });

    fetch(`http://localhost:5000/api/invoices?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                const normalizedRows = data.map(inv => {
                    const total = parseFloat(inv.totalAmount || inv.Amount || 0);
                    const paid = parseFloat(inv.paidAmount || inv.amount_paid || 0);
                    const discount = parseFloat(inv.discount_amount || inv.discountAmount || 0);
                    
                    return {
                        ...inv,
                        totalAmount: total,
                        paidAmount: paid,
                        discount_amount: discount, 
                        balance: (total - paid - discount) 
                    };
                });
                setRows(normalizedRows);
            }
            setLoading(false); 
        })
        .catch(err => {
            console.error("Search error:", err);
            setLoading(false); 
        });
};
    
    const modalStyle = {
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        width: 600, 
        bgcolor: 'background.paper', 
        border: '1px solid #ccc', 
        boxShadow: 24, 
        p: 0, 
        borderRadius: '4px', 
        overflow: 'hidden'
    };

   const handleActionClick = (row, type) => {
    const cleanNum = (val) => parseFloat(String(val).replace(/[^0-9.-]+/g, "")) || 0;

    const total = cleanNum(row.totalAmount);
    const paid = cleanNum(row.paidAmount);
    const discount = cleanNum(row.discount_amount || row.discountAmount || 0);
    const currentBalance = (total - paid - discount).toFixed(2);

    setSelectedRow({ ...row, balance: currentBalance });
    
    setOpenModal(type);
    if (type === 'notes') {
        setNotesInput(row.notes || "");
    } else if (type === 'addDiscount') {
        setDiscountInput(row.discount_percent || "");
    }
};const handleClose = () => {
        setOpenModal(null);
        setSelectedRow(null);
    };

    const location = useLocation(); 
    const passedFilterID = location.state?.filterID;
useEffect(() => {
    setLoading(true);
    const todayObj = new Date();
    const lastWeekObj = new Date();
    lastWeekObj.setDate(todayObj.getDate() - 30);
    const format = (date) => date.toISOString().slice(0, 16);
    const defaultFrom = format(lastWeekObj);
    const defaultTo = format(todayObj);
    if (!fromDate) setFromDate(defaultFrom);
    if (!toDate) setToDate(defaultTo);

    const typeMapping = { "All Invoice": "All", "Self": "self", "Group": "group", "Insurance": "insurance", "Hospital": "out" };
    const typeValue = typeMapping[selectType] || "All";
    const params = new URLSearchParams({
        from: passedFilterID ? "2020-01-01T00:00" : (fromDate || defaultFrom),
        to: defaultTo,
        category: invoiceCategory,
        type: typeValue
    });

    fetch(`http://localhost:5000/api/invoices?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
    if (Array.isArray(data)) {
        const normalized = data.map(inv => ({
            ...inv,
            totalAmount: parseFloat(inv.totalAmount || inv.Amount || 0),
            paidAmount: parseFloat(inv.paidAmount || inv.amount_paid || 0),
            discount_amount: parseFloat(inv.discount_amount || inv.discountAmount || 0),
            balance: (parseFloat(inv.totalAmount || 0) - parseFloat(inv.paidAmount || 0) - parseFloat(inv.discount_amount || 0))
        }));

        if (passedFilterID) {
            const filtered = normalized.filter(inv => 
                String(inv.patientId) === String(passedFilterID) || 
                String(inv.PatientID) === String(passedFilterID)
            );
            setRows(filtered);
        } else {
            setRows(normalized);
        }
    }
    setLoading(false);
})
        .catch(err => {
            console.error("Fetch error:", err);
            setLoading(false);
        });
}, [passedFilterID]); 

useEffect(() => {
    fetch('http://localhost:5000/api/client-codes')
        .then(res => res.json())
        .then(json => { if(json.success) setClientCodes(json.data.map(c => c.client_code)); });
    fetch('http://localhost:5000/api/collected-at')
        .then(res => res.json())
        .then(json => { if(json.success) setCollectedAtList(json.data.map(l => l.name)); });
    fetch('http://localhost:5000/api/doctors/filter') 
        .then(res => res.json())
        .then(json => { if(json.success) setDoctorsList(json.data.map(d => d.doctor_name)); });
}, []);

const updateInvoiceData = async (url, method, body) => {
    if (method !== 'PATCH' && (!body || Object.keys(body).length === 0)) {
        return Swal.fire({
            icon: 'error',
            title: 'No Data Provided',
            text: 'The update request was empty. Please ensure all fields are filled before saving.',
            confirmButtonColor: '#4a148c'
        });
    }

    Swal.fire({
        title: 'Updating Invoice...',
        didOpen: () => { Swal.showLoading(); },
        allowOutsideClick: false
    });

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : null,
        });

        const result = await response.json();
        Swal.close();

        if (response.ok) {
            Toast.fire({
                icon: 'success',
                title: 'Invoice updated successfully!'
            });
            handleClose();
            handleSearch(); 
        } else {
            Swal.fire('Update Failed', result.error || "Server error", 'error');
        }
    } catch (err) {
        Swal.close();
        console.error("Error updating:", err);
        Swal.fire('Connection Error', 'Check your connection.', 'error');
    }
};

const renderFilterHeader = (label) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '5px 0' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#4a148c', marginBottom: '4px', textAlign: 'center' }}>
                {label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #ccc', borderRadius: '2px', width: '90%', height: '22px', padding: '0 2px' }}>
                <input type="text" style={{ border: 'none', width: '100%', outline: 'none', fontSize: '10px' }} />
                <FaFilter style={{ color: '#ccc', fontSize: '8px' }} />
            </div>
        </div>
    );
const columns = [
        { field: 'invoiceNo', width: 160, renderHeader: () => renderFilterHeader('Invoice No'), 
          renderCell: (params) => <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>{params.value}</span> 
        },
        { field: 'date', width: 100, renderHeader: () => renderFilterHeader('Date') },
        { field: 'sampleId', width: 120, renderHeader: () => renderFilterHeader('Sample ID') },
        { field: 'patientId', width: 110, renderHeader: () => renderFilterHeader('Patient ID') },
        { field: 'patientName', width: 180, renderHeader: () => renderFilterHeader('Patient Name') },
        { field: 'totalAmount', width: 110, renderHeader: () => renderFilterHeader('Total Amount') },
        { field: 'paidAmount', width: 110, renderHeader: () => renderFilterHeader('Paid Amount') },
       
        { field: 'paymentDate', width: 120, renderHeader: () => renderFilterHeader('Payment Date') },
        { 
    field: 'invoiceType', 
    width: 110, 
    renderHeader: () => renderFilterHeader('Invoice Type'),
    renderCell: (params) => {
        const val = params.value?.toLowerCase();
        if (val === 'out') return <span style={{ fontWeight: 'bold', color: '#3f4346' }}>Hospital</span>;
        if (val === 'self') return 'Self';
        return val ? val.charAt(0).toUpperCase() + val.slice(1) : 'N/A';
    }
},
{ 
    field: 'balance',  
    width: 110, 
     renderHeader: () => renderFilterHeader('Balance'),
    renderCell: (params) => {
        const total = Number(params.row.totalAmount || params.row.Amount || 0);
        const paid = Number(params.row.paidAmount || params.row.amount_paid || 0);
        const discount = Number(params.row.discount_amount || params.row.discountAmount || 0);
        const finalBalance = total - paid - discount;

        return (
            <span style={{ 
                fontWeight: 'bold', 
                color: finalBalance > 0 ? '#d32f2f' : '#2e7d32' 
            }}>
                {finalBalance.toFixed(2)}
            </span>
        );
    }
},
        { field: 'paymentType', width: 120, renderHeader: () => renderFilterHeader('Payment Type') },
        { field: 'invoiceStatus', width: 120, renderHeader: () => renderFilterHeader('Invoice Status'), 
            
          renderCell: (params) => (
            <span style={{ color: params.value === 'Cancelled' ? 'red' : 'inherit' }}>{params.value}</span>
          )
        },
        { field: 'collectedAt', width: 120, renderHeader: () => renderFilterHeader('Collected At') },
        { field: 'clientCode', width: 110, renderHeader: () => renderFilterHeader('Client Code') },
        { field: 'referredBy', width: 120, renderHeader: () => renderFilterHeader('ReferredBy') },
       {
    field: 'actions',
    width: 200, 
    renderHeader: () => renderFilterHeader('Action'),
    renderCell: (params) => (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            gap: '12px',         
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer', 
            height: '100%'        
        }}>
            <FaEdit title="Edit Details" onClick={() => handleActionClick(params.row, 'edit')} />
            <FaFileInvoice title="View Receipt" onClick={() => handleActionClick(params.row, 'receipt')} />
            <FaTags title="Add Discount" onClick={() => handleActionClick(params.row, 'addDiscount')} />
            <FaPercent title="Remove Discount" onClick={() => handleActionClick(params.row, 'removeDiscount')} />
            <FaFileAlt title="Add Notes" onClick={() => handleActionClick(params.row, 'notes')} />
        </div>
    )
},
    ];

    return (
        
        <div style={{ backgroundColor: '#f0d4f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' }}>
           <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', bgcolor: '#4a148c', color: 'white', position: 'relative' }}>
                <Typography variant="h6" fontWeight="bold">PATHO CONSULT</Typography>
                <IconButton 
                        onClick={() => navigate('/home')} 
                        sx={{ position: 'absolute', right: 36, top: 3, color: 'white' }}
                    >
                        <HomeIcon fontSize="large" />
                    </IconButton>
            </Box>

            <main style={{ padding: '56px' }}>
                {/* Search Panel */}
                <div style={{ backgroundColor: 'white', borderRadius: '8px', marginBottom: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '-40px'  }}>
                   
<Box 
    sx={{ 
        backgroundColor: '#fdfdfd', 
        padding: '10px 15px', 
        borderBottom: '1px solid #eee', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between' 
    }}
>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <FilePenLine size={20} color="#4a148c" strokeWidth={2} />
        
        <Typography 
            sx={{ 
                fontWeight: 'bold', 
                color: '#4a148c',
                fontSize: '0.95rem' 
            }}
        >
            Edit Invoice Details
        </Typography>
    </Box>

    {/* This is where your 'Close' or 'X' button usually goes in a space-between layout */}
</Box>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '-18px'}}>
                        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', border: '1px solid #ddd'}}>
                            <div style={{ padding: '10px', backgroundColor: '#f9f9f9' }}>Invoice</div>
                            {/* Invoice Category Dropdown */}
<select 
    value={invoiceCategory} 
    onChange={(e) => setInvoiceCategory(e.target.value)} 
    style={{ border: 'none', padding: '10px' }}
>
    <option value="Individual">Individual</option>
    <option value="Range">Range</option>
</select>

{/* Select Type Dropdown */}
<select 
    value={selectType} 
    onChange={(e) => setSelectType(e.target.value)} 
    style={{ border: 'none', padding: '10px' }}
>
    <option value="All Invoice">All Invoice</option>
    <option value="Self">Self</option>
    <option value="Hospital">Hospital</option>
    <option value="Insurance">Insurance</option>
    <option value="Group">Group</option>
</select>
                        </div>
                        


{/* Date Range Section */}
<LocalizationProvider dateAdapter={AdapterDayjs}>
  <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', border: '1px solid #ddd' }}>
    <div style={{ padding: '10px', borderRight: '1px solid #ddd', backgroundColor: '#f9f9f9', fontSize: '0.85rem' }}>
      Date Range
    </div>
    <div style={{ padding: '10px', display: 'flex', gap: '20px', alignItems: 'center' }}>
      
      {/* From Date */}
      <DatePicker
        label="From"
        value={fromDate ? dayjs(fromDate) : null}
        onChange={(newValue) => setFromDate(newValue ? newValue.toISOString() : null)}
        slotProps={{ 
          textField: { 
            size: 'small', 
            sx: { '& .MuiInputBase-input': { fontSize: '0.85rem' } } 
          } 
        }}
      />

      {/* To Date */}
      <DatePicker
        label="To"
        value={toDate ? dayjs(toDate) : null}
        onChange={(newValue) => setToDate(newValue ? newValue.toISOString() : null)}
        slotProps={{ 
          textField: { 
            size: 'small', 
            sx: { '& .MuiInputBase-input': { fontSize: '0.85rem' } } 
          } 
        }}
      />
      
    </div>
  </div>
</LocalizationProvider>

{/* Search Button */}
<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '-5px' }}>
    {!fromDate && !toDate && (
        <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
            *Showing records from the last 7 days by default
        </Typography>
    )}
    <Button 
        variant="contained" 
        onClick={handleSearch}
        style={{ 
            backgroundColor: '#4a148c', 
            borderRadius: '20px', 
            padding: '6px 30px', 
            textTransform: 'none',
            fontWeight: 'bold' 
        }}
    >
        Search
    </Button>
</div>
        </div>
                    
                </div>
                {/* DataGrid Table */}
                <div style={{ height: 550, width: '100%', backgroundColor: 'white' }}>
                    {/* --- INSERT THIS BLOCK HERE --- */}
    {passedFilterID && (
        <Box sx={{ 
            p: 1.5, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            bgcolor: '#fff3e0', 
            borderBottom: '1px solid #ffe0b2' 
        }}>
            <Typography variant="body2" sx={{ color: '#e65100', fontWeight: 'bold' }}>
                🔎 Patient ID: {passedFilterID}
            </Typography>
            <Button 
                size="small" 
                variant="outlined" 
                color="warning" 
                onClick={() => navigate('/edit-invoice', { state: {} })} 
                sx={{ textTransform: 'none', height: '28px' }}
            >
                Clear Filter / Show All
            </Button>
        </Box>
    )}
                    <DataGrid
    rows={rows}
    columns={columns}
    loading={loading}
    rowHeight={60}
    columnHeaderHeight={80}
                        getRowId={(row) => row.id}
                        sx={{
                            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#e0f2f1 !important' }
                        }}
                    />
                </div>

                {/* --- UPDATED MODALS SECTION --- */}

{/* 1. Edit Details Modal - Fully Integrated Fix */}
<Modal open={openModal === 'edit'} onClose={handleClose}>
    <Box sx={{ ...modalStyle, width: 700, maxHeight: '100vh', overflowY: 'auto' }}>
        <div style={{ background: '#eee', padding: '10px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc' }}>
            <Typography fontWeight="bold">Edit Invoice Details</Typography>
            <CloseIcon onClick={handleClose} style={{ cursor: 'pointer' }} />
        </div>
        <div style={{ padding: '15px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
{[
    { label: 'PatientId', value: selectedRow?.patientId, editable: false },
    { label: 'Patient Name', value: selectedRow?.patientName, editable: true, key: 'patientName' },
    { label: 'Sample ID', value: selectedRow?.sampleId, editable: false },
    { label: 'Invoice No', value: selectedRow?.invoiceNo, editable: false, },
    { label: 'Total Amount', value: selectedRow?.totalAmount, editable: false },
    { label: 'Paid Amount', value: selectedRow?.paidAmount, editable: false },
    { 
        label: 'Balance Amount', 
        // CALCULATE HERE:
        value: (
            (parseFloat(selectedRow?.totalAmount) || 0) - 
            (parseFloat(selectedRow?.paidAmount) || 0) - 
            (parseFloat(selectedRow?.discount_amount) || 0)
        ).toFixed(2), 
        editable: false 
    },
].map((item, index) => (
    <tr key={index} style={{ border: '1px solid #ccc' }}>
        <td style={{ padding: '8px', background: '#f9f9f9', fontWeight: 'bold', width: '30%', fontSize: '0.85rem' }}>
            {item.label}
        </td>
        <td style={{ padding: '0 8px', fontSize: '0.85rem' }}>
            {item.editable ? (
                <input 
                    style={{ width: '100%', border: '1px solid #ddd', padding: '8px', outline: 'none', backgroundColor: '#fff', margin: '4px 0' }} 
                    value={selectedRow?.[item.key] || ''} 
                    onChange={(e) => setSelectedRow({...selectedRow, [item.key]: e.target.value})}
                />
            ) : (
                <span style={{ 
                    color: item.label === 'Balance Amount' ? '#d32f2f' : '#666',
                    fontWeight: item.label === 'Balance Amount' ? 'bold' : 'normal'
                }}>
                    {item.value}
                </span>
            )}
        </td>
    </tr>
))}
{[
    { 
        label: 'Client Code', 
        key: 'clientCode', 
        options: clientCodes 
    },
    { 
        label: 'Collected At', 
        key: 'collectedAt', 
        options: collectedAtList 
    },
    { 
        label: 'Referred By', 
        key: 'referredBy', 
        options: [...doctorsList, 'Self'] 
    }
].map((field, index) => (
    <tr key={index} style={{ border: '1px solid #ccc' }}>
        <td style={{ padding: '8px', background: '#f9f9f9', fontWeight: 'bold', fontSize: '0.85rem' }}>
            {field.label}
        </td>
        <td style={{ padding: '0 8px' }}>
            <select 
                style={{ width: '100%', border: '1px solid #ddd', outline: 'none', padding: '8px 0', background: '#fff', cursor: 'pointer', margin: '4px 0' }}
                value={selectedRow?.[field.key] || ''}
                onChange={(e) => setSelectedRow({...selectedRow, [field.key]: e.target.value})}
            >
                <option value="">-Select-</option>
                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </td>
    </tr>
))}
                </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
                <Button 
                    variant="contained" 
                    sx={{ bgcolor: '#f44336', textTransform: 'none', borderRadius: '20px', px: 4, '&:hover': { bgcolor: '#d32f2f' } }} 
                    onClick={handleClose}
                >
                    Cancel
                </Button>
                <Button 
                    variant="contained" 
                    sx={{ bgcolor: '#2d2dfd', borderRadius: '20px', px: 4, textTransform: 'none' }}
                    onClick={() => {
                        const payload = {
                            patient_name: selectedRow.patientName,
                            clientCode: selectedRow.clientCode,
                            collectedAt: selectedRow.collectedAt,
                            referredBy: selectedRow.referredBy 
                        };

                        console.log("Submitting Payload:", payload);
                        
                        updateInvoiceData(
                            `http://localhost:5000/api/invoices/${selectedRow.id}`, 
                            'PUT', 
                            payload
                        );
                    }}
                >
                    Submit
                </Button>
            </div>
        </div>
    </Box>
</Modal>

{/* 2. Add Discount Modal (Matches Screenshot 326) */}
<Modal open={openModal === 'addDiscount'} onClose={handleClose}>
    <Box sx={modalStyle}>
        <div style={{ background: '#eee', padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <Typography fontWeight="bold">Add Discount Details</Typography>
            <CloseIcon onClick={handleClose} style={{ cursor: 'pointer' }} />
        </div>
        <div style={{ padding: '15px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                    {[
                        { label: 'PatientId', value: selectedRow?.patientId },
                        { label: 'Patient Name', value: selectedRow?.patientName },
                        { label: 'Sample ID', value: selectedRow?.sampleId },
                        { label: 'Total Amount', value: selectedRow?.totalAmount },
                        { label: 'Paid Amount', value: selectedRow?.paidAmount },
                    ].map((item, index) => (
                        <tr key={index} style={{ border: '1px solid #ccc' }}>
                            <td style={{ padding: '8px', background: '#f9f9f9', fontWeight: 'bold', width: '30%' }}>{item.label}</td>
                            <td style={{ padding: '8px' }}>{item.value}</td>
                        </tr>
                    ))}
                    
                    {/* LIVE CALCULATION ROW */}
                    <tr style={{ border: '1px solid #ccc' }}>
                        <td style={{ padding: '8px', background: '#f9f9f9', fontWeight: 'bold' }}>Balance Amount</td>
                        <td style={{ padding: '8px', color: '#d32f2f', fontWeight: 'bold' }}>
                            {(() => {
                                const total = parseFloat(selectedRow?.totalAmount) || 0;
                                const paid = parseFloat(selectedRow?.paidAmount) || 0;
                                const discPercent = parseFloat(discountInput) || 0;
                                const discAmt = (total * discPercent) / 100;
                                return (total - paid - discAmt).toFixed(2);
                            })()}
                        </td>
                    </tr>

                    <tr style={{ border: '1px solid #ccc' }}>
                        <td style={{ padding: '8px', background: '#f9f9f9', fontWeight: 'bold' }}>Discount (%)</td>
                        <td style={{ padding: '0 8px' }}>
                           <input 
                                type="number"
                                placeholder="Enter discount %" 
                                value={discountInput} 
                                onChange={(e) => setDiscountInput(e.target.value)} 
                                style={{ width: '100%', border: 'none', outline: 'none', padding: '8px 0' }} 
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                
<Button 
    variant="contained" 
    sx={{ mt: 2, borderRadius: '20px', bgcolor: '#2d2dfd' }}
    onClick={() => {
        const numericDiscount = parseFloat(discountInput);
        const total = parseFloat(selectedRow?.totalAmount) || 0;
        const paid = parseFloat(selectedRow?.paidAmount) || 0;
        const discAmt = (total * numericDiscount) / 100;
        if (paid + discAmt > total) {
            return Swal.fire({
                icon: 'error',
                title: 'Invalid Discount',
                text: 'Total (Paid + Discount) cannot exceed the Invoice Amount.'
            });
        }

        if (isNaN(numericDiscount) || numericDiscount < 0 || numericDiscount > 100) {
            return Swal.fire('Invalid Input', 'Enter a percentage between 0 and 100.', 'warning');
        }

        updateInvoiceData(
            `http://localhost:5000/api/invoices/${selectedRow.id}/discount`, 
            'PATCH', 
            { discountPercentage: numericDiscount }
        );
    }}
>
    Update Discount
</Button>
            </div>
        </div>
    </Box>
</Modal>

{/* 3. Remove Discount Modal */}
<Modal open={openModal === 'removeDiscount'} onClose={handleClose}>
    <Box sx={modalStyle}>
        {/* Header */}
        <div style={{ background: '#f5f5f5', padding: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd' }}>
            <Typography fontWeight="bold" color={selectedRow?.discount_amount > 0 ? "error" : "textSecondary"}>
                Remove Applied Discount
            </Typography>
            <CloseIcon onClick={handleClose} style={{ cursor: 'pointer' }} />
        </div>

        <div style={{ padding: '30px', textAlign: 'center' }}>
            {/* CHECK: If discount is 0 or null */}
            {!(parseFloat(selectedRow?.discount_amount) > 0) ? (
                <Box>
                    <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
                        🚫 No discount applied
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 3 }}>
                        There is no active discount to remove for <strong>{selectedRow?.patientName}</strong>.
                    </Typography>
                    <Button variant="contained" sx={{ bgcolor: '#4a148c' }} onClick={handleClose}>
                        Go Back
                    </Button>
                </Box>
            ) : (
                <Box>
                    <Typography variant="body1">
                        Are you sure you want to remove the discount 
                        <strong style={{ color: '#d32f2f' }}> ₹{selectedRow?.discount_amount} </strong> 
                        for <strong>{selectedRow?.patientName}</strong>?
                    </Typography>

                    <Typography variant="caption" display="block" sx={{ mt: 1, mb: 3, p: 1, bgcolor: '#fff5f5', borderRadius: '4px' }}>
                        Current Balance: ₹{(
                            (parseFloat(selectedRow?.totalAmount) || 0) - 
                            (parseFloat(selectedRow?.paidAmount) || 0) - 
                            (parseFloat(selectedRow?.discount_amount) || 0)
                        ).toFixed(2)} | Total: ₹{selectedRow?.totalAmount}
                    </Typography>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                        <Button variant="outlined" onClick={handleClose} sx={{ borderRadius: '20px' }}>
                            No, Keep it
                        </Button>
                        <Button 
                            variant="contained" 
                            color="error"
                            sx={{ borderRadius: '20px' }}
                            onClick={() => {
                                updateInvoiceData(
                                    `http://localhost:5000/api/invoices/${selectedRow.id}/remove-discount`, 
                                    'PATCH', 
                                    {} 
                                );
                            }}
                        >
                            Yes, Remove Discount
                        </Button>
                    </div>
                </Box>
            )}
        </div>
    </Box>
</Modal>

{/* 4. Save Notes Modal */}
<Modal open={openModal === 'notes'} onClose={handleClose}>
    <Box sx={modalStyle}>
        {/* Updated Professional Header */}
        <div style={{ 
            background: 'linear-gradient(135deg, #6a1b9a, #4a148c)', 
            padding: '12px 15px', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'white' 
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StickyNote size={20} />
                <Typography fontWeight="bold">Add Notes Details</Typography>
            </div>
            <CloseIcon onClick={handleClose} style={{ cursor: 'pointer' }} />
        </div>

        <div style={{ padding: '15px' }}>
            {/* Patient Info Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                <tbody>
                    <tr style={{ border: '1px solid #ddd' }}>
                        <td style={{ padding: '8px', background: '#f5f5f5', fontWeight: 'bold', width: '35%', color: '#4a148c' }}>Patient ID</td>
                        <td style={{ padding: '8px' }}>{selectedRow?.patientId}</td>
                    </tr>
                    <tr style={{ border: '1px solid #ddd' }}>
                        <td style={{ padding: '8px', background: '#f5f5f5', fontWeight: 'bold', color: '#4a148c' }}>Patient Name</td>
                        <td style={{ padding: '8px' }}>{selectedRow?.patientName}</td>
                    </tr>
                </tbody>
            </table>

            <TextField 
                fullWidth 
                multiline 
                rows={4} 
                value={notesInput} 
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Enter notes (Max 500 characters)" 
                variant="outlined" 
                sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#4a148c' } }}
            />

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                <Button 
                    variant="contained" 
                    onClick={handleSaveNotes}
                    sx={{ bgcolor: '#4a148c', '&:hover': { bgcolor: '#38006b' } }}
                >
                    Save Notes
                </Button>

                <Tooltip title="View Previous Notes">
                    <IconButton 
                        sx={{ border: '1px solid #4a148c', color: '#4a148c' }} 
                        onClick={() => {
                            Swal.fire({
                                title: 'Previous Notes',
                                text: selectedRow?.notes || "No notes saved yet.",
                                icon: 'info',
                                confirmButtonColor: '#4a148c',
                                didOpen: () => { Swal.getContainer().style.zIndex = '3000'; }
                            });
                        }} 
                    >
                        <VisibilityIcon />
                    </IconButton>
                </Tooltip>
            </div>
        </div>
    </Box>
</Modal>

{/* 5. View Receipt Modal */}
<Modal open={openModal === 'receipt'} onClose={handleClose}>
    <Box sx={{ ...modalStyle, width: 800 }}> 
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <div>
                    <Typography variant="h6" fontWeight="bold">{selectedRow?.patientName}</Typography>
                    {/* Display Group Name if it exists */}
                    {selectedRow?.invoiceType?.toLowerCase() === 'group' && (
                        <Typography variant="caption" sx={{ color: '#4a148c', fontWeight: 'bold' }}>
                            (Group: {selectedRow?.groupName})
                        </Typography>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ textAlign: 'center' }}>
                    <IconButton 
                        onClick={() => navigate('/home')} 
                        sx={{ position: 'absolute', right: 50, top: 10, color: 'black', cursor: 'pointer' }}
                    >
                        <HomeIcon fontSize="small" />
                    </IconButton> 
                    <br/><small>Home</small>  
                    </div>
                  
                    <div style={{ textAlign: 'center' }}>
                        <button style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => window.print()}>
                            <FaFileInvoice style={{ color: '#1976d2' }} />
                            <br/><small>Print</small>
                            
                        </button>
                    </div>
                </div>
            </div>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: '#1a237e' }}>Invoice Details</Typography>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#4a148c', color: 'white' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Code</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Description</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Net Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {selectedRow?.tests?.length > 0 ? (
                        selectedRow.tests.map((test, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '8px' }}>{test.code}</td>
                                <td style={{ padding: '8px' }}>{test.description}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>
                                    {/* For grouped items with 0.00, show a dash to keep it clean */}
                                    {parseFloat(test.amount) > 0 ? parseFloat(test.amount).toFixed(2) : '-'}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>
                                    {parseFloat(test.amount) > 0 ? parseFloat(test.amount).toFixed(2) : '-'}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>No test details available</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Financial Summary Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '20px', gap: '5px' }}>
                <Typography variant="body2">Total Amount: <strong>₹{parseFloat(selectedRow?.totalAmount || 0).toFixed(2)}</strong></Typography>
                <Typography variant="body2">Discount Amount: <strong>₹0.00</strong></Typography>
                <Typography variant="body2" sx={{ fontSize: '1.1rem', color: '#1a237e' }}>
                    Net Amount: <strong>₹{parseFloat(selectedRow?.totalAmount || 0).toFixed(2)}</strong>
                </Typography>
                <Typography variant="body2">Payment Type: <strong>{selectedRow?.paymentType || 'N/A'}</strong></Typography>
                <Typography variant="body2" sx={{ color: 'green', fontWeight: 'bold' }}>
                    Paid Amount: ₹{parseFloat(selectedRow?.paidAmount || 0).toFixed(2)}
                </Typography>
                
                {/* Balance Logic */}
                {parseFloat(selectedRow?.balance) > 0 && (
                    <Typography variant="body2" sx={{ color: 'red', fontWeight: 'bold', borderTop: '1px solid #ddd', mt: 1, pt: 1 }}>
                        Balance Due: ₹{parseFloat(selectedRow?.balance).toFixed(2)}
                    </Typography>
                )}
            </div>
        </div>
    </Box>
</Modal>
            </main>
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

export default EditInvoice;{/* Footer */}
                       