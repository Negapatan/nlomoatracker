import React, { useState, useEffect } from 'react';
import './EditModal.css';
import { toast } from 'react-hot-toast';

function EditModal({ record, onSave, onClose }) {
  const [formData, setFormData] = useState({
    companyName: '',
    agreementType: '',
    dateProcessedNLO: '',
    dateForwardedLCAO: '',
    dateReceivedLCAO: '',
    dateForwardedAttorneys: '',
    dateReceivedLCAOWithCover: '',
    dateForwardedHost: '',
    dateForwardedNEXUSS: '',
    dateReceivedNEXUSS: '',
    dateForwardedEO: '',
    dateReceivedEO: '',
    remarks: '',
    status: 'Pending',
    completedDate: ''
  });
  const [currentTime, setCurrentTime] = useState('');

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setFormData(record);
  }, [record]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Helper function to format date for input value
  const formatDateForInput = (dateString) => {
    if (!dateString) return { date: '', time: '' };
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return { date: '', time: '' };
      
      // Format date as YYYY-MM-DD for the HTML5 date input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      // Format time as HH:mm:ss for the HTML5 time input
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}:${seconds}`
      };
    } catch (error) {
      console.error('Error formatting date:', error);
      return { date: '', time: '' };
    }
  };

  // Helper function to handle date-time selection
  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    const timeValue = e.target.getAttribute('data-time');
    
    try {
      if (value) {
        // Create a new date object with the selected date and time
        const dateTime = timeValue ? 
          new Date(`${value}T${timeValue}`) : 
          new Date(`${value}T${currentTime}`);

        // Validate the date
        if (isNaN(dateTime.getTime())) {
          console.error('Invalid date created:', dateTime);
          return;
        }

        setFormData(prevState => ({
          ...prevState,
          [name]: dateTime.toISOString()
        }));
      } else {
        setFormData(prevState => ({
          ...prevState,
          [name]: ''
        }));
      }
    } catch (error) {
      console.error('Error handling date/time change:', error);
      toast.error('Error updating date/time');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      // Make sure we're sending the status field to the server
      const finalData = {
        ...formData,
        // Ensure status is set (default to 'Pending' if missing)
        status: formData.status || 'Pending'
      };
      console.log("Saving record with status:", finalData.status);
      onSave(finalData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Error saving changes');
    }
  };

  // Update the date input fields in the form
  const renderDateTimeInput = (fieldName, label) => (
    <div className="form-group">
      <label>{label}</label>
      <div className="datetime-input">
        <input
          type="date"
          name={fieldName}
          value={formatDateForInput(formData[fieldName]).date}
          onChange={handleDateTimeChange}
        />
        <input
          type="time"
          data-time
          value={formatDateForInput(formData[fieldName]).time || currentTime}
          onChange={(e) => handleDateTimeChange({
            target: {
              name: fieldName,
              value: formatDateForInput(formData[fieldName]).date,
              getAttribute: () => e.target.value
            }
          })}
        />
      </div>
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            Edit Agreement Record
            {formData.status === 'Completed' && (
              <span className="completed-badge">
                <i className="fas fa-check-circle"></i> Completed
              </span>
            )}
          </h2>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Agreement Type</label>
                <select
                  name="agreementType"
                  value={formData.agreementType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="OJT MOA">OJT MOA</option>
                  <option value="MOU/MOA">MOU/MOA</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>NLO & LCAO Process</h3>
            <div className="form-grid">
              {renderDateTimeInput('dateProcessedNLO', 'NLO Process Date')}
              {renderDateTimeInput('dateForwardedLCAO', 'To LCAO')}
              {renderDateTimeInput('dateReceivedLCAO', 'From LCAO')}
            </div>
          </div>

          <div className="form-section">
            <h3>Attorney Process</h3>
            <div className="form-grid">
              {renderDateTimeInput('dateForwardedAttorneys', 'To Attorneys')}
              {renderDateTimeInput('dateReceivedLCAOWithCover', 'From LCAO w/ Cover')}
            </div>
          </div>

          <div className="form-section">
            <h3>Host & NEXUSS_NLO Process</h3>
            <div className="form-grid">
              {renderDateTimeInput('dateForwardedHost', 'To Host')}
              {renderDateTimeInput('dateForwardedNEXUSS', 'To Director External Affairs & MIS')}
              {renderDateTimeInput('dateReceivedNEXUSS', 'From Director External Affairs & MIS')}
            </div>
          </div>

          <div className="form-section">
            <h3>Executive Office Process</h3>
            <div className="form-grid">
              {renderDateTimeInput('dateForwardedEO', 'To EO')}
              {renderDateTimeInput('dateReceivedEO', 'From EO')}
            </div>
          </div>

          <div className="form-section">
            <h3>Additional Information</h3>
            <div className="form-group">
              <label>Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Add any additional notes or remarks here..."
              />
            </div>
          </div>
          
          {/* Simplified Completion Toggle Section */}
          <div className="form-section finish-section">
            <h3>Process Completion</h3>
            <div className="finish-moa-container">
              <div className="completion-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={formData.status === 'Completed'}
                    onChange={(e) => {
                      const isCompleted = e.target.checked;
                      console.log("Setting status to:", isCompleted ? 'Completed' : 'Pending');
                      setFormData({
                        ...formData,
                        status: isCompleted ? 'Completed' : 'Pending',
                        completedDate: isCompleted ? new Date().toISOString() : ''
                      });
                    }}
                  />
                  <span className="toggle-switch"></span>
                  <span className="toggle-text">
                    {formData.status === 'Completed' ? 'Completed' : 'Mark as Completed'}
                  </span>
                </label>
              </div>
              
              <p className="completion-description">
                Current status: <strong>{formData.status || 'Pending'}</strong>
                <br />
                {formData.status === 'Completed' 
                  ? 'This MOA has been marked as completed and will appear in the Completed Agreements section.'
                  : 'Toggle this switch when all steps of the MOA process are finished.'}
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-button">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditModal; 