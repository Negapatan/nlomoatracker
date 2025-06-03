import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { deleteMOARecord } from '../utils/firestore';

function DuplicateEntries({ records }) {
  const duplicateEntries = useMemo(() => {
    const duplicates = [];
    const seen = new Map();

    records.forEach(record => {
      // Create a key based only on company name
      const key = record.companyName?.toLowerCase().trim();
      
      if (!key) return; // Skip records without company name
      
      if (seen.has(key)) {
        // If we've seen this company name before, add both records to duplicates
        const existingRecord = seen.get(key);
        if (!duplicates.some(d => d.id === existingRecord.id)) {
          duplicates.push(existingRecord);
        }
        duplicates.push(record);
      } else {
        seen.set(key, record);
      }
    });

    return duplicates;
  }, [records]);

  const handleDelete = async (record) => {
    // Show confirmation dialog using toast
    toast((t) => (
      <div className="delete-confirmation-toast">
        <p>Are you sure you want to delete this duplicate entry?</p>
        <div className="toast-actions">
          <button
            onClick={() => handleConfirmDelete(record, t.id)}
            className="confirm-delete"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="cancel-delete"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      position: "bottom-right",
      autoClose: false,
      closeButton: false,
      className: 'delete-toast',
      draggable: false
    });
  };

  const handleConfirmDelete = async (record, toastId) => {
    try {
      await deleteMOARecord(record.id);
      toast.dismiss(toastId);
      toast.success('Duplicate entry deleted successfully', {
        position: "bottom-right",
        autoClose: 2000
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete duplicate entry', {
        position: "bottom-right",
        autoClose: 2000
      });
    }
  };

  if (duplicateEntries.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No duplicate company names found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Duplicate Company Names
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Company Name</TableCell>
              <TableCell>Agreement Type</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {duplicateEntries.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.companyName}</TableCell>
                <TableCell>{record.agreementType}</TableCell>
                <TableCell>
                  {record.createdAt ? format(record.createdAt, 'MM/dd/yyyy') : 'N/A'}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={record.status || 'Pending'} 
                    color={record.status === 'Completed' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{record.remarks || '-'}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Delete duplicate entry">
                    <IconButton
                      onClick={() => handleDelete(record)}
                      color="error"
                      size="small"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default DuplicateEntries; 