import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button, CircularProgress } from '@mui/material';
import { Download } from '@mui/icons-material';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

function ExportToExcel({ status = 'Pending' }) {
  const [loading, setLoading] = useState(false);

  const exportToExcel = async () => {
    setLoading(true);
    try {
      // Fetch all records with the given status from Firestore
      const q = query(collection(db, 'moa_records'), where('status', '==', status));
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => doc.data());

      // Format the data for Excel
      const formattedData = records.map(record => ({
        'Company Name': record.companyName,
        'Agreement Type': record.agreementType,
        'Date Processed by NLO': formatDate(record.dateProcessedNLO),
        'Date Forwarded to LCAO': formatDate(record.dateForwardedLCAO),
        'Date Received from LCAO': formatDate(record.dateReceivedLCAO),
        'Date Forwarded to Attorneys': formatDate(record.dateForwardedAttorneys),
        'Date Received from LCAO with Cover': formatDate(record.dateReceivedLCAOWithCover),
        'Date Forwarded to Host': formatDate(record.dateForwardedHost),
        'Date Forwarded to NEXUSS': formatDate(record.dateForwardedNEXUSS),
        'Date Received from NEXUSS': formatDate(record.dateReceivedNEXUSS),
        'Date Forwarded to EO': formatDate(record.dateForwardedEO),
        'Date Received from EO': formatDate(record.dateReceivedEO),
        'Remarks': record.remarks
      }));

      // Create worksheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'MOA Records');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
      
      // Create a link and trigger download
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `moa_${status.toLowerCase()}_records.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('Failed to export data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '';
    // Handle Firestore Timestamp, Date, or string
    let date;
    if (typeof dateValue === 'object' && dateValue.seconds) {
      date = new Date(dateValue.seconds * 1000);
    } else {
      date = new Date(dateValue);
    }
    return isNaN(date.getTime()) ? '' : date.toLocaleString();
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Download />}
      onClick={exportToExcel}
      style={{ marginLeft: 'auto' }}
      disabled={loading}
    >
      {loading ? 'Exporting...' : `Export ${status} to Excel`}
    </Button>
  );
}

export default ExportToExcel; 