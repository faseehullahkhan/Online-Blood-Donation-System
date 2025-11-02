
import React, { useState } from 'react';
import AdminDashboard from './components/AdminDashboard';
import HospitalDashboard from './components/HospitalDashboard';
import DonorDashboard from './components/DonorDashboard';
import { BloodDropIcon } from './components/icons';

type View = 'SELECT' | 'ADMIN' | 'HOSPITAL' | 'DONOR';

const App: React.FC = () => {
  const [view, setView] = useState<View>('SELECT');

  const renderView = () => {
    switch (view) {
      case 'ADMIN':
        return <AdminDashboard />;
      case 'HOSPITAL':
        // In a real app, you'd pass a specific hospital ID
        return <HospitalDashboard hospitalId="HOS001" />;
      case 'DONOR':
        // In a real app, you'd pass a specific donor ID
        return <DonorDashboard donorId="DON001" />;
      default:
        return <SelectionScreen onSelectView={setView} />;
    }
  };

  const Header = () => (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <BloodDropIcon className="h-8 w-8 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-800">
            Community Blood Bank
          </h1>
        </div>
        {view !== 'SELECT' && (
          <button
            onClick={() => setView('SELECT')}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Switch View
          </button>
        )}
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {renderView()}
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>&copy; 2024 Community Blood Donation Management. All rights reserved.</p>
      </footer>
    </div>
  );
};

interface SelectionScreenProps {
  onSelectView: (view: View) => void;
}

const SelectionScreen: React.FC<SelectionScreenProps> = ({ onSelectView }) => {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4">Select Your Role</h2>
      <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
        Choose a dashboard view to interact with the system. In a real application, this would be handled by a login system with role-based access control.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <RoleCard
          title="Admin"
          description="Verify hospitals, approve donations, and oversee system activity."
          onClick={() => onSelectView('ADMIN')}
        />
        <RoleCard
          title="Hospital"
          description="Submit blood requests, view status, and manage hospital information."
          onClick={() => onSelectView('HOSPITAL')}
        />
        <RoleCard
          title="Donor"
          description="Check donation eligibility, view history, and manage your profile."
          onClick={() => onSelectView('DONOR')}
        />
      </div>
    </div>
  );
};

interface RoleCardProps {
  title: string;
  description: string;
  onClick: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ title, description, onClick }) => (
  <div
    className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer border border-gray-200"
    onClick={onClick}
  >
    <h3 className="text-2xl font-semibold text-red-600 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default App;
