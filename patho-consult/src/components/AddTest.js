import React, { useState,useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { AddCircle, DeleteForever, Close, Layers } from '@mui/icons-material';
import { IconButton, Button, Tooltip } from '@mui/material';
import { Calculate,  Add, InfoOutlined,Settings, Save,PregnantWoman} from '@mui/icons-material';
import { CloudUpload, AddPhotoAlternate,Abc, Send } from '@mui/icons-material';
import Swal from 'sweetalert2';
import {    DeleteForever as Delete } from '@mui/icons-material';
import { Science, Biotech, Assignment } from '@mui/icons-material';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, TextField, 
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { FileEdit, Search, Home, Mail, MapPin } from 'lucide-react';

const compactInputStyle = {
    width: '100%',
    height: '32px', 
    padding: '4px 10px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    marginTop: '2px',
    fontSize: '14px', 
    color: '#000000', 
    backgroundColor: '#ffffff', 
    boxSizing: 'border-box',
    outline: 'none',
};

const compactSelectStyle = {
    ...compactInputStyle,
    backgroundColor: '#fff',
    cursor: 'pointer',
    appearance: 'revert', 
    paddingRight: '5px'
};

const settingsCardStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center', 
    backgroundColor: '#fff',
    padding: '4px 12px', 
    height: '45px', 
    borderRadius: '6px',
    border: '1px solid #eee',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
};



const InputGroup = ({ label, name, required, onChange, list, options, showPlus, value }) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a148c' }}>
            {label} {required && <span style={{ color: 'red' }}>*</span>}
        </label>
        <div style={{ display: 'flex', gap: '5px' }}>
            <input 
                name={name} 
                list={list} 
                value={value || ''} 
                onChange={onChange} 
                autoComplete="off" 
                style={compactInputStyle} 
                required={required} 
            />
            {options && (
                <datalist id={list}>
                    {options.map((opt, i) => <option key={i} value={opt} />)}
                </datalist>
            )}
            {showPlus && (
                <button type="button" style={{ 
                    backgroundColor: '#4a148c', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    width: '32px', 
                    height: '32px', 
                    marginTop: '2px', 
                    cursor: 'pointer' 
                }}>+</button>
            )}
        </div>
    </div>
);


const AddTest = () => {
const navigate = useNavigate();
const [showProfileModal, setShowProfileModal] = useState(false);
const [deptList, setDeptList] = useState([]);
const [showCalculationModal, setShowCalculationModal] = useState(false);
const [showComponentModal, setShowComponentModal] = useState(false);
const [showUploadModal, setShowUploadModal] = useState(false);
const [showCriticalModal, setShowCriticalModal] = useState(false);
const [showReferenceModal, setShowReferenceModal] = useState(false);
const [selectedFile, setselectedFile] = useState(false);
const [showPregnancyModal, setShowPregnancyModal] = useState(false);
const [setShowInstrumentModal, setsetShowInstrumentModal] = useState(false);
const [showBiopsyModal, setShowBiopsyModal] = useState(false);
const [currentTestId, setCurrentTestId] = useState(null);
const [dataRows, setDataRows] = useState([]);
const [biopsyAbbreviation, setBiopsyAbbreviation] = useState("");
const [calcType, setCalcType] = useState("Normal");
const [allCalculations, setAllCalculations] = useState([]);
// Tracks which component row the calculation modal is currently open for
const [selectedElementName, setSelectedElementName] = useState("");
const [calcDetails, setCalcDetails] = useState({
    finalOutput: '',
    normalValue: '',
    units: ''
});

const [currentRow, setCurrentRow] = useState({
    elementName: '',
    unit: '',
    methodology: '',
    commentsType: 'Text'
});
const [selectedImage, setSelectedImage] = useState(null); 
const [imagePreview, setImagePreview] = useState(null);
const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file)); 
        
        Toast.fire({
            icon: 'success',
            title: 'Image selected! It will be saved when you submit the test.'
        });
    }
};
const [pregnancyRanges, setPregnancyRanges] = useState([
    { trimester: '1st trimester', lowValue: '', highValue: '' },
    { trimester: '2nd trimester', lowValue: '', highValue: '' },
    { trimester: '3rd trimester', lowValue: '', highValue: '' }
]);
const [criticalRows, setCriticalRows] = useState([]);
const [referenceRows, setReferenceRows] = useState([]);
const emptyAgeRow = {
    sex: 'Male',
    dayStart: 0,
    dayEnd: 0,
    yearStart: 0,
    yearEnd: 100,
    lowValue: '',
    highValue: '',
    displayRange: ''
};
const [parentTests, setParentTests] = useState([]); 
const [filteredTests, setFilteredTests] = useState([]); 
const [searchTerm, setSearchTerm] = useState("")
const [formula, setFormula] = useState("");
const [selectedParentTest, setSelectedParentTest] = useState({ name: '', code: '' });

// Fetch tests when modal opens
useEffect(() => {
    if (showCalculationModal) {
        fetch('http://localhost:5000/api/parent-tests')
            .then(res => res.json())
            .then(data => setParentTests(data))
            .catch(err => console.error("Error fetching parent tests:", err));
    }
}, [showCalculationModal]);
const [selectedTestDetails, setSelectedTestDetails] = useState(null);

const selectTest = async (test) => {
    setSearchTerm(test.TestName);
    setSelectedParentTest({ name: test.TestName, code: test.TestCode });
    setFilteredTests([]); 

    try {
        const response = await fetch(`http://localhost:5000/api/test-by-code/${test.TestCode}`);
        
        // This prevents the "Unexpected token <" error
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Server returned an error:", errorText);
            return;
        }

        const data = await response.json();
        if (data.formula) {
            setFormula(data.formula);
        }
    } catch (err) {
        console.error("Fetch error:", err);
    }
};

const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length > 1) {
        const filtered = parentTests.filter(test => 
            test.TestName.toLowerCase().includes(value.toLowerCase()) ||
            test.TestCode.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredTests(filtered);
    } else {
        setFilteredTests([]);
    }
};


