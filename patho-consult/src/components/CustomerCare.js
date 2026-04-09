import React, { useState, useEffect, useCallback } from 'react'; 
import { useNavigate } from 'react-router-dom';
import "../styles/home.css";
import { Box,  Typography, IconButton } from '@mui/material';
import { Headset } from 'lucide-react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import PatientHistoryChart from './PatientHistoryChart';
import HomeIcon from '@mui/icons-material/Home';
import { Tooltip, Button } from '@mui/material';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { 
    AccessTime as TimeIcon, 
    Description as ReportIcon, 
    CheckCircle as DoneIcon, 
    Email as MailIcon, 
    History as HistoryIcon,
    Save as SaveIcon,
    FactCheck as ApprovedIcon,
    AssignmentTurnedIn as ConfirmedIcon,
    Print as PrintIcon,
    HourglassEmpty as PendingIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import {Search, Home, Mail, MapPin } from 'lucide-react';




function CustomerCare() {
    const navigate = useNavigate();
    const [dates, setDates] = useState({ from: '', to: '' });
    const [data, setData] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [historyData, setHistoryData] = useState(null); 
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedGraphTest, setSelectedGraphTest] = useState('');
    const [typedEmail, setTypedEmail] = useState("");
    const [withLogo, setWithLogo] = useState(false); 

    const fetchHistory = async (patientId) => {
    try {
        const response = await fetch(`http://localhost:5000/api/patient-history/${patientId}`);
        const result = await response.json();
        if (result.success) {
            setHistoryData(result.data);
            const firstGraphableTest = result.data.records.find(r => r.numericValue !== null);
            
            if (firstGraphableTest) {
                setSelectedGraphTest(firstGraphableTest.testName);
            } else if (result.data.records.length > 0) {
                setSelectedGraphTest(result.data.records[0].testName);
            }
            
            setShowHistoryModal(true);
        }
    } catch (error) {
        console.error("History fetch error:", error);
        alert("Failed to load patient history.");
    }
};

const handleDownloadPDF = async (sampleId) => {
    try {
        Toast.fire({ icon: 'info', title: 'Generating PDF...' });

        const response = await fetch(`http://localhost:5000/api/generate-report/${sampleId}?logo=${withLogo}`);
        
        if (!response.ok) throw new Error("PDF generation failed");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Report_${sampleId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        Toast.fire({ icon: 'success', title: 'Report downloaded successfully' });
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "Could not generate PDF.", "error");
    }
};
    const performSearch = useCallback(async (fromDate, toDate) => {
        if (!fromDate || !toDate) return;
        try {
            const response = await fetch(
                `http://localhost:5000/api/customer-view-full?fromDate=${fromDate}&toDate=${toDate}`
            );
            const result = await response.json();
            if (result.success) {
                const rowsWithId = result.data.map((row, index) => ({
                    ...row,
                    id: row.sample_id !== 'N/A' && row.sample_id ? `${row.sample_id}-${index}` : `reg-${row.PatientID}-${index}`
                }));
                setData(rowsWithId);
            }
        } catch (error) {
            console.error("Search error:", error);
        }
    }, []);
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});
    
    

    const logPatientActivity = async (sampleId, actionType) => {
    if (!sampleId || sampleId === 'N/A') return;
    try {
        await fetch('http://localhost:5000/api/log-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sampleId, actionType })
        });
        handleSearchClick();
    } catch (error) {
        console.error("Activity logging failed:", error);
    }
};

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const lastWeekDate = new Date();
        lastWeekDate.setDate(lastWeekDate.getDate() - 30);
        const lastWeek = lastWeekDate.toISOString().split('T')[0];

        setDates({ from: lastWeek, to: today });
        performSearch(lastWeek, today); 
    }, [performSearch]);
    const handleSearchClick = () => {
        performSearch(dates.from, dates.to);
    };
    
