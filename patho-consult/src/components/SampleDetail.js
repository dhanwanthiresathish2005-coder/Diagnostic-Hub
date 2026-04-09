import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, Paper, Grid, CircularProgress, 
    TextField, FormControlLabel, Radio, RadioGroup, 
    Modal, IconButton 
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CloseIcon from '@mui/icons-material/Close';
import { DataGrid } from '@mui/x-data-grid';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import Swal from 'sweetalert2';



function SampleDetail() {
    const { sampleId } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    const [openHistory, setOpenHistory] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [selectedTest, setSelectedTest] = useState('');
    const navigate = useNavigate();
    // --- NEW: REPORT STATES ---
    const [openReport, setOpenReport] = useState(false);
    const [reportData, setReportData] = useState(null);
    const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return { color: '#2e7d32', fontWeight: 'bold' }; // Green
    if (s === 'pending') return { color: '#d32f2f', fontWeight: 'bold' };   // Red
    if (s === 'confirmed') return { color: '#ed6c02', fontWeight: 'bold' }; // Orange
    return { color: '#666' }; // Default Gray
};


const fetchDetails = async () => {
    try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/get-test-results/${sampleId}`);
        const result = await response.json();
        
        if (result && result.length > 0) {
            const firstRow = result[0];
            const uniqueTestsMap = new Map();

            result.forEach(test => {
                const componentsToRender = (test.components && test.components.length > 0) 
                    ? test.components 
                    : [{ 
                        name: test.TestDetails, 
                        range: test.NormalRange || "Refer to Master", 
                        unit: test.Units || "N/A", 
                        result: test.ResultValue || "" 
                      }];

                componentsToRender.forEach((comp, index) => {
                    const uniqueKey = `${test.id}-${test.TestID || index}`;
                    
                    if (!uniqueTestsMap.has(uniqueKey)) {
                        uniqueTestsMap.set(uniqueKey, {
                            id: uniqueKey,      
                            billId: test.id,    
                            testId: test.TestID,
                            name: comp.name,
                            range: comp.range,
                            units: comp.unit || test.Units,
                            status: test.Status,
                            value: comp.result || test.ResultValue || '',
                            comments: test.LabComments || ''
                        });
                    }
                });
            });

            setData({
                patient_name: firstRow.patient_name || 'N/A',
                patient_id: firstRow.PatientID || 'N/A',
                sample_id: sampleId,
                date: firstRow.CreateDate ? new Date(firstRow.CreateDate).toLocaleDateString('en-GB') : 'N/A',
                age_sex: `${firstRow.Age || 'N/A'} / ${firstRow.Gender || 'N/A'}`,
                referred_by: firstRow.referred_by || 'N/A',
                client_code: firstRow.client_code || 'N/A',
                collected_at: firstRow.collected_at || 'N/A',
                external_id: firstRow.external_id || '0',
                tests: Array.from(uniqueTestsMap.values())
            });
        }
    } catch (error) {
        console.error("Error fetching details:", error);
    } finally {
        setLoading(false);
    }
};

const handleAction = async (dbId, action, rowData = {}, uiKey = null, testId = null) => {
    // 1. Check for ID
    if (!dbId || dbId === 'undefined') {
        console.error("Action failed: No Database ID provided");
        return Swal.fire({
            icon: 'error',
            title: 'Missing ID',
            text: 'Database ID is missing. Please refresh the page.',
            confirmButtonColor: '#4a148c'
        });
    }

    // 2. Handle Delete with Confirmation
    if (action === 'delete') {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This test will be permanently removed from the sample.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d32f2f',
            cancelButtonColor: '#4a148c',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, keep it'
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`http://localhost:5000/api/deletetest/${dbId}/${testId || ''}`, { 
                method: 'DELETE' 
            });
            
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted',
                    text: 'The test has been removed.',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchDetails(); 
            }
        } catch (err) { 
            console.error("Delete failed:", err);
            Swal.fire('Error', 'Failed to delete the test.', 'error');
        }
        return;
    }

    // 3. Prepare Payload for Update/Confirm
    const payload = {
        id: dbId,         
        testId: testId,   
        value: rowData.value,
        comments: rowData.comments,
        status: action === 'confirm' ? 'Confirmed' : (action === 'save' ? 'Pending' : null)
    };

    try {
        const response = await fetch(`http://localhost:5000/api/update-test-result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            // Success Toast
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });

            Toast.fire({
                icon: 'success',
                title: action === 'confirm' ? 'Result Confirmed!' : 'Progress Saved'
            });

            if (uiKey) {
                setEditRows(prev => ({ ...prev, [uiKey]: false }));
            }
            fetchDetails(); 
        } else {
            throw new Error("Update failed");
        }
    } catch (err) {
        console.error("Update failed:", err);
        Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: 'Could not save the results to the server.',
            confirmButtonColor: '#4a148c'
        });
    }
};
const [editRows, setEditRows] = useState({}); 

const [specialComments, setSpecialComments] = useState("");

const handleSaveHeader = async () => {
    if (!data.sample_id) {
        return Swal.fire({
            icon: 'error',
            title: 'Missing Sample ID',
            text: 'Could not find a valid Sample ID to update.',
            confirmButtonColor: '#4a148c'
        });
    }

    // --- NEW: CHECK IF COMMENTS ARE EMPTY ---
    if (!specialComments || specialComments.trim() === "") {
        return Swal.fire({
            icon: 'warning',
            title: 'Empty Comments',
            text: 'Please enter a comment before saving.',
            confirmButtonColor: '#4a148c'
        });
    }

    try {
        const response = await fetch('http://localhost:5000/api/update-special-comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sampleId: data.sample_id,
                comments: specialComments
            })
        });

        const result = await response.json();

        if (result.success) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true,
            });

            Toast.fire({
                icon: 'success',
                title: 'Header comments saved'
            });
        } else {
            throw new Error("API returned success: false");
        }
    } catch (error) {
        console.error("Error saving header:", error);
        Swal.fire({
            icon: 'error',
            title: 'Save Failed',
            text: 'There was an error updating the special comments.',
            confirmButtonColor: '#4a148c'
        });
    }
};




const handleViewHistory = async (testName, patientId, currentValue) => {
    setSelectedTest(testName);
    try {
        const response = await fetch(`http://localhost:5000/api/test-history-v2?patientId=${patientId}&testName=${encodeURIComponent(testName)}`);
        const result = await response.json();
        
        if (result.success && result.history) {
            let formattedHistory = result.history.map(item => ({
                date: item.date,
                value: parseFloat(item.val) 
            })).filter(item => !isNaN(item.value)); 
            if (currentValue && !isNaN(parseFloat(currentValue))) {
                formattedHistory.push({
                    date: 'Current', 
                    value: parseFloat(currentValue)
                });
            }

            setHistoryData(formattedHistory);
            setOpenHistory(true);
        } else {
            if (currentValue) {
                setHistoryData([{ date: 'Current', value: parseFloat(currentValue) }]);
            } else {
                setHistoryData([]);
            }
            setOpenHistory(true);
        }
    } catch (error) {
        console.error("Error fetching history:", error);
    }
};
    useEffect(() => { fetchDetails(); }, [sampleId]);
