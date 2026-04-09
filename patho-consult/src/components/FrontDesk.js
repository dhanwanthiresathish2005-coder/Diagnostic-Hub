import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import Swal from 'sweetalert2';
import { Typography, Button, IconButton, CircularProgress, Box, Paper } from '@mui/material';
import { FaHome, FaTimes, FaFilter } from 'react-icons/fa';
import { Business, ExpandLess, ExpandMore, Groups } from '@mui/icons-material';
import { useNotifications, } from './NotificationContext';
import { PersonAdd, Close } from '@mui/icons-material';
import { People} from '@mui/icons-material';
import HomeIcon from '@mui/icons-material/Home';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TextField } from '@mui/material';
import { TablePagination} from '@mui/material';

function FrontDesk() {
    
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("Patient Registration");
    const [isGroupOpen, setIsGroupOpen] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState("");
    const [metadata, setMetadata] = useState({ titles:[], doctors:[], groups:[], tests:[], profiles:[]});
    const [patients, setPatients] = useState([]); 
    const [searchTerm, setSearchTerm] = useState("");
    const [availableGroupTests, setAvailableGroupTests] = useState([]);
    const [category, setCategory] = useState(null); 
    const [groups, setGroups] = useState([]); 
     const { notifications, clearNotifications } = useNotifications();
     const hasNotified = useRef(false);
     const { addNotification } = useNotifications();
    const STATUS_CONFIG = {
    Approved: { label: 'COMPLETED', color: '#2e7d32' },  
    Pending: { label: 'DUE / PENDING', color: '#d32f2f' }, 
    Due: { label: 'PAYMENT DUE', color: '#d32f2f' },
    New: { label: 'REGISTERED', color: '#7b1fa2' }       
};
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

const [filterType, setFilterType] = useState("All"); 

const [isGroupBillingOpen, setIsGroupBillingOpen] = useState(false);
const [groupList, setGroupList] = useState([]);
const [showGroupTable, setShowGroupTable] = useState(false);
const [billingHistory, setBillingHistory] = useState([]);

const [testList, setTestList] = useState([]); 
const [doctors, setDoctors] = useState([]);   

    // --- 1. MODAL STATES ---
const [decisionModal, setDecisionModal] = useState({ 
    show: false, 
    title: '', 
    onConfirm: null, 
    onCancel: null 
});

const [successModal, setSuccessModal] = useState({ 
    show: false, 
    type: '', 
    message: '' 
});

    
    const [formData, setFormData] = useState({
        title_id: '',
        patient_name: '',
        gender: '',
        phone_no: '',
        email: '',
        age: '',
        dob: '',
        doctor_id: '',
        door_no: '',
    flat_name: '',
    street_name1: '',
    street_name2: '',
    state: '',
    city: '',
    pincode: '',
    country: '',
    phone_home: '',
    locality: '',
    marital_status: '',
    notify_sms: false,
    notify_email: false,
    group_name: '',
    group_amount: '',
    group_total_persons: '',
    group_to_be_registered: '',
    group_client_code: '',
    social_relationship: '',
    social_name: '',
    employment_status: '',
    employer_name: '',
    employer_address: '',
    social_city: '',
    social_pincode: '',
    social_state: '',
    income_group: '',
    external_id: '', 
    client_code: '', 
    GroupID: '', 
    TestID: '',  
    profile_id: '', 
    });
    // --- Data Grid Logic ---
const [sortConfig, setSortConfig] = useState({ key: 'patient_name', direction: 'asc' });

const [columnFilters, setColumnFilters] = useState({ patient_name: '', PatientID: '', gender: '' });
const [payDueModal, setPayDueModal] = useState({ show: false, patient: null });
const [collectAmount, setCollectAmount] = useState("");

const [collectedAmount, setCollectedAmount] = useState("");
const [groupInvoiceModal, setGroupInvoiceModal] = useState({ show: false, patient: null });
const [groupPaymentModal, setGroupPaymentModal] = useState({ show: false, data: null });
const [selectedPaymentMode, setSelectedPaymentMode] = useState("Cash"); 
const [showPatientTable, setShowPatientTable] = useState(false);
const [selectedGroupData, setSelectedGroupData] = useState(null);
const [quickPayModal, setQuickPayModal] = useState({ show: false, data: {} });
const [paymentAmount, setPaymentAmount] = useState("");
const [paymentMode, setPaymentMode] = useState("Cash");
const [availableTests, setAvailableTests] = useState([]);


useEffect(() => {
    const fetchTests = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/tests'); 
            setAvailableTests(response.data);
        } catch (err) {
            console.error("Error fetching tests:", err);
        }
    };
    fetchTests();
}, []);


// --- 1. FILTERING LOGIC (Must be first) ---
const filteredPatients = patients.filter(p => {
    // 1. Top-level & Column Filters (Remain the same)
    const matchesSearch = 
        p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.PatientID.toString().includes(searchTerm) ||
        (p.phone_no && p.phone_no.includes(searchTerm));

    const matchesColumnFilters = 
        p.patient_name.toLowerCase().includes(columnFilters.patient_name.toLowerCase()) &&
        p.PatientID.toString().includes(columnFilters.PatientID) &&
        p.gender.toLowerCase().includes(columnFilters.gender.toLowerCase());

   
    const hasBalance = parseFloat(p.balance || 0) > 0;
    let matchesStatus = true;

    if (filterType === 'Pending') {
        matchesStatus = (p.current_status === 'Pending' || hasBalance);
    } 
    else if (filterType === 'Approved') {
        matchesStatus = (p.current_status === 'Approved' && !hasBalance);
    }
    
    return matchesSearch && matchesColumnFilters && matchesStatus;
});


const [currentPage, setCurrentPage] = useState(0); 
const [rowsPerPage, setRowsPerPage] = useState(5);
const handleChangePage = (event, newPage) => {
    setCurrentPage(newPage);
};
const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
};
const indexOfLastRow = (currentPage + 1) * rowsPerPage;
const indexOfFirstRow = indexOfLastRow - rowsPerPage;
const currentRows = filteredPatients.slice(indexOfFirstRow, indexOfLastRow);
const sortedPatients = [...filteredPatients].sort((a, b) => {
    const aValue = a[sortConfig.key] || "";
    const bValue = b[sortConfig.key] || "";
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
});

// --- 3. PAGINATION LOGIC (Must be third) ---
const totalPages = Math.ceil(sortedPatients.length / rowsPerPage);
const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: value
    }));
};

const submitFinalGroupRegistration = async () => {
    Swal.fire({
        title: 'Processing Registration...',
        didOpen: () => { Swal.showLoading(); },
        allowOutsideClick: false
    });

    try {
        let currentGroupId = formData.GroupID;

        if (!currentGroupId) {
            const profileTestString = Array.isArray(formData.selectedTests) 
                ? formData.selectedTests.map(t => t.TestName).join(', ') 
                : formData.ProfileTest || "";

            const gRes = await fetch('http://localhost:5000/api/register-group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    group_name: formData.group_name,
                    group_amount: formData.group_amount,
                    total_persons: formData.group_total_persons,
                    client_code: formData.client_code,
                    hospital_name: formData.hospital_name || formData.HospitalName, 
                    referred_by: formData.referred_by || formData.doctor_name,
                    profile_test: profileTestString,
                    location_code: formData.location_code
                })
            });
            const gData = await gRes.json();
            if (gData.success) {
                currentGroupId = gData.groupId;
            } else {
                
                return Swal.fire("Group Error", gData.message || "Failed to create group", "error");
            }
        }

        
        const finalData = { ...formData, GroupID: currentGroupId, current_status: 'Approved' };
        const pRes = await fetch('http://localhost:5000/api/register-patient', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalData)
        });

        const pData = await pRes.json();
        
        if (pRes.ok && pData.patientId) {
            
            const billingResponse = await fetch('http://localhost:5000/api/save-group-billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    PatientID: pData.patientId,
                    patient_name: formData.patient_name,
                    doctor_id: formData.doctor_id,
                    amount: formData.group_amount,
                    payment_modes: formData.payment_mode || 'Cash',
                    group_name: formData.group_name,
                    client_code: formData.client_code,
                    TestID: formData.TestID || formData.test_id,      
                    profile_id: formData.profile_id || formData.ProfileID,
                    collected_at_id: formData.collected_at_id || formData.location_id,
                    test_names: formData.test_names || formData.ProfileTest,
                    billing_type: 'group' 
                })
            });
            
            const billResult = await billingResponse.json();
            Swal.close(); 

            if (billResult.success) {
                
                Toast.fire({
                    icon: 'success',
                    title: 'Group Registration & Billing saved!'
                });
                setIsGroupBillingOpen(false);
                fetchPatients(); 
                resetForm(); 
            } else {
                Swal.fire("Billing Error", "Patient registered, but billing failed.", "warning");
            }
        } else {
            Swal.close();
            Swal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: pData.message || "Please check all required fields."
            });
        }
    } catch (err) {
        Swal.close();
        console.error("Submission Error:", err);
        Toast.fire({ icon: 'error', title: 'Critical connection error' });
    }
};

