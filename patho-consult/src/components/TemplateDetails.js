import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Autocomplete,
 IconButton,
} from '@mui/material';
import { LayoutTemplate } from 'lucide-react';
import HomeIcon from '@mui/icons-material/Home';
import {Search, Home, Mail, MapPin } from 'lucide-react';
import LogoutIcon from '@mui/icons-material/Logout';
import Swal from 'sweetalert2';

function TemplateDetails() {
    const navigate = useNavigate();

    // --- STATE MANAGEMENT ---
    const [testOptions, setTestOptions] = useState([]); 
    const [formData, setFormData] = useState({
        testName: '',
        testCode: '',
        elementName: '',
        templateName: '',
        templateType: 'Numeric',
        minVal: '',
        maxVal: '',
        unit: '',
        textDescription: ''
    });

    // --- FETCH DATA FROM BACKEND ---
    useEffect(() => {
        const fetchTests = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/tests');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const result = await response.json();
                if (result.success && Array.isArray(result.data)) {
                    setTestOptions(result.data);
                } else if (Array.isArray(result)) {
                    setTestOptions(result);
                }
            } catch (error) {
                console.error("Fetch failed. Is the server running on port 5000?", error);
            }
        };
        fetchTests();
    }, []);

  
const [elementOptions, setElementOptions] = useState([]);
const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          didOpen: (toast) => {
            Swal.getContainer().style.zIndex = '9999'; 
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
          }
        });

        

const handleTestSelect = async (event, newValue) => {
    if (newValue) {
        setFormData((prev) => ({
            ...prev,
            testName: newValue.TestName,
            testCode: newValue.TestCode,
            testId: newValue.TestID, 
            elementName: '', 
            elementId: null 
        }));
        try {
            const response = await fetch(`http://localhost:5000/api/get-test-elements/${newValue.TestID}`);
            const result = await response.json();
            if (result.success) {
                setElementOptions(result.data);
            }
        } catch (error) {
            console.error("Error fetching elements:", error);
        }
    } else {
        setFormData((prev) => ({ ...prev, testName: '', testCode: '', elementName: '', elementId: null }));
        setElementOptions([]);
    }
};
    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
    if (!formData.testName || !formData.testCode) {
        return Swal.fire({
            icon: 'warning',
            title: 'Test Not Selected',
            text: 'Please select a Test (e.g., Hemoglobin) before saving a template.',
            confirmButtonColor: '#4a148c'
        });
    }
    Swal.fire({
        title: 'Saving Template...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const payload = {
            elementId: formData.elementId,
            ranges: [
                {
                    template_name: formData.templateName || "General",
                    lower_limit: formData.templateType === 'Numeric' ? formData.minVal : null,
                    upper_limit: formData.templateType === 'Numeric' ? formData.maxVal : null,
                    unit: formData.unit,
                    text_description: formData.templateType === 'Text' ? formData.textDescription : null 
                }
            ]
        };

        const response = await fetch('http://localhost:5000/api/save-test-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (result.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Template Saved!',
                text: `Reference ranges for ${formData.testName} updated.`,
                confirmButtonColor: '#4a148c'
            });
            setFormData(prev => ({
                ...prev,
                minVal: '',
                maxVal: '',
                textDescription: ''
            }));

        } else {
            Swal.fire('Error', result.error || "Failed to save template.", 'error');
        }
    } catch (error) {
        console.error("Save Error:", error);
        Swal.fire('Connection Error', 'Server is unreachable. Check your backend status.', 'error');
    }
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

        {/* MAIN CONTENT: Centered Form */}
<Box sx={{ 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'center', 
    alignItems: 'center',     
    p: 3,
    pb: 20 
}}>
    <Paper 
        elevation={4} 
        sx={{ 
            width: '100%', 
            maxWidth: 900, 
            height: 'fit-content', 
            borderRadius: '8px', 
            overflow: 'hidden'
        }}
    >
        {/* FORM HEADER */}
<Box 
    sx={{ 
        p: 2.5, 
        px: 4, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        bgcolor: 'white', 
        borderBottom: '2px solid #f3e5f5' 
    }}
>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Using the navy color to match your typography */}
        <LayoutTemplate size={28} color="#1a237e" strokeWidth={2} />
        
        <Typography variant="h5" color="#1a237e" fontWeight="bold">
            Template Details
        </Typography>
    </Box>
