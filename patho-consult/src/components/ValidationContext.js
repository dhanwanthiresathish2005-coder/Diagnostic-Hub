import React, { createContext, useState, useContext } from 'react';
import { Snackbar, Alert, Modal, Box, Typography, Button } from '@mui/material';

const ValidationContext = createContext();

export const ValidationProvider = ({ children }) => {
    const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
    const [panicModal, setPanicModal] = useState({ open: false, testName: '', value: '' });

    const showMessage = (message, severity = 'info') => {
        setToast({ open: true, message, severity });
    };

    const validateResult = (testName, value, rangeStr) => {
        if (!value || !rangeStr || rangeStr === "Refer to Master") return 'NORMAL';
        const numbers = rangeStr.match(/(\d+(\.\d+)?)/g);
        if (!numbers || numbers.length < 2) return 'NORMAL';

        const val = parseFloat(value);
        const min = parseFloat(numbers[0]);
        const max = parseFloat(numbers[1]);
        if (val <= min * 0.6 || val >= max * 1.4) {
            setPanicModal({ open: true, testName, value: val });
            return 'CRITICAL';
        }
        if (val < min || val > max) return 'ABNORMAL';
        return 'NORMAL';
    };

    return (
        <ValidationContext.Provider value={{ showMessage, validateResult }}>
            {children}

            {/* Global Toast for Success/Warnings */}
            <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
                <Alert severity={toast.severity} variant="filled">{toast.message}</Alert>
            </Snackbar>

            {/* Global Panic Modal for Red Alerts */}
            <Modal open={panicModal.open} onClose={() => setPanicModal({ ...panicModal, open: false })}>
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'white', border: '4px solid red', p: 4, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h5" color="error" fontWeight="bold">🚨 PANIC VALUE ALERT</Typography>
                    <Typography sx={{ mt: 2 }}>{panicModal.testName}: <strong>{panicModal.value}</strong></Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>Please follow immediate physician notification protocol.</Typography>
                    <Button variant="contained" color="error" sx={{ mt: 3 }} onClick={() => setPanicModal({ ...panicModal, open: false })}>Acknowledge</Button>
                </Box>
            </Modal>
        </ValidationContext.Provider>
    );
};

export const useValidation = () => useContext(ValidationContext);