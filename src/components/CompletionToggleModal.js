import React, { useState, useEffect } from 'react';
import { updateMOARecord } from '../utils/firestore';
import { toast } from 'react-toastify';
import './CompletionToggleModal.css';

function CompletionToggleModal({ isOpen, onClose, record }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(true);

  // Initialize the completion status based on the record
  useEffect(() => {
    if (record) {
      setIsCompleted(record.status === 'Completed');
    }
  }, [record]);

  // Handle toggling the completion status
  const handleToggleCompletion = async () => {
    if (!record) return;
    
    setIsLoading(true);
    
    try {
      // Toggle the completion status
      const newStatus = !isCompleted ? 'Completed' : 'Pending';
      const completedDate = !isCompleted ? new Date().toISOString() : null;
      
      console.log(`Changing status from ${record.status} to ${newStatus}`);
      
      // Create a minimal update object with just the fields we need to change
      const updateData = {
        id: record.id,
        status: newStatus,
        completedDate: completedDate
      };
      
      console.log("Sending update to Firestore:", updateData);
      
      // Update the record in Firestore
      const result = await updateMOARecord(record.id, updateData);
      console.log("Update result:", result);
      
      if (newStatus === 'Completed') {
        toast.success("Agreement marked as completed");
      } else {
        toast.success("Agreement marked as pending and moved to active agreements");
      }
      
      // Return the updated record to the parent component
      onClose({...record, ...updateData});
    } catch (error) {
      console.error("Error toggling completion status:", error);
      toast.error("Failed to update agreement status. Please try again.");
      onClose(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = () => {
    setIsCompleted(!isCompleted);
  };

  // Handle confirm button click
  const handleConfirmClick = () => {
    handleToggleCompletion();
  };

  // Handle cancel
  const handleCancel = () => {
    onClose(null);
  };

  if (!isOpen || !record) return null;

  return (
    <div className="completion-toggle-overlay">
      <div className="completion-toggle-modal">
        <div className="completion-toggle-header">
          <h2>Change Agreement Status</h2>
          <button 
            className="completion-toggle-close-button" 
            onClick={handleCancel}
            disabled={isLoading}
          >×</button>
        </div>
        
        <div className="completion-toggle-body">
          <p className="completion-toggle-company-name">{record.companyName}</p>
          <p className="completion-toggle-agreement-type">{record.agreementType}</p>
          
          <div className="completion-toggle-status-section">
            <p>Current Status: 
              <span className={isCompleted ? "completion-toggle-status-completed" : "completion-toggle-status-pending"}>
                {isCompleted ? "Completed" : "Pending"}
              </span>
            </p>
            <p className="completion-toggle-confirmation-text">
              {isCompleted 
                ? "Are you sure you want to mark this agreement as pending? This will move it back to the active agreements table."
                : "Are you sure you want to mark this agreement as completed? This will move it to the completed agreements table."}
            </p>
          </div>
          
          <div className="completion-toggle-container">
            <label className="completion-toggle-switch">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={handleCheckboxChange}
                disabled={isLoading}
              />
              <span className="completion-toggle-slider"></span>
            </label>
            <span className="completion-toggle-label">
              {isCompleted ? "Completed" : "Pending"}
            </span>
          </div>
        </div>
        
        <div className="completion-toggle-footer">
          <button 
            className="completion-toggle-cancel-button" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="completion-toggle-confirm-button" 
            onClick={handleConfirmClick}
            disabled={isLoading}
            style={{ backgroundColor: isCompleted ? '#ef4444' : '#059669' }}
          >
            {isLoading ? 'Updating...' : isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompletionToggleModal; 