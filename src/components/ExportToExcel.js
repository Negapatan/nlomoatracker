import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@mui/material';
import { Download } from '@mui/icons-material';

function ExportToExcel({ records }) {
  const exportToExcel = () => {
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
    link.setAttribute('download', 'moa_records.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<Download />}
      onClick={exportToExcel}
      style={{ marginLeft: 'auto' }}
    >
      Export to Excel
    </Button>
  );
}

export default ExportToExcel; 