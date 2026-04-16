import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/home.css"; 
import HomeIcon from '@mui/icons-material/Home';
import { Box, IconButton, Typography } from '@mui/material';
import Swal from 'sweetalert2';
import { FileText } from 'lucide-react';
import { Stethoscope } from 'lucide-react';
import { FileEdit, Search, Home, Mail, MapPin } from 'lucide-react';

const AddOutOfHospital = () => {
    const navigate = useNavigate();
    
    // Data Lists
    const [locations, setLocations] = useState([]);
    const [hospitals, setHospitals] = useState([]); 
    const [testList, setTestList] = useState([]);
    const [profileList, setProfileList] = useState([]);
    const [appliedRates, setAppliedRates] = useState([]);
    // New States for Data Grid
const [searchTerm, setSearchTerm] = useState('');
const [currentPage, setCurrentPage] = useState(1);
const [sortConfig, setSortConfig] = useState({ key: 'TestProfileName', direction: 'asc' });
const itemsPerPage = 5;
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

// 1. Filter Logic
const filteredData = appliedRates.filter(item => 
    item.TestProfileName.toLowerCase().includes(searchTerm.toLowerCase())
);

// 2. Sort Logic
const sortedData = [...filteredData].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
});

// 3. Pagination Logic
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(sortedData.length / itemsPerPage);

