import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, TextField, Button
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { User, ShieldCheck, Building2 } from 'lucide-react';
import {Search, Home, Mail, MapPin } from 'lucide-react';

function PatientDetailScreen() {
    const location = useLocation();
    const navigate = useNavigate();
    const { patient } = location.state || {};
    const [locations, setLocations] = useState([]);
    const [clients, setClients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [testList, setTestList] = useState([]);
    const [billingType, setBillingType] = useState('self');
    const [collectionCenters, setCollectionCenters] = useState([]);
    const [selectedCollectionId, setSelectedCollectionId] = useState('');
    const [hospitalName, setHospitalName] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [hospitals, setHospitals] = useState([]); 
    const [selectedHospitalId, setSelectedHospitalId] = useState(''); 
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedTests, setSelectedTests] = useState([]); 
    const [currentTestJson, setCurrentTestJson] = useState(''); 
    const [insurancePayer, setInsurancePayer] = useState('');
    const [policyNumber, setPolicyNumber] = useState('');
    const [policyExpiry, setPolicyExpiry] = useState('');
    const [paymentMeta, setPaymentMeta] = useState({
            holder: '', accNo: '', chqNo: '', bank: '', txId: '', mode: ''
        });
        
    const [formData, setFormData] = useState({
            groupName: '', numPersons: '', amount: '',
            profileTest: '', location: '', hospitalName: '',
            referredBy: '', clientCode: '', clientName: '',
            sampleCollect: '', paymentMode: '', paidAmount: '', netAmount: '',collectedAtName: '',
        collected_at_id: '',  
        });
    const [amountPaid, setAmountPaid] = useState(0);
    const [paymentModes, setPaymentModes] = useState({ Cash: false, Card: false, UPI: false, Credit: false });
    const totalAmount = selectedTests.reduce((sum, test) => sum + parseFloat(test.amount || 0), 0);
    const dueBalance = totalAmount - amountPaid;
    const addTest = () => {
        if (!currentTestJson) return;
        const testObj = JSON.parse(currentTestJson);
        if (selectedTests.find(t => t.id === testObj.id)) return alert("Test already added");
        
        setSelectedTests([...selectedTests, testObj]);
        setCurrentTestJson(''); 
    };

    const removeTest = (id) => {
        setSelectedTests(selectedTests.filter(t => t.id !== id));
    };

const handleGenerateInvoice = async () => {
    const isCredit = paymentModes['Credit'];
    const paymentModesString = Object.keys(paymentModes).filter(m => paymentModes[m]).join('/');
    
    // Status Logic: Credit always remains 'Pending' regardless of math
    const finalStatus = isCredit ? 'Pending' : (dueBalance <= 0 ? 'Approved' : 'Pending');

    const testsWithBillingDetails = selectedTests.map(test => {
        const type = test.item_type?.toLowerCase();
        const isProfile = type === 'profile' || (test.test_code && test.test_code.startsWith('PR'));

        return {
            PatientID: patient.PatientID,
            patient_name: patient.patient_name,
            TestID: isProfile ? null : test.id,
            profile_id: isProfile ? test.id : null,
            test_code: test.test_code || test.TestCode, 
            item_type: type,
            Amount: test.amount,
            billing_type: billingType,
            location_code: selectedLocation,
            doctor_id: selectedDoctorId,
            
            // Waterfall logic fix: If Credit, force paid to 0 and balance to full amount
            amount_paid: isCredit ? 0 : amountPaid, 
            balance: isCredit ? test.amount : dueBalance, 
            
            payment_modes: paymentModesString,
            Status: finalStatus,
            client_code: selectedClientId,
            group_name: patient.group_name || null,
            insurance_payer: billingType === 'insurance' ? insurancePayer : null,
            policy_no: billingType === 'insurance' ? policyNumber : null,
            hospital_name: billingType === 'out' ? hospitalName : null,
            collected_at_id: billingType === 'self' ? selectedCollectionId : null,
            
            // Bank details (Null if Credit)
          
        acc_holder: isCredit ? null : (paymentMeta.holder || null),
        acc_no: isCredit ? null : (paymentMeta.accNo || null),
        cheque_no: isCredit ? null : (paymentMeta.chqNo || null),
        bank_name: isCredit ? null : (paymentMeta.bank || null),
        trans_id: isCredit ? null : (paymentMeta.txId || null),
        digital_mode: isCredit ? null : (paymentMeta.mode || null),
        // Ensure policy_no matches backend record.policy_no
        policy_no: billingType === 'insurance' ? policyNumber : null,
        };
    });

    try {
        const response = await fetch('http://localhost:5000/api/save-billing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                billingRecords: testsWithBillingDetails,
                invoice_no: 'INV-' + Date.now(),
                sample_id: 'SMP-' + Math.floor(1000 + Math.random() * 9000)
            })
        });
        const result = await response.json();
        if (result.success) {
            navigate('/edit-invoice', { state: { invoiceNo: result.invoice_no } });
        }
    } catch (err) {
        console.error("Save Error:", err);
    }
};


    useEffect(() => {
        const loadAllData = async () => {
            try {
                const locRes = await fetch('http://localhost:5000/api/get-locations');
                const locData = await locRes.json();
                setLocations(Array.isArray(locData) ? locData : locData.data || []);

                const clientRes = await fetch('http://localhost:5000/api/get-clients');
                const clientData = await clientRes.json();
                if (clientData.success && Array.isArray(clientData.data)) {
                    setClients(clientData.data);
                }

                const metaRes = await fetch('http://localhost:5000/api/registration-metadata');
                const metaData = await metaRes.json();
                setDoctors(metaData.doctors || []);

                const testRes = await fetch('http://localhost:5000/api/get-lab-tests');
                const testData = await testRes.json();
                setTestList(Array.isArray(testData) ? testData : testData.data || []);

                const colRes = await fetch('http://localhost:5000/api/collected-at');
        const colData = await colRes.json();
        setCollectionCenters(colData.success ? colData.data : []);

            } catch (error) {
                console.error("Data loading failed:", error);
            }
        };
        loadAllData();
    }, []);
    useEffect(() => {

const fetchHospitals = async () => {
        try {
            const url = selectedLocation 
                ? `http://localhost:5000/api/get-hospitals?locationCode=${selectedLocation}`
                : `http://localhost:5000/api/get-hospitals`;
                
            const response = await fetch(url);
            const result = await response.json();
            if (result.success) {
                setHospitals(result.data);
            }
        } catch (err) {
            console.error("Error fetching hospitals:", err);
        }
    };

    if (billingType === 'out') {
        fetchHospitals();
    }
}, [selectedLocation, billingType]); 

