import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import "../styles/home.css"; 
import {
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, TextField, 
    Button, Radio, RadioGroup, FormControlLabel, Autocomplete, Divider
} from '@mui/material'; 
import { Science, Biotech, Assignment } from '@mui/icons-material';
import HomeIcon from '@mui/icons-material/Home';
import { PlusCircle,Users } from 'lucide-react';
import { FileEdit, Search, Home, Mail, MapPin } from 'lucide-react';

const AddGroup = () => {
    const navigate = useNavigate();
    
    // --- States ---
    const [locations, setLocations] = useState([]);
    const [tests, setTests] = useState([]); 
    const [filteredTests, setFilteredTests] = useState([]); 
    const [showDropdown, setShowDropdown] = useState(false); 
    const [showModal, setShowModal] = useState(false);
    const [addedTests, setAddedTests] = useState([]); 
    const [showDocDropdown, setShowDocDropdown] = useState(false);
    const [clients, setClients] = useState([]);
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [filteredClients, setFilteredClients] = useState([]);
    const [hospitals, setHospitals] = useState([]);
const [filteredHospitals, setFilteredHospitals] = useState([]);
const [showHospDropdown, setShowHospDropdown] = useState(false);
const [collectedAtList, setCollectedAtList] = useState([]); 
const [filteredCollectedAt, setFilteredCollectedAt] = useState([]); 
const [showCollectDropdown, setShowCollectDropdown] = useState(false); 

    const [paymentMeta, setPaymentMeta] = useState({
        holder: '', accNo: '', chqNo: '', bank: '', txId: '', mode: ''
    });
    
    const [formData, setFormData] = useState({
        groupName: '', numPersons: '', amount: '',
        profileTest: '', location: '', hospitalName: '',
        referredBy: '', clientCode: '', clientName: '',
        sampleCollect: '', paymentMode: '', paidAmount: '', netAmount: '',collectedAtName: '', // New
    collected_at_id: '',  
    });

    // --- Fetch Initial Data ---
useEffect(() => {
    const fetchData = async () => {
        try {
            // 1. Fetch Locations
            fetch('http://localhost:5000/api/get-locations')
                .then(res => res.json())
                .then(res => setLocations(res.data || []));

            // 2. Fetch Clients
            fetch('http://localhost:5000/api/get-clients')
                .then(res => res.json())
                .then(res => { if (res.success) setClients(res.data); });

            // 3. Fetch Doctors
            fetch('http://localhost:5000/api/get-doctors')
                .then(res => res.json())
                .then(res => { if (res.success) setDoctors(res.data); });

            // Fetch Collection Centers
fetch('http://localhost:5000/api/collected-at')
    .then(res => res.json())
    .then(res => {
        if (res.success) {
            setCollectedAtList(res.data || []);
            setFilteredCollectedAt(res.data || []);
        }
    })
    .catch(err => console.error("Error fetching collection centers:", err));
            const [profileRes, testRes] = await Promise.all([
                fetch('http://localhost:5000/api/get-profiles'),
                fetch('http://localhost:5000/api/get-all-tests')
            ]);

            const profileData = await profileRes.json();
            const testData = await testRes.json();

            let masterList = [];

            if (profileData.success) {
                const formattedProfiles = profileData.data.map(p => ({
                    id: `prof-${p.id}`, 
                    code: p.profile_code,
                    name: p.profile_name,
                    amount: p.amount,
                    type: 'PROFILE'
                }));
                masterList = [...masterList, ...formattedProfiles];
            }

            if (testData.success) {
    const formattedTests = testData.data.map(t => ({
        id: `test-${t.id}`, 
        code: t.TestCode || 'TEST', 
        
        name: t.TestName,
        amount: t.Price, 
        type: 'TEST'
    }));
    masterList = [...masterList, ...formattedTests];
}

            setProfiles(masterList); 
            setFilteredProfiles(masterList);

        } catch (err) {
            console.error("Data fetch error:", err);
        }
    };

    fetchData();
}, []);

useEffect(() => {
    const total = addedTests.reduce((sum, item) => sum + (Number(item.Amount) || 0), 0);
    
    setFormData(prev => {
        if (prev.paymentMode === 'Credit') {
            return { ...prev, amount: total, netAmount: 0, paidAmount: 0 };
        }
        const currentPaid = Number(prev.paidAmount) || 0;
        
        return {
            ...prev,
            amount: total,
            paidAmount: prev.paidAmount === '' ? total : prev.paidAmount,
            netAmount: total - currentPaid
        };
    });
}, [addedTests]);

useEffect(() => {
    if (formData.location) {
        console.log("Fetching hospitals for location:", formData.location); 
        fetch(`http://localhost:5000/api/get-hospitals?locationCode=${formData.location}`)
            .then(res => res.json())
            .then(res => {
                console.log("API Response:", res); 
                if (res.success) {
                    setHospitals(res.data || []);
                    setFilteredHospitals(res.data || []);
                }
            })
            .catch(err => console.error("Hospital fetch error:", err));
    } else {
        setHospitals([]);
        setFilteredHospitals([]);
    }
}, [formData.location]);
   

const [profiles, setProfiles] = useState([]); 
const [filteredProfiles, setFilteredProfiles] = useState([]);
const [doctors, setDoctors] = useState([]); 
const [filteredDocs, setFilteredDocs] = useState([]);

useEffect(() => {
    fetch('http://localhost:5000/api/get-doctors')
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                setDoctors(res.data);
                setFilteredDocs(res.data);
            }
        });
}, []);