const handleSendMail = async () => {
    const emailInput = document.getElementById('emailInput').value;
    const subjectInput = document.getElementById('subjectInput').value;

    if (!emailInput || !emailInput.includes('@')) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Email',
            text: 'Please enter a valid recipient email address.',
            confirmButtonColor: '#4a148c'
        });
        return;
    }

    try {
        // Show a "Loading" state so the user knows the mail is being processed
        Swal.fire({
            title: 'Sending Email...',
            text: 'Please wait while we process the report.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch('http://localhost:5000/api/send-report-mail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: emailInput,             
                sampleId: selectedPatient.sample_id,
                patientName: selectedPatient.patient_name,
                subject: subjectInput,         
                reportData: selectedPatient 
            })
        });

        const result = await response.json();

        if (result.success) {
            await logPatientActivity(selectedPatient.sample_id, 'EMAIL');

            // Success Alert
            Swal.fire({
                icon: 'success',
                title: 'Mail Sent!',
                text: `Report successfully sent to ${emailInput}`,
                confirmButtonColor: '#4a148c',
            });

            setShowEmailModal(false);
            setSelectedPatient(null);
        } else {
            // Error from Server
            Swal.fire({
                icon: 'error',
                title: 'Send Failed',
                text: result.error || 'Something went wrong on the server.',
                confirmButtonColor: '#b71c1c'
            });
        }
    } catch (error) {
        console.error("Mail error:", error);
        // Network Error Alert
        Swal.fire({
            icon: 'error',
            title: 'Network Error',
            text: 'Could not reach the server. Please check your connection.',
            confirmButtonColor: '#b71c1c'
        });
    }
};

    const actionBtnStyle = {
        border: '1px solid #ccc',
        background: '#fff',
        cursor: 'pointer',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '14px'
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="home-wrapper" style={{ backgroundColor: '#4a148c', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
           <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', bgcolor: '#4a148c', color: 'white', position: 'relative' }}>
                <Typography variant="h6" fontWeight="bold">PATHO CONSULT</Typography>
                <IconButton 
                        onClick={() => navigate('/home')} 
                        sx={{ position: 'absolute', right: 36, top: 3, color: 'white' }}
                    >
                        <HomeIcon fontSize="large" />
                    </IconButton>
            </Box>

{/* --- CUSTOMER CARE HEADER --- */}
<Box sx={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    mt: 4, 
    mb: -3 // Adjusted spacing to look better above your content
}}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Purple Badge Wrapper */}
        <Box sx={{ 
            bgcolor: '#4a148c', 
            p: 1.2, 
            borderRadius: '50%', 
            display: 'flex',
            boxShadow: '0 4px 10px rgba(74, 20, 140, 0.3)' 
        }}>
            <Headset size={28} color="white" strokeWidth={2.5} />
        </Box>

        <Box>
            <Typography variant="h5" sx={{ color: '#4a148c', fontWeight: 900, letterSpacing: '0.5px', lineHeight: 1.1 }}>
                CUSTOMER CARE
            </Typography>
            <Typography variant="caption" sx={{ color: '#6a1b9a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
                Support Ticketing & Patient Assistance
            </Typography>
        </Box>
    </Box>
</Box>

            <main style={{ padding: '20px', flex: 1 }}>
                {/* Search Panel */}
<Box sx={{ 
    maxWidth: '800px', 
    margin: '0 auto', 
    bgcolor: 'white', 
    borderRadius: '15px', 
    display: 'flex', 
    gap: 3, 
    p: 2, 
    alignItems: 'flex-end', 
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    mt: 2
}}>
   {/* From Date Box */}
<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.5 }}>
        From Date
    </Typography>
    <DatePicker
        value={dates.from ? dayjs(dates.from) : null}
        onChange={(val) => setDates({ ...dates, from: val ? val.format('YYYY-MM-DD') : '' })}
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
                        '&.Mui-focused fieldset': { borderColor: '#4a148c', borderWidth: '2px' },
                    }
                }
            }
        }}
    />
</Box>

