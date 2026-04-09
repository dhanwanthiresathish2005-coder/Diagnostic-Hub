import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { ShieldCheck } from 'lucide-react';
import { 
    Typography,  TextField, Button, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, 
    CircularProgress, Modal, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import axios from 'axios';
import { useNotifications } from './NotificationContext';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';



const Approver = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { addNotification, clearNotifications } = useNotifications();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const [dates, setDates] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const auditData = (incomingData) => {
  if (typeof clearNotifications === 'function') clearNotifications();

  // 1. Check for Criticals (Highest Priority)
  const criticalCount = incomingData.filter(i => i.isCritical).length;
  if (criticalCount > 0) {
    addNotification(`ALERT: ${criticalCount} Critical Values detected!`, 'critical');
  }

  // 2. Check for "Ready" (Standard Workflow)
  const readyCount = incomingData.filter(i => i.labStatus == 3).length;
  if (readyCount > 0) {
    addNotification(`${readyCount} patients are ready for final approval.`, 'success');
  }

  // 3. Check for Backlog (Efficiency)
  const delayedCount = incomingData.filter(i => i.isOverdue).length;
  if (delayedCount > 0) {
    addNotification(`${delayedCount} reports are past the reporting deadline.`, 'pending');
  }
};

  const fetchData = async () => {
  setLoading(true);
  try {
    const response = await axios.get(`http://localhost:5000/api/approver-queue`, {
      params: { fromDate: dates.from, toDate: dates.to }
    });

    if (response.data.success) {
      const incomingData = response.data.data;
      setData(incomingData);
      setCurrentPage(1);
      auditData(incomingData); 
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    addNotification("Could not sync data. Check server connection.", "critical");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchData(); }, []);

  const filtered = data.filter(item => 
    (item.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
    (item.patientId?.toString() || "").includes(searchTerm)
  );
  
  const lastIndex = currentPage * rowsPerPage;
  const firstIndex = lastIndex - rowsPerPage;
  const currentItems = filtered.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
   <div style={styles.page}>
      {/* Top Professional Purple Navbar */}
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', bgcolor: '#4a148c', color: 'white', position: 'relative' }}>
                      <Typography variant="h6" fontWeight="bold">PATHO CONSULT</Typography>
                      <IconButton 
                              onClick={() => navigate('/home')} 
                              sx={{ position: 'absolute', right: 36, top: 3, color: 'white' }}
                          >
                              <HomeIcon fontSize="large" />
                          </IconButton>
                  </Box>
                  {/* Section Header: Approver View */}
<Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 1.5, 
    mb: 2,
    mt: 3, 
    px: 98 
}}>
    {/* Shield Check Icon - Represents Approval/Authority */}
    <Box sx={{ 
        bgcolor: '#f3e5f5', 
        p: 1, 
        borderRadius: '8px', 
        display: 'flex' 
    }}>
        <ShieldCheck size={37} color="#4a148c" strokeWidth={2.9} />
    </Box>

    <Box>
        <Typography variant="h5" sx={{ color: '#4a148c', fontWeight: 'bold', lineHeight: 1 }}>
            Approver Dashboard
        </Typography>
        <Typography variant="caption" sx={{ color: '#6a1b9a', fontWeight: 500 }}>
            Review and verify pending laboratory results
        </Typography>
    </Box>
</Box>

      <main style={styles.mainContent}>
        {/* Stats Info */}
        <div style={styles.statsBar}>
          <div style={styles.statItem}>Total Patients: <b>{filtered.length}</b></div>
          <div style={styles.statItem}>Current View: <b>Page {currentPage}</b></div>
        </div>

        {/* Purple Toolbar */}
        <div style={styles.toolbar}>
          <div style={styles.filterGroup}>
            <div style={styles.field}>
  <label style={styles.label}>FROM DATE</label>
  <DatePicker
    value={dates.from ? dayjs(dates.from) : null}
    onChange={(val) => setDates({ ...dates, from: val ? val.format('YYYY-MM-DD') : '' })}
    slotProps={{
      textField: {
        size: "small",
        sx: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '6px',
            backgroundColor: '#fff',
            '& fieldset': { border: '2px solid #dfe6e9' }, // Matches your custom input style
            '&:hover fieldset': { borderColor: '#4a148c' },
            '&.Mui-focused fieldset': { borderColor: '#4a148c' },
          }
        }
      }
    }}
  />
</div>