if (loading || !data) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading Patient Data...</Typography>
        </Box>
    );
}

// --- NEW: FETCH REPORT LOGIC ---
    const handleViewReport = async () => {
        if (!data?.sample_id) return alert("Sample ID not found.");
        try {
            // This API should return the finalized results for the PDF/Modal view
            const response = await fetch(`http://localhost:5000/api/sample-details/${data.sample_id}`);
            const result = await response.json();

            if (result.success) {
                setReportData(result.data);
                setOpenReport(true);
            } else {
                alert("Results not found or not yet approved.");
            }
        } catch (err) {
            console.error("Report Error:", err);
            alert("Error loading clinical report.");
        }
    };

    if (loading || !data) return <CircularProgress />;

    return (
        <Box sx={{ bgcolor: '#f3e5f5', minHeight: '100vh', pb: 10 }}>
                    <Box 
                        component="header" 
                        sx={{ 
                            p: 1.5, // Back to original slim padding
                            bgcolor: '#4a148c', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            position: 'relative', 
                            width: '100%', // Back to full width
                            boxShadow: 3 
                        }}
                    >
                        {/* Centered Title */}
                        <Typography variant="h6" fontWeight="bold">
                            PATHO CONSULT
                        </Typography>
                    
                        {/* Home Icon - Now Positioned to the RIGHT and visible */}
                        <IconButton 
                        onClick={() => navigate('/home')} 
                        sx={{ position: 'absolute', right: 36, top: 3, color: 'white' }}
                    >
                        <HomeIcon fontSize="large" />
                    </IconButton>
                    </Box>

            <Box sx={{ p: 6 }}>
                {/* Patient Details Section */}
                <Paper elevation={6} sx={{ maxWidth: 1150, mx: 'auto', mb: 2, borderRadius: '4px', overflow: 'hidden' }}>
                    <Box sx={{ bgcolor: '#4a148c', p: 1, borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                        <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            Patient Details
                        </Typography>
                    </Box>
                    
                    <Box sx={{ p: 1.5 }}>
                        <Grid container sx={{ border: '1px solid #ccc', gap:1 }}>
                            {[
                                { l: 'Patient Name:', v: data.patient_name }, { l: 'Created Date:', v: data.date },
                                { l: 'Patient ID:', v: data.patient_id }, { l: 'Age / Sex:', v: data.age_sex },
                                { l: 'Sample ID:', v: data.sample_id }, { l: 'Client Code:', v: data.client_code },
                                { l: 'Referred By:', v: data.referred_by }, { l: 'External ID:', v: data.external_id },
                                { l: 'Collected At:', v: data.collected_at }
                            ].map((item, i) => (
                                <Grid item xs={12} sm={6} key={i} sx={{ display: 'flex', border: '0.5px solid #eee', p: 0.5 }}>
                                    <Typography sx={{ width: '130px', ml: 9, fontSize: '0.75rem', color: '#666' }}>{item.l}</Typography>
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', ml: -4 }}>{item.v}</Typography>
                                </Grid>
                            ))}
                            <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', p: 0.8, borderTop: '1px solid #ccc', bgcolor: '#fafafa' }}>
                                <Typography sx={{ width: '130px', ml: 6, fontSize: '0.75rem', fontWeight: 'bold' }}>Special Comments:</Typography>
                                <TextField 
    size="small" 
    fullWidth 
    variant="outlined" 
    value={specialComments}
    onChange={(e) => setSpecialComments(e.target.value)}
    sx={{ '& .MuiInputBase-input': { p: '4px 8px', fontSize: '0.75rem', bgcolor: 'white' } }} 
/>
<Button 
    variant="contained" 
    size="small" 
    onClick={handleSaveHeader}
    sx={{ ml: 1, bgcolor: '#303f9f', fontSize: '0.65rem', textTransform: 'none' }}
>
    Save Header
</Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>

                {/* Status Bar */}
                <Box sx={{ maxWidth: 950, mx: 'auto', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3,  mt: 3, gap: 2 }}>
                    <Typography sx={{ color: '#4a148c', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        Preview is available only after save of Samples!!
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#4a148c', px: 2, borderRadius: '4px' }}>
                        <Typography sx={{ fontSize: '0.7rem', color: 'white', fontWeight: 'bold' }}>Test Completed</Typography>
                        <RadioGroup row sx={{ ml: 1 }}>
                            <FormControlLabel value="yes" control={<Radio size="small" sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }} />} label={<Typography sx={{ fontSize: '0.7rem', color: 'white' }}>Yes</Typography>} />
                            <FormControlLabel value="no" control={<Radio size="small" sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }} />} label={<Typography sx={{ fontSize: '0.7rem', color: 'white' }}>No</Typography>} />
                        </RadioGroup>
                    </Box>
                    <Button 
                    variant="contained" 
                    startIcon={<AssessmentIcon />} 
                    sx={{ bgcolor: '#4a148c', textTransform: 'none' }}
                    onClick={handleViewReport}
                >
                    View Report
                </Button>
                </Box>

                {/* Main Entry Table */}
<Paper sx={{ height: 420, width: '100%', maxWidth: 1150, mx: 'auto', borderRadius: '4px', overflow: 'hidden' }}>
    <DataGrid
        rows={data.tests}
        columns={[
            { 
                field: 'name', 
                headerName: 'TestName', 
                flex: 1.5, 
                headerClassName: 'grid-header' 
            },
            { 
    field: 'value', 
    headerName: 'Input Value', 
    flex: 1, 
    renderCell: (params) => (
        <input 
            disabled={!editRows[params.id]} 
            defaultValue={params.value}
            id={`input-${params.id}`}
            style={{ 
                width: '90%', border: editRows[params.id] ? '2px solid #4a148c' : '1px solid #ccc', 
                textAlign: 'center', backgroundColor: editRows[params.id] ? '#fff' : '#f9f9f9' 
            }} 
        />
    )
},
            { 
                field: 'range', 
                headerName: 'Normal Range', 
                flex: 1, 
                align: 'center', 
                headerAlign: 'center' 
            },
            { 
                field: 'units', 
                headerName: 'Units', 
                flex: 0.8, 
                align: 'center', 
                headerAlign: 'center' 
            },
{ 
    field: 'comments', 
    headerName: 'Comments ', 
    flex: 2, 
    renderCell: (params) => (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
            <textarea 
                id={`comment-${params.id}`} 
                defaultValue={params.row.comments}
                placeholder="Add test-specific notes..."
                style={{ 
                    width: '100%', 
                    height: 'calc(100% - 10px)', 
                    minHeight: '60px', 
                    border: '1px solid #e1bee7',
                    borderRadius: '4px',
                    padding: '8px', 
                    fontSize: '0.8rem', 
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    backgroundColor: '#fcfaff',
                    lineHeight: '1.5', 
                    whiteSpace: 'pre-wrap', 
                    overflowWrap: 'break-word',
                    outline: 'none',
                    boxSizing: 'border-box'
                }} 
                onFocus={(e) => e.target.style.borderColor = '#7b1fa2'}
                onBlur={(e) => e.target.style.borderColor = '#e1bee7'}
            />
        </div>
    )
},
            { 
    field: 'history', 
    headerName: 'History', 
    flex: 1, 
    renderCell: (params) => (
        <Typography 
            onClick={() => {
                const currentVal = document.getElementById(`input-${params.id}`)?.value;
                handleViewHistory(params.row.name, data.patient_id, currentVal);
            }}
            sx={{ 
                color: '#03a9f4', 
                cursor: 'pointer', 
                fontSize: '0.7rem', 
                textDecoration: 'underline'
            }}
        >
            View History
        </Typography>
    )
},
            { 
    field: 'actions', 
    headerName: 'Actions', 
    flex: 3, 
    renderCell: (params) => {
        const isEditing = editRows[params.id];
        const uiKey = params.id; 
        const databaseId = params.row.billId; 
        const specificTestId = params.row.testId; 

        return (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                {!isEditing ? (
                    <Button 
                        variant="outlined" size="small" color="primary" sx={{ fontSize: '0.6rem' }}
                        onClick={() => setEditRows(prev => ({ ...prev, [uiKey]: true }))}
                    >Edit</Button>
                ) : (
                    <Button 
                        variant="contained" size="small" color="success" 
                        onClick={() => {
                            const val = document.getElementById(`input-${uiKey}`)?.value;
                            const comm = document.getElementById(`comment-${uiKey}`)?.value;
                            handleAction(databaseId, 'save', { value: val, comments: comm }, uiKey, specificTestId);
                        }}
                    >Save</Button>
                )}

                <Button 
                    variant="contained" size="small" sx={{ bgcolor: '#303f9f' }}
                    onClick={() => {
                        const val = document.getElementById(`input-${uiKey}`)?.value;
                        const comm = document.getElementById(`comment-${uiKey}`)?.value;
                        handleAction(databaseId, 'confirm', { value: val, comments: comm }, uiKey, specificTestId);
                    }}
                >Confirm</Button>

                <Button 
                    variant="contained" size="small" color="error" sx={{ fontSize: '0.6rem' }}
                    onClick={() => handleAction(databaseId, 'delete', {}, uiKey, specificTestId)}
                >Cancel</Button>
                
                <Typography sx={{ 
                    color: params.row.status === 'Approved' ? 'green' : 'orange', 
                    fontSize: '0.65rem', fontWeight: 'bold', ml: 0.5 
                }}>
                    {params.row.status}
                </Typography>
            </Box>
        );
    }
}
        ]}
        initialState={{
            pagination: {
                paginationModel: { pageSize: 5 },
            },
        }}
        pageSizeOptions={[5]}
        rowHeight={50}
        disableRowSelectionOnClick
        sx={{
            // 1. Target the text specifically inside headers
    '& .MuiDataGrid-columnHeaderTitle': { 
        color: 'white', 
        fontWeight: 'bold' 
    },
    
            '& .grid-header': { bgcolor: 'white', fontWeight: 'bold' },
            '& .MuiDataGrid-columnHeader': { bgcolor: '#4a148c' },
            '& .MuiDataGrid-cell': { fontSize: '0.75rem', borderRight: '1px solid #eee' },
            '& ::-webkit-scrollbar': { width: '8px', height: '8px' },
            '& ::-webkit-scrollbar-thumb': { backgroundColor: '#bbb', borderRadius: '10px' },
            '& .MuiDataGrid-main': { overflow: 'auto' }
        }}
    />
</Paper>
            </Box>

            <Modal open={openHistory} onClose={() => setOpenHistory(false)}>
                <Box sx={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '90%', maxWidth: 650, bgcolor: 'white', boxShadow: 24, p: 3, borderRadius: 2
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: '#4a148c', fontWeight: 'bold' }}>
                            Trend Analysis: {selectedTest}
                        </Typography>
                        <IconButton onClick={() => setOpenHistory(false)}><CloseIcon /></IconButton>
                    </Box>

                    <Box sx={{ width: '100%', height: 350, mt: 2 }}>
    {/* 1. Only render when Modal is open and Data exists */}
    {openHistory && historyData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 25, right: 30, left: 10, bottom: 10 }}>
    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
    
    <XAxis 
        dataKey="date" 
        tick={{ fontSize: 12, fill: '#666' }} 
        axisLine={{ stroke: '#ccc' }}
        tickLine={false}
        dy={10}
    />
    
    <YAxis 
    tick={{ fontSize: 12, fill: '#666' }} 
    axisLine={{ stroke: '#ccc' }}
    tickLine={false}
    dx={-5}
    domain={['dataMin - 1', 'dataMax + 1']} 
    allowDecimals={true}
