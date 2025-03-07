import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import CompletionToggleModal from './CompletionToggleModal';
import './FinishedAgreement.css';

function FinishedAgreement() {
  const [completedAgreements, setCompletedAgreements] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'completedDate', direction: 'desc' });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch completed agreements from Firestore
  const fetchCompletedAgreements = async () => {
    try {
      setIsRefreshing(true);
      const moaCollectionRef = collection(db, 'moa_records');
      
      // Create a query to get only records with status 'Completed'
      const q = query(
        moaCollectionRef, 
        where('status', '==', 'Completed')
      );
      
      console.log("Fetching completed agreements with query:", q);
      
      const querySnapshot = await getDocs(q);
      const agreements = [];
      
      console.log("Query returned", querySnapshot.size, "documents");
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Document data:", data);
        agreements.push({
          id: doc.id,
          ...data
        });
      });
      
      console.log("Fetched completed agreements:", agreements);
      setCompletedAgreements(agreements);
    } catch (error) {
      console.error("Error fetching completed agreements:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCompletedAgreements();
  }, []);

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
  const sortedAgreements = React.useMemo(() => {
    let sortableItems = [...completedAgreements];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (!a[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (!b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [completedAgreements, sortConfig]);

  // Filter agreements based on search term
  const filteredAgreements = sortedAgreements.filter(agreement => {
    return (
      agreement.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.agreementType?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Get sort direction indicator
  const getSortDirectionIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  // Handle status button click
  const handleStatusClick = (e, record) => {
    e.stopPropagation(); // Prevent row click from triggering
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  // Handle modal close and status update
  const handleStatusUpdate = (updatedRecord) => {
    // If the record was updated to Pending, remove it from the list
    if (updatedRecord && updatedRecord.status === 'Pending') {
      setCompletedAgreements(prev => 
        prev.filter(agreement => agreement.id !== updatedRecord.id)
      );
    }
    
    // Close the modal
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  return (
    <div className="finished-agreement-container">
      <div className="finished-header">
        <h2>Completed Agreements</h2>
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
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by company name or agreement type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAgreements.length > 0 ? (
              filteredAgreements.map((agreement) => {
                return (
                  <tr 
                    key={agreement.id} 
                    className="clickable-row"
                  >
                    <td>{agreement.companyName}</td>
                    <td>{agreement.agreementType}</td>
                    <td>{formatDate(agreement.completedDate)}</td>
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
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="no-data">
                  {searchTerm ? "No matching completed agreements found." : "No completed agreements yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="summary-section">
        <div className="summary-card">
          <h3>Total Completed</h3>
          <p className="summary-value">{completedAgreements.length}</p>
        </div>
      </div>

      {/* Completion Toggle Modal */}
      <CompletionToggleModal 
        isOpen={isModalOpen}
        onClose={handleStatusUpdate}
        record={selectedRecord}
      />
    </div>
  );
}

export default FinishedAgreement; 