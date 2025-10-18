import React, { useState, useEffect } from 'react';
import './AgreementForm.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Make sure this import path is correct for your project
import { toast } from 'react-hot-toast';

function AgreementForm({ onSubmit, initialData, existingData = [] }) {
  // State to store fetched data from Firestore
  const [fetchedData, setFetchedData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateRecord, setDuplicateRecord] = useState(null);

  // Fetch all company names from Firestore directly
  useEffect(() => {
    const fetchCompanyNames = async () => {
      try {
        setIsLoading(true);
        const moaCollectionRef = collection(db, 'moa_records');
        const querySnapshot = await getDocs(moaCollectionRef);
        
        const companies = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.companyName) {
            companies.push({
              id: doc.id,
              companyName: data.companyName
            });
          }
        });
        
        console.log("Fetched company names directly from Firestore:", companies);
        setFetchedData(companies);
      } catch (error) {
        console.error("Error fetching company names:", error);
        // Continue without validation if we can't fetch data
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyNames();
  }, []);

  // Debug existingData
  useEffect(() => {
    console.log("Existing data received from props:", existingData);
    console.log("Fetched data from Firestore:", fetchedData);
  }, [existingData, fetchedData]);

  const [formData, setFormData] = useState(initialData || {
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
    status: 'Pending'
  });

  // Add validation state
  const [errors, setErrors] = useState({});

  // Add state to track if form is valid for submission
  const [isFormValid, setIsFormValid] = useState(false);

  // Add new state for timestamps
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
    if (initialData) {
      setFormData({
        ...initialData,
        studentNames: Array.isArray(initialData.studentNames)
          ? initialData.studentNames
          : (typeof initialData.studentNames === 'string' ? initialData.studentNames.split(/[,\n]/).map(s => s.trim()).filter(Boolean) : [''])
      });
    }
  }, [initialData]);

  // Check for duplicates whenever companyName changes
  useEffect(() => {
    if (!formData.companyName || isLoading) return;
    
    // Skip validation if we're editing an existing record with the same name
    if (initialData && initialData.companyName === formData.companyName) {
      setIsFormValid(true);
      setErrors(prev => ({...prev, companyName: ''}));
      return;
    }
    
    const allCompanies = [...fetchedData];
    const searchTerm = formData.companyName.toLowerCase().trim();
    
    // Find potential duplicates with fuzzy matching
    const potentialDuplicates = allCompanies.filter(item => {
      if (!item || !item.companyName) return false;
      const itemName = item.companyName.toLowerCase().trim();
      
      // Check for exact match
      if (itemName === searchTerm) return true;
      
      // Check for similar names (fuzzy matching)
      const similarity = calculateSimilarity(itemName, searchTerm);
      return similarity > 0.8; // 80% similarity threshold
    });
    
    if (potentialDuplicates.length > 0) {
      setDuplicateRecord(potentialDuplicates[0]);
      setShowDuplicateModal(true);
      setErrors(prev => ({
        ...prev, 
        companyName: 'Similar company name found'
      }));
      setIsFormValid(false);
    } else {
      setErrors(prev => ({...prev, companyName: ''}));
      setIsFormValid(true);
    }
  }, [formData.companyName, fetchedData, initialData, isLoading]);

  // Calculate string similarity (Levenshtein distance)
  const calculateSimilarity = (str1, str2) => {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (track[str2.length][str1.length] / maxLength);
  };

  // Duplicate confirmation modal
  const DuplicateModal = ({ isOpen, onClose, onConfirm, duplicateRecord }) => {
    if (!isOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="duplicate-modal">
          <h3>Potential Duplicate Entry</h3>
          <p>We found a similar company name in our records:</p>
          <div className="duplicate-details">
            <p><strong>Company Name:</strong> {duplicateRecord?.companyName}</p>
            <p><strong>Agreement Type:</strong> {duplicateRecord?.agreementType}</p>
            {duplicateRecord?.studentNames && (
              <p><strong>Student Name(s):</strong> {duplicateRecord?.studentNames}</p>
            )}
            {duplicateRecord?.studentCourse && (
              <p><strong>Student Course:</strong> {duplicateRecord?.studentCourse}</p>
            )}
            <p><strong>Status:</strong> {duplicateRecord?.status}</p>
          </div>
          <div className="modal-actions">
            <button 
              className="confirm-button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              Continue Anyway
            </button>
            <button 
              className="cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

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

  // Update the formatDateForInput function
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

  // Simplify the handleDateTimeChange function
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
    
    if (isLoading) {
      toast.error("Please wait, loading company data...");
      return false;
    }
    
    if (!isFormValid) {
      toast.error("Please fix the errors before submitting");
      return false;
    }

    // Convert studentNames array to comma-separated string for saving
    const submitData = {
      ...formData,
      studentNames: Array.isArray(formData.studentNames)
        ? formData.studentNames.filter(Boolean).join(', ')
        : formData.studentNames
    };
    onSubmit(submitData);
    
    // Auto-clear form after successful submission (only for new records, not edits)
    if (!initialData) {
      setFormData({
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
        status: 'Pending'
      });
      setErrors({});
      setIsFormValid(false);
    }
  };

  return (
    <div className="agreement-form-container">
      <form onSubmit={handleSubmit} className="agreement-form">
        <h2>
          <i className="fas fa-file-contract"></i>
          Agreement Tracking Form
        </h2>
        
        {/* Company Information Section */}
        <div className="form-section">
          <h3><i className="fas fa-building"></i> Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="companyName">
                <i className="fas fa-building"></i> Company Name
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={errors.companyName ? 'input-error' : ''}
                placeholder="Enter company name"
                required
              />
              {errors.companyName && (
                <div className="error-message">
                  <i className="fas fa-exclamation-triangle"></i> {errors.companyName}
                </div>
              )}
              {!errors.companyName && formData.companyName && !isLoading && (
                <div className="success-message">
                  <i className="fas fa-check-circle"></i> Company name is available
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="agreementType">
                <i className="fas fa-file-signature"></i> Agreement Type
              </label>
              <select
                id="agreementType"
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
              <label htmlFor="studentNames">
                <i className="fas fa-user-graduate"></i> Student Name(s)
              </label>
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
                      className="remove-student-button submit-button"
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
                className="add-student-button submit-button"
                style={{ marginTop: 4, padding: '4px 10px', fontSize: '1.1em' }}
                onClick={handleAddStudent}
                title="Add Student"
              >
                <i className="fas fa-plus-circle"></i>
              </button>
            </div>
            <div className="form-group">
              <label htmlFor="studentCourse">
                <i className="fas fa-graduation-cap"></i> Student Course
              </label>
              <input
                type="text"
                id="studentCourse"
                name="studentCourse"
                value={formData.studentCourse}
                onChange={handleChange}
                placeholder="Enter student course"
              />
            </div>
          </div>
        </div>

        {/* Processing Timeline Section */}
        <div className="form-section">
          <h3><i className="fas fa-clock"></i> Processing Timeline</h3>
          <div className="timeline-grid">
            {/* NLO Process */}
            <div className="date-group">
              <label htmlFor="dateProcessedNLO">
                <i className="fas fa-calendar-check"></i> Date Processed by NLO
              </label>
              <div className="datetime-input">
                <input
                  type="date"
                  id="dateProcessedNLO"
                  name="dateProcessedNLO"
                  value={formatDateForInput(formData.dateProcessedNLO).date}
                  onChange={handleDateTimeChange}
                />
                <input
                  type="time"
                  data-time
                  value={formatDateForInput(formData.dateProcessedNLO).time || currentTime}
                  onChange={(e) => handleDateTimeChange({
                    target: {
                      name: 'dateProcessedNLO',
                      value: formatDateForInput(formData.dateProcessedNLO).date,
                      getAttribute: () => e.target.value
                    }
                  })}
                />
              </div>
            </div>
            
            {/* LCAO Process */}
            <div className="date-group">
              <label htmlFor="dateForwardedLCAO">
                <i className="fas fa-paper-plane"></i> Date Forwarded to LCAO
              </label>
              <div className="datetime-input">
                <input
                  type="date"
                  id="dateForwardedLCAO"
                  name="dateForwardedLCAO"
                  value={formatDateForInput(formData.dateForwardedLCAO).date}
                  onChange={handleDateTimeChange}
                />
                <input
                  type="time"
                  data-time
                  value={formatDateForInput(formData.dateForwardedLCAO).time || currentTime}
                  onChange={(e) => handleDateTimeChange({
                    target: {
                      name: 'dateForwardedLCAO',
                      value: formatDateForInput(formData.dateForwardedLCAO).date,
                      getAttribute: () => e.target.value
                    }
                  })}
                />
              </div>
            </div>
            
            <div className="date-group">
              <label htmlFor="dateReceivedLCAO">
                <i className="fas fa-inbox"></i> Date Received from LCAO
              </label>
              <div className="datetime-input">
                <input
                  type="date"
                  id="dateReceivedLCAO"
                  name="dateReceivedLCAO"
                  value={formatDateForInput(formData.dateReceivedLCAO).date}
                  onChange={handleDateTimeChange}
                />
                <input
                  type="time"
                  data-time
                  value={formatDateForInput(formData.dateReceivedLCAO).time || currentTime}
                  onChange={(e) => handleDateTimeChange({
                    target: {
                      name: 'dateReceivedLCAO',
                      value: formatDateForInput(formData.dateReceivedLCAO).date,
                      getAttribute: () => e.target.value
                    }
                  })}
                />
              </div>
            </div>
            
            {/* Attorney Process */}
            <div className="date-group">
              <label htmlFor="dateForwardedAttorneys">
                <i className="fas fa-balance-scale"></i> Date Forwarded to Attorneys
              </label>
              <div className="datetime-input">
                <input
                  type="date"
                  id="dateForwardedAttorneys"
                  name="dateForwardedAttorneys"
                  value={formatDateForInput(formData.dateForwardedAttorneys).date}
                  onChange={handleDateTimeChange}
                />
                <input
                  type="time"
                  data-time
                  value={formatDateForInput(formData.dateForwardedAttorneys).time || currentTime}
                  onChange={(e) => handleDateTimeChange({
                    target: {
                      name: 'dateForwardedAttorneys',
                      value: formatDateForInput(formData.dateForwardedAttorneys).date,
                      getAttribute: () => e.target.value
                    }
                  })}
                />
              </div>
            </div>
            
            <div className="date-group">
              <label htmlFor="dateReceivedLCAOWithCover">
                <i className="fas fa-file-alt"></i> Date Received from LCAO with Cover
              </label>
              <div className="datetime-input">
                <input
                  type="date"
                  id="dateReceivedLCAOWithCover"
                  name="dateReceivedLCAOWithCover"
                  value={formatDateForInput(formData.dateReceivedLCAOWithCover).date}
                  onChange={handleDateTimeChange}
                />
                <input
                  type="time"
                  data-time
                  value={formatDateForInput(formData.dateReceivedLCAOWithCover).time || currentTime}
                  onChange={(e) => handleDateTimeChange({
                    target: {
                      name: 'dateReceivedLCAOWithCover',
                      value: formatDateForInput(formData.dateReceivedLCAOWithCover).date,
                      getAttribute: () => e.target.value
                    }
                  })}
                />
              </div>
            </div>
            
            {/* Host/NEXUSS Process */}
            <div className="date-group">
              <label htmlFor="dateForwardedHost">
                <i className="fas fa-building"></i> Date Forwarded to Host Office
              </label>
              <div className="datetime-input">
                <input
                  type="date"
                  id="dateForwardedHost"
                  name="dateForwardedHost"
                  value={formatDateForInput(formData.dateForwardedHost).date}
                  onChange={handleDateTimeChange}
                />
                <input
                  type="time"
                  data-time
                  value={formatDateForInput(formData.dateForwardedHost).time || currentTime}
                  onChange={(e) => handleDateTimeChange({
                    target: {
                      name: 'dateForwardedHost',
                      value: formatDateForInput(formData.dateForwardedHost).date,
                      getAttribute: () => e.target.value
                    }
                  })}
                />
              </div>
            </div>
            
            <div className="date-group">
              <label htmlFor="dateForwardedNEXUSS">
                <i className="fas fa-exchange-alt"></i> Date Forwarded to Director External Affairs
              </label>
              <div className="datetime-input">
                <input
                  type="date"
                  id="dateForwardedNEXUSS"
                  name="dateForwardedNEXUSS"
                  value={formatDateForInput(formData.dateForwardedNEXUSS).date}
                  onChange={handleDateTimeChange}
                />
                <input
                  type="time"
                  data-time
                  value={formatDateForInput(formData.dateForwardedNEXUSS).time || currentTime}
                  onChange={(e) => handleDateTimeChange({
                    target: {
                      name: 'dateForwardedNEXUSS',
                      value: formatDateForInput(formData.dateForwardedNEXUSS).date,
                      getAttribute: () => e.target.value
                    }
                  })}
                />
              </div>
            </div>
            
            <div className="date-group">
              <label htmlFor="dateReceivedNEXUSS">
                <i className="fas fa-reply"></i> Date Received from Director External Affairs
              </label>
              <div className="datetime-input">
                <input
                  type="date"
                  id="dateReceivedNEXUSS"
                  name="dateReceivedNEXUSS"
                  value={formatDateForInput(formData.dateReceivedNEXUSS).date}
                  onChange={handleDateTimeChange}
                />
                <input
                  type="time"
                  data-time
                  value={formatDateForInput(formData.dateReceivedNEXUSS).time || currentTime}
                  onChange={(e) => handleDateTimeChange({
                    target: {
                      name: 'dateReceivedNEXUSS',
                      value: formatDateForInput(formData.dateReceivedNEXUSS).date,
                      getAttribute: () => e.target.value
                    }
                  })}
                />
              </div>
            </div>
            
            {/* Executive Office Process */}
            <div className="date-group">
              <label htmlFor="dateForwardedEO">
                <i className="fas fa-user-tie"></i> Date Forwarded to E.O
              </label>
              <div className="datetime-input">
                <input
                  type="date"
                  id="dateForwardedEO"
                  name="dateForwardedEO"
                  value={formatDateForInput(formData.dateForwardedEO).date}
                  onChange={handleDateTimeChange}
                />
                <input
                  type="time"
                  data-time
                  value={formatDateForInput(formData.dateForwardedEO).time || currentTime}
                  onChange={(e) => handleDateTimeChange({
                    target: {
                      name: 'dateForwardedEO',
                      value: formatDateForInput(formData.dateForwardedEO).date,
                      getAttribute: () => e.target.value
                    }
                  })}
                />
              </div>
            </div>
            
            <div className="date-group">
              <label htmlFor="dateReceivedEO">
                <i className="fas fa-check-circle"></i> Date Received from E.O
              </label>
              <div className="datetime-input">
                <input
                  type="date"
                  id="dateReceivedEO"
                  name="dateReceivedEO"
                  value={formatDateForInput(formData.dateReceivedEO).date}
                  onChange={handleDateTimeChange}
                />
                <input
                  type="time"
                  data-time
                  value={formatDateForInput(formData.dateReceivedEO).time || currentTime}
                  onChange={(e) => handleDateTimeChange({
                    target: {
                      name: 'dateReceivedEO',
                      value: formatDateForInput(formData.dateReceivedEO).date,
                      getAttribute: () => e.target.value
                    }
                  })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Remarks Section */}
        <div className="form-section">
          <h3><i className="fas fa-comment-alt"></i> Additional Information</h3>
          <div className="form-grid full-width">
            <div className="form-group">
              <label htmlFor="remarks">
                <i className="fas fa-sticky-note"></i> Remarks
              </label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Add any additional notes or remarks here..."
              />
            </div>
          </div>
        </div>

        <div className="submit-button-container">
          <button type="submit" className="submit-button">
            <i className="fas fa-save"></i> 
            {initialData ? 'Update Record' : 'Save Record'}
          </button>
        </div>
      </form>

      <DuplicateModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onConfirm={() => {
          setIsFormValid(true);
          setErrors(prev => ({...prev, companyName: ''}));
        }}
        duplicateRecord={duplicateRecord}
      />
    </div>
  );
}

export default AgreementForm; 