/>
    
    <Tooltip 
        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0px 2px 8px rgba(0,0,0,0.15)' }}
    />
    
   <Line 
    type="monotone"           
    dataKey="value" 
    stroke="#4a148c"           
    strokeWidth={3} 
    dot={{ 
        r: 6, 
        fill: '#fff',          
        stroke: '#4a148c',     
        strokeWidth: 2 
    }} 
    activeDot={{ r: 8, fill: '#4a148c' }} 
    isAnimationActive={true}
    animationDuration={1200}
/>
</LineChart>
        </ResponsiveContainer>
    ) : (
        /* 2. Show this if no data is found */
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" color="textSecondary">
                No previous history found for this test.
            </Typography>
        </Box>
    )}
</Box>
                    <Typography variant="caption" sx={{ display: 'block', mt: 2, textAlign: 'center', color: '#666' }}>
                        Showing last recorded values for Patient ID: {data.patient_id}
                    </Typography>
                </Box>
            </Modal>

            {/* Footer Address Bar */}
            <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, bgcolor: '#4a148c', color: 'white', py: 1, borderTop: '2px solid #4a148c' }}>
                <Typography sx={{ fontSize: '0.7rem', textAlign: 'center' }}>
                    63, Appu Street, Mylapore, Chennai-600 004. Phone: 044-24934435 | For Home Collection Contact: 044-24934435
                </Typography>
            </Box>
{/* --- CLINICAL REPORT MODAL --- */}
<Modal open={openReport} onClose={() => setOpenReport(false)}>
    <Box sx={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '95%', maxWidth: 800, bgcolor: 'white', boxShadow: 24, borderRadius: 2, 
        maxHeight: '90vh', overflowY: 'auto', border: '1px solid #ddd'
    }}>
        {/* Header with Lab Branding */}
        <Box sx={{ p: 3, textAlign: 'center', borderBottom: '3px solid #4a148c', bgcolor: '#fcfaff' }}>
            <Typography variant="h4" sx={{ color: '#4a148c', fontWeight: 'bold', letterSpacing: 1 }}>
                PATHO CONSULT
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#666', textTransform: 'uppercase' }}>
                Advanced Diagnostic & Research Centre
            </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
            {/* Patient Summary Header - Balanced Alignment */}
            <Grid container spacing={3} sx={{ mb: 4, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, border: '1px solid #eee' }}>
                <Grid item xs={6}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong style={{ display: 'inline-block', width: '100px' }}>Patient:</strong> 
                        {reportData?.patient_name || 'Meenakshi'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong style={{ display: 'inline-block', width: '100px' }}>Age / Sex:</strong> 
                        {reportData?.age || '35'} / {reportData?.gender || 'Female'}
                    </Typography>
                    <Typography variant="body2">
                        <strong style={{ display: 'inline-block', width: '100px' }}>Ref By:</strong> 
                        {reportData?.referredBy || 'Dr. Deepa'}
                    </Typography>
                </Grid>
                <Grid item xs={6} sx={{ borderLeft: '1px solid #ddd', pl: 3 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong style={{ display: 'inline-block', width: '100px' }}>Date:</strong> 
                        {reportData?.registration_date || '05-03-2026 12:27'}
                    </Typography>
                    <Typography variant="body2">
                        <strong style={{ display: 'inline-block', width: '100px' }}>Sample ID:</strong> 
                        <span style={{ color: '#4a148c', fontWeight: 'bold' }}>{reportData?.sample_id || 'SMP-2816'}</span>
                    </Typography>
                </Grid>
            </Grid>

            {/* Professional Results Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
    <thead>
        <tr style={{ backgroundColor: '#4a148c', color: 'white' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderRadius: '4px 0 0 0' }}>Test Name</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Result</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Units</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Reference Range</th>
            <th style={{ padding: '12px', textAlign: 'center', borderRadius: '0 4px 0 0' }}>Status</th>
        </tr>
    </thead>
    <tbody>
        {data?.tests?.map((test, index) => (
            <React.Fragment key={test.id || index}>
                {/* Main Test Row */}
                <tr style={{ 
                    // Remove bottom border if a comment is coming next to keep them grouped
                    borderBottom: test.comments ? 'none' : '1px solid #eee' 
                }}>
                    <td style={{ padding: '14px 10px', fontWeight: 500 }}>{test.name}</td>
                    <td style={{ 
                        padding: '14px 10px', 
                        textAlign: 'center', 
                        fontWeight: 'bold',
                        color: test.is_abnormal ? '#d32f2f' : 'inherit' 
                    }}>
                        {test.value || '---'}
                    </td>
                    <td style={{ padding: '14px 10px', textAlign: 'center', color: '#555' }}>{test.units}</td>
                    <td style={{ padding: '14px 10px', color: '#666', fontSize: '0.85rem' }}>{test.range}</td>
                    <td style={{ 
                        padding: '14px 10px', 
                        textAlign: 'center', 
                        fontSize: '0.75rem', 
                        textTransform: 'uppercase',
                        ...getStatusStyle(test.status) 
                    }}>
                        {test.status || 'Pending'}
                    </td>
                </tr>

                {/* Lab Comments Row */}
                {test.comments && (
    <tr style={{ borderBottom: '1px solid #eee' }}>
        <td colSpan={5} style={{ 
            padding: '12px 15px 15px 25px', // Increased left padding for the border
            backgroundColor: '#ffffff' 
        }}>
            <div style={{ 
                borderLeft: '3px solid #4a148c', // Formal accent line
                paddingLeft: '12px',
                marginTop: '6px'
            }}>
                <Typography 
                    variant="caption" 
                    sx={{ 
                        display: 'block', 
                        color: '#4a148c', 
                        fontWeight: '700', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontSize: '0.7rem',
                        mb: 0.5
                    }}
                >
                    Lab Comments
                </Typography>
                <Typography 
                    variant="body2" 
                    sx={{ 
                        fontFamily: '"Times New Roman", Times, serif', // Formal serif font
                        color: '#000', 
                        fontWeight: '600', // Bolded as requested
                        lineHeight: 1.4,
                        fontSize: '0.9rem'
                    }}
                >
                    {test.comments}
                </Typography>
            </div>
        </td>
    </tr>
)}
            </React.Fragment>
        ))}
    </tbody>
</table>
            {/* Footer / Special Comments */}
            {specialComments && (
                <Box sx={{ mt: 3, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#4a148c' }}>Notes/Comments:</Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{specialComments}</Typography>
                </Box>
            )}
        </Box>

        {/* Report Actions */}
        <Box sx={{ p: 2, bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'center', gap: 2, borderTop: '1px solid #eee' }}>
            <Button 
                variant="contained" 
                sx={{ bgcolor: '#4a148c', '&:hover': { bgcolor: '#380e6d' }, px: 4 }} 
                onClick={() => window.print()}
            >
                Print / Save PDF
            </Button>
            <Button variant="outlined" color="inherit" onClick={() => setOpenReport(false)}>
                Close
            </Button>
        </Box>
        
    </Box>
</Modal>

<Button 
                    variant="contained" 
                    size="small" 
                    sx={{ backgroundColor: '#4b2394', color: 'white' ,position: 'absolute', right: 898, display: 'flex', alignItems: 'center', gap: 5}}
                    onClick={() =>  navigate(-1)} 
                  >
                    Back
                  </Button>
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
}

export default SampleDetail;