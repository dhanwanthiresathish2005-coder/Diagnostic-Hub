import React, { useState, useEffect } from 'react';
import { Box, Paper, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Autocomplete } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Edit3, Trash2 } from 'lucide-react';
  import { PlusCircle } from 'lucide-react';
 import { Layers } from 'lucide-react';
   import { ArrowUpDown } from 'lucide-react';
import {
     Typography, IconButton,
     Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { FileEdit, Search, Home, Mail, MapPin } from 'lucide-react';

function AddTestElement() {
    const navigate = useNavigate();
    const [testInput, setTestInput] = useState({ parentTestId: '', testName: '', code: '', elementName: '' });
    const [parentTests, setParentTests] = useState([]); 
    const [multipleElements, setMultipleElements] = useState([]);
    const [singleElements, setSingleElements] = useState([]);
    const [multiSearch, setMultiSearch] = useState({ name: '', code: '' });
    const [singleSearch, setSingleSearch] = useState({ name: '', code: '' });
    // Add these to your state declarations
const [showAllMulti, setShowAllMulti] = useState(false);
const [showAllSingle, setShowAllSingle] = useState(false);




    // --- SINGLE SOURCE OF TRUTH FOR DATA ---
    const fetchAllData = async () => {
    try {
        // NOTE: Use the correct endpoint you defined: /api/elements/list
        const response = await fetch('http://localhost:5000/api/elements/list');
        const data = await response.json();
        
        if (Array.isArray(data)) {
            // Box 2: Use 'Yes' (from your multipleComponents column)
            setMultipleElements(data.filter(el => el.multipleComponents === 'Yes'));
            
            // Box 3: Use anything that is NOT 'Yes'
            setSingleElements(data.filter(el => el.multipleComponents !== 'Yes')); 
        }

        const parentRes = await fetch('http://localhost:5000/api/parent-tests');
        const parentData = await parentRes.json();
        setParentTests(parentData);

    } catch (err) {
        console.error("Critical error loading data:", err);
    }
};
    // ONLY one useEffect for initial load
    useEffect(() => {
        fetchAllData();
    }, []);

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        didOpen: (toast) => {
            Swal.getContainer().style.zIndex = '9999'; 
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    const handleTestSelect = (event, newValue) => {
        if (newValue) {
            setTestInput({
                ...testInput,
                parentTestId: newValue.TestID,
                testName: newValue.TestName,
                code: newValue.TestCode || '' 
            });
            Toast.fire({ icon: 'success', title: `Linked to: ${newValue.TestName}` });
        } else {
            setTestInput({ parentTestId: '', testName: '', code: '', elementName: '' });
        }
    };
    const handleMultiNameSearch = (nameValue) => {
    // Update the search state
    setMultiSearch(prev => ({ ...prev, name: nameValue }));

    // Optional: Auto-fill the code if a match is found
    const matchedTest = parentTests.find(t => 
        t.TestName && t.TestName.toLowerCase() === nameValue.toLowerCase()
    );

    if (matchedTest) {
        setMultiSearch(prev => ({ ...prev, code: matchedTest.TestCode }));
        Toast.fire({
            icon: 'success',
            title: `Linked: ${matchedTest.TestCode}`
        });
    }
};

const handleSingleNameSearch = (nameValue) => {
    // 1. Update the local search state text
    setSingleSearch(prev => ({ ...prev, name: nameValue }));

    // 2. Look for a matching test in your master list
    const matchedTest = parentTests.find(t => 
        (t.TestName || t.test_name || "").toLowerCase() === nameValue.toLowerCase()
    );

    // 3. If found, auto-fill the code
    if (matchedTest) {
        const linkedCode = matchedTest.TestCode || matchedTest.test_code || '';
        setSingleSearch(prev => ({ ...prev, code: linkedCode }));
        
        Toast.fire({
            icon: 'success',
            title: `Linked: ${linkedCode}`
        });
    }
};

    const handleSave = async () => {
        if (!testInput.parentTestId || !testInput.elementName) {
            return Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please select a Test and enter an Element Name.',
                confirmButtonColor: '#4a148c'
            });
        }

        try {
            const response = await fetch('http://localhost:5000/api/elements/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testInput)
            });
            const result = await response.json();

            if (result.success) {
                await Swal.fire({ icon: 'success', title: 'Saved!', timer: 1000, showConfirmButton: false });
                setTestInput({ ...testInput, elementName: '' }); // Clear only element name to allow rapid adding
                fetchAllData(); 
            }
        } catch (err) { 
            Swal.fire('Error', 'Server unreachable', 'error');
        }
    };

    const handleDelete = async (id) => {
    const result = await Swal.fire({
        title: 'Delete Element?',
        text: "This will remove the element and update the test's component status.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        showLoaderOnConfirm: true, // Shows a spinner on the button
        preConfirm: async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/delete-test/${id}`, { 
                    method: 'DELETE' 
                });
                const data = await response.json();
                if (!data.success) throw new Error(data.message || 'Delete failed');
                return data;
            } catch (error) {
                Swal.showValidationMessage(`Request failed: ${error}`);
            }
        },
        allowOutsideClick: () => !Swal.isLoading()
    });

    if (result.isConfirmed) {
        Toast.fire({ icon: 'success', title: 'Element Removed' });
        fetchAllData(); // Refresh Box 2 and Box 3
    }
};

    const handleUpdatePriority = async (id, inputRef) => {
        const newPriority = inputRef.value; 
        if (!newPriority) return;

        try {
            const response = await fetch(`http://localhost:5000/api/elements/update-priority/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority: newPriority })
            });
            if ((await response.json()).success) {
                Toast.fire({ icon: 'success', title: 'Priority Updated' });
                fetchAllData();
            }
        } catch (err) {
            console.error(err);
        }
    };

