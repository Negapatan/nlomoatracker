import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import CompletionToggleModal from './CompletionToggleModal';
import './FinishedAgreement.css';

function FinishedAgreement() {
  const [completedAgreements, setCompletedAgreements] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'completedDate', direction: 'desc' });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterYear, setFilterYear] = useState('all');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch completed agreements from Firestore
  const fetchCompletedAgreements = async () => {
    try {
      setIsRefreshing(true);
      const moaCollectionRef = collection(db, 'moa_records');
      const q = query(
        moaCollectionRef, 
        where('status', '==', 'Completed')
      );
      
      const querySnapshot = await getDocs(q);
      const agreements = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        agreements.push({
          id: doc.id,
          ...data
        });
      });
      
      setCompletedAgreements(agreements);
    } catch (error) {
      console.error("Error fetching completed agreements:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompletedAgreements();
  }, []);

  // Get unique years from records
  const years = useMemo(() => {
    return [...new Set(completedAgreements
      .filter(agreement => agreement.completedDate)
      .map(agreement => new Date(agreement.completedDate).getFullYear())
    )].sort((a, b) => b - a);
  }, [completedAgreements]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting to the data
  const sortedAgreements = useMemo(() => {
    let sortableItems = [...completedAgreements];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (!aValue && !bValue) return 0;
        if (!aValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (!bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [completedAgreements, sortConfig]);

  // Optimize search and filter logic
  const filteredAgreements = useMemo(() => {
    if (!sortedAgreements) return [];
    
    const searchTermLower = debouncedSearchTerm.toLowerCase();
    const searchFields = ['companyName', 'agreementType', 'remarks'];
    
    return sortedAgreements.filter(agreement => {
      const matchesSearch = searchFields.some(field => 
        agreement[field]?.toLowerCase().includes(searchTermLower)
      );

      const matchesYear = filterYear === 'all' || 
        (agreement.completedDate && 
         new Date(agreement.completedDate).getFullYear().toString() === filterYear);

      const matchesType = filterType === 'all' || agreement.agreementType === filterType;

      return matchesSearch && matchesYear && matchesType;
    });
  }, [sortedAgreements, debouncedSearchTerm, filterType, filterYear]);

  // Get sort direction indicator
  const getSortDirectionIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  // Handle status button click
  const handleStatusClick = (e, record) => {
    e.stopPropagation();
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  // Handle modal close and status update
  const handleStatusUpdate = (updatedRecord) => {
    if (updatedRecord && updatedRecord.status === 'Pending') {
      setCompletedAgreements(prev => 
        prev.filter(agreement => agreement.id !== updatedRecord.id)
      );
    }
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = filteredAgreements.length;
    const moaMouCount = filteredAgreements.filter(a => a.agreementType === 'MOU/MOA').length;
    const ojtMoaCount = filteredAgreements.filter(a => a.agreementType === 'OJT MOA').length;
    
    return { total, moaMouCount, ojtMoaCount };
  }, [filteredAgreements]);

  return (
    <div className="finished-agreement-container">
      <div className="finished-header">
        <div className="header-left">
          <h2>Completed Agreements</h2>
          <div className="header-stats">
            <span className="stat-item">
              <i className="fas fa-check-circle"></i>
              {statistics.total} Total
            </span>
            <span className="stat-item">
              <i className="fas fa-handshake"></i>
              {statistics.moaMouCount} MOU/MOA
            </span>
            <span className="stat-item">
              <i className="fas fa-user-graduate"></i>
              {statistics.ojtMoaCount} OJT MOA
            </span>
          </div>
        </div>
        <button 
          className="refresh-button" 
          onClick={fetchCompletedAgreements}
          disabled={isRefreshing}
          title="Refresh completed agreements"
        >
          <i className={`fas fa-sync-alt ${isRefreshing ? 'fa-spin' : ''}`}></i>
          <span>Refresh</span>
        </button>
      </div>
      
      <div className="filters-container">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by company name, type, or remarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            className="filter-select"
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
          
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="MOU/MOA">MOU/MOA</option>
            <option value="OJT MOA">OJT MOA</option>
          </select>
        </div>
      </div>
      
      <div className="table-container">
        <table className="agreement-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('companyName')}>
                Company Name {getSortDirectionIndicator('companyName')}
              </th>
              <th onClick={() => requestSort('agreementType')}>
                Agreement Type {getSortDirectionIndicator('agreementType')}
              </th>
              <th onClick={() => requestSort('completedDate')}>
                Completion Date {getSortDirectionIndicator('completedDate')}
              </th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAgreements.length > 0 ? (
              filteredAgreements.map((agreement) => (
                <tr key={agreement.id} className="clickable-row">
                  <td>
                    <div className="company-cell">
                      <span className="company-name">{agreement.companyName}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`agreement-type ${agreement.agreementType === 'MOU/MOA' ? 'mou' : 'ojt'}`}>
                      {agreement.agreementType}
                    </span>
                  </td>
                  <td>{formatDate(agreement.completedDate)}</td>
                  <td className="remarks-cell" title={agreement.remarks || '-'}>
                    {agreement.remarks || '-'}
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="status-button"
                      onClick={(e) => handleStatusClick(e, agreement)}
                      title="Change status to Pending"
                    >
                      <i className="fas fa-toggle-on"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  {searchTerm || filterType !== 'all' || filterYear !== 'all' 
                    ? "No matching completed agreements found." 
                    : "No completed agreements yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CompletionToggleModal 
        isOpen={isModalOpen}
        onClose={handleStatusUpdate}
        record={selectedRecord}
      />
    </div>
  );
}

export default FinishedAgreement; 