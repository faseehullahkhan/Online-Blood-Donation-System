
import React from 'react';

interface CardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, icon, children, headerAction }) => {
  return (
    <div className="bg-white shadow-lg rounded-xl border border-gray-200">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {icon && <span className="text-red-500">{icon}</span>}
          <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        </div>
        {headerAction}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
