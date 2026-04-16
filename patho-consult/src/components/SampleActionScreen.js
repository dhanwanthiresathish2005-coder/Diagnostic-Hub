import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Button, Box, Typography, Divider, TextField ,IconButton
} from '@mui/material';
import Swal from 'sweetalert2';
import { styled } from '@mui/material/styles';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import HomeIcon from '@mui/icons-material/Home';
import { useNotifications } from './NotificationContext';


const StyledHeader = styled(Box)({
  backgroundColor: '#4b2394',
  padding: '12px 24px',
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  position: 'relative',
  boxShadow: '0px 2px 8px rgba(0,0,0,0.2)',
});

const PatientCard = styled(Paper)({
  margin: '20px auto',
  maxWidth: '950px',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid #e0e0e0',
});

const SampleActionScreen = () => {
  const { sampleId } = useParams();
  const navigate = useNavigate();
  
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTests, setShowTests] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/sample-details/${sampleId}`);
        if (response.data.success) {
          setPatientData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (sampleId) fetchPatientDetails();
  }, [sampleId]);


const processedSamples = React.useRef(new Set());


useEffect(() => {
  if (showTests && patientData?.tests && !processedSamples.current.has(sampleId)) {
    
    patientData.tests.forEach((test) => {
      const comment = (test.LabComments || "").toLowerCase().trim();
      const status = (test.status || "").toLowerCase().trim();
      const val = test.ResultValue || "N/A";
      const testName = test.test_name;
      
      // Target path: where the doctor should go when clicking the alert
      const targetPath = `/sample-action-screen/${sampleId}`;

      if (comment.includes('very') || status.includes('very')) {
        addNotification(
          `CRITICAL: ${patientData.patient_name} - ${testName} is ${val} (${test.LabComments})`, 
          'critical',
          targetPath // Added target
        );
      } 
      else if (['high', 'low'].includes(comment) || ['high', 'low'].includes(status)) {
        addNotification(
          `URGENT: ${testName} for ${patientData.patient_name} is ${val}`, 
          'pending',
          targetPath // Added target
        );
      }
    });
    processedSamples.current.add(sampleId);
  }
  if (!showTests) {
    processedSamples.current.delete(sampleId);
  }
}, [showTests, patientData, addNotification, sampleId]);


  if (loading) return <Typography sx={{textAlign: 'center', mt: 10}}>Loading Patient Details...</Typography>;
  if (!patientData) return <Typography sx={{textAlign: 'center', mt: 10}}>No data found for {sampleId}</Typography>;
  const handleAcceptAll = () => {
  const incompleteTests = patientData.tests.filter(t => !t.ResultValue || t.ResultValue === "");
  
  if (incompleteTests.length > 0) {
    addNotification(
      `Action Blocked: ${incompleteTests.length} tests are missing results. Please fill all values before accepting.`, 
      'pending'
    );
  } else {
    addNotification(`Success: All results for Sample ${sampleId} verified and accepted.`, 'success');
    navigate(`/sample-detail/${sampleId}`);
  }
};



const userRole = localStorage.getItem('userRole'); 

const handleRejectAll = async () => {
  if (userRole !== 'Lab') {
    Swal.fire('Access Denied', 'Only Lab personnel can initiate a rejection.', 'error');
    return;
  }

  try {
    const response = await axios.post('http://localhost:5000/api/reject-sample', { 
      sampleId, 
      userRole: localStorage.getItem('userRole') 
    });

    if (response.data.success) {
      Swal.fire({
        title: 'Sample Rejected',
        text: `Sample ${sampleId} status set to Rejected. A request has been sent to the Pathologist for review.`,
        icon: 'success',
        confirmButtonColor: '#4b2394'
      }).then(() => {
        window.location.reload(); 
      });
    }
  } catch (error) {
    console.error("Rejection Error:", error.response?.data || error.message);
    Swal.fire('Error', error.response?.data?.message || 'Failed to process rejection.', 'error');
  }
};


const handlePermanentDelete = async () => {
  if (userRole !== 'Pathologist') return;

  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "This will permanently remove the test record!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Yes, delete permanently'
  });

  if (result.isConfirmed) {
    try {
      const response = await axios.delete(`http://localhost:5000/api/pathologist/permanent-delete/${sampleId}`, {
    params: { userRole: localStorage.getItem('userRole') } 
});
      if (response.data.success) {
        Swal.fire('Deleted!', 'The record has been removed.', 'success');
      }
    } catch (error) {
      Swal.fire('Error', 'Unauthorized or server error.', 'error');
    }
  }
};


  return (
    <Box sx={{ backgroundColor: '#f3e5f5', minHeight: '100vh', pb: 5 }}>
      {/* App Bar */}
<StyledHeader>
  <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>PATHO CONSULT</Typography>
  <Box sx={{ position: 'absolute', right: 24, display: 'flex', alignItems: 'center', gap: 2 }}>
    {/* Home Icon Button */}
    <IconButton onClick={() => navigate('/home')} 
      sx={{ position: 'absolute', right: 36, top: -7, color: 'white' }}
    >
        <HomeIcon fontSize="large" />
    </IconButton>
    
  </Box>
</StyledHeader>

      <Box sx={{ p: 3 }}>
        {/* Patient Info Section */}
        <PatientCard elevation={3}>
          <Box sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle1" sx={{ color: '#1a237e', fontWeight: 'bold' }}>
              Patient Details 
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            p: 3, 
            gap: 2,
            fontSize: '14px' 
          }}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #eee', pb: 0.5 }}>
              <Typography sx={{ width: 140, fontWeight: 'bold' }}>Patient Name:</Typography> {patientData.patient_name}
            </Box>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #eee', pb: 0.5 }}>
              <Typography sx={{ width: 140, fontWeight: 'bold' }}>Created Date:</Typography> {patientData.registration_date}
            </Box>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #eee', pb: 0.5 }}>
              <Typography sx={{ width: 140, fontWeight: 'bold' }}>Patient ID:</Typography> {patientData.patient_id}
            </Box>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #eee', pb: 0.5 }}>
              <Typography sx={{ width: 140, fontWeight: 'bold' }}>Age / Sex:</Typography> {patientData.age} / {patientData.gender}
            </Box>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #eee', pb: 0.5 }}>
              <Typography sx={{ width: 140, fontWeight: 'bold' }}>Sample ID:</Typography> {patientData.sample_id}
            </Box>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #eee', pb: 0.5 }}>
              <Typography sx={{ width: 140, fontWeight: 'bold' }}>Client Code:</Typography> {patientData.client_code}
            </Box>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #eee', pb: 0.5 }}>
              <Typography sx={{ width: 140, fontWeight: 'bold' }}>Referred By:</Typography> {patientData.referredBy || 'Self'}
            </Box>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #eee', pb: 0.5 }}>
              <Typography sx={{ width: 140, fontWeight: 'bold' }}>External ID:</Typography> {patientData.external_id || '0'}
            </Box>
          </Box>
        </PatientCard>

        {/* Action Table Section */}
        <TableContainer component={Paper} sx={{ maxWidth: 1050, margin: '30px auto', borderRadius: '8px' }}>
          <Table stickyHeader aria-label="action table">
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#4b2394' }}>Mrd No</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#4b2394' }}>Sample Id</TableCell>
                <TableCell align="center" colSpan={3} sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#4b2394' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow hover>
                <TableCell align="center">{patientData.patient_id}</TableCell>
                <TableCell align="center">{patientData.sample_id}</TableCell>
                <TableCell align="center">
  {/* Link to handleAcceptAll */}
  <Button 
    variant="outlined" 
    size="small" 
    sx={{ borderColor: 'black', color: 'black' }} 
    onClick={handleAcceptAll} 
  >
    AcceptAll
  </Button>