<div style={styles.field}>
  <label style={styles.label}>TO DATE</label>
  <DatePicker
    value={dates.to ? dayjs(dates.to) : null}
    onChange={(val) => setDates({ ...dates, to: val ? val.format('YYYY-MM-DD') : '' })}
    slotProps={{
      textField: {
        size: "small",
        sx: {
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
</div>
            <button style={styles.refreshBtn} onClick={fetchData}>{loading ? '...' : 'SYNC DATA'}</button>
          </div>
          
          <div style={styles.searchWrapper}>
            <input 
              type="text" 
              placeholder="🔍 Search name or patient ID..." 
              style={styles.searchBox} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        {/* Responsive Table Card */}
        <div style={styles.tableCard}>
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  <th style={styles.th}>Patient Name</th>
                  <th style={styles.th}>Lab Status</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Patient ID</th>
                  <th style={styles.th}>External ID</th>
                  <th style={styles.th}>Referred By</th>
                  <th style={styles.th}>Collected At</th>
                  <th style={styles.th}>Billed</th>
                  <th style={styles.th}>Approved</th>
                  <th style={styles.th}>Pending</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, i) => {
  // These flags come directly from your updated SQL query
  const isCritical = item.isCritical === 1; 
  const isDelayed = item.isOverdue === 1;

  return (
    <tr 
      key={i} 
      style={{
        ...styles.tr,
        // High Priority: Critical (Red) > Overdue (Yellow)
        backgroundColor: isCritical ? '#fff5f5' : isDelayed ? '#fffdf0' : 'white',
        borderLeft: isCritical ? '5px solid #d32f2f' : isDelayed ? '5px solid #fbc02d' : '5px solid transparent'
      }}
    >
      <td style={styles.tdName}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {item.name}
          {isCritical && (
            <span style={{ fontSize: '10px', color: '#d32f2f', fontWeight: '900' }}>
              ⚠️ CRITICAL VALUE
            </span>
          )}
        </div>
      </td>

      <td style={styles.td}>
        <span style={{
          ...styles.pill, 
          background: item.labStatus === '3' ? '#e8f5e9' : '#fff9c4', 
          color: item.labStatus === '3' ? '#2e7d32' : '#f57f17'
        }}>
          {item.labStatus === '3' ? 'Ready' : 'In-Progress'}
        </span>
      </td>

      <td style={{...styles.td, color: item.status === 'Completed' ? '#2e7d32' : '#c62828', fontWeight: '700'}}>
        {item.status}
      </td>

      <td style={styles.td}>{item.patientId}</td>
      <td style={styles.td}>{item.extId || '-'}</td>
      <td style={styles.td}>{item.refBy}</td>
      
      <td style={{
        ...styles.td, 
        color: isDelayed ? '#d32f2f' : 'inherit', 
        fontWeight: isDelayed ? 'bold' : 'normal'
      }}>
        {item.collAt} {isDelayed && '⏱️'}
      </td>

      <td style={styles.tdAmount}>₹{item.billed}</td>
      <td style={{...styles.td, color: '#2e7d32', fontWeight: 'bold'}}>{item.approved || 0}</td>
      <td style={{...styles.td, color: '#c62828', fontWeight: 'bold'}}>{item.pending || 0}</td>
      <td style={styles.td}>{item.date}</td>

      <td style={styles.tdAction}>
        <button 
          style={{
            ...styles.viewBtn,
            background: isCritical ? '#d32f2f' : '#4a148c'
          }} 
          onClick={() => navigate('/patient-approval-detail', { state: { patientId: item.patientId } })}
        >
          {isCritical ? 'URGENT VIEW' : 'VIEW'}
        </button>
      </td>
    </tr>
  );
})}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div style={styles.tableFooter}>
            <div style={styles.pageInfo}>Showing {firstIndex + 1} to {Math.min(lastIndex, filtered.length)} of {filtered.length} entries</div>
            <div style={styles.pagination}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c-1)} style={styles.pBtn}>Previous</button>
              <div style={styles.pageNumber}>{currentPage}</div>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(c => c+1)} style={styles.pBtn}>Next</button>
            </div>
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
    </div>
    </LocalizationProvider>
  );
};

