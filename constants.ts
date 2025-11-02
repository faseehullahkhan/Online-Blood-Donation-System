
import { BloodGroup, Gender, RequestStatus } from './types';

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const GENDERS: Gender[] = ['Male', 'Female', 'Other'];
export const REQUEST_STATUSES: RequestStatus[] = ['Pending', 'In Progress', 'Fulfilled', 'Cancelled'];

export const DONATION_INTERVAL_MONTHS = 3;
