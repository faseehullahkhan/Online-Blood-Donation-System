export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type Gender = 'Male' | 'Female' | 'Other';
export type RequestStatus = 'Pending' | 'Fulfilled' | 'In Progress' | 'Cancelled';

export interface Donor {
  donorId: string;
  name: string;
  age: number;
  gender: Gender;
  bloodGroup: BloodGroup;
  phone: string;
  address: string;
  lastDonationDate: string | null; // ISO 8601 string
  isAvailable: boolean;
}

export interface Hospital {
  hospitalId: string;
  name: string;
  contact: string;
  location: string;
  isVerified: boolean;
}

export interface BloodRequest {
  requestId: string;
  hospitalId: string;
  bloodGroup: BloodGroup;
  quantity: number; // in units
  requestDate: string; // ISO 8601 string
  status: RequestStatus;
  assignedDonors: string[]; // array of donorIds
  fulfilledBy: string[]; // array of donorIds who have successfully donated
}

export interface DonationRecord {
  donationId: string;
  donorId: string;
  requestId: string;
  donationDate: string; // ISO 8601 string
  isVerifiedByAdmin: boolean;
}