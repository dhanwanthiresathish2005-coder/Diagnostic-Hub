import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography, Button, IconButton, CircularProgress, Box } from '@mui/material';
import { FaHome, FaTimes, FaFilter } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Swal from 'sweetalert2';
import HomeIcon from '@mui/icons-material/Home';
import {Search, Home, Mail, MapPin } from 'lucide-react';

const PatientApprovalDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { patientId } = location.state || { patientId: '6' };

  const [results, setResults] = useState([]);
  const [showTrend, setShowTrend] = useState(false);
  const [selectedTest, setSelectedTest] = useState('');
  const [patientInfo, setPatientInfo] = useState({});
  const [isCompleted, setIsCompleted] = useState('Yes');
  const [specialComments, setSpecialComments] = useState('');
const [historyPoints, setHistoryPoints] = useState([]);
// Near your other useState hooks
const userRole = localStorage.getItem('userRole');

const handleViewHistory = async (testName) => {
    setSelectedTest(testName);
    try {
      const response = await fetch(`http://localhost:5000/api/test-history?patientId=${patientId}&testName=${encodeURIComponent(testName)}`);
      const data = await response.json();

      if (data.success && data.history.length > 0) {
        setHistoryPoints(data.history);
        setShowTrend(true);
      } else {
        // Styled Alert for No Records
        Swal.fire({
          icon: 'info',
          title: 'No History',
          text: `No previous records found for ${testName}.`,
          confirmButtonColor: '#4a148c'
        });
      }
    } catch (err) {
      Swal.fire('Error', 'Could not connect to the diagnostic server.', 'error');
    }
  };
  const trendData = [
    { date: '10/02', value: 1.2 },
    { date: '15/02', value: 1.8 },
    { date: '24/02', value: 2.5 },
  ];

useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/patient-results/${patientId}`);
        const data = await response.json();
        if (data.success) {
    setPatientInfo(data.patientInfo);
    const initializedResults = data.testResults.map(res => ({
        ...res,
        val: res.val || '',      
        comment: res.comment || '', 
        isApproved: true        
    }));
    setResults(initializedResults);
}
      } catch (err) {
        console.error("API Error:", err);
      }
    };
    loadData();
  }, [patientId]);

const [showEmailModal, setShowEmailModal] = useState(false);

const handleResultUpdate = (index, field, value) => {
    const updatedResults = [...results];
    updatedResults[index][field] = value;
    setResults(updatedResults);
};

// 2. Email Sending with Swal
  const handleSendMailAction = async () => {
    const email = document.getElementById('emailInput').value;
    if (!email) {
      Swal.fire('Error', 'Please enter a valid email address.', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/send-report-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email, 
          sampleId: patientInfo.sampleId,
          patientName: patientInfo.name,
          reportData: patientInfo 
        })
      });

      const result = await response.json();
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Email Sent!',
          text: `Report successfully sent to ${email}.`,
          timer: 2000,
          showConfirmButton: false
        });
        setShowEmailModal(false);
      } else {
        Swal.fire('Failed', "Could not send mail: " + result.error, 'error');
      }
    } catch (error) {
      Swal.fire('Connection Error', 'Failed to reach email server.', 'error');
    }
  };

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

  const handleDownloadPDF = async (sampleId) => {
      try {
          // Show loading feedback
          Toast.fire({ icon: 'info', title: 'Generating PDF...' });
  
          const response = await fetch(`http://localhost:5000/api/generate-report/${sampleId}`);
          
          if (!response.ok) throw new Error("PDF generation failed");
  
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `Report_${sampleId}.pdf`);
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
  
          Toast.fire({ icon: 'success', title: 'Report downloaded successfully' });
      } catch (error) {
          console.error(error);
          Swal.fire("Error", "Could not generate PDF.", "error");
      }
  };

const [selectedPatient, setSelectedPatient] = useState(null);

const handleReportAction = (mode) => {
    setSelectedPatient({
        ...patientInfo,
        PatientID: patientId, 
        mode: mode,
        patient_name: patientInfo.name,
        collected_at: patientInfo.collectedAt,
        invoice_date: patientInfo.createdDate,
        referred_by: patientInfo.doctor,
    });
};