const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox' && name === 'paymentMode') {
        const newMode = checked ? value : '';
        let paymentUpdates = { paymentMode: newMode };

        if (newMode === 'Credit') {
            paymentUpdates.paidAmount = 0;
            paymentUpdates.netAmount = 0;
        } else {
            const total = addedTests.reduce((sum, item) => sum + (Number(item.Amount) || 0), 0);
            paymentUpdates.paidAmount = total;
            paymentUpdates.netAmount = 0;
        }
        setFormData({ ...formData, ...paymentUpdates });
        
        if (checked && ['Card', 'Cheque', 'Digital payment'].includes(value)) {
            setShowModal(true);
        }
    } else {
        let updatedFields = { [name]: value };

        // --- CALCULATION LOGIC ---
        if (name === 'paidAmount' || name === 'amount') {
            const actualAmount = name === 'amount' ? Number(value) : Number(formData.amount);
            const paid = name === 'paidAmount' ? Number(value) : Number(formData.paidAmount);
            updatedFields.netAmount = actualAmount - paid;
        }

        if (name === 'clientCode') {
            const matchedClient = clients.find(c => String(c.client_code).toLowerCase() === value.toLowerCase());
            updatedFields.clientName = matchedClient ? matchedClient.client_name : '';
        }

        setFormData(prev => ({ ...prev, ...updatedFields }));
    }
};
    const handleSearchChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, profileTest: value });
    const filtered = profiles.filter(p => 
        p.name.toLowerCase().includes(value.toLowerCase()) || 
        p.code.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredProfiles(filtered);
    setShowDropdown(true);
};
const handleDocSearch = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, referredBy: value });
    const filtered = doctors.filter(d => 
        d.doctor_name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredDocs(filtered);
    setShowDocDropdown(true);
};

