import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { UserRoundPlus } from 'lucide-react';
import HomeIcon from '@mui/icons-material/Home';
import { Box, IconButton, Typography } from '@mui/material';
import Swal from 'sweetalert2';
import { FileEdit, Search, Home, Mail, MapPin } from 'lucide-react';

// --- THEME COLORS ---
const COLORS = {
    primary: '#4a148c',    
    secondary: '#7b1fa2',  
    accent: '#f3e5f5',     
    background: '#f1d9f5', 
    white: '#ffffff',
    text: '#333333'
};

// --- REFINED HELPER STYLES ---
const tableHeaderStyle = {
    padding: '12px 15px',
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: '13px',
    border: '1px solid #6a1b9a'
};

const tableCellStyle = {
    padding: '12px 15px',
    borderBottom: '1px solid #eee',
    fontSize: '13px',
    color: COLORS.text
};

const priorityTableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
    marginTop: '10px'
};

// --- REFINED HELPER COMPONENTS ---
const SectionHeader = ({ title }) => (
    <div style={{ 
        backgroundColor: COLORS.secondary, 
        padding: '10px 15px', 
        fontSize: '13px', 
        fontWeight: 'bold', 
        color: COLORS.white,
        borderRadius: '4px 4px 0 0'
    }}>
        {title}
    </div>
);


const ProfileInput = ({ label, name, required, value, onChange }) => (
    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
        <td style={{ width: '200px', padding: '15px', fontSize: '13px', fontWeight: 'bold', color: COLORS.primary }}>
            {label} {required && <span style={{ color: 'red' }}>*</span>}
        </td>
        <td style={{ padding: '10px' }}>
            <input 
                name={name} 
                value={value} 
                onChange={onChange}
                style={{ 
                    width: '95%', 
                    padding: '10px', 
                    border: '1px solid #ccc', 
                    borderRadius: '5px',
                    outline: 'none'
                }} 
            />
        </td>
    </tr>
);

// --- MAIN COMPONENT ---
const AddProfile = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('CreateProfile');
    const navButtons = [
        { id: 'CreateProfile', label: 'Create Profile' },
        { id: 'AddTestInProfile', label: 'Add Test' },
        { id: 'AddSubProfile', label: 'Sub-Profile' },
        { id: 'EditViewProfile', label: 'Edit/View' },
        { id: 'Priority', label: 'Priority' }
    ];
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [availableTests, setAvailableTests] = useState([]);
    const [profileSearch, setProfileSearch] = useState('');
    const [formData, setFormData] = useState({
        profileName: '',
        displayName: '',
        amount: ''
    });
const [parentProfile, setParentProfile] = useState(null);
const [allProfiles, setAllProfiles] = useState([]);
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

// 1. To fix Line 283: Fetch the main list of profiles
const fetchProfiles = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/get-profiles');
        const data = await response.json();
        if (data.success) {
            setProfileList(data.data); // Assuming your state is called profileList
        }
    } catch (err) {
        console.error("Error fetching profiles:", err);
    }
};

// 2. To fix Line 228: Fetch tests linked to a specific profile
const fetchProfileTests = async (profileId) => {
    try {
        const response = await fetch(`http://localhost:5000/api/get-profile-tests/${profileId}`);
        const data = await response.json();
        // Update your 'selectedProfile' or a specific 'linkedTests' state
        setSelectedProfile(prev => ({ ...prev, tests: data.tests || [] }));
    } catch (err) {
        console.error("Error fetching linked tests:", err);
    }
};

// 3. To fix Line 170: Fetch sub-profiles linked to a main profile
const fetchLinkedSubProfiles = async (profileId) => {
    try {
        const response = await fetch(`http://localhost:5000/api/get-linked-subprofiles/${profileId}`);
        const data = await response.json();
        setSelectedProfile(prev => ({ ...prev, subProfiles: data.subProfiles || [] }));
    } catch (err) {
        console.error("Error fetching sub-profiles:", err);
    }
};

// Fetch all profiles to show as potential sub-profiles
const fetchAllProfiles = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/get-subprofile-list');
        const data = await response.json();
        setAllProfiles(data);
    } catch (error) {
        console.error("Error fetching profiles:", error);
    }
};


