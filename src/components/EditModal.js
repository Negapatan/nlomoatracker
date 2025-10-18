import React, { useState, useEffect } from 'react';
import './EditModal.css';
import { toast } from 'react-hot-toast';

function EditModal({ record, onSave, onClose }) {
  const [formData, setFormData] = useState({
    companyName: '',
    agreementType: '',
    studentNames: [''],
    studentCourse: '',
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
    if (record) {
      // Ensure all date fields are properly formatted
      const formattedRecord = {
        ...record,
        // Convert any existing date strings to ISO format
        dateProcessedNLO: record.dateProcessedNLO ? new Date(record.dateProcessedNLO).toISOString() : '',
        dateForwardedLCAO: record.dateForwardedLCAO ? new Date(record.dateForwardedLCAO).toISOString() : '',
        dateReceivedLCAO: record.dateReceivedLCAO ? new Date(record.dateReceivedLCAO).toISOString() : '',
        dateForwardedAttorneys: record.dateForwardedAttorneys ? new Date(record.dateForwardedAttorneys).toISOString() : '',
        dateReceivedLCAOWithCover: record.dateReceivedLCAOWithCover ? new Date(record.dateReceivedLCAOWithCover).toISOString() : '',
        dateForwardedHost: record.dateForwardedHost ? new Date(record.dateForwardedHost).toISOString() : '',
        dateForwardedNEXUSS: record.dateForwardedNEXUSS ? new Date(record.dateForwardedNEXUSS).toISOString() : '',
        dateReceivedNEXUSS: record.dateReceivedNEXUSS ? new Date(record.dateReceivedNEXUSS).toISOString() : '',
        dateForwardedEO: record.dateForwardedEO ? new Date(record.dateForwardedEO).toISOString() : '',
        dateReceivedEO: record.dateReceivedEO ? new Date(record.dateReceivedEO).toISOString() : '',
        completedDate: record.completedDate ? new Date(record.completedDate).toISOString() : null,
        studentNames: Array.isArray(record.studentNames)
          ? record.studentNames
          : (typeof record.studentNames === 'string' ? record.studentNames.split(/[,\n]/).map(s => s.trim()).filter(Boolean) : [''])
      };
      setFormData(formattedRecord);
    }
  }, [record]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Student names handlers
  const handleStudentNameChange = (idx, value) => {
    setFormData(prev => {
      const arr = Array.isArray(prev.studentNames) ? [...prev.studentNames] : [''];
      arr[idx] = value;
      return { ...prev, studentNames: arr };
    });
  };
  const handleAddStudent = () => {
    setFormData(prev => ({
      ...prev,
      studentNames: [...(Array.isArray(prev.studentNames) ? prev.studentNames : ['']), '']
    }));
  };
  const handleRemoveStudent = (idx) => {
    setFormData(prev => {
      const arr = Array.isArray(prev.studentNames) ? [...prev.studentNames] : [];
      arr.splice(idx, 1);
      return { ...prev, studentNames: arr.length ? arr : [''] };
    });
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
        let dateTime;
        if (timeValue) {
          dateTime = new Date(`${value}T${timeValue}`);
        } else {
          // If no time is provided, use the existing time or default to current time
          const existingDate = formData[name] ? new Date(formData[name]) : new Date();
          const hours = existingDate.getHours().toString().padStart(2, '0');
          const minutes = existingDate.getMinutes().toString().padStart(2, '0');
          const seconds = existingDate.getSeconds().toString().padStart(2, '0');
          dateTime = new Date(`${value}T${hours}:${minutes}:${seconds}`);
        }

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
        // When clearing the date, also clear the time
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
      // Convert studentNames array to comma-separated string for saving
      const finalData = {
        ...formData,
        studentNames: Array.isArray(formData.studentNames)
          ? formData.studentNames.filter(Boolean).join(', ')
          : formData.studentNames,
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

  // Helper to check if a date field is filled
  const isDateFilled = (dateField) => {
    return formData[dateField] && formData[dateField] !== '';
  };

  // Calculate current step based on filled dates
  const calculateCurrentStep = () => {
    if (isDateFilled('dateReceivedEO')) return 5;
    if (isDateFilled('dateReceivedNEXUSS')) return 4;
    if (isDateFilled('dateReceivedLCAOWithCover')) return 3;
    if (isDateFilled('dateReceivedLCAO')) return 2;
    if (isDateFilled('dateProcessedNLO')) return 1;
    return 0;
  };

  const currentStep = calculateCurrentStep();

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

        <div className="process-timeline">
          {[
            { step: 1, label: 'NLO Process' },
            { step: 2, label: 'LCAO Review' },
            { step: 3, label: 'Attorney Review' },
            { step: 4, label: 'NEXUSS Process' },
            { step: 5, label: 'Executive Office' }
          ].map(({ step, label }) => (
            <div key={step} className="timeline-step">
              <div className={`step-circle ${step === currentStep ? 'active' : step < currentStep ? 'completed' : ''}`}>
                {step < currentStep ? <i className="fas fa-check"></i> : step}
              </div>
              <div className="step-label">{label}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="edit-form">          <div className="form-section">
            <span className="step-indicator">Basic Details</span>
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
              <div className="form-group">
                <label>Student Name(s)</label>
                {Array.isArray(formData.studentNames) && formData.studentNames.map((name, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <input
                      type="text"
                      value={name}
                      onChange={e => handleStudentNameChange(idx, e.target.value)}
                      placeholder={`Student ${idx + 1} name`}
                      style={{ flex: 1 }}
                    />
                    {formData.studentNames.length > 1 && (
                      <button
                        type="button"
                        className="remove-student-button save-button"
                        style={{ marginLeft: 4, padding: '2px 6px', fontSize: '0.95em', minWidth: 0 }}
                        onClick={() => handleRemoveStudent(idx)}
                        title="Remove Student"
                      >
                        <i className="fas fa-minus-circle"></i>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-student-button save-button"
                  style={{ marginTop: 4, padding: '4px 10px', fontSize: '1.1em' }}
                  onClick={handleAddStudent}
                  title="Add Student"
                >
                  <i className="fas fa-plus-circle"></i>
                </button>
              </div>
              <div className="form-group">
                <label>Student Course</label>
                <input
                  type="text"
                  name="studentCourse"
                  value={formData.studentCourse}
                  onChange={handleChange}
                  placeholder="Enter student course"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <span className="step-indicator">Step 1</span>
            <h3>NLO & LCAO Process</h3>
            <div className="form-grid">
              {renderDateTimeInput('dateProcessedNLO', 'NLO Process Date')}
              {renderDateTimeInput('dateForwardedLCAO', 'To LCAO')}
              {renderDateTimeInput('dateReceivedLCAO', 'From LCAO')}
            </div>
          </div>

          <div className="form-section">
            <span className="step-indicator">Step 2</span>
            <h3>Attorney Process</h3>
            <div className="form-grid">
              {renderDateTimeInput('dateForwardedAttorneys', 'To Attorneys')}
              {renderDateTimeInput('dateReceivedLCAOWithCover', 'From LCAO w/ Cover')}
            </div>
          </div>

          <div className="form-section">
            <span className="step-indicator">Step 3</span>
            <h3>Host & NEXUSS Process</h3>
            <div className="form-grid">
              {renderDateTimeInput('dateForwardedHost', 'To Host')}
              {renderDateTimeInput('dateForwardedNEXUSS', 'To Director External Affairs & MIS')}
              {renderDateTimeInput('dateReceivedNEXUSS', 'From Director External Affairs & MIS')}
            </div>
          </div>

          <div className="form-section">
            <span className="step-indicator">Step 4</span>
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
          
          {/* Simplified Completion Toggle Section */}          <div className="form-section finish-section">
            <span className="step-indicator">Final Step</span>
            <h3>Process Completion</h3>
            <div className="finish-moa-container">
              <div className="process-summary">
                <h4>Agreement Progress</h4>
                <div className="progress-stats">
                  <div className="stat-item">
                    <i className="fas fa-tasks"></i>
                    <span>Steps Completed: {currentStep} of 5</span>
                  </div>
                  <div className="stat-item">
                    <i className="fas fa-clock"></i>
                    <span>Current Status: {formData.status}</span>
                  </div>
                </div>
              </div>

              <div className="completion-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={formData.status === 'Completed'}
                     onChange={async (e) => {
                       const isCompleted = e.target.checked;

                       console.log("Setting status to:", isCompleted ? 'Completed' : 'Pending');
                      
                      // Update local state immediately for UI feedback
                      const newStatus = isCompleted ? 'Completed' : 'Pending';
                      const newCompletedDate = isCompleted ? new Date().toISOString() : null;
                      
                      setFormData({
                        ...formData,
                        status: newStatus,
                        completedDate: newCompletedDate
                      });

                      // Automatically save the completion status to database
                      try {
                        const updateData = {
                          id: record.id,
                          status: newStatus,
                          completedDate: newCompletedDate
                        };
                        
                        await onSave(updateData);
                        
                        if (newStatus === 'Completed') {
                          toast.success('Agreement marked as completed!');
                        } else {
                          toast.success('Agreement marked as pending!');
                        }
                      } catch (error) {
                        console.error('Error updating completion status:', error);
                        toast.error('Failed to update completion status');
                        
                        // Revert the local state if save failed
                        setFormData({
                          ...formData,
                          status: formData.status,
                          completedDate: formData.completedDate
                        });
                      }
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
                   : 'You can mark this agreement as completed at any time using the toggle above.'}
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