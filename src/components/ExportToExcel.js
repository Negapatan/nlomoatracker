import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button, CircularProgress } from '@mui/material';
import { Download } from '@mui/icons-material';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

function ExportToExcel({ status = 'Pending' }) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportType, setExportType] = useState('normal'); // 'normal' or 'student'
  const [filterStatus, setFilterStatus] = useState(status);
  const [companyFilter, setCompanyFilter] = useState('');
  const [companyList, setCompanyList] = useState([]);

  // Fetch unique company names for filter dropdown
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const q = collection(db, 'moa_records');
        const querySnapshot = await getDocs(q);
        const companies = Array.from(new Set(querySnapshot.docs.map(doc => (doc.data().companyName || '').trim()).filter(Boolean)));
        companies.sort((a, b) => a.localeCompare(b));
        setCompanyList(companies);
      } catch (e) {
        setCompanyList([]);
      }
    }
    if (dialogOpen) fetchCompanies();
  }, [dialogOpen]);

  const exportToExcel = async (customType, customStatus) => {
    setLoading(true);
    try {
      const exportMode = customType || exportType;
      const exportStatus = customStatus || filterStatus;
      // Fetch all records with the given status from Firestore
      const q = query(collection(db, 'moa_records'), where('status', '==', exportStatus));
      const querySnapshot = await getDocs(q);
      let records = querySnapshot.docs.map(doc => doc.data());

      // Company filter (exact match from dropdown)
      if (companyFilter.trim()) {
        records = records.filter(r => (r.companyName || '').trim() === companyFilter.trim());
      }

      let formattedData;
      let filename;
      if (exportMode === 'student') {
        // Student view: flatten student names, course, and company
        formattedData = [];
        records.forEach(record => {
          let namesArr = [];
          if (Array.isArray(record.studentNames)) {
            namesArr = record.studentNames;
          } else if (typeof record.studentNames === 'string') {
            namesArr = record.studentNames.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
          }
          if (namesArr.length === 0) namesArr = [''];
          namesArr.forEach(name => {
            formattedData.push({
              'Student Name': name,
              'Student Course': record.studentCourse || '',
              'Company Name': record.companyName || '',
              'Agreement Type': record.agreementType || '',
              'Status': record.status || '',
            });
          });
        });
        filename = `students_${exportStatus.toLowerCase()}_records.xlsx`;
      } else {
        // Normal export
        formattedData = records.map(record => ({
          'Company Name': record.companyName,
          'Agreement Type': record.agreementType,
          'Student Name(s)': Array.isArray(record.studentNames)
            ? record.studentNames.join(', ')
            : (record.studentNames || ''),
          'Student Course': record.studentCourse || '',
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
        filename = `moa_${exportStatus.toLowerCase()}_records.xlsx`;
      }

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
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('Failed to export data: ' + error.message);
    } finally {
      setLoading(false);
      setDialogOpen(false);
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
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Download />}
        onClick={() => exportToExcel('normal', status)}
        style={{ marginLeft: 'auto', marginRight: 8 }}
        disabled={loading}
      >
        {loading ? 'Exporting...' : `Export ${status} to Excel`}
      </Button>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<Download />}
        onClick={() => setDialogOpen(true)}
        style={{ marginLeft: 0 }}
        disabled={loading}
      >
        Student Export
      </Button>
      {dialogOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.2)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <h3>Export Student Names</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>Status:&nbsp;</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: 4, fontSize: 16 }}>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>Company Filter:&nbsp;</label>
              <select
                value={companyFilter}
                onChange={e => setCompanyFilter(e.target.value)}
                style={{ padding: 4, fontSize: 16, width: '80%' }}
              >
                <option value="">All Companies</option>
                {companyList.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>Export Type:&nbsp;</label>
              <select value={exportType} onChange={e => setExportType(e.target.value)} style={{ padding: 4, fontSize: 16 }}>
                <option value="student">Student View (Name, Course, Company)</option>
                <option value="normal">Full Record View</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setDialogOpen(false)} color="secondary" variant="outlined">Cancel</Button>
              <Button
                onClick={() => exportToExcel(exportType, filterStatus)}
                color="primary"
                variant="contained"
                startIcon={<Download />}
                disabled={loading}
              >
                Export
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ExportToExcel; 