const handleLinkSubProfile = async (childId) => {
    // 1. Validation with a Modal
    if (!selectedProfile) {
        return Swal.fire({
            icon: 'info',
            title: 'No Main Profile Selected',
            text: 'Search and select a Main Profile (e.g., Health Package) before linking sub-tests.',
            confirmButtonColor: '#4a148c'
        });
    }

    // 2. Show a subtle loading state
    // This prevents double-clicking while the database is writing
    Swal.fire({
        title: 'Linking...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const response = await fetch('http://localhost:5000/api/link-subprofile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                parentId: selectedProfile.id, 
                childId: childId            
            })
        });
        
        const result = await response.json();
        
        // Close the loading modal
        Swal.close();

        if (response.ok) {
            // 3. SUCCESS: Use Toast so the user can keep working
            Toast.fire({
                icon: 'success',
                title: 'Sub-profile linked successfully!'
            });

            // Optional: If you have a function to refresh the list of linked profiles
            if (typeof fetchLinkedSubProfiles === 'function') {
                fetchLinkedSubProfiles(selectedProfile.id);
            }
            
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Linking Failed',
                text: result.error || "Could not link these profiles.",
                confirmButtonColor: '#4a148c'
            });
        }
    } catch (error) {
        console.error("Linking error:", error);
        Swal.fire('Server Error', 'Check your network connection.', 'error');
    }
};

    // Function to handle typing in inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddTest = async (testId) => {
    // 1. Validation with a Modal
    if (!selectedProfile) {
        return Swal.fire({
            icon: 'info',
            title: 'No Profile Selected',
            text: 'Please select a Profile (e.g., Lipid Profile) before adding individual tests.',
            confirmButtonColor: '#4a148c'
        });
    }

    try {
        // Optional: Show a "Processing" state for slow connections
        // Swal.showLoading();

        const response = await fetch('http://localhost:5000/api/link-test-to-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                profileId: selectedProfile.id,
                testId: testId               
            })
        });

        const result = await response.json();

        if (response.ok) {
            // 2. SUCCESS: Use Toast for rapid-fire linking
            Toast.fire({
                icon: 'success',
                title: 'Test linked successfully!'
            });

            // 3. Optional: Refresh your "Linked Tests" table immediately
            if (typeof fetchProfileTests === 'function') {
                fetchProfileTests(selectedProfile.id);
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Linking Failed',
                text: result.error || "This test might already be linked.",
                confirmButtonColor: '#4a148c'
            });
        }
    } catch (error) {
        console.error("Linking error:", error);
        Swal.fire('Connection Error', 'Check if the backend server is running.', 'error');
    }
};

    // Function to save the profile to the database
    const handleSaveProfile = async () => {
    // 1. Validation with a "Warning" Modal
    if (!formData.profileName || !formData.amount) {
        return Swal.fire({
            icon: 'warning',
            title: 'Incomplete Form',
            text: 'Profile Name and Amount are mandatory for billing accuracy.',
            confirmButtonColor: '#4a148c'
        });
    }

    // 2. Loading state to prevent double-submissions
    Swal.fire({
        title: 'Creating Profile...',
        didOpen: () => { Swal.showLoading(); },
        allowOutsideClick: false
    });

    try {
        const response = await fetch('http://localhost:5000/api/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            // 3. SUCCESS: Clear modal and show success
            await Swal.fire({
                icon: 'success',
                title: 'Profile Registered!',
                text: `${formData.profileName} has been added to the master list.`,
                confirmButtonColor: '#4a148c'
            });

            // 4. Reset Form
            setFormData({ profileName: '', displayName: '', amount: '' }); 
            
            // Optional: If you have a list of profiles on the same page, refresh it here
            if (typeof fetchProfiles === 'function') fetchProfiles();

        } else {
            const result = await response.json();
            Swal.fire('Error', result.error || "Could not save profile.", 'error');
        }
    } catch (error) {
        console.error("Connection error:", error);
        Swal.fire('Server Error', 'The backend service is currently unreachable.', 'error');
    }
};
    const [profileList, setProfileList] = useState([]);