const handleAutoFillGroup = async (groupId) => {
    if (!groupId) return;
    try {
        const res = await fetch(`http://localhost:5000/api/get-group-count/${groupId}`);
        const data = await res.json();
        const alreadyRegistered = data.count || 0;

        setFormData(prev => {
            const total = parseInt(prev.group_total_persons) || 0;
            const remaining = total - alreadyRegistered;
            return {
                ...prev,
                group_to_be_registered: remaining > 0 ? remaining : 0
            };
        });
    } catch (err) {
        console.error("Error fetching group registration count:", err);
    }
};

const fetchBillingHistory = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/get-billing-history');
        const data = await response.json();
        setBillingHistory(data);
    } catch (err) {
        console.error("Error fetching billing history:", err);
    }
};


useEffect(() => {
    fetchBillingHistory();
}, []);

const handleGroupFilter = (e, column) => {
    const term = e.target.value.toLowerCase();
    const filtered = groupList.filter(g => 
        g.GroupName.toLowerCase().includes(term) || 
        g.ClientCode.toLowerCase().includes(term)
    );
    setGroupList(filtered);
};


useEffect(() => {
    if (patients.length > 0 && !hasNotified.current) {
        const pendingCount = patients.filter(p => {
            const balance = parseFloat(p.balance || 0);
            return balance > 0 || p.current_status === 'Pending' || p.Status === 'Pending';
        }).length;

        if (pendingCount > 0) {
            addNotification(
                `Attention: You have ${pendingCount} patients in the DUE / PENDING list.`, 
                'pending'
            );
            hasNotified.current = true;
        }
    }
}, [patients, addNotification]);


const fetchGroups = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/get-groups'); 
        const data = await response.json();
        // If your API wraps the array in a 'data' property:
        setGroupList(Array.isArray(data) ? data : data.groups || []);
    } catch (err) {
        console.error("Error fetching groups:", err);
    }
};
// --- 4. HANDLER FUNCTIONS ---
const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
};

const handleColumnFilter = (e, column) => {
    setColumnFilters({ 
        ...columnFilters, 
        [column]: e.target.value 
    });
    setCurrentPage(1); 
};

const handleFilterChange = (e, column) => {
    setColumnFilters({ ...columnFilters, [column]: e.target.value });
    setCurrentPage(1); // Reset to page 1 when filtering
};

    const fetchPatients = async () => {
      
    try {
        const res = await fetch('http://localhost:5000/api/get-all-patients');
        const data = await res.json();
        setPatients(data); 
    } catch (err) {
        console.error("Error fetching patient list:", err);
    }
};

const handleSelectPatient = (patient) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setFormData({
        ...formData,
        // 1. Internal DB ID (Crucial for SQL WHERE clauses)
        id: patient.id, 
        
        // 2. Display ID (The P-1014 code)
        PatientID: patient.PatientID || patient.id, 
        
        patient_name: patient.patient_name,
        gender: patient.gender,
        phone_no: patient.phone_no,
        email: patient.email || '',
        age: patient.age,
        external_id: patient.external_id,
        GroupID: patient.GroupID,
        group_name: patient.group_name || '',
        door_no: patient.door_no || '',
        street_name1: patient.street_name1 || '',
        city: patient.city || '',
        state: patient.state || '',
        pincode: patient.pincode || '',
        marital_status: patient.marital_status || ''
    });

    if (patient.GroupID || patient.group_name) {
        setIsGroupOpen(true);
    }
};

const handleQuickPaySubmit = async () => {
    const patientData = payDueModal.patient || {};
    
    // 1. DATA EXTRACTION
    // Since we fixed the backend, recordId will now correctly hold the primary key 'id'
    const recordId = patientData.id; 
    const amountDue = parseFloat(patientData.Amount || 0);
    const previouslyPaid = parseFloat(patientData.amount_paid || 0);
    const payAmount = parseFloat(collectedAmount); // The amount entered in the input

    // 2. SAFETY GUARDS
    if (!recordId) {
        return Swal.fire("Error", "Internal Record ID is missing. Please refresh the page.", "error");
    }

    if (isNaN(payAmount) || payAmount <= 0) {
        return Swal.fire("Invalid Amount", "Please enter a valid amount to pay.", "warning");
    }

    // 3. BALANCE VALIDATION
    const currentBalance = amountDue - previouslyPaid;
    // Adding 0.01 to handle floating point math issues
    if (payAmount > (currentBalance + 0.01)) { 
        return Swal.fire("Overpayment", `Remaining balance is only ₹${currentBalance.toFixed(2)}`, "error");
    }

    // 4. API CALL
    Swal.fire({
        title: 'Processing Payment...',
        didOpen: () => { Swal.showLoading(); },
        allowOutsideClick: false
    });

    try {
        const response = await fetch('http://localhost:5000/api/record-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: recordId,           // Unique Row ID (b.id)
                amountPaid: payAmount,  // Send ONLY the new payment amount
                paymentMode: selectedPaymentMode 
            })
        });

        const result = await response.json();
        Swal.close();

        if (result.success) {
            Toast.fire({ icon: 'success', title: 'Payment recorded successfully!' });
            
            // Reset modal and inputs
            setPayDueModal({ show: false, patient: null });
            setCollectedAmount("");
            
            // Refresh the patient list to show updated balance/status
            if (typeof fetchPatients === 'function') fetchPatients(); 
        } else {
            Swal.fire("Update Failed", result.error || "Server error", "error");
        }
    } catch (err) {
        Swal.close();
        console.error("Payment error:", err);
        Toast.fire({ icon: 'error', title: 'Connection to server failed.' });
    }
};
useEffect(() => {
    // 1. Initial Data Fetching
    const loadAllInitialData = async () => {
        try {
            fetchPatients();
            const idRes = await fetch('http://localhost:5000/api/next-external-id');
            const idData = await idRes.json();
            setFormData(prev => ({ ...prev, external_id: idData.nextId }));
            const groupRes = await fetch('http://localhost:5000/api/get-groups');
            const groupData = await groupRes.json();
            const validatedGroups = Array.isArray(groupData) ? groupData : [];
            setGroupList(validatedGroups);
            const [metaRes, testRes] = await Promise.all([
                fetch('http://localhost:5000/api/registration-metadata'),
                fetch('http://localhost:5000/api/get-lab-tests')
            ]);

            const metaData = await metaRes.json();
            const testData = await testRes.json();
            const masterTests = Array.isArray(testData) ? testData : testData.data || [];

        
            setMetadata(prev => ({
                ...prev,
                titles: metaData.titles || [],
                doctors: metaData.doctors || [],
                groups: validatedGroups,
                tests: masterTests,            
                profiles: metaData.profiles || [] 
            }));

            setTestList(masterTests);
            setDoctors(metaData.doctors || []);

        } catch (error) {
            console.error("Critical data loading failure:", error);
        }
    };

    loadAllInitialData();

    // 2. The Dynamic Clock
    const timer = setInterval(() => {
        const now = new Date();
        const formatted = now.toISOString().replace('T', ' ').split('.')[0];
        
        setCurrentDateTime(formatted);
        setFormData(prev => ({ ...prev, reg_date: formatted }));
    }, 1000);

    return () => clearInterval(timer);
}, []);


useEffect(() => {
    const getNewID = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/next-external-id');
            const data = await res.json();
            setFormData(prev => ({ ...prev, external_id: data.nextId }));
        } catch (err) {
            console.error("Error fetching External ID:", err);
        }
    };
    getNewID();
}, []); 

const isFormValid = () => {
    const requiredFields = [
        'title_id', 'patient_name', 'gender', 'phone_no', 'age', 
        'door_no', 'street_name1', 'city', 'state', 'pincode', 'marital_status'
    ];
    
    const missing = requiredFields.filter(field => !formData[field]);
    
    if (missing.length > 0) {
        const formattedMissing = missing.map(f => 
            f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        );

        // USE SWAL INSTEAD OF ALERT
        Swal.fire({
            icon: 'warning',
            title: 'Missing Required Fields',
            html: `
                <div style="text-align: left; margin-left: 20px;">
                    <p>Please provide the following details:</p>
                    <ul style="color: #d32f2f; font-weight: bold;">
                        ${formattedMissing.map(field => `<li>${field}</li>`).join('')}
                    </ul>
                </div>
            `,
            confirmButtonColor: '#4a148c',
            confirmButtonText: 'Got it'
        });
        
        return false;
    }
    return true;
};
    const tabs = ["Patient Registration", "Contact Details", "Social/Economic Information", "Emergency Contact"];

