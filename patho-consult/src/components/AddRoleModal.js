import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid'; 
import { IconButton, Tooltip } from '@mui/material'; 
import { ShieldCheck } from 'lucide-react';
import DeleteIcon from '@mui/icons-material/DeleteForever'; 
import Swal from 'sweetalert2'; // Import SweetAlert2
import "../styles/home.css";
import { FileEdit, Search, Home, Mail, MapPin } from 'lucide-react';

const AddRoleModal = ({ isOpen, onClose }) => {
  const [roleName, setRoleName] = useState("");
  const [roles, setRoles] = useState([]);

  // Helper for consistent SweetAlert Z-Index
  const toast = (options) => {
    return Swal.fire({
      ...options,
      target: document.body,
      customClass: {
        container: 'swal2-higher-z-index' // We will define this in CSS or use inline style
      },
      didOpen: () => {
        // Force SweetAlert above your modal (2000)
        const container = Swal.getContainer();
        if (container) container.style.zIndex = '3000';
      }
    });
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { 
      field: 'role_name', 
      headerName: 'Role Name', 
      flex: 1,
      renderCell: (params) => (
        <span style={{ fontWeight: '500', color: '#4a148c' }}>{params.value}</span>
      )
    },
    {
      field: 'actions',
      headerName: 'Action',
      width: 120,
      sortable: false,
      align: 'center', 
      headerAlign: 'center', 
      renderCell: (params) => (
        <Tooltip title="Delete Role">
          <IconButton 
            onClick={() => handleDelete(params.row.id)} 
            style={{ color: '#d32f2f' }} 
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  useEffect(() => {
    if (isOpen) fetchRoles();
  }, [isOpen]);

  const fetchRoles = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/roles');
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching roles:", err);
      setRoles([]);
    }
  };

  const handleSave = async () => {
    if (!roleName) {
      return toast({
        icon: 'warning',
        title: 'Input Required',
        text: 'Please enter a role name',
        confirmButtonColor: '#4a148c'
      });
    }

    try {
      const res = await fetch('http://localhost:5000/api/add-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleName })
      });
      const result = await res.json();
      if (result.success) {
        toast({
          icon: 'success',
          title: 'Role Added!',
          showConfirmButton: false,
          timer: 1500
        });
        setRoleName("");
        fetchRoles();
      }
    } catch (err) {
      toast({ icon: 'error', title: 'Submission failed' });
    }
  };

  const handleDelete = async (id) => {
    toast({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#4a148c',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`http://localhost:5000/api/roles/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            toast({
              icon: 'success',
              title: 'Deleted!',
              text: 'Role has been removed.',
              showConfirmButton: false,
              timer: 1500
            });
            fetchRoles();
          }
        } catch (err) {
          toast({ icon: 'error', title: 'Error deleting role' });
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
      <div className="admin-panel" style={{ width: '600px', background: '#f3e5f5', borderRadius: '8px', overflow: 'hidden' }}>
        <div className="card-header" style={{ backgroundColor: '#4a148c', color: 'white', padding: '15px', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <ShieldCheck size={20} strokeWidth={2.5} />
          <span>Role Management</span>
        </div>
        
        <div className="modal-body" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
            <label style={{ color: '#4a148c', fontWeight: 'bold' }}>Role Name<span style={{ color: 'red' }}>*</span></label>
            <input 
              type="text" 
              className="purple-select" 
              value={roleName}
              placeholder="Enter New Role"
              onChange={(e) => setRoleName(e.target.value)}
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ce93d8' }}
            />
            <button className="innovative-btn" onClick={handleSave} style={{ margin: 0, padding: '10px 20px' }}>Submit</button>
          </div>

          <div style={{ height: 350, width: '100%', backgroundColor: 'white' }}>
            <DataGrid
              rows={roles}
              columns={columns}
              getRowId={(row) => row.id}
              initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
              pageSizeOptions={[5]}
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5', color: '#4a148c', fontWeight: 'bold' },
                '& .MuiDataGrid-cell:focus': { outline: 'none' }
              }}
            />
          </div>
        </div>
        
        <div style={{ padding: '0 20px 20px', textAlign: 'right' }}>
          <button onClick={onClose} className="view-page-btn" style={{ width: '100px' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default AddRoleModal;