import React, { useState, useEffect, useCallback } from 'react';
import { Hospital, DonationRecord, Donor, BloodRequest, BloodGroup, Gender } from '../types';
import { BLOOD_GROUPS, GENDERS } from '../constants';
import apiService from '../services/apiService';
import { CheckCircleIcon, ClockIcon, ShieldCheckIcon, BellIcon, UserPlusIcon, BuildingOfficeIcon, UserCircleIcon, HeartIcon, UserMinusIcon, HandThumbUpIcon, PlusIcon } from './icons';
import Card from './shared/Card';
import Button from './shared/Button';
import Modal from './shared/Modal';
import Input from './shared/Input';
import Select from './shared/Select';

const AdminDashboard: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAddDonorModalOpen, setIsAddDonorModalOpen] = useState(false);
  const [isAddHospitalModalOpen, setIsAddHospitalModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [hospitalsData, donationsData, donorsData, requestsData] = await Promise.all([
        apiService.getHospitals(),
        apiService.getDonationRecords(),
        apiService.getDonors(),
        apiService.getBloodRequests(),
      ]);
      setHospitals(hospitalsData);
      setDonations(donationsData);
      setDonors(donorsData);
      setRequests(requestsData);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerifyHospital = async (id: string) => {
    try {
      await apiService.verifyHospital(id);
      fetchData();
    } catch (err) {
      alert('Failed to verify hospital.');
    }
  };

  const handleApproveDonation = async (id: string) => {
    try {
      await apiService.approveDonation(id);
      fetchData();
    } catch (err) {
      alert('Failed to approve donation.');
    }
  };

  const handleOpenAssignModal = (request: BloodRequest) => {
    setSelectedRequest(request);
    setIsAssignModalOpen(true);
  };
  
  const handleCancelAssignment = async (donorId: string) => {
    if (window.confirm('Are you sure you want to cancel this donor\'s assignment? They will become available for other requests.')) {
        try {
            await apiService.cancelDonorAssignment(donorId);
            fetchData();
        } catch (err) {
            alert((err as Error).message || 'Failed to cancel assignment.');
        }
    }
  };

  const handleConfirmDonation = async(requestId: string, donorId: string) => {
    if (window.confirm('Confirm that this donor has successfully donated blood? This will update their donation history.')) {
        try {
            await apiService.confirmDonation(requestId, donorId);
            fetchData();
        } catch(err) {
            alert((err as Error).message || 'Failed to confirm donation.');
        }
    }
  }

  if (loading) return <div className="text-center p-8">Loading admin data...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  
  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const inProgressRequests = requests.filter(r => r.status === 'In Progress');

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card title="Pending Blood Requests" icon={<BellIcon className="h-6 w-6" />}>
                <div className="space-y-4">
                  {pendingRequests.length > 0 ? (
                      pendingRequests.map(req => {
                          const hospital = hospitals.find(h => h.hospitalId === req.hospitalId);
                          return (
                            <div key={req.requestId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-semibold">
                                  Request for <span className="font-bold text-red-600">{req.quantity}</span> unit(s) of <span className="font-bold text-red-600">{req.bloodGroup}</span>
                                </p>
                                <p className="text-sm text-gray-500">From: {hospital?.name || 'Unknown Hospital'}</p>
                              </div>
                              <Button onClick={() => handleOpenAssignModal(req)} size="sm">
                                Manage
                              </Button>
                            </div>
                          )
                      })
                  ) : (
                      <p className="text-center text-gray-500 p-4">No pending blood requests.</p>
                  )}
                </div>
            </Card>

            <Card title="Ongoing Donations / In Progress" icon={<ClockIcon className="h-6 w-6" />}>
                <div className="space-y-6">
                    {inProgressRequests.length > 0 ? (
                        inProgressRequests.map(req => {
                            const hospital = hospitals.find(h => h.hospitalId === req.hospitalId);
                            const fulfilledCount = req.fulfilledBy?.length || 0;
                            const needed = req.quantity - fulfilledCount;
                            return (
                                <div key={req.requestId} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-semibold">
                                                <span className="font-bold text-red-600">{req.bloodGroup}</span> request from {hospital?.name}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Status: {fulfilledCount} / {req.quantity} units fulfilled. {req.assignedDonors.length} assigned.
                                            </p>
                                        </div>
                                        {needed > req.assignedDonors.length &&
                                            <Button onClick={() => handleOpenAssignModal(req)} size="sm" variant="secondary" icon={<PlusIcon className="h-4 w-4" />}>
                                                Assign More
                                            </Button>
                                        }
                                    </div>
                                    <div className="space-y-2 pt-2 border-t">
                                        <h4 className="text-sm font-medium">Assigned Donors:</h4>
                                        {req.assignedDonors.length > 0 ? req.assignedDonors.map(donorId => {
                                            const donor = donors.find(d => d.donorId === donorId);
                                            if (!donor) return null;
                                            return (
                                                <div key={donorId} className="flex justify-between items-center p-2 bg-white rounded-md">
                                                    <p>{donor.name}</p>
                                                    <div className="flex gap-2">
                                                        <Button onClick={() => handleConfirmDonation(req.requestId, donor.donorId)} size="sm" icon={<HandThumbUpIcon className="h-4 w-4" />}>Confirm</Button>
                                                        <Button onClick={() => handleCancelAssignment(donor.donorId)} size="sm" variant="danger" icon={<UserMinusIcon className="h-4 w-4" />}>Cancel</Button>
                                                    </div>
                                                </div>
                                            )
                                        }) : <p className="text-xs text-gray-500 pl-2">No donors currently assigned.</p>}
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-center text-gray-500 p-4">No requests are currently in progress.</p>
                    )}
                </div>
            </Card>

            <Card title="Manage Donors" icon={<UserCircleIcon className="h-6 w-6" />} headerAction={
                <Button onClick={() => setIsAddDonorModalOpen(true)} size="sm" icon={<UserPlusIcon className="h-5 w-5" />}>
                    Add Donor
                </Button>
            }>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {donors.map(donor => (
                        <div key={donor.donorId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-semibold">{donor.name} <span className="text-sm font-bold text-red-500">({donor.bloodGroup})</span></p>
                                <p className="text-sm text-gray-500">{donor.address}</p>
                            </div>
                            {donor.isAvailable ? (
                                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-800`}>
                                    Available
                                </span>
                            ) : (
                                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800`}>
                                    Unavailable
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
            <Card title="Manage Hospitals" icon={<BuildingOfficeIcon className="h-6 w-6" />} headerAction={
                <Button onClick={() => setIsAddHospitalModalOpen(true)} size="sm">
                    Add Hospital
                </Button>
            }>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {hospitals.map(hospital => (
                  <div key={hospital.hospitalId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{hospital.name}</p>
                      <p className="text-sm text-gray-500">{hospital.location}</p>
                    </div>
                    {hospital.isVerified ? (
                      <span className="flex items-center text-xs text-green-600 font-medium">
                        <CheckCircleIcon className="h-4 w-4 mr-1" /> Verified
                      </span>
                    ) : (
                      <Button onClick={() => handleVerifyHospital(hospital.hospitalId)} size="sm" variant="secondary">
                        Verify
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Donation Approvals" icon={<HeartIcon className="h-6 w-6" />}>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {donations.filter(d => !d.isVerifiedByAdmin).map(donation => {
                  const donor = donors.find(d => d.donorId === donation.donorId);
                  return (
                    <div key={donation.donationId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">From {donor?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{new Date(donation.donationDate).toLocaleDateString()}</p>
                      </div>
                      <Button onClick={() => handleApproveDonation(donation.donationId)} size="sm">
                        Approve
                      </Button>
                    </div>
                  );
                })}
                 {donations.filter(d => !d.isVerifiedByAdmin).length === 0 && (
                    <p className="text-center text-gray-500 p-4">No pending approvals.</p>
                 )}
              </div>
            </Card>
        </div>
      </div>

      {selectedRequest && (
        <AssignDonorModal
            isOpen={isAssignModalOpen}
            onClose={() => {setIsAssignModalOpen(false); fetchData();}}
            request={selectedRequest}
        />
      )}
      <AddDonorModal
        isOpen={isAddDonorModalOpen}
        onClose={() => setIsAddDonorModalOpen(false)}
        onSuccess={fetchData}
      />
      <AddHospitalModal
        isOpen={isAddHospitalModalOpen}
        onClose={() => setIsAddHospitalModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};

// --- Modals ---

interface AssignDonorModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: BloodRequest;
}

const AssignDonorModal: React.FC<AssignDonorModalProps> = ({ isOpen, onClose, request }) => {
  const [eligibleDonors, setEligibleDonors] = useState<Donor[]>([]);
  const [selectedDonors, setSelectedDonors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const neededCount = request.quantity - (request.fulfilledBy?.length || 0) - request.assignedDonors.length;

  useEffect(() => {
    if (isOpen) {
      const fetchDonors = async () => {
        setLoading(true);
        setError(null);
        try {
          const donors = await apiService.findEligibleDonors(request.bloodGroup);
          setEligibleDonors(donors);
        } catch (err) {
          setError("Failed to find eligible donors.");
        } finally {
          setLoading(false);
        }
      };
      fetchDonors();
    } else {
        setEligibleDonors([]);
        setSelectedDonors([]);
        setLoading(true);
    }
  }, [isOpen, request.bloodGroup]);

  const handleToggleDonor = (donorId: string) => {
    setSelectedDonors(prev => {
        const isSelected = prev.includes(donorId);
        if (isSelected) {
            return prev.filter(id => id !== donorId);
        } else {
            if (prev.length < neededCount) {
                return [...prev, donorId];
            }
            return prev; // Limit selection to quantity needed
        }
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiService.assignDonorsToRequest(request.requestId, selectedDonors);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Donors for ${request.bloodGroup} Request`}>
      <div className="space-y-4">
        <div>
            <p className="font-semibold">Request Details</p>
            <p className="text-sm text-gray-600">Blood Group: <span className="font-bold text-red-600">{request.bloodGroup}</span></p>
            <p className="text-sm text-gray-600">Total Quantity Needed: <span className="font-bold">{request.quantity}</span> unit(s)</p>
            <p className="text-sm text-gray-600">Open Slots: <span className="font-bold">{neededCount}</span></p>
            <p className="text-sm text-gray-600">Selected: <span className="font-bold">{selectedDonors.length}</span> / {neededCount}</p>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-md">
            <h4 className="font-semibold text-gray-800">Eligible Donors</h4>
            {loading && <p>Finding donors...</p>}
            {!loading && eligibleDonors.length === 0 && <p className="text-gray-500">No eligible donors found for this blood group.</p>}
            {eligibleDonors.map(donor => (
                <div key={donor.donorId} className="flex items-center justify-between p-2 bg-white rounded-md border">
                    <div>
                        <p className="font-medium">{donor.name}</p>
                        <p className="text-xs text-gray-500">{donor.address}</p>
                    </div>
                    <input
                        type="checkbox"
                        className="h-5 w-5 rounded text-red-600 focus:ring-red-500 border-gray-300"
                        checked={selectedDonors.includes(donor.donorId)}
                        onChange={() => handleToggleDonor(donor.donorId)}
                        disabled={selectedDonors.length >= neededCount && !selectedDonors.includes(donor.donorId)}
                    />
                </div>
            ))}
        </div>
        
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" onClick={handleSubmit} disabled={loading || selectedDonors.length === 0}>
                {loading ? 'Assigning...' : `Assign ${selectedDonors.length} Donor(s)`}
            </Button>
        </div>
      </div>
    </Modal>
  );
};

const AddDonorModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void; }> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ name: '', age: '', gender: GENDERS[0], bloodGroup: BLOOD_GROUPS[0], phone: '', address: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await apiService.addDonor({
                ...formData,
                age: parseInt(formData.age, 10),
                gender: formData.gender as Gender,
                bloodGroup: formData.bloodGroup as BloodGroup
            });
            onSuccess();
            onClose();
        } catch (err) {
            alert("Failed to add donor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Donor">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
                <Input label="Age" name="age" type="number" value={formData.age} onChange={handleChange} required />
                <Select label="Gender" name="gender" value={formData.gender} onChange={handleChange}>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </Select>
                <Select label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </Select>
                <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} required />
                <Input label="Address" name="address" value={formData.address} onChange={handleChange} required />
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Donor'}</Button>
                </div>
            </form>
        </Modal>
    );
};

const AddHospitalModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void; }> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ name: '', location: '', contact: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await apiService.addHospital(formData);
            onSuccess();
            onClose();
        } catch (err) {
            alert("Failed to add hospital.");
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Hospital">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Hospital Name" name="name" value={formData.name} onChange={handleChange} required />
                <Input label="Location" name="location" value={formData.location} onChange={handleChange} required />
                <Input label="Contact Number" name="contact" value={formData.contact} onChange={handleChange} required />
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Hospital'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default AdminDashboard;