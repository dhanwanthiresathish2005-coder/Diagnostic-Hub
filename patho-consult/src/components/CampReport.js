import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, IconButton, CircularProgress, Box } from '@mui/material';
import { FaHome, FaTimes, FaFilter } from 'react-icons/fa';
import axios from 'axios';
import HomeIcon from '@mui/icons-material/Home';
import {Search, Home, Mail, MapPin } from 'lucide-react';

function CampReport() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [clientList, setClientList] = useState([]); 
    const [showResults, setShowResults] = useState(false);
    const [reportData, setReportData] = useState([]);
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

    const [filters, setFilters] = useState({
        invoiceType: 'All',
        invoiceStatus: 'All',
        selectedClientId: '', 
        clientCode: '',
        clientName: '',
        month: months[new Date().getMonth()],
        year: currentYear.toString(),
    });

    // Fetch clients from backend
    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const response = await axios.get('http://localhost:5000/api/collected-at');
                if (response.data.success) {
                    // "Self" as a virtual client
                    const clients = [{ id: 'self', name: 'Self / Walk-in' }, ...response.data.data];
                    setClientList(clients);
                    
                    // Default to first client (Self)
                    const first = clients[0];
                    setFilters(prev => ({
                        ...prev,
                        selectedClientId: first.id,
                        clientCode: 'SELF',
                        clientName: first.name
                    }));
                }
            } catch (error) {
                console.error("Error fetching clients:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, []);

    const handleClientChange = (e) => {
        const id = e.target.value;
        // Handle both numeric IDs and the string 'self'
        const selected = clientList.find(c => c.id.toString() === id.toString());
        
        if (selected) {
            setFilters(prev => ({
                ...prev,
                selectedClientId: id,
                clientCode: id === 'self' ? 'SELF' : `CL-${selected.id.toString().padStart(3, '0')}`,
                clientName: selected.name,
                // Automatically switch Invoice Type to 'Walk-in' if Self is picked
                invoiceType: id === 'self' ? 'Walk-in' : (prev.invoiceType === 'Walk-in' ? 'All' : prev.invoiceType)
            }));
        }
    };

    const handleGenerate = async () => {
        const monthIndex = months.indexOf(filters.month);
        const fromDate = `${filters.year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(filters.year, monthIndex + 1, 0).getDate();
        const toDate = `${filters.year}-${String(monthIndex + 1).padStart(2, '0')}-${lastDay}`;
        
        const params = {
            from: fromDate,
            to: toDate,
            type: filters.invoiceType === 'All' ? null : filters.invoiceType,
            clientId: filters.selectedClientId === 'self' ? 'self' : filters.selectedClientId,
            status: filters.invoiceStatus === 'All' ? null : filters.invoiceStatus 
        };

        try {
            const res = await axios.get('http://localhost:5000/api/invoices', { params });
            setReportData(res.data);
            setShowResults(true); 
        } catch (err) {
            console.error("Fetch Error:", err);
        }
    };

    const labelColumnStyle = { padding: '10px 15px', backgroundColor: '#f9f9f9', fontSize: '0.85rem', borderRight: '1px solid #ddd', display: 'flex', alignItems: 'center', fontWeight: '500' };
    const inputColumnStyle = { padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' };
    const rowStyle = { display: 'grid', gridTemplateColumns: '180px 1fr', borderBottom: '1px solid #ddd' };

    return (
        <div style={{ backgroundColor: '#f3e5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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

            <main style={{ flex: 1, display: 'flex', justifyContent: 'center', paddingTop: '50px', paddingBottom: '200px' }}>
                <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '700px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #eee' }}>
                        <FaFilter color="#4a148c" />
                        <Typography sx={{ fontWeight: 'bold', color: '#1a237e' }}>Invoice & Camp Report Filters</Typography>
                    </Box>

                    <div style={{ padding: '25px' }}>
                        <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                            {/* Invoice Type */}
                            <div style={rowStyle}>
                                <div style={labelColumnStyle}>Invoice Category</div>
                                <div style={inputColumnStyle}>
                                    <select 
                                        style={{ width: '100%', padding: '8px' }}
                                        value={filters.invoiceType}
                                        onChange={(e) => {
                                            const type = e.target.value;
                                            let updates = { invoiceType: type };
                                            if (type === 'Walk-in') {
                                                updates.selectedClientId = 'self';
                                                updates.clientCode = 'SELF';
                                                updates.clientName = 'Self / Walk-in';
                                            }
                                            setFilters({...filters, ...updates});
                                        }}
                                    >
                                        <option value="All">All Invoices</option>
                                        <option value="Group">Group Billing</option>
                                        <option value="Walk-in">Self / Walk-in</option>
                                        <option value="Insurance">Insurance</option>
                                    </select>
                                </div>
                            </div>

                            {/* Payment Status */}
                            <div style={rowStyle}>
                                <div style={labelColumnStyle}>Payment Status</div>
                                <div style={inputColumnStyle}>
                                    <select 
                                        style={{ width: '100%', padding: '8px' }}
                                        value={filters.invoiceStatus}
                                        onChange={(e) => setFilters({...filters, invoiceStatus: e.target.value})}
                                    >
                                        <option value="All">All Status</option>
                                        <option value="Approved">Fully Paid</option>
                                        <option value="Pending">Dues Remaining</option>
                                    </select>
                                </div>
                            </div>

                            {/* Client Selection */}
                            <div style={rowStyle}>
                                <div style={labelColumnStyle}>Select Client</div>
                                <div style={inputColumnStyle}>
                                    {loading ? <CircularProgress size={20} /> : (
                                        <select 
                                            style={{ flex: 1, padding: '8px' }}
                                            value={filters.selectedClientId}
                                            onChange={handleClientChange}
                                        >
                                            {clientList.map(client => (
                                                <option key={client.id} value={client.id}>{client.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            {/* Period */}
                            <div style={{ ...rowStyle, borderBottom: 'none' }}>
                                <div style={labelColumnStyle}>Reporting Period</div>
                                <div style={inputColumnStyle}>
                                    <select style={{ flex: 1, padding: '8px' }} value={filters.month} onChange={(e) => setFilters({...filters, month: e.target.value})}>
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <select style={{ flex: 1, padding: '8px' }} value={filters.year} onChange={(e) => setFilters({...filters, year: e.target.value})}>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                            <Button 
                                variant="contained" 
                                sx={{ backgroundColor: '#4a148c', borderRadius: '4px', px: 6, py: 1.5, fontWeight: 'bold' }} 
                                onClick={handleGenerate}
                            >
                                Generate Report
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Results Overlay */}
                {showResults && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                        <div style={{ backgroundColor: 'white', width: '95%', maxWidth: '1100px', maxHeight: '90vh', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ backgroundColor: '#4a148c', color: 'white', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Typography sx={{ fontWeight: 'bold' }}>{filters.clientName} Report</Typography>
                                    <Typography sx={{ fontSize: '0.75rem', opacity: 0.8 }}>{filters.month} {filters.year} | {filters.invoiceType} | {filters.invoiceStatus}</Typography>
                                </div>
                                <IconButton onClick={() => setShowResults(false)} sx={{ color: 'white' }}><FaTimes size={20} /></IconButton>
                            </div>

                            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #4a148c' }}>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Invoice #</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Patient Name</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>Total (₹)</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                                        </tr>
                                    </thead>
                                   <tbody>
    {reportData.length > 0 ? reportData.map((row, index) => {
        // Logic check for Paid vs Due
        const isPaid = parseFloat(row.balance) <= 0;
        const statusText = isPaid ? 'Paid' : 'Due';
        
        return (
            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{row.date}</td>
                <td style={{ padding: '10px' }}>{row.invoiceNo}</td>
                <td style={{ padding: '10px' }}>{row.patientName}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{row.totalAmount}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                    <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold',
                        // Status Colors: Green for Paid, Red for Due
                        backgroundColor: isPaid ? '#e8f5e9' : '#ffebee',
                        color: isPaid ? '#2e7d32' : '#c62828',
                        border: `1px solid ${isPaid ? '#a5d6a7' : '#ef9a9a'}`
                    }}>
                        {statusText}
                    </span>
                </td>
            </tr>
        );
    }) : (
        <tr>
            <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No records found.</td>
        </tr>
    )}
</tbody>
                                </table>
                            </div>

                            <div style={{ padding: '15px 25px', borderTop: '1px solid #ddd', backgroundColor: '#f9f9f9', display: 'flex', justifyContent: 'flex-end', gap: '40px' }}>
                                <Typography>Records: <strong>{reportData.length}</strong></Typography>
                                <Typography sx={{ color: '#4a148c' }}>Grand Total: <strong>₹{reportData.reduce((sum, r) => sum + parseFloat(r.totalAmount || 0), 0).toFixed(2)}</strong></Typography>
                            </div>
                        </div>
                    </div>
                )}
            </main>
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
}

export default CampReport;