import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, TextField, Button,
    Dialog, DialogTitle, DialogContent, Divider, Grid, Chip
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ScienceIcon from '@mui/icons-material/Science'; 
import CloseIcon from '@mui/icons-material/Close';
import {Search, Home, Mail, MapPin } from 'lucide-react';
 import BiotechIcon from '@mui/icons-material/Biotech';
 import dayjs from 'dayjs';
 import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
 import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
 


const SampleCollect = () => {
    const location = useLocation();
    const navigate = useNavigate(); 
    const locationCode = location.state?.locationCode || "MYL001";

    const [samples, setSamples] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
    const [selectedSample, setSelectedSample] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'createDate', direction: 'desc' });
    const rowsPerPage = 7;

    // --- 1. DATA FETCHING ---
    const fetchSamples = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                locationCode,
                fromDate: dateFilter.from,
                toDate: dateFilter.to
            }).toString();

            const response = await fetch(`http://localhost:5000/api/sample-collection-list?${queryParams}`);
            const data = await response.json();
            const dataToSet = data.success ? data.data : data;
            setSamples(Array.isArray(dataToSet) ? dataToSet : []);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [locationCode, dateFilter]);

    useEffect(() => {
        fetchSamples();
    }, [fetchSamples]);

    // --- 2. ACTION HANDLERS ---
    const handleCollectSample = async (sampleId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/collect-sample`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sampleId, collectedAt: new Date().toISOString() })
            });
            if (response.ok) {
                fetchSamples(); // Refresh list
                handleCloseModal();
                alert(`Sample ${sampleId} marked as Collected.`);
            }
        } catch (err) {
            console.error("Update Error:", err);
        }
    };

    const handlePrintLabel = (id) => {
        console.log("Printing barcode for:", id);
        // Integrate with Zebra/TSC printer API or window.print()
        alert(`Printing Barcode for ${id}...`);
    };

    // --- 3. LOGIC & MEMOS ---
    const groupedSamples = useMemo(() => {
        const groups = {};
        samples.forEach((item) => {
            if (!groups[item.sampleId]) {
                groups[item.sampleId] = { 
                    ...item, 
                    allTests: [], 
                    approvedCount: 0 
                };
            }
            groups[item.sampleId].allTests.push(item);
            if (item.status === 'Approved' || item.status === 'Collected') groups[item.sampleId].approvedCount++;
        });

        return Object.values(groups).map(sample => ({
            ...sample,
            labStatus: sample.approvedCount === sample.allTests.length ? 'Approved' : 
                       sample.approvedCount > 0 ? 'In Progress' : 'Pending'
        }));
    }, [samples]);

    const sortedData = useMemo(() => {
        let items = [...groupedSamples];
        if (sortConfig.key) {
            items.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [groupedSamples, sortConfig]);

    const currentRows = useMemo(() => {
        return sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    }, [sortedData, currentPage]);

    const totalPages = Math.ceil(sortedData.length / rowsPerPage);

    const handleOpenDetails = (sample) => { setSelectedSample(sample); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedSample(null); };

    // --- 4. STYLES (Partial Overrides) ---
    const getContainerColor = (type) => {
        const t = (type || "").toLowerCase();
        if (t.includes('edta')) return '#e1bee7'; 
        if (t.includes('plasma')) return '#fff9c4'; 
        if (t.includes('blood')) return '#ffcdd2'; 
        return '#f5f5f5';
    };
    // --- Inside your SampleCollect component ---

const handleSort = useCallback((key) => {
    setSortConfig((prevConfig) => {
        let direction = 'asc';
        if (prevConfig.key === key && prevConfig.direction === 'asc') {
            direction = 'desc';
        }
        return { key, direction };
    });
}, []);


  

  const styles = {
    pageWrapper: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f3e5f5' },
    content: { padding: '40px 90px', flex: 1, display: 'flex', flexDirection: 'column' },
   
  gridContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(60,64,67, 0.3), 0 4px 8px 3px rgba(60,64,67, 0.15)',
    margin: '20px 0',
    overflow: 'hidden',
    border: '1px solid #dadce0',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    fontSize: '13px', // Professional density
    color: '#3c4043',
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  th: {
    backgroundColor: '#f8f9fa',
    color: '#5f6368',
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: '11px',
    letterSpacing: '0.8px',
    padding: '12px 15px',
    borderBottom: '2px solid #e8eaed',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  td: {
    padding: '8px 15px', // Compressed height for 5-row view
    borderBottom: '1px solid #e8eaed',
    height: '48px', // Fixed height for alignment
    verticalAlign: 'middle',
  },
  // Status Pill Styles
  statusPill: (type) => ({
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: 
      type === 'Approved' ? '#e6f4ea' : 
      type === 'In Progress' ? '#fef7e0' : '#f1f3f4',
    color: 
      type === 'Approved' ? '#137333' : 
      type === 'In Progress' ? '#b06000' : '#5f6368',
  }),
  sampleBtn: {
    padding: '6px 12px',
    backgroundColor: '#e8f0fe',
    color: '#1967d2',
    border: '1px solid #d2e3fc',
    borderRadius: '4px',
    fontWeight: '600',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  paginationBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #dadce0',
  },
  pageBtn: {
    padding: '5px 15px',
    border: '1px solid #dadce0',
    backgroundColor: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#3c4043'
  },

    filterBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    padding: '15px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #dadce0',
    marginBottom: '15px',
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  filterLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#5f6368', // Professional grey
  },
  dateInput: {
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid #dadce0',
    fontSize: '13px',
    color: '#3c4043',
    outline: 'none',
    cursor: 'pointer',
  },
  findBtn: {
    padding: '7px 24px',
    backgroundColor: '#1a73e8', // Primary Blue
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(60,64,67,0.3)',
    transition: 'background 0.2s',
  },
    sampleBtn: { background: '#7b1fa2', border: 'none', color: 'white', padding: '4px 12px', cursor: 'pointer', fontSize: '11px', borderRadius: '20px', fontWeight: 'bold' },
  };

  const headers = [
  { label: "Patient Name", key: "patientName" },
  { label: "Patient ID", key: "patientId" },
  { label: "External ID", key: "externalId" },
  { label: "Referred By", key: "referredBy" },
  { label: "Collected At", key: "collectedAt" },
  { label: "Client Code", key: "clientCode" },
  { label: "Status", key: "paymentBadge" }, 
  { label: "Lab Status", key: "labStatus" },  
  { label: "CreateDate", key: "createDate" },
  { label: "Test Completed", key: "testCompleted" },
  { label: "Sample ID", key: "sampleId" }
];

  return (
    <div style={styles.pageWrapper}>
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

      <div style={styles.content}>
        {/* NEW BIG BRIGHT HEADING SECTION */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '5px', marginTop: '-20px', marginLeft: '700px' }}>
      <BiotechIcon sx={{ fontSize: '40px', color: '#4a148c' }} />
      <h1 style={{ fontSize: '28px', color: '#4a148c', margin: 0, fontWeight: '800' }}>Sample Collection</h1>
    </div>

        {/* Professional Location Badge */}
<div style={{
  textAlign: 'center', 
  margin: '40px 0', 
  display: 'flex',
  justifyContent: 'center'
}}>
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    background: 'linear-gradient(135deg, #6200ea 0%, #311b92 100%)', // Bright Purple/Indigo Gradient
    padding: '12px 28px',
    borderRadius: '16px',
    color: '#ffffff',
    boxShadow: '0 10px 20px rgba(98, 0, 234, 0.3)', // Deep Glow
    border: '1px solid rgba(255, 255, 255, 0.1)',
  }}>
    {/* BOLD ICON CONTAINER */}
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '10px',
      padding: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)'
    }}>
      {/* SVG Map Pin Icon */}
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="white" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </div>

    {/* TEXT SECTION */}
    <div style={{ textAlign: 'left' }}>
      <div style={{ 
        fontSize: '11px', 
        textTransform: 'uppercase', 
        fontWeight: '800', 
        letterSpacing: '1.5px',
        opacity: 0.8 
      }}>
        Active Terminal
      </div>
      <div style={{ 
        fontSize: '22px', 
        fontWeight: '900', 
        lineHeight: '1.2' 
      }}>
        {locationCode}
      </div>
    </div>

    {/* LIVE INDICATOR */}
    <div style={{
      width: '10px',
      height: '10px',
      backgroundColor: '#00e676', // Bright Green
      borderRadius: '50%',
      marginLeft: '10px',
      boxShadow: '0 0 10px #00e676',
      border: '2px solid white'
    }}></div>
  </div>
</div>

{/* Professional Horizontal Filter Bar */}
<div style={styles.filterBar}>
  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
  {/* From Date */}
  <div style={styles.filterRow}>
    <span style={styles.label}>From</span>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={dateFilter.from ? dayjs(dateFilter.from) : null}
        onChange={(val) => setDateFilter({ ...dateFilter, from: val ? val.format('YYYY-MM-DD') : '' })}
        slotProps={{
          textField: {
            size: "small",
            sx: {
              width: '160px', // Compact for filters
              '& .MuiOutlinedInput-root': {
                borderRadius: '6px',
                backgroundColor: '#fff',
                '& fieldset': { border: '2px solid #dfe6e9' },
                '&:hover fieldset': { borderColor: '#4a148c' },
                '&.Mui-focused fieldset': { borderColor: '#4a148c' },
              }
            }
          }
        }}
      />
    </LocalizationProvider>
  </div>

  {/* To Date */}
  <div style={styles.filterRow}>
    <span style={styles.label}>To</span>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={dateFilter.to ? dayjs(dateFilter.to) : null}
        onChange={(val) => setDateFilter({ ...dateFilter, to: val ? val.format('YYYY-MM-DD') : '' })}
        slotProps={{
          textField: {
            size: "small",
            sx: {
              width: '160px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '6px',
                backgroundColor: '#fff',
                '& fieldset': { border: '2px solid #dfe6e9' },
                '&:hover fieldset': { borderColor: '#4a148c' },
                '&.Mui-focused fieldset': { borderColor: '#4a148c' },
              }
            }
          }
        }}
      />
    </LocalizationProvider>
  </div>
</div>

  <button 
    style={styles.findBtn} 
    onMouseOver={(e) => e.target.style.backgroundColor = '#1765cc'}
    onMouseOut={(e) => e.target.style.backgroundColor = '#1a73e8'}
    onClick={fetchSamples}
  >
    Find Records
  </button>
</div>

        <div style={styles.gridContainer}>
  <table style={styles.table}>
    <thead>
      <tr>
        {headers.map(h => (
          <th key={h.key} style={styles.th} onClick={() => handleSort(h.key)}>
            {h.label} {sortConfig.key === h.key && (sortConfig.direction === 'asc' ? '▴' : '▾')}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {currentRows.map((item, i) => (
        <tr key={item.sampleId} 
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f3f4'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
          
          <td style={styles.td}><strong>{item.patientName}</strong></td>
          <td style={styles.td}>{item.patientId}</td>
          <td style={styles.td}>{item.externalId}</td>
          <td style={styles.td}>{item.referredBy}</td>
          <td style={styles.td}>{item.collectedAt}</td>
          <td style={styles.td}>{item.clientCode}</td>
          
          {/* PAYMENT STATUS */}
          <td style={styles.td}>
            <span style={{
              ...styles.statusPill(parseFloat(item.balance) <= 0 ? 'Approved' : 'Pending'),
              borderRadius: '4px' // Square-ish for payment
            }}>
              {parseFloat(item.balance) <= 0 ? 'PAID' : 'UNPAID'}
            </span>
          </td>

          {/* LAB STATUS */}
          <td style={styles.td}>
            <span style={styles.statusPill(item.labStatus)}>
              ● {item.labStatus}
            </span>
          </td>

          <td style={styles.td}>{item.createDate}</td>

          {/* TEST COMPLETED COUNTER */}
          <td style={styles.td}>
            <span style={{color: '#5f6368', fontWeight: '600'}}>
              {item.approvedCount || 0} <span style={{color: '#dadce0'}}>/</span> {item.allTests?.length || 0}
            </span>
          </td>

          <td style={styles.td}>
            <button style={styles.sampleBtn} onClick={() => handleOpenDetails(item)}>
              {item.sampleId}
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  {/* Pagination integrated into the grid container for a "Panel" look */}
  <div style={styles.paginationBar}>
    <div style={{fontSize: '12px', color: '#70757a'}}>Showing 5 entries</div>
    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
      <button style={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
      <span style={{fontSize: '13px'}}>Page <strong>{currentPage}</strong> of {totalPages}</span>
      <button style={styles.pageBtn} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
    </div>
  </div>
</div>

        
      </div>


{/* --- SAMPLE DETAILS MODAL --- */}
<Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
<DialogTitle sx={{ 
    bgcolor: '#4a148c', 
    color: 'white', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    py: 1.5 // Adjust padding for a sleeker look
}}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <ScienceIcon sx={{ fontSize: 28 }} /> {/* This is the new icon */}
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Sample Collection Details
        </Typography>
    </Box>
    
    <IconButton 
        onClick={handleCloseModal} 
        sx={{ 
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } 
        }}
    >
        <CloseIcon />
    </IconButton>
</DialogTitle>
  
  <DialogContent sx={{ p: 3 }}>
    {selectedSample && (
      <Box>
<Grid container spacing={2} sx={{ mb: 2 }}>
  <Grid size={4}>
    <Typography variant="caption" color="textSecondary">Patient Name</Typography>
    <Typography variant="body2" fontWeight="bold">{selectedSample.patientName}</Typography>
  </Grid>
  
  <Grid size={4}>
    <Typography variant="caption" color="textSecondary">Sample ID</Typography>
    <Typography variant="body2" fontWeight="bold" color="#7b1fa2">{selectedSample.sampleId}</Typography>
  </Grid>

  <Grid size={4}>
    <Typography variant="caption" color="textSecondary">Location</Typography>
    <Typography variant="body2">{locationCode}</Typography>
  </Grid>
</Grid>

        <Divider sx={{ my: 2 }} />

        {/* Collection Status Section */}
        <Typography variant="subtitle2" sx={{ mb: 1, color: '#4a148c', fontWeight: 'bold' }}>Collection Information</Typography>
        <Grid container spacing={2} sx={{ bgcolor: '#f9f9f9', p: 1, borderRadius: 1, mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="caption">Collected At:</Typography>
            <Typography variant="body2">{selectedSample.collectedAt || 'Not Available'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption">Collection Status:</Typography>
            <Box>
              <Chip 
                label={selectedSample.isCollected === 'N' ? "Not Collected" : "Collected"} 
                color={selectedSample.isCollected === 'N' ? "error" : "success"} 
                size="small" 
                variant="outlined"
              />
            </Box>
          </Grid>
        </Grid>

        {/* Investigation Table with Containers */}
        <Typography variant="subtitle2" sx={{ mb: 1, color: '#4a148c', fontWeight: 'bold' }}>Test & Container Details</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: '#ede7f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Test Name</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Container</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Dept</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
<TableBody>
  {/* Loop through all tests found for this sample/patient */}
  {selectedSample?.allTests?.map((test, index) => (
    <TableRow key={`${selectedSample.sampleId}-${index}`}>
      <TableCell sx={{ fontSize: '0.875rem' }}>
        {/* Use the individual 'test' object properties here */}
        {test.testName || test.testNames || 'N/A'}
      </TableCell>
      
      <TableCell align="center">
        <Chip 
          label={test.containerType || 'Not Specified'} 
          sx={{ 
            fontSize: '10px', 
            height: '22px', 
            bgcolor: getContainerColor(test.containerType),
            fontWeight: 'bold',
            color: '#0c0813'
          }} 
        />
      </TableCell>

      <TableCell align="center">
        <Typography variant="body2">{test.department || 'General'}</Typography>
      </TableCell>

      <TableCell align="center">
        <Chip 
          label={test.status} 
          size="small"
          sx={{ 
            fontSize: '10px',
            color: test.status === 'Approved' ? 'green' : 'orange',
            borderColor: test.status === 'Approved' ? 'green' : 'orange'
          }}
          variant="outlined"
        />
      </TableCell>
    </TableRow>
  ))}
</TableBody>
          </Table>
        </TableContainer>

        {/* Footer info inside Modal */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
           <Typography variant="caption">Reg Date: {selectedSample.createDate}</Typography>
           <Button size="small" variant="contained" sx={{ bgcolor: '#4a148c' }} onClick={handleCloseModal}>
             Close
           </Button>
        </Box>
      </Box>
    )}
  </DialogContent>
</Dialog>

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
    </div>
  );
};

export default SampleCollect;