// --- 2. REGISTRATION WORKFLOW ---
const handleRegistrationWorkflow = () => {
    if (!validateForm()) return;
    setDecisionModal({
        show: true,
        title: "Do you want to register this patient with a Group?",
        onConfirm: () => {
            setIsGroupOpen(true);
            setDecisionModal({ show: false });
            setTimeout(() => {
                const element = document.getElementById('group-section-container');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        },
        onCancel: () => {
            setDecisionModal({
                show: true,
                title: "Submit as an individual patient?",
                onConfirm: () => {
                    setDecisionModal({ show: false });
                    handleRegister(); 
                },
                onCancel: () => setDecisionModal({ show: false })
            });
        }
    });
};

// 2. Fix resetForm so it fetches a NEW ID for the next patient
const resetForm = async () => {
    setFormData({
        title_id: '',
        patient_name: '',
        gender: '',
        phone_no: '',
        email: '',
        age: '',
        dob: '',
        doctor_id: '',
        door_no: '',
        flat_name: '',
        street_name1: '',
        street_name2: '',
        state: '',
        city: '',
        pincode: '',
        country: '',
        phone_home: '',
        locality: '',
        marital_status: '',
        notify_sms: false,
        notify_email: false,
        group_name: '',
        group_amount: '',
        group_total_persons: '',
        external_id: '', 
        client_code: '',
        GroupID: null
    });
    
    try {
        
        const res = await fetch('http://localhost:5000/api/next-external-id');
        const data = await res.json();
        setFormData(prev => ({ ...prev, external_id: data.nextId }));
    } catch (err) {
        console.error("Error fetching fresh ID during reset:", err);
    }
    
    setIsGroupOpen(false);
};


const handleRegister = async () => {
    const finalData = { 
        ...formData, 
        external_id: formData.external_id, 
        client_code: formData.client_code,
        GroupID: null, 
        group_name: '' 
    };

    try {
        const response = await fetch('http://localhost:5000/api/register-patient', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalData)
        });
        const res = await response.json();
        if (res.success) {
            setSuccessModal({
                show: true,
                type: 'individual',
                message: `✨ Registration Successful! Patient ${formData.patient_name} has been added.`
            });
            fetchPatients();
            resetForm(); 
        }
    } catch (err) {
        console.error("Individual Reg Error:", err);
    }
};

const handleGroupRegister = async () => {
    if (!validateForm()) return;

    try {
        let currentGroupId = formData.GroupID;
        let currentGroupName = formData.group_name;
        let groupCollectedAt = null;
        if (!currentGroupId) {
            const gRes = await fetch('http://localhost:5000/api/register-group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    group_name: formData.group_name,
                    group_amount: formData.group_amount,
                    total_persons: formData.group_total_persons, 
                    client_code: formData.client_code
                })
            });
            const gData = await gRes.json();
            if (gData.success) {
                currentGroupId = gData.groupId;
                currentGroupName = gData.groupName;
                groupCollectedAt = gData.collected_at_id; 
            }
        } else {
            const existingGroup = groupList.find(g => String(g.GroupID) === String(currentGroupId));
            groupCollectedAt = existingGroup?.collected_at_id || null;
        }
        const cleanId = (val) => {
            if (!val || val === 'null') return null;
            const match = String(val).match(/\d+/); 
            return match ? parseInt(match[0], 10) : null;
        };

        // 3. Data Mapping Logic
        const selectedItem = availableGroupTests.find(t => String(t.TestID) === String(formData.TestID));
        const isProfile = String(formData.TestID).startsWith('PR') || 
                          selectedItem?.uniqueKey?.includes('profile');

        const numericTestOrProfileId = cleanId(formData.TestID);

        const finalData = { 
            ...formData, 
            GroupID: currentGroupId,
            group_name: currentGroupName,
            collected_at_id: cleanId(groupCollectedAt), 
            TestID: !isProfile ? numericTestOrProfileId : null,
            profile_id: isProfile ? numericTestOrProfileId : null,
            test_names: selectedItem ? selectedItem.displayLabel : formData.TestID,
            doctor_id: cleanId(formData.doctor_id),
            current_status: 'Pending' 
        };


        const pRes = await fetch('http://localhost:5000/api/register-patient', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalData)
        });

        if (pRes.ok) {
            const pData = await pRes.json();
            setGroupPaymentModal({
                show: true,
                data: { 
                    ...finalData, 
                    PatientID: pData.patientId, 
                    total_fee: formData.group_amount || 0,
                    payment_mode: 'Cash',
                    TestID: finalData.TestID,
                    profile_id: finalData.profile_id,
                    collected_at_id: finalData.collected_at_id 
                }
            });
            
            fetchPatients(); 
            setIsGroupOpen(false); 
        }
    } catch (err) {
        console.error("Group Reg Error:", err);
        alert("Registration failed. Please check the console for ID mapping errors.");
    }
};

const validateForm = () => {
    const required = [
        'title_id', 'patient_name', 'gender', 'phone_no', 'age', 
        'door_no', 'street_name1', 'city', 'state', 'pincode', 'marital_status'
    ];
    
    const missing = required.filter(field => !formData[field]);
    
    if (missing.length > 0) {
        const formattedMissing = missing.map(f => 
            f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        );
        Swal.fire({
            icon: 'warning',
            title: 'Incomplete Form',
            html: `
                <div style="text-align: left; margin-left: 10px;">
                    <p>Please fill in the following required fields:</p>
                    <ul style="color: #d32f2f; font-weight: bold; column-count: 2;">
                        ${formattedMissing.map(field => `<li>${field}</li>`).join('')}
                    </ul>
                </div>
            `,
            confirmButtonColor: '#4a148c',
            confirmButtonText: 'Understood'
        });

        return false;
    }
    return true;
};