const handleAddAgeRow = (isCritical) => {
    const newRow = { sex: 'Male', dayStart: 0, dayEnd: 0, yearStart: 0, yearEnd: 100, lowValue: '', highValue: '', displayRange: '' };
    if (isCritical) setCriticalRows([...criticalRows, newRow]);
    else setReferenceRows([...referenceRows, newRow]);
};

const handleUpdateAgeRow = (index, field, value, isCritical) => {
    const rows = isCritical ? [...criticalRows] : [...referenceRows];
    rows[index][field] = value;
    isCritical ? setCriticalRows(rows) : setReferenceRows(rows);
};

const handleRemoveAgeRow = (index, isCritical) => {
    const rows = isCritical ? [...criticalRows] : [...referenceRows];
    rows.splice(index, 1);
    isCritical ? setCriticalRows(rows) : setReferenceRows(rows);
};

const tinyInputStyle = { width: '45px', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' };
const valueInputStyle = { width: '55px', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' };

const handleTableImageUpload = () => {
    if (!selectedImage) {
        return Swal.fire('Wait', 'Please select an image first', 'warning');
    }

    setShowUploadModal(false);
    Swal.fire({
        icon: 'success',
        title: 'Image Attached',
        text: 'This image will be saved when you click the main Save button.',
        timer: 2000,
        showConfirmButton: false
    });
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



useEffect(() => {
    const fetchDepts = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/get-departments');
            const result = await res.json();
            if (result.success) {
                setDeptList(result.data.map(d => d.DepartmentName));
            }
        } catch (err) {
            console.error("Failed to fetch departments:", err);
        }
    };
    fetchDepts();
}, []);



const [formData, setFormData] = useState({
 measurementType: "",
 commonParagraph: "",
 culture: "",
 alternativeSample: "",
 multipleComponents: "",
 calculationPresent: "",
 tableRequired: "",
 ageWiseCritical: "",
 ageWiseReference: "",
 pregnancyReference: "",
 biopsyNumber: "",
 outsourced: "",
 testName: "", 
 cultureCategory: "", 
 department: "",
 sampleContainer: "", 
 methodology: "", 
 instrumentReagent: "",
 units: "", 
 turnAroundTime: "", 
 amount: "", 
 validDate: "",
 testSchedule: "All", 
 cutOffTime: "", 
 patientPreparation: "",
 expectedResultDate: "", 
 additionalComments: "", 
 testInformation: "",
 selectedProfile: "" 
});

const dropdownData = {
culture: ["Urine", "Pus", "Sputum", "Blood ","Other"],
instrumentReagent: ["Agappe Mespa i2"],
samples: ["Test",
"EDTA-Plasma",
"Smeared slide",
"Tissue in fixative(formalin)",
"Fixed cervical smear",
"Bone marrow aspiration slides",
"Bone marrow aspiration material in EDTA",
"Fluoride EDTA",
"Serum",
"Sodium citrate , 3.2%",
"Whole blood - EDTA",
"Urine",
"Urine container",
"Urine container - Sterile",
"Stool",
"Semen",
"Fluoride EDTA(fasting)",
"Fluoride EDTA(Post Prandial)",
"Fluoride EDTA(2 hours)",
"Urine(fasting)",
"LBC",
"Urine(Post Prandial)",
"Urine(2 hours)",
"Fluid in sterile container"],
methodology: ["Method test","ELISA", "Rapid Test", "CLIA", "HPLC", "Microscopy","DMSO","GOD-POD","Calculated parameter","Turbodensitometric","Electromechanical","Fluorescence microscopy","Electrical Impedance","Electric Impedance","Chromatography","Immunochromatography","Latex turbidimetry","Protein error of pH(Dipstick)","Protein error of indicators(Dipstick)","Glucose oxidase(Dipstick)","Rotheras method(Dipstick)","Ehrlichs method(Dipstick)","Ehrlich reaction","Diazotized dichloroaniline coupling reaction(dipst","Diazonium compound reaction(dipstick)","Benedicts method","Modified Jaffe- kinetic","Urease-GLDH-kinetic","Uricase-POD","Biuret","Bromocresol green","NADH, kinetic UV, IFCC","p-Nitrophenylphosphate, kinetic","Carboxy substrate, kinetic","GPO-PAP","Enzymatic","Cyanmethemoglobin","Rapid Immunochromatographic assay","Modified Wassermans reaction","Westergren ethod","Westergren method","Chemiluminescence","ISE","Tube agglutination","Fouchets method","Hays sulphur test","OCPC","Phosphomolybdate","CMIA","Nephlometry","Ion selective electrode","Spectrophotometry","ICP/MS","Glucose dehydrogenase","IF","Urease-GLDH"],
instruments: ["Auto Analyzer", "Cell Counter", "Spectrophotometer"],
profiles: ["Liver Function Test", "Lipid Profile", "Thyroid Profile", "Kidney Profile"]
};

const handleChange = (e) => {
const { name, value } = e.target;
setFormData(prev => ({ ...prev, [name]: value }));
};

const handlePregnancyChange = (index, field, value) => {
    const updated = [...pregnancyRanges];
    updated[index][field] = value;
    setPregnancyRanges(updated);
};


    
const handleSubmit = async (e) => {
    e.preventDefault();
    Swal.fire({
        title: 'Saving Test Details...',
        html: 'Please wait while we configure the test parameters',
        didOpen: () => { Swal.showLoading(); },
        allowOutsideClick: false
    });

    const finalPayload = new FormData();
    Object.keys(formData).forEach(key => {
        finalPayload.append(key, formData[key]);
    });

    // Append Components
    const validComponents = dataRows.filter(row => row.elementName?.trim() !== '');
    finalPayload.append('components', JSON.stringify(validComponents));

    // Append Calculations (MOVED ABOVE FETCH)
    if (String(formData.calculationPresent).toLowerCase() === 'yes') {
        finalPayload.append('calculations', JSON.stringify(allCalculations));
    }

    // Append Conditional Ranges
    if (formData.pregnancyReference === 'Yes') {
        finalPayload.append('pregnancyRanges', JSON.stringify(pregnancyRanges));
    }

    if (String(formData.ageWiseCritical).toLowerCase() === 'yes') {
        const validCritical = criticalRows.filter(row => row.lowValue !== '' || row.highValue !== '');
        finalPayload.append('criticalRanges', JSON.stringify(validCritical));
    }

    if (String(formData.ageWiseReference).toLowerCase() === 'yes') {
        const validReference = referenceRows.filter(row => row.lowValue !== '' || row.highValue !== '');
        finalPayload.append('referenceRanges', JSON.stringify(validReference));
    }

    if (biopsyAbbreviation) finalPayload.append('biopsyAbbreviation', biopsyAbbreviation);
    if (selectedImage) finalPayload.append('testImage', selectedImage);

    try {
        // Fetch now contains the complete finalPayload
        const response = await fetch('http://localhost:5000/api/add-test', {
            method: 'POST',
            body: finalPayload,
        });
        
        const result = await response.json();

        if (result.success) {
            setCurrentTestId(result.testId); 
            
            Swal.fire({
                icon: 'success',
                title: 'Saved Successfully!',
                text: `Test ${result.testCode} has been recorded.`,
                confirmButtonColor: '#4a148c'
            });

            // Reset all states
            setDataRows([]);
            setCriticalRows([]);
            setReferenceRows([]);
            setSelectedImage(null);
            setImagePreview(null);
            setBiopsyAbbreviation("");
            setAllCalculations([]); 
            setFormula(""); 
            setCalcDetails({ finalOutput: '', normalValue: '', units: '' });
            setPregnancyRanges([
                { trimester: '1st trimester', lowValue: '', highValue: '' },
                { trimester: '2nd trimester', lowValue: '', highValue: '' },
                { trimester: '3rd trimester', lowValue: '', highValue: '' }
            ]);

            setFormData({
                measurementType: "",
                commonParagraph: "",
                culture: "",
                alternativeSample: "",
                multipleComponents: "",
                calculationPresent: "",
                tableRequired: "",
                ageWiseCritical: "",
                ageWiseReference: "",
                pregnancyReference: "",
                biopsyNumber: "",
                outsourced: "",
                testName: "", 
                cultureCategory: "", 
                department: "",
                sampleContainer: "", 
                methodology: "", 
                instrumentReagent: "",
                units: "", 
                turnAroundTime: "", 
                amount: "", 
                validDate: "",
                testSchedule: "All", 
                cutOffTime: "", 
                patientPreparation: "",
                expectedResultDate: "", 
                additionalComments: "", 
                testInformation: "",
                selectedProfile: "" 
            });
            
        } else {
            Swal.fire({ icon: 'error', title: 'Save Failed', text: result.error });
        }
    } catch (error) {
        console.error("Connection error:", error);
        Swal.fire({ icon: 'error', title: 'Network Error', text: 'Backend unreachable.' });
    }
};

const handleProfileSelect = (profile) => {
    setFormData(prev => ({ ...prev, selectedProfile: profile }));
    setShowProfileModal(false);
    Toast.fire({
        icon: 'success',
        title: `Profile Selected: ${profile.name}`
    });
};

const handleAddRow = () => {
    if (!currentRow.elementName.trim()) {
        return Swal.fire({
            icon: 'warning',
            title: 'Missing Element Name',
            confirmButtonColor: '#4a148c'
        });
    }

    setDataRows([...dataRows, currentRow]);
    setCurrentRow({
        elementName: '',
        unit: '',
        methodology: '',
        commentsType: 'Numeric'
    });

    Toast.fire({
        icon: 'success',
        title: 'Added to list. Remember to Save the full configuration!'
    });
};

useEffect(() => {
    if (showCalculationModal) {
        fetch('http://localhost:5000/api/parent-tests')
            .then(res => res.json())
            .then(data => setParentTests(data))
            .catch(err => console.error("Error fetching parent tests:", err));
    }
}, [showCalculationModal]);

    return (
        <div style={{ backgroundColor: '#f3e5f5', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif' }}>
            {/* Header */}
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

           <form onSubmit={handleSubmit} style={{ maxWidth: '1180px', margin: '24px auto', marginBottom: '2px' , backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
    
    {/* Header */}
    <div style={{ 
    backgroundColor: '#4a148c', 
    padding: '12px 25px', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
}}>
    <h3 style={{ 
        margin: 0, 
        color: 'white', 
        fontSize: '18px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px' 
    }}>
        <Science sx={{ fontSize: 24 }} /> 
        Test Details Configuration
    </h3>
    <span style={{ color: '#e1bee7', fontSize: '11px', fontWeight: 'bold' }}>
        HOSPITAL MANAGEMENT SYSTEM
    </span>
</div>

    <div style={{ padding: '15px' }}>
        
        {/* SECTION 1: RADIO SETTINGS (Compact 3-Column Grid) */}
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '0px', 
            marginBottom: '20px', 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '8px',
            border: '1px solid #dee2e6'
        }}>
            {[
                { label: "Measurement", name: "measurementType", o1: "Numeric", o2: "FreeText" },
                { label: "Common Paragraph", name: "commonParagraph", o1: "Yes", o2: "No" },
                { label: "Culture Test", name: "culture", o1: "Yes", o2: "No" },
                { label: "Alternative Sample", name: "alternativeSample", o1: "Yes", o2: "No" },
                { label: "Multiple Components", name: "multipleComponents", o1: "Yes", o2: "No", link: "Add Component" },
                { label: "Calculation Present", name: "calculationPresent", o1: "Yes", o2: "No", link: "Add Calculation" },
                { label: "Table Required", name: "tableRequired", o1: "Yes", o2: "No", link: "Upload Doc" },
                { label: "Age Critical Value", name: "ageWiseCritical", o1: "Yes", o2: "No", link: "Add Critical" },
                { label: "Age Reference Range", name: "ageWiseReference", o1: "Yes", o2: "No", link: "Add Reference" },
                { label: "Pregnancy Range", name: "pregnancyReference", o1: "Yes", o2: "No", link: "Add Pregnancy" },
                { label: "Biopsy Test Number", name: "biopsyNumber", o1: "Yes", o2: "No", link: "Biopsy Abbreviation" },
                { label: "Outsourced", name: "outsourced", o1: "Yes", o2: "No" }
            ].map((item) => (
                <div key={item.name} style={settingsCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', fontSize: '12px', color: '#444' }}>{item.label}</span>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '11px' }}>
                            <label style={{cursor:'pointer'}}><input type="radio" name={item.name} value={item.o1} checked={formData[item.name] === item.o1} onChange={handleChange} /> {item.o1}</label>
                            <label style={{cursor:'pointer'}}><input type="radio" name={item.name} value={item.o2} checked={formData[item.name] === item.o2} onChange={handleChange} /> {item.o2}</label>
                        </div>
                    </div>
                    {/* DYNAMIC MODAL LINKS */}
                    {formData[item.name] === "Yes" && item.link && (
                        <div style={{ borderTop: '1px solid #f0f0f0', marginTop: '2px', paddingTop: '2px', textAlign: 'right' }}>
                            <span 
                                style={{ color: '#1a73e8', textDecoration: 'underline', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                                onClick={() => {
                                    if (item.link === "Add Component") setShowComponentModal(true);
                                    else if (item.link === "Add Calculation") setShowCalculationModal(true);
                                    else if (item.link === "Upload Doc") setShowUploadModal(true);
                                    else if (item.link === "Add Critical") setShowCriticalModal(true);
                                    else if (item.link === "Add Reference") setShowReferenceModal(true);
                                    else if (item.link === "Add Pregnancy") setShowPregnancyModal(true);
                                    else if (item.link === "Biopsy Abbreviation") setShowBiopsyModal(true);
                                }}
                            >
                                ⚡ {item.link}
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>

        <p style={{ color: '#d32f2f', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', marginBottom: '13px', backgroundColor: '#fff5f5', padding: '5px', borderRadius: '4px' }}>
            ⚠ Note: Add Name without special characters! Use "(" and ")" only for abbreviations!
        </p>

        {/* SECTION 2: MAIN INPUT DATA (3-COLUMN GRID) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px 25px' }}>
            
            <InputGroup label="Test Name" name="testName" required onChange={handleChange} value={formData.testName} />
            
            <InputGroup label="Culture Category" name="cultureCategory" required showPlus onChange={handleChange} list="culture-list" options={dropdownData.culture}  value={formData.cultureCategory} />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a148c' }}>Department *</label>
                <select name="department" required onChange={handleChange} style={compactSelectStyle}  value={formData.department}>
                    <option value="">-Choose Department-</option>
                    {[
                        "General Wellness", "Molecular Pathology", "Surgical Pathology", "Microbiology", 
                        "Cyto Pathology", "Immunology", "Clinical Pathology", "Serology", 
                        "Specialized Chemistry", "Hematology", "Test", "Clinical Medicine", 
                        "TestdetA", "Clinical Cloudchemistry", "Biochemistry"
                    ].map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a148c' }}>Add Profile</label>
                <button type="button" onClick={() => setShowProfileModal(true)} style={{ textAlign: 'left', marginTop: '4px', fontSize: '12px', color: '#1a73e8', background: '#f8f9fa', border: '1px solid #ced4da', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>
                    {formData.selectedProfile ? `📁 Profile: ${formData.selectedProfile}` : "🔍 Choose Profile"}
                </button>
            </div>

            <InputGroup label="Sample Container" name="sampleContainer" required showPlus onChange={handleChange} list="sample-list" options={dropdownData.samples} value={formData.sampleContainer} />
            
            <InputGroup label="Methodology" name="methodology" showPlus onChange={handleChange} list="meth-list" options={dropdownData.methodology}  value={formData.methodology} />
            
            <InputGroup label="Units" name="units" onChange={handleChange}  value={formData.units} />
            
            <InputGroup label="Turn Around Time (hrs)" name="turnAroundTime" onChange={handleChange}  value={formData.turnAroundTime} />
            
            <InputGroup label="Patient Preparation" name="patientPreparation" onChange={handleChange} value={formData.patientPreparation} />
            
            <InputGroup label="Expected Result Date" name="expectedResultDate" onChange={handleChange} value={formData.expectedResultDate}/>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a148c' }}>Test Schedule</label>
                <select name="testSchedule" onChange={handleChange} style={compactSelectStyle} value={formData.testSchedule}>
                    <option value="All">Daily (All)</option>
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a148c' }}>Cut Off Time</label>
                <input type="time" name="cutOffTime" onChange={handleChange} style={compactInputStyle} value={formData.cutOffTime} />
            </div>

            <InputGroup label="Additional Fixed Comments" name="additionalComments" onChange={handleChange}  value={formData.additionalComments} />
            
            <InputGroup label="Test Information" name="testInformation" onChange={handleChange} value={formData.testInformation}/>
            
            <InputGroup label="Amount (₹) " name="amount" required onChange={handleChange} value={formData.amount} />
            
            <InputGroup label="Instrument Reagent" name="instrumentReagent" required showPlus onChange={handleChange} list="instrument-list" options={dropdownData.instrumentReagent} value={formData.instrumentReagent} />

            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a148c' }}>Valid Date</label>
                <input type="date" name="validDate" onChange={handleChange} style={compactInputStyle} value={formData.validDate} />
            </div>
            
        </div>

        {/* Footer Action */}
        <div style={{ textAlign: 'center', marginTop: '7px',  marginBottom: '-5px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <button type="submit" style={{ 
                backgroundColor: '#4a148c', 
                color: 'white', 
                padding: '10px 100px', 
                border: 'none', 
                borderRadius: '40px', 
                fontWeight: 'bold', 
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(74, 20, 140, 0.3)',
                transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
                Submit
            </button>
        </div>
    </div>
</form>

            {/* Profile Selection Modal */}
            {showProfileModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
                    <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                        <h4 style={{ marginTop: 0, color: '#4a148c', borderBottom: '2px solid #4a148c', paddingBottom: '10px' }}>Select Master Profile</h4>
                        <div style={{ maxHeight: '250px', overflowY: 'auto', margin: '15px 0' }}>
                            {dropdownData.profiles.map((p) => (
                                <div 
                                    key={p} 
                                    onClick={() => handleProfileSelect(p)}
                                    style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', transition: '0.2s' }}
                                    onMouseOver={(e) => e.target.style.backgroundColor = '#eefaff'}
                                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                    📁 {p}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowProfileModal(false)} style={{ width: '100%', padding: '10px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                </div>
            )}

{showCalculationModal && (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(74, 20, 140, 0.15)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '700px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', overflow: 'hidden', border: '1px solid #ccc' }}>
            
            {/* Header */}
            <div style={{ background: '#f5f5f5', padding: '5px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
                <span style={{ fontSize: '13px', color: '#333' }}>Calculation</span>
                <button onClick={() => setShowCalculationModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '18px' }}>×</button>
            </div>

            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '16px' }}>Calculation</h4>
                <p style={{ color: 'blue', fontSize: '11px', marginBottom: '20px' }}>
                    Note: Do not use special characters after test name if the expression is based on another test!
                </p>

                {/* Calculation Type Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', border: '1px solid #ddd' }}>
                    <div style={{ width: '150px', background: '#f9f9f9', padding: '10px', fontSize: '12px', textAlign: 'left', borderRight: '1px solid #ddd' }}>
                        Calculation Type
                    </div>
                    <div style={{ flex: 1, padding: '5px' }}>
                        <select 
                            value={calcType} 
                            onChange={(e) => setCalcType(e.target.value)}
                            style={{ width: '100%', padding: '5px', border: '1px solid #ccc', outline: 'none' }}
                        >
                            <option value="Normal">Normal</option>
                            <option value="Used by other Tests">Used by other Tests</option>
                        </select>
                    </div>
                </div>

                {calcType === 'Normal' ? (
    <div style={{ border: '1px solid #ddd' }}>
        {[
            { label: 'Formula', key: 'formula', value: formula },
            { label: 'Final Output', key: 'finalOutput', value: calcDetails.finalOutput },
            { label: 'Normal Value', key: 'normalValue', value: calcDetails.normalValue },
            { label: 'Units', key: 'units', value: calcDetails.units }
        ].map((field, idx) => (
            <div key={idx} style={{ display: 'flex', borderBottom: idx === 3 ? 'none' : '1px solid #ddd' }}>
                <div style={{ width: '150px', background: '#f9f9f9', padding: '10px', fontSize: '12px', textAlign: 'left', borderRight: '1px solid #ddd' }}>
                    {field.label}
                </div>
                <div style={{ flex: 1, padding: '5px' }}>
                    <input 
                        type="text" 
                        value={field.value}
                        onChange={(e) => {
                            if (field.key === 'formula') {
                                setFormula(e.target.value);
                            } else {
                                setCalcDetails({ ...calcDetails, [field.key]: e.target.value });
                            }
                        }}
                        style={{ width: '100%', padding: '5px', border: '1px solid #ccc' }} 
                    />
                </div>
            </div>
        ))}
    </div>
) : (
                    <div style={{ border: '1px solid #ddd' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#4a148c', color: 'white', fontSize: '12px' }}>
                                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Test Name</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Test Code</th>
                                    <th style={{ padding: '8px', border: '1px solid #ddd' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ position: 'relative' }}>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', position: 'relative' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Search Test..." 
                                            value={searchTerm}
                                            onChange={handleSearch}
                                            style={{ width: '100%', padding: '5px', border: '1px solid #ccc' }} 
                                        />
                                        {filteredTests.length > 0 && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #ddd', zIndex: 10, maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                                                {filteredTests.map((test) => (
                                                    <div key={test.TestID} onClick={() => selectTest(test)} style={{ padding: '8px', cursor: 'pointer', fontSize: '12px', borderBottom: '1px solid #eee', textAlign: 'left' }}>
                                                        {test.TestName} ({test.TestCode})
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd' }}>
                                        <input type="text" readOnly value={selectedParentTest.code} placeholder="Auto-filled Code" style={{ width: '100%', padding: '5px', background: '#f5f5f5', border: '1px solid #ccc' }} />
                                    </td>
                                    <td style={{ padding: '5px', border: '1px solid #ddd', width: '100px' }}>
                                        <button 
                                            onClick={() => {
                                                if (selectedParentTest.code) {
                                                    setFormula(prev => prev + `{${selectedParentTest.code}}`);
                                                } else {
                                                    Swal.fire('Wait', 'Please select a test first', 'warning');
                                                }
                                            }}
                                            style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', marginRight: '5px', cursor: 'pointer' }}
                                        > + </button>
                                    
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        
                        {/* FIXED FORMULA INPUT SECTION */}
                        {/* FIXED FORMULA INPUT SECTION */}
<div style={{ display: 'flex', borderTop: '1px solid #ddd', alignItems: 'center' }}>
    <div style={{ width: '150px', background: '#f9f9f9', padding: '10px', fontSize: '12px', textAlign: 'left', borderRight: '1px solid #ddd', fontWeight: 'bold' }}>
        Formula Builder
    </div>
    <div style={{ flex: 1, padding: '5px', display: 'flex', gap: '5px' }}>
        <input 
            type="text" 
            value={formula} 
            onChange={(e) => setFormula(e.target.value)} 
            placeholder="e.g. {CODE1} + {CODE2}" 
            style={{ flex: 1, padding: '5px', border: '1px solid #ccc', fontFamily: 'monospace', fontSize: '14px' }} 
        />
        <button 
            onClick={() => setFormula("")}
            style={{ background: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
        > Clear </button>
    </div>
</div>

{/* HELPER TEXT */}
<div style={{ padding: '5px 15px', fontSize: '11px', color: '#666', fontStyle: 'italic', background: '#f0f0f0' }}>
    Tip: Click <b>+</b> to add a test code. You can also type math operators (+, -, *, /) directly.
</div>
                    </div>
                )}

                <button 
    onClick={() => {
        const newCalc = {
            elementName: selectedElementName, 
            calcType: calcType,
            formula: formula,
            finalOutput: calcDetails.finalOutput, 
            normalValue: calcDetails.normalValue,
            units: calcDetails.units,
            parentTestCode: selectedParentTest.code
        };
        setAllCalculations(prev => {
            const filtered = prev.filter(c => c.elementName !== selectedElementName);
            return [...filtered, newCalc];
        });

        Swal.fire({ icon: 'success', title: 'Calculation Saved', timer: 1000, showConfirmButton: false });
        setShowCalculationModal(false);
    }}
     style={{ marginTop: '20px', background: 'blue', color: 'white', padding: '8px 25px', border: 'none', borderRadius: '20px', cursor: 'pointer' }}
> Submit </button>
            </div>
        </div>
    </div>
)}

{showComponentModal && (
    <div style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        backgroundColor: 'rgba(74, 20, 140, 0.15)', 
        backdropFilter: 'blur(8px)', 
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 
    }}>
        <div style={{ 
            backgroundColor: 'white', borderRadius: '16px', width: '850px', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.3)'
        }}>
            {/* Elegant Header */}
            <div style={{ 
                background: 'linear-gradient(90deg, #4a148c 0%, #7b1fa2 100%)', 
                padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', color: 'white', gap: '10px' }}>
                    <Layers fontSize="small" />
                    <span style={{ fontSize: '15px', fontWeight: '600', letterSpacing: '0.5px' }}>Multiple Components</span>
                </div>
                <IconButton onClick={() => setShowComponentModal(false)} size="small" style={{ color: 'white' }}>
                    <Close />
                </IconButton>
            </div>

            <div style={{ padding: '25px' }}>
                <p style={{ color: '#666', fontSize: '12px', textAlign: 'center', marginBottom: '20px', fontStyle: 'italic' }}>
                    ✨ Tip: Element names should be alphanumeric for optimal processing.
                </p>
                
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                        <tr style={{ color: '#4a148c', fontSize: '13px', textAlign: 'left' }}>
                            <th style={{ padding: '10px' }}>Element Name</th>
                            <th style={{ padding: '10px' }}>Unit</th>
                            <th style={{ padding: '10px' }}>Methodology</th>
                            <th style={{ padding: '10px' }}>Type</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataRows.map((row, index) => (
                            <tr key={index} style={{ backgroundColor: '#f3e5f5', borderRadius: '8px' }}>
                                <td style={{ padding: '12px', borderRadius: '8px 0 0 8px', fontWeight: '500' }}>{row.elementName}</td>
                                <td style={{ padding: '12px' }}>{row.unit}</td>
                                <td style={{ padding: '12px' }}>{row.methodology}</td>
                                <td style={{ padding: '12px' }}>{row.commentsType}</td>
                                <td style={{ padding: '12px', textAlign: 'center', borderRadius: '0 8px 8px 0' }}>
                                    <IconButton color="error" size="small" onClick={() => setDataRows(dataRows.filter((_, i) => i !== index))}>
                                        <DeleteForever />
                                    </IconButton>
                                </td>
                            </tr>
                        ))}
                        
                        <tr>
                            <td><input className="mui-style-input" value={currentRow.elementName} placeholder="Hemoglobin" onChange={(e) => setCurrentRow({...currentRow, elementName: e.target.value})} /></td>
                            <td><input className="mui-style-input" value={currentRow.unit} placeholder="g/dL" onChange={(e) => setCurrentRow({...currentRow, unit: e.target.value})} /></td>
                            <td><input className="mui-style-input" value={currentRow.methodology} placeholder="Spectrophotometry" onChange={(e) => setCurrentRow({...currentRow, methodology: e.target.value})} /></td>
                            <td>
                                <select className="mui-style-input" value={currentRow.commentsType} onChange={(e) => setCurrentRow({...currentRow, commentsType: e.target.value})}>
                                    <option value="Numeric">Numeric</option>
                                    <option value="Text">Text</option>
                                </select>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <IconButton color="primary" onClick={handleAddRow} style={{ backgroundColor: '#e1bee7' }}>
                                    <AddCircle fontSize="large" style={{ color: '#4a148c' }} />
                                </IconButton>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
)}

{showUploadModal && (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(74, 20, 140, 0.15)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(90deg, #4a148c 0%, #7b1fa2 100%)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', color: 'white', fontWeight: '600' }}>Image Upload</span>
                <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Close /></button>
            </div>
            
            <div style={{ padding: '35px', textAlign: 'center' }}>
                <div style={{ border: '2px dashed #e1bee7', padding: '20px', borderRadius: '12px', marginBottom: '25px', backgroundColor: '#fafafa' }}>
    <AddPhotoAlternate style={{ fontSize: '40px', color: '#7b1fa2', marginBottom: '10px' }} />
    {/* Capture file selection */}
    <input 
        type="file" 
        onChange={handleFileChange} 
        accept="image/*"
        style={{ display: 'block', width: '100%', fontSize: '12px' }} 
    />
</div>

<button 
    onClick={handleTableImageUpload}
    style={{ 
        background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)', 
        background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)', 
                    color: 'white', 
                    width: '100%',
                    padding: '12px 0', 
                    border: 'none', 
                    borderRadius: '50px', 
                    fontWeight: '600', 
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(74, 20, 140, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
        
    }}
>
    <CloudUpload fontSize="small" /> Upload Table Image
</button>
            </div>
        </div>
    </div>
)}

{/* Age-wise Critical / Reference Range Modal Template */}
{(showCriticalModal || showReferenceModal) && (
    <div style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        backgroundColor: 'rgba(74, 20, 140, 0.15)', 
        backdropFilter: 'blur(8px)', 
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 
    }}>
        <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            width: '95%', 
            maxWidth: '1000px', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)', 
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.3)'
        }}>
            
            {/* Premium Header */}
            <div style={{ 
                background: 'linear-gradient(90deg, #4a148c 0%, #7b1fa2 100%)', 
                padding: '12px 20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', color: 'white', gap: '10px' }}>
                    <Settings fontSize="small" />
                    <span style={{ fontSize: '15px', fontWeight: '600', letterSpacing: '0.5px' }}>
                        {showCriticalModal ? "Add Agewise Critical Range" : "Add Agewise Reference Range"}
                    </span>
                </div>
                <button 
                    onClick={() => showCriticalModal ? setShowCriticalModal(false) : setShowReferenceModal(false)}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Close fontSize="small" />
                </button>
            </div>

            <div style={{ padding: '25px' }}>
                {/* Action Row: Add New Entry */}
                <div style={{ marginBottom: '15px', textAlign: 'right' }}>
                    <button 
                        onClick={() => handleAddAgeRow(showCriticalModal)}
                        style={{ 
                            backgroundColor: '#f3e5f5', color: '#4a148c', border: '1px solid #e1bee7', 
                            padding: '6px 15px', borderRadius: '20px', cursor: 'pointer', 
                            fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px' 
                        }}
                    >
                        <Add fontSize="small" /> Add Age Range Row
                    </button>
                </div>

                <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead>
                            <tr style={{ color: '#4a148c', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>
                                <th colSpan="2"></th>
                                <th colSpan="2" style={{ textAlign: 'center', borderBottom: '2px solid #e1bee7', paddingBottom: '5px' }}>Days</th>
                                <th colSpan="2" style={{ textAlign: 'center', borderBottom: '2px solid #e1bee7', paddingBottom: '5px' }}>Years</th>
                                <th colSpan="3" style={{ textAlign: 'center', borderBottom: '2px solid #e1bee7', paddingBottom: '5px' }}>Values</th>
                                <th></th>
                            </tr>
                            <tr style={{ color: '#666', fontSize: '12px', textAlign: 'center' }}>
                                <th style={{ padding: '10px 5px' }}>Sex</th>
                                <th style={{ padding: '10px 5px' }}>Start</th>
                                <th style={{ padding: '10px 5px' }}>End</th>
                                <th style={{ padding: '10px 5px' }}>Start</th>
                                <th style={{ padding: '10px 5px' }}>End</th>
                                <th style={{ padding: '10px 5px' }}>Low</th>
                                <th style={{ padding: '10px 5px' }}>Upper</th>
                                <th style={{ padding: '10px 5px' }}>Display</th>
                                <th style={{ padding: '10px 5px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(showCriticalModal ? criticalRows : referenceRows).map((row, index) => (
                                <tr key={index} style={{ backgroundColor: '#fdfbff' }}>
                                
                                    <td style={{ padding: '5px' }}>
                                        <select 
                                            value={row.sex}
                                            onChange={(e) => handleUpdateAgeRow(index, 'sex', e.target.value, showCriticalModal)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
                                        >
                                            <option value="Both">Both</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '5px' }}><input type="number" value={row.dayStart} onChange={(e) => handleUpdateAgeRow(index, 'dayStart', e.target.value, showCriticalModal)} style={tinyInputStyle} /></td>
                                    <td style={{ padding: '5px' }}><input type="number" value={row.dayEnd} onChange={(e) => handleUpdateAgeRow(index, 'dayEnd', e.target.value, showCriticalModal)} style={tinyInputStyle} /></td>
                                    <td style={{ padding: '5px' }}><input type="number" value={row.yearStart} onChange={(e) => handleUpdateAgeRow(index, 'yearStart', e.target.value, showCriticalModal)} style={tinyInputStyle} /></td>
                                    <td style={{ padding: '5px' }}><input type="number" value={row.yearEnd} onChange={(e) => handleUpdateAgeRow(index, 'yearEnd', e.target.value, showCriticalModal)} style={tinyInputStyle} /></td>
                                    <td style={{ padding: '5px' }}><input type="text" value={row.lowValue} onChange={(e) => handleUpdateAgeRow(index, 'lowValue', e.target.value, showCriticalModal)} style={valueInputStyle} /></td>
                                    <td style={{ padding: '5px' }}><input type="text" value={row.highValue} onChange={(e) => handleUpdateAgeRow(index, 'highValue', e.target.value, showCriticalModal)} style={valueInputStyle} /></td>
                                    <td style={{ padding: '5px' }}><input type="text" value={row.displayRange} onChange={(e) => handleUpdateAgeRow(index, 'displayRange', e.target.value, showCriticalModal)} style={{ width: '80px', padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }} /></td>
                                    <td style={{ padding: '5px', textAlign: 'center' }}>
                                        <button 
                                            onClick={() => handleRemoveAgeRow(index, showCriticalModal)}
                                            style={{ color: '#e53935', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
                                        >
                                            <DeleteForever fontSize="small" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Footer */}
<div style={{ padding: '20px', backgroundColor: '#fcfaff', borderTop: '1px solid #eee', textAlign: 'right' }}>
     <button 
        onClick={() => {
            const type = showCriticalModal ? "Critical" : "Reference";
            const rowCount = showCriticalModal ? criticalRows.length : referenceRows.length;

            Swal.fire({
                title: 'Ranges Captured!',
                text: `You have configured ${rowCount} ${type} age-range row(s).`,
                icon: 'success',
                confirmButtonColor: '#4a148c',
                timer: 2000, 
                timerProgressBar: true,
                showConfirmButton: false
            }).then(() => {
                showCriticalModal ? setShowCriticalModal(false) : setShowReferenceModal(false);
            });
        }} 
        style={{ 
            background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)', 
            color: 'white', padding: '10px 35px', border: 'none', borderRadius: '50px', 
            fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 15px rgba(74, 20, 140, 0.3)',
            display: 'inline-flex', alignItems: 'center', gap: '8px'
        }}
    >
        <Save fontSize="small" /> Done & Close
    </button>
</div>
        </div>
    </div>
)}

{showPregnancyModal && (
    <div style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        backgroundColor: 'rgba(74, 20, 140, 0.15)', 
        backdropFilter: 'blur(8px)', 
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 
    }}>
        <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            width: '600px', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)', 
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.3)'
        }}>
            
            {/* Premium Header */}
            <div style={{ 
                background: 'linear-gradient(90deg, #4a148c 0%, #7b1fa2 100%)', 
                padding: '12px 20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', color: 'white', gap: '10px' }}>
                    <PregnantWoman fontSize="small" />
                    <span style={{ fontSize: '15px', fontWeight: '600', letterSpacing: '0.5px' }}>
                        Add Pregnancy Reference Range
                    </span>
                </div>
                <button 
                    onClick={() => setShowPregnancyModal(false)}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Close fontSize="small" />
                </button>
            </div>

            <div style={{ padding: '30px' }}>
                <h5 style={{ textAlign: 'center', margin: '0 0 20px 0', fontSize: '16px', color: '#4a148c', fontWeight: '600' }}>
                    Trimester Specific Ranges
                </h5>
                
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                    <thead>
                        <tr style={{ fontSize: '13px', color: '#666' }}>
                            <th style={{ width: '40%', textAlign: 'left', paddingLeft: '15px' }}>Trimester Phase</th>
                            <th style={{ textAlign: 'center' }}>Low Value</th>
                            <th style={{ textAlign: 'center' }}>High Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pregnancyRanges.map((range, index) => (
                            <tr key={range.trimester}>
                                <td style={{ fontSize: '14px', fontWeight: '500', color: '#555' }}>{range.trimester}</td>
                                <td>
                                    <input 
                                        type="text" 
                                        style={compactInputStyle}
                                        value={range.lowValue}
                                        onChange={(e) => handlePregnancyChange(index, 'lowValue', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="text" 
                                        style={compactInputStyle}
                                        value={range.highValue}
                                        onChange={(e) => handlePregnancyChange(index, 'highValue', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Modern Pill Submit Button */}
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <button 
                        onClick={() => {
                            // Validation (Optional: ensures at least one value is entered)
                            setShowPregnancyModal(false);
                            Toast.fire({
                                icon: 'success',
                                title: 'Pregnancy ranges attached successfully!'
                            });
                        }} 
                        style={{ 
                            background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)', 
                            color: 'white', 
                            padding: '12px 40px', 
                            border: 'none', 
                            borderRadius: '50px', 
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            boxShadow: '0 10px 20px rgba(74, 20, 140, 0.2)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <Save fontSize="small" /> Confirm Ranges
                    </button>
                </div>
            </div>
        </div>
    </div>
)}

{showBiopsyModal && (
    <div style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        backgroundColor: 'rgba(74, 20, 140, 0.15)', 
        backdropFilter: 'blur(8px)', 
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 
    }}>
        <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            width: '450px', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)', 
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.3)'
        }}>
            
            {/* Premium Header */}
            <div style={{ 
                background: 'linear-gradient(90deg, #4a148c 0%, #7b1fa2 100%)', 
                padding: '12px 20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', color: 'white', gap: '10px' }}>
                    <Abc style={{ fontSize: '24px' }} />
                    <span style={{ fontSize: '15px', fontWeight: '600', letterSpacing: '0.5px' }}>
                        Add Biopsy Abbreviation
                    </span>
                </div>
                <button 
                    onClick={() => setShowBiopsyModal(false)}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Close fontSize="small" />
                </button>
            </div>

            <div style={{ padding: '40px 30px' }}>
                {/* Modernized Input Group */}
                <div style={{ marginBottom: '30px' }}>
                    <label style={{ 
                        display: 'block', 
                        fontSize: '12px', 
                        fontWeight: '700', 
                        color: '#4a148c', 
                        marginBottom: '8px',
                        textTransform: 'uppercase'
                    }}>
                        Biopsy Abbreviation
                    </label>
                    <input 


 
    type="text" 
    value={biopsyAbbreviation}
    onChange={(e) => setBiopsyAbbreviation(e.target.value)}
    placeholder="e.g. FNA, CNB..."

                        style={{ 
                            width: '100%', 
                            padding: '12px 15px', 
                            border: '2px solid #f3e5f5', 
                            borderRadius: '12px', 
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.3s ease',
                            boxSizing: 'border-box'
                        }} 
                        onFocus={(e) => e.target.style.borderColor = '#7b1fa2'}
                        onBlur={(e) => e.target.style.borderColor = '#f3e5f5'}
                    />
                </div>
                
                {/* Premium Pill Submit Button */}
                <div style={{ textAlign: 'center' }}>
                    <button 
    onClick={() => {
        // Validation: Don't show success if input is empty
        if (!biopsyAbbreviation.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Empty Field',
                text: 'Please enter a biopsy abbreviation before submitting.',
                confirmButtonColor: '#7b1fa2'
            });
            return;
        }

        // The SweetAlert
        Swal.fire({
            title: 'Abbreviation Added!',
            text: `"${biopsyAbbreviation}" has been linked to this test configuration.`,
            icon: 'success',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            background: '#ffffff',
            iconColor: '#4a148c',
            toast: false // Set to true if you want a small corner popup instead of a big modal
        }).then(() => {
            setShowBiopsyModal(false);
        });
    }} 
    style={{ 
        background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)', 
                            color: 'white', 
                            padding: '12px 40px', 
                            border: 'none', 
                            borderRadius: '50px', 
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            boxShadow: '0 10px 20px rgba(74, 20, 140, 0.2)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'all 0.3s ease'
    }}
>
    <Send fontSize="small" /> Submit Abbreviation
</button>
                </div>
            </div>
        </div>
    </div>
)}
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



export default AddTest;