import { Donor, Hospital, BloodRequest, DonationRecord, BloodGroup, Gender } from '../types';
import { DONATION_INTERVAL_MONTHS } from '../constants';

// --- MOCK DATABASE ---
let donors: Donor[] = [
  { donorId: 'DON001', name: 'John Doe', age: 30, gender: 'Male', bloodGroup: 'O+', phone: '123-456-7890', address: '123 Main St, Cityville', lastDonationDate: '2024-02-15T10:00:00Z', isAvailable: true },
  { donorId: 'DON002', name: 'Jane Smith', age: 25, gender: 'Female', bloodGroup: 'A-', phone: '234-567-8901', address: '456 Oak Ave, Townburg', lastDonationDate: '2024-06-10T14:30:00Z', isAvailable: false },
  { donorId: 'DON003', name: 'Sam Wilson', age: 42, gender: 'Male', bloodGroup: 'B+', phone: '345-678-9012', address: '789 Pine Ln, Villagetown', lastDonationDate: null, isAvailable: true },
  { donorId: 'DON004', name: 'Emily Brown', age: 28, gender: 'Female', bloodGroup: 'AB+', phone: '456-789-0123', address: '101 Maple Dr, Hamlet', lastDonationDate: '2024-07-01T09:00:00Z', isAvailable: false },
  { donorId: 'DON005', name: 'Chris Green', age: 35, gender: 'Male', bloodGroup: 'A-', phone: '567-890-1234', address: '222 River Rd, Lakeside', lastDonationDate: '2023-12-01T11:00:00Z', isAvailable: true },
];

let hospitals: Hospital[] = [
  { hospitalId: 'HOS001', name: 'City General Hospital', contact: '555-111-2222', location: 'Cityville', isVerified: true },
  { hospitalId: 'HOS002', name: 'Townburg Medical Center', contact: '555-333-4444', location: 'Townburg', isVerified: false },
  { hospitalId: 'HOS003', name: 'Community Clinic', contact: '555-555-6666', location: 'Villagetown', isVerified: true },
];

let bloodRequests: BloodRequest[] = [
  { requestId: 'REQ001', hospitalId: 'HOS001', bloodGroup: 'A-', quantity: 2, requestDate: '2024-07-20T08:00:00Z', status: 'In Progress', assignedDonors: ['DON002', 'DON004'], fulfilledBy: [] },
  { requestId: 'REQ002', hospitalId: 'HOS003', bloodGroup: 'O+', quantity: 4, requestDate: '2024-07-22T11:00:00Z', status: 'Pending', assignedDonors: [], fulfilledBy: [] },
  { requestId: 'REQ003', hospitalId: 'HOS001', bloodGroup: 'B+', quantity: 1, requestDate: '2024-06-15T18:00:00Z', status: 'Fulfilled', assignedDonors: [], fulfilledBy: ['DON003'] },
];

let donationRecords: DonationRecord[] = [
    { donationId: 'DREC001', donorId: 'DON002', requestId: 'REQ001', donationDate: '2024-06-10T14:30:00Z', isVerifiedByAdmin: true },
    { donationId: 'DREC002', donorId: 'DON003', requestId: 'REQ003', donationDate: '2024-06-16T10:00:00Z', isVerifiedByAdmin: false },
];


