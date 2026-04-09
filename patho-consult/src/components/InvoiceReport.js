import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import HomeIcon from '@mui/icons-material/Home';
import { FileBarChart } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { 
  FaSearch, FaHome, FaEdit, FaFileInvoice, 
  FaTags, FaPercent, FaFileAlt, FaFilter 
} from 'react-icons/fa';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Tooltip, IconButton } from '@mui/material';

function InvoiceReport() {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(null); 
    const [selectedRow, setSelectedRow] = useState({ patientName: '', patientId: '', totalAmount: '' });
    const [clientCodes, setClientCodes] = useState([]);
const [collectedAtList, setCollectedAtList] = useState([]);
const [doctorsList, setDoctorsList] = useState([]);
const [fromDate, setFromDate] = useState(""); 
const [toDate, setToDate] = useState("");
const [invoiceCategory, setInvoiceCategory] = useState("Individual"); 
const [selectType, setSelectType] = useState("All Invoice"); 
const [discountInput, setDiscountInput] = useState(""); 
const [notesInput, setNotesInput] = useState('');


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
                if (passedFilterID) {
                    const filtered = data.filter(inv => 
                        String(inv.patientId) === String(passedFilterID) || 
                        String(inv.PatientID) === String(passedFilterID)
                    );
                    setRows(filtered);
                } else {
                    setRows(data);
                }
            } else {
                setRows([]);
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
    setSelectedRow(row);
    setOpenModal(type);
    if (type === 'notes') {
        setNotesInput(row.notes || "");
    } else if (type === 'addDiscount') {
        setDiscountInput(row.discount_percent || "");
    }
};
const handleClose = () => {
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
                if (passedFilterID) {
                    const filtered = data.filter(inv => 
                        String(inv.patientId) === String(passedFilterID) || 
                        String(inv.PatientID) === String(passedFilterID)
                    );
                    setRows(filtered);
                } else {
                    setRows(data);
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
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (response.ok) {
            handleClose();
            handleSearch(); 
        } else {
            alert("Update failed");
        }
    } catch (err) {
        console.error("Error updating:", err);
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
        { field: 'balance', width: 100, renderHeader: () => renderFilterHeader('Balance') },
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
           
            <FaFileInvoice title="View Receipt" onClick={() => handleActionClick(params.row, 'receipt')} />
            
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

            <main style={{ padding: '57px' }}>
                {/* Search Panel */}
                <div style={{ backgroundColor: 'white', borderRadius: '8px', marginBottom: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '-40px' }}>

<Box 
    sx={{ 
        backgroundColor: '#fdfdfd', 
        padding: '10px 15px', 
        borderBottom: '1px solid #eee', // Restored subtle border for definition
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
    }}
>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <FileBarChart size={20} color="#4a148c" strokeWidth={2.2} />
        
        <Typography 
            sx={{ 
                fontWeight: 'bold', 
                color: '#4a148c',
                fontSize: '0.95rem' 
            }}
        >
            Invoice Report
        </Typography>
    </Box>

    {/* You could add a "Download PDF" icon here on the right */}
</Box>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '-18px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', border: '1px solid #ddd' }}>
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
<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '-8px' }}>
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

                



