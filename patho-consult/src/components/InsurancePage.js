import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import { FileText } from 'lucide-react';
import { ShieldPlus } from 'lucide-react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, TextField, Button
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import "../styles/home.css";
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';


const InsurancePage = () => {
    const navigate = useNavigate();
    
    const [masterData, setMasterData] = useState({ locations: [], clients: [], services: [] });
    const [savedInsurances, setSavedInsurances] = useState([]); 
    const [appliedRates, setAppliedRates] = useState([]);
    
    const [formData, setFormData] = useState({
        location: '',
        insuranceName: '',
        insuranceDate: new Date().toISOString().split('T')[0],
        selectedHeaderId: '', 
        clientCode: '',
        profileTest: '',
        existingAmount: '',
        amount: ''
    });
    const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

    const btnStyle = {
        backgroundColor: '#4a148c', color: 'white', border: 'none', borderRadius: '50%',
        width: '30px', height: '30px', display: 'flex', alignItems: 'center', 
        justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold'
    };

    useEffect(() => {
        fetchMasterData();
        fetchSavedInsuranceList();
    }, []);

    const fetchMasterData = () => {
        fetch('http://localhost:5000/api/insurance-master-data')
            .then(res => res.json())
            .then(data => { if (data.success) setMasterData(data); });
    };

    const fetchSavedInsuranceList = () => {
        fetch('http://localhost:5000/api/get-saved-insurances')
            .then(res => res.json())
            .then(res => { if (res.success) setSavedInsurances(res.data); });
    };

    const fetchGridData = (headerId) => {
        fetch(`http://localhost:5000/api/get-insurance-rates/${headerId}`)
            .then(r => r.json())
            .then(res => { if (res.success) setAppliedRates(res.data); });
    };

    
    const handleCreateHeader = async () => {
    if (!formData.location || !formData.insuranceName) {
        return Swal.fire({
            icon: 'warning',
            title: 'Missing Details',
            text: 'Please fill in both Location and Insurance Name.',
            confirmButtonColor: '#4a148c'
        });
    }

    Swal.fire({
        title: 'Saving Insurance Header...',
        didOpen: () => { Swal.showLoading(); },
        allowOutsideClick: false
    });

    try {
        const res = await fetch('http://localhost:5000/api/create-insurance-header', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                location: formData.location,
                insuranceName: formData.insuranceName,
                insuranceDate: formData.insuranceDate
            })
        });
        const data = await res.json();

        if (data.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Header Saved',
                text: `${formData.insuranceName} is now ready for rate configuration.`,
                timer: 2000,
                showConfirmButton: false
            });
            fetchSavedInsuranceList(); 
        } else {
            Swal.fire('Error', data.message || 'Could not save header.', 'error');
        }
    } catch (err) {
        Swal.fire('Server Error', 'Check your database connection.', 'error');
    }
};

    
    const handleAddTest = async () => {
    if (!formData.selectedHeaderId || !formData.profileTest) {
        return Toast.fire({
            icon: 'warning',
            title: 'Select Insurance & Test'
        });
    }

    try {
        const res = await fetch('http://localhost:5000/api/add-insurance-test-detail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                headerId: formData.selectedHeaderId,
                clientCode: formData.clientCode,
                profileTest: formData.profileTest,
                amount: formData.amount
            })
        });
        const data = await res.json();

        if (data.success) {
            fetchGridData(formData.selectedHeaderId); 
            setFormData(prev => ({ 
                ...prev, 
                profileTest: '', 
                existingAmount: '', 
                amount: '' 
            }));

            Toast.fire({
                icon: 'success',
                title: 'Rate applied successfully'
            });
        }
    } catch (err) {
        Toast.fire({
            icon: 'error',
            title: 'Failed to add test rate'
        });
    }
};
    return (
        <div className="home-wrapper" style={{ backgroundColor: '#4a148c', minHeight: '100vh', paddingBottom: '40px' }}>
            {/* Main Header */}
            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'center', bgcolor: '#4a148c', color: 'white', position: 'relative' }}>
                <Typography variant="h6" fontWeight="bold">Patho Consult</Typography>
                <IconButton 
                        onClick={() => navigate('/home')} 
                        sx={{ position: 'absolute', right: 36, top: 3, color: 'white' }}
                    >
                        <HomeIcon fontSize="large" />
                    </IconButton>
            </Box>

            <main style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
                
                {/* SECTION 1: ADD INSURANCE */}
                <div className="form-card" style={{ background: 'white', borderRadius: '8px',  marginTop: '70px', marginBottom: '20px', overflow: 'hidden' }}>
<div style={{ 
    backgroundColor: '#4a148c', 
    color: 'white', 
    padding: '10px 15px', 
    fontWeight: 'bold',
    display: 'flex',          
    alignItems: 'center', 
    gap: '10px'               
}}>
    <ShieldPlus size={20} strokeWidth={2.5} />
    <span>Add Insurance</span>