// --- MOCK API FUNCTIONS ---
// This simulates network latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const apiService = {
  // Donor endpoints
  getDonors: async (): Promise<Donor[]> => {
    await delay(500);
    return [...donors];
  },
  getDonorById: async (id: string): Promise<Donor | undefined> => {
    await delay(300);
    return donors.find(d => d.donorId === id);
  },
  addDonor: async (donorData: Omit<Donor, 'donorId' | 'lastDonationDate' | 'isAvailable'>): Promise<Donor> => {
    await delay(500);
    const newDonor: Donor = {
      ...donorData,
      donorId: `DON${String(donors.length + 1).padStart(3, '0')}`,
      lastDonationDate: null,
      isAvailable: true,
    };
    donors.push(newDonor);
    return { ...newDonor };
  },
  
  // Hospital endpoints
  getHospitals: async (): Promise<Hospital[]> => {
    await delay(500);
    return [...hospitals];
  },
  getHospitalById: async (id: string): Promise<Hospital | undefined> => {
    await delay(300);
    return hospitals.find(h => h.hospitalId === id);
  },
  addHospital: async (hospitalData: Omit<Hospital, 'hospitalId' | 'isVerified'>): Promise<Hospital> => {
    await delay(500);
    const newHospital: Hospital = {
      ...hospitalData,
      hospitalId: `HOS${String(hospitals.length + 1).padStart(3, '0')}`,
      isVerified: false,
    };
    hospitals.push(newHospital);
    return { ...newHospital };
  },
  verifyHospital: async (id: string): Promise<Hospital> => {
    await delay(400);
    const hospital = hospitals.find(h => h.hospitalId === id);
    if (!hospital) throw new Error("Hospital not found");
    hospital.isVerified = true;
    return { ...hospital };
  },

  // Blood Request endpoints
  getBloodRequests: async (): Promise<BloodRequest[]> => {
    await delay(500);
    return [...bloodRequests];
  },
  createBloodRequest: async (requestData: Omit<BloodRequest, 'requestId' | 'requestDate' | 'status' | 'assignedDonors' | 'fulfilledBy'>): Promise<BloodRequest> => {
    await delay(600);
    const hospital = hospitals.find(h => h.hospitalId === requestData.hospitalId);
    if (!hospital || !hospital.isVerified) {
      throw new Error("Only verified hospitals can create requests.");
    }
    const newRequest: BloodRequest = {
      ...requestData,
      requestId: `REQ${String(bloodRequests.length + 1).padStart(3, '0')}`,
      requestDate: new Date().toISOString(),
      status: 'Pending',
      assignedDonors: [],
      fulfilledBy: [],
    };
    bloodRequests.push(newRequest);
    return { ...newRequest };
  },
  assignDonorsToRequest: async (requestId: string, donorIds: string[]): Promise<BloodRequest> => {
    await delay(600);
    const request = bloodRequests.find(r => r.requestId === requestId);
    if (!request) throw new Error("Blood request not found");

    if (request.status !== 'Pending' && request.status !== 'In Progress') {
      throw new Error("Can only assign donors to pending or in-progress requests.");
    }

    // Add new, unique donors to the request
    donorIds.forEach(donorId => {
      if (!request.assignedDonors.includes(donorId)) {
        request.assignedDonors.push(donorId);
      }
    });

    // Update donor availability
    donorIds.forEach(donorId => {
      const donor = donors.find(d => d.donorId === donorId);
      if (donor) {
        donor.isAvailable = false;
      }
    });

    // Update request status
    if (request.assignedDonors.length > 0) {
      request.status = 'In Progress';
    }
    
    // Check if enough donors are assigned now
    if ((request.assignedDonors.length + request.fulfilledBy.length) >= request.quantity) {
        // Not marking as fulfilled on assignment, only on confirmation.
    }

    return { ...request };
  },
  cancelDonorAssignment: async (donorId: string): Promise<{ donor: Donor; request: BloodRequest }> => {
    await delay(500);
    const request = bloodRequests.find(r => 
      r.assignedDonors.includes(donorId) && (r.status === 'In Progress' || r.status === 'Fulfilled')
    );
    const donor = donors.find(d => d.donorId === donorId);

    if (!request || !donor) {
        throw new Error("Could not find an active assignment for this donor.");
    }

    // Update donor
    donor.isAvailable = true;

    // Update request
    request.assignedDonors = request.assignedDonors.filter(id => id !== donorId);
    
    if (request.assignedDonors.length === 0 && request.fulfilledBy.length === 0) {
        request.status = 'Pending';
    }
    
    return { donor: { ...donor }, request: { ...request } };
  },

  confirmDonation: async (requestId: string, donorId: string): Promise<DonationRecord> => {
    await delay(700);
    const request = bloodRequests.find(r => r.requestId === requestId);
    const donor = donors.find(d => d.donorId === donorId);
    
    if (!request || !donor) {
      throw new Error("Request or Donor not found");
    }

    // 1. Create Donation Record
    const newRecord: DonationRecord = {
      donationId: `DREC${String(donationRecords.length + 1).padStart(3, '0')}`,
      donorId,
      requestId,
      donationDate: new Date().toISOString(),
      isVerifiedByAdmin: false, // Admin confirms, but let's keep the approval step separate
    };
    donationRecords.push(newRecord);

    // 2. Update Donor
    donor.lastDonationDate = newRecord.donationDate;
    donor.isAvailable = true; // No longer tied to this request

    // 3. Update Request
    request.assignedDonors = request.assignedDonors.filter(id => id !== donorId);
    if (!request.fulfilledBy.includes(donorId)) {
      request.fulfilledBy.push(donorId);
    }
    
    if (request.fulfilledBy.length >= request.quantity) {
      request.status = 'Fulfilled';
      // Release any other assigned donors if the request is now fulfilled
      request.assignedDonors.forEach(id => {
        const otherDonor = donors.find(d => d.donorId === id);
        if (otherDonor) otherDonor.isAvailable = true;
      });
      request.assignedDonors = [];
    }

    return { ...newRecord };
  },

  // Donation Record endpoints
  getDonationRecords: async (): Promise<DonationRecord[]> => {
    await delay(500);
    return [...donationRecords];
  },
  approveDonation: async (id: string): Promise<DonationRecord> => {
    await delay(400);
    const record = donationRecords.find(dr => dr.donationId === id);
    if (!record) throw new Error("Donation record not found");
    record.isVerifiedByAdmin = true;
    return { ...record };
  },

  // Matching system logic
  findEligibleDonors: async (bloodGroup: BloodGroup): Promise<Donor[]> => {
    await delay(700);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - DONATION_INTERVAL_MONTHS);
    
    return donors.filter(donor => 
      donor.bloodGroup === bloodGroup &&
      donor.isAvailable &&
      (!donor.lastDonationDate || new Date(donor.lastDonationDate) < threeMonthsAgo)
    );
  },

  // Business Logic
  isDonorEligible: (donor: Donor): boolean => {
    if (!donor.isAvailable) return false;
    if (!donor.lastDonationDate) return true;
    const lastDonation = new Date(donor.lastDonationDate);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - DONATION_INTERVAL_MONTHS);
    return lastDonation < threeMonthsAgo;
  }
};

export default apiService;