const handleGroupSelection = (groupId) => {
    if (!groupId) {
        setFormData(prev => ({
            ...prev,
            GroupID: null,
            group_name: '',
            group_amount: '',
            client_code: '',
            group_total_persons: '',
            TestID: '' 
        }));
        setAvailableGroupTests([]);
        return;
    }

    
    const selectedGroup = groupList.find(g => g.GroupID === parseInt(groupId));

    if (selectedGroup) {
        // --- 1. SET FORM FIELDS ---
        setFormData(prev => ({
            ...prev,
            GroupID: selectedGroup.GroupID,
            group_name: selectedGroup.GroupName,
            group_amount: selectedGroup.TotalAmount,
            client_code: selectedGroup.ClientCode,
            group_total_persons: selectedGroup.Quota,
            TestID: '' 
        }));

        let filteredItems = [];

        // This handles the "ProfileTest" column you added to your SQL query
        if (selectedGroup.ProfileTest) {
            const testNames = String(selectedGroup.ProfileTest).split(',').map(name => name.trim());
            
            filteredItems = testNames.map((name, index) => ({
                TestID: name, 
                TestName: name,
                displayLabel: `Package Test: ${name}`,
                uniqueKey: `group-test-${index}`
            }));
        }

        // --- 3. FALLBACK: KEEP YOUR ORIGINAL IDS LOGIC IF NEEDED ---
        if (selectedGroup.selected_test_ids && filteredItems.length === 0) {
            const testIds = String(selectedGroup.selected_test_ids).split(',').map(id => id.trim());
            filteredItems = metadata.tests
                .filter(t => testIds.includes(String(t.TestID)))
                .map(t => ({ ...t, displayLabel: `Test: ${t.TestName}`, uniqueKey: `test-${t.TestID}` }));
        }

        setAvailableGroupTests(filteredItems);
        handleAutoFillGroup(selectedGroup.GroupID);
    }
};
const handleGlobalSearch = async () => {
    if (!searchTerm) {
        fetchPatients(); 
        return;
    }
    try {
        const res = await fetch(`http://localhost:5000/api/search-patients?term=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        setPatients(data);
    } catch (err) {
        console.error("Search error:", err);
    }
};

const handleSaveGroupInvoice = async () => {
    const billData = groupPaymentModal.data;
    const finalID = billData.id || billData.PatientID;

    if (!finalID) {
        console.error("DEBUG: Modal Data is missing ID", billData);
        alert("CRITICAL ERROR: Patient ID is missing.");
        return; 
    }
    console.log("Preparing payload with IDs:", {
        Test: billData.TestID,
        Profile: billData.profile_id,
        Location: billData.collected_at_id
    });

    try {
        const response = await fetch('http://localhost:5000/api/save-group-billing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                PatientID: finalID,
                patient_name: billData.patient_name,
                doctor_id: billData.doctor_id || 0,
                amount: billData.total_fee || billData.Amount,
                amount_paid: billData.total_fee || billData.Amount, 
                balance: 0,
                payment_modes: billData.payment_mode || 'Cash',
                group_name: billData.group_name,
                client_code: billData.client_code,
                test_names: billData.test_names,
                TestID: billData.TestID || billData.test_id || null,
                profile_id: billData.profile_id || billData.ProfileID || null,
                collected_at_id: billData.collected_at_id || billData.location_id || null
            })
        });

        const result = await response.json();
        if (result.success) {
            alert(`Invoice ${result.invoiceNo} saved successfully!`);
            setGroupPaymentModal({ show: false, data: {} });
            if (typeof fetchPatients === 'function') fetchPatients(); 
        } else {
            alert("Error: " + (result.message || "Failed to save billing"));
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        alert("Server connection failed.");
    }
};
    // --- Unified Purple Theme Styles ---
    const s = {
        container: { display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: '"Segoe UI", Roboto, sans-serif', backgroundColor: '#f3e5f5' },
        header: { backgroundColor: '#4a148c', color: 'white', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '50px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' },
        main: { display: 'flex', flex: 1, overflow: 'hidden' },
        leftPanel: { 
    width: '50%', 
    height: '809px', 
    backgroundColor: 'white', 
    borderRight: '1px solid #4a148c', 
    borderLeft: '1px solid #4a148c',
    borderTop: '1px solid #4a148c',
    borderBottom: '1px solid #4a148c',
    overflowY: 'auto', 
    padding: '35px', 
    marginTop: '18px', 
    marginLeft: '20px'
},
        rightPanel: { width: '50%', padding: '15px', backgroundColor: '#f3e5f5' },
        tabContainer: { display: 'flex', marginBottom: '15px', borderBottom: '2px solid #4a148c' },
        tab: (isActive) => ({
            padding: '10px 12px', border: 'none',
            backgroundColor: isActive ? '#4a148c' : 'transparent', 
            color: isActive ? 'white' : '#4a148c',
            cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: '0.3s'
        }),
        formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
        fieldGroup: { display: 'flex', flexDirection: 'column' },
        label: { fontSize: '12px', fontWeight: 'bold', color: '#4a148c', marginBottom: '4px' },
        input: { 
    padding: '8px', 
    border: '1px solid #ce93d8', 
    borderRadius: '4px', 
    fontSize: '13px', 
    outlineColor: '#4a148c',
    backgroundColor: 'white', 
    color: '#333333'           
},
        accentBar: { backgroundColor: '#7b1fa2', color: 'white', padding: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', margin: '20px 0', borderRadius: '4px' },
        btnPurple: { backgroundColor: '#4a148c', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '25px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' },
        btnOutline: { backgroundColor: 'transparent', color: '#4a148c', border: '1.5px solid #4a148c', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '800' },
        table: { width: '100%', borderCollapse: 'collapse', marginTop: '0px' },
        th: { backgroundColor: '#6a1b9a', color: 'white', padding: '10px', fontSize: '13px',fontWeight: '700', textAlign: 'left' },
        td: { padding: '10px', borderBottom: '1px solid #e1bee7', fontSize: '13px',fontWeight: '700', color: '#333' },
        footer: { backgroundColor: '#4a148c', color: 'white', padding: '10px', textAlign: 'center', fontSize: '11px' },
        searchContainerGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '15px',
        marginBottom: '20px'
    },
    
    searchGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr auto', 
        gap: '8px',
        backgroundColor: '#fff',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        border: '1px solid #e1bee7'
    },

    searchSectionTitle: {
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#7b1fa2',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '8px',
        display: 'block'
    },
    modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(74, 20, 140, 0.15)', 
    backdropFilter: 'blur(8px)',               
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
},
modalBox: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
    textAlign: 'center',
    maxWidth: '420px',
    width: '90%',
    position: 'relative',
    animation: 'modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
},
tableContainer: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        border: '1px solid #e1bee7',
        marginTop: '20px'
    },
    
    tr: {
        transition: 'all 0.2s ease',
        cursor: 'pointer'
    },
    filterInput: {
        display: 'block',
        width: '100%',
        marginTop: '8px',
        padding: '6px 10px',
        fontSize: '11px',
        borderRadius: '6px',
        border: '1px solid #f3e5f5',
        outline: 'none',
        transition: 'border-color 0.3s'
    },
    
    tableResponsiveWrapper: {
        width: '100%',
        overflowX: 'auto', 
        borderRadius: '12px',
        backgroundColor: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid #d1c4e9',
        WebkitOverflowScrolling: 'touch' 
    },

    tableResponsive: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '900px', 
    },
    
    
    
    };
    
const renderTabContent = () => {
    const styles = {
        label: {
            display: 'block',
            fontSize: '13px',
            fontWeight: '800', 
            color: '#2d3436',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        },
        input: {
            width: '100%',
            padding: '10px 12px',
            fontSize: '14px',
            fontWeight: '500',
            border: '2px solid #dfe6e9', 
            borderRadius: '6px',
            outline: 'none',
            transition: 'border-color 0.2s',
            backgroundColor: '#fff',
            color: '#2d3436'
        },
        focusInput: {
            borderColor: '#4a148c', 
            boxShadow: '0 0 0 3px rgba(74, 20, 140, 0.1)'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px 30px', 
            padding: '10px'
        }
    };

    const handleFocus = (e) => e.target.style.borderColor = '#4a148c';
    const handleBlur = (e) => e.target.style.borderColor = '#dfe6e9';

    switch (activeTab) {
        case "Patient Registration":
            return (
                <div style={styles.grid}>
                    {/* Row 1: Title & First Name */}
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: '0.4' }}>
                            <label style={styles.label}>Title</label>
                            <select 
                                style={styles.input} required 
                                value={formData.title_id} 
                                onFocus={handleFocus} onBlur={handleBlur}
                                onChange={(e) => setFormData({...formData, title_id: e.target.value})}
                            >
                                <option value="">--</option>
                                {metadata.titles.map(t => (
                                    <option key={t.id} value={t.id}>{t.title_name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: '1' }}>
                            <label style={styles.label}>First Name <span style={{color:'red'}}>*</span></label>
                            <input 
                                style={styles.input} type="text" placeholder="e.g. John" 
                                value={formData.patient_name} onFocus={handleFocus} onBlur={handleBlur}
                                onChange={(e) => setFormData({...formData, patient_name: e.target.value})}
                                required 
                            />
                        </div>
                    </div>

                    <div style={s.fieldGroup}>
                        <label style={styles.label}>Middle Name</label>
                        <input style={styles.input} type="text" placeholder="Optional" onFocus={handleFocus} onBlur={handleBlur}/>
                    </div>

                    <div style={s.fieldGroup}>
                        <label style={styles.label}>Last Name</label>
                        <input style={styles.input} type="text" placeholder="Surname" onFocus={handleFocus} onBlur={handleBlur}/>
                    </div>

                    <div style={s.fieldGroup}>
                        <label style={styles.label}>Sex <span style={{color:'red'}}>*</span></label>
                        <select 
                            style={styles.input} value={formData.gender} required
                            onFocus={handleFocus} onBlur={handleBlur}
                            onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div style={s.fieldGroup}>
                        <label style={styles.label}>Mobile No <span style={{color:'red'}}>*</span></label>
                        <input 
                            style={styles.input} type="tel" placeholder="10-digit number" 
                            value={formData.phone_no} onFocus={handleFocus} onBlur={handleBlur}
                            onChange={(e) => setFormData({...formData, phone_no: e.target.value})}
                            required 
                        />
                    </div>

                    <div style={s.fieldGroup}>
                        <label style={styles.label}>Contact Email</label>
                        <input 
                            style={styles.input} type="email" placeholder="example@mail.com" 
                            onFocus={handleFocus} onBlur={handleBlur}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                   
<LocalizationProvider dateAdapter={AdapterDayjs}>
  <DatePicker
    label="DATE OF BIRTH"
    slotProps={{
      textField: {
        fullWidth: true,
        variant: "outlined",
        sx: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '6px',
            '& fieldset': { border: '2px solid #dfe6e9' },
            '&:hover fieldset': { borderColor: '#4a148c' },
          },
          '& .MuiInputLabel-root': { fontWeight: '800', color: '#2d3436' }
        }
      }
    }}
  />
</LocalizationProvider>

                    <div style={s.fieldGroup}>
                        <label style={styles.label}>Age <span style={{color:'red'}}>*</span></label>
                        <input 
                            style={styles.input} type="number" placeholder="Years" 
                            value={formData.age} onFocus={handleFocus} onBlur={handleBlur}
                            onChange={(e) => setFormData({...formData, age: e.target.value})}
                            required 
                        />
                    </div>
                </div>
            );

        case "Contact Details":
            return (
                <div style={styles.grid}>
                    <div style={s.fieldGroup}>
                        <label style={styles.label}>Door No</label>
                        <input 
                            style={styles.input} type="text" placeholder="Flat/House No" 
                            value={formData.door_no} onFocus={handleFocus} onBlur={handleBlur}
                            onChange={(e) => setFormData({...formData, door_no: e.target.value})}
                        />
                    </div>
                    <div style={s.fieldGroup}>
                        <label style={styles.label}>Flat Name</label>
                        <input 
                            style={styles.input} type="text" placeholder="Building Name" 
                            value={formData.flat_name} onFocus={handleFocus} onBlur={handleBlur}
                            onChange={(e) => setFormData({...formData, flat_name: e.target.value})}
                        />
                    </div>

                    <div style={s.fieldGroup}>
                        <label style={styles.label}>Street Name 1</label>
                        <input 
                            style={styles.input} type="text" placeholder="Main Street" 
                            value={formData.street_name1} onFocus={handleFocus} onBlur={handleBlur}
                            onChange={(e) => setFormData({...formData, street_name1: e.target.value})}
                        />
                    </div>
                    <div style={s.fieldGroup}>
                        <label style={styles.label}>Street Name 2</label>
                        <input 
                            style={styles.input} type="text" placeholder="Cross Street" 
                            value={formData.street_name2} onFocus={handleFocus} onBlur={handleBlur}
                            onChange={(e) => setFormData({...formData, street_name2: e.target.value})}
                        />
                    </div>

                    <div style={s.fieldGroup}>
                        <label style={styles.label}>State</label>
                        <select 
                            style={styles.input} value={formData.state} 
                            onFocus={handleFocus} onBlur={handleBlur}
                            onChange={(e) => setFormData({...formData, state: e.target.value})}
                        >
                            <option value="">-select state-</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                        </select>
                    </div>
                    <div style={s.fieldGroup}>
                        <label style={styles.label}>City</label>
                        <input 
                            style={styles.input} type="text" placeholder="City" 
                            value={formData.city} onFocus={handleFocus} onBlur={handleBlur}
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                        />
                    </div>

                    <div style={s.fieldGroup}>
                        <label style={styles.label}>Pincode</label>
                        <input 
                            style={styles.input} type="text" placeholder="600xxx" 
                            value={formData.pincode} onFocus={handleFocus} onBlur={handleBlur}
                            onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                        />
                    </div>

                    <div style={s.fieldGroup}>
                        <label style={styles.label}>Marital Status <span style={{color: 'red'}}>*</span></label>
                        <select 
                            style={styles.input} required value={formData.marital_status} 
                            onFocus={handleFocus} onBlur={handleBlur}
                            onChange={(e) => setFormData({...formData, marital_status: e.target.value})}
                        >
                            <option value="">-select-</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                        </select>
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '30px', marginTop: '10px', background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" style={{width:'18px', height:'18px'}} 
                                checked={formData.notify_sms} 
                                onChange={(e) => setFormData({...formData, notify_sms: e.target.checked})} 
                            /> NOTIFY VIA SMS
                        </label>
                        <label style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" style={{width:'18px', height:'18px'}} 
                                checked={formData.notify_email} 
                                onChange={(e) => setFormData({...formData, notify_email: e.target.checked})} 
                            /> EMAIL NOTIFY
                        </label>
                    </div>
                </div>
            );

        case "Social/Economic Information":
            return (
                <div style={styles.grid}>
                    <div style={s.fieldGroup}>
                        <label style={styles.label}>Relationship</label>
                        <select 
                            style={styles.input} value={formData.social_relationship}
                            onFocus={handleFocus} onBlur={handleBlur}
                            onChange={(e) => setFormData({...formData, social_relationship: e.target.value})}
                        >
                            <option value="">-select-</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Spouse">Spouse</option>
                        </select>
                    </div>
                    <div style={s.fieldGroup}>
                        <label style={styles.label}>Name</label>
                        <input 
                            style={styles.input} type="text" placeholder="Guardian Name" 
                            value={formData.social_name} onFocus={handleFocus} onBlur={handleBlur}
                            onChange={(e) => setFormData({...formData, social_name: e.target.value})}
                        />
                    </div>
                    <div style={s.fieldGroup}>
                        <label style={styles.label}>Income Group</label>
                        <select 
                            style={styles.input} value={formData.income_group}
                            onFocus={handleFocus} onBlur={handleBlur}
                            onChange={(e) => setFormData({...formData, income_group: e.target.value})}
                        >
                            <option value="">-select-</option>
                            <option value="Low">Low Income</option>
                            <option value="Middle">Middle Income</option>
                            <option value="High">High Income</option>
                        </select>
                    </div>
                </div>
            );

        case "Emergency Contact":
            return (
                <div style={styles.grid}>
                    <div style={s.fieldGroup}><label style={styles.label}>Emergency Contact Name</label><input style={styles.input} type="text" onFocus={handleFocus} onBlur={handleBlur}/></div>
                    <div style={s.fieldGroup}><label style={styles.label}>Contact Number</label><input style={styles.input} type="text" onFocus={handleFocus} onBlur={handleBlur}/></div>
                </div>
            );
        default: return null;
    }
};


    return (
        <div style={s.container}>
        <Box 
            component="header" 
            sx={{ 
                p: 1.5, 
                bgcolor: '#4a148c', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                position: 'relative', 
                width: '100%', 
                boxShadow: 3 
            }}
        >
            {/* Centered Title */}
            <Typography variant="h6" fontWeight="bold">
                PATHO CONSULT
            </Typography>
        
            <IconButton 
                        onClick={() => navigate('/home')} 
                        sx={{ position: 'absolute', right: 36, top: 3, color: 'white' }}
                    >
                        <HomeIcon fontSize="large" />
                    </IconButton>
        </Box>

            <main style={s.main}>
                {/* Left side: Registration Form */}
                <section style={s.leftPanel}>
                    {/* --- ADD THE NEW BLOCK HERE --- */}


<div style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '15px',
    borderBottom: '1px solid #f3e5f5', 
    paddingBottom: '8px'
}}>
    <h2 style={{ 
        color: '#4a148c', 
        margin: 0, 
        fontSize: '18px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px' 
    }}>
        <PersonAdd sx={{ fontSize: 29, fontWeight: '900', color: '#7b1fa2' }} /> 
        Registration Form
    </h2>

    {formData.PatientID && (
        <button 
            style={{ 
                ...s.btnOutline, 
                color: '#d32f2f', 
                borderColor: '#d32f2f', 
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer'
            }}
            onClick={resetForm}
        >
            <Close sx={{ fontSize: 16 }} /> 
            Cancel Edit / New Patient
        </button>
    )}
</div>
                    <div style={s.tabContainer}>
                        {tabs.map(tab => (
                            <button key={tab} style={s.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>{tab}</button>
                        ))}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        {renderTabContent()}
                    </div>

                    {/* --- REGISTRATION SUMMARY --- */}


<div style={{ 
    padding: '10px 15px', 
    backgroundColor: '#f8f9fa', 
    borderRadius: '4px', 
    marginBottom: '5px',
    border: '1px solid #e0e0e0',
    position: 'relative' 
}}>
    
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',  marginBottom: '-5px' }}>
        <div style={{ fontSize: '13px',fontWeight: '800', color: '#333' }}>
            {/* THIS IS THE DYNAMIC CLOCK */}
            <strong style={{ color: '#4a148c' }}>Date of Reg:</strong> {currentDateTime}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ ...s.label, marginBottom: 0,fontSize: '13px',
            fontWeight: '800', }}>External ID</label>
            <input 
                style={{ 
                    ...s.input, 
                    width: '150px', 
                    borderBottom: '1px solid #ce93d8', 
                    backgroundColor: 'transparent' ,
                    fontSize: '13px',
            fontWeight: '800',
                }} 
                type="text" 
                placeholder="External Id" 
                value={formData.group_client_code || ''} 
                onChange={(e) => setFormData({ ...formData, group_client_code: e.target.value })}
            />
        </div>
    </div>
</div>

{/* Navigation Buttons Row */}
<div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '8px' }}>
   <button 
    style={s.btnPurple} 
    onClick={handleRegistrationWorkflow}
>
    Proceed to Register
</button>

    {/* NEW: View Billing Receipt Button */}
    <button 
        onClick={() => navigate('/edit-invoice')} 
        style={{ 
            ...s.btnOutline, 
            padding: '10px 20px', 
            borderRadius: '25px',
            backgroundColor: '#fff' 
        }}
    >
        View Billing Receipt
    </button>
</div>

<Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', my: 4 }}>
    <Button
        variant="contained"
        onClick={() => {
            setIsGroupOpen(!isGroupOpen);
            if (!isGroupOpen) {
                setTimeout(() => {
                    const element = document.getElementById('group-section-container');
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }}
        startIcon={isGroupOpen ? <span>✖</span> : <span>➕</span>}
        sx={{
            borderRadius: '30px',
            padding: '15px 10px',
            fontWeight: 'bold',
            textTransform: 'none',
            fontSize: '1.1rem',
            background: 'linear-gradient(45deg, #4a148c 30%, #9c27b0 90%)',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 15px rgba(156, 39, 176, 0.4)',
            transition: 'all 0.3s ease-in-out',
            
            '&:hover': {
                
                background: 'linear-gradient(45deg, #4a148c 30%, #9c27b0 90%)',
                transform: 'scale(1.05)', 
                boxShadow: '0 4px 15px rgba(156, 39, 176, 0.4)',
                color: 'white' 
            },
            '&:active': {
                transform: 'scale(0.98)',
            }
        }}
    >
        {isGroupOpen ? "Close Group Panel" : "New Group Registration"}
    </Button>
</Box>

{isGroupOpen && (
    <Paper 
        id="group-section-container"
        elevation={6} 
        sx={{ 
            marginTop: '30px',
            marginBottom: '30px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '2px solid #7b1fa2',
            animation: 'glow 1.5s infinite alternate',
            '@keyframes glow': {
                'from': { boxShadow: '0 0 10px -2px #7b1fa2' },
                'to': { boxShadow: '0 0 20px 2px #9c27b0' }
            }
        }}
    >

<Box sx={{ 
    backgroundColor: '#7b1fa2', 
    color: 'white', 
    p: 1.5, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    borderRadius: '8px 8px 0 0' 
}}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* Replaced emoji with People Icon */}
        <People sx={{ fontSize: 28 }} /> 
        
        <Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                Group Registration 
            </Typography>
            <Typography variant="caption" sx={{ color: '#e1bee7', display: 'block' }}>
                
            </Typography>
        </Box>
    </Box>

    {/* Replaced ✖ with Close Icon */}
    <IconButton 
        size="small" 
        onClick={() => setIsGroupOpen(false)} 
        sx={{ 
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } 
        }}
    >
        <Close fontSize="small" />
    </IconButton>
</Box>

        {/* Content Area */}
        <Box sx={{ p: 4, backgroundColor: '#fff' }}>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '20px' 
            }}>
                {/* 1. Master Dropdown - Spans Full Width */}
                <div style={{ ...s.fieldGroup, gridColumn: 'span 2', backgroundColor: '#f3e5f5', padding: '15px', borderRadius: '8px' }}>
                    <label style={{ ...s.label, color: '#4a148c', fontWeight: 'bold' }}>Select Existing Group Registry</label>
                    <select 
                        style={{ ...s.input, width: '100%', height: '40px', fontSize: '15px' }} 
                        value={formData.GroupID || ""} 
                        onChange={(e) => handleGroupSelection(e.target.value)}
                    >
                        <option value="">-- Start Fresh or Select Existing --</option>
                        {metadata.groups && metadata.groups.map(g => (
                            <option key={g.GroupID} value={g.GroupID}>
                                {g.GroupName || g.group_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 2. Group Name */}
                <div style={s.fieldGroup}>
                    <label style={s.label}>Group Name</label>
                    <input 
                        style={s.input} type="text" 
                        placeholder="Enter Corporate/Family Name"
                        value={formData.group_name}
                        onChange={(e) => setFormData({...formData, group_name: e.target.value})}
                    />
                </div>

                {/* 3. Amount */}
                <div style={s.fieldGroup}>
                    <label style={s.label}>Total Group Amount (₹)</label>
                    <input 
                        style={{...s.input, fontWeight: 'bold', color: '#2e7d32'}} type="text" 
                        value={formData.group_amount}
                        onChange={(e) => setFormData({...formData, group_amount: e.target.value})}
                    />
                </div>

                {/* 4. Person Statistics */}
                <div style={{ display: 'flex', gap: '15px', gridColumn: 'span 1' }}>
                    <div style={s.fieldGroup}>
                        <label style={s.label}>Capacity</label>
                        <input 
                            style={{...s.input, width: '70px', textAlign: 'center'}} type="text" 
                            value={formData.group_total_persons}
                            onChange={(e) => setFormData({...formData, group_total_persons: e.target.value})}
                        />
                    </div>
                    <div style={s.fieldGroup}>
                        <label style={s.label}>Registering Now</label>
                        <input 
                            style={{...s.input, width: '100px', border: '2px solid #7b1fa2', textAlign: 'center'}} 
                            type="number" 
                            value={formData.group_to_be_registered || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, group_to_be_registered: e.target.value }))}
                        />
                    </div>
                </div>

                {/* 5. Client Code */}
                <div style={s.fieldGroup}>
                    <label style={s.label}>Assigned Client Code</label>
                    <input 
                        style={{...s.input, backgroundColor: '#eee', cursor: 'not-allowed'}} 
                        type="text" 
                        value={formData.client_code} 
                        readOnly 
                    />
                </div>

                {/* 6. Test Bundle */}
                <div style={{ ...s.fieldGroup, gridColumn: 'span 2' }}>
                    <label style={s.label}>Select Test / Package (Group Linked)</label>
                    <select 
                        style={{ ...s.input, border: '2px solid #7b1fa2' }}
                        value={formData.TestID || ""}
                        onChange={(e) => setFormData({...formData, TestID: e.target.value})}
                    >
                        <option value="">-- Choose from Group Bundle --</option>
                        {availableGroupTests.length > 0 ? (
                            availableGroupTests.map(item => (
                                <option key={item.uniqueKey} value={item.TestID}>
                                    {item.displayLabel}
                                </option>
                            ))
                        ) : (
                            <option disabled>Select a group to see available tests</option>
                        )}
                    </select>
                </div>
            </div>

            {/* Final Action Button */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button 
                    variant="contained" 
                    onClick={handleGroupRegister}
                    sx={{ 
                        backgroundColor: '#7b1fa2', 
                        color: 'white', 
                        px: 6, 
                        py: 1.5,
                        borderRadius: '30px', 
                        fontWeight: 'bold',
                        fontSize: '16px',
                        '&:hover': { backgroundColor: '#4a148c', transform: 'scale(1.05)' },
                        transition: 'all 0.3s ease'
                    }}
                >
                    Confirm Group Registration
                </Button>
            </Box>
        </Box>
    </Paper>
)}

{isGroupBillingOpen && (
    <div style={s.modalOverlay}>
        <div style={{...s.modalBox, maxWidth: '600px', textAlign: 'left', padding: '30px'}}>
            <h3 style={{ color: '#4a148c', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>
                💳 Group Billing & Payment
            </h3>
            <p style={{fontSize: '13px', color: '#666'}}>
                Patient: <strong>{formData.patient_name}</strong> | Group: <strong>{formData.group_name}</strong>
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                {/* Consultant Selection */}
                <div>
                    <label style={s.label}>Consultant Doctor</label>
                    <select 
                        style={s.input} 
                        value={formData.doctor_id} 
                        onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
                    >
                        <option value="">Select Doctor...</option>
                        {metadata.doctors.map(d => (
                            <option key={d.id} value={d.id}>{d.doctor_name || d.name}</option>
                        ))}
                    </select>
                </div>

                {/* Service Location */}
                <div>
                    <label style={s.label}>Service Location</label>
                    <input 
                        style={s.input} 
                        placeholder="e.g. OP Counter" 
                        value={formData.location || ""}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                </div>

                {/* Total Fee (Auto-filled from Group Amount) */}
                <div>
                    <label style={s.label}>Total Group Fee (₹)</label>
                    <input 
                        type="number" 
                        style={s.input} 
                        value={formData.group_amount} 
                        onChange={(e) => setFormData({...formData, group_amount: e.target.value})}
                    />
                </div>

                {/* Payment Mode (Cash/UPI/Credit) */}
                <div>
                    <label style={s.label}>Payment Mode</label>
                    <select 
                        style={s.input} 
                        value={formData.payment_mode || "Cash"}
                        onChange={(e) => setFormData({...formData, payment_mode: e.target.value})}
                    >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI / Digital</option>
                        <option value="Credit">Credit / Corporate</option>
                    </select>
                </div>
            </div>

            <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                <button 
                    style={{ ...s.btnPurple, flex: 2, padding: '12px' }} 
                    onClick={submitFinalGroupRegistration}
                >
                    ✅ Complete Registration & Save
                </button>
                <button 
                    style={{ ...s.btnOutline, flex: 1 }} 
                    onClick={() => setIsGroupBillingOpen(false)}
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
)}

                </section>
<section style={s.rightPanel}>
    
  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
    {['All', 'Pending', 'Approved'].map((type) => {
        // Calculate count for the badge
        const count = patients.filter(p => {
            if (type === 'Pending') return parseFloat(p.balance) > 0 || p.current_status === 'Pending';
            if (type === 'Approved') return p.current_status === 'Approved' && parseFloat(p.balance) <= 0;
            return true;
        }).length;

        return (
            <button
                key={type}
                onClick={() => { setFilterType(type); setCurrentPage(1); }}
                style={{
                    position: 'relative',
                    padding: '8px 20px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: filterType === type ? '#4a148c' : '#c37dd8',
                    color: filterType === type ? 'white' : '#252323',
                    fontWeight: 'bold',
                }}
            >
                {type === 'Approved' ? 'COMPLETED' : type === 'Pending' ? 'DUE / PENDING' : 'ALL PATIENTS'}
                
                {/* Red Badge for Pending Count */}
                {type === 'Pending' && count > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        backgroundColor: '#d32f2f',
                        color: 'white',
                        borderRadius: '50%',
                        padding: '2px 6px',
                        fontSize: '10px',
                        border: '2px solid white'
                    }}>
                        {count}
                    </span>
                )}
            </button>
        );
    })}
</div>

    {/* 3. Patient Table Content */}
    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #d1c4e9' }}>
        <div style={s.tableResponsiveWrapper}>
        <table style={s.table}>
            <thead>
                <tr>
                    <th style={{...s.th, cursor: 'pointer'}} onClick={() => requestSort('patient_name')}>
                        Name {sortConfig.key === 'patient_name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                        <input 
                            style={{ display: 'block', width: '90%', marginTop: '5px', padding: '2px', fontSize: '10px', borderRadius: '3px', border: 'none', color: '#333' }}
                            placeholder="Filter Name..."
                            value={columnFilters.patient_name}
                            onClick={(e) => e.stopPropagation()} 
                            onChange={(e) => handleColumnFilter(e, 'patient_name')}
                        />
                    </th>
                    <th style={s.th}>Age/Sex</th>
                    <th style={s.th}>Patient ID</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Quick Actions</th>
                </tr>
            </thead>
            <tbody>
                {currentRows.map((p) => {
    const hasBalance = parseFloat(p.balance) > 0;
    const effectiveStatus = hasBalance ? 'Pending' : p.current_status;
    
    const config = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.New;

    return (
        <tr key={p.PatientID} style={s.tr} onClick={() => navigate('/patient-detail-screen', { state: { patient: p } })}>
            <td style={s.td}><strong>{p.patient_name}</strong></td>
            <td style={s.td}>{p.age} / {p.gender}</td>
            <td style={s.td}><code style={{color: '#7b1fa2'}}>{p.PatientID}</code></td>
            <td style={s.td}>
                <span style={{ 
                    backgroundColor: config.color, 
                    color: 'white', 
                    padding: '5px 12px', 
                    borderRadius: '15px', 
                    fontSize: '10px', 
                    fontWeight: 'bold', 
                    display: 'inline-block', 
                    minWidth: '80px', 
                    textAlign: 'center' 
                }}>
                    {config.label}
                </span>
                {/* Visual nudge: show balance amount next to the status if it exists */}
                {hasBalance && (
                    <div style={{ fontSize: '9px', color: '#d32f2f', marginTop: '2px', fontWeight: 'bold' }}>
                        Due: ₹{p.balance}
                    </div>
                )}
            </td>
            <td style={s.td}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={s.btnOutline} onClick={(e) => { e.stopPropagation(); handleSelectPatient(p); }}>Edit</button>
                    
                    {effectiveStatus === 'Approved' ? (
                        <button 
                            style={{ ...s.btnPurple, backgroundColor: '#2e7d32', padding: '6px 12px' }}
                            onClick={(e) => { e.stopPropagation(); navigate('/edit-invoice', { state: { filterID: p.PatientID } }); }}
                        > 🖨️ Invoice </button>
                    ) : (
                        <button 
                            style={{ 
                                ...s.btnPurple, 
                                backgroundColor: effectiveStatus === 'Pending' ? '#d32f2f' : '#4a148c',
                                padding: '6px 12px',
                                animation: effectiveStatus === 'Pending' ? 'pulse 2s infinite' : 'none' 
                            }}
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (effectiveStatus === 'Pending') {
                                    // Pass the whole patient object including current balance
                                    setPayDueModal({ show: true, patient: p });
                                } else {
                                    navigate('/patient-detail-screen', { state: { patient: p } }); 
                                }
                            }}
                        > 
                            {effectiveStatus === 'Pending' ? '💰 Pay Due' : 'Process →'} 
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
})}
            </tbody>
        </table>

        <TablePagination
    component="div"
    count={filteredPatients.length}
    page={currentPage}
    onPageChange={handleChangePage}
    rowsPerPage={rowsPerPage}
    onRowsPerPageChange={handleChangeRowsPerPage}
    rowsPerPageOptions={[5, 10, 25, 50]}
    sx={{
        backgroundColor: '#f3e5f5', // Light purple background to match your theme
        borderTop: '1px solid #d1c4e9',
        color: '#4a148c',
        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
            fontSize: '12px',
            fontWeight: 'bold',
            marginTop: '14px' // Alignment fix for the labels
        },
        '.MuiIconButton-root': {
            color: '#4a148c',
        },
        '.MuiIconButton-root.Mui-disabled': {
            opacity: 0.3
        }
    }}
/>
        </div>
    </div>

    {/* 4. THE GROUP STATUS TABLE */}
<div style={{ marginTop: '-10px', borderTop: '2px  #e0c4e9', paddingTop: '20px' }}>
    <h4 style={{ color: '#4a148c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><svg width="24" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg> Active Group Registrations</span>
        <button style={s.btnOutline} onClick={() => setShowGroupTable(!showGroupTable)}>
            {showGroupTable ? "🔼 Hide List" : "🔽 View Groups (" + groupList.length + ")"}
        </button>
    </h4>



    {showGroupTable && (
        <div style={{ ...s.tableContainer, maxHeight: '320px', overflowY: 'auto', backgroundColor: 'white', border: '1px solid #d1c4e9', marginTop: '12px', borderRadius: '15px', borderCollapse: 'separate' }}>
            <div style={s.tableResponsiveWrapper}>
            <table style={s.table}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f8f4ff'}}>
                    <tr>
                        <th style={{ ...s.th }}>Group Name / Client</th>
                        <th style={{ ...s.th }}>Registration Progress</th>
                        <th style={{ ...s.th }}>Total Amount</th>
                        <th style={{ ...s.th }}>Status</th>
                        <th style={{ ...s.th }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {groupList.length > 0 ? groupList.map((g) => (
                        <tr key={g.GroupID} style={s.tr}>
                            <td style={s.td}>
                                <strong>{g.GroupName}</strong><br/>
                                <small style={{color: '#7b1fa2'}}>{g.ClientCode}</small>
                            </td>
                            <td style={s.td}>
                                {/* Visual Progress indicator */}
                                <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                                    {g.RegisteredCount} / {g.Quota} Patients
                                </div>
                                <div style={{ width: '100%', height: '6px', backgroundColor: '#eee', borderRadius: '3px' }}>
                                    <div style={{ 
                                        width: `${Math.min((g.RegisteredCount / g.Quota) * 100, 100)}%`, 
                                        height: '100%', 
                                        backgroundColor: g.RegisteredCount >= g.Quota ? '#2e7d32' : '#4a148c',
                                        borderRadius: '3px'
                                    }}></div>
                                </div>
                            </td>
                            <td style={s.td}><strong>₹{g.TotalAmount}</strong></td>
                            <td style={s.td}>
                                <span style={{ 
                                    backgroundColor: g.RegisteredCount > 0 ? '#e8f5e9' : '#f3e5f5', 
                                    color: g.RegisteredCount > 0 ? '#2e7d32' : '#7b1fa2', 
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    border: `1px solid ${g.RegisteredCount > 0 ? '#2e7d32' : '#7b1fa2'}`
                                }}>
                                    {g.RegisteredCount > 0 ? 'IN PROGRESS' : 'WAITING'}
                                </span>
                            </td>
                            <td style={s.td}>
                                <button 
                                    style={s.btnPurple} 
                                    onClick={() => navigate('/workflow', { state: { groupId: g.GroupID } })}
                                >
                                    View Members
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No Groups Registered Today</td></tr>
                    )}
                </tbody>
            </table>
            </div>
        </div>
    )}
</div>
</section>
            </main>
<Box sx={{ 
                             mt: 'auto',p: 1, bgcolor: '#4a148c', color: 'rgba(255,255,255,0.8)', 
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
            {/* --- SPECIALIZED DECISION MODAL --- */}
{decisionModal.show && (
    <div style={s.modalOverlay}>
        <div style={s.modalBox}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>❓</div>
            <h3 style={{ color: '#4a148c', margin: '0 0 20px 0', fontSize: '18px' }}>{decisionModal.title}</h3>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                    style={{ ...s.btnPurple, padding: '10px 25px' }} 
                    onClick={decisionModal.onConfirm}
                > Yes, Proceed </button>
                <button 
                    style={{ ...s.btnOutline, padding: '10px 25px' }} 
                    onClick={decisionModal.onCancel}
                > No, Cancel </button>
            </div>
        </div>
    </div>
)}

{/* --- SPECIALIZED SUCCESS MODAL --- */}
{successModal.show && (
    <div style={s.modalOverlay}>
        <div style={{ 
            ...s.modalBox, 
            borderTop: `8px solid ${successModal.type === 'group' ? '#4a148c' : successModal.type === 'error' ? '#d32f2f' : '#2e7d32'}` 
        }}>
            <div style={{ fontSize: '50px', marginBottom: '10px' }}>
                {successModal.type === 'group' ? '🚀' : successModal.type === 'error' ? '⚠️' : '✅'}
            </div>
            <h2 style={{ color: '#333', marginBottom: '10px' }}>
                {successModal.type === 'error' ? 'Notice' : 'Success!'}
            </h2>
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '25px' }}>{successModal.message}</p>
            <button 
                style={{ ...s.btnPurple, width: '100%', padding: '12px' }} 
                onClick={() => setSuccessModal({ show: false, type: '', message: '' })}
            > Close </button>
        </div>
    </div>
)}
{payDueModal.show && (
    <div style={s.modalOverlay}>
        <div style={{ ...s.modalBox, borderTop: '8px solid #d32f2f', width: '450px', padding: '0' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#d32f2f', color: 'white', padding: '15px', textAlign: 'center' }}>
                <h3 style={{ margin: 0 }}>Quick Payment Collection</h3>
            </div>

            <div style={{ padding: '20px' }}>
                {/* Patient Info Card */}
                <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eee' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Patient: <strong>{payDueModal.patient?.patient_name}</strong></p>
                    
                    {/* NEW: Test Names & Payment Mode */}
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#555' }}>
                        📋 Tests: <strong>{payDueModal.patient?.test_names || 'General Consultation'}</strong>
                    </p>
                    {/* Replace the static Prev. Mode <p> with this selection UI */}
<div style={{ marginTop: '10px' }}>
    <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
        Select Payment Mode:
    </label>
    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        {['Cash', 'UPI', 'Card'].map((mode) => (
            <button
                key={mode}
                onClick={() => setSelectedPaymentMode(mode)}
                style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #d32f2f',
                    backgroundColor: selectedPaymentMode === mode ? '#d32f2f' : 'white',
                    color: selectedPaymentMode === mode ? 'white' : '#d32f2f',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '12px'
                }}
            >
                {mode === 'Cash' ? '💵 ' : mode === 'UPI' ? '📱 ' : '💳 '}
                {mode}
            </button>
        ))}
    </div>
</div>
                </div>

                {/* Financial Summary Row */}
<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', textAlign: 'center' }}>
    <div style={{ flex: 1 }}>
        <span style={{ fontSize: '12px', color: '#777' }}>Paid</span>
        {/* Changed from total_paid to amount_paid */}
        <p style={{ margin: 0, fontWeight: 'bold', color: '#2e7d32' }}>
            ₹{payDueModal.patient?.amount_paid || 0}
        </p>
    </div>
    <div style={{ flex: 1, borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd' }}>
        <span style={{ fontSize: '12px', color: '#777' }}>Total Bill</span>
        {/* Changed from total_bill to Amount (Note the Capital A) */}
        <p style={{ margin: 0, fontWeight: 'bold' }}>
            ₹{payDueModal.patient?.Amount || 0}
        </p>
    </div>
    <div style={{ flex: 1 }}>
        <span style={{ fontSize: '12px', color: '#d32f2f' }}>Balance</span>
        {/* Changed from current_balance to balance */}
        <p style={{ margin: 0, fontWeight: 'bold', color: '#d32f2f' }}>
            ₹{payDueModal.patient?.balance || 0}
        </p>
    </div>
</div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Amount to Collect:</label>
                <input 
    type="number" 
    placeholder="Enter Received Amount"
    value={collectedAmount}
    onChange={(e) => setCollectedAmount(e.target.value)}
    onKeyDown={(e) => { if (e.key === 'Enter') handleQuickPaySubmit(); }} // Add this!
    autoFocus
    style={{ 
        width: '100%', padding: '12px', marginBottom: '20px', 
        borderRadius: '4px', border: '2px solid #d32f2f', fontSize: '18px', 
        fontWeight: 'bold', textAlign: 'center'
    }}
/>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ ...s.btnPurple, backgroundColor: '#2e7d32', flex: 2 }} onClick={handleQuickPaySubmit}>Confirm Collection</button>
                    <button style={{ ...s.btnOutline, flex: 1 }} onClick={() => { setPayDueModal({ show: false, patient: null }); setCollectedAmount(""); }}>Cancel</button>
                </div>
            </div>
        </div>
    </div>
)}

{groupInvoiceModal.show && (
    <div style={s.modalOverlay}>
        <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '15px',
            width: '90%',        // Responsive width
            maxWidth: '500px',   // Desktop limit
            maxHeight: '80vh',
            overflowY: 'auto',   // Scrollable if content is long
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }}>
            <h3 style={{ color: '#4a148c', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>
                Group Billing: {groupInvoiceModal.patient.patient_name}
            </h3>
            
            {/* Payment & Invoice Fields Required for Table */}
            <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
                <div>
                    <label style={s.label}>Total Amount</label>
                    <input type="number" style={s.input} placeholder="Enter Total Fee" />
                </div>
                <div>
                    <label style={s.label}>Payment Mode</label>
                    <select style={s.input}>
                        <option>Cash</option>
                        <option>UPI</option>
                        <option>Credit</option>
                    </select>
                </div>
                {/* Add any other specific "all info" fields here */}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                <button style={{ ...s.btnPurple, flex: 1 }} onClick={() => {/* Handle Save Invoice */}}>Generate Invoice</button>
                <button style={{ ...s.btnOutline, flex: 1 }} onClick={() => setGroupInvoiceModal({show:false})}>Cancel</button>
            </div>
        </div>
    </div>
)}
{groupPaymentModal.show && (
    <div style={s.modalOverlay}>
        <div style={{...s.modalBox, maxWidth: '850px', width: '95%', textAlign: 'left', borderRadius: '12px', overflow: 'hidden'}}>
            {/* Header */}
            <div style={{ backgroundColor: '#4a148c', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '20px' }}>💳 Patient Billing & Invoice Generation</h2>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Patient ID</div>
                    <div style={{ fontWeight: 'bold' }}>{groupPaymentModal.data.PatientID}</div>
                </div>
            </div>

            <div style={{ padding: '25px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '25px' }}>
                
                {/* Left Side: Clinical Selection */}
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                        <div>
                            <label style={s.label}>Consultant Doctor</label>
                            <select 
                                style={s.input} 
                                value={groupPaymentModal.data.doctor_id}
                                onChange={(e) => setGroupPaymentModal({
                                    ...groupPaymentModal, 
                                    data: { ...groupPaymentModal.data, doctor_id: e.target.value }
                                })}
                            >
                                <option value="">-- Select Referring Doctor --</option>
                                {metadata.doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={s.label}>Service Location</label>
                            <input style={s.input} placeholder="e.g. Main Lab / OP" />
                        </div>
                    </div>

                    <label style={s.label}>Search Tests / Profiles</label>
                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <input style={{...s.input, paddingLeft: '35px'}} placeholder="Start typing test name (e.g. CBC, Glucose...)" />
                        <span style={{ position: 'absolute', left: '10px', top: '10px' }}>🔍</span>
                    </div>

                    <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', height: '180px', overflowY: 'auto', background: '#fafafa' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead style={{ position: 'sticky', top: 0, background: '#eee' }}>
                                <tr>
                                    <th style={{ padding: '8px', textAlign: 'left' }}>Test Name</th>
                                    <th style={{ padding: '8px', textAlign: 'right' }}>Price</th>
                                    <th style={{ padding: '8px', textAlign: 'center' }}>Select</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '8px' }}>{groupPaymentModal.data.group_name} Package (Default)</td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>₹{groupPaymentModal.data.total_fee}</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}><input type="checkbox" checked readOnly /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Side: Payment Summary */}
                <div style={{ background: '#f8f4ff', padding: '20px', borderRadius: '12px', border: '1px solid #d1c4e9' }}>
                    <h3 style={{ marginTop: 0, color: '#4a148c', fontSize: '16px', borderBottom: '1px solid #d1c4e9', paddingBottom: '10px' }}>Payment Summary</h3>
                    
                    <div style={{ margin: '15px 0' }}>
                        <label style={{...s.label, fontSize: '11px'}}>Gross Amount</label>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>₹{groupPaymentModal.data.total_fee}</div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={s.label}>Discount (if any)</label>
                        <input type="number" style={s.input} defaultValue="0" />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={s.label}>Payment Mode</label>
                        <select 
                            style={s.input}
                            value={groupPaymentModal.data.payment_mode}
                            onChange={(e) => setGroupPaymentModal({
                                ...groupPaymentModal, 
                                data: { ...groupPaymentModal.data, payment_mode: e.target.value }
                            })}
                        >
                            <option value="Cash">💵 Cash</option>
                            <option value="UPI">📱 UPI / QR Code</option>
                            <option value="Card">💳 Credit/Debit Card</option>
                            <option value="Credit">🏢 Corporate Credit</option>
                        </select>
                    </div>

                    <div style={{ padding: '10px', background: 'white', borderRadius: '6px', fontSize: '12px', color: '#666' }}>
                        <strong>Patient:</strong> {groupPaymentModal.data.patient_name}<br/>
                        <strong>Group:</strong> {groupPaymentModal.data.group_name}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '20px', background: '#f5f5f5', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button 
                    style={{ ...s.btnOutline, padding: '10px 25px' }}
                    onClick={() => setGroupPaymentModal({ show: false, data: {} })}
                >
                    Discard
                </button>
                
<button 
    style={{ ...s.btnPurple, padding: '10px 40px', fontSize: '16px' }}
onClick={async () => {
    const billData = groupPaymentModal.data;

    // 1. Get the Patient ID safely
const finalID = billData.id || billData.PatientID || billData.patientid;

// 2. Find the group data to get the test string
const currentGroup = groupList.find(g => g.GroupName === billData.group_name);
const testNames = currentGroup ? currentGroup.ProfileTest : (billData.test_names || "Group Package");

if (!finalID) {
    alert("Error: No Patient ID found.");
    return;
}

try {
    const response = await fetch('http://localhost:5000/api/save-group-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            PatientID: finalID,
            patient_name: billData.patient_name,
            doctor_id: billData.doctor_id || 0,
            amount: billData.total_fee || 0,
            amount_paid: billData.total_fee || 0,
            balance: 0,
            payment_modes: billData.payment_mode || 'Cash',
            group_name: billData.group_name,
            client_code: billData.client_code,
            billing_type: 'group',
            test_names: testNames,
            TestID: billData.TestID || billData.test_id || null,
            profile_id: billData.profile_id || billData.ProfileID || null,
            collected_at_id: billData.collected_at_id || billData.location_id || null
        })
    });
    
    // ... rest of your logic
        const result = await response.json();
        if (result.success) {
            alert(`Success! Invoice ${result.invoiceNo} generated.`);
            setGroupPaymentModal({ show: false, data: {} });
            if (typeof fetchPatients === 'function') fetchPatients(); 
            if (typeof fetchBillingHistory === 'function') fetchBillingHistory(); 
        }
    } catch (err) {
        alert("Server connection failed.");
    }
}}
>
    Finalize & Print Invoice
</button>
            </div>
        </div>
    </div>
)}

        </div>
    );
}

export default FrontDesk;














