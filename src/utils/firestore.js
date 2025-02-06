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
      address: data.address || '',
      agreementType: data.agreementType || '',

      // Contact Information
      contactPerson: data.contactPerson || '',
      designation: data.designation || '',
      emailAddress: data.emailAddress || '',
      contactNumber: data.contactNumber || '',

      // Timeline Dates
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
    const docRef = doc(db, MOA_COLLECTION, id);
    await updateDoc(docRef, {
      // Company Information
      companyName: data.companyName || '',
      address: data.address || '',
      agreementType: data.agreementType || '',

      // Contact Information
      contactPerson: data.contactPerson || '',
      designation: data.designation || '',
      emailAddress: data.emailAddress || '',
      contactNumber: data.contactNumber || '',

      // Timeline Dates
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
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, 'updating MOA record');
    return false;
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