const handleAddTest = () => {
    const testObj = profiles.find(p => p.name === formData.profileTest);

    if (testObj) {
        const currentAmount = parseFloat(formData.amount) || 0;
        const idStr = String(testObj.id || '');
        const rawId = idStr.includes('-') ? idStr.split('-')[1] : idStr;
        if (!rawId || rawId === 'undefined') {
            return Swal.fire({
                icon: 'error',
                title: 'Data Error',
                text: 'This test has an invalid ID. Please contact support.',
            });
        }

        const newTest = {
            dbId: rawId,           
            type: testObj.type,    
            TestCode: testObj.code, 
            TestName: testObj.name,
            Amount: currentAmount
        };
        if (addedTests.some(t => t.TestCode === newTest.TestCode)) {
            return Swal.fire({
                icon: 'info',
                title: 'Already Added',
                text: `${newTest.TestName} is already in your selection list.`,
                confirmButtonColor: '#4a148c',
                showClass: { popup: 'animate__animated animate__shakeX' } 
            });
        }
        setAddedTests(prev => [...prev, newTest]);
        
        // 5. Clear UI States
        setFormData(prev => ({ ...prev, profileTest: '', amount: '' }));
        setShowDropdown(false);
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
        });
        
        Toast.fire({
            icon: 'success',
            title: 'Added successfully'
        });

    } else {
        Swal.fire({
            icon: 'warning',
            title: 'Selection Required',
            text: 'Please select a valid test or profile from the dropdown list.',
            confirmButtonColor: '#4a148c'
        });
    }
};

