import React, { useState } from 'react';
import { useNavigate } from "react-router-dom"; 
import { 
  FaUserMd, FaGraduationCap, FaFileSignature, 
  FaUniversity, FaUserTag, FaArrowRight, FaArrowLeft, FaCheckCircle, FaPhoneAlt 
} from 'react-icons/fa'; 
import "../styles/home.css"; 
import Swal from 'sweetalert2';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TextField } from '@mui/material';
 import Tesseract from 'tesseract.js';

const UploadSignatureModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate(); 
  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  
  
  const [formData, setFormData] = useState({
    userName: "", firstName: "", lastName: "", gender: "",
    dob: null, age: "", undergraduateDegree: "", ugUniversity: "",
    postgraduateDegree: "", pgUniversity: "", college: "",
    otherDegree: "", registrationNumber: "", designation: "",
    designationCategory: "", designationForReport: "",
    emailId: "", phoneNo: "", notification: "No"
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
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  if (!isOpen) return null;


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // 1. Basic validation
    if (selectedFile.size > 1024 * 1024) { // 1MB limit for better OCR
        Swal.fire('File too large', 'Please upload a smaller image', 'error');
        return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setIsScanning(true); 

    // 2. Visual Feedback
    Swal.fire({
        title: 'Reading Signature...',
        text: 'Extracting text from image',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const { data: { text } } = await Tesseract.recognize(
            selectedFile,
            'eng',
            { logger: m => console.log(m) }
        );
        const cleanText = text.replace(/[^\w\s.,-]/gi, '').replace(/\s+/g, ' ').trim();
        const regNoMatch = cleanText.match(/\b\d{4,8}\b/); 
        
        // 5. Extract Keywords
        const keywords = ["MBBS", "MD", "PATHOLOGIST", "MICRO", "BIO", "DNB", "PHD"];
        const foundKeywords = keywords.filter(word => cleanText.toUpperCase().includes(word));

        if (cleanText.length > 0) {
            Toast.fire({
                icon: 'success',
                title: 'Information detected!',
            });

            setFormData(prev => ({
                ...prev,
                registrationNumber: regNoMatch ? regNoMatch[0] : prev.registrationNumber,
                // Suggest keywords, or the whole text if keywords aren't found
                designationForReport: prev.designationForReport || (foundKeywords.length > 0 ? foundKeywords.join(", ") : cleanText)
            }));
        } else {
            Toast.fire({ icon: 'info', title: 'No text detected' });
        }

    } catch (err) {
        console.error("OCR Error:", err);
        Swal.fire('OCR Warning', 'Could not extract text automatically. Please fill manually.', 'info');
    } finally {
        // 6. Cleanup: Ensure loading finishes no matter what
        setIsScanning(false);
        Swal.close();
    }
};


  const nextStep = () => {
    if (!formData.firstName || !formData.designationForReport) {
      alert("Please fill in the required fields (*) before proceeding.");
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    
  
    const submissionData = {
        doctorName: `Dr. ${formData.firstName} ${formData.lastName}`.trim(),
        emailId: formData.emailId,
        phoneNo: formData.phoneNo,
        notification: formData.notification
    };

    try {
        const res = await fetch('http://localhost:5000/api/add-doctor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData) 
        });

        const result = await res.json();
        if (result.success) {
            alert("Pathologist Successfully Registered!");
            onClose(); 
            
           
            navigate('/doctor-details'); 
        } else {
            alert("Error: " + result.message);
        }
    } catch (err) {
        console.error("Submission error:", err);
        alert("Server connection failed.");
    }
  };
  
    const handleContinueToRegistry = async () => {
    
    if (!formData.firstName || !formData.designationForReport) {
        Swal.fire({
            icon: 'warning',
            title: 'Required Fields',
            text: 'Please fill in the required fields (*) before proceeding.',
            confirmButtonColor: '#4a148c' 
        });
        return;
    }

    
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (file) data.append('signature', file);

    try {
        
        Swal.fire({
            title: 'Uploading...',
            text: 'Please wait while we process the registration',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch('http://localhost:5000/api/register-pathologist', {
            method: 'POST',
            body: data 
        });

        const result = await response.json();

        if (result.success) {
            Swal.close();
            navigate(`/add-doctor?ref=${result.profileId}`);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Registration Error',
                text: result.message || 'Failed to register pathologist',
            });
        }
    } catch (err) {
        console.error("Upload error:", err);
        Swal.fire({
            icon: 'error',
            title: 'Connection Failed',
            text: 'Server connection failed. Please check your network or backend.',
        });
    }
};
const handleDateChange = (newValue) => {

    if (newValue && dayjs(newValue).isValid()) {
        const calculatedAge = dayjs().diff(newValue, 'year');
        
        setFormData(prev => ({
            ...prev,
            dob: newValue,
            age: calculatedAge >= 0 ? calculatedAge : 0
        }));
    } else {
        // If the date is cleared or invalid
        setFormData(prev => ({
            ...prev,
            dob: null,
            age: ""
        }));
    }
};

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="signature-modal-container" style={{ 
        width: '90%', maxWidth: '1100px', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 15px 35px rgba(0,0,0,0.3)' 
      }}>
        
        {/* Header */}
        <div style={{ 
          background: '#4a148c', padding: '18px 25px', color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaUserMd size={22} />
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
               Pathologist Registration {step === 1 ? "(Step 1: Profile)" : "(Step 2: Registry)"}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
        </div>

        <div className="modal-scroll-body" style={{ padding: '25px', backgroundColor: '#f3e5f5', maxHeight: '80vh', overflowY: 'auto' }}>
          
          {step === 1 && (
            <div className="step-1-form">
              {/* Section 1: Personal */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h4 style={{ color: '#4a148c', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e1bee7', paddingBottom: '10px' }}>
                <FaUserTag /> Personal Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
  <label style={{ fontWeight: 'bold', color: '#4a148c', fontSize: '13px' }}>
    User Name
  </label>
  <input 
    type="text" 
    name="userName" 
    placeholder="Enter User Name" 
    onChange={handleInputChange} 
    style={{
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #dadce0',
      outline: 'none'
    }}
  />
</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
  <label style={{ fontWeight: 'bold', color: '#4a148c', fontSize: '13px' }}>
    First Name
  </label>
  <input 
    type="text" 
    name="firstName" 
    placeholder="Enter first Name" 
    onChange={handleInputChange} 
    style={{
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #dadce0',
      outline: 'none'
    }}
  />
</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
  <label style={{ fontWeight: 'bold', color: '#4a148c', fontSize: '13px' }}>
    Last Name
  </label>
  <input 
    type="text" 
    name="lastName" 
    placeholder="Enter last Name" 
    onChange={handleInputChange} 
    style={{
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #dadce0',
      outline: 'none'
    }}
  />
</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', color: '#4a148c', fontSize: '13px' }}>Gender</label>
                  <select name="gender" onChange={handleInputChange}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
  <label style={{ fontWeight: 'bold', color: '#4a148c', fontSize: '13px' }}>DOB</label>
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <DatePicker
      value={formData.dob} 
      onChange={handleDateChange} 
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
</div>

<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
  <label style={{ fontWeight: 'bold', color: '#4a148c', fontSize: '13px' }}>Age</label>
  <input 
    type="number" 
    name="age" 
    placeholder="Age" 
    value={formData.age} // Binds to calculated state
    onChange={handleInputChange} 
  />
</div>
              </div>
            </div>

            {/* Section 2: Education */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h4 style={{ color: '#4a148c', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e1bee7', paddingBottom: '10px' }}>
                <FaGraduationCap /> Education & Registration
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', color: '#4a148c', fontSize: '13px' }}>Undergraduate Degree</label>
                  <input type="text" name="undergraduateDegree" placeholder="e.g. MBBS" onChange={handleInputChange} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', color: '#4a148c', fontSize: '13px' }}>UG University</label>
                  <input type="text" name="ugUniversity" placeholder="University" onChange={handleInputChange} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', color: '#4a148c', fontSize: '13px' }}>Postgraduate Degree</label>
                  <input type="text" name="postgraduateDegree" placeholder="e.g. MD" onChange={handleInputChange} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', color: '#4a148c', fontSize: '13px' }}>PG University</label>
                  <input type="text" name="pgUniversity" placeholder="University" onChange={handleInputChange} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', color: '#4a148c', fontSize: '13px' }}>Registration Number</label>
                  <input type="text" name="registrationNumber" placeholder="Reg No" onChange={handleInputChange} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', color: '#4a148c', fontSize: '13px' }}>Designation Category</label>
                  <select name="designationCategory" onChange={handleInputChange}>
                    <option value="">-- select --</option>
                    <option value="Pathologist">Pathologist</option>
                    <option value="Micro Biologist">Micro Biologist</option>
                    <option value="Bio Chemist">Bio Chemist</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Signature */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
  <div style={{ background: '#fce4ec', padding: '20px', borderRadius: '10px', border: '1px dashed #4a148c' }}>
    <h4 style={{ margin: '0 0 10px 0', color: '#4a148c' }}><FaFileSignature /> Upload Signature</h4>
    <p style={{ fontSize: '11px', color: '#666', marginBottom: '15px' }}>Max 30kB | 397 X 381 pixels</p>
    
    <input 
      type="file" 
      accept="image/*" 
      onChange={handleFileChange} 
    />
    
    {preview && (
      <div style={{ marginTop: '10px' }}>
        <p style={{ fontSize: '10px', color: '#4a148c', margin: '0' }}>Signature Preview:</p>
        <img src={preview} alt="Preview" style={{ display: 'block', height: '60px', border: '1px solid #ccc', background: '#fff' }} />
      </div>
    )}
  </div>

  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
    <label style={{ fontWeight: 'bold', color: '#4a148c', fontSize: '13px' }}> 
      Designation For Report <span style={{color: 'red'}}>*</span>
    </label>
    <textarea 
      name="designationForReport" 
      rows="4" 
     placeholder={isScanning ? "Scanning signature for text..." : "Appears on report..."}
  disabled={isScanning} // Optional: prevent typing while OCR is running
  style={{ 
    width: '100%', 
    padding: '10px', 
    borderRadius: '8px', 
    border: isScanning ? '1px solid #4a148c' : '1px solid #ddd', // Glow effect while scanning
    transition: 'border 0.3s ease'
  }}
  value={formData.designationForReport} 
  onChange={handleInputChange}
  required
    ></textarea>
    <p style={{ fontSize: '10px', color: '#888' }}>Tip: Uploading your signature will auto-fill text if detected.</p>
  </div>
</div>

              <div style={{ textAlign: 'right', marginTop: '30px' }}>
  <button 
    type="button" 
    onClick={handleContinueToRegistry} 
    className="innovative-btn" 
    style={{ 
        background: '#4a148c', 
        color: 'white', 
        padding: '10px 30px', 
        borderRadius: '5px', 
        cursor: 'pointer', 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '10px',
        border: 'none' 
    }}
>
    Continue to Registry Details <FaArrowRight />
</button>
</div>
            </div>
          )}

          {step === 2 && (
            <div className="step-2-form">
               <div style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <h4 style={{ color: '#4a148c', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e1bee7', paddingBottom: '10px' }}>
                    <FaPhoneAlt /> Step 2: Contact & Notification
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                    <div className="form-group-purple">
                      <label>Email ID</label>
                      <input type="email" name="emailId" className="purple-select" placeholder="email@hospital.com" value={formData.emailId} onChange={handleInputChange} />
                    </div>
                    <div className="form-group-purple">
                      <label>Phone Number</label>
                      <input type="text" name="phoneNo" className="purple-select" placeholder="Phone Number" value={formData.phoneNo} onChange={handleInputChange} />
                    </div>
                    <div className="form-group-purple">
                        <label>Mail Notification Required?</label>
                        <div style={{marginTop: '10px'}}>
                            <input type="radio" name="notification" checked={formData.notification === 'Yes'} onChange={() => setFormData({...formData, notification: 'Yes'})} /> Yes
                            <input type="radio" name="notification" style={{marginLeft:'15px'}} checked={formData.notification === 'No'} onChange={() => setFormData({...formData, notification: 'No'})} /> No
                        </div>
                    </div>
                  </div>
               </div>

               <div style={{ textAlign: 'right', marginTop: '30px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                 <button type="button" onClick={() => setStep(1)} style={{ marginRight: '10px', padding: '10px 20px', borderRadius: '5px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>
                    <FaArrowLeft /> Back to Profile
                 </button>
                 <button onClick={handleFinalSubmit} className="innovative-btn" style={{ background: '#2e7d32', color: 'white', padding: '10px 30px', borderRadius: '5px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                   Finalize & View Registry <FaCheckCircle />
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadSignatureModal;