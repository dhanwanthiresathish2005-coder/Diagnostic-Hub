import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import {Search,  Mail, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';
import { Box, Drawer, List, ListItemButton, ListItemIcon, 
  ListItemText, Typography, Avatar, Grid, Card, CardContent, 
  IconButton, Badge, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  Select, MenuItem, FormControl, Divider, Tooltip,
  Menu
} from '@mui/material';
import { 
  People, Biotech, Logout, Notifications, ChevronRight, 
  LocalHospital, Assignment, Science, Assessment, Settings, 
  AdminPanelSettings, Security, Storage, Business, 
  Receipt, FactCheck, PlaylistAdd, ScienceOutlined, LensBlur
} from '@mui/icons-material';
import { useNotifications, } from './NotificationContext';
import { Adjust } from '@mui/icons-material';
import LocationModal from "./LocationModal"; 
import AddRoleModal from "./AddRoleModal";
import UploadSignatureModal from "./UploadSignatureModal";
import AddLocationModal from "./AddLocationModal";

const drawerWidth = 240;


const roleOperations = {
  Admin: [
    { sNo: 0, desc: "Create User", page: "Create User", icon: <People fontSize="small"/> },
    { sNo: 1, desc: "Add Role", page: "Add Role", icon: <Security fontSize="small"/> },
    { sNo: 51, desc: "Add Location Modal", page: "Add Location", icon: <LocalHospital fontSize="small"/> },
    { sNo: 50, desc: "View Location", page: "View Location", icon: <Storage fontSize="small"/> },
    { sNo: 59, desc: "Upload Signature", page: "Upload Signature", icon: <Settings fontSize="small"/> }
  ],
  Registration: [
    { sNo: 2, desc: "Add Out Of Hospital", page: "Add Out Of Hospital" },
    { sNo: 3, desc: "Add Group", page: "Add Group" },
    { sNo: 4, desc: "Add Insurance", page: "Add Insurance" },
    { sNo: 20, desc: "Add Title", page: "Add Title" },
    { sNo: 30, desc: "Add CollectedAt", page: "Add CollectedAt" },
    { sNo: 35, desc: "Add Doctors Details", page: "Add Doctors Details" },
    { sNo: 40, desc: "Add PatientDetails", page: "Add Patient Details" },
    { sNo: 41, desc: "Display Codes", page: "Display Codes" },
  ],
  Lab: [
    { sNo: 7, desc: "Add Test", page: "Add Test" },
    { sNo: 8, desc: "Add Profile", page: "Add Profile" },
    { sNo: 9, desc: "Add Test Element", page: "Add Test Element" },
    { sNo: 10, desc: "Edit Rate Card", page: "Edit Rate Card" },
    { sNo: 12, desc: "Lab View", page: "Lab View" },
    { sNo: 13, desc: "Template Details", page: "Template Details" },
    { sNo: 14, desc: "Disable Test", page: "Disable Test" },
    { sNo: 15, desc: "View Edit Test", page: "View Edit Test" },
    { sNo: 19, desc: "Disable Test", page: "Disable Test" },
    { sNo: 6, desc: "Add Department", page: "Add Department" },
    { sNo: 56, desc: "Add Department Priority", page: "Add Department Priority" },
    { sNo: 58, desc: "Add Test Priority", page: "Add Test Priority" },
    { sNo: 21, desc: "Add Free Text Template", page: "Add Free Text Template" },
    { sNo: 23, desc: "Add Isolated Organism", page: "Add Isolated Organism" },
    { sNo: 24, desc: "Add AntiMicrobial Agent", page: "Add AntiMicrobial Agent" }
  ],
  Invoice: [
    { sNo: 16, desc: "Edit Invoice", page: "Edit Invoice" },
    { sNo: 18, desc: "Invoice Report", page: "Invoice Report" },
    { sNo: 70, desc: "Camp Report", page: "Camp Report" }
  ]
};

const menuItems = [
  { name: "FrontDesk", icon: <Assignment />, badge: null },
  { name: "Sample Collect", icon: <Biotech />, badge: null },
  { name: "Lab View", icon: <Science />, badge: null },
  { name: "Approver ", icon: <FactCheck />, badge: null },
  { name: "Customer Care", icon: <People />, badge: null },
  { name: "PatientDetails", icon: <PlaylistAdd />, badge: null },
  { name: "TableView", icon: <Storage />, badge: null },
  { name: "Ammend", icon: <Settings />, badge: null }
];


const ROLE_PERMISSIONS = {
  Admin: [
    "FrontDesk", "Sample Collect", "Lab View", 
    "Approver ", "Customer Care", "PatientDetails", 
    "TableView", "Ammend"
  ],
  Pathologist: [
    "Sample Collect", "Lab View", "Approver ", "PatientDetails", 
    "Ammend", "TableView"
  ],
  Lab: [
    "FrontDesk","Sample Collect", "Lab View", "Approver ", "Customer Care", "PatientDetails", "TableView", "Ammend"
  ],
  FrontDesk: [
    "FrontDesk", "PatientDetails", "Customer Care","TableView"
  ]
};

function Home() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("Admin");
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); 
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);
  // Line 8: Pull setNotifications from the hook
const { notifications, setNotifications, clearNotifications } = useNotifications(); 

// Line 12: This function is now correctly linked to the hook's state
const addNotification = useCallback((text, type, target = null) => {
  const newNote = {
    id: Date.now(),
    text,
    type,
    target, 
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  setNotifications(prev => [newNote, ...prev]);
}, [setNotifications]);

  const [patients, setPatients] = useState([]);
  const [seenNotifications, setSeenNotifications] = useState(new Set());
  
  const [localNotifications, setLocalNotifications] = useState([]);
  
  const doctorName = localStorage.getItem('userName');
  const [welcomeAlertShown, setWelcomeAlertShown] = useState(
    sessionStorage.getItem('welcomeAlertDismissed') === 'true'
);
const showNotificationToast = (message) => {
    // Example using SweetAlert2's toast mode
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });
    Toast.fire({
        icon: 'warning',
        title: message
    });
};


  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userToken");
    navigate('/login');
  };
  const [userProfile, setUserProfile] = useState({
    name: "User",
    role: "Staff"
  });


const PathoLogo = () => (
  <Box sx={{ position: 'relative', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {/* Concentric Circles */}
    <Box sx={{ 
      position: 'absolute', width: 34, height: 34, 
      border: '6px solid #e1bee7', 
      borderRadius: '50%', 
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <Box sx={{ width: 12, height: 12, bgcolor: '#7b1fa2', borderRadius: '50%' }} /> 
    </Box>
    <Box sx={{ 
      position: 'absolute', left: 4, top: 0, 
      width: 6, height: '100%', bgcolor: '#7b1fa2', 
      zIndex: 2,
      borderRadius: '2px' 
    }} />
  </Box>
);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedRole = localStorage.getItem("userRole");

    if (storedName && storedRole) {
      setUserProfile({
        name: storedName,
        role: storedRole
      });
      
      
      if (roleOperations[storedRole]) {
       setSelectedRole(storedRole);
      }
    }
  }, []);
  const markAsRead = async (id) => {
    try {
        await axios.post(`http://localhost:5000/api/notifications/mark-read/${id}`);
        fetchNotifications();
    } catch (err) {
        console.error("Failed to mark notification as read", err);
    }
};

useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
}, [doctorName]);


const fetchNotifications = async () => {
    try {
        const response = await axios.get(`http://localhost:5000/api/notifications/unread?doctorName=${doctorName}`);
        
        if (response.data.success) {
            setLocalNotifications(response.data.notifications);
            response.data.notifications.forEach(notif => {
                if (!seenNotifications.has(notif.id)) {
                    const displayName = notif.patient_name || `Sample #${notif.sample_id}`;
                    showNotificationToast(`New critical result for ${displayName}`);
                    setSeenNotifications(prev => new Set(prev).add(notif.id));
                }
            });
        }
    } catch (err) {
        console.error("Connection failed.");
    }
};


useEffect(() => {
  const role = localStorage.getItem('userRole');
  const name = localStorage.getItem('userName');
  if (role === 'Pathologist' && !welcomeAlertShown) {
    
    const checkAlerts = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/notifications/unread`, {
          params: { doctorName: name } 
        });

        if (res.data.success && res.data.notifications.length > 0) {
          setWelcomeAlertShown(true);
          const sampleId = res.data.notifications[0].sample_id; 
          Swal.fire({
  title: `Welcome, Dr. ${name}`,
  text: `You have ${res.data.notifications.length} unread critical notifications.`,
  icon: 'warning',
  showCancelButton: true,
  confirmButtonColor: '#4a148c',
  confirmButtonText: 'View Rejections',
  cancelButtonText: 'Close'
}).then((result) => {
  if (result.isConfirmed) {
    const btn = document.getElementById('notification-button');
    if (btn) {
        setAnchorEl(btn); 
    } else {
        const firstSample = res.data.notifications[0].sample_id;
        navigate(`/sample-action-screen/${firstSample}`);
    }
  }
});
        }
      } catch (err) {
        console.error("Alert check failed", err);
      }
    };

    checkAlerts();
  }
}, [navigate, welcomeAlertShown]); 


  
useEffect(() => {
  const token = localStorage.getItem("userToken");
  if (!token) {
    navigate('/'); 
    return;
  }
  
}, [navigate]);

  const handleActionClick = (itemName) => {
  const userRole = userProfile.role;

  const isAllowed = ROLE_PERMISSIONS[userRole]?.includes(itemName);

  if (!isAllowed) {
    console.warn(`Access Denied for role: ${userRole} on item: ${itemName}`);
    alert(`Your account (${userRole}) does not have permission to access ${itemName}.`);
    return;
  }

  // 3. If allowed, proceed with your existing navigation logic
  if (itemName === "FrontDesk") {
    navigate('/loading-frontdesk');
  } else if (itemName === "Sample Collect") {
    setIsModalOpen(true);
  } else if (itemName === "Customer Care") {
    navigate('/loading-customerdesk');
  } else if (itemName === "PatientDetails") {
    navigate('/loading-patientdesk');
  } else if (itemName === "Lab View") {
    navigate('/loading-labdesk');
  } else if (itemName === "Approver ") {
    navigate('/loading-approverdesk');
  } else if (itemName === "TableView") {
    navigate('/loading-tabledesk');
  } else if (itemName === "Ammend") {
    navigate('/loading-ammenddesk');
  } else {
    console.log(`${itemName} clicked`);
  }
};

  const handleTableOpClick = (desc) => {
    const navigationMap = {
      "Add Location Modal": () => setIsAddModalOpen(true),
      "Add Role": () => setIsRoleModalOpen(true),
      "Upload Signature": () => setIsSigModalOpen(true),
      "Add Out Of Hospital": '/add-out-of-hospital',
      "Add Group": '/add-group',
      "View Location": '/view-location',
      "Create User": '/create-user',
      "Add Title": '/titles',
      "Add CollectedAt": '/collected-at',
      "Add Insurance": '/add-insurance',
      "Add Doctors Details": '/add-doctor',
      "Add PatientDetails": '/add-patient',
      "Add Client Code": '/add-client-code',
      "Display Codes": '/display-codes',
      "Add Test": '/add-test',
      "Add Profile": '/add-profile',
      "Add Test Element": '/add-test-element',
      "Edit Rate Card": '/edit-rate-card',
      "Lab View": '/lab-view',
      "Template Details": '/template-details',
      "Disable Test": '/disable-test',
      "View Edit Test": '/view-edit-test',
      "Add Department": '/add-department',
      "Department Priority": '/department-priority',
      "Add Department Priority": '/add-department-priority',
      "Add Test Priority": '/add-test-priority',
      "Add Free Text Template": '/add-free-text-template',
      "Add Isolated Organism": '/add-isolated-organs',
      "Add AntiMicrobial Agent": '/add-microbial-agent',
      "Edit Invoice": '/edit-invoice',
      "Invoice Report": '/invoice-report',
      "Camp Report": '/camp-report'
    };

    const target = navigationMap[desc];
    if (typeof target === 'function') target();
    else if (typeof target === 'string') navigate(target);
    else alert(`${desc} module is coming soon!`);
  };

const [anchorEl, setAnchorEl] = useState(null);
const openNotifications = Boolean(anchorEl);

const handleNotificationClick = (event) => {
  setAnchorEl(event.currentTarget);
};

const handleNotificationClose = () => {
  setAnchorEl(null);
};

const [sampleCount, setSampleCount] = useState(0);

useEffect(() => {
    const fetchCount = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/stats/samples-count');
            if (response.data.success) {
                setSampleCount(response.data.count);
            }
        } catch (error) {
            console.error("Error fetching count:", error);
        }
    };
    fetchCount();
}, []);


useEffect(() => {
    const fetchPatients = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/get-all-patients');
            setPatients(response.data);
        } catch (error) {
            console.error("Error fetching patients for notifications:", error);
        }
    };
    fetchPatients();
}, []);


const allowedMenuItems = useMemo(() => {
  const allowedNames = ROLE_PERMISSIONS[userProfile.role] || [];
  
  // Filter the main menuItems array
  return menuItems.filter(item => allowedNames.includes(item.name));
}, [userProfile.role]);



return (
    <Box sx={{ display: 'flex', bgcolor: '#f3e5f5', minHeight: '100vh' }}>
      
      {/* 1. SIDEBAR NAVIGATION */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          '& .MuiDrawer-paper': { 
            width: drawerWidth, 
            bgcolor: '#4a148c', 
            color: 'white',
            borderRight: 'none',
            boxShadow: '4px 0px 15px rgba(0,0,0,0.15)'
          },
        }}
      >
        <Box sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(180deg, #4a148c 0%, #6a1b9a 100%)' }}>
          <Typography variant="h6" fontWeight="900" sx={{ letterSpacing: 1.5 }}>PATHO PRO</Typography>
          <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 700 }}>DIAGNOSTICS v2.0</Typography>
        </Box>
        
        <List sx={{ mt: 2, px: 2 }}>
  {menuItems
    // 1. Filter the list based on the user's role before mapping
    .filter((item) => ROLE_PERMISSIONS[userProfile.role]?.includes(item.name))
    .map((item) => (
      <ListItemButton 
        key={item.name}
        onClick={() => handleActionClick(item.name)}
        sx={{ 
          borderRadius: '16px', 
          mb: 1, 
          py: 1.2,
          '&:hover': { 
            bgcolor: 'rgba(255,255,255,0.15)', 
            transform: 'translateX(5px)' 
          },
          transition: '0.2s all ease-in-out'
        }}
      >
        <ListItemIcon sx={{ color: '#e1bee7', minWidth: 42 }}>
          {item.icon}
        </ListItemIcon>
        <ListItemText 
          primary={item.name} 
          primaryTypographyProps={{ fontSize: '14px', fontWeight: 600 }} 
        />
      </ListItemButton>
    ))
  }
</List>

        <Box sx={{ mt: 'auto', p: 3 }}>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: '16px', color: '#ff8a80', bgcolor: 'rgba(255,138,128,0.1)' }}>
            <ListItemIcon sx={{ color: '#ff8a80', minWidth: 40 }}><Logout /></ListItemIcon>
            <ListItemText primary="Sign Out" primaryTypographyProps={{ fontWeight: '800' }} />
          </ListItemButton>
        </Box>
      </Drawer>

      {/* 2. MAIN CONTENT AREA */}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* TOP NAVBAR - UPDATED LOGO ONLY */}
<Box sx={{ 
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
  p: 1.5, px: 4, bgcolor: 'rgba(255,255,255,0.9)', borderBottom: '1px solid #e1bee7',
  position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)'
}}>
  <Box sx={{ width: 48, display: { xs: 'none', md: 'block' } }} /> 
  
  {/* LOGO & HEADING GROUP - TEXT ON LEFT, LOGO ON RIGHT */}
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
  
  {/* BRAND TEXT GROUP */}
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
    <Typography variant="h5" fontWeight="900" sx={{ 
      color: '#4a148c', 
      lineHeight: 1,
      letterSpacing: '0.5px',
      textTransform: 'uppercase'
    }}>
      Patho <span style={{ fontWeight: 400, color: '#7b1fa2' }}>Consult</span>
    </Typography>
    <Typography variant="caption" fontWeight="900" sx={{ color: '#9c27b0', letterSpacing: '2px', mt: 0.3 }}>
      DIAGNOSTICS
    </Typography>
  </Box>

  {/* LOGO MOVED TO THE RIGHT SIDE */}
  <PathoLogo /> 
  
</Box>
  
  {/* RIGHT ACTIONS - REMAINS UNTOUCHED */}
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
   <IconButton onClick={handleNotificationClick} id="notification-button" sx={{ color: anchorEl ? '#7b1fa2' : '#666' }}>
<Badge 
  badgeContent={localNotifications.length + notifications.length} 
  color="error"
>
  <Notifications fontSize="small" />
</Badge>
</IconButton>
    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: '24px' }} />
    <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
      <Typography variant="caption" fontWeight="800" color="#333" display="block" sx={{ lineHeight: 1 }}>
        {userProfile.name}
      </Typography>
      <Typography variant="caption" fontWeight="bold" color="primary">
        {userProfile.role}
      </Typography>
    </Box>
    <Avatar sx={{ 
        width: 34, height: 34, bgcolor: '#7b1fa2', fontSize: '0.9rem',
        fontWeight: 'bold', boxShadow: '0 4px 8px rgba(123,31,162,0.3)'
    }}>
      {userProfile.name.charAt(0).toUpperCase()}
    </Avatar>
  </Box>
</Box>

        {/* WELCOME HERO SECTION - COMPACT & CENTERED */}
<Box sx={{ 
  px: 4, 
  pt: 3, 
  pb: 1.5, 
  textAlign: 'center' 
}}>
  <Typography 
    variant="h5" 
    fontWeight="900" 
    sx={{ 
      color: '#1a237e', 
      mb: 0.5, 
      letterSpacing: '-0.2px' 
    }}
  >
    Hello, <span style={{ color: '#7b1fa2' }}>{userProfile.name}</span>
  </Typography>
  <Typography 
    variant="body2" 
    color="textSecondary" 
    sx={{ 
      fontWeight: 600, 
      maxWidth: '500px', 
      mx: 'auto',
      opacity: 0.8 
    }}
  >
    Diagnostics command center active. Ready to process results.
  </Typography>
</Box>

        {/* DASHBOARD GRID */}
        <Box sx={{ p: 4, pt: 0 }}>
          <Grid container spacing={4} justifyContent="center">
            
            {/* MODULES TABLE */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ 
                borderRadius: '28px', overflow: 'hidden', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.06)', 
                border: '1px solid #f3e5f5',
                height: '100%' 
              }}>
                <Box sx={{ 
                  p: 2.5, bgcolor: '#ffffff', display: 'flex', 
                  alignItems: 'center', justifyContent: 'space-between', 
                  borderBottom: '2px solid #f3e5f5' 
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: '#f3e5f5', p: 1, borderRadius: '10px' }}>
                      <AdminPanelSettings sx={{ color: '#4a148c' }} />
                    </Box>
                    <Typography variant="h6" fontWeight="bold">Quick Access Modules</Typography>
                  </Box>
                  
                  <FormControl size="small" sx={{ minWidth: 180, ml: 2 }}>
                    <Select 
                      value={selectedRole} 
                      onChange={(e) => setSelectedRole(e.target.value)}
                      sx={{ borderRadius: '10px', bgcolor: '#f8f9fa', fontWeight: 'bold', fontSize: '13px' }}
                    >
                      <MenuItem value="Admin">Admin Portal</MenuItem>
                      <MenuItem value="Registration">Registration</MenuItem>
                      <MenuItem value="Lab">Laboratory</MenuItem>
                      <MenuItem value="Invoice">Invoice</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <TableContainer sx={{ maxHeight: 440 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: '800', bgcolor: '#fcfaff', color: '#7b1fa2' }}>S.NO</TableCell>
                        <TableCell sx={{ fontWeight: '800', bgcolor: '#fcfaff', color: '#7b1fa2' }}>MODULE DESCRIPTION</TableCell>
                        <TableCell align="right" sx={{ fontWeight: '800', bgcolor: '#fcfaff', color: '#7b1fa2' }}>LAUNCH</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {roleOperations[selectedRole || "Admin"].map((op, index) => (
                        <TableRow key={op.sNo} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ width: 80, color: 'text.secondary', fontWeight: 'bold' }}>
                            {String(index + 1).padStart(2, '0')}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#444' }}>{op.desc}</TableCell>
                          <TableCell align="right">
                            <Tooltip title={`Open ${op.page}`}>
                              <IconButton 
                                onClick={() => handleTableOpClick(op.desc)}
                                sx={{ 
                                  bgcolor: '#f3e5f5', color: '#4a148c',
                                  '&:hover': { bgcolor: '#4a148c', color: 'white' },
                                  transition: '0.3s'
                                }}
                              >
                                <ChevronRight />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* KPI & PULSE SECTION */}
            <Grid item xs={12} lg={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                {/* PRIMARY KPI */}
                <Card sx={{ 
                  borderRadius: '24px', 
                  background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)', 
                  color: 'white',
                  boxShadow: '0 10px 20px rgba(74,20,140,0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <ScienceOutlined sx={{ position: 'absolute', right: -10, top: -10, fontSize: 120, opacity: 0.1 }} />
    
                    <Box>
  <Typography variant="subtitle2">SAMPLES PROCESSED</Typography>
  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
    {sampleCount.toLocaleString()} 
  </Typography>
  <Typography variant="caption">● Live Today</Typography>
</Box>
                  </CardContent>
                </Card>

                {/* SYSTEM PULSE */}
                <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #e1bee7', bgcolor: 'white', flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>System Pulse</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[
                      { label: "Database Sync", status: "Stable", color: "#2e7d32" },
                      { label: "Printer Cloud", status: "Connected", color: "#2e7d32" },
                      { label: "Lab API", status: "Active", color: "#2e7d32" }
                    ].map((pulse, i) => (
                      <Box key={i} sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="600">{pulse.label}</Typography>
                        <Typography variant="caption" sx={{ px: 1.5, py: 0.5, borderRadius: '20px', bgcolor: pulse.color + '20', color: pulse.color, fontWeight: 'bold' }}>
                          {pulse.status}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  
                  <Box sx={{ mt: 3 }}>
                    <button 
                      className="innovative-btn" 
                      style={{ 
                        background: 'linear-gradient(90deg, #4a148c, #7b1fa2)', 
                        color: 'white', border: 'none', padding: '14px', 
                        borderRadius: '12px', cursor: 'pointer', width: '100%',
                        fontWeight: 'bold', boxShadow: '0 4px 12px rgba(123,31,162,0.2)'
                      }}
                    >
                      Trigger Manual Sync
                    </button>
                  </Box>
                </Paper>
              </Box>
            </Grid>

          </Grid>
        </Box>
      </Box>

      
<LocationModal 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)} 
  onConfirm={(code) => {
    console.log("Location Code Received:", code); // Debug: Check if this fires
    navigate('/loading-locationdesk', { state: { locationCode: code } });
    setIsModalOpen(false);
  }} 
/>
      <AddLocationModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <AddRoleModal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} />
      <UploadSignatureModal isOpen={isSigModalOpen} onClose={() => setIsSigModalOpen(false)} />

       
{/* NOTIFICATION DROPDOWN */}
<Menu
  anchorEl={anchorEl}
  open={openNotifications}
  onClose={handleNotificationClose}
  PaperProps={{
    sx: {
      width: 320,
      maxHeight: 480,
      borderRadius: '16px',
      mt: 1.5,
      boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
      border: '1px solid #e1bee7',
      overflow: 'hidden'
    }
  }}
  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
>
  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fcfaff' }}>
    <Typography variant="subtitle1" fontWeight="800" color="#4a148c">Notifications</Typography>
    {/* Combined length of both sources */}
    {(localNotifications.length > 0 || notifications.length > 0) && (
      <Typography 
        variant="caption" 
        onClick={() => { clearNotifications(); setLocalNotifications([]); handleNotificationClose(); }}
        sx={{ color: '#7b1fa2', cursor: 'pointer', fontWeight: 'bold', '&:hover': { textDecoration: 'underline' } }}
      >
        Clear All
      </Typography>
    )}
  </Box>
  
  <Divider />

  <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
    {localNotifications.length === 0 && notifications.length === 0 ? (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Notifications sx={{ fontSize: 40, color: '#e1bee7', mb: 1, opacity: 0.5 }} />
        <Typography variant="body2" color="textSecondary" fontWeight="500">
          All caught up! No new alerts.
        </Typography>
      </Box>
    ) : (
      <>
        {/* SECTION 1: DATABASE REJECTIONS (PRIORITY) */}
        {localNotifications.map((notif) => (
          <MenuItem 
            key={`db-${notif.id}`} 
            onClick={() => {
              markAsRead(notif.id);
              navigate(`/sample-action-screen/${notif.sample_id}`);
              handleNotificationClose();
            }}
            sx={{ py: 1.5, px: 2, borderBottom: '1px solid #f3e5f5', bgcolor: '#fff5f5' }}
          >
            <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', mt: 0.7, flexShrink: 0, bgcolor: '#ef5350' }} />
              <Box>
                <Typography variant="body2" fontWeight="700" color="#333">
                  CRITICAL: {notif.patient_name}
                </Typography>
                <Typography variant="caption" color="error" display="block">
                  Sample ID: {notif.sample_id} • Needs Review
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        ))}

{/* SECTION 2: TOAST HISTORY (NON-CRITICAL) */}
{notifications.map((note) => (
  <MenuItem 
    key={`context-${note.id}`} 
    onClick={(e) => {
      // Prevent any parent event bubbling
      e.stopPropagation(); 

      // 1. DELETE from Section 2
      if (typeof setNotifications === 'function') {
        setNotifications(prev => prev.filter(n => n.id !== note.id));
      } else {
        console.error("setNotifications is not defined in Home.js context destructuring");
      }

      // 2. Navigation
      if (note.target) {
        navigate(note.target);
      }
      
      handleNotificationClose();
    }}
    sx={{ py: 1.5, px: 2, borderBottom: '1px solid #f3e5f5' }}
  >
    <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
      <Box sx={{ 
        width: 10, height: 10, borderRadius: '50%', mt: 0.7, flexShrink: 0,
        bgcolor: note.type === 'critical' ? '#ef5350' : note.type === 'pending' ? '#ffa726' : '#ba68c8' 
      }} />
      <Box>
        <Typography variant="body2" fontWeight="600" color="#333">{note.text}</Typography>
        <Typography variant="caption" color="textSecondary">
          {note.time} • Click to view and clear
        </Typography>
      </Box>
    </Box>
  </MenuItem>
))}
      </>
    )}
  </Box>

  {(localNotifications.length > 0 || notifications.length > 0) && (
    <Box sx={{ p: 1, textAlign: 'center', bgcolor: '#f8f9fa' }}>
      <ListItemButton sx={{ borderRadius: '8px', justifyContent: 'center' }} onClick={handleNotificationClose}>
        <Typography variant="caption" fontWeight="800" color="primary">CLOSE PANEL</Typography>
      </ListItemButton>
    </Box>
  )}
</Menu>
<Box sx={{ 
                             mt: 'auto',p: 1, color: '#4a148c', 
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

export default Home;