const handleRemoveTest = (index) => {
    const itemToRemove = addedTests[index];
    
    // Determine if it's a "Test" or a "Profile" for the text
    const displayType = itemToRemove.type === 'PROFILE' ? 'Profile' : 'Test';

    Swal.fire({
        // Dynamic Title: "Remove Profile?" or "Remove Test?"
        title: `Remove ${displayType}?`, 
        text: `Are you sure you want to remove "${itemToRemove.TestName}" from the billing list?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', 
        cancelButtonColor: '#4a148c', 
        confirmButtonText: 'Yes, remove it',
        cancelButtonText: 'Keep it',
        showClass: { popup: 'animate__animated animate__fadeInDown' }
    }).then((result) => {
        if (result.isConfirmed) {
            const updatedTests = addedTests.filter((_, i) => i !== index);
            const newTotal = updatedTests.reduce((sum, item) => sum + (Number(item.Amount) || 0), 0);
            
            setAddedTests(updatedTests);
            setFormData(prev => {
                const currentPaid = Number(prev.paidAmount) || 0;
                return {
                    ...prev,
                    amount: newTotal,
                    paidAmount: prev.paymentMode === 'Credit' 
                        ? 0 
                        : (prev.paidAmount === '' || prev.paidAmount === prev.amount ? newTotal : prev.paidAmount),
                    netAmount: prev.paymentMode === 'Credit' ? 0 : (newTotal - currentPaid)
                };
            });

            Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500
            }).fire({
                icon: 'success',
                title: `${displayType} removed` // Context-aware toast
            });
        }
    });
};

const handleReset = (silent = false) => {
    const performReset = () => {
        setFormData({
            groupName: '', numPersons: '', amount: '', profileTest: '', location: '', 
            hospitalName: '', referredBy: '', clientCode: '', clientName: '',
            sampleCollect: '', paymentMode: '', paidAmount: '', netAmount: ''
        });
        setAddedTests([]);
        setPaymentMeta({ holder: '', accNo: '', chqNo: '', bank: '', txId: '', mode: '' });
    };

    if (silent) {
        performReset();
    } else {
        Swal.fire({
            title: 'Clear Form?',
            text: "All entered data and added tests will be lost.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#4a148c',
            confirmButtonText: 'Yes, reset everything'
        }).then((result) => {
            if (result.isConfirmed) performReset();
        });
    }
};

const handleSave = async () => {
    // 1. Validation with Swal
    if (!formData.groupName || !formData.location || !formData.paymentMode) {
        return Swal.fire({
            icon: 'error',
            title: 'Missing Information',
            text: 'Please fill in Group Name, Location, and Payment Mode before saving.',
            confirmButtonColor: '#4a148c'
        });
    }

    if (addedTests.length === 0) {
        return Swal.fire({
            icon: 'warning',
            title: 'Empty Test List',
            text: 'Please add at least one test or profile to this group.',
            confirmButtonColor: '#4a148c'
        });
    }

    // 2. Status Logic
    let status = 'Pending';
    const mode = formData.paymentMode;

    if (mode === 'Cash' || mode === 'Credit') {
        status = 'Paid';
    } else if (mode === 'Card' && paymentMeta.accNo.trim() !== '') {
        status = 'Paid';
    } else if (mode === 'Cheque' && paymentMeta.chqNo.trim() !== '') {
        status = 'Paid';
    } else if (mode === 'Digital payment' && paymentMeta.txId.trim() !== '') {
        status = 'Paid';
    }

    // 3. Show Loading Spinner
    Swal.fire({
        title: 'Saving Record...',
        text: 'Uploading group data to MariaDB',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    const submissionData = {
        ...formData,
        profileTest: addedTests.map(t => `${t.TestCode}-${t.TestName}`).join(', '),
        addedTests: addedTests, 
        acc_holder: paymentMeta.holder,
        acc_no: paymentMeta.accNo,
        cheque_no: paymentMeta.chqNo,
        bank_name: paymentMeta.bank,
        trans_id: paymentMeta.txId,
        digital_mode: paymentMeta.mode,
        status: status
    };

    try {
        const response = await fetch('http://localhost:5000/api/add-group', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData)
        });

        const data = await response.json();

        if (data.success) {
            // 4. Success Alert with Status Summary
            await Swal.fire({
                icon: 'success',
                title: 'Record Saved Successfully!',
                html: `
                    <div style="text-align: left; padding: 10px; background: #f9f9f9; border-radius: 8px;">
                        <p><b>Group:</b> ${formData.groupName}</p>
                        <p><b>Status:</b> <span style="color: ${status === 'Paid' ? 'green' : 'orange'}">${status}</span></p>
                        <p><b>Total Amount:</b> ₹${formData.amount}</p>
                    </div>
                `,
                confirmButtonColor: '#2e7d32',
                confirmButtonText: 'Great!'
            });

            handleReset(true); // Silent reset after successful save
        } else {
            Swal.fire("Save Failed", data.message, "error");
        }
    } catch (err) {
        console.error("Save Error:", err);
        Swal.fire("Connection Error", "The server is unreachable. Please check your network.", "error");
    }
};
const handleClientSearch = (e) => {
    const value = e.target.value;
    
    // 1. Keep the UI snappy by updating the input field immediately
    setFormData(prev => ({ 
        ...prev, 
        clientCode: value, 
        clientName: '' // Clear name while searching for a new code
    }));

    // 2. Filter Logic
    if (value.trim() === "") {
        setFilteredClients([]); // Better to hide list if empty
        setShowClientDropdown(false);
    } else {
        const searchTerm = value.toLowerCase();
        const filtered = clients.filter(c => 
            String(c.client_code).toLowerCase().includes(searchTerm) ||
            c.client_name.toLowerCase().includes(searchTerm)
        );
        
        setFilteredClients(filtered);
        setShowClientDropdown(true);
    }
};

// 3. Helper to close search and fill data
const handleSelectClient = (client) => {
    setFormData(prev => ({
        ...prev,
        clientCode: client.client_code,
        clientName: client.client_name,
        // Often clients have a default location or referral
        location: client.location || prev.location 
    }));
    setShowClientDropdown(false);
    
    // Quick Toast for confirmation
    Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1000
    }).fire({
        icon: 'success',
        title: `Selected: ${client.client_name}`
    });
};

    return (
        <div className="home-wrapper" style={{ backgroundColor: '#4a148c', minHeight: '100vh', paddingBottom: '70px' }}>
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

            <main className="dashboard-content" style={{ padding: '50px', backgroundColor: '#f0d4f5', minHeight: '100vh' }}>
    <div className="group-details-container" style={{ 
        backgroundColor: 'white', 
        padding: '25px', 
        borderRadius: '8px', 
        maxWidth: '1100px', 
        margin: '0 auto', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
        
        {/* Header with Icon */}
<div style={{ 
    backgroundColor: '#4a148c', 
    color: 'white', 
    padding: '12px 20px', 
    borderRadius: '4px 4px 0 0', 
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px' 
}}>
    
    <Users size={20} strokeWidth={2.5} /> 
    <span style={{ fontWeight: '600', fontSize: '16px', letterSpacing: '0.5px' }}>
        Group Details
    </span>
</div>

        {/* --- FORM GRID START --- */}
        <div style={{ display: 'grid', gap: '15px' }}>
            
            {/* Row 1: Group Name, Persons, Amount */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '110px', fontWeight: '500', fontSize: '13px' }}>Group Name</label>
                    <input type="text" name="groupName" value={formData.groupName} onChange={handleChange} style={{ flex: 1, border: '1px solid #ced4da', padding: '6px 10px', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '110px', fontWeight: '500', fontSize: '13px' }}>No. of Persons</label>
                    <input type="number" name="numPersons" value={formData.numPersons} onChange={handleChange} style={{ flex: 1, border: '1px solid #ced4da', padding: '6px 10px', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '70px', fontWeight: '500', fontSize: '13px' }}>Amount</label>
                    <input type="number" name="amount" value={formData.amount} onChange={handleChange} style={{ flex: 1, border: '1px solid #ced4da', padding: '6px 10px', borderRadius: '4px' }} />
                </div>
            </div>

            {/* Row 2: Profile/Test & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <label style={{ width: '110px', fontWeight: '500', fontSize: '13px' }}>Profile/Test</label>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                            type="text" 
                            name="profileTest" 
                            value={formData.profileTest} 
                            onChange={handleSearchChange} 
                            onFocus={() => setShowDropdown(true)}
                            style={{ flex: 1, border: '1px solid #ced4da', padding: '6px 10px', borderRadius: '4px' }} 
                            placeholder="Type to search..."
                        />
                        <button onClick={handleAddTest} style={{ backgroundColor: '#4a148c', color: 'white', border: 'none', borderRadius: '4px', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PlusCircle size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                    {showDropdown && filteredProfiles.length > 0 && (
                        <ul className="custom-dropdown" style={{ left: '110px', width: 'calc(100% - 152px)' }}>
                            {filteredProfiles.map(item => (
                                <li key={item.id} onClick={() => { setFormData({...formData, profileTest: item.name, amount: item.amount, netAmount: item.amount, paidAmount: item.amount}); setShowDropdown(false); }}>
                                    <small style={{ backgroundColor: item.type === 'PROFILE' ? '#4a148c' : '#2e7d32', color: 'white', padding: '2px 5px', borderRadius: '3px', marginRight: '8px' }}>{item.type}</small>
                                    {item.name} (₹{item.amount})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '110px', fontWeight: '500', fontSize: '13px' }}>Location<span style={{color:'red'}}>*</span></label>
                    <select name="location" value={formData.location} onChange={handleChange} style={{ flex: 1, border: '1px solid #ced4da', padding: '6px 10px', borderRadius: '4px' }}>
                        <option value="">-Select-</option>
                        {locations.map(loc => <option key={loc.LocationID} value={loc.LocationCode}>{loc.LocationName}</option>)}
                    </select>
                </div>
            </div>

            {/* Row 3: Hospital & Referred By */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <label style={{ width: '110px', fontWeight: '500', fontSize: '13px' }}>Hospital Name</label>
                    <input 
                        type="text" 
                        name="hospitalName" 
                        value={formData.hospitalName} 
                        onChange={(e) => {
                            const val = e.target.value;
                            setFormData({...formData, hospitalName: val});
                            const filtered = hospitals.filter(h => h.HospitalName.toLowerCase().includes(val.toLowerCase()));
                            setFilteredHospitals(filtered);
                            setShowHospDropdown(true);
                        }} 
                        onFocus={() => hospitals.length > 0 && setShowHospDropdown(true)}
                        onBlur={() => setTimeout(() => setShowHospDropdown(false), 300)}
                        disabled={!formData.location}
                        style={{ flex: 1, border: '1px solid #ced4da', padding: '6px 10px', borderRadius: '4px', backgroundColor: !formData.location ? '#f8f9fa' : 'white' }} 
                        placeholder={formData.location ? "Search Hospital..." : "Select location first"}
                    />
                    {showHospDropdown && filteredHospitals.length > 0 && (
                        <ul className="custom-dropdown" style={{ left: '110px' }}>
                            {filteredHospitals.map(h => (
                                <li key={h.id} onClick={() => { setFormData({...formData, hospitalName: h.HospitalName}); setShowHospDropdown(false); }}>
                                    {h.HospitalName} <small style={{ color: '#666' }}>({h.LocationCode})</small>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <label style={{ width: '110px', fontWeight: '500', fontSize: '13px' }}>Referred By<span style={{color:'red'}}>*</span></label>
                    <input type="text" name="referredBy" value={formData.referredBy} onChange={handleDocSearch} onFocus={() => setShowDocDropdown(true)} style={{ flex: 1, border: '1px solid #ced4da', padding: '6px 10px', borderRadius: '4px' }} placeholder="Select Doctor..." />
                    {showDocDropdown && filteredDocs.length > 0 && (
                        <ul className="custom-dropdown" style={{ left: '110px' }}>
                            {filteredDocs.map(d => (
                                <li key={d.id} onClick={() => { setFormData({...formData, referredBy: d.doctor_name}); setShowDocDropdown(false); }}>{d.doctor_name}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Row 4: Client Code & Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <label style={{ width: '110px', fontWeight: '500', fontSize: '13px' }}>Client Code</label>
                    <input type="text" name="clientCode" value={formData.clientCode || ''} onChange={handleClientSearch} 
                        onFocus={() => { setFilteredClients(clients); setShowClientDropdown(true); }}
                        onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                        style={{ flex: 1, border: '1px solid #ced4da', padding: '6px 10px', borderRadius: '4px' }} 
                    />
                    {showClientDropdown && filteredClients.length > 0 && (
                        <ul className="custom-dropdown" style={{ left: '110px' }}>
                            {filteredClients.map(c => <li key={c.id} onClick={() => { setFormData(prev => ({...prev, clientCode: c.client_code, clientName: c.client_name })); setShowClientDropdown(false); }}>{c.client_code} - {c.client_name}</li>)}
                        </ul>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '110px', fontWeight: '500', fontSize: '13px' }}>Client Name</label>
                    <input type="text" value={formData.clientName || ''} readOnly style={{ flex: 1, border: '1px solid #ced4da', padding: '6px 10px', borderRadius: '4px', backgroundColor: '#f1f3f5', color: '#495057' }} />
                </div>
            </div>

            {/* Row 5: Sample Collect & Collected At */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: '110px', fontWeight: '500', fontSize: '13px' }}>Sample Collect</label>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <label style={{ cursor: 'pointer' }}><input type="checkbox" name="sampleCollect" value="Yes" checked={formData.sampleCollect === "Yes"} onChange={handleChange} style={{ marginRight: '5px' }} /> Yes</label>
                        <label style={{ cursor: 'pointer' }}><input type="checkbox" name="sampleCollect" value="No" checked={formData.sampleCollect === "No"} onChange={handleChange} style={{ marginRight: '5px' }} /> No</label>
                    </div>
                </div>
                {formData.sampleCollect === 'Yes' && (
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                        <label style={{ width: '110px', fontWeight: '500', fontSize: '13px' }}>Collected At</label>
                        <input type="text" value={formData.collectedAtName} onFocus={() => setShowCollectDropdown(true)} onChange={(e) => { const val = e.target.value; setFormData({...formData, collectedAtName: val}); const filtered = collectedAtList.filter(item => (item.name || "").toLowerCase().includes(val.toLowerCase())); setFilteredCollectedAt(filtered); }} onBlur={() => setTimeout(() => setShowCollectDropdown(false), 200)} style={{ flex: 1, border: '1px solid #ced4da', padding: '6px 10px', borderRadius: '4px' }} placeholder="Search center..." />
                        {showCollectDropdown && filteredCollectedAt.length > 0 && (
                            <ul className="custom-dropdown" style={{ left: '110px' }}>
                                {filteredCollectedAt.map(item => <li key={item.id} onClick={() => { setFormData({...formData, collectedAtName: item.name, collected_at_id: item.id }); setShowCollectDropdown(false); }}>{item.name}</li>)}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* Payment Mode */}
            <div style={{ padding: '15px', backgroundColor: '#fff9f9', borderRadius: '6px', border: '1px solid #ffeded' }}>
                <label style={{ color: '#d32f2f', fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Payment Mode*</label>
                <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
                    {['Cash', 'Card', 'Credit', 'Cheque', 'Digital payment'].map(mode => (
                        <label key={mode} style={{ fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <input type="checkbox" name="paymentMode" value={mode} checked={formData.paymentMode === mode} onChange={handleChange} style={{ marginRight: '8px' }} /> {mode}
                        </label>
                    ))}
                </div>
            </div>

            {/* Amount Section & Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
                <div style={{ display: 'flex', gap: '15px', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <label style={{ width: '80px', fontSize: '12px', fontWeight: '600' }}>Paid Amt <span style={{color:'orange'}}>●</span></label>
                        <input type="number" name="paidAmount" value={formData.paidAmount ?? ''} onChange={handleChange} style={{ width: '90px', border: '1px solid #ced4da', padding: '5px', borderRadius: '4px' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <label style={{ width: '80px', fontSize: '12px', fontWeight: '600' }}>Net Amt</label>
                        <input type="number" name="netAmount" value={formData.netAmount} readOnly style={{ width: '90px', border: '1px solid #ced4da', padding: '5px', borderRadius: '4px', backgroundColor: '#e9ecef' }} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handleSave} style={{ backgroundColor: '#4a148c', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', transition: '0.2s' }}>Submit</button>
                    <button onClick={handleReset} style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Reset</button>
                </div>
            </div>
        </div>

        {/* --- TABLE SECTION --- */}
        <div style={{ marginTop: '30px' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#4a148c', borderBottom: '2px solid #4a148c', paddingBottom: '3px' }}>Newly Added Tests</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa', color: '#333' }}>
                            <th style={{ border: '1px solid #dee2e6', padding: '12px' }}>Test Code</th>
                            <th style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'left' }}>Description</th>
                            <th style={{ border: '1px solid #dee2e6', padding: '12px' }}>Exist Amt</th>
                            <th style={{ border: '1px solid #dee2e6', padding: '12px' }}>Amount</th>
                            <th style={{ border: '1px solid #dee2e6', padding: '12px' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {addedTests.map((t, i) => (
                            <tr key={i} style={{ transition: '0.2s' }}>
                                <td style={{ border: '1px solid #dee2e6', padding: '10px', textAlign: 'center' }}>{t.TestCode || 'N/A'}</td>
                                <td style={{ border: '1px solid #dee2e6', padding: '10px' }}>{t.TestName}</td>
                                <td style={{ border: '1px solid #dee2e6', padding: '10px', textAlign: 'center' }}>{t.Amount || 0}</td>
                                <td style={{ border: '1px solid #dee2e6', padding: '10px', textAlign: 'center', fontWeight: '600' }}>{t.Amount || 0}</td>
                                <td style={{ border: '1px solid #dee2e6', padding: '10px', textAlign: 'center' }}>
                                    <span onClick={() => handleRemoveTest(i)} style={{ cursor: 'pointer', color: '#e03131', fontSize: '16px' }}>🗑️</span>
                                </td>
                            </tr>
                        ))}
                        <tr style={{ backgroundColor: '#f1f3f5', fontWeight: 'bold' }}>
                            <td colSpan="3" style={{ border: '1px solid #dee2e6', padding: '12px', textAlign: 'right' }}>Total Amount:</td>
                            <td colSpan="2" style={{ border: '1px solid #dee2e6', padding: '12px', color: '#4a148c', fontSize: '15px' }}>
                                ₹{addedTests.reduce((sum, item) => sum + (Number(item.Amount) || 0), 0)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p style={{ color: '#1c7ed6', fontSize: '12px', marginTop: '12px', fontStyle: 'italic' }}>
                <strong>Note:</strong> Click EDIT icon to edit the added Groups!!!
            </p>
        </div>
    </div>
</main>
            {/* MODAL SECTION  */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '4px', width: '400px', overflow: 'hidden', boxShadow: '0 8px 25px rgba(0,0,0,0.4)' }}>
                        
                        {/* Modal Header - Blue Grey */}
                        <div style={{ backgroundColor: '#a390ae', color: 'white', padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Bank Details</span>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '22px', lineHeight: '1' }}>&times;</button>
                        </div>
                        
                        {/* Modal Body - Cadet Blue */}
                        <div style={{ backgroundColor: '#4a148c', padding: '25px' }}>
                            
                            {formData.paymentMode === 'Card' && (
                                <>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ color: 'white', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Account Holder Name</label>
                                        <input type="text" value={paymentMeta.holder} onChange={(e) => setPaymentMeta({...paymentMeta, holder: e.target.value})} style={{ width: '100%', border: 'none', padding: '10px', backgroundColor: 'white' }} />
                                    </div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ color: 'white', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Account Number</label>
                                        <input type="text" value={paymentMeta.accNo} onChange={(e) => setPaymentMeta({...paymentMeta, accNo: e.target.value})} style={{ width: '100%', border: 'none', padding: '10px', backgroundColor: 'white' }} />
                                    </div>
                                </>
                            )}

                            {formData.paymentMode === 'Cheque' && (
                                <>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ color: 'white', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Cheque Number</label>
                                        <input type="text" value={paymentMeta.chqNo} onChange={(e) => setPaymentMeta({...paymentMeta, chqNo: e.target.value})} style={{ width: '100%', border: 'none', padding: '10px', backgroundColor: 'white' }} />
                                    </div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ color: 'white', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Bank Details</label>
                                        <input type="text" value={paymentMeta.bank} onChange={(e) => setPaymentMeta({...paymentMeta, bank: e.target.value})} style={{ width: '100%', border: 'none', padding: '10px', backgroundColor: 'white' }} />
                                    </div>
                                </>
                            )}

                            {formData.paymentMode === 'Digital payment' && (
                                <>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ color: 'white', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Transaction ID</label>
                                        <input type="text" value={paymentMeta.txId} onChange={(e) => setPaymentMeta({...paymentMeta, txId: e.target.value})} style={{ width: '100%', border: 'none', padding: '10px', backgroundColor: 'white' }} />
                                    </div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ color: 'white', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Mode (UPI/GPay)</label>
                                        <input type="text" value={paymentMeta.mode} onChange={(e) => setPaymentMeta({...paymentMeta, mode: e.target.value})} style={{ width: '100%', border: 'none', padding: '10px', backgroundColor: 'white' }} />
                                    </div>
                                </>
                            )}

                            {/* White Accent Bar */}
                            <div style={{ height: '10px', backgroundColor: 'white', marginTop: '20px', borderRadius: '5px', opacity: '0.7' }}></div>
                            
                            <button 
                                onClick={() => setShowModal(false)}
                                style={{ marginTop: '20px', width: '100%', padding: '10px', border: 'none', backgroundColor: '#a390ae', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

                        {/*Footer*/}
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

export default AddGroup;