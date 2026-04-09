import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

const LocationModal = ({ isOpen, onClose, onConfirm }) => {
  const [inputValue, setInputValue] = useState("");
  const [animate, setAnimate] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setAnimate(false);
      setTimeout(() => setAnimate(true), 10);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 🎨 Styles inside JS
  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      height: "100vh",
      width: "100%",
      background: "rgba(40,0,60,0.35)",
      backdropFilter: "blur(4px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 999
    },

    modal: {
      width: "380px",
      borderRadius: "14px",
      background: "#fff",
      boxShadow: "0 15px 40px rgba(74,20,140,0.25)",
      overflow: "hidden",
      transform: animate ? "scale(1)" : "scale(0.9)",
      opacity: animate ? 1 : 0,
      transition: "0.25s ease"
    },

    header: {
      background: "linear-gradient(135deg, #6a1b9a, #4a148c)",
      color: "white",
      padding: "14px 18px",
      fontSize: "18px",
      fontWeight: "bold",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },

    closeBtn: {
      border: "none",
      background: "transparent",
      color: "white",
      fontSize: "22px",
      cursor: "pointer"
    },

    body: {
      padding: "25px"
    },

    label: {
      fontWeight: "600",
      color: "#4a148c",
      marginBottom: "6px"
    },

    input: {
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #d1c4e9",
      fontSize: "14px",
      transition: "0.2s",
      outline: "none",
      marginBottom: "18px"
    },

    button: {
      width: "100%",
      padding: "11px",
      border: "none",
      borderRadius: "8px",
      background: "linear-gradient(135deg, #7b1fa2, #4a148c)",
      color: "white",
      fontWeight: "bold",
      fontSize: "15px",
      cursor: "pointer",
      transition: "0.25s",
      boxShadow: "0 6px 14px rgba(74,20,140,0.25)"
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>

<div style={styles.header}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <MapPin size={22} color="white" strokeWidth={2.5} />
        <span>Find Location</span>
    </div>
    
    <button style={styles.closeBtn} onClick={onClose}>
        &times;
    </button>
</div>

        <div style={styles.body}>
          <div style={styles.label}>Location Code</div>

          <input
            ref={inputRef}
            style={styles.input}
            type="text"
            placeholder="Ex: MYL002"
            value={inputValue}
            onChange={(e) =>
              setInputValue(e.target.value.toUpperCase())
            }
          />

          <button
            style={styles.button}
            onClick={() => onConfirm(inputValue)}
            onMouseOver={(e) =>
              (e.target.style.transform = "translateY(-2px)")
            }
            onMouseOut={(e) =>
              (e.target.style.transform = "translateY(0)")
            }
          >
            Find Location
          </button>
        </div>

      </div>
    </div>
  );
};

export default LocationModal;
