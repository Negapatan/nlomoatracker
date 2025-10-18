import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

// Collection reference
const MOA_COLLECTION = 'moa_records';

const handleFirestoreError = (error, operation) => {
  console.error(`Error ${operation}:`, error);
  throw error;
};

export const addMOARecord = async (data) => {
  try {
    const docRef = await addDoc(collection(db, MOA_COLLECTION), {
      // Company Information
      companyName: data.companyName || '',
      agreementType: data.agreementType || '',
      studentNames: data.studentNames || '',
      studentCourse: data.studentCourse || '',
      address: data.address || '',

      // Contact Information
      contactPerson: data.contactPerson || '',
      designation: data.designation || '',
      emailAddress: data.emailAddress || '',
      contactNumber: data.contactNumber || '',

      // Timeline Dates - Convert to Firestore Timestamps
      dateProcessedNLO: data.dateProcessedNLO ? Timestamp.fromDate(new Date(data.dateProcessedNLO)) : null,
      dateForwardedLCAO: data.dateForwardedLCAO ? Timestamp.fromDate(new Date(data.dateForwardedLCAO)) : null,
      dateReceivedLCAO: data.dateReceivedLCAO ? Timestamp.fromDate(new Date(data.dateReceivedLCAO)) : null,
      dateForwardedAttorneys: data.dateForwardedAttorneys ? Timestamp.fromDate(new Date(data.dateForwardedAttorneys)) : null,
      dateReceivedLCAOWithCover: data.dateReceivedLCAOWithCover ? Timestamp.fromDate(new Date(data.dateReceivedLCAOWithCover)) : null,
      dateForwardedHost: data.dateForwardedHost ? Timestamp.fromDate(new Date(data.dateForwardedHost)) : null,
      dateForwardedNEXUSS: data.dateForwardedNEXUSS ? Timestamp.fromDate(new Date(data.dateForwardedNEXUSS)) : null,
      dateReceivedNEXUSS: data.dateReceivedNEXUSS ? Timestamp.fromDate(new Date(data.dateReceivedNEXUSS)) : null,
      dateForwardedEO: data.dateForwardedEO ? Timestamp.fromDate(new Date(data.dateForwardedEO)) : null,
      dateReceivedEO: data.dateReceivedEO ? Timestamp.fromDate(new Date(data.dateReceivedEO)) : null,

      // Additional Information
      remarks: data.remarks || '',

      // Status (derived from dateReceivedEO)
      status: data.dateReceivedEO ? 'Completed' : 'Pending',

      // Metadata
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, 'adding MOA record');
    return null;
  }
};

export const updateMOARecord = async (id, data) => {
  try {
    console.log("Updating record with ID:", id);
    console.log("Data to update:", data);
    
    // Create a clean update object
    const updateObj = {};
    
    // Convert date fields to Firestore Timestamps
    const dateFields = [
      'dateProcessedNLO',
      'dateForwardedLCAO',
      'dateReceivedLCAO',
      'dateForwardedAttorneys',
      'dateReceivedLCAOWithCover',
      'dateForwardedHost',
      'dateForwardedNEXUSS',
      'dateReceivedNEXUSS',
      'dateForwardedEO',
      'dateReceivedEO'
    ];

    // Process each field
    Object.keys(data).forEach(key => {
      if (key === 'id') return; // Skip the id field
      
      if (dateFields.includes(key) && data[key]) {
        // Convert date strings to Firestore Timestamps
        updateObj[key] = Timestamp.fromDate(new Date(data[key]));
      } else {
        updateObj[key] = data[key];
      }
    });
    
    // Handle status field explicitly
    if (data.status) {
      updateObj.status = data.status;
      
      // If changing to Pending, explicitly set completedDate to null
      if (data.status === 'Pending') {
        updateObj.completedDate = null;
      }
      
      // If changing to Completed, ensure completedDate exists
      if (data.status === 'Completed' && !data.completedDate) {
        updateObj.completedDate = Timestamp.now();
      }
    }
    
    // Add updatedAt timestamp
    updateObj.updatedAt = Timestamp.now();
    
    console.log("Final update object being sent to Firestore:", updateObj);
    
    const docRef = doc(db, MOA_COLLECTION, id);
    await updateDoc(docRef, updateObj);
    console.log("Document successfully updated in Firestore");
    return id;
  } catch (error) {
    console.error("Error updating MOA record:", error);
    console.error("Failed update data:", data);
    throw error;
  }
};

export const deleteMOARecord = async (id) => {
  try {
    await deleteDoc(doc(db, MOA_COLLECTION, id));
    return true;
  } catch (error) {
    handleFirestoreError(error, 'deleting MOA record');
    return false;
  }
}; 