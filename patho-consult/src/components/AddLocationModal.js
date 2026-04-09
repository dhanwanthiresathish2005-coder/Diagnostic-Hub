import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { UserPlus } from 'lucide-react';
import { MapPinPlus } from 'lucide-react';
import { FileEdit, Search, Home, Mail, MapPin } from 'lucide-react';

const AddLocationModal = ({ isOpen, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({ code: "", name: "" });

  if (!isOpen) return null;

  /**
   * Auto-fill logic: 
   * 1. Takes first 3 letters of name (ADY)
   * 2. Adds a suffix (-001)
   */
  const handleNameChange = (e) => {
    const nameValue = e.target.value;
    
    // Logic: Get first 3 letters, uppercase them, add -001
    // If name is shorter than 3 letters, it just takes what is available
    let prefix = nameValue
      .replace(/\s/g, '') 
      .substring(0, 3)
      .toUpperCase();

    const suggestedCode = prefix ? `${prefix}-001` : "";

    setFormData({
      name: nameValue,
      code: suggestedCode
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

  const handleSave = async () => {
  // 1. Validation Check
  if (!formData.name || !formData.code) {
    Swal.fire({
      icon: 'warning',
      title: 'Missing Information',
      text: 'Please enter both Name and Code',
      confirmButtonColor: '#4a148c', // Matching your purple theme
    });
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/add-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    
    if (data.success) {
      // 2. Success Alert
      Swal.fire({
        icon: 'success',
        title: 'Saved!',
        text: 'Location saved successfully!',
        timer: 2000,
        showConfirmButton: false
      });

      if (onRefresh) onRefresh(); 
      setFormData({ code: "", name: "" });
      onClose();
    } else {
      // 3. Backend Error Alert
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: data.message || "Failed to save location",
      });
    }
  } catch (err) {
    // 4. Connection/Server Error Alert
    Swal.fire({
      icon: 'error',
      title: 'Server Error',
      text: 'Please check if your backend is running on port 5000.',
      footer: 'Technical Details: ' + err.message
    });
  }
};

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
       
<div style={{ 
    ...styles.header, 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px' 
}}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        <MapPinPlus size={20} strokeWidth={2.5} color="white" />
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Add New Location</span>
    </div>
    <button onClick={onClose} style={styles.closeX}>&times;</button>
</div>

        <div style={styles.body}>
          {/* Location Name Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Location Name</label>
            <input 
              type="text" 
              placeholder="e.g. Adyar"
              value={formData.name}
              style={styles.input}
              onChange={handleNameChange}
              autoFocus
            />
          </div>

          {/* Location Code Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Location Code</label>
            <input 
              type="text" 
              placeholder="e.g. ADY-001"
              value={formData.code}
              style={styles.input}
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
            />
            <small style={{ fontSize: '11px', color: '#666', marginTop: '4px', display: 'block' }}>
              Format: PREFIX-000 (You can customize the number)
            </small>
          </div>

          <button style={styles.submitBtn} onClick={handleSave}>
            Save Location
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    width: '380px',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    overflow: 'hidden',
    animation: 'modalFadeIn 0.3s ease-out',
  },
  header: {
    backgroundColor: '#4a148c',
    color: 'white',
    padding: '18px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeX: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '22px',
    cursor: 'pointer',
  },
  body: {
    padding: '24px',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#4a148c',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ced4da',
    boxSizing: 'border-box',
    fontSize: '14px',
    transition: 'border-color 0.2s',
    outline: 'none',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#4a148c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '10px',
    boxShadow: '0 4px 6px rgba(74, 20, 140, 0.2)',
  }
};

export default AddLocationModal;