const fetchProfileList = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/get-profiles');
        const result = await response.json();
        
        // FIX: Extract 'data' or 'results' from the object
        if (result && Array.isArray(result.data)) {
            setProfileList(result.data); 
        } else if (Array.isArray(result)) {
            setProfileList(result);
        } else {
            console.error("Unexpected data format:", result);
            setProfileList([]); // Fallback to empty array to prevent crash
        }
    } catch (error) {
        console.error("Error fetching list:", error);
        setProfileList([]); 
    }
};
// Update your existing useEffect
React.useEffect(() => {
    if (activeTab === 'AddTestInProfile') fetchTests();
    if (activeTab === 'AddSubProfile') fetchAllProfiles();
    if (activeTab === 'EditViewProfile') fetchProfileList(); // New trigger
}, [activeTab]);

const fetchTests = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/tests');
        const data = await response.json();
        
        // FIX: Target the array inside the response object
        const testArray = data.results || data.data || data;

        if (Array.isArray(testArray)) {
            setAvailableTests(testArray);
        } else {
            setAvailableTests([]); 
        }
    } catch (error) {
        setAvailableTests([]); 
    }
};

const handleProfileSearch = async (term) => {
    setProfileSearch(term);
    if (term.length > 1) {
        try {
            const response = await fetch(`http://localhost:5000/api/search-profiles?term=${term}`);
            const json = await response.json();
            
            // FIX: Unwrap search results
            const results = json.results || json.data || json;

            if (Array.isArray(results) && results.length > 0) {
                const foundProfile = results[0];
                const detailsRes = await fetch(`http://localhost:5000/api/get-profile-details/${foundProfile.id}`);
                const detailsJson = await detailsRes.json();
                
                // FIX: Ensure sub-properties are also extracted correctly
                const details = detailsJson.data || detailsJson;

                setSelectedProfile({
                    ...foundProfile,
                    tests: details.tests || [],
                    subProfiles: details.subProfiles || []
                });
            }
        } catch (error) {
            console.error("Search error:", error);
        }
    }
};

const handleUpdateProfile = async (id) => {
    const amtInput = document.getElementById(`amt-${id}`);
    const prioInput = document.getElementById(`prio-${id}`);
    
    const newAmt = amtInput?.value; 
    const newPrio = prioInput?.value;

    // Check if both are empty strings or null
    if (!newAmt && !newPrio) {
        return Toast.fire({
            icon: 'info',
            title: 'No changes entered',
            text: 'Please enter a New Amount or Priority.'
        });
    }

    try {
        const response = await fetch(`http://localhost:5000/api/update-profile/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                // Only send if the user actually typed something
                amount: newAmt !== "" ? newAmt : null, 
                priority: newPrio !== "" ? newPrio : null 
            })
        });

        const result = await response.json();

        if (response.ok && result.success) { // Matching the new backend success flag
            setProfileList(prevList => 
                prevList.map(profile => 
                    profile.id === id ? { 
                        ...profile, 
                        // If user entered a value, use it; otherwise, keep old value
                        amount: newAmt !== "" ? Number(newAmt) : profile.amount,
                        priority: newPrio !== "" ? Number(newPrio) : profile.priority 
                    } : profile
                )
            );

            Toast.fire({
                icon: 'success',
                title: 'Profile Updated',
                text: `Changes saved for ID: ${id}`
            });
            
            // CRITICAL: Clear inputs so the UI looks fresh
            if(amtInput) amtInput.value = '';
            if(prioInput) prioInput.value = '';
        } else {
            Swal.fire('Update Failed', result.error || "Unknown error", 'error');
        }
    } catch (err) { 
        console.error("Update error:", err);
        Swal.fire('Server Error', 'Could not save profile changes.', 'error');
    }
};


const handleDeleteProfile = async (id) => {
    const result = await Swal.fire({
        title: 'Delete this Profile?',
        text: "This may affect reports and billing history associated with this profile!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', // Dangerous action
        cancelButtonColor: '#4a148c',
        confirmButtonText: 'Yes, delete permanently'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`http://localhost:5000/api/delete-profile/${id}`, { 
                method: 'DELETE' 
            });

            if (response.ok) {
                // Instantly remove from UI
                setProfileList(prev => prev.filter(p => p.id !== id));
                
                Toast.fire({
                    icon: 'success',
                    title: 'Profile Deleted'
                });
            } else {
                Swal.fire('Error', 'Could not delete profile. It might be in use.', 'error');
            }
        } catch (error) {
            Swal.fire('Connection Error', 'Server is unreachable.', 'error');
        }
    }
};

