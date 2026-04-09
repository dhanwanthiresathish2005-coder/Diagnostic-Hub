import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, IconButton, TextField, 
    Button, Radio, RadioGroup, FormControlLabel, Autocomplete, Divider
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Swal from 'sweetalert2';
import { FilePlus2 } from 'lucide-react';
import { Settings2 } from 'lucide-react';
import { FileEdit, Search, Home, Mail, MapPin } from 'lucide-react';

function AddFreeTextTemplate() {
    const navigate = useNavigate();
    
    // --- Existing States ---
    const [testList, setTestList] = useState([]); 
    const [selectedTest, setSelectedTest] = useState(null);
    const [testCode, setTestCode] = useState('');
    const [componentType, setComponentType] = useState('Normal');

    // --- New Feature States ---
    const [isEditing, setIsEditing] = useState(false);
    const [freeText, setFreeText] = useState(''); 
    const [components, setComponents] = useState([{ name: '', range: '', unit: '' }]);
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

    useEffect(() => {
        fetch('http://localhost:5000/api/tests')
            .then(res => res.json())
            .then(result => {
                if (result.success) setTestList(result.data);
            })
            .catch(err => console.error("Error fetching tests:", err));
    }, []);

    const handleTestSelect = (event, newValue) => {
        setSelectedTest(newValue);
        setTestCode(newValue ? newValue.TestCode : '');
        setIsEditing(false); 
    };

    

    const handleComponentChange = (index, field, value) => {
        const updated = [...components];
        updated[index][field] = value;
        setComponents(updated);
    };

    const handleUpdateClick = () => {
    if (!selectedTest) {
        return Toast.fire({ icon: 'info', title: 'Select a test first' });
    }

    fetch(`http://localhost:5000/api/get-template/${selectedTest.TestID}`)
        .then(res => res.json())
        .then(result => {
            if (result.success && result.data) {
                const savedType = result.data.template_name;
                setComponentType(savedType);

                if (savedType === 'Multiple Component') {
                    try { 
                        const parsed = JSON.parse(result.data.test_content);
                        setComponents(Array.isArray(parsed) ? parsed : [{ name: '', range: '', unit: '' }]); 
                    } catch (e) { 
                        setComponents([{ name: '', range: '', unit: '' }]); 
                    }
                } else {
                    setFreeText(result.data.test_content || "");
                }
            } else {

                setFreeText('');
                setComponents([{ name: '', range: '', unit: '' }]);
            }
            setIsEditing(true);
        })
        .catch(err => {
            console.error("Update error:", err);
            Swal.fire('Error', 'Could not load existing template', 'error');
        });
};

const handleSaveDatabase = () => {
    if (!selectedTest) return;
    Swal.fire({
        title: 'Saving Template...',
        didOpen: () => { Swal.showLoading(); },
        allowOutsideClick: false
    });

    const payload = {
        testId: selectedTest.TestID,
        templateName: componentType,
        content: componentType === 'Normal' ? freeText : JSON.stringify(components)
    };

    fetch('http://localhost:5000/api/save-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(result => {
        Swal.close();
        if (result.success) {
            Toast.fire({
                icon: 'success',
                title: 'Template saved successfully!'
            });
            setIsEditing(false);
        } else {
            Swal.fire('Error', result.message || 'Failed to save', 'error');
        }
    })
    .catch(err => {
        Swal.fire('Server Error', 'Check database connection', 'error');
    });
};

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f3e5f5' }}>
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

            {/* Navigation Bar */}

<Box 
    sx={{ 
        p: 3, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: 1.5
    }}
>
    {/* Bold icon to match the 900 font weight */}
    <FilePlus2 size={22} color="#7b1fa2" strokeWidth={3} />

    <Typography 
        variant="body2" 
        sx={{ 
            color: '#7b1fa2', 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            fontSize: '15px'
        }}
    >
        Add Test Templates
    </Typography>
</Box>

            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', p: 1, gap: 3 ,  mb: 12}}>
                
                {/* LEFT CARD: SELECTION (Shrinks when editing) */}
                <Paper elevation={6} sx={{ 
                    width: isEditing ? '35%' : '95%', 
                    maxWidth: 850, 
                    borderRadius: '12px', 
                    overflow: 'hidden',
                    transition: 'width 0.4s ease-in-out' 
                }}>

<Box 
    sx={{ 
        p: 2, 
        bgcolor: '#f8f4ff', 
        borderBottom: '2px solid #ce93d8',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5 
    }}
