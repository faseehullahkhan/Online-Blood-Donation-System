
import React, { useState, useEffect, useCallback } from 'react';
import { Hospital, BloodRequest, Donor, BloodGroup } from '../types';
import apiService from '../services/apiService';
import { BLOOD_GROUPS } from '../constants';
import Card from './shared/Card';
import Button from './shared/Button';
import Modal from './shared/Modal';
import Input from './shared/Input';
import Select from './shared/Select';
import { PlusIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from './icons';

interface HospitalDashboardProps {
  hospitalId: string;
}

const HospitalDashboard: React.FC<HospitalDashboardProps> = ({ hospitalId }) => {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hospitalData = await apiService.getHospitalById(hospitalId);
      if (!hospitalData) throw new Error("Hospital not found");
      setHospital(hospitalData);

      const allRequests = await apiService.getBloodRequests();
      setRequests(allRequests.filter(req => req.hospitalId === hospitalId));
      
      const allDonors = await apiService.getDonors();
      setDonors(allDonors);

    } catch (err) {
      setError('Failed to fetch hospital data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequestSubmit = async (bloodGroup: BloodGroup, quantity: number) => {
    if (!hospital) return;
    try {
      await apiService.createBloodRequest({ hospitalId: hospital.hospitalId, bloodGroup, quantity });
      setIsModalOpen(false);
      fetchData(); // Refresh data
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const getStatusChip = (status: BloodRequest['status']) => {
    switch (status) {
      case 'Pending':
        return <span className="flex items-center text-sm font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full"><ClockIcon className="h-4 w-4 mr-1" />{status}</span>;
      case 'In Progress':
        return <span className="flex items-center text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full"><ClockIcon className="h-4 w-4 mr-1" />{status}</span>;
      case 'Fulfilled':
        return <span className="flex items-center text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full"><CheckCircleIcon className="h-4 w-4 mr-1" />{status}</span>;
      case 'Cancelled':
        return <span className="flex items-center text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full"><XCircleIcon className="h-4 w-4 mr-1" />{status}</span>;
    }
  };

  if (loading) return <div className="text-center p-8">Loading hospital data...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!hospital) return <div className="text-center p-8 text-red-500">Hospital not found.</div>;
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
            <h2 className="text-3xl font-bold text-gray-800">{hospital.name}</h2>
            <p className="text-gray-500">{hospital.location}</p>
        </div>
        {!hospital.isVerified && <span className="text-yellow-600 font-bold bg-yellow-100 px-3 py-1 rounded-full">Verification Pending</span>}
      </div>

      <Card 
        title="Blood Requests" 
        headerAction={
          hospital.isVerified ? (
            <Button onClick={() => setIsModalOpen(true)} size="sm" icon={<PlusIcon className="h-5 w-5" />}>
              New Request
            </Button>
          ) : undefined
        }
      >
        {!hospital.isVerified ? (
          <p className="text-center text-gray-600 p-4 bg-gray-100 rounded-md">Your hospital must be verified by an administrator before you can submit blood requests.</p>
        ) : requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.requestId} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-lg text-red-600">{req.bloodGroup}</span>
                    <span className="ml-2 text-gray-700"> - {req.quantity} units</span>
                  </div>
                  {getStatusChip(req.status)}
                </div>
                <p className="text-sm text-gray-500 mt-1">Requested on: {new Date(req.requestDate).toLocaleDateString()}</p>
                {req.assignedDonors.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                        <h4 className="text-sm font-semibold">Assigned Donors:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                            {req.assignedDonors.map(donorId => {
                                const donor = donors.find(d => d.donorId === donorId);
                                return <li key={donorId}>{donor?.name || 'Unknown Donor'}</li>
                            })}
                        </ul>
                    </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 p-4">You have no active blood requests.</p>
        )}
      </Card>
      <RequestModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleRequestSubmit}
      />
    </div>
  );
};

interface RequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (bloodGroup: BloodGroup, quantity: number) => Promise<void>;
}

const RequestModal: React.FC<RequestModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [bloodGroup, setBloodGroup] = useState<BloodGroup>('A+');
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await onSubmit(bloodGroup, quantity);
        setIsSubmitting(false);
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Submit a New Blood Request">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                    label="Blood Group"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                >
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </Select>
                <Input
                    label="Quantity (units)"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10)))}
                    min="1"
                    required
                />
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default HospitalDashboard;