const styles = {
  page: { background: '#f3e5f5', minHeight: '100vh', fontFamily: '"Segoe UI", Arial, sans-serif' },
  header: { background: '#4a148c', color: 'white', padding: '0 24px', height: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', position: 'sticky', top: 0, zIndex: 1000 },
  brand: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoIcon: { background: '#fff', color: '#4a148c', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' },
  logoText: { fontSize: '18px', letterSpacing: '0.5px' },
  subLogo: { fontSize: '14px', opacity: 0.8, fontWeight: 300 },
  navActions: { display: 'flex', gap: '16px' },
  homeBtn: { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  logoutBtn: { background: 'none', border: 'none', color: '#e1bee7', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  
  mainContent: { padding: '24px' , marginTop: '13px'},
  statsBar: { marginBottom: '16px', display: 'flex', gap: '20px', color: '#6a1b9a', fontSize: '13px', fontWeight: '500' },
  toolbar: { background: 'white', padding: '16px 24px', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #ce93d8', flexWrap: 'wrap', gap: '16px' },
  filterGroup: { display: 'flex', gap: '16px', alignItems: 'flex-end' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '10px', fontWeight: 'bold', color: '#7b1fa2', letterSpacing: '0.5px' },
  input: { border: '1px solid #e1bee7', padding: '8px', borderRadius: '4px', fontSize: '13px', color: '#333' },
  refreshBtn: { background: '#4a148c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  searchWrapper: { flexGrow: 1, maxWidth: '400px' },
  searchBox: { width: '100%', padding: '10px 16px', borderRadius: '24px', border: '1px solid #e1bee7', background: '#fdfbff', outline: 'none', fontSize: '14px' },

  tableCard: { background: 'white', borderRadius: '0 0 8px 8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflow: 'hidden' },
  tableResponsive: { overflowX: 'auto', width: '100%' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '1200px' },
  theadRow: { background: '#f3e5f5', borderBottom: '2px solid #ce93d8' },
  th: { padding: '16px', textAlign: 'center', color: '#4a148c', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', borderRight: '1px solid #f3e5f5' },
  tr: { borderBottom: '1px solid #f3e5f5', transition: '0.2s' },
  td: { padding: '14px 16px', fontSize: '13px', color: '#444', textAlign: 'center', borderRight: '1px solid #fafafa' },
  tdName: { padding: '14px 16px', fontSize: '14px', color: '#4a148c', fontWeight: '700', borderRight: '1px solid #fafafa' },
  tdAmount: { padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: '#333', textAlign: 'center' },
  pill: { padding: '4px 12px', borderRadius: '16px', fontSize: '10px', fontWeight: 'bold' },
  viewBtn: { background: '#4a148c', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },

  tableFooter: { padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3e5f5' },
  pageInfo: { color: '#7b1fa2', fontSize: '13px', fontWeight: '500' },
  pagination: { display: 'flex', alignItems: 'center', gap: '8px' },
  pBtn: { padding: '6px 12px', borderRadius: '4px', border: '1px solid #ce93d8', background: 'white', color: '#4a148c', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  pageNumber: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#4a148c', color: 'white', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px' },
  tableCard: { 
    background: 'white', 
    borderRadius: '0 0 8px 8px', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  tableResponsive: { 
    overflowX: 'auto', 
    overflowY: 'auto',       
    width: '100%',
    maxHeight: '480px',      
    scrollbarWidth: 'thin',
    scrollbarColor: '#4a148c #f1f1f1',
    '&::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f1f1',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#4a148c80',
      borderRadius: '10px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: '#4a148c',
    }
  },
  table: { 
    width: '100%', 
    borderCollapse: 'separate', 
    borderSpacing: 0,
    minWidth: '1200px' 
  },
  th: { 
    padding: '16px', 
    textAlign: 'center', 
    color: '#4a148c', 
    fontSize: '12px', 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    borderRight: '1px solid #f3e5f5',
    borderBottom: '2px solid #ce93d8',
    position: 'sticky',       
    top: 0,
    background: '#f3e5f5',    
    zIndex: 2
  },
  header: { 
    background: '#4a148c', 
    color: 'white', 
    height: '64px', 
    display: 'flex', 
    justifyContent: 'center', 
    width: '100%',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  headerContent: {
    width: '95%',
    maxWidth: '1400px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center', 
    position: 'relative'      
  },
  logoText: { 
    margin: 0, 
    fontWeight: '800', 
    letterSpacing: '1px', 
    textTransform: 'uppercase' 
  },
  homeIconBtn: {
    position: 'absolute', 
    right: -205, 
    color: 'white'
  },
  footer: { 
    backgroundColor: '#4a148c', 
    color: 'white', 
    padding: '10px', 
    textAlign: 'center', 
    position: 'fixed', 
    bottom: 0, 
    width: '100%',
    zIndex: 1000 
  }
};

export default Approver;