>
    <Settings2 size={20} color="#4a148c" strokeWidth={2.5} />
    
    <Typography variant="subtitle1" fontWeight="bold" color="#4a148c">
        Template Configuration
    </Typography>
</Box>

                    <Box sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: isEditing ? 'column' : 'row' }}>
                            <Box sx={{ flex: 2 }}>
                                <Typography variant="caption" sx={{ color: '#4a148c', fontWeight: 'bold' }}>SEARCH TEST NAME</Typography>
                                <Autocomplete
                                    options={testList}
                                    getOptionLabel={(option) => option.TestName || ""}
                                    onChange={handleTestSelect}
                                    renderInput={(params) => <TextField {...params} placeholder="Select a test..." size="small" fullWidth sx={{ mt: 0.5 }} />}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: '#4a148c', fontWeight: 'bold' }}>TEST CODE</Typography>
                                <TextField fullWidth size="small" variant="filled" value={testCode} InputProps={{ readOnly: true }} sx={{ mt: 0.5, bgcolor: '#f3e5f5', borderRadius: 1 }} />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                            <RadioGroup row value={componentType} onChange={(e) => setComponentType(e.target.value)}>
                                <FormControlLabel value="Normal" control={<Radio sx={{ color: '#4a148c' }} />} label="Normal Template" />
                                <FormControlLabel value="Multiple Component" control={<Radio sx={{ color: '#4a148c' }} />} label="Multiple Component" />
                            </RadioGroup>
                        </Box>

                        <TableContainer sx={{ maxHeight: 250, border: '1px solid #ce93d8', borderRadius: '8px' }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: '#4a148c', color: 'white', fontWeight: 'bold' }}>TestCode</TableCell>
                                        <TableCell align="center" sx={{ bgcolor: '#4a148c', color: 'white', fontWeight: 'bold' }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedTest ? (
                                        <TableRow hover>
                                            <TableCell sx={{ fontWeight: 600, color: '#4a148c' }}>{testCode}</TableCell>
                                            <TableCell align="center">
                                                <Button variant="contained" size="small" onClick={handleUpdateClick} sx={{ bgcolor: '#4a148c', textTransform: 'none' }}>
                                                    Update Template
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <TableRow><TableCell colSpan={2} align="center" sx={{ py: 6, color: '#9c27b0', fontStyle: 'italic' }}>Select a test...</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Paper>

                {/* RIGHT CARD: THE WORKSPACE (Only visible when editing) */}
                {isEditing && (
                    <Paper elevation={10} sx={{ flex: 1, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, bgcolor: '#4a148c', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle1" fontWeight="bold">Editor: {selectedTest.TestName}</Typography>
                        </Box>
                        
                        <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
                            {componentType === 'Normal' ? (
                                <TextField
                                    multiline rows={15} fullWidth variant="outlined"
                                    placeholder="Enter your clinical findings template here..."
                                    value={freeText}
                                    onChange={(e) => setFreeText(e.target.value)}
                                />
                            ) : (
                                <Box>
                                    <TableContainer sx={{ border: '1px solid #ddd', borderRadius: '8px' }}>
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: '#f3e5f5' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Component</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Range</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Unit</TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {components.map((item, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell><TextField size="small" fullWidth value={item.name} onChange={(e) => handleComponentChange(idx, 'name', e.target.value)} /></TableCell>
                                                        <TableCell><TextField size="small" fullWidth value={item.range} onChange={(e) => handleComponentChange(idx, 'range', e.target.value)} /></TableCell>
                                                        <TableCell><TextField size="small" fullWidth value={item.unit} onChange={(e) => handleComponentChange(idx, 'unit', e.target.value)} /></TableCell>
                                                        <TableCell>
                                                            <IconButton color="error" onClick={() => setComponents(components.filter((_, i) => i !== idx))}><DeleteOutlineIcon /></IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    <Button startIcon={<AddCircleOutlineIcon />} sx={{ mt: 1, color: '#4a148c' }} onClick={() => setComponents([...components, { name: '', range: '', unit: '' }])}>Add Row</Button>
                                </Box>
                            )}
                        </Box>

                        <Divider />
                        <Box sx={{ p: 2, bgcolor: '#f8f4ff', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button variant="outlined" sx={{ color: '#4a148c' }} onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button variant="contained" sx={{ bgcolor: '#2e7d32' }} onClick={handleSaveDatabase}>Save Template</Button>
                        </Box>
                    </Paper>
                )}
            </Box>

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
        </Box>
    );
}

export default AddFreeTextTemplate;