const finalizeApproval = async () => {
    if (results.length === 0) {
        Swal.fire('Empty Results', 'No results found to approve.', 'warning');
        return;
    }

    setSelectedPatient(null);

    // 2. Confirmation Dialog
    const result = await Swal.fire({
        title: 'Confirm Final Approval?',
        text: "This will finalize all test results for this patient.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2e7d32', 
        cancelButtonColor: '#4a148c', 
        confirmButtonText: 'Yes, Approve!',
        target: 'body' 
    });

    if (!result.isConfirmed) {
        handleReportAction('final');
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/approve-test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                patientId: patientId, 
                sampleId: patientInfo.sampleId,
                specialComments: specialComments, 
                results: results.map(r => ({
                    testName: r.name,
                    value: r.val,        
                    comment: r.comment,  
                    status: 'Approved'   
                }))
            })
        });
        
        const data = await response.json();

        if (data.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Approved',
                text: 'The laboratory report is now ready.',
                confirmButtonColor: '#4a148c',
                timer: 2000
            });

            navigate(-1); 
        } else {
            Swal.fire('Error', data.message || 'Approval failed.', 'error');
        }

    } catch (err) { 
        Swal.fire('System Error', 'Error saving approval to database.', 'error');
    }
};

  return (
    <div style={styles.pageContainer}>
      <div style={styles.mainWrapper}>
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


        <main style={styles.mainContent}>
          <div style={styles.topRow}>
            <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back to Queue</button>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              PATIENT DETAILS 
             
            </div>
            <div style={styles.gridContainer}>
              <div style={styles.gridItem}><label>Patient Name: </label><b>{patientInfo.name}</b></div>
              <div style={styles.gridItem}><label>Patient ID: </label><b>{patientId}</b></div>
              <div style={styles.gridItem}><label>Sample ID: </label><b>{patientInfo.sampleId}</b></div>
              <div style={styles.gridItem}><label>Created Date: </label><b>{patientInfo.createdDate}</b></div>
              <div style={styles.gridItem}><label>Age / Sex: </label><b>{patientInfo.age} / {patientInfo.gender}</b></div>
              <div style={styles.gridItem}><label>Referred By: </label><b>{patientInfo.doctor}</b></div>
              <div style={styles.gridItem}><label>Client Code: </label><b>{patientInfo.clientCode || '-'}</b></div>
              <div style={styles.gridItem}><label>Collected At: </label><b>{patientInfo.collectedAt || '-'}</b></div>
            </div>
            
          </div>

          <div style={styles.tableCard}>
            <div style={styles.tableToolbar}>
              <span style={styles.tableTitle}>TEST PARAMETERS FOR VALIDATION</span>
              <div style={styles.toggleGroup}>
                <span>Test Completed:</span>
                <label><input type="radio" checked={isCompleted === 'Yes'} onChange={() => setIsCompleted('Yes')} /> Yes</label>
                <label><input type="radio" checked={isCompleted === 'No'} onChange={() => setIsCompleted('No')} /> No</label>
              </div>
            </div>
            
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.theadRow}>
                    <th style={styles.th}>Test Details</th>
                    <th style={styles.th}>Result</th>
                    <th style={styles.th}>Reference Range</th>
                    <th style={styles.th}>Unit</th>
                    <th style={styles.th}>Comment</th>
                    <th style={styles.th}>History</th>
                    <th style={styles.th}>Edit</th>
                    <th style={styles.th}>
                      <div style={styles.approveHeader}>
                        <input type="checkbox" style={{marginRight: '5px'}} />
                        <div style={styles.checkIconSmall}>✓</div>
                        <span>Approve</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
  {results.map((res, i) => (
    <tr key={i} style={styles.tr}>
      <td style={styles.tdName}>{res.name}</td>
      <td style={styles.td}>
        {res.val}
      </td>
      <td style={styles.td}>{res.range}</td>
      <td style={styles.td}>{res.unit}</td>
      <td style={styles.td}>
        {res.comment || ''}
      </td>

      <td style={styles.td}>
        <span style={styles.historyLink} onClick={() => handleViewHistory(res.name)}>
          View History
        </span>
      </td>
      <td style={styles.td}><span style={styles.naText}>--NA--</span></td>

      
      <td style={styles.td}>
         <div style={styles.actionCell}>
           <input 
             type="checkbox" 
             checked={res.isApproved || false} 
             onChange={(e) => handleResultUpdate(i, 'isApproved', e.target.checked)}
           />
           <div style={styles.checkIcon}>✓</div>
         </div>
      </td>
    </tr>
  ))}