</Box>

        <TableContainer sx={{ px: 2, py: 1 }}>
            <Table size="medium"> 
                <TableBody>
                    
                    {/* TEST NAME ROW */}
                    <TableRow>
                        <TableCell sx={{ width: '35%', border: '1px solid #ddd', bgcolor: '#f9f9f9', fontWeight: 'bold', fontSize: '14px', py: 2 }}>
                            <span style={{ color: 'red' }}>*</span> Test Name
                        </TableCell>
                        <TableCell sx={{ border: '1px solid #ddd', p: 1 }}>
                            <Autocomplete
                                options={testOptions}
                                getOptionLabel={(option) => 
                                    option.TestName && option.ElementName 
                                        ? `${option.TestName} (${option.ElementName})` 
                                        : option.TestName || ""
                                }
                                onChange={handleTestSelect}
                                value={testOptions.find(opt => opt.ElementID === formData.elementId) || null}
                                renderInput={(params) => (
                                    <TextField 
                                        {...params} 
                                        variant="standard" 
                                        placeholder="Search Test or Element"
                                        InputProps={{ 
                                            ...params.InputProps, 
                                            disableUnderline: true, 
                                            sx: { px: 1, fontSize: '14px' } 
                                        }} 
                                    />
                                )}
                            />
                        </TableCell>
                    </TableRow>

                    {/* TEST CODE (AUTO-FILLED) */}
                    <TableRow>
                        <TableCell sx={{ border: '1px solid #ddd', bgcolor: '#f9f9f9', fontWeight: 'bold', fontSize: '14px', py: 2 }}>
                            <span style={{ color: 'red' }}>*</span> Test Code
                        </TableCell>
                        <TableCell sx={{ border: '1px solid #ddd', p: 1 }}>
                            <TextField
                                fullWidth
                                variant="standard"
                                value={formData.testCode || ""} 
                                placeholder="Auto-filled"
                                InputProps={{ 
                                    readOnly: true, 
                                    disableUnderline: true, 
                                    sx: { px: 1, bgcolor: '#f0f0f0', fontSize: '14px', height: '40px' } 
                                }}
                            />
                        </TableCell>
                    </TableRow>

                    {/* ELEMENT NAME ROW */}
                    <TableRow>
                        <TableCell sx={{ border: '1px solid #ddd', bgcolor: '#f9f9f9', fontWeight: 'bold', fontSize: '14px', py: 2 }}>
                            <span style={{ color: 'red' }}>*</span> Element Name
                        </TableCell>
                        <TableCell sx={{ border: '1px solid #ddd', p: 1 }}>
                            <Autocomplete
                                options={elementOptions} 
                                getOptionLabel={(option) => option.ElementName || ""}
                                disabled={!formData.testName}
                                onChange={(event, newValue) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        elementName: newValue ? newValue.ElementName : '',
                                        elementId: newValue ? newValue.ElementID : null
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} variant="standard" 
                                        placeholder={formData.testName ? "Select Element" : "Select Test first"}
                                        InputProps={{ ...params.InputProps, disableUnderline: true, sx: { px: 1, fontSize: '14px' } }} 
                                    />
                                )}
                            />
                        </TableCell>
                    </TableRow>

                    {/* TEMPLATE NAME */}
                    <TableRow>
                        <TableCell sx={{ border: '1px solid #ddd', bgcolor: '#f9f9f9', fontWeight: 'bold', fontSize: '14px', py: 2 }}>
                            <span style={{ color: 'red' }}>*</span> Template Name
                        </TableCell>
                        <TableCell sx={{ border: '1px solid #ddd', p: 1 }}>
                            <TextField
                                fullWidth
                                variant="standard"
                                value={formData.templateName}
                                onChange={(e) => handleChange('templateName', e.target.value)}
                                InputProps={{ disableUnderline: true, sx: { px: 1, fontSize: '14px' } }}
                            />
                        </TableCell>
                    </TableRow>

                    {/* TEMPLATE TYPE */}
                    <TableRow>
                        <TableCell sx={{ border: '1px solid #ddd', bgcolor: '#f9f9f9', fontWeight: 'bold', fontSize: '14px', py: 2 }}>Template Type</TableCell>
                        <TableCell sx={{ border: '1px solid #ddd', p: 1 }}>
                            <Select
                                fullWidth
                                variant="standard"
                                value={formData.templateType}
                                onChange={(e) => handleChange('templateType', e.target.value)}
                                disableUnderline
                                sx={{ px: 1, fontSize: '14px' }}
                            >
                                <MenuItem value="Numeric">Numeric</MenuItem>
                                <MenuItem value="Text">Text</MenuItem>
                            </Select>
                        </TableCell>
                    </TableRow>

                    {/* DYNAMIC SECTION */}
                    {formData.templateType === 'Numeric' ? (
                        <TableRow>
                            <TableCell sx={{ border: '1px solid #ddd', bgcolor: '#e3f2fd', fontWeight: 'bold', fontSize: '14px', py: 2 }}>
                                Numeric Range
                            </TableCell>
                            <TableCell sx={{ border: '1px solid #ddd', p: 2 }}>
                                <Box sx={{ display: 'flex', gap: 3 }}>
                                    <TextField label="Min" type="number" size="small" fullWidth value={formData.minVal} onChange={(e) => handleChange('minVal', e.target.value)} />
                                    <TextField label="Max" type="number" size="small" fullWidth value={formData.maxVal} onChange={(e) => handleChange('maxVal', e.target.value)} />
                                    <TextField label="Unit" size="small" fullWidth value={formData.unit} onChange={(e) => handleChange('unit', e.target.value)} />
                                </Box>
                            </TableCell>
                        </TableRow>
                    ) : (
                        <TableRow>
                            <TableCell sx={{ border: '1px solid #ddd', bgcolor: '#fff3e0', fontWeight: 'bold', fontSize: '14px', py: 2 }}>
                                Text Description
                            </TableCell>
                            <TableCell sx={{ border: '1px solid #ddd', p: 1 }}>
                                <TextField 
                                    fullWidth multiline rows={4} 
                                    placeholder="Enter interpretive comments..." 
                                    value={formData.textDescription}
                                    onChange={(e) => handleChange('textDescription', e.target.value)}
                                    InputProps={{ disableUnderline: true, sx: { px: 1, fontSize: '14px', py: 1 } }} 
                                />
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>

        {/* SAVE ACTION */}
        <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5', borderTop: '1px solid #ddd' }}>
            <Button 
                variant="contained" 
                onClick={handleSave} 
                sx={{ 
                    bgcolor: '#283593', 
                    color: 'white', 
                    borderRadius: '25px', 
                    px: 10, 
                    py: 1.5,
                    fontSize: '16px',
                    textTransform: 'none',
                    fontWeight: 'bold'
                }}
            >
                Save Template
            </Button>
        </Box>
    </Paper>
</Box>
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

export default TemplateDetails;