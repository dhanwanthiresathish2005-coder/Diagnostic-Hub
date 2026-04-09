import React, { useState, useEffect } from 'react';
import { 
    Box, Paper, TextField, Button, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, 
    Autocomplete, Typography 
} from '@mui/material';
import { BadgePercent, SquarePen } from 'lucide-react';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import {
      IconButton,
     Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

function EditRateCard() {
    const navigate = useNavigate();

    // --- STATE MANAGEMENT ---
    const [profiles, setProfiles] = useState([]);
    const [formData, setFormData] = useState({ 
        profileName: '', 
        amount: '', 
        endDate: '', 
        email: '', 
        phone: '' 
    });
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
const [showAll, setShowAll] = useState(false);
// 1. Define the function to fetch the latest rates
const fetchRates = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/rates/list');
        const data = await response.json();
        if (data.success) {
            
        }
    } catch (err) {
        console.error("Error fetching rates:", err);
    }
};


useEffect(() => {
    fetchRates();
}, []);

    // --- HANDLERS ---
    const handleProfileSelect = (event, newValue) => {
        if (newValue) {
            setFormData({
                ...formData,
                profileName: newValue.profile_name, 
                amount: newValue.amount || ''       
            });
        } else {
            setFormData({ ...formData, profileName: '', amount: '' });
        }
    };

    const handleSubmit = async () => {
    if (!formData.profileName) {
        return Swal.fire({
            icon: 'warning',
            title: 'Selection Required',
            text: 'Please select a profile from the dropdown before updating the rate card.',
            confirmButtonColor: '#4a148c'
        });
    }

    Swal.fire({
        title: 'Updating Rate Card...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const response = await fetch('http://localhost:5000/api/rates/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
          
            Toast.fire({
                icon: 'success',
                title: 'Rate card updated successfully!'
            });
            if (typeof fetchRates === 'function') fetchRates();
            
            setFormData({ ...formData, amount: '' }); 

        } else {
            Swal.fire('Update Failed', result.message || 'Could not update rate.', 'error');
        }
    } catch (err) {
        console.error("Update Error:", err);
        Swal.fire('Server Error', 'The connection to the billing service failed.', 'error');
    }
};

    // --- FETCH DATA ON LOAD ---
    useEffect(() => {
        const fetchExistingRates = async () => {
            try {
                // Fetch from the profiles-specific endpoint
                const response = await fetch('http://localhost:5000/api/get-profile-rates'); 
                const data = await response.json();
                setProfiles(data);
            } catch (err) {
                console.error("Failed to fetch rates:", err);
            }
        };
        fetchExistingRates();
    }, []);
    


const filteredProfiles = formData.profileName 
    ? profiles.filter(p => p.profile_name === formData.profileName) 
    : (showAll ? profiles : []); 

    // --- STYLING ---
    const containerStyle = { 
        backgroundColor: '#f0d4f5', 
        minHeight: '100vh', 
        padding: '40px 20px' 
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f3e5f5' }}>
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
            <Box sx={{ 
            flexGrow: 1,          
            display: 'flex', 
            alignItems: 'center',    
            justifyContent: 'center',  
            p: 2, 
            mb: '200px'           
        }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: '12px', maxWidth: '1300px', width: '100%' }}>
                
                {/* Header Section Inside Paper */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>

<Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 1.5, 
    mb: 2 
}}>
    {/* Combining the "Edit" and "Rate" concepts */}
    <SquarePen size={24} color="#4a148c" strokeWidth={2.5} />
    
    <Typography sx={{ color: '#4a148c', fontWeight: 'bold', fontSize: '1.5rem' }}>
        Edit Rate
    </Typography>
</Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 5 }}>
                    
                    {/* LEFT SECTION: FORM */}
                    <Box sx={{ flex: 1.2 }}>
                        <Typography sx={{ color: '#000080', fontWeight: 'bold', mb: 3 }}>
                            Search Profile
                        </Typography>
                        
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                            <Autocomplete
                                sx={{ gridColumn: 'span 1' }}
                                options={profiles}
                                getOptionLabel={(option) => option.profile_name || ""} 
                                onChange={handleProfileSelect}
                                renderInput={(params) => (
                                    <TextField {...params} label="Select Profile" size="small" variant="outlined" />
                                )}
                            />
                            
                            <TextField 
                                label="Amount" 
                                size="small" 
                                value={formData.amount}
                                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            />

                           {/* --- NEW MUI DATE PICKER FOR END DATE --- */}
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <DatePicker
      label="End Date"
      value={formData.endDate ? dayjs(formData.endDate) : null}
      onChange={(newValue) => {
        setFormData({ 
          ...formData, 
          endDate: newValue ? newValue.format('YYYY-MM-DD') : '' 
        });
      }}
      slotProps={{
        textField: {
          size: 'small',
          variant: 'outlined',
          fullWidth: true
        }
      }}
    />
  </LocalizationProvider>
                            

                            <TextField 
                                label="Creator Email" 
                                size="small" 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                            
                            <TextField 
                                label="Creator Phone" 
                                size="small" 
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </Box>

                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                            <Button 
                                variant="contained" 
                                onClick={handleSubmit}
                                sx={{ 
                                    backgroundColor: 'blue', 
                                    borderRadius: '25px', 
                                    px: 6,
                                    textTransform: 'none',
                                    fontWeight: 'bold'
                                }}
                            >
                                Submit
                            </Button>
                        </Box>
                    </Box>
                    </Box>

                    {/* RIGHT SECTION: TABLE */}
<Box sx={{ flex: 1 }}>
    <Typography sx={{ color: '#000080', fontWeight: 'bold', mb: 3 }}>
        {formData.profileName ? `Viewing: ${formData.profileName}` : "Existing Profile Details"}
    </Typography>
    
    <TableContainer sx={{ maxHeight: 400, border: '1px solid #ddd', borderRadius: '4px' }}>
        <Table size="small" stickyHeader>
            <TableHead>
                <TableRow>
                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', color: '#000080' }}>Code</TableCell>
                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', color: '#000080' }}>Profile Name</TableCell>
                    <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold', color: '#000080' }}>Rate</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {/* Use filteredProfiles here instead of profiles */}
                {filteredProfiles.map((row, index) => (
                    <TableRow key={index} hover>
                        <TableCell>{row.profile_code}</TableCell>
                        <TableCell>{row.profile_name}</TableCell>
                        <TableCell>{row.amount}</TableCell>
                    </TableRow>
                ))}
                
                {/* Show a message if filtering results in nothing (though Autocomplete makes this unlikely) */}
                {filteredProfiles.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} align="center">No profile selected or found</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </TableContainer>

  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    {/* Only show the toggle buttons if NO profile is currently searched */}
    {!formData.profileName && (
        <Button 
            size="small" 
            variant="text"
            sx={{ textTransform: 'none', color: '#000080', fontWeight: 'bold' }}
            onClick={() => setShowAll(!showAll)}
        >
            {showAll ? "↑ Show Less" : "↓ Show All Profiles"}
        </Button>
    )}

    {/* If a profile is searched, show a button to clear the search and reset the table */}
    {formData.profileName && (
        <Button 
            size="small" 
            variant="outlined"
            sx={{ textTransform: 'none', borderRadius: '15px' }}
            onClick={() => {
                setFormData({ ...formData, profileName: '', amount: '' });
                setShowAll(false);
            }}
        >
            Clear Search
        </Button>
    )}
</Box>
</Box>
            </Paper>
        </Box>

         <Box sx={{ 
                         mt: 'auto', p: 1.5, bgcolor: '#4a148c', color: 'rgba(255,255,255,0.8)', 
                         display: 'flex', justifyContent: 'center', gap: 4
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
                   
        </Box>
    );
}

export default EditRateCard;