</div>
                    <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', alignItems: 'end' }}>
                        <div>
                            <label>Location*</label>
                            <select className="purple-select" style={{ width: '100%' }} onChange={(e) => setFormData({...formData, location: e.target.value})}>
                                <option value="">-Select-</option>
                                {masterData.locations.map((loc, i) => <option key={i} value={loc.LocationName}>{loc.LocationName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label>Insurance Name</label>
                            <input type="text" className="purple-select" style={{ width: '100%' }} onChange={(e) => setFormData({...formData, insuranceName: e.target.value})} />
                        </div>
                        
<LocalizationProvider dateAdapter={AdapterDayjs}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    <label style={{ fontSize: '0.85rem', fontWeight: '500' }}>Insurance Date</label>
    
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <DatePicker
        // Convert string from state to dayjs object for the picker
        value={formData.insuranceDate ? dayjs(formData.insuranceDate) : null}
        // Convert dayjs object back to string for your formData state
        onChange={(newValue) => {
          setFormData({
            ...formData,
            insuranceDate: newValue ? newValue.format('YYYY-MM-DD') : ''
          });
        }}
        slotProps={{
          textField: {
            size: 'small',
            fullWidth: true,
            sx: {
              flex: 1,
              '& .MuiInputBase-root': {
                borderRadius: '4px',
                backgroundColor: '#fff',
              }
            }
          }
        }}
      />
      
      <button 
        onClick={handleCreateHeader} 
        style={{ ...btnStyle, height: '40px', padding: '0 15px' }}
      >
        +
      </button>
    </div>
  </div>
</LocalizationProvider>
                    </div>
                </div>

                {/* SECTION 2: ADD DETAILS (Fetched from Box 1) */}
                <div className="form-card" style={{ background: 'white', borderRadius: '8px', marginBottom: '20px', overflow: 'hidden' }}>
    <div style={{ 
        backgroundColor: '#4a148c', 
        color: 'white', 
        padding: '10px 15px', 
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '10px' 
    }}>
        <FileText size={18} strokeWidth={2.5} />
        <span>Add Details</span>
    </div>
    <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
            <label>Insurance Name (Select Saved)</label>
        
<select 
    className="purple-select" 
    style={{ width: '100%' }} 
    value={formData.selectedHeaderId}
    onChange={(e) => {
    const selectedId = e.target.value;
    const selectedIns = savedInsurances.find(ins => ins.id == selectedId);
    
    setFormData(prev => ({
        ...prev, 
        selectedHeaderId: selectedId,
        policyTpaNumber: selectedIns ? selectedIns.policy_tpa_number : ''
    }));
    
    if (selectedId) fetchGridData(selectedId);
}}
>
    <option value="">-- Choose Saved Insurance --</option>
    {savedInsurances.map((ins) => (
        <option key={ins.id} value={ins.id}>{ins.insurance_name}</option>
    ))}
</select>

<label style={{marginTop: '10px', display: 'block'}}>Generated Policy / TPA Number</label>
<input 
    type="text" 
    className="purple-select" 
    style={{ width: '100%', backgroundColor: '#f5f5f5', color: '#4a148c', fontWeight: 'bold' }} 
    value={formData.policyTpaNumber || ''} 
    placeholder="Select insurance to see policy no."
    readOnly 
/>

            <label style={{marginTop: '10px', display: 'block'}}>Client Code</label>
            <select className="purple-select" style={{ width: '100%' }} onChange={(e) => setFormData({...formData, clientCode: e.target.value})}>
                <option value="">-Select Client-</option>
                {masterData.clients.map((c, i) => <option key={i} value={c.client_code}>{c.client_code}</option>)}
            </select>
        </div>
        
        <div>
            <label>Profile/Test</label>
            <select className="purple-select" style={{ width: '100%' }} value={formData.profileTest} onChange={(e) => {
                const selected = masterData.services.find(s => s.name === e.target.value);
                setFormData({ ...formData, profileTest: e.target.value, existingAmount: selected?.price || '', amount: selected?.price || '' });
            }}>
                <option value="">-Select Item-</option>
                {masterData.services.map((s, i) => <option key={i} value={s.name}>{s.name}</option>)}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <div>
                    <label>Existing Amt</label>
                    <input type="text" className="purple-select" style={{ width: '100%', backgroundColor: '#f0f0f0' }} value={formData.existingAmount} readOnly />
                </div>
                <div>
                    <label>New Amount</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="number" className="purple-select" style={{ flex: 1 }} value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                        <button onClick={handleAddTest} style={btnStyle}>+</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

                {/* SECTION 3: DATA GRID */}
                <div className="form-card" style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#4a148c', color: 'white', padding: '10px 15px' }}>Applied Rates for Selected Insurance</div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead style={{ backgroundColor: '#6a1b9a', color: 'white', position: 'sticky', top: 0 }}>
                                <tr>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Item Name</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Client</th>
                                    <th style={{ padding: '10px', textAlign: 'right' }}>Rate (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appliedRates.length > 0 ? appliedRates.map((rate, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #eee', backgroundColor: i % 2 === 0 ? '#f9f5ff' : '#fff' }}>
                                        <td style={{ padding: '10px' }}>{rate.test_profile}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{rate.client_code}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>₹{rate.amount}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="3" style={{textAlign:'center', padding:'20px'}}>No tests added yet for this insurance.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
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

export default InsurancePage;