</TableCell>

<TableCell align="center">
  {/* Lab Role: Can only reject and request re-collection */}
  {userRole === 'Lab' && (
    <Button 
      variant="outlined" 
      color="error" 
      onClick={handleRejectAll}
    >
      Reject All (Re-collect)
    </Button>
  )}

  {/* Pathologist Role: Can permanently delete rejected tests */}
  {userRole === 'Pathologist' && (
    <Button 
      variant="contained" 
      sx={{ bgcolor: '#b71c1c', '&:hover': { bgcolor: '#7f0000' } }}
      onClick={handlePermanentDelete}
    >
      Permanent Delete
    </Button>
  )}

  {/* Admin Role: Show the button but keep it blurred and non-functional */}
  {userRole === 'Admin' && (
  <Button 
    variant="contained"  
    disabled 
    sx={{ 
      filter: 'blur(0.9px)', 
      '&.Mui-disabled': {
        backgroundColor: '#424242', 
        color: '#ffffff',           
        opacity: 0.8                
      },
      cursor: 'not-allowed',
      pointerEvents: 'auto' 
    }}
  >
    Reject (Lab Only)
  </Button>
)}
</TableCell>
                <TableCell align="center">
                  <Button 
                    variant="contained" 
                    size="small" 
                    sx={{ backgroundColor: showTests ? '#4b2394' : '#757575', '&:hover': {backgroundColor: '#351969'} }}
                    onClick={() => setShowTests(!showTests)}
                  >
                    {showTests ? 'Hide List' : 'View List'}
                  </Button>
                </TableCell>
              </TableRow>

              
              {/* View List Extension Row */}
{showTests && (
  <TableRow>
    <TableCell colSpan={5} sx={{ p: 0 }}>
      <Box sx={{ p: 3, backgroundColor: '#f9f9f9', borderTop: '2px solid #4b2394' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#4b2394' }}>Test Name</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#4b2394' }}>Input Value</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#4b2394' }}>Normal Range</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#4b2394' }}>Units</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#4b2394' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
  {/* Map through the tests array from patientData */}
  {patientData.tests && patientData.tests.length > 0 ? (
    patientData.tests.map((test, index) => (
      <TableRow key={index} hover>
        {/* TName/EName: Pulls the display name of the test */}
        <TableCell sx={{ fontSize: '12px', fontWeight: '500' }}>
          {test.test_name || "Unknown Test"}
        </TableCell>
        
        {/* Input Value: The result entered in the LIS */}
        <TableCell align="center">
          <TextField 
  size="small" 
  disabled 
  value={test.ResultValue || "-"} 
  sx={{ 
    width: 80, 
    backgroundColor: '#fff',
    "& .MuiInputBase-input.Mui-disabled": {
      WebkitTextFillColor: test.LabComments?.toLowerCase().includes('very') ? "#d32f2f" : "#4b2394", 
      fontWeight: 'bold'
    }
  }} 
  inputProps={{ style: { textAlign: 'center', fontSize: '12px' }}} 
/>
        </TableCell>
        <TableCell align="center" sx={{ fontSize: '12px', color: '#666' }}>
          {test.normal_range}
        </TableCell>
        <TableCell align="center" sx={{ fontSize: '12px', color: '#666' }}>
          {test.Units || "N/A"}
        </TableCell>
        
        {/* Status: Logic-based color coding */}
        <TableCell align="center">
          <Typography sx={{ 
            color: test.status === 'Approved' ? '#2e7d32' : 
                   test.status === 'Reported' ? '#1976d2' : '#ed6c02', 
            fontWeight: 'bold', 
            fontSize: '11px',
            textTransform: 'uppercase',
            backgroundColor: test.status === 'Approved' ? '#e8f5e9' : '#fff3e0',
            px: 1,
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            {test.status || "Pending"}
          </Typography>
        </TableCell>
      </TableRow>
    ))
  ) : (
    <TableRow>
      <TableCell colSpan={5} align="center" sx={{ py: 2, color: '#999' }}>
        No test records found for this sample.
      </TableCell>
    </TableRow>
  )}
</TableBody>
        </Table>
      </Box>
    </TableCell>
  </TableRow>
)}
            </TableBody>
          </Table>
        </TableContainer>
          <Button 
                    variant="contained" 
                    size="small" 
                    sx={{ backgroundColor: '#4b2394', color: 'white' ,position: 'absolute', right: 898,  display: 'flex', alignItems: 'center', gap: 9}}
                    onClick={() =>  navigate('/lab-view')} 
                  >
                    Back
                  </Button>
      </Box>
       <Box sx={{ mt: 'auto', p: 1.5, bgcolor: '#4a148c', color: 'rgba(255,255,255,0.8)',  display: 'flex', justifyContent: 'center', gap: 4, position: 'fixed', bottom: 0, width: '100%'}}>
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

export default SampleActionScreen;