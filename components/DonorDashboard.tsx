import React, { useState, useEffect, useCallback } from 'react';
import { Donor, DonationRecord, BloodRequest, Hospital } from '../types';
import apiService from '../services/apiService';
import { DONATION_INTERVAL_MONTHS } from '../constants';
import Card from './shared/Card';
import { UserCircleIcon, CheckCircleIcon, ClockIcon, CalendarIcon, HeartIcon, BellIcon } from './icons';

interface DonorDashboardProps {
  donorId: string;
}

const DonorDashboard: React.FC<DonorDashboardProps> = ({ donorId }) => {
  const [donor, setDonor] = useState<Donor | null>(null);
  const [donationHistory, setDonationHistory] = useState<DonationRecord[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const donorData = await apiService.getDonorById(donorId);
      if (!donorData) throw new Error("Donor not found");
      setDonor(donorData);
      
      const [allDonations, allHospitals, allRequests] = await Promise.all([
          apiService.getDonationRecords(),
          apiService.getHospitals(),
          apiService.getBloodRequests()
      ]);

      setDonationHistory(allDonations.filter(rec => rec.donorId === donorId).sort((a, b) => new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime()));
      setHospitals(allHospitals);
      setRequests(allRequests);

    } catch (err) {
      setError('Failed to fetch donor data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [donorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="text-center p-8">Loading your profile...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!donor) return <div className="text-center p-8 text-red-500">Donor not found.</div>;
  
  const isEligibleByDate = (() => {
    if (!donor.lastDonationDate) return true;
    const lastDonation = new Date(donor.lastDonationDate);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - DONATION_INTERVAL_MONTHS);
    return lastDonation < threeMonthsAgo;
  })();
  const isEligible = donor.isAvailable && isEligibleByDate;
  const nextDonationDate = donor.lastDonationDate ? new Date(new Date(donor.lastDonationDate).setMonth(new Date(donor.lastDonationDate).getMonth() + DONATION_INTERVAL_MONTHS)) : new Date();

  const activeAssignments = requests.filter(req => 
    req.assignedDonors.includes(donor.donorId) && (req.status === 'In Progress')
  );

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800">Welcome, {donor.name}!</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-8">
          <Card title="My Profile" icon={<UserCircleIcon className="h-6 w-6" />}>
            <div className="space-y-2 text-gray-700">
                <p><strong>Age:</strong> {donor.age}</p>
                <p><strong>Gender:</strong> {donor.gender}</p>
                <p><strong>Blood Group:</strong> <span className="font-bold text-red-600 text-lg">{donor.bloodGroup}</span></p>
                <p><strong>Availability:</strong> {donor.isAvailable 
                    ? <span className="font-semibold text-green-600">Available</span> 
                    : <span className="font-semibold text-yellow-600">Unavailable</span>}
                </p>
                <p><strong>Phone:</strong> {donor.phone}</p>
            </div>
          </Card>
          <Card title="Donation Status" icon={<HeartIcon className="h-6 w-6"/>}>
            {isEligible ? (
                <div className="text-center p-4 bg-green-50 text-green-800 rounded-lg">
                    <CheckCircleIcon className="h-12 w-12 mx-auto mb-2"/>
                    <h3 className="font-bold text-lg">You are eligible to donate!</h3>
                    <p className="text-sm">Thank you for your willingness to save lives.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-center text-red-700">Not Currently Eligible</h3>
                    {!donor.isAvailable && (
                        <div className="text-center p-3 bg-blue-50 text-blue-800 rounded-lg">
                            <UserCircleIcon className="h-8 w-8 mx-auto mb-1"/>
                            <p className="font-semibold">Currently Assigned</p>
                            <p className="text-xs">You are assigned to an active request.</p>
                        </div>
                    )}
                    {!isEligibleByDate && (
                        <div className="text-center p-3 bg-yellow-50 text-yellow-800 rounded-lg">
                            <ClockIcon className="h-8 w-8 mx-auto mb-1"/>
                            <p className="font-semibold">Next Donation</p>
                            <p className="font-bold">{nextDonationDate.toLocaleDateString()}</p>
                        </div>
                    )}
                </div>
            )}
          </Card>
        </div>
        <div className="md:col-span-2 space-y-8">
            {activeAssignments.length > 0 && (
                <Card title="Active Assignments" icon={<BellIcon className="h-6 w-6" />}>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">You have been assigned to the following urgent request(s). Please contact the hospital for donation details.</p>
                        {activeAssignments.map(req => {
                            const hospital = hospitals.find(h => h.hospitalId === req.hospitalId);
                            return (
                                <div key={req.requestId} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="font-semibold">Request for <span className="text-red-600">{req.bloodGroup}</span> blood</p>
                                    <p className="text-sm text-gray-700">From: {hospital?.name || 'Unknown Hospital'}</p>
                                    <p className="text-sm text-gray-600">Contact: {hospital?.contact || 'N/A'}</p>
                                </div>
                            )
                        })}
                    </div>
                </Card>
            )}
            <Card title="My Donation History" icon={<CalendarIcon className="h-6 w-6" />}>
                {donationHistory.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {donationHistory.map(record => {
                            const request = requests.find(r => r.requestId === record.requestId);
                            const hospital = hospitals.find(h => h.hospitalId === request?.hospitalId);
                            return (
                                <div key={record.donationId} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="font-semibold">Donated on: {new Date(record.donationDate).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-600">For: {hospital?.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-500">Blood Group: {request?.bloodGroup || 'N/A'}</p>
                                    {record.isVerifiedByAdmin ?
                                        <span className="mt-2 inline-flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                            <CheckCircleIcon className="h-4 w-4 mr-1"/>Verified
                                        </span>
                                        :
                                        <span className="mt-2 inline-flex items-center text-xs font-medium text-gray-700 bg-gray-200 px-2 py-1 rounded-full">
                                            <ClockIcon className="h-4 w-4 mr-1"/>Pending Verification
                                        </span>
                                    }
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 p-4">You have no donation records yet.</p>
                )}
            </Card>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;