const [insuranceList, setInsuranceList] = useState([]);

useEffect(() => {
    fetch('http://localhost:5000/api/get-saved-insurances')
        .then(res => res.json())
        .then(data => {
            if (data.success) setInsuranceList(data.data);
        });
}, []);

    if (!patient) return (
        <div style={{ padding: '50px', textAlign: 'center', color: '#4a148c' }}>
            <h2>No Patient Context Found</h2>
            <button onClick={() => navigate('/frontdesk')} style={styles.submitBtn}>Return to Home</button>
        </div>
    );

    return (
        <div style={styles.container}>
            <div style={styles.topHeader}>
                <div style={styles.headerLeft}>
                    <div style={styles.breadcrumb}>
                        Front Desk / <span style={{color: '#fff', fontWeight: 'bold'}}>Workflow</span>
                    </div>
                </div>
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
            </div>

            <div style={{ display: 'flex', flex: 1, marginTop: '70px' }}>
                <div style={styles.sidebar}>
                    <div style={styles.avatarCircle}>
                        {patient.patient_name?.charAt(0).toUpperCase()}
                    </div>
                    <h3 style={styles.patientName}>{patient.patient_name}</h3>
                    <p style={styles.patientId}>ID: {patient.PatientID}</p>
                    
                    <div style={styles.infoGrid}>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>AGE</span>
                            <span style={styles.infoValue}>{patient.age} Years</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>GENDER</span>
                            <span style={styles.infoValue}>{patient.gender || 'Not Specified'}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>PHONE</span>
                            <span style={styles.infoValue}>{patient.phone_no || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <button onClick={() => navigate('/frontdesk')} style={styles.homeBtn}>
                        ← Back to Dashboard
                    </button>
                </div>

                <div style={styles.mainContent}>

<div style={styles.tabContainer}>
    {['self', 'insurance', 'out'].map((type) => {
        const getIcon = () => {
            const iconProps = { 
                size: 18, 
                style: { marginRight: '8px' }, 
                strokeWidth: billingType === type ? 2.5 : 2 
            };
            
            switch(type) {
                case 'self': return <User {...iconProps} />;
                case 'insurance': return <ShieldCheck {...iconProps} />;
                case 'out': return <Building2 {...iconProps} />;
                default: return null;
            }
        };

        return (
            <div 
                key={type}
                onClick={() => setBillingType(type)}
                style={{
                    ...styles.tab,
                    display: 'flex',      
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    ...(billingType === type ? styles.activeTab : {})
                }}
            >
                {getIcon()}
                {type === 'out' ? 'OUT OF HOSPITAL' : `${type.toUpperCase()} PAY`}
            </div>
        );
    })}
</div>

<div style={styles.formCard}>
    <div style={styles.formGrid}>
       {/* 1. LOCATION - Always Visible */}
<div style={styles.inputGroup}>
    <label style={styles.label}>Location*</label>
    <select 
        style={styles.select} 
        value={selectedLocation} 
        onChange={(e) => setSelectedLocation(e.target.value)}
    >
        <option value="">Select Branch</option>
        {locations.map((loc, index) => (
            <option 
                key={`loc-${loc.id || loc.LocationID || index}`} 
                value={loc.LocationCode}
            >
                {loc.LocationName}
            </option>
        ))}
    </select>
</div>

        {/* --- CONDITIONAL FIELDS --- */}
        {(billingType === 'self' || billingType === 'out') && (
            <>
                {/* Client Code & Name */}
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Client Code & Name*</label>
                    <div style={{display: 'flex', gap: '8px'}}>
                        <select 
                            style={{...styles.input, width: '120px'}} 
                            value={selectedClientId} 
                            onChange={(e) => setSelectedClientId(e.target.value)}
                        >
                            <option value="">Code</option>
                            {clients.map(c => <option key={`cli-code-${c.id}`} value={c.id}>{c.client_code}</option>)}
                        </select>
                        <select 
                            style={styles.select} 
                            value={selectedClientId} 
                            onChange={(e) => setSelectedClientId(e.target.value)}
                        >
                            <option value="">Select Client Name</option>
                            {clients.map(c => <option key={`cli-name-${c.id}`} value={c.id}>{c.client_name}</option>)}
                        </select>
                    </div>
                </div>

                {/* SWITCH: Collected At (Self) VS Hospital Dropdown (Out) */}
                {billingType === 'self' ? (
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Collected At*</label>
                        <select 
                            style={styles.select} 
                            value={selectedCollectionId} 
                            onChange={(e) => setSelectedCollectionId(e.target.value)}
                        >
                            <option value="">Select Center</option>
                            {collectionCenters.map(center => (
                                <option key={`col-${center.id}`} value={center.id}>{center.name}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Hospital Name*</label>
                        <select 
                            style={styles.select} 
                            value={hospitalName} 
                            onChange={(e) => setHospitalName(e.target.value)}
                        >
                            <option value="">Select Hospital...</option>
                            {hospitals.map(h => (
                                <option key={`hosp-${h.id}`} value={h.HospitalName}>{h.HospitalName}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Common Field: Referral Doctor */}
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Referral Doctor*</label>
                    <select 
                        style={styles.select} 
                        value={selectedDoctorId} 
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                    >
                        <option value="">Select Doctor...</option>
                        {doctors.map(doc => (
                            <option key={`doc-${doc.id}`} value={doc.id}>{doc.doctor_name}</option>
                        ))}
                    </select>
                </div>
            </>
        )}

        {billingType === 'insurance' && (
            <>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Insurance Provider*</label>
                    <select 
                        style={styles.select} 
                        value={insurancePayer} 
                        onChange={(e) => {
                            const selectedName = e.target.value;
                            setInsurancePayer(selectedName);
                            const selectedIns = insuranceList.find(ins => ins.insurance_name === selectedName);
                            if (selectedIns) {
                                setPolicyNumber(selectedIns.policy_tpa_number);
                            } else {
                                setPolicyNumber('');
                            }
                        }}
                    >
                        <option value="">Select Company...</option>
                        {insuranceList.map((ins) => (
                            <option key={`ins-${ins.id}`} value={ins.insurance_name}>{ins.insurance_name}</option>
                        ))}
                    </select>
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Policy / TPA Number*</label>
                    <input 
                        type="text" 
                        style={{...styles.input, backgroundColor: '#f0f0f0'}} 
                        placeholder="Auto-filled Policy ID" 
                        value={policyNumber} 
                        readOnly 
                    />
                </div>
            </>
        )}

        {/* --- TESTS SECTION --- */}
        <div style={styles.inputGroup}>
            <label style={styles.label}>Add Tests / Profiles*</label>
            <div style={{display: 'flex', gap: '8px'}}>
                <select 
                    style={styles.select} 
                    value={currentTestJson} 
                    onChange={(e) => setCurrentTestJson(e.target.value)}
                >
                    <option value="">Select Item...</option>
                    {testList.map((item, index) => (
                        <option key={`opt-${item.item_type}-${item.id}-${index}`} value={JSON.stringify(item)}>
                            {item.item_type === 'profile' ? '[P] ' : '[T] '} 
                            {item.name} - ₹{item.amount}
                        </option>
                    ))}
                </select>
                <button style={styles.addBtn} onClick={addTest}>+</button>
            </div>
        </div>
    </div>

    {/* Selected Tests Display */}
    {selectedTests.length > 0 && (
        <div style={{ margin: '20px 0', padding: '15px', background: '#f3e5f5', borderRadius: '12px' }}>
            {selectedTests.map((t, index) => (
                <div key={`sel-${t.item_type}-${t.id}-${index}`} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '8px 0', 
                    borderBottom: '1px solid #eee' 
                }}>
                    <span style={{ color: '#333' }}>
                        {t.item_type === 'profile' ? '[P] ' : '[T] '} 
                        {t.name || t.profile_name} 
                    </span>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: '500' }}>₹{t.amount}</span>
                        <button 
                            onClick={() => removeTest(t.id)} 
                            style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 5px' }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )}

    {/* --- BILLING SUMMARY --- */}
    <div style={styles.paymentSection}>
        <h4 style={styles.sectionTitle}>Billing Summary</h4>
        <div style={styles.paymentModes}>
            {['Cash', 'Card', 'UPI', 'Cheque', 'Credit'].map(m => (
    <label key={`pay-${m}`} style={styles.checkboxLabel}>
        <input 
            type="checkbox" 
            checked={paymentModes[m]} 
            onChange={(e) => {
                const isChecked = e.target.checked;
                
                if (m === 'Credit' && isChecked) {
                    // 1. Set Amount Paid to 0
                    setAmountPaid(0);
                    // 2. Clear other payment modes and only keep Credit
                    setPaymentModes({ Cash: false, Card: false, UPI: false, Cheque: false, Credit: true });
                } else {
                    // Normal behavior for other modes
                    setPaymentModes({...paymentModes, [m]: isChecked, Credit: false});
                    
                    if (isChecked && ['Card', 'UPI', 'Cheque'].includes(m)) {
                        setFormData(prev => ({ ...prev, paymentMode: m === 'UPI' ? 'Digital payment' : m }));
                        setShowModal(true);
                    }
                }
            }}
        /> {m}
    </label>
))}
        </div>
        
        <div style={styles.amountGrid}>
            <div style={styles.amountBox}>
                <span>Total Amount</span>
                <input style={styles.amountInput} value={totalAmount.toFixed(2)} readOnly />
            </div>
            <div style={styles.amountBox}>
    <span style={{color: '#2e7d32'}}>Amount Paid</span>
    <input 
        type="number"
        style={{
            ...styles.amountInput, 
            borderColor: '#2e7d32',
            backgroundColor: paymentModes['Credit'] ? '#f5f5f5' : 'white' 
        }} 
        value={amountPaid}
        readOnly={paymentModes['Credit']} 
        onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
    />
</div>
            <div style={styles.amountBox}>
                <span style={{color: '#d32f2f'}}>Due Balance</span>
                <input style={styles.amountInput} value={(totalAmount - amountPaid).toFixed(2)} readOnly />
            </div>
        </div>
    </div>

    <div style={styles.footer}>
        <button style={styles.cancelBtn} onClick={() => { setSelectedTests([]); setAmountPaid(0);  setSelectedClientId([]); setSelectedLocation([]); setSelectedCollectionId([]); setSelectedDoctorId([]);}}>Reset</button>
        <button style={styles.submitBtn} onClick={handleGenerateInvoice}>Generate Invoice →</button>
    </div>
</div>
</div>
            </div>
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
            
            {/* MODAL SECTION */}
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
        </div>
    );
}


const styles = {
container: { display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f0d4f5', fontFamily: "'Inter', sans-serif" },
topHeader: { height: '70px', backgroundColor: '#4a148c', display: 'grid', gridTemplateColumns: '320px 1fr 320px', alignItems: 'center', padding: '0 30px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 },
headerLeft: { display: 'flex', justifyContent: 'flex-start' },
headerRight: { display: 'flex', justifyContent: 'flex-end' },
logoSection: { display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' },
pulseDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)' },
logoText: { fontSize: '18px', fontWeight: 'bold', color: '#fff', letterSpacing: '2px' },
breadcrumb: { fontSize: '12px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' },
systemStatus: { fontSize: '11px', color: '#b9f6ca', fontWeight: '700', letterSpacing: '0.5px' },
sidebar: { width: '300px', background: 'linear-gradient(180deg, #4a148c 0%, #2e0d5a 100%)', padding: '30px 25px', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '4px 0 20px rgba(0,0,0,0.1)', height: 'fit-content', borderRadius: '0 0 20px 0', marginTop: '20px', marginLeft: '10px' },
avatarCircle: { width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.3)', transform: 'rotate(-5deg)' },
patientName: { margin: '0', fontSize: '20px', fontWeight: '600', textAlign: 'center' },
patientId: { color: '#b39ddb', fontSize: '13px', marginBottom: '30px' },
infoGrid: { width: '100%', display: 'grid', gap: '15px' },
infoItem: { borderLeft: '3px solid #7b1fa2', paddingLeft: '15px' },
infoLabel: { display: 'block', fontSize: '11px', color: '#b39ddb', letterSpacing: '1px', marginBottom: '2px' },
infoValue: { fontSize: '14px', fontWeight: '500' },
homeBtn: { marginTop: '40px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '12px', borderRadius: '12px', cursor: 'pointer', width: '100%', transition: '0.3s' },
mainContent: { flex: 1, padding: '40px' },
tabContainer: { display: 'flex', gap: '15px', marginBottom: '25px' },
tab: { padding: '12px 25px', backgroundColor: '#fff', borderRadius: '12px', color: '#666', fontWeight: '600', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #eee' },
activeTab: { backgroundColor: '#4a148c', color: '#fff', borderColor: '#4a148c' },
formCard: { backgroundColor: '#fff', borderRadius: '20px', padding: '35px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' },
formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '2px' },
inputGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
label: { fontSize: '13px', fontWeight: 'bold', color: '#444' },
input: { padding: '14px', borderRadius: '12px', border: '1.5px solid #eee', outline: 'none', fontSize: '14px', backgroundColor: '#fafafa' },
selectContainer: {position: 'relative',display: 'flex',flexDirection: 'column',gap: '10px',width: '100%'},
selectWrapper: {position: 'relative',width: '100%',},
select: { width: '100%',padding: '12px 16px',borderRadius: '12px',border: '1.5px solid #e0e0e0',outline: 'none',backgroundColor: '#ffffff',fontSize: '14px',color: '#333',appearance: 'none', cursor: 'pointer',transition: 'all 0.2s ease-in-out',boxShadow: '0 2px 4px rgba(0,0,0,0.02)',},
selectArrow: {position: 'absolute',right: '15px',top: '50%',transform: 'translateY(-50%)',pointerEvents: 'none',color: '#4a148c', fontSize: '12px',opacity: '0.7'},
selectFocus: {borderColor: '#4a148c',boxShadow: '0 0 0 3px rgba(74, 20, 140, 0.1)',backgroundColor: '#fff',},
addBtn: { backgroundColor: '#4a148c', color: 'white', border: 'none', width: '50px', borderRadius: '12px', cursor: 'pointer', fontSize: '20px' },
paymentSection: { backgroundColor: '#fdfbff', padding: '25px', borderRadius: '16px', border: '1px solid #f3e5f5' },
sectionTitle: { color: '#4a148c', margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' },
paymentModes: { display: 'flex', gap: '25px', marginBottom: '25px' },
checkboxLabel: { fontSize: '14px', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
amountGrid: { display: 'flex', gap: '30px' },
amountBox: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
amountInput: { padding: '12px', borderRadius: '10px', border: '2px solid #eee', fontSize: '18px', fontWeight: 'bold', textAlign: 'right' },
footer: { display: 'flex', gap: '20px', marginTop: '40px', justifyContent: 'flex-end' },
submitBtn: { backgroundColor: '#4a148c', color: 'white', padding: '15px 40px', borderRadius: '14px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' },
cancelBtn: { backgroundColor: '#4a148c', color: 'white', padding: '15px 30px', borderRadius: '14px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
};

export default PatientDetailScreen;