{/* View Detailed Invoice Report */}
<Modal open={openModal === 'receipt'} onClose={handleClose}>
    <Box sx={{ ...modalStyle, width: 750, p: 0, overflow: 'hidden' }}>
        
        {/* Brand Header Section */}
        <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            borderBottom: '1px solid #eee',
            backgroundColor: '#fff' 
        }}>
            <Typography variant="h4" style={{ 
                color: 'purple', 
                fontWeight: 'bold', 
                letterSpacing: '2px', 
                marginBottom: '5px' 
            }}>
                PATHO CONSULT
            </Typography>
            <Typography variant="subtitle2" style={{ color: '#666', fontStyle: 'italic' }}>
                Advanced Diagnostic & Research Centre
            </Typography>
        </div>

        {/* Invoice Title Bar */}
        <div style={{ 
            background: 'purple', 
            color: 'white', 
            padding: '12px 20px', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <Typography variant="h6" style={{ fontSize: '1.1rem' }}>Patient Invoice Report</Typography>
            <Typography variant="h6" style={{ fontSize: '1.1rem' }}>{selectedRow?.invoiceNo}</Typography>
        </div>

        <div style={{ padding: '25px' }}>
            {/* Patient Info Section */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '20px', 
                marginBottom: '25px', 
                borderBottom: '1px solid #f0f0f0', 
                paddingBottom: '15px' 
            }}>
                <div>
                    <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Patient Name:</strong> {selectedRow?.patientName || 'N/A'}</Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Patient ID:</strong> {selectedRow?.patientId}</Typography>
                    <Typography variant="body2"><strong>Referred By:</strong> {selectedRow?.referredBy}</Typography>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Date:</strong> {selectedRow?.date}</Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Billing Type:</strong> {selectedRow?.invoiceType?.toUpperCase()}</Typography>
                    <Typography variant="body2"><strong>Collection Center:</strong> {selectedRow?.collectedAt}</Typography>
                </div>
            </div>

            {/* Test Details Table */}
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5, color: 'purple', display: 'flex', alignItems: 'center' }}>
                <span style={{ borderLeft: '4px solid purple', paddingLeft: '10px' }}>Test Particulars</span>
            </Typography>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8f5fa', textAlign: 'left', borderBottom: '2px solid purple' }}>
                        <th style={{ padding: '12px 10px' }}>Test Code</th>
                        <th style={{ padding: '12px 10px' }}>Description</th>
                        <th style={{ padding: '12px 10px', textAlign: 'right' }}>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {selectedRow?.tests && selectedRow.tests.length > 0 ? (
                        selectedRow.tests.map((test, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '10px' }}>{test.code}</td>
                                <td style={{ padding: '10px' }}>{test.description}</td>
                                <td style={{ padding: '10px', textAlign: 'right' }}>₹{parseFloat(test.amount).toFixed(2)}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No test details available</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Summary Section */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <div style={{ width: '280px', background: '#fcfaff', padding: '15px', borderRadius: '8px', border: '1px solid #e1bee7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <Typography variant="body2">Total Bill Amount:</Typography>
                        <Typography variant="body2"><strong>₹{selectedRow?.totalAmount}</strong></Typography>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#2e7d32' }}>
                        <Typography variant="body2">Amount Paid:</Typography>
                        <Typography variant="body2"><strong>₹{selectedRow?.paidAmount || 0}</strong></Typography>
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        borderTop: '1px dashed #ab47bc', 
                        paddingTop: '10px', 
                        marginTop: '5px',
                        color: '#c62828' 
                    }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Balance Due:</Typography>
                        <Typography variant="subtitle2"><strong>₹{selectedRow?.balance}</strong></Typography>
                    </div>
                </div>
            </div>

            {/* Notes Section */}
            {selectedRow?.notes && (
                <div style={{ 
                    marginTop: '10px', 
                    padding: '12px', 
                    background: '#fffde7', 
                    borderRadius: '4px', 
                    borderLeft: '4px solid #fbc02d',
                    marginBottom: '20px'
                }}>
                    <Typography variant="caption" style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Administrative Notes:</Typography>
                    <Typography variant="body2" style={{ whiteSpace: 'pre-line', fontSize: '0.85rem' }}>{selectedRow.notes}</Typography>
                </div>
            )}

            {/* Footer Buttons - Hidden during print */}
            <style>
                {`@media print { .no-print { display: none !important; } }`}
            </style>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px' }}>
                <Button 
                    variant="contained" 
                    sx={{ backgroundColor: 'purple', '&:hover': { backgroundColor: '#310d5e' } }} 
                    onClick={() => window.print()}
                >
                    Print Receipt
                </Button>
                <Button variant="outlined" sx={{ color: 'purple', borderColor: 'purple' }} onClick={handleClose}>
                    Close
                </Button>
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

export default InvoiceReport;