const tealHeader = { backgroundColor: '#4a148c', color: 'white', padding: '10px 20px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' };
const sectionHeader = { backgroundColor: '#4a148c', color: 'white', padding: '8px', fontWeight: 'bold', textAlign: 'center' };
const tableHeaderStyle = { backgroundColor: '#e0e0e0', fontWeight: 'bold', border: '1px solid #ccc' };

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

            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* --- BOX 1: ADD ELEMENT --- */}
                <Paper elevation={2} sx={{ maxWidth: '1100px', margin: '0 auto', width: '100%',marginTop: '15px' }}>
                  

<div style={{ ...sectionHeader, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
    <PlusCircle size={18} strokeWidth={2.5} />
    <span>Add Element</span>
</div>
                    <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', gap: 2, alignItems: 'center' }}>
                        <Autocomplete
                            options={parentTests}
                            getOptionLabel={(option) => option.TestName || ""}
                            onChange={handleTestSelect}
                            renderInput={(params) => <TextField {...params} label="*Test Name" size="small" variant="outlined" />}
                        />
                        <TextField label="Test Code" size="small" value={testInput.code} InputProps={{ readOnly: true }} />
                        <TextField label="*Element Name" size="small" value={testInput.elementName} onChange={(e) => setTestInput({...testInput, elementName: e.target.value})} />
                        
                        <Box sx={{ gridColumn: 'span 3', textAlign: 'center' }}>
                            <Button variant="contained" onClick={handleSave} sx={{ backgroundColor: 'blue', borderRadius: '20px', px: 5 }}>Save</Button>
                        </Box>
                    </Box>
                </Paper>

                {/* --- BOX 2: MULTIPLE COMPONENTS --- */}

<Paper elevation={2} sx={{ maxWidth: '1100px', margin: '0 auto', width: '100%', mb: 2 }}>
    <div style={{ ...sectionHeader, display: 'flex', justifyContent: 'space-between', px: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={18} />
            <span>Multiple Components Priority</span>
        </div>
        <Button 
            size="small" 
            onClick={() => setShowAllMulti(!showAllMulti)}
            sx={{ color: 'white', textTransform: 'none' }}
        >
            {showAllMulti ? "Show Less ↑" : "Show All Elements ↓"}
        </Button>
    </div>

    <Box sx={{ p: 1, display: 'flex', gap: 2, backgroundColor: '#f5f5f5' }}>
        <TextField label="Test Name" size="small" sx={{ flex: 1, bgcolor: 'white' }} 
            value={multiSearch.name} onChange={(e) => handleMultiNameSearch(e.target.value)} />
        <TextField label="Test Code" size="small" sx={{ flex: 1, bgcolor: 'white' }} 
            value={multiSearch.code} onChange={(e) => setMultiSearch({...multiSearch, code: e.target.value})} />
    </Box>

    {(multiSearch.name || multiSearch.code || showAllMulti) ? (
        <TableContainer sx={{ maxHeight: 250 }}>
            <Table size="small" stickyHeader>
        <TableHead>
            <TableRow>
                <TableCell sx={{ ...tableHeaderStyle, backgroundColor: '#4a148c', color: 'white' }}>Element Name</TableCell>
                <TableCell sx={{ ...tableHeaderStyle, backgroundColor: '#4a148c', color: 'white' }}>TestCode</TableCell>
                <TableCell sx={{ ...tableHeaderStyle, backgroundColor: '#4a148c', color: 'white' }}>Existing Priority</TableCell>
                <TableCell sx={{ ...tableHeaderStyle, backgroundColor: '#4a148c', color: 'white' }}>Priority</TableCell>
                <TableCell sx={{ ...tableHeaderStyle, backgroundColor: '#4a148c', color: 'white' }} align="center">Update</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
                    {multipleElements
                        .filter(el => {
                            if (showAllMulti && !multiSearch.name && !multiSearch.code) return true;
                            return el.test_name.toLowerCase().includes(multiSearch.name.toLowerCase()) &&
                                   el.test_code.toLowerCase().includes(multiSearch.code.toLowerCase());
                        })
                        .map((row) => (
                            
                    <TableRow key={row.id} sx={{ '&:hover': { backgroundColor: '#f8f4ff' } }}>
                        <TableCell>{row.element_name}</TableCell>
                        <TableCell style={{ fontWeight: 'bold', color: '#4a148c' }}>{row.test_code}</TableCell>
                        <TableCell align="center">{row.existing_priority}</TableCell>
                        <TableCell>
                            <input 
                                type="number" 
                                id={`priority-input-${row.id}`}
                                defaultValue={row.priority} 
                                style={{ 
                                    width: 50, 
                                    padding: '4px', 
                                    border: '1px solid #ddd', 
                                    borderRadius: '4px',
                                    textAlign: 'center' 
                                }} 
                            />
                        </TableCell>
                        <TableCell align="center">
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                {/* Updated Update/Edit Button */}
                                <button
                                    onClick={() => handleUpdatePriority(row.id, document.getElementById(`priority-input-${row.id}`))}
                                    title="Update Priority"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        backgroundColor: '#f3e5f5',
                                        color: '#4a148c',
                                        cursor: 'pointer',
                                        transition: '0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = '#4a148c';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f3e5f5';
                                        e.currentTarget.style.color = '#4a148c';
                                    }}
                                >
                                    <Edit3 size={14} />
                                </button>

                                {/* Updated Delete Button */}
                                <button
                                    onClick={() => handleDelete(row.id)}
                                    title="Remove Element"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        backgroundColor: '#ffebee',
                                        color: '#d32f2f',
                                        cursor: 'pointer',
                                        transition: '0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = '#d32f2f';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = '#ffebee';
                                        e.currentTarget.style.color = '#d32f2f';
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
        </TableBody>
    </Table>
</TableContainer>) : (
        <Box sx={{ p: 4, textAlign: 'center', color: 'gray' }}>
            Type a Test Name or click "Show All" to view elements
        </Box>
    )}
</Paper>

                {/* --- BOX 3: SINGLE ELEMENTS --- */}
<Paper elevation={2} sx={{ maxWidth: '1100px', margin: '0 auto', width: '100%',marginTop: '-13px' }}>
    <div style={{ ...sectionHeader, display: 'flex', justifyContent: 'space-between', px: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ArrowUpDown size={18} />
            <span>Single Element Priority</span>
        </div>
        <Button 
            size="small" 
            onClick={() => setShowAllSingle(!showAllSingle)}
            sx={{ color: 'white', textTransform: 'none' }}
        >
            {showAllSingle ? "Show Less ↑" : "Show All Elements ↓"}
        </Button>
    </div>

    <Box sx={{ p: 1, display: 'flex', gap: 2, backgroundColor: '#f5f5f5' }}>
        <TextField label="Search Test Name" size="small" sx={{ flex: 1, bgcolor: 'white' }} 
            value={singleSearch.name} onChange={(e) => handleSingleNameSearch(e.target.value)} />
        <TextField label="Search Test Code" size="small" sx={{ flex: 1, bgcolor: 'white' }} 
            value={singleSearch.code} onChange={(e) => setSingleSearch({ ...singleSearch, code: e.target.value })} />
    </Box>

    {(singleSearch.name || singleSearch.code || showAllSingle) ? (
        <TableContainer sx={{ maxHeight: 250 }}>
            <Table size="small" stickyHeader>
            <TableHead>
                <TableRow>
                    <TableCell sx={{ ...tableHeaderStyle, backgroundColor: '#4a148c', color: 'white' }}>Element Name</TableCell>
                    <TableCell sx={{ ...tableHeaderStyle, backgroundColor: '#4a148c', color: 'white' }}>TestCode</TableCell>
                    <TableCell sx={{ ...tableHeaderStyle, backgroundColor: '#4a148c', color: 'white' }}>Existing Priority</TableCell>
                    <TableCell sx={{ ...tableHeaderStyle, backgroundColor: '#4a148c', color: 'white' }}>Priority</TableCell>
                    <TableCell sx={{ ...tableHeaderStyle, backgroundColor: '#4a148c', color: 'white' }} align="center">Update</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                    {singleElements
                        .filter(el => {
                            if (showAllSingle && !singleSearch.name && !singleSearch.code) return true;
                            const nameMatch = (el.test_name || el.TestName || "").toLowerCase().includes(singleSearch.name.toLowerCase());
                            const codeMatch = (el.test_code || el.TestCode || "").toLowerCase().includes(singleSearch.code.toLowerCase());
                            return nameMatch && codeMatch;
                        })
                        .map((row) => (
                        <TableRow key={row.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                            <TableCell>{row.element_name}</TableCell>
                            <TableCell style={{ fontWeight: 'bold' }}>{row.test_code}</TableCell>
                            <TableCell align="center">{row.existing_priority}</TableCell>
                            <TableCell>
                                <input 
                                    type="number" 
                                    id={`priority-single-${row.id}`}
                                    defaultValue={row.priority} 
                                    style={{ 
                                        width: 50, padding: '4px', border: '1px solid #ddd', 
                                        borderRadius: '4px', textAlign: 'center' 
                                    }} 
                                />
                            </TableCell>
                            <TableCell align="center">
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                    <button
                                        onClick={() => handleUpdatePriority(row.id, document.getElementById(`priority-single-${row.id}`))}
                                        title="Update"
                                        style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        backgroundColor: '#f3e5f5',
                                        color: '#4a148c',
                                        cursor: 'pointer',
                                        transition: '0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = '#4a148c';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f3e5f5';
                                        e.currentTarget.style.color = '#4a148c';
                                    }} // Use your existing style object
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(row.id)}
                                        title="Delete"
                                        style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        backgroundColor: '#ffebee',
                                        color: '#d32f2f',
                                        cursor: 'pointer',
                                        transition: '0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = '#d32f2f';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = '#ffebee';
                                        e.currentTarget.style.color = '#d32f2f';
                                    }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                {singleElements.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'gray' }}>
                            No Single Elements found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </TableContainer>
) : (
        <Box sx={{ p: 4, textAlign: 'center', color: 'gray' }}>
            Search for a test to see single elements
        </Box>
    )}
</Paper>

{/* <Paper elevation={2} sx={{ maxWidth: '1100px', margin: '0 auto', width: '100%', marginTop: '15px' }}>
    <div style={{ ...sectionHeader, display: 'flex', justifyContent: 'space-between', px: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ArrowUpDown size={18} />
            <span>Single Element Priority</span>
        </div>
        <Button 
            size="small" 
            onClick={() => setShowAllSingle(!showAllSingle)}
            sx={{ color: 'white', textTransform: 'none' }}
        >
            {showAllSingle ? "Show Less" : "Show All Elements"}
        </Button>
    </div>

    <Box sx={{ p: 1, display: 'flex', gap: 2, backgroundColor: '#f5f5f5' }}>
        <TextField label="Search Test Name" size="small" sx={{ flex: 1, bgcolor: 'white' }} 
            value={singleSearch.name} onChange={(e) => handleSingleNameSearch(e.target.value)} />
        <TextField label="Search Test Code" size="small" sx={{ flex: 1, bgcolor: 'white' }} 
            value={singleSearch.code} onChange={(e) => setSingleSearch({ ...singleSearch, code: e.target.value })} />
    </Box>

    {(singleSearch.name || singleSearch.code || showAllSingle) ? (
        /* Reduced maxHeight to ~200px to show roughly 5 rows 
        <TableContainer sx={{ maxHeight: 210, overflowY: 'auto' }}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ ...tableHeaderStyle, backgroundColor: '#4a148c', color: 'white' }}>Element Name</TableCell>
                        <TableCell sx={{ ...tableHeaderStyle, backgroundColor: '#4a148c', color: 'white' }}>TestCode</TableCell>
                        <TableCell sx={{ ...tableHeaderStyle, backgroundColor: '#4a148c', color: 'white' }}>Existing Priority</TableCell>
                        <TableCell sx={{ ...tableHeaderStyle, backgroundColor: '#4a148c', color: 'white' }}>Priority</TableCell>
                        <TableCell sx={{ ...tableHeaderStyle, backgroundColor: '#4a148c', color: 'white' }} align="center">Update</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {singleElements
                        .filter(el => {
                            if (showAllSingle && !singleSearch.name && !singleSearch.code) return true;
                            const nameMatch = (el.test_name || el.TestName || "").toLowerCase().includes(singleSearch.name.toLowerCase());
                            const codeMatch = (el.test_code || el.TestCode || "").toLowerCase().includes(singleSearch.code.toLowerCase());
                            return nameMatch && codeMatch;
                        })
                        .map((row) => (
                        <TableRow key={row.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                            <TableCell>{row.element_name}</TableCell>
                            <TableCell style={{ fontWeight: 'bold' }}>{row.test_code}</TableCell>
                            <TableCell align="center">{row.existing_priority}</TableCell>
                            <TableCell>
                                <input 
                                    type="number" 
                                    id={`priority-single-${row.id}`}
                                    defaultValue={row.priority} 
                                    style={{ 
                                        width: 50, padding: '4px', border: '1px solid #ddd', 
                                        borderRadius: '4px', textAlign: 'center' 
                                    }} 
                                />
                            </TableCell>
                            <TableCell align="center">
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                    <button
                                        onClick={() => handleUpdatePriority(row.id, document.getElementById(`priority-single-${row.id}`))}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            width: '28px', height: '28px', borderRadius: '50%', border: 'none',
                                            backgroundColor: '#f3e5f5', color: '#4a148c', cursor: 'pointer'
                                        }}
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(row.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            width: '28px', height: '28px', borderRadius: '50%', border: 'none',
                                            backgroundColor: '#ffebee', color: '#d32f2f', cursor: 'pointer'
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    ) : (
        <Box sx={{ p: 4, textAlign: 'center', color: 'gray' }}>
            Search for a test to see single elements
        </Box>
    )}
</Paper> */}

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

export default AddTestElement;