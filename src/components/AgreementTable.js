import React, { useState, useMemo, useEffect } from 'react';
import './AgreementTable.css';
import EditModal from './EditModal';
import { toast } from 'react-toastify';
import { updateMOARecord } from '../utils/firestore';
import ExportToExcel from './ExportToExcel';

const LoadingState = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading records...</p>
  </div>
);

function AgreementTable({ records, onEdit, onDelete, isLoading, hasError }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [editingRecord, setEditingRecord] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Wrap pendingRecords in its own useMemo
  const pendingRecords = useMemo(() => {
    return records ? records.filter(record => record.status !== 'Completed') : [];
  }, [records]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Check if a record is completed
  const isCompleted = (record) => {
    return record.dateReceivedEO !== '';
  };

  // Optimize search, filter, and sort logic
  const filteredRecords = useMemo(() => {
    if (!pendingRecords) return [];
    
    const searchTermLower = debouncedSearchTerm.toLowerCase().trim();
    if (!searchTermLower) {
      // If no search term, only apply filters and sorting
      let filtered = pendingRecords;
      
      // Apply year filter
      if (filterYear !== 'all') {
        filtered = filtered.filter(record => 
          record.dateProcessedNLO && 
          new Date(record.dateProcessedNLO).getFullYear().toString() === filterYear
        );
      }
      
      // Apply type filter
      if (filterType !== 'all') {
        filtered = filtered.filter(record => record.agreementType === filterType);
      }
      
      // Apply sorting
      if (sortConfig.key) {
        filtered.sort((a, b) => {
          const aValue = a[sortConfig.key];
          const bValue = b[sortConfig.key];
          
          if (!aValue && !bValue) return 0;
          if (!aValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (!bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          
          const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
      }
      
      return filtered;
    }
    
    // Search fields with their weights (higher weight = more important)
    const searchFields = [
      { field: 'companyName', weight: 3 },
      { field: 'agreementType', weight: 2 },
      { field: 'remarks', weight: 1 },
      { field: 'hostName', weight: 1 },
      { field: 'hostEmail', weight: 1 },
      { field: 'hostContact', weight: 1 }
    ];
    
    // Score each record based on search term matches
    const scoredRecords = pendingRecords.map(record => {
      let score = 0;
      let hasMatch = false;
      
      searchFields.forEach(({ field, weight }) => {
        const value = record[field]?.toLowerCase() || '';
        if (value.includes(searchTermLower)) {
          score += weight;
          hasMatch = true;
        }
      });
      
      return { record, score, hasMatch };
    });
    
    // Filter and sort by score
    let filtered = scoredRecords
      .filter(({ hasMatch }) => hasMatch)
      .sort((a, b) => b.score - a.score)
      .map(({ record }) => record);
    
    // Apply year filter
    if (filterYear !== 'all') {
      filtered = filtered.filter(record => 
        record.dateProcessedNLO && 
        new Date(record.dateProcessedNLO).getFullYear().toString() === filterYear
      );
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(record => record.agreementType === filterType);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (!aValue && !bValue) return 0;
        if (!aValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (!bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [pendingRecords, debouncedSearchTerm, filterType, filterYear, sortConfig]);

  // Pagination calculations
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  // Get unique years from records based on dateProcessedNLO and ensure chronological order
  const years = useMemo(() => {
    return [...new Set(records?.filter(record => record.dateProcessedNLO)
      .map(record => new Date(record.dateProcessedNLO).getFullYear())
    )].sort((a, b) => b - a);  // Sort years in descending order (newest first)
  }, [records]);

  // Calculate statistics
  const totalRecords = pendingRecords?.length || 0;
  const moaMouCount = pendingRecords?.filter(record => record.agreementType === 'MOU/MOA').length || 0;
  const ojtMoaCount = pendingRecords?.filter(record => record.agreementType === 'OJT MOA').length || 0;

  if (isLoading) {
    return <LoadingState />;
  }

  if (hasError) {
    return (
      <div className="error-container">
        <p>Error loading records. Please try refreshing the page.</p>
        <button 
          className="refresh-button"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
    );
  }

  if (!pendingRecords || pendingRecords.length === 0) {
    return (
      <div className="no-records-container">
        <p>No pending records found. Add a new record using the Agreement Form or check the Completed tab.</p>
      </div>
    );
  }

  // Filter options
  const filterOptions = {
    all: 'All Types',
    'OJT MOA': 'OJT MOA',
    'MOU/MOA': 'MOU/MOA'
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    toast.info('Editing record...', {
      position: "bottom-right",
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      className: 'edit-toast'
    });
  };

  const handleDelete = (record) => {
    // Show confirmation dialog using toast
    toast((t) => (
      <div className="delete-confirmation-toast">
        <p>Are you sure you want to delete this record?</p>
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
      await onDelete(record); // Call the parent's onDelete function
      toast.dismiss(toastId);
      toast.success('Record deleted successfully', {
        position: "bottom-right",
        autoClose: 2000
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record', {
        position: "bottom-right",
        autoClose: 2000
      });
    }
  };

  const handleSaveEdit = async (updatedRecord) => {
    try {
      console.log("Saving updated record:", updatedRecord);
      console.log("Status:", updatedRecord.status);
      
      await updateMOARecord(updatedRecord.id, updatedRecord);
      setEditingRecord(null);
      
      if (updatedRecord.status === 'Completed') {
        toast.success('Record marked as completed and moved to Completed tab!');
      } else {
        toast.success('Record updated successfully!');
      }
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error('Failed to update record');
    }
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderStatistics = () => (
    <div className="statistics-container">
      <div className="statistic-card">
        <i className="fas fa-file-alt"></i>
        <div className="statistic-info">
          <span className="statistic-value">{totalRecords}</span>
          <span className="statistic-label">Pending Records</span>
        </div>
      </div>
      <div className="statistic-card">
        <i className="fas fa-handshake"></i>
        <div className="statistic-info">
          <span className="statistic-value">{moaMouCount}</span>
          <span className="statistic-label">MOU/MOA</span>
        </div>
      </div>
      <div className="statistic-card">
        <i className="fas fa-user-graduate"></i>
        <div className="statistic-info">
          <span className="statistic-value">{ojtMoaCount}</span>
          <span className="statistic-label">OJT MOA</span>
        </div>
      </div>
    </div>
  );

  // Get sort direction indicator
  const getSortDirectionIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Pending Agreements</h2>
        <div className="table-actions">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search by company name, type, or remarks..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-container">
            <select
              className="year-filter"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year.toString()}>
                  Year {year}
                </option>
              ))}
            </select>
            <button 
              className="filter-button"
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className="fas fa-filter"></i>
              Filter
            </button>
            {showFilters && (
              <div className="filter-dropdown">
                {Object.entries(filterOptions).map(([key, label]) => (
                  <button
                    key={key}
                    className={`filter-option ${filterType === key ? 'active' : ''}`}
                    onClick={() => {
                      setFilterType(key);
                      setShowFilters(false);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <ExportToExcel records={filteredRecords} />
        </div>
      </div>

      {renderStatistics()}

      <div className="records-info">
        Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredRecords.length)} of {filteredRecords.length} records
      </div>

      <div className="table-wrapper">
        <table className="agreement-table">
          <thead>
            <tr>
              <th className="column-number">#</th>
              <th className="column-company" onClick={() => requestSort('companyName')}>
                Company Name {getSortDirectionIndicator('companyName')}
              </th>
              <th className="column-type" onClick={() => requestSort('agreementType')}>
                Type {getSortDirectionIndicator('agreementType')}
              </th>
              <th className="column-date" onClick={() => requestSort('dateProcessedNLO')}>
                NLO Process {getSortDirectionIndicator('dateProcessedNLO')}
              </th>
              <th className="column-date">LCAO Process</th>
              <th className="column-date">Attorney Process</th>
              <th className="column-date">Host/NEXUSS</th>
              <th className="column-date">EO Process</th>
              <th className="column-remarks">Remarks</th>
              <th className="column-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.length > 0 ? (
              currentRecords.map((record, index) => (
                <tr key={record.id || index} className={isCompleted(record) ? 'completed' : ''}>
                  <td className="column-number">{indexOfFirstRecord + index + 1}</td>
                  <td className="column-company">
                    <div className="company-info">
                      <span className="company-name">{record.companyName}</span>
                    </div>
                  </td>
                  <td className="column-type">
                    <span className="agreement-type">{record.agreementType}</span>
                  </td>
                  <td className="column-date">
                    <div className="date-info">
                      <div>
                        <span className="date-label">Processed:</span>
                        <span className="date-value">{formatDate(record.dateProcessedNLO)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="column-date">
                    <div className="date-info">
                      <div>
                        <span className="date-label">Forwarded:</span>
                        <span className="date-value">{formatDate(record.dateForwardedLCAO)}</span>
                      </div>
                      <div>
                        <span className="date-label">Received:</span>
                        <span className="date-value">{formatDate(record.dateReceivedLCAO)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="column-date">
                    <div className="date-info">
                      <div>
                        <span className="date-label">Forwarded:</span>
                        <span className="date-value">{formatDate(record.dateForwardedAttorneys)}</span>
                      </div>
                      <div>
                        <span className="date-label">Received:</span>
                        <span className="date-value">{formatDate(record.dateReceivedLCAOWithCover)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="column-date">
                    <div className="date-info">
                      <div>
                        <span className="date-label">To Host:</span>
                        <span className="date-value">{formatDate(record.dateForwardedHost)}</span>
                      </div>
                      <div>
                        <span className="date-label">To NEXUSS:</span>
                        <span className="date-value">{formatDate(record.dateForwardedNEXUSS)}</span>
                      </div>
                      <div>
                        <span className="date-label">From NEXUSS:</span>
                        <span className="date-value">{formatDate(record.dateReceivedNEXUSS)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="column-date">
                    <div className="date-info">
                      <div>
                        <span className="date-label">Forwarded:</span>
                        <span className="date-value">{formatDate(record.dateForwardedEO)}</span>
                      </div>
                      <div>
                        <span className="date-label">Received:</span>
                        <span className="date-value">{formatDate(record.dateReceivedEO)}</span>
                      </div>
                    </div>
                  </td>
                  <td 
                    className="column-remarks remarks-cell" 
                    data-full-text={record.remarks || '-'}
                  >
                    {record.remarks || '-'}
                  </td>
                  <td className="column-actions">
                    <button 
                      className="action-button" 
                      title="Edit"
                      onClick={() => handleEdit(record)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="action-button" 
                      title="Delete"
                      onClick={() => handleDelete(record)}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="no-records">
                  {searchTerm || filterType !== 'all' ? 
                    'No matching records found' : 
                    'No records to display'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-button"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <i className="fas fa-chevron-left"></i>
            Previous
          </button>
          
          <div className="pagination-numbers">
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                className={`page-number ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => paginate(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button 
            className="pagination-button"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {editingRecord && (
        <EditModal
          record={editingRecord}
          onSave={handleSaveEdit}
          onClose={() => setEditingRecord(null)}
        />
      )}
    </div>
  );
}

export default AgreementTable; 