{/* To Date Box */}
<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666', mb: 0.5 }}>
        To Date
    </Typography>
    <DatePicker
        value={dates.to ? dayjs(dates.to) : null}
        onChange={(val) => setDates({ ...dates, to: val ? val.format('YYYY-MM-DD') : '' })}
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
                        '&.Mui-focused fieldset': { borderColor: '#4a148c', borderWidth: '2px' },
                    }
                }
            }
        }}
    />
</Box>

    {/* Search Button */}
    <button 
        style={{ 
            backgroundColor: '#8e44ad', 
            color: 'white', 
            border: 'none', 
            padding: '10px 30px', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            height: '38px' 
        }} 
        onClick={handleSearchClick}
    >
        Search
    </button>
</Box>

                
{(() => {
    const columns = [
    { field: 'patient_name', headerName: 'Patient Name', width: 180, renderCell: (p) => <b style={{color: '#2c3e50'}}>{p.value}</b> },
    { 
        field: 'lab_status', 
        headerName: 'Lab Status', 
        width: 120, 
        renderCell: (p) => {
            const isCompleted = p.value === 'Completed' || p.value === 'Approved';
            return (
                <span style={{ 
                    backgroundColor: isCompleted ? '#e8f5e9' : '#fff3e0', 
                    color: isCompleted ? '#2e7d32' : '#ef6c00',
                    padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                    {isCompleted ? <DoneIcon sx={{ fontSize: 14 }} /> : <PendingIcon sx={{ fontSize: 14 }} />}
                    {p.value}
                </span>
            );
        }
    },
    { field: 'status', headerName: 'Status', width: 110 },
    { field: 'PatientID', headerName: 'Patient ID', width: 120 },
    { field: 'external_id', headerName: 'External ID', width: 120 },
    { field: 'referred_by', headerName: 'Referred By', width: 150 },
    { field: 'collected_at', headerName: 'Collected At', width: 160 },
    { field: 'client_code', headerName: 'Client Code', width: 110 },
    { field: 'total_test_billed', headerName: 'Billed', width: 90, align: 'center' },
    { field: 'test_saved', headerName: 'Saved', width: 90, align: 'center' },
    { field: 'confirmed_test', headerName: 'Confirmed', width: 100, align: 'center' },
    { field: 'approved_test', headerName: 'Approved', width: 100, align: 'center' },
    { field: 'test_pending_approval', headerName: 'Pending Appr.', width: 120, align: 'center' },
    { field: 'sample_id', headerName: 'Sample ID', width: 130 },
    { field: 'invoice_no', headerName: 'Invoice No', width: 120 },
    { 
        field: 'invoice_date', 
        headerName: 'Invoice Date', 
        width: 150,
        renderCell: (p) => (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                <TimeIcon sx={{ fontSize: 16, color: '#7f8c8d' }} /> {p.value}
            </span>
        )
    },

    { 
        field: 'last_print_date', 
        headerName: 'Last Print', 
        width: 160,
        renderCell: (p) => p.value ? (
            <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Tooltip title="Printed"><ReportIcon sx={{ fontSize: 16, color: '#666' }} /></Tooltip>
                {new Date(p.value).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
        ) : <span style={{color: '#ccc', fontStyle: 'italic'}}>Never</span>
    },
    { field: 'total_print_count', headerName: 'Prints', width: 80, align: 'center' },
    { 
        field: 'email_sent_date', 
        headerName: 'Email Date', 
        width: 160,
        renderCell: (p) => p.value ? (
            <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Tooltip title="Emailed"><MailIcon sx={{ fontSize: 16, color: '#666' }} /></Tooltip>
                {new Date(p.value).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
        ) : <span style={{color: '#ccc', fontStyle: 'italic'}}>Not Sent</span>
    },
    { field: 'total_emails_sent', headerName: 'Emails', width: 80, align: 'center' },
    { 
        field: 'test_completed', 
        headerName: 'Completed', 
        width: 120, 
        renderCell: (p) => {
            const isDone = p.value === 'Yes';
            return (
                <span style={{ 
                    backgroundColor: isDone ? '#e8f5e9' : '#fff3e0', 
                    color: isDone ? '#2e7d32' : '#ef6c00',
                    padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                    {isDone ? <DoneIcon sx={{ fontSize: 14 }} /> : <PendingIcon sx={{ fontSize: 14 }} />}
                    {isDone ? 'DONE' : 'PENDING'}
                </span>
            );
        }
    },
    { 
        field: 'actions', 
        headerName: 'Action', 
        width: 220, 
        sortable: false,
        renderCell: (params) => {
            const handleAction = (callback, isHistory = false) => {
                if (!isHistory && (!params.row.sample_id || params.row.sample_id === 'PENDING' || params.row.sample_id === 'N/A')) {
                    alert("Action Blocked: Please generate an invoice for this patient first.");
                } else {
                    callback();
                }
            };

            return (
                <div style={{ display: 'flex', gap: '8px', height: '100%', alignItems: 'center' }}>
                    <Tooltip title="Provisional">
                        <Button 
                            sx={{ minWidth: '35px', height: '35px', bgcolor: '#f3e5f5', color: '#7b1fa2', p: 0 }}
                            onClick={() => handleAction(() => setSelectedPatient({ ...params.row, mode: 'provisional' }))}
                        >
                            <ReportIcon fontSize="small" />
                        </Button>
                    </Tooltip>
                    
                    <Tooltip title="Final">
                        <Button 
                            variant="contained" color="success"
                            sx={{ minWidth: '35px', height: '35px', p: 0 }}
                            onClick={() => handleAction(async () => {
                                try {
                                    const response = await fetch(`http://localhost:5000/api/test-results/${params.row.sample_id}`);
                                    const result = await response.json();
                                    if (result.success) {
                                        setSelectedPatient({ 
                                            ...params.row, 
                                            mode: 'final', 
                                            all_tests: result.data,
                                            culture_report: result.culture_report, 
                                            doctor_name: result.doctorInfo.doctor_name,
                                            PostgraduateDegree: result.doctorInfo.PostgraduateDegree,
                                            signatureBase64: result.doctorInfo.signatureBase64
                                        });
                                    } else {
                                        alert("Result values not found for this sample.");
                                    }
                                } catch (err) {
                                    alert("Error loading report data.");
                                }
                            })}
                        >
                            <DoneIcon fontSize="small" />
                        </Button>
                    </Tooltip>
                    
                    <Tooltip title="Send Mail">
                        <Button 
                            variant="contained" color="info"
                            sx={{ minWidth: '35px', height: '35px', p: 0 }}
                            onClick={() => handleAction(() => { setSelectedPatient(params.row); setShowEmailModal(true); })}
                        >
                            <MailIcon fontSize="small" />
                        </Button>
                    </Tooltip>
                    
                    <Tooltip title="History">
                        <Button 
                            variant="contained" color="warning"
                            sx={{ minWidth: '35px', height: '35px', p: 0 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAction(() => fetchHistory(params.row.PatientID), true);
                            }}
                        >
                            <HistoryIcon fontSize="small" />
                        </Button>
                    </Tooltip>
                </div>
            );
        }
    }
];

    return (
        <Box sx={{ 
            height: 600, width: '100%', mt: 4, 
            backgroundColor: '#ffffff', borderRadius: '12px', p: 1, 
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            '& .MuiDataGrid-root': { border: 'none' },
            '& .MuiDataGrid-columnHeaders': { 
                backgroundColor: '#f8f9fa', 
                color: '#4a148c', 
                fontSize: '14px',
                fontWeight: 'bold',
                borderBottom: '2px solid #e1bee7'
            },
            '& .MuiDataGrid-row:nth-of-type(odd)': { backgroundColor: '#fafafa' },
            '& .MuiDataGrid-row:nth-of-type(even)': { backgroundColor: '#ffffff' },
            '& .MuiDataGrid-row:hover': { backgroundColor: '#f3e5f5 !important', transition: '0.3s' },
            '& .MuiDataGrid-cell': { borderBottom: '1px solid #f0f0f0', color: '#444' },
            '& .MuiDataGrid-footerContainer': { borderTop: '2px solid #e1bee7' }
        }}>
            <DataGrid
                rows={data}
                columns={columns}
                slots={{ toolbar: GridToolbar }}
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                disableRowSelectionOnClick
            />
        </Box>
    );
})()}

                {/* --- REPORT PREVIEW MODAL --- */}
{selectedPatient && !showEmailModal && (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div style={{ backgroundColor: '#4d1a8b', width: '90%', maxWidth: '1000px', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '95vh' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', alignItems: 'center', color: 'white' }}>
                <span style={{ fontWeight: 'bold' }}>
                    {selectedPatient.mode === 'provisional' ? 'Provisional Patient View' : 'Patient Details'}
                </span>
                <button style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }} onClick={() => setSelectedPatient(null)}>✖</button>
            </div>

            {/* FIRST BOX: Patient Metadata (Visible for both Provisional and Final) */}
            <div style={{ backgroundColor: 'white', margin: '0 20px 15px 20px', padding: '25px', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px', fontSize: '15px' }}>
                    <div>
                        <p style={{ margin: '8px 0' }}><strong>Patient Name:</strong> {selectedPatient.patient_name}</p>
                        <p style={{ margin: '8px 0' }}><strong>Patient ID:</strong> {selectedPatient.PatientID}</p>
                        <p style={{ margin: '8px 0' }}><strong>Sample ID:</strong> {selectedPatient.sample_id}</p>
                        <p style={{ margin: '8px 0' }}><strong>Collected At:</strong> {selectedPatient.collected_at}</p>
                    </div>
                    <div>
                        <p style={{ margin: '8px 0' }}><strong>Create Date:</strong> {selectedPatient.invoice_date || 'N/A'}</p>
                        <p style={{ margin: '8px 0' }}><strong>Age / Sex:</strong> {selectedPatient.age || 'N/A'} / {selectedPatient.gender || 'N/A'}</p>
                        <p style={{ margin: '8px 0' }}><strong>Referred By:</strong> {selectedPatient.referred_by}</p>
                        <p style={{ margin: '8px 0' }}><strong>External ID:</strong> {selectedPatient.external_id || '-'}</p>
                    </div>
                </div>
                
                {/* Action Buttons in First Box */}
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
<button 
    style={{ backgroundColor: '#4a148c', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
    onClick={() => {
        // Use the current state of 'withLogo'
        const url = `http://localhost:5000/api/generate-report/${selectedPatient.sample_id}?logo=${withLogo}`;
        window.open(url, '_blank');
        logPatientActivity(selectedPatient.sample_id, 'PRINT');
    }}
>
    Generate Report
</button>
                    <button 
                        style={{ padding: '10px 20px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#f9f9f9' }}
                        onClick={() => setShowEmailModal(true)}
                    >
                        Send Mail
                    </button>
                   <label style={{ fontSize: '14px', marginLeft: '10px', cursor: 'pointer' }}>
    <input 
        type="checkbox" 
        checked={withLogo} 
        onChange={(e) => setWithLogo(e.target.checked)} 
        style={{ marginRight: '5px' }} 
    /> With Logo
</label>
                </div>
            </div>

          {/* SECOND BOX: Clinical Report Body (Visible ONLY for Final Report) */}
{selectedPatient.mode === 'final' && (
    <div style={{ 
        backgroundColor: 'white', 
        margin: '0 20px 20px 20px', 
        padding: '40px', 
        borderRadius: '8px', 
        flex: 1, 
        overflowY: 'auto', 
        fontFamily: '"Segoe UI", Tahoma, sans-serif',
        position: 'relative' 
    }}>
       {/* Download PDF Action Button */}
<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
    <Button
        variant="contained"
        startIcon={<PrintIcon />}
        onClick={() => handleDownloadPDF(selectedPatient.sample_id)}
        style={{ 
            backgroundColor: '#4a148c', 
            color: 'white', 
            textTransform: 'none',
            fontWeight: 'bold',
            borderRadius: '20px'
        }}
    >
        Download Official PDF
    </Button>
</div>

        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
            <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Microbiology & Clinical Pathology Report
            </h3>
        </div>
        

        {/* Results Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
                <tr style={{ borderBottom: '2px solid #2c3e50', textAlign: 'left', backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', color: '#2c3e50' }}>Test Name</th>
                    <th style={{ padding: '12px', color: '#2c3e50' }}>Result</th>
                    <th style={{ padding: '12px', color: '#2c3e50' }}>Normal Range</th>
                    <th style={{ padding: '12px', color: '#2c3e50' }}>Comments</th>
                </tr>
            </thead>
           <tbody>
    {/* Map through the array of tests returned by the backend */}
    {selectedPatient.all_tests && selectedPatient.all_tests.length > 0 ? (
        selectedPatient.all_tests.map((test, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', fontWeight: '500' }}>
                    {test.test_names}
                </td>
                
                <td style={{ 
                    padding: '12px', 
                    fontWeight: 'bold',
                    color: (test.is_critical === 1 || test.labcomments?.toLowerCase().includes('high')) ? '#d32f2f' : '#27ae60'
                }}>
                    {test.result}
                </td>

                <td style={{ padding: '12px', color: '#666' }}>
                    {test.normal_range} <small>{test.unit}</small>
                </td>

                <td style={{ padding: '12px', fontStyle: 'italic', fontSize: '13px' }}>
                    {test.labcomments || '-'}
                </td>
            </tr>
        ))
    ) : (
        <tr>
            <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                No clinical results available for this sample.
            </td>
        </tr>
    )}
</tbody>
        </table>

        {/* Culture Summary (Specific for Microbiology) */}
        {!selectedPatient.culture_report?.toLowerCase().includes('no significant') && (
             <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #ffebee', backgroundColor: '#fff5f5' }}>
                <strong style={{ color: '#c62828' }}>Clinical Note:</strong>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#c62828' }}>
                    {selectedPatient.culture_report}
                </p>
             </div>
        )}

        

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '12px' }}>--- End of Report ---</p>
        </div>

        {/* Signature Block */}
<div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
    {(selectedPatient.signatureBase64 || selectedPatient.SignaturePath) && (
        <img 
            src={selectedPatient.signatureBase64 || `http://localhost:5000/${selectedPatient.SignaturePath.replace(/\\/g, '/')}`} 
            alt="Doctor Signature"
            style={{ maxHeight: '80px', marginBottom: '5px', objectFit: 'contain' }} 
            onError={(e) => {
                console.error("Signature image failed to load");
                e.target.style.display = 'none';
            }} 
        />
    )}
    <div style={{ borderTop: '2px solid purple', width: '250px', paddingTop: '8px' }}>
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px', color: '#2c3e50' }}>
            {selectedPatient.doctor_name || (selectedPatient.FirstName ? `Dr. ${selectedPatient.FirstName} ${selectedPatient.LastName}` : 'Authorized Signatory')}
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: 'purple', fontWeight: '500' }}>
            {selectedPatient.PostgraduateDegree || 'Consultant Pathologist'}
        </p>
    </div>
</div>
    </div>
)}
        </div>
    </div>
)}

{/* --- PATHO MAIL MODAL --- */}
{showEmailModal && selectedPatient && (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to right, #471f61, #70598d)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', width: '450px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
            <h2 style={{ color: '#444', marginBottom: '25px', letterSpacing: '2px' }}>PATHO MAIL</h2>
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 'bold' }}>RECIPIENT EMAIL</label>
                <input 
    type="email" 
    id="emailInput" 
    defaultValue={selectedPatient.email || ''} 
    placeholder="Enter recipient email..."
    style={{ 
        width: '100%', 
        padding: '12px', 
        marginTop: '5px', 
        border: '1px solid #ddd', 
        borderRadius: '4px' 
    }} 
/>
            </div>
            <div style={{ textAlign: 'left', marginBottom: '25px' }}>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 'bold' }}>SUBJECT</label>
                <input type="text" id="subjectInput" defaultValue={`Laboratory Report - ${selectedPatient.patient_name}`} style={{ width: '100%', padding: '12px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <button 
                onClick={handleSendMail}
                style={{ backgroundColor: '#573b79', color: 'white', border: 'none', padding: '14px 0', width: '100%', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
            >
                SEND MAIL
            </button>
            <button onClick={() => setShowEmailModal(false)} style={{ marginTop: '15px', border: 'none', background: 'none', cursor: 'pointer', color: '#e74c3c', fontWeight: 'bold' }}>Cancel</button>
        </div>
    </div>
)} 
{showHistoryModal && historyData && (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 4000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ backgroundColor: 'white', width: '90%', maxWidth: '1000px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header - Aligned with Patho Consult Brand */}
            <div style={{ backgroundColor: '#4a148c', color: 'white', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '20px' }}>🕒</span>
                    <h3 style={{ margin: 0, letterSpacing: '1px' }}>Patient Clinical History</h3>
                </div>
                <button style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }} onClick={() => setShowHistoryModal(false)}>✖</button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                
                {/* Patient Summary Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', padding: '15px', backgroundColor: '#f3e5f5', borderRadius: '8px', borderLeft: '5px solid #4a148c' }}>
                    <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>PATIENT NAME</p>
                        <strong style={{ fontSize: '18px', color: '#4a148c' }}>{historyData.patientName}</strong>
                        <span style={{ marginLeft: '10px', color: '#888' }}>(ID: {historyData.patientId})</span>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ marginRight: '10px', fontSize: '14px', fontWeight: 'bold', color: '#4a148c' }}>Select Test Trend:</span>
                        <select 
                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e1bee7', outline: 'none' }}
                            value={selectedGraphTest}
                            onChange={(e) => setSelectedGraphTest(e.target.value)}
                        >
                            {[...new Set(historyData.records.map(r => r.testName))].map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Trend Chart Section */}
                <div style={{ width: '100%', height: '280px', border: '1px solid #f0f0f0', borderRadius: '10px', marginBottom: '25px', padding: '15px', background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <PatientHistoryChart 
                        
records={historyData.records.filter(r => 
    r.testName === selectedGraphTest && 
    r.numericValue !== null && 
    r.numericValue !== undefined && 
    r.numericValue !== "" 
)} 
                    />
                </div>

                {/* History Table - Zebra Striping Style */}
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e1bee7' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa', color: '#4a148c', borderBottom: '2px solid #e1bee7' }}>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Visit Date</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Parameter/Test Name</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Result Value</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Reference Units</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyData.records.map((rec, i) => {
                                const isNumeric = rec.numericValue !== null;
                                return (
                                    <tr key={i} style={{ 
                                        borderBottom: '1px solid #f0f0f0', 
                                        backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa',
                                        transition: '0.2s'
                                    }}>
                                        <td style={{ padding: '12px' }}>{rec.date}</td>
                                        <td style={{ padding: '12px', fontWeight: '600', color: '#2c3e50' }}>{rec.testName}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <span style={{
                                                fontWeight: 'bold',
                                                color: isNumeric ? '#4a148c' : '#ef6c00',
                                                backgroundColor: isNumeric ? '#f3e5f5' : '#fff3e0',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '13px'
                                            }}>
                                                {rec.value}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', color: '#7f8c8d' }}>{rec.units || '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '15px 25px', textAlign: 'right', borderTop: '1px solid #eee', backgroundColor: '#fcfcfc' }}>
                <button 
                    onClick={() => window.print()}
                    style={{ backgroundColor: '#4a148c', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(74, 20, 140, 0.2)' }}
                >
                    Print History
                </button>
            </div>
        </div>
    </div>
)}           </main>

           {/* Footer */}
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
        </LocalizationProvider>
    );
}

export default CustomerCare;