const handleUpdateMappingPriority = async (linkId, type) => {
    const inputId = type === 'test' ? `prio-test-${linkId}` : `new-prio-sub-${linkId}`;
    const inputField = document.getElementById(inputId);
    const newPriority = inputField?.value;

    // 1. Validation: Ensure it's a number
    if (!newPriority || isNaN(newPriority)) {
        return Toast.fire({
            icon: 'warning',
            title: 'Invalid Priority',
            text: 'Please enter a valid number.'
        });
    }

    try {
        const response = await fetch('http://localhost:5000/api/update-link-priority', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                linkId: linkId, 
                priority: parseInt(newPriority), 
                type: type,
                parentId: selectedProfile.id 
            })
        });

        if (response.ok) {
            // 2. SUCCESS TOAST: Quick feedback without blocking the UI
            Toast.fire({
                icon: 'success',
                title: 'Priority Updated',
                position: 'bottom-end' // Out of the way of the input fields
            });

            // 3. REFRESH: Fetch updated data to sync the UI state
            const res = await fetch(`http://localhost:5000/api/get-profile-details/${selectedProfile.id}`);
            const data = await res.json();
            
            setSelectedProfile(prev => ({
                ...prev,
                tests: data.tests || [],
                subProfiles: data.subProfiles || []
            }));

            // Clear the input after successful update
            if(inputField) inputField.value = '';

        } else {
            Swal.fire('Error', 'Could not update priority mapping.', 'error');
        }
    } catch (err) {
        console.error("Update Error:", err);
        Swal.fire('Connection Error', 'Check your server status.', 'error');
    }
};
    return (
        <div style={{ backgroundColor: COLORS.background, minHeight: '100vh', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
            
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

            <div style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                
                {/* Tab Navigation (Pill Style) */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '25px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {navButtons.map((btn) => (
                        <button
                            key={btn.id}
                            onClick={() => setActiveTab(btn.id)}
                            style={{
                                backgroundColor: activeTab === btn.id ? COLORS.primary : COLORS.white,
                                color: activeTab === btn.id ? COLORS.white : COLORS.primary,
                                border: `2px solid ${COLORS.primary}`,
                                padding: '10px 22px',
                                borderRadius: '25px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>

                {/* Content Area Card */}
                <div style={{ 
                    backgroundColor: COLORS.white, 
                    borderRadius: '12px', 
                    width: '100%', 
                    maxWidth: '950px', 
                    minHeight: '450px', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)', 
                    overflow: 'hidden' 
                }}>
                    
                    {/* 1. CREATE PROFILE SECTION */}
{activeTab === 'CreateProfile' && (
    <div style={{ 
        padding: '30px', 
        border: `2px solid ${COLORS.primary}`, 
        borderRadius: '8px', 
        margin: '20px',
        boxShadow: `0 0 15px ${COLORS.accent}` 
    }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>

<div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center',    
    justifyContent: 'center', 
    marginBottom: '20px' 
}}>
    <UserRoundPlus size={40} color={COLORS.primary} strokeWidth={2} style={{ marginBottom: '10px' }} />
    
    <h2 style={{ 
        color: COLORS.primary, 
        margin: 0, 
        textAlign: 'center', 
        textTransform: 'uppercase', 
        letterSpacing: '2px', // Increased slightly for a "cleaner" look
        fontSize: '1.4rem'
    }}>
        New Profile Registration
    </h2>
</div>
            <div style={{ 
                backgroundColor: COLORS.accent, 
                padding: '8px', 
                borderRadius: '4px', 
                display: 'inline-block',
                border: `1px dashed ${COLORS.secondary}`
            }}>
                <p style={{ color: COLORS.primary, fontSize: '12px', fontWeight: 'bold', margin: 0 }}>
                    ⚠️ Note: Use only ( ) special characters in profile names.
                </p>
            </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: '4px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                    <ProfileInput 
                        label="Profile Name" 
                        name="profileName" 
                        required 
                        value={formData.profileName} 
                        onChange={handleInputChange} 
                    />
                    <ProfileInput 
                        label="Display Name" 
                        name="displayName" 
                        value={formData.displayName} 
                        onChange={handleInputChange} 
                    />
                    <ProfileInput 
                        label="Amount (INR)" 
                        name="amount" 
                        required 
                        value={formData.amount} 
                        onChange={handleInputChange} 
                    />
                </tbody>
            </table>
        </div>

        <div style={{ textAlign: 'center', marginTop: '35px' }}>
            <button 
                onClick={handleSaveProfile} // Added the click handler
                onMouseOver={(e) => e.target.style.backgroundColor = COLORS.secondary}
                onMouseOut={(e) => e.target.style.backgroundColor = COLORS.primary}
                style={{ 
                    backgroundColor: COLORS.primary, 
                    color: 'white', 
                    padding: '14px 70px', 
                    border: 'none', 
                    borderRadius: '30px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer', 
                    fontSize: '16px',
                    boxShadow: '0 4px 12px rgba(74, 20, 140, 0.3)',
                    transition: 'all 0.3s ease'
                }}
            >
                Save Profile
            </button>
        </div>
    </div>
)}


                    {/* 2. ADD TEST IN PROFILE SECTION */}
{activeTab === 'AddTestInProfile' && (
    <div style={{ padding: '30px', border: `2px solid ${COLORS.primary}`, borderRadius: '8px', margin: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '15px', fontWeight: 'bold', color: COLORS.primary, marginRight: '10px' }}>
                Select Profile:
            </span>
            <input 
                type="text"
                placeholder="Search Profile to add tests..." 
                value={profileSearch}
                onChange={(e) => handleProfileSearch(e.target.value)}
                style={{ padding: '10px', width: '300px', border: `1px solid ${COLORS.primary}`, borderRadius: '5px' }} 
            />
            {selectedProfile && (
                <div style={{ marginTop: '5px', color: 'green', fontSize: '12px', fontWeight: 'bold' }}>
                    Selected: {selectedProfile.profile_name} ({selectedProfile.profile_code})
                </div>
            )}
        </div>

        <SectionHeader title="Available Test Details" />
        <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${COLORS.primary}` }}>
            <thead>
                <tr style={{ backgroundColor: COLORS.primary, color: 'white' }}>
                    <th style={tableHeaderStyle}>Test Code</th>
                    <th style={tableHeaderStyle}>Test Name</th>
                    <th style={tableHeaderStyle}>Action</th>
                </tr>
            </thead>
            <tbody>
                {availableTests.length > 0 ? (
                    availableTests.map((test) => (
                        <tr key={test.TestID} style={{ backgroundColor: COLORS.white }}>
                            {/* Match these exactly to your PHPMyAdmin column names */}
                            <td style={tableCellStyle}>{test.TestID}</td> 
                            <td style={tableCellStyle}>{test.TestName}</td>
                            <td 
                                onClick={() => handleAddTest(test.TestID)}
                                style={{ ...tableCellStyle, color: COLORS.primary, fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                + Add to Profile
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                            No tests found in database.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
)}
                    {activeTab === 'AddSubProfile' && (
    <div style={{ padding: '30px', border: `2px solid ${COLORS.primary}`, borderRadius: '8px', margin: '20px' }}>
        <div style={{ marginBottom: '25px' }}>
            <span style={{ fontSize: '15px', fontWeight: 'bold', color: COLORS.primary, marginRight: '10px' }}>
                Main Profile (Parent):
            </span>
            <input 
                placeholder="Search Parent Profile..." 
                onChange={(e) => handleProfileSearch(e.target.value)} // Reusing your existing search
                style={{ padding: '10px', width: '300px', border: `1px solid ${COLORS.primary}`, borderRadius: '5px' }} 
            />
            {selectedProfile && (
                <div style={{ marginTop: '5px', color: 'green', fontSize: '12px', fontWeight: 'bold' }}>
                    Parent Selected: {selectedProfile.profile_name}
                </div>
            )}
        </div>

        <SectionHeader title="Select Profiles to Add as Sub-Profiles" />
        <div style={{ borderRadius: '8px', overflow: 'hidden', border: `1px solid ${COLORS.primary}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={tableHeaderStyle}>Profile Name</th>
                        <th style={tableHeaderStyle}>Code</th>
                        <th style={tableHeaderStyle}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Map through allProfiles here */}
                    {allProfiles.map((p) => (
                        <tr key={p.id}>
                            <td style={tableCellStyle}>{p.profile_name}</td>
                            <td style={tableCellStyle}>{p.profile_code}</td>
                            <td 
                                onClick={() => handleLinkSubProfile(p.id)}
                                style={{ ...tableCellStyle, color: 'blue', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                + Link as Subprofile
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)}

                   {activeTab === 'EditViewProfile' && (
    <div style={{ padding: '20px' }}>
        {/* Search Bar matching the reference UI */}
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Profile:</span>
            <input 
    type="text" 
    placeholder="Search by name..." 
    style={{ padding: '8px', width: '250px', border: '1px solid #ccc', borderRadius: '4px' }}
    onChange={(e) => setProfileSearch(e.target.value)} // Just track the term
/>
            <button style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '50%', cursor: 'pointer' }}>+</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
                <thead>
                    <tr style={{ backgroundColor: '#4a148c', color: 'white' }}>
                        <th style={{...tableHeaderStyle, backgroundColor: '#4a148c'}}>Profile Name</th>
                        <th style={{...tableHeaderStyle, backgroundColor: '#4a148c'}}>Profile Code</th>
                        <th style={{...tableHeaderStyle, backgroundColor: '#4a148c'}}>Current Amount</th>
                        <th style={{...tableHeaderStyle, backgroundColor: '#4a148c'}}>New Amount</th>
                        <th style={{...tableHeaderStyle, backgroundColor: '#4a148c'}}>Existing Priority</th>
                        <th style={{...tableHeaderStyle, backgroundColor: '#4a148c'}}>Updated Priority</th>
                        <th style={{...tableHeaderStyle, backgroundColor: '#4a148c'}}>Action</th>
                        <th style={{...tableHeaderStyle, backgroundColor: '#4a148c'}}>Delete</th>
                    </tr>
                </thead>
              <tbody>
    {profileList
        // 1. Filter the list based on the search term state
        .filter((p) =>
            p.profile_name.toLowerCase().includes(profileSearch.toLowerCase())
        )
        // 2. Map the filtered results to table rows
        .map((profile) => (
            <tr key={profile.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={tableCellStyle}>{profile.profile_name}</td>
                <td style={tableCellStyle}>{profile.profile_code}</td>
                <td style={tableCellStyle}>{profile.amount}</td>
                
                {/* New Amount Input */}
                <td style={tableCellStyle}>
                    <input 
                        type="number" 
                        placeholder="New Amt"
                        style={{ width: '80px', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        id={`amt-${profile.id}`}
                    />
                </td>

                {/* Existing Priority - Strictly checks for 0 */}
                <td style={{ ...tableCellStyle, fontWeight: 'bold', color: COLORS.primary }}>
                    {profile.priority !== null && profile.priority !== undefined ? profile.priority : 0}
                </td>

                {/* Updated Priority Input */}
                <td style={tableCellStyle}>
                    <input 
                        type="number" 
                        placeholder="0"
                        style={{ width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        id={`prio-${profile.id}`}
                    />
                </td>

                {/* Save Action */}
                <td style={tableCellStyle}>
                    <button 
                        onClick={() => handleUpdateProfile(profile.id)}
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontSize: '20px',
                            transition: 'transform 0.1s ease'
                        }}
                        title="Save Changes"
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                        💾
                    </button>
                </td>

                {/* Delete Action */}
                <td style={tableCellStyle}>
                    <button 
                        onClick={() => handleDeleteProfile(profile.id)}
                        style={{ 
                            color: '#d9534f', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontSize: '18px' 
                        }}
                        title="Delete Profile"
                    >
                        🗑️
                    </button>
                </td>
            </tr>
        ))
    }
    
    {/* Show message if search returns nothing */}
    {profileList.filter(p => p.profile_name.toLowerCase().includes(profileSearch.toLowerCase())).length === 0 && (
        <tr>
            <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                No profiles matching "{profileSearch}"
            </td>
        </tr>
    )}
</tbody>
            </table>
        </div>
    </div>
)}
                    {/* 5. PRIORITY MANAGEMENT SECTION */}
{activeTab === 'Priority' && (
    <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: COLORS.accent, padding: '15px', borderRadius: '8px' }}>
            <span style={{ fontWeight: 'bold', color: COLORS.primary }}>Main Profile:</span>
            <input 
                type="text" 
                placeholder="Search Profile (e.g. OT Profile)..." 
                style={{ padding: '10px', width: '300px', borderRadius: '5px', border: `1px solid ${COLORS.primary}` }}
                value={profileSearch}
                onChange={(e) => handleProfileSearch(e.target.value)}
            />
        </div>

        {selectedProfile ? (
            <>
                {/* TABLE 1: TESTS INSIDE THE PROFILE */}
                <div style={{ marginBottom: '30px' }}>
                    <SectionHeader title={`Tests in: ${selectedProfile.profile_name}`} />
                    <table style={priorityTableStyle}>
                        <thead>
                            <tr>
                                <th style={tableHeaderStyle}>Test Code</th>
                                <th style={tableHeaderStyle}>Test Name</th>
                                <th style={tableHeaderStyle}>Priority</th>
                                <th style={tableHeaderStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedProfile.tests?.length > 0 ? (
                                selectedProfile.tests.map((test) => (
                                    <tr key={`test-${test.link_id}`}>
                                        <td style={tableCellStyle}>{test.test_code}</td>
                                        <td style={tableCellStyle}>{test.test_name}</td>
                                        <td style={tableCellStyle}>
                                            <input 
                                                id={`prio-test-${test.link_id}`}
                                                type="number" 
                                                defaultValue={test.priority || 0} 
                                                style={{ width: '60px', padding: '5px' }} 
                                            />
                                        </td>
                                        <td style={tableCellStyle}>
                                            <button 
                                                onClick={() => handleUpdateMappingPriority(test.link_id, 'test')}
                                                style={{ color: 'blue', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                                Update
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" style={{textAlign: 'center', padding: '10px'}}>No tests linked.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* TABLE 2: SUB-PROFILES INSIDE THE PROFILE */}
                <div>
                    <SectionHeader title="Linked Sub-Profiles" />
                    <table style={priorityTableStyle}>
                        <thead>
                            <tr>
                                <th style={tableHeaderStyle}>Profile Code</th>
                                <th style={tableHeaderStyle}>Profile Name</th>
                                <th style={tableHeaderStyle}>Priority</th>
                                <th style={tableHeaderStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedProfile.subProfiles?.length > 0 ? (
                                    selectedProfile.subProfiles.map((sub) => (
                                        <tr key={`sub-${sub.link_id}`}>
                                            <td style={tableCellStyle}>{sub.profile_code}</td>
                                            <td style={tableCellStyle}>{sub.profile_name}</td>
                                            <td style={tableCellStyle}>
                                                <input 
                                                    id={`new-prio-sub-${sub.link_id}`}
                                                    type="number" 
                                                    defaultValue={sub.priority || 0} 
                                                    style={{ width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} 
                                                />
                                            </td>
                                            <td style={tableCellStyle}>
                                                <button 
                                                    onClick={() => handleUpdateMappingPriority(sub.link_id, 'sub')}
                                                    style={{ color: COLORS.primary, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                                    Update
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                            No Sub-Profiles linked to this Parent.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
                    <p>🔍 Search for a Main Profile above to manage its internal test priorities.</p>
                </div>
            )}
        </div>
    )}
</div> 
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
</div>
);
};

export default AddProfile;