</tbody>
              </table>
            </div>

            <div style={styles.reportButtons}>
    <button 
        style={styles.provBtn} 
        onClick={() => handleReportAction('provisional')}
    >
        Provisional Report
    </button>
    <button 
        style={styles.finalBtn} 
        onClick={() => handleReportAction('final')}
    >
        Final Report
    </button>
    
    <button 
        style={{...styles.finalBtn, backgroundColor: '#2196f3'}} 
        onClick={() => setShowEmailModal(true)}
    >
         Send Mail
    </button>
</div>
          </div>
        </main>

        {showTrend && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={{margin:0}}>Trend: {selectedTest}</h3>
                <button style={{border:'none', background:'none', fontSize:'20px', cursor:'pointer'}} onClick={() => setShowTrend(false)}>×</button>
              </div>
              <div style={{height: '300px', marginTop: '20px'}}>
                
<ResponsiveContainer width="100%" height="100%">
  <LineChart data={historyPoints}> 
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Line 
      type="monotone" 
      dataKey="val" 
      stroke="#4a148c" 
      strokeWidth={2} 
    />
  </LineChart>
</ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

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

      {/* --- REPORT PREVIEW MODAL (Exact match to Customer Care) --- */}
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

            {/* Patient Metadata Box */}
            <div style={{ backgroundColor: 'white', margin: '0 20px 15px 20px', padding: '25px', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px', fontSize: '15px' }}>
                    <div>
                        <p style={{ margin: '8px 0' }}><strong>Patient Name:</strong> {selectedPatient.patient_name}</p>
                        <p style={{ margin: '8px 0' }}><strong>Patient ID:</strong> {selectedPatient.PatientID}</p>
                        <p style={{ margin: '8px 0' }}><strong>Sample ID:</strong> {selectedPatient.sampleId}</p>
                        <p style={{ margin: '8px 0' }}><strong>Collected At:</strong> {selectedPatient.collected_at}</p>
                    </div>
                    <div>
                        <p style={{ margin: '8px 0' }}><strong>Create Date:</strong> {selectedPatient.invoice_date}</p>
                        <p style={{ margin: '8px 0' }}><strong>Age / Sex:</strong> {selectedPatient.age} / {selectedPatient.gender}</p>
                        <p style={{ margin: '8px 0' }}><strong>Referred By:</strong> {selectedPatient.referred_by}</p>
                    </div>
                </div>
                
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button 
                        style={{ backgroundColor: '#4a148c', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => window.open(`http://localhost:5000/api/generate-report/${selectedPatient.sampleId}`, '_blank')}
                    >
                        Generate PDF
                    </button>

                    
                    
                    {selectedPatient.mode === 'final' && (
    <button 
        style={{ 
            backgroundColor: (userRole === 'Admin') ? '#ccc' : '#4caf50', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: (userRole === 'Admin') ? 'not-allowed' : 'pointer', 
            fontWeight: 'bold',
            filter: (userRole === 'Admin') ? 'grayscale(1) opacity(0.6)' : 'none', 
            transition: '0.3s'
        }}
        onClick={() => {
            if (userRole === 'Admin') {
                Swal.fire('Access Denied', 'Only Pathologists or Lab staff can finalize reports.', 'error');
                return;
            }
            finalizeApproval();
        }}
        disabled={userRole === 'Admin'} 
    >
        {userRole === 'Admin' ? 'Approval Restricted' : 'Approve & Close'}
    </button>
)}
                    
                </div>
            </div>

            {/* Clinical Report Body (Visible for Final) */}
            {selectedPatient.mode === 'final' && (
                <div style={{ backgroundColor: 'white', margin: '0 20px 20px 20px', padding: '40px', borderRadius: '8px', flex: 1, overflowY: 'auto' }}>
                    <div style={{ textAlign: 'center', borderBottom: '2px solid #eee', marginBottom: '20px' }}>
                        <h3 style={{ color: '#333' }}>LABORATORY REPORT</h3>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #4a148c' }}>
                                <th style={{ textAlign: 'left', padding: '10px' }}>Test</th>
                                <th style={{ textAlign: 'center', padding: '10px' }}>Result</th>
                                <th style={{ textAlign: 'left', padding: '10px' }}>Range</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px' }}>{r.name}</td>
                                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{r.val}</td>
                                    <td style={{ padding: '10px' }}>{r.range} {r.unit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
)}
      {showEmailModal && (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', width: '450px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
            <h2 style={{ color: '#4a148c', marginBottom: '25px', letterSpacing: '2px' }}>PATHO MAIL</h2>
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 'bold' }}>RECIPIENT EMAIL</label>
                <input type="email" defaultValue={patientInfo.email || ''} id="emailInput" style={{ width: '100%', padding: '12px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div style={{ textAlign: 'left', marginBottom: '25px' }}>
                <label style={{ fontSize: '12px', color: '#888', fontWeight: 'bold' }}>SUBJECT</label>
                <input type="text" id="subjectInput" defaultValue={`Laboratory Report - ${patientInfo.name}`} style={{ width: '100%', padding: '12px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <button 
                onClick={handleSendMailAction}
                style={{ backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '14px 0', width: '100%', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
            >
                SEND MAIL
            </button>
            <button onClick={() => setShowEmailModal(false)} style={{ marginTop: '15px', border: 'none', background: 'none', cursor: 'pointer', color: '#e74c3c', fontWeight: 'bold' }}>Cancel</button>
        </div>
    </div>
)}
  </div>
    
  );
};

const styles = {
  pageContainer: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f0f9' },
  mainWrapper: { flex: '1 0 auto' },
  header: { background: '#4a148c', color: 'white', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brand: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: { background: 'white', color: '#4a148c', width: '28px', height: '28px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  logoText: { fontSize: '18px', letterSpacing: '0.5px' },
  navActions: { display: 'flex', alignItems: 'center' },
  adminTag: { fontSize: '12px', marginRight: '15px' },
  logoutBtn: { background: 'none', border: '1px solid white', color: 'white', padding: '3px 12px', borderRadius: '4px', cursor: 'pointer' },
  mainContent: { padding: '20px' },
  topRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' },
  backBtn: { background: 'none', border: 'none', color: '#4a148c', cursor: 'pointer', fontWeight: 'bold' },
  sessionDate: { fontSize: '12px', color: '#666' },
  infoCard: { background: 'white', borderRadius: '4px', border: '1px solid #7b1fa2', marginBottom: '20px', overflow: 'hidden' },
  cardHeader: { background: '#4a148c', color: 'white', padding: '8px 15px', fontSize: '13px', fontWeight: 'bold' },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', padding: '15px', gap: '10px' },
  gridItem: { fontSize: '13px' },
  commentRow: { padding: '10px 15px', borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px' },
  commentInput: { flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' },
  boldLabel: { fontWeight: 'bold', fontSize: '12px', color: '#4a148c' },
  tableCard: { background: 'white', border: '1px solid #7b1fa2', borderRadius: '4px', overflow: 'hidden' },
  tableToolbar: { padding: '10px 15px', display: 'flex', justifyContent: 'space-between', background: '#f3e5f5' },
  tableTitle: { fontSize: '13px', fontWeight: 'bold', color: '#4a148c' },
  toggleGroup: { display: 'flex', gap: '15px', fontSize: '12px' },
  tableResponsive: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  theadRow: { background: '#7b1fa2' },
  th: { color: 'white', padding: '12px', fontSize: '12px', fontWeight: '500', borderRight: '1px solid #9c27b0' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '12px', fontSize: '13px', textAlign: 'center' },
  tdName: { padding: '12px 20px', textAlign: 'left', color: '#4a148c', fontWeight: '600' },
  cellInput: { width: '80%', padding: '5px', border: '1px solid #ddd' },
  historyLink: { color: '#1565c0', cursor: 'pointer', textDecoration: 'underline' },
  naText: { color: 'red', fontWeight: 'bold', fontSize: '11px' },
  actionCell: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  approveHeader: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  checkIconSmall: { background: '#4caf50', color: 'white', width: '15px', height: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', marginRight: '5px' },
  checkIcon: { background: '#4caf50', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' },
  reportButtons: { padding: '30px', display: 'flex', justifyContent: 'center', gap: '40px' },
  provBtn: { background: '#9c27b0', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '4px', fontWeight: 'bold' },
  finalBtn: { background: '#4caf50', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '4px', fontWeight: 'bold' },
  footer: { background: '#4a148c', color: 'white', textAlign: 'center', padding: '15px', fontSize: '14px', flexShrink: 0 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '20px', borderRadius: '8px', width: '80%', maxWidth: '600px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px' }
};

export default PatientApprovalDetail;