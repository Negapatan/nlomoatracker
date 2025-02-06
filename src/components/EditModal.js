import React, { useState, useEffect } from 'react';
import './EditModal.css';

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
    remarks: ''
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

  // Helper function to handle date-time selection
  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    const timeValue = e.target.getAttribute('data-time');
    
    if (value) {
      const dateTime = timeValue ? 
        new Date(`${value}T${timeValue}`) : 
        new Date(`${value}T${currentTime}`);

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
  };

  // Helper function to format date for input value
  const formatDateForInput = (dateString) => {
    if (!dateString) return { date: '', time: '' };
    const date = new Date(dateString);
    return {
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().split(' ')[0]
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
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
          <h2>Edit Agreement Record</h2>
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
            <h3>Host & NEXUSS Process</h3>
            <div className="form-grid">
              {renderDateTimeInput('dateForwardedHost', 'To Host')}
              {renderDateTimeInput('dateForwardedNEXUSS', 'To NEXUSS')}
              {renderDateTimeInput('dateReceivedNEXUSS', 'From NEXUSS')}
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