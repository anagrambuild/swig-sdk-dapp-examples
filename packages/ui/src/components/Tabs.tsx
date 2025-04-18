import React from 'react';

export interface TabProps {
  children: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface TabsProps {
  children: React.ReactNode;
  className?: string;
}

export const Tab: React.FC<TabProps> = ({
  children,
  isSelected = false,
  onClick,
  disabled = false,
  className,
}) => {
  const selectedStyles = isSelected
    ? 'text-blue-600 border-b-2 border-blue-600'
    : 'text-gray-600 hover:text-gray-800';

  return (
    <button
      className={`px-4 py-2 font-medium transition-colors ${selectedStyles} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export const Tabs: React.FC<TabsProps> = ({ children, className }) => {
  return <div className={`flex space-x-2 ${className}`}>{children}</div>;
};