const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
};

    // Selection States
    const [savedClientId, setSavedClientId] = useState(''); 
    const [formData, setFormData] = useState({
        location: '',
        hospitalName: '',
        createDate: new Date().toISOString().split('T')[0],
        selectedItemName: '', 
        existingAmount: '',
        amount: 0 
    });

    // Styles
    const btnBaseStyle = {
        backgroundColor: '#00008b', color: 'white', border: 'none', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        fontWeight: 'bold', transition: 'background 0.2s'
    };
    const plusBtnSmall = { ...btnBaseStyle, width: '25px', height: '25px', fontSize: '16px' };
    const plusBtnLarge = { ...btnBaseStyle, width: '32px', height: '32px', fontSize: '22px' };

    // Styles for the Data Grid
    const gridHeaderStyle = {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        backgroundColor: '#00008b',
        color: 'white',
        padding: '10px',
        fontWeight: 'bold',
        fontSize: '13px',
        position: 'sticky',
        top: 0
    };

    const gridRowStyle = {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        padding: '10px',
        borderBottom: '1px solid #eee',
        fontSize: '13px',
        alignItems: 'center'
    };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [locRes, hospRes, testRes, profRes] = await Promise.all([
                    fetch('http://localhost:5000/api/get-locations').then(r => r.json()),
                    fetch('http://localhost:5000/api/get-out-hospitals').then(r => r.json()),
                    fetch('http://localhost:5000/api/get-all-tests').then(r => r.json()),
                    fetch('http://localhost:5000/api/get-all-profiles').then(r => r.json())
                ]);
                if (locRes.success) setLocations(locRes.data);
                if (hospRes.success) setHospitals(hospRes.data);
                if (testRes.success) setTestList(testRes.data);
                if (profRes.success) setProfileList(profRes.data);
            } catch (err) { console.error("Fetch error:", err); }
        };
        fetchAllData();
    }, []);

    useEffect(() => {
        if (savedClientId) {
            fetch(`http://localhost:5000/api/get-hospital-rates/${savedClientId}`)
                .then(r => r.json())
                .then(res => { if (res.success) setAppliedRates(res.data); });
        } else {
            setAppliedRates([]);
        }
    }, [savedClientId]);

    const handleProfileSelect = (e) => {
        const profile = profileList.find(p => p.profile_name === e.target.value);
        if (profile) {
            setFormData({ ...formData, selectedItemName: profile.profile_name, existingAmount: profile.amount, amount: profile.amount });
        }
    };

    const handleTestSelect = (e) => {
        const test = testList.find(t => t.TestName === e.target.value);
        if (test) {
            setFormData({ ...formData, selectedItemName: test.TestName, existingAmount: test.Price, amount: test.Price });
        }
    };

    const handleRegisterHospital = async () => {
    if (!formData.location || !formData.hospitalName) {
        return Swal.fire({
            icon: 'warning',
            title: 'Incomplete Data',
            text: 'Please provide both Location and Hospital Name.',
            confirmButtonColor: '#4a148c'
        });
    }
    Swal.fire({
        title: 'Registering Hospital...',
        text: 'Adding to Patho Consult Registry',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const res = await fetch('http://localhost:5000/api/register-hospital-only', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                location: formData.location, 
                hospitalName: formData.hospitalName, 
                createDate: formData.createDate 
            })
        });
        const data = await res.json();
        
        if (data.success) {
            setSavedClientId(data.clientId);
            
            const hospRes = await fetch('http://localhost:5000/api/get-out-hospitals').then(r => r.json());
            if (hospRes.success) setHospitals(hospRes.data);

            await Swal.fire({
                icon: 'success',
                title: 'Hospital Saved!',
                text: `${formData.hospitalName} is now active.`,
                confirmButtonColor: '#2e7d32',
                timer: 2000,
                showConfirmButton: false
            });
            setFormData(prev => ({
                ...prev,
                hospitalName: '', 
            }));

        } else {
            Swal.fire('Oops!', data.message || 'Registration failed.', 'error');
        }
    } catch (err) {
        console.error("Registration Error:", err);
        Swal.fire('Server Error', 'Could not connect to the database. Check your connection.', 'error');
    }
};

    const handleAddTestRow = async () => {
    // 1. Validation with a subtle warning toast
    if (!savedClientId || !formData.selectedItemName) {
        return Toast.fire({
            icon: 'warning',
            title: 'Selection Required',
            text: 'Choose a Hospital and a Test/Profile first.'
        });
    }

    try {
        const res = await fetch('http://localhost:5000/api/add-hospital-test-rate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                clientId: savedClientId, 
                testProfile: formData.selectedItemName, 
                amount: formData.amount 
            })
        });

        const data = await res.json();

        if (data.success) {
            // 2. Refresh the Data Grid
            const refresh = await fetch(`http://localhost:5000/api/get-hospital-rates/${savedClientId}`).then(r => r.json());
            if (refresh.success) {
                setAppliedRates(refresh.data);
            }

            // 3. Reset local selection fields only /api/get-tests-by-category
            setFormData(prev => ({ 
                ...prev, 
                selectedItemName: '', 
                existingAmount: '', 
                amount: 0 
            }));

            Toast.fire({
                icon: 'success',
                title: 'Rate added successfully'
            });

        } else {
            Toast.fire({
                icon: 'error',
                title: data.message || 'Failed to add rate'
            });
        }
    } catch (err) {
        console.error("Add Rate Error:", err);
        Toast.fire({
            icon: 'error',
            title: 'Network error. Try again.'
        });
    }
};

    return (
        <div className="home-wrapper" style={{ backgroundColor: '#4a148c', minHeight: '100vh', paddingBottom: '40px' }}>
            <header className="brand-nav" style={{ 
  backgroundColor: '#4a148c', 
  color: 'white', 
  padding: '5px 20px', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between',
  height: '60px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
}}>
  {/* Left Spacer: Keeps the center text actually centered */}
  <div style={{ width: '48px' }} /> 

  {/* Centered Title */}
  <Typography 
    variant="h6" 
    style={{ 
      fontWeight: 'bold', 
      letterSpacing: '1px',
      textAlign: 'center',
      flexGrow: 1 
    }}
  >
    PATHO CONSULT
  </Typography>

  {/* Right Aligned Home Icon */}
  <IconButton 
                        onClick={() => navigate('/home')} 
                        sx={{ position: 'absolute', right: 36, top: 3, color: 'white' }}
                    >
                        <HomeIcon fontSize="large" />
                    </IconButton>
</header>

            <main className="dashboard-content" style={{ padding: '20px' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    
                    {/* SECTION 1: REGISTRATION */}
                    <div className="form-card" style={{ background: 'white', borderRadius: '8px',marginTop:'40px', marginBottom: '20px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>

<div style={{ 
    backgroundColor: '#4a148c', 
    color: 'white', 
    padding: '10px 15px', 
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '10px' 
}}>
    <Stethoscope size={18} strokeWidth={2.5} />
    <span>Add Out Of Hospital</span>
</div>
                        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', alignItems: 'end' }}>
                            <div className="form-group">
                                <label>Location</label>
                                <select className="purple-select" style={{ width: '100%' }} onChange={(e) => setFormData({...formData, location: e.target.value})}>
                                    <option value="">-Select-</option>
                                    {locations.map(loc => <option key={loc.LocationID} value={loc.LocationCode}>{loc.LocationName}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Hospital Name</label>
                                <input type="text" className="purple-select" style={{ width: '100%' }} onChange={(e) => setFormData({...formData, hospitalName: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Hospital Create Date</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input type="date" value={formData.createDate} className="purple-select" style={{ flex: 1 }} readOnly />
                                    <button onClick={handleRegisterHospital} style={plusBtnSmall}>+</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: ADD DETAILS */}
                    <div className="form-card" style={{ background: 'white', borderRadius: '8px', marginBottom: '20px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>

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
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                                <div className="form-group">
                                    <label>Out Of Hospital</label>
                                    <select className="purple-select" style={{ width: '100%' }} value={savedClientId} onChange={(e) => setSavedClientId(e.target.value)}>
                                        <option value="">-- Choose Hospital --</option>
                                        {hospitals.map(h => <option key={h.id} value={h.id}>{h.HospitalName}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Select Profile</label>
                                    <select className="purple-select" style={{ width: '100%' }} onChange={handleProfileSelect}>
                                        <option value="">-- Choose Profile --</option>
                                        {profileList.map(p => <option key={p.id} value={p.profile_name}>{p.profile_name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                                <div className="form-group">
                                    <label>Select Test</label>
                                    <select className="purple-select" style={{ width: '100%' }} onChange={handleTestSelect}>
                                        <option value="">-- Choose Test --</option>
                                        {testList.map(t => <option key={t.TestID} value={t.TestName}>{t.TestName}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Selected Test / Profile</label>
                                    <input type="text" className="purple-select" style={{ width: '100%', backgroundColor: '#f9f9f9', fontWeight: 'bold' }} value={formData.selectedItemName} readOnly />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'end' }}>
                                <div className="form-group">
                                    <label>Existing Amount</label>
                                    <input type="text" className="purple-select" style={{ width: '100%', backgroundColor: '#f9f9f9' }} value={formData.existingAmount} readOnly />
                                </div>
                                <div className="form-group">
                                    <label>New Amount</label>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <input type="number" className="purple-select" style={{ flex: 1 }} value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                                        <button onClick={handleAddTestRow} style={plusBtnLarge}>+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: ADVANCED PURPLE DATA GRID */}
{/* Only show Section 3 if a hospital (savedClientId) has been selected */}
{savedClientId && (
    <div className="form-card" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden', marginTop: '20px' }}>
        
        {/* Search & Filter Header */}
        <div style={{ backgroundColor: '#4a148c', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
            <h4 style={{ color: 'white', margin: 0 }}>Applied Hospital Rates</h4>
            <input 
                type="text" 
                placeholder="Search tests..." 
                style={{ padding: '8px 12px', borderRadius: '20px', border: 'none', width: '250px', fontSize: '13px' }}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
        </div>

    {/* Grid Header with Sorting */}
    <div style={{ ...gridHeaderStyle, backgroundColor: '#6a1b9a', gridTemplateColumns: '2fr 1fr 1fr', cursor: 'pointer' }}>
        <div onClick={() => requestSort('TestProfileName')}>Item Name {sortConfig.key === 'TestProfileName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
        <div style={{ textAlign: 'center' }}>Type</div>
        <div style={{ textAlign: 'right' }} onClick={() => requestSort('Amount')}>Rate (₹) {sortConfig.key === 'Amount' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
    </div>

    {/* Scrollable Body */}
    <div style={{ height: '280px', overflowY: 'auto', borderBottom: '1px solid #eee' }} className="custom-scrollbar">
        {currentItems.length > 0 ? (
            currentItems.map((rate, i) => {
                const isProfile = profileList.some(p => p.profile_name === rate.TestProfileName);
                return (
                    <div key={i} style={{ ...gridRowStyle, gridTemplateColumns: '2fr 1fr 1fr', backgroundColor: i % 2 === 0 ? '#f9f5ff' : '#fff' }}>
                        <div style={{ fontWeight: '500' }}>{rate.TestProfileName}</div>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ backgroundColor: isProfile ? '#f3e5f5' : '#e1f5fe', color: '#4a148c', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>
                                {isProfile ? 'PROFILE' : 'TEST'}
                            </span>
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#4a148c' }}>₹{rate.Amount}</div>
                    </div>
                );
            })
        ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No records found.</div>
        )}
    </div>

    {/* Pagination Footer */}
    <div style={{ padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <span style={{ fontSize: '12px', color: '#666' }}>Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedData.length)} of {sortedData.length}</span>
        <div style={{ display: 'flex', gap: '5px' }}>
            <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                style={{ padding: '5px 10px', border: '1px solid #ddd', background: currentPage === 1 ? '#eee' : 'white', cursor: 'pointer', borderRadius: '4px' }}
            >Prev</button>
            <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                style={{ padding: '5px 10px', border: '1px solid #ddd', background: currentPage === totalPages ? '#eee' : 'white', cursor: 'pointer', borderRadius: '4px' }}
            >Next</button>
        </div>
    </div>
</div>
)}
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
    );
};

export default AddOutOfHospital;