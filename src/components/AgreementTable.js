import React, { useState } from 'react';
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
  const [filterType, setFilterType] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [editingRecord, setEditingRecord] = useState(null);

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

  if (!records || records.length === 0) {
    return (
      <div className="no-records-container">
        <p>No records found. Add a new record using the Agreement Form.</p>
      </div>
    );
  }

  // Get unique years from records based on dateProcessedNLO and ensure chronological order
  const years = [...new Set(records?.filter(record => record.dateProcessedNLO)
    .map(record => new Date(record.dateProcessedNLO).getFullYear())
  )].sort((a, b) => b - a);  // Sort years in descending order (newest first)

  // Filter options
  const filterOptions = {
    all: 'All Types',
    'OJT MOA': 'OJT MOA',
    'MOU/MOA': 'MOU/MOA'
  };

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

  // Filter records based on search, type, and year
  const filteredRecords = records?.filter(record => {
    const matchesSearch = record.companyName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesYear = filterYear === 'all' || 
      (record.dateProcessedNLO && 
       new Date(record.dateProcessedNLO).getFullYear().toString() === filterYear);

    if (filterType === 'all') return matchesSearch && matchesYear;
    return matchesSearch && record.agreementType === filterType && matchesYear;
  }) || [];

  // Pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  // Calculate statistics
  const totalRecords = records?.length || 0;
  const moaMouCount = records?.filter(record => record.agreementType === 'MOU/MOA').length || 0;
  const ojtMoaCount = records?.filter(record => record.agreementType === 'OJT MOA').length || 0;

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
      await updateMOARecord(updatedRecord.id, updatedRecord);
      setEditingRecord(null);
      toast.success('Record updated successfully!');
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
          <span className="statistic-label">Total Records</span>
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

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Agreement Records</h2>
        <div className="table-actions">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search by company name..." 
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
              <th className="column-company">Company Name</th>
              <th className="column-type">Type</th>
              <th className="column-date">NLO Process</th>
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
                <tr key={index} className={isCompleted(record) ? 'completed' : ''}>
                  <td className="column